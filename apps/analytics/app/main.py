from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
import os

import psycopg
from fastapi import FastAPI, Query, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(
    title="EcoBairro Analytics",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


# ── helpers ──────────────────────────────────────────────────────────────────

def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def get_db() -> psycopg.Connection:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise HTTPException(status_code=503, detail="DATABASE_URL not configured")
    return psycopg.connect(database_url)


def build_payload(
    status_value: str,
    dependencies: list[dict[str, str | None]] | None = None,
) -> dict[str, object]:
    return {
        "service": "analytics",
        "status": status_value,
        "timestamp": utc_timestamp(),
        "dependencies": dependencies or [],
    }


def check_postgres() -> dict[str, str | None]:
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        return {"name": "postgres", "status": "down", "details": "DATABASE_URL is not set"}

    try:
        with psycopg.connect(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        return {"name": "postgres", "status": "up", "details": None}
    except Exception as error:  # pragma: no cover
        return {"name": "postgres", "status": "down", "details": str(error)}


# ── health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health() -> dict[str, object]:
    return build_payload("ok")


@app.get("/ready")
def ready():
    dependency = check_postgres()
    payload = build_payload(
        "ok" if dependency["status"] == "up" else "error",
        [dependency],
    )
    if dependency["status"] != "up":
        return JSONResponse(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, content=payload)
    return payload


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class EcopontoProximoItem(BaseModel):
    id: str
    nome: str
    lat: float
    lng: float
    distancia_metros: float
    estado: str
    nivel_enchimento: Optional[float]
    tipologias: list[str]


class HeatmapPonto(BaseModel):
    latitude: float
    longitude: float
    peso: float


class HeatmapZonaResponse(BaseModel):
    zona_id: str
    pontos: list[HeatmapPonto]


class KpiZonaResponse(BaseModel):
    zona_id: str
    total_reports: int
    reports_resolvidos: int
    tempo_medio_resolucao_horas: Optional[float]
    enchimento_medio_pct: Optional[float]
    periodo_dias: int


class RankingItem(BaseModel):
    posicao: int
    cidadao_id: str
    pontuacao_total: int


# ── Ecopontos próximos ────────────────────────────────────────────────────────

@app.get("/analytics/ecopontos/proximos", response_model=list[EcopontoProximoItem])
def ecopontos_proximos(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    raio_metros: float = Query(default=1000, ge=50, le=10000),
    tipologia: Optional[str] = Query(default=None),
):
    """RF-03: Ecopontos próximos por localização usando PostGIS ST_DWithin."""
    tipologia_filter = ""
    params: list = [longitude, latitude, raio_metros]

    if tipologia:
        tipologia_filter = "AND %s = ANY(e.tipologias)"
        params.append(tipologia)

    query = f"""
        SELECT
            e.id::text,
            e.nome,
            ST_Y(e.localizacao::geometry) AS lat,
            ST_X(e.localizacao::geometry) AS lng,
            ST_Distance(
                e.localizacao::geography,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
            ) AS distancia_metros,
            COALESCE(ea.estado, 'SEM_SENSOR') AS estado,
            ea.nivel_enchimento,
            e.tipologias
        FROM ecopontos e
        LEFT JOIN ecoponto_estado_atual ea ON ea.ecoponto_id = e.id
        WHERE e.ativo = true
          AND e.eliminado_em IS NULL
          AND ST_DWithin(
              e.localizacao::geography,
              ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
              %s
          )
          {tipologia_filter}
        ORDER BY distancia_metros
        LIMIT 30
    """

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params + [longitude, latitude, raio_metros])
            rows = cur.fetchall()

    return [
        EcopontoProximoItem(
            id=row[0],
            nome=row[1],
            lat=float(row[2]),
            lng=float(row[3]),
            distancia_metros=float(row[4]),
            estado=row[5],
            nivel_enchimento=float(row[6]) if row[6] is not None else None,
            tipologias=list(row[7]),
        )
        for row in rows
    ]


# ── Heatmap de reports por zona ───────────────────────────────────────────────

@app.get("/analytics/zonas/{zona_id}/heatmap", response_model=HeatmapZonaResponse)
def heatmap_zona(
    zona_id: str,
    periodo_dias: int = Query(default=30, ge=1, le=365),
):
    """Pontos georreferenciados de reports para heatmap (RF-heatmap)."""
    query = """
        SELECT
            ST_Y(localizacao::geometry) AS lat,
            ST_X(localizacao::geometry) AS lng,
            1.0 AS peso
        FROM reports
        WHERE zona_id = %s::uuid
          AND eliminado_em IS NULL
          AND criado_em >= NOW() - INTERVAL '1 day' * %s
        ORDER BY criado_em DESC
        LIMIT 1000
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [zona_id, periodo_dias])
            rows = cur.fetchall()

    return HeatmapZonaResponse(
        zona_id=zona_id,
        pontos=[HeatmapPonto(latitude=float(r[0]), longitude=float(r[1]), peso=float(r[2])) for r in rows],
    )


# ── KPIs por zona ─────────────────────────────────────────────────────────────

@app.get("/analytics/zonas/{zona_id}/kpis", response_model=KpiZonaResponse)
def kpis_zona(
    zona_id: str,
    periodo_dias: int = Query(default=30, ge=1, le=365),
):
    """KPIs operacionais de uma zona: total reports, resolvidos, tempo médio, enchimento."""
    query = """
        SELECT
            COUNT(*)                                                              AS total_reports,
            COUNT(*) FILTER (WHERE estado = 'RESOLVIDO')                          AS resolvidos,
            AVG(
                EXTRACT(EPOCH FROM (resolvido_em - criado_em)) / 3600.0
            ) FILTER (WHERE estado = 'RESOLVIDO' AND resolvido_em IS NOT NULL)   AS tempo_medio_horas
        FROM reports
        WHERE zona_id = %s::uuid
          AND eliminado_em IS NULL
          AND criado_em >= NOW() - INTERVAL '1 day' * %s
    """
    enchimento_query = """
        SELECT AVG(nivel_enchimento)
        FROM ecoponto_estado_atual ea
        JOIN ecopontos e ON e.id = ea.ecoponto_id
        WHERE e.zona_id = %s::uuid
          AND e.ativo = true
          AND e.eliminado_em IS NULL
          AND nivel_enchimento IS NOT NULL
    """

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [zona_id, periodo_dias])
            row = cur.fetchone()
            cur.execute(enchimento_query, [zona_id])
            enc_row = cur.fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Zona não encontrada ou sem dados")

    return KpiZonaResponse(
        zona_id=zona_id,
        total_reports=int(row[0] or 0),
        reports_resolvidos=int(row[1] or 0),
        tempo_medio_resolucao_horas=float(row[2]) if row[2] is not None else None,
        enchimento_medio_pct=float(enc_row[0]) if enc_row and enc_row[0] is not None else None,
        periodo_dias=periodo_dias,
    )


# ── Ranking de quiz (analytics) ───────────────────────────────────────────────

@app.get("/analytics/ranking", response_model=list[RankingItem])
def ranking(top: int = Query(default=20, ge=1, le=100)):
    """Ranking global de pontuação de quiz."""
    query = """
        SELECT cidadao_id::text, SUM(pontuacao) AS total
        FROM quiz_sessoes
        WHERE concluida = true
        GROUP BY cidadao_id
        ORDER BY total DESC
        LIMIT %s
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(query, [top])
            rows = cur.fetchall()

    return [
        RankingItem(
            posicao=i + 1,
            cidadao_id=row[0],
            pontuacao_total=int(row[1] or 0),
        )
        for i, row in enumerate(rows)
    ]
