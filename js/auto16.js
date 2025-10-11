(() => {
  const SIZE = 16;
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');

  // Controles DOM
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');
  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');
  const modeRadios = document.querySelectorAll('input[name="mode"]');
  const toggleOnClickCheckbox = document.getElementById('toggleOnClick');
  const randomizeOnStepCheckbox = document.getElementById('randomizeStatesOnStep');

  // Textareas para saída de chaves
  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  // Contêineres dos botões
  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');

  // Estado da faixa
  let altura = SIZE; // linha superior (1..16), padrão para última linha
  let base = SIZE;   // linha inferior (1..16), padrão para última linha

  // Estado da matriz (bits)
  let gridState = new Array(SIZE * SIZE).fill(false);

  let stateCounter = 0n;
  let running = false;
  let timeoutId = null;

  const CELL_SIZE = canvas.width / SIZE;

  // Cria botões para selecionar altura e base
  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';

    for (let h = 1; h <= SIZE; h++) {
      const btn = document.createElement('button');
      btn.textContent = h;
      btn.className = 'btn btn-sm size-btn btn-outline-primary';
      btn.dataset.h = h;
      btn.addEventListener('click', () => {
        if (running) return;
        altura = h;
        if (base < altura) base = altura;
        updateRangeButtons();
        drawGrid();
      });
      heightButtonsDiv.appendChild(btn);
    }

    for (let b = 1; b <= SIZE; b++) {
      const btn = document.createElement('button');
      btn.textContent = b;
      btn.className = 'btn btn-sm size-btn btn-outline-primary';
      btn.dataset.b = b;
      btn.addEventListener('click', () => {
        if (running) return;
        base = b;
        if (base < altura) base = altura;
        updateRangeButtons();
        drawGrid();
      });
      baseButtonsDiv.appendChild(btn);
    }

    updateRangeButtons();
  }

  // Atualiza estilos dos botões e labels de seleção
  function updateRangeButtons() {
    heightButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('btn-primary', parseInt(btn.dataset.h, 10) === altura);
      btn.classList.toggle('btn-outline-primary', parseInt(btn.dataset.h, 10) !== altura);
    });

    baseButtonsDiv.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('btn-primary', parseInt(btn.dataset.b, 10) === base);
      btn.classList.toggle('btn-outline-primary', parseInt(btn.dataset.b, 10) !== base);
    });
  }

  // Verifica se a linha y está dentro da faixa ativa (base ≥ altura)
  function isRowActive(y) {
    const yIdx = y;
    const altIdx = altura - 1;
    const baseIdx = base - 1;
    return (yIdx >= altIdx && yIdx <= baseIdx);
  }

  // Desenha a grade com destaque na faixa ativa
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        ctx.fillStyle = gridState[idx] ? '#2ecc71' : '#fff';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = '#ddd';
        ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
    // Destaque faixa ativa
    ctx.fillStyle = 'rgba(255, 99, 71, 0.3)';
    const yStart = (altura - 1) * CELL_SIZE;
    const heightPx = (base - altura + 1) * CELL_SIZE;
    ctx.fillRect(0, yStart, SIZE * CELL_SIZE, heightPx);
  }

  // Converte a matriz ativa para string hex
  function gridToHex() {
    const bits = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        bits.push(isRowActive(y) && gridState[y * SIZE + x] ? '1' : '0');
      }
    }
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byteStr = bits.slice(i, i + 8).join('');
      bytes.push(parseInt(byteStr, 2));
    }
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // SHA-256 async
  async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hashBuffer);
  }

  // Base58 encoding
  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  function base58Encode(buffer) {
    let intVal = 0n;
    for (const b of buffer) {
      intVal = (intVal << 8n) + BigInt(b);
    }
    let s = '';
    while (intVal > 0n) {
      const mod = intVal % 58n;
      intVal /= 58n;
      s = BASE58_ALPHABET[Number(mod)] + s;
    }
    for (const b of buffer) {
      if (b === 0) s = '1' + s;
      else break;
    }
    return s;
  }

  // Helper para converter hex em Uint8Array
  function hexStringToUint8Array(hex) {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return arr;
  }

  // Converte chave privada hex para WIF (compressed ou não)
  async function privateKeyToWIF(hexKey, compressed = true) {
    const keyBytes = hexStringToUint8Array(hexKey);
    let payload;
    if (compressed) {
      payload = new Uint8Array(34);
      payload[0] = 0x80;
      payload.set(keyBytes, 1);
      payload[33] = 0x01;
    } else {
      payload = new Uint8Array(33);
      payload[0] = 0x80;
      payload.set(keyBytes, 1);
    }
    const h1 = await sha256(payload);
    const h2 = await sha256(h1);
    const checksum = h2.slice(0, 4);

    const full = new Uint8Array(payload.length + 4);
    full.set(payload, 0);
    full.set(checksum, payload.length);

    return base58Encode(full);
  }

  // Atualiza os textareas com as chaves geradas, mantendo scroll na última linha
  async function updateKeyOutputs() {
    const hex = gridToHex();
    const wifCompressed = await privateKeyToWIF(hex, true);
    const wifUncompressed = await privateKeyToWIF(hex, false);

    if (hexBox) {
      hexBox.value += hex + '\n';
      hexBox.scrollTop = hexBox.scrollHeight;
    }
    if (wifBox) {
      wifBox.value += wifCompressed + '\n';
      wifBox.scrollTop = wifBox.scrollHeight;
    }
    if (wifBoxUncompressed) {
      wifBoxUncompressed.value += wifUncompressed + '\n';
      wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
    }
  }

  // Aleatoriza a faixa ativa da matriz
  function randomizeRange() {
    for (let y = altura - 1; y <= base - 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateKeyOutputs();
  }

  // Limpa toda matriz e caixas de texto
  function clearAll() {
    gridState.fill(false);
    drawGrid();
    if (hexBox) hexBox.value = '';
    if (wifBox) wifBox.value = '';
    if (wifBoxUncompressed) wifBoxUncompressed.value = '';
  }

  // Retorna o máximo valor do contador para a faixa ativa
  function getMaxCounter() {
    const numRows = base - altura + 1;
    return 1n << BigInt(numRows * SIZE);
  }

  // Seta a matriz a partir do contador (modo sequencial)
  function setGridFromCounter(cnt) {
    const numRows = base - altura + 1;
    const totalBits = numRows * SIZE;
    for (let i = 0; i < totalBits; i++) {
      const bit = (cnt >> BigInt(totalBits - 1 - i)) & 1n;
      const rowOffset = Math.floor(i / SIZE);
      const col = i % SIZE;
      const y = (altura - 1) + rowOffset;
      gridState[y * SIZE + col] = (bit === 1n);
    }
    // Limpa fora da faixa ativa
    for (let y = 0; y < SIZE; y++) {
      if (y < (altura - 1) || y > (base - 1)) {
        for (let x = 0; x < SIZE; x++) {
          gridState[y * SIZE + x] = false;
        }
      }
    }
  }

  // Função de passo da simulação
  async function step() {
    const mode = Array.from(modeRadios).find(r => r.checked)?.value || 'sequential';

    if (randomizeOnStepCheckbox.checked) {
      randomizeRange();
      scheduleNext();
      return;
    }

    if (mode === 'sequential') {
      const maxCnt = getMaxCounter();
      if (stateCounter >= maxCnt) {
        stop();
        return;
      }
      setGridFromCounter(stateCounter);
      drawGrid();
      await updateKeyOutputs();
      stateCounter++;
      scheduleNext();
    } else {
      // modo aleatório: toggle uma célula aleatória na faixa ativa
      const numRows = base - altura + 1;
      const totalCells = numRows * SIZE;
      const idx = Math.floor(Math.random() * totalCells);
      const rowOffset = Math.floor(idx / SIZE);
      const col = idx % SIZE;
      const y = (altura - 1) + rowOffset;
      const pos = y * SIZE + col;
      gridState[pos] = !gridState[pos];
      drawGrid();
      await updateKeyOutputs();
      scheduleNext();
    }
  }

  // Agenda próximo passo
  function scheduleNext() {
    timeoutId = setTimeout(step, Number(speedInput.value));
  }

  // Inicia a simulação
  function start() {
    if (running) return;
    running = true;
    stateCounter = 0n;
    clearAll();
    step();
    startBtn.disabled = true;
    stopBtn.disabled = false;
  }

  // Para a simulação
  function stop() {
    running = false;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  // Clique no canvas para alterar célula, se permitido
  canvas.addEventListener('click', e => {
    if (!toggleOnClickCheckbox.checked) return;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const row = Math.floor((e.clientY - rect.top) / CELL_SIZE);
    if (!isRowActive(row)) return;
    const pos = row * SIZE + col;
    gridState[pos] = !gridState[pos];
    drawGrid();
    updateKeyOutputs();
  });

  // Eventos dos botões e controles
  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  clearBtn.addEventListener('click', () => {
    stop();
    clearAll();
  });
  randBtn.addEventListener('click', randomizeRange);

  speedInput.addEventListener('input', () => {
    speedLabel.textContent = speedInput.value;
    if (running) {
      clearTimeout(timeoutId);
      scheduleNext();
    }
  });

  // Inicialização
  createRangeButtons();
  drawGrid();
})();
