(async function () {
  const canvas = document.getElementById('grid');
  const privateKeysBox = document.getElementById('privateKeysBox');
  const wifBox = document.getElementById('wifBox'); // Comprimido (5...)
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed'); // Não comprimido (K,L)

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');
  const speedSlider = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');
  const toggleOnClick = document.getElementById('toggleOnClick');
  const randomizeStatesOnStep = document.getElementById('randomizeStatesOnStep');
  const modeRadios = document.getElementsByName('mode');

  const ctx = canvas.getContext('2d', { alpha: false });
  const GRID = 16;
  const CELL = canvas.width / GRID;
  let grid = [];
  const rowsToWatch = { start: 8, end: 15 }; // zero-based, lines 9..16 (1-based)

  let lastHex = '', lastWif = '', lastWifUncompressed = '';
  let timerId = null;
  let currentStep = 0;

  // Base58 alphabet for encoding
  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function initGrid() {
    grid = Array.from({ length: GRID }, () => Array(GRID).fill(false));
  }

  function drawGrid() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const x = c * CELL, y = r * CELL;
        ctx.fillStyle = grid[r][c] ? '#006400' : '#fff';
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
        ctx.strokeStyle = '#008000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
      }
    }
  }

  function bitsFromGrid() {
    // Flatten grid row-wise into a bit string
    return grid.flat().map(b => (b ? '1' : '0')).join('');
  }

  function hexFromBits(bits) {
    // bits -> hex string 64 hex chars (256 bits)
    const nibbles = bits.match(/.{1,4}/g) || [];
    return nibbles.map(b => parseInt(b, 2).toString(16)).join('').padStart(64, '0');
  }

  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
  }

  function concatBytes(...arrays) {
    return Uint8Array.from(arrays.flatMap(a => Array.from(a)));
  }

  async function sha256(buf) {
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return new Uint8Array(hash);
  }

  async function doubleSha256(buf) {
    return await sha256(await sha256(buf));
  }

  function bytesToBase58(bytes) {
    // Convert byte array to BigInt
    let n = bytes.reduce((acc, b) => (acc << 8n) | BigInt(b), 0n);

    let result = '';
    while (n > 0n) {
      const rem = n % 58n;
      n /= 58n;
      result = BASE58[Number(rem)] + result;
    }

    // Leading zeros as '1's
    const leadingZeros = Array.from(bytes).findIndex(b => b !== 0);
    const zerosCount = leadingZeros === -1 ? bytes.length : leadingZeros;
    return '1'.repeat(zerosCount) + result;
  }

  async function privateKeyToWIF(hex, compressed = true) {
    const key = hexToBytes(hex.padStart(64, '0'));
    const prefix = Uint8Array.of(0x80);
    const suffix = compressed ? Uint8Array.of(0x01) : new Uint8Array([]);
    const payload = concatBytes(prefix, key, suffix);
    const checksum = (await doubleSha256(payload)).slice(0, 4);
    const full = concatBytes(payload, checksum);
    return bytesToBase58(full);
  }

  async function updateOutputs() {
    const bits = bitsFromGrid();
    const hex = hexFromBits(bits);

    if (hex !== lastHex) {
      privateKeysBox.value += hex + '\n';
      privateKeysBox.scrollTop = privateKeysBox.scrollHeight;
      lastHex = hex;
    }

    const wifCompressed = await privateKeyToWIF(hex, true);
    if (wifCompressed !== lastWif) {
      wifBox.value += wifCompressed + '\n';
      wifBox.scrollTop = wifBox.scrollHeight;
      lastWif = wifCompressed;
    }

    const wifUncompressed = await privateKeyToWIF(hex, false);
    if (wifUncompressed !== lastWifUncompressed) {
      wifBoxUncompressed.value += wifUncompressed + '\n';
      wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
      lastWifUncompressed = wifUncompressed;
    }
  }

  // Funcionalidade dos botões e controle da animação

  // Retorna array de células (r,c) que serão varridas no modo sequencial (linhas 9..16)
  function getSequentialCells() {
    const cells = [];
    for (let r = rowsToWatch.start; r <= rowsToWatch.end; r++) {
      for (let c = 0; c < GRID; c++) {
        cells.push([r, c]);
      }
    }
    return cells;
  }

  function getRandomCell() {
    const r = rowsToWatch.start + Math.floor(Math.random() * (rowsToWatch.end - rowsToWatch.start + 1));
    const c = Math.floor(Math.random() * GRID);
    return [r, c];
  }

  async function step() {
    const mode = Array.from(modeRadios).find(r => r.checked)?.value || 'sequential';

    if (mode === 'sequential') {
      const seqCells = getSequentialCells();
      if (currentStep >= seqCells.length) currentStep = 0;
      const [r, c] = seqCells[currentStep];
      currentStep++;

      if (randomizeStatesOnStep.checked) {
        grid[r][c] = Math.random() < 0.5;
      } else {
        grid[r][c] = true;
      }
      drawGrid();
      await updateOutputs();
    } else {
      const [r, c] = getRandomCell();
      if (randomizeStatesOnStep.checked) {
        grid[r][c] = Math.random() < 0.5;
      } else {
        grid[r][c] = true;
      }
      drawGrid();
      await updateOutputs();
    }
  }

  function startAnimation() {
    if (timerId) return;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    clearBtn.disabled = true;
    randBtn.disabled = true;

    timerId = setInterval(step, parseInt(speedSlider.value));
  }

  function stopAnimation() {
    if (!timerId) return;
    clearInterval(timerId);
    timerId = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    clearBtn.disabled = false;
    randBtn.disabled = false;
  }

  function clearGrid() {
    stopAnimation();
    initGrid();
    drawGrid();
    privateKeysBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
    lastHex = lastWif = lastWifUncompressed = '';
    currentStep = 0;
  }

  function randomizeGrid() {
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        grid[r][c] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateOutputs();
  }

  // Eventos

  canvas.addEventListener('click', e => {
    if (!toggleOnClick.checked) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);
    if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
      grid[r][c] = !grid[r][c];
      drawGrid();
      if (r >= rowsToWatch.start && r <= rowsToWatch.end) updateOutputs();
    }
  });

  startBtn.addEventListener('click', () => {
    startAnimation();
  });

  stopBtn.addEventListener('click', () => {
    stopAnimation();
  });

  clearBtn.addEventListener('click', () => {
    clearGrid();
  });

  randBtn.addEventListener('click', () => {
    randomizeGrid();
  });

  speedSlider.addEventListener('input', () => {
    speedLabel.textContent = speedSlider.value;
    if (timerId) {
      stopAnimation();
      startAnimation();
    }
  });

  // Inicialização
  initGrid();
  drawGrid();
})();
