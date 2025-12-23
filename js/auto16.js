document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================
     CONFIGURAÇÃO BÁSICA
  ===================================================== */

  const SIZE = 16;
  let CELL_SIZE = 12;
  let MARGIN_LEFT = 50;
  let MARGIN_TOP = 50;
  let MARGIN_RIGHT = 100;

  /* =====================================================
     ELEMENTOS DOM
  ===================================================== */

  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');

  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');

  const toggleOnClickCheckbox = document.getElementById('toggleOnClick');

  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');
  const extraButtonsDiv = document.getElementById('extra-buttons');

  /* =====================================================
     ESTADO PRINCIPAL
  ===================================================== */

  let altura = 12;
  let base = 16;

  let gridState = Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  /* =====================================================
     LINHA EXTRA (ESTADO CORRETO)
  ===================================================== */

  let extraRow = null;
  let extraRowCols = new Set();

  const extraColsContainer = document.createElement('div');
  extraColsContainer.className = 'extra-cols-container';
  extraButtonsDiv.parentNode.appendChild(extraColsContainer);

  /* =====================================================
     CONTROLE DE LINHAS DOS TEXTAREAS (MAX 100)
  ===================================================== */

  const MAX_LINES = 100;

	function updateActiveRangeLabel() {
	  const label = document.getElementById('activeRangeLabel');
	  if (label) {
		label.textContent = `${altura} até ${base}`;
	  }
	}


  function limitTextareaLines(textarea) {
    const lines = textarea.value.split('\n');
    if (lines.length > MAX_LINES) {
      // Remove as linhas mais antigas (mantém as últimas 100)
      textarea.value = lines.slice(lines.length - MAX_LINES).join('\n');
    }
  }

  function scrollToBottom(textarea) {
    // Usa requestAnimationFrame para garantir que o scroll aconteça após a atualização do DOM
    requestAnimationFrame(() => {
      textarea.scrollTop = textarea.scrollHeight;
    });
  }

  /* =====================================================
     CANVAS RESPONSIVO
  ===================================================== */

  function adjustCanvas() {
    const containerWidth = canvas.parentElement.clientWidth - 30;
    const usable = containerWidth - MARGIN_LEFT - MARGIN_RIGHT;
    CELL_SIZE = Math.max(6, Math.floor(usable / SIZE));

    if (window.innerWidth < 768) {
      MARGIN_LEFT = 60;
      MARGIN_RIGHT = 120;
    } else if (window.innerWidth < 992) {
      MARGIN_LEFT = 80;
      MARGIN_RIGHT = 160;
    } else {
      MARGIN_LEFT = 300;
      MARGIN_RIGHT = 300;
    }

    canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
    canvas.height = MARGIN_TOP + SIZE * CELL_SIZE;
  }

  adjustCanvas();

  /* =====================================================
     DESENHO DO GRID
  ===================================================== */

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#555';

    // Colunas
    ctx.textAlign = 'center';
    for (let x = 0; x < SIZE; x++) {
      ctx.fillText(x + 1, MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2, MARGIN_TOP / 2);
    }

    // Linhas
    ctx.textAlign = 'right';
    for (let y = 0; y < SIZE; y++) {
      ctx.fillText(y + 1, MARGIN_LEFT - 6, MARGIN_TOP + y * CELL_SIZE + CELL_SIZE / 2);
    }

    // Células
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#ffffff';
        ctx.fillRect(
          MARGIN_LEFT + x * CELL_SIZE,
          MARGIN_TOP + y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(
          MARGIN_LEFT + x * CELL_SIZE,
          MARGIN_TOP + y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    // Faixa principal (altura/base)
    ctx.fillStyle = 'rgba(102,126,234,0.25)';
    ctx.fillRect(
      MARGIN_LEFT,
      MARGIN_TOP + (altura - 1) * CELL_SIZE,
      SIZE * CELL_SIZE,
      (base - altura + 1) * CELL_SIZE
    );

    // Linha extra (colunas selecionadas)
    if (extraRow !== null && extraRowCols.size > 0) {
      ctx.fillStyle = 'rgba(255,165,0,0.45)';
      for (const col of extraRowCols) {
        ctx.fillRect(
          MARGIN_LEFT + (col - 1) * CELL_SIZE,
          MARGIN_TOP + (extraRow - 1) * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }
  }

  /* =====================================================
     BOTÕES ALTURA / BASE
  ===================================================== */

function createRangeButtons() {
  heightButtonsDiv.innerHTML = '';
  baseButtonsDiv.innerHTML = '';

  for (let i = 1; i <= SIZE; i++) {
    // Botão de Altura
    const h = document.createElement('button');
    h.textContent = i;
    h.className = 'range-btn';
    if (i === altura) h.classList.add('active'); // ← destaca o botão ativo

    h.onclick = () => {
      if (running) return;
      altura = i;
      if (base < altura) base = altura;
      validateExtraRow();
      createRangeButtons(); // ← recria para atualizar .active
      updateExtraRowButtons();
      updateExtraColsUI();
      drawGrid();
      updateActiveRangeLabel();
    };
    heightButtonsDiv.appendChild(h);

    // Botão de Base
    const b = document.createElement('button');
    b.textContent = i;
    b.className = 'range-btn';
    if (i === base) b.classList.add('active'); // ← destaca o botão ativo

    b.onclick = () => {
      if (running) return;
      base = i;
      if (base < altura) altura = base;
      validateExtraRow();
      createRangeButtons(); // ← recria para atualizar .active
      updateExtraRowButtons();
      updateExtraColsUI();
      drawGrid();
      updateActiveRangeLabel();
    };
    baseButtonsDiv.appendChild(b);
  }
}

  /* =====================================================
     LINHA EXTRA — BOTÕES DINÂMICOS (BUG FIX)
  ===================================================== */

  function validateExtraRow() {
    if (extraRow !== null && extraRow >= altura && extraRow <= base) {
      extraRow = null;
      extraRowCols.clear();
    }
  }

  function updateExtraRowButtons() {
    extraButtonsDiv.innerHTML = '';

    for (let i = 1; i <= SIZE; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = 'range-btn';

      const inside = i >= altura && i <= base;
      btn.disabled = inside;

      if (extraRow === i) btn.classList.add('active');

      btn.onclick = () => {
        if (extraRow === i) {
          extraRow = null;
          extraRowCols.clear();
        } else {
          extraRow = i;
          extraRowCols.clear();
        }
        updateExtraRowButtons();
        updateExtraColsUI();
        drawGrid();
      };

      extraButtonsDiv.appendChild(btn);
    }
  }

  /* =====================================================
     COLUNAS DA LINHA EXTRA
  ===================================================== */

  function updateExtraColsUI() {
    extraColsContainer.innerHTML = '';
    if (extraRow === null) return;

    const title = document.createElement('h4');
    title.textContent = '🎯 Selecionar Colunas da Linha Extra';
    extraColsContainer.appendChild(title);

    const group = document.createElement('div');
    group.className = 'button-grid';

    for (let c = 1; c <= SIZE; c++) {
      const btn = document.createElement('button');
      btn.textContent = c;

      if (extraRowCols.has(c)) btn.classList.add('active');

      btn.onclick = () => {
        if (extraRowCols.has(c)) {
          extraRowCols.delete(c);
        } else {
          extraRowCols.add(c);
        }
        updateExtraColsUI();
        drawGrid();
      };

      group.appendChild(btn);
    }

    extraColsContainer.appendChild(group);
  }

  /* =====================================================
     CRIPTO / OUTPUT
  ===================================================== */

  function gridToHex() {
    return gridState
      .map(b => (b ? '1' : '0'))
      .join('')
      .match(/.{1,8}/g)
      .map(b => parseInt(b, 2).toString(16).padStart(2, '0'))
      .join('');
  }

  async function sha256(buf) {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  }

  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
  }

  async function toWIF(hex, compressed) {
    const key = hexToBytes(hex);
    const payload = new Uint8Array([0x80, ...key, ...(compressed ? [0x01] : [])]);
    const h1 = await sha256(payload);
    const h2 = await sha256(h1);
    const full = new Uint8Array([...payload, ...h2.slice(0, 4)]);
    return base58(full);
  }

  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function base58(buf) {
    let x = BigInt('0x' + [...buf].map(b => b.toString(16).padStart(2, '0')).join(''));
    let out = '';
    while (x > 0n) {
      out = BASE58[Number(x % 58n)] + out;
      x /= 58n;
    }
    return out;
  }

  async function updateOutput() {
    const hex = gridToHex();
    
    // Adiciona nova linha
    hexBox.value += hex + '\n';
    wifBox.value += await toWIF(hex, true) + '\n';
    wifBoxUncompressed.value += await toWIF(hex, false) + '\n';
    
    // Limita o número de linhas (máximo 1000)
    limitTextareaLines(hexBox);
    limitTextareaLines(wifBox);
    limitTextareaLines(wifBoxUncompressed);
    
    // Faz scroll automático sem dar foco
    scrollToBottom(hexBox);
    scrollToBottom(wifBox);
    scrollToBottom(wifBoxUncompressed);
  }

  /* =====================================================
     CÁLCULO DE CÉLULAS ATIVAS (COM LINHA EXTRA)
  ===================================================== */

  function getActiveCells() {
    const cells = [];
    
    // Adiciona células da faixa principal (altura até base)
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        cells.push({ row: y, col: x });
      }
    }
    
    // Adiciona células da linha extra (se existir)
    if (extraRow !== null && extraRowCols.size > 0) {
      const extraRowIndex = extraRow - 1;
      for (const col of extraRowCols) {
        cells.push({ row: extraRowIndex, col: col - 1 });
      }
    }
    
    return cells;
  }

  /* =====================================================
     SEQUÊNCIA (CORRIGIDA COM LINHA EXTRA)
  ===================================================== */

  async function step() {
    if (!running) return;

    stateCounter++;
    
    // Obtém todas as células ativas (faixa principal + linha extra)
    const activeCells = getActiveCells();
    const totalCells = activeCells.length;
    const total = 1n << BigInt(totalCells);

    if (stateCounter >= total) return stop();

    // Gera o padrão binário
    const bits = stateCounter.toString(2).padStart(totalCells, '0');
    
    // Limpa o grid
    gridState.fill(false);
    
    // Obtém o modo de geração
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const randomizeOnStep = document.getElementById('randomizeStatesOnStep').checked;
    
    if (randomizeOnStep) {
      // Modo aleatório: distribui bits aleatoriamente
      for (let i = 0; i < totalCells; i++) {
        const cell = activeCells[i];
        const idx = cell.row * SIZE + cell.col;
        gridState[idx] = Math.random() < 0.5;
      }
    } else if (mode === 'vertical') {
      // Modo vertical: preenche coluna por coluna
      const sortedCells = [...activeCells].sort((a, b) => {
        if (a.col !== b.col) return a.col - b.col;
        return a.row - b.row;
      });
      
      for (let i = 0; i < totalCells; i++) {
        const cell = sortedCells[i];
        const idx = cell.row * SIZE + cell.col;
        gridState[idx] = bits[i] === '1';
      }
    } else {
      // Modo horizontal (padrão): preenche linha por linha
      const sortedCells = [...activeCells].sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });
      
      for (let i = 0; i < totalCells; i++) {
        const cell = sortedCells[i];
        const idx = cell.row * SIZE + cell.col;
        gridState[idx] = bits[i] === '1';
      }
    }

    drawGrid();
    await updateOutput();
    timeoutId = setTimeout(step, Number(speedInput.value));
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

  /* =====================================================
     CLIQUE NO CANVAS
  ===================================================== */

  canvas.addEventListener('click', async e => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top - MARGIN_TOP) / CELL_SIZE);

    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;

    const row = y + 1;
    const col = x + 1;

    if (extraRow === row) {
      if (extraRowCols.has(col)) {
        extraRowCols.delete(col);
      } else {
        extraRowCols.add(col);
      }
      updateExtraColsUI();
      drawGrid();
      return;
    }

    gridState[y * SIZE + x] = !gridState[y * SIZE + x];
    drawGrid();
    await updateOutput();
  });

  /* =====================================================
     EVENTOS
  ===================================================== */

  startBtn.onclick = start;
  stopBtn.onclick = stop;

