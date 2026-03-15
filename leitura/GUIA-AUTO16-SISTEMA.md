# Documentação Completa - auto16.js

## Visão Geral

O arquivo `auto16.js` é o coração do sistema de geração e análise de chaves Bitcoin do site. Ele combina duas funcionalidades principais:
1. **Sistema de Geração de Chaves** com matriz 16x16 interativa
2. **Detector de Puzzles Bitcoin** para monitoramento automático de soluções

---

## 🏗️ Estrutura do Arquivo

### 1. CONFIGURAÇÃO BÁSICA (Linhas 7-11)
```javascript
const SIZE = 16;           // Tamanho fixo da matriz 16x16
let CELL_SIZE = 12;        // Tamanho de cada célula em pixels
let MARGIN_LEFT = 50;      // Margem esquerda do canvas
let MARGIN_TOP = 50;       // Margem superior do canvas
let MARGIN_RIGHT = 100;    // Margem direita do canvas
```

**Propósito:** Define as dimensões e espaçamentos da matriz visual.

---

### 2. ELEMENTOS DOM (Linhas 17-52)

#### Canvas e Controles Principais
- `canvas`: Elemento HTML5 para desenhar a matriz
- `ctx`: Contexto 2D do canvas para renderização
- `startBtn`, `stopBtn`, `clearBtn`, `randBtn`: Botões de controle
- `toggleOnClickCheckbox`: Habilita/desabilita cliques na matriz

#### Caixas de Saída
- `hexBox`: Exibe chaves em formato hexadecimal
- `wifBox`: Exibe chaves WIF comprimidas
- `wifBoxUncompressed`: Exibe chaves WIF não comprimidas

#### Contêineres de UI
- `heightButtonsDiv`, `baseButtonsDiv`: Botões de seleção de faixa
- `extraButtonsDiv`: Botões para linha extra

---

### 3. ESTADO PRINCIPAL (Linhas 58-77)

#### Variáveis de Estado
```javascript
let altura = 12;           // Altura inicial da faixa ativa
let base = 16;             // Base inicial da faixa ativa
let gridState = Array(SIZE * SIZE).fill(false);  // Estado da matriz
let stateCounter = 0n;    // Contador de estados (BigInt)
let presetBits = 0n;      // Bits do preset atual
let currentRealValue = 0n; // Valor real no modo sequencial
let running = false;       // Estado de execução
let timeoutId = null;      // ID do timeout para animação
```

#### Modo Sequencial Bidirecional
```javascript
let dualMode = true;       // Ativa modo duas pontas (zig-zag)
let dualLowOffset = 0n;    // Offset do lado baixo
let dualHighOffset = 0n;   // Offset do lado alto
let dualFromLow = true;    // Alterna entre lados
```

#### Integração com Supabase
```javascript
let currentPresetData = null;     // Dados do preset atual
let isUsingSupabaseRange = false;  // Flag de uso do Supabase
```

---

### 4. LINHA EXTRA (Linhas 82-87)

#### Estado da Linha Extra
```javascript
let extraRow = null;        // Número da linha extra (null = desativada)
let extraRowCols = new Set(); // Colunas selecionadas na linha extra
```

#### Contêiner UI
```javascript
const extraColsContainer = document.createElement('div');
extraColsContainer.className = 'extra-cols-container';
```

**Propósito:** Permite selecionar células fora da faixa principal para cálculos especiais.

---

### 5. CONTROLE DE LINHAS DOS TEXTAREAS (Linhas 93-144)

#### Limitação de Linhas
```javascript
const MAX_LINES = 100;  // Máximo de linhas nos textareas
```

#### Funções de Gerenciamento
- `updateActiveRangeLabel()`: Atualiza label da faixa ativa
- `showTemporaryRangeIndicator()`: Mostra indicador temporário
- `limitTextareaLines()`: Limita número de linhas
- `scrollToBottom()`: Scroll automático para o final

**Propósito:** Evita sobrecarga de memória e mantém UI responsiva.

---

### 6. CANVAS RESPONSIVO (Linhas 150-171)

#### Função `adjustCanvas()`
- Calcula tamanho do container
- Ajusta `CELL_SIZE` dinamicamente
- Define margens responsivas por breakpoint
- Redimensiona canvas

#### Breakpoints
- `< 768px`: Margens reduzidas para mobile
- `< 992px`: Margens médias para tablets
- `>= 992px`: Margens grandes para desktop

---

### 7. DESENHO DO GRID (Linhas 176-237)

#### Função `drawGrid()`
1. **Limpeza**: Limpa canvas completamente
2. **Numeração**: Desenha números de colunas (1-16) e linhas (1-16)
3. **Células**: Preenche cada célula basedo em `gridState`
4. **Faixa Principal**: Destaque azul para área ativa (altura-base)
5. **Linha Extra**: Destaque laranja para células extra

#### Cores
- Verde (`#48bb78`): Células ativas
- Branco (`#ffffff`): Células inativas
- Azul transparente: Faixa principal
- Laranja transparente: Linha extra

