# CIDADAOS module (`/api/v1/cidadaos`)

## Estrutura do diretório

```text
cidadaos/
  cidadaos.module.ts
  cidadaos.controller.ts
  cidadaos.service.ts
  cidadaos.service.test.ts
  dto/
    update-cidadao-profile.dto.ts
```

## O que foi realizado

- Endpoint `GET /cidadaos/me` implementado.
- Endpoint `PUT /cidadaos/me` implementado.
- Restrição de acesso para `CIDADAO` no service (`assertCitizen`).
- Leitura e atualização do perfil próprio com dados de `users` + `cidadao_perfis`.

## O que falta realizar

- Endpoints equivalentes para outros perfis (operador/técnicos/admin), se necessário.
- Campos adicionais de perfil (dependente de requisitos funcionais).
- Política de auditoria detalhada para alterações de perfil.

## O que não fazer

- Não expor campos sensíveis sem requisito explícito.
- Não permitir atualização de perfil de outros utilizadores por este módulo.
- Não aceitar payload fora dos campos permitidos no DTO.

## Linkagens para módulos utilizados

- `../auth` (guard JWT e utilizador autenticado)
- `../database` (Prisma)
- `../../../../packages/contracts/src/index.ts` (contratos)
- `../../../../docs/08-api-implementation-playbook.md` (estado/backend)
