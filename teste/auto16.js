document.addEventListener('DOMContentLoaded', () => {
  const SIZE = 16;
  const CELL_SIZE = 25;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;
  const MARGIN_RIGHT = 130;

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

  let altura = 12;
  let base = 16;
  let extraLine = 0; // 0 = desativada
  let gridState = Array(SIZE * SIZE).fill(false);
  let extraLineSelection = Array(SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
  canvas.height = MARGIN_TOP + SIZE * CELL_SIZE;

  // Atualiza rótulo
  function updateRangeLabel() {
    const label = document.getElementById('activeRangeLabel');
    const texto = extraLine > 0 ? `${altura} até ${base} (linha extra: ${extraLine})` : `${altura} até ${base} (sem linha extra)`;
    if (label) label.textContent = texto;
  }

  // Desenha a grade
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';

    // Cabeçalho das colunas
    ctx.textAlign = 'center';
    for (let x = 0; x < SIZE; x++) {
      const px = MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2;
      ctx.fillText((x + 1).toString(), px, MARGIN_TOP / 2);
    }

    // Números das linhas e expoentes
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

    // Células
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = (extraLine && y + 1 === extraLine)
          ? (extraLineSelection[x] ? '#f6ad55' : '#fff5e6')
          : (gridState[idx] ? '#48bb78' : '#fff');
        ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destaques
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    // Linha extra
    if (extraLine > 0) {
      const yExtra = MARGIN_TOP + (extraLine - 1) * CELL_SIZE;
      ctx.fillStyle = 'rgba(244, 180, 0, 0.3)';
      ctx.fillRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.strokeRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);
    }
  }

  // Criação dos botões
  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';
    extraLineButtonsDiv.innerHTML = '';

    for (let i = 1; i <= SIZE; i++) {
      heightButtonsDiv.appendChild(makeRangeBtn(i, 'altura'));
      baseButtonsDiv.appendChild(makeRangeBtn(i, 'base'));
    }

    const noLineBtn = makeRangeBtn(0, 'extraLine');
    noLineBtn.textContent = 'Nenhuma';
    extraLineButtonsDiv.appendChild(noLineBtn);

    for (let i = 1; i < altura; i++) {
      extraLineButtonsDiv.appendChild(makeRangeBtn(i, 'extraLine'));
    }

    updateRangeButtons();
  }

  function makeRangeBtn(value, type) {
    const btn = document.createElement('button');
    btn.textContent = value;
    btn.className = 'range-btn';
    btn.addEventListener('click', () => {
      if (running) return;
      if (type === 'altura') {
        altura = value;
        if (base < altura) base = altura;
        if (extraLine >= altura && extraLine <= base) extraLine = 0;
      } else if (type === 'base') {
        base = value;
        if (base < altura) altura = base;
        if (extraLine >= altura && extraLine <= base) extraLine = 0;
      } else if (type === 'extraLine') {
        if (value === 0) {
          extraLine = 0;
          extraLineSelection.fill(false);
        } else if (value >= altura && value <= base) {
          alert('Linha extra deve estar fora do intervalo.');
          return;
        } else {
          extraLine = value;
        }
      }
      createRangeButtons();
      drawGrid();
    });
    return btn;
  }

  function updateRangeButtons() {
    [...heightButtonsDiv.children].forEach(btn => btn.classList.toggle('active', Number(btn.textContent) === altura));
    [...baseButtonsDiv.children].forEach(btn => btn.classList.toggle('active', Number(btn.textContent) === base));
    [...extraLineButtonsDiv.children].forEach(btn => btn.classList.toggle('active', Number(btn.textContent) === extraLine));
    updateRangeLabel();
  }

  function gridToHex() {
    return gridState.map(c => c ? '1' : '0')
      .join('')
      .match(/.{1,8}/g)
      .map(b => parseInt(b, 2).toString(16).padStart(2, '0'))
      .join('');
  }

  async function privateKeyToWIF(hex, compressed = true) {
    const key = Uint8Array.from(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
    const prefix = [0x80];
    const suffix = compressed ? [0x01] : [];
    const payload = new Uint8Array([...prefix, ...key, ...suffix]);
    const hash1 = await crypto.subtle.digest('SHA-256', payload);
    const hash2 = await crypto.subtle.digest('SHA-256', hash1);
    const checksum = new Uint8Array(hash2).slice(0, 4);
    const full = new Uint8Array([...payload, ...checksum]);

    let intVal = BigInt('0x' + [...full].map(x => x.toString(16).padStart(2, '0')).join(''));
    const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    while (intVal > 0n) {
      result = BASE58[Number(intVal % 58n)] + result;
      intVal /= 58n;
    }
    for (let i = 0; i < full.length && full[i] === 0; i++) result = '1' + result;
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

  function appendLine(box, text) {
    const had = box.value.length > 0;
    box.value += (had ? '\n' : '') + text;
    box.scrollTop = box.scrollHeight;
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

  async function step() {
    if (!running) return;

    const selectedCols = extraLineSelection.filter(Boolean).length;
    if (extraLine && selectedCols === 0) {
      stop();
      return;
    }

    const rows = base - altura + 1;
    const totalBits = BigInt(rows * selectedCols);
    const max = 1n << totalBits;

    if (stateCounter >= max) {
      stop();
      return;
    }

    const bits = stateCounter.toString(2).padStart(Number(totalBits), '0');
    let bitIndex = 0;

    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (!extraLineSelection[x]) continue;
        gridState[y * SIZE + x] = bits[bitIndex++] === '1';
      }
    }

    stateCounter++;
    if (randomizeOnStepCheckbox.checked) await randomizeRange();
    else {
      drawGrid();
      await updateOutput();
    }

    timeoutId = setTimeout(step, parseInt(speedInput.value));
  }

  function start() {
    if (running) return;
    stateCounter = 0n;
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
    const x = Math.floor((e.clientX - rect.left - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top - MARGIN_TOP) / CELL_SIZE);
    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
      if (extraLine > 0 && y + 1 === extraLine) {
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
  clearBtn.onclick = () => { if (!running) clearAll(); };
  randBtn.onclick = () => { if (!running) randomizeRange(); };

  createRangeButtons();
  drawGrid();
  speedLabel.textContent = `${speedInput.value} ms`;
});
