(() => {
  // Constantes
  const SIZE = 16; // matriz 16x16
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');

  // Controles DOM
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
  const privateKeysBox = document.getElementById('privateKeysBox'); // para armazenar histórico

  // Variáveis estado
  let gridState = new Array(SIZE * SIZE).fill(false);
  let intervalId = null;
  let currentHeight = 9; // começa em 9
  let maxHeight = 16;
  let stateCounter = 0n; // contador binário BigInt

  const CELL_SIZE = 32; // pixels por célula (canvas 512x512 / 16)

  // --- Inicialização ---

  // Cria botões de altura
  function createHeightButtons() {
    for (let h = 1; h <= maxHeight; h++) {
      const btn = document.createElement('button');
      btn.textContent = h;
      btn.className = 'btn btn-outline-primary size-btn';
      btn.dataset.height = h;
      btn.addEventListener('click', () => {
        currentHeight = h;
        activeHeightLabel.textContent = h;
        updateHeightButtons();
      });
      heightButtonsContainer.appendChild(btn);
    }
    updateHeightButtons();
  }

  function updateHeightButtons() {
    const buttons = heightButtonsContainer.querySelectorAll('button');
    buttons.forEach(btn => {
      if (parseInt(btn.dataset.height) === currentHeight) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-outline-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
      }
    });
  }

  // --- Desenhar a matriz ---

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ccc';

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const index = row * SIZE + col;
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;
        // fundo
        ctx.fillStyle = gridState[index] ? '#28a745' : '#fff'; // verde se ativo, branco se não
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

        // borda
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destacar linhas ativas (altura)
    ctx.fillStyle = 'rgba(40,167,69,0.15)';
    ctx.fillRect(0, 0, CELL_SIZE * SIZE, CELL_SIZE * currentHeight);
  }

  // --- Atualizar as caixas de chave ---

  // Funções auxiliares para conversão

  // Converte matriz 16x16 (gridState) para hex de tamanho height*16 bits (height linhas * 16 colunas)
  function gridToHex(height) {
    const bits = [];
    const totalBits = height * SIZE;
    for (let i = 0; i < totalBits; i++) {
      bits.push(gridState[i] ? '1' : '0');
    }
    // Completar para 256 bits (32 bytes)
    while (bits.length < SIZE * SIZE) {
      bits.push('0');
    }

    // Converter bits para bytes
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byteStr = bits.slice(i, i + 8).join('');
      bytes.push(parseInt(byteStr, 2));
    }

    // Converter bytes para hex
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Base58 com checksum para WIF
  // Usa Bitcoin WIF compressão e não compressão
  // Implementação básica:

  // Dependência mínima para SHA256 e Base58Check
  // Como não temos dependências, vou implementar funções básicas SHA256 e base58 (ou usar web crypto)

  // Web Crypto API para SHA256
  async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hashBuffer);
  }

  // Base58 encoding table (Bitcoin)
  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function base58Encode(buffer) {
    let intVal = BigInt(0);
    for (const b of buffer) {
      intVal = (intVal << 8n) + BigInt(b);
    }

    let result = '';
    while (intVal > 0) {
      const mod = intVal % 58n;
      intVal = intVal / 58n;
      result = BASE58_ALPHABET[Number(mod)] + result;
    }

    // Add '1' for each leading 0 byte
    for (const b of buffer) {
      if (b === 0) result = '1' + result;
      else break;
    }

    return result;
  }

  // Constrói WIF a partir da chave privada (hex string), com compressão true/false
  async function privateKeyToWIF(hexKey, compressed = true) {
    // prefixo 0x80 + chave privada (32 bytes) + (se comprimido) 0x01
    const keyBytes = hexStringToUint8Array(hexKey);
    let extended;

    if (compressed) {
      extended = new Uint8Array(1 + 32 + 1);
      extended[0] = 0x80;
      extended.set(keyBytes, 1);
      extended[33] = 0x01;
    } else {
      extended = new Uint8Array(1 + 32);
      extended[0] = 0x80;
      extended.set(keyBytes, 1);
    }

    const hash1 = await sha256(extended);
    const hash2 = await sha256(hash1);

    const checksum = hash2.slice(0, 4);

    const full = new Uint8Array(extended.length + 4);
    full.set(extended, 0);
    full.set(checksum, extended.length);

    return base58Encode(full);
  }

  function hexStringToUint8Array(hex) {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return arr;
  }

  // Atualiza as caixas de saída (HEX e WIFs) e adiciona linha na textarea oculta
  async function updateKeyOutputs() {
    const hexKey = gridToHex(currentHeight);
    const wifCompressed = await privateKeyToWIF(hexKey, true);
    const wifUncompressed = await privateKeyToWIF(hexKey, false);

    // Atualiza textos
    hexBox.value += hexKey + '\n';
    wifBox.value += wifCompressed + '\n';
    wifBoxUncompressed.value += wifUncompressed + '\n';

    // Adiciona linha oculta para histórico
    privateKeysBox.value += `HEX: ${hexKey} | WIFc: ${wifCompressed} | WIFu: ${wifUncompressed}\n`;

    // Scroll para baixo para mostrar o último registro
    hexBox.scrollTop = hexBox.scrollHeight;
    wifBox.scrollTop = wifBox.scrollHeight;
    wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
  }

  // --- Funções utilitárias da matriz ---

  function randomizeGrid() {
    const totalCells = currentHeight * SIZE;
    for (let i = 0; i < totalCells; i++) {
      gridState[i] = Math.random() >= 0.5;
    }
    // Zera o resto
    for (let i = totalCells; i < SIZE * SIZE; i++) {
      gridState[i] = false;
    }
    drawGrid();
    updateKeyOutputs();
  }

  function clearGrid() {
    gridState.fill(false);
    drawGrid();
    // Limpar as caixas de texto
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
    privateKeysBox.value = '';
  }

  // Atualiza o gridState com base no contador binário e altura
  function setGridFromCounter(counter, height) {
    const totalBits = height * SIZE;
    for (let i = 0; i < totalBits; i++) {
      const bit = (counter >> BigInt(totalBits - 1 - i)) & 1n;
      gridState[i] = bit === 1n;
    }
    for (let i = totalBits; i < SIZE * SIZE; i++) {
      gridState[i] = false;
    }
  }

  // Máximo contador para a altura (2^(height*16))
  function getMaxCounterForHeight(height) {
    return 1n << BigInt(height * SIZE);
  }

  // --- Eventos ---

  canvas.addEventListener('click', e => {
    if (!toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    // Verifica se está dentro da altura ativa
    if (row >= currentHeight) return;

    const index = row * SIZE + col;
    gridState[index] = !gridState[index];
    drawGrid();
    updateKeyOutputs();
  });

  startBtn.addEventListener('click', () => {
    if (intervalId !== null) return;
    currentHeight = 9;
    activeHeightLabel.textContent = currentHeight;
    updateHeightButtons();
    stateCounter = 0n;
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
    privateKeysBox.value = '';
    intervalId = setInterval(step, Number(speedInput.value));
    startBtn.disabled = true;
    stopBtn.disabled = false;
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

  speedInput.addEventListener('input', () => {
    speedLabel.textContent = speedInput.value;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = setInterval(step, Number(speedInput.value));
    }
  });

  // --- Funções do loop ---

  async function step() {
    const mode = [...modeRadios].find(r => r.checked).value;

    if (randomizeOnStepCheckbox.checked) {
      randomizeGrid();
      return;
    }

    if (mode === 'sequential') {
      const maxCounter = getMaxCounterForHeight(currentHeight);

      if (stateCounter >= maxCounter) {
        currentHeight++;
        if (currentHeight > maxHeight) {
          stop();
          return;
        }
        activeHeightLabel.textContent = currentHeight;
        updateHeightButtons();
        stateCounter = 0n;
      }

      setGridFromCounter(stateCounter, currentHeight);
      drawGrid();
      await updateKeyOutputs();
      stateCounter++;
    } else if (mode === 'random') {
      const maxCells = currentHeight * SIZE;
      const idx = Math.floor(Math.random() * maxCells);
      gridState[idx] = !gridState[idx];
      drawGrid();
      await updateKeyOutputs();
    }
  }

  function stop() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  // Inicialização da UI
  createHeightButtons();
  drawGrid();

})();
