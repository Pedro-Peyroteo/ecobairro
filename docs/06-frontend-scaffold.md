# Guia Do Frontend Scaffold

## Objetivo

Este documento explica o frontend scaffold que existe atualmente em `apps/web`.

O objetivo deste scaffold nao e entregar UI de funcionalidade. O seu papel e dar a equipa:

- um runtime frontend estavel
- uma estrutura de rotas clara
- primitivos de layout e UI partilhados
- uma camada minima de infraestrutura da app
- um lugar previsivel para codigo futuro de funcionalidade

Em resumo: esta e a base de handoff que permite as equipas de funcionalidade comecarem a construir sem terem primeiro de debater arquitetura frontend.

## O Que Escolhemos

### Runtime

O frontend usa agora **TanStack Start** em `apps/web`.

Porquê:

- da-nos um runtime React moderno com suporte de primeira classe para TanStack Router
- mantem routing, document/head handling e bootstrap da app no mesmo sitio
- deixa a porta aberta para SSR e server functions mais tarde, se a equipa precisar
- funciona bem com o setup atual do monorepo e com o workflow baseado em Vite

### Modo de rendering

Escolhemos **SPA mode primeiro**.

Porquê:

- a fase atual do projeto e de scaffolding, nao de SEO ou paginas de produto renderizadas no servidor
- SPA mode e mais simples de compreender enquanto a API continua a ser a principal superficie backend
- reduz a complexidade de runtime que os colegas precisam de perceber no primeiro dia
- mantem aberta uma via para SSR no futuro se os requisitos mudarem

Esta escolha esta em [apps/web/vite.config.ts](../apps/web/vite.config.ts).

### Routing

Escolhemos **TanStack Router com file-based routing**.

Porquê:

- as rotas sao faceis de encontrar porque a estrutura das pastas espelha a estrutura dos URLs
- os colegas podem adicionar paginas criando ficheiros em `src/routes`
- a ownership das rotas fica visivel num relance
- o TanStack gera a route tree por nos, reduzindo a necessidade de wiring manual

E por isso que `src/routes` e tratado como a unica superficie de autoria de rotas.

### Camada de dados

Adicionamos **TanStack Query**, mas apenas como plumbing partilhado.

Porquê:

- as equipas de funcionalidade vao quase de certeza precisar de cache, estado assincrono e gestao do ciclo de vida dos pedidos
- e melhor configurar agora um Query client app-wide do que deixar cada funcionalidade criar o seu proprio padrao
- queriamos a infraestrutura pronta sem definir cedo demais hooks de dados especificos de funcionalidade

Importante:

- **nao** adicionamos query hooks de dominio
- **nao** adicionamos um SDK completo da API
- **nao** adicionamos fluxos de autenticacao

### Styling

Escolhemos **Tailwind v4** mais uma pequena **camada de tokens com variaveis CSS**.

Porquê:

- o Tailwind da velocidade as equipas quando constroem UI de funcionalidade
- as variaveis CSS mantem centralizadas as decisoes globais sobre cores e superficies
- esta combinacao e suficientemente leve para scaffolding sem comprometer a equipa com um component system pesado demasiado cedo

### Limite da app

Mantivemos **uma unica app frontend** em `apps/web` com dois grupos de rotas:

- `/app` para trabalho citizen-facing
- `/admin` para trabalho operator/admin-facing

Porquê:

- o repositorio ja tinha uma unica app `web` e o respetivo wiring em Docker/Nginx
- uma app e suficiente para a fase atual
- os grupos de rotas dao-nos separacao sem criar apps extra, configuracao duplicada ou UI partilhada duplicada

## Porque Nao Construimos UI De Funcionalidade

Este scaffold para intencionalmente em placeholders.

Porquê:

- a ownership das funcionalidades pertence a outros colegas
- scaffolding deve fornecer estrutura, nao tomar decisoes de produto por conta das equipas de funcionalidade
- uma rota placeholder e mais facil de substituir do que uma "feature de exemplo" meio acabada que acaba por se tornar arquitetura acidental

E por isso que as rotas renderizam hoje paginas placeholder neutras e notas de ownership, em vez de workflows especificos de dominio.

## Estrutura De Diretorios

Estrutura atual:

```text
apps/web/
  src/
    components/
      layout/
      ui/
    lib/
      http/
      query/
      utils/
    routes/
      admin/
      app/
      __root.tsx
      index.tsx
    styles/
    test/
    routeTree.gen.ts
    router.tsx
    vite-env.d.ts
```

### `src/routes`

Esta e a pasta mais importante.

O que faz:

- define as rotas da aplicacao
- define route layouts
- define route pages
- e a fonte de entrada para a geracao do TanStack Router

Porquê existe:

- mantem a ownership das rotas obvia
- faz com que os URLs correspondam diretamente aos ficheiros
- reduz configuracao de router escondida

Estrutura atual das rotas:

- `/` a partir de [apps/web/src/routes/index.tsx](../apps/web/src/routes/index.tsx)
- `/app` a partir de [apps/web/src/routes/app/index.tsx](../apps/web/src/routes/app/index.tsx)
- `/app/dashboard` a partir de [apps/web/src/routes/app/dashboard.tsx](../apps/web/src/routes/app/dashboard.tsx)
- `/admin` a partir de [apps/web/src/routes/admin/index.tsx](../apps/web/src/routes/admin/index.tsx)
- `/admin/dashboard` a partir de [apps/web/src/routes/admin/dashboard.tsx](../apps/web/src/routes/admin/dashboard.tsx)

### `src/routes/__root.tsx`

Esta e a root route da app.

O que faz:

- define o wrapper HTML do documento
- injeta a stylesheet principal
- fornece metadata app-wide
- monta o `RootFrame` partilhado
- monta o provider do TanStack Query
- monta Router e Query devtools em desenvolvimento
- fornece tratamento partilhado de erro e not-found

Porquê existe:

- todas as rotas devem herdar uma app shell consistente
- os providers globais devem viver num unico sitio
- a equipa nao deve repetir layout chrome ou providers dentro das feature routes

### `src/router.tsx`

Esta e a factory do router.

O que faz:

- importa a route tree gerada
- cria o Query client da app
- cria a instancia TanStack Router
- regista UI por omissao para pending, error e not-found
- exporta o registo do tipo do router para o TanStack

Porquê existe:

- mantem a criacao do router centralizada
- da a app uma unica configuracao de router partilhada
- garante que a geracao das rotas e a configuracao runtime do router permanecem ligadas

### `src/routeTree.gen.ts`

Este ficheiro e **gerado**.

O que faz:

- converte a estrutura file-based das rotas na route tree interna do TanStack
- da ao TanStack Router o mapa tipado de rotas de que ele precisa

Porquê existe:

- file-based routing precisa de um ficheiro de output gerado
- isto mantem o registo das rotas automatico

Importante:

- **nao** edites este ficheiro manualmente
- ele sera regenerado pelo TanStack quando as rotas mudarem

### `src/components/layout`

Esta pasta contem componentes de layout partilhados.

O que faz:

- `root-frame.tsx`: shell exterior app-wide e chrome global
- `root-navigation.tsx`: navegacao de topo entre as areas do scaffold
- `area-shell.tsx`: framing partilhado para grupos de rotas como `/app` e `/admin`
- `area-navigation.tsx`: navegacao local desses grupos de rotas
- `placeholder-page.tsx`: template placeholder neutro para rotas

Porquê existe:

- as decisoes de layout devem ser partilhadas
- as equipas de funcionalidade nao devem reconstruir shells de topo pagina a pagina
- manter layout separado dos primitivos de UI torna a ownership mais clara

### `src/components/ui`

Esta pasta contem pequenos primitivos UI partilhados e boundary components.

O que faz:

- `surface-card.tsx`: superficie de conteudo reutilizavel
- `default-catch-boundary.tsx`: UI partilhada para erro
- `not-found.tsx`: UI partilhada para not-found
- `route-pending.tsx`: placeholder partilhado para loading

Porquê existe:

- estas pecas sao genericas o suficiente para serem reutilizadas entre rotas
- nao estao ligadas a um grupo de rotas especifico
- sao intencionalmente minimas para nao impor demasiado cedo um design system completo

### `src/lib`

Esta pasta contem infraestrutura partilhada da aplicacao.

Serve para codigo que nao e apresentacao nem definicao de rotas.

#### `src/lib/env.ts`

O que faz:

