document.addEventListener('DOMContentLoaded', () => {
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

  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  const heightButtonsDiv = document.getElementById('heightButtons');
  const baseButtonsDiv = document.getElementById('baseButtons');

  // Estado da faixa (altura e base) - linhas entre 1 e 16
  let altura = 1;
  let base = SIZE;

  // Estado da matriz: array booleano, tamanho 256 (16x16)
  let gridState = new Array(SIZE * SIZE).fill(false);

  let running = false;
  let timeoutId = null;

  // Ajusta tamanho do canvas conforme CSS, mantendo proporção correta
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawGrid();
    }
  }

  // Calcula tamanho da célula baseado no tamanho atual do canvas
  function getCellSize() {
    return canvas.width / SIZE;
  }

  // Cria os botões para altura e base dinamicamente
  function createRangeButtons() {
    heightButtonsDiv.innerHTML = '';
    baseButtonsDiv.innerHTML = '';

    for (let i = 1; i <= SIZE; i++) {
      const hBtn = document.createElement('button');
      hBtn.textContent = i;
      hBtn.className = 'btn btn-sm btn-outline-primary size-btn';
      hBtn.dataset.h = i;
      hBtn.addEventListener('click', () => {
        if (running) return;
        altura = i;
        if (base < altura) base = altura;
        updateRangeButtons();
        drawGrid();
      });
      heightButtonsDiv.appendChild(hBtn);

      const bBtn = document.createElement('button');
      bBtn.textContent = i;
      bBtn.className = 'btn btn-sm btn-outline-primary size-btn';
      bBtn.dataset.b = i;
      bBtn.addEventListener('click', () => {
        if (running) return;
        base = i;
        if (base < altura) base = altura;
        updateRangeButtons();
        drawGrid();
      });
      baseButtonsDiv.appendChild(bBtn);
    }
    updateRangeButtons();
  }

  // Atualiza o visual dos botões para refletir altura/base selecionados
  function updateRangeButtons() {
    [...heightButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('btn-primary', parseInt(btn.dataset.h) === altura);
      btn.classList.toggle('btn-outline-primary', parseInt(btn.dataset.h) !== altura);
    });
    [...baseButtonsDiv.children].forEach(btn => {
      btn.classList.toggle('btn-primary', parseInt(btn.dataset.b) === base);
      btn.classList.toggle('btn-outline-primary', parseInt(btn.dataset.b) !== base);
    });

    const activeHeightLabel = document.getElementById('activeHeightLabel');
    if (activeHeightLabel) activeHeightLabel.textContent = `${altura} .. ${base}`;
  }

  // Verifica se a linha y está dentro da faixa ativa (altura..base)
  function isRowActive(y) {
    return (y >= (altura - 1) && y <= (base - 1));
  }

  // Desenha o grid no canvas, com a faixa ativa destacada
  function drawGrid() {
    resizeCanvas();
    const cellSize = getCellSize();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const idx = y * SIZE + x;
        // Cor do quadrado: verde se ligado, branco se desligado
        ctx.fillStyle = gridState[idx] ? '#2ecc71' : '#fff';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);

        // Borda da célula
        ctx.strokeStyle = '#ccc';
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // Destacar faixa ativa com uma camada semi-transparente
    ctx.fillStyle = 'rgba(255, 99, 71, 0.3)';
    const yStart = (altura - 1) * cellSize;
    const heightPx = (base - altura + 1) * cellSize;
    ctx.fillRect(0, yStart, SIZE * cellSize, heightPx);
  }

  // Converte o estado da matriz para hexadecimal, considerando só a faixa ativa
  function gridToHex() {
    const bits = [];
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        if (isRowActive(y)) {
          bits.push(gridState[y * SIZE + x] ? '1' : '0');
        } else {
          bits.push('0');
        }
      }
    }
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byteStr = bits.slice(i, i + 8).join('');
      bytes.push(parseInt(byteStr, 2));
    }
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // SHA-256 via Web Crypto API
  async function sha256(buffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return new Uint8Array(hashBuffer);
  }

  const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

  // Base58 encode de Uint8Array
  function base58Encode(buffer) {
    let intVal = 0n;
    for (const b of buffer) {
      intVal = (intVal << 8n) + BigInt(b);
    }
    let str = '';
    while (intVal > 0n) {
      const mod = intVal % 58n;
      intVal /= 58n;
      str = BASE58_ALPHABET[Number(mod)] + str;
    }
    // Preservar zeros iniciais
    for (const b of buffer) {
      if (b === 0) str = '1' + str;
      else break;
    }
    return str;
  }

  function hexStringToUint8Array(hex) {
    const arr = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      arr[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return arr;
  }

  // Converte chave privada em WIF (Wallet Import Format)
  async function privateKeyToWIF(hexKey, compressed = true) {
    const keyBytes = hexStringToUint8Array(hexKey);
    let payload;

    if (compressed) {
      payload = new Uint8Array(1 + 32 + 1);
      payload[0] = 0x80;            // prefixo mainnet
      payload.set(keyBytes, 1);
      payload[33] = 0x01;           // byte extra para chave comprimida
    } else {
      payload = new Uint8Array(1 + 32);
      payload[0] = 0x80;
      payload.set(keyBytes, 1);
    }

    const hash1 = await sha256(payload);
    const hash2 = await sha256(hash1);
    const checksum = hash2.slice(0, 4);

    const full = new Uint8Array(payload.length + 4);
    full.set(payload);
    full.set(checksum, payload.length);

    return base58Encode(full);
  }

  // Atualiza os campos de saída hex e WIF
  async function updateKeyOutputs() {
    const hex = gridToHex();
    const wifC = await privateKeyToWIF(hex, true);
    const wifU = await privateKeyToWIF(hex, false);

    if (hexBox) {
      hexBox.value += hex + '\n';
      hexBox.scrollTop = hexBox.scrollHeight;
    }
    if (wifBox) {
      wifBox.value += wifC + '\n';
      wifBox.scrollTop = wifBox.scrollHeight;
    }
    if (wifBoxUncompressed) {
      wifBoxUncompressed.value += wifU + '\n';
      wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
    }
  }

  // Randomiza os bits dentro da faixa ativa
  function randomizeRange() {
    for (let y = altura - 1; y <= base - 1; y++) {
      for (let x = 0; x < SIZE; x++) {
        gridState[y * SIZE + x] = Math.random() < 0.5;
      }
    }
    drawGrid();
    updateKeyOutputs();
  }

  // Limpa toda a matriz e as saídas
  function clearAll() {
    gridState.fill(false);
    drawGrid();
    if (hexBox) hexBox.value = '';
    if (wifBox) wifBox.value = '';
    if (wifBoxUncompressed) wifBoxUncompressed.value = '';
  }

  // Obtem o máximo contador baseado na faixa ativa
  function getMaxCounter() {
    const rows = base - altura + 1;
    return 1n << BigInt(rows * SIZE);
  }

  // Atualiza o gridState a partir do contador
  function setGridFromCounter(counter) {
    const rows = base - altura + 1;
    const totalBits = rows * SIZE;

    for (let i = 0; i < totalBits; i++) {
      const bit = (counter >> BigInt(totalBits - 1 - i)) & 1n;
      const row = Math.floor(i / SIZE);
      const col = i % SIZE;
      const y = (altura - 1) + row;
      gridState[y * SIZE + col] = bit === 1n;
    }

    // Zerar fora da faixa ativa
    for (let y = 0; y < SIZE; y++) {
      if (!isRowActive(y)) {
        for (let x = 0; x < SIZE; x++) {
          gridState[y * SIZE + x] = false;
        }
      }
    }
  }

  // Variável para contador do estado (BigInt)
  let stateCounter = 0n;

  // Lógica para avançar o contador de acordo com o modo
  async function step() {
    if (!running) return;

    const mode = Array.from(modeRadios).find(r => r.checked)?.value || 'increment';

    if (mode === 'increment') {
      stateCounter++;
      if (stateCounter >= getMaxCounter()) {
        stateCounter = 0n;
      }
      setGridFromCounter(stateCounter);
    } else if (mode === 'random') {
      randomizeRange();
    }

    drawGrid();
    await updateKeyOutputs();

    // Se randomizar estado a cada passo está ativo, randomiza bits da faixa
    if (randomizeOnStepCheckbox?.checked) {
      randomizeRange();
    }

    timeoutId = setTimeout(step, parseInt(speedInput.value, 10));
  }

  // Eventos do canvas: clique para ligar/desligar célula se toggleOnClick ativado
  canvas.addEventListener('click', (ev) => {
    if (!toggleOnClickCheckbox?.checked) return;
    if (running) return;

    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const cellSize = getCellSize();

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;

    // Só permite alterar dentro da faixa ativa
    if (!isRowActive(row)) return;

    const idx = row * SIZE + col;
    gridState[idx] = !gridState[idx];

    drawGrid();
  });

  // Botões start/stop
  startBtn?.addEventListener('click', () => {
    if (running) return;
    running = true;
    step();
  });

  stopBtn?.addEventListener('click', () => {
    running = false;
    if (timeoutId) clearTimeout(timeoutId);
  });

  clearBtn?.addEventListener('click', () => {
    if (running) return;
    clearAll();
  });

  randBtn?.addEventListener('click', () => {
    if (running) return;
    randomizeRange();
  });

  speedInput?.addEventListener('input', () => {
    speedLabel.textContent = speedInput.value + ' ms';
  });

  // Inicialização
  createRangeButtons();
  clearAll();
  resizeCanvas();
  speedLabel.textContent = speedInput.value + ' ms';

  // Redimensionar canvas quando janela mudar tamanho
  window.addEventListener('resize', () => {
    drawGrid();
  });
});
