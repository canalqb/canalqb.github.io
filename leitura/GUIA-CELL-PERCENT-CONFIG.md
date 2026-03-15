# 🎯 CONFIGURABLE CELL PERCENTAGE SYSTEM

**Data:** 2026-03-10  
**Status:** ✅ IMPLEMENTADO  
**Arquivos:** `js/auto16-preset.js`, `js/cell-percent-config.js`

---

## 📋 **VISÃO GERAL**

Implementado sistema de **porcentagens configuráveis** para controlar número de células geradas:

- **Mínimo (minCellPercent):** 0.001% → 1 célula (padrão para Horizontal)
- **Máximo (maxCellPercent):** 99.999% → 99 células (padrão para Vertical)
- **Ajustável via UI:** Sliders de 0.001% a 99.999% com precisão de 0.001%

---

## 🎯 **COMO FUNCIONA**

### **Fórmula de Conversão:**

```javascript
Porcentagem → Células
0.001%   → 1 célula
0.500%   → 50 células
1.000%   → 1 célula (arredondamento)
50.000%  → 50 células
99.999%  → 99 células

// Fórmula:
normalized = (percent- 0.001) / (99.999 - 0.001)
cells = Math.floor(normalized * 99) + 1
```

### **Variáveis Principais:**

```javascript
// Em auto16-preset.js (linhas 24-29)
let minCellPercent = 0.001;  // Mínimo configurável
let maxCellPercent = 99.999; // Máximo configurável
let horizontalCellCount = 1; // Contador progressivo H
let verticalCellCount = 1;   // Contador progressivo V
const MAX_CELLS = 99;        // Limite máximo
```

---

## 🔧 **INTERFACE DO USUÁRIO**

### **Nova Seção na UI:**

Localização: Abaixo do controle de velocidade

```
╔══════════════════════════════════════════╗
║  📊 Configuração de Células (Porcentagem) ║
╠══════════════════════════════════════════╣
║                                          ║
║  ⬇️ Mínimo (%): 0.001%                   ║
║  [====|================================]  ║
║  Horizontal usa este valor                ║
║                                          ║
║  ⬆️ Máximo (%): 99.999%                  ║
║  [================================|==]  ║
║  Vertical usa este valor                ║
║                                          ║
╚══════════════════════════════════════════╝
```

### **Controles:**

| Controle | Range | Step | Padrão | Uso |
|----------|-------|------|--------|-----|
| **Mínimo** | 0.001 - 99.999 | 0.001 | 0.001 | Horizontal |
| **Máximo** | 0.001 - 99.999 | 0.001 | 99.999 | Vertical |

---

## 💻 **CÓDIGO IMPLEMENTADO**

### **1. Função `convertPercentToCells(percent)`:**

```javascript
/**
 * Converte porcentagem para número de células
 * Ex: 0.001% = 1 célula, 50% = 50 células, 99.999% = 99 células
 */
function convertPercentToCells(percent) {
  const minPercent = 0.001;
  const maxPercent = 99.999;
  const minCells = 1;
  const maxCells = 99;
  
  // Normaliza porcentagem para range 0-1
  const normalized = (percent - minPercent) / (maxPercent - minPercent);
  
  // Mapeia para número de células (arredonda para baixo)
  const cells = Math.floor(normalized * (maxCells - minCells + 1)) + minCells;
  
 return Math.min(Math.max(cells, minCells), maxCells); // Garante 1-99
}
```

### **2. Atualização em `randomizeWithinRange(mode)`:**

```javascript
// 🎯 OBTEM CONTADOR DE CÉLULAS ATUAL (PROGRESSIVO) E CONVERTE PORCENTAGEM
const cellCount = mode === 'horizontal' ? horizontalCellCount : verticalCellCount;
const targetPercent = mode === 'horizontal' ? minCellPercent : maxCellPercent;
const calculatedCells = convertPercentToCells(targetPercent);

console.log(`📊 Configuração: ${targetPercent}% → ${calculatedCells} células`);
console.log(`📊 Progressão Atual: ${cellCount}/${MAX_CELLS} células`);
```

### **3. Script `cell-percent-config.js`:**

```javascript
// Criar controles dinamicamente na UI
const configDiv = document.createElement('div');
configDiv.innerHTML = `
  <h4>📊 Configuração de Células (Porcentagem)</h4>
  
  <!-- Mínimo -->
  <label>Mínimo (%): <span id="minCellPercentValue">0.001</span>%</label>
  <input type="range" id="minCellPercent" 
         min="0.001" max="99.999" value="0.001" step="0.001">
  <small>Horizontal usa este valor</small>
  
  <!-- Máximo -->
  <label>Máximo (%): <span id="maxCellPercentValue">99.999</span>%</label>
  <input type="range" id="maxCellPercent" 
         min="0.001" max="99.999" value="99.999" step="0.001">
  <small>Vertical usa este valor</small>
