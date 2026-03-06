# 📋 Guia Completo de Integração Supabase + Bitcoin Puzzle Tracker

## 🎯 Visão Geral

Este guia explica como integrar seu projeto Bitcoin Puzzle Tracker com o Supabase para rastreamento distribuído de progresso entre múltiplos usuários.

### ✅ O que será implementado:

- **Rastreamento distribuído**: Múltiplos usuários podem processar diferentes partes do mesmo intervalo
- **Sincronização automática**: O banco de dados é atualizado a cada 1000 linhas processadas
- **Segurança**: Row Level Security (RLS) com validações server-side
- **Deploy seguro**: GitHub Actions com placeholders e secrets
- **Interface visual**: Status em tempo real do progresso do banco

---

## 🗂️ Estrutura de Arquivos

### Arquivos Criados/Modificados:

```
📁 js/
├── supabase-config.js              # ✅ Cliente Supabase com BigInt
├── progress-tracker.js             # ✅ Gerenciador de progresso
├── environment-detector.js        # ✅ Detecção de ambiente (já existia)
├── auto16-modified.js             # ✅ Versão com integração Supabase
├── preset-ranges-modified.js      # ✅ Versão com consulta Supabase
└── adsense-manager-modified.js    # ✅ Versão com detecção de ambiente

📁 css/
└── database-status.css            # ✅ Estilos da seção de status

📁 .github/workflows/
└── deploy.yml                     # ✅ GitHub Actions para deploy seguro

📄 supabase-setup.sql             # ✅ SQL completo para Supabase
📄 database-status.html            # ✅ HTML da seção de status
```

---

## 🔧 Passo 1: Configurar Supabase

### 1.1 Criar Projeto Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Faça login com GitHub
4. Clique em "New Project"
5. Escolha sua organização
6. Configure o projeto:
   - **Project Name**: `bitcoin-puzzle-tracker`
   - **Database Password**: Crie uma senha forte e guarde-a
   - **Region**: Escolha a mais próxima dos seus usuários
7. Aguarde a criação do projeto (2-3 minutos)

### 1.2 Executar SQL de Configuração

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em **New query**
3. Copie todo o conteúdo do arquivo `supabase-setup.sql`
4. Cole no editor e clique em **Run**

O script irá:
- ✅ Criar tabela `puzzle_progress`
- ✅ Habilitar Row Level Security (RLS)
- ✅ Criar políticas de segurança
- ✅ Inserir dados iniciais (presets 0-256)
- ✅ Criar índices e views para performance

### 1.3 Obter Credenciais

1. No painel Supabase, vá para **Settings** → **API**
2. Copie os seguintes valores:

```
🔑 Project URL: https://dhpzusdynwpnsejnlzvf.supabase.co
🔑 anon/public Key: sb_publishable_ZOpNfIGoHpzmx9h53xQSWw_0bf4_xb2
```

**IMPORTANTE**: Nunca exponha a `service_role` key no frontend!

---

## 🔐 Passo 2: Configurar GitHub Secrets

### 2.1 Adicionar Secrets ao Repositório

1. Vá para seu repositório GitHub
2. Clique em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | `https://dhpzusdynwpnsejnlzvf.supabase.co` |
| `SUPABASE_ANON_KEY` | `sb_publishable_ZOpNfIGoHpzmx9h53xQSWw_0bf4_xb2` |

### 2.2 Configurar Permissões do GitHub Actions

1. Vá para **Settings** → **Actions** → **General**
2. Em **Workflow permissions**, selecione:
   - ✅ **Read and write permissions**
   - ✅ **Allow GitHub Actions to create and approve pull requests**
3. Clique em **Save**

---

## 🚀 Passo 3: Configurar GitHub Pages

### 3.1 Habilitar GitHub Pages

1. Vá para **Settings** → **Pages**
2. Em **Build and deployment**, configure:
   - **Source**: Deploy from a branch
   - **Branch**: `gh-pages`
   - **Folder**: `/root`
3. Clique em **Save**

### 3.2 Configurar Branch gh-pages

O workflow automaticamente criará e publicará no branch `gh-pages`.

---

## 📝 Passo 4: Atualizar HTML Principal

### 4.1 Adicionar Scripts na Ordem Correta

No seu `index.html`, adicione os scripts nesta ordem exata:

```html
<!-- Bibliotecas externas -->
<script src="https://cdn.jsdelivr.net/npm/bitcoinjs-lib-browser@5.1.7/bitcoinjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Ordem CRÍTICA dos scripts -->
<script src="js/environment-detector.js"></script>           <!-- 1º -->
<script src="js/supabase-config.js"></script>                <!-- 2º -->
<script src="js/progress-tracker.js"></script>               <!-- 3º -->
<script src="js/auto16-modified.js"></script>                 <!-- 4º -->
<script src="js/preset-ranges-modified.js"></script>          <!-- 5º -->
<!-- ... outros scripts existentes ... -->
<script src="js/adsense-manager-modified.js"></script>        <!-- último -->

<!-- CSS adicional -->
<link rel="stylesheet" href="css/database-status.css" />
```

