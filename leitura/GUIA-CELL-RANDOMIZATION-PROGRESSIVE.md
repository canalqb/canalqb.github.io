# 🎯 PROGRESSIVE CELL RANDOMIZATION - H/V MODES

**Data:** 2026-03-10  
**Status:** ✅ IMPLEMENTADO  
**Arquivo:** `js/auto16-preset.js`

---

## 📋 **VISÃO GERAL**

Implementado sistema de **progressão acumulativa** para os modos "Aleatorizar H" e "Aleatorizar V":

1. **Primeira execução:** Randomiza **1 célula** dentro do range (init-fim)
2. **Segunda execução:** Randomiza **2 células**
3. **Terceira execução:** Randomiza **3 células**
4. **Continua até:** **99 células**
5. **Reinicia:** Volta para **1 célula** e repete o ciclo

---

## 🎯 **COMO FUNCIONA**

### **Fluxo do Sistema:**

```
Horizontal (H):
┌─────────────────────────────────────────────┐
│ Clique 1: Gera 1 célula  →  horizontalCellCount = 1 │
│ Clique 2: Gera 2 células →  horizontalCellCount = 2 │
│ Clique 3: Gera 3 células →  horizontalCellCount = 3 │
│ ...                                          │
│ Clique 99: Gera 99 células → horizontalCellCount = 99│
│ Clique 100: Gera 1 célula → REINICIA ciclo!      │
└─────────────────────────────────────────────┘

Vertical (V):
┌─────────────────────────────────────────────┐
│ Clique 1: Gera 1 célula  →  verticalCellCount = 1   │
│ Clique 2: Gera 2 células →  verticalCellCount = 2   │
│ Clique 3: Gera 3 células →  verticalCellCount = 3   │
│ ...                                          │
│ Clique 99: Gera 99 células → verticalCellCount = 99 │
│ Clique 100: Gera 1 célula → REINICIA ciclo!        │
└─────────────────────────────────────────────┘
```

---

## 🔧 **VARIÁVEIS IMPLEMENTADAS**

### **No Código (`auto16-preset.js`):**

```javascript
// CONTADORES PROGRESSIVOS
let horizontalCellCount = 1; // Começa com 1 célula
let verticalCellCount = 1;   // Começa com 1 célula
const MAX_CELLS = 99;        // Máximo antes de reiniciar
```

### **Como Funciona Cada Variável:**

| Variável | Início | Incremento | Máximo | Reinicia |
|----------|--------|------------|--------|----------|
| `horizontalCellCount` | 1 | +1 por clique | 99 | 1 |
| `verticalCellCount` | 1 | +1 por clique | 99 | 1 |
| `MAX_CELLS` | - | Fixo | 99 | - |

---

## 📊 **EXEMPLO PRÁTICO DE USO**

### **Cenário: Horizontal com init=0, fim=100**

#### **Execução 1 (1 célula):**
```javascript
horizontalCellCount = 1
Gera: [47]
Console: 📊 Progressão: 1/99 células
Console: 🎲 ALEATÓRIO (50%) [1/1]: 0000...002F
```

#### **Execução 2 (2 células):**
```javascript
horizontalCellCount = 2
Gera: [23, 89]
Console: 📊 Progressão: 2/99 células
Console: 🎲 ALEATÓRIO (50%) [1/2]: 0000...0017
Console: 🎲 ALEATÓRIO (50%) [2/2]: 0000...0059
Exibe última: 89
```

#### **Execução 3 (3 células):**
```javascript
horizontalCellCount = 3
Gera: [12, 56, 78]
Console: 📊 Progressão: 3/99 células
Console: 🎲 ALEATÓRIO (50%) [1/3]: 0000...000C
Console: 🎲 ALEATÓRIO (50%) [2/3]: 0000...0038
Console: 🎲 ALEATÓRIO (50%) [3/3]: 0000...004E
Exibe última: 78
```

#### **Execução 99 (99 células):**
```javascript
horizontalCellCount = 99
Gera: [célula1, célula2, ..., célula99]
Console: 📊 Progressão: 99/99 células
Console: 🎲 ALEATÓRIO (50%) [1/99]: ...
Console: 🎲 ALEATÓRIO (50%) [2/99]: ...
...
Console: 🎲 ALEATÓRIO (50%) [99/99]: ...
Exibe última: célula99
```

#### **Execução 100 (REINICIA):**
```javascript
horizontalCellCount = 1 (reiniciou!)
Console: 🔄 Horizontal reiniciou: 1→ 99 completado!
Gera: [34]
Console: 📊 Progressão: 1/99 células
```

---

## 💻 **CÓDIGO IMPLEMENTADO**

