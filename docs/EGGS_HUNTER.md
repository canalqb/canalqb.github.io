# 🥚 EGGS HUNTER V2 - DOCUMENTAÇÃO COMPLETA

## 📋 Visão Geral

O **Eggs Hunter V2** é um sistema avançado de verificação de saldo que **acumula 1000 WIFs únicas** antes de fazer a verificação em lote na blockchain. Usa **IndexedDB** para armazenamento local temporário, garantindo performance e evitando duplicatas.

## 🎯 Principais Melhorias da V2

### ✨ Novidades

1. **Acumulação Inteligente**: Armazena até 1000 WIFs antes de verificar (10x o limite das caixas de texto)
2. **IndexedDB**: Armazenamento local persistente e eficiente
3. **Deduplicação Automática**: Nunca verifica a mesma WIF duas vezes
4. **Indicador de Progresso**: Mostra quantas WIFs foram acumuladas em tempo real
5. **Verificação em Lote**: Processa 20 endereços por vez com delay entre lotes
6. **Limpeza Automática**: Limpa o banco após verificação completa

## 🔧 Arquitetura

### IndexedDB Schema

```javascript
Database: EggsHunterDB
Store: wifs
  - address (key)
  - wif
  - compressed (boolean)
  - timestamp
```

### Fluxo de Funcionamento

```
1. WIF Gerada → 2. Converte para Address → 3. Salva no IndexedDB
                                                      ↓
                                            4. Conta WIFs armazenadas
                                                      ↓
                                            5. Atingiu 1000?
                                                      ↓
                                            6. SIM: Inicia verificação
                                                      ↓
                                            7. Processa em lotes de 20
                                                      ↓
                                            8. Consulta blockchain.info
                                                      ↓
                                            9. Encontrou saldo?
                                                      ↓
                                            10. SIM: Adiciona aos Eggs
                                                      ↓
                                            11. Mostra Modal
                                                      ↓
                                            12. Limpa banco
```

## 📊 Configurações

```javascript
const CONFIG = {
  MAX_WIFS_BEFORE_CHECK: 1000,  // Acumula 1000 WIFs antes de verificar
  BATCH_SIZE: 20,               // Máximo de endereços por consulta API
  CHECK_INTERVAL: 2000,         // Intervalo entre verificações (2s)
  DB_NAME: 'EggsHunterDB',
  DB_VERSION: 1,
  STORE_NAME: 'wifs'
};
```

## 🎮 API Pública

### Métodos Disponíveis

```javascript
// Adicionar WIF ao banco (retorna true se adicionada)
await window.EggsHunter.addWif(wif, compressed);

// Mostrar modal de eggs
window.EggsHunter.showModal();

// Obter lista de eggs encontrados
window.EggsHunter.getEggsFound();

// Obter contagem de WIFs armazenadas
await window.EggsHunter.getWifsCount();

// Limpar banco de WIFs
await window.EggsHunter.clearWifs();

// Forçar verificação imediata (mesmo sem 1000 WIFs)
await window.EggsHunter.forceCheck();

// Limpar eggs encontrados
window.EggsHunter.clearEggs();

// Obter estatísticas
await window.EggsHunter.getStats();
```

## 🎨 Interface Visual

### 1. **Indicador de Progresso** (Canto Inferior Esquerdo)

```
┌─────────────────────────────┐
│ 🥚 Eggs Hunter              │
│ 📊 750/1000 WIFs (75.0%)    │
└─────────────────────────────┘
```

Estados possíveis:
- `📊 X/1000 WIFs (Y%)` - Acumulando
- `✅ 1000 WIFs prontas para verificação` - Pronto
- `🔍 Verificando saldos...` - Processando

### 2. **Modal de Eggs** (Centro da Tela)

Design premium com:
- 🌈 Gradiente roxo vibrante
- 💎 Cards individuais para cada egg
- 💰 Badge dourado com saldo
- 📋 Informações completas (Address, WIF, Tipo, Data)
- 🎯 Seleção de texto facilitada
- ✨ Hover effects

## 🚀 Uso no Console

### Ver estatísticas completas:
```javascript
const stats = await window.EggsHunter.getStats();
console.table(stats);
```

Retorna:
```json
{
  "wifsStored": 750,
  "eggsFound": 2,
  "isChecking": false,
  "maxBeforeCheck": 1000
}
```

### Ver quantas WIFs estão armazenadas:
```javascript
const count = await window.EggsHunter.getWifsCount();
console.log(`WIFs armazenadas: ${count}`);
```

### Forçar verificação imediata:
```javascript
await window.EggsHunter.forceCheck();
```

### Ver eggs encontrados:
```javascript
console.table(window.EggsHunter.getEggsFound());
```

