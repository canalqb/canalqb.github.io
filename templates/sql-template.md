# 🗄️ TEMPLATE SQL UNIVERSAL - SUPABASE

## 📋 ESTRUTURA PADRÃO PARA TABELAS

### **🔧 Nomenclatura:**
- **Prefixo**: `ovo_ia_` (obrigatório)
- **Nome descritivo**: snake_case
- **Exemplo**: `ovo_ia_puzzles_encontrados`

### **🏗️ Estrutura Base:**
```sql
-- ============================================
-- TABELA: {{NOME_DESCRITIVO}}
-- ============================================
-- Finalidade: {{FINALIDADE}}
-- Prefixo: ovo_ia_ (conforme regras do usuário)
-- Projeto: {{PROJETO}}

CREATE TABLE IF NOT EXISTS ovo_ia_{{NOME_TABELA}} (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    
    -- Campos principais (ajustar conforme necessidade)
    {{CAMPOS_PRINCIPAIS}}
    
    -- Metadados padrão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints específicos (opcional)
    {{CONSTRAINTS}}
);

-- ÍNDICES OTIMIZADOS
{{INDICES}}

-- Constraint UNIQUE (se necessário)
{{CONSTRAINT_UNIQUE}}

-- Trigger para updated_at
{{TRIGGER_UPDATED_AT}}

-- Comentários
{{COMENTARIOS}}

-- RLS - Row Level Security
{{RLS_POLICIES}}
```

---

## 📋 COMPONENTES DO TEMPLATE

### **🔧 Variáveis:**
- `{{NOME_DESCRITIVO}}`: Nome completo para documentação
- `{{NOME_TABELA}}`: Nome da tabela sem prefixo
- `{{FINALIDADE}}`: Objetivo da tabela
- `{{PROJETO}}`: Nome do projeto atual

### **🏗️ Blocos:**
- `{{CAMPOS_PRINCIPAIS}}`: Definição dos campos
- `{{CONSTRAINTS}}`: Constraints CHECK
- `{{INDICES}}`: Índices otimizados
- `{{CONSTRAINT_UNIQUE}}`: Constraint UNIQUE (se necessário)
- `{{TRIGGER_UPDATED_AT}}`: Trigger automático
- `{{COMENTARIOS}}`: Comentários descritivos
- `{{RLS_POLICIES}}`: Políticas de segurança

---

## 📋 EXEMPLOS PRÁTICOS

### **🧩 Tabela de Puzzles (Completo):**
```sql
-- CAMPOS_PRINCIPAIS:
    preset BIGINT NOT NULL,
    hex_private_key VARCHAR(64) NOT NULL,
    wif_compressed VARCHAR(52) NOT NULL,
    wif_uncompressed VARCHAR(52) NOT NULL,
    address_compressed VARCHAR(62),
    address_uncompressed VARCHAR(62),
    mode VARCHAR(10) NOT NULL,
    bits BIGINT NOT NULL,
    discovery_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    matrix_coordinates JSONB,
    processing_time_ms BIGINT,
    lines_processed BIGINT,

-- CONSTRAINTS:
    CONSTRAINT ovo_ia_puzzles_encontrados_hex_check 
        CHECK (length(hex_private_key) = 64),
    CONSTRAINT ovo_ia_puzzles_encontrados_preset_check 
        CHECK (preset >= 1 AND preset <= 256),
    CONSTRAINT ovo_ia_puzzles_encontrados_mode_check 
        CHECK (mode IN ('horizontal', 'vertical')),

-- INDICES:
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_preset ON ovo_ia_puzzles_encontrados(preset);
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_hex_private_key ON ovo_ia_puzzles_encontrados USING hash (hex_private_key);
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_discovery_timestamp ON ovo_ia_puzzles_encontrados(discovery_timestamp);
CREATE INDEX IF NOT EXISTS idx_ovo_ia_puzzles_encontrados_mode ON ovo_ia_puzzles_encontrados(mode);

-- CONSTRAINT_UNIQUE:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'ovo_ia_puzzles_encontrados_hex_unique'
    ) THEN
        ALTER TABLE ovo_ia_puzzles_encontrados 
        ADD CONSTRAINT ovo_ia_puzzles_encontrados_hex_unique 
        UNIQUE (hex_private_key);
    END IF;
END $$;

-- TRIGGER_UPDATED_AT:
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

-- COMENTARIOS:
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

-- RLS_POLICIES:
ALTER TABLE ovo_ia_puzzles_encontrados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert discoveries" ON ovo_ia_puzzles_encontrados
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow read discoveries" ON ovo_ia_puzzles_encontrados
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow service updates" ON ovo_ia_puzzles_encontrados
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow service deletes" ON ovo_ia_puzzles_encontrados
    FOR DELETE
    TO service_role
    USING (true);
```

