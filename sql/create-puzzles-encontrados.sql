-- ============================================
-- TABELA: PUZZLES ENCONTRADOS (WIF REGISTRADOS)
-- ============================================
-- Finalidade: Registrar WIFs quando o puzzle Bitcoin é encontrado
-- Prefixo: nenhum (tabela normal, não é chat)
-- Compatibilidade: PostgreSQL (Supabase) e MySQL (localhost)

CREATE TABLE IF NOT EXISTS ovo_ia_puzzles_encontrados (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    
    -- Informações do Puzzle
    preset BIGINT NOT NULL,                    -- Ex: 70, 71, 72, etc.
    hex_private_key VARCHAR(64) NOT NULL,       -- Chave privada em hex (64 chars)
    wif_compressed VARCHAR(52) NOT NULL,       -- WIF comprimido
    wif_uncompressed VARCHAR(52) NOT NULL,     -- WIF não comprimido
    
    -- Endereços Bitcoin
    address_compressed VARCHAR(62) NOT NULL,   -- Endereço comprimido
    address_uncompressed VARCHAR(62) NOT NULL, -- Endereço não comprimido
    
    -- Metadados da Descoberta
    bits BIGINT NOT NULL,                       -- Bits do puzzle
    mode VARCHAR(10) NOT NULL,                  -- 'horizontal' ou 'vertical'
    discovery_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Informações do Processo
    matrix_coordinates JSONB,                    -- {row: X, col: Y} se aplicável
    processing_time_ms BIGINT,                  -- Tempo de processamento em ms
    lines_processed BIGINT,                      -- Linhas processadas até encontrar
    
    -- Controle e Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ovo_ia_puzzles_encontrados_hex_check 
        CHECK (length(hex_private_key) = 64),
    CONSTRAINT ovo_ia_puzzles_encontrados_preset_check 
        CHECK (preset >= 1 AND preset <= 256),
    CONSTRAINT ovo_ia_puzzles_encontrados_mode_check 
        CHECK (mode IN ('horizontal', 'vertical'))
);

-- ÍNDICES OTIMIZADOS
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_preset ON ovo_ia_puzzles_encontrados(preset);
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_hex_private_key ON ovo_ia_puzzles_encontrados(hex_private_key(191));
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_wif_compressed ON ovo_ia_puzzles_encontrados(wif_compressed(191));
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_discovery_timestamp ON ovo_ia_puzzles_encontrados(discovery_timestamp);
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_mode ON ovo_ia_puzzles_encontrados(mode);

-- ÍNDICE COMPOSTO PARA CONSULTAS FREQUENTES
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_preset_mode ON ovo_ia_puzzles_encontrados(preset, mode);

-- 🚀 CONSTRAINT UNIQUE PARA IMPEDIR DUPLICATAS DE CHAVE
-- Garante que a mesma chave hexadecimal não seja inserida duas vezes
ALTER TABLE ovo_ia_puzzles_encontrados 
ADD CONSTRAINT IF NOT EXISTS ovo_ia_puzzles_encontrados_hex_unique 
UNIQUE (hex_private_key);

-- TRIGGER PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION update_ovo_ia_puzzles_encontrados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_ovo_ia_puzzles_encontrados_updated_at
    BEFORE UPDATE ON ovo_ia_puzzles_encontrados
    FOR EACH ROW
    EXECUTE FUNCTION update_ovo_ia_puzzles_encontrados_updated_at();

-- COMENTÁRIOS
COMMENT ON TABLE ovo_ia_puzzles_encontrados IS 'Registro de puzzles Bitcoin encontrados com WIFs';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.preset IS 'Número do preset (ex: 70, 71, 72)';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.hex_private_key IS 'Chave privada em formato hexadecimal (64 caracteres)';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.wif_compressed IS 'WIF formatado (comprimido)';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.wif_uncompressed IS 'WIF formatado (não comprimido)';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.address_compressed IS 'Endereço Bitcoin (comprimido)';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.address_uncompressed IS 'Endereço Bitcoin (não comprimido)';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.mode IS 'Modo de descoberta: horizontal ou vertical';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.matrix_coordinates IS 'Coordenadas na matriz 16x16 quando aplicável';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.processing_time_ms IS 'Tempo total de processamento até encontrar';
COMMENT ON COLUMN ovo_ia_puzzles_encontrados.lines_processed IS 'Número de linhas processadas até encontrar';

-- POLÍTICA DE SEGURANÇA (RLS - Row Level Security)
ALTER TABLE ovo_ia_puzzles_encontrados ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserções públicas (para registrar descobertas)
CREATE POLICY "Allow insert discoveries" ON ovo_ia_puzzles_encontrados
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Política para permitir leituras públicas (para visualizar descobertas)
CREATE POLICY "Allow read discoveries" ON ovo_ia_puzzles_encontrados
    FOR SELECT
    TO anon
    USING (true);

-- Política para permitir atualizações apenas pelo serviço
CREATE POLICY "Allow service updates" ON ovo_ia_puzzles_encontrados
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Política para permitir exclusões apenas pelo serviço
CREATE POLICY "Allow service deletes" ON ovo_ia_puzzles_encontrados
    FOR DELETE
    TO service_role
    USING (true);
