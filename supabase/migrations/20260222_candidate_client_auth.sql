-- Migration: Candidate & Client OTP tables
-- Date: 2026-02-22

-- =============================================
-- Tabela para OTPs de candidatos
-- =============================================
CREATE TABLE IF NOT EXISTS candidate_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_otps_member_id ON candidate_otps(member_id);
CREATE INDEX IF NOT EXISTS idx_candidate_otps_expires_at ON candidate_otps(expires_at);

-- =============================================
-- Tabela para OTPs de clientes
-- =============================================
CREATE TABLE IF NOT EXISTS client_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_user_id UUID NOT NULL REFERENCES company_users(id) ON DELETE CASCADE,
  otp VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_otps_company_user_id ON client_otps(company_user_id);
CREATE INDEX IF NOT EXISTS idx_client_otps_expires_at ON client_otps(expires_at);

-- =============================================
-- Função de limpeza automática de OTPs expirados
-- Chamar periodicamente via pg_cron ou Supabase scheduled function
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM candidate_otps WHERE expires_at < NOW();
  DELETE FROM client_otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- RLS: habilitar segurança por linha
-- Somente o service role (server actions) pode acessar
-- =============================================
ALTER TABLE candidate_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_otps ENABLE ROW LEVEL SECURITY;

-- Bloquear acesso anon/authenticated por padrão (acesso via service role apenas)
CREATE POLICY "No public access - candidate_otps"
  ON candidate_otps FOR ALL
  USING (false);

CREATE POLICY "No public access - client_otps"
  ON client_otps FOR ALL
  USING (false);
