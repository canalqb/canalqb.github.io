document.addEventListener('DOMContentLoaded', () => {
  const SIZE = 16;
  const CELL_SIZE = 25;

  // Margens para números e intervalos
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;
  const MARGIN_RIGHT = 130;

  // Ajusta o canvas para incluir margens
  const canvas = document.getElementById('grid');
  canvas.width = MARGIN_LEFT + SIZE * CELL_SIZE + MARGIN_RIGHT;
  canvas.height = MARGIN_TOP + SIZE * CELL_SIZE;
  const ctx = canvas.getContext('2d');

  // Referências UI
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
  // Adiciona linha ao textarea, foca e rola até ela
  function appendLineAndFocus(ta, line, { selectLine = false, smooth = false } = {}) {
    const newline = ta.value.length ? '\n' + line : line;
    ta.value += newline;
  
    const lineEnd = ta.value.length;
    const lineStart = lineEnd - line.length;
  
    ta.focus();
    if (selectLine) {
      ta.setSelectionRange(lineStart, lineEnd);
    } else {
      ta.setSelectionRange(lineEnd, lineEnd);
    }
  
    if ('scrollTo' in ta && smooth) {
      ta.scrollTo({ top: ta.scrollHeight, behavior: 'smooth' });
    } else {
      ta.scrollTop = ta.scrollHeight;
    }
  }


  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');

  // Range da matriz (linha inicial e final para ativar)
  let altura = 1;
  let base = SIZE;

  let gridState = new Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  // Tamanho da célula - fixo
  function getCellSize() {
    return CELL_SIZE;
  }

  // Setup dos botões de copiar e salvar para cada textarea
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

  // Desenha a matriz e as margens (números + intervalos potenciais)
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    // Desenha números das colunas no topo
    ctx.textAlign = 'center';
    for (let x = 0; x < SIZE; x++) {
      const posX = MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2;
      const posY = MARGIN_TOP / 2;
      ctx.fillText((x + 1).toString(), posX, posY);
    }

    // Desenha números das linhas à esquerda e intervalos na direita (de baixo pra cima)
    for (let y = 0; y < SIZE; y++) {
      const posY = MARGIN_TOP + y * CELL_SIZE + CELL_SIZE / 2;

      // Número da linha à esquerda
      ctx.textAlign = 'right';
      ctx.fillText((y + 1).toString(), MARGIN_LEFT - 5, posY);

      // Intervalo potência à direita
      ctx.textAlign = 'left';
      const linhasContadas = SIZE - y; // de baixo para cima
      const powStart = (linhasContadas - 1) * SIZE;
      const powEnd = linhasContadas * SIZE - 1;
      const intervalo = `2^${powStart}..2^${powEnd}`;
      ctx.fillText(intervalo, MARGIN_LEFT + SIZE * CELL_SIZE + 10, posY);
    }

    // Desenha células da matriz
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#ffffff';
        ctx.fillRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(MARGIN_LEFT + x * CELL_SIZE, MARGIN_TOP + y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Highlight da faixa entre altura e base
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = MARGIN_TOP + (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(MARGIN_LEFT, yStart, SIZE * CELL_SIZE, heightPx);
  }

  // Cria botões para selecionar intervalo altura/base
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

  // Atualiza visual dos botões de intervalo
  function updateRangeButtons() {
    heightButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === altura);
    });
    baseButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === base);
    });

    document.getElementById('activeRangeLabel').textContent = `${altura} até ${base}`;
  }

  // Converte estado da matriz para string hex
  function gridToHex() {
    const bits = gridState.map(cell => (cell ? '1' : '0')).join('');
    const hex = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = parseInt(bits.slice(i, i + 8), 2);
      hex.push(byte.toString(16).padStart(2, '0'));
    }
    return hex.join('');
  }

  // SHA-256 async
  async function sha256(buffer) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hash);
  }

  // Hex string para bytes Uint8Array
  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  }

  // Converte chave privada em formato WIF (compressed ou uncompressed)
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

  // Base58 encode
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

  // Atualiza os outputs dos textareas
  async function updateOutput() {
    const hex = gridToHex();
    const wif = await privateKeyToWIF(hex, true);
    const wifU = await privateKeyToWIF(hex, false);

    appendLineAndFocus(hexBox, hex, { selectLine: true });
    appendLineAndFocus(wifBox, wif);
    appendLineAndFocus(wifBoxUncompressed, wifU);

  }

  // Limpa matriz e textareas
  function clearAll() {
    gridState.fill(false);
    stateCounter = 0n;
    drawGrid();
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
  }

  // Preenche randomicamente só a faixa selecionada
  function randomizeRange() {
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateOutput();
  }

  // Avança o contador e atualiza a matriz com o padrão binário
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

  // Inicia o processo de step automático
  function start() {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    step();
  }

  // Para o processo de step automático
  function stop() {
    running = false;
    clearTimeout(timeoutId);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  // Toggle célula clicando no canvas
  canvas.addEventListener('click', e => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX - MARGIN_LEFT) / CELL_SIZE;
    const y = Math.floor((e.clientY - rect.top) * scaleY - MARGIN_TOP) / CELL_SIZE;

    // Corrigido para inteiros e validar limites
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);

    if (cellX >= 0 && cellX < SIZE && cellY >= 0 && cellY < SIZE) {
      const idx = cellY * SIZE + cellX;
      gridState[idx] = !gridState[idx];
      drawGrid();
      updateOutput();
    }
  });

  // Botões
  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', () => {
    if (!running) clearAll();
  });
  randBtn.addEventListener('click', () => {
    if (!running) randomizeRange();
  });
  speedInput.addEventListener('input', () => {
    speedLabel.textContent = `${speedInput.value} ms`;
  });

  // Inicializa tudo
  createRangeButtons();
  drawGrid();
  setupCopyAndSaveButtons('hexBox', 'HEX');
  setupCopyAndSaveButtons('wifBox', 'WIF Comprimido');
  setupCopyAndSaveButtons('wifBoxUncompressed', 'WIF Não Comprimido');
});
