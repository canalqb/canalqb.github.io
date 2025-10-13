document.addEventListener('DOMContentLoaded', () => {
  // --- CONSTANTES E CONFIGURAÇÕES ---
  const SIZE = 16;
  const CELL_SIZE = 25;
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;
  const MARGIN_RIGHT = 130;

  // --- ELEMENTOS DOM ---
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

  // --- VARIÁVEIS DE ESTADO ---
  let altura = 12;       // linha inicial do intervalo (1-based)
  let base = 16;         // linha final do intervalo (1-based)

  let gridState = Array(SIZE * SIZE).fill(false); // estado booleano de cada célula no grid

  let stateCounter = 0n;  // contador bigInt para passos da sequência

  let running = false;
  let timeoutId = null;

  // Linha extra (opcional)
  let extraLine = null;                // número da linha extra (1-based), ou null
  let extraLineSelectedCells = new Set(); // células selecionadas na linha extra (conjunto de x)

  // --- CONFIGURAÇÃO DO CANVAS ---
  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
  canvas.height = MARGIN_TOP + SIZE * CELL_SIZE;

  // --- FUNÇÕES ---

  // Atualiza o texto do intervalo selecionado
  function updateRangeLabel() {
    const label = document.getElementById('activeRangeLabel');
    if (label) label.textContent = `${altura} até ${base}`;
  }

  // Desenha todo o grid
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    // Cabeçalho colunas
    ctx.textAlign = 'center';
    for (let x = 0; x < SIZE; x++) {
      const px = MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2;
      ctx.fillText((x + 1).toString(), px, MARGIN_TOP / 2);
    }

    // Números linhas e faixa de potências
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

        // Cores diferentes para linha extra e linhas normais
        if (extraLine !== null && y === (extraLine - 1)) {
          // Linha extra: laranja se selecionada, branco se não
          ctx.fillStyle = extraLineSelectedCells.has(x) ? '#f6ad55' : '#fff';
        } else {
          ctx.fillStyle = gridState[idx] ? '#48bb78' : '#fff';
        }

        ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destaque faixa intervalo selecionado (altura..base)
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    // Destaque linha extra se selecionada
    if (extraLine !== null) {
      const extraY = MARGIN_TOP + (extraLine - 1) * CELL_SIZE;
      ctx.strokeStyle = '#f6ad55';
      ctx.lineWidth = 3;
      ctx.strokeRect(MARGIN_LEFT, extraY, SIZE * CELL_SIZE, CELL_SIZE);
    }
  }

  // Cria botões para selecionar altura e base
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

  // Atualiza destaque dos botões de altura e base
  function updateRangeButtons() {
    [...heightButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === altura);
    });
    [...baseButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === base);
    });
    updateRangeLabel();
  }

  // Função para converter grid para hexadecimal
  function gridToHex() {
    const bits = gridState.map(c => (c ? '1' : '0')).join('');
    const hex = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = parseInt(bits.slice(i, i + 8), 2);
      hex.push(byte.toString(16).padStart(2, '0'));
    }
    return hex.join('');
  }

  // SHA-256 usando Web Crypto API
  async function sha256(buffer) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hash);
  }

  // Converte hexadecimal para bytes
  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
  }

  // Converte chave privada hex para WIF
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

  // Base58 Alphabet
  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  // Codifica um Uint8Array em base58
  function base58Encode(buffer) {
    let intVal = BigInt('0x' + [...buffer].map(b => b.toString(16).padStart(2, '0')).join(''));
    let result = '';
    while (intVal > 0) {
      result = BASE58[Number(intVal % 58n)] + result;
      intVal /= 58n;
    }
    for (const b of buffer) {
      if (b === 0) result = '1' + result;
      else break;
    }
    return result;
  }

  // Atualiza caixas de saída (hex, WIF)
  async function updateOutput() {
    const hexStr = gridToHex();
    hexBox.value = hexStr;

    wifBox.value = await privateKeyToWIF(hexStr, true);
    wifBoxUncompressed.value = await privateKeyToWIF(hexStr, false);
  }

  // Gera configuração aleatória para o intervalo selecionado
  async function randomizeRange() {
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    await updateOutput();
  }

  // Inicia a execução sequencial
  function start() {
    if (running) return;
    running = true;
    stateCounter = 0n;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    step();
  }

  // Para a execução
  function stop() {
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (timeoutId) clearTimeout(timeoutId);
  }

  // Passo único na sequência (modo sequencial e vertical)
  async function step() {
    if (!running) return;

    // Calcula total de células no intervalo + selecionadas na linha extra
    const rowsCount = base - altura + 1;
    const totalCells = rowsCount * SIZE + extraLineSelectedCells.size;

    // Limite máximo para o contador
    const max = 1n << BigInt(totalCells);

    if (stateCounter >= max) {
      stop();
      return;
    }

    const bits = stateCounter.toString(2).padStart(Number(totalCells), '0');

    // Obter modo selecionado (default 'sequential')
    const mode = document.querySelector('input[name="mode"]:checked')?.value || 'sequential';

    let bitIndex = 0;

    if (mode === 'sequential') {
      // Preenche o intervalo altura..base linha a linha
      for (let i = 0; i < rowsCount * SIZE; i++) {
        const y = altura - 1 + Math.floor(i / SIZE);
        const x = i % SIZE;
        gridState[y * SIZE + x] = bits[bitIndex] === '1';
        bitIndex++;
      }
      // Depois preenche células da linha extra selecionadas
      if (extraLine !== null) {
        for (const x of extraLineSelectedCells) {
          const idx = (extraLine - 1) * SIZE + x;
          gridState[idx] = bits[bitIndex] === '1';
          bitIndex++;
        }
      }
    } else if (mode === 'vertical') {
      // Coluna a coluna da direita para esquerda, linha de baixo para cima, intervalo
      for (let col = SIZE - 1; col >= 0; col--) {
        for (let row = base - 1; row >= altura - 1; row--) {
          gridState[row * SIZE + col] = bits[bitIndex] === '1';
          bitIndex++;
        }
      }
      // Células da linha extra selecionadas
      if (extraLine !== null) {
        for (const x of extraLineSelectedCells) {
          const idx = (extraLine - 1) * SIZE + x;
          gridState[idx] = bits[bitIndex] === '1';
          bitIndex++;
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

  // Limpa o grid (todas células desligadas)
  async function clearGrid() {
    if (running) return;
    gridState.fill(false);
    extraLineSelectedCells.clear();
    drawGrid();
    await updateOutput();
  }

  // Randomiza o grid inteiro (todas células)
  async function randomizeGrid() {
    if (running) return;
    for (let i = 0; i < gridState.length; i++) {
      gridState[i] = Math.random() < 0.5;
    }
    extraLineSelectedCells.clear();
    drawGrid();
    await updateOutput();
  }

  // Evento clique no canvas para alternar células
  canvas.addEventListener('click', async (e) => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY - MARGIN_TOP) / CELL_SIZE);

    if (x < 0 || x >= SIZE || y < 0 || y >= SIZE) return;

    // Se clicou na linha extra selecionada, alterna seleção da célula da linha extra
    if (extraLine !== null && y === (extraLine - 1)) {
      if (extraLineSelectedCells.has(x)) extraLineSelectedCells.delete(x);
      else extraLineSelectedCells.add(x);
      drawGrid();
    } else {
      // Caso contrário, alterna célula no grid normal
      const idx = y * SIZE + x;
      gridState[idx] = !gridState[idx];
      drawGrid();
      await updateOutput();
    }
  });

  // --- CONTROLES DE LINHA EXTRA ---

  // Cria seletor de linha extra e botão para limpar seleção
  function createExtraLineControls() {
    const container = document.createElement('div');
    container.style.margin = '10px 0';

    const label = document.createElement('label');
    label.textContent = 'Linha Extra (opcional): ';
    container.appendChild(label);

    const select = document.createElement('select');
    select.id = 'extraLineSelect';

    // Opção nenhuma
    const noneOption = document.createElement('option');
    noneOption.value = '';
    noneOption.textContent = 'Nenhuma';
    select.appendChild(noneOption);

    // Opções 1 até SIZE
    for (let i = 1; i <= SIZE; i++) {
      const opt = document.createElement('option');
      opt.value = i.toString();
      opt.textContent = i.toString();
      select.appendChild(opt);
    }

    container.appendChild(select);

    // Botão limpar seleção da linha extra
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Limpar seleção linha extra';
    clearBtn.style.marginLeft = '10px';
    container.appendChild(clearBtn);

    // Insere antes dos botões base (ou em outro local)
    baseButtonsDiv.parentElement.insertBefore(container, baseButtonsDiv);

    // Eventos
    select.addEventListener('change', () => {
      if (running) return;
      const val = select.value;
      if (val === '') {
        extraLine = null;
        extraLineSelectedCells.clear();
      } else {
        extraLine = parseInt(val);
        extraLineSelectedCells.clear();
      }
      drawGrid();
    });

    clearBtn.addEventListener('click', () => {
      if (running) return;
      extraLineSelectedCells.clear();
      drawGrid();
    });
  }

  // --- INICIALIZAÇÃO ---

  // Cria botões e controles
  createRangeButtons();
  createExtraLineControls();
  updateRangeLabel();
  drawGrid();
  updateOutput();

  // Atualiza label de velocidade
  speedInput.addEventListener('input', () => {
    speedLabel.textContent = `${speedInput.value} ms`;
  });
  speedLabel.textContent = `${speedInput.value} ms`;

  // Botões start/stop/clear/random
  startBtn.addEventListener('click', () => start());
  stopBtn.addEventListener('click', () => stop());
  clearBtn.addEventListener('click', () => clearGrid());
  randBtn.addEventListener('click', () => randomizeGrid());

  // Desabilita stopBtn no início
  stopBtn.disabled = true;
});