---

### 8. BOTÕES ALTURA/BASE (Linhas 243-286)

#### Função `createRangeButtons()`
- Cria 16 botões para altura e 16 para base
- Destaca botão ativo com classe `.active`
- Implementa validação (base >= altura)
- Atualiza UI completamente ao clicar

#### Lógica de Validação
- Ao mudar altura: Ajusta base se necessário
- Ao mudar base: Ajusta altura se necessário
- Sempre atualiza botões e labels

---

### 9. LINHA EXTRA - BOTÕES DINÂMICOS (Linhas 292-327)

#### Função `validateExtraRow()`
- Remove linha extra se estiver na faixa principal
- Limpa seleções de colunas

#### Função `updateExtraRowButtons()`
- Cria 16 botões para seleção de linha extra
- Desabilita botões dentro da faixa principal
- Permite toggle (ativa/desativa) linha extra

---

### 10. COLUNAS DA LINHA EXTRA (Linhas 333-364)

#### Função `updateExtraColsUI()`
- Cria grid de 16 botões para seleção de colunas
- Apenas visível quando linha extra está ativa
- Permite seleção múltipla de colunas
- Atualiza em tempo real

---

### 11. CRIPTO/OUTPUT (Linhas 370-465)

#### Função `gridToHex()`
**Modo Sequencial com Preset:**
- Usa `currentRealValue` calculado
- Retorna hexadecimal de 64 caracteres

**Modo Tradicional:**
- Percorre matriz calculando bit_index
- Fórmula: `bit_index = (16 - linha) × 16 + (16 - coluna)`
- Adiciona offset de preset se aplicável

#### Funções Criptográficas
- `sha256()`: Hash SHA-256 usando Web Crypto API
- `hexToBytes()`: Converte hex para Uint8Array
- `toWIF()`: Converte hex para WIF (comprimido/não)
- `base58()`: Codificação Base58 para Bitcoin

#### Função `updateOutput()`
- Adiciona novas linhas aos textareas
- Limita a 100 linhas
- Scroll automático
- Integração com ProgressTracker

---

### 12. CÁLCULO DE CÉLULAS ATIVAS (Linhas 471-511)

#### Função `getActiveCells()`
**Modo Horizontal:**
- Percorre faixa principal linha por linha
- Adiciona células da linha extra se existir

#### Função `getActiveCellsVertical()`
**Modo Vertical:**
- Percorre faixa principal coluna por coluna
- Adiciona células da linha extra se existir

**Propósito:** Define ordem de processamento dos bits.

---

### 13. SEQUÊNCIA (Linhas 517-733)

#### Função `step()` - Coração do Sistema

**1. Detecção de Modo:**
- Lê modo selecionado (horizontal/vertical)
- Obtém células ativas correspondentes

**2. Cálculo do Valor Real:**
- **Com Supabase:** Usa range do banco de dados
- **Sem Supabase:** Usa range padrão
- **Modo Dual:** Zig-zag entre início e fim

**3. Mapeamento para Matriz:**
- Converte valor para binário
- Ordena células (MSB primeiro)
- Preenche `gridState` com bits

**4. Atualização:**
- Redesenha grid
- Gera chaves WIF
- Agenda próximo passo (25ms)

#### Modos de Operação
- **Sequencial Normal:** Incremento linear
- **Sequencial Dual:** Zig-zag bidirecional
- **Aleatório:** Distribuição randômica

---

### 14. CONTROLE DE EXECUÇÃO (Linhas 709-733)

#### Função `start()`
- Ativa modo execução
- Reseta controles dual
- Inicia loop de animação

#### Função `stop()`
- Para execução
- Limpa timeout
- Para ProgressTracker

---

### 15. CLIQUE NO CANVAS (Linhas 739-775)

#### Event Listener de Click
- Calcula coordenadas do mouse
- Converte para índices de matriz
- Mostra indicador de posição
- Permite toggle de células
- Suporte para linha extra

---

### 16. EVENTOS (Linhas 781-842)

#### Botões Principais
- **Clear:** Reseta tudo (estado, presets, UI)
- **Random:** Randomiza células ativas
- **Resize:** Ajusta canvas responsivo

#### Eventos Customizados
- `presetChanged`: Disparado ao mudar preset
- Atualiza visibilidade de controles

---

### 17. PRESET COM SUPABASE (Linhas 847-962)

#### Função `applyPresetBits()`
**Parâmetros:**
- `bitCount`: Número de bits do preset

**Processo:**
1. Armazena preset e reseta contador
2. Calcula linhas e colunas
3. Configura linha extra se necessário
4. Busca dados do Supabase
5. Cria registro inicial se não existir
6. Inicia ProgressTracker

#### Função `updateDatabaseStatus()`
- Exibe status do banco de dados
- Mostra intervalo processado
- Formata timestamp

---

