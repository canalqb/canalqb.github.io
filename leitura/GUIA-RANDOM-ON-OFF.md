# 🎲 RANDOMIZAÇÃO ON/OFF PROGRESSIVO - DOCUMENTAÇÃO

**Data:** 2026-03-10  
**Status:** ✅ IMPLEMENTADO  
**Arquivo:** `js/auto16-preset.js`

---

## 📋 **VISÃO GERAL**

Novo sistema de randomização inteligente que alterna entre modo **ALEATÓRIO** e **SEQUENCIAL** com porcentagens progressivas.

### **Funcionalidades:**
- ✅ Randomização ON/OFF com porcentagem variável (1% → 99%)
- ✅ Ciclo progressivo ascendente e descendente
- ✅ Sequência embaralhada para imprevisibilidade
- ✅ Logging detalhado para debugging
- ✅ Aplicável aos modos Horizontal (H) e Vertical (V)

---

## 🎯 **COMO FUNCIONA**

### **Ciclo de Randomização:**

#### **Fase 1: Ascendente (1% → 99%)**
```
1% aleatório/ 99% sequencial
2% aleatório/ 98% sequencial
3% aleatório/ 97% sequencial
...
50% aleatório / 50% sequencial
...
99% aleatório/ 1% sequencial
```

#### **Fase 2: Descendente (98% → 1%)**
```
98% aleatório/ 2% sequencial
97% aleatório/ 3% sequencial
...
50% aleatório / 50% sequencial
...
1% aleatório/ 99% sequencial
```

#### **Embaralhamento:**
- A sequência completa `[1, 2, ..., 99, 98, ..., 1]` é **embaralhada** usando algoritmo Fisher-Yates
- Garante imprevisibilidade na ordem das porcentagens
- Nova sequência gerada automaticamente ao final de cada ciclo completo

---

## 🔧 **IMPLEMENTAÇÃO TÉCNICA**

### **Variáveis Globais Adicionadas:**

```javascript
let randomCyclePhase = 'ascending';     // 'ascending' ou 'descending'
let currentRandomPercent = 1;            // Porcentagem atual (1-99)
let randomCycleSequence = [];            // Sequência pré-calculada
let currentCycleIndex = 0;               // Índice na sequência
let useRandomMode = false;               // true = aleatório, false = sequencial
```

### **Funções Principais:**

#### 1. **`generateRandomCycleSequence()`**
Gera sequência completa de 198 passos (1→99→1) e embaralha.

```javascript
// Exemplo de sequência embaralhada:
[47, 12, 89, 34, 76, 5, 91, 23, ...]
```

#### 2. **`updateRandomOnOffState()`**
Atualiza estado antes de cada randomização:
- Verifica se precisa gerar nova sequência
- Incrementa índice do ciclo
- Determina se usa modo aleatório baseado na porcentagem atual

```javascript
// Lógica de decisão:
const randomThreshold = Math.random() * 100;
useRandomMode = randomThreshold < currentRandomPercent;

// Exemplo: Se currentRandomPercent= 75
// 75% de chance de ser ALEATÓRIO
// 25% de chance de ser SEQUENCIAL
```

#### 3. **`randomizeWithinRange(mode)`** (MODIFICADA)
Agora chama `updateRandomOnOffState()` antes de randomizar.

**Modo ALEATÓRIO (`useRandomMode = true`):**
```javascript
// Randomização tradicional com densidade
- Escolhe ponto alvo baseado em densidade (30%, 70%, 40%, 60%, 50%)
- Aplica janela de 5% para variação
- 50% de chance de espelhar valor
```

**Modo SEQUENCIAL (`useRandomMode = false`):**
```javascript
// Abordagem sequencial inteligente
- 50% chance de pegar valor próximo do INÍCIO do range
- 50% chance de pegar valor próximo do FIM do range
- Variação de ±1000 valores para evitar padrões rígidos
```

---

## 📊 **EXEMPLOS DE LOGS**

### **Console Output:**

```javascript
🎲 Nova sequência de randomização gerada: [47, 12, 89, 34, 76, 5, 91, 23, 67, 3] ...

🎯 Random ON/OFF: 47% chance → ALEATÓRIO
🎲 Aleatorizando (horizontal): Range [4000000000000004a9 ... 7fffffffffffffff] | Modo: ALEATÓRIO
🎲 ALEATÓRIO (47%): 5f3a2b8c9d1e4f7a

🎯 Random ON/OFF: 12% chance → SEQUENCIAL
🎲 Aleatorizando (vertical): Range [800000000000000000 ... ffffffffffffffff] | Modo: SEQUENCIAL
🔢 SEQUENCIAL (88%): 8000000000000003e8

🎯 Random ON/OFF: 89% chance → ALEATÓRIO
🎲 Aleatorizando (horizontal): Range [4000000000000004a9 ... 7fffffffffffffff] | Modo: ALEATÓRIO
🎲 ALEATÓRIO (89%): 6c8d4e2f1a9b5c3d
```

---

## 🎮 **COMO USAR**

### **Botões de Randomização:**

#### **Aleatorizar H (Horizontal):**
```javascript
// Botão: randBtnH
document.getElementById('randBtnH').addEventListener('click', () => {
  if (window.presetManager && window.presetManager.hasActivePreset()) {
    randomizeWithinRange('horizontal');
  } else if (window.auto16API) {
    window.auto16API.randomize();
  }
});
```

#### **Aleatorizar V (Vertical):**
```javascript
// Botão: randBtnV
document.getElementById('randBtnV').addEventListener('click', () => {
  if (window.presetManager && window.presetManager.hasActivePreset()) {
    randomizeWithinRange('vertical');
  } else if (window.auto16API) {
    window.auto16API.randomize();
  }
});
```

