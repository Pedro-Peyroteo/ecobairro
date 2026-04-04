# CLAUDE.md — EcoBairro Digital

> Ficheiro de memória persistente do projeto. Lê este documento no início de cada sessão antes de executar qualquer tarefa.
> Última atualização: 2026-04-04 — Sessão: implementação do módulo Redis + triggers PostgreSQL NOTIFY activos

---

## Visão Geral do Projeto

**EcoBairro Digital** é uma plataforma de gestão urbana de resíduos e ecopontos para municípios portugueses.

Permite a cidadãos, operadores (Veolia), técnicos de autarquia e técnicos CCDR interagirem com ecopontos, submeterem reports de problemas, pedirem recolhas de monos, partilharem materiais, e participarem em gamificação e quizzes educativos.

### Stack Tecnológica

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Frontend     | React + TypeScript + Vite           |
| Backend API  | NestJS + TypeScript                 |
| Analytics    | FastAPI (Python)                    |
| Base de dados| PostgreSQL 16 + PostGIS 3.4         |
| Cache/Queue  | Redis 7                             |
| ORM          | Prisma 6.x                          |
| Proxy        | Nginx 1.27                          |
| Runtime local| Docker Compose (pnpm workspaces)    |
| Package manager | pnpm 10.x (workspace monorepo)   |

---

## Estrutura do Repositório

```
ecobairro/
├── apps/
│   ├── api/                  # NestJS backend
│   │   ├── prisma/
│   │   │   └── schema.prisma # Schema completo da BD
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── health.controller.ts
│   │       ├── health.service.ts
│   │       └── redis/
│   │           ├── cache-keys.ts       # Chaves e TTLs centralizados
│   │           ├── redis.service.ts    # Cliente ioredis (lifecycle)
│   │           ├── cache.service.ts    # Operações tipadas de cache
│   │           ├── pg-notify.service.ts# LISTEN/NOTIFY → invalidação reactiva
│   │           └── redis.module.ts     # Módulo global exporta CacheService
│   ├── web/                  # React + Vite frontend
│   └── analytics/            # FastAPI service
├── packages/
│   ├── contracts/            # Tipos e contratos partilhados
│   ├── config/               # Configurações partilhadas
│   ├── tsconfig/             # tsconfig base
│   └── eslint-config/        # ESLint config partilhada
├── infra/
│   ├── compose/
│   │   └── docker-compose.yml
│   ├── nginx/
│   │   └── nginx.conf
│   ├── postgres/
│   │   └── init/             # Scripts SQL de inicialização
│   └── scripts/
│       └── start-js-service.sh  # Script de arranque com lock management
├── docs/                     # Documentação de arquitetura
├── CONTRIBUTING.md
├── CLAUDE.md                 # Este ficheiro
└── package.json              # Root workspace scripts
```

---

## Estado Atual

### Implementado ✅

- **Infra base completa**: Docker Compose com todos os serviços (web, api, analytics, postgres, redis, nginx)
- **PostgreSQL exposto em 5433** (5432 ocupado pelo Postgres local do Windows)
- **Prisma schema completo**: todas as tabelas e enums em `apps/api/prisma/schema.prisma`
- **Prisma aplicado à BD**: `prisma db push` executado — todas as tabelas criadas no PostgreSQL
- **Lock management corrigido**: `infra/scripts/start-js-service.sh` com deteção de locks stale/orphaned
- **Dependências Prisma**: `prisma@^6.6.0` e `@prisma/client@^6.6.0` em `apps/api/package.json`
- **Build scripts aprovados**: `pnpm.onlyBuiltDependencies` configurado no `package.json` raiz
- **Scripts de BD**: `db:push`, `db:migrate`, `db:generate`, `db:studio`
- **NestJS health endpoints**: `/health` e `/ready`
- **FastAPI health endpoints**: `/health` e `/ready`
- **Módulo Redis completo** em `apps/api/src/redis/`:
  - `cache-keys.ts` — todas as chaves e TTLs centralizados (fonte: docs/models)
  - `redis.service.ts` — cliente ioredis com lifecycle NestJS
  - `cache.service.ts` — get/set/del/incr/expire/expireOnlyIfPersistent
  - `pg-notify.service.ts` — escuta `user_updated`, `cidadao_updated`, `operador_updated` e invalida cache reactivamente
  - `redis.module.ts` — módulo `@Global()`, exporta `CacheService`
  - `AppModule` actualizado para importar `RedisModule`
- **Triggers PostgreSQL NOTIFY activos** em `apps/api/prisma/sql/notify_triggers.sql`:
  - `trg_user_updated` → `users` → invalida `user:session` e `user:rbac`
  - `trg_cidadao_updated` → `cidadao_perfis` → invalida `cidadao:profile`, `notif_prefs`, `dashboard`, `favoritos`
  - `trg_operador_updated` → `operador_perfis` → invalida `operador:profile`

### Não Iniciado ❌

- Business APIs (reports, ecopontos, recolhas, partilhas, quizzes, gamificação)
- Autenticação / JWT (usa `CacheService` para sessões, RBAC e tokens 2FA)
- Workers assíncronos
- Testes (unit, integration, e2e)
- CI/CD pipeline
- Deploy em produção

