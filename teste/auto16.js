document.addEventListener('DOMContentLoaded', () => {
  // Configurações do grid e canvas
  const SIZE = 16;
  const CELL_SIZE = 25;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;
  const MARGIN_RIGHT = 130;

  // Elementos DOM
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

  // Variável para linha extra (fora do intervalo altura-base)
  let extraLine = null; // null = nenhuma linha extra selecionada
  let extraLineCells = Array(SIZE).fill(false); // estado das células da linha extra

  // Estado inicial
  let altura = 12;
  let base = 16;
  let gridState = Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  // Define tamanho do canvas
  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
  canvas.height = MARGIN_TOP + SIZE * CELL_SIZE;

  // --- FUNÇÕES ---

  function updateRangeLabel() {
    const label = document.getElementById('activeRangeLabel');
    if (label) label.textContent = `${altura} até ${base}`;
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
        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#fff';
        ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destaque faixa selecionada
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    // Desenhar a linha extra, se existir
    if (extraLine !== null) {
      const yExtra = MARGIN_TOP + (extraLine - 1) * CELL_SIZE;
      ctx.fillStyle = 'rgba(234, 102, 102, 0.2)';
      ctx.fillRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);

      ctx.strokeStyle = '#ea6666';
      ctx.lineWidth = 3;
      ctx.strokeRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);

      // Desenhar células da linha extra (com estado extraLineCells)
      for (let x = 0; x < SIZE; x++) {
        ctx.fillStyle = extraLineCells[x] ? '#f56565' : '#fff';
        ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE, yExtra, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(MARGIN_LEFT + x * CELL_SIZE, yExtra, CELL_SIZE, CELL_SIZE);
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

  // Atualiza as opções do seletor de linha extra (fora do intervalo altura-base)
  function updateExtraLineOptions() {
    const select = document.getElementById('extraLineSelector');
    if (!select) return;
    select.innerHTML = '<option value="">Nenhuma</option>';
    for (let i = 1; i <= SIZE; i++) {
      if (i < altura || i > base) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        select.appendChild(option);
      }
    }
    // Reset se extraLine não válido
    if (extraLine !== null && (extraLine < altura || extraLine > base) === false) {
      extraLine = null;
      extraLineCells.fill(false);
      select.value = '';
    } else {
      select.value = extraLine || '';
    }
  }

  function gridToHex() {
    const bitsArray = [];

    // faixa altura..base
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        bitsArray.push(gridState[y * SIZE + x] ? '1' : '0');
      }
    }

    // linha extra (se existir)
    if (extraLine !== null) {
      for (let x = 0; x < SIZE; x++) {
        bitsArray.push(extraLineCells[x] ? '1' : '0');
      }
    }

    const bits = bitsArray.join('');

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

    const keyWithPrefixSuffix = new Uint8Array(prefix.length + key.length + suffix.length);
    keyWithPrefixSuffix.set(prefix, 0);
    keyWithPrefixSuffix.set(key, prefix.length);
    keyWithPrefixSuffix.set(suffix, prefix.length + key.length);

    const hash1 = await sha256(keyWithPrefixSuffix.buffer);
    const hash2 = await sha256(hash1.buffer);

    const checksum = hash2.slice(0, 4);
    const finalKey = new Uint8Array(keyWithPrefixSuffix.length + 4);
    finalKey.set(keyWithPrefixSuffix, 0);
    finalKey.set(checksum, keyWithPrefixSuffix.length);

    return base58Encode(finalKey);
  }

  // Base58 encoding (Bitcoin style)
  function base58Encode(buffer) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let x = BigInt('0x' + [...buffer].map(b => b.toString(16).padStart(2, '0')).join(''));
    let result = '';
    while (x > 0) {
      const mod = x % 58n;
      x /= 58n;
      result = alphabet[Number(mod)] + result;
    }
    // Encode leading zeros
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      result = '1' + result;
    }
    return result;
  }

  async function updateOutput() {
    const hex = gridToHex();
    hexBox.textContent = hex;

    if (hex.length === 64) { // 256 bits hex
      const wifCompressed = await privateKeyToWIF(hex, true);
      const wifUncompressed = await privateKeyToWIF(hex, false);
      wifBox.textContent = wifCompressed;
      wifBoxUncompressed.textContent = wifUncompressed;
    } else {
      wifBox.textContent = '';
      wifBoxUncompressed.textContent = '';
    }
  }

  // Alterna o estado da célula clicada no grid
  function toggleCell(x, y) {
    const idx = y * SIZE + x;
    gridState[idx] = !gridState[idx];
  }

  // Alterna o estado da célula na linha extra
  function toggleExtraCell(x) {
    extraLineCells[x] = !extraLineCells[x];
  }

  // Função de passo que atualiza o estado de acordo com o modo
  async function step() {
    if (running === false) return;

    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'sequential';
    const randomizeOnStep = randomizeOnStepCheckbox.checked;

    // Concatena bits do grid selecionado + linha extra
    const bitsArray = [];

    // Faixa altura..base
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        bitsArray.push(gridState[y * SIZE + x] ? '1' : '0');
      }
    }

    // Linha extra (se existir)
    if (extraLine !== null) {
      for (let x = 0; x < SIZE; x++) {
        bitsArray.push(extraLineCells[x] ? '1' : '0');
      }
    }

    const bits = bitsArray.join('');
    stateCounter++;

    if (mode === 'sequential') {
      // Atualiza bits para o próximo valor do stateCounter
      const newBits = stateCounter.toString(2).padStart(bits.length, '0').slice(-bits.length);

      for (let i = 0; i < newBits.length; i++) {
        const lineIndex = Math.floor(i / SIZE);
        const x = i % SIZE;

        if (lineIndex < (base - altura + 1)) {
          const y = altura - 1 + lineIndex;
          gridState[y * SIZE + x] = newBits[i] === '1';
        } else {
          // Linha extra
          if (extraLine !== null) {
            const extraIndex = lineIndex - (base - altura + 1);
            if (extraIndex === 0) {
              extraLineCells[x] = newBits[i] === '1';
            }
          }
        }
      }
    } else if (mode === 'vertical') {
      // Varre colunas da direita para a esquerda, linhas de baixo para cima
      let bitIndex = 0;

      for (let col = SIZE - 1; col >= 0; col--) {
        for (let row = base - 1; row >= altura - 1; row--) {
          if (bitIndex >= bits.length) break;
          gridState[row * SIZE + col] = bits[bitIndex] === '1';
          bitIndex++;
        }
      }

      // Linha extra
      if (extraLine !== null) {
        const yExtra = extraLine - 1;
        for (let col = SIZE - 1; col >= 0; col--) {
          if (bitIndex >= bits.length) break;
          extraLineCells[col] = bits[bitIndex] === '1';
          bitIndex++;
        }
      }
    } else if (mode === 'randomize') {
      // Randomiza a faixa e linha extra (se existir)
      for (let y = altura - 1; y < base; y++) {
        for (let x = 0; x < SIZE; x++) {
          gridState[y * SIZE + x] = Math.random() < 0.5;
        }
      }
      if (extraLine !== null) {
        for (let x = 0; x < SIZE; x++) {
          extraLineCells[x] = Math.random() < 0.5;
        }
      }
    }

    if (randomizeOnStep) {
      // Se marcado, randomiza após o passo
      for (let y = altura - 1; y < base; y++) {
        for (let x = 0; x < SIZE; x++) {
          gridState[y * SIZE + x] = Math.random() < 0.5;
        }
      }
      if (extraLine !== null) {
        for (let x = 0; x < SIZE; x++) {
          extraLineCells[x] = Math.random() < 0.5;
        }
      }
    }

    drawGrid();
    await updateOutput();

    timeoutId = setTimeout(step, 1000 / speedInput.value);
  }

  // Limpa o grid e reseta contadores
  function clearGrid() {
    gridState.fill(false);
    extraLineCells.fill(false);
    stateCounter = 0n;
    drawGrid();
    updateOutput();
  }

  // Randomiza o intervalo e linha extra
  async function randomizeRange() {
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    if (extraLine !== null) {
      for (let x = 0; x < SIZE; x++) {
        extraLineCells[x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    await updateOutput();
  }

  // --- EVENTOS ---

  canvas.addEventListener('click', e => {
    if (running && toggleOnClickCheckbox.checked === false) return;

    const rect = canvas.getBoundingClientRect();
    const xPix = e.clientX - rect.left - MARGIN_LEFT;
    const yPix = e.clientY - rect.top - MARGIN_TOP;

    if (xPix < 0 || yPix < 0) return;

    const x = Math.floor(xPix / CELL_SIZE);
    const y = Math.floor(yPix / CELL_SIZE);

    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;

    // Se clicou na linha extra, alterna células na extraLineCells
    if (extraLine !== null && y === (extraLine - 1)) {
      toggleExtraCell(x);
      drawGrid();
      updateOutput();
      return;
    }

    // Se clicou dentro da faixa normal
    if (y >= (altura - 1) && y <= (base - 1)) {
      toggleCell(x, y);
      drawGrid();
      updateOutput();
    }
  });

  startBtn.onclick = () => {
    if (!running) {
      running = true;
      stateCounter = 0n;
      step();
    }
  };

  stopBtn.onclick = () => {
    running = false;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  clearBtn.onclick = () => {
    if (!running) {
      clearGrid();
    }
  };

  randBtn.onclick = () => {
    if (!running) {
      randomizeRange();
    }
  };

  speedInput.oninput = () => {
    speedLabel.textContent = speedInput.value;
  };

  // Criar botões de intervalo
  createRangeButtons();

  // Criar seletor linha extra no container
  const extraLineContainer = document.createElement('div');
  extraLineContainer.id = 'extraLineSelectorContainer';
  extraLineContainer.style.margin = '10px 0';
  extraLineContainer.innerHTML = `
    <label for="extraLineSelector">Linha Extra (fora da faixa altura-base): </label>
    <select id="extraLineSelector">
      <option value="">Nenhuma</option>
    </select>
  `;
  document.getElementById('rangeSelectors').appendChild(extraLineContainer);

  updateExtraLineOptions();

  const extraLineSelector = document.getElementById('extraLineSelector');
  extraLineSelector.addEventListener('change', () => {
    if (running) {
      alert('Pare a execução para mudar a linha extra.');
      extraLineSelector.value = extraLine || '';
      return;
    }
    const val = extraLineSelector.value;
    if (val === '') {
      extraLine = null;
      extraLineCells.fill(false);
    } else {
      extraLine = parseInt(val);
      extraLineCells.fill(false);
    }
    drawGrid();
  });

  // Inicializar grid e saída
  drawGrid();
  updateOutput();
});
