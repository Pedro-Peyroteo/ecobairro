-- =============================================================================
-- PostgreSQL NOTIFY triggers para invalidação reactiva do cache Redis
--
-- Fonte: docs/models/Cidadão/base de dados/3.2 Redis — cache e operações rápidas.md
--
-- Pipeline:
--   AFTER UPDATE na tabela
--     → pg_notify(canal, payload JSON)
--       → PgNotifyService (NestJS) escuta o canal
--         → CacheService.del(...) invalida chaves Redis afectadas
--
-- Para re-aplicar:
--   docker compose -f infra/compose/docker-compose.yml exec postgres \
--     psql -U ecobairro -d ecobairro -f /workspace/apps/api/prisma/sql/notify_triggers.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- users → canal: user_updated
-- Invalida: user:session:{id}, user:rbac:{id}
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_user_updated()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify(
    'user_updated',
    json_build_object('id', NEW.id)::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_updated ON users;
CREATE TRIGGER trg_user_updated
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_updated();

-- -----------------------------------------------------------------------------
-- cidadao_perfis → canal: cidadao_updated
-- Invalida: cidadao:profile, cidadao:notif_prefs, cidadao:dashboard, cidadao:favoritos
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_cidadao_updated()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify(
    'cidadao_updated',
    json_build_object('user_id', NEW.user_id)::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cidadao_updated ON cidadao_perfis;
CREATE TRIGGER trg_cidadao_updated
  AFTER UPDATE ON cidadao_perfis
  FOR EACH ROW
  EXECUTE FUNCTION notify_cidadao_updated();

-- -----------------------------------------------------------------------------
-- operador_perfis → canal: operador_updated
-- Invalida: operador:profile:{user_id}
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION notify_operador_updated()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM pg_notify(
    'operador_updated',
    json_build_object('user_id', NEW.user_id)::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_operador_updated ON operador_perfis;
CREATE TRIGGER trg_operador_updated
  AFTER UPDATE ON operador_perfis
  FOR EACH ROW
  EXECUTE FUNCTION notify_operador_updated();