`;

// Event listeners atualizam variáveis globais
minInput.addEventListener('input', function() {
  const value = parseFloat(this.value);
  window.minCellPercent = value;
  minValueDisplay.textContent = value.toFixed(3);
  console.log(`📊 Mínimo atualizado: ${value}% → ${convertPercentToCells(value)} células`);
});

maxInput.addEventListener('input', function() {
  const value = parseFloat(this.value);
  window.maxCellPercent = value;
  maxValueDisplay.textContent = value.toFixed(3);
  console.log(`📊 Máximo atualizado: ${value}% → ${convertPercentToCells(value)} células`);
});
```

---

## 📊 **EXEMPLOS PRÁTICOS**

### **Exemplo 1: Configuração Padrão**

```javascript
minCellPercent = 0.001%  // → 1 célula
maxCellPercent = 99.999% // → 99 células

Horizontal (usa mínimo):
  Clique 1: 1 célula
  Clique 2: 2 células
  ...
  Clique 99: 99 células

Vertical (usa máximo):
  Clique 1: 1 célula
  Clique 2: 2 células
  ...
  Clique 99: 99 células
```

### **Exemplo 2: Configuração Intermediária**

```javascript
minCellPercent = 10.000%  // → 10 células
maxCellPercent = 50.000%  // → 50 células

Horizontal (usa 10%):
  Sempre gera ~10 células por clique
  
Vertical (usa 50%):
  Sempre gera ~50 células por clique
```

### **Exemplo 3: Configuração Personalizada**

```javascript
// Usuário ajusta sliders para:
minCellPercent = 25.500%  // → 26 células
maxCellPercent = 75.250%  // → 75 células

Console mostra:
📊 Mínimo atualizado: 25.500% → 26 células
📊 Máximo atualizado: 75.250% → 75 células
```

---

## 🎮 **COMO USAR NA INTERFACE**

### **Passo 1: Localizar Controles**
```
Painel Esquerdo → Seção "Velocidade" → Abaixo → "Configuração de Células"
```

### **Passo 2: Ajustar Mínimo (Horizontal)**
```
1. Arraste slider "Mínimo (%)"
2. Observe valor mudando: 0.001% → 99.999%
3. Console mostra: "📊 Mínimo atualizado: X% → Y células"
4. Valor afeta modo "Aleatorizar H"
```

### **Passo 3: Ajustar Máximo (Vertical)**
```
1. Arraste slider "Máximo (%)"
2. Observe valor mudando: 0.001% → 99.999%
3. Console mostra: "📊 Máximo atualizado: X% → Y células"
4. Valor afeta modo "Aleatorizar V"
```

### **Passo 4: Testar**
```
1. Clique "Aleatorizar H"
2. Console mostra: "📊 Configuração: X% → Y células"
3. Sistema gera Y células dentro do range
4. Próximo clique mantém mesma configuração
```

---

## 📈 **TABELA DE CONVERSÃO**

| Porcentagem | Células | Descrição |
|-------------|---------|-----------|
| **0.001%** | 1 | Mínimo absoluto |
| **0.500%** | 1 | Quase mínimo |
| **1.000%** | 1 | Baixo |
| **5.000%** | 5 | Baixo-médio |
| **10.000%** | 10 | Médio-baixo |
| **25.000%** | 25 | Médio |
| **50.000%** | 50 | Médio-alto |
| **75.000%** | 75 | Alto |
| **90.000%** | 90 | Muito alto |
| **99.000%** | 99 | Quase máximo |
| **99.999%** | 99 | Máximo absoluto |

---

## 💡 **CASOS DE USO**

### **1. Varredura Fina (Precision Scan):**
```
Configuração:
- Mínimo: 0.001% (1 célula)
- Máximo: 1.000% (1 célula)
- Velocidade: 100ms

Resultado:
- Horizontal: 1 célula por clique
- Vertical: 1 célula por clique
- Ideal para: Análise detalhada célula por célula
```

### **2. Explosão Massiva (Mass Burst):**
```
Configuração:
- Mínimo: 90.000% (90 células)
- Máximo: 99.999% (99 células)
- Velocidade: 1ms

Resultado:
- Horizontal: 90 células por clique
- Vertical: 99 células por clique
- Ideal para: Stress testing, cobertura rápida
```

### **3. Equilíbrio (Balanced Approach):**
```
Configuração:
- Mínimo: 25.000% (25 células)
- Máximo: 75.000% (75 células)
- Velocidade: 50ms

Resultado:
- Horizontal: 25 células por clique
- Vertical: 75 células por clique
- Ideal para: Uso diário, cobertura balanceada
```

### **4. Progressão Diferenciada:**
```
Configuração:
- Mínimo: 10.000% (10 células)
- Máximo: 50.000% (50 células)

Resultado:
- Horizontal progride: 1→10→...→99
- Vertical progride: 1→50→...→99
- Cada modo tem ritmo diferente
```

---

## 🔍 **LOGS DO SISTEMA**

### **Ao Ajustar Sliders:**

```console
// Mínimo ajustado para 25.500%
📊 Mínimo atualizado: 25.500% → 26 células

// Máximo ajustado para 75.250%
📊 Máximo atualizado: 75.250% → 75 células
```

