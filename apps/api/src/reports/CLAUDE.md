# REPORTS module (`/api/v1/reports`)

## Estrutura do diretório

```text
reports/
  reports.module.ts
  reports.controller.ts
  reports.service.ts
  reports.service.test.ts
  dto/
    create-report.dto.ts
    list-reports.dto.ts
    update-report-status.dto.ts
```

## O que foi realizado

- Endpoint `POST /reports` implementado.
- Endpoint `GET /reports/me` implementado.
- Endpoint `GET /reports` implementado.
- Endpoint `PATCH /reports/:id/status` implementado.
- RBAC aplicado:
  - `CIDADAO`: cria e lista próprios.
  - `OPERADOR_VEOLIA`/`ADMIN`: lista global e atualiza status.
  - `TECNICO_AUTARQUIA`/`TECNICO_CCDR`: lista global.
- Integração com tabela `reports` no PostgreSQL.
- Testes de service para permissões, filtros e mudança de status.

## O que falta realizar

- Timeline/histórico de status (`ReportTimeline`) se entrar na próxima fase.
- Regras de deduplicação de reportes.
- Upload/storage real de imagem (hoje guarda URL/string no campo `imagem`).
- Métricas operacionais e auditoria por alteração de status.

## O que não fazer

- Não mover checks de role para controller apenas; manter no service.
- Não enviar strings de paginação para Prisma sem normalização.
- Não alterar enum/status sem atualizar Prisma + contracts + DTO + testes.
- Não permitir `PATCH /reports/:id/status` para perfis fora de `OPERADOR_VEOLIA` e `ADMIN`.

## Linkagens para módulos utilizados

- `../auth` (guard JWT e utilizador autenticado)
- `../database` (Prisma)
- `../../prisma/schema.prisma` (modelo `Report`)
- `../../../../packages/contracts/src/index.ts` (tipos de reports)
- `../../../../docs/08-api-implementation-playbook.md` (estado/guia API)
