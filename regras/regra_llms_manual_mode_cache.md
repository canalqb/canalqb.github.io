# Regra LLM — Caching de Células no Modo Manual (Auto16)

## 📋 Contexto
No modo de geração manual do `auto16.js`, o sistema itera sobre chaves baseadas nas células ativas selecionadas pelo usuário na matriz 16x16. 

## 🚫 O Problema (Regressão Evitada)
Anteriormente, o sistema recalculava as células ativas a cada `step()`. Como o `step()` atualiza visualmente a matriz (pintando e apagando bits), a primeira atualização apagava o estado visual, fazendo com que o recálculo subsequente retornasse zero células ativas, interrompendo o loop prematuramente.

## ✅ A Solução (Cachê Estrutural)
Para garantir a continuidade da execução, as seguintes variáveis de cache foram implementadas:

1. **`cachedActiveCells`**: Captura o Array de objetos `{row, col}` no momento exato do `start()`.
2. **`cachedTotalCells`**: Captura a contagem total de bits na seleção antes da primeira iteração.

## 🛠️ Regra de Implementação
Toda lógica de iteração manual no `auto16.js` DEVE utilizar as variáveis de cache em vez de consultar `window.matrizAPI.getActiveCells()` ou similar durante o ciclo de execução (`running === true`).

- **Reinicialização**: O cache deve ser atualizado APENAS dentro da função `start()`.
- **Persistência**: O `stateCounter` deve ser persistido e inicializado a partir do valor numérico atual da seleção para evitar saltos de sequência.

---
**Timestamp**: 2026-04-06T15:20:00Z  
**Responsável**: AI Agent (Antigravity)
