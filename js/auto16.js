(async function () {
  const canvas = document.getElementById('grid');
  const privateKeysBox = document.getElementById('privateKeysBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  const ctx = canvas.getContext('2d', { alpha: false });
  const GRID = 16;
  const CELL = canvas.width / GRID;
  const rowsToWatch = { start: 8, end: 15 }; // linhas 9–16 (0-based)

  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  let grid = [];
  let animationInterval = null;
  let currentRow = rowsToWatch.start;
  let currentCol = 0;

  // Inicializa a grade com valores false
  function initGrid() {
    grid = Array.from({ length: GRID }, () => Array(GRID).fill(false));
  }

  // Desenha a grade no canvas
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

  // Extrai bits da área observada na grade
  function bitsFromGrid() {
    return grid
      .slice(rowsToWatch.start, rowsToWatch.end + 1)
      .flat()
      .map(bit => (bit ? '1' : '0'))
      .join('');
  }

  // Converte bits em string hexadecimal (64 caracteres)
  function hexFromBits(bits) {
    const hexArray = bits.match(/.{1,4}/g).map(b => parseInt(b, 2).toString(16));
    return hexArray.join('').padStart(64, '0');
  }

  // Converte string hex em Uint8Array de bytes
  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
  }

  // Concatena múltiplos Uint8Arrays em um só
  function concatBytes(...arrays) {
    return Uint8Array.from(arrays.flatMap(arr => [...arr]));
  }

  // Hash SHA-256 usando Web Crypto API
  async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hashBuffer);
  }

  // Double SHA-256
  async function doubleSha256(buffer) {
    const firstHash = await sha256(buffer);
    return await sha256(firstHash);
  }

  // Converte bytes para Base58 (Bitcoin alphabet)
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

  // Valida se a chave privada está dentro do intervalo permitido
  function isValidPrivateKey(hex) {
    const n = BigInt('0x' + hex);
    const max = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    return n > 0n && n < max;
  }

  // Converte chave privada hex para WIF (Wallet Import Format)
  async function privateKeyToWIF(hex, compressed = true) {
    const key = hexToBytes(hex);
    const prefix = Uint8Array.of(0x80);
    const suffix = compressed ? Uint8Array.of(0x01) : new Uint8Array([]);
    const payload = concatBytes(prefix, key, suffix);
    const checksum = (await doubleSha256(payload)).slice(0, 4);
    const full = concatBytes(payload, checksum);
    return bytesToBase58(full);
  }

  // Atualiza as caixas de saída (chave privada, WIF compressa e WIF não compressa)
  async function updateOutputs() {
    const bits = bitsFromGrid();
    const hex = hexFromBits(bits);

    if (!isValidPrivateKey(hex)) {
      privateKeysBox.value += '[chave inválida]\n';
      wifBox.value += '[inválido]\n';
      wifBoxUncompressed.value += '[inválido]\n';
      return;
    }

    privateKeysBox.value += hex + '\n';
    privateKeysBox.scrollTop = privateKeysBox.scrollHeight;

    const wifCompressed = await privateKeyToWIF(hex, true);
    wifBox.value += wifCompressed + '\n';
    wifBox.scrollTop = wifBox.scrollHeight;

    const wifUncompressed = await privateKeyToWIF(hex, false);
    wifBoxUncompressed.value += wifUncompressed + '\n';
    wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
  }

  // Evento de clique para alternar células da grade
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

      if (r >= rowsToWatch.start && r <= rowsToWatch.end) {
        updateOutputs();
      }
    }
  });

  // Passo no modo sequencial
  function stepSequential() {
    grid[currentRow][currentCol] = false;

    currentCol++;
    if (currentCol >= GRID) {
      currentCol = 0;
      currentRow++;
      if (currentRow > rowsToWatch.end) currentRow = rowsToWatch.start;
    }

    const randomize = document.getElementById('randomizeStatesOnStep').checked;
    grid[currentRow][currentCol] = randomize ? Math.random() < 0.5 : true;
  }

  // Passo no modo aleatório
  function stepRandom() {
    const r = Math.floor(Math.random() * (rowsToWatch.end - rowsToWatch.start + 1)) + rowsToWatch.start;
    const c = Math.floor(Math.random() * GRID);
    const randomize = document.getElementById('randomizeStatesOnStep').checked;
    grid[r][c] = randomize ? Math.random() < 0.5 : true;
  }

  // Função de passo (executada no intervalo)
  async function step() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'sequential') stepSequential();
    else stepRandom();

    drawGrid();
    await updateOutputs();
  }

  // Eventos dos botões
  document.getElementById('startBtn').addEventListener('click', () => {
    if (animationInterval) return;

    document.getElementById('startBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    animationInterval = setInterval(step, parseInt(document.getElementById('speed').value, 10));
  });

  document.getElementById('stopBtn').addEventListener('click', () => {
    clearInterval(animationInterval);
    animationInterval = null;
    document.getElementById('startBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    initGrid();
    drawGrid();
  });

  document.getElementById('randBtn').addEventListener('click', () => {
    for (let r = 0; r < GRID; r++) {
      for (let c = 0; c < GRID; c++) {
        grid[r][c] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateOutputs();
  });

  document.getElementById('speed').addEventListener('input', () => {
    const speed = document.getElementById('speed').value;
    document.getElementById('speedLabel').textContent = speed;
    if (animationInterval) {
      clearInterval(animationInterval);
      animationInterval = setInterval(step, parseInt(speed, 10));
    }
  });

  // Inicializa
  initGrid();
  drawGrid();
})();
