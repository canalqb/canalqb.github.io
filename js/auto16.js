/* =====================================================
   AUTO16.JS - FUNCIONALIDADES SEM PRESET (MODO PURO)
   =====================================================
   Arquivo especializado para lidar com todas as funcionalidades
   quando NÃO há preset ativo.
   
   Variáveis exclusivas do modo normal:
   - stateCounter
   - realValue  
   - dualLowOffset
   - dualHighOffset
   
   🚨 BLOQUEIO TOTAL CONTRA PRESETS 🚨
   ESTE ARQUIVO ESTÁ PROTEGIDO CONTRA QUALQUER ALTERAÇÃO
   RELACIONADA A PRESETS ATIVOS.
   
   Regras de bloqueio:
   - NUNCA modificar este arquivo ao trabalhar com preset ativo
   - NUNCA adicionar lógica de preset neste arquivo
   - NUNCA remover as verificações hasActivePreset()
   - NUNCA alterar as proteções abaixo
   - USE APENAS auto16-preset.js para funcionalidades com preset
   
   VIOLAÇÃO DESTAS REGRAS CAUSARÁ CONFLITOS IRREVERSÍVEIS
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================
     VERIFICAÇÃO DE CRYPTO API
     ===================================================== */
  
  // Verificação crítica da Crypto API
  if (!window.crypto || !window.crypto.subtle) {
    console.warn('⚠️ Crypto API não disponível em HTTP. Carregando fallback...');
    // Carrega biblioteca SHA256 fallback para HTTP
    loadSHA256Fallback();
  } else {
    console.log('✅ Crypto API disponível e funcional');
  }

  /* =====================================================
     FUNÇÃO SHA256 COM FALLBACK
     ===================================================== */
  
  let sha256Function = null;

  function loadSHA256Fallback() {
    // Carrega implementação SHA256 em JavaScript puro
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/js-sha256@0.9.0/src/sha256.min.js';
    script.onload = () => {
      if (window.sha256) {
        sha256Function = (buffer) => {
          const hex = Array.from(buffer)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          const hashHex = window.sha256(hex);
          return new Uint8Array(hashHex.match(/.{2}/g).map(h => parseInt(h, 16)));
        };
        console.log('✅ SHA256 fallback carregado com sucesso');
        enableCryptoFeatures();
      }
    };
    script.onerror = () => {
      console.error('❌ Falha ao carregar SHA256 fallback');
    };
    document.head.appendChild(script);
  }

  function enableCryptoFeatures() {
    // Reabilita botões quando crypto estiver disponível
    const startBtn = document.getElementById('startBtn');
    const applyPresetBtn = document.getElementById('applyPresetBtn');
    if (startBtn) startBtn.disabled = false;
    if (applyPresetBtn) applyPresetBtn.disabled = false;
  }

  async function sha256(buffer) {
    try {
      if (!buffer || buffer.length === 0) {
        console.warn('⚠️ sha256: buffer inválido ou vazio');
        return new Uint8Array(32);
      }
      
      // Usa crypto.subtle se disponível
      if (window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
        const uint8Buffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', uint8Buffer);
        return new Uint8Array(hashBuffer);
      }
      
      // Usa fallback se disponível
      if (sha256Function) {
        return sha256Function(buffer);
      }
      
      // Se não tiver nada, retorna array vazio
      console.warn('⚠️ Nenhuma implementação SHA256 disponível');
      return new Uint8Array(32);
    } catch (error) {
      console.error('❌ Erro na função sha256:', error);
      return new Uint8Array(32);
    }
  }

  /* =====================================================
     VARIÁVEIS DO MODO NORMAL (SEM PRESET)
     ===================================================== */

  let stateCounter = 0n;
  let realValue = 0n;
  let dualLowOffset = 0n;
  let dualHighOffset = 0n;
  let dualFromLow = true;
  let running = false;
  let interval = null;
  
  // 🚀 CONTADOR PARA LIMPEZA DE MEMÓRIA
  let verificationCount = 0;
  
  // 🔄 BACKGROUND EXECUTION MANAGER
  let backgroundManager = null;
  let useBackgroundExecution = false;

  /* =====================================================
     ELEMENTOS DOM (EXCLUINDO MATRIZ)
     ===================================================== */

  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const clearBtn = document.getElementById('clearBtn');
  const randBtn = document.getElementById('randBtn');
  const hexBox = document.getElementById('hexBox');
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

  /* =====================================================
     FUNÇÕES DE CRIPTOGRAFIA
     ===================================================== */

  async function toWIF(hex, compressed) {
    const key = hexToBytes(hex);
    const payload = new Uint8Array([0x80, ...key, ...(compressed ? [0x01] : [])]);
    const hash1 = await sha256(payload);
    const hash2 = await sha256(hash1);
    const full = new Uint8Array([...payload, ...hash2.slice(0, 4)]);
    return base58(full);
  }

  function hexToBytes(hex) {
    if (!hex || typeof hex !== 'string') {
      console.warn('⚠️ hexToBytes: hex inválido');
      return new Uint8Array(32); // Retorna array de zeros como fallback
    }
    
    if (hex.length < 64) {
      hex = hex.padStart(64, '0');
    } else if (hex.length > 64) {
      hex = hex.slice(-64);
      console.warn('⚠️ hexToBytes: hex muito longo, truncado para 64 caracteres');
    }
    
    // 🚀 VALIDAÇÃO: Verifica se contém apenas caracteres hex válidos
    if (!/^[0-9a-fA-F]+$/.test(hex)) {
      console.warn('⚠️ hexToBytes: hex contém caracteres inválidos');
      return new Uint8Array(32); // Retorna array de zeros como fallback
    }
    
    try {
      return Uint8Array.from(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
    } catch (error) {
      console.warn('⚠️ hexToBytes: erro ao converter hex para bytes', error);
      return new Uint8Array(32); // Retorna array de zeros como fallback
    }
  }

  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function base58(buf) {
    let x = BigInt('0x' + [...buf].map(b => b.toString(16).padStart(2, '0')).join(''));
    let out = '';
    while (x > 0n) {
      out = BASE58[Number(x % 58n)] + out;
      x /= 58n;
    }
    // Bitcoin Base58: Prepend '1' for each zero byte at the start
    for (let i = 0; i < buf.length && buf[i] === 0; i++) {
      out = '1' + out;
    }
    return out;
  }

  // 🚀 EXPOSIÇÃO GLOBAL DE FUNÇÕES ESSENCIAIS
  window.hexToBytes = hexToBytes;
  window.toWIF = toWIF;
  window.base58 = base58;

  // 🚀 CACHE DE CARTEIRAS ENCONTRADAS (EVITA DUPLICATAS)
  const foundWalletsCache = new Set();

  // 🚀 VERIFICAÇÃO DE VENCEDOR (OCULTA)
  window.checkTargetWallet = async function (hex, extraData = {}) {
    if (!window.targetWallets || !hex) return;
    try {
      const lib = window.bitcoin || window.bitcoinjs;
      if (!lib || !lib.ECPair) return;

      const bytes = hexToBytes(hex);
      const privKeyBuffer = lib.Buffer ? lib.Buffer.from(bytes) : bytes;

      // 1. Derivar Par de Chaves Comprimido
      const keyPairC = lib.ECPair.fromPrivateKey(privKeyBuffer, { compressed: true });
      const { address: addrC } = lib.payments.p2pkh({ pubkey: keyPairC.publicKey });

      // 2. Derivar Par de Chaves Não Comprimido
      const keyPairU = lib.ECPair.fromPrivateKey(privKeyBuffer, { compressed: false });
      const { address: addrU } = lib.payments.p2pkh({ pubkey: keyPairU.publicKey });

      const targetWallets = window.targetWallets;
      const indexC = targetWallets.indexOf(addrC);
      const indexU = targetWallets.indexOf(addrU);

      if (indexC !== -1 || indexU !== -1) {
        const foundAddr = indexC !== -1 ? addrC : addrU;
        const puzzleNum = indexC !== -1 ? (indexC + 1) : (indexU + 1);

        // 🚀 VERIFICA SE JÁ FOI ENCONTRADA ANTES
        if (foundWalletsCache.has(foundAddr)) {
          return;
        }

        // 🚀 MARCA COMO ENCONTRADA
        foundWalletsCache.add(foundAddr);

        const paddedHex = hex.padStart(64, '0');
        const wifCompressed = await toWIF(paddedHex, true);
        const wifUncompressed = await toWIF(paddedHex, false);

        console.log("%c🚀 [VITAL] CARTEIRA ALVO ENCONTRADA!", "color: gold; background: black; font-size: 24px; padding: 10px; border: 2px solid gold;");

        // 1. Salva no localStorage (não interrompe o sistema conforme pedido)
        const winData = { hex: paddedHex, addr: foundAddr, puzzle: puzzleNum, wifCompressed, wifUncompressed, date: new Date().toISOString() };
        localStorage.setItem('BTC_WINNER_' + Date.now(), JSON.stringify(winData));

        // 2. Incrementa contador de carteiras
        if (window.WalletCounter) {
          window.WalletCounter.increment();
        }

        // 3. Integração com o Puzzles List (se existir)
        if (window.puzzlesModal && window.puzzlesModal.updateCount) {
          window.puzzlesModal.updateCount();
        }

        // 4. Registro no Supabase (Puzzle Finder) com deduplicação
        try {
          if (window.PuzzleFinder && typeof window.PuzzleFinder.register === 'function') {
            const mode = extraData.mode || (getMode ? getMode() : (document.querySelector('input[name="mode"]:checked')?.value || 'horizontal'));
            
            // 🚀 O preset real é SEMPRE o puzzleNum baseado na lista de carteiras
            await window.PuzzleFinder.register({
              preset: puzzleNum, 
              hexPrivateKey: paddedHex,
              wifCompressed,
              wifUncompressed,
              addressCompressed: addrC,
              addressUncompressed: addrU,
              mode,
              matrixCoordinates: extraData.matrixCoordinates || null,
              processingTimeMs: extraData.startTime ? (Date.now() - extraData.startTime) : (extraData.processingTimeMs || null),
              linesProcessed: extraData.linesProcessed || null
            });
            console.log(`✅ Registro do Puzzle ${puzzleNum} na tabela "encontrados" concluído`);
          } else {
            console.log('ℹ️ PuzzleFinder não disponível — pulando registro remoto');
          }
        } catch (e) {
          if (e.code === 'DUPLICATE_PUZZLE') {
            console.log('ℹ️ Puzzle já existente no Supabase. Ignorando duplicata.');
          } else {
            console.warn('⚠️ Falha ao registrar puzzle no Supabase:', e.message || e);
          }
        }
      }
    } catch (e) { 
      if (e.message && e.message.includes('not in range')) return;
      console.error('❌ Erro na verificação:', e); 
    }
  };


  /* =====================================================
     FUNÇÕES DO MODO NORMAL (SEM PRESET)
     ===================================================== */

  // 🚀 FUNÇÃO DE LIMPEZA DE MEMÓRIA
  function cleanMemory() {
    try {
      // Limpa cache de carteiras encontradas (mantém apenas as últimas 100)
      if (foundWalletsCache.size > 100) {
        const cacheArray = Array.from(foundWalletsCache);
        foundWalletsCache.clear();
        // Mantém as 50 mais recentes
        cacheArray.slice(-50).forEach(addr => foundWalletsCache.add(addr));
        console.log('🧹 Cache de carteiras limpo, mantendo 50 mais recentes');
      }

      // Força coleta de lixo se disponível
      if (window.gc) {
        window.gc();
        console.log('🗑️ Coleta de lixo forçada');
      }

      // Limpa eventos antigos do setTimeout/setInterval
      const oldTimeouts = setTimeout.toString().match(/\d+/g);
      if (oldTimeouts && oldTimeouts.length > 1000) {
        console.log('🧹 Muitos timeouts detectados, considere reiniciar');
      }

      console.log('🧹 Limpeza de memória concluída');
    } catch (e) {
      console.warn('⚠️ Erro na limpeza de memória:', e);
    }
  }

  function getMode() {
    return document.querySelector('input[name="mode"]:checked').value;
  }

  function getActiveCells() {
    if (!window.matrizAPI) return [];
    return window.matrizAPI.getActiveCells();
  }

  function getActiveCellsVertical() {
    if (!window.matrizAPI) return [];
    return window.matrizAPI.getActiveCellsVertical();
  }

  function gridToHex() {
    let decimalValue = 0n;
    const gridState = window.matrizAPI ? window.matrizAPI.getGridState() : Array(256).fill(false);
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const idx = row * 16 + col;
        if (gridState[idx]) {
          const linha = row + 1;
          const coluna = col + 1;
          const bit_index = (16 - linha) * 16 + (16 - coluna);
          decimalValue |= (1n << BigInt(bit_index));
        }
      }
    }
    return decimalValue.toString(16) || '0';
  }

  async function updateOutput() {
    const hex = gridToHex();
    const wifCompressed = await toWIF(hex, true);
    const wifUncompressed = await toWIF(hex, false);

    hexBox.value += hex + '\n';
    wifBox.value += wifCompressed + '\n';
    wifBoxUncompressed.value += wifUncompressed + '\n';

    // 🚀 VERIFICAÇÃO OCULTA DE CARTEIRA ALVO (INTEGRADA COM TABELA "ENCONTRADOS")
    window.checkTargetWallet(hex, {
      mode: getMode ? getMode() : 'manual',
      startTime: null, // No modo manual não rastreamos tempo do mesmo jeito
      linesProcessed: stateCounter ? Number(stateCounter) : null
    });

    // 🥚 EGGS HUNTER: Adiciona WIFs para verificação de saldo
    if (window.EggsHunter) {
      window.EggsHunter.addWif(wifCompressed, true);
      window.EggsHunter.addWif(wifUncompressed, false);
    }

    if (window.matrizAPI) {
      window.matrizAPI.limitTextareaLines(hexBox);
      window.matrizAPI.limitTextareaLines(wifBox);
      window.matrizAPI.limitTextareaLines(wifBoxUncompressed);
      window.matrizAPI.scrollToBottom(hexBox);
      window.matrizAPI.scrollToBottom(wifBox);
      window.matrizAPI.scrollToBottom(wifBoxUncompressed);
    }
  }

  function step() {
    if (window.presetManager && window.presetManager.hasActivePreset()) return;
    const mode = getMode();
    const activeCells = mode === 'vertical' ? getActiveCellsVertical() : getActiveCells();
    const totalCells = activeCells.length;
    const isRandomizeMode = mode === 'randomize' || mode === 'randomize_h' || mode === 'randomize_v';
    realValue = stateCounter;

    if (isRandomizeMode) {
      // 🚀 MODO ALEATORIZAR (H/V): Gera valor aleatório dentro da range de bits
      const maxVal = (1n << BigInt(totalCells)) - 1n;
      let rnd = (BigInt(Math.floor(Math.random() * 0x7FFFFFFF)) << 32n) | BigInt(Math.floor(Math.random() * 0x7FFFFFFF));
      rnd = rnd % (maxVal + 1n);
      
      const binary = rnd.toString(2).padStart(totalCells, '0');
      const sortedCells = mode === 'randomize_v' || mode === 'vertical'
        ? [...activeCells].sort((a, b) => {
          if (a.col !== b.col) return b.col - a.col;
          return b.row - a.row;
        })
        : [...activeCells].sort((a, b) => {
          if (a.row !== b.row) return b.row - a.row;
          return b.col - a.col;
        });

      if (window.matrizAPI) {
        const newGridState = Array(256).fill(false);
        for (let i = 0; i < totalCells; i++) {
          const cell = sortedCells[i];
          const bitValue = binary[totalCells - 1 - i] === '1';
          newGridState[cell.row * 16 + cell.col] = bitValue;
        }
        window.matrizAPI.setGridState(newGridState);
      }
    } else {
      const binary = realValue.toString(2).padStart(totalCells, '0');
      const sortedCells = mode === 'vertical'
        ? [...activeCells].sort((a, b) => {
          if (a.col !== b.col) return b.col - a.col;
          return b.row - a.row;
        })
        : [...activeCells].sort((a, b) => {
          if (a.row !== b.row) return b.row - a.row;
          return b.col - a.col;
        });

      if (window.matrizAPI) {
        const newGridState = Array(256).fill(false);
        for (let i = 0; i < totalCells; i++) {
          const cell = sortedCells[i];
          const bitValue = binary[totalCells - 1 - i] === '1';
          newGridState[cell.row * 16 + cell.col] = bitValue;
        }
        window.matrizAPI.setGridState(newGridState);
      }
    }

    stateCounter++;
    
    // 🚀 LIMPEZA DE MEMÓRIA A CADA 2000 VERIFICAÇÕES
    verificationCount++;
    if (verificationCount % 2000 === 0) {
      cleanMemory();
      console.log(`🧹 Memória limpa após ${verificationCount} verificações`);
    }
    
    if (window.matrizAPI) window.matrizAPI.draw();
    updateOutput();
  }

  function start() {
    if (running || (window.presetManager && window.presetManager.hasActivePreset())) return;
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // 🚀 RESETA CONTADOR DE VERIFICAÇÕES
    verificationCount = 0;
    
    // Usa interval adaptativo baseado no estado do background
    updateInterval();
  }

  function stop() {
    if (!running) return;
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    
    // 🚀 LIMPA MEMÓRIA AO PARAR
    cleanMemory();
    console.log('🧹 Memória limpa ao parar o sistema');
  }

  /**
   * Atualiza o intervalo baseado no estado da página
   */
  function updateInterval() {
    if (interval) {
      clearInterval(interval);
    }
    
    // Obtém velocidade base do controle
    const baseSpeed = parseInt(document.getElementById('speed')?.value || 50);
    
    // Ajusta velocidade baseado no estado do background
    let adjustedSpeed = baseSpeed;
    
    if (window.BackgroundProcessor && window.BackgroundProcessor.isInBackground()) {
      // Em background: mantém a mesma velocidade (não diminui)
      adjustedSpeed = baseSpeed;
      console.log(`⚡ Processando em background com velocidade mantida: ${adjustedSpeed}ms`);
    } else {
      // Em foreground: usa velocidade normal
      adjustedSpeed = baseSpeed;
    }
    
    interval = setInterval(step, adjustedSpeed);
  }

  /**
   * Registra o processador no Background Processor
   */
  function registerWithBackgroundProcessor() {
    if (window.BackgroundProcessor) {
      window.BackgroundProcessor.register('auto16', {
        onVisibilityChange: (data) => {
          console.log('🔄 Auto16: Mudança de visibilidade detectada', data);
          if (running) {
            updateInterval(); // Ajusta intervalo imediatamente
          }
        },
        enableAggressiveMode: (data) => {
          console.log('⚡ Auto16: Modo agressivo ativado', data);
          if (running) {
            updateInterval(); // Mantém velocidade máxima
          }
        },
        enableNormalMode: (data) => {
          console.log('🔄 Auto16: Modo normal ativado', data);
          if (running) {
            updateInterval(); // Retorna à velocidade normal
          }
        },
        optimizeForLongBackground: (data) => {
          console.log('🔧 Auto16: Otimizando para long background', data);
          // Limpa variáveis desnecessárias se possível
          if (window.gc) {
            window.gc();
          }
        }
      });
    }
  }

  function clear() {
    if (running || (window.presetManager && window.presetManager.hasActivePreset())) return;
    stateCounter = 0n;
    realValue = 0n;
    hexBox.value = '';
    wifBox.value = '';
    wifBoxUncompressed.value = '';
    if (window.matrizAPI) window.matrizAPI.clear();
    dualLowOffset = 0n;
    dualHighOffset = 0n;
    dualFromLow = true;
  }

  function randomize() {
    if (running || (window.presetManager && window.presetManager.hasActivePreset())) return;
    if (window.matrizAPI) window.matrizAPI.randomize();
  }

  /* =====================================================
     EVENT LISTENERS
     ===================================================== */

  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!window.presetManager || !window.presetManager.hasActivePreset()) clear();
    });
  });

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (!window.presetManager || !window.presetManager.hasActivePreset()) start();
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      if (!window.presetManager || !window.presetManager.hasActivePreset()) stop();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!window.presetManager || !window.presetManager.hasActivePreset()) clear();
    });
  }

  if (randBtn) {
    randBtn.addEventListener('click', () => {
      if (!window.presetManager || !window.presetManager.hasActivePreset()) randomize();
    });
  }

  window.addEventListener('presetApplied', (event) => {
    if (running) stop();
  });

  window.addEventListener('presetReset', (event) => {
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (clearBtn) clearBtn.disabled = false;
    if (randBtn) randBtn.disabled = false;
  });

  if (window.ProgressTracker && window.ProgressTracker.isActive()) {
    window.ProgressTracker.stop();
  }

  /* =====================================================
     API PÚBLICA
     ===================================================== */
  // Inicializa o Background Processor
  setTimeout(() => {
    registerWithBackgroundProcessor();
  }, 100);
  
  // 🔄 Inicializa Background Execution Manager
  setTimeout(() => {
    initBackgroundExecution();
  }, 200);

  /* =====================================================
     FUNÇÕES DE BACKGROUND EXECUTION
     ===================================================== */
  
  function initBackgroundExecution() {
    // Verifica se o Background Execution Manager está disponível
    if (window.BackgroundExecutionManager) {
      backgroundManager = window.BackgroundExecutionManager;
      useBackgroundExecution = true;
      
      console.log('🔄 Background Execution habilitado para auto16');
      
      // Configura handlers para o worker
      if (backgroundManager.worker) {
        backgroundManager.worker.onmessage = (e) => {
          const { type, data } = e.data;
          
          if (type === 'EXECUTE_CYCLE') {
            // Verifica se é um batch execution
            if (data.batchIndex !== undefined) {
              // Último item do batch - atualiza displays
              if (data.batchIndex === data.batchSize - 1) {
                executeBatch(data.batchSize);
              } else {
                // Itens intermediários - executa sem atualizar displays
                executeCycleNoDisplay();
              }
            } else {
              // Execução normal (fallback)
              executeCycle();
            }
          }
        };
      }
    }
  }
  
  function executeCycleNoDisplay() {
    // Executa o ciclo sem atualizar displays (otimização para batch)
    if (!running) return;
    
    try {
      if (dualFromLow) {
        dualLowOffset += 1n;
        if (dualLowOffset >= 100000000n) {
          dualLowOffset = 0n;
          dualFromLow = false;
        }
      } else {
        dualHighOffset += 1n;
        if (dualHighOffset >= 100000000n) {
          dualHighOffset = 0n;
          dualFromLow = true;
        }
      }
      
      stateCounter += 1n;
      verificationCount++;
      
      // Limpeza de memória se necessário
      if (verificationCount >= 1000) {
        verificationCount = 0;
        if (window.gc) {
          window.gc();
        }
      }
      
    } catch (error) {
      console.error('❌ Erro no ciclo rápido:', error);
    }
  }
  
  function executeCycle() {
    if (!running) return;
    
    try {
      // Executa o ciclo principal
      if (dualFromLow) {
        dualLowOffset += 1n;
        if (dualLowOffset >= 100000000n) {
          dualLowOffset = 0n;
          dualFromLow = false;
        }
      } else {
        dualHighOffset += 1n;
        if (dualHighOffset >= 100000000n) {
          dualHighOffset = 0n;
          dualFromLow = true;
        }
      }
      
      stateCounter += 1n;
      
      // Atualiza displays apenas periodicamente para otimizar performance
      if (stateCounter % 10n === 0n) {
        updateDisplays();
      }
      
      // Limpeza de memória periódica
      verificationCount++;
      if (verificationCount >= 1000) {
        verificationCount = 0;
        // Força garbage collection se disponível
        if (window.gc) {
          window.gc();
        }
      }
      
    } catch (error) {
      console.error('❌ Erro no ciclo de background:', error);
    }
  }
  
  // Função para executar múltiplos ciclos em batch (otimização)
  function executeBatch(cycles) {
    if (!running) return;
    
    try {
      for (let i = 0; i < cycles && running; i++) {
        if (dualFromLow) {
          dualLowOffset += 1n;
          if (dualLowOffset >= 100000000n) {
            dualLowOffset = 0n;
            dualFromLow = false;
          }
        } else {
          dualHighOffset += 1n;
          if (dualHighOffset >= 100000000n) {
            dualHighOffset = 0n;
            dualFromLow = true;
          }
        }
        
        stateCounter += 1n;
        verificationCount++;
      }
      
      // Atualiza displays após o batch
      updateDisplays();
      
      // Limpeza de memória se necessário
      if (verificationCount >= 1000) {
        verificationCount = 0;
        if (window.gc) {
          window.gc();
        }
      }
      
    } catch (error) {
      console.error('❌ Erro no batch execution:', error);
    }
  }
  
  function updateDisplays() {
    // Atualiza os displays apenas se a página estiver visível
    if (!document.hidden) {
      try {
        if (hexBox) {
          const hex = (dualLowOffset + dualHighOffset * 100000000n).toString(16).padStart(16, '0').toUpperCase();
          hexBox.value = hex;
        }
        
        if (wifBox) {
          const hex = (dualLowOffset + dualHighOffset * 100000000n).toString(16).padStart(64, '0');
          toWIF(hex, true).then(wif => {
            if (wifBox) wifBox.value = wif;
          });
        }
        
        if (wifBoxUncompressed) {
          const hex = (dualLowOffset + dualHighOffset * 100000000n).toString(16).padStart(64, '0');
          toWIF(hex, false).then(wif => {
            if (wifBoxUncompressed) wifBoxUncompressed.value = wif;
          });
        }
      } catch (error) {
        console.warn('⚠️ Erro ao atualizar displays:', error);
      }
    }
  }
  
  // Modifica as funções start/stop para usar background
  const originalStart = start;
  const originalStop = stop;
  
  start = function(speed = 100) {
    if (running) return;
    
    running = true;
    
    if (useBackgroundExecution && backgroundManager) {
      // Usa background execution
      backgroundManager.start(speed);
      console.log('🚀 Iniciando execução em background');
    } else {
      // Fallback para execução normal
      originalStart(speed);
    }
  };
  
  stop = function() {
    if (!running) return;
    
    running = false;
    
    if (useBackgroundExecution && backgroundManager) {
      backgroundManager.stop();
      console.log('⏹️ Parando execução em background');
    } else {
      originalStop();
    }
  };
  
  // Exporta funções para uso externo
  window.auto16 = {
    start: start,
    stop: stop,
    clear: clear,
    randomize: randomize,
    running: () => running,
    executeCycle: executeCycle,
    updateDisplay: updateDisplays
  };

  // API pública
  window.auto16API = {
    start,
    stop,
    clear,
    randomize,
    isRunning: () => running,
    getStateCounter: () => stateCounter,
    getRealValue: () => realValue,
    clearFoundWalletsCache: () => {
      foundWalletsCache.clear();
      console.log('🔄 Cache de carteiras encontradas limpo');
    },
    getFoundWalletsCount: () => foundWalletsCache.size
  };

  console.log('✅ auto16.js (modo normal) carregado com sucesso');
});
