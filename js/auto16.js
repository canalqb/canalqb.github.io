// auto16.js
// Gerador de Private Keys — grade 16x16
// Requisitos: arquivo incluído no HTML que você enviou.
// (c) CanalQb — Rodrigo Carlos Moraes (exemplo / utilitário)

// ---------- Configurações ----------
const GRID_SIZE = 16;            // 16x16
const CELL_PADDING = 1;         // pixels entre células
const DEFAULT_SPEED = 500;      // ms
const DEFAULT_MAX_STEPS = 1000000; // limite prático para varredura sequencial por segurança
// ------------------------------------

/* ----- Utilitários criptográficos ----- */
// converte ArrayBuffer para hex
function bufferToHex(buf) {
  const bytes = new Uint8Array(buf);
  return Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
}

// sha256 usando Web Crypto API
async function sha256(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return new Uint8Array(hash);
}

// base58check (para WIF)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function bytesToBase58(bytes) {
  // big integer conversion
  let i = 0;
  while (i < bytes.length && bytes[i] === 0) i++;
  let num = BigInt(0);
  for (let j = i; j < bytes.length; j++) {
    num = (num << BigInt(8)) + BigInt(bytes[j]);
  }
  let chars = '';
  while (num > 0) {
    const mod = num % BigInt(58);
    chars = BASE58_ALPHABET[Number(mod)] + chars;
    num = num / BigInt(58);
  }
  // leading zeros
  for (let z = 0; z < i; z++) chars = '1' + chars;
  return chars || '1';
}
async function base58CheckEncode(payloadBytes) {
  // payloadBytes: Uint8Array
  const hash1 = await sha256(payloadBytes.buffer);
  const hash2 = await sha256(hash1.buffer);
  const checksum = hash2.slice(0,4);
  const full = new Uint8Array(payloadBytes.length + 4);
  full.set(payloadBytes, 0);
  full.set(checksum, payloadBytes.length);
  return bytesToBase58(full);
}
// Gera WIF (comprimido e não comprimido)
async function toWIF(privateKeyUint8Array) {
  // privateKeyUint8Array: 32 bytes
  const prefix = new Uint8Array([0x80]);
  const uncompressed = new Uint8Array(1 + privateKeyUint8Array.length);
  uncompressed.set(prefix,0);
  uncompressed.set(privateKeyUint8Array,1);
  const compressed = new Uint8Array(1 + privateKeyUint8Array.length + 1);
  compressed.set(prefix,0);
  compressed.set(privateKeyUint8Array,1);
  compressed[compressed.length - 1] = 0x01;

  const wifUncomp = await base58CheckEncode(uncompressed);
  const wifComp = await base58CheckEncode(compressed);
  return { wifUncomp, wifComp };
}

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
let activeHeight = 16; // default
let speed = DEFAULT_SPEED;
let maxSteps = DEFAULT_MAX_STEPS;
speedLabel.textContent = speed;
activeHeightLabel.textContent = activeHeight;