### **Teste no Console:**

```javascript
// Testar uma randomização
randomizeWithinRange('horizontal');

// Verificar estado atual
console.log('Porcentagem atual:', currentRandomPercent);
console.log('Modo:', useRandomMode ? 'ALEATÓRIO' : 'SEQUENCIAL');
console.log('Índice no ciclo:', currentCycleIndex);
console.log('Sequência:', randomCycleSequence.slice(0, 20));
```

---

## 📈 **ESTATÍSTICAS ESPERADAS**

Após **ciclo completo** (198 iterações):

| Porcentagem Média | Esperado Aleatório | Esperado Sequencial |
|-------------------|--------------------|----------------------|
| **1-25%** | ~12.5% | ~87.5% |
| **26-50%** | ~37.5% | ~62.5% |
| **51-75%** | ~62.5% | ~37.5% |
| **76-99%** | ~87.5% | ~12.5% |
| **GERAL** | **~50%** | **~50%** |

---

## 🔍 **DEBUG E MONITORAMENTO**

### **Habilitar Logs Detalhados:**

```javascript
// No console do navegador:
localStorage.setItem('debug_random', 'true');

// Recarregar página e observar logs
```

### **Métricas Disponíveis:**

```javascript
// Obter estatísticas do ciclo atual
{
  currentPercent: 47,        // Porcentagem atual
  mode: 'ALEATÓRIO',         // Modo atual
  cycleIndex: 12,            // Posição no ciclo
  totalInCycle: 198,         // Total no ciclo completo
  phase: 'ascending'         // Fase atual
}
```

---

## 🎯 **VANTAGENS**

### **1. Cobertura Balanceada:**
- Evita viés de concentração em áreas específicas
- Garante exploração uniforme do range

### **2. Imprevisibilidade:**
- Sequência embaralhada previne padrões detectáveis
- Combina melhor dos mundos aleatório e sequencial

### **3. Eficiência:**
- Modo sequencial evita retrabalho em áreas já verificadas
- Modo aleatório descobre novas áreas inesperadas

### **4. Flexibilidade:**
- Progressão automática através de todas as porcentagens
- Adapta-se a diferentes estratégias de busca

---

## ⚙️ **CUSTOMIZAÇÃO**

### **Alterar Faixa de Porcentagens:**

```javascript
// Modificar em generateRandomCycleSequence():
// De 1-99 para 10-90 (mais conservador)
for (let i = 10; i <= 90; i++) {
  sequence.push(i);
}
```

### **Alterar Tamanho da Janela Sequencial:**

```javascript
// Modificar em randomizeWithinRange():
// De ±1000 para ±5000 (maior variação)
val = startVal + BigInt(Math.floor(Math.random() * 10000));
```

### **Desabilitar Embaralhamento:**

```javascript
// Comentar linha do Fisher-Yates em generateRandomCycleSequence():
/*
for (let i = sequence.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i +1));
  [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
}
*/
```

---

## 🐛 **TROUBLESHOOTING**

### **Problema: Sequência não reinicia**
**Solução:**
```javascript
// Forçar reinício manual
randomCycleSequence = [];
currentCycleIndex = 0;
updateRandomOnOffState();
```

### **Problema: Sempre mesmo modo**
**Solução:**
```javascript
// Verificar se updateRandomOnOffState() está sendo chamado
console.log('useRandomMode:', useRandomMode);
console.log('currentRandomPercent:', currentRandomPercent);
```

### **Problema: Logs não aparecem**
**Solução:**
```javascript
// Verificar se console.log não foi desabilitado
// Adicionar log forçado:
alert('Debug: useRandomMode=' + useRandomMode);
```

---

## 📝 **NOTAS DE VERSÃO**

### **v2.0.0 (2026-03-10)**
- ✅ Implementado sistema ON/OFF progressivo
- ✅ Adicionado embaralhamento Fisher-Yates
- ✅ Logging detalhado em tempo real
- ✅ Suporte para modos H e Vertical

### **Melhorias Futuras (Backlog):**
- [ ] Interface visual mostrando ciclo atual
- [ ] Gráfico de distribuição aleatório/sequencial
- [ ] Presets configuráveis (conservador, balanceado, agressivo)
- [ ] Exportar estatísticas de sessão

---

## ✅ **CHECKLIST DE VALIDAÇÃO**

Antes de usar em produção:

- [x] Sequência gera 198 valores (1→99→1)
- [x] Embaralhamento funciona corretamente
- [x] `updateRandomOnOffState()` chamado antes de randomizar
- [x] Logs mostram modo correto (ALEATÓRIO/SEQUENCIAL)
- [x] Porcentagem refletida nos logs
- [x] Ambos modos (H e V) funcionando
- [x] Valores dentro do range especificado
- [x] Sem erros no console

---

## 🎉 **RESUMO RÁPIDO**

**O QUE MUDOU:**
- Randomização agora usa sistema ON/OFF progressivo
- Alterna entre aleatório e sequencial baseado em porcentagem
- Porcentagens variam de 1% a 99% (e vice-versa)
- Sequência é embaralhada para imprevisibilidade

**COMO TESTAR:**
1. Abra o console do navegador (F12)
2. Clique em "Aleatorizar H" ou "Aleatorizar V"
3. Observe logs mostrando `% chance` e modo
4. Veja valores sendo gerados

**RESULTADO ESPERADO:**
- ~50% dos passos serão aleatórios
- ~50% dos passos serão sequenciais
- Distribuição uniforme ao longo do tempo
- Sem padrões repetitivos

---

**SISTEMA PRONTO E OPERACIONAL!** 🚀

Para dúvidas ou ajustes, consulte os logs no console ou modifique as variáveis globais conforme necessário.
