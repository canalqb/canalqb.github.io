(() => {
  const SIZE = 16;
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');
  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const toggleOnClickCheckbox = document.getElementById('toggleOnClick');
  const randomizeOnStepCheckbox = document.getElementById('randomizeStatesOnStep');
  const activeHeightLabel = document.getElementById('activeHeightLabel');
  const heightButtonsContainer = document.getElementById('heightButtons');

  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');
  const privateKeysBox = document.getElementById('privateKeysBox');

  let gridState = new Array(SIZE * SIZE).fill(false);

  let currentHeight = 1;  // valor “alturas” de 1 a 16, interpretado de baixo para cima
  const MIN_HEIGHT = 1;
  const MAX_HEIGHT = 16;
  let stateCounter = 0n;

  const CELL_SIZE = canvas.width / SIZE;  // assume canvas quadrado

  let running = false;
  let timeoutId = null;

  // Constrói botões de altura de 1 a 16
  function createHeightButtons() {
    for (let h = MIN_HEIGHT; h <= MAX_HEIGHT; h++) {
      const btn = document.createElement('button');
      btn.textContent = h;
      btn.dataset.h = h;
      btn.className = 'btn btn-outline-primary size-btn';
      btn.addEventListener('click', () => {
        if (running) return; // não permitir trocar altura enquanto roda
        currentHeight = h;
        activeHeightLabel.textContent = h;
        updateHeightButtons();
        drawGrid();
      });
      heightButtonsContainer.appendChild(btn);
    }
    updateHeightButtons();
  }
  function updateHeightButtons() {
    Array.from(heightButtonsContainer.children).forEach(btn => {
      const h = parseInt(btn.dataset.h, 10);
      if (h === currentHeight) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-outline-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
      }
    });
  }

  // Verifica se a linha y (0 = topo) está dentro da altura ativa de baixo pra cima
  function isRowActive(y) {
    // linhas contadas de 0 (topo) até SIZE-1 (base)
    // Se altura = h, queremos as últimas h linhas: y >= SIZE - h
    return y >= (SIZE - currentHeight);
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#2ecc71' : '#ffffff';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#ddd';
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destacar área ativa — às últimas currentHeight linhas
    const startRow = SIZE - currentHeight;
    ctx.fillStyle = 'rgba(255, 99, 71, 0.3)';
    ctx.fillRect(0, startRow * CELL_SIZE, SIZE * CELL_SIZE, currentHeight * CELL_SIZE);
  }

  function gridToHex() {
    // Gera HEX considerando bits apenas nas linhas ativas; outras linhas como 0
    const bits = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (isRowActive(y)) {
          bits.push(gridState[y * SIZE + x] ? '1' : '0');
        } else {
          bits.push('0');
        }
      }
    }
    // bits.length == SIZE*SIZE = 256
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byteStr = bits.slice(i, i + 8).join('');
      bytes.push(parseInt(byteStr, 2));
    }
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function sha256(buffer) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hash);
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
      intVal = intVal / 58n;
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
    wifBox.value += wifC + '\n';
    wifBoxUncompressed.value += wifU + '\n';

    privateKeysBox.value += `HEX:${hex} WIFc:${wifC} WIFu:${wifU}\n`;

    hexBox.scrollTop = hexBox.scrollHeight;
    wifBox.scrollTop = wifBox.scrollHeight;
    wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
  }

  function randomizeGrid() {
    for (let y = SIZE - currentHeight; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    for (let y = 0; y < SIZE - currentHeight; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = false;
      }
    }
    drawGrid();
    updateKeyOutputs();
  }

  function clearGrid() {
    gridState.fill(false);
    drawGrid();
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
    privateKeysBox.value = '';
  }

  function getMaxCounter() {
    // número de bits ativos = currentHeight * SIZE
    return 1n << BigInt(currentHeight * SIZE);
  }

  function setGridFromCounter(counter) {
    const totalActiveBits = currentHeight * SIZE;
    for (let i = 0; i < totalActiveBits; i++) {
      // mapa linear: i => bit
      const bit = (counter >> BigInt(totalActiveBits - 1 - i)) & 1n;
      gridState[i] = (bit === 1n);
    }
    // zera o restante
    for (let i = totalActiveBits; i < SIZE * SIZE; i++) {
      gridState[i] = false;
    }
  }

  async function step() {
    const mode = Array.from(modeRadios).find(r => r.checked).value;

    if (randomizeOnStepCheckbox.checked) {
      randomizeGrid();
      scheduleNext();
      return;
    }

    if (mode === 'sequential') {
      const max = getMaxCounter();
      if (stateCounter >= max) {
        // passa para próxima altura
        currentHeight++;
        if (currentHeight > MAX_HEIGHT) {
          stop();
          return;
        }
        stateCounter = 0n;
        activeHeightLabel.textContent = currentHeight;
        updateHeightButtons();
      }

      setGridFromCounter(stateCounter);
      drawGrid();
      await updateKeyOutputs();
      stateCounter++;
      scheduleNext();
    } else { // random mode
      const activeBits = currentHeight * SIZE;
      const idx = Math.floor(Math.random() * activeBits);
      gridState[idx] = !gridState[idx];
      drawGrid();
      await updateKeyOutputs();
      scheduleNext();
    }
  }

  function scheduleNext() {
    timeoutId = setTimeout(step, Number(speedInput.value));
  }

  function start() {
    if (running) return;
    running = true;
    currentHeight = MIN_HEIGHT;
    activeHeightLabel.textContent = currentHeight;
    updateHeightButtons();
    stateCounter = 0n;

    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
    privateKeysBox.value = '';

    step();  // dispara imediatamente
  }

  function stop() {
    running = false;
    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  canvas.addEventListener('click', e => {
    if (!toggleOnClickCheckbox.checked) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    // somente permitir clique dentro da área ativa
    if (!isRowActive(row)) return;

    const idx = row * SIZE + col;
    gridState[idx] = !gridState[idx];
    drawGrid();
    updateKeyOutputs();
  });

  startBtn.addEventListener('click', () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    start();
  });
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', () => {
    stop();
    clearGrid();
  });
  randBtn.addEventListener('click', randomizeGrid);
  speedInput.addEventListener('input', () => {
    speedLabel.textContent = speedInput.value;
    // se estiver rodando, ajustar cronograma
    if (running) {
      clearTimeout(timeoutId);
      scheduleNext();
    }
  });

  // Inicialização UI
  createHeightButtons();
  drawGrid();
})();