// cria botões de altura 9..16
(function createHeightButtons(){
  for (let h = 9; h <= 16; h++) {
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
  // marca area ativa (retângulo 16 x activeHeight)
  ctx.strokeStyle = 'rgba(255,99,71,0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(CELL_PADDING, CELL_PADDING, cellSize*GRID_SIZE - CELL_PADDING*2, cellSize*activeHeight - CELL_PADDING*2);
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
  // atualiza exibição da chave atual
  updateKeysDisplayFromGrid();
});

// transforma bits da grid (top->bottom, left->right) em 32 bytes (256 bits)
// se activeHeight < 16, as linhas abaixo de activeHeight ficam 0
function gridToPrivateKeyBytes() {
  const bytes = new Uint8Array(32);
  // definimos mapeamento: linha 0 (top) -> bits mais significativos do início do array ou fim?
  // Vamos preencher bytes[0] como primeiros 8 bits da leitura (MSB-first por byte)
  let bitIndex = 0;
  for (let y=0; y<GRID_SIZE; y++){
    for (let x=0; x<GRID_SIZE; x++){
      const withinActive = y < activeHeight; // linhas acima de activeHeight consideram-se ativas
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
  // compute WIFs
  const { wifUncomp, wifComp } = await toWIF(keyBytes);
  wifBox.value = wifComp;
  wifBoxUncompressed.value = wifUncomp;
}

/* ----- Sequencial counter over active rectangle ----- */
// Mapeamento de bits que serão incrementados: lista de índices (0..255) correspondendo ao retângulo ativo.
function activeBitIndicesList() {
  const indices = [];
  let bitIndex = 0;
  for (let y=0; y<GRID_SIZE; y++){
    for (let x=0; x<GRID_SIZE; x++){
      // somente bits dentro activeHeight são mutáveis; fora ficam 0
      if (y < activeHeight) indices.push({x,y,bitIndex});
      bitIndex++;
    }
  }
  return indices; // ordem: top->bottom, left->right
}

// aplica um número (BigInt) como padrão binário nos bits ativos (LSB maps to last index?)
// Aqui assumimos contador de 0 -> 2^n - 1, mapeamos LSB para último elemento (direita inferior) para leitura natural.
// Para simplicidade mapeamos LSB ao final da lista (último índice) — assim incrementa "direita -> esquerda, baixo -> cima".
function applyCounterToGrid(counterBigInt, activeList) {
  // zera todos bits primeiros (dentro do active area)
  for (const it of activeList) setCell(it.x, it.y, 0);
  let i = 0n;
  for (let pos = activeList.length - 1; pos >= 0; pos--) {
    if (counterBigInt === 0n && i > 60n) { // pequeno otimizador
      // se counter já zero, os bits remanescentes são zero
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

  // heights 9 -> 16 as requested
  const heights = [];
  for (let h = 9; h <= 16; h++) heights.push(h);

  try {
    for (const h of heights) {
      if (abortRun) break;
      activeHeight = h;
      activeHeightLabel.textContent = activeHeight;
      const activeList = activeBitIndicesList();
      const nBits = activeList.length;

      const mode = getMode();

      if (mode === 'sequential') {
        // sequencial: contador de 0..(2^nBits - 1) — porém limitamos a maxSteps
        let step = 0;
        let counter = 0n;
        const maxPossible = (nBits >= 64) ? null : ((1n << BigInt(nBits)) - 1n);
        const stepsLimit = Math.min(maxSteps, (maxPossible === null ? maxSteps : Number(maxPossible)+1 || maxSteps));

        while (!abortRun) {
          // aplicar contador aos bits ativos
          applyCounterToGrid(counter, activeList);

          // se usuario pediu aleatorizar no passo, mesclar
          if (randomizeOnStepEl.checked) randomizeActiveArea(activeList);

          render();
          await updateKeysDisplayFromGrid();

          step++;
          if (step >= stepsLimit) break;

          counter = counter + 1n;
          await sleep(speed);
        }
      } else {
        // random mode: gera estados aleatórios indefinidamente até o próximo height ou stop
        while (!abortRun) {
          randomizeActiveArea(activeList);
          render();
          await updateKeysDisplayFromGrid();
          await sleep(speed);
          // break condition: we continue randomizing until user stops or we proceed to next height after some iterations?
          // Para ser previsível, vamos repetir activeHeight steps = maxSteps/16 (dividido entre alturas) ou até stop
          // aqui opcional: mantendo it indefinido, usuário deve parar.
          // Para segurança, respeitamos maxSteps per height:
          // implementamos contador local:
          break; // gerar apenas 1 padrão por altura por loop para evitar bloqueio extenso
        }
      }
      // se modo random, vamos gerar 'some' vezes. Para sequential passamos ao próximo height automaticamente.
      if (abortRun) break;
      // se mode random, gerar N vez por altura (por exemplo 10) para mostrar variações
      if (getMode() === 'random') {
        const repeats = 10;
        const activeList2 = activeBitIndicesList();
        for (let r = 0; r < repeats; r++) {
          if (abortRun) break;
          randomizeActiveArea(activeList2);
          render();
          await updateKeysDisplayFromGrid();
          await sleep(speed);
        }
      }
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
  // nota: se quiser rodar infinitamente, apenas mantenha maxSteps alto
  // mostramos um prompt de segurança opcional para ajustar maxSteps (sem bloquear)
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
  // aleatoriza toda a grade
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