---

## Decisões de Arquitetura

### Módulo Redis — arquitectura de cache
- **RedisService**: cliente ioredis singleton, gere connect/disconnect via `OnModuleInit`/`OnModuleDestroy`
- **CacheService**: único ponto de acesso ao cache — exportado globalmente; callers usam `CacheKey.*` e `CacheTtl.*`
- **PgNotifyService**: ligação pg dedicada em modo `LISTEN`; invalida chaves imediatamente quando o PostgreSQL notifica uma escrita — sem polling, sem TTL artificialmente curto
- **`expireOnlyIfPersistent`**: padrão para o antispam — o TTL de 24h só é definido no 1.º report, os INCR seguintes não renovam a janela
- **`@Global()`**: `RedisModule` é global; qualquer módulo futuro injeta `CacheService` sem importar `RedisModule`

### Prisma em vez de raw SQL / TypeORM
- **Decisão**: usar Prisma como ORM no `api`
- **Porquê**: type-safety end-to-end, migrations versionadas, Prisma Studio para debug rápido, suporte a PostGIS via `Unsupported()` para campos geográficos

### `prisma db push` para dev, `migrate dev` para produção
- Em desenvolvimento usar `db:push` (sem ficheiros de migração, mais rápido para iterar)
- Quando o schema estabilizar, migrar para `prisma migrate dev` para ter histórico de migrações

### Colunas geográficas com `Unsupported()`
- PostGIS `geography(Point, 4326)`, `geography(MultiPolygon, 4326)`, `geography(LineString, 4326)` são declaradas como `Unsupported()` no Prisma
- Queries espaciais têm de ser feitas via `$queryRaw`

### Arrays como `String[]`
- Campos UUID[] (ex: `zonasResponsabilidade`, `ecopontosPlaneados`) estão como `String[]` no Prisma
- Devem ser castados para `uuid[]` em migrações SQL raw para validação mais estrita (ver ASSUMPTIONS no schema)

### Tabelas particionadas definidas como tabelas normais
- `sensor_leituras`, `notificacoes`, `audit_log` são documentadas como `PARTITIONED BY RANGE`
- Prisma não suporta particionamento nativo — particionamento deve ser aplicado via SQL raw na migração inicial

### Lock de instalação no Docker Compose
- Múltiplos containers partilham o volume `root-node-modules`
- O `start-js-service.sh` usa `mkdir` como lock atómico para serializar `pnpm install`
- **Problema conhecido**: se um container morrer com SIGKILL durante o install, o lock fica stale
- **Solução implementada**: deteção de locks sem timestamp (orphaned) e locks com timestamp > 300s (stale)

---

## Convenções e Padrões

### Nomes de tabelas
- snake_case em português: `cidadao_perfis`, `ecopontos`, `sensor_leituras`, etc.
- Definidos com `@@map()` no Prisma

### Nomes de campos
- snake_case no PostgreSQL via `@map()` no Prisma
- camelCase no código TypeScript (Prisma Client)

### Branch naming
- `feat/` → novas features
- `fix/` → bug fixes
- `docs/` → documentação
- `refactor/` → reestruturação interna
- `chore/` → manutenção e tooling
- `infra/` → infraestrutura

### Commits
- Formato: `tipo(scope): descrição curta`
- Ex: `feat(api): add report submission endpoint`

### Merges
- Squash merge para `main`
- Mínimo 1 aprovação

---

## Comandos Essenciais

### Desenvolvimento local

```bash
# Instalar dependências (sempre a partir da raiz)
pnpm install --no-frozen-lockfile

# Subir o stack completo
pnpm compose:up

# Ver estado dos containers
pnpm compose:ps

# Logs por serviço
pnpm compose:logs:api
pnpm compose:logs:web
pnpm compose:logs:analytics

# Parar tudo
pnpm compose:down
```

### Base de dados (Prisma)

```bash
# Aplicar schema à BD (dev — sem migration files)
docker compose -f infra/compose/docker-compose.yml exec api pnpm db:push

# Criar migration versionada (quando schema estabilizar)
docker compose -f infra/compose/docker-compose.yml exec api pnpm db:migrate

# Abrir Prisma Studio (GUI para ver dados)
docker compose -f infra/compose/docker-compose.yml exec api pnpm db:studio
# → abre em http://localhost:5555

# Regenerar Prisma Client após alterações ao schema
docker compose -f infra/compose/docker-compose.yml exec api pnpm db:generate
```

### Fix de emergência — lock stale na instalação

```bash
# Se o web ou api ficarem presos em "Waiting for pnpm workspace dependency lock..."
docker compose -f infra/compose/docker-compose.yml down
docker run --rm -v ecobairro_root-node-modules:/nm alpine rm -rf /nm/.install-lock
docker compose -f infra/compose/docker-compose.yml up --build -d
```

---

## Variáveis de Ambiente

