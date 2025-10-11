(async function () {
  const canvas = document.getElementById('grid');
  const privateKeysBox = document.getElementById('privateKeysBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');
  const ctx = canvas.getContext('2d', { alpha: false });
  
  const GRID = 16;
  const CELL = canvas.width / GRID;
  let grid = [];
  
  // Linhas 8 a 15 (0-based)
  const rowsToWatch = { start: 8, end: 15 };

  let animationInterval = null;
  let currentRow = rowsToWatch.start;
  let currentCol = 0;

  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  // Inicializa grid com false
  function initGrid() {
    grid = Array.from({ length: GRID }, () => Array(GRID).fill(false));
  }

  // Desenha a grid no canvas
  function drawGrid() {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        const x = c * CELL;
        const y = r * CELL;

        ctx.fillStyle = grid[r][c] ? '#006400' : '#ffffff';
        ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

        ctx.strokeStyle = '#008000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
      }
    }
  }

  // Retorna string de bits a partir do grid (linha por linha)
  function bitsFromGrid() {
    return grid.flat().map(b => b ? '1' : '0').join('');
  }

  // Converte bits em hex (64 caracteres)
  function hexFromBits(bits) {
    const nibbleArray = bits.match(/.{1,4}/g) || [];
    const hexString = nibbleArray.map(b => parseInt(b, 2).toString(16)).join('');
    return hexString.padStart(64, '0');
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

  // Converte bytes para Base58 (bitcoin style)
  function bytesToBase58(bytes) {
    let leadingZeros = 0;
    while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
      leadingZeros++;
    }

    let n = 0n;
    for (let i = leadingZeros; i < bytes.length; i++) {
      n = (n << 8n) | BigInt(bytes[i]);
    }

    let result = '';
    while (n > 0n) {
      const rem = n % 58n;
      n = n / 58n;
      result = BASE58[Number(rem)] + result;
    }

    return '1'.repeat(leadingZeros) + result;
  }

  // Converte chave privada hex para WIF (Wallet Import Format)
  async function privateKeyToWIF(hex, compressed = true) {
    const key = hexToBytes(hex.padStart(64, '0'));
    const prefix = Uint8Array.of(0x80);
    const suffix = compressed ? Uint8Array.of(0x01) : new Uint8Array([]);
    const payload = concatBytes(prefix, key, suffix);
    const checksum = (await doubleSha256(payload)).slice(0, 4);
    const full = concatBytes(payload, checksum);
    return bytesToBase58(full);
  }

  // Atualiza os outputs no textarea
  async function updateOutputs() {
    const bits = bitsFromGrid();
    const hex = hexFromBits(bits);

    privateKeysBox.value += hex + '\n';
    privateKeysBox.scrollTop = privateKeysBox.scrollHeight;

    const wifCompressed = await privateKeyToWIF(hex, true);
    wifBox.value += wifCompressed + '\n';
    wifBox.scrollTop = wifBox.scrollHeight;

    const wifUncompressed = await privateKeyToWIF(hex, false);
    wifBoxUncompressed.value += wifUncompressed + '\n';
    wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
  }

  // Evento click no canvas para toggle de célula
  canvas.addEventListener('click', e => {
    const toggleOnClick = document.getElementById('toggleOnClick');
    if (!toggleOnClick.checked) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const c = Math.floor(x / CELL);
    const r = Math.floor(y / CELL);

    if (r >= 0 && r < GRID && c >= 0 && c < GRID) {
      grid[r][c] = !grid[r][c];
      drawGrid();
      updateOutputs();
    }
  });

  // Passo sequencial no grid
  function stepSequential() {
    grid[currentRow][currentCol] = false;
    currentCol++;

    if (currentCol >= GRID) {
      currentCol = 0;
      currentRow++;
      if (currentRow > rowsToWatch.end) currentRow = rowsToWatch.start;
    }

    if (randomizeStatesOnStep.checked) {
      grid[currentRow][currentCol] = Math.random() < 0.5;
    } else {
      grid[currentRow][currentCol] = true;
    }
  }

  // Passo aleatório no grid
  function stepRandom() {
    const r = Math.floor(Math.random() * (rowsToWatch.end - rowsToWatch.start + 1)) + rowsToWatch.start;
    const c = Math.floor(Math.random() * GRID);

    if (randomizeStatesOnStep.checked) {
      grid[r][c] = Math.random() < 0.5;
    } else {
      grid[r][c] = true;
    }
  }

  // Função step principal
  async function step() {
    if (modeSequential.checked) {
      stepSequential();
    } else {
      stepRandom();
    }
    drawGrid();
    await updateOutputs();
  }

  // Elementos do DOM
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');
  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');
  const modeSequential = document.querySelector('input[name="mode"][value="sequential"]');
  const randomizeStatesOnStep = document.getElementById('randomizeStatesOnStep');

  // Eventos dos botões
  startBtn.addEventListener('click', () => {
    if (animationInterval) return;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    animationInterval = setInterval(step, parseInt(speedInput.value));
  });

  stopBtn.addEventListener('click', () => {
    if (!animationInterval) return;
    clearInterval(animationInterval);
    animationInterval = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });

  clearBtn.addEventListener('click', () => {
    initGrid();
    drawGrid();
  });

  randBtn.addEventListener('click', () => {
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        grid[r][c] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateOutputs();
  });

  speedInput.addEventListener('input', () => {
    speedLabel.textContent = speedInput.value;
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = setInterval(step, parseInt(speedInput.value));
    }
  });

  // Inicialização
  initGrid();
  drawGrid();
})();
