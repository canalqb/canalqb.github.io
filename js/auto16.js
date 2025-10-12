document.addEventListener('DOMContentLoaded', () => {
  const SIZE = 16;
  const CELL_SIZE = 25;

  const MARGIN_LEFT = 30;   // espaço para números linhas
  const MARGIN_TOP = 30;    // espaço para números colunas
  const MARGIN_RIGHT = 120; // espaço para intervalos potência

  const canvas = document.getElementById('grid');
  canvas.width = SIZE * CELL_SIZE + MARGIN_LEFT + MARGIN_RIGHT;
  canvas.height = SIZE * CELL_SIZE + MARGIN_TOP;

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

  let altura = 1;
  let base = SIZE;
  let gridState = new Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  function getCellSize() {
    return CELL_SIZE;
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

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    // Números colunas no topo (1 a SIZE)
    ctx.textAlign = 'center';
    for (let x = 0; x < SIZE; x++) {
      const posX = MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2;
      const posY = MARGIN_TOP / 2;
      ctx.fillText((x + 1).toString(), posX, posY);
    }

    // Números linhas à esquerda + intervalos potência à direita (de baixo para cima)
    ctx.textAlign = 'right';
    for (let y = 0; y < SIZE; y++) {
      const posY = MARGIN_TOP + y * CELL_SIZE + CELL_SIZE / 2;

      // Número da linha à esquerda (de cima para baixo)
      ctx.fillText((y + 1).toString(), MARGIN_LEFT - 5, posY);

      // Intervalo potência à direita (de baixo para cima)
      ctx.textAlign = 'left';
      const linhasContadas = SIZE - y; // linha invertida para potência
      const powStart = (linhasContadas - 1) * SIZE;
      const powEnd = linhasContadas * SIZE - 1;
      const intervalo = `2^${powStart}..2^${powEnd}`;
      ctx.fillText(intervalo, MARGIN_LEFT + SIZE * CELL_SIZE + 5, posY);

      ctx.textAlign = 'right'; // reset alinhamento para número linha
    }

    // Desenhar células da matriz
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#ffffff';
        ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Desenho do range selecionado (altura até base)
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);
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
          drawGrid();
        }
      };
      baseButtonsDiv.appendChild(bBtn);
    }

    updateRangeButtons();
  }

  function updateRangeButtons() {
    heightButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === altura);
    });
    baseButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === base);
    });

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
    const fullPayload = new Uint8Array([...payload, ...checksum]);

    return base58Encode(fullPayload);
  }

  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function base58Encode(buffer) {
    let intVal = BigInt('0x' + [...buffer].map(b => b.toString(16).padStart(2, '0')).join(''));
    let result = '';
    while (intVal > 0) {
      result = BASE58[intVal % 58n] + result;
      intVal /= 58n;
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

    hexBox.value += hex + '\n';
    wifBox.value += wif + '\n';
    wifBoxUncompressed.value += wifU + '\n';
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
    if (stateCounter >= max) {
      stop();
      return;
    }

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

  canvas.addEventListener('click', e => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX - MARGIN_LEFT) / CELL_SIZE;
    const y = Math.floor((e.clientY - rect.top) * scaleY - MARGIN_TOP) / CELL_SIZE;

    // Math.floor após ajustar (pode ser float antes)
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);

    if (cellX >= 0 && cellX < SIZE && cellY >= 0 && cellY < SIZE) {
      const idx = cellY * SIZE + cellX;
      gridState[idx] = !gridState[idx];
      drawGrid();
      updateOutput();
    }
  });

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', () => !running && clearAll());
  randBtn.addEventListener('click', () => !running && randomizeRange());
  speedInput.addEventListener('input', () => {
    speedLabel.textContent = `${speedInput.value} ms`;
  });

  // Inicialização
  createRangeButtons();
  drawGrid();
  setupCopyAndSaveButtons('hexBox', 'HEX');
  setupCopyAndSaveButtons('wifBox', 'WIF Comprimido');
  setupCopyAndSaveButtons('wifBoxUncompressed', 'WIF Não Comprimido');
});
