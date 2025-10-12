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
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const toggleOnClickCheckbox = document.getElementById('toggleOnClick');

  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');

  // Estado da faixa: altura e base iniciam em 1 e 16 respectivamente
  let altura = 1;
  let base = SIZE;

  // Estado da matriz (bits)
  let gridState = new Array(SIZE * SIZE).fill(false);

  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  // Ajusta o tamanho real do canvas para corresponder ao CSS e mantém quadrado
  function resizeCanvas() {
    const style = getComputedStyle(canvas);
    const width = parseInt(style.width);
    canvas.width = width;
    canvas.height = width;
  }

  // Chamamos resize no começo e também quando a janela redimensionar
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    drawGrid();
  });

  function getCellSize() {
    return canvas.width / SIZE;
  }

  // Cria botões de altura e base
  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';

    // Botões altura (1 até 16)
    for (let h = 1; h <= SIZE; h++) {
      const btn = document.createElement('button');
      btn.textContent = h;
      btn.className = 'btn btn-sm btn-outline-primary size-btn';
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

    // Botões base (1 até 16)
    for (let b = 1; b <= SIZE; b++) {
      const btn = document.createElement('button');
      btn.textContent = b;
      btn.className = 'btn btn-sm btn-outline-primary size-btn';
      btn.dataset.b = b;
      btn.addEventListener('click', () => {
        if (running) return;
        base = b;
        if (base < altura) base = altura;
        updateRangeButtons();
        drawGrid();
      });
      baseButtonsDiv.appendChild(btn);
    }

    updateRangeButtons();
  }

  function updateRangeButtons() {
    // Atualiza botões altura
    const hBtns = heightButtonsDiv.querySelectorAll('button');
    hBtns.forEach(btn => {
      const h = parseInt(btn.dataset.h, 10);
      if (h === altura) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-outline-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
      }
    });

    // Atualiza botões base
    const bBtns = baseButtonsDiv.querySelectorAll('button');
    bBtns.forEach(btn => {
      const b = parseInt(btn.dataset.b, 10);
      if (b === base) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-outline-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
      }
    });

    // Atualiza label ativa (se existir)
    const activeHeightLabel = document.getElementById('activeHeightLabel');
    if (activeHeightLabel) activeHeightLabel.textContent = `${altura} .. ${base}`;
  }

  // Verifica se a linha y está dentro da faixa ativa
  function isRowActive(y) {
    const yIdx = y; // 0..15
    return yIdx >= (altura - 1) && yIdx <= (base - 1);
  }

  // Desenha a grade inteira
  function drawGrid() {
    const CELL_SIZE = getCellSize();
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

    // Destaque da faixa ativa
    ctx.fillStyle = 'rgba(255, 99, 71, 0.3)';
    const yStart = (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(0, yStart, SIZE * CELL_SIZE, heightPx);
  }

  // Gera string hex da grade ativa
  function gridToHex() {
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

    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byteStr = bits.slice(i, i + 8).join('');
      bytes.push(parseInt(byteStr, 2));
    }

    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // SHA-256 usando Web Crypto API
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

    if (hexBox) {
      hexBox.value += hex + '\n';
      hexBox.scrollTop = hexBox.scrollHeight;
    }
    if (wifBox) {
      wifBox.value += wifC + '\n';
      wifBox.scrollTop = wifBox.scrollHeight;
    }
    if (wifBoxUncompressed) {
      wifBoxUncompressed.value += wifU + '\n';
      wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
    }
  }

  // Randomiza bits dentro da faixa ativa
  function randomizeRange() {
    for (let y = altura - 1; y <= base - 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateKeyOutputs();
  }

  // Limpa toda a grade e caixas de texto
  function clearAll() {
    gridState.fill(false);
    drawGrid();
    if (hexBox) hexBox.value = '';
    if (wifBox) wifBox.value = '';
    if (wifBoxUncompressed) wifBoxUncompressed.value = '';
  }

  function getMaxCounter() {
    const numRows = base - altura + 1;
    return 1n << BigInt(numRows * SIZE);
  }

  // Define a grade baseado no contador sequencial
  function setGridFromCounter(cnt) {
    const numRows = base - altura + 1;
    const totalBits = numRows * SIZE;

    let bitsLeft = cnt;

    // Zera linhas fora da faixa
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        if (!isRowActive(y)) {
          gridState[idx] = false;
        }
      }
    }

    // Define bits dentro da faixa ativa
    for (let y = altura - 1; y <= base - 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        gridState[idx] = (bitsLeft & 1n) === 1n;
        bitsLeft >>= 1n;
      }
    }
  }

  // Atualiza label do speed
  function updateSpeedLabel() {
    speedLabel.textContent = `Velocidade: ${speedInput.value} ms`;
  }

  // Função que roda o passo de atualização automática
  async function autoStep() {
    if (!running) return;

    const max = getMaxCounter();
    if (stateCounter >= max) {
      running = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      return;
    }

    setGridFromCounter(stateCounter);
    drawGrid();
    await updateKeyOutputs();

    stateCounter++;

    timeoutId = setTimeout(autoStep, parseInt(speedInput.value));
  }

  // Eventos do canvas (clique)
  canvas.addEventListener('click', e => {
    if (running) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / getCellSize());
    const y = Math.floor((e.clientY - rect.top) / getCellSize());

    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;

    if (!isRowActive(y)) return;

    if (toggleOnClickCheckbox.checked) {
      // Inverte bit
      const idx = y * SIZE + x;
      gridState[idx] = !gridState[idx];
      drawGrid();
      updateKeyOutputs();
    } else {
      // Se não toggle, não faz nada no clique
    }
  });

  // Botões
  startBtn.addEventListener('click', () => {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    stateCounter = 0n;
    clearBtn.disabled = true;
    randBtn.disabled = true;
    speedInput.disabled = true;

    // Desabilitar botões altura/base
    heightButtonsDiv.querySelectorAll('button').forEach(b => b.disabled = true);
    baseButtonsDiv.querySelectorAll('button').forEach(b => b.disabled = true);

    autoStep();
  });

  stopBtn.addEventListener('click', () => {
    if (!running) return;
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    clearBtn.disabled = false;
    randBtn.disabled = false;
    speedInput.disabled = false;

    // Reabilitar botões altura/base
    heightButtonsDiv.querySelectorAll('button').forEach(b => b.disabled = false);
    baseButtonsDiv.querySelectorAll('button').forEach(b => b.disabled = false);

    if (timeoutId) clearTimeout(timeoutId);
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
    updateSpeedLabel();
  });

  // Inicialização
  createRangeButtons();
  updateSpeedLabel();
  drawGrid();
});
