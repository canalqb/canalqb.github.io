# 📋 MASTER RULES - OVO IA PROJECT

## 🎯 OBJETIVO

Definir regras e padrões para desenvolvimento de projetos OVO IA, garantindo consistência, qualidade e produtividade.

---

## 🗄️ REGRAS DE BANCO DE DADOS

### **🔧 Nomenclatura de Tabelas:**
- **Prefixo Obrigatório**: `ovo_ia_`
- **Formato**: `ovo_ia_{nome_descritivo_snake_case}`
- **Exemplos**: 
  - `ovo_ia_puzzles_encontrados`
  - `ovo_ia_estatisticas`
  - `ovo_ia_logs_processamento`

### **📋 Campos Obrigatórios:**
```sql
id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### **🔐 Segurança (RLS):**
- **Sempre habilitado**: `ALTER TABLE ovo_ia_* ENABLE ROW LEVEL SECURITY`
- **Políticas mínimas**: 
  - `INSERT` para `anon` (dados públicos)
  - `SELECT` para `anon` (leitura pública)
  - `ALL` para `service_role` (serviço)

### **📝 Documentação:**
- **Comentários obrigatórios** em todas as tabelas e colunas principais
- **Formato**: `COMMENT ON TABLE/COLUMN nome IS 'Descrição clara'`

---

## 📋 TEMPLATES DISPONÍVEIS

### **🗄️ SQL Template:**
- **Arquivo**: `templates/sql-template.md`
- **Finalidade**: Template universal para criação de tabelas
- **Variáveis**: `{{NOME_TABELA}}`, `{{FINALIDADE}}`, etc.
- **Uso**: Copiar, substituir variáveis, executar

### **📋 Exemplos Universais:**
- **Puzzles Encontrados**: Template completo com WIFs
- **Estatísticas**: Template simples de contadores
- **Logs**: Template de auditoria
- **Configurações**: Template de parâmetros

---

## 🚀 PROCESSO DE CRIAÇÃO DE TABELAS

### **📋 Passo 1: Solicitação do Usuário**
1. **Acessar**: `README.html`
2. **Procurar**: Seção "Gerenciamento de Tabelas"
3. **Preencher**: Formulário com:
   - Nome da tabela
   - Finalidade
   - Campos necessários
   - Tipo de acesso (público/restrito)

### **📋 Passo 2: Geração Automática**
1. **Sistema**: Lê `master_rules.md`
2. **Template**: Usa `templates/sql-template.md`
3. **Substituição**: `{{variáveis}}` pelos dados do usuário
4. **Validação**: Verifica sintaxe PostgreSQL
5. **Download**: Gera SQL pronto para execução

### **📋 Passo 3: Execução no Supabase**
1. **Copiar**: SQL gerado
2. **Colar**: Supabase SQL Editor
3. **Executar**: Verificar sucesso
4. **Testar**: Inserção de dados

---

## 🎛️ PADRÕES DE DESENVOLVIMENTO

### **🔧 JavaScript:**
- **Classes**: PascalCase para classes, camelCase para métodos
- **Arquivos**: kebab-case para nomes de arquivos
- **Constants**: UPPER_SNAKE_CASE
- **Eventos**: CustomEvent para comunicação

### **🎨 CSS:**
- **Classes**: kebab-case
- **Variáveis**: CSS custom properties
- **Responsivo**: Mobile-first
- **Framework**: Bootstrap 5 como base

### **📁 Estrutura de Arquivos:**
```
/
├── templates/
│   └── sql-template.md
├── sql/
│   └── create-{tabela}.sql
├── js/
│   └── {modulo}-manager.js
├── examples/
│   └── {modulo}-usage.js
├── master_rules.md
└── README.html
```

---

## 📋 VALIDAÇÃO AUTOMÁTICA

### **✅ Checklist SQL:**
- [ ] Prefixo `ovo_ia_` presente
- [ ] Nomenclatura snake_case
- [ ] Campos obrigatórios incluídos
- [ ] Índices otimizados
- [ ] RLS configurado
- [ ] Comentários documentados

### **✅ Checklist JavaScript:**
- [ ] Classes bem estruturadas
- [ ] Error handling implementado
- [ ] Eventos disparados
- [ ] Documentação via JSDoc
- [ ] Integração com Supabase

---

## 🔧 FERRAMENTAS E UTILITÁRIOS

### **🗄️ Gerador de SQL:**
- **Template**: `templates/sql-template.md`
- **Engine**: Substituição de variáveis
- **Validação**: Sintaxe PostgreSQL
- **Export**: SQL formatado

### **📊 Gerador de Managers:**
- **Base**: Template universal de classe
- **Métodos**: CRUD padrão
- **Integração**: Supabase automática
- **Eventos**: Personalizáveis

### **🧪 Testes Automáticos:**
- **SQL**: Validação de sintaxe
- **JS**: Linting e formatação
- **Integração**: Testes de API
- **Performance**: Benchmarks básicos

---

## 📋 EXEMPLOS UNIVERSAIS

### **🧩 Tabela de Puzzles:**
- **Finalidade**: Registrar WIFs encontrados
- **Campos**: hex_private_key, wif_compressed, mode, etc.
- **Índices**: hash para chaves, btree para consultas
- **Segurança**: Pública para leitura, restrita para escrita

### **📊 Tabela de Estatísticas:**
- **Finalidade**: Contadores e métricas
- **Campos**: preset, total_puzzles, last_discovery
- **Índices**: unique em preset
- **Segurança**: Pública para leitura

### **📝 Tabela de Logs:**
- **Finalidade**: Auditoria de processos
- **Campos**: timestamp, action, details, user_id
- **Índices**: timestamp, action
- **Segurança**: Restrita ao serviço

### **⚙️ Tabela de Configurações:**
- **Finalidade**: Parâmetros do sistema
- **Campos**: key, value, description
- **Índices**: unique em key
- **Segurança**: Pública para leitura

---

## 🔄 PROCESSO DE ATUALIZAÇÃO

### **📋 Versionamento:**
- **SQL**: Sempre criar arquivo em `sql/`
- **Migration**: Arquivos de `migration/`
- **Backup**: Sempre antes de alterar
- **Teste**: Validar em ambiente dev

### **📋 Documentação:**
- **README.md**: Atualizar com mudanças
- **master_rules.md**: Adicionar novas regras
- **templates/**: Manter exemplos atualizados
- **examples/**: Adicionar novos casos

---

## 🎯 MELHORIA CONTÍNUA

### **📈 Métricas:**
- **Performance**: Tempo de resposta
- **Qualidade**: Cobertura de testes
- **Usabilidade**: Feedback dos usuários
- **Manutenibilidade**: Complexidade do código

### **🔄 Revisões:**
- **Semanal**: Revisão de regras
- **Mensal**: Atualização de templates
- **Trimestral**: Refatoração de código
- **Anual**: Revisão arquitetural

---

## 📋 CONTATO E SUPORTE

### **🆘️ Problemas Comuns:**
- **SQL**: Verificar sintaxe PostgreSQL
- **Índices**: Usar tipo correto (hash, btree)
- **RLS**: Configurar políticas corretamente
- **JavaScript**: Tratamento de erros

### **📚 Recursos:**
- **Templates**: `templates/sql-template.md`
- **Exemplos**: `examples/`
- **Documentação**: `README.html`
- **Regras**: `master_rules.md`

---

## 🎯 OBJETIVOS FUTUROS

### **🤖 Automação:**
- **Gerador**: Interface web para criar tabelas
- **Validação**: Testes automáticos de SQL
- **Deploy**: Pipeline de migrações
- **Monitoramento**: Dashboard de performance

### **📚 Documentação:**
- **Interativa**: Tutoriais passo a passo
- **Vídeos**: Demonstrações práticas
- **FAQ**: Perguntas frequentes
- **Wiki**: Base de conhecimento

---

## 📋 CONCLUSÃO

Este documento serve como fonte única de verdade para desenvolvimento no projeto OVO IA, garantindo:

✅ **Consistência** em todos os componentes  
✅ **Qualidade** através de padrões definidos  
✅ **Produtividade** com templates e exemplos  
✅ **Manutenibilidade** com documentação clara  
✅ **Segurança** com melhores práticas  

**Todos os desenvolvedores devem seguir estas regras rigorosamente.** 🎯✨
