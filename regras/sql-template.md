# 🗄️ TEMPLATE SQL UNIVERSAL - SUPABASE

## 📋 ESTRUTURA PADRÃO PARA TABELAS

### **🔧 Nomenclatura:**
- **Prefixo**: Sem prefixo (tabelas normais)
- **Prefixo especial**: `ovo_ia_` (APENAS para tabelas de chat)
- **Formato**: `{nome_descritivo_snake_case}`
- **Exemplo**: `puzzles_encontrados` (normal)
- **Exemplo chat**: `ovo_ia_puzzles_encontrados` (chat)

### **🏗️ Estrutura Base:**
```sql
-- ============================================
-- TABELA: {{NOME_DESCRITIVO}}
-- ============================================
-- Finalidade: {{FINALIDADE}}
-- Projeto: {{PROJETO}}

CREATE TABLE IF NOT EXISTS {{PREFIXO}}{{NOME_TABELA}} (
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
- `{{PREFIXO}}`: Prefixo (vazio ou `ovo_ia_`)
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

### **🧩 Tabela Normal (sem prefixo):**
```markdown
-- PREFIXO: ""
-- NOME_TABELA: "puzzles_encontrados"
-- RESULTADO: "puzzles_encontrados"
```

### **� Tabela de Chat (com prefixo):**
```markdown
-- PREFIXO: "ovo_ia_"
-- NOME_TABELA: "chat_messages"
-- RESULTADO: "ovo_ia_chat_messages"
```

---

## 📋 MELHORES PRÁTICAS

### **🔧 Índices:**
- **Hash**: Para colunas textuais longas
- **Sem `(191)`**: PostgreSQL faz o truncamento automaticamente
- **Performance**: Melhor para buscas exatas

### **🛡️ Constraints:**
- **CHECK**: Validação de dados
- **UNIQUE**: Prevenção de duplicatas
- **FOREIGN KEY**: Relacionamentos (se necessário)

### **🔐 Segurança:**
- **RLS**: Habilitado apenas para tabelas sensíveis
- **Políticas granulares**: Por tipo de operação
- **Princípio do menor privilégio**

### **📝 Documentação:**
- **Comentários**: Em todas as tabelas e colunas principais
- **Nomenclatura**: Padrão e consistente
- **Propósito**: Claro e objetivo

---

## 📋 VALIDAÇÃO AUTOMÁTICA

### **✅ Checklist antes de executar:**
1. **Prefixo**: Correto para tipo de tabela?
2. **Nomenclatura**: snake_case?
3. **Índices**: Otimizados para uso?
4. **Constraints**: Validações necessárias?
5. **RLS**: Políticas definidas (se necessário)?
6. **Comentários**: Documentação completa?

### **🔍 Testes pós-criação:**
```sql
-- Verificar estrutura
\d nome_tabela

-- Testar inserção
INSERT INTO nome_tabela (campos) VALUES (valores);

-- Verificar índices
\d+ nome_tabela

-- Testar constraints
INSERT INTO nome_tabela (campos) VALUES (valores_inválidos);
```

---

## 📋 INTEGRAÇÃO COM SISTEMA

### **🔗 JavaScript Integration:**
```javascript
// Template de manager para tabelas
class TableManager {
  constructor(tableName, supabaseUrl, supabaseKey, isChatTable = false) {
    this.prefixo = isChatTable ? 'ovo_ia_' : '';
    this.tableName = `${this.prefixo}${tableName}`;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
  }
  
  async insert(data) {
    // Implementação genérica
  }
}
```

### **📋 Uso em projetos:**
1. **Copiar template**: `templates/sql-template.md`
2. **Substituir variáveis**: `{{VARIAVEL}}`
3. **Definir prefixo**: Vazio ou `ovo_ia_`
4. **Validar sintaxe**: PostgreSQL compatível
5. **Executar**: Supabase SQL Editor
6. **Testar**: Inserções e consultas

---

## 🎯 BENEFÍCIOS DO TEMPLATE

### **✅ Padronização:**
- Estrutura consistente
- Nomenclatura flexível
- Documentação obrigatória

### **✅ Produtividade:**
- Copy-paste adaptável
- Variáveis claras
- Exemplos prontos

### **✅ Qualidade:**
- Best practices incluídas
- Performance otimizada
- Segurança implementada

**Template universal para qualquer tabela do projeto!** 🎯✨
