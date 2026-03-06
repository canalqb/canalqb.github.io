/**
 * supabase-config.js
 * Configuração e cliente Supabase para rastreamento de progresso
 * Usa BigInt para precisão numérica em valores hexadecimais grandes
 * Integrado com Config Manager para segurança
 */

(function () {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO DINÂMICA (BASEADA NO AMBIENTE)
  // ============================================
  let CONFIG = {
    SUPABASE_URL: null,
    SUPABASE_ANON_KEY: null,
    TABELA: 'puzzle_progress',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000,
    TIMEOUT: 10000,
    ENABLED: false
  };

  // ============================================
  // CLIENTE SUPABASE
  // ============================================
  let supabaseClient = null;
  let isInitialized = false;

  /**
   * Carrega configurações do Config Manager
   */
  function loadConfigFromManager() {
    // 🚀 CORREÇÃO: Tenta múltiplas fontes para produção
    if (window.ConfigManager && window.ConfigManager.isSupabaseAvailable()) {
      const supabaseConfig = window.ConfigManager.getSupabaseConfig();
      CONFIG.SUPABASE_URL = supabaseConfig.url;
      CONFIG.SUPABASE_ANON_KEY = supabaseConfig.anonKey;
      CONFIG.ENABLED = true;
      
      console.log('🔧 Supabase configurado via Config Manager (ambiente local)');
      return true;
    }
    
    // 🚀 CORREÇÃO: Tenta GitHub Secrets para produção
    if (window.GitHubSecrets && window.GitHubSecrets.isAvailable()) {
      const githubConfig = window.GitHubSecrets.getSupabaseConfig();
      CONFIG.SUPABASE_URL = githubConfig.url;
      CONFIG.SUPABASE_ANON_KEY = githubConfig.anonKey;
      CONFIG.ENABLED = true;
      
      console.log('� Supabase configurado via GitHub Secrets (produção)');
      return true;
    }
    
    // 🚀 CORREÇÃO: Tenta variáveis globais injetadas
    if (typeof window.SUPABASE_URL !== 'undefined' && typeof window.SUPABASE_KEY !== 'undefined') {
      CONFIG.SUPABASE_URL = window.SUPABASE_URL;
      CONFIG.SUPABASE_ANON_KEY = window.SUPABASE_KEY;
      CONFIG.ENABLED = true;
      
      console.log('🚀 Supabase configurado via variáveis globais (produção)');
      return true;
    }
    
    console.log('🚫 Supabase não disponível - nenhuma fonte de configuração encontrada');
    CONFIG.ENABLED = false;
    return false;
  }

  /**
   * Inicializa cliente Supabase
   */
  function initSupabase() {
    if (isInitialized) return true;

    try {
      // 🚀 DEBUG: Verifica fontes de configuração
      console.log('🔍 [DEBUG] Verificando fontes de configuração:');
      console.log('  - ConfigManager:', !!window.ConfigManager);
      console.log('  - GitHubSecrets:', !!window.GitHubSecrets);
      console.log('  - SUPABASE_URL:', typeof window.SUPABASE_URL !== 'undefined' ? '***CONFIGURADO***' : 'NÃO CONFIGURADO');
      console.log('  - SUPABASE_KEY:', typeof window.SUPABASE_KEY !== 'undefined' ? '***CONFIGURADO***' : 'NÃO CONFIGURADO');

      // Carrega configurações do Config Manager
      if (!loadConfigFromManager()) {
        console.log('🚫 Supabase não inicializado - ambiente de produção');
        return false;
      }

      // Verifica se a biblioteca Supabase foi carregada
      if (typeof supabase === 'undefined') {
        console.error('❌ Biblioteca Supabase não carregada. Adicione o script CDN no HTML.');
        return false;
      }

      // Valida credenciais (apenas em ambiente local)
      if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY) {
        console.error('❌ Credenciais Supabase não configuradas');
        return false;
      }

      // Cria cliente
      supabaseClient = supabase.createClient(
        CONFIG.SUPABASE_URL,
        CONFIG.SUPABASE_ANON_KEY
      );

      isInitialized = true;
      console.log('✅ Cliente Supabase inicializado com sucesso (ambiente local)');
      return true;

    } catch (error) {
      console.error('❌ Erro ao inicializar Supabase:', error);
      return false;
    }
  }

  // ============================================
  // FUNÇÕES DE BANCO DE DADOS
  // ============================================

  /**
   * Busca progresso de um preset específico
   * @param {number} preset - Número do preset (0-256)
   * @returns {Promise<Object|null>} Dados do progresso ou null
   */
  async function fetchProgress(preset) {
    // Verifica se Supabase está disponível
    if (!CONFIG.ENABLED) {
      console.log('🚫 Supabase não disponível - ambiente de produção');
      return null;
    }

    if (!isInitialized && !initSupabase()) {
      throw new Error('Supabase não inicializado');
    }

    try {
      const { data, error } = await supabaseClient
        .from(CONFIG.TABELA)
        .select('*')
        .eq('preset', preset)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Registro não encontrado - retorna null
          console.log(`ℹ️ Preset ${preset} não encontrado no banco`);
          return null;
        }
        throw error;
      }

      console.log(`✅ Progresso do preset ${preset} carregado do banco`);
      return data;

    } catch (error) {
      console.error(`❌ Erro ao buscar progresso do preset ${preset}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza progresso de um preset
   * @param {number} preset - Número do preset
   * @param {string} novoInicio - Novo valor hexadecimal de início (64 chars)
   * @param {string} novoFim - Novo valor hexadecimal de fim (64 chars)
   * @returns {Promise<Object>} Dados atualizados
   */
  async function updateProgress(preset, novoInicio, novoFim) {
    if (!isInitialized && !initSupabase()) {
      throw new Error('Supabase não inicializado');
    }

    try {
      // Valida formato hexadecimal (agora aceita qualquer tamanho, apenas caracteres válidos)
      if (!/^[0-9a-f]+$/i.test(novoInicio) || !/^[0-9a-f]+$/i.test(novoFim)) {
        throw new Error('Formato hexadecimal inválido.');
      }

      // Normaliza para minúsculas
      const inicioNormalizado = novoInicio.toLowerCase();
      const fimNormalizado = novoFim.toLowerCase();

      const { data, error } = await supabaseClient
        .from(CONFIG.TABELA)
        .update({
          inicio: inicioNormalizado,
          fim: fimNormalizado,
          updated_at: new Date().toISOString()
        })
        .eq('preset', preset)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Preset ${preset} atualizado:`, {
        inicio: inicioNormalizado,
        fim: fimNormalizado
      });

      return data;

    } catch (error) {
      console.error(`❌ Erro ao atualizar preset ${preset}:`, error);
      throw error;
    }
  }

  /**
   * Cria registro inicial para um preset (se não existir)
   * @param {number} preset - Número do preset
   * @param {string} inicio - Valor hexadecimal de início
   * @param {string} fim - Valor hexadecimal de fim
   * @returns {Promise<Object>} Dados criados
   */
  async function createProgress(preset, inicio, fim) {
    if (!isInitialized && !initSupabase()) {
      throw new Error('Supabase não inicializado');
    }

    try {
      const { data, error } = await supabaseClient
        .from(CONFIG.TABELA)
        .insert([{
          preset: preset,
          inicio: inicio.toLowerCase(),
          fim: fim.toLowerCase()
        }])
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Preset ${preset} criado no banco`);
      return data;

    } catch (error) {
      console.error(`❌ Erro ao criar preset ${preset}:`, error);
      throw error;
    }
  }

  /**
   * Busca ou cria progresso de um preset
   * @param {number} preset - Número do preset
   * @param {string} inicioDefault - Início padrão se não existir
   * @param {string} fimDefault - Fim padrão se não existir
   * @returns {Promise<Object>} Dados do progresso
   */
  async function getOrCreateProgress(preset, inicioDefault, fimDefault) {
    try {
      // Tenta buscar
      let progress = await fetchProgress(preset);

      // Se não existe, cria
      if (!progress) {
        console.log(`ℹ️ Criando registro inicial para preset ${preset}`);
        progress = await createProgress(preset, inicioDefault, fimDefault);
      }

      return progress;

    } catch (error) {
      console.error(`❌ Erro em getOrCreateProgress:`, error);
      throw error;
    }
  }

  /**
   * Testa conexão com Supabase
   * @returns {Promise<boolean>} true se conectado
   */
  async function testConnection() {
    if (!isInitialized && !initSupabase()) {
      return false;
    }

    try {
      const { data, error } = await supabaseClient
        .from(CONFIG.TABELA)
        .select('count')
        .limit(1);

      if (error) throw error;

      console.log('✅ Conexão Supabase OK');
      return true;

    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      return false;
    }
  }

  // ============================================
  // RETRY LOGIC
  // ============================================

  /**
   * Executa função com retry automático
   * @param {Function} fn - Função async a executar
   * @param {number} attempts - Tentativas restantes
   * @returns {Promise<any>} Resultado da função
   */
  async function withRetry(fn, attempts = CONFIG.RETRY_ATTEMPTS) {
    try {
      return await fn();
    } catch (error) {
      if (attempts <= 1) throw error;

      console.warn(`⚠️ Tentativa falhou, restam ${attempts - 1}. Aguardando ${CONFIG.RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));

      return withRetry(fn, attempts - 1);
    }
  }

  // ============================================
  // API PÚBLICA
  // ============================================
  window.SupabaseDB = {
    // Configuração
    config: CONFIG,

    // Inicialização
    init: initSupabase,
    isReady: () => isInitialized,
    test: testConnection,

    // Operações CRUD
    fetch: (preset) => withRetry(() => fetchProgress(preset)),
    update: (preset, inicio, fim) => withRetry(() => updateProgress(preset, inicio, fim)),
    create: (preset, inicio, fim) => withRetry(() => createProgress(preset, inicio, fim)),
    getOrCreate: (preset, inicio, fim) => withRetry(() => getOrCreateProgress(preset, inicio, fim)),

    // Utilitários
    getClient: () => supabaseClient,

    // Debug
    reset: () => {
      isInitialized = false;
      supabaseClient = null;
      console.log('🔄 Supabase resetado');
    }
  };

  // ============================================
  // AUTO-INICIALIZAÇÃO
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(initSupabase, 500);
    });
  } else {
    setTimeout(initSupabase, 500);
  }

  console.log('✅ supabase-config.js carregado. Use window.SupabaseDB para API.');

})();
