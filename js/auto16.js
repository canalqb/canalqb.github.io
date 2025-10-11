/* auto16.js
   Implementação completa e funcional:
   - grade 16x16 em canvas
   - conversão grid -> 256 bits -> HEX (32 bytes = 64 hex chars)
   - geração WIF (compressed & uncompressed) via SHA-256 duplo + Base58
   - controles: iniciar/parar, limpar, aleatorizar, velocidade, modo (sequential/random),
     clique alterna célula, aleatorizar estados no passo, seleção de altura (1..16)
*/

(() => {
  // Config
  const GRID_SIZE = 16;
  const CANVAS_PX = 512; // width/height
  const cellPx = CANVAS_PX / GRID_SIZE;

  // Estado
  let grid = Array.from({length: GRID_SIZE}, ()=>Array.from({length:GRID_SIZE},()=>0));
  let activeHeight = 16; // 1..16
  let running = false;
  let tickTimer = null;
  let currentHeightSequence = [];
  let outerIndex = 0;
  let cellIndex = 0;

  // DOM
  const canvas = document.getElementById('grid');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');
  const speedInput = document.getElementById('speed');
  const speedLabel = document.getElementById('speedLabel');
  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');
  const activeHeightLabel = document.getElementById('activeHeightLabel');
  const heightButtonsContainer = document.getElementById('heightButtons');
  const toggleOnClick = document.getElementById('toggleOnClick');
  const randomizeStatesOnStep = document.getElementById('randomizeStatesOnStep');

  // Inicialização
  function init() {
    // Ajusta canvas para tamanho definido
    canvas.width = CANVAS_PX;
    canvas.height = CANVAS_PX;
    // Cria botões de altura 1..16
    for (let h=1; h<=16; h++) {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-primary size-btn';
      btn.textContent = `${h}x16`;
      btn.dataset.h = h;
      btn.addEventListener('click', ()=>{
        activeHeight = h;
        activeHeightLabel.textContent = activeHeight;
        render();
      });
      heightButtonsContainer.appendChild(btn);
    }

    // Eventos
    canvas.addEventListener('click', canvasClickHandler);
    clearBtn.addEventListener('click', handleClear);
    randBtn.addEventListener('click', handleRandomize);
    startBtn.addEventListener('click', start);
    stopBtn.addEventListener('click', stop);
    speedInput.addEventListener('input', handleSpeedChange);

    // modos radio: já existem no DOM; não precisamos de listener global para leitura
    // Render inicial
    render();
  }

  // Render da grade
  function render() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for (let r=0; r<GRID_SIZE; r++) {
      for (let c=0; c<GRID_SIZE; c++) {
        // linhas com índice >= GRID_SIZE - activeHeight são "ativas"
        const isInActive = (r >= (GRID_SIZE - activeHeight));
        ctx.fillStyle = grid[r][c] ? '#333' : '#fff';
        // deixar linhas fora da altura um pouco esmaecidas
        if (!isInActive) {
          ctx.fillStyle = grid[r][c] ? '#bbb' : '#f6f6f6';
        }
        ctx.fillRect(c*cellPx, r*cellPx, cellPx, cellPx);
        ctx.strokeStyle = isInActive ? '#bbb' : '#eee';
        ctx.strokeRect(c*cellPx, r*cellPx, cellPx, cellPx);
      }
    }
    // Atualiza campos de saída
    const hex = gridToHex();
    hexBox.value = hex;
    // converte para WIFs (assincrono)
    convertToWIF(hex).then(([wifC, wifU])=>{
      wifBox.value = wifC;
      wifBoxUncompressed.value = wifU;
    }).catch((e)=>{
      wifBox.value = ''; wifBoxUncompressed.value = '';
      console.error('Erro convertToWIF', e);
    });
  }

  // Canvas click handler
  function canvasClickHandler(ev) {
    if (!toggleOnClick.checked) return;
    const rect = canvas.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const y = ev.clientY - rect.top;
    const c = Math.floor(x / cellPx);
    const r = Math.floor(y / cellPx);
    if (r>=0 && r<GRID_SIZE && c>=0 && c<GRID_SIZE) {
      grid[r][c] = grid[r][c] ? 0 : 1;
      render();
    }
  }

  // Limpar
  function handleClear() {
    grid = Array.from({length: GRID_SIZE}, ()=>Array.from({length:GRID_SIZE},()=>0));
    render();
  }

  // Aleatorizar toda a grade
  function handleRandomize() {
    for (let r=0; r<GRID_SIZE; r++) {
      for (let c=0; c<GRID_SIZE; c++) {
        grid[r][c] = Math.random() > 0.5 ? 1 : 0;
      }
    }
    render();
  }

  // Velocidade
  function handleSpeedChange() {
    speedLabel.textContent = speedInput.value;
    // se estiver rodando, reinicia ciclo para aplicar novo intervalo
    if (running) {
      // para e reinicia (mantendo sequência)
      stop(false);
      start();
    }
  }

  function getSelectedMode() {
    const radios = document.getElementsByName('mode');
    for (const r of radios) if (r.checked) return r.value;
    return 'sequential';
  }

  // Converte grid -> binary string (256 bits)
  // Ordem: percorre linhas r=0..15 e cols c=0..15; primeiro bit produzido => MSB (bit 255)
  function gridToBinaryString() {
    let bits = '';
    for (let r=0; r<GRID_SIZE; r++) {
      for (let c=0; c<GRID_SIZE; c++) {
        bits += grid[r][c] ? '1' : '0';
      }
    }
    // bits[0] => MSB, bits[255] => LSB
    if (bits.length !== 256) bits = bits.padStart(256,'0');
    return bits;
  }

  // binary string to hex (64 hex chars = 32 bytes)
  function binaryStringToHex(bin) {
    if (bin.length !== 256) bin = bin.padStart(256,'0');
    // usa BigInt
    let n = 0n;
    for (let i=0; i<bin.length; i++) {
      n = (n << 1n) + (bin[i] === '1' ? 1n : 0n);
    }
    return n.toString(16).padStart(64,'0');
  }

  function gridToHex() {
    const bin = gridToBinaryString();
    return binaryStringToHex(bin);
  }

  // Helpers: hex <-> bytes
  function hexToBytes(hex) {
    const clean = hex.replace(/[^0-9a-fA-F]/g,'').padStart(64,'0');
    const bytes = new Uint8Array(clean.length/2);
    for (let i=0; i<clean.length; i+=2) {
      bytes[i/2] = parseInt(clean.substr(i,2),16);
    }
    return bytes;
  }

  function concat(a,b) {
    const c = new Uint8Array(a.length + b.length);
    c.set(a,0); c.set(b,a.length);
    return c;
  }

  // SHA-256 double usando Web Crypto
  async function doubleSha256(bytes) {
    const single = await crypto.subtle.digest('SHA-256', bytes);
    const double = await crypto.subtle.digest('SHA-256', single);
    return new Uint8Array(double);
  }

  // Base58 (Bitcoin alphabet)
  const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  function base58Encode(buffer) {
    // buffer: Uint8Array
    let x = 0n;
    for (let i=0; i<buffer.length; i++) {
      x = (x << 8n) + BigInt(buffer[i]);
    }
    let result = '';
    while (x > 0n) {
      const mod = x % 58n;
      result = B58_ALPHABET[Number(mod)] + result;
      x = x / 58n;
    }
    // leading zeros -> '1'
    for (let i=0;i<buffer.length && buffer[i]===0;i++) result = '1' + result;
    return result || '1';
  }

  // Gera WIF compressed / uncompressed a partir do hex (32 bytes)
  async function convertToWIF(hex) {
    try {
      const keyBytes = hexToBytes(hex); // 32 bytes
      // Uncompressed: 0x80 + key
      const prefix = new Uint8Array([0x80]);
      const unprefixed = concat(prefix, keyBytes);
      const uncheck = await doubleSha256(unprefixed);
      const uncrc = uncheck.slice(0,4);
      const unpayload = concat(unprefixed, uncrc);
      const wifUncompressed = base58Encode(unpayload);

      // Compressed: 0x80 + key + 0x01
      const compressedFlag = new Uint8Array([0x01]);
      const compPref = concat(prefix, keyBytes);
      const compWithFlag = concat(compPref, compressedFlag);
      const check = await doubleSha256(compWithFlag);
      const crc = check.slice(0,4);
      const payload = concat(compWithFlag, crc);
      const wifCompressed = base58Encode(payload);

      return [wifCompressed, wifUncompressed];
    } catch (e) {
      console.error('convertToWIF erro:', e);
      return ['', ''];
    }
  }

  // ================= Automation (start/stop) =================
  function start() {
    if (running) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // prepara sequência de alturas: padrão 9..16
    const baseHeights = [9,10,11,12,13,14,15,16];
    const mode = getSelectedMode();
    currentHeightSequence = mode === 'random' ? shuffleArray(baseHeights) : [...baseHeights];
    outerIndex = 0;
    cellIndex = 0;

    // inicia ciclo para primeira altura
    activeHeight = currentHeightSequence[outerIndex];
    activeHeightLabel.textContent = activeHeight;
    // constrói lista de cells a percorrer dentro da altura
    startCellLoopForHeight(activeHeight);
  }

  function stop(clearTimer=true) {
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (clearTimer && tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }
  }

  function startCellLoopForHeight(h) {
    // cria array cells {r,c} para linhas 0..h-1 (note: earlier conventions allowed rows 0..h-1)
    const cells = [];
    for (let r=0;r<h;r++) {
      for (let c=0;c<GRID_SIZE;c++) {
        cells.push({r,c});
      }
    }
    // decide ordem
    const mode = getSelectedMode();
    if (mode === 'random') shuffleArrayInPlace(cells);

    // we'll use closure indexes
    let i = 0;
    const step = async () => {
      if (!running) return;
      // optionally randomize some states inside active height
      if (randomizeStatesOnStep.checked) {
        for (let rr=0; rr<h; rr++) {
          for (let cc=0; cc<GRID_SIZE; cc++) {
            if (Math.random() < 0.05) grid[rr][cc] = 1 - grid[rr][cc];
          }
        }
      }

      // toggle current cell
      const cell = cells[i];
      grid[cell.r][cell.c] = grid[cell.r][cell.c] ? 0 : 1;
      render();

      i++;
      if (i >= cells.length) {
        // altura finalizada, passa para próxima altura
        outerIndex++;
        if (outerIndex >= currentHeightSequence.length) {
          // full cycle completed
          outerIndex = 0;
          if (getSelectedMode() === 'random') currentHeightSequence = shuffleArray([...currentHeightSequence]);
        }
        // atualiza activeHeight para próximo
        const nextH = currentHeightSequence[outerIndex];
        activeHeight = nextH;
        activeHeightLabel.textContent = activeHeight;
        // schedule start of next height after delay
        tickTimer = setTimeout(()=> {
          if (running) startCellLoopForHeight(nextH);
        }, Number(speedInput.value));
      } else {
        // schedule next cell toggle
        tickTimer = setTimeout(step, Number(speedInput.value));
      }
    };

    // inicia ticks
    step();
  }

  // Util: shuffle
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i=a.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function shuffleArrayInPlace(a) {
    for (let i=a.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Inicializa
  document.addEventListener('DOMContentLoaded', ()=>init());

  // Expose debugging helpers
  window.__auto16 = {
    getGrid: ()=>grid,
    setGrid: (g)=>{ grid = g; render(); },
    gridToHex: ()=>gridToHex(),
    start, stop, render
  };

})();
