-- =====================================================
-- TABELA DE PROGRESSO EXCLUSIVA PARA MODO VERTICAL
-- =====================================================
-- Finalidade: Armazenar o ponto de interrupção do modo vertical
-- Prefixo: nenhum (tabela normal, não é chat)

CREATE TABLE IF NOT EXISTS puzzle_vertical_progress (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Informações do Progresso
    preset INTEGER NOT NULL UNIQUE,           -- Número do preset (ex: 66) como chave única
    inicio VARCHAR(64) NOT NULL,              -- Valor hexadecimal atual/inicial salvo
    fim VARCHAR(64) NOT NULL,                 -- Valor hexadecimal final do preset
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_puzzle_vertical_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_puzzle_vertical
  BEFORE UPDATE ON puzzle_vertical_progress
  FOR EACH ROW EXECUTE FUNCTION update_puzzle_vertical_timestamp();

-- Comentário da tabela
COMMENT ON TABLE puzzle_vertical_progress IS 'Armazena o ponto exato de interrupção apenas para o modo vertical';
COMMENT ON COLUMN puzzle_vertical_progress.id IS 'Identificador único do registro';
COMMENT ON COLUMN puzzle_vertical_progress.created_at IS 'Data e hora de criação do registro';
COMMENT ON COLUMN puzzle_vertical_progress.preset IS 'Número do preset (ex: 66) como identificador único';
COMMENT ON COLUMN puzzle_vertical_progress.inicio IS 'Valor hexadecimal inicial/inicial salvo';
COMMENT ON COLUMN puzzle_vertical_progress.fim IS 'Valor hexadecimal final do preset';
COMMENT ON COLUMN puzzle_vertical_progress.updated_at IS 'Data e hora da última atualização';
