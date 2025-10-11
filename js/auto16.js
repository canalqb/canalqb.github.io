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
  let currentHeight = 9;
  let maxHeight = 16;
  let stateCounter = 0n;

  const CELL_SIZE = 32;

  let running = false;
  let timeoutId = null;

  // Cria botões altura
  function createHeightButtons() {
    for (let h = 1; h <= maxHeight; h++) {
      const btn = document.createElement('button');
      btn.textContent = h;
      btn.className = 'btn btn-outline-primary size-btn';
      btn.dataset.height = h;
      btn.addEventListener('click', () => {
        if (running) return; // bloqueia se estiver rodando
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

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ccc';

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        const idx = row * SIZE + col;
        const x = col * CELL_SIZE;
        const y = row * CELL_SIZE;
        ctx.fillStyle = gridState[idx] ? '#28a745' : '#fff';
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
    // destaque altura ativa
    ctx.fillStyle = 'rgba(40,167,69,0.15)';
    ctx.fillRect(0, 0, CELL_SIZE * SIZE, CELL_SIZE * currentHeight);
  }

  function gridToHex(height) {
    const bits = [];
    const totalBits = height * SIZE;
    for (let i = 0; i < totalBits; i++) {
      bits.push(gridState[i] ? '1' : '0');
    }
    while (bits.length < SIZE * SIZE) bits.push('0');

    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byteStr = bits.slice(i, i + 8).join('');
      bytes.push(parseInt(byteStr, 2));
    }
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hashBuffer);
  }

  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function base58Encode(buffer) {
    let intVal = 0n;
    for (const b of buffer) {
      intVal = (intVal << 8n) + BigInt(b);
    }
    let result = '';
    while (intVal > 0) {
      const mod = intVal % 58n;
      intVal = intVal / 58n;
      result = BASE58_ALPHABET[Number(mod)] + result;
    }
    for (const b of buffer) {
      if (b === 0) result = '1' + result;
      else break;
    }
    return result;
  }

  function hexStringToUint8Array(hex) {
    if (hex.length % 2 !== 0) throw new Error('Invalid hex string');
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return arr;
  }

  async function privateKeyToWIF(hexKey, compressed = true) {
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

  async function updateKeyOutputs() {
    const hexKey = gridToHex(currentHeight);
    const wifCompressed = await privateKeyToWIF(hexKey, true);
    const wifUncompressed = await privateKeyToWIF(hexKey, false);

    hexBox.value += hexKey + '\n';
    wifBox.value += wifCompressed + '\n';
    wifBoxUncompressed.value += wifUncompressed + '\n';

    privateKeysBox.value += `HEX: ${hexKey} | WIFc: ${wifCompressed} | WIFu: ${wifUncompressed}\n`;

    hexBox.scrollTop = hexBox.scrollHeight;
    wifBox.scrollTop = wifBox.scrollHeight;
    wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
  }

  function randomizeGrid() {
    const totalCells = currentHeight * SIZE;
    for (let i = 0; i < totalCells; i++) {
      gridState[i] = Math.random() >= 0.5;
    }
    for (let i = totalCells; i < SIZE * SIZE; i++) {
      gridState[i] = false;
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

  function getMaxCounterForHeight(height) {
    return 1n << BigInt(height * SIZE);
  }

  canvas.addEventListener('click', e => {
    if (!toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);

    if (row >= currentHeight) return;

    const idx = row * SIZE + col;
    gridState[idx] = !gridState[idx];
    drawGrid();
    updateKeyOutputs();
  });

  startBtn.addEventListener('click', () => {
    if (running) return;

    running = true;
    currentHeight = 9;
    activeHeightLabel.textContent = currentHeight;
    updateHeightButtons();
    stateCounter = 0n;

    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
    privateKeysBox.value = '';

    // Começa o loop
    runLoop();
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
    if (running) {
      clearTimeout(timeoutId);
      runLoop();
    }
  });

  async function runLoop() {
    if (!running) return;

    const mode = [...modeRadios].find(r => r.checked).value;

    if (randomizeOnStepCheckbox.checked) {
      randomizeGrid();
      timeoutId = setTimeout(runLoop, Number(speedInput.value));
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

    timeoutId = setTimeout(runLoop, Number(speedInput.value));
  }

  function stop() {
    running = false;
    clearTimeout(timeoutId);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  createHeightButtons();
  drawGrid();
})();
