-- =====================================================
-- TABELA DE PROGRESSO HORIZONTAL - PUZZLE PROGRESS
-- =====================================================
-- Finalidade: Armazenar progresso do modo horizontal
-- Prefixo: nenhum (tabela normal, não é chat)

CREATE TABLE IF NOT EXISTS puzzle_progress (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preset INTEGER UNIQUE NOT NULL,           -- Número do preset (ex: 71) como chave única
  inicio VARCHAR(64) NOT NULL,              -- Valor hexadecimal atual/inicial salvo
  fim VARCHAR(64) NOT NULL,                 -- Valor hexadecimal final do preset
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_puzzle_progress_preset ON puzzle_progress(preset);
CREATE INDEX IF NOT EXISTS idx_puzzle_progress_updated_at ON puzzle_progress(updated_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_puzzle_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_puzzle_progress_updated_at 
  BEFORE UPDATE ON puzzle_progress 
  FOR EACH ROW EXECUTE FUNCTION update_puzzle_progress_updated_at();

-- Comentários
COMMENT ON TABLE puzzle_progress IS 'Tabela de progresso horizontal para presets do puzzle Bitcoin';
COMMENT ON COLUMN puzzle_progress.id IS 'Identificador único do registro';
COMMENT ON COLUMN puzzle_progress.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN puzzle_progress.preset IS 'Número do preset (ex: 71 para 71 bits)';
COMMENT ON COLUMN puzzle_progress.inicio IS 'Valor hexadecimal atual/inicial do preset';
COMMENT ON COLUMN puzzle_progress.fim IS 'Valor hexadecimal final do preset';
COMMENT ON COLUMN puzzle_progress.updated_at IS 'Data da última atualização do progresso';

-- Dados iniciais (opcional - pode ser removido)
-- INSERT INTO puzzle_progress (preset, inicio, fim) VALUES 
--   (71, '4000000000000004a9', '7fffffffffffffff'),
--   (73, '800000000000000000', 'ffffffffffffffff');
