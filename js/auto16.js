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

  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');
  const privateKeysBox = document.getElementById('privateKeysBox');

  // Botões para escolher altura (linha superior) e base (linha inferior)
  const heightButtonsDiv = document.getElementById('heightButtons'); // será usado para altura
  const baseButtonsDiv = document.createElement('div');
  baseButtonsDiv.id = 'baseButtons';
  baseButtonsDiv.className = 'height-panel';

  // Estado da faixa
  let altura = 1;  // valor de linha superior, de 1 a 16
  let base = 1;    // valor de linha inferior, de 1 a 16 (agora pode ser igual à altura)

  // Estado da matriz
  let gridState = new Array(SIZE * SIZE).fill(false);

  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  const CELL_SIZE = canvas.width / SIZE;

  // Cria botões de altura e base
  function createRangeButtons() {
    // altura (linha superior): 1 a 16
    const alturaGroup = document.createElement('div');
    alturaGroup.className = 'mb-2';
    alturaGroup.innerHTML = '<div class="small">Altura (linha superior):</div>';
    for (let h = 1; h <= SIZE; h++) {
      const btn = document.createElement('button');
      btn.textContent = h;
      btn.className = 'btn btn-sm btn-outline-primary size-btn';
      btn.dataset.h = h;
      btn.addEventListener('click', () => {
        if (running) return;
        altura = h;
        // força base ≥ altura
        if (base < altura) {
          base = altura;
        }
        updateHeightBaseButtons();
        drawGrid();
      });
      alturaGroup.appendChild(btn);
    }
    heightButtonsDiv.parentNode.insertBefore(alturaGroup, heightButtonsDiv);
    heightButtonsDiv.remove(); // vamos reaproveitar heightButtonsDiv para base?

    // usar heightButtonsDiv como container de base
    const baseGroup = document.createElement('div');
    baseGroup.className = 'mt-3';
    baseGroup.innerHTML = '<div class="small">Base (linha inferior):</div>';
    for (let b = 1; b <= SIZE; b++) {
      const btn = document.createElement('button');
      btn.textContent = b;
      btn.className = 'btn btn-sm btn-outline-primary size-btn';
      btn.dataset.b = b;
      btn.addEventListener('click', () => {
        if (running) return;
        base = b;
        // força base ≥ altura
        if (base < altura) {
          base = altura;
        }
        updateHeightBaseButtons();
        drawGrid();
      });
      baseGroup.appendChild(btn);
    }
    // inserir baseGroup após alturaGroup
    alturaGroup.parentNode.insertBefore(baseGroup, startBtn);

    // guardar referências
    baseButtonsDiv.appendChild(baseGroup);
    updateHeightBaseButtons();
  }

  function updateHeightBaseButtons() {
    // atualizar estilo dos botões de altura e base
    const alturaBtns = document.querySelectorAll('[data-h]');
    alturaBtns.forEach(btn => {
      const h = parseInt(btn.dataset.h, 10);
      if (h === altura) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-outline-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
      }
    });
    const baseBtns = document.querySelectorAll('[data.b]');
    baseBtns.forEach(btn => {
      const b = parseInt(btn.dataset.b, 10);
      if (b === base) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-outline-primary');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline-primary');
      }
    });
  }

  // Verifica se linha y (0-based) está dentro da faixa ativa entre altura e base (inclusive)
  function isRowActive(y) {
    const idxRow = y;  // 0 = topo, 15 = base
    const alturaIdx = altura - 1;
    const baseIdx = base - 1;
    return idxRow >= alturaIdx && idxRow <= baseIdx;
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
    // destacar a faixa ativa
    ctx.fillStyle = 'rgba(255,99,71,0.3)';
    const yStart = (altura - 1) * CELL_SIZE;
    const heightRows = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(0, yStart, SIZE * CELL_SIZE, heightRows);
  }

  // Converte a faixa ativa da matriz para HEX (256 bits, bits fora da faixa = 0)
  function gridToHex() {
    const bits = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (isRowActive(y)) bits.push(gridState[y * SIZE + x] ? '1' : '0');
        else bits.push('0');
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
    privateKeysBox.value += `HEX:${hexKey} | WIFc:${wifC} | WIFu:${wifU}\n`;

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
    privateKeysBox.value = '';
  }

  function getMaxCounter() {
    const numRows = base - altura + 1;
    return 1n << BigInt(numRows * SIZE);
  }

  function setGridFromCounter(cnt) {
    const numRows = base - altura + 1;
    const totalBits = numRows * SIZE;
    for (let i = 0; i < totalBits; i++) {
      const bit = (cnt >> BigInt(totalBits - 1 - i)) & 1n;
      const rowOffset = Math.floor(i / SIZE);
      const col = i % SIZE;
      const y = (altura - 1) + rowOffset;
      gridState[y * SIZE + col] = (bit === 1n);
    }
    // zerar fora
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
      randomizeRange();
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
      const numRows = base - altura + 1;
      const totalCells = numRows * SIZE;
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
    clearAll();
    step();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }

  function stop() {
    running = false;
    if (timeoutId != null) {
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
  randBtn.addEventListener('click', randomizeRange);
  speedInput.addEventListener('input', () => {
    speedLabel.textContent = speedInput.value;
    if (running) {
      clearTimeout(timeoutId);
      scheduleNext();
    }
  });

  // Inicializar botões e grade
  createRangeButtons();
  drawGrid();
})();
