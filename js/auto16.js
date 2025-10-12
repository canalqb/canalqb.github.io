document.addEventListener('DOMContentLoaded', () => {
  const SIZE = 16;
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

  let altura = 1;
  let base = SIZE;
  let gridState = new Array(SIZE * SIZE).fill(false);
  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  function getCellSize() {
    // Mantém o canvas quadrado
    return canvas.width / SIZE;
  }

  // Botões copiar + salvar em textarea
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
      if (!textarea.value.trim()) {
        alert(`⚠️ Nada para salvar em ${label}.`);
        return;
      }
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

  // Desenha a matriz, números das linhas/colunas, e intervalo das potências de 2 do lado direito
  function drawGrid() {
    const CELL_SIZE = getCellSize();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar células
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#48bb78' : '#ffffff';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // Destacar faixa de altura/base selecionada
    ctx.fillStyle = 'rgba(102, 126, 234, 0.2)';
    const yStart = (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(0, yStart, canvas.width, heightPx);

    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, yStart, canvas.width, heightPx);

    // Texto para numeração das colunas no topo
    ctx.fillStyle = '#333';
    ctx.font = `${Math.floor(CELL_SIZE / 2)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let x = 0; x < SIZE; x++) {
      const posX = x * CELL_SIZE + CELL_SIZE / 2;
      ctx.fillText((x + 1).toString(), posX, CELL_SIZE / 4);
    }

    // Texto para numeração das linhas e intervalo de potências do lado direito
    ctx.textAlign = 'left';

    for (let y = 0; y < SIZE; y++) {
      const posY = y * CELL_SIZE + CELL_SIZE / 2;
      const linhaNum = y + 1;
      ctx.fillText(linhaNum.toString(), canvas.width - CELL_SIZE / 4, posY);

      // Intervalo de potências de 2 (de baixo para cima)
      const linhasContadas = SIZE - y; // linhas de baixo pra cima contando essa
      const powStart = (linhasContadas - 1) * SIZE;
      const powEnd = linhasContadas * SIZE - 1;

      // Formatar intervalo como 2^powStart .. 2^powEnd
      const intervalo = `2^${powStart} .. 2^${powEnd}`;
      ctx.fillText(intervalo, canvas.width - CELL_SIZE * 3, posY);
    }
  }

  // Cria botões para selecionar altura e base (range)
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

  // Atualiza estilo dos botões selecionados (active)
  function updateRangeButtons() {
    heightButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === altura);
    });
    baseButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.textContent) === base);
    });

    document.getElementById('activeRangeLabel').textContent = `${altura} até ${base}`;
  }

  // Converte grid para string hex (8 bits por byte)
  function gridToHex() {
    const bits = gridState.map(cell => (cell ? '1' : '0')).join('');
    const hex = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = parseInt(bits.slice(i, i + 8), 2);
      hex.push(byte.toString(16).padStart(2, '0'));
    }
    return hex.join('');
  }

  // SHA-256 (Web Crypto API)
  async function sha256(buffer) {
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hash);
  }

  // Hex para Uint8Array
  function hexToBytes(hex) {
    return Uint8Array.from(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  }

  // Gera WIF (Wallet Import Format) do private key hex, com ou sem compressão
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

  // Base58 encode (Bitcoin style)
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

  // Atualiza as textareas com HEX, WIF e WIF não comprimido
  async function updateOutput() {
    const hex = gridToHex();
    const wif = await privateKeyToWIF(hex, true);
    const wifU = await privateKeyToWIF(hex, false);

    hexBox.value += hex + '\n';
    wifBox.value += wif + '\n';
    wifBoxUncompressed.value += wifU + '\n';
  }

  // Limpa grid e textareas
  function clearAll() {
    gridState.fill(false);
    stateCounter = 0n;
    drawGrid();
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
  }

  // Preenche aleatoriamente o intervalo altura..base
  function randomizeRange() {
    for (let y = altura - 1; y < base; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateOutput();
  }

  // Passo automático de contagem e desenho
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

  // Inicia loop automático
  function start() {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    step();
  }

  // Para loop automático
  function stop() {
    running = false;
    clearTimeout(timeoutId);
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  // Clique no canvas para alternar célula
  canvas.addEventListener('click', e => {
    if (running || !toggleOnClickCheckbox.checked) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX / getCellSize());
    const y = Math.floor((e.clientY - rect.top) * scaleY / getCellSize());

    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
      const idx = y * SIZE + x;
      gridState[idx] = !gridState[idx];
      drawGrid();
      updateOutput();
    }
  });

  // Eventos dos botões
  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', () => !running && clearAll());
  randBtn.addEventListener('click', () => !running && randomizeRange());
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
