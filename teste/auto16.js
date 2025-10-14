// auto16.js

// Configurações iniciais
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const cellSize = 32; // tamanho da célula em pixels (512px / 16 = 32px)

// Estado do grid e configurações
const GRID_SIZE = 16;
let rows = 12;          // Altura inicial padrão
let cols = 16;          // Base inicial padrão
let extraLine = 1;      // Linha extra padrão
let isRunning = false;
let speed = 500;        // velocidade em ms

// Matrizes e estados das células
let gridData = [];
let intervalId = null;

// Elementos DOM
const heightButtonsContainer = document.getElementById('heightButtons');
const baseButtonsContainer = document.getElementById('baseButtons');
const extraLineButtonsContainer = document.getElementById('extraLineButtons');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const randBtn = document.getElementById('randBtn');

const speedInput = document.getElementById('speed');
const speedLabel = document.getElementById('speedLabel');

const activeRangeLabel = document.getElementById('activeRangeLabel');

const hexBox = document.getElementById('hexBox');
const wifBox = document.getElementById('wifBox');
const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

const toggleOnClickCheckbox = document.getElementById('toggleOnClick');
const randomizeStatesOnStepCheckbox = document.getElementById('randomizeStatesOnStep');

const modeRadios = document.querySelectorAll('input[name="mode"]');

// Inicialização

// Cria botões para seleção de altura (1 a 16)
function createHeightButtons() {
  for (let i = 1; i <= GRID_SIZE; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'range-btn';
    btn.dataset.rows = i;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      setRows(i);
    });
    heightButtonsContainer.appendChild(btn);
  }
}

// Cria botões para seleção de base (1 a 16)
function createBaseButtons() {
  for (let i = 1; i <= GRID_SIZE; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'range-btn';
    btn.dataset.cols = i;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      setCols(i);
    });
    baseButtonsContainer.appendChild(btn);
  }
}

// Cria botões para seleção da linha extra (0 a 16)
function createExtraLineButtons() {
  for (let i = 0; i <= GRID_SIZE; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'range-btn';
    btn.dataset.extra = i;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      setExtraLine(i);
    });
    extraLineButtonsContainer.appendChild(btn);
  }
}

// Atualiza o texto e botões para seleção de altura
function setRows(newRows) {
  rows = newRows;
  updateActiveButtons(heightButtonsContainer, rows, 'rows');
  updateActiveRangeLabel();
  resetGrid();
  renderGrid();
}

// Atualiza o texto e botões para seleção de base
function setCols(newCols) {
  cols = newCols;
  updateActiveButtons(baseButtonsContainer, cols, 'cols');
  updateActiveRangeLabel();
  resetGrid();
  renderGrid();
}

// Atualiza a linha extra selecionada
function setExtraLine(newExtra) {
  extraLine = newExtra;
  updateActiveButtons(extraLineButtonsContainer, extraLine, 'extra');
}

// Marca o botão ativo e desmarca os outros
function updateActiveButtons(container, activeValue, dataAttribute) {
  const buttons = container.querySelectorAll('button.range-btn');
  buttons.forEach(btn => {
    const val = parseInt(btn.dataset[dataAttribute]);
    if (val === activeValue) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });
}

// Atualiza o texto que mostra a faixa ativa e linha extra
function updateActiveRangeLabel() {
  activeRangeLabel.textContent = `Linha ${rows} até ${cols}, linha extra: ${extraLine}`;
}

// Inicializa a matriz com 0 (desligado)
function resetGrid() {
  gridData = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    const row = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      row.push(false);
    }
    gridData.push(row);
  }
  updateOutputFields();
}

// Desenha a matriz no canvas
function renderGrid() {
  canvas.width = GRID_SIZE * cellSize;
  canvas.height = GRID_SIZE * cellSize;

  // Fundo branco
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Desenha células
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const isActive = gridData[r][c];
      // Define cor da célula
      if (isActive) {
        ctx.fillStyle = '#667eea';
      } else {
        ctx.fillStyle = '#e2e8f0';
      }
      ctx.fillRect(c * cellSize, r * cellSize, cellSize - 1, cellSize - 1); // com gap de 1 px

      // Delimitar as células em borda
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 1;
      ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
    }
  }
}

