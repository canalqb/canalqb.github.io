// auto16.js - Ajustado para altura ativa 9..16 e invertida verticalmente

// ---------- Configurações ----------
const GRID_SIZE = 16;            // 16x16
const CELL_PADDING = 1;         // pixels entre células
const DEFAULT_SPEED = 500;      // ms
const DEFAULT_MAX_STEPS = 1000000; // limite prático para varredura sequencial por segurança
// ------------------------------------

/* ----- ... [seu código de utilitários criptográficos permanece igual] ----- */

/* ----- DOM & Canvas ----- */
const canvas = document.getElementById('grid');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const randBtn = document.getElementById('randBtn');
const speedInput = document.getElementById('speed');
const speedLabel = document.getElementById('speedLabel');
const activeHeightLabel = document.getElementById('activeHeightLabel');
const heightButtons = document.getElementById('heightButtons');
const hexBox = document.getElementById('hexBox');
const wifBox = document.getElementById('wifBox');
const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');
const modeRadios = document.getElementsByName('mode');
const toggleOnClickEl = document.getElementById('toggleOnClick');
const randomizeOnStepEl = document.getElementById('randomizeStatesOnStep');

let cellSize = Math.floor(canvas.width / GRID_SIZE);
let grid = new Array(GRID_SIZE * GRID_SIZE).fill(0); // 0 = off, 1 = on
let running = false;
let abortRun = false;

const MIN_ACTIVE_HEIGHT = 9;
const MAX_ACTIVE_HEIGHT = 16;

let activeHeight = MIN_ACTIVE_HEIGHT; // default inicia em 9
let speed = DEFAULT_SPEED;
let maxSteps = DEFAULT_MAX_STEPS;
speedLabel.textContent = speed;
activeHeightLabel.textContent = activeHeight;

// Cria botões de altura 16 (topo) até 9 (base) - invertido visualmente para refletir "de baixo pra cima"
(function createHeightButtons(){
  for (let h = MAX_ACTIVE_HEIGHT; h >= MIN_ACTIVE_HEIGHT; h--) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-sm btn-outline-primary size-btn';
    btn.textContent = h;
    btn.onclick = () => {
      activeHeight = h;
      activeHeightLabel.textContent = activeHeight;
      render();
    };
    heightButtons.appendChild(btn);
  }
})();

function getMode() {
  return Array.from(modeRadios).find(r => r.checked).value;
}

function indexFromXY(x,y) { return y*GRID_SIZE + x; }
function setCell(x,y,val){ grid[indexFromXY(x,y)] = val ? 1 : 0; }
function getCell(x,y){ return grid[indexFromXY(x,y)]; }

function clearGrid(){
  grid.fill(0);
  render();
}

// Para altura ativa de baixo para cima, precisamos mapear activeHeight (9..16) para linhas na grid (0..15)
// Linha 0 = topo, linha 15 = base
// Exemplo: activeHeight=9 significa que linhas 7..15 estão ativas (ou seja, linhas 16..9 na contagem "humana")
// Logo:
// activeHeight invertido (em linha da grade) = GRID_SIZE - activeHeight

function isWithinActiveHeight(y) {
  // y é linha 0..15
  // linhas ativas são as últimas "activeHeight" linhas da grade
  return y >= (GRID_SIZE - activeHeight);
}

// desenha grade inteira
function render() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  cellSize = Math.floor(canvas.width / GRID_SIZE);
  for (let y=0; y<GRID_SIZE; y++){
    for (let x=0; x<GRID_SIZE; x++){
      const idx = indexFromXY(x,y);
      const val = grid[idx];
      const px = x*cellSize + CELL_PADDING;
      const py = y*cellSize + CELL_PADDING;
      const w = cellSize - CELL_PADDING*2;
      const h = cellSize - CELL_PADDING*2;
      ctx.fillStyle = val ? '#2ecc71' : '#ffffff';
      ctx.fillRect(px,py,w,h);
      ctx.strokeStyle = '#ddd';
      ctx.strokeRect(px,py,w,h);
    }
  }
  // marca area ativa (retângulo 16 x activeHeight) - area ativa nas linhas de baixo pra cima
  ctx.strokeStyle = 'rgba(255,99,71,0.9)';
  ctx.lineWidth = 2;
  const activeYStart = cellSize * (GRID_SIZE - activeHeight) + CELL_PADDING;
  ctx.strokeRect(CELL_PADDING, activeYStart, cellSize*GRID_SIZE - CELL_PADDING*2, cellSize*activeHeight - CELL_PADDING*2);
}

// clique para alternar célula (se ativado)
canvas.addEventListener('click', (ev) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor( (ev.clientX - rect.left) / cellSize );
  const y = Math.floor( (ev.clientY - rect.top) / cellSize );
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
  if (toggleOnClickEl.checked) {
    setCell(x,y, !getCell(x,y));
    render();
  }
  updateKeysDisplayFromGrid();
});

