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

  // Novos elementos para linha extra
  const enableExtraLineCheckbox = document.getElementById('enableExtraLine');
  const extraLineSelect = document.getElementById('extraLineSelect');
  const extraLineColsContainer = document.getElementById('extraLineColsContainer');

  // Estado inicial
  let altura = 12;
  let base = 16;
  let extraLine = null;  // linha extra selecionada ou null
  let extraLineColumns = new Set(); // colunas selecionadas na linha extra
  let gridState = Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  // Configurações iniciais do canvas
  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
  canvas.height = MARGIN_TOP + SIZE * CELL_SIZE;

  // Inicialmente desabilitar select e esconder container de colunas da linha extra
  extraLineSelect.disabled = true;
  extraLineColsContainer.style.display = 'none';

  // --- FUNÇÕES AUXILIARES ---

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

    // Números das linhas e intervalos laterais
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

    // Destaque da faixa selecionada (altura até base)
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    // Destaque linha extra selecionada (só fora da faixa)
    if (enableExtraLineCheckbox.checked && extraLine !== null) {
      if (extraLine < altura || extraLine > base) {
        const yPos = MARGIN_TOP + (extraLine - 1) * CELL_SIZE;

        // Destaque linha inteira em cor suave
        ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
        ctx.fillRect(MARGIN_LEFT, yPos, SIZE * CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.strokeRect(MARGIN_LEFT, yPos, SIZE * CELL_SIZE, CELL_SIZE);

        // Destaque nas colunas selecionadas na linha extra
        extraLineColumns.forEach(col => {
          const xPos = MARGIN_LEFT + (col - 1) * CELL_SIZE;
          ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
          ctx.fillRect(xPos, yPos, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = '#ec4899';
          ctx.lineWidth = 2;
          ctx.strokeRect(xPos, yPos, CELL_SIZE, CELL_SIZE);
        });
      }
    }
  }

  // Continua...
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
    Array.from(heightButtonsDiv.children).forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent, 10) === altura);
    });
    Array.from(baseButtonsDiv.children).forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent, 10) === base);
    });
    updateRangeLabel();
  }

  // Atualiza as opções da linha extra (select e colunas)
  function updateExtraLineOptions() {
    if (enableExtraLineCheckbox.checked) {
      extraLineSelect.disabled = false;
      extraLineColsContainer.style.display = 'block';

      // Preenche select com números de linhas, excluindo a faixa altura-base
      extraLineSelect.innerHTML = '<option value="">-- selecione a linha --</option>';
      for (let i = 1; i <= SIZE; i++) {
        if (i < altura || i > base) {
          const opt = document.createElement('option');
          opt.value = i;
          opt.textContent = i;
          extraLineSelect.appendChild(opt);
        }
      }
      // Seleciona valor atual se existir e ainda válido
      if (extraLine && (extraLine < altura || extraLine > base)) {
        extraLineSelect.value = extraLine;
      } else {
        extraLine = null;
        extraLineSelect.value = '';
        extraLineColumns.clear();
      }

      updateExtraLineColsUI();
    } else {
      extraLineSelect.disabled = true;
      extraLineColsContainer.style.display = 'none';
      extraLine = null;
      extraLineColumns.clear();
    }
  }

  // Cria e atualiza checkboxes para colunas na linha extra
  function updateExtraLineColsUI() {
    extraLineColsContainer.innerHTML = '';
    if (!extraLine) return;

    const label = document.createElement('div');
    label.textContent = `Selecione colunas para incluir na linha extra ${extraLine}:`;
    label.style.marginBottom = '6px';
    extraLineColsContainer.appendChild(label);

    for (let col = 1; col <= SIZE; col++) {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `extraLineCol_${col}`;
      checkbox.value = col;
      checkbox.checked = extraLineColumns.has(col);
      checkbox.style.marginRight = '4px';

      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          extraLineColumns.add(col);
        } else {
          extraLineColumns.delete(col);
        }
        drawGrid();
      });

      const cbLabel = document.createElement('label');
      cbLabel.htmlFor = checkbox.id;
      cbLabel.textContent = col;
      cbLabel.style.marginRight = '10px';

      extraLineColsContainer.appendChild(checkbox);
      extraLineColsContainer.appendChild(cbLabel);
    }
  }

  // Event listeners para linha extra

  enableExtraLineCheckbox.addEventListener('change', () => {
    updateExtraLineOptions();
    drawGrid();
  });

  extraLineSelect.addEventListener('change', () => {
    const val = extraLineSelect.value;
    extraLine = val ? parseInt(val, 10) : null;
    extraLineColumns.clear(); // Limpa seleção de colunas ao trocar linha extra
    updateExtraLineColsUI();
    drawGrid();
  });

  // Continua...
  // Guarda colunas selecionadas para a linha extra
  const extraLineColumns = new Set();

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

    // Números das linhas e intervalos laterais
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

    // Destaque da faixa selecionada (altura até base)
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    // Destaque da linha extra, apenas colunas selecionadas
    if (enableExtraLineCheckbox.checked && extraLine !== null && extraLineColumns.size > 0) {
      const extraY = MARGIN_TOP + (extraLine - 1) * CELL_SIZE;
      extraLineColumns.forEach(col => {
        const colIdx = col - 1;
        ctx.fillStyle = 'rgba(236, 72, 153, 0.15)';
        ctx.fillRect(MARGIN_LEFT + colIdx * CELL_SIZE, extraY, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.strokeRect(MARGIN_LEFT + colIdx * CELL_SIZE, extraY, CELL_SIZE, CELL_SIZE);
      });
    }
  }

  async function step() {
    if (!running) return;
    stateCounter++;

    const rowsCount = base - altura + 1;
    const totalCells = BigInt(rowsCount * SIZE + (extraLineColumns.size));

    const max = 1n << totalCells;

    if (stateCounter >= max) {
      stop();
      return;
    }

    const bits = stateCounter.toString(2).padStart(Number(totalCells), '0');
    const mode = getSelectedMode();

    // Preenche faixa principal
    let bitIndex = 0;

    if (mode === 'sequential') {
      // Linha por linha, da faixa
      for (let y = altura - 1; y < base; y++) {
        for (let x = 0; x < SIZE; x++) {
          const idx = y * SIZE + x;
          gridState[idx] = (bits[bitIndex] === '1');
          bitIndex++;
        }
      }
      // Agora preenche a linha extra, só colunas selecionadas
      if (enableExtraLineCheckbox.checked && extraLine !== null && extraLineColumns.size > 0) {
        const y = extraLine - 1;
        extraLineColumns.forEach(col => {
          const idx = y * SIZE + (col - 1);
          gridState[idx] = (bits[bitIndex] === '1');
          bitIndex++;
        });
      }
    } else {
      // vertical mode: coluna por coluna na faixa principal
      for (let col = SIZE - 1; col >= 0; col--) {
        for (let row = base - 1; row >= altura - 1; row--) {
          const idx = row * SIZE + col;
          gridState[idx] = (bits[bitIndex] === '1');
          bitIndex++;
        }
      }
      // colunas da linha extra
      if (enableExtraLineCheckbox.checked && extraLine !== null && extraLineColumns.size > 0) {
        const y = extraLine - 1;
        extraLineColumns.forEach(col => {
          const idx = y * SIZE + (col - 1);
          gridState[idx] = (bits[bitIndex] === '1');
          bitIndex++;
        });
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

  canvas.addEventListener('click', async (e) => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY - MARGIN_TOP) / CELL_SIZE);

    const linhaNum = y + 1;
    const dentro = (linhaNum >= altura && linhaNum <= base);
    const ehExtra = (enableExtraLineCheckbox.checked && extraLine === linhaNum && extraLineColumns.has(x + 1));

    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE && (dentro || ehExtra)) {
      const idx = y * SIZE + x;
      gridState[idx] = !gridState[idx];
      drawGrid();
      await updateOutput();
    }
  });
