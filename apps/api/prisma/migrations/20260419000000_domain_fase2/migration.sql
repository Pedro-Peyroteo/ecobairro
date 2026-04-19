-- EcoBairro — Domain Fase 2 migration
-- Adds: operador_perfis, zonas, zonas_historico, ecopontos, ecoponto_estado_atual,
--        sensor_leituras (partitioned), reports, reports_timeline, reports_subscricoes,
--        pedidos_recolha, partilhas_materiais, partilhas_mensagens, notificacoes,
--        mensagens_institucionais, badges, cidadao_badges, quizzes, quiz_perguntas,
--        quiz_opcoes, quiz_sessoes, rotas_execucao, audit_log
-- PostGIS indexes, triggers, and sensor_leituras partitioning are in this file.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── RGPD fields on cidadao_perfis ─────────────────────────────────────────
ALTER TABLE "cidadao_perfis"
  ADD COLUMN IF NOT EXISTS "rgpd_version"    VARCHAR(20),
  ADD COLUMN IF NOT EXISTS "rgpd_accepted_at" TIMESTAMPTZ;

-- ─── Enumerations ───────────────────────────────────────────────────────────
CREATE TYPE "ZonaTipo" AS ENUM (
  'OPERACIONAL', 'RESIDENCIAL', 'PRIORITARIA_IOT', 'ADMINISTRATIVA'
);

CREATE TYPE "EcopontoEstadoEnum" AS ENUM (
  'CHEIO', 'DISPONIVEL', 'SEM_SENSOR', 'AVARIADO', 'MANUTENCAO'
);

CREATE TYPE "ReportCategoria" AS ENUM (
  'ECOPONTO_CHEIO', 'ECOPONTO_PARTIDO', 'DEPOSICAO_ILEGAL',
  'ODORES', 'GAIVOTAS_ORGANICOS', 'VANDALISMO', 'OUTRO'
);

CREATE TYPE "ReportEstado" AS ENUM (
  'RECEBIDO', 'EM_ANALISE', 'EM_RESOLUCAO', 'RESOLVIDO', 'REJEITADO'
);

CREATE TYPE "PedidoRecolhaEstado" AS ENUM (
  'PENDENTE', 'AGENDADO', 'EM_CURSO', 'CONCLUIDO', 'CANCELADO'
);

