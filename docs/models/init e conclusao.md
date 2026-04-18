# Cidadão/User:
[[Arquitetura de Dados e API REST/Cidadão/Init|Init]]

# Ecopontos, Zonas, Badges e Quiz
[[Arquitetura de Dados e API REST/Ecopontos, Zonas, Badges e Quiz/Init|Init]]

# IoT e Dispositivos
[[Arquitetura de Dados e API REST/IoT e Dispositivos/Init|Init]]

# Reports, Recolhas, Comunicação e Operacional
[[Arquitetura de Dados e API REST/Reports, Recolhas, Comunicação e Operacional/init|init]]

#  Mapa completo de relacionamentos

```
reports (N:1) cidadaos            FK: reports.cidadao_id
reports (N:1) ecopontos           FK: reports.ecoponto_id (nullable)
reports (N:1) zonas               FK: reports.zona_id
reports (N:1) cidadaos            FK: reports.atribuido_a (nullable)
reports (1:N) reports_timeline    FK: timeline.report_id
reports (N:M) cidadaos            via reports_subscricoes (report_id, cidadao_id)
reports (N:1) reports             FK: reports.report_pai_id (nullable — duplicados)

pedidos_recolha (N:1) cidadaos    FK: pedidos_recolha.cidadao_id
pedidos_recolha (N:1) zonas       FK: pedidos_recolha.zona_id
pedidos_recolha (N:1) cidadaos    FK: pedidos_recolha.operador_id (nullable)

partilhas_materiais (N:1) cidadaos  FK: partilhas_materiais.cidadao_id
partilhas_materiais (N:1) zonas     FK: partilhas_materiais.zona_id
partilhas_materiais (1:N) partilhas_mensagens  FK: mensagens.partilha_id

notificacoes (N:1) cidadaos       FK: notificacoes.cidadao_id

mensagens_institucionais (N:1) cidadaos  FK: criado_por
mensagens_institucionais referencia (N) zonas via zonas_destino[]

campanhas_beneficio (N:1) zonas   FK: campanhas_beneficio.zona_id
campanhas_beneficio (N:1) cidadaos FK: criado_por

rotas_execucao (N:1) zonas        FK: rotas_execucao.zona_id
rotas_execucao (N:1) cidadaos     FK: rotas_execucao.operador_id

audit_log (N:1) cidadaos          FK: audit_log.actor_id (nullable)
```

# Separação de fluxos — resumo completo do sistema

```
ESCRITA — NestJS → PG primário → NOTIFY/BullMQ
────────────────────────────────────────────────────────────────────
R1  POST /reports              → antispam Redis → PG write reports
                                 + timeline → BullMQ triagem + foto
R10 PATCH /reports/estado      → PG write + timeline → NOTIFY
                                 → BullMQ notif cidadão RF-11/16
M1  POST /recolhas/monos       → PG write → BullMQ → operador
M6  PATCH /recolhas/agendar    → PG write → NOTIFY → push cidadão
PM2 POST /partilhas            → valida disclaimer → PG write
PM7 POST /partilhas/mensagens  → PG write → BullMQ notif destinatário
NF3 PATCH /notificacoes/lida   → PG write → Redis DEL unread count
MI6 PATCH /mensagens/publicar  → PG write → BullMQ fan-out notif zona
CB7 PATCH /campanhas/ativar    → PG write → BullMQ notif zona
OP5 POST /rotas                → PG write rotas_execucao
OP6 PATCH /rotas/concluir      → PG write + UPSERT ecoponto_estado_atual

LEITURA — NestJS → Redis → PG réplica
────────────────────────────────────────────────────────────────────
NF2 GET /notificacoes/count    → Redis notif:unread:{id} (5min)
MI1 GET /mensagens-inst.       → Redis mensagens:zona:{id} (10min)
R7  GET /reports/quota         → Redis antispam keys

ANALYTICS — FastAPI → Redis → PG réplica
────────────────────────────────────────────────────────────────────
R2  GET /reports/proximos      → PG réplica ST_DWithin
R8  GET /reports/duplicados    → PG réplica ST_DWithin + categoria
R12 GET /reports/kpis          → Redis 15min ou PG agregação
CB3 GET /campanhas/elegibilidade → PG réplica (sem PII RF-21)

AUDIT — NestJS middleware → PG primário (append-only)
────────────────────────────────────────────────────────────────────
Todas as operações sensíveis → INSERT audit_log (assíncrono BullMQ
  para não atrasar response)
```