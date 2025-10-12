document.addEventListener('DOMContentLoaded', () => {
  const SIZE = 16;
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');

  let altura = 1;
  let base = SIZE;
  let gridState = new Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

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

  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');
  const activeHeightLabel = document.getElementById('activeHeightLabel');

  // Responsividade do canvas
function resizeCanvas() {
  const displayWidth = canvas.clientWidth;
  const displayHeight = canvas.clientHeight;

  // Corrigir dimensões internas (pixels reais)
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  drawGrid();
}

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function getCellSize() {
    return canvas.width / SIZE;
  }

  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';

    for (let i = 1; i <= SIZE; i++) {
      const btnH = document.createElement('button');
      btnH.textContent = i;
      btnH.className = 'btn btn-sm btn-outline-primary size-btn';
      btnH.dataset.h = i;
      btnH.addEventListener('click', () => {
        if (running) return;
        altura = i;
        if (base < altura) base = altura;
        updateRangeButtons();
        drawGrid();
      });
      heightButtonsDiv.appendChild(btnH);

      const btnB = document.createElement('button');
      btnB.textContent = i;
      btnB.className = 'btn btn-sm btn-outline-primary size-btn';
      btnB.dataset.b = i;
      btnB.addEventListener('click', () => {
        if (running) return;
        base = i;
        if (base < altura) base = altura;
        updateRangeButtons();
        drawGrid();
      });
      baseButtonsDiv.appendChild(btnB);
    }

    updateRangeButtons();
  }

  function updateRangeButtons() {
    heightButtonsDiv.querySelectorAll('button').forEach(btn => {
      const h = parseInt(btn.dataset.h);
      btn.classList.toggle('btn-primary', h === altura);
      btn.classList.toggle('btn-outline-primary', h !== altura);
    });

    baseButtonsDiv.querySelectorAll('button').forEach(btn => {
      const b = parseInt(btn.dataset.b);
      btn.classList.toggle('btn-primary', b === base);
      btn.classList.toggle('btn-outline-primary', b !== base);
    });

    if (activeHeightLabel) {
      activeHeightLabel.textContent = `${altura} .. ${base}`;
    }
  }

  function isRowActive(y) {
    return y >= (altura - 1) && y <= (base - 1);
  }

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

    // destaque da faixa ativa
    ctx.fillStyle = 'rgba(255, 99, 71, 0.3)';
    ctx.fillRect(0, (altura - 1) * CELL_SIZE, SIZE * CELL_SIZE, (base - altura + 1) * CELL_SIZE);
  }

  function gridToHex() {
    const bits = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        bits.push(isRowActive(y) && gridState[y * SIZE + x] ? '1' : '0');
      }
    }

    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      bytes.push(parseInt(bits.slice(i, i + 8).join(''), 2));
    }

    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function sha256(buf) {
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    return new Uint8Array(hashBuf);
  }

  function base58Encode(buffer) {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let intVal = BigInt('0x' + Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(''));
    let s = '';
    while (intVal > 0n) {
      const mod = intVal % 58n;
      intVal /= 58n;
      s = ALPHABET[Number(mod)] + s;
    }
    for (let b of buffer) {
      if (b === 0) s = '1' + s;
      else break;
    }
    return s;
  }

  function hexStringToUint8Array(hex) {
    return Uint8Array.from(hex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  }

  async function privateKeyToWIF(hexKey, compressed = true) {
    const keyBytes = hexStringToUint8Array(hexKey);
    let payload;

    if (compressed) {
      payload = new Uint8Array([0x80, ...keyBytes, 0x01]);
    } else {
      payload = new Uint8Array([0x80, ...keyBytes]);
    }

    const checksum = (await sha256(await sha256(payload))).slice(0, 4);
    const full = new Uint8Array([...payload, ...checksum]);

    return base58Encode(full);
  }

  async function updateKeyOutputs() {
    const hex = gridToHex();
    const wifC = await privateKeyToWIF(hex, true);
    const wifU = await privateKeyToWIF(hex, false);

    hexBox.value += hex + '\n';
    wifBox.value += wifC + '\n';
    wifBoxUncompressed.value += wifU + '\n';

    hexBox.scrollTop = hexBox.scrollHeight;
    wifBox.scrollTop = wifBox.scrollHeight;
    wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
  }

  function randomizeRange() {
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
  }

  function getMaxCounter() {
    return 1n << BigInt((base - altura + 1) * SIZE);
  }

  function setGridFromCounter(cnt) {
    const totalBits = (base - altura + 1) * SIZE;
    for (let i = 0; i < totalBits; i++) {
      const bit = (cnt >> BigInt(totalBits - 1 - i)) & 1n;
      const y = altura - 1 + Math.floor(i / SIZE);
      const x = i % SIZE;
      gridState[y * SIZE + x] = bit === 1n;
    }

    // Limpa fora da faixa
    for (let y = 0; y < SIZE; y++) {
      if (y < (altura - 1) || y > (base - 1)) {
        for (let x = 0; x < SIZE; x++) {
          gridState[y * SIZE + x] = false;
        }
      }
    }
  }

  async function step() {
    if (!running) return;
    const mode = Array.from(modeRadios).find(r => r.checked)?.value || 'sequential';

    if (mode === 'sequential') {
      if (stateCounter >= getMaxCounter()) {
        stop();
        return;
      }
      setGridFromCounter(stateCounter);
      stateCounter++;
    } else {
      randomizeRange();
    }

    drawGrid();
    await updateKeyOutputs();

    timeoutId = setTimeout(step, parseInt(speedInput.value, 10));
  }

  function start() {
    if (running) return;
    running = true;
    stateCounter = 0n;

    startBtn.disabled = true;
    stopBtn.disabled = false;
    clearBtn.disabled = true;
    randBtn.disabled = true;

    step();
  }

  function stop() {
    if (!running) return;
    running = false;

    startBtn.disabled = false;
    stopBtn.disabled = true;
    clearBtn.disabled = false;
    randBtn.disabled = false;

    clearTimeout(timeoutId);
  }

  canvas.addEventListener('click', (e) => {
    if (!toggleOnClickCheckbox.checked || running) return;

    const rect = canvas.getBoundingClientRect();
    const cellSize = getCellSize();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE && isRowActive(y)) {
      const idx = y * SIZE + x;
      gridState[idx] = !gridState[idx];
      drawGrid();
      updateKeyOutputs();
    }
  });

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', () => {
    stop();
    clearAll();
  });

  randBtn.addEventListener('click', () => {
    stop();
    randomizeRange();
  });

  speedInput.addEventListener('input', () => {
    speedLabel.textContent = speedInput.value;
  });

  // Inicialização
  createRangeButtons();
  drawGrid();
  clearAll();
});
