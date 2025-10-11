(() => {
  const SIZE = 16;
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');

  // DOM
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');
  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const toggleOnClickCheckbox = document.getElementById('toggleOnClick');
  const randomizeOnStepCheckbox = document.getElementById('randomizeStatesOnStep');
  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');
  const privateKeysBox = document.getElementById('privateKeysBox');

  // Novos controles: faixa de altura e faixa de base
  const heightSelect = document.getElementById('heightSelect');  // linha superior
  const baseSelect = document.getElementById('baseSelect');      // linha inferior

  // Estado
  let gridState = new Array(SIZE * SIZE).fill(false);

  // altura e base em termos de linha, de 1 a 16
  // altura (top) de 1 a 15, base (bot) de 2 a 16, e base > altura
  let altura = 1;   // linha superior (mais acima)
  let base = 2;     // linha inferior (mais abaixo)

  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  const CELL_SIZE = canvas.width / SIZE;

  // Cria selects para altura e base
  function createRangeSelectors() {
    // altura: 1 a 15
    for (let h = 1; h <= SIZE - 1; h++) {
      const opt = document.createElement('option');
      opt.value = h;
      opt.textContent = `Linha ${h}`;
      heightSelect.appendChild(opt);
    }
    // base: 2 a 16
    for (let b = 2; b <= SIZE; b++) {
      const opt = document.createElement('option');
      opt.value = b;
      opt.textContent = `Linha ${b}`;
      baseSelect.appendChild(opt);
    }

    heightSelect.value = altura;
    baseSelect.value = base;

    heightSelect.addEventListener('change', () => {
      const v = parseInt(heightSelect.value, 10);
      altura = v;
      // força base > altura
      if (base <= altura) {
        base = altura + 1;
        baseSelect.value = base;
      }
      drawGrid();
    });

    baseSelect.addEventListener('change', () => {
      const v = parseInt(baseSelect.value, 10);
      base = v;
      if (base <= altura) {
        base = altura + 1;
        baseSelect.value = base;
      }
      drawGrid();
    });
  }

  // Verifica se uma linha y é ativa (está entre altura e base, inclusive)
  function isRowActive(y) {
    // y de 0 (topo) a SIZE-1 (base)
    // altura = linha superior 1 → significa y = altura-1
    // base = linha inferior 16 → y = base-1
    const y_line = y; // índice zero-based
    const alturaIdx = altura - 1;
    const baseIdx = base - 1;
    return (y_line >= alturaIdx && y_line <= baseIdx);
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

    // marca faixa ativa visualmente
    ctx.fillStyle = 'rgba(255,99,71,0.3)';
    const alturaIdx = (altura - 1) * CELL_SIZE;
    const baseIdx = (base - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(0, alturaIdx, SIZE * CELL_SIZE, heightPx);
  }

  // Converte gridState + faixa ativa em HEX de 256 bits
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

  async function sha256(buf) {
    const hash = await crypto.subtle.digest('SHA-256', buf);
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
    const hexKey = gridToHex();
    const wifC = await privateKeyToWIF(hexKey, true);
    const wifU = await privateKeyToWIF(hexKey, false);

    hexBox.value += hexKey + '\n';
    wifBox.value += wifC + '\n';
    wifBoxUncompressed.value += wifU + '\n';
    privateKeysBox.value += `HEX:${hexKey} WIFc:${wifC} WIFu:${wifU}\n`;

    hexBox.scrollTop = hexBox.scrollHeight;
    wifBox.scrollTop = wifBox.scrollHeight;
    wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
  }

  function randomizeArea() {
    for (let y = altura - 1; y <= base - 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateKeyOutputs();
  }

  function clearAll() {
    gridState.fill(false);
    drawGrid();
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
    privateKeysBox.value = '';
  }

  function getMaxCounter() {
    const activeRows = base - altura + 1;
    return 1n << BigInt(activeRows * SIZE);
  }

  function setGridFromCounter(cnt) {
    const activeRows = base - altura + 1;
    const totalBits = activeRows * SIZE;
    for (let i = 0; i < totalBits; i++) {
      const bit = (cnt >> BigInt(totalBits - 1 - i)) & 1n;
      // mapa para linha-coluna:
      const rowOffset = Math.floor(i / SIZE);
      const col = i % SIZE;
      const y = (altura - 1) + rowOffset;  // linha y na matriz
      gridState[y * SIZE + col] = (bit === 1n);
    }
    // fora da área ativa, zera
    for (let y = 0; y < SIZE; y++) {
      if (y < (altura - 1) || y > (base - 1)) {
        for (let x = 0; x < SIZE; x++) {
          gridState[y * SIZE + x] = false;
        }
      }
    }
  }

  async function step() {
    const mode = Array.from(modeRadios).find(r => r.checked).value;

    if (randomizeOnStepCheckbox.checked) {
      randomizeArea();
      scheduleNext();
      return;
    }

    if (mode === 'sequential') {
      const maxCnt = getMaxCounter();
      if (stateCounter >= maxCnt) {
        stop();
        return;
      }
      setGridFromCounter(stateCounter);
      drawGrid();
      await updateKeyOutputs();
      stateCounter++;
      scheduleNext();
    } else {
      // modo random dentro área
      const activeRows = base - altura + 1;
      const totalCells = activeRows * SIZE;
      const idx = Math.floor(Math.random() * totalCells);
      const rowOffset = Math.floor(idx / SIZE);
      const col = idx % SIZE;
      const y = (altura - 1) + rowOffset;
      const pos = y * SIZE + col;
      gridState[pos] = !gridState[pos];
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
    stateCounter = 0n;
    clearAll();  // zera grade e caixas
    step();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }

  function stop() {
    running = false;
    if (timeoutId !== null) {
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
    if (!isRowActive(row)) return;
    const pos = row * SIZE + col;
    gridState[pos] = !gridState[pos];
    drawGrid();
    updateKeyOutputs();
  });

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', () => {
    stop();
    clearAll();
  });
  randBtn.addEventListener('click', randomizeArea);
  speedInput.addEventListener('input', () => {
    speedLabel.textContent = speedInput.value;
    if (running) {
      clearTimeout(timeoutId);
      scheduleNext();
    }
  });

  // Inicialização
  createRangeSelectors();
  drawGrid();

})();