| Variável          | Default         | Utilização                        |
|-------------------|-----------------|-----------------------------------|
| `POSTGRES_DB`     | `ecobairro`     | Nome da base de dados             |
| `POSTGRES_USER`   | `ecobairro`     | Utilizador PostgreSQL             |
| `POSTGRES_PASSWORD` | `ecobairro`   | Password PostgreSQL               |
| `DATABASE_URL`    | gerada pelo compose | URL de ligação Prisma/SQLAlchemy |
| `REDIS_URL`       | `redis://redis:6379/0` | Ligação Redis              |
| `NGINX_PORT`      | `8080`          | Porta exposta pelo Nginx          |
| `PORT`            | `3000`          | Porta interna do API NestJS       |

Copia `.env.example` para `.env` se precisares de overrides locais.

---

## Verificação de Saúde do Stack

Depois de `pnpm compose:up`, verifica:

| Endpoint                                 | Expectativa              |
|------------------------------------------|--------------------------|
| `http://localhost:8080/`                 | Frontend React carrega   |
| `http://localhost:8080/api/health`       | `{ status: "ok" }`       |
| `http://localhost:8080/api/ready`        | Postgres + Redis OK      |
| `http://localhost:8080/analytics/health` | `{ status: "ok" }`       |
| `http://localhost:8080/analytics/ready`  | Postgres OK              |

---

## Problemas Conhecidos / Workarounds Ativos

### 1. Lock stale no pnpm install (RESOLVIDO)
- **Problema**: containers que morrem com SIGKILL deixavam o diretório `.install-lock` no volume partilhado
- **Fix**: `start-js-service.sh` agora deteta locks sem timestamp (orphaned) e locks mais velhos que 300s
- **Workaround manual**: ver secção "Fix de emergência" acima

### 2. Vite bloqueia hosts não autorizados
- **Sintoma**: `Blocked request. This host ("web_upstream") is not allowed.`
- **Causa**: Nginx encaminha requests com `Host: web_upstream`; Vite recusa hosts não listados em `server.allowedHosts`
- **Estado**: não resolvido — para ver a app em dev, aceder via `http://localhost:5173` diretamente (sem Nginx) ou adicionar `web_upstream` ao `vite.config.ts`

### 3. Prisma não instalado — tabelas não aplicadas à BD
- **Estado**: Prisma adicionado ao `package.json` mas ainda não executado `db:push`
- **Próximo passo obrigatório**: correr `pnpm install` + `pnpm db:push` dentro do container

### 4. PostgreSQL exposto em 5433 (não 5432)
- O Windows tem um PostgreSQL local na porta 5432; o container Docker usa `5433:5432`
- pgAdmin / Prisma Studio no host devem ligar a `localhost:5433`

### 5. Re-aplicar triggers após reset da BD
- Se a BD for recriada (`docker compose down -v`), os triggers perdem-se
- Re-aplicar com:
  ```cmd
  docker compose -f infra/compose/docker-compose.yml exec -T postgres psql -U ecobairro -d ecobairro < apps/api/prisma/sql/notify_triggers.sql
  ```

---

## Próximos Passos Recomendados

Por ordem de prioridade:

1. **Corrigir Vite allowedHosts** — adicionar `allowedHosts: ['web_upstream', 'localhost']` ao `vite.config.ts`
3. **Implementar autenticação** — JWT + módulo de auth no NestJS (usa `CacheService` para sessões, RBAC, tokens 2FA)
4. **Primeiras business APIs** — começar por ecopontos (CRUD) e reports
5. **Testes** — configurar Jest para o api e Vitest para o web
6. **CI/CD** — GitHub Actions com lint, typecheck e testes

---

## Modelos de Dados (Resumo)

O schema Prisma em `apps/api/prisma/schema.prisma` implementa:

| Grupo              | Tabelas                                                                 |
|--------------------|-------------------------------------------------------------------------|
| Identidade         | `users`, `cidadao_perfis`, `operador_perfis`                            |
| RGPD               | `cidadao_consentimentos`                                                |
| Gamificação        | `cidadao_gamificacao`, `badges`, `cidadao_badges`                       |
| Zonas              | `zonas`, `zonas_historico`                                              |
| Ecopontos          | `ecopontos`, `ecoponto_estado_atual`                                    |
| IoT                | `iot_dispositivos`, `iot_dispositivos_historico`, `sensor_leituras`, `iot_alertas`, `iot_contactos_sms` |
| Quizzes            | `quizzes`, `quiz_perguntas`, `quiz_opcoes`, `quiz_sessoes`              |
| Reports            | `reports`, `reports_timeline`, `reports_subscricoes`                    |
| Recolhas           | `pedidos_recolha`                                                       |
| Partilha           | `partilhas_materiais`, `partilhas_mensagens`                            |
| Notificações       | `notificacoes`, `mensagens_institucionais`                              |
| Campanhas          | `campanhas_beneficio`                                                   |
| Rotas              | `rotas_execucao`                                                        |
| Auditoria          | `audit_log`                                                             |
| Favoritos          | `cidadao_ecopontos_favoritos`                                           |

Roles definidas: `CIDADAO`, `OPERADOR_VEOLIA`, `TECNICO_AUTARQUIA`, `TECNICO_CCDR`, `ADMIN`