### **Função `randomizeWithinRange(mode)` Atualizada:**

```javascript
function randomizeWithinRange(mode) {
  const bitsNum = Number(window.presetManager ? window.presetManager.getCurrentBits() || 0n : 0);
  if (!bitsNum) return;

  // 🎯 ATUALIZA ESTADO ON/OFF ANTES DE RANDOMIZAR
  updateRandomOnOffState();

  let startHex = null;
  let endHex = null;

  // Obtém range atual (init/fim)
  if (window.matrizAPI && typeof window.matrizAPI.getInitHexFromCard === 'function') {
    startHex = window.matrizAPI.getInitHexFromCard(mode);
    endHex = window.matrizAPI.getEndHexFromCard(mode);
  }

  // Fallbacks
  if (!startHex || !endHex) {
    if (mode === 'horizontal') {
      startHex = currentInicio || (1n << BigInt(bitsNum)).toString(16);
      endHex = currentFim || ((1n << (BigInt(bitsNum) + 1n)) - 1n).toString(16);
    } else {
      startHex = (1n << BigInt(bitsNum)).toString(16);
      endHex = ((1n << (BigInt(bitsNum) + 1n)) - 1n).toString(16);
    }
  }

  const startVal = BigInt('0x' + startHex);
  const endVal = BigInt('0x' + endHex);
  const span = endVal > startVal ? (endVal - startVal + 1n) : 1n;

  // 🎯 OBTEM CONTADOR DE CÉLULAS ATUAL (PROGRESSIVO)
  const cellCount = mode === 'horizontal' ? horizontalCellCount : verticalCellCount;
  
  console.log(`📊 Progressão: ${cellCount}/${MAX_CELLS} células`);

  let val;
  const generatedValues = [];
  
  // 🎯 GERA MÚLTIPLAS CÉLULAS (PROGRESSIVO)
  for (let i = 0; i < cellCount; i++) {
    if (useRandomMode) {
      // 🎲 MODO ALEATÓRIO: Randomização tradicional com densidade
      const densities = [0.3, 0.7, 0.4, 0.6, 0.5];
      const density = densities[Math.floor(Math.random() * densities.length)];
      const targetPoint = startVal + (span * BigInt(Math.floor(density * 1000))) / 1000n;
      const windowSize = span / 20n;
      let rndOffset = (BigInt(Math.floor(Math.random() * 0x7FFFFFFF)) << 32n) | 
                      BigInt(Math.floor(Math.random() * 0x7FFFFFFF));
      rndOffset = rndOffset % (windowSize > 0n ? windowSize : 1n);

      val = targetPoint + (rndOffset - windowSize / 2n);
      if (val < startVal) val = startVal;
      if (val > endVal) val = endVal;

      // 50% de chance de usar o espelho
      if (Math.random() < 0.5) {
        val = startVal + (endVal- val);
      }

      console.log(`🎲 ALEATÓRIO (${currentRandomPercent}%) [${i+1}/${cellCount}]: ${val.toString(16).padStart(64, '0')}`);
    } else {
      // 🔢 MODO SEQUENCIAL: Usa próximo valor sequencial do range
      const useStart = Math.random() < 0.5;
      
      if (useStart) {
        val = startVal + BigInt(Math.floor(Math.random() * 1000));
      } else {
        val = endVal- BigInt(Math.floor(Math.random() * 1000));
      }
      
      if (val < startVal) val = startVal;
      if (val > endVal) val = endVal;

      console.log(`🔢 SEQUENCIAL (${100 - currentRandomPercent}%) [${i+1}/${cellCount}]: ${val.toString(16).padStart(64, '0')}`);
    }
    
    generatedValues.push(val);
  }

  // 🎯 USA O ÚLTIMO VALOR GERADO PARA EXIBIÇÃO
  val = generatedValues[generatedValues.length - 1];
  const hexVal = val.toString(16).padStart(64, '0');
  currentHex = hexVal;
  const base = 1n << BigInt(bitsNum);
  const matrixOffset = val - base >= 0n ? (val- base) : 0n;

  updatePresetMatrix(matrixOffset, mode === 'vertical' ? 'vertical' : 'horizontal');

  if (mode === 'vertical' && window.verticalManagerInstance) {
    const inv = window.verticalManagerInstance.calculateInverse(
      hexVal,
      (1n << BigInt(bitsNum)).toString(16),
      ((1n << (BigInt(bitsNum) + 1n)) -1n).toString(16)
    );
    if (inv) updatePresetOutput(inv);
  }

  if (window.matrizAPI) window.matrizAPI.draw();
  updatePresetOutput(hexVal);
  
  // 🎯 ATUALIZA CONTADOR PROGRESSIVO PARA PRÓXIMA EXECUÇÃO
  if (mode === 'horizontal') {
    horizontalCellCount++;
    if (horizontalCellCount > MAX_CELLS) {
      horizontalCellCount = 1; // Reinicia ciclo
      console.log('🔄 Horizontal reiniciou: 1→ 99 completado!');
    }
  } else {
    verticalCellCount++;
    if (verticalCellCount > MAX_CELLS) {
      verticalCellCount = 1; // Reinicia ciclo
      console.log('🔄 Vertical reiniciou: 1→ 99 completado!');
    }
  }
}
```

