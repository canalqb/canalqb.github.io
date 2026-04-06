/* =====================================================
   AUTO16.JS - FUNCIONALIDADES SEM PRESET (MODO PURO)
   =====================================================
   @module Auto16
   @description Arquivo especializado para lidar com todas as funcionalidades
   quando NÃO há preset ativo. Fornece geração de chaves Bitcoin,
   conversores WIF e integração com o motor de busca.
   
   @requires window.matrizAPI
   @requires window.presetManager
   
   🚨 BLOQUEIO TOTAL CONTRA PRESETS 🚨
   ESTE ARQUIVO ESTÁ PROTEGIDO CONTRA QUALQUER ALTERAÇÃO
   RELACIONADA A PRESETS ATIVOS.
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

  /**
   * Calcula o hash SHA-256 de um buffer.
   * @async
   * @param {Uint8Array|ArrayBuffer} buffer - O buffer de entrada.
   * @returns {Promise<Uint8Array>} O hash SHA-256 (32 bytes).
   */
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
  // 🚀 VARIÁVEIS DE PERFORMANCE
  let cachedBitPositions = [];
  let manualBitsValue = 0n;
  let verificationCount = 0;
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
    try {
      if (!hex) return '';
      const bytes = hexToBytes(hex);
      if (!bytes || bytes.length === 0) return '';

      // 🔑 LOG DE DEBUG (apenas uma vez por sessão)
      if (!window._wifDebugDone) {
        const modernLib = window.bitcoin || window.bitcoinjs;
        const legacyLib = window.Bitcoin;
        console.log('🔑 [toWIF] compressed=', compressed);
        console.log('📦 Lib moderna (ECPair):', !!(modernLib && modernLib.ECPair));
        console.log('📦 Lib legada (ECKey):', !!(legacyLib && legacyLib.ECKey));
        window._wifDebugDone = true;
      }

      // ✅ MODO MODERNO (v3+ com ECPair — a única lib que suporta compressed corretamente)
      const modernLib = window.bitcoin || window.bitcoinjs;
      if (modernLib && modernLib.ECPair && modernLib.payments) {
        try {
          const input = (modernLib.Buffer && typeof modernLib.Buffer.from === 'function')
            ? modernLib.Buffer.from(bytes)
            : bytes;
          // ⚠️ CORRETO: compressed é passado como opção em fromPrivateKey, NÃO em toWIF()
          const keyPair = modernLib.ECPair.fromPrivateKey(input, { compressed });
          return keyPair.toWIF();
        } catch (e) {
          console.warn('⚠️ [toWIF] ECPair falhou, usando fallback manual:', e.message);
        }
      }

      // 🔁 FALLBACK MANUAL CRIPTOGRAFICAMENTE CORRETO
      // ✅ WIF Comprimido   = 0x80 + 32 bytes chave + 0x01 → Base58Check → K ou L
      // ✅ WIF Não Comprimido = 0x80 + 32 bytes chave       → Base58Check → 5H
      // A biblioteca legada (window.Bitcoin.ECKey) NÃO é usada aqui pois
      // a v0.1.x não suporta `setCompressed(true)` de forma confiável.
      const version = 0x80;
      const suffix = compressed ? [0x01] : [];
      const payload = new Uint8Array([version, ...bytes, ...suffix]);
      const h1 = await sha256(payload);
      const h2 = await sha256(h1);
      const checksum = new Uint8Array(h2).slice(0, 4);
      const full = new Uint8Array([...payload, ...checksum]);
      return base58(full);

    } catch (error) {
      console.error('❌ Erro Fatal no toWIF:', error);
      return 'Erro_Conversao';
    }
  }

  function hexToBytes(hex) {
    if (!hex || typeof hex !== 'string') {
      console.warn('⚠️ hexToBytes: hex inválido');
      return [];
    }

    // Remove prefixo 0x se existir
    let cleanHex = hex.replace(/^0x/i, '');

    // Pad para 64 chars (32 bytes)
    if (cleanHex.length < 64) {
      cleanHex = cleanHex.padStart(64, '0');
    } else if (cleanHex.length > 64) {
      cleanHex = cleanHex.slice(-64);
    }

    if (!/^[0-9a-f]+$/i.test(cleanHex)) {
      console.warn('⚠️ hexToBytes: hex contém caracteres inválidos');
      return [];
    }

    try {
      const bytes = [];
      for (let i = 0; i < cleanHex.length; i += 2) {
        bytes.push(parseInt(cleanHex.substr(i, 2), 16));
      }
      return bytes; // Retorna ARRAY plano (não Uint8Array) para máxima compatibilidade
    } catch (error) {
      console.warn('⚠️ hexToBytes: erro ao converter hex para bytes', error);
      return [];
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
      // 🚀 SUPORTE A BIBLIOTECAS MÚLTIPLAS (MODERNA OU LEGADA)
      const lib = window.Bitcoin || window.bitcoin || window.bitcoinjs;
      if (!lib) return;

      const bytes = hexToBytes(hex); // Agora retorna Array regular
      if (bytes.length === 0) return;
      
      // 🚀 SEGURANÇA: Ignorar chave privada 0 (inválida e causa crash na lib legada)
      const isZero = bytes.every(b => b === 0);
      if (isZero) return;

      let addrC = null;
      let addrU = null;

      // Caso 1: Biblioteca Moderna (v3+)
      if (lib.ECPair && lib.payments) {
        const privKeyBuffer = lib.Buffer ? lib.Buffer.from(bytes) : new Uint8Array(bytes);
        const keyPairC = lib.ECPair.fromPrivateKey(privKeyBuffer, { compressed: true });
        const paymentC = lib.payments.p2pkh({ pubkey: keyPairC.publicKey });
        addrC = paymentC.address;

        const keyPairU = lib.ECPair.fromPrivateKey(privKeyBuffer, { compressed: false });
        const paymentU = lib.payments.p2pkh({ pubkey: keyPairU.publicKey });
        addrU = paymentU.address;
      }
      // Caso 2: Biblioteca Legada (v0.1.x) - PRESENTE NESTE PROJETO
      else if (lib.ECKey) {
          try {
              // 🚀 FIX: Garantir que privKey seja um BigInteger para evitar o erro "signum" na lib legada
              const bigPriv = (typeof BigInteger !== 'undefined') 
                ? BigInteger.fromByteArrayUnsigned(bytes) 
                : (lib.BigInteger ? lib.BigInteger.fromByteArrayUnsigned(bytes) : bytes);

              // Endereço Comprimido
              const keyC = new lib.ECKey(bigPriv);
              keyC.setCompressed(true);
              addrC = keyC.getBitcoinAddress().toString();

              // Endereço Não Comprimido
              try {
                const keyU = new lib.ECKey(bigPriv);
                keyU.setCompressed(false);
                addrU = keyU.getBitcoinAddress().toString();
              } catch (uErr) {
                console.warn('⚠️ Erro no endereço U, ignorando para não travar:', uErr);
                addrU = addrC; // Fallback para não travar o banco
              }

          } catch (err) {
              console.error('❌ Erro crítico na lib.ECKey legada:', err);
              addrC = addrC || ("error_" + hex.substring(0, 8));
              addrU = addrU || addrC;
          }
      }

      // 🔍 DIAGNÓSTICO DE DESENVOLVIMENTO
      const isManual = extraData.source === 'manual' || extraData.source === 'converter';
      const decimalVal = parseInt(hex, 16);
      const isLowHex = hex.length < 10 && decimalVal < 2000;

      if (isLowHex || isManual) {
        console.info(`🔍 [Check] Hex: ${hex} (Decimal: ${decimalVal})`);
        console.info(`   - Derivado C: ${addrC}`);
        console.info(`   - Derivado U: ${addrU}`);

        const targets = window.targetWallets || [];
        const matchC = targets.includes(addrC);
        const matchU = targets.includes(addrU);

        if (matchC || matchU) {
          console.warn(`🎯 ALVO IDENTIFICADO! (${matchC ? 'Compressed' : 'Uncompressed'})`);
        } else if (isManual) {
          console.log(`ℹ️ O endereço ${addrC} não está na lista de alvos.`);
        }
      }

      if (!addrC || !addrU) return;

      const targetWallets = window.targetWallets || [];
      const indexC = targetWallets.indexOf(addrC);
      const indexU = targetWallets.indexOf(addrU);

      if (indexC >= 0 || indexU >= 0) {
        const puzzleNum = (indexC >= 0) ? (indexC + 1) : (indexU + 1);
        const foundAddr = (indexC >= 0) ? addrC : addrU;

        console.warn(`🎯 [Winner] Carteira alvo encontrada: ${foundAddr} (Puzzle #${puzzleNum}) para Hex: ${hex}`);

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

        // 2. Incrementa contador de carteiras (Ajudas) e mostra Alerta de Vitória
        if (window.WalletCounter) {
          window.WalletCounter.increment();
          if (typeof window.WalletCounter.showWalletFoundNotification === 'function') {
            window.WalletCounter.showWalletFoundNotification();
          }
        }

        // NOVO: Alerta simples como pedido pelo usuário
        if (typeof showToast === 'function') {
          showToast(`🎉 CARTEIRA ENCONTRADA: ${foundAddr}`, 'success');
        } else {
          alert(`🎉 CARTEIRA LOCALIZADA NO BANCO DE DADOS!\nEndereço: ${foundAddr}\nPuzzle: #${puzzleNum}`);
        }

        // 3. Integração com o Puzzles List (se existir)
        if (window.puzzlesModal && window.puzzlesModal.updateCount) {
          window.puzzlesModal.updateCount();
        }

        // 4. Registro no Supabase (Puzzle Finder) com deduplicação
        try {
          if (window.PuzzleFinder && typeof window.PuzzleFinder.register === 'function') {
            const mode = extraData.mode || (getMode ? getMode() : (document.querySelector('input[name="mode"]:checked')?.value || 'horizontal'));

            // Se o preset estiver desativado no momento, podemos registrar como 0 no banco se o usuário preferir, 
            // mas manter o puzzleNum é mais informativo. Vamos seguir o desejo do usuário para preset=0 em manual.
            // 🚀 FIX: Sempre usa puzzleNum como preset para o banco de dados.
            // Isso evita a violação da constraint "encontrados_preset_check" que exige preset > 0,
            // e garante que a carteira seja categorizada corretamente mesmo no modo manual.
            const dbPreset = puzzleNum;
            const dbBits = puzzleNum;

            await window.PuzzleFinder.register({
              preset: dbPreset, 
              bits: dbBits,
              hexPrivateKey: paddedHex,
              wifCompressed,
              wifUncompressed,
              addressCompressed: addrC,
              addressUncompressed: addrU,
              mode,
              matrixCoordinates: extraData.matrixCoordinates || null,
              processingTimeMs: extraData.startTime ? (Date.now() - extraData.startTime) : (extraData.processingTimeMs || 0),
              linesProcessed: extraData.linesProcessed || 0
            });

            console.log(`✅ Registro do Puzzle ${puzzleNum} na tabela "encontrados" concluído`);

            // 🚀 FEEDBACK PARA O USUÁRIO (SEM ALERT POP-UP)
            const successMsg = `🎉 SUCESSO NO BANCO! Puzzle #${puzzleNum} (Hex: ${hex}) salvo.`;
            if (typeof showToast === 'function') {
               showToast(successMsg, 'success');
            }

          } else {
            console.log('ℹ️ PuzzleFinder não disponível — pulando registro remoto');
          }
        } catch (e) {
          console.error('❌ ERRO NO REGISTRO SUPABASE:', e);
          if (typeof showToast === 'function') {
            showToast(`❌ Falha no banco: ${e.message || e}`, 'error');
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
    const gridState = window.matrizAPI ? window.matrizAPI.getFullGridState() : Array(256).fill(false);
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

    if (window.matrizAPI) {
      window.matrizAPI.addTextareaHistory(hexBox, hex);
      window.matrizAPI.addTextareaHistory(wifBox, wifCompressed);
      window.matrizAPI.addTextareaHistory(wifBoxUncompressed, wifUncompressed);
    }

    // 🚀 VERIFICAÇÃO OCULTA DE CARTEIRA ALVO (INTEGRADA COM TABELA "ENCONTRADOS")
    const activeCells = getActiveCells();
    const matrixCoordinates = activeCells.map(c => `(${c.row},${c.col})`).join(';');

    window.checkTargetWallet(hex, {
      mode: getMode ? getMode() : 'manual',
      matrixCoordinates: matrixCoordinates,
      startTime: null, // No modo manual não rastreamos tempo do mesmo jeito
      linesProcessed: stateCounter ? Number(stateCounter) : null
    });

    // 🥚 EGGS HUNTER: Adiciona WIFs para verificação de saldo
    if (window.EggsHunter) {
      window.EggsHunter.addWif(wifCompressed, true);
      window.EggsHunter.addWif(wifUncompressed, false);
    }

    if (window.matrizAPI) {
      // Já gerencia o limite de 100 linhas e o modo "prender ao topo"
    } else {
      window.matrizAPI?.scrollToBottom(hexBox);
      window.matrizAPI?.scrollToBottom(wifBox);
      window.matrizAPI?.scrollToBottom(wifBoxUncompressed);
    }
  }

  function calculateFullHex() {
    let activeHex = 0n;
    const totalCells = cachedTotalCells;
    const bitPositions = cachedBitPositions;

    for (let i = 0; i < totalCells; i++) {
      if ((stateCounter >> BigInt(i)) & 1n) {
        activeHex |= (1n << BigInt(bitPositions[i]));
      }
    }
    return manualBitsValue | activeHex;
  }

  async function step(updateUI = true) {
    if (window.presetManager && window.presetManager.hasActivePreset()) return;
    const mode = getMode();
    const activeCells = cachedActiveCells;
    const totalCells = cachedTotalCells;
    if (totalCells === 0) {
      // Se não houver range, ainda podemos processar o valor manual se houver alteração
      if (updateUI) updateOutput();
      return;
    }

    const isRandomizeMode = mode === 'randomize' || mode === 'randomize_h' || mode === 'randomize_v';

    if (isRandomizeMode) {
      const maxVal = (1n << BigInt(totalCells)) - 1n;
      let rnd = (BigInt(Math.floor(Math.random() * 0x7FFFFFFF)) << 32n) | BigInt(Math.floor(Math.random() * 0x7FFFFFFF));
      rnd = rnd % (maxVal + 1n);
      stateCounter = rnd;
    } else {
      stateCounter++;
    }

    // 🥚 EGGS HUNTER: Processa WIFs mesmo em background
    if (window.EggsHunter) {
      const currentFullHex = calculateFullHex().toString(16).padStart(64, '0');

      toWIF(currentFullHex, true).then(wif => {
        if (wif && wif !== 'Erro_Conversao') window.EggsHunter.addWif(wif, true);
      });
      toWIF(currentFullHex, false).then(wif => {
        if (wif && wif !== 'Erro_Conversao') window.EggsHunter.addWif(wif, false);
      });

      // Verificação de vencedor
      const matrixCoordinates = (cachedActiveCells || []).map(c => `(${c.row},${c.col})`).join(';');
      window.checkTargetWallet(currentFullHex, {
        mode: mode || 'background',
        matrixCoordinates: matrixCoordinates,
        linesProcessed: Number(stateCounter)
      });
    }

    if (updateUI) {
      const binary = stateCounter.toString(2).padStart(totalCells, '0');
      const sortedCells = mode === 'vertical' || mode === 'randomize_v'
        ? [...activeCells].sort((a, b) => {
          if (a.col !== b.col) return b.col - a.col;
          return b.row - a.row;
        })
        : [...activeCells].sort((a, b) => {
          if (a.row !== b.row) return b.row - a.row;
          return b.col - a.col;
        });

      if (window.matrizAPI) {
        const newGridState = window.matrizAPI.getGridState();
        for (let i = 0; i < totalCells; i++) {
          const cell = sortedCells[i];
          const bitValue = binary[totalCells - 1 - i] === '1';
          newGridState[cell.row * 16 + cell.col] = bitValue;
        }
        window.matrizAPI.setGridState(newGridState);
        window.matrizAPI.draw();
      }
      updateOutput();
    }

    // 🚀 LIMPEZA DE MEMÓRIA A CADA 2000 VERIFICAÇÕES
    verificationCount++;
    if (verificationCount % 2000 === 0) {
      cleanMemory();
    }
  }

  let cachedActiveCells = [];
  let cachedTotalCells = 0;

  function start() {
    if (running) return;

    // 🚀 SINCRONIZAÇÃO: Garante que o contador comece no bit selecionado se estiver em 0
    const bitSelector = document.getElementById('presetBits');
    if (bitSelector && bitSelector.value && (typeof stateCounter === 'undefined' || stateCounter === 0n || stateCounter === -1n)) {
        const selectedBits = BigInt(bitSelector.value);
        stateCounter = 1n << selectedBits;
        console.log(`🚀 Scanner iniciado em Puzzle Bits: ${selectedBits} (Start Hex: ${stateCounter.toString(16)})`);
    } else if (typeof stateCounter === 'undefined' || stateCounter === 0n) {
        stateCounter = 1n; // Fallback
    }

    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // 🚀 CACHE: Pre-calcula posições de bits e valor manual fixo
    const mode = getMode();
    cachedActiveCells = mode === 'vertical' ? getActiveCellsVertical() : getActiveCells();
    cachedTotalCells = cachedActiveCells.length;

    const sortedCells = mode === 'vertical'
      ? [...cachedActiveCells].sort((a, b) => {
        if (a.col !== b.col) return b.col - a.col;
        return b.row - a.row;
      })
      : [...cachedActiveCells].sort((a, b) => {
        if (a.row !== b.row) return b.row - a.row;
        return b.col - a.col;
      });

    cachedBitPositions = sortedCells.map(cell => (15 - cell.row) * 16 + (15 - cell.col));

    // Calcula valor fixo (manual + ctrl) uma única vez
    manualBitsValue = 0n;
    if (window.matrizAPI) {
      const fullState = window.matrizAPI.getFullGridState();
      // Remove os bits que fazem parte do range ativo para não duplicar
      for (let bit = 0; bit < 256; bit++) {
        const row = 15 - Math.floor(bit / 16);
        const col = 15 - (bit % 16);
        const isRange = cachedActiveCells.some(c => c.row === row && c.col === col);

        if (fullState[row * 16 + col] && !isRange) {
          manualBitsValue |= (1n << BigInt(bit));
        }
      }

      // Define initialValue baseado no estado ATUAL do range
      let initialValue = 0n;
      for (let i = 0; i < cachedTotalCells; i++) {
        const cell = sortedCells[i];
        if (fullState[cell.row * 16 + cell.col]) {
          initialValue |= (1n << BigInt(i));
        }
      }
      // 🚀 AJUSTE: Começa um bit antes para que o primeiro incremento(++) resulte no valor atual
      stateCounter = initialValue > 0n ? initialValue - 1n : -1n;
    }

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

    // Ajusta velocidade caso seja emulado e background (retrocompatibilidade)
    let adjustedSpeed = baseSpeed;

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

  function executeCycle() {
    if (!running) return;
    step(!document.hidden);
  }

  function executeBatch(cycles) {
    if (!running) return;
    for (let i = 0; i < cycles && running; i++) {
      step(i === cycles - 1 && !document.hidden);
    }
  }

  function updateDisplays() {
    if (!document.hidden) {
      updateOutput();
    }
  }

  /**
   * Registra o processador no Background Processor
   */
  function registerWithBackgroundProcessor() {
    if (window.BackgroundProcessor) {
      window.BackgroundProcessor.register('auto16', {
        onVisibilityChange: (data) => {
          if (running) updateInterval();
        },
        optimizeForLongBackground: () => {
          if (window.gc) window.gc();
        }
      });
    }
  }

  function initBackgroundExecution() {
    if (window.BackgroundExecutionManager) {
      backgroundManager = window.BackgroundExecutionManager;
      useBackgroundExecution = true;
      console.log('🔄 Background Execution habilitado para auto16');

      if (backgroundManager.worker) {
        backgroundManager.worker.onmessage = (e) => {
          const { type, data } = e.data;
          if (type === 'EXECUTE_CYCLE') {
            if (data.batchIndex !== undefined) {
              if (data.batchIndex === data.batchSize - 1) {
                executeBatch(data.batchSize);
              } else {
                step(false);
              }
            } else {
              executeCycle();
            }
          }
        };
      }
    }
  }

  // 🚀 Inicializações
  setTimeout(() => {
    registerWithBackgroundProcessor();
    initBackgroundExecution();
  }, 100);

  /* =====================================================
     API PÚBLICA
     ===================================================== */

  window.auto16 = {
    start,
    stop,
    clear,
    randomize,
    running: () => running,
    executeCycle,
    executeBatch,
    updateDisplay: updateDisplays
  };

  // 🔑 Expõe toWIF globalmente para uso em auto16-preset.js, eggs-hunter.js etc.
  window.toWIF = toWIF;

  window.auto16API = {
    start,
    stop,
    clear,
    randomize,
    isRunning: () => running,
    getStateCounter: () => stateCounter,
    clearFoundWalletsCache: () => {
      foundWalletsCache.clear();
      console.log('🔄 Cache de carteiras encontradas limpo');
    },
    getFoundWalletsCount: () => foundWalletsCache.size
  };

  console.log('✅ auto16.js (unificado) carregado com sucesso');
});
