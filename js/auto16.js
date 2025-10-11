// auto16.js

(() => {
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');

  const HEX_CHARS = '0123456789abcdef';

  // Configurações da grade
  const SIZE = 16; // 16x16
  const CELL_SIZE = canvas.width / SIZE;

  // Estado da matriz: array 16x16 de booleanos (false = desligado, true = ligado)
  let gridState = Array(SIZE * SIZE).fill(false);

  // Controles
  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');

  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');

  const modeRadios = document.getElementsByName('mode');
  const toggleOnClickCheckbox = document.getElementById('toggleOnClick');
  const randomizeOnStepCheckbox = document.getElementById('randomizeStatesOnStep');

  const activeHeightLabel = document.getElementById('activeHeightLabel');
  const heightButtonsDiv = document.getElementById('heightButtons');

  // Variáveis para animação automática
  let intervalId = null;
  let currentHeight = 16; // Altura ativa
  let currentStepIndex = 0;

  // Inicialização das alturas (9 a 16) como botões
  function createHeightButtons() {
    for (let h = 9; h <= 16; h++) {
      const btn = document.createElement('button');
      btn.textContent = h;
      btn.className = 'btn btn-outline-primary size-btn';
      if (h === currentHeight) btn.classList.add('active');
      btn.addEventListener('click', () => {
        currentHeight = h;
        activeHeightLabel.textContent = h;
        updateHeightButtons();
      });
      heightButtonsDiv.appendChild(btn);
    }
  }
  function updateHeightButtons() {
    Array.from(heightButtonsDiv.children).forEach(btn => {
      btn.classList.toggle('active', Number(btn.textContent) === currentHeight);
    });
  }

  // Desenha a grade
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#2f9e44' : '#eee'; // verde se ligado, cinza claro se desligado
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  // Toggle célula no índice dado
  function toggleCellAt(x, y) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    const idx = y * SIZE + x;
    gridState[idx] = !gridState[idx];
  }

  // Gera a private key HEX a partir da gridState
  // Aqui vamos montar um array de bytes de 32 bytes usando as primeiras 256 células (16x16 = 256 bits = 32 bytes)
  // Cada célula = 1 bit, vamos montar o array de bytes bit a bit, linha por linha.
  function generatePrivateKeyHex() {
    const bytes = new Uint8Array(32); // 32 bytes = 256 bits
    for (let i = 0; i < 256; i++) {
      if (gridState[i]) {
        const byteIndex = Math.floor(i / 8);
        const bitIndex = 7 - (i % 8); // Bit mais significativo na esquerda
        bytes[byteIndex] |= (1 << bitIndex);
      }
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Funções para converter chave privada hex em WIF (comprimido e não comprimido)
  // Baseado no padrão Bitcoin:
  // https://en.bitcoin.it/wiki/Wallet_import_format

  // Função auxiliar: SHA256, usando SubtleCrypto (async)
  async function sha256(data) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }

  // Função auxiliar: double SHA256
  async function doubleSha256(data) {
    const first = await sha256(data);
    return await sha256(first);
  }

  // Base58 alphabet
  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  // Converte bytes para base58
  function base58Encode(buffer) {
    let intVal = BigInt(0);
    for (const b of buffer) {
      intVal = (intVal << 8n) + BigInt(b);
    }

    let encoded = '';
    while (intVal > 0) {
      const mod = intVal % 58n;
      intVal = intVal / 58n;
      encoded = BASE58_ALPHABET[Number(mod)] + encoded;
    }

    // Conta zeros à esquerda para prefixar '1's
    for (const b of buffer) {
      if (b === 0) encoded = '1' + encoded;
      else break;
    }
    return encoded;
  }

  // Converte private key hex para WIF
  // Param: compress = true para WIF comprimido
  async function privateKeyHexToWIF(hex, compress = true) {
    // prefixo 0x80
    const keyBytes = hexToBytes(hex);
    const payload = new Uint8Array(compress ? 34 : 33);
    payload[0] = 0x80;
    payload.set(keyBytes, 1);
    if (compress) payload[33] = 0x01;

    const checksumFull = await doubleSha256(payload);
    const checksum = checksumFull.slice(0, 4);

    // concat payload + checksum
    const full = new Uint8Array(payload.length + 4);
    full.set(payload, 0);
    full.set(checksum, payload.length);

    return base58Encode(full);
  }

  // Helper para converter hex para bytes Uint8Array
  function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
  }

  // Atualiza os textarea concatenando uma nova linha com as chaves
  async function updateKeyOutputs() {
    const hex = generatePrivateKeyHex();
    const wifCompressed = await privateKeyHexToWIF(hex, true);
    const wifUncompressed = await privateKeyHexToWIF(hex, false);

    hexBox.value += (hexBox.value ? '\n' : '') + hex;
    wifBox.value += (wifBox.value ? '\n' : '') + wifCompressed;
    wifBoxUncompressed.value += (wifBoxUncompressed.value ? '\n' : '') + wifUncompressed;
  }

  // Evento de clique no canvas
  canvas.addEventListener('click', async (e) => {
    if (!toggleOnClickCheckbox.checked) return; // clique desativado

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    toggleCellAt(x, y);
    drawGrid();
    await updateKeyOutputs();
  });

  // Função para limpar a grid e os outputs
  function clearGrid() {
    gridState.fill(false);
    drawGrid();
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
  }

  // Aleatoriza a grid
  function randomizeGrid() {
    for (let i = 0; i < gridState.length; i++) {
      gridState[i] = Math.random() < 0.5;
    }
    drawGrid();
  }

  // Passo automático (um passo de animação)
  async function step() {
    const mode = [...modeRadios].find(r => r.checked).value;

    if (randomizeOnStepCheckbox.checked) {
      randomizeGrid();
    } else {
      if (mode === 'sequential') {
        // Alterna a célula no índice currentStepIndex dentro da altura ativa (height * width)
        // Aqui vamos usar as primeiras currentHeight linhas, todas as 16 colunas = currentHeight * 16 células
        const maxCells = currentHeight * SIZE;
        // Limitar índice
        if (currentStepIndex >= maxCells) currentStepIndex = 0;
        gridState[currentStepIndex] = !gridState[currentStepIndex];
        currentStepIndex++;
      } else if (mode === 'random') {
        const maxCells = currentHeight * SIZE;
        const idx = Math.floor(Math.random() * maxCells);
        gridState[idx] = !gridState[idx];
      }
    }

    drawGrid();
    await updateKeyOutputs();
  }

  // Inicia a animação automática
  function start() {
    if (intervalId !== null) return;
    currentStepIndex = 0;
    const speed = Number(speedInput.value);
    intervalId = setInterval(() => step(), speed);
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }

  // Para a animação automática
  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  // Atualiza o label da velocidade
  speedInput.addEventListener('input', () => {
    speedLabel.textContent = speedInput.value;
    if (intervalId !== null) {
      stop();
      start();
    }
  });

  // Eventos dos botões
  startBtn.addEventListener('click', () => {
    start();
  });

  stopBtn.addEventListener('click', () => {
    stop();
  });

  clearBtn.addEventListener('click', () => {
    stop();
    clearGrid();
  });

  randBtn.addEventListener('click', () => {
    randomizeGrid();
  });

  // Inicialização
  createHeightButtons();
  updateHeightButtons();
  drawGrid();

})();
