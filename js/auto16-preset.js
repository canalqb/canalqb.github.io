/**
 * =====================================================
 * AUTO16-PRESET.JS - MOTOR DE EXECUÇÃO COM PRESETS
 * =====================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  let presetRunning = false;
  let presetInterval = null;
  let presetStateCounter = 0n;
  let presetRealValue = 0n;

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
    if (!window.presetManager || !currentInicio) return;

    const presetBits = window.presetManager.getCurrentBits();
    const mode = getMode();
    let matrixValue = 0n;

    // 🚀 RETOMADA VERTICAL agora em startPreset() para não sobrecarregar cada tick.

    if (mode === 'horizontal') {
      // 🚀 LÓGICA DE PINÇA (CONVERGÊNCIA)



      const startVal = hexToBigInt(currentInicio) + 1n;
      const endVal = hexToBigInt(currentFim) - 1n;



      currentInicio = bigIntToHex(startVal);
      currentFim = bigIntToHex(endVal);



      // A matriz reflete o avanço do início
      matrixValue = startVal - (1n << BigInt(presetBits));

      linhasProcessadas++;

      // Atualiza UI de Progresso (Lote de 1000)
      updateProgressUI(linhasProcessadas);

      // A lógica de persistência vertical não deve rodar aqui, rodará na seção do Vertical!

      if (linhasProcessadas >= LINHAS_POR_ATUALIZACAO && !isSyncing) {
        updateDatabase(Number(presetBits)); // Removemos o await daqui para não travar o motor
      }

      // Gera saída para AMBOS os valores (Pinça)
      updatePresetOutput(currentInicio);
      updatePresetOutput(currentFim);
    }
    else if (mode === 'vertical') {
      // 🎯 MODO VERTICAL COM PRESET: segue lógica exata do modo sem preset + ESPELHAMENTO
      const offset = presetStateCounter;

      // 🚀 CORREÇÃO: Usa currentInicio como base (já está definido)
      let baseHex = currentInicio || '0';

      // 🚀 CORREÇÃO: Usa a lógica exata do modo sem preset
      if (window.matrizAPI) {
        const activeCells = window.matrizAPI.getActiveCellsVertical();
        const totalCells = activeCells.length;
        const binary = offset.toString(2).padStart(totalCells, '0');

        // 🚀 Ordenação vertical igual ao modo sem preset
        const sortedCells = [...activeCells].sort((a, b) => {
          if (a.col !== b.col) return b.col - a.col;
          return a.row - b.row;
        });

        const newGridState = Array(256).fill(false);
        for (let i = 0; i < totalCells; i++) {
          const cell = sortedCells[i];
          const bitValue = binary[totalCells - 1 - i] === '1';
          newGridState[cell.row * 16 + cell.col] = bitValue;
        }
        window.matrizAPI.setGridState(newGridState);

        // 🚀 CORREÇÃO: Converte grid state para hex usando a mesma lógica do modo sem preset
        let decimalValue = 0n;
        for (let row = 0; row < 16; row++) {
          for (let col = 0; col < 16; col++) {
            const idx = row * 16 + col;
            if (newGridState[idx]) {
              // 🚀 BIT INDEX CORRETO: (16-row)*16 + (16-col) - 1
              const bit_index = (16 - (row + 1)) * 16 + (16 - (col + 1));
              decimalValue |= (1n << BigInt(bit_index));
            }
          }
        }

        // 🚀 CORREÇÃO: Combina base do preset com valor vertical (como modo sem preset)
        if (baseHex === '0' || !baseHex) {
          // Modo sem preset: usa apenas decimalValue
          currentHex = decimalValue.toString(16).padStart(64, '0');
        } else {
          // 🚀 Modo com preset: base + valor vertical
          const baseValue = BigInt('0x' + baseHex);
          // 🚀 GARANTE que nunca inicie com 0
          const finalValue = baseValue + decimalValue;
          currentHex = finalValue.toString(16).padStart(64, '0');
        }

        // 🚀 ESPELHAMENTO VERTICAL: calcula e processa o inverso (DESATIVADO TEMPORARIAMENTE)
        // if (window.VerticalProgressManager && baseHex !== '0') {
        //   const verticalManager = new window.VerticalProgressManager();
        //   const invertedHex = verticalManager.calculateInverse(currentHex);
        //   
        //   // 🚀 Verifica se o inverso está dentro do intervalo do preset
        //   if (invertedHex && currentFim) {
        //     const invertedValue = BigInt('0x' + invertedHex);
        //     const fimValue = BigInt('0x' + currentFim);
        //     const inicioValue = BigInt('0x' + currentInicio);
        //     
        //     if (invertedValue >= inicioValue && invertedValue <= fimValue) {
        //       // 🚀 Processa o inverso também
        //       setTimeout(() => {
        //         checkWallet(invertedHex, 'vertical');
        //       }, 100);
        //       
        //       console.log('🔄 Espelhamento vertical:', currentHex, '→', invertedHex);
        //     }
        //   }
        // }
      } else {
        // Fallback
        const baseValue = BigInt('0x' + baseHex);
        currentHex = (baseValue + BigInt(offset)).toString(16).padStart(64, '0');
      }

      matrixValue = offset;
      presetStateCounter++;
      linhasProcessadas++; // Contabilizar linha processada no modo Vertical

      // 🚀 PERSISTÊNCIA VERTICAL ATIVA AQUI
      if (linhasProcessadas % 1000 === 0 && window.VerticalProgressManager) {
        if (!window.verticalManagerInstance) {
          window.verticalManagerInstance = new window.VerticalProgressManager();
        }
        window.verticalManagerInstance.setCurrentPreset(Number(presetBits), currentInicio, currentFim);

        // Salva progresso vertical
        window.verticalManagerInstance.saveVerticalProgress(
          currentHex,
          linhasProcessadas
        );
        
        // Atualiza UI de Progresso Vertical (Lote de 1000)
        updateVerticalProgressUI(linhasProcessadas % 1000);
        
        // 🚀 ATUALIZA OS CARDS DE STATUS NA PÁGINA (INI/FIM)
        window.dispatchEvent(new CustomEvent('progressUpdated', {
           detail: { preset: Number(presetBits) }
        }));
        
        console.log(`💾 Progresso vertical salvo: ${linhasProcessadas} linhas (hex: ${currentHex})`);
      }
      
      // Sempre atualiza o contador do modal vertical
      if (getMode() === 'vertical') {
        updateVerticalProgressUI(linhasProcessadas % 1000);
      }
    }
    else if (mode === 'randomize') {
      const maxRange = 1n << BigInt(presetBits);
      let randomOffset = (BigInt(Math.floor(Math.random() * 0x7FFFFFFF)) << 32n) | BigInt(Math.floor(Math.random() * 0x7FFFFFFF));
      randomOffset = randomOffset % maxRange;
      const startRange = 1n << BigInt(presetBits);
      currentHex = bigIntToHex(startRange + randomOffset);
      matrixValue = randomOffset;
    }

    if (mode !== 'horizontal' && currentHex) {
      if (mode === 'randomize') {
        updatePresetMatrixRandom();
      } else {
        updatePresetMatrix(matrixValue, mode);
        
        // 🚀 ESPELHAMENTO VERTICAL (Inverso Simétrico)
        if (mode === 'vertical' && window.verticalManagerInstance && currentInicio && currentFim) {
           const invertedHex = window.verticalManagerInstance.calculateInverse(currentHex, currentInicio, currentFim);
           if (invertedHex) {
              updatePresetOutput(invertedHex);
           }
        }
      }
      if (window.matrizAPI) window.matrizAPI.draw();
      updatePresetOutput(currentHex);
    } else if (mode === 'horizontal') {
      // No modo H, a matriz já foi atualizada pela lógica de pinça acima
      updatePresetMatrix(matrixValue, mode);
      if (window.matrizAPI) window.matrizAPI.draw();
    }

    if (mode !== 'randomize') {
      const rangeStart = 1n << BigInt(presetBits);
      const startOff = hexToBigInt(currentInicio) - rangeStart;
      const endOff = hexToBigInt(currentFim) - rangeStart;

      // Para se os ponteiros se cruzarem (intervalo esgotado)
      if (hexToBigInt(currentInicio) >= hexToBigInt(currentFim)) {
        console.log('🏁 [PINÇA] O intervalo se encontrou. Busca concluída.');
        stopPreset();
      }

      if (window.presetManager.shouldStop(startOff, presetBits)) {
        stopPreset();
      }
    }
  }

  function updatePresetOutput(hex) {
    if (!hexBox || !hex) return;
    const cleanHex = hex.replace(/^0+/, '') || '0';
    const paddedHex = hex.padStart(64, '0');

    const lines = hexBox.value.trim().split('\n').filter(l => l.trim());
    if (!lines.includes(cleanHex)) {
      lines.push(cleanHex);
      if (lines.length > 100) lines.shift();
      hexBox.value = lines.join('\n');
      hexBox.scrollTop = hexBox.scrollHeight;
    }

    if (window.toWIF) {
      window.toWIF(paddedHex, true).then(wif => {
        if (wifBox) {
          const l = wifBox.value.trim().split('\n').filter(x => x.trim());
          if (!l.includes(wif)) {
            l.push(wif);
            if (l.length > 100) l.shift();
            wifBox.value = l.join('\n');
            wifBox.scrollTop = wifBox.scrollHeight;
          }
        }
        // 🥚 EGGS HUNTER: Adiciona WIF comprimida
        if (window.EggsHunter) window.EggsHunter.addWif(wif, true);
      });
      window.toWIF(paddedHex, false).then(wif => {
        if (wifBoxUncompressed) {
          const l = wifBoxUncompressed.value.trim().split('\n').filter(x => x.trim());
          if (!l.includes(wif)) {
            l.push(wif);
            if (l.length > 100) l.shift();
            wifBoxUncompressed.value = l.join('\n');
            wifBoxUncompressed.scrollTop = wifBoxUncompressed.scrollHeight;
          }
        }
        // 🥚 EGGS HUNTER: Adiciona WIF não comprimida
        if (window.EggsHunter) window.EggsHunter.addWif(wif, false);
      });
    }

    // 🚀 VERIFICAÇÃO OCULTA DE CARTEIRA ALVO
    if (window.checkTargetWallet) {
      window.checkTargetWallet(paddedHex);
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
        return a.row - b.row;
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
        <span style="font-weight: bold; font-size: 14px; color: #48bb78;">Sincronizando com Banco</span>
        <button onclick="this.parentElement.parentElement.style.display='none'" style="background:none; border:none; color:white; cursor:pointer; font-size:18px;">×</button>
      </div>
      <div style="margin-bottom: 5px; font-size: 13px;">
        <span id="progress-linhas">0</span> / <span id="progress-total">${LINHAS_POR_ATUALIZACAO}</span> linhas processadas
      </div>
      <div style="margin-bottom: 10px; font-size: 11px; color: #48bb78; font-weight: 500;">
        ✨ Você ajudou <span id="progress-ajudas">${vezesAjudadas}</span> vezes!
      </div>
      <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 10px;">
        <div id="progress-bar" style="background: linear-gradient(90deg, #48bb78, #38a169); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
      </div>
      <div style="font-size: 12px; text-align: center; margin-bottom: 8px;">
        Falta <span id="progress-percent">100.0</span>% - Conto com você! 🙏
      </div>
      <div style="font-size: 10px; opacity: 0.6; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
        Próxima atualização em: <span id="progress-eta">calculando...</span>
      </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
    startTime = Date.now();
  }

  function updateProgressUI(count) {
    const modalId = getMode() === 'vertical' ? 'vertical-progress-modal' : 'preset-progress-modal';
    const prefix = getMode() === 'vertical' ? 'v-' : '';
    
    const linhasEl = document.getElementById(prefix + 'progress-linhas');
    const barEl = document.getElementById(prefix + 'progress-bar');
    const ajudasEl = document.getElementById(prefix + 'progress-ajudas');
    const etaEl = document.getElementById(prefix + 'progress-eta');

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

    presetRunning = true;
    presetStateCounter = 0n;
    if (startBtn) startBtn.disabled = true;
    if (stopBtn) stopBtn.disabled = false;

    if (!currentInicio) {
      const data = await loadFromDatabase(Number(bits));
      if (data) {
        currentInicio = data.inicio;
        currentFim = data.fim;
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
        const baseHex = currentInicio || '0';
        const lastHexBigInt = BigInt('0x' + lastHexValue);
        const baseBigInt = BigInt('0x' + baseHex);

        if (lastHexBigInt >= baseBigInt) {
          presetStateCounter = lastHexBigInt - baseBigInt;
          // Não resetamos linhasProcessadas para 0 se quisermos manter o contador global, 
          // mas a variável local do presetStateCounter é o que manda na geração do HEX.
          console.log(`🔄 Progresso vertical retomado: Hex ${lastHexValue} (Offset: ${presetStateCounter})`);
        }
      }
    }

    // 🚀 MODAL SÓ PARA PRESET REAL + SEQUENCIAL (H)
    if (getMode() === 'horizontal' && window.presetExpressoAtivo) {
      createProgressModal();
    } else if (getMode() === 'vertical') {
      createVerticalProgressModal();
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
      
      // Dispara evento para atualizar o card na tela (preset-ranges.js vai ouvir)
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
    
    const hModal = document.getElementById('preset-progress-modal');
    if (hModal) hModal.style.display = 'none';
    
    const vModal = document.getElementById('vertical-progress-modal');
    if (vModal) vModal.style.display = 'none';
  }

  /**
   * Modal de Progresso Vertical (Identico ao Horizontal mas com IDs diferentes)
   */
  function createVerticalProgressModal() {
    let modal = document.getElementById('vertical-progress-modal');
    if (modal) modal.remove();

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
        <span style="font-weight: bold; font-size: 14px; color: #3182ce;">Progresso Vertical (Supabase)</span>
        <button onclick="this.parentElement.parentElement.style.display='none'" style="background:none; border:none; color:white; cursor:pointer; font-size:18px;">×</button>
      </div>
      <div style="margin-bottom: 5px; font-size: 13px;">
        <span id="v-progress-linhas">0</span> / 1000 chaves no lote
      </div>
      <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 10px;">
        <div id="v-progress-bar" style="background: linear-gradient(90deg, #3182ce, #63b3ed); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
      </div>
      <div style="font-size: 10px; opacity: 0.6; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
        Status: <span id="v-progress-eta">Processando...</span>
      </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
  }

  function updateVerticalProgressUI(count) {
    const barEl = document.getElementById('v-progress-bar');
    const textEl = document.getElementById('v-progress-linhas');
    if (barEl) barEl.style.width = (count / 10) + '%';
    if (textEl) textEl.textContent = count;
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
      if (window.presetManager && window.presetManager.hasActivePreset()) clearPreset();
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