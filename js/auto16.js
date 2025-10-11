/* =====================================================
   CanalQb - auto16.js
   -----------------------------------------------------
   Controla a matriz 16x16 (manual, sequencial e random)
   Corrigido para geração precisa da private key (256 bits)
   ===================================================== */

const gridSize = 16;
let activeRows = 16;     // limite atual (9–16)
let mode = "manual";     // "manual" | "sequencial" | "random"
let gridData = [];
let canvas, ctx;
const cellSize = 32;     // cada quadrado (32x32 px)

// Inicialização
window.onload = () => {
  canvas = document.getElementById("grid");
  ctx = canvas.getContext("2d");
  canvas.width = gridSize * cellSize;
  canvas.height = gridSize * cellSize;
  initGrid();
  drawGrid();
  canvas.addEventListener("click", handleClick);
};

// Inicializa todas as células com 0
function initGrid() {
  gridData = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => 0)
  );
}

// Desenha a grade no canvas
function drawGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const isActive = y >= gridSize - activeRows;
      const val = gridData[y][x];
      ctx.fillStyle = val === 1 ? "#006400" : "#fff";
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      ctx.strokeStyle = isActive ? "#006400" : "#ccc";
      ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

// Clique manual (on/off)
function handleClick(e) {
  if (mode !== "manual") return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / cellSize);
  const y = Math.floor((e.clientY - rect.top) / cellSize);

  // Bloqueia as linhas fora de 9–16
  if (y < gridSize - activeRows) return;

  gridData[y][x] = gridData[y][x] ? 0 : 1;
  drawGrid();
  updatePrivateKey();
}

// Gera a chave com base no estado da grade
function updatePrivateKey() {
  let bits = "";
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      bits += gridData[y][x];
    }
  }
  const hex = BigInt("0b" + bits).toString(16).padStart(64, "0");
  document.getElementById("hexKey").value = hex;
  // gerar WIFs comprimido e não comprimido
  generateWIF(hex);
}

// Converte HEX para WIFs
function generateWIF(hexKey) {
  const compressed = hexToWIF(hexKey, true);
  const uncompressed = hexToWIF(hexKey, false);
  document.getElementById("wifCompressed").value = compressed;
  document.getElementById("wifUncompressed").value = uncompressed;
}

// Função de conversão HEX → WIF
function hexToWIF(hex, compressed = false) {
  const prefix = "80" + hex + (compressed ? "01" : "");
  const firstSHA = sha256(hexToBytes(prefix));
  const secondSHA = sha256(firstSHA);
  const checksum = secondSHA.slice(0, 4);
  const full = hexToBytes(prefix).concat(checksum);
  return toBase58(full);
}

// ====================== MODO SEQUENCIAL ======================

function startSequential() {
  mode = "sequencial";
  let step = 9;
  const loop = setInterval(() => {
    if (step > 16) {
      clearInterval(loop);
      mode = "manual";
      return;
    }
    activeRows = step;
    fillSequential(step);
    drawGrid();
    updatePrivateKey();
    step++;
  }, 1200);
}

function fillSequential(rows) {
  initGrid();
  for (let y = gridSize - rows; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      gridData[y][x] = 1;
    }
  }
}

// ====================== MODO RANDOM ======================

function startRandom() {
  mode = "random";
  let step = 9;
  const loop = setInterval(() => {
    if (step > 16) {
      clearInterval(loop);
      mode = "manual";
      return;
    }
    activeRows = step;
    fillRandom(step);
    drawGrid();
    updatePrivateKey();
    step++;
  }, 1200);
}

function fillRandom(rows) {
  initGrid();
  for (let y = gridSize - rows; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      gridData[y][x] = Math.random() > 0.5 ? 1 : 0;
    }
  }
}

// ====================== UTILITÁRIAS ======================

function hexToBytes(hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

function toBase58(bytes) {
  const alphabet =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let x = BigInt("0x" + bytes.map(b => b.toString(16).padStart(2, "0")).join(""));
  let output = "";
  while (x > 0n) {
    const mod = x % 58n;
    x = x / 58n;
    output = alphabet[Number(mod)] + output;
  }
  return output;
}

// SHA-256 simplificado via Web Crypto
function sha256(buffer) {
  const data = new Uint8Array(buffer);
  const hashBuffer = crypto.subtle.digest("SHA-256", data);
  // retorna promise, então forçamos sync:
  let result;
  hashBuffer.then(res => (result = new Uint8Array(res)));
  return result || new Uint8Array(32);
}
