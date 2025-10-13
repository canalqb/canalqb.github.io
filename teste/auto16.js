document.addEventListener('DOMContentLoaded', () => {
  const SIZE = 16;
  const CELL_SIZE = 25;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;
  const MARGIN_RIGHT = 130;

  // DOM
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');
  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');
  const toggleOnClickCheckbox = document.getElementById('toggleOnClick');
  const randomizeOnStepCheckbox = document.getElementById('randomizeStatesOnStep');
  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');
  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');
  const extraLineButtonsDiv = document.getElementById('extraLineButtons');

  // Estado
  let altura = 12;
  let base = 16;
  let extraLine = 1;
  let gridState = new Array(SIZE * SIZE).fill(false);
  let extraLineSelection = new Array(SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  // Canvas setup
  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
  canvas.height = MARGIN_TOP + SIZE * CELL_SIZE;

  function updateRangeLabel() {
    const label = document.getElementById('activeRangeLabel');
    if (label) label.textContent = `${altura} até ${base}, linha extra: ${extraLine}`;
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    // Cabeçalho colunas (topo)
    ctx.textAlign = 'center';
    for (let x = 0; x < SIZE; x++) {
      const px = MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2;
      ctx.fillText((x + 1).toString(), px, MARGIN_TOP / 2);
    }

    // Números linhas e intervalos (laterais)
    for (let y = 0; y < SIZE; y++) {
      const py = MARGIN_TOP + y * CELL_SIZE + CELL_SIZE / 2;
      ctx.textAlign = 'right';
      ctx.fillText((y + 1).toString(), MARGIN_LEFT - 5, py);
      ctx.textAlign = 'left';
      const linhasContadas = SIZE - y;
      const powStart = (linhasContadas - 1) * SIZE;
      const powEnd = linhasContadas * SIZE - 1;
      ctx.fillText(`2^${powStart}..2^${powEnd}`, MARGIN_LEFT + SIZE * CELL_SIZE + 10, py);
    }

    // Células do grid
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        if (y === extraLine - 1) {
          ctx.fillStyle = extraLineSelection[x] ? '#f6ad55' : '#fff5e6';
        } else {
          ctx.fillStyle = gridState[idx] ? '#48bb78' : '#fff';
        }
        ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destaques faixa altura-base
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    // Destaque faixa extraLine
    ctx.fillStyle = 'rgba(244, 180, 0, 0.3)';
    const yExtra = MARGIN_TOP + (extraLine - 1) * CELL_SIZE;
    ctx.fillRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.strokeRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);
  }

  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';
    extraLineButtonsDiv.innerHTML = '';

    for (let i = 1; i <= SIZE; i++) {
      const hBtn = createRangeButton(i, 'altura');
      heightButtonsDiv.appendChild(hBtn);

      const bBtn = createRangeButton(i, 'base');
      baseButtonsDiv.appendChild(bBtn);

      const eBtn = createRangeButton(i, 'extraLine');
      extraLineButtonsDiv.appendChild(eBtn);
    }
    updateRangeButtons();
  }

  function createRangeButton(value, type) {
    const btn = document.createElement('button');
    btn.textContent = value;
    btn.className = 'range-btn';
    btn.addEventListener('click', () => {
      if (running) return;
      if (type === 'altura') {
        altura = value;
        if (base < altura) base = altura;
        if (extraLine < 1) extraLine = 1;
        if (extraLine > base) extraLine = base;
      } else if (type === 'base') {
        base = value;
        if (base < altura) altura = base;
        if (extraLine < 1) extraLine = 1;
        if (extraLine > base) extraLine = base;
      } else if (type === 'extraLine') {
        if (value < altura) {
          alert('Faixa extra não pode ser menor que a altura');
          return;
        }
        if (value > base) {
          alert('Faixa extra não pode ser maior que a base');
          return;
        }
        extraLine = value;
      }
      updateRangeButtons();
      drawGrid();
    });
    return btn;
  }

  function updateRangeButtons() {
    [...heightButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', Number(btn.textContent) === altura);
    });
    [...baseButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', Number(btn.textContent) === base);
    });
    [...extraLineButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', Number(btn.textContent) === extraLine);
    });
    updateRangeLabel();
  }

  function gridToHex() {
    const bits = gridState.map(c => c ? '1' : '0').join('');
    const hex = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = parseInt(bits.slice(i, i + 8), 2);
      hex.push(byte.toString(16).padStart(2, '0'));
    }
    return hex.join('');
  }

  async function sha256(buffer) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hash);
  }

  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
  }

  async function privateKeyToWIF(hex, compressed = true) {
    const key = hexToBytes(hex);
    const prefix = [0x80];
    const suffix = compressed ? [0x01] : [];
    const payload = new Uint8Array([...prefix, ...key, ...suffix]);

    const hash1 = await sha256(payload);
    const hash2 = await sha256(hash1);
    const checksum = hash2.slice(0, 4);
    const fullPayload = new Uint8Array([...payload, ...checksum]);

    return base58Encode(fullPayload);
  }

  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function base58Encode(buffer) {
    let intVal = BigInt('0x' + [...buffer].map(b => b.toString(16).padStart(2, '0')).join(''));
    let result = '';
    while (intVal > 0) {
      result = BASE58[Number(intVal % 58n)] + result;
      intVal /= 58n;
    }
    for (const b of buffer) {
      if (b === 0) result = '1' + result;
      else break;
    }
    return result;
  }

  async function updateOutput() {
    const hex = gridToHex();
    const wif = await privateKeyToWIF(hex, true);
    const wifU = await privateKeyToWIF(hex, false);

    appendLineNoScroll(hexBox, hex);
    appendLineNoScroll(wifBox, wif);
    appendLineNoScroll(wifBoxUncompressed, wifU);
  }

  function appendLineNoScroll(textarea, line) {
    const hadContent = textarea.value.length > 0;
    textarea.value += (hadContent ? '\n' : '') + line;
    textarea.scrollTop = textarea.scrollHeight;
  }

  function clearAll() {
    gridState.fill(false);
    extraLineSelection.fill(false);
    stateCounter = 0n;
    drawGrid();
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
  }

  async function randomizeRange() {
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    await updateOutput();
  }

  function getSelectedMode() {
    const radios = document.querySelectorAll('input[name="mode"]');
    for (const r of radios) if (r.checked) return r.value;
    return 'sequential';
  }

  async function step() {
    if (!running) return;
    stateCounter++;

    const selectedCellsCount = extraLineSelection.filter(Boolean).length;
    if (selectedCellsCount === 0) {
      alert('Selecione pelo menos uma célula na faixa extra para participar do contador.');
      stop();
      return;
    }

    const rowsCount = base - altura + 1;
    const totalCells = rowsCount * selectedCellsCount;
    const max = 1n << BigInt(totalCells);

    if (stateCounter >= max) {
      stop();
      return;
    }

    const bits = stateCounter.toString(2).padStart(totalCells, '0');
    const mode = getSelectedMode();

    if (mode === 'sequential') {
      let bitIndex = 0;
      for (let y = altura - 1; y < base; y++) {
        for (let x = 0; x < SIZE; x++) {
          if (!extraLineSelection[x]) continue;
          const idx = y * SIZE + x;
          gridState[idx] = bits[bitIndex] === '1';
          bitIndex++;
        }
      }
    } else if (mode === 'vertical') {
      let bitIndex = 0;
      for (let col = SIZE - 1; col >= 0; col--) {
        if (!extraLineSelection[col]) continue;
        for (let row = base - 1; row >= altura - 1; row--) {
          const idx = row * SIZE + col;
          gridState[idx] = bits[bitIndex] === '1';
          bitIndex++;
          if (bitIndex >= bits.length) break;
        }
        if (bitIndex >= bits.length) break;
      }
    }

    if (randomizeOnStepCheckbox.checked) {
      await randomizeRange();
    } else {
      drawGrid();
      await updateOutput();
    }

    timeoutId = setTimeout(step, parseInt(speedInput.value, 10));
  }

  function start() {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    step();
  }

  function stop() {
    running = false;
    clearTimeout(timeoutId);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  canvas.addEventListener('click', async (e) => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY - MARGIN_TOP) / CELL_SIZE);

    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
      if (y === extraLine - 1) {
        extraLineSelection[x] = !extraLineSelection[x];
      } else {
        const idx = y * SIZE + x;
        gridState[idx] = !gridState[idx];
      }
      drawGrid();
      await updateOutput();
    }
  });

  speedInput.addEventListener('input', () => {
    speedLabel.textContent = `${speedInput.value} ms`;
  });

  startBtn.onclick = start;
  stopBtn.onclick = stop;
  clearBtn.onclick = () => {
    if (!running) clearAll();
  };
  randBtn.onclick = () => {
    if (!running) randomizeRange();
  };

  function setupCopyAndSaveButtons(id, label) {
    const textarea = document.getElementById(id);
    const container = textarea.parentElement;

    const btnGroup = document.createElement('div');
    btnGroup.style.display = 'flex';
    btnGroup.style.gap = '10px';
    btnGroup.style.marginBottom = '10px';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-sm btn-outline-secondary';
    copyBtn.innerText = `📋 Copiar ${label}`;
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(textarea.value)
        .then(() => alert(`${label} copiado para a área de transferência!`))
        .catch(() => alert(`Erro ao copiar ${label}`));
    };

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-sm btn-outline-primary';
    saveBtn.innerText = `💾 Salvar ${label}`;
    saveBtn.onclick = () => {
      const blob = new Blob([textarea.value], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    btnGroup.appendChild(copyBtn);
    btnGroup.appendChild(saveBtn);
    container.insertBefore(btnGroup, textarea);
  }

  // Inicializa
  setupCopyAndSaveButtons('hexBox', 'Hex');
  setupCopyAndSaveButtons('wifBox', 'WIF');
  setupCopyAndSaveButtons('wifBoxUncompressed', 'WIF Não Compactado');

  createRangeButtons();
  drawGrid();
  speedLabel.textContent = `${speedInput.value} ms`;
});
