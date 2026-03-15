-- =====================================================
-- TABELA DE PROGRESSO VERTICAL - OVO IA
-- =====================================================
-- Finalidade: Armazenar progresso do modo vertical por usuário
-- Prefixo: nenhum (tabela normal, não é chat)

CREATE TABLE IF NOT EXISTS vertical_progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id VARCHAR(255) NOT NULL,
  preset_bits INTEGER NOT NULL,
  preset_inicio VARCHAR(64) NOT NULL,
  preset_fim VARCHAR(64) NOT NULL,
  last_hex_value VARCHAR(64) NOT NULL,
  last_verification_count BIGINT NOT NULL DEFAULT 0,
  last_inverted_value VARCHAR(64),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_vertical_user_preset ON vertical_progress(user_id, preset_bits);
CREATE INDEX IF NOT EXISTS idx_vertical_updated_at ON vertical_progress(updated_at);
CREATE INDEX IF NOT EXISTS idx_vertical_hex_value ON vertical_progress(last_hex_value(191));

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vertical_progress_updated_at 
  BEFORE UPDATE ON vertical_progress 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE vertical_progress IS 'Tabela de progresso vertical para presets do OVO IA';
COMMENT ON COLUMN vertical_progress.id IS 'Identificador único do registro';
COMMENT ON COLUMN vertical_progress.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN vertical_progress.user_id IS 'ID do usuário que está usando o preset';
COMMENT ON COLUMN vertical_progress.preset_bits IS 'Número de bits do preset (ex: 73 para 2^73)';
COMMENT ON COLUMN vertical_progress.preset_inicio IS 'Valor hexadecimal inicial do preset';
COMMENT ON COLUMN vertical_progress.preset_fim IS 'Valor hexadecimal final do preset';
COMMENT ON COLUMN vertical_progress.last_hex_value IS 'Último valor hexadecimal verificado no modo vertical';
COMMENT ON COLUMN vertical_progress.last_verification_count IS 'Contador total de verificações realizadas';
COMMENT ON COLUMN vertical_progress.last_inverted_value IS 'Último valor invertido verificado';