- le variaveis de ambiente do frontend
- fornece defaults
- lanca erro se os valores estiverem vazios ou invalidos

Variaveis atuais:

- `VITE_APP_NAME`
- `VITE_API_BASE_URL`
- `VITE_ANALYTICS_BASE_URL`

Porquê existe:

- ler env vars diretamente por toda a app cria duplicacao e inconsistencia
- centralizar o parsing das env vars torna futuras alteracoes mais seguras

#### `src/lib/http/fetch-json.ts`

O que faz:

- encapsula `fetch`
- constroi URLs com query parameters
- faz parse de respostas JSON ou texto
- lanca um `HttpError` tipado para respostas com falha

Porquê existe:

- as equipas de funcionalidade precisam de um helper de requests com um default sensato
- evita repetir boilerplate baixo nivel de fetch e tratamento de erro
- e suficientemente generico para ser substituido mais tarde se a equipa adotar um cliente API mais especifico

#### `src/lib/query/client.ts`

O que faz:

- cria o TanStack Query client app-wide
- define o comportamento por omissao das queries

Porquê existe:

- a app deve ter um unico Query client partilhado
- o comportamento default das queries deve viver num unico sitio

#### `src/lib/utils/cn.ts`

O que faz:

- junta strings de classes CSS de forma condicional

Porquê existe:

- mantem legivel a composicao de classes nos componentes
- da a equipa um utilitario simples sem adicionar uma dependencia maior

### `src/styles`

Esta pasta contem styling global.

O que faz:

- `tokens.css` define CSS custom properties como cores e tons de texto
- `app.css` importa Tailwind e define classes globais partilhadas como `surface-panel`, `tag` e `action-link`

Porquê existe:

- os tokens devem viver fora dos componentes
- o styling global da app deve estar separado da logica de rotas
- as utilidades Tailwind sao uteis, mas algumas classes semanticas partilhadas reduzem repeticao

### `src/test`

Esta pasta contem setup de testes frontend partilhado e testes ao nivel da app.

O que faz:

- `setup.ts` carrega matchers do Testing Library
- testes de layout e de rotas verificam que o scaffold continua a renderizar e a comportar-se como esperado

Porquê existe:

- o scaffold e agora um produto do repositorio e deve ser protegido contra regressões acidentais
- queremos uma baseline de testes mesmo antes de comecar o trabalho de funcionalidade

## Como A App Arranca

O fluxo de arranque e:

1. O Vite arranca a app usando TanStack Start a partir de [apps/web/vite.config.ts](../apps/web/vite.config.ts).
2. O TanStack Start analisa `src/routes`.
3. O TanStack gera `src/routeTree.gen.ts`.
4. [apps/web/src/router.tsx](../apps/web/src/router.tsx) cria o router usando essa route tree gerada.
5. [apps/web/src/routes/__root.tsx](../apps/web/src/routes/__root.tsx) fornece a document shell, o Query provider, o layout global e as shared boundaries.
6. Os ficheiros de rotas aninhadas renderizam dentro de `<Outlet />`.

## Porque Os Grupos De Rotas Têm Este Aspeto

Dividimos a app em:

- `src/routes/app`
- `src/routes/admin`

Porquê:

- cria uma separacao clara entre as duas grandes areas de produto ja conhecidas no projeto
- os colegas conseguem ver imediatamente onde novas paginas pertencem
- o layout partilhado de cada area pode viver uma unica vez em `route.tsx`

E por isso que [apps/web/src/routes/app/route.tsx](../apps/web/src/routes/app/route.tsx) e [apps/web/src/routes/admin/route.tsx](../apps/web/src/routes/admin/route.tsx) existem mesmo renderizando apenas placeholders neste momento.

Elas sao boundaries de layout para grupos de rotas, nao feature pages.

## Porque Fizemos Commit Da Route Tree Gerada

Fizemos commit de `src/routeTree.gen.ts` de forma intencional.

Porquê:

- a app precisa dele para routing tipado
- os colegas nao devem ter de adivinhar se um ficheiro gerado em falta e esperado ou nao
- mantê-lo versionado evita problemas de "funciona na minha maquina" quando alguem faz checkout do repositorio de fresco

A regra e simples:

- os ficheiros de rotas sao escritos por pessoas
- `routeTree.gen.ts` e escrito pelo gerador

