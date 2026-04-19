-- Migration: fase3_rgpd_favoritos_campanhas
-- Adds: rgpd_consentimentos, ecoponto_favoritos, campanhas

-- ─── RGPD Consentimentos ──────────────────────────────────────────────────────

CREATE TABLE "rgpd_consentimentos" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "cidadao_id"  UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "finalidade"  VARCHAR(80) NOT NULL,
  "versao"      VARCHAR(20) NOT NULL,
  "aceite"      BOOLEAN     NOT NULL,
  "criado_em"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "revogado_em" TIMESTAMPTZ,

  CONSTRAINT "rgpd_consentimentos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rgpd_consentimentos_cidadao_finalidade_idx"
  ON "rgpd_consentimentos"("cidadao_id", "finalidade");

CREATE INDEX "rgpd_consentimentos_criado_em_idx"
  ON "rgpd_consentimentos"("criado_em" DESC);

-- ─── Ecopontos Favoritos ──────────────────────────────────────────────────────

CREATE TABLE "ecoponto_favoritos" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "cidadao_id"  UUID        NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "ecoponto_id" UUID        NOT NULL REFERENCES "ecopontos"("id") ON DELETE CASCADE,
  "criado_em"   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "ecoponto_favoritos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ecoponto_favoritos_unique" UNIQUE ("cidadao_id", "ecoponto_id")
);

CREATE INDEX "ecoponto_favoritos_cidadao_idx"
  ON "ecoponto_favoritos"("cidadao_id");

-- ─── Campanhas de Benefício ───────────────────────────────────────────────────

CREATE TABLE "campanhas" (
  "id"             UUID         NOT NULL DEFAULT gen_random_uuid(),
  "titulo"         VARCHAR(200) NOT NULL,
  "descricao"      TEXT,
  "zona_id"        UUID         REFERENCES "zonas"("id"),
  "criterios"      JSONB        NOT NULL DEFAULT '{}',
  "recompensa"     VARCHAR(200) NOT NULL,
  "ativa"          BOOLEAN      NOT NULL DEFAULT false,
  "disponivel_de"  TIMESTAMPTZ  NOT NULL,
  "disponivel_ate" TIMESTAMPTZ  NOT NULL,
  "criado_por"     UUID         NOT NULL REFERENCES "users"("id"),
  "criado_em"      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "atualizado_em"  TIMESTAMPTZ  NOT NULL DEFAULT now(),

  CONSTRAINT "campanhas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campanhas_ativa_datas_idx"
  ON "campanhas"("ativa", "disponivel_de", "disponivel_ate");

CREATE INDEX "campanhas_zona_idx"
  ON "campanhas"("zona_id");