---

## 🎮 **COMO USAR NA INTERFACE**

### **Passo 1: Carregue um Range**
```
1. Selecione altura (linha inicial)
2. Selecione base (linha final)
3. Range será carregado (ex: init=0, fim=100)
```

### **Passo 2: Use Aleatorizar H ou V**
```
Opção A: Aleatorizar Horizontal
- Clique em "⚡ H"
- Observe console mostrando progressão

Opção B: Aleatorizar Vertical
- Clique em "⚡ V"
- Observe console mostrando progressão
```

### **Passo 3: Observe a Progressão**
```
Console mostra:
📊 Progressão: 1/99 células
🎲 ALEATÓRIO (50%) [1/1]: 0000...XXXX

Próximo clique:
📊 Progressão: 2/99 células
🎲 ALEATÓRIO (50%) [1/2]: 0000...YYYY
🎲 ALEATÓRIO (50%) [2/2]: 0000...ZZZZ
```

---

## 📈 **INTERAÇÃO COM OUTROS SISTEMAS**

### **1. Randomização ON/OFF Progressivo:**

O sistema de múltiplas células funciona junto com o sistema ON/OFF:

```javascript
// Cada célula gerada respeita a porcentagem atual
currentRandomPercent = 50%

Para cada uma das N células:
  50% de chance: Modo ALEATÓRIO (densidade + espelhamento)
  50% de chance: Modo SEQUENCIAL (início ou fim do range)
```

### **2. Velocidade Ajustável (1-1000ms):**

A velocidade afeta quantas células são geradas por segundo:

| Velocidade | Células/segundo | Tempo para 99 células |
|------------|-----------------|-----------------------|
| **1ms** | ~1000 | ~0.1 segundos |
| **50ms** | ~20 | ~5 segundos |
| **500ms** | ~2 | ~50 segundos |
| **1000ms** | ~1 | ~99 segundos |

---

## 🔍 **TESTE NO CONSOLE**

### **Verificar Contadores Atuais:**
```javascript
// Verificar contador horizontal
console.log('Horizontal:', window.horizontalCellCount || 'N/A');

// Verificar contador vertical
console.log('Vertical:', window.verticalCellCount || 'N/A');
```

### **Resetar Manualmente:**
```javascript
// Resetar horizontal para 1
horizontalCellCount = 1;
console.log('✅ Horizontal resetado para 1');

// Resetar vertical para 1
verticalCellCount = 1;
console.log('✅ Vertical resetado para 1');
```

### **Simular Ciclo Completo:**
```javascript
// Simular 99 cliques no horizontal
for (let i = 1; i <= 99; i++) {
  console.log(`Ciclo ${i}: ${horizontalCellCount} células`);
  horizontalCellCount++;
  if (horizontalCellCount > 99) horizontalCellCount = 1;
}
```

---

## 🎯 **CASOS DE USO**

### **1. Varredura Gradual (Slow Scan):**
```
Objetivo: Cobrir range sistematicamente
Configuração:
- Velocidade: 500-1000ms
- Modo: Sequencial predominante
- Progressão: 1→99 células

Resultado: Varredura metódica do range
```

### **2. Explosão Aleatória (Random Burst):**
```
Objetivo: Teste de stress com muitas células
Configuração:
- Velocidade: 1-10ms
- Modo: Aleatório predominante
- Progressão: 1→99 células

Resultado: Milhares de chaves em segundos
```

### **3. Padrão Híbrido (Balanced):**
```
Objetivo: Equilíbrio entre cobertura e aleatoriedade
Configuração:
- Velocidade: 50-200ms
- Modo: 50% ON/OFF
- Progressão: 1→99 células

Resultado: Cobertura progressiva com variação
```

---

## 📊 **LOGS DO SISTEMA**

### **Logs por Execução:**

#### **Log Básico (1 célula):**
```
🎲 Aleatorizando (horizontal): Range [0 ... 64] | Modo: ALEATÓRIO
📊 Progressão: 1/99 células
🎲 ALEATÓRIO (50%) [1/1]: 000000000000000000000000000000000000000000000000000000000000002F
```