// transforma bits da grid (top->bottom, left->right) em 32 bytes (256 bits)
// se activeHeight < 16, linhas acima da área ativa ficam 0
function gridToPrivateKeyBytes() {
  const bytes = new Uint8Array(32);
  let bitIndex = 0;
  for (let y=0; y<GRID_SIZE; y++){
    for (let x=0; x<GRID_SIZE; x++){
      const withinActive = isWithinActiveHeight(y);
      let bit = 0;
      if (withinActive) {
        bit = getCell(x,y) ? 1 : 0;
      } else {
        bit = 0;
      }
      const bytePos = Math.floor(bitIndex / 8);
      const bitInByte = 7 - (bitIndex % 8); // MSB-first
      if (bit) bytes[bytePos] |= (1 << bitInByte);
      bitIndex++;
      if (bitIndex >= 256) break;
    }
    if (bitIndex >= 256) break;
  }
  return bytes;
}

async function updateKeysDisplayFromGrid(){
  const keyBytes = gridToPrivateKeyBytes();
  const hex = Array.from(keyBytes).map(b => b.toString(16).padStart(2,'0')).join('');
  hexBox.value = hex;
  const { wifUncomp, wifComp } = await toWIF(keyBytes);
  wifBox.value = wifComp;
  wifBoxUncompressed.value = wifUncomp;
}

/* ----- Sequencial counter over active rectangle ----- */
// Mapeamento de bits que serão incrementados: lista de índices (0..255) correspondendo ao retângulo ativo.
// Aqui também precisamos respeitar a inversão vertical no filtro activeHeight
function activeBitIndicesList() {
  const indices = [];
  let bitIndex = 0;
  for (let y=0; y<GRID_SIZE; y++){
    for (let x=0; x<GRID_SIZE; x++){
      if (isWithinActiveHeight(y)) indices.push({x,y,bitIndex});
      bitIndex++;
    }
  }
  return indices;
}

// aplica um número (BigInt) como padrão binário nos bits ativos
function applyCounterToGrid(counterBigInt, activeList) {
  for (const it of activeList) setCell(it.x, it.y, 0);
  let i = 0n;
  for (let pos = activeList.length - 1; pos >= 0; pos--) {
    if (counterBigInt === 0n && i > 60n) {
      break;
    }
    const bit = (counterBigInt & 1n) ? 1 : 0;
    const loc = activeList[pos];
    setCell(loc.x, loc.y, bit);
    counterBigInt = counterBigInt >> 1n;
    i++;
    if (pos === 0) break;
  }
}

/* ----- Randomize active area ----- */
function randomizeActiveArea(activeList) {
  for (const it of activeList) {
    const r = Math.random() < 0.5 ? 0 : 1;
    setCell(it.x, it.y, r);
  }
}

/* ----- Runner ----- */
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runGenerator() {
  if (running) return;
  running = true;
  abortRun = false;
  startBtn.disabled = true;
  stopBtn.disabled = false;

  // heights de 9 até 16
  const heights = [];
  for (let h = MIN_ACTIVE_HEIGHT; h <= MAX_ACTIVE_HEIGHT; h++) heights.push(h);

  try {
    for (const h of heights) {
      if (abortRun) break;
      activeHeight = h;
      activeHeightLabel.textContent = activeHeight;
      const activeList = activeBitIndicesList();
      const nBits = activeList.length;

      const mode = getMode();

      if (mode === 'sequential') {
        let step = 0;
        let counter = 0n;
        const maxPossible = (nBits >= 64) ? null : ((1n << BigInt(nBits)) - 1n);
        const stepsLimit = Math.min(maxSteps, (maxPossible === null ? maxSteps : Number(maxPossible)+1 || maxSteps));

        while (!abortRun) {
          applyCounterToGrid(counter, activeList);

          if (randomizeOnStepEl.checked) randomizeActiveArea(activeList);

          render();
          await updateKeysDisplayFromGrid();

          step++;
          if (step >= stepsLimit) break;

          counter = counter + 1n;
          await sleep(speed);
        }
      } else {
        // random mode: gera 10 padrões por altura para evitar bloqueio
        const repeats = 10;
        for (let r = 0; r < repeats; r++) {
          if (abortRun) break;
          randomizeActiveArea(activeList);
          render();
          await updateKeysDisplayFromGrid();
          await sleep(speed);
        }
      }
      if (abortRun) break;
    }
  } catch (e) {
    console.error('Runner error:', e);
  } finally {
    running = false;
    abortRun = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

/* ----- Eventos dos botões ----- */
startBtn.addEventListener('click', async () => {
  const newMax = prompt(`Limite de passos sequenciais por altura (padrão ${maxSteps}). Atenção: 2^n cresce rápido!\nInsira um número inteiro ou deixe em branco para manter:`, String(maxSteps));
  if (newMax !== null && newMax.trim() !== '') {
    const parsed = parseInt(newMax,10);
    if (!isNaN(parsed) && parsed > 0) maxSteps = parsed;
  }
  runGenerator();
});

stopBtn.addEventListener('click', () => {
  if (running) {
    abortRun = true;
  }
});

clearBtn.addEventListener('click', () => {
  clearGrid();
  updateKeysDisplayFromGrid();
});

randBtn.addEventListener('click', () => {
  for (let y=0; y<GRID_SIZE; y++){
    for (let x=0; x<GRID_SIZE; x++){
      setCell(x,y, Math.random() < 0.5 ? 1 : 0);
    }
  }
  render();
  updateKeysDisplayFromGrid();
});

speedInput.addEventListener('input', () => {
  speed = parseInt(speedInput.value,10);
  speedLabel.textContent = speed;
});

/* ----- Inicialização ----- */
render();
updateKeysDisplayFromGrid();
