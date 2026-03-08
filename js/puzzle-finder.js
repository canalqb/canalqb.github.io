/**
 * PUZZLE FINDER - REGISTRO DE PUZZLES ENCONTRADOS
 * =============================================
 * Gerencia o registro de puzzles Bitcoin encontrados no Supabase
 * 
 * Funcionalidades:
 * - Registrar WIF quando puzzle é encontrado
 * - Buscar puzzles encontrados
 * - Validar dados antes de salvar
 * - Interface com Supabase via REST API
 */

(function () {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  const CONFIG = {
    TABELA: 'encontrados',
    API_VERSION: 'v1', // Versão da API Supabase
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  };

  // ============================================
  // ESTADO
  // ============================================
  let supabaseUrl = null;
  let supabaseKey = null;
  let isReady = false;

  // ============================================
  // UTILITÁRIOS
  // ============================================

  /**
   * Valida formato da chave privada hexadecimal
   */
  function validateHexPrivateKey(hex) {
    if (!hex || typeof hex !== 'string') return false;
    const cleanHex = hex.replace(/^0x/, '').toLowerCase();
    return /^[0-9a-f]{64}$/.test(cleanHex);
  }

  /**
   * Valida formato WIF
   */
  function validateWIF(wif) {
    if (!wif || typeof wif !== 'string') return false;
    // WIF Base58: 52 caracteres (comprimido) ou 51 (não comprimido)
    return /^[1-9A-HJ-NP-Za-km-z]{51,52}$/.test(wif);
  }

  /**
   * Valida endereço Bitcoin
   */
  function validateBitcoinAddress(address) {
    if (!address || typeof address !== 'string') return false;
    // Endereços Bitcoin começam com 1, 3 ou bc1
    return /^[13][1-9A-HJ-NP-Za-km-z]{33}$/.test(address) ||
      /^bc1[0-9a-zA-Z]{39,59}$/.test(address);
  }

  /**
   * Gera hash para deduplicação
   */
  function generateDiscoveryHash(hexKey, mode) {
    const crypto = window.crypto || window.msCrypto;
    const data = `${hexKey}_${mode}`;
    const encoder = new TextEncoder();
    const dataArray = encoder.encode(data);

    if (crypto.subtle) {
      return crypto.subtle.digest('SHA-256', dataArray).then(buffer => {
        return Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      });
    }

    // Fallback para navegadores antigos
    return Promise.resolve(
      data.split('').reduce((hash, char) => {
        return ((hash << 5) - hash) + char.charCodeAt(0) | 0;
      }, 0).toString(16)
    );
  }

  /**
   * Tenta inicializar configuração do Supabase
   */
  async function initializeConfig() {
    try {
      // 🚀 TENTA OBTER CONFIGURAÇÃO DO SUPABASE-CONFIG.JS (VIA WINDOW.SUPABASEDB)
      if (window.SupabaseDB && window.SupabaseDB.config) {
        const config = window.SupabaseDB.config;
        supabaseUrl = config.SUPABASE_URL;
        supabaseKey = config.SUPABASE_ANON_KEY;
        console.log('🔧 Puzzle Finder: Configuração carregada via SupabaseDB');
      }

      // Fallback para ConfigManager
      if (!supabaseUrl && window.ConfigManager && window.ConfigManager.isSupabaseAvailable()) {
        const config = window.ConfigManager.getSupabaseConfig();
        supabaseUrl = config.url;
        supabaseKey = config.anonKey;
        console.log('🔧 Puzzle Finder: Configuração carregada via ConfigManager');
      }

      // Fallback para variáveis globais
      if (!supabaseUrl && window.SUPABASE_URL && window.SUPABASE_KEY) {
        supabaseUrl = window.SUPABASE_URL;
        supabaseKey = window.SUPABASE_KEY;
        console.log('🔧 Puzzle Finder: Configuração carregada via variáveis globais');
      }

      // Validação final
      if (supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')) {
        isReady = true;
        return true;
      }

      console.warn('⚠️ Puzzle Finder: Configuração Supabase não encontrada ou incompleta');
      return false;

    } catch (error) {
      console.error('❌ Puzzle Finder: Erro ao inicializar configuração', error);
      return false;
    }
  }

  /**
   * Faz requisição HTTP com retry
   */
  async function fetchWithRetry(url, options, retries = CONFIG.MAX_RETRIES) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation', // Mudado de minimal para representation para ver o erro detalhado
          ...options.headers
        }
      });

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = JSON.stringify(errorData);
          console.error('❌ [Supabase Error Detail]:', errorData);
        } catch (e) {
          errorDetail = response.statusText;
        }
        throw new Error(`HTTP ${response.status}: ${errorDetail}`);
      }

      return response;

    } catch (error) {
      if (retries > 0) {
        console.warn(`⚠️ Puzzle Finder: Tentativa ${CONFIG.MAX_RETRIES - retries + 1} falhou, retrying...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
        return fetchWithRetry(url, options, retries - 1);
      }

      throw error;
    }
  }

  // ============================================
  // API PÚBLICA
  // ============================================

  /**
   * Registra um puzzle encontrado
   */
  async function registerPuzzleFound(puzzleData) {
    if (!isReady) {
      await initializeConfig();
    }

    if (!isReady) {
      throw new Error('Puzzle Finder não está pronto - configuração Supabase ausente');
    }

    // Validação dos dados
    const {
      preset,
      hexPrivateKey,
      wifCompressed,
      wifUncompressed,
      addressCompressed,
      addressUncompressed,
      mode,
      bits,
      matrixCoordinates,
      processingTimeMs,
      linesProcessed
    } = puzzleData;

    // Validações obrigatórias
    if (!preset || !hexPrivateKey || !wifCompressed || !wifUncompressed || !mode) {
      throw new Error('Dados obrigatórios ausentes');
    }

    if (!validateHexPrivateKey(hexPrivateKey)) {
      throw new Error('Chave privada hexadecimal inválida');
    }

    if (!validateWIF(wifCompressed) || !validateWIF(wifUncompressed)) {
      throw new Error('WIF inválido');
    }

    if (addressCompressed && !validateBitcoinAddress(addressCompressed)) {
      throw new Error('Endereço comprimido inválido');
    }

    if (addressUncompressed && !validateBitcoinAddress(addressUncompressed)) {
      throw new Error('Endereço não comprimido inválido');
    }

    if (!['horizontal', 'vertical'].includes(mode)) {
      throw new Error('Modo inválido');
    }

    // Normaliza o modo para 'horizontal' ou 'vertical' para respeitar a constraint do banco
    let normalizedMode = mode.toLowerCase();
    if (normalizedMode.includes('horizontal') || normalizedMode.includes('_h') || normalizedMode === 'randomize') {
      normalizedMode = 'horizontal';
    } else if (normalizedMode.includes('vertical') || normalizedMode.includes('_v')) {
      normalizedMode = 'vertical';
    } else {
      normalizedMode = 'horizontal'; // Fallback
    }

    // Prepara dados para inserção conforme solicitado (exatamente os 11 campos + metadados padrão do banco)
    const insertData = {
      preset: preset ? Number(preset) : 0,
      hex_private_key: hexPrivateKey.replace(/^0x/, '').toLowerCase(),
      wif_compressed: wifCompressed,
      wif_uncompressed: wifUncompressed,
      address_compressed: addressCompressed || '',
      address_uncompressed: addressUncompressed || '',
      mode: normalizedMode,
      bits: bits ? Number(bits) : (preset ? Number(preset) : 0),
      matrix_coordinates: matrixCoordinates ? (typeof matrixCoordinates === 'object' ? JSON.stringify(matrixCoordinates) : String(matrixCoordinates)) : '',
      processing_time_ms: processingTimeMs ? Number(processingTimeMs) : 0,
      lines_processed: linesProcessed ? Number(linesProcessed) : 0,
      discovery_timestamp: new Date().toISOString()
    };

    // 🚀 VERIFICAÇÃO DE DUPLICATA ANTES DE INSERIR
    const isDuplicate = await checkPuzzleAlreadyFound(hexPrivateKey, mode);
    if (isDuplicate) {
      const duplicateError = new Error(`Puzzle com chave ${hexPrivateKey.substring(0, 8)}... já foi encontrado anteriormente`);
      duplicateError.code = 'DUPLICATE_PUZZLE';

      // Dispara evento de duplicata
      window.dispatchEvent(new CustomEvent('puzzleFoundDuplicate', {
        detail: {
          hexKey: hexPrivateKey,
          mode: mode,
          preset: preset
        }
      }));

      throw duplicateError;
    }

    try {
      const url = `${supabaseUrl}/rest/${CONFIG.API_VERSION}/${CONFIG.TABELA}`;
      const response = await fetchWithRetry(url, {
        method: 'POST',
        body: JSON.stringify(insertData)
      });

      console.log('✅ Puzzle Finder: Puzzle registrado com sucesso', {
        preset,
        mode: normalizedMode,
        hexKey: hexPrivateKey.substring(0, 8) + '...'
      });

      // Dispara evento global
      window.dispatchEvent(new CustomEvent('puzzleFound', {
        detail: {
          ...insertData,
          id: null, // Será gerado pelo banco
          success: true
        }
      }));

      // 🚀 MOSTRA O MODAL IMEDIATAMENTE APÓS ENCONTRAR
      setTimeout(() => {
        window.PuzzleFinder.showModal();
      }, 1000);

      return {
        success: true,
        data: insertData,
        message: 'Puzzle registrado com sucesso'
      };

    } catch (error) {
      // 🚀 TRATA ERRO DE UNIQUE CONSTRAINT DO BANCO
      if (error.message && error.message.includes('duplicate key') ||
        error.message && error.message.includes('unique constraint')) {
        const duplicateError = new Error(`Puzzle com chave ${hexPrivateKey.substring(0, 8)}... já existe no banco de dados`);
        duplicateError.code = 'DUPLICATE_PUZZLE';
        duplicateError.originalError = error;

        // Dispara evento de duplicata
        window.dispatchEvent(new CustomEvent('puzzleFoundDuplicate', {
          detail: {
            hexKey: hexPrivateKey,
            mode: mode,
            preset: preset
          }
        }));

        throw duplicateError;
      }

      console.error('❌ Puzzle Finder: Erro ao registrar puzzle', error);

      // Dispara evento de erro
      window.dispatchEvent(new CustomEvent('puzzleFoundError', {
        detail: {
          error: error.message,
          puzzleData: insertData
        }
      }));

      throw error;
    }
  }

  /**
   * Busca puzzles encontrados
   */
  async function getPuzzlesFound(options = {}) {
    if (!isReady) {
      await initializeConfig();
    }

    if (!isReady) {
      throw new Error('Puzzle Finder não está pronto');
    }

    const {
      preset,
      mode,
      limit = 50,
      offset = 0,
      orderBy = 'id', // 'id' é garantido existir como PK
      order = 'desc'
    } = options;

    try {
      let url = `${supabaseUrl}/rest/${CONFIG.API_VERSION}/${CONFIG.TABELA}?`;
      const params = new URLSearchParams();

      if (preset) params.append('preset', 'eq.' + preset);
      if (mode) params.append('mode', 'eq.' + mode);
      params.append('order', `${orderBy}.${order}`);
      params.append('limit', limit);
      params.append('offset', offset);

      url += params.toString();

      const response = await fetchWithRetry(url, { method: 'GET' });
      const data = await response.json();

      return {
        success: true,
        data: data,
        count: data.length
      };

    } catch (error) {
      console.error('❌ Puzzle Finder: Erro ao buscar puzzles', error);
      throw error;
    }
  }

  /**
   * Verifica se puzzle já foi encontrado
   */
  async function checkPuzzleAlreadyFound(hexPrivateKey, mode) {
    try {
      // 🚀 CORREÇÃO: Busca diretamente pela chave hexadecimal
      const cleanHex = hexPrivateKey.replace(/^0x/, '').toLowerCase();

      const url = `${supabaseUrl}/rest/${CONFIG.API_VERSION}/${CONFIG.TABELA}?`;
      const params = new URLSearchParams();
      params.append('hex_private_key', 'eq.' + cleanHex);
      params.append('limit', '1');

      const response = await fetchWithRetry(url + params.toString(), { method: 'GET' });
      const data = await response.json();

      // 🚀 VERIFICAÇÃO CORRETA: Retorna true se encontrar a chave
      const isDuplicate = data.length > 0;

      if (isDuplicate) {
        console.log(`⚠️ Puzzle Finder: Chave ${cleanHex.substring(0, 8)}... já foi encontrada anteriormente`);
      }

      return isDuplicate;

    } catch (error) {
      console.warn('⚠️ Puzzle Finder: Erro ao verificar duplicidade', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de puzzles encontrados
   */
  async function getDiscoveryStats() {
    try {
      const [horizontal, vertical, total] = await Promise.all([
        getPuzzlesFound({ mode: 'horizontal', limit: 1000 }),
        getPuzzlesFound({ mode: 'vertical', limit: 1000 }),
        getPuzzlesFound({ limit: 1000 })
      ]);

      const stats = {
        total: total.success ? total.data.length : 0,
        horizontal: horizontal.success ? horizontal.data.length : 0,
        vertical: vertical.success ? vertical.data.length : 0,
        presets: {}
      };

      // Agrupa por preset
      if (total.success) {
        total.data.forEach(puzzle => {
          if (!stats.presets[puzzle.preset]) {
            stats.presets[puzzle.preset] = { total: 0, horizontal: 0, vertical: 0 };
          }
          stats.presets[puzzle.preset].total++;
          stats.presets[puzzle.preset][puzzle.mode]++;
        });
      }

      return {
        success: true,
        stats: stats
      };

    } catch (error) {
      console.error('❌ Puzzle Finder: Erro ao obter estatísticas', error);
      throw error;
    }
  }

  /**
   * Mostra modal de carteiras encontradas (sem duplicidades)
   */
  function showFoundWalletsModal(foundWallets) {
    let modal = document.getElementById('found-wallets-modal');
    if (modal) modal.remove();

    // 🚀 DEDUPLICAÇÃO POR HEX (MANTÉM O MAIS RECENTE)
    const uniqueWalletsMap = new Map();

    for (const wallet of foundWallets) {
      const hex = wallet.hex_private_key.toLowerCase();
      if (!uniqueWalletsMap.has(hex)) {
        uniqueWalletsMap.set(hex, wallet);
      }
    }

    // Converte para array e identifica o número real do puzzle para ordenação
    const walletsArray = Array.from(uniqueWalletsMap.values()).map(w => {
      let puzzleNum = Number(w.preset);
      if (window.targetWallets) {
        const idxC = window.targetWallets.indexOf(w.address_compressed);
        const idxU = window.targetWallets.indexOf(w.address_uncompressed);
        if (idxC !== -1) puzzleNum = idxC + 1;
        else if (idxU !== -1) puzzleNum = idxU + 1;
      }
      return { ...w, puzzleNum };
    });

    // 🚀 ORDENAÇÃO CRESCENTE POR NÚMERO DO PUZZLE
    walletsArray.sort((a, b) => a.puzzleNum - b.puzzleNum);

    modal = document.createElement('div');
    modal.id = 'found-wallets-modal';
    modal.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95); color: white; padding: 25px; border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8); z-index: 20000; min-width: 600px;
      max-width: 90%; max-height: 80vh; overflow-y: auto; font-family: 'Segoe UI', sans-serif;
      border: 2px solid #ffd700; backdrop-filter: blur(15px);
    `;

    const walletRows = walletsArray.map((w, index) => `
      <div style="background: rgba(255,255,255,0.05); border-radius: 10px; margin-bottom: 10px; border: 1px solid rgba(255, 215, 0, 0.3); overflow: hidden;">
        <!-- HEADER DO CARD -->
        <div onclick="const body = this.nextElementSibling; const icon = this.querySelector('.toggle-icon'); if(body.style.display === 'none') { body.style.display = 'block'; icon.className = 'fas fa-chevron-up toggle-icon'; } else { body.style.display = 'none'; icon.className = 'fas fa-chevron-down toggle-icon'; }" 
             style="padding: 12px 15px; background: rgba(255, 215, 0, 0.1); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;">
          <span style="color: #ffd700; font-weight: bold; font-size: 15px;">
            <i class="fas fa-puzzle-piece" style="margin-right: 8px;"></i> Puzzle ${w.puzzleNum}
          </span>
          <i class="fas fa-chevron-down toggle-icon" style="color: #ffd700; font-size: 14px;"></i>
        </div>
        
        <!-- BODY DO CARD (Inicia colapsado) -->
        <div class="wallet-card-body" style="display: none; padding: 15px; border-top: 1px solid rgba(255, 215, 0, 0.2); background: rgba(0,0,0,0.3);">
          <div style="font-family: monospace; font-size: 12px; margin-bottom: 8px; word-break: break-all; display: flex; gap: 8px;">
            <strong style="color: #4fd1c5; white-space: nowrap;">HEX:</strong> 
            <span style="color: #e2e8f0;">${w.hex_private_key}</span>
          </div>
          <div style="font-family: monospace; font-size: 12px; margin-bottom: 8px; word-break: break-all; display: flex; gap: 8px;">
            <strong style="color: #4fd1c5; white-space: nowrap;">WIF (C):</strong> 
            <span style="color: #e2e8f0;">${w.wif_compressed}</span>
          </div>
          <div style="font-family: monospace; font-size: 12px; word-break: break-all; display: flex; gap: 8px;">
            <strong style="color: #4fd1c5; white-space: nowrap;">ADDR (C):</strong> 
            <span style="color: #ffd700;">${w.address_compressed || 'N/A'}</span>
          </div>
        </div>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
        <h2 style="margin: 0; color: #ffd700; font-size: 22px; display: flex; align-items: center; gap: 12px;">
          <i class="fas fa-trophy"></i> Carteiras Localizadas (Ordem Crescente)
        </h2>
        <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; color:white; cursor:pointer; font-size:28px; line-height: 1;">&times;</button>
      </div>
      <div id="found-wallets-list">
        ${walletRows || '<p style="text-align: center; opacity: 0.6; padding: 20px;">Nenhuma carteira encontrada no banco ainda.</p>'}
      </div>
      <div style="margin-top: 25px; text-align: center;">
        <button onclick="this.parentElement.parentElement.remove()" style="background: #ffd700; color: black; border: none; padding: 12px 40px; border-radius: 30px; font-weight: bold; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 15px rgba(255,215,0,0.3);">
          Fechar Galeria
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  // Inicializa automaticamente
  initializeConfig();

  // Expõe API pública
  window.PuzzleFinder = {
    // Controle
    isReady: () => isReady,
    getConfig: () => ({ supabaseUrl, supabaseKey, isReady }),

    // Operações principais
    register: registerPuzzleFound,
    findAll: getPuzzlesFound,
    checkDuplicate: checkPuzzleAlreadyFound,
    getStats: getDiscoveryStats,

    // UI
    showModal: async () => {
      try {
        const result = await getPuzzlesFound({ limit: 100 });
        if (result.success) {
          showFoundWalletsModal(result.data);
        }
      } catch (e) {
        console.error('Erro ao mostrar modal:', e);
      }
    },

    // Utilitários
    validateHexPrivateKey,
    validateWIF,
    validateBitcoinAddress,

    // Configuração
    CONFIG: CONFIG
  };

  console.log('✅ Puzzle Finder carregado. Use window.PuzzleFinder para API.');

})();
