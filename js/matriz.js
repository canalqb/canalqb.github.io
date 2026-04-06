/**
 * @file matriz.js
 * @description Gerenciamento da interface visual da matriz 16x16 (256 bits).
 * @module MatrizAPI
 */
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
  let ctrlSelectedCells = new Set(); // Armazena células selecionadas com Ctrl (verde permanente)

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

  function addTextareaHistory(textarea, newText) {
    if (!textarea) return;
    const currentVal = textarea.value.trim();
    if (!currentVal) {
      textarea.value = newText;
      return;
    }
    const lines = [newText, ...currentVal.split('\n')];
    if (lines.length > MAX_LINES) {
      textarea.value = lines.slice(0, MAX_LINES).join('\n');
    } else {
      textarea.value = lines.join('\n');
    }
  }

  function limitTextareaLines(textarea) {
    const lines = textarea.value.split('\n');
    if (lines.length > MAX_LINES) {
      textarea.value = lines.slice(0, MAX_LINES).join('\n');
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

        // 🔄 VERIFICA SE É CÉLULA SELECIONADA
        const isManuallySelected = manuallySelectedCells.has(cellKey);
        const isCtrlSelected = ctrlSelectedCells.has(cellKey);

        // Define a cor baseada no estado
        if (gridState[idx] || isCtrlSelected) {
          // Célula ativa OU selecionada com Ctrl
          ctx.fillStyle = '#48bb78'; // Verde normal
        } else if (isManuallySelected) {
          // Célula selecionada manualmente (amarelo)
          ctx.fillStyle = '#ffd93d'; // Amarelo
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

    // Adiciona seleções manuais e com Ctrl sempre
    for (const cellKey of manuallySelectedCells) {
      const [r, c] = cellKey.split(',').map(Number);
      if (!cells.some(cell => cell.row === r && cell.col === c)) {
        cells.push({ row: r, col: c });
      }
    }
    for (const cellKey of ctrlSelectedCells) {
      const [r, c] = cellKey.split(',').map(Number);
      if (!cells.some(cell => cell.row === r && cell.col === c)) {
        cells.push({ row: r, col: c });
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

    // Adiciona seleções manuais e com Ctrl sempre (modo vertical)
    for (const cellKey of manuallySelectedCells) {
      const [r, c] = cellKey.split(',').map(Number);
      if (!cells.some(cell => cell.row === r && cell.col === c)) {
        cells.push({ row: r, col: c });
      }
    }
    for (const cellKey of ctrlSelectedCells) {
      const [r, c] = cellKey.split(',').map(Number);
      if (!cells.some(cell => cell.row === r && cell.col === c)) {
        cells.push({ row: r, col: c });
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
    
    // 🔄 ATUALIZA LABEL HEX
    updateHexLabel();
    drawGrid();
    return true;
  }

  // MouseDown - inicia arrasto ou seleção com Ctrl
  canvas.addEventListener('mousedown', e => {
    console.log('🔍 Debug - e.ctrlKey:', e.ctrlKey);
    console.log('🔍 Debug - e.metaKey:', e.metaKey);

    const cell = getCellFromMouse(e);
    if (!cell) return;

    const { cellKey, row, col } = cell;
    console.log('🔍 Debug - cell:', { cellKey, row, col });

    // 🔄 VERIFICA SE É CLIQUE EM CÉLULA CTRL SELECIONADA
    if (ctrlSelectedCells.has(cellKey)) {
      // Remove da lista Ctrl (desliga célula verde)
      ctrlSelectedCells.delete(cellKey);
      console.log(`🔄 Clique em célula Ctrl: L${row}xC${col} DESLIGADA (voltou ao normal)`);
      drawGrid();
      updateHexLabel(); // 🔄 ATUALIZA HEX AO DESLIGAR CTRL
      return; // Não faz mais nada
    }

    // 🎯 VERIFICA SE CTRL ESTÁ PRESSIONADO
    if (e.ctrlKey || e.metaKey) {
      console.log('🎯 Ctrl/Meta detectado - modo ADICIONAR');
      // Modo Ctrl+Clique: sempre ADICIONA célula (não alterna)
      if (!ctrlSelectedCells.has(cellKey)) {
        ctrlSelectedCells.add(cellKey);
        console.log(`🎯 Ctrl+Clique: Célula L${row}xC${col} ADICIONADA (verde)`);
        console.log('🎯 Total células Ctrl selecionadas:', ctrlSelectedCells.size);
        drawGrid();
        updateHexLabel(); // 🔄 ATUALIZA HEX AO SELECIONAR COM CTRL
      } else {
        console.log(`⚠️ Célula L${row}xC${col} já estava selecionada com Ctrl`);
      }
      return; // Não inicia arrasto com Ctrl
    }

    // Define o modo de arrasto baseado no estado inicial da célula
    // Se estava selecionada → modo 'remove'
    // Se não estava selecionada → modo 'add'
    dragMode = manuallySelectedCells.has(cellKey) ? 'remove' : 'add';

    isDragging = true;
    lastDraggedCell = cellKey;

    // Executa a ação inicial
    toggleCellSelection(cell);

    console.log(` Arrasto iniciado em modo: ${dragMode === 'add' ? 'adicionar' : 'remover'}`);
  });

  // MouseMove - arrasta e alterna cada célula individualmente
  canvas.addEventListener('mousemove', e => {
    if (!isDragging) return;

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
      console.log(` L${row}xC${col} desmarcada por arrasto`);
    } else {
      manuallySelectedCells.add(cellKey);
      console.log(` L${row}xC${col} marcada por arrasto`);
    }

    // ATUALIZA HEX DURANTE O ARRASTO
    updateHexLabel();
    drawGrid();
  });

  // MouseUp - finaliza arrasto
  canvas.addEventListener('mouseup', e => {
    if (isDragging) {
      isDragging = false;
      lastDraggedCell = null;
      dragMode = null;
      console.log(` Células selecionadas manualmente: ${manuallySelectedCells.size}`);
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
    // ⚠️ RESET COMPLETO - Limpa TUDO
    gridState.fill(false);
    extraRow = null;
    extraRowCols.clear();
    manuallySelectedCells.clear();
    ctrlSelectedCells.clear(); // 🎯 Limpa células Ctrl+também
    altura = null;
    base = null;
    createRangeButtons();
    updateExtraRowButtons();
    updateExtraColsUI();
    drawGrid();
    updateActiveRangeLabel();
    updateHexLabel(); // 🔄 ATUALIZA LABEL HEX AO LIMPAR
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
     FUNÇÃO PARA ATUALIZAR LABEL HEX
     ===================================================== */
  
  function updateHexLabel() {
    const hexValueElement = document.getElementById('hexValue');
    if (!hexValueElement) return;
    
    // 🎯 CORREÇÃO: Coleta APENAS células selecionadas manualmente + Ctrl
    // NÃO inclui células do range ativo (faixa principal)
    const allSelectedCells = new Set();
    
    // Adiciona células selecionadas manualmente
    for (const cellKey of manuallySelectedCells) {
      allSelectedCells.add(cellKey);
    }
    
    // Adiciona células selecionadas com Ctrl
    for (const cellKey of ctrlSelectedCells) {
      allSelectedCells.add(cellKey);
    }
    
    // Converte para array e ordena
    const sortedCells = Array.from(allSelectedCells)
      .map(key => {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
      })
      .sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });
    
    // Calcula o valor HEX
    let hexValue = 0n;
    
    for (const cell of sortedCells) {
      // 🎯 TESTE: L16xC16 deve ser bit 0 = valor 1
      // Vamos mapear diretamente: L16xC16 → bit 0, L16xC15 → bit 1, etc.
      const row = cell.row; // já está 0-based (15 para L16)
      const col = cell.col; // já está 0-based (15 para C16)
      
      // 🔄 NOVA FÓRMULA: Inverter completamente
      // L16xC16 (row=15, col=15) → bit 0
      // L16xC15 (row=15, col=14) → bit 1
      // L15xC16 (row=14, col=15) → bit 16
      const bitPosition = (15 - row) * 16 + (15 - col);
      
      // 🔍 DEBUG: Mostrar valores intermediários
      console.log(`🔍 DEBUG: Célula L${cell.row + 1}xC${cell.col + 1} → row=${row}, col=${col}, bitPosition=${bitPosition}`);
      
      if (bitPosition >= 0 && bitPosition < 256) {
        hexValue |= (1n << BigInt(bitPosition));
        console.log(`🔍 DEBUG: Adicionando bit ${bitPosition} = ${(1n << BigInt(bitPosition)).toString(16)}`);
      }
    }
    
    // 🎯 FORMATAÇÃO SEM 0x E SEM ZEROS À ESQUERDA
    let hexString = hexValue.toString(16).toUpperCase();
    
    // Se não tem células selecionadas, mostra "0"
    if (sortedCells.length === 0) {
      hexString = "0";
    }
    
    // Atualiza o elemento
    hexValueElement.textContent = hexString;
    
    console.log(`🔢 HEX atualizado: ${hexString} (${sortedCells.length} células)`);
    console.log(`📍 Posições:`, sortedCells.map(c => `L${c.row + 1}xC${c.col + 1}`));
  }

  /* =====================================================
     API PÚBLICA DA MATRIZ
  ===================================================== */

  window.matrizAPI = {
    // Estado
    getGridState: () => [...gridState],
    getFullGridState: () => {
      const fullGrid = [...gridState];
      // Adiciona células selecionadas manualmente
      for (const cellKey of manuallySelectedCells) {
        const [r, c] = cellKey.split(',').map(Number);
        fullGrid[r * SIZE + c] = true;
      }
      // Adiciona células selecionadas com Ctrl
      for (const cellKey of ctrlSelectedCells) {
        const [r, c] = cellKey.split(',').map(Number);
        fullGrid[r * SIZE + c] = true;
      }
      return fullGrid;
    },
    setGridState: (newState) => {
      if (newState.length === SIZE * SIZE) {
        gridState = [...newState];
        drawGrid();
      }
    },
    setFromHex: (hexStr) => {
      if (!hexStr || typeof hexStr !== 'string') return;
      const clean = hexStr.replace(/^0x/i, '').trim();
      let val;
      try { val = BigInt('0x' + clean); } catch { return; }
      const newGrid = Array(256).fill(false);
      for (let bit = 0; bit < 256; bit++) {
        const one = ((val >> BigInt(bit)) & 1n) === 1n;
        if (one) {
          const row = 15 - Math.floor(bit / 16);
          const col = 15 - (bit % 16);
          newGrid[row * 16 + col] = true;
        }
      }
      gridState = newGrid;
      drawGrid();
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

      // 🎯 ADICIONA CÉLULAS SELECIONADAS COM CTRL TAMBÉM
      for (const cellKey of ctrlSelectedCells) {
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
    addTextareaHistory,
    scrollToBottom,
    getInitHexFromCard,
    getEndHexFromCard
  };

  // Inicialização no carregamento da página (com defer, o DOM já está pronto)
  createRangeButtons();
  updateExtraRowButtons();
  updateExtraColsUI();
  drawGrid();
  updateActiveRangeLabel();
  console.log(' Matriz e botões carregados com sucesso');

  function getInitHexFromCard(mode) {
    const scope = document.getElementById('database-status-section') || document;
    
    // Mapeia modos de aleatorização para seus respectivos cards de dados
    if (mode === 'randomize_h' || mode === 'randomize') mode = 'horizontal';
    if (mode === 'randomize_v') mode = 'vertical';

    if (mode === 'horizontal') {
      const block = scope.querySelector('.progress-block.horizontal');
      if (!block) return null;
      const ranges = block.querySelectorAll('.range');
      for (const r of ranges) {
        const lbl = r.querySelector('.label')?.textContent?.trim()?.toLowerCase();
        if (lbl && (lbl.startsWith('ini') || lbl.includes('início'))) {
          const v = r.querySelector('.value')?.textContent?.trim();
          if (v) return v;
        }
      }
      return null;
    }
    if (mode === 'vertical') {
      let block = scope.querySelector('#vertical-progress-block') || scope.querySelector('.progress-block.vertical');
      if (!block) return null;
      const ranges = block.querySelectorAll('.range');
      for (const r of ranges) {
        const lbl = r.querySelector('.label')?.textContent?.trim()?.toLowerCase();
        if (lbl && (lbl.startsWith('ini') || lbl.includes('início'))) {
          const v = r.querySelector('.value')?.textContent?.trim();
          if (v) return v;
        }
      }
      return null;
    }
    return null;
  }

  function getEndHexFromCard(mode) {
    const scope = document.getElementById('database-status-section') || document;

    // Mapeia modos de aleatorização para seus respectivos cards de dados
    if (mode === 'randomize_h' || mode === 'randomize') mode = 'horizontal';
    if (mode === 'randomize_v') mode = 'vertical';

    if (mode === 'horizontal') {
      const block = scope.querySelector('.progress-block.horizontal');
      if (!block) return null;
      const ranges = block.querySelectorAll('.range');
      for (const r of ranges) {
        const lbl = r.querySelector('.label')?.textContent?.trim()?.toLowerCase();
        if (lbl && (lbl.startsWith('fim') || lbl.includes('final'))) {
          const v = r.querySelector('.value')?.textContent?.trim();
          if (v) return v;
        }
      }
      return null;
    }
    if (mode === 'vertical') {
      let block = scope.querySelector('#vertical-progress-block') || scope.querySelector('.progress-block.vertical');
      if (!block) return null;
      const ranges = block.querySelectorAll('.range');
      for (const r of ranges) {
        const lbl = r.querySelector('.label')?.textContent?.trim()?.toLowerCase();
        if (lbl && (lbl.startsWith('fim') || lbl.includes('final'))) {
          const v = r.querySelector('.value')?.textContent?.trim();
          if (v) return v;
        }
      }
      return null;
    }
    return null;
  }

  function getDefaultInitHex() {
    const bits = window.presetManager ? window.presetManager.getCurrentBits() : 0n;
    if (!bits || bits <= 0n) return null;
    return (1n << bits).toString(16);
  }

  function fillFromCardWithRetry(mode, attempts = 5, delay = 120) {
    let hex = getInitHexFromCard(mode);
    if (hex) {
      // Insere no campo privateKeyInput e dispara evento para preencher a matriz
      const input = document.getElementById('privateKeyInput');
      if (input) {
        input.value = hex;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (window.matrizAPI && typeof window.matrizAPI.setFromHex === 'function') {
        window.matrizAPI.setFromHex(hex);
      }
      return;
    }
    if (attempts > 0) {
      setTimeout(() => fillFromCardWithRetry(mode, attempts - 1, delay), delay);
    } else {
      const fallback = getDefaultInitHex();
      if (fallback) {
        const input = document.getElementById('privateKeyInput');
        if (input) {
          input.value = fallback;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (window.matrizAPI && typeof window.matrizAPI.setFromHex === 'function') {
          window.matrizAPI.setFromHex(fallback);
        }
      }
    }
  }

  document.querySelectorAll('input[name="mode"]').forEach((r) => {
    r.addEventListener('change', (e) => {
      if (!e.target.checked) return;
      if (!(window.presetManager && window.presetManager.hasActivePreset())) return;
      const mode = e.target.value;
      fillFromCardWithRetry(mode);
    });
  });
  
  function getCurrentMode() {
    const el = document.querySelector('input[name="mode"]:checked');
    return el ? el.value : null;
  }
  
  window.addEventListener('presetRangeUpdated', () => {
    if (!(window.presetManager && window.presetManager.hasActivePreset())) return;
    const mode = getCurrentMode();
    if (!mode) return;
    // Aguarda pequeno intervalo para o card terminar de renderizar
    setTimeout(() => fillFromCardWithRetry(mode), 120);
  });

  // FUNÇÃO AUTOEXECUTÁVEL - Preencher matriz com Private Key HEX
  function setupPrivateKeyInput() {
    const privateKeyInput = document.getElementById('privateKeyInput');
    if (!privateKeyInput) return;

    // Função para converter HEX para matriz
    function hexToMatrix(hexString) {
      // Limpa o HEX (remove 0x, espaços, etc.)
      const cleanHex = hexString.replace(/^0x/i, '').replace(/\s+/g, '');
      
      // Validação básica
      if (!/^[0-9A-Fa-f]*$/.test(cleanHex)) {
        console.error(' HEX inválido:', cleanHex);
        return null;
      }

      // Converte para BigInt
      try {
        const hexValue = BigInt('0x' + cleanHex);
        console.log(` HEX convertido: ${cleanHex} → ${hexValue}`);
        return hexValue;
      } catch (error) {
        console.error(' Erro ao converter HEX:', error);
        return null;
      }
    }

    // Função para preencher a matriz com base no valor BigInt
    function fillMatrixFromHex(hexValue) {
      // Limpa seleções anteriores
      manuallySelectedCells.clear();
      ctrlSelectedCells.clear();

      // Converte BigInt para binário de 256 bits
      const binary = hexValue.toString(2).padStart(256, '0');
      console.log(` Binário (256 bits): ${binary}`);

      // Itera sobre cada bit
      for (let bitPosition = 0; bitPosition < 256; bitPosition++) {
        if (binary[255 - bitPosition] === '1') { // Inverte para bit 0 = L16xC16
          // Converte posição do bit para coordenadas da matriz
          const row = 15 - Math.floor(bitPosition / 16); // 0-based
          const col = 15 - (bitPosition % 16);        // 0-based
          
          // Converte para 1-based (formato do usuário)
          const row1based = row + 1;
          const col1based = col + 1;
          
          const cellKey = `${row},${col}`;
          manuallySelectedCells.add(cellKey);
          
          console.log(` Bit ${bitPosition} → L${row1based}xC${col1based}`);
        }
      }

      // Atualiza a interface
      drawGrid();
      updateHexLabel();
      console.log(` Matriz preenchida com ${manuallySelectedCells.size} células`);
    }

    // Event listener para input (paste e keyup)
    privateKeyInput.addEventListener('input', function(e) {
      const hexValue = e.target.value.trim();
      
      if (hexValue.length === 0) {
        // Se o campo está vazio, limpa a matriz
        manuallySelectedCells.clear();
        ctrlSelectedCells.clear();
        drawGrid();
        updateHexLabel();
        console.log(' Matriz limpa - campo vazio');
        return;
      }

      // Tenta processar o HEX
      const processedHex = hexToMatrix(hexValue);
      if (processedHex !== null) {
        fillMatrixFromHex(processedHex);
      }
    });

    // Event listener para paste (cola)
    privateKeyInput.addEventListener('paste', function(e) {
      // Pequeno delay para o valor ser atualizado
      setTimeout(() => {
        const hexValue = e.target.value.trim();
        if (hexValue.length > 0) {
          const processedHex = hexToMatrix(hexValue);
          if (processedHex !== null) {
            fillMatrixFromHex(processedHex);
          }
        }
      }, 10);
    });

    console.log(' Função Private Key HEX configurada');
  }

  // FUNÇÃO PARA PREENCHER MATRIZ COM INICIAL DOS CHECKBOX
  function setupCheckboxMatrixFill() {
    // Função para bloquear/desbloquear checkboxes
    function toggleCheckboxes(enabled) {
      const checkboxes = document.querySelectorAll('input[name="mode"]');
      checkboxes.forEach(checkbox => {
        checkbox.disabled = !enabled;
        // Adiciona feedback visual
        const label = checkbox.closest('.option-card');
        if (label) {
          if (!enabled) {
            label.style.opacity = '0.5';
            label.style.cursor = 'not-allowed';
          } else {
            label.style.opacity = '1';
            label.style.cursor = 'pointer';
          }
        }
      });
      console.log(` Checkboxes ${enabled ? 'LIBERADOS' : 'BLOQUEADOS'}`);
    }

    // Função para extrair valor HEX do progress-block
    function getHexFromProgressBlock(type) {
      // Procura pelo progress-block específico
      const progressBlocks = document.querySelectorAll('.progress-block');
      
      for (const block of progressBlocks) {
        const titleElement = block.querySelector('.progress-title');
        if (!titleElement) continue;
        
        const title = titleElement.textContent.toLowerCase();
        
        if (type === 'horizontal' && title.includes('horizontal')) {
          // Procura pelo valor init no progress-block horizontal
          const initElement = block.querySelector('.progress-info');
          if (initElement) {
            const text = initElement.textContent;
            // Extrai o valor HEX (ex: "init: 800000000000018318")
            const match = text.match(/init:\s*([0-9A-Fa-f]+)/);
            if (match) {
              console.log(` HEX do progress-block horizontal: ${match[1]}`);
              return match[1];
            }
          }
        } else if (type === 'vertical' && title.includes('vertical')) {
          // Procura pelo valor init no progress-block vertical
          const initElement = block.querySelector('.progress-info');
          if (initElement) {
            const text = initElement.textContent;
            // Extrai o valor HEX (ex: "init: 0000000000000000000000000000000000000000000000000000000000000001")
            const match = text.match(/init:\s*([0-9A-Fa-f]+)/);
            if (match) {
              console.log(` HEX do progress-block vertical: ${match[1]}`);
              return match[1];
            }
          }
        }
      }
      
      console.log(` Progress-block ${type} não encontrado ou sem valor init`);
      return null;
    }

    // Função para preencher matriz com base no modo
    function fillMatrixWithMode(mode) {
      // Limpa seleções anteriores
      manuallySelectedCells.clear();
      ctrlSelectedCells.clear();

      let startHex = '';
      
      switch(mode) {
        case 'horizontal':
          // Pega o valor do progress-block HORIZONTAL
          const horizontalHex = getHexFromProgressBlock('horizontal');
          if (horizontalHex) {
            startHex = horizontalHex;
          } else {
            // Fallback: pega o valor do preset
            const presetSelect = document.getElementById('presetBits');
            if (presetSelect && presetSelect.value) {
              const bitCount = parseInt(presetSelect.value);
              startHex = (1n << BigInt(bitCount)).toString(16).toUpperCase();
              console.log(` Fallback preset ${bitCount + 1}: HEX = ${startHex}`);
            } else {
              startHex = '8000000000000000000000000000000000000000000000000000000000000000';
              console.log(' Fallback padrão: HEX = 8000000000000000000000000000000000000000000000000000000000000000');
            }
          }
          break;
        case 'vertical':
          // Pega o valor do progress-block VERTICAL
          const verticalHex = getHexFromProgressBlock('vertical');
          if (verticalHex) {
            startHex = verticalHex;
          } else {
            // Fallback para vertical: sempre começa do bit 0 (L16xC16)
            startHex = '0000000000000000000000000000000000000000000000000000000000000001';
            console.log(' Fallback vertical: HEX = 0000000000000000000000000000000000000000000000000000000000000001 (L16xC16)');
          }
          break;
        case 'randomize_h':
        case 'randomize_v':
        case 'randomize':
          // Para randomize, usa o mesmo valor do horizontal ou vertical conforme o sub-modo
          const searchMode = mode === 'randomize_v' ? 'vertical' : 'horizontal';
          const randomHex = getHexFromProgressBlock(searchMode);
          if (randomHex) {
            startHex = randomHex;
            console.log(` Randomize (${mode}) usando valor do progress-block ${searchMode}: HEX = ${startHex}`);
          } else {
            const randomPreset = document.getElementById('presetBits');
            if (randomPreset && randomPreset.value) {
              const randomBitCount = parseInt(randomPreset.value);
              // Para vertical, o fallback costuma ser o bit 0
              if (mode === 'randomize_v') {
                 startHex = '0000000000000000000000000000000000000000000000000000000000000001';
              } else {
                 startHex = (1n << BigInt(randomBitCount)).toString(16).toUpperCase();
              }
              console.log(` Randomize fallback preset ${randomBitCount + 1}: HEX = ${startHex}`);
            } else {
              startHex = '8000000000000000000000000000000000000000000000000000000000000000';
              console.log(' Randomize fallback padrão: HEX = 8000000000000000000000000000000000000000000000000000000000000000');
            }
          }
          break;
        default:
          return;
      }

      console.log(` Usando HEX para ${mode}: ${startHex}`);

      // Converte HEX para BigInt
      const hexValue = BigInt('0x' + startHex);
      
      // Converte BigInt para binário de 256 bits
      const binary = hexValue.toString(2).padStart(256, '0');
      console.log(` Binário (256 bits): ${binary}`);

      // Itera sobre cada bit
      for (let bitPosition = 0; bitPosition < 256; bitPosition++) {
        if (binary[255 - bitPosition] === '1') { // Inverte para bit 0 = L16xC16
          // Converte posição do bit para coordenadas da matriz
          const row = 15 - Math.floor(bitPosition / 16); // 0-based
          const col = 15 - (bitPosition % 16);        // 0-based
          
          // Converte para 1-based (formato do usuário)
          const row1based = row + 1;
          const col1based = col + 1;
          
          const cellKey = `${row},${col}`;
          manuallySelectedCells.add(cellKey);
          
          console.log(` Bit ${bitPosition} → L${row1based}xC${col1based}`);
        }
      }

      // Atualiza a interface
      drawGrid();
      updateHexLabel();
      console.log(` Matriz preenchida com ${manuallySelectedCells.size} células (modo: ${mode})`);
    }

    // MONITORA O CARREGAMENTO DO PRESET
    function setupPresetMonitoring() {
      const presetSelect = document.getElementById('presetBits');
      if (!presetSelect) return;

      // Bloqueia checkboxes quando o preset mudar
      presetSelect.addEventListener('change', function() {
        console.log(' Preset alterado - BLOQUEANDO checkboxes...');
        toggleCheckboxes(false);
        
        // Espera o carregamento completo (observa os progress-blocks)
        const checkLoadingComplete = () => {
          const progressBlocks = document.querySelectorAll('.progress-block');
          
          // Verifica se ambos os progress-blocks foram carregados
          let horizontalLoaded = false;
          let verticalLoaded = false;
          
          progressBlocks.forEach(block => {
            const titleElement = block.querySelector('.progress-title');
            const infoElement = block.querySelector('.progress-info');
            
            if (titleElement && infoElement) {
              const title = titleElement.textContent.toLowerCase();
              const info = infoElement.textContent;
              
              if (title.includes('horizontal') && info.includes('init:')) {
                horizontalLoaded = true;
                console.log(` Progress-block horizontal carregado: ${info}`);
              } else if (title.includes('vertical') && info.includes('init:')) {
                verticalLoaded = true;
                console.log(` Progress-block vertical carregado: ${info}`);
              }
            }
          });
          
          if (horizontalLoaded && verticalLoaded) {
            console.log(' Carregamento completo dos progress-blocks - LIBERANDO checkboxes...');
            
            // Pequeno delay para garantir estabilidade
            setTimeout(() => {
              toggleCheckboxes(true);
            }, 500);
          } else {
            // Continua verificando
            setTimeout(checkLoadingComplete, 100);
          }
        };
        
        // Inicia a verificação após um pequeno delay
        setTimeout(checkLoadingComplete, 100);
      });

      console.log(' Monitoramento de preset configurado');
    }

    // Adiciona event listeners para os checkboxes
    const checkboxes = document.querySelectorAll('input[name="mode"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function(e) {
        if (e.target.checked) {
          fillMatrixWithMode(e.target.value);
        }
      });
    });

    // Inicializa o monitoramento de preset
    setupPresetMonitoring();
    console.log(' Função Checkbox Matrix Fill configurada com progress-blocks');
  }

// Inicializa as funções após o carregamento
setupPrivateKeyInput();

// ... (rest of the code remains the same)
});
