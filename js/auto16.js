document.addEventListener('DOMContentLoaded', () => {
  // ------------------------------
  // Constantes de configuração
  const SIZE = 16;
  const CELL_SIZE = 25;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;
  const MARGIN_RIGHT = 130;

  // ------------------------------
  // Elementos da interface
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

  // ------------------------------
  // Estado do aplicativo
  let altura = 1;
  let base = SIZE;
  let gridState = Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  // ------------------------------
  // Canvas
  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
  canvas.height = MARGIN_TOP + SIZE * CELL_SIZE;

  // ------------------------------
  // Funções auxiliares

  function appendLine(ta, line) {
    ta.value += (ta.value ? '\n' : '') + line;
    ta.scrollTop = ta.scrollHeight;
  }

  function setupCopyAndSaveButtons(id, label) {
    const textarea = document.getElementById(id);
    const container = textarea.parentElement;

    const group = document.createElement('div');
    group.style.display = 'flex';
    group.style.gap = '10px';
    group.style.marginBottom = '10px';

    const copy = document.createElement('button');
    copy.className = 'btn btn-sm btn-outline-secondary';
    copy.textContent = `📋 Copiar ${label}`;
    copy.onclick = () => navigator.clipboard.writeText(textarea.value)
      .then(() => alert(`${label} copiado!`))
      .catch(() => alert(`Erro ao copiar ${label}`));

    const save = document.createElement('button');
    save.className = 'btn btn-sm btn-outline-primary';
    save.textContent = `💾 Salvar ${label}`;
    save.onclick = () => {
      const blob = new Blob([textarea.value], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    group.appendChild(copy);
    group.appendChild(save);
    container.insertBefore(group, textarea);
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    // Colunas no topo
    ctx.textAlign = 'center';
    for (let x = 0; x < SIZE; x++) {
      const posX = MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2;
      ctx.fillText(`${x + 1}`, posX, MARGIN_TOP / 2);
    }

    // Linhas à esquerda e intervalo à direita
    for (let y = 0; y < SIZE; y++) {
      const posY = MARGIN_TOP + y * CELL_SIZE + CELL_SIZE / 2;
      ctx.textAlign = 'right';
      ctx.fillText(`${y + 1}`, MARGIN_LEFT - 5, posY);

      ctx.textAlign = 'left';
      const powStart = (SIZE - 1 - y) * SIZE;
      const powEnd = (SIZE - y) * SIZE - 1;
      ctx.fillText(`2^${powStart}..2^${powEnd}`, MARGIN_LEFT + SIZE * CELL_SIZE + 10, posY);
    }

    // Células
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        const px = MARGIN_LEFT + x * CELL_SIZE;
        const py = MARGIN_TOP + y * CELL_SIZE;

        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#ffffff';
        ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destaque da faixa
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;

    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);
  }

  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';

    for (let i = 1; i <= SIZE; i++) {
      const makeBtn = (parent, setFn, value) => {
        const btn = document.createElement('button');
        btn.textContent = value;
        btn.className = 'range-btn';
        btn.onclick = () => {
          if (!running) {
            setFn(value);
            updateRangeButtons();
            drawGrid();
          }
        };
        parent.appendChild(btn);
      };

      makeBtn(heightButtonsDiv, v => { altura = v; if (base < v) base = v; }, i);
      makeBtn(baseButtonsDiv, v => { base = v; if (v < altura) altura = v; }, i);
    }

    updateRangeButtons();
  }

  function updateRangeButtons() {
    const setActive = (container, value) => {
      container.querySelectorAll('button').forEach(btn =>
        btn.classList.toggle('active', parseInt(btn.textContent) === value));
    };

    setActive(heightButtonsDiv, altura);
    setActive(baseButtonsDiv, base);

    document.getElementById('activeRangeLabel').textContent = `${altura} até ${base}`;
  }

  function gridToHex() {
    const bits = gridState.map(cell => (cell ? '1' : '0')).join('');
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
    return Uint8Array.from(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  }

  async function privateKeyToWIF(hex, compressed = true) {
    const key = hexToBytes(hex);
    const prefix = [0x80];
    const suffix = compressed ? [0x01] : [];
    const payload = new Uint8Array([...prefix, ...key, ...suffix]);

    const hash1 = await sha256(payload);
    const hash2 = await sha256(hash1);
    const checksum = hash2.slice(0, 4);

    const full = new Uint8Array([...payload, ...checksum]);
    return base58Encode(full);
  }

  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function base58Encode(buffer) {
    let num = BigInt('0x' + Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(''));
    let result = '';

    while (num > 0n) {
      result = BASE58[num % 58n] + result;
      num /= 58n;
    }

    for (let b of buffer) {
      if (b === 0) result = '1' + result;
      else break;
    }

    return result;
  }

  async function updateOutput() {
    const hex = gridToHex();
    const wif = await privateKeyToWIF(hex, true);
    const wifU = await privateKeyToWIF(hex, false);

    appendLine(hexBox, hex);
    appendLine(wifBox, wif);
    appendLine(wifBoxUncompressed, wifU);
  }

  function clearAll() {
    gridState.fill(false);
    stateCounter = 0n;
    drawGrid();
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
  }

  function randomizeRange() {
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateOutput();
  }

  function step() {
    if (!running) return;

    stateCounter++;
    const max = 1n << BigInt((base - altura + 1) * SIZE);
    if (stateCounter >= max) return stop();

    const bits = stateCounter.toString(2).padStart((base - altura + 1) * SIZE, '0');

    for (let i = 0; i < bits.length; i++) {
      const y = altura - 1 + Math.floor(i / SIZE);
      const x = i % SIZE;
      gridState[y * SIZE + x] = bits[i] === '1';
    }

    if (randomizeOnStepCheckbox.checked) {
      randomizeRange();
    } else {
      drawGrid();
      updateOutput();
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

  // ------------------------------
  // Eventos

  canvas.addEventListener('click', async (e) => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * canvas.width / rect.width - MARGIN_LEFT) / CELL_SIZE;
    const y = Math.floor((e.clientY - rect.top) * canvas.height / rect.height - MARGIN_TOP) / CELL_SIZE;

    const cx = Math.floor(x);
    const cy = Math.floor(y);

    if (cx >= 0 && cx < SIZE && cy >= 0 && cy < SIZE) {
      const idx = cy * SIZE + cx;
      gridState[idx] = !gridState[idx];
      drawGrid();
      await updateOutput();
    }
  });

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', () => { if (!running) clearAll(); });
  randBtn.addEventListener('click', () => { if (!running) randomizeRange(); });
  speedInput.addEventListener('input', () => {
    speedLabel.textContent = `${speedInput.value} ms`;
  });

  // ------------------------------
  // Inicialização
  createRangeButtons();
  drawGrid();

  setupCopyAndSaveButtons('hexBox', 'HEX');
  setupCopyAndSaveButtons('wifBox', 'WIF Comprimido');
  setupCopyAndSaveButtons('wifBoxUncompressed', 'WIF Não Comprimido');
});