### 4.2 Adicionar Seção de Status

Copie o conteúdo do arquivo `database-status.html` e cole no local desejado do seu `index.html` (recomendado após a seção de presets).

```html
<!-- Cole aqui o conteúdo completo de database-status.html -->
```

---

## 🧪 Passo 5: Testar Localmente

### 5.1 Configurar Ambiente Local

1. Certifique-se de que os arquivos modificados estão no lugar:
   ```bash
   # Substitua os arquivos originais pelos modificados
   cp js/auto16-modified.js js/auto16.js
   cp js/preset-ranges-modified.js js/preset-ranges.js
   cp js/adsense-manager-modified.js js/adsense-manager.js
   ```

2. Inicie seu servidor local:
   ```bash
   # Se usar XAMPP
   # Acesse: http://localhost/canalqb.github.io/
   
   # Ou use servidor Python
   python -m http.server 8000
   # Acesse: http://localhost:8000
   ```

### 5.2 Testes no Console

Abra o console do navegador (F12) e execute:

```javascript
// 1. Verificar ambiente
window.EnvironmentDetector.getInfo()
// Deve retornar: {environment: "development", adsenseEnabled: false}

// 2. Testar Supabase
await window.SupabaseDB.test()
// Deve retornar: true

// 3. Consultar preset
await window.SupabaseDB.fetch(71)
// Deve retornar: {preset: 71, inicio: "...", fim: "...", updated_at: "..."}

// 4. Verificar status do tracker
window.ProgressTracker.getStatus()
// Deve retornar objeto com status atual

// 5. Testar atualização (deve bloquear se valores inválidos)
await window.SupabaseDB.update(71, "0800...0000", "0fff...ffff")
```

### 5.3 Testar Funcionalidades

1. **Selecionar Preset**: Escolha um preset (ex: 71)
2. **Aplicar Preset**: Clique em "Aplicar Preset"
3. **Verificar Status**: A seção de status deve aparecer mostrando:
   - Intervalo HEX já processado
   - Progresso em porcentagem
   - Timestamp da última atualização
4. **Iniciar Processamento**: Clique em "Iniciar Sequencial"
5. **Acompanhar**: O modal de progresso deve aparecer
6. **Após 1000 linhas**: O banco deve ser atualizado automaticamente

---

## 🚀 Passo 6: Deploy para Produção

### 6.1 Fazer Commit e Push

```bash
git add .
git commit -m "feat: Add Supabase integration with distributed progress tracking"
git push origin main
```

### 6.2 Acompanhar Deploy

1. Vá para **Actions** no seu repositório GitHub
2. Clique no workflow em execução
3. Aguarde a conclusão (2-3 minutos)

O workflow irá:
- ✅ Substituir placeholders pelas credenciais reais
- ✅ Minificar JavaScript e HTML
- ✅ Validar sintaxe e segurança
- ✅ Fazer deploy para GitHub Pages

### 6.3 Verificar Produção

1. Acesse: `https://seu-usuario.github.io/repositorio/`
2. Abra o console e verifique:
   ```javascript
   window.EnvironmentDetector.getInfo()
   // Deve retornar: {environment: "production", adsenseEnabled: true}
   ```

---

## 🔍 Passo 7: Validação e Monitoramento

### 7.1 Verificar Tabela Supabase

1. No painel Supabase, vá para **Table Editor**
2. Selecione a tabela `puzzle_progress`
3. Verifique se:
   - ✅ Todos os presets (0-256) existem
   - ✅ Colunas `inicio` e `fim` têm 64 caracteres hexadecimais
   - ✅ `updated_at` está sendo atualizado

### 7.2 Monitorar Logs

No console do navegador em produção:

```javascript
// Verificar conexões
window.SupabaseDB.getClient()

// Monitorar atualizações
window.addEventListener('progressUpdated', (e) => {
  console.log('Progresso atualizado:', e.detail);
});

// Verificar performance
console.time('supabase-query');
await window.SupabaseDB.fetch(71);
console.timeEnd('supabase-query');
```

### 7.3 Estatísticas de Uso

```sql
-- No painel SQL do Supabase
SELECT 
  preset,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 AS minutes_ago
FROM public.puzzle_progress 
ORDER BY updated_at DESC 
LIMIT 10;

-- Presets mais ativos
SELECT 
  preset,
  COUNT(*) as updates
FROM public.puzzle_progress 
WHERE updated_at > NOW() - INTERVAL '24 hours'
GROUP BY preset
ORDER BY updates DESC;
```

---

## 🛠️ Personalização

### 7.1 Ajustar Linhas por Atualização

```javascript
// No console ou no código
window.ProgressTracker.setLinhasPorAtualizacao(500); // Padrão: 1000
```

### 7.2 Modificar Políticas de Segurança

