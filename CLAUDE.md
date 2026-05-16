# EcoBairro — CLAUDE.md

## Estrutura do Monorepo

```
apps/
  api/       — Backend NestJS (Node.js + Prisma + PostgreSQL + Redis)
  web/       — Frontend TanStack Router + React + Vite
  analytics/ — Serviço de analytics
packages/
  contracts/ — Tipos e interfaces partilhados (TypeScript)
  config/    — Utilitários de variáveis de ambiente
infra/       — Docker Compose, nginx, scripts
docs/        — Documentação de domínio e playbooks
team-skills/ — Skills da equipa para Claude Code
```

## Comandos Principais

Todos os comandos correm a partir da **raiz do repositório**:

```bash
pnpm install --no-frozen-lockfile   # instalar dependências
pnpm compose:up                     # subir todos os serviços
pnpm --dir apps/api exec prisma migrate deploy  # aplicar migrations
pnpm lint                           # lint em todos os pacotes
pnpm typecheck                      # typecheck em todos os pacotes
```

## Backend (`apps/api`)

### Convenções obrigatórias
- Controllers contêm apenas lógica HTTP (guards, decorators, chamadas ao service)
- Business logic fica nos services; Prisma e Redis só são acedidos nos services
- DTOs usam `class-validator` e devem estar alinhados com `packages/contracts/src/index.ts`
- Rotas autenticadas usam `@UseGuards(JwtAuthGuard)` + `@CurrentUser()`
- Verificações de role ficam nos services (nunca nos controllers)
- Soft-delete usa o campo `eliminadoEm` — todas as queries devem filtrar `eliminadoEm: null`
- Global `ValidationPipe` com `whitelist: true` e `forbidNonWhitelisted: true` está activo

### Estrutura de módulos
Cada módulo segue o padrão: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.service.test.ts`, `dto/`

### Módulos implementados
| Módulo | Endpoints |
|--------|-----------|
| `auth` | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| `cidadaos` | `GET /cidadaos/me`, `PUT /cidadaos/me` |
| `reports` | `POST /reports`, `GET /reports/me`, `GET /reports`, `PATCH /reports/:id/status` |
| `health` | `GET /health`, `GET /ready` |

### Auth
- JWT em header `Authorization: Bearer <token>`
- Refresh tokens armazenados no Redis com hash SHA-256
- Sessão: `user:session:{userId}` (1 sessão activa por utilizador)
- bcrypt com 12 rounds por omissão (configurável via `BCRYPT_ROUNDS`)

### CORS
Configurado via variável de ambiente `CORS_ORIGIN` (default: `http://localhost:5173`).
Nunca usar `cors: true` em produção.

## Frontend (`apps/web`)

- Nunca editar `src/routeTree.gen.ts` manualmente
- Rotas usam `createFileRoute(...)` com prefixo `_layoutmain` para páginas com layout
- Alias `@/` para imports internos
- `cn()` para composição condicional de classes
- Forms: `react-hook-form` + `zod`
- Não ler `import.meta.env` directamente — usar acesso centralizado

## Contratos

Ao alterar shape de request/response da API, actualizar **sempre** `packages/contracts/src/index.ts`.

## Skills disponíveis

Skills da equipa em `team-skills/`. Referenciar com o caminho relativo ao invocar.
Principais: `code-reviewer.md`, `security-auditor.md`, `nest-module-scaffold.md`, `api-designer.md`

## Notas de Segurança (auditoria 2026-04-25)

### Corrigido no módulo `cidadaos`
- **DTO `phone`**: adicionados `@MinLength(7)`, `@MaxLength(30)`, `@Matches` para formato numérico
- **DTO `nome_completo`**: adicionado `@MaxLength(200)`
- **CORS**: alterado de `cors: true` (wildcard) para origem controlada via `CORS_ORIGIN` env var
- **Refactor `CidadaosService`**: `getMe` e `updateMe` partilham `fetchProfile()` privado — elimina dupla chamada a `assertCitizen`

### Pendente / a vigiar
- `notificacao_prefs` e `dashboard_widgets` são JSON sem validação estrutural — monitorizar crescimento em produção
- `register.dto.ts` (módulo `auth`) tem o mesmo gap de validação no campo `phone`
- CORS suporta apenas uma origem; suporte a múltiplas origens requer separação por vírgula
- Sem rate limiting nos endpoints de escrita
