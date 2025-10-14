document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIGURAÇÕES DO GRID ---
  const SIZE = 16;
  const CELL_SIZE = 25;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;
  const MARGIN_RIGHT = 130;

  // --- ELEMENTOS DOM ---
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
  const enableExtraLineCheckbox = document.getElementById('enableExtraLine');
  const extraLineSelect = document.getElementById('extraLineSelect');

  // --- ESTADO ---
  let altura = 12;
  let base = 16;
  let extraLine = null;
  let gridState = Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  // --- CANVAS ---
  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
  canvas.height = MARGIN_TOP + SIZE * CELL_SIZE;

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    // Cabeçalho das colunas
    ctx.textAlign = 'center';
    for (let x = 0; x < SIZE; x++) {
      const px = MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2;
      ctx.fillText((x + 1).toString(), px, MARGIN_TOP / 2);
    }

    // Linhas e intervalos laterais
    for (let y = 0; y < SIZE; y++) {
      const py = MARGIN_TOP + y * CELL_SIZE + CELL_SIZE / 2;
      ctx.textAlign = 'right';
      ctx.fillText((y + 1).toString(), MARGIN_LEFT - 5, py);
      ctx.textAlign = 'left';
      const powStart = (SIZE - 1 - y) * SIZE;
      const powEnd = powStart + SIZE - 1;
      ctx.fillText(`2^${powStart}..2^${powEnd}`, MARGIN_LEFT + SIZE * CELL_SIZE + 10, py);
    }

    // Células do grid
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#fff';
        ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destaque da faixa selecionada
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    // Destaque da linha extra
    if (enableExtraLineCheckbox.checked && extraLine !== null) {
      if (extraLine < altura || extraLine > base) {
        const y = MARGIN_TOP + (extraLine - 1) * CELL_SIZE;
        ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
        ctx.fillRect(MARGIN_LEFT, y, SIZE * CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.strokeRect(MARGIN_LEFT, y, SIZE * CELL_SIZE, CELL_SIZE);
      }
    }
  }

  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';

    for (let i = 1; i <= SIZE; i++) {
      const hBtn = document.createElement('button');
      hBtn.textContent = i;
      hBtn.className = 'range-btn';
      hBtn.onclick = () => {
        if (!running) {
          altura = i;
          if (base < altura) base = altura;
          updateRangeButtons();
          updateExtraLineOptions();
          drawGrid();
        }
      };
      heightButtonsDiv.appendChild(hBtn);

      const bBtn = document.createElement('button');
      bBtn.textContent = i;
      bBtn.className = 'range-btn';
      bBtn.onclick = () => {
        if (!running) {
          base = i;
          if (base < altura) altura = base;
          updateRangeButtons();
          updateExtraLineOptions();
          drawGrid();
        }
      };
      baseButtonsDiv.appendChild(bBtn);
    }

    updateRangeButtons();
  }

  function updateRangeButtons() {
    [...heightButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === altura);
    });
    [...baseButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === base);
    });
    updateRangeLabel();
  }

  function updateRangeLabel() {
    const label = document.getElementById('activeRangeLabel');
    if (label) label.textContent = `${altura} até ${base}`;
  }

  function updateExtraLineOptions() {
    const options = [];

    for (let i = 1; i <= SIZE; i++) {
      if (i < altura || i > base) {
        options.push(i);
      }
    }

    extraLineSelect.innerHTML = '';

    if (options.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = 'Nenhuma linha disponível';
      opt.disabled = true;
      extraLineSelect.appendChild(opt);
      extraLineSelect.disabled = true;
      extraLine = null;
    } else {
      for (const line of options) {
        const opt = document.createElement('option');
        opt.value = line;
        opt.textContent = `Linha ${line}`;
        extraLineSelect.appendChild(opt);
      }
      extraLineSelect.disabled = false;
      extraLine = parseInt(extraLineSelect.value);
    }

    drawGrid();
  }

  enableExtraLineCheckbox.addEventListener('change', () => {
    if (enableExtraLineCheckbox.checked) {
      updateExtraLineOptions();
    } else {
      extraLine = null;
      extraLineSelect.innerHTML = '';
      extraLineSelect.disabled = true;
      drawGrid();
    }
  });

  extraLineSelect.addEventListener('change', () => {
    extraLine = parseInt(extraLineSelect.value);
    drawGrid();
  });

  canvas.addEventListener('click', async (e) => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY - MARGIN_TOP) / CELL_SIZE);
    const linhaNum = y + 1;

    const dentro = linhaNum >= altura && linhaNum <= base;
    const ehExtra = enableExtraLineCheckbox.checked && linhaNum === extraLine;

    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE && (dentro || ehExtra)) {
      const idx = y * SIZE + x;
      gridState[idx] = !gridState[idx];
      drawGrid();
      await updateOutput();
    }
  });
  
  function gridToHex() {
    const bits = gridState.map(c => (c ? '1' : '0')).join('');
    const hex = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = parseInt(bits.slice(i, i + 8), 2);
      hex.push(byte.toString(16).padStart(2, '0'));
    }
    return hex.join('');
  }

  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
  }

  async function sha256(buffer) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hash);
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

  async function privateKeyToWIF(hex, compressed = true) {
    const keyBytes = hexToBytes(hex);
    const prefix = [0x80];
    const suffix = compressed ? [0x01] : [];
    const payload = new Uint8Array([...prefix, ...keyBytes, ...suffix]);
    const hash1 = await sha256(payload);
    const hash2 = await sha256(hash1);
    const checksum = hash2.slice(0, 4);
    const fullPayload = new Uint8Array([...payload, ...checksum]);
    return base58Encode(fullPayload);
  }

  async function updateOutput() {
    const hex = gridToHex();
    const wif = await privateKeyToWIF(hex, true);
    const wifU = await privateKeyToWIF(hex, false);
    appendLineNoScrollPage(hexBox, hex);
    appendLineNoScrollPage(wifBox, wif);
    appendLineNoScrollPage(wifBoxUncompressed, wifU);
  }

  function appendLineNoScrollPage(ta, line) {
    const had = ta.value.length > 0;
    ta.value += (had ? '\n' : '') + line;
    ta.scrollTop = ta.scrollHeight;
  }

  function clearAll() {
    gridState.fill(false);
    stateCounter = 0n;
    drawGrid();
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
  }

  async function randomizeRange() {
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        const linhaNum = y + 1;
        if (!(enableExtraLineCheckbox.checked && extraLine === linhaNum)) {
          gridState[y * SIZE + x] = Math.random() < 0.5;
        }
      }
    }
    drawGrid();
    await updateOutput();
  }

  function getSelectedMode() {
    const radios = document.querySelectorAll('input[name="mode"]');
    for (const r of radios) {
      if (r.checked) return r.value;
    }
    return 'sequential';
  }

  async function step() {
    if (!running) return;
    stateCounter++;

    const linhasValidas = Array.from({ length: SIZE }, (_, i) => i + 1)
      .filter(l => l >= altura && l <= base && l !== extraLine);
    const totalBits = BigInt(linhasValidas.length * SIZE);
    const max = 1n << totalBits;

    if (stateCounter >= max) {
      stop();
      return;
    }

    const bits = stateCounter.toString(2).padStart(Number(totalBits), '0');
    const mode = getSelectedMode();

    if (mode === 'sequential') {
      let bitIndex = 0;
      for (const linha of linhasValidas) {
        for (let x = 0; x < SIZE; x++) {
          const idx = (linha - 1) * SIZE + x;
          gridState[idx] = bits[bitIndex++] === '1';
        }
      }
    } else {
      // Modo vertical
      let bitIndex = 0;
      for (let col = 0; col < SIZE; col++) {
        for (let l = 0; l < linhasValidas.length; l++) {
          const row = linhasValidas[l];
          const idx = (row - 1) * SIZE + col;
          gridState[idx] = bits[bitIndex++] === '1';
        }
      }
    }

    if (randomizeOnStepCheckbox.checked) {
      await randomizeRange();
    } else {
      drawGrid();
      await updateOutput();
    }

    timeoutId = setTimeout(step, parseInt(speedInput.value));
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

  // --- EVENTOS E INICIALIZAÇÃO FINAL ---
  speedInput.addEventListener('input', () => {
    speedLabel.textContent = `${speedInput.value} ms`;
  });

  startBtn.onclick = start;
  stopBtn.onclick = stop;
  clearBtn.onclick = () => { if (!running) clearAll(); };
  randBtn.onclick = () => { if (!running) randomizeRange(); };

  setupCopyAndSaveButtons('hexBox', 'Hex');
  setupCopyAndSaveButtons('wifBox', 'WIF');
  setupCopyAndSaveButtons('wifBoxUncompressed', 'WIF Não Compactado');

  createRangeButtons();
  updateExtraLineOptions();
  drawGrid();
  speedLabel.textContent = `${speedInput.value} ms`;
});
