document.addEventListener('DOMContentLoaded', () => {
  const SIZE = 16;
  const CELL_SIZE = 25;

  // Margens para números e intervalos
  const MARGIN_LEFT = 30;
  const MARGIN_TOP = 30;
  const MARGIN_RIGHT = 130;

  // Configura canvas
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

  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');

  // Estado do grid e controle
  let altura = 1;
  let base = SIZE;
  let gridState = new Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  // Função para adicionar linha ao textarea sem alterar scroll da página
  function appendLineNoScrollPage(ta, line) {
    const hadContent = ta.value.length > 0;
    ta.value += (hadContent ? '\n' : '') + line;
    ta.scrollTop = ta.scrollHeight; // Rola para o fim do textarea
  }

  // Setup botões copiar e salvar para textareas
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

  // Desenha o grid com margens, números e células
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = '12px Arial';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#333';

    // Cabeçalho das colunas
    ctx.textAlign = 'center';
    for (let x = 0; x < SIZE; x++) {
      const posX = MARGIN_LEFT + x * CELL_SIZE + CELL_SIZE / 2;
      const posY = MARGIN_TOP / 2;
      ctx.fillText((x + 1).toString(), posX, posY);
    }

    // Números das linhas e intervalos
    for (let y = 0; y < SIZE; y++) {
      const posY = MARGIN_TOP + y * CELL_SIZE + CELL_SIZE / 2;

      // Número linha à esquerda
      ctx.textAlign = 'right';
      ctx.fillText((y + 1).toString(), MARGIN_LEFT - 5, posY);

      // Intervalos à direita
      ctx.textAlign = 'left';
      const linhasContadas = SIZE - y;
      const powStart = (linhasContadas - 1) * SIZE;
      const powEnd = linhasContadas * SIZE - 1;
      const intervalo = `2^${powStart}..2^${powEnd}`;
      ctx.fillText(intervalo, MARGIN_LEFT + SIZE * CELL_SIZE + 10, posY);
    }

    // Desenha células
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#ffffff';
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
  }

  // Cria botões para escolher faixa altura/base
  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';

    for (let i = 1; i <= SIZE; i++) {
      // Botão altura
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

      // Botão base
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

  // Atualiza visual dos botões faixa
  function updateRangeButtons() {
    heightButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === altura);
    });
    baseButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === base);
    });

    const activeRangeLabel = document.getElementById('activeRangeLabel');
    if (activeRangeLabel) {
      activeRangeLabel.textContent = `${altura} até ${base}`;
    }
  }

  // Converte grid para hex string
  function gridToHex() {
    const bits = gridState.map(cell => (cell ? '1' : '0')).join('');
    const hex = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = parseInt(bits.slice(i, i + 8), 2);
      hex.push(byte.toString(16).padStart(2, '0'));
    }
    return hex.join('');
  }

  // SHA-256, hex para bytes, WIF e base58
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
      result = BASE58[Number(intVal % 58n)] + result;
      intVal /= 58n;
    }
    // Preserve leading zeros
    for (let b of buffer) {
      if (b === 0) result = '1' + result;
      else break;
    }
    return result;
  }

  // Atualiza os outputs sem alterar foco/scroll da página
  async function updateOutput() {
    const hex = gridToHex();
    const wif = await privateKeyToWIF(hex, true);
    const wifU = await privateKeyToWIF(hex, false);

    appendLineNoScrollPage(hexBox, hex);
    appendLineNoScrollPage(wifBox, wif);
    appendLineNoScrollPage(wifBoxUncompressed, wifU);
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

  // Preenche randomicamente faixa selecionada
  async function randomizeRange() {
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    await updateOutput();
  }

  // Função para obter modo selecionado (adapte se houver UI)
  function getSelectedMode() {
    // Exemplo: implementar radio buttons com name "mode"
    const radios = document.querySelectorAll('input[name="mode"]');
    for (const radio of radios) {
      if (radio.checked) return radio.value;
    }
    // Padrão para 'sequential' se nada selecionado
    return 'sequential';
  }

  // Passo da matriz - incrementa estado binário 
  async function step() {
    if (!running) return;
    stateCounter++;

    const rowsCount = base - altura + 1;
    const totalCells = rowsCount * SIZE;
    const max = 1n << BigInt(totalCells);

    if (stateCounter >= max) {
      stop();
      return;
    }

    const bits = stateCounter.toString(2).padStart(totalCells, '0');
    const mode = getSelectedMode();

    if (mode === 'sequential') {
      // Linha por linha, esquerda para direita
      for (let i = 0; i < bits.length; i++) {
        const y = altura - 1 + Math.floor(i / SIZE);
        const x = i % SIZE;
        gridState[y * SIZE + x] = bits[i] === '1';
      }
    } else if (mode === 'vertical') {
      // Coluna por coluna, direita para esquerda, de baixo para cima
      let bitIndex = 0;
      for (let col = SIZE - 1; col >= 0; col--) {
        for (let row = base - 1; row >= altura - 1; row--) {
          if (bitIndex >= bits.length) break;
          const idx = row * SIZE + col;
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

    timeoutId = setTimeout(step, parseInt(speedInput.value, 10));
  }

  // Inicia e para step automático
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

  // Toggle célula clicando no canvas (sem alterar scroll da página)
  canvas.addEventListener('click', async (e) => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Corrigido cálculo para pegar célula clicada corretamente
    const x = Math.floor(((e.clientX - rect.left) * scaleX - MARGIN_LEFT) / CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY - MARGIN_TOP) / CELL_SIZE);

    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
      const idx = y * SIZE + x;
      gridState[idx] = !gridState[idx];
      drawGrid();

      const hex = gridToHex();
      const wif = await privateKeyToWIF(hex, true);
      const wifU = await privateKeyToWIF(hex, false);

      appendLineNoScrollPage(hexBox, hex);
      appendLineNoScrollPage(wifBox, wif);
      appendLineNoScrollPage(wifBoxUncompressed, wifU);
    }
  });

  // Botões UI
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

  // Inicialização
  createRangeButtons();
  drawGrid();
  setupCopyAndSaveButtons('hexBox', 'HEX');
  setupCopyAndSaveButtons('wifBox', 'WIF Comprimido');
  setupCopyAndSaveButtons('wifBoxUncompressed', 'WIF Não Comprimido');
});