No painel SQL do Supabase:

```sql
-- Aumentar limite de atualização
ALTER POLICY "Allow valid updates only" ON public.puzzle_progress
USING (true)
WITH CHECK (
  -- ... outras validações ...
  ('x' || NEW.inicio)::bigint - ('x' || OLD.inicio)::bigint <= 2000000 -- 2M em vez de 1M
);
```

### 7.3 Adicionar Campos Personalizados

```sql
-- Adicionar campo de estatísticas
ALTER TABLE public.puzzle_progress 
ADD COLUMN total_processed BIGINT DEFAULT 0,
ADD COLUMN processing_users INTEGER DEFAULT 1;

-- Atualizar política para incluir novos campos
ALTER POLICY "Allow valid updates only" ON public.puzzle_progress
WITH CHECK (
  -- ... validações existentes ...
  NEW.total_processed >= OLD.total_processed
);
```

---

## 🚨 Solução de Problemas

### Problemas Comuns

#### 1. "Supabase não inicializado"

**Causa**: Biblioteca Supabase não carregada
**Solução**:
```html
<!-- Verifique se o script está antes dos outros -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-config.js"></script>
```

#### 2. "Placeholders não substituídos"

**Causa**: Secrets não configurados no GitHub
**Solução**:
1. Verifique os secrets em Settings → Secrets
2. Faça um novo commit para acionar o workflow

#### 3. "RLS policy violation"

**Causa**: Tentativa de atualização inválida
**Solução**:
```javascript
// Verifique se está tentando incrementar corretamente
const current = await window.SupabaseDB.fetch(71);
const novoInicio = window.ProgressTracker.utils.incrementHex(current.inicio, 1000);
const novoFim = window.ProgressTracker.utils.decrementHex(current.fim, 1000);
```

#### 4. "AdSense não funciona em produção"

**Causa**: Environment detector incorreto
**Solução**:
```javascript
// Verifique detecção de ambiente
window.EnvironmentDetector.getInfo();
// Force se necessário
window.EnvironmentDetector.forceEnvironment('production');
```

### Debug Avançado

```javascript
// Habilitar modo debug
localStorage.setItem('debug', 'true');

// Verificar todas as APIs
console.log('SupabaseDB:', window.SupabaseDB);
console.log('ProgressTracker:', window.ProgressTracker);
console.log('EnvironmentDetector:', window.EnvironmentDetector);
console.log('DatabaseStatus:', window.DatabaseStatus);

// Testar conexão completa
async function fullTest() {
  try {
    await window.SupabaseDB.test();
    const data = await window.SupabaseDB.fetch(71);
    console.log('✅ Teste completo:', data);
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}
fullTest();
```

---

## 📈 Performance e Otimização

### Recomendações

1. **Cache Local**: Implemente cache para reduzir chamadas ao Supabase
2. **Batch Updates**: Considere atualizar em lote para menos requisições
3. **Compression**: Use gzip no servidor
4. **CDN**: Sirva arquivos estáticos via CDN

### Monitoramento

```javascript
// Monitore performance das operações
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.name.includes('supabase')) {
      console.log(`Supabase operation: ${entry.duration}ms`);
    }
  });
});
observer.observe({entryTypes: ['measure']});
```

---

## 🔐 Segurança Adicional

### Best Practices

1. **Never expose service_role key**: Apenas use anon key no frontend
2. **Validate on server-side**: Use políticas RLS para todas as validações
3. **Rate limiting**: Implemente limitação de taxa nas políticas
4. **HTTPS**: Sempre use HTTPS em produção
5. **CORS**: Configure CORS adequado no Supabase

### Auditoria

```sql
-- Habilitar auditoria
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- Auditar atualizações na tabela
ALTER TABLE public.puzzle_progress SET (log_row_level = on);

-- Verificar logs
SELECT * FROM pg_audit_log WHERE table_name = 'puzzle_progress';
```

---

## 📚 Referências

- [Documentação Supabase](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [GitHub Actions](https://docs.github.com/en/actions)
- [BigInt JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)

---

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique o console** do navegador para erros
2. **Teste localmente** antes de fazer deploy
3. **Verifique os secrets** no GitHub
4. **Confirme as políticas RLS** no Supabase
5. **Monitore os logs** do GitHub Actions

Para ajuda específica, inclua:
- Screenshot do erro
- Console logs
- Passos reproduzíveis
- Versão do navegador/OS

---

## ✅ Checklist Final

Antes de colocar em produção:

- [ ] Supabase configurado com SQL completo
- [ ] Secrets adicionados ao GitHub
- [ ] GitHub Pages habilitado
- [ ] Scripts na ordem correta no HTML
- [ ] Testes locais funcionando
- [ ] Deploy automatizado testado
- [ ] Monitoramento configurado
- [ ] Backup dos dados

---

**🎉 Parabéns!** Seu Bitcoin Puzzle Tracker agora tem rastreamento distribuído com Supabase!