### **Ao Clicar Aleatorizar:**

```console
// Horizontal (usa mínimo)
🎲 Aleatorizando (horizontal): Range [...] | Modo: ALEATÓRIO
📊 Configuração: 25.500% → 26 células
📊 Progressão Atual: 1/99 células
🎲 ALEATÓRIO (50%) [1/26]: ...
🎲 ALEATÓRIO (50%) [2/26]: ...
...
🎲 ALEATÓRIO (50%) [26/26]: ...

// Vertical (usa máximo)
🎲 Aleatorizando (vertical): Range [...] | Modo: SEQUENCIAL
📊 Configuração: 75.250% → 75 células
📊 Progressão Atual: 1/99 células
🔢 SEQUENCIAL (50%) [1/75]: ...
...
🔢 SEQUENCIAL (50%) [75/75]: ...
```

---

## 🛠️ **PERSONALIZAÇÃO AVANÇADA**

### **Alterar Precisão dos Sliders:**

```javascript
// Em cell-percent-config.js
<input type="range" id="minCellPercent" 
       min="0.001" max="99.999" step="0.001">
       
// Mudar para maior precisão:
step="0.0001"  // 4 casas decimais
step="0.00001" // 5 casas decimais
```

### **Alterar Range de Porcentagens:**

```javascript
// Em auto16-preset.js e cell-percent-config.js
const minPercent = 0.001;
const maxPercent = 99.999;

// Mudar para:
const minPercent = 0.0001;  // Mais preciso
const maxPercent = 100.000; // Inclui 100%
```

### **Alterar Mapeamento:**

```javascript
// Atualmente: linear
cells = Math.floor(normalized * 99) + 1;

// Mudar para exponencial:
cells = Math.floor(Math.pow(normalized, 0.5) * 99) + 1;
// Resultado: mais células em porcentagens baixas
```

---

## 🐛 **TROUBLESHOOTING**

### **Problema: Sliders não aparecem**
**Solução:**
```javascript
// Verificar se script foi carregado
console.log(typeof window.minCellPercent); // Deve ser "number"

// Se undefined, recarregar página
location.reload();
```

### **Problema: Valores não atualizam**
**Solução:**
```javascript
// Forçar atualização manual
window.minCellPercent = 0.001;
window.maxCellPercent = 99.999;
document.getElementById('minCellPercentValue').textContent = '0.001';
document.getElementById('maxCellPercentValue').textContent = '99.999';
```

### **Problema: Conversão incorreta**
**Solução:**
```javascript
// Testar função manualmente
const test = convertPercentToCells(50.000);
console.log('50% deve gerar ~50 células:', test);
// Deve mostrar: 50
```

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

Após implementar, verifique:

- [ ] Sliders aparecem abaixo de "Velocidade"
- [ ] Mínimo vai de 0.001 a 99.999
- [ ] Máximo vai de 0.001 a 99.999
- [ ] Valores atualizam no display ao mover sliders
- [ ] Console mostra logs de atualização
- [ ] Horizontal usa minCellPercent
- [ ] Vertical usa maxCellPercent
- [ ] Conversão porcentagem→células funciona
- [ ] Console mostra "📊 Configuração: X% → Y células"
- [ ] Sem erros no console

---

## 🎉 **RESUMO FINAL**

### **O QUE MUDOU:**
- ✅ Duas variáveis independentes: `minCellPercent` e `maxCellPercent`
- ✅ Interface UI com sliders para ajuste fino
- ✅ Precisão de 0.001% (três casas decimais)
- ✅ Conversão automática: porcentagem → células
- ✅ Horizontal usa mínimo, Vertical usa máximo
- ✅ Logs detalhados em tempo real

### **COMO USAR:**
1. Recarregue página (F5)
2. Localize nova seção "Configuração de Células"
3. Ajuste slider "Mínimo (%)" para Horizontal
4. Ajuste slider "Máximo (%)" para Vertical
5. Clique "Aleatorizar H" ou "V"
6. Observe console mostrando conversão

### **VALORES PADRÃO:**
- **Mínimo:** 0.001% → 1 célula
- **Máximo:** 99.999% → 99 células

### **BENEFÍCIOS:**
- **Flexibilidade total:** Ajuste fino de 0.001% em 0.001%
- **Independência:** Horizontal e Vertical com configurações diferentes
- **Precisão:** Controle exato do número de células
- **Feedback visual:** Logs mostram conversão em tempo real
- **UI intuitiva:** Sliders fáceis de usar

---

**SISTEMA DE PORCENTAGEM CONFIGURÁVEL IMPLEMENTADO!** 🎯

Para testar:
1. Recarregue página (F5)
2. Encontre seção "Configuração de Células (Porcentagem)"
3. Mova sliders e observe valores mudando
4. Clique "Aleatorizar H" → usa mínimo
5. Clique "Aleatorizar V" → usa máximo
6. Console mostra: "📊 Configuração: X% → Y células"
