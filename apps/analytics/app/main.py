from __future__ import annotations

from datetime import datetime, timezone
import os

import psycopg
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse

app = FastAPI(
    title="EcoBairro Analytics",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


def utc_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


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
        return {
            "name": "postgres",
            "status": "down",
            "details": "DATABASE_URL is not set",
        }

    try:
        with psycopg.connect(database_url) as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()

        return {
            "name": "postgres",
            "status": "up",
            "details": None,
        }
    except Exception as error:  # pragma: no cover - bootstrap health surface only
        return {
            "name": "postgres",
            "status": "down",
            "details": str(error),
        }


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
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=payload,
        )

    return payload

