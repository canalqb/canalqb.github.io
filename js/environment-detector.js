/**
 * environment-detector.js
 * Detecta ambiente de execução e controla habilitação de AdSense
 * AdSense APENAS em produção (canalqb.github.io)
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  const CONFIG = {
    PRODUCTION_DOMAINS: [
      'canalqb.github.io',
      'canalqb.blogspot.com'
    ],
    DEVELOPMENT_PATTERNS: [
      'localhost',
      '127.0.0.1',
      'file://',
      '192.168.',
      '10.0.',
      '172.16.'
    ]
  };

  // ============================================
  // DETECÇÃO DE AMBIENTE
  // ============================================

  /**
   * Verifica se está em ambiente de desenvolvimento
   * @returns {boolean}
   */
  function isDevelopment() {
    const url = window.location.href.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();

    // Verifica padrões de desenvolvimento
    return CONFIG.DEVELOPMENT_PATTERNS.some(pattern => 
      url.includes(pattern) || hostname.includes(pattern)
    );
  }

  /**
   * Verifica se está em produção
   * @returns {boolean}
   */
  function isProduction() {
    const hostname = window.location.hostname.toLowerCase();

    return CONFIG.PRODUCTION_DOMAINS.some(domain => 
      hostname.includes(domain)
    );
  }

  /**
   * Detecta tipo de ambiente
   * @returns {string} 'production', 'development', ou 'unknown'
   */
  function detectEnvironment() {
    if (isProduction()) return 'production';
    if (isDevelopment()) return 'development';
    return 'unknown';
  }

  // ============================================
  // CONTROLE DE ADSENSE
  // ============================================

  /**
   * Verifica se AdSense deve ser habilitado
   * @returns {boolean}
   */
  function shouldEnableAdsense() {
    const env = detectEnvironment();
    
    // AdSense APENAS em produção
    return env === 'production';
  }

  /**
   * Desabilita AdSense no ambiente atual
   */
  function disableAdsense() {
    console.log('🚫 AdSense DESABILITADO (ambiente de desenvolvimento)');

    // Bloqueia carregamento do script AdSense
    const adsenseScripts = document.querySelectorAll('script[src*="adsbygoogle"]');
    adsenseScripts.forEach(script => {
      script.remove();
      console.log('  ❌ Script AdSense removido:', script.src);
    });

    // Remove containers de anúncios
    const adContainers = document.querySelectorAll('.adsbygoogle, [id*="ad-"], .ad-container');
    adContainers.forEach(container => {
      container.style.display = 'none';
    });

    // Desabilita AdsenseManager se existir
    if (window.AdsenseManager) {
      window.AdsenseManager.enabled = false;
      console.log('  ❌ AdsenseManager desabilitado');
    }

    // Define flag global
    window.ADSENSE_ENABLED = false;
  }

  /**
   * Habilita AdSense no ambiente atual
   */
  function enableAdsense() {
    console.log('✅ AdSense HABILITADO (ambiente de produção)');
    
    // Define flag global
    window.ADSENSE_ENABLED = true;

    // Notifica AdsenseManager se existir
    if (window.AdsenseManager) {
      window.AdsenseManager.enabled = true;
      
      // Processa anúncios se já houver consentimento
      if (window.cookieConsent?.marketing) {
        setTimeout(() => {
          window.AdsenseManager.processAds?.();
        }, 1000);
      }
    }
  }

  /**
   * Aplica configuração de ambiente
   */
  function applyEnvironmentConfig() {
    const env = detectEnvironment();
    const adsenseEnabled = shouldEnableAdsense();

    console.log('🌍 Ambiente detectado:', env.toUpperCase());
    console.log('📍 URL:', window.location.href);
    console.log('🖥️  Hostname:', window.location.hostname);

    if (adsenseEnabled) {
      enableAdsense();
    } else {
      disableAdsense();
    }

    // Adiciona atributo ao body para CSS condicional
    document.body.setAttribute('data-environment', env);
    document.body.setAttribute('data-adsense-enabled', adsenseEnabled);

    return {
      environment: env,
      adsenseEnabled: adsenseEnabled
    };
  }

  // ============================================
  // DETECÇÃO DE SUPABASE
  // ============================================

  /**
   * Verifica se deve conectar ao Supabase
   * @returns {boolean}
   */
  function shouldConnectSupabase() {
    const env = detectEnvironment();
    
    // Conecta em produção E desenvolvimento
    // (útil para testes locais)
    return env === 'production' || env === 'development';
  }

  // ============================================
  // API PÚBLICA
  // ============================================
  window.EnvironmentDetector = {
    // Detecção
    detect: detectEnvironment,
    isDevelopment: isDevelopment,
    isProduction: isProduction,

    // AdSense
    shouldEnableAdsense: shouldEnableAdsense,
    enableAdsense: enableAdsense,
    disableAdsense: disableAdsense,

    // Supabase
    shouldConnectSupabase: shouldConnectSupabase,

    // Configuração
    apply: applyEnvironmentConfig,
    config: CONFIG,

    // Info
    getInfo: () => ({
      environment: detectEnvironment(),
      url: window.location.href,
      hostname: window.location.hostname,
      adsenseEnabled: shouldEnableAdsense(),
      supabaseEnabled: shouldConnectSupabase()
    })
  };

  // ============================================
  // AUTO-EXECUÇÃO
  // ============================================
  function init() {
    const config = applyEnvironmentConfig();
    
    // Dispara evento customizado
    window.dispatchEvent(new CustomEvent('environmentDetected', {
      detail: config
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  console.log('✅ environment-detector.js carregado. Use window.EnvironmentDetector para API.');

})();