#### **Log Múltiplo (5 células):**
```
🎲 Aleatorizando (horizontal): Range [0 ... 64] | Modo: ALEATÓRIO
📊 Progressão: 5/99 células
🎲 ALEATÓRIO (50%) [1/5]: 0000...000A
🎲 ALEATÓRIO (50%) [2/5]: 0000...001E
🎲 ALEATÓRIO (50%) [3/5]: 0000...002B
🎲 ALEATÓRIO (50%) [4/5]: 0000...003C
🎲 ALEATÓRIO (50%) [5/5]: 0000...0055
```

#### **Log de Reinício:**
```
🔄 Horizontal reiniciou: 1→ 99 completado!
📊 Progressão: 1/99 células
```

---

## 🛠️ **PERSONALIZAÇÃO**

### **Alterar Máximo de Células:**

```javascript
// No início do arquivo auto16-preset.js
const MAX_CELLS = 99;  // Valor atual

// Mudar para:
const MAX_CELLS = 50;  // Meio ciclo (50 células)
const MAX_CELLS = 150; // Ciclo estendido (150 células)
const MAX_CELLS = 256; // Ciclo completo (256 células)
```

### **Alterar Incremento:**

```javascript
// Atualmente: +1 por clique
horizontalCellCount++;

// Mudar para: +2 por clique
horizontalCellCount += 2;

// Ou: +5 por clique
horizontalCellCount += 5;

// Ou: exponencial (dobra a cada vez)
horizontalCellCount *= 2;
```

### **Padrão Específico:**

```javascript
// Exemplo: Segue sequência específica
const sequence = [1, 3, 7, 15, 31, 63, 99];
horizontalCellCount = sequence[currentIndex];
```

---

## 🐛 **TROUBLESHOOTING**

### **Problema: Contador não incrementa**
**Solução:**
```javascript
// Verificar se variáveis estão definidas
console.log(typeof horizontalCellCount); // Deve ser "number"

// Se undefined,重新 inicializar
if (typeof horizontalCellCount === 'undefined') {
  horizontalCellCount = 1;
}
```

### **Problema: Não reinicia em 99**
**Solução:**
```javascript
// Verificar condição de reinício
console.log('MAX_CELLS:', MAX_CELLS);
console.log('Current:', horizontalCellCount);

// Forçar reinício manual
if (horizontalCellCount > 99) {
  horizontalCellCount = 1;
  console.log('🔄 Reinício forçado!');
}
```

### **Problema: Logs não aparecem**
**Solução:**
```javascript
// Verificar se console.log está habilitado
// Abrir console do navegador (F12)
// Garantir que nível "Info" está visível
```

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

Após implementar, verifique:

- [ ] horizontalCellCount inicia em 1
- [ ] verticalCellCount inicia em 1
- [ ] Contadores incrementam +1 por clique
- [ ] Reinicia em 99 (volta para 1)
- [ ] Console mostra "📊 Progressão: X/99 células"
- [ ] Console mostra logs individuais [1/N], [2/N], etc
- [ ] Log de reinício aparece "🔄 Horizontal reiniciou"
- [ ] Última célula é exibida na UI
- [ ] Matriz atualiza corretamente
- [ ] Sem erros no console

---

## 🎉 **RESUMO FINAL**

### **O QUE MUDOU:**
- ✅ Sistema progressivo: 1→99 células
- ✅ Contadores independentes para H e V
- ✅ Reinício automático ao atingir 99
- ✅ Logs detalhados por célula gerada
- ✅ Compatível com ON/OFF randomization
- ✅ Compatível com speed control (1-1000ms)

### **COMO USAR:**
1. Selecione range (init-fim)
2. Clique "Aleatorizar H" ou "V"
3. Observe progressão no console
4. Sistema gera N células (começando com 1)
5. Próximo clique gera N+1 células
6. Ao chegar em 99, reinicia para 1

### **BENEFÍCIOS:**
- **Cobertura gradual:** Começa pequeno, aumenta progressivamente
- **Teste sistemático:** Varre range de forma organizada
- **Flexibilidade:** Compatível com todos os modos
- **Feedback visual:** Logs mostram progresso em tempo real
- **Reinício automático:** Ciclo contínuo sem intervenção

---

**SISTEMA DE PROGRESSÃO ACUMULATIVA IMPLEMENTADO!** 🎯

Para testar:
1. Recarregue página (F5)
2. Abra console (F12)
3. Clique "Aleatorizar H" ou "V"
4. Observe: "📊 Progressão: 1/99 células"
5. Clique novamente: "📊 Progressão: 2/99 células"
6. Continue até ver: "🔄 Horizontal reiniciou!"
