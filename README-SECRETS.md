# 🔐 CONFIGURAÇÃO DE SECRETS - SUPABASE

## 📋 VISÃO GERAL

Este projeto utiliza um sistema de configuração dinâmica que diferencia entre ambiente local (XAMPP) e produção (GitHub Pages), garantindo a segurança das credenciais do Supabase.

---

## 🏗️ ARQUITETURA DE CONFIGURAÇÃO

### **Ambiente Local (XAMPP)**
- ✅ **Hostname**: `localhost`, `127.0.0.1`, `192.168.x.x`, `10.x.x.x`, `172.x.x.x`
- ✅ **Configuração**: Dados reais do Supabase embutidos no código
- ✅ **Debug**: Logs detalhados e modo desenvolvedor

### **Produção (GitHub Pages)**
- ✅ **Hostname**: `canalqb.github.io`
- ✅ **Configuração**: Secrets injetados via GitHub Actions
- ✅ **Segurança**: Dados sensíveis protegidos

---

## 🔧 CONFIGURAÇÃO DOS SECRETS

### **1. Acesse os Secrets do GitHub**
```
https://github.com/canalqb/canalqb.github.io/settings/secrets/actions
```

### **2. Configure os Secrets**

#### **SECRET: `SUPABASE_URL`**
```
https://dhpzusdynwpnsejnlzvf.supabase.co
```

#### **SECRET: `SUPABASE_KEY`**
```
sb_publishable_CzrMyXDeFQmd1cTZ4Uls3A_l83xJJsa
```

---

## 📝 OBTENDO AS CHAVES DO SUPABASE

### **Acesse o Dashboard**
```
https://supabase.com/dashboard/project/dhpzusdynwpnsejnlzvf/settings/api-keys
```

### **Chaves Necessárias**

#### **1. Project URL**
- **Nome**: `SUPABASE_URL`
- **Valor**: `https://dhpzusdynwpnsejnlzvf.supabase.co`
- **Localização**: Dashboard → Settings → API → Project URL

#### **2. Anon/Public Key**
- **Nome**: `SUPABASE_KEY`
- **Valor**: `sb_publishable_CzrMyXDeFQmd1cTZ4Uls3A_l83xJJsa`
- **Localização**: Dashboard → Settings → API → Project API keys → anon/public (copie a chave completa)

---

## 🔄 COMO FUNCIONA

### **1. Build no GitHub Actions**
```yaml
# O workflow cria um arquivo js/secrets-config.js
# com os secrets injetados dinamicamente
window.SUPABASE_URL = '${{ secrets.SUPABASE_URL }}';
window.SUPABASE_KEY = '${{ secrets.SUPABASE_KEY }}';
```

### **2. Carregamento no Frontend**
```javascript
// GitHub Secrets Loader detecta o ambiente
if (window.SUPABASE_URL && window.SUPABASE_KEY) {
  // Usa secrets do GitHub Actions
} else {
  // Usa configuração local (XAMPP)
}
```

### **3. Config Manager**
```javascript
// Gerencia qual configuração usar baseado no hostname
const config = this.isLocal ? localConfig : githubSecrets;
```

---

## 🛡️ SEGURANÇA

### **✅ O que é SEGURO**
- **Secrets no GitHub**: Criptografados e não expostos no frontend
- **Configuração local**: Apenas para desenvolvimento
- **Variáveis globais**: Injetadas apenas durante o build

### **❌ O que NÃO fazer**
- **Nunca** commitar chaves reais no repositório
- **Nunca** usar service keys no frontend
- **Nunca** expor database connection strings

---

## 🧪 TESTANDO A CONFIGURAÇÃO

### **Local (XAMPP)**
```bash
# Acesse: http://localhost/canalqb.github.io/
# Console deve mostrar: "🔧 Config Manager: Modo Desenvolvimento (XAMPP)"
# Banner verde deve aparecer: "Ambiente de Desenvolvimento (XAMPP)"
```

### **Produção (GitHub Pages)**
```bash
# Acesse: https://canalqb.github.io/
# Console deve mostrar: "🔑 Secrets do GitHub carregados"
# Banner azul deve aparecer: "GitHub Pages - Produção"
```

---

## 🔍 VERIFICAÇÃO

### **Verificar se os Secrets estão funcionando**
```javascript
// No console do navegador
console.log('Supabase URL:', window.SUPABASE_URL);
console.log('Supabase Key:', window.SUPABASE_KEY);
console.log('Config Manager:', window.ConfigManager.getSafeConfig());
```

### **Verificar no GitHub Actions**
1. Vá para: `Actions` → `Deploy to GitHub Pages`
2. Clique no build mais recente
3. Verifique o log: `Replace Supabase placeholders`
4. Confirme: `✅ All Supabase placeholders replaced`

---

## 🚨 SOLUÇÃO DE PROBLEMAS

### **Problema: Secrets não aparecem**
```bash
# Verifique se os secrets estão configurados corretamente
# Nome exato: SUPABASE_URL e SUPABASE_KEY
# Sem espaços ou caracteres especiais
```

### **Problema: Supabase não conecta**
```bash
# Verifique se as chaves estão corretas
# Confirme se o projeto Supabase está ativo
# Verifique se as permissões estão configuradas
```

### **Problema: Ambiente não detectado**
```bash
# Verifique o hostname no console
# Local: localhost, 127.0.0.1, 192.168.x.x
# Produção: canalqb.github.io
```

---

## 📁 ARQUIVOS RELACIONADOS

```
js/config-manager.js          # Gerenciador principal de configuração
js/github-secrets-loader.js   # Carrega secrets do GitHub Actions
js/supabase-config.js         # Configuração do Supabase (dinâmica)
js/secrets-config.js          # Gerado automaticamente (não commitar)
config/local-config.json      # Configuração local (apenas XAMPP)
.github/workflows/deploy.yml  # Workflow com injeção de secrets
```

---

## 🔄 FLUXO COMPLETO

1. **Desenvolvimento Local**: Usa configuração embutida
2. **Push para GitHub**: Dispara GitHub Actions
3. **Build**: Injeta secrets nos arquivos
4. **Deploy**: Publica no GitHub Pages
5. **Produção**: Carrega secrets dinamicamente

---

## 📞 SUPORTE

### **CanalQb**
- **Blog**: http://canalqb.blogspot.com/
- **GitHub**: https://github.com/canalqb
- **YouTube**: CanalQb

---

## ⚠️ AVISO IMPORTANTE

**NUNCA** compartilhe os secrets do Supabase publicamente. 
Eles devem permanecer apenas nos secrets do GitHub Actions.

**SEMPRE** verifique se os secrets estão corretos antes de fazer deploy.

**NUNCA** use service keys ou database connection strings no frontend.

---

*Última atualização: 2025-03-05*