## Porque Estas Dependencias Existem

Dependencias runtime principais em [apps/web/package.json](../apps/web/package.json):

- `@tanstack/react-start`: runtime da app frontend
- `@tanstack/react-router`: routing
- `@tanstack/react-query`: estado assincrono partilhado e cache de dados
- `react` e `react-dom`: runtime React

Dependencias de desenvolvimento principais:

- `vite`: ferramenta de dev/build
- `@vitejs/plugin-react`: suporte React no Vite
- `@tanstack/router-plugin`: suporte a geracao de rotas
- `tailwindcss` e `@tailwindcss/vite`: styling
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`: baseline de testes
- router/query devtools: uteis durante desenvolvimento, fora do comportamento de producao

## Porque As Versoes Foram Fixadas

O stack TanStack Start foi fixado em versoes exatas em vez de intervalos soltos.

Porquê:

- o TanStack Start ainda esta a evoluir rapidamente
- os packages de router, start e plugin precisam de ficar sincronizados
- versoes exatas reduzem quebras inesperadas durante a fase inicial de scaffolding

## O Que Esta Intencionalmente Em Falta

Este scaffold **nao** define:

- fluxos de autenticacao
- logica de rotas protegidas
- API hooks especificos de funcionalidade
- pastas de funcionalidade por dominio
- um design system completo
- paginas de produto reais

Porquê:

- essas decisoes pertencem ao trabalho futuro e as equipas de funcionalidade
- o scaffold deve permitir trabalho de produto, nao antecipar-se a ele

## Como O Estender Em Seguranca

### Adicionar uma nova rota

1. Adiciona um ficheiro em `src/routes`.
2. Usa `createFileRoute(...)`.
3. Deixa o TanStack regenerar `src/routeTree.gen.ts`.

Bons exemplos:

- adicionar `src/routes/app/profile.tsx` para `/app/profile`
- adicionar `src/routes/admin/users.tsx` para `/admin/users`

### Adicionar layout partilhado

Se o codigo afeta o enquadramento das rotas ou a navegacao partilhada, coloca-o em:

- `src/components/layout`

### Adicionar UI reutilizavel pequena

Se o codigo for generico e apresentacional, coloca-o em:

- `src/components/ui`

### Adicionar infraestrutura app-wide

Se o codigo for logica partilhada e nao UI, coloca-o em:

- `src/lib`

### Adicionar codigo especifico de funcionalidade mais tarde

Quando o trabalho de funcionalidade comecar, os ficheiros de rota podem:

- manter a logica especifica da rota local a essa rota
- ou introduzir feature folders quando realmente existir logica de dominio repetida

Nao criamos `features/*` especulativos de forma intencional, porque isso fingiria que ja sabemos os limites futuros das funcionalidades antes de a equipa os ter construído.

## Comandos Que A Equipa Deve Conhecer

A partir da raiz do repositorio:

```bash
pnpm --filter @ecobairro/web dev
pnpm --filter @ecobairro/web lint
pnpm --filter @ecobairro/web typecheck
pnpm --filter @ecobairro/web test
pnpm --filter @ecobairro/web build
```

## Modelo Mental

Se so te lembrares de uma coisa, lembra-te disto:

- `routes` define para onde a app vai
- `layout` define a estrutura partilhada da pagina
- `ui` define pequenas pecas de apresentacao reutilizaveis
- `lib` define infraestrutura partilhada que nao e UI
- `routeTree.gen.ts` e a cola gerada

Esta separacao e a principal escolha arquitetural por tras deste scaffold.

## Validacao Atual

O scaffold foi validado com:

- `pnpm --filter @ecobairro/web lint`
- `pnpm --filter @ecobairro/web typecheck`
- `pnpm --filter @ecobairro/web test`
- `pnpm --filter @ecobairro/web build`

## Evolucao Futura

Este scaffold pode evoluir em varias direcoes mais tarde:

- adicionar auth e boundaries de rotas protegidas
- adicionar query hooks de dominio reais ou um cliente API tipado
- adicionar SSR se o produto beneficiar realmente com isso
- adicionar um design system mais completo quando surgirem padroes de UI repetidos

Essas decisoes ficam intencionalmente adiadas ate serem justificadas por trabalho real de funcionalidade.
