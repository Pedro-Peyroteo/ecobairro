## 1.1 Endpoints REST — Zonas

**Convenções de acesso:** Zonas são entidades de gestão operacional. Cidadãos acedem apenas à lista simplificada (para saber a sua zona). Operadores e técnicos gerem zonas. Admins têm acesso total.
[[Consulta (todos os perfis autenticados)]]
[[Gestão (operadores e superiores)]]


## 1.2 Schema PostgreSQL — `zonas`
[[1.2 Schema PostgreSQL — zonas]]

## 2.1 Endpoints REST — Ecopontos

Ecopontos têm dois perfis de acesso distintos: o cidadão consulta o mapa e reporta; o operador e técnico gerem o catálogo e o estado.
[[Consulta pública e cidadão]]
[[Gestão do catálogo]]
[[Ingestão IoT (RF-04)]]

## 2.2 Schema PostgreSQL — Ecopontos
[[2.2 Schema PostgreSQL — Ecopontos]]


## 3.1 Endpoints REST — Badges
Badges têm dois contextos: o catálogo público (quais badges existem) e as badges do cidadão (o que já ganhou).
[[Catálogo (consulta)]]
[[Badges do cidadão]]
[[Arquitetura de Dados e API REST/Ecopontos, Zonas, Badges e Quiz/quiz/Gestão (admin)|Gestão (admin)]]

## 3.2 Schema PostgreSQL — Badges
[[3.2 Schema PostgreSQL — Badges]]

## 4.1 Endpoints REST — Quiz
O quiz tem três contextos distintos: a criação/gestão pelo admin, o consumo pelo cidadão (jogar), e as queries analíticas (ranking, KPIs).
[[Consulta e jogo (cidadão)]]
[[Ranking (analytics)]]
[[Arquitetura de Dados e API REST/Ecopontos, Zonas, Badges e Quiz/quiz/Gestão (admin)|Gestão (admin)]]
## 4.2 Schema PostgreSQL — Quiz
[[4.2 Schema PostgreSQL — Quiz]]


## 5 — Relacionamentos consolidados — todas as entidades

```
zonas (1)
  ├── (N) ecopontos              FK: ecopontos.zona_id
  │
  ├── (N) reports                FK: reports.zona_id
  │                              (despacho RF-10, tabela a definir no domínio Reports)
  │
  ├── (N) cidadaos               FK: cidadaos.zona_residencia_id
  │
  └── (N) cidadao_gamificacao    FK: cidadao_gamificacao.zona_id
                                 (ranking anónimo por zona RF-19)

ecopontos (1)
  ├── (1) ecoponto_estado_atual  FK: ecoponto_estado_atual.ecoponto_id  (1:1)
  │
  ├── (N) sensor_leituras        FK: sensor_leituras.ecoponto_id
  │                              (tabela particionada por mês)
  │
  └── (N) cidadaos               via cidadao_ecopontos_favoritos
                                 (cidadao_id, ecoponto_id) — já definida

badges (1)
  └── (N) cidadaos               via cidadao_badges
                                 (cidadao_id, badge_id) — já definida

quizzes (1)
  ├── (N) quiz_perguntas         FK: quiz_perguntas.quiz_id
  │    └── (N) quiz_opcoes       FK: quiz_opcoes.pergunta_id
  │
  └── (N) cidadaos               via quiz_sessoes
                                 (cidadao_id, quiz_id) — já definida
```

---

## 6 — Separação de fluxos — resumo executivo completo

```
ESCRITA — NestJS → PG primário → Redis invalidado
────────────────────────────────────────────────────────
POST /zonas                 → PG write → NOTIFY → Redis DEL zona + lista
PUT  /ecopontos/:id         → PG write → NOTIFY → Redis DEL ecoponto + zona mapa
POST /iot/telemetria        → 202 imediato → BullMQ ingest job
                              → INSERT sensor_leituras
                              → UPSERT ecoponto_estado_atual
                              → NOTIFY → Redis DEL ecoponto + mapa zona
POST /admin/quiz            → PG write (transacção: quiz + perguntas + opcoes)
                              → NOTIFY → Redis DEL quiz:atual:{tipo}
POST /quiz/:id/iniciar      → verifica quota → Redis SET quiz:sessao:{id} TTL 30min
POST /quiz/sessao/:id/resp. → Redis DEL sessao → PG write quiz_sessoes
                              → BullMQ badge.evaluate

LEITURA — NestJS → Redis hit | PG réplica miss
────────────────────────────────────────────────────────
GET /zonas/:id              → Redis zona:{id}      ou PG réplica
GET /ecopontos/:id          → Redis ecoponto:{id}  ou PG join estado_atual
GET /badges                 → Redis badges:catalogo ou PG réplica
GET /quiz/disponivel        → Redis quiz:atual:{tipo} ou PG réplica

ANALYTICS — FastAPI → Redis hit | PG réplica miss
────────────────────────────────────────────────────────
GET /ecopontos              → Redis ecopontos:mapa:zona:{id} ou PG ST_Within
GET /ecopontos/proximos     → PG réplica ST_DWithin (sem cache — dinâmico por GPS)
GET /quiz/ranking/zona/:id  → Redis ranking:zona:{id}:semanal ou PG agregação
GET /zonas/:id/kpis         → Redis TTL 15min ou PG réplica agregação
```