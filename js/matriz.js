document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================
     CONFIGURAÇÃO BÁSICA DA MATRIZ
  ===================================================== */

  const SIZE = 16;
  let CELL_SIZE = 12;
  let MARGIN_LEFT = 50;
  let MARGIN_TOP = 50;
  let MARGIN_RIGHT = 100;

  /* =====================================================
     ELEMENTOS DOM DA MATRIZ
  ===================================================== */

  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');

  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');
  const extraButtonsDiv = document.getElementById('extra-buttons');

  /* =====================================================
     ESTADO PRINCIPAL DA MATRIZ
  ===================================================== */

  let altura = 12;
  let base = 16;
  let gridState = Array(SIZE * SIZE).fill(false);

  /* =====================================================
     LINHA EXTRA (ESTADO CORRETO)
  ===================================================== */

  let extraRow = null;
  let extraRowCols = new Set();

  const extraColsContainer = document.createElement('div');
  extraColsContainer.className = 'extra-cols-container';
  extraButtonsDiv.parentNode.appendChild(extraColsContainer);

  /* =====================================================
     CÉLULAS SELECIONADAS MANUALMENTE (CLIQUE)
  ===================================================== */

  let manuallySelectedCells = new Set(); // Armazena células no formato "row,col"

  /* =====================================================
     CONTROLE DE ARRASTO
  ===================================================== */

  let isDragging = false;
  let lastDraggedCell = null;
  let dragMode = null; // 'add' ou 'remove' - definido no primeiro clique

  /* =====================================================
     CONTROLE DE LINHAS DOS TEXTAREAS (MAX 100)
  ===================================================== */

  const MAX_LINES = 100;

  function updateActiveRangeLabel() {
    const label = document.getElementById('activeRangeLabel');
    if (label) {
      if (altura === null || base === null) {
        label.textContent = 'Nenhuma linha selecionada';
      } else {
        label.textContent = `${altura} até ${base}`;
      }
    }
  }

  function showTemporaryRangeIndicator(message) {
    const indicator = document.querySelector('.range-indicator');
    if (indicator) {
      // Remove classes anteriores
      indicator.classList.remove('show', 'auto-hide');

      // Força reflow para reiniciar animação
      void indicator.offsetWidth;

      // Atualiza o texto
      const label = document.getElementById('activeRangeLabel');
      if (label) {
        label.textContent = message;
      }

      // Adiciona classes para animação
      indicator.classList.add('auto-hide');

      // Remove as classes após a animação
      setTimeout(() => {
        indicator.classList.remove('show', 'auto-hide');
        // Restaura o texto original
        if (label) {
          label.textContent = `${altura} até ${base}`;
        }
      }, 2000);
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
        const cellKey = `${y},${x}`;

        // 🔄 VERIFICA SE É CÉLULA SELECIONADA MANUALMENTE
        const isManuallySelected = manuallySelectedCells.has(cellKey);

        // Define a cor baseada no estado
        if (gridState[idx]) {
          // Célula ativa
          ctx.fillStyle = '#48bb78'; // Verde normal
        } else {
          // Célula inativa
          ctx.fillStyle = '#ffffff'; // Branco
        }

        ctx.fillRect(
          MARGIN_LEFT + x * CELL_SIZE,
          MARGIN_TOP + y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );

        // Se é célula selecionada manualmente, adiciona overlay laranja transparente (mesmo da linha extra)
        if (isManuallySelected) {
          ctx.fillStyle = 'rgba(255,165,0,0.45)'; // Mesma cor da linha extra
          ctx.fillRect(
            MARGIN_LEFT + x * CELL_SIZE,
            MARGIN_TOP + y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
          );
        }

        // Borda
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          MARGIN_LEFT + x * CELL_SIZE,
          MARGIN_TOP + y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE
        );
      }
    }

    // Faixa principal (altura/base) - apenas se houver seleção
    if (altura !== null && base !== null) {
      ctx.fillStyle = 'rgba(102,126,234,0.25)';
      ctx.fillRect(
        MARGIN_LEFT,
        MARGIN_TOP + (altura - 1) * CELL_SIZE,
        SIZE * CELL_SIZE,
        (base - altura + 1) * CELL_SIZE
      );
    }

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

    // Botão "Nenhuma" para Altura
    const hNone = document.createElement('button');
    hNone.textContent = '✕';
    hNone.className = 'range-btn range-btn-none';
    hNone.title = 'Nenhuma linha selecionada';
    if (altura === null || altura === 0) hNone.classList.add('active');

    hNone.onclick = () => {
      altura = null;
      base = null;
      validateExtraRow();
      createRangeButtons();
      updateExtraRowButtons();
      updateExtraColsUI();
      drawGrid();
      updateActiveRangeLabel();
      window.dispatchEvent(new CustomEvent('matrixChanged', {
        detail: {
          bits: getActiveCells().length
        }
      }));
    };
    heightButtonsDiv.appendChild(hNone);

    for (let i = 1; i <= SIZE; i++) {
      // Botão de Altura
      const h = document.createElement('button');
      h.textContent = i;
      h.className = 'range-btn';
      if (i === altura) h.classList.add('active'); // ← destaca o botão ativo

      h.onclick = () => {
        altura = i;
        if (base === null || base < altura) base = altura;
        validateExtraRow();
        createRangeButtons(); // ← recria para atualizar .active
        updateExtraRowButtons();
        updateExtraColsUI();
        drawGrid();
        updateActiveRangeLabel();
        window.dispatchEvent(new CustomEvent('matrixChanged', {
          detail: {
            bits: getActiveCells().length
          }
        }));
      };
      heightButtonsDiv.appendChild(h);

      // Botão de Base
      const b = document.createElement('button');
      b.textContent = i;
      b.className = 'range-btn';
      if (i === base) b.classList.add('active'); // ← destaca o botão ativo

      b.onclick = () => {
        base = i;
        if (base < altura) altura = base;
        validateExtraRow();
        createRangeButtons(); // ← recria para atualizar .active
        updateExtraRowButtons();
        updateExtraColsUI();
        drawGrid();
        updateActiveRangeLabel();
        window.dispatchEvent(new CustomEvent('matrixChanged', {
          detail: {
            bits: getActiveCells().length
          }
        }));
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
        window.dispatchEvent(new CustomEvent('matrixChanged', {
          detail: {
            bits: getActiveCells().length
          }
        }));
      };

      group.appendChild(btn);
    }

    extraColsContainer.appendChild(group);
  }

  /* =====================================================
     CÁLCULO DE CÉLULAS ATIVAS (COM LINHA EXTRA)
  ===================================================== */

  function getActiveCells() {
    const cells = [];

    // Adiciona células da faixa principal (altura até base) - apenas se houver seleção
    if (altura !== null && base !== null) {
      for (let y = altura - 1; y < base; y++) {
        for (let x = 0; x < SIZE; x++) {
          cells.push({ row: y, col: x });
        }
      }
    }

    // Adiciona células da linha extra (se existir)
    if (extraRow !== null && extraRowCols.size > 0) {
      const extraRowIndex = extraRow - 1;
      for (const col of extraRowCols) {
        cells.push({ row: extraRowIndex, col: col - 1 });
      }
    }

    // 🚀 ADICIONA CÉLULAS CLICADAS MANUALMENTE SE A OPÇÃO ESTIVER ATIVA
    const toggleOnClick = document.getElementById('toggleOnClick');
    if (toggleOnClick && toggleOnClick.checked) {
      for (const cellKey of manuallySelectedCells) {
        const [r, c] = cellKey.split(',').map(Number);
        if (!cells.some(cell => cell.row === r && cell.col === c)) {
          cells.push({ row: r, col: c });
        }
      }
    }

    return cells;
  }

  function getActiveCellsVertical() {
    const cells = [];

    // Para modo vertical: coluna por coluna - apenas se houver seleção
    if (altura !== null && base !== null) {
      for (let x = 0; x < SIZE; x++) {
        for (let y = altura - 1; y < base; y++) {
          cells.push({ row: y, col: x });
        }
      }
    }

    // Adiciona células da linha extra (se existir)
    if (extraRow !== null && extraRowCols.size > 0) {
      const extraRowIndex = extraRow - 1;
      for (const col of extraRowCols) {
        cells.push({ row: extraRowIndex, col: col - 1 });
      }
    }

    // 🚀 ADICIONA CÉLULAS CLICADAS MANUALMENTE SE A OPÇÃO ESTIVER ATIVA (MODO VERTICAL)
    const toggleOnClick = document.getElementById('toggleOnClick');
    if (toggleOnClick && toggleOnClick.checked) {
      for (const cellKey of manuallySelectedCells) {
        const [r, c] = cellKey.split(',').map(Number);
        if (!cells.some(cell => cell.row === r && cell.col === c)) {
          cells.push({ row: r, col: c });
        }
      }
    }

    return cells;
  }

  /* =====================================================
     CLIQUE E ARRASTO NO CANVAS
  ===================================================== */

  // Função auxiliar para obter coordenadas da célula
  function getCellFromMouse(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const x = Math.floor((canvasX - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor((canvasY - MARGIN_TOP) / CELL_SIZE);

    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return null;

    return { x, y, row: y + 1, col: x + 1, cellKey: `${y},${x}` };
  }

  // Função para alternar seleção de uma célula
  function toggleCellSelection(cell) {
    const { x, y, row, col, cellKey } = cell;

    // Verifica se está no range ativo
    const isInActiveRange = altura !== null && base !== null && (y >= altura - 1 && y < base);

    // Se clicou na linha extra, alterna a coluna
    if (extraRow === row) {
      if (extraRowCols.has(col)) {
        extraRowCols.delete(col);
      } else {
        extraRowCols.add(col);
      }
      updateExtraColsUI();
      drawGrid();
      return true;
    }

    // Se está no range ativo, bloqueia
    if (isInActiveRange) {
      console.log(`⚠️ Célula L${row}xC${col} está no range ativo - seleção manual não permitida`);
      return false;
    }

    // Alterna a seleção manual
    if (manuallySelectedCells.has(cellKey)) {
      manuallySelectedCells.delete(cellKey);
      console.log(`❌ Célula L${row}xC${col} desmarcada`);
    } else {
      manuallySelectedCells.add(cellKey);
      console.log(`✅ Célula L${row}xC${col} selecionada manualmente`);
    }

    drawGrid();
    return true;
  }

  // MouseDown - inicia arrasto
  canvas.addEventListener('mousedown', e => {
    const toggleOnClickCheckbox = document.getElementById('toggleOnClick');
    if (!toggleOnClickCheckbox.checked) return;

    const cell = getCellFromMouse(e);
    if (!cell) return;

    const { cellKey } = cell;

    // Define o modo de arrasto baseado no estado inicial da célula
    // Se estava selecionada → modo 'remove'
    // Se não estava selecionada → modo 'add'
    dragMode = manuallySelectedCells.has(cellKey) ? 'remove' : 'add';

    isDragging = true;
    lastDraggedCell = cellKey;

    // Executa a ação inicial
    toggleCellSelection(cell);

    console.log(`🖱️ Arrasto iniciado em modo: ${dragMode === 'add' ? 'adicionar' : 'remover'}`);
  });

  // MouseMove - arrasta e alterna cada célula individualmente
  canvas.addEventListener('mousemove', e => {
    const toggleOnClickCheckbox = document.getElementById('toggleOnClick');
    if (!toggleOnClickCheckbox.checked || !isDragging) return;

    const cell = getCellFromMouse(e);
    if (!cell || cell.cellKey === lastDraggedCell) return;

    lastDraggedCell = cell.cellKey;

    const { x, y, row, col, cellKey } = cell;
    const isInActiveRange = altura !== null && base !== null && (y >= altura - 1 && y < base);

    // Se está no range ativo ou linha extra, ignora
    if (isInActiveRange || extraRow === row) return;

    // Alterna a célula: se marcada → desmarca, se desmarcada → marca
    if (manuallySelectedCells.has(cellKey)) {
      manuallySelectedCells.delete(cellKey);
      console.log(`❌ L${row}xC${col} desmarcada por arrasto`);
    } else {
      manuallySelectedCells.add(cellKey);
      console.log(`✅ L${row}xC${col} marcada por arrasto`);
    }

    drawGrid();
  });

  // MouseUp - finaliza arrasto
  canvas.addEventListener('mouseup', e => {
    if (isDragging) {
      isDragging = false;
      lastDraggedCell = null;
      dragMode = null;
      console.log(`📊 Células selecionadas manualmente: ${manuallySelectedCells.size}`);
    }
  });

  // MouseLeave - cancela arrasto se sair do canvas
  canvas.addEventListener('mouseleave', e => {
    if (isDragging) {
      isDragging = false;
      lastDraggedCell = null;
      dragMode = null;
    }
  });

  /* =====================================================
     EVENTOS DA MATRIZ
  ===================================================== */

  window.addEventListener('resize', () => {
    adjustCanvas();
    drawGrid();
  });

  /* =====================================================
     FUNÇÕES DE RESET DA MATRIZ
  ===================================================== */

  function clearGrid() {
    // 🔄 LIMPA APENAS O GRIDSTATE (células verdes)
    // PRESERVA: altura, base, linha extra, células selecionadas manualmente
    gridState.fill(false);
    drawGrid();
    console.log('🧹 Grid limpo - preservando seleções do usuário');
  }

  function resetMatrix() {
    // ⚠️ RESET COMPLETO - Limpa TUDO e volta ao padrão
    gridState.fill(false);
    extraRow = null;
    extraRowCols.clear();
    manuallySelectedCells.clear();
    altura = 12;
    base = 16;
    createRangeButtons();
    updateExtraRowButtons();
    updateExtraColsUI();
    drawGrid();
    updateActiveRangeLabel();
    console.log('🔄 Matriz resetada completamente');
  }

  function randomizeMatrix() {
    const activeCells = getActiveCells();

    // Limpa o grid
    gridState.fill(false);

    // Randomiza apenas as células ativas
    for (const cell of activeCells) {
      const idx = cell.row * SIZE + cell.col;
      gridState[idx] = Math.random() < 0.5;
    }

    drawGrid();
  }

  /* =====================================================
     FUNÇÕES DE CONFIGURAÇÃO DE PRESET
  ===================================================== */

  function applyPresetToMatrix(bitCount) {
    const n = Number(bitCount);
    if (!Number.isFinite(n) || n < 1 || n > 256) return;

    const fullRows = Math.floor(n / SIZE);
    const remainder = n % SIZE;

    base = SIZE;
    altura = fullRows > 0 ? (SIZE - fullRows + 1) : SIZE;

    extraRow = null;
    extraRowCols.clear();
    if (remainder > 0) {
      const candidate = altura - 1;
      if (candidate >= 1) {
        extraRow = candidate;
        for (let i = 0; i < remainder; i++) {
          extraRowCols.add(SIZE - i);
        }
      }
    }

    createRangeButtons();
    updateExtraRowButtons();
    updateExtraColsUI();
    drawGrid();
    updateActiveRangeLabel();
  }

  /* =====================================================
     API PÚBLICA DA MATRIZ
  ===================================================== */

  window.matrizAPI = {
    // Estado
    getGridState: () => [...gridState],
    setGridState: (newState) => {
      if (newState.length === SIZE * SIZE) {
        gridState = [...newState];
        drawGrid();
      }
    },

    // Configuração
    getRange: () => ({ altura, base }),
    setRange: (newAltura, newBase) => {
      altura = newAltura;
      base = newBase;
      validateExtraRow();
      createRangeButtons();
      updateExtraRowButtons();
      updateExtraColsUI();
      drawGrid();
      updateActiveRangeLabel();
    },

    // Linha extra
    getExtraRow: () => ({ row: extraRow, cols: [...extraRowCols] }),
    setExtraRow: (row, cols) => {
      extraRow = row;
      extraRowCols = new Set(cols);
      validateExtraRow();
      createRangeButtons();
      updateExtraRowButtons();
      updateExtraColsUI();
      drawGrid();
      updateActiveRangeLabel();
    },

    // Células selecionadas (para clique alternado)
    getSelectedCells: () => {
      const selectedCells = [];

      // Adiciona células da linha extra se existir
      if (extraRow !== null) {
        for (const col of extraRowCols) {
          // Converte para 0-based: extraRow é 1-based, col é 1-based
          selectedCells.push({ row: extraRow - 1, col: col - 1 });
        }
      }

      // Adiciona células que foram clicadas manualmente (fora do range)
      for (const cellKey of manuallySelectedCells) {
        const [rowStr, colStr] = cellKey.split(',');
        const row = parseInt(rowStr);
        const col = parseInt(colStr);

        // Verifica se já não está na lista (evita duplicatas)
        const alreadyExists = selectedCells.some(cell =>
          cell.row === row && cell.col === col
        );

        if (!alreadyExists) {
          selectedCells.push({ row, col });
        }
      }

      console.log(`📊 getSelectedCells retornando ${selectedCells.length} células:`,
        selectedCells.map(c => `L${c.row + 1}xC${c.col + 1}`));

      return selectedCells;
    },
    // Células ativas
    getActiveCells: getActiveCells,
    getActiveCellsVertical: getActiveCellsVertical,

    // Ações
    clear: clearGrid,        // Limpa apenas gridState, preserva seleções
    reset: resetMatrix,      // Reset completo
    randomize: randomizeMatrix,
    draw: drawGrid,

    // Presets
    applyPreset: applyPresetToMatrix,

    // Utilitários
    updateActiveRangeLabel,
    showTemporaryRangeIndicator,
    limitTextareaLines,
    scrollToBottom
  };

  // Inicialização no carregamento da página (com defer, o DOM já está pronto)
  createRangeButtons();
  updateExtraRowButtons();
  updateExtraColsUI();
  drawGrid();
  updateActiveRangeLabel();
  console.log('✅ Matriz e botões carregados com sucesso');

});