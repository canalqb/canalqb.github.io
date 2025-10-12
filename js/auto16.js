<!-- ============================================ -->
<!-- ARQUIVO: js/auto16.js -->
<!-- ============================================ -->

document.addEventListener('DOMContentLoaded', () => {
  const SIZE = 16;
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');

  // Controles DOM
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');
  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');
  const toggleOnClickCheckbox = document.getElementById('toggleOnClick');
  const randomizeOnStepCheckbox = document.getElementById('randomizeStatesOnStep');
  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');
  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');

  // Estado
  let altura = 1;
  let base = SIZE;
  let gridState = new Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  // Funções auxiliares
  function getCellSize() {
    return canvas.width / SIZE;
  }

  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';

    for (let h = 1; h <= SIZE; h++) {
      const btn = document.createElement('button');
      btn.textContent = h;
      btn.className = 'range-btn';
      btn.dataset.h = h;
      btn.addEventListener('click', () => {
        if (running) return;
        altura = h;
        if (base < altura) base = altura;
        updateRangeButtons();
        drawGrid();
      });
      heightButtonsDiv.appendChild(btn);
    }

    for (let b = 1; b <= SIZE; b++) {
      const btn = document.createElement('button');
      btn.textContent = b;
      btn.className = 'range-btn';
      btn.dataset.b = b;
      btn.addEventListener('click', () => {
        if (running) return;
        base = b;
        if (base < altura) altura = base;
        updateRangeButtons();
        drawGrid();
      });
      baseButtonsDiv.appendChild(btn);
    }

    updateRangeButtons();
  }

  function updateRangeButtons() {
    heightButtonsDiv.querySelectorAll('button').forEach(btn => {
      const h = parseInt(btn.dataset.h, 10);
      btn.classList.toggle('active', h === altura);
    });

    baseButtonsDiv.querySelectorAll('button').forEach(btn => {
      const b = parseInt(btn.dataset.b, 10);
      btn.classList.toggle('active', b === base);
    });

    document.getElementById('activeRangeLabel').textContent = `${altura} até ${base}`;
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const CELL_SIZE = getCellSize();

    // Desenha células
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#ffffff';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destaca faixa ativa
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(0, yStart, SIZE * CELL_SIZE, heightPx);

    // Borda da faixa ativa
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, yStart, SIZE * CELL_SIZE, heightPx);
  }

  function gridToHex() {
    const bits = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        bits.push(gridState[y * SIZE + x] ? '1' : '0');
      }
    }
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byteStr = bits.slice(i, i + 8).join('');
      bytes.push(parseInt(byteStr, 2));
    }
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function sha256(buf) {
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    return new Uint8Array(hashBuf);
  }

  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function base58Encode(buffer) {
    let intVal = 0n;
    for (const b of buffer) {
      intVal = (intVal << 8n) + BigInt(b);
    }
    let s = '';
    while (intVal > 0n) {
      const mod = intVal % 58n;
      intVal /= 58n;
      s = BASE58_ALPHABET[Number(mod)] + s;
    }
    for (const b of buffer) {
      if (b === 0) s = '1' + s;
      else break;
    }
    return s;
  }

  function hexStringToUint8Array(hex) {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return arr;
  }

  async function privateKeyToWIF(hexKey, compressed = true) {
    const keyBytes = hexStringToUint8Array(hexKey);
    let payload;
    if (compressed) {
      payload = new Uint8Array(1 + 32 + 1);
      payload[0] = 0x80;
      payload.set(keyBytes, 1);
      payload[33] = 0x01;
    } else {
      payload = new Uint8Array(1 + 32);
      payload[0] = 0x80;
      payload.set(keyBytes, 1);
    }
    const h1 = await sha256(payload);
    const h2 = await sha256(h1);
    const checksum = h2.slice(0, 4);

    const full = new Uint8Array(payload.length + 4);
    full.set(payload, 0);
    full.set(checksum, payload.length);

    return base58Encode(full);
  }

  async function updateKeyOutputs() {
    const hex = gridToHex();
    const wifC = await privateKeyToWIF(hex, true);
    const wifU = await privateKeyToWIF(hex, false);

    hexBox.value += hex + '\n';
    hexBox.scrollTop = hexBox.scrollHeight;
    wifBox.value += wifC + '\n';
    wifBox.scrollTop = wifBox.scrollHeight;
    wifBoxUncompressed.value += wifU + '\n';
    wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
  }

  function randomizeRange() {
    for (let y = altura - 1; y <= base - 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateKeyOutputs();
  }

  function clearAll() {
    gridState.fill(false);
    stateCounter = 0n;
    drawGrid();
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
  }

  function getMaxCounter() {
    const numRows = base - altura + 1;
    return 1n << BigInt(numRows * SIZE);
  }

  function setGridFromCounter(cnt) {
    const numRows = base - altura + 1;
    const totalBits = numRows * SIZE;
    for (let i = 0; i < totalBits; i++) {
      const bit = (cnt >> BigInt(totalBits - 1 - i)) & 1n;
      const rowOffset = Math.floor(i / SIZE);
      const col = i % SIZE;
      const y = (altura - 1) + rowOffset;
      gridState[y * SIZE + col] = bit === 1n;
    }
    drawGrid();
  }

  function step() {
    if (!running) return;

    stateCounter++;

    if (stateCounter >= getMaxCounter()) {
      running = false;
      clearTimeout(timeoutId);
      startBtn.disabled = false;
      stopBtn.disabled = true;
      return;
    }

    setGridFromCounter(stateCounter);

    if (randomizeOnStepCheckbox.checked) {
      randomizeRange();
    } else {
      drawGrid();
      updateKeyOutputs();
    }

    timeoutId = setTimeout(step, parseInt(speedInput.value, 10));
  }

  // Evento de clique no canvas - CORRIGIDO PARA PRECISÃO
  canvas.addEventListener('click', e => {
    if (running) return;

    const rect = canvas.getBoundingClientRect();
    const CELL_SIZE = getCellSize();
    
    // Calcula escala para corrigir diferença entre tamanho CSS e canvas real
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    const x = Math.floor(canvasX / CELL_SIZE);
    const y = Math.floor(canvasY / CELL_SIZE);

    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;

    if (toggleOnClickCheckbox.checked) {
      const idx = y * SIZE + x;
      gridState[idx] = !gridState[idx];
      drawGrid();
      updateKeyOutputs();
    }
  });

  // Event listeners
  startBtn.addEventListener('click', () => {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    step();
  });

  stopBtn.addEventListener('click', () => {
    running = false;
    clearTimeout(timeoutId);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });

  clearBtn.addEventListener('click', () => {
    if (running) return;
    clearAll();
  });

  randBtn.addEventListener('click', () => {
    if (running) return;
    randomizeRange();
  });

  speedInput.addEventListener('input', () => {
    speedLabel.textContent = `${speedInput.value} ms`;
  });

  // Inicialização
  createRangeButtons();
  drawGrid();
});