### 18. SISTEMA DE DETECÇÃO DE PUZZLES (Linhas 976-1343)

#### Configuração dos Puzzles
```javascript
const puzzleConfig = {
  1: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
  // ... até o puzzle 160
};
```

#### Estado do Detector
```javascript
const puzzleMap = new Map();    // Mapa de puzzles
const found = new Map();        // Puzzles encontrados
```

#### Funções Principais

**`initializePuzzleMap()`**
- Converte objeto para Map
- Carrega 160 puzzles Bitcoin

**`checkWifAgainstPuzzles()`**
- Verifica WIF contra todos os puzzles
- Usa bitcoinjs para converter WIF → endereço
- Registra puzzles encontrados
- Atualiza modal automaticamente

**`updateModalDisplay()`**
- Atualiza contador do modal
- Integra com API do modal

**`updateModalContent()`**
- Gera HTML da lista de puzzles
- Formata timestamps
- Ordena por número

**`observeTextarea()`**
- Monitora mudanças nos textareas
- Verifica todas as linhas automaticamente
- Usa MutationObserver + eventos

#### API Pública
```javascript
window.puzzlesDetector = {
  checkWif: (wif, type) => {...},
  getFound: () => {...},
  clearFound: () => {...},
  refreshModal: () => {...}
};
```

---

## 🔄 Fluxo de Funcionamento

### Inicialização
1. Carrega configurações básicas
2. Cria elementos UI
3. Inicializa mapa de puzzles
4. Configura observadores
5. Desenha grid inicial

### Geração de Chaves
1. Define faixa (altura/base)
2. Opcional: seleciona linha extra
3. Inicia modo (sequencial/aleatório)
4. Processa bits em ordem definida
5. Converte para hexadecimal/WIF
6. Exibe nos textareas

### Detecção de Puzzles
1. Observa textareas continuamente
2. Verifica cada WIF gerado
3. Compara com puzzles conhecidos
4. Notifica se encontrar solução
5. Atualiza modal automaticamente

---

## 🎛️ Configurações e Personalização

### Constantes Modificáveis
- `SIZE`: Tamanho da matriz (padrão: 16)
- `MAX_LINES`: Máximo de linhas nos textareas (padrão: 100)
- Velocidade de animação: 25ms (linha 706)

### Temas e Cores
- Verde ativo: `#48bb78`
- Azul faixa: `rgba(102,126,234,0.25)`
- Laranja extra: `rgba(255,165,0,0.45)`

### Breakpoints Responsivos
- Mobile: `< 768px`
- Tablet: `< 992px`
- Desktop: `>= 992px`

---

## 🔧 Integrações Externas

### Supabase
- Armazenamento de ranges de presets
- Sincronização entre usuários
- Controle de progresso

### Bitcoin.js
- Conversão WIF → endereço
- Validação de chaves privadas
- Suporte a compressão

### ProgressTracker
- Monitoramento de progresso
- Interface visual de avanço
- Persistência de estado

---

## 📊 Performance e Otimização

### Estratégias Implementadas
- **BigInt**: Para operações com grandes números
- **MutationObserver**: Detecção eficiente de mudanças
- **Debouncing**: Limitação de verificações
- **Lazy Loading**: Carregamento sob demanda
- **Memory Management**: Limitação de linhas nos textareas

### Limitações
- Máximo 100 linhas nos textareas
- Velocidade fixa de 25ms
- Tamanho fixo da matriz (16x16)

---

## 🐛 Debug e Monitoramento

### Logs Implementados
- Inicialização de componentes
- Mudanças de estado
- Detecção de puzzles
- Erros de validação
- Status do Supabase

### Console Commands Úteis
```javascript
// Ver puzzles encontrados
window.puzzlesDetector.getFound()

// Limpar puzzles encontrados
window.puzzlesDetector.clearFound()

// Verificar WIF manualmente
window.puzzlesDetector.checkWif('seu_wif_aqui')
```

---

## 🚀 Futuras Melhorias

### Sugeridas
1. **Configuração de velocidade**: Permitir ajuste do delay
2. **Exportação de resultados**: Salvar chaves em arquivo
3. **Modo de pausa**: Pausar/resumir execução
4. **Visualização 3D**: Representação tridimensional
5. **Batch processing**: Processar múltiplos ranges

### Técnicas
1. **Web Workers**: Processamento em background
2. **IndexedDB**: Cache local de resultados
3. **Service Worker**: Funcionalidade offline
4. **WebAssembly**: Otimização de criptografia

---

## 📝 Conclusão

O `auto16.js` é um sistema robusto e completo que combina:
- **Interface intuitiva** para geração de chaves Bitcoin
- **Algoritmos eficientes** para processamento de bits
- **Detecção automática** de puzzles Bitcoin
- **Integração moderna** com APIs externas
- **Design responsivo** para todos os dispositivos

Sua arquitetura modular permite fácil manutenção e expansão, enquanto suas otimizações garantem performance mesmo com grandes volumes de dados.
