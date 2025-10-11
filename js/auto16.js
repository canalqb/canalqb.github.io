(async function () {
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d', { alpha: false });

  const privateKeysBox = document.getElementById('privateKeysBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  const GRID = 16;
  const CELL = canvas.width / GRID;
  const rowsToWatch = { start: 8, end: 15 }; // linhas 9–16 (0-based)

  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  let grid = [];
  let animationInterval = null;

  let bitCounter = new Uint8Array(32); // 256 bits (32 bytes)

  // Inicializa a grade com tudo desligado
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

  // Extrai os bits da grade (linhas 9 a 16)
  function bitsFromGrid() {
    return grid
      .slice(rowsToWatch.start, rowsToWatch.end + 1)
      .flat()
      .map(bit => (bit ? '1' : '0'))
      .join('');
  }

  // Converte bits para HEX (64 caracteres)
  function hexFromBits(bits) {
    const hexArray = bits.match(/.{1,4}/g).map(b => parseInt(b, 2).toString(16));
    return hexArray.join('').padStart(64, '0');
  }

  // HEX -> Uint8Array
  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
  }

  // Concatena arrays de bytes
  function concatBytes(...arrays) {
    return Uint8Array.from(arrays.flatMap(arr => [...arr]));
  }

  // SHA-256
  async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hashBuffer);
  }

  // SHA-256 duplo
  async function doubleSha256(buffer) {
    const first = await sha256(buffer);
    return await sha256(first);
  }

  // Bytes para Base58
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

  // Validação da chave privada
  function isValidPrivateKey(hex) {
    const n = BigInt('0x' + hex);
    const max = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
    return n > 0n && n < max;
  }

  // HEX -> WIF (com ou sem compressão)
  async function privateKeyToWIF(hex, compressed = true) {
    const key = hexToBytes(hex);
    const prefix = Uint8Array.of(0x80);
    const suffix = compressed ? Uint8Array.of(0x01) : new Uint8Array([]);
    const payload = concatBytes(prefix, key, suffix);
    const checksum = (await doubleSha256(payload)).slice(0, 4);
    const full = concatBytes(payload, checksum);
    return bytesToBase58(full);
  }

  // Atualiza as saídas (HEX e WIFs)
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

  // Incrementa o contador de 256 bits
  function incrementCounter(counter) {
    for (let i = 31; i >= 0; i--) {
      counter[i]++;
      if (counter[i] !== 0) break;
    }
  }

  // Aplica o valor do contador à grade (linhas 9 a 16)
  function applyCounterToGrid(counter) {
    const bits = Array.from(counter).flatMap(byte =>
      byte.toString(2).padStart(8, '0').split('').map(b => b === '1')
    );

    let bitIndex = 0;
    for (let r = rowsToWatch.start; r <= rowsToWatch.end; r++) {
      for (let c = 0; c < GRID; c++) {
        grid[r][c] = bits[bitIndex++];
      }
    }
  }

  // Passo sequencial: incrementa contador e atualiza grade
  function stepSequential() {
    incrementCounter(bitCounter);
    applyCounterToGrid(bitCounter);
  }

  // Passo aleatório: altera uma célula aleatória nas linhas 9 a 16
  function stepRandom() {
    const r = Math.floor(Math.random() * (rowsToWatch.end - rowsToWatch.start + 1)) + rowsToWatch.start;
    const c = Math.floor(Math.random() * GRID);
    const randomize = document.getElementById('randomizeStatesOnStep').checked;
    grid[r][c] = randomize ? Math.random() < 0.5 : true;
  }

  // Função de passo geral
  async function step() {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    if (mode === 'sequential') {
      stepSequential();
    } else {
      stepRandom();
    }

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
    privateKeysBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
    bitCounter = new Uint8Array(32);
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

  // Clique na grade para alternar células
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

  // Inicialização
  initGrid();
  drawGrid();
})();
