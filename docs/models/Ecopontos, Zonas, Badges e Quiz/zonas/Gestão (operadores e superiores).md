
|#|Método|Rota|Descrição|Auth|Fluxo|
|---|---|---|---|---|---|
|Z6|`POST`|`/zonas`|Criar nova zona|TECNICO_AUTARQUIA, ADMIN|NestJS → PG write → NOTIFY → Redis invalidar|
|Z7|`PUT`|`/zonas/:id`|Actualizar dados e configuração da zona|TECNICO_AUTARQUIA, ADMIN|NestJS → PG write → NOTIFY → Redis del `zona:{id}` + `zonas:ativas:lista`|
|Z8|`PATCH`|`/zonas/:id/geometria`|Actualizar só a geometria (operação pesada — separada)|ADMIN|NestJS → PG write → NOTIFY → del tudo relacionado com zona|
|Z9|`DELETE`|`/zonas/:id`|Soft delete (só se não tiver ecopontos activos)|ADMIN|NestJS → verifica dependências → PG write ativa=false|
|Z10|`PUT`|`/zonas/:id/alertas`|Actualizar configuração de alertas e limiar anti-spam|TECNICO_AUTARQUIA, ADMIN|NestJS → PG write → NOTIFY|
|Z11|`GET`|`/zonas/:id/kpis`|KPIs da zona: enchimento médio, reports, tempo resolução (RF-23)|
**Corpo de Z6 (criar zona):**

```
{
  nome: string (required),
  descricao: string (optional),
  geometria: GeoJSON Feature com geometry MULTIPOLYGON (required),
  tipo: "OPERACIONAL" | "RESIDENCIAL" | "PRIORITARIA_IOT" | "ADMINISTRATIVA",
  entidade_responsavel: string (optional),
  limite_antispam_reports: integer (default 2),
  janela_antispam_horas: integer (default 24),
  alertas_config: {
    limiar_cheio: integer (0-100, default 85),
    canal_alerta: "sms" | "push" | "email",
    contactos_sms: string[] (optional, RF-27)
  }
}
```

**Resposta de Z5 (zona por ponto):**

```
{
  zona_id: uuid | null,
  nome: string | null,
  tipo: string | null,
  limite_antispam_reports: integer,
  janela_antispam_horas: integer
}
```

Retorna `null` quando o ponto não pertence a nenhuma zona — usado pelo frontend para informar o cidadão antes de submeter um report.