// Alterna o estado da célula clicada
function toggleCell(x, y) {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
  gridData[y][x] = !gridData[y][x];
  renderGrid();
  updateOutputFields();
}

// Converte o estado atual da matriz para um valor hexadecimal simplificado (exemplo)
function gridToHex() {
  // Exemplo simples: transforma as linhas entre rows e cols em bits numa string hex
  let bits = '';

  // Limitar entre rows e cols para evitar erro
  let startRow = Math.min(rows, cols);
  let endRow = Math.max(rows, cols);

  for (let r = startRow - 1; r < endRow; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      bits += gridData[r][c] ? '1' : '0';
    }
  }

  // Também usar a extraLine
  if (extraLine > 0 && extraLine <= GRID_SIZE) {
    for (let c = 0; c < GRID_SIZE; c++) {
      bits += gridData[extraLine - 1][c] ? '1' : '0';
    }
  }

  // Converte bits para hex
  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    let chunk = bits.substr(i, 4);
    let val = parseInt(chunk, 2);
    hex += val.toString(16);
  }
  return hex.toUpperCase();
}

// Atualiza os campos de saída com as chaves (aqui só hex, a transformação WIF é complexa)
function updateOutputFields() {
  const hex = gridToHex();

  hexBox.value = hex;
  // Placeholder para WIF (comprimido e não comprimido)
  wifBox.value = 'WIF (comprimido) — em desenvolvimento';
  wifBoxUncompressed.value = 'WIF (não comprimido) — em desenvolvimento';
}

// Gera grid aleatório
function randomizeGrid() {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      gridData[r][c] = Math.random() > 0.5;
    }
  }
  renderGrid();
  updateOutputFields();
}

// Função para atualizar o grid a cada passo (sequencial ou vertical)
function stepGrid() {
  // Exemplo simples: alterna algumas células nas linhas selecionadas para demonstrar passo
  for (let r = rows - 1; r < cols; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (randomizeStatesOnStepCheckbox.checked) {
        gridData[r][c] = Math.random() > 0.5;
      } else {
        gridData[r][c] = !gridData[r][c]; // alterna o estado
      }
    }
  }
  renderGrid();
  updateOutputFields();
}

// Inicia a animação/passo automático
function start() {
  if (isRunning) return;
  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;

  intervalId = setInterval(stepGrid, speed);
}

// Para a animação
function stop() {
  if (!isRunning) return;
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;

  clearInterval(intervalId);
}

// Limpa a matriz
function clear() {
  stop();
  resetGrid();
  renderGrid();
}

// Atualiza a velocidade conforme o input range
function updateSpeed(newSpeed) {
  speed = newSpeed;
  speedLabel.textContent = `${speed} ms`;
  if (isRunning) {
    stop();
    start();
  }
}

// Captura clique no canvas para alternar célula se ativo
function onCanvasClick(event) {
  if (!toggleOnClickCheckbox.checked) return;

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) / cellSize);
  const y = Math.floor((event.clientY - rect.top) / cellSize);

  toggleCell(x, y);
}

// Inicialização ao carregar página
function init() {
  createHeightButtons();
  createBaseButtons();
  createExtraLineButtons();

  // Set valores padrões e botões ativos
  setRows(rows);
  setCols(cols);
  setExtraLine(extraLine);

  resetGrid();
  renderGrid();

  updateSpeed(speed);

  // Event listeners
  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', clear);
  randBtn.addEventListener('click', () => {
    randomizeGrid();
  });

  speedInput.addEventListener('input', (e) => {
    updateSpeed(parseInt(e.target.value));
  });

  canvas.addEventListener('click', onCanvasClick);
}

// Run init after DOM loaded
window.addEventListener('DOMContentLoaded', init);
