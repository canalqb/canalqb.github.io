/**
 * =====================================================
 * AUTO16-PRESET.JS - MOTOR DE EXECUÇÃO COM PRESETS
 * =====================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  let presetRunning = false;
  let presetInterval = null;
  let presetStateCounter= 0n;
  let presetRealValue = 0n;
  
  // ============================================
  // NOVO SISTEMA DE RANDOMIZAÇÃO ON/OFF PROGRESSIVO
  // ============================================
  let randomCyclePhase = 'ascending'; // 'ascending' (1%→99%) ou 'descending' (98%→1%)
  let currentRandomPercent= 1; // Começa em 1%
  let randomCycleSequence = []; // Sequência pré-calculada para randomização
  let currentCycleIndex = 0; // Índice atual na sequência
  let useRandomMode = false; // true = aleatório, false = sequencial
  
  // 🎯 NOVO: SISTEMA DE PROGRESSÃO ACUMULATIVA CONFIGURÁVEL (variáveis ajustáveis via UI)
  window.minCellPercent = 0.001;  // Mínimo configurável (padrão: 0.001%)
  window.maxCellPercent = 99.999; // Máximo configurável (padrão: 99.999%)
  let horizontalCellCount = 1; // Começa com 1 célula
  let verticalCellCount = 1;   // Começa com 1 célula
  const MAX_CELLS = 99;        // Máximo de células antes de reiniciar
  
  /**
  * Gera sequência de ciclos de randomização
  * Ex: [1, 2, 3, ..., 99, 98, 97, ..., 2] embaralhado
  */
  function generateRandomCycleSequence() {
  const sequence = [];
     
   // Fase ascendente: 1% até 99%
   for (let i = 1; i <= 99; i++) {
     sequence.push(i);
   }
     
   // Fase descendente: 98% até 1%
   for (let i = 98; i >= 1; i--) {
     sequence.push(i);
   }
     
   // Embaralha a sequência usando Fisher-Yates shuffle
   for (let i = sequence.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i +1));
     [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
   }
     
   return sequence;
  }
  
  /**
  * Atualiza estado de randomização ON/OFF
  * Determina se próximo passo é aleatório ou sequencial
  */
  function updateRandomOnOffState() {
   // Se sequência está vazia ou chegou ao fim, gera nova sequência
   if (randomCycleSequence.length === 0 || currentCycleIndex >= randomCycleSequence.length) {
     randomCycleSequence = generateRandomCycleSequence();
     currentCycleIndex = 0;
    console.log('🎲 Nova sequência de randomização gerada:', randomCycleSequence.slice(0, 10), '...');
   }
     
   // Pega porcentagem atual da sequência
   currentRandomPercent = randomCycleSequence[currentCycleIndex];
   currentCycleIndex++;
     
   // Determina se usa modo aleatório baseado na porcentagem
  const randomThreshold = Math.random() * 100;
   useRandomMode = randomThreshold < currentRandomPercent;
     
  console.log(`🎯 Random ON/OFF: ${currentRandomPercent}% chance → ${useRandomMode ? 'ALEATÓRIO' : 'SEQUENCIAL'}`);
  }
  
  /**
   * 🎯 NOVO: Converte porcentagem para número de células
   * Ex: 0.001% = 1 célula, 50% = 50 células, 99.999% = 99 células
   * ALTA PRECISÃO: Suporta 16+ casas decimais
   */
  function convertPercentToCells(percent) {
    // Mapeia porcentagem (0.0000000000000001-100) para células (1-99)
    const minPercent = 0.0000000000000001; // Suporta até 16 casas decimais
    const maxPercent = 100.0;
    const minCells = 1;
    const maxCells = 99;
    
    // Normaliza porcentagem para range 0-1
    const normalized = (percent - minPercent) / (maxPercent - minPercent);
    
    // Mapeia para número de células (arredonda para baixo)
    const cells = Math.floor(normalized * (maxCells - minCells + 1)) + minCells;
    
    return Math.min(Math.max(cells, minCells), maxCells); // Garante 1-99
  }
  
  // Variáveis do range
  let dbInicio = null;
  let dbFim = null;
  let currentInicio = null;
  let currentFim = null;
  let currentHex = '';

  let linhasProcessadas = 0;
  let vezesAjudadas = 0;
  let startTime = null;

  const LINHAS_POR_ATUALIZACAO = 1000;
  let isSyncing = false;

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  function hexToBigInt(hex) {
    if (!hex) return 0n;
    return BigInt('0x' + hex.replace(/^0x/, ''));
  }

  function bigIntToHex(bn) {
    return bn.toString(16);
  }

  function getMode() {
    return document.querySelector('input[name="mode"]:checked').value;
  }

  /* =====================================================
     LÓGICA DE EXECUÇÃO
     ===================================================== */

  async function presetStep() {
    if (!window.presetManager || !currentInicio) {
      if (!window.presetManager) console.warn('❌ Preset Manager não encontrado');
      if (!currentInicio) console.warn('❌ currentInicio não definido');
      return;
    }

    const presetBits = window.presetManager.getCurrentBits();
    const mode = getMode();
    let matrixValue = 0n;
    let keysToProcess = [];

    if (mode === 'horizontal') {
      // 🚀 LÓGICA DE PINÇA (CONVERGÊNCIA)
      const startVal = hexToBigInt(currentInicio);
      const endVal = hexToBigInt(currentFim);

      // Para se os ponteiros se cruzarem (intervalo esgotado)
      if (startVal >= endVal) {
        console.log('🏁 [PINÇA] O intervalo se encontrou. Busca concluída.');
        stopPreset();
        return;
      }

      // Adiciona AMBOS os valores para processamento (Pinça Real)
      const keyInicio = bigIntToHex(startVal);
      const keyFim = bigIntToHex(endVal);
      
      keysToProcess.push(keyInicio);
      keysToProcess.push(keyFim);

      // Atualiza os ponteiros para o PRÓXIMO passo
      currentInicio = bigIntToHex(startVal + 1n);
      currentFim = bigIntToHex(endVal - 1n);

      // A matriz reflete o avanço do início
      matrixValue = startVal - (1n << BigInt(presetBits));

      // Atualiza UI de Progresso (Lote de 1000)
      updateProgressUI(linhasProcessadas);

      if (linhasProcessadas >= LINHAS_POR_ATUALIZACAO && !isSyncing) {
        updateDatabase(Number(presetBits));
      }
    }
    else if (mode === 'vertical') {
      // 🎯 MODO VERTICAL COM PRESET
      const offset = presetStateCounter;
      let baseHex = currentInicio || '0';

      // Garante que o gerenciador vertical esteja pronto
      if (!window.verticalManagerInstance && window.VerticalProgressManager) {
        window.verticalManagerInstance = new window.VerticalProgressManager();
      }

      if (window.matrizAPI) {
        const activeCells = window.matrizAPI.getActiveCellsVertical();
        const totalCells = activeCells.length;
        const binary = offset.toString(2).padStart(totalCells, '0');

        const sortedCells = [...activeCells].sort((a, b) => {
          if (a.col !== b.col) return b.col - a.col;
          return b.row - a.row;
        });

        const newGridState = Array(256).fill(false);
        for (let i = 0; i < totalCells; i++) {
          const cell = sortedCells[i];
          const bitValue = binary[totalCells - 1 - i] === '1';
          newGridState[cell.row * 16 + cell.col] = bitValue;
        }
        window.matrizAPI.setGridState(newGridState);

        let decimalValue = 0n;
        for (let row = 0; row < 16; row++) {
          for (let col = 0; col < 16; col++) {
            const idx = row * 16 + col;
            if (newGridState[idx]) {
              const bit_index = (16 - (row + 1)) * 16 + (16 - (col + 1));
              decimalValue |= (1n << BigInt(bit_index));
            }
          }
        }

        const baseValue = BigInt('0x' + baseHex);
        const finalValue = baseValue + decimalValue;
        currentHex = finalValue.toString(16).padStart(64, '0');

        // Adiciona o valor vertical original
        keysToProcess.push(currentHex);

        // 🚀 ESPELHAMENTO VERTICAL (Relativo ao Intervalo do Preset)
        if (window.verticalManagerInstance) {
          const mirrorStartHex = dbInicio || (1n << BigInt(presetBits)).toString(16);
          const mirrorEndHex = dbFim || ((1n << (BigInt(presetBits) + 1n)) - 1n).toString(16);
          const invertedHex = window.verticalManagerInstance.calculateInverse(currentHex, mirrorStartHex, mirrorEndHex);
          if (invertedHex && invertedHex !== currentHex) {
            keysToProcess.push(invertedHex);
          }
        }
      } else {
        const baseValue = BigInt('0x' + baseHex);
        currentHex = (baseValue + BigInt(offset)).toString(16).padStart(64, '0');
        keysToProcess.push(currentHex);
      }

      matrixValue = offset;
      presetStateCounter++;

      // 🚀 VERIFICAÇÃO DE PARADA ANTES DO PROCESSAMENTO DAS CHAVES
      if (window.matrizAPI) {
        const totalCells = window.matrizAPI.getActiveCellsVertical().length;
        const maxComb = 1n << BigInt(totalCells);
        if (presetStateCounter > maxComb) { // Mudado para > para processar a última chave
          stopPreset();
          return;
        }
      }
    }
    else if (mode === 'randomize' || mode === 'randomize_h' || mode === 'randomize_v') {
      const bitsNum = Number(presetBits || 0n);
      const subMode = mode === 'randomize_v' ? 'vertical' : 'horizontal';
      let startHex = null;
      let endHex = null;

      if (window.matrizAPI && typeof window.matrizAPI.getInitHexFromCard === 'function') {
        startHex = window.matrizAPI.getInitHexFromCard(subMode);
        endHex = window.matrizAPI.getEndHexFromCard(subMode);
      }

      if (!startHex || !endHex) {
        startHex = currentInicio || (1n << BigInt(bitsNum)).toString(16);
        endHex = currentFim || ((1n << (BigInt(bitsNum) + 1n)) - 1n).toString(16);
      }

      const startVal = BigInt('0x' + startHex);
      const endVal = BigInt('0x' + endHex);
      const span = endVal > startVal ? (endVal - startVal + 1n) : 1n;

      const densities = [0.3, 0.7, 0.4, 0.6, 0.5];
      const density = densities[Math.floor(Number(presetStateCounter % 5n))];
      const targetPoint = startVal + (span * BigInt(Math.floor(density * 1000))) / 1000n;
      const windowSize = span / 20n;
      let rndOffset = (BigInt(Math.floor(Math.random() * 0x7FFFFFFF)) << 32n) | BigInt(Math.floor(Math.random() * 0x7FFFFFFF));
      rndOffset = rndOffset % (windowSize > 0n ? windowSize : 1n);

      let val = targetPoint + (rndOffset - windowSize / 2n);
      if (val < startVal) val = startVal;
      if (val > endVal) val = endVal;

      // 🚀 PROCESSA O PAR (RANDOM + ESPELHO)
      const mirrorVal = startVal + (endVal - val);
      
      const key1 = val.toString(16).padStart(64, '0');
      const key2 = mirrorVal.toString(16).padStart(64, '0');

      keysToProcess.push(key1);
      if (key1 !== key2) {
        keysToProcess.push(key2);
      }

      currentHex = key1; // Matriz reflete o primeiro valor
      const base = 1n << BigInt(bitsNum);
      matrixValue = val - base >= 0n ? (val - base) : 0n;
      presetStateCounter++;
    }

    // 🚀 PROCESSAMENTO DE TODAS AS CHAVES COLETADAS NO PASSO
    const numKeys = keysToProcess.length;
    linhasProcessadas += numKeys;

    if (numKeys > 0) {
      await updatePresetOutputBatch(keysToProcess, matrixValue);
    }

    // 🚀 PERSISTÊNCIA E UI (Pós-incremento)
    if (mode === 'vertical') {
      if (linhasProcessadas >= 1000 && window.verticalManagerInstance) {
        const startRangeHex = (1n << BigInt(presetBits)).toString(16);
        const endRangeHex = ((1n << (BigInt(presetBits) + 1n)) - 1n).toString(16);
        const mirrorHex = window.verticalManagerInstance.calculateInverse(currentHex, startRangeHex, endRangeHex) || endRangeHex;
        
        window.verticalManagerInstance.setCurrentPreset(Number(presetBits), currentHex, mirrorHex);
        await window.verticalManagerInstance.saveVerticalProgress(currentHex, linhasProcessadas);
        
        // Reseta contador após salvar (como no horizontal)
        linhasProcessadas = 0; 
        vezesAjudadas++;
        updateVerticalProgressUI(0);
        
        window.dispatchEvent(new CustomEvent('progressUpdated', { detail: { preset: Number(presetBits) } }));
      } else {
        updateVerticalProgressUI(linhasProcessadas);
      }
    }

    // Atualiza Matriz apenas uma vez
    if (mode === 'randomize' || mode === 'randomize_h' || mode === 'randomize_v') {
      updatePresetMatrix(matrixValue, mode === 'randomize_v' ? 'vertical' : 'horizontal');
    } else {
      updatePresetMatrix(matrixValue, mode);
    }
    
    if (window.matrizAPI) window.matrizAPI.draw();

    // Check stop conditions
    if (mode !== 'randomize' && mode !== 'randomize_h' && mode !== 'randomize_v') {
      const rangeStart = 1n << BigInt(presetBits);
      const startOff = hexToBigInt(currentInicio) - rangeStart;
      if (window.presetManager.shouldStop(startOff, presetBits)) {
        stopPreset();
      }
    }
  }

  /**
   * Atualiza a interface com um lote de chaves encontradas (Modo Pinça/Espelho)
   */
  async function updatePresetOutputBatch(hexList, matrixValue) {
    if (!hexBox || !hexList || hexList.length === 0) return;

    const currentMode = getMode();
    const startTimeLocal = startTime;
    const linesTotal = linhasProcessadas;

    // 1. Atualiza HEX Box
    const hexLines = hexBox.value.trim().split('\n').filter(l => l.trim());
    for (const hex of hexList) {
      const cleanHex = hex.replace(/^0+/, '') || '0';
      if (!hexLines.includes(cleanHex)) {
        hexLines.push(cleanHex);
      }
    }
    
    // Log para depuração de espelhamento
    if (hexList.length > 1) {
      console.log(`🔄 [ESPELHAMENTO] Processando par: ${hexList[0]} | ${hexList[1]}`);
    }
    if (hexLines.length > 100) hexLines.splice(0, hexLines.length - 100);
    hexBox.value = hexLines.join('\n');
    hexBox.scrollTop = hexBox.scrollHeight;

    // 2. Processa cada chave (WIF e Verificação)
    for (const hex of hexList) {
      const paddedHex = hex.padStart(64, '0');

      // Gera WIFs (Comprimida e Não Comprimida)
      if (window.toWIF) {
        const wifC = await window.toWIF(paddedHex, true);
        const wifU = await window.toWIF(paddedHex, false);

        // 🚀 ATUALIZA UI (Histórico de 100 linhas no topo)
        if (window.matrizAPI) {
          if (hexBox) window.matrizAPI.addTextareaHistory(hexBox, paddedHex);
          if (wifBox) window.matrizAPI.addTextareaHistory(wifBox, wifC);
          if (wifBoxUncompressed) window.matrizAPI.addTextareaHistory(wifBoxUncompressed, wifU);
        } else {
          // Fallback se matrizAPI não carregar
          if (hexBox) hexBox.value = [paddedHex, ...hexBox.value.split('\n')].slice(0, 100).join('\n');
          if (wifBox) wifBox.value = [wifC, ...wifBox.value.split('\n')].slice(0, 100).join('\n');
          if (wifBoxUncompressed) wifBoxUncompressed.value = [wifU, ...wifBoxUncompressed.value.split('\n')].slice(0, 100).join('\n');
        }

        // 🥚 EGGS HUNTER: Adiciona WIFs para verificação de saldo em tempo real
        if (window.EggsHunter) {
          if (wifC && wifC !== 'Erro_Conversao') {
            window.EggsHunter.addWif(wifC, true);
          }
          if (wifU && wifU !== 'Erro_Conversao') {
            window.EggsHunter.addWif(wifU, false);
          }
        }
      }

      // Verificação de Vencedor
      if (window.checkTargetWallet) {
        window.checkTargetWallet(paddedHex, {
          mode: currentMode,
          startTime: startTimeLocal,
          linesProcessed: linesTotal,
          matrixCoordinates: matrixValue ? { value: matrixValue.toString() } : null
        });
      }
    }
  }

  function updatePresetMatrixRandom() {
    if (!window.matrizAPI) return;
    const mode = getMode();
    const activeCells = mode === 'vertical' ? window.matrizAPI.getActiveCellsVertical() : window.matrizAPI.getActiveCells();
    const newGrid = Array(256).fill(false);
    for (const cell of activeCells) {
      if (Math.random() < 0.5) newGrid[cell.row * 16 + cell.col] = true;
    }
    window.matrizAPI.setGridState(newGrid);
  }

  function updatePresetMatrix(value, mode) {
    if (!window.matrizAPI) return;
    const activeCells = mode === 'vertical' ? window.matrizAPI.getActiveCellsVertical() : window.matrizAPI.getActiveCells();
    const totalCells = activeCells.length;
    const binary = value.toString(2).padStart(totalCells, '0');

    const sortedCells = mode === 'vertical'
      ? [...activeCells].sort((a, b) => {
        if (a.col !== b.col) return b.col - a.col;
        return b.row - a.row;
      })
      : [...activeCells].sort((a, b) => {
        if (a.row !== b.row) return b.row - a.row;
        return b.col - a.col;
      });

    const newGrid = Array(256).fill(false);
    for (let i = 0; i < totalCells && i < sortedCells.length; i++) {
      const cell = sortedCells[i];
      const bitValue = binary[binary.length - 1 - i] === '1';
      newGrid[cell.row * 16 + cell.col] = bitValue;
    }
    window.matrizAPI.setGridState(newGrid);
  }

  /* =====================================================
     BANCO DE DADOS
     ===================================================== */

  async function loadFromDatabase(preset) {
    if (!window.SupabaseDB) return null;
    return await window.SupabaseDB.fetch(preset);
  }

  async function updateDatabase(preset) {
    if (!window.SupabaseDB || !currentInicio || !currentFim || isSyncing) return;
    
    // 🚀 SEGURANÇA: Não salvar se o modo não for horizontal sequencial
    const mode = getMode();
    if (mode !== 'horizontal') {
      console.log('ℹ️ [DB] Modo não sequencial horizontal - pulando sincronização');
      return;
    }

    isSyncing = true; // Ativa trava
    const loopLinhas = linhasProcessadas; // Guarda valor atual
    linhasProcessadas = 0; // Reseta IMEDIATAMENTE antes da rede

    try {
      await window.SupabaseDB.update(preset, currentInicio, currentFim);
      console.log(`💾 [DB] Lote sincronizado: Início ${currentInicio}, Fim ${currentFim}`);
      vezesAjudadas++;

      // Sincroniza com contador global
      if (window.WalletCounter) {
        window.WalletCounter.increment();
      }

      updateProgressUI(0);

      // 🚀 ATUALIZA OS CARDS DE STATUS NA PÁGINA (INI/FIM)
      window.dispatchEvent(new CustomEvent('progressUpdated', {
         detail: { preset: preset }
      }));
    } catch (e) {
      console.error('Erro DB Update:', e);
      linhasProcessadas = loopLinhas; // Restaura em caso de erro
    } finally {
      isSyncing = false; // Libera trava
    }
  }

  /* =====================================================
     INTERFACE
     ===================================================== */

  function createProgressModal() {
    let modal = document.getElementById('preset-progress-modal');
    if (modal) modal.remove();

    const mode = getMode();
    const isSequential = mode === 'horizontal';
    const title = isSequential ? 'Sincronizando com Banco — Sequencial (H)' : 'Busca Aleatória (H)';
    const color = '#48bb78';
    const helpText = isSequential ? `✨ Você ajudou <span id="progress-ajudas">${vezesAjudadas}</span> vezes!` : '🎲 Gerando chaves aleatórias...';

    modal = document.createElement('div');
    modal.id = 'preset-progress-modal';
    modal.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; background: rgba(0, 0, 0, 0.9);
      color: white; padding: 18px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 10000; min-width: 320px; font-family: 'Segoe UI', sans-serif;
      border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-weight: bold; font-size: 14px; color: ${color};">${title}</span>
        <button id="preset-collapse-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:18px;">×</button>
      </div>
      <div id="preset-modal-content">
        <div style="margin-bottom: 5px; font-size: 13px;">
          <span id="progress-linhas">0</span> / <span id="progress-total">${LINHAS_POR_ATUALIZACAO}</span> linhas processadas
        </div>
        <div style="margin-bottom: 10px; font-size: 11px; color: ${color}; font-weight: 500;">
          ${helpText}
        </div>
        <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 10px;">
          <div id="progress-bar" style="background: linear-gradient(90deg, ${color}, #38a169); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
        </div>
        <div style="font-size: 12px; text-align: center; margin-bottom: 8px;">
          ${isSequential ? 'Falta <span id="progress-percent">100.0</span>% - Conto com você! 🙏' : 'Explorando chaves...'}
        </div>
        <div style="font-size: 10px; opacity: 0.6; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
          Próxima atualização em: <span id="progress-eta">calculando...</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    const collapseBtn = document.getElementById('preset-collapse-btn');
    const contentEl = document.getElementById('preset-modal-content');
    // Arrastar e salvar posição
    makeDraggable(modal, 'preset-progress-modal');
    collapseBtn.addEventListener('click', () => toggleCollapse(modal, contentEl, collapseBtn));
    startTime = Date.now();
  }

  function updateProgressUI(count) {
    const modal = document.getElementById('preset-progress-modal');
    if (!modal || modal.style.display === 'none') return;

    const prefix = ''; // Horizontal não usa prefixo nos IDs atuais
    const linhasEl = document.getElementById('progress-linhas');
    const barEl = document.getElementById('progress-bar');
    const ajudasEl = document.getElementById('progress-ajudas');
    const etaEl = document.getElementById('progress-eta');

    if (linhasEl) linhasEl.textContent = count;

    // Usa contador global se disponível, senão usa local
    if (ajudasEl) {
      const globalCount = window.WalletCounter ? window.WalletCounter.getCount() : vezesAjudadas;
      ajudasEl.textContent = globalCount;
    }

    const percent = (count / LINHAS_POR_ATUALIZACAO) * 100;
    if (barEl) barEl.style.width = percent + '%';

    // Calcula ETA
    if (etaEl && startTime) {
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = count / elapsed;
      const remaining = LINHAS_POR_ATUALIZACAO - count;
      const seconds = rate > 0 ? remaining / rate : 0;

      if (seconds > 0) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        etaEl.textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;
      } else {
        etaEl.textContent = 'Atualizando...';
      }
    }
  }

  async function startPreset() {
    if (presetRunning) return;
    const bits = window.presetManager ? window.presetManager.getCurrentBits() : 0n;
    if (bits === 0n) return;

    console.log(`🚀 Iniciando Preset para ${bits} bits no modo ${getMode()}`);

    presetRunning = true;
    
    // 🚀 INICIALIZAÇÃO DO CONTADOR: 
    // Se linhasProcessadas > 0, mantemos o presetStateCounter atual (Resume em memória).
    // Caso contrário (linhasProcessadas == 0), o resetamos para 0 e deixamos a retomada de banco agir.
    if (linhasProcessadas === 0) {
      presetStateCounter = 0n;
    }

    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;

    // 🚀 CARREGAMENTO DE INTERVALO BASE
    // Horizontal: usa puzzle_progress (via SupabaseDB)
    // Vertical: SEMPRE usa intervalo padrão [2^n .. 2^(n+1)-1] como base,
    //           e usa puzzle_vertical APENAS para obter o lastHex (offset).
    if (!currentInicio) {
      const mode = getMode();
      if (mode === 'horizontal' || mode === 'randomize_h' || mode === 'randomize') {
        const data = await loadFromDatabase(Number(bits));
        if (data) {
          currentInicio = data.inicio;
          currentFim = data.fim;
        } else {
          const startRange = (1n << bits).toString(16);
          const endRange = ((1n << (bits + 1n)) - 1n).toString(16);
          currentInicio = startRange;
          currentFim = endRange;
        }
      } else if (mode === 'vertical' || mode === 'randomize_v') {
        // Preferir intervalo do puzzle_vertical; fallback 2^n..2^(n+1)-1
        if (!window.verticalManagerInstance) {
          window.verticalManagerInstance = new window.VerticalProgressManager();
        }
        const vDataInit = await window.verticalManagerInstance.getLastVerticalProgress(Number(bits));
        if (vDataInit && vDataInit.inicio && vDataInit.fim) {
          currentInicio = vDataInit.inicio;
          currentFim = vDataInit.fim;
        } else {
          const startRange = (1n << bits).toString(16);
          const endRange = ((1n << (bits + 1n)) - 1n).toString(16);
          currentInicio = startRange;
          currentFim = endRange;
        }
      }
    }

    // 🚀 RETOMADA VERTICAL: busca último progresso salvo quando o painel vertical está carregando
    if (getMode() === 'vertical' && window.VerticalProgressManager && linhasProcessadas === 0) {
      if (!window.verticalManagerInstance) {
        window.verticalManagerInstance = new window.VerticalProgressManager();
      }
      const lastProgress = await window.verticalManagerInstance.getLastVerticalProgress(Number(bits));

      if (lastProgress && lastProgress.inicio) {
        // Restaura o progresso
        const lastHexValue = lastProgress.inicio;
        // Base para cálculo do offset é o currentInicio (intervalo vertical)
        const baseHex = currentInicio || (1n << bits).toString(16);
        const lastHexBigInt = BigInt('0x' + lastHexValue);
        const baseBigInt = BigInt('0x' + baseHex);

        if (lastHexBigInt >= baseBigInt) {
          const absoluteOffset = lastHexBigInt - baseBigInt;
          // 🚀 CONVERTE OFFSET ABSOLUTO → CONTADOR RELATIVO (ordem vertical atual)
          // Lê o bit absoluto de cada célula ativa e monta o número relativo
          if (window.matrizAPI) {
            const activeCells = window.matrizAPI.getActiveCellsVertical();
            const sortedCells = [...activeCells].sort((a, b) => {
              if (a.col !== b.col) return b.col - a.col;
              return b.row - a.row;
            });
            let relativeCounter = 0n;
            for (let i = 0; i < sortedCells.length; i++) {
              const cell = sortedCells[i];
              const bitIndex = BigInt((16 - (cell.row + 1)) * 16 + (16 - (cell.col + 1)));
              const bit = (absoluteOffset >> bitIndex) & 1n;
              if (bit === 1n) {
                relativeCounter |= (1n << BigInt(i));
              }
            }
            presetStateCounter = relativeCounter;
          } else {
            // Fallback: usa offset direto (pode resultar em mapeamento diferente)
            presetStateCounter = absoluteOffset;
          }
          console.log(`🔄 Progresso vertical retomado: Hex ${lastHexValue} (Rel: ${presetStateCounter})`);
        }
      }
    }

    // 🚀 MODAL APENAS PARA MODOS SEQUENCIAIS (H/V)
    const mode = getMode();
    if (mode === 'horizontal' && window.presetExpressoAtivo && presetRunning) {
      createProgressModal();
    } else if (mode === 'vertical' && presetRunning) {
      createVerticalProgressModal();
    } else {
      // 🚀 GARANTE que modais de sincronização não apareçam em modo Aleatório
      const hModal = document.getElementById('preset-progress-modal');
      if (hModal) hModal.style.display = 'none';
      const vModal = document.getElementById('vertical-progress-modal');
      if (vModal) vModal.style.display = 'none';
    }
    const speed = parseInt(document.getElementById('speed')?.value || 50);
    presetInterval = setInterval(presetStep, speed);

    // Atualiza intervalo dinamicamente
    updatePresetInterval();
  }

  async function stopPreset() {
    if (!presetRunning) return;
    
    // 🚀 SALVAMENTO FINAL AO PARAR
    if (getMode() === 'vertical' && window.verticalManagerInstance && currentHex) {
      console.log('🛑 Salvando progresso vertical final antes de parar...');
      await window.verticalManagerInstance.saveVerticalProgress(currentHex, linhasProcessadas);
      
      // Se tiver acumulado o suficiente, conta como ajuda
      if (linhasProcessadas >= 1000) {
        vezesAjudadas++;
        linhasProcessadas = 0;
      }
      
      // Dispara evento para atualizar o card na tela
      window.dispatchEvent(new CustomEvent('verticalProgressStopped', {
         detail: { preset: Number(window.presetManager.getCurrentBits()) }
      }));
    } else if (getMode() === 'horizontal') {
      await updateDatabase(Number(window.presetManager.getCurrentBits()));
    }

    presetRunning = false;
    if (presetInterval) { clearInterval(presetInterval); presetInterval = null; }
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    
    // Oculta modais apenas se não for aleatório (para não piscar na troca de modo)
    const hModal = document.getElementById('preset-progress-modal');
    if (hModal && getMode() === 'horizontal') hModal.style.display = 'none';
    
    const vModal = document.getElementById('vertical-progress-modal');
    if (vModal && getMode() === 'vertical') vModal.style.display = 'none';
  }

  /**
   * Modal de Progresso Vertical (Identico ao Horizontal mas com IDs diferentes)
   */
  function createVerticalProgressModal() {
    let modal = document.getElementById('vertical-progress-modal');
    if (modal) modal.remove();

    const mode = getMode();
    const isSequential = mode === 'vertical';
    const title = isSequential ? 'Sincronizando com Banco — Sequencial (V)' : 'Busca Aleatória (V)';
    const color = '#3182ce';
    const helpText = isSequential ? `✨ Você ajudou <span id="v-progress-ajudas">0</span> vezes!` : '🎲 Gerando chaves aleatórias...';

    modal = document.createElement('div');
    modal.id = 'vertical-progress-modal';
    modal.style.cssText = `
      position: fixed; bottom: 20px; left: 20px; background: rgba(0, 0, 0, 0.9);
      color: white; padding: 18px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      z-index: 10000; min-width: 320px; font-family: 'Segoe UI', sans-serif;
      border: 1px solid rgba(0, 150, 255, 0.3); backdrop-filter: blur(10px);
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-weight: bold; font-size: 14px; color: ${color};">${title}</span>
        <button id="v-collapse-btn" style="background:none; border:none; color:white; cursor:pointer; font-size:18px;">×</button>
      </div>
      <div id="v-modal-content">
        <div style="margin-bottom: 5px; font-size: 13px;">
          <span id="v-progress-linhas">0</span> / <span id="v-progress-total">1000</span> linhas processadas
        </div>
        <div style="margin-bottom: 10px; font-size: 11px; color: #63b3ed; font-weight: 500;">
          ${helpText}
        </div>
        <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 10px;">
          <div id="v-progress-bar" style="background: linear-gradient(90deg, ${color}, #63b3ed); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
        </div>
        <div style="font-size: 12px; text-align: center; margin-bottom: 8px;">
          ${isSequential ? 'Falta <span id="v-progress-percent">100.0</span>% - Conto com você!' : 'Explorando chaves...'}
        </div>
        <div style="font-size: 10px; opacity: 0.6; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
          Próxima atualização em: <span id="v-progress-eta">calculando...</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    window.__vStartTime = Date.now();
    const vCollapseBtn = document.getElementById('v-collapse-btn');
    const vContentEl = document.getElementById('v-modal-content');
    makeDraggable(modal, 'vertical-progress-modal');
    vCollapseBtn.addEventListener('click', () => toggleCollapse(modal, vContentEl, vCollapseBtn));
  }

  // Utilitário: alterna colapso com ícone circular
  function toggleCollapse(modalEl, contentEl, btnEl) {
   const isHidden = contentEl.style.display === 'none';
    if (isHidden) {
     contentEl.style.display = 'block';
      modalEl.style.width = '';
      modalEl.style.height = '';
      modalEl.style.borderRadius = '15px';
      btnEl.textContent= '×';
      modalEl.classList.remove('collapsed');
    } else {
     contentEl.style.display = 'none';
      modalEl.style.width = '46px';
      modalEl.style.height = '46px';
      modalEl.style.borderRadius = '50%';
      
      // Show H or V icon based on modal type
     const modalId = modalEl.id;
      if (modalId === 'preset-progress-modal') {
        btnEl.textContent = 'H'; // Horizontal
      } else if (modalId === 'vertical-progress-modal') {
        btnEl.textContent= 'V'; // Vertical
      } else {
        btnEl.textContent= '▢';
      }
      
      modalEl.classList.add('collapsed');
    }
  }

  // Utilitário: tornar modal arrastável e salvar posição
  function makeDraggable(el, storageKey) {
    let isDragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    // Restaura posição
    try {
      const saved = localStorage.getItem('modal-pos-' + storageKey);
      if (saved) {
        const pos = JSON.parse(saved);
        el.style.left = pos.left + 'px';
        el.style.top = pos.top + 'px';
        el.style.right = 'auto';
        el.style.bottom = 'auto';
        el.style.position = 'fixed';
      }
    } catch {}
    const header = el.firstElementChild;
    (header || el).style.cursor = 'move';
    (header || el).addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      e.preventDefault();
    });
    function onMove(e) {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const left = Math.max(0, Math.min(window.innerWidth - 40, startLeft + dx));
      const top = Math.max(0, Math.min(window.innerHeight - 40, startTop + dy));
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.position = 'fixed';
    }
    function onUp() {
      isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      try {
        const rect = el.getBoundingClientRect();
        localStorage.setItem('modal-pos-' + storageKey, JSON.stringify({ left: rect.left, top: rect.top }));
      } catch {}
    }
  }

  function updateVerticalProgressUI(count) {
    const modal = document.getElementById('vertical-progress-modal');
    if (!modal || modal.style.display === 'none') return;

    const barEl = document.getElementById('v-progress-bar');
    const textEl = document.getElementById('v-progress-linhas');
    const totalEl = document.getElementById('v-progress-total');
    const ajudasEl = document.getElementById('v-progress-ajudas');
    const percentEl = document.getElementById('v-progress-percent');
    const etaEl = document.getElementById('v-progress-eta');
    if (textEl) textEl.textContent = count;
    if (totalEl) totalEl.textContent = LINHAS_POR_ATUALIZACAO;
    const percent = (count / LINHAS_POR_ATUALIZACAO) * 100;
    if (barEl) barEl.style.width = percent + '%';
    if (ajudasEl) {
      const gc = window.WalletCounter ? window.WalletCounter.getCount() : vezesAjudadas;
      ajudasEl.textContent = gc;
    }
    if (percentEl) percentEl.textContent = (100 - percent).toFixed(1);
    if (etaEl && window.__vStartTime) {
      const elapsed = (Date.now() - window.__vStartTime) / 1000;
      const rate = count / elapsed;
      const remaining = LINHAS_POR_ATUALIZACAO - count;
      const seconds = rate > 0 ? remaining / rate : 0;
      if (seconds > 0) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        etaEl.textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;
      } else {
        etaEl.textContent = 'Atualizando...';
      }
    }
  }

  function randomizeWithinRange(mode) {
  const bitsNum = Number(window.presetManager ? window.presetManager.getCurrentBits() || 0n : 0);
    if (!bitsNum) return;
  
   // 🎯 ATUALIZA ESTADO ON/OFF ANTES DE RANDOMIZAR
   updateRandomOnOffState();
  
   let startHex = null;
    let endHex = null;
  
    // Tenta obter valores atualizados dos cards de progresso na UI
    if (window.matrizAPI && typeof window.matrizAPI.getInitHexFromCard === 'function') {
      startHex = window.matrizAPI.getInitHexFromCard(mode);
      endHex = window.matrizAPI.getEndHexFromCard(mode);
    }
  
    // Fallbacks para quando os cards não estão disponíveis ou carregados
    if (!startHex || !endHex) {
      if (mode === 'horizontal') {
        startHex = currentInicio || (1n << BigInt(bitsNum)).toString(16);
        endHex = currentFim || ((1n << (BigInt(bitsNum) +1n)) - 1n).toString(16);
      } else {
        startHex = (1n << BigInt(bitsNum)).toString(16);
        endHex = ((1n << (BigInt(bitsNum) + 1n)) - 1n).toString(16);
      }
    }
  
  console.log(`\n🎯 ========== ALEATORIZAR (${mode.toUpperCase()}) ==========`);
  console.log(`🎲 Aleatorizando (${mode}): Range [${startHex} ... ${endHex}] | Modo: ${useRandomMode ? 'ALEATÓRIO' : 'SEQUENCIAL'}`);
    
  // 🆕 VERIFICAR VARIÁVEIS GLOBAIS
  console.log('🔍 window.minCellPercent:', window.minCellPercent, '(tipo:', typeof window.minCellPercent + ')');
  console.log('🔍 window.maxCellPercent:', window.maxCellPercent, '(tipo:', typeof window.maxCellPercent + ')');
  
  const startVal = BigInt('0x' + startHex);
  const endVal = BigInt('0x' + endHex);
  const span = endVal > startVal ? (endVal- startVal +1n) : 1n;
  
   // 🎯 OBTEM CONTADOR DE CÉLULAS ATUAL (PROGRESSIVO) E CONVERTE PORCENTAGEM
   const cellCount = mode === 'horizontal' ? horizontalCellCount : verticalCellCount;
   const targetPercent = mode === 'horizontal' ? minCellPercent : maxCellPercent;
   const calculatedCells = convertPercentToCells(targetPercent);
    
  console.log(`📊 Configuração: ${targetPercent}% → ${calculatedCells} células`);
  console.log(`📊 Progressão Atual: ${cellCount}/${MAX_CELLS} células (PRÓXIMO: ${cellCount + 1})`);
  console.log(`🔥 VAI GERAR ${cellCount} CÉLULA(S) AGORA!`);

   let val;
  const generatedValues = [];
  
   // 🎯 GERA MÚLTIPLAS CÉLULAS (PROGRESSIVO)
   for (let i = 0; i < cellCount; i++) {
     if (useRandomMode) {
      // 🎲 MODO ALEATÓRIO: Randomização tradicional com densidade
     const densities = [0.3, 0.7, 0.4, 0.6, 0.5];
      const density = densities[Math.floor(Math.random() * densities.length)];
     const targetPoint= startVal + (span * BigInt(Math.floor(density * 1000))) / 1000n;
     const windowSize = span / 20n; // Janela de 5%
      let rndOffset= (BigInt(Math.floor(Math.random() * 0x7FFFFFFF)) << 32n) | BigInt(Math.floor(Math.random() * 0x7FFFFFFF));
      rndOffset = rndOffset % (windowSize > 0n ? windowSize : 1n);
  
      val = targetPoint + (rndOffset - windowSize / 2n);
      if (val < startVal) val = startVal;
      if (val > endVal) val = endVal;
  
      // 50% de chance de usar o espelho
      if (Math.random() < 0.5) {
        val = startVal + (endVal- val);
      }
  
    console.log(`🎲 ALEATÓRIO (${currentRandomPercent}%) [${i+1}/${cellCount}]: ${val.toString(16).padStart(64, '0')}`);
     } else {
      // 🔢 MODO SEQUENCIAL: Usa próximo valor sequencial do range
      // Alterna entre início e fim para cobertura balanceada
    const useStart = Math.random() < 0.5;
        
      if (useStart) {
        // Pega valor próximo do início
        val = startVal + BigInt(Math.floor(Math.random() * 1000));
      } else {
        // Pega valor próximo do fim
        val = endVal - BigInt(Math.floor(Math.random() * 1000));
      }
        
      if (val < startVal) val = startVal;
      if (val > endVal) val = endVal;
  
    console.log(`🔢 SEQUENCIAL (${100 - currentRandomPercent}%) [${i+1}/${cellCount}]: ${val.toString(16).padStart(64, '0')}`);
     }
       
     generatedValues.push(val);
   }
  
  // 🎯 USA O ÚLTIMO VALOR GERADO PARA EXIBIÇÃO
  val = generatedValues[generatedValues.length - 1];
  const hexVal = val.toString(16).padStart(64, '0');
   currentHex = hexVal;
  const base = 1n << BigInt(bitsNum);
  const matrixOffset = val- base >= 0n ? (val - base) : 0n;
  
   updatePresetMatrix(matrixOffset, mode === 'vertical' ? 'vertical' : 'horizontal');
  
   if (mode === 'vertical' && window.verticalManagerInstance) {
   const inv = window.verticalManagerInstance.calculateInverse(
      hexVal,
      (1n << BigInt(bitsNum)).toString(16),
      ((1n << (BigInt(bitsNum) +1n)) - 1n).toString(16)
    );
    if (inv) updatePresetOutput(inv);
  }
  
  if (window.matrizAPI) window.matrizAPI.draw();
  updatePresetOutput(hexVal);
    
  // 🎯 ATUALIZA CONTADOR PROGRESSIVO PARA PRÓXIMA EXECUÇÃO
  if (mode === 'horizontal') {
    horizontalCellCount++;
    if (horizontalCellCount > MAX_CELLS) {
      horizontalCellCount = 1; // Reinicia ciclo
    console.log('🔄 Horizontal reiniciou: 1→ 99 completado!');
    }
  } else {
    verticalCellCount++;
    if (verticalCellCount > MAX_CELLS) {
      verticalCellCount = 1; // Reinicia ciclo
    console.log('🔄 Vertical reiniciou: 1→ 99 completado!');
    }
  }
  }

  const randBtnH = document.getElementById('randBtnH');
  if (randBtnH) {
    randBtnH.addEventListener('click', () => {
      if (window.presetManager && window.presetManager.hasActivePreset()) {
        randomizeWithinRange('horizontal');
      } else if (window.auto16API) {
        window.auto16API.randomize();
      }
    });
  }
  const randBtnV = document.getElementById('randBtnV');
  if (randBtnV) {
    randBtnV.addEventListener('click', () => {
      if (window.presetManager && window.presetManager.hasActivePreset()) {
        randomizeWithinRange('vertical');
      } else if (window.auto16API) {
        window.auto16API.randomize();
      }
    });
  }

  /**
   * Atualiza o intervalo do preset baseado no estado do background
   */
  function updatePresetInterval() {
    if (presetInterval) {
      clearInterval(presetInterval);
    }

    // Obtém velocidade base do controle
    const baseSpeed = parseInt(document.getElementById('speed')?.value || 50);

    // Ajusta velocidade baseado no estado do background
    let adjustedSpeed = baseSpeed;

    if (window.BackgroundProcessor && window.BackgroundProcessor.isInBackground()) {
      // Em background: mantém a mesma velocidade (não diminui)
      adjustedSpeed = baseSpeed;
      console.log(`⚡ Preset processando em background com velocidade mantida: ${adjustedSpeed}ms`);
    } else {
      // Em foreground: usa velocidade normal
      adjustedSpeed = baseSpeed;
    }

    presetInterval = setInterval(presetStep, adjustedSpeed);
  }

  /**
   * Registra o processador de preset no Background Processor
   */
  function registerPresetWithBackgroundProcessor() {
    if (window.BackgroundProcessor) {
      window.BackgroundProcessor.register('auto16-preset', {
        onVisibilityChange: (data) => {
          console.log('🔄 Preset: Mudança de visibilidade detectada', data);
          if (presetRunning) {
            updatePresetInterval(); // Ajusta intervalo imediatamente
          }
        },
        enableAggressiveMode: (data) => {
          console.log('⚡ Preset: Modo agressivo ativado', data);
          if (presetRunning) {
            updatePresetInterval(); // Mantém velocidade máxima
          }
        },
        enableNormalMode: (data) => {
          console.log('🔄 Preset: Modo normal ativado', data);
          if (presetRunning) {
            updatePresetInterval(); // Retorna à velocidade normal
          }
        },
        optimizeForLongBackground: (data) => {
          console.log('🔧 Preset: Otimizando para long background', data);
          // Limpa variáveis desnecessárias se possível
          if (window.gc) {
            window.gc();
          }
          // Otimiza contadores BigInt
          if (presetStateCounter > 1000000n) {
            presetStateCounter = 0n;
            console.log('🔄 Preset: Contador resetado para otimização');
          }
        }
      });
    }
  }

  function clearPreset() {
    stopPreset();
    if (hexBox) hexBox.value = '';
    if (wifBox) wifBox.value = '';
    if (wifBoxUncompressed) wifBoxUncompressed.value = '';
    if (window.matrizAPI) window.matrizAPI.setGridState(Array(256).fill(false));
    presetStateCounter = 0n;
    linhasProcessadas = 0;
  }

  /* =====================================================
     EVENT LISTENERS
     ===================================================== */

  if (startBtn) startBtn.addEventListener('click', () => {
    if (window.presetManager && window.presetManager.hasActivePreset()) startPreset();
  });

  if (stopBtn) stopBtn.addEventListener('click', () => {
    if (window.presetManager && window.presetManager.hasActivePreset()) stopPreset();
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (window.presetManager && window.presetManager.hasActivePreset()) clearPreset();
  });

  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (window.presetManager && window.presetManager.hasActivePreset()) {
        clearPreset();
        // Força limpeza dos ponteiros para que startPreset recarregue do card correto
        currentInicio = null;
        currentFim = null;
      }
    });
  });

  window.addEventListener('presetApplied', (e) => {
    dbInicio = e.detail.data.inicio;
    dbFim = e.detail.data.fim;
    currentInicio = dbInicio;
    currentFim = dbFim;
    linhasProcessadas = 0;
  });

  window.addEventListener('presetReset', () => {
    stopPreset();
    currentInicio = null;
    currentFim = null;
    linhasProcessadas = 0;
  });

  // Inicializa o Background Processor para preset
  setTimeout(() => {
    registerPresetWithBackgroundProcessor();
  }, 100);

  console.log('✅ auto16-preset.js (Clean Version) carregado');
});
