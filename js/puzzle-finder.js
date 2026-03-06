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

(function() {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  const CONFIG = {
    TABELA: 'ovo_ia_puzzles_encontrados',
    API_VERSION: 'v20240301', // Versão da API Supabase
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
      // Tenta múltiplas fontes de configuração
      if (window.SupabaseDB && window.SupabaseDB.getConfig) {
        const config = window.SupabaseDB.getConfig();
        if (config && config.url && config.key) {
          supabaseUrl = config.url;
          supabaseKey = config.key;
        }
      }
      
      // Fallback para variáveis globais
      if (!supabaseUrl && window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
        supabaseUrl = window.SUPABASE_URL;
        supabaseKey = window.SUPABASE_ANON_KEY;
      }
      
      // Fallback para GitHub Secrets
      if (!supabaseUrl && window.githubSecrets) {
        supabaseUrl = window.githubSecrets.supabaseUrl;
        supabaseKey = window.githubSecrets.supabaseAnonKey;
      }
      
      // Validação final
      if (supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')) {
        isReady = true;
        console.log('✅ Puzzle Finder: Configuração Supabase carregada');
        return true;
      }
      
      console.warn('⚠️ Puzzle Finder: Configuração Supabase não encontrada');
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
          'Prefer': 'return=minimal',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
    
    // Prepara dados para inserção
    const insertData = {
      preset: Number(preset),
      hex_private_key: hexPrivateKey.replace(/^0x/, '').toLowerCase(),
      wif_compressed: wifCompressed,
      wif_uncompressed: wifUncompressed,
      address_compressed: addressCompressed || null,
      address_uncompressed: addressUncompressed || null,
      bits: Number(bits || preset),
      mode: mode,
      matrix_coordinates: matrixCoordinates || null,
      processing_time_ms: processingTimeMs || null,
      lines_processed: linesProcessed || null,
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
        mode,
        hexKey: hexPrivateKey.substring(0, 8) + '...',
        timestamp: insertData.discovery_timestamp
      });
      
      // Dispara evento global
      window.dispatchEvent(new CustomEvent('puzzleFound', {
        detail: {
          ...insertData,
          id: null, // Será gerado pelo banco
          success: true
        }
      }));
      
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
      orderBy = 'discovery_timestamp',
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
    
    // Utilitários
    validateHexPrivateKey,
    validateWIF,
    validateBitcoinAddress,
    
    // Configuração
    CONFIG: CONFIG
  };
  
  console.log('✅ Puzzle Finder carregado. Use window.PuzzleFinder para API.');
  
})();