clearBtn.onclick = () => {
  if (running) return;
  gridState.fill(false);
  extraRow = null;
  extraRowCols.clear();
  altura = 12;
  base = 16;
  stateCounter = 0n;
  hexBox.value = '';
  wifBox.value = '';
  wifBoxUncompressed.value = '';
  createRangeButtons(); // ← atualiza botões de altura/base
  updateExtraRowButtons();
  updateExtraColsUI();
  drawGrid();
  updateActiveRangeLabel();
};

  randBtn.onclick = async () => {
    if (running) return;
    
    // Obtém todas as células ativas
    const activeCells = getActiveCells();
    
    // Limpa o grid
    gridState.fill(false);
    
    // Randomiza apenas as células ativas
    for (const cell of activeCells) {
      const idx = cell.row * SIZE + cell.col;
      gridState[idx] = Math.random() < 0.5;
    }
    
    drawGrid();
    await updateOutput();
  };

  window.addEventListener('resize', () => {
    adjustCanvas();
    drawGrid();
  });

  speedInput.addEventListener('input', () => {
    speedLabel.textContent = `${speedInput.value} ms`;
  });

  /* =====================================================
     INIT
  ===================================================== */

  speedLabel.textContent = `${speedInput.value} ms`;
  createRangeButtons();
  updateExtraRowButtons();
  drawGrid();
  updateActiveRangeLabel(); // ← ADICIONE AQUI

});