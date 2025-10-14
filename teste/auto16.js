document.addEventListener('DOMContentLoaded', () => {
  // Configurações do grid e canvas
  const SIZE = 16;
  const CELL_SIZE = 25;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;
  // const MARGIN_RIGHT = 130;
  const MARGIN_RIGHT = 0;

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

  // Estado inicial
  let altura = 13;
  let base = 16;
  let gridState = Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;
  let extraLineEnabled = false;
  let extraLine = null;
  let extraLineCells = Array(SIZE).fill(false);

  // Define tamanho do canvas
  // canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE;

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
      // Removido texto das potências de 2
      // const linhasContadas = SIZE - y;
      // const powStart = (linhasContadas - 1) * SIZE;
      // const powEnd = linhasContadas * SIZE - 1;
      // ctx.fillText(`2^${powStart}..2^${powEnd}`, MARGIN_LEFT + SIZE * CELL_SIZE + 10, py);
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

    // Destaque linha extra se habilitada
    if (extraLineEnabled && extraLine !== null) {
      ctx.fillStyle = 'rgba(244, 114, 182, 0.2)';
      const yExtra = MARGIN_TOP + (extraLine - 1) * CELL_SIZE;
      ctx.fillRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.strokeRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);

      // Destaque células selecionadas da linha extra
      for (let x = 0; x < SIZE; x++) {
        if (extraLineCells[x]) {
          ctx.fillStyle = 'rgba(244, 114, 182, 0.4)';
          ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE + 2, yExtra + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        }
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
    [...heightButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === altura);
    });
    [...baseButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === base);
    });
    updateRangeLabel();
    updateExtraLineOptions();
  }

  function getAvailableExtraLines() {
    const lines = [];
    for (let i = 1; i <= SIZE; i++) {
      if (i < altura || i > base) {
        lines.push(i);
      }
    }
    return lines;
  }

  function updateExtraLineOptions() {
    const extraLineSelect = document.getElementById('extraLineSelect');
    if (!extraLineSelect) return;

    const availableLines = getAvailableExtraLines();
    extraLineSelect.innerHTML = '<option value="">Selecione uma linha</option>';

    availableLines.forEach(line => {
      const option = document.createElement('option');
      option.value = line;
      option.textContent = `Linha ${line}`;
      if (extraLine === line) option.selected = true;
      extraLineSelect.appendChild(option);
    });

    if (extraLine !== null && !availableLines.includes(extraLine)) {
      extraLine = null;
      extraLineEnabled = false;
      document.getElementById('enableExtraLine').checked = false;
      updateExtraLineUI();
    }
  }

  function updateExtraLineUI() {
    const cellsContainer = document.getElementById('extraLineCells');
    const extraLineSelect = document.getElementById('extraLineSelect');

    if (extraLineEnabled) {
      extraLineSelect.disabled = false;
    } else {
      extraLineSelect.disabled = true;
    }

    if (extraLineEnabled && extraLine !== null) {
      cellsContainer.style.display = 'block';
      updateExtraLineCellsUI();
    } else {
      cellsContainer.style.display = 'none';
    }

    drawGrid();
  }

  function updateExtraLineCellsUI() {
    const cellsContainer = document.getElementById('extraLineCells');
    cellsContainer.innerHTML = '<div class="section-title" style="font-size: 0.85rem; margin-bottom: 0.5rem;">Selecione as células da linha extra:</div>';

    const gridDiv = document.createElement('div');
    gridDiv.className = 'extra-line-cells-grid';

    for (let i = 0; i < SIZE; i++) {
      const cellBtn = document.createElement('button');
      cellBtn.textContent = i + 1;
      cellBtn.className = 'extra-cell-btn';
      cellBtn.classList.toggle('active', extraLineCells[i]);
      cellBtn.onclick = () => {
        if (!running) {
          extraLineCells[i] = !extraLineCells[i];
          updateExtraLineCellsUI();
          drawGrid();
        }
      };
      gridDiv.appendChild(cellBtn);
    }

    cellsContainer.appendChild(gridDiv);
  }

  function gridToHex() {
    const bits = gridState.map(c => (c ? '1' : '0')).join('');
    const bigIntValue = BigInt('0b' + bits);
    return bigIntValue.toString(16).padStart(SIZE * SIZE / 4, '0');
  }

  function updateOutput() {
    const hex = gridToHex();
    hexBox.value = hex.toUpperCase();

    // Placeholder para geração WIF — implementar lógica se necessário
    wifBox.value = 'Não implementado';
    wifBoxUncompressed.value = 'Não implementado';
  }

  function randomizeGrid() {
    if (running) return;
    for (let i = 0; i < gridState.length; i++) {
      gridState[i] = Math.random() < 0.5;
    }
    drawGrid();
    updateOutput();
  }

  async function randomizeRange() {
    for (let y = altura - 1; y <= base - 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    if (extraLineEnabled && extraLine !== null) {
      for (let x = 0; x < SIZE; x++) {
        if (extraLineCells[x]) gridState[(extraLine - 1) * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    await updateOutput();
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

  async function step() {
    const rowsCount = base - altura + 1;
    const activeCellsInExtra = extraLineEnabled && extraLine !== null ? extraLineCells.filter(c => c).length : 0;
    const totalCells = rowsCount * SIZE + activeCellsInExtra;
    const max = 1n << BigInt(totalCells);

    if (stateCounter >= max) {
      stop();
      return;
    }

    const bits = stateCounter.toString(2).padStart(totalCells, '0');
    const mode = getSelectedMode();

    // Limpa faixa principal
    for (let y = altura - 1; y <= base - 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = false;
      }
    }

    // Limpa linha extra
    if (extraLineEnabled && extraLine !== null) {
      for (let x = 0; x < SIZE; x++) {
        gridState[(extraLine - 1) * SIZE + x] = false;
      }
    }

    if (mode === 'sequential') {
      let bitIndex = 0;
      for (let y = altura - 1; y <= base - 1; y++) {
        for (let x = 0; x < SIZE; x++) {
          gridState[y * SIZE + x] = bits[bitIndex] === '1';
          bitIndex++;
        }
      }
      if (extraLineEnabled && extraLine !== null) {
        for (let x = 0; x < SIZE; x++) {
          if (extraLineCells[x] && bitIndex < bits.length) {
            gridState[(extraLine - 1) * SIZE + x] = bits[bitIndex] === '1';
            bitIndex++;
          }
        }
      }
    } else if (mode === 'vertical') {
      let bitIndex = 0;
      for (let col = SIZE - 1; col >= 0; col--) {
        for (let row = base - 1; row >= altura - 1; row--) {
          const idx = row * SIZE + col;
          if (bitIndex >= bits.length) break;
          gridState[idx] = bits[bitIndex] === '1';
          bitIndex++;
        }
        if (bitIndex >= bits.length) break;
      }
      if (extraLineEnabled && extraLine !== null && bitIndex < bits.length) {
        for (let x = SIZE - 1; x >= 0; x--) {
          if (extraLineCells[x] && bitIndex < bits.length) {
            gridState[(extraLine - 1) * SIZE + x] = bits[bitIndex] === '1';
            bitIndex++;
          }
        }
      }
    }

    if (randomizeOnStepCheckbox.checked) {
      await randomizeRange();
    } else {
      drawGrid();
      await updateOutput();
    }

    stateCounter++;
    timeoutId = setTimeout(step, parseInt(speedInput.value, 10));
  }

  function getSelectedMode() {
    const modeRadios = document.getElementsByName('mode');
    for (const radio of modeRadios) {
      if (radio.checked) return radio.value;
    }
    return 'sequential';
  }

  // --- EVENTOS ---

  canvas.addEventListener('click', e => { 
    if (!toggleOnClickCheckbox.checked || running) return;
  
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
  
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
  
    const x = Math.floor((mouseX - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor((mouseY - MARGIN_TOP) / CELL_SIZE);
  
    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;
  
    gridState[y * SIZE + x] = !gridState[y * SIZE + x];
    drawGrid();
    updateOutput();
  });


  startBtn.onclick = () => {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    stateCounter = 0n;
    step();
  };

  stopBtn.onclick = () => {
    stop();
  };

  clearBtn.onclick = () => {
    if (running) return;
    gridState.fill(false);
    drawGrid();
    updateOutput();
  };

  randBtn.onclick = () => {
    randomizeGrid();
  };

  speedInput.oninput = () => {
    speedLabel.textContent = `${speedInput.value} ms`;
    if (running) {
      clearTimeout(timeoutId);
      step();
    }
  };

  toggleOnClickCheckbox.onchange = () => {
    drawGrid();
  };

  randomizeOnStepCheckbox.onchange = () => {
    // Nenhuma ação imediata necessária
  };

  // Extra line controls
  const enableExtraLineCheckbox = document.getElementById('enableExtraLine');
  const extraLineSelect = document.getElementById('extraLineSelect');

  enableExtraLineCheckbox.onchange = () => {
    extraLineEnabled = enableExtraLineCheckbox.checked;
    if (!extraLineEnabled) {
      extraLine = null;
      extraLineCells.fill(false);
    }
    updateExtraLineUI();
  };

  extraLineSelect.onchange = () => {
    extraLine = parseInt(extraLineSelect.value) || null;
    extraLineCells.fill(false);
    updateExtraLineUI();
  };

  // --- INICIALIZAÇÃO ---

  createRangeButtons();
  updateRangeLabel();
  drawGrid();
  updateOutput();
  updateExtraLineUI();
});
