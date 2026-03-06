-- =====================================================
-- TABELA DE PROGRESSO EXCLUSIVA PARA MODO VERTICAL
-- =====================================================

CREATE TABLE IF NOT EXISTS puzzle_vertical (
  preset INTEGER PRIMARY KEY,           -- Número do preset (ex: 66) como chave primária
  inicio VARCHAR(64) NOT NULL,          -- Valor hexadecimal atual/inicial salvo
  fim VARCHAR(64) NOT NULL,             -- Valor hexadecimal final do preset
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
  BEFORE UPDATE ON puzzle_vertical
  FOR EACH ROW EXECUTE FUNCTION update_puzzle_vertical_timestamp();

-- Comentário
COMMENT ON TABLE puzzle_vertical IS 'Armazena o ponto exato de interrupção apenas para o modo vertical';
