document.addEventListener('DOMContentLoaded', () => {
  // Constantes do grid e canvas
  const SIZE = 16;
  const CELL_SIZE = 20;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;

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
  const enableExtraLineCheckbox = document.getElementById('enableExtraLine');
  const extraLineSelect = document.getElementById('extraLineSelect');
  const extraLineCellsContainer = document.getElementById('extraLineCells');

  // Estado da aplicação
  let altura = 13;
  let base = 16;
  let gridState = new Array(SIZE * SIZE).fill(false);
  let extraLineEnabled = false;
  let extraLine = null; // Número da linha extra
  let extraLineCells = new Array(SIZE).fill(false);
  let running = false;
  let timeoutId = null;
  let stateCounter = 0n;

  // Ajusta tamanho do canvas
  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + 1;
  canvas.height = MARGIN_TOP + SIZE * CELL_SIZE + 1;

  // --- FUNÇÕES PRINCIPAIS ---

  function updateRangeLabel() {
    const label = document.getElementById('activeRangeLabel');
    if (label) label.textContent = `${altura} até ${base}`;
  }

  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenha cabeçalhos colunas
    ctx.fillStyle = '#333';
    ctx.font = '8px Arial';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    for (let x = 0; x < SIZE; x++) {
      const px = MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2;
      ctx.fillText(x + 1, px, MARGIN_TOP / 2);
    }

    // Desenha números das linhas
    for (let y = 0; y < SIZE; y++) {
      const py = MARGIN_TOP + y * CELL_SIZE + CELL_SIZE / 2;
      ctx.textAlign = 'right';
      ctx.fillText(y + 1, MARGIN_LEFT - 5, py);
    }

    // Desenha células do grid
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#fff'; // Verde se ativo, branco se não
        ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destaque da faixa selecionada (altura-base)
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    // Destaque linha extra (se habilitada)
    if (extraLineEnabled && extraLine !== null) {
      const yExtra = MARGIN_TOP + (extraLine - 1) * CELL_SIZE;

      ctx.fillStyle = 'rgba(244, 114, 182, 0.2)';
      ctx.fillRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);

      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.strokeRect(MARGIN_LEFT, yExtra, SIZE * CELL_SIZE, CELL_SIZE);

      // Destaca células ativas na linha extra
      for (let x = 0; x < SIZE; x++) {
        if (extraLineCells[x]) {
          ctx.fillStyle = 'rgba(244, 114, 182, 0.4)';
          ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE + 2, yExtra + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        }
      }
    }
  }

  // Cria botões para altura e base (1 até SIZE)
  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';

    for (let i = 1; i <= SIZE; i++) {
      const btnAlt = document.createElement('button');
      btnAlt.textContent = i;
      btnAlt.className = 'range-btn';
      btnAlt.onclick = () => {
        if (!running) {
          altura = i;
          if (base < altura) base = altura;
          updateRangeButtons();
          drawGrid();
        }
      };
      heightButtonsDiv.appendChild(btnAlt);

      const btnBase = document.createElement('button');
      btnBase.textContent = i;
      btnBase.className = 'range-btn';
      btnBase.onclick = () => {
        if (!running) {
          base = i;
          if (base < altura) altura = base;
          updateRangeButtons();
          drawGrid();
        }
      };
      baseButtonsDiv.appendChild(btnBase);
    }

    updateRangeButtons();
  }

  // Atualiza estilos dos botões e labels
  function updateRangeButtons() {
    [...heightButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', Number(btn.textContent) === altura);
    });
    [...baseButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', Number(btn.textContent) === base);
    });
    updateRangeLabel();
    updateExtraLineOptions();
  }

  // Linhas disponíveis para linha extra (fora do intervalo altura-base)
  function getAvailableExtraLines() {
    let lines = [];
    for (let i = 1; i <= SIZE; i++) {
      if (i < altura || i > base) lines.push(i);
    }
    return lines;
  }

  // Atualiza opções de seleção da linha extra
  function updateExtraLineOptions() {
    if (!extraLineSelect) return;

    const options = getAvailableExtraLines();
    extraLineSelect.innerHTML = '<option value="">Selecione uma linha</option>';

    options.forEach(line => {
      const option = document.createElement('option');
      option.value = line;
      option.textContent = `Linha ${line}`;
      if (extraLine === line) option.selected = true;
      extraLineSelect.appendChild(option);
    });

    // Se a linha extra selecionada não está mais disponível, desativa
    if (extraLine !== null && !options.includes(extraLine)) {
      extraLine = null;
      extraLineEnabled = false;
      if (enableExtraLineCheckbox) enableExtraLineCheckbox.checked = false;
      updateExtraLineUI();
    }
  }

  // Atualiza UI da linha extra (checkbox, botões, grid)
  function updateExtraLineUI() {
    if (!extraLineCellsContainer || !extraLineSelect) return;

    extraLineSelect.disabled = !extraLineEnabled;

    if (extraLineEnabled && extraLine !== null) {
      extraLineCellsContainer.style.display = 'block';
      updateExtraLineCellsUI();
    } else {
      extraLineCellsContainer.style.display = 'none';
    }
    drawGrid();
  }

  // Cria botões para ativar/desativar células na linha extra
  function updateExtraLineCellsUI() {
    if (!extraLineCellsContainer) return;

    extraLineCellsContainer.innerHTML = '<div class="section-title" style="font-size: 0.85rem; margin-bottom: 0.5rem;">Selecione as células da linha extra:</div>';

    const gridDiv = document.createElement('div');
    gridDiv.className = 'extra-line-cells-grid';

    for (let i = 0; i < SIZE; i++) {
      const btn = document.createElement('button');
      btn.textContent = (i + 1).toString();
      btn.className = 'extra-cell-btn';
      btn.classList.toggle('active', extraLineCells[i]);
      btn.onclick = () => {
        if (!running) {
          extraLineCells[i] = !extraLineCells[i];
          updateExtraLineCellsUI();
          drawGrid();
        }
      };
      gridDiv.appendChild(btn);
    }

    extraLineCellsContainer.appendChild(gridDiv);
  }

  // Converte o estado do grid em hexadecimal
  function gridToHex() {
    const bits = gridState.map(c => (c ? '1' : '0')).join('');
    const bigIntValue = BigInt('0b' + bits);
    return bigIntValue.toString(16).padStart((SIZE * SIZE) / 4, '0');
  }

  // Base58 alphabet para encoding
  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  // Codifica buffer para Base58
  function base58Encode(buffer) {
    let num = BigInt('0x' + [...buffer].map(b => b.toString(16).padStart(2, '0')).join(''));
    let encoded = '';
    while (num > 0) {
      const remainder = num % 58n;
      num /= 58n;
      encoded = BASE58[Number(remainder)] + encoded;
    }
    // Leading zeros
    for (const b of buffer) {
      if (b === 0) encoded = '1' + encoded;
      else break;
    }
    return encoded;
  }

  // SHA-256 usando Web Crypto API
  async function sha256(buffer) {
    return await crypto.subtle.digest('SHA-256', buffer);
  }

  // Duplo SHA-256 (para checksum)
  async function doubleSha256(buffer) {
    const first = await sha256(buffer);
    return await sha256(first);
  }

  // Converte hex (private key) para WIF (Wallet Import Format)
  async function hexToWIF(hex, compressed = true) {
    if (hex.length !== 64) return 'Hex inválido';

    const privKeyBytes = Uint8Array.from(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
    const prefix = new Uint8Array([0x80]); // prefixo mainnet

    let keyWithPrefix;
    if (compressed) {
      keyWithPrefix = new Uint8Array(prefix.length + privKeyBytes.length + 1);
      keyWithPrefix.set(prefix, 0);
      keyWithPrefix.set(privKeyBytes, prefix.length);
      keyWithPrefix[prefix.length + privKeyBytes.length] = 0x01;
    } else {
      keyWithPrefix = new Uint8Array(prefix.length + privKeyBytes.length);
      keyWithPrefix.set(prefix, 0);
      keyWithPrefix.set(privKeyBytes, prefix.length);
    }

    const hash = await doubleSha256(keyWithPrefix.buffer);
    const hashArray = new Uint8Array(hash);
    const checksum = hashArray.slice(0, 4);

    const wifBytes = new Uint8Array(keyWithPrefix.length + 4);
    wifBytes.set(keyWithPrefix, 0);
    wifBytes.set(checksum, keyWithPrefix.length);

    return base58Encode(wifBytes);
  }

  // Atualiza os campos de saída (hex, WIF)
  async function updateOutput() {
    const hex = gridToHex();
    hexBox.value = hex.toUpperCase();

    wifBox.value = 'Gerando...';
    wifBoxUncompressed.value = 'Gerando...';

    try {
      wifBox.value = await hexToWIF(hex, true);
      wifBoxUncompressed.value = await hexToWIF(hex, false);
    } catch (e) {
      wifBox.value = 'Erro';
      wifBoxUncompressed.value = 'Erro';
    }
  }

  // Aleatoriza todo o grid
  function randomizeGrid() {
    if (running) return;
    for (let i = 0; i < gridState.length; i++) {
      gridState[i] = Math.random() < 0.5;
    }
    drawGrid();
    updateOutput();
  }

  // Aleatoriza apenas faixa altura-base e linha extra
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

  // Para o processo de step
  function stop() {
    running = false;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  // Passo único na simulação
  async function step() {
    // Aplica regra: 
    // Altera estado do grid (faixa altura-base) de acordo com vizinhos
    // Adiciona lógica da linha extra se habilitada

    let newGrid = [...gridState];

    // Função para contar vizinhos ativos (considerando bordas)
    function countNeighbors(x, y) {
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
            if (gridState[ny * SIZE + nx]) count++;
          }
        }
      }
      return count;
    }

    for (let y = altura - 1; y <= base - 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        const neighbors = countNeighbors(x, y);

        // Regra simples de exemplo: célula vive se tiver 2 ou 3 vizinhos ativos
        if (gridState[idx]) {
          newGrid[idx] = neighbors === 2 || neighbors === 3;
        } else {
          newGrid[idx] = neighbors === 3;
        }
      }
    }

    // Aplica linha extra se habilitada
    if (extraLineEnabled && extraLine !== null) {
      for (let x = 0; x < SIZE; x++) {
        if (extraLineCells[x]) {
          // Inverte estado da célula na linha extra
          const idx = (extraLine - 1) * SIZE + x;
          newGrid[idx] = !newGrid[idx];
        }
      }
    }

    gridState = newGrid;

    // Atualiza contagem e interface
    stateCounter++;
    drawGrid();
    await updateOutput();

    if (randomizeOnStepCheckbox.checked) {
      await randomizeRange();
    }
  }

  // Loop principal da simulação
  async function loop() {
    if (!running) return;
    await step();
    const speed = Number(speedInput.value);
    timeoutId = setTimeout(loop, speed);
  }

  // Eventos
  canvas.addEventListener('click', event => {
    if (!toggleOnClickCheckbox.checked || running) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor((event.clientY - rect.top - MARGIN_TOP) / CELL_SIZE);

    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
      const idx = y * SIZE + x;
      gridState[idx] = !gridState[idx];
      drawGrid();
      updateOutput();
    }
  });

  startBtn.addEventListener('click', () => {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    loop();
  });

  stopBtn.addEventListener('click', () => {
    stop();
  });

  clearBtn.addEventListener('click', () => {
    if (running) return;
    gridState.fill(false);
    drawGrid();
    updateOutput();
  });

  randBtn.addEventListener('click', () => {
    if (running) return;
    randomizeGrid();
  });

  speedInput.addEventListener('input', () => {
    speedLabel.textContent = `Velocidade: ${speedInput.value} ms`;
  });

  toggleOnClickCheckbox.addEventListener('change', () => {
    // Nenhuma ação extra
  });

  randomizeOnStepCheckbox.addEventListener('change', () => {
    // Nenhuma ação extra
  });

  enableExtraLineCheckbox.addEventListener('change', () => {
    extraLineEnabled = enableExtraLineCheckbox.checked;
    updateExtraLineUI();
  });

  extraLineSelect.addEventListener('change', () => {
    const val = Number(extraLineSelect.value);
    if (isNaN(val)) {
      extraLine = null;
    } else {
      extraLine = val;
    }
    updateExtraLineUI();
  });

  // Inicialização
  createRangeButtons();
  drawGrid();
  updateOutput();
  updateRangeLabel();

});
