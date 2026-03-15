-- ============================================
-- MYSQL/MARIADB VERSION - XAMPP LOCALHOST
-- Banco: canalqbgit | User: root | Pass: (empty)
-- ============================================
-- TABELA: PUZZLES ENCONTRADOS (WIF REGISTRADOS)
-- ============================================
-- Finalidade: Registrar WIFs quando o puzzle Bitcoin é encontrado
-- Prefixo: nenhum (tabela normal)

CREATE TABLE IF NOT EXISTS puzzles_encontrados (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Informações do Puzzle
    preset BIGINT NOT NULL COMMENT 'Número do preset (ex: 70, 71, 72, etc.)',
    hex_private_key VARCHAR(64) NOT NULL COMMENT 'Chave privada em hex (64 chars)',
    wif_compressed VARCHAR(52) NOT NULL COMMENT 'WIF comprimido',
    wif_uncompressed VARCHAR(52) NOT NULL COMMENT 'WIF não comprimido',
    
    -- Endereços Bitcoin
    address_compressed VARCHAR(62) NOT NULL COMMENT 'Endereço comprimido',
    address_uncompressed VARCHAR(62) NOT NULL COMMENT 'Endereço não comprimido',
    
    -- Metadados da Descoberta
    bits BIGINT NOT NULL COMMENT 'Bits do puzzle',
    mode VARCHAR(10) NOT NULL COMMENT 'horizontal ou vertical',
    discovery_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data da descoberta',
    
    -- Informações do Processo
    matrix_coordinates JSON COMMENT 'Coordenadas na matriz {row: X, col: Y}',
    processing_time_ms BIGINT COMMENT 'Tempo de processamento em ms',
    lines_processed BIGINT COMMENT 'Linhas processadas até encontrar',
    
    -- Controle e Auditoria
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_hex_key_length CHECK (LENGTH(hex_private_key) = 64),
    CONSTRAINT chk_preset_range CHECK (preset >= 1 AND preset <= 256),
    CONSTRAINT chk_mode CHECK (mode IN ('horizontal', 'vertical')),
    
    -- Índices
    INDEX idx_preset (preset),
    INDEX idx_hex_key (hex_private_key(191)),
    INDEX idx_wif_compressed (wif_compressed(191)),
    INDEX idx_discovery_timestamp (discovery_timestamp),
    INDEX idx_mode (mode),
    INDEX idx_preset_mode (preset, mode),
    
    -- Unique para impedir duplicatas
    UNIQUE KEY unique_hex_key (hex_private_key)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci 
  COMMENT='Registro de puzzles Bitcoin encontrados com WIFs';

-- ============================================
-- TABELA: PROGRESSO HORIZONTAL
-- ============================================
-- Finalidade: Armazenar progresso do modo horizontal

CREATE TABLE IF NOT EXISTS puzzle_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    preset INT NOT NULL UNIQUE COMMENT 'Número do preset (ex: 71)',
    inicio VARCHAR(64) NOT NULL COMMENT 'Valor hexadecimal inicial',
    fim VARCHAR(64) NOT NULL COMMENT 'Valor hexadecimal final',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_preset (preset),
    INDEX idx_updated_at (updated_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabela de progresso horizontal para presets do puzzle Bitcoin';

-- ============================================
-- TABELA: PROGRESSO VERTICAL
-- ============================================
-- Finalidade: Armazenar progresso do modo vertical

CREATE TABLE IF NOT EXISTS puzzle_vertical_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    preset INT NOT NULL UNIQUE COMMENT 'Número do preset (ex: 66)',
    inicio VARCHAR(64) NOT NULL COMMENT 'Valor hexadecimal inicial salvo',
    fim VARCHAR(64) NOT NULL COMMENT 'Valor hexadecimal final do preset',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_preset (preset),
    INDEX idx_updated_at (updated_at)
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Armazena o ponto exato de interrupção apenas para o modo vertical';

-- ============================================
-- TABELA: PROGRESSO VERTICAL POR USUÁRIO
-- ============================================
-- Finalidade: Armazenar progresso vertical por usuário

CREATE TABLE IF NOT EXISTS vertical_progress (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    user_id VARCHAR(255) NOT NULL COMMENT 'ID do usuário',
    preset_bits INT NOT NULL COMMENT 'Número de bits do preset (ex: 73)',
    preset_inicio VARCHAR(64) NOT NULL COMMENT 'Valor hexadecimal inicial',
    preset_fim VARCHAR(64) NOT NULL COMMENT 'Valor hexadecimal final',
    last_hex_value VARCHAR(64) NOT NULL COMMENT 'Último valor hexadecimal verificado',
    last_verification_count BIGINT NOT NULL DEFAULT 0 COMMENT 'Contador total de verificações',
    last_inverted_value VARCHAR(64) COMMENT 'Último valor invertido verificado',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_user_preset (user_id, preset_bits),
    INDEX idx_updated_at (updated_at),
    INDEX idx_hex_value (last_hex_value(191))
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Tabela de progresso vertical para presets por usuário';

-- ============================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================
-- INSERT INTO puzzle_progress (preset, inicio, fim) VALUES 
--   (71, '4000000000000004a9', '7fffffffffffffff'),
--   (73, '800000000000000000', 'ffffffffffffffff');

-- ============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ============================================

-- Trigger para puzzles_encontrados
DELIMITER $$
CREATE TRIGGER before_update_puzzles_encontrados
BEFORE UPDATE ON puzzles_encontrados
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$
DELIMITER ;

-- Trigger para puzzle_progress
DELIMITER $$
CREATE TRIGGER before_update_puzzle_progress
BEFORE UPDATE ON puzzle_progress
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$
DELIMITER ;

-- Trigger para puzzle_vertical_progress
DELIMITER $$
CREATE TRIGGER before_update_puzzle_vertical_progress
BEFORE UPDATE ON puzzle_vertical_progress
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$
DELIMITER ;

-- Trigger para vertical_progress
DELIMITER $$
CREATE TRIGGER before_update_vertical_progress
BEFORE UPDATE ON vertical_progress
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END$$
DELIMITER ;

-- ============================================
-- PERMISSÕES E SEGURANÇA
-- ============================================
-- No MySQL localhost, as permissões são gerenciadas pelo usuário do banco
-- Usuário: root | Senha: (vazio) | Host: localhost

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

-- Inserir puzzle encontrado:
-- INSERT INTO puzzles_encontrados (preset, hex_private_key, wif_compressed, wif_uncompressed, 
--   address_compressed, address_uncompressed, bits, mode) 
-- VALUES (70, 'abc123...', 'L5ez...','5K...', '1A...', '1B...', 70, 'horizontal');

-- Atualizar progresso:
-- INSERT INTO puzzle_progress (preset, inicio, fim) 
-- VALUES (71, '4000000000000004a9', '7fffffffffffffff')
-- ON DUPLICATE KEY UPDATE inicio=VALUES(inicio), updated_at=NOW();

-- Consultar estatísticas:
-- SELECT preset, COUNT(*) as total_found, MAX(discovery_timestamp) as last_found
-- FROM puzzles_encontrados GROUP BY preset ORDER BY preset;
