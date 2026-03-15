# 🔧 DEBUG - CELL PERCENT CONFIG

**Problema:** Logs não aparecem ou mostram `[object HTMLInputElement]`

---

## ✅ SOLUÇÃO IMPLEMENTADA

Adicionados **logs detalhados em cada etapa** do script para identificar exatamente onde está o problema.

---

## 📋 SEQUÊNCIA DE LOGS ESPERADA

Ao recarregar a página (F5), você deve ver no console:

```
1. ⚙️ Cell Percent Config (alta precisão) initialized
2. 🔍 Procurando .speed-row: [elemento div]
3. ✅ Config div inserted successfully
4. 🔍 Min input: [elemento input]
5. 🔍 Max input: [elemento input]
6. ✅ Inputs encontrados, configurando event listeners...
7. 📊 Valor inicial Mínimo: 0.001
8. 📊 Valor inicial Máximo: 99.999
9. 🔧 Configurando listener para Mínimo...
10. 🔧 Configurando listener para Máximo...
11. 🔧 Configurando listeners para tecla Enter...
12. ✅ Cell Percent Config loaded successfully (alta precisão)
13. 🎉 Configuração completa! Digite valores e pressione Enter.
```

---

## 🧪 COMO TESTAR

### **Passo 1: Abra o Console**
```
Pressione F12 → Aba "Console"
```

### **Passo 2: Recarregue a Página**
```
Pressione F5 ou Ctrl+R
```

### **Passo 3: Verifique os Logs**
Os logs devem aparecer na ordem acima.

### **Passo 4: Teste Digitação**
```
1. Clique no campo "Mínimo (%)"
2. Digite: 0.000000000001
3. Pressione ENTER
4. Console deve mostrar:
   📝 Evento change disparado no Mínimo
   🔍 Valor digitado: 0.000000000001 → parseFloat: 1e-12
   ✅ Mínimo atualizado: 0.000000000001% → 1 células
```

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### **Problema 1: Nenhum log aparece**
**Causa:** Script não está sendo carregado

**Solução:**
```javascript
// Verificar se script está no HTML
// index.html deve ter na linha ~2451:
<script src="js/cell-percent-config.js"></script>
```

### **Problema 2: Log 1 aparece, resto não**
**Causa:** Erro no setTimeout ou DOM não carregado

**Solução:**
```javascript
// O script já tem setTimeout de 100ms
// Se ainda falhar, aumentar para 500ms:
}, 500); // Em vez de 100
```

### **Problema 3: Logs param em "Inputs não encontrados"**
**Causa:** `.speed-row` não existe ou selector falhou

**Solução:**
```javascript
// Verificar se .speed-row existe no HTML:
document.querySelector('.speed-row')
// Deve retornar: <div class="speed-row">...</div>

// Se retornar null, verificar HTML:
// index.html deve ter:
<div class="speed-row">
  <label for="speed" class="speed-label">
    <i class="fas fa-tachometer-alt"></i> Velocidade: <span id="speedValue">50</span>ms
  </label>
  ...
</div>
```

### **Problema 4: Inputs são [object HTMLInputElement]**
**Causa:** Normal! Isso significa que a variável contém o elemento HTML

**Solução:**
```javascript
// Para ver o valor, use:
console.log('Min input value:', minInput.value);
// Não apenas:
console.log('Min input:', minInput); // Mostra [object HTMLInputElement]
```

### **Problema 5: Digita e não mostra logs do change**
**Causa:** Event listener não está funcionando

**Solução:**
```javascript
// Testar manualmente no console:
const minInput = document.getElementById('minCellPercent');
minInput.value = '0.000000000001';
minInput.dispatchEvent(new Event('change'));

// Deve mostrar:
// 📝 Evento change disparado no Mínimo
// 🔍 Valor digitado: 0.000000000001 → parseFloat: 1e-12
// ✅ Mínimo atualizado: 0.000000000001% → 1 células
```

### **Problema 6: Enter não funciona**
**Causa:** Listener do keypress não está disparando

**Solução:**
```javascript
// Testar manualmente:
const minInput = document.getElementById('minCellPercent');
minInput.focus();
minInput.dispatchEvent(new KeyboardEvent('keypress', {'key': 'Enter'}));

// Deve mostrar:
// ⌨️ Tecla Enter pressionada!
// 📝 Evento change disparado no Mínimo
// ✅ Valor confirmado via Enter!
```

---

## 🔍 DIAGNÓSTICO RÁPIDO

Execute no console:

```javascript
// 1. Verificar se script carregou
typeof window.minCellPercent
// Deve ser: "number" ou "undefined"

// 2. Verificar se elementos existem
document.getElementById('minCellPercent')
// Deve retornar: <input type="text" id="minCellPercent" ...>

// 3. Verificar valor atual
document.getElementById('minCellPercent').value
// Deve retornar: "0.001" ou valor digitado

// 4. Forçar atualização manual
window.minCellPercent = 0.000000000001;
console.log(`✅ Mínimo: ${window.minCellPercent}% → ${convertPercentToCells(window.minCellPercent)} células`);
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Marque cada item conforme testa:

- [ ] Console mostra pelo menos 1 log ao carregar
- [ ] Console mostra todos os 13 logs em sequência
- [ ] Elementos aparecem na página (caixas de texto visíveis)
- [ ] Pode digitar nos campos
- [ ] Pressionar Enter dispara evento change
- [ ] Console mostra logs do change após Enter
- [ ] Valores válidos mostram "✅ Mínimo/Máximo atualizado"
- [ ] Valores inválidos mostram "❌ Valor inválido"
- [ ] Função `convertPercentToCells()` funciona

---

## 🎯 PRÓXIMOS PASSOS

Se TODOS os logs aparecem mas ainda não funciona:

1. **Verifique erro de JavaScript** no console (pode ter erro antes)
2. **Teste valores simples** primeiro: `1`, `50`, `0.01`
3. **Evite vírgula**, use apenas ponto: `0.001` ✅, `0,001` ❌
4. **Pressione ENTER** após digitar (ou clique fora)

Se NENHUM log aparece:

1. **Verifique se script está incluído** no index.html
2. **Verifique erros no console** (aba "Errors")
3. **Tente recarregar sem cache**: Ctrl+Shift+R

---

## 📞 PRECISA DE MAIS AJUDA?

Compartilhe:
1. Screenshot do console (F12 → Console)
2. Quais logs aparecem
3. Em qual log para
4. Erros vermelhos se tiver

Isso vai ajudar a diagnosticar exatamente onde está o problema!
