(async function () {
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d', { alpha: false });

  const privateKeysBox = document.getElementById('privateKeysBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  const GRID = 16;
  const CELL = canvas.width / GRID;
  const rowsToWatch = { start: 8, end: 15 }; // Linhas 9 a 16 (0-based)
  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  let grid = [];
  let animationInterval = null;
  let bitCounter = new Uint8Array(16); // 128 bits -> percorre 2^128 combinações

  // Inicializa grade com tudo desligado
  function initGrid() {
    grid = Array.from({ length: GRID }, () => Array(GRID).fill(false));
  }

  // Desenha a grade
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

  // Aplica os bits do contador de 128 bits na grade (linhas 9–16)
  function applyCounterToGrid(counter) {
    // Produz array de bits (128) a partir dos 16 bytes
    const bits = Array.from(counter).flatMap(byte =>
      byte.toString(2).padStart(8, '0').split('').map(b => b === '1')
    );

    let bitIndex = 0;
    for (let r = rowsToWatch.start; r <= rowsToWatch.end; r++) {
      for (let c = 0; c < GRID; c++) {
        grid[r][c] = bits[bitIndex++] || false;
      }
    }
  }

  // Incrementa o contador de 128 bits (big-endian comportamento semelhante)
  function incrementCounter(counter) {
    for (let i = counter.length - 1; i >= 0; i--) {
      counter[i] = (counter[i] + 1) & 0xff;
      if (counter[i] !== 0) break; // Para quando não houver overflow
    }
  }

  // Extrai os bits das 128 células observadas como string '0'/'1'
  function bitsFromGrid() {
    return grid
      .slice(rowsToWatch.start, rowsToWatch.end + 1)
      .flat()
      .map(bit => (bit ? '1' : '0'))
      .join('');
  }

  // Expande 128 bits -> 256 bits (cada célula vira 2 bits)
  // Estratégia simples: 0 -> "00", 1 -> "11" (mantém distinção entre ligado/desligado)
  // Isso gera 256 bits que se convertem para 64 hex chars.
  function expandBitsTo256(bits128) {
    // bits128 length == 128
    let out = '';
    for (let i = 0; i < bits128.length; i++) {
      out += bits128[i] === '1' ? '11' : '00';
    }
    return out;
  }

  // Converte bits (string) para HEX (assume comprimento múltiplo de 4)
  function hexFromBits(bits) {
    const padded = bits.padStart(Math.ceil(bits.length / 4) * 4, '0');
    const hexArray = padded.match(/.{1,4}/g).map(b => parseInt(b, 2).toString(16));
    return hexArray.join('').toLowerCase().padStart(64, '0');
  }

  // HEX para bytes
  function hexToBytes(hex) {
    const cleansed = hex.replace(/^0x/, '');
    const arr = [];
    for (let i = 0; i < cleansed.length; i += 2) {
      arr.push(parseInt(cleansed.substr(i, 2), 16));
    }
    return Uint8Array.from(arr);
  }

  // Concatena múltiplos Uint8Arrays
  function concatBytes(...arrays) {
    return Uint8Array.from(arrays.flatMap(arr => [...arr]));
  }

  // SHA-256
  async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hashBuffer);
  }

  // Double SHA-256
  async function doubleSha256(buffer) {
    const first = await sha256(buffer);
    return await sha256(first);
  }

  // Bytes para Base58Check
  function bytesToBase58(bytes) {
    // conta zeros à esquerda
    let leadingZeros = 0;
    while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) {
      leadingZeros++;
    }

    // converte para BigInt
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

  // Valida a chave privada (HEX de 64 chars)
  function isValidPrivateKey(hex) {
    try {
      const n = BigInt('0x' + hex);
      const max = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
      return n > 0n && n < max;
    } catch (e) {
      return false;
    }
  }

  // Gera WIF a partir de HEX
  async function privateKeyToWIF(hex, compressed = true) {
    const key = hexToBytes(hex);
    const prefix = Uint8Array.of(0x80);
    const suffix = compressed ? Uint8Array.of(0x01) : new Uint8Array([]);
    const payload = concatBytes(prefix, key, suffix);
    const checksum = (await doubleSha256(payload)).slice(0, 4);
    const full = concatBytes(payload, checksum);
    return bytesToBase58(full);
  }

  // Atualiza as caixas de saída (HEX + WIF)
  async function updateOutputs() {
    const bits128 = bitsFromGrid(); // 128 bits
    const bits256 = expandBitsTo256(bits128); // agora 256 bits
    const hex = hexFromBits(bits256); // 64 hex chars

    if (!isValidPrivateKey(hex)) {
      privateKeysBox.value += '[chave inválida]\n';
      wifBox.value += '[inválido]\n';
      wifBoxUncompressed.value += '[inválido]\n';
    } else {
      privateKeysBox.value += hex + '\n';
      privateKeysBox.scrollTop = privateKeysBox.scrollHeight;

      const wifCompressed = await privateKeyToWIF(hex, true);
      wifBox.value += wifCompressed + '\n';
      wifBox.scrollTop = wifBox.scrollHeight;

      const wifUncompressed = await privateKeyToWIF(hex, false);
      wifBoxUncompressed.value += wifUncompressed + '\n';
      wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
    }
  }

  // Modo sequencial: incrementa o contador 128-bit e aplica à grade
  function stepSequential() {
    incrementCounter(bitCounter);
    applyCounterToGrid(bitCounter);
  }

  // Modo aleatório: alterna célula aleatória nas linhas 9–16
  function stepRandom() {
    const r = Math.floor(Math.random() * (rowsToWatch.end - rowsToWatch.start + 1)) + rowsToWatch.start;
    const c = Math.floor(Math.random() * GRID);
    const randomize = document.getElementById('randomizeStatesOnStep').checked;
    grid[r][c] = randomize ? Math.random() < 0.5 : true;
  }

  // Passo geral
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

    const speed = parseInt(document.getElementById('speed').value, 10);
    animationInterval = setInterval(step, speed);
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
    bitCounter = new Uint8Array(16); // Reinicia contador (128 bits)
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