-- ─── operador_perfis ────────────────────────────────────────────────────────
CREATE TABLE "operador_perfis" (
  "id"                     UUID        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"                UUID        NOT NULL,
  "nome_completo"          TEXT        NOT NULL,
  "entidade_empregadora"   VARCHAR(100) NOT NULL,
  "cargo"                  VARCHAR(100),
  "zonas_responsabilidade" UUID[]      NOT NULL DEFAULT '{}',
  "criado_em"              TIMESTAMPTZ NOT NULL DEFAULT now(),
  "atualizado_em"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "operador_perfis_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operador_perfis_user_id_key"  ON "operador_perfis"("user_id");
CREATE INDEX "operador_perfis_entidade_idx"        ON "operador_perfis"("entidade_empregadora");
CREATE INDEX "operador_perfis_zonas_gin_idx"       ON "operador_perfis" USING GIN ("zonas_responsabilidade");
CREATE INDEX "operador_perfis_nome_trgm_idx"       ON "operador_perfis" USING GIN ("nome_completo" gin_trgm_ops);

ALTER TABLE "operador_perfis"
  ADD CONSTRAINT "operador_perfis_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── zonas ──────────────────────────────────────────────────────────────────
CREATE TABLE "zonas" (
  "id"                      UUID          NOT NULL DEFAULT gen_random_uuid(),
  "nome"                    VARCHAR(100)  NOT NULL,
  "descricao"               TEXT,
  "geometria"               GEOGRAPHY(MultiPolygon, 4326) NOT NULL,
  "tipo"                    "ZonaTipo"    NOT NULL,
  "ativa"                   BOOLEAN       NOT NULL DEFAULT true,
  "limite_antispam_reports" SMALLINT      NOT NULL DEFAULT 2 CHECK ("limite_antispam_reports" >= 1),
  "janela_antispam_horas"   SMALLINT      NOT NULL DEFAULT 24 CHECK ("janela_antispam_horas" IN (1,6,12,24,48)),
  "entidade_responsavel"    VARCHAR(100),
  "alertas_config"          JSONB         NOT NULL DEFAULT '{}',
  "criado_em"               TIMESTAMPTZ   NOT NULL DEFAULT now(),
  "atualizado_em"           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "zonas_nome_key"           ON "zonas"("nome");
CREATE INDEX "zonas_geometria_gist_idx"        ON "zonas" USING GIST ("geometria");
CREATE INDEX "zonas_ativa_idx"                 ON "zonas"("ativa") WHERE "ativa" = true;
CREATE INDEX "zonas_tipo_idx"                  ON "zonas"("tipo");

-- ─── zonas_historico ────────────────────────────────────────────────────────
CREATE TABLE "zonas_historico" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "zona_id"     UUID        NOT NULL,
  "snapshot"    JSONB       NOT NULL,
  "alterado_por" UUID,
  "alterado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "motivo"      TEXT,
  CONSTRAINT "zonas_historico_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "zonas_historico_zona_em_idx" ON "zonas_historico"("zona_id", "alterado_em" DESC);

ALTER TABLE "zonas_historico"
  ADD CONSTRAINT "zonas_historico_zona_id_fkey"
  FOREIGN KEY ("zona_id") REFERENCES "zonas"("id");

ALTER TABLE "zonas_historico"
  ADD CONSTRAINT "zonas_historico_alterado_por_fkey"
  FOREIGN KEY ("alterado_por") REFERENCES "users"("id");

-- Trigger: auto-snapshot before UPDATE on zonas
CREATE OR REPLACE FUNCTION fn_zonas_historico() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO zonas_historico(zona_id, snapshot, alterado_por)
  VALUES (OLD.id, row_to_json(OLD)::jsonb, current_setting('app.current_user_id', true)::uuid);
  NEW.atualizado_em := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_zonas_historico
  BEFORE UPDATE ON zonas
  FOR EACH ROW EXECUTE FUNCTION fn_zonas_historico();

-- ─── ecopontos ──────────────────────────────────────────────────────────────
CREATE TABLE "ecopontos" (
  "id"              UUID                      NOT NULL DEFAULT gen_random_uuid(),
  "codigo_externo"  VARCHAR(50)               UNIQUE,
  "nome"            VARCHAR(200)              NOT NULL,
  "descricao"       TEXT,
  "localizacao"     GEOGRAPHY(Point, 4326)    NOT NULL,
  "morada_textual"  VARCHAR(300),
  "zona_id"         UUID                      NOT NULL,
  "tipologias"      VARCHAR(20)[]             NOT NULL DEFAULT '{}',
  "tem_sensor"      BOOLEAN                   NOT NULL DEFAULT false,
  "acessibilidade"  JSONB                     NOT NULL DEFAULT '{}',
  "horario"         JSONB,
  "ativo"           BOOLEAN                   NOT NULL DEFAULT true,
  "criado_em"       TIMESTAMPTZ               NOT NULL DEFAULT now(),
  "atualizado_em"   TIMESTAMPTZ               NOT NULL DEFAULT now(),
  "eliminado_em"    TIMESTAMPTZ,
  CONSTRAINT "ecopontos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ecopontos_localizacao_gist_idx"   ON "ecopontos" USING GIST ("localizacao");
CREATE INDEX "ecopontos_zona_ativo_idx"          ON "ecopontos"("zona_id", "ativo") WHERE "ativo" = true;
CREATE INDEX "ecopontos_tipologias_gin_idx"      ON "ecopontos" USING GIN ("tipologias");
CREATE UNIQUE INDEX "ecopontos_codigo_externo_idx"
  ON "ecopontos"("codigo_externo") WHERE "codigo_externo" IS NOT NULL;

ALTER TABLE "ecopontos"
  ADD CONSTRAINT "ecopontos_zona_id_fkey"
  FOREIGN KEY ("zona_id") REFERENCES "zonas"("id");

-- Tipologias check
ALTER TABLE "ecopontos"
  ADD CONSTRAINT "ecopontos_tipologias_check"
  CHECK (tipologias <@ ARRAY['VIDRO','PAPEL','PLASTICO','ORGANICO','GERAL','OUTROS']::VARCHAR(20)[]);

-- ─── ecoponto_estado_atual ──────────────────────────────────────────────────
CREATE TABLE "ecoponto_estado_atual" (
  "ecoponto_id"      UUID        NOT NULL,
  "nivel_enchimento" SMALLINT    CHECK ("nivel_enchimento" BETWEEN 0 AND 100),
  "estado"           VARCHAR(20) NOT NULL DEFAULT 'SEM_SENSOR'
                       CHECK ("estado" IN ('CHEIO','DISPONIVEL','SEM_SENSOR','AVARIADO','MANUTENCAO')),
  "ultima_leitura_em" TIMESTAMPTZ,
  "device_id"        VARCHAR(100),
  "atualizado_em"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "ecoponto_estado_atual_pkey" PRIMARY KEY ("ecoponto_id")
);

ALTER TABLE "ecoponto_estado_atual"
  ADD CONSTRAINT "ecoponto_estado_atual_ecoponto_fkey"
  FOREIGN KEY ("ecoponto_id") REFERENCES "ecopontos"("id") ON DELETE CASCADE;

-- Trigger: NOTIFY on ecoponto state change (for Redis cache invalidation)
CREATE OR REPLACE FUNCTION fn_notify_ecoponto_estado() RETURNS TRIGGER AS $$
DECLARE
  payload TEXT;
BEGIN
  payload := json_build_object(
    'ecoponto_id', NEW.ecoponto_id,
    'estado', NEW.estado,
    'nivel_enchimento', NEW.nivel_enchimento
  )::text;
  PERFORM pg_notify('ecoponto_estado_updated', payload);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_ecoponto_estado
  AFTER UPDATE ON ecoponto_estado_atual
  FOR EACH ROW EXECUTE FUNCTION fn_notify_ecoponto_estado();

-- ─── sensor_leituras (partitioned by month) ─────────────────────────────────
-- Prisma does not manage this table; use prisma.$queryRaw for access.
CREATE TABLE "sensor_leituras" (
  "id"                UUID        NOT NULL DEFAULT gen_random_uuid(),
  "timestamp_leitura" TIMESTAMPTZ NOT NULL,
  "ecoponto_id"       UUID        NOT NULL,
  "device_id"         VARCHAR(100) NOT NULL,
  "nivel_enchimento"  SMALLINT    CHECK ("nivel_enchimento" BETWEEN 0 AND 100),
  "estado_reportado"  VARCHAR(20),
  "metadata"          JSONB,
  "criado_em"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("id", "timestamp_leitura")
) PARTITION BY RANGE ("timestamp_leitura");

CREATE INDEX "sensor_leituras_ecoponto_ts_idx"
  ON "sensor_leituras"("ecoponto_id", "timestamp_leitura" DESC);

CREATE INDEX "sensor_leituras_ts_brin_idx"
  ON "sensor_leituras" USING BRIN ("timestamp_leitura");

CREATE INDEX "sensor_leituras_overflow_idx"
  ON "sensor_leituras"("nivel_enchimento", "timestamp_leitura")
  WHERE "nivel_enchimento" >= 80;

-- Initial partitions for 2026
CREATE TABLE sensor_leituras_2026_04 PARTITION OF sensor_leituras
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE sensor_leituras_2026_05 PARTITION OF sensor_leituras
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE sensor_leituras_2026_06 PARTITION OF sensor_leituras
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE sensor_leituras_2026_07 PARTITION OF sensor_leituras
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE sensor_leituras_2026_08 PARTITION OF sensor_leituras
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE sensor_leituras_2026_09 PARTITION OF sensor_leituras
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE sensor_leituras_2026_10 PARTITION OF sensor_leituras
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE sensor_leituras_2026_11 PARTITION OF sensor_leituras
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE sensor_leituras_2026_12 PARTITION OF sensor_leituras
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- ─── sequence for report.numero ─────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS report_numero_seq START 1;

-- ─── reports ────────────────────────────────────────────────────────────────
CREATE TABLE "reports" (
  "id"                  UUID               NOT NULL DEFAULT gen_random_uuid(),
  "numero"              BIGINT             NOT NULL UNIQUE DEFAULT nextval('report_numero_seq'),
  "cidadao_id"          UUID               NOT NULL,
  "ecoponto_id"         UUID,
  "zona_id"             UUID               NOT NULL,
  "categoria"           "ReportCategoria"  NOT NULL,
  "descricao"           TEXT,
  "localizacao"         GEOGRAPHY(Point, 4326) NOT NULL,
  "localizacao_manual"  BOOLEAN            NOT NULL DEFAULT false,
  "foto_url"            VARCHAR(500),
  "foto_thumbnail_url"  VARCHAR(500),
  "estado"              "ReportEstado"     NOT NULL DEFAULT 'RECEBIDO',
  "motivo_rejeicao"     TEXT,
  "entidade_responsavel" VARCHAR(50),
  "atribuido_a"         UUID,
  "atribuido_em"        TIMESTAMPTZ,
  "report_pai_id"       UUID,
  "primeira_resposta_em" TIMESTAMPTZ,
  "resolvido_em"        TIMESTAMPTZ,
  "num_subscricoes"     INTEGER            NOT NULL DEFAULT 0,
  "criado_em"           TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "atualizado_em"       TIMESTAMPTZ        NOT NULL DEFAULT now(),
  "eliminado_em"        TIMESTAMPTZ,
  CONSTRAINT "reports_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "reports_rejeicao_check"
    CHECK ("estado" != 'REJEITADO' OR "motivo_rejeicao" IS NOT NULL)
);

CREATE INDEX "reports_cidadao_em_idx"      ON "reports"("cidadao_id", "criado_em" DESC);
CREATE INDEX "reports_zona_estado_em_idx"  ON "reports"("zona_id", "estado", "criado_em" DESC);
CREATE INDEX "reports_estado_em_idx"       ON "reports"("estado", "criado_em" DESC);
CREATE INDEX "reports_categoria_zona_idx"  ON "reports"("categoria", "zona_id");
CREATE INDEX "reports_localizacao_gist_idx" ON "reports" USING GIST ("localizacao");
CREATE INDEX "reports_pai_idx"
  ON "reports"("report_pai_id") WHERE "report_pai_id" IS NOT NULL;
CREATE INDEX "reports_eliminado_idx"
  ON "reports"("eliminado_em") WHERE "eliminado_em" IS NOT NULL;

ALTER TABLE "reports"
  ADD CONSTRAINT "reports_cidadao_fkey" FOREIGN KEY ("cidadao_id") REFERENCES "users"("id"),
  ADD CONSTRAINT "reports_ecoponto_fkey" FOREIGN KEY ("ecoponto_id") REFERENCES "ecopontos"("id"),
  ADD CONSTRAINT "reports_zona_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id"),
  ADD CONSTRAINT "reports_atribuido_fkey" FOREIGN KEY ("atribuido_a") REFERENCES "users"("id"),
  ADD CONSTRAINT "reports_pai_fkey" FOREIGN KEY ("report_pai_id") REFERENCES "reports"("id");

-- ─── reports_timeline ───────────────────────────────────────────────────────
CREATE TABLE "reports_timeline" (
  "id"             UUID        NOT NULL DEFAULT gen_random_uuid(),
  "report_id"      UUID        NOT NULL,
  "estado_antes"   VARCHAR(20),
  "estado_depois"  VARCHAR(20) NOT NULL,
  "nota"           TEXT,
  "atualizado_por" UUID,
  "criado_em"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "reports_timeline_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reports_timeline_report_em_idx" ON "reports_timeline"("report_id", "criado_em" DESC);

ALTER TABLE "reports_timeline"
  ADD CONSTRAINT "reports_timeline_report_fkey"
  FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE;

-- ─── reports_subscricoes ────────────────────────────────────────────────────
CREATE TABLE "reports_subscricoes" (
  "report_id"  UUID        NOT NULL,
  "cidadao_id" UUID        NOT NULL,
  "criado_em"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "reports_subscricoes_pkey" PRIMARY KEY ("report_id", "cidadao_id")
);

ALTER TABLE "reports_subscricoes"
  ADD CONSTRAINT "reports_subscricoes_report_fkey"
  FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE;

-- Trigger: maintain num_subscricoes counter on reports
CREATE OR REPLACE FUNCTION fn_update_num_subscricoes() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE reports SET num_subscricoes = num_subscricoes + 1 WHERE id = NEW.report_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE reports SET num_subscricoes = num_subscricoes - 1 WHERE id = OLD.report_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_num_subscricoes
  AFTER INSERT OR DELETE ON reports_subscricoes
  FOR EACH ROW EXECUTE FUNCTION fn_update_num_subscricoes();

-- ─── pedidos_recolha ────────────────────────────────────────────────────────
CREATE TABLE "pedidos_recolha" (
  "id"              UUID                    NOT NULL DEFAULT gen_random_uuid(),
  "cidadao_id"      UUID                    NOT NULL,
  "operador_id"     UUID,
  "morada"          VARCHAR(400)            NOT NULL,
  "tipo_material"   VARCHAR(100)            NOT NULL,
  "volume_estimado" VARCHAR(50),
  "foto_url"        VARCHAR(500),
  "estado"          "PedidoRecolhaEstado"   NOT NULL DEFAULT 'PENDENTE',
  "agendado_para"   TIMESTAMPTZ,
  "notas"           TEXT,
  "criado_em"       TIMESTAMPTZ             NOT NULL DEFAULT now(),
  "atualizado_em"   TIMESTAMPTZ             NOT NULL DEFAULT now(),
  CONSTRAINT "pedidos_recolha_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pedidos_recolha_cidadao_em_idx" ON "pedidos_recolha"("cidadao_id", "criado_em" DESC);
CREATE INDEX "pedidos_recolha_estado_em_idx"  ON "pedidos_recolha"("estado", "criado_em" DESC);

ALTER TABLE "pedidos_recolha"
  ADD CONSTRAINT "pedidos_recolha_cidadao_fkey" FOREIGN KEY ("cidadao_id") REFERENCES "users"("id");

-- ─── partilhas_materiais ────────────────────────────────────────────────────
CREATE TABLE "partilhas_materiais" (
  "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
  "cidadao_id"       UUID        NOT NULL,
  "titulo"           VARCHAR(200) NOT NULL,
  "descricao"        TEXT        NOT NULL,
  "categoria"        VARCHAR(50) NOT NULL,
  "estado"           VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL',
  "zona_id"          UUID,
  "foto_url"         VARCHAR(500),
  "disclaimer_aceite" BOOLEAN    NOT NULL DEFAULT false,
  "criado_em"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "atualizado_em"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "eliminado_em"     TIMESTAMPTZ,
  CONSTRAINT "partilhas_materiais_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "partilhas_materiais_estado_em_idx" ON "partilhas_materiais"("estado", "criado_em" DESC);

ALTER TABLE "partilhas_materiais"
  ADD CONSTRAINT "partilhas_materiais_cidadao_fkey"
  FOREIGN KEY ("cidadao_id") REFERENCES "users"("id");

-- ─── partilhas_mensagens ────────────────────────────────────────────────────
CREATE TABLE "partilhas_mensagens" (
  "id"           UUID        NOT NULL DEFAULT gen_random_uuid(),
  "partilha_id"  UUID        NOT NULL,
  "remetente_id" UUID        NOT NULL,
  "texto"        TEXT        NOT NULL,
  "criado_em"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "partilhas_mensagens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "partilhas_mensagens_partilha_em_idx"
  ON "partilhas_mensagens"("partilha_id", "criado_em" ASC);

ALTER TABLE "partilhas_mensagens"
  ADD CONSTRAINT "partilhas_mensagens_partilha_fkey"
  FOREIGN KEY ("partilha_id") REFERENCES "partilhas_materiais"("id") ON DELETE CASCADE;

-- ─── notificacoes ───────────────────────────────────────────────────────────
CREATE TABLE "notificacoes" (
  "id"         UUID        NOT NULL DEFAULT gen_random_uuid(),
  "cidadao_id" UUID        NOT NULL,
  "tipo"       VARCHAR(50) NOT NULL,
  "titulo"     VARCHAR(200) NOT NULL,
  "corpo"      TEXT        NOT NULL,
  "canal"      VARCHAR(20) NOT NULL DEFAULT 'APP',
  "lida"       BOOLEAN     NOT NULL DEFAULT false,
  "lida_em"    TIMESTAMPTZ,
  "payload"    JSONB,
  "criado_em"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notificacoes_cidadao_lida_em_idx"
  ON "notificacoes"("cidadao_id", "lida", "criado_em" DESC);

ALTER TABLE "notificacoes"
  ADD CONSTRAINT "notificacoes_cidadao_fkey"
  FOREIGN KEY ("cidadao_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- ─── mensagens_institucionais ───────────────────────────────────────────────
CREATE TABLE "mensagens_institucionais" (
  "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
  "titulo"        VARCHAR(300) NOT NULL,
  "corpo"         TEXT        NOT NULL,
  "criado_por"    UUID        NOT NULL,
  "publicada"     BOOLEAN     NOT NULL DEFAULT false,
  "publicada_em"  TIMESTAMPTZ,
  "zonas_destino" UUID[]      NOT NULL DEFAULT '{}',
  "criado_em"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "atualizado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "mensagens_institucionais_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mensagens_institucionais_pub_em_idx"
  ON "mensagens_institucionais"("publicada", "criado_em" DESC);

ALTER TABLE "mensagens_institucionais"
  ADD CONSTRAINT "mensagens_institucionais_criado_fkey"
  FOREIGN KEY ("criado_por") REFERENCES "users"("id");

-- ─── badges ─────────────────────────────────────────────────────────────────
CREATE TABLE "badges" (
  "id"        UUID        NOT NULL DEFAULT gen_random_uuid(),
  "codigo"    VARCHAR(50) NOT NULL UNIQUE,
  "nome"      VARCHAR(100) NOT NULL,
  "descricao" TEXT        NOT NULL,
  "icon_url"  VARCHAR(500),
  "condicao"  JSONB       NOT NULL,
  "ativo"     BOOLEAN     NOT NULL DEFAULT true,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- ─── cidadao_badges ─────────────────────────────────────────────────────────
CREATE TABLE "cidadao_badges" (
  "cidadao_id" UUID        NOT NULL,
  "badge_id"   UUID        NOT NULL,
  "ganho_em"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "cidadao_badges_pkey" PRIMARY KEY ("cidadao_id", "badge_id")
);

ALTER TABLE "cidadao_badges"
  ADD CONSTRAINT "cidadao_badges_badge_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id");

-- ─── quizzes ────────────────────────────────────────────────────────────────
CREATE TABLE "quizzes" (
  "id"              UUID        NOT NULL DEFAULT gen_random_uuid(),
  "titulo"          VARCHAR(200) NOT NULL,
  "tipo"            VARCHAR(30) NOT NULL DEFAULT 'SEMANAL',
  "ativo"           BOOLEAN     NOT NULL DEFAULT true,
  "disponivel_de"   TIMESTAMPTZ NOT NULL,
  "disponivel_ate"  TIMESTAMPTZ NOT NULL,
  "criado_por"      UUID        NOT NULL,
  "criado_em"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quizzes_ativo_ate_idx" ON "quizzes"("ativo", "disponivel_ate" DESC);

-- ─── quiz_perguntas ─────────────────────────────────────────────────────────
CREATE TABLE "quiz_perguntas" (
  "id"        UUID     NOT NULL DEFAULT gen_random_uuid(),
  "quiz_id"   UUID     NOT NULL,
  "texto"     TEXT     NOT NULL,
  "ordem"     SMALLINT NOT NULL,
  "criado_em" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "quiz_perguntas_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quiz_perguntas_quiz_ordem_idx" ON "quiz_perguntas"("quiz_id", "ordem");

ALTER TABLE "quiz_perguntas"
  ADD CONSTRAINT "quiz_perguntas_quiz_fkey"
  FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE;

-- ─── quiz_opcoes ────────────────────────────────────────────────────────────
-- Constraint: exactly one correct answer per pergunta (checked at service layer)
CREATE TABLE "quiz_opcoes" (
  "id"           UUID     NOT NULL DEFAULT gen_random_uuid(),
  "pergunta_id"  UUID     NOT NULL,
  "texto"        TEXT     NOT NULL,
  "correta"      BOOLEAN  NOT NULL DEFAULT false,
  "ordem"        SMALLINT NOT NULL,
  CONSTRAINT "quiz_opcoes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "quiz_opcoes_pergunta_ordem_idx" ON "quiz_opcoes"("pergunta_id", "ordem");

ALTER TABLE "quiz_opcoes"
  ADD CONSTRAINT "quiz_opcoes_pergunta_fkey"
  FOREIGN KEY ("pergunta_id") REFERENCES "quiz_perguntas"("id") ON DELETE CASCADE;

-- ─── quiz_sessoes ────────────────────────────────────────────────────────────
CREATE TABLE "quiz_sessoes" (
  "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
  "quiz_id"       UUID        NOT NULL,
  "cidadao_id"    UUID        NOT NULL,
  "pontuacao"     INTEGER     NOT NULL DEFAULT 0,
  "concluida"     BOOLEAN     NOT NULL DEFAULT false,
  "respostas"     JSONB       NOT NULL DEFAULT '[]',
  "criado_em"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "concluida_em"  TIMESTAMPTZ,
  CONSTRAINT "quiz_sessoes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "quiz_sessoes_unique" UNIQUE ("quiz_id", "cidadao_id")
);

CREATE INDEX "quiz_sessoes_cidadao_em_idx" ON "quiz_sessoes"("cidadao_id", "criado_em" DESC);

ALTER TABLE "quiz_sessoes"
  ADD CONSTRAINT "quiz_sessoes_quiz_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id");

-- ─── rotas_execucao ─────────────────────────────────────────────────────────
CREATE TABLE "rotas_execucao" (
  "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
  "zona_id"       UUID        NOT NULL,
  "operador_id"   UUID        NOT NULL,
  "data_execucao" TIMESTAMPTZ NOT NULL,
  "estado"        VARCHAR(20) NOT NULL DEFAULT 'PLANEADA',
  "ecopontos"     UUID[]      NOT NULL DEFAULT '{}',
  "notas"         TEXT,
  "criado_em"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "concluida_em"  TIMESTAMPTZ,
  CONSTRAINT "rotas_execucao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rotas_execucao_zona_data_idx"     ON "rotas_execucao"("zona_id", "data_execucao" DESC);
CREATE INDEX "rotas_execucao_operador_data_idx" ON "rotas_execucao"("operador_id", "data_execucao" DESC);

ALTER TABLE "rotas_execucao"
  ADD CONSTRAINT "rotas_execucao_zona_fkey"     FOREIGN KEY ("zona_id") REFERENCES "zonas"("id"),
  ADD CONSTRAINT "rotas_execucao_operador_fkey" FOREIGN KEY ("operador_id") REFERENCES "users"("id");

-- ─── audit_log ──────────────────────────────────────────────────────────────
CREATE TABLE "audit_log" (
  "id"          UUID        NOT NULL DEFAULT gen_random_uuid(),
  "actor_id"    UUID,
  "acao"        VARCHAR(100) NOT NULL,
  "entidade"    VARCHAR(50) NOT NULL,
  "entidade_id" UUID,
  "detalhes"    JSONB,
  "ip"          VARCHAR(45),
  "criado_em"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_log_actor_em_idx"     ON "audit_log"("actor_id", "criado_em" DESC);
CREATE INDEX "audit_log_entidade_idx"     ON "audit_log"("entidade", "entidade_id");
CREATE INDEX "audit_log_em_idx"           ON "audit_log"("criado_em" DESC);

ALTER TABLE "audit_log"
  ADD CONSTRAINT "audit_log_actor_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");