### **📊 Tabela de Estatísticas (Simples):**
```sql
-- CAMPOS_PRINCIPAIS:
    preset BIGINT NOT NULL,
    total_puzzles BIGINT DEFAULT 0,
    horizontal_count BIGINT DEFAULT 0,
    vertical_count BIGINT DEFAULT 0,
    last_discovery TIMESTAMP WITH TIME ZONE,

-- CONSTRAINTS:
    CONSTRAINT ovo_ia_estatisticas_preset_check 
        CHECK (preset >= 1 AND preset <= 256),
    CONSTRAINT ovo_ia_estatisticas_counts_check 
        CHECK (total_puzzles >= 0 AND horizontal_count >= 0 AND vertical_count >= 0),

-- INDICES:
CREATE INDEX IF NOT EXISTS idx_ovo_ia_estatisticas_preset ON ovo_ia_estatisticas(preset);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ovo_ia_estatisticas_preset_unique ON ovo_ia_estatisticas(preset);

-- CONSTRAINT_UNIQUE:
-- (Já existe no índice único acima)

-- TRIGGER_UPDATED_AT:
CREATE OR REPLACE FUNCTION update_ovo_ia_estatisticas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_ovo_ia_estatisticas_updated_at
    BEFORE UPDATE ON ovo_ia_estatisticas
    FOR EACH ROW
    EXECUTE FUNCTION update_ovo_ia_estatisticas_updated_at();

-- COMENTARIOS:
COMMENT ON TABLE ovo_ia_estatisticas IS 'Estatísticas de puzzles encontrados por preset';
COMMENT ON COLUMN ovo_ia_estatisticas.preset IS 'Número do preset';
COMMENT ON COLUMN ovo_ia_estatisticas.total_puzzles IS 'Total de puzzles encontrados';
COMMENT ON COLUMN ovo_ia_estatisticas.horizontal_count IS 'Puzzles encontrados no modo horizontal';
COMMENT ON COLUMN ovo_ia_estatisticas.vertical_count IS 'Puzzles encontrados no modo vertical';
COMMENT ON COLUMN ovo_ia_estatisticas.last_discovery IS 'Data da última descoberta';

-- RLS_POLICIES:
ALTER TABLE ovo_ia_estatisticas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read statistics" ON ovo_ia_estatisticas
    FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "Allow service statistics" ON ovo_ia_estatisticas
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
```

---

## 📋 MELHORES PRÁTICAS

### **🔧 Índices:**
- **Hash**: Para colunas textuais longas
- **B-tree**: Para valores exatos e ordenação
- **Compostos**: Para consultas frequentes

### **🛡️ Constraints:**
- **CHECK**: Validação de dados
- **UNIQUE**: Prevenção de duplicatas
- **FOREIGN KEY**: Relacionamentos (se necessário)

### **🔐 Segurança:**
- **RLS**: Sempre habilitado
- **Políticas granulares**: Por tipo de operação
- **Princípio do menor privilégio**

### **📝 Documentação:**
- **Comentários**: Em todas as tabelas/colunas
- **Nomenclatura**: Padrão e consistente
- **Propósito**: Claro e objetivo

---

## 📋 VALIDAÇÃO AUTOMÁTICA

### **✅ Checklist antes de executar:**
1. **Prefixo**: `ovo_ia_` presente?
2. **Nomenclatura**: snake_case?
3. **Índices**: Otimizados para uso?
4. **Constraints**: Validações necessárias?
5. **RLS**: Políticas definidas?
6. **Comentários**: Documentação completa?

### **🔍 Testes pós-criação:**
```sql
-- Verificar estrutura
\d ovo_ia_nome_tabela

-- Testar inserção
INSERT INTO ovo_ia_nome_tabela (campos) VALUES (valores);

-- Verificar índices
\d+ ovo_ia_nome_tabela

-- Testar constraints
INSERT INTO ovo_ia_nome_tabela (campos) VALUES (valores_inválidos);
```

---

## 📋 INTEGRAÇÃO COM SISTEMA

### **🔗 JavaScript Integration:**
```javascript
// Template de manager para tabelas
class OvoIaTableManager {
  constructor(tableName, supabaseUrl, supabaseKey) {
    this.tableName = `ovo_ia_${tableName}`;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }
  
  async insert(data) {
    // Implementação genérica
  }
  
  async findAll(options = {}) {
    // Implementação genérica
  }
  
  async findById(id) {
    // Implementação genérica
  }
  
  async update(id, data) {
    // Implementação genérica
  }
  
  async delete(id) {
    // Implementação genérica
  }
}
```

### **📋 Uso em projetos:**
1. **Copiar template**: `templates/sql-template.md`
2. **Substituir variáveis**: `{{VARIAVEL}}`
3. **Validar sintaxe**: PostgreSQL compatível
4. **Executar**: Supabase SQL Editor
5. **Testar**: Inserções e consultas

---

## 🎯 BENEFÍCIOS DO TEMPLATE

### **✅ Padronização:**
- Estrutura consistente
- Nomenclatura padronizada
- Documentação obrigatória

### **✅ Produtividade:**
- Copy-paste adaptável
- Variáveis claras
- Exemplos prontos

### **✅ Qualidade:**
- Best practices incluídas
- Performance otimizada
- Segurança implementada

**Template universal para qualquer tabela do projeto OVO IA!** 🎯✨