### Limpar tudo:
```javascript
await window.EggsHunter.clearWifs();
window.EggsHunter.clearEggs();
```

## 🔒 Segurança e Performance

### Deduplicação
- ✅ IndexedDB usa `address` como chave primária
- ✅ Tentativas de adicionar endereços duplicados são ignoradas silenciosamente
- ✅ Zero overhead de memória para verificação de duplicatas

### Rate Limiting
- ✅ Máximo de 20 endereços por consulta (limite da API)
- ✅ Delay de 1 segundo entre lotes
- ✅ Não sobrecarrega a API blockchain.info

### Armazenamento
- ✅ IndexedDB é persistente (sobrevive a recarregamentos)
- ✅ Limpeza automática após verificação
- ✅ Não usa localStorage (sem limite de 5MB)

### Tratamento de Erros
- ✅ Retry automático em caso de falha de rede
- ✅ Logs detalhados no console
- ✅ Continua processando mesmo se um lote falhar

## 📝 Exemplo de Egg Encontrado

```json
{
  "wif": "5HpHagT65TZzG1PH3CSu63k8DbpvD8s5ip4nEB3kEsreAnchuDf",
  "address": "1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH",
  "balance": "0.12345678",
  "compressed": true,
  "timestamp": "2026-02-16T22:30:00.000Z"
}
```

## 🎯 Casos de Uso

### 1. **Busca Passiva de Longo Prazo**
- Sistema acumula WIFs enquanto você trabalha
- Verifica automaticamente quando atinge 1000
- Ideal para deixar rodando por horas/dias

### 2. **Verificação Manual**
```javascript
// Acumular 500 WIFs e forçar verificação
const count = await window.EggsHunter.getWifsCount();
if (count >= 500) {
  await window.EggsHunter.forceCheck();
}
```

### 3. **Monitoramento de Progresso**
```javascript
// Verificar progresso a cada minuto
setInterval(async () => {
  const stats = await window.EggsHunter.getStats();
  console.log(`Progresso: ${stats.wifsStored}/${stats.maxBeforeCheck}`);
}, 60000);
```

## ⚙️ Integração com o Sistema

### auto16.js (Modo Normal)
```javascript
// 🥚 EGGS HUNTER: Adiciona WIFs para verificação de saldo
if (window.EggsHunter) {
  window.EggsHunter.addWif(wifCompressed, true);
  window.EggsHunter.addWif(wifUncompressed, false);
}
```

### auto16-preset.js (Modo Preset)
```javascript
// 🥚 EGGS HUNTER: Adiciona WIF comprimida
if (window.EggsHunter) window.EggsHunter.addWif(wif, true);

// 🥚 EGGS HUNTER: Adiciona WIF não comprimida
if (window.EggsHunter) window.EggsHunter.addWif(wif, false);
```

## 🔍 Logs do Console

### Durante Acumulação:
```
✅ IndexedDB inicializado
✅ Eggs Hunter V2 inicializado
📊 Acumulará 1000 WIFs antes de verificar
```

### Durante Verificação:
```
🔍 Iniciando verificação de 1000 WIFs...
📊 Progresso: 10.0% (100/1000)
📊 Progresso: 20.0% (200/1000)
...
📊 Progresso: 100.0% (1000/1000)
✅ Verificação concluída! 3 eggs encontrados.
🗑️ Banco de WIFs limpo
```

### Quando Encontra Egg:
```
🥚 [EGGS] SALDO ENCONTRADO! 1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH = 0.12345678 BTC
```

## ⚠️ Limitações

- API blockchain.info tem limite de requisições
- Máximo de 20 endereços por consulta
- Requer conexão com internet
- IndexedDB pode ser limpo pelo navegador (raro)

## 🔮 Diferenças V1 → V2

| Característica | V1 | V2 |
|----------------|----|----|
| Armazenamento | Memória (Set) | IndexedDB |
| Capacidade | ~100 WIFs | 1000+ WIFs |
| Persistência | Não | Sim |
| Verificação | Contínua (5s) | Em lote (1000) |
| Deduplicação | Set | Chave primária DB |
| Indicador | Não | Sim |
| Performance | Média | Alta |

## 🎉 Vantagens da V2

1. ✅ **10x mais WIFs** verificadas por ciclo
2. ✅ **Persistência** entre recarregamentos
3. ✅ **Performance superior** com IndexedDB
4. ✅ **Indicador visual** de progresso
5. ✅ **Menos requisições** à API (mais eficiente)
6. ✅ **Deduplicação nativa** do banco de dados
7. ✅ **Logs detalhados** de progresso

---

**Desenvolvido com 🥚 para o projeto Bitcoin Puzzle**  
**Versão 2.0 - Sistema Avançado de Acumulação**
