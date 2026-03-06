/**
 * adsense-manager-modified.js
 * Gerenciador de anúncios AdSense com detecção automática de ambiente
 * Integrado com EnvironmentDetector para habilitar/desabilitar anúncios
 */

(function() {
  'use strict';

  const AdsenseConfig = {
    clientId: 'ca-pub-3614622181047762',
    slots: {
      topBanner: '4371879523',
      infeedArticle: '1937287877',
      inArticle: '8052390745',
      floatingRpm: '3037141776'
    },
    delays: {
      topAd: 500,
      floatingAd: 8000,
      autoCloseFloating: 15000,
      emptyCheckDelay: 2000
    },
    storage: 'adClosedStates',
    maxRetries: 3,
    retryDelay: 1000
  };

  // Estado global
  let adsLoaded = false;
  let adAttempts = 0;
  let floatingAdShown = false;
  let environmentConfig = null;
  let enabled = false;

  /**
   * Verifica se AdSense deve ser habilitado baseado no ambiente
   */
  function checkEnvironment() {
    if (window.EnvironmentDetector) {
      environmentConfig = window.EnvironmentDetector.getInfo();
      enabled = environmentConfig.adsenseEnabled;
      
      console.log(`🌍 Ambiente: ${environmentConfig.environment}`);
      console.log(`📺 AdSense: ${enabled ? '✅ HABILITADO' : '❌ DESABILITADO'}`);
      
      return enabled;
    }
    
    // Fallback: verificação manual
    const hostname = window.location.hostname.toLowerCase();
    const isProduction = hostname.includes('canalqb.github.io') || hostname.includes('canalqb.blogspot.com');
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    
    enabled = isProduction && !isLocalhost;
    
    console.log(`🔍 Verificação manual - AdSense: ${enabled ? '✅ HABILITADO' : '❌ DESABILITADO'}`);
    
    return enabled;
  }

  /**
   * Inicializa o script AdSense
   */
  function initAdsenseScript() {
    if (!enabled) {
      console.log('🚫 AdSense não habilitado para este ambiente');
      return;
    }
    
    if (window.adsbygoogleLoaded) return;
    
    console.log('📺 Carregando script AdSense...');
    
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AdsenseConfig.clientId;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => {
      window.adsbygoogleLoaded = true;
      console.log('✅ Script AdSense carregado com sucesso');
      loadAllAds();
    };
    
    script.onerror = () => {
      console.warn('⚠️ Erro ao carregar script AdSense');
    };
    
    document.head.appendChild(script);
  }

  /**
   * Carrega todos os anúncios da página
   */
  function loadAllAds() {
    if (!enabled) return;
    
    const adElements = document.querySelectorAll('.adsbygoogle:not([data-ads-loaded])');
    
    adElements.forEach((adElement, index) => {
      // Marca como processado para evitar duplicação
      adElement.setAttribute('data-ads-loaded', 'true');
      
      // Verifica consentimento GDPR
      if (window.cookieConsent && !window.cookieConsent.marketing) {
        console.log('🚫 Anúncio bloqueado: sem consentimento marketing');
        adElement.style.display = 'none';
        return;
      }
      
      try {
        // Adiciona atributos necessários se não existirem
        if (!adElement.getAttribute('data-ad-client')) {
          adElement.setAttribute('data-ad-client', AdsenseConfig.clientId);
        }
        
        if (!adElement.getAttribute('data-ad-slot')) {
          const slotId = adElement.id || `ad-${index}`;
          const slot = AdsenseConfig.slots[slotId] || AdsenseConfig.slots.inArticle;
          adElement.setAttribute('data-ad-slot', slot);
        }
        
        if (!adElement.getAttribute('data-ad-format')) {
          adElement.setAttribute('data-ad-format', 'auto');
        }
        
        if (!adElement.getAttribute('data-full-width-responsive')) {
          adElement.setAttribute('data-full-width-responsive', 'true');
        }
        
        // Inicializa o anúncio
        (adsbygoogle = window.adsbygoogle || []).push({});
        
        console.log(`📺 Anúncio carregado: ${adElement.id || `ad-${index}`}`);
        
        // Verifica se o anúncio foi preenchido após um delay
        setTimeout(() => checkAdFilled(adElement), AdsenseConfig.delays.emptyCheckDelay);
        
      } catch (error) {
        console.error('❌ Erro ao carregar anúncio:', error);
      }
    });
  }

  /**
   * Verifica se um anúncio foi preenchido
   */
  function checkAdFilled(adElement) {
    if (!enabled) return;
    
    try {
      const computedStyle = window.getComputedStyle(adElement);
      const hasContent = adElement.innerHTML.trim().length > 0;
      const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden';
      
      if (!hasContent || !isVisible) {
        console.warn('⚠️ Anúncio pode estar vazio:', adElement.id || 'unknown');
        
        // Tenta recarregar o anúncio
        if (adAttempts < AdsenseConfig.maxRetries) {
          adAttempts++;
          console.log(`🔄 Tentativa ${adAttempts} de recarregar anúncio...`);
          
          setTimeout(() => {
            adElement.removeAttribute('data-ads-loaded');
            loadAllAds();
          }, AdsenseConfig.retryDelay * adAttempts);
        }
      } else {
        console.log('✅ Anúncio preenchido com sucesso:', adElement.id || 'unknown');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar preenchimento do anúncio:', error);
    }
  }

  /**
   * Cria anúncio flutuante (RPM)
   */
  function createFloatingAd() {
    if (!enabled || floatingAdShown) return;
    
    // Verifica estado salvo
    const closedStates = JSON.parse(localStorage.getItem(AdsenseConfig.storage) || '{}');
    if (closedStates.floating) {
      console.log('🚫 Anúncio flutuante fechado anteriormente');
      return;
    }
    
    console.log('🎈 Criando anúncio flutuante...');
    
    const floatingAd = document.createElement('div');
    floatingAd.id = 'floating-ad';
    floatingAd.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      max-width: 300px;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
    `;
    
    floatingAd.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 12px; color: #666; font-weight: 600;">Patrocinado</span>
        <button id="close-floating-ad" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #999;">×</button>
      </div>
      <ins class="adsbygoogle"
           style="display:block; width: 250px; height: 250px;"
           data-ad-client="${AdsenseConfig.clientId}"
           data-ad-slot="${AdsenseConfig.slots.floatingRpm}"
           data-ad-format="rectangle"></ins>
    `;
    
    document.body.appendChild(floatingAd);
    
    // Anima entrada
    setTimeout(() => {
      floatingAd.style.opacity = '1';
      floatingAd.style.transform = 'translateY(0)';
    }, 100);
    
    // Event listeners
    document.getElementById('close-floating-ad').addEventListener('click', () => {
      floatingAd.style.opacity = '0';
      floatingAd.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        floatingAd.remove();
        
        // Salva estado
        const closedStates = JSON.parse(localStorage.getItem(AdsenseConfig.storage) || '{}');
        closedStates.floating = true;
        localStorage.setItem(AdsenseConfig.storage, JSON.stringify(closedStates));
      }, 300);
    });
    
    // Auto-close
    setTimeout(() => {
      if (document.getElementById('floating-ad')) {
        document.getElementById('close-floating-ad').click();
      }
    }, AdsenseConfig.delays.autoCloseFloating);
    
    // Inicializa o anúncio
    try {
      (adsbygoogle = window.adsbygoogle || []).push({});
      floatingAdShown = true;
      console.log('✅ Anúncio flutuante criado');
    } catch (error) {
      console.error('❌ Erro ao criar anúncio flutuante:', error);
      floatingAd.remove();
    }
  }

  /**
   * Cria anúncio no topo do conteúdo
   */
  function createTopAd() {
    if (!enabled) return;
    
    const content = document.querySelector('main, .container, #content');
    if (!content) return;
    
    console.log('📺 Criando anúncio no topo...');
    
    const topAd = document.createElement('div');
    topAd.className = 'top-ad-container';
    topAd.style.cssText = `
      margin: 20px 0;
      text-align: center;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    `;
    
    topAd.innerHTML = `
      <div style="font-size: 12px; color: #6c757d; margin-bottom: 8px; font-weight: 600;">Publicidade</div>
      <ins class="adsbygoogle"
           style="display:block;"
           data-ad-client="${AdsenseConfig.clientId}"
           data-ad-slot="${AdsenseConfig.slots.topBanner}"
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    `;
    
    // Insere no topo do conteúdo
    content.insertBefore(topAd, content.firstChild);
    
    // Inicializa o anúncio
    try {
      (adsbygoogle = window.adsbygoogle || []).push({});
      console.log('✅ Anúncio no topo criado');
    } catch (error) {
      console.error('❌ Erro ao criar anúncio no topo:', error);
      topAd.remove();
    }
  }

  /**
   * Processa anúncios quando consentimento é dado
   */
  function processAds() {
    if (!enabled) {
      console.log('🚫 AdSense desabilitado, ignorando processamento');
      return;
    }
    
    console.log('📺 Processando anúncios...');
    
    if (!adsLoaded) {
      initAdsenseScript();
    } else {
      loadAllAds();
    }
    
    // Cria anúncios especiais
    setTimeout(() => {
      createTopAd();
    }, AdsenseConfig.delays.topAd);
    
    setTimeout(() => {
      createFloatingAd();
    }, AdsenseConfig.delays.floatingAd);
  }

  /**
   * Limpa todos os anúncios
   */
  function clearAds() {
    console.log('🧹 Limpando anúncios...');
    
    // Remove anúncios existentes
    const adElements = document.querySelectorAll('.adsbygoogle, .top-ad-container, #floating-ad');
    adElements.forEach(el => el.remove());
    
    // Remove script AdSense
    const adScripts = document.querySelectorAll('script[src*="pagead2.googlesyndication.com"]');
    adScripts.forEach(script => script.remove());
    
    // Reseta estado
    adsLoaded = false;
    floatingAdShown = false;
    adAttempts = 0;
    
    // Limpa variáveis globais
    delete window.adsbygoogleLoaded;
    window.adsbygoogle = [];
  }

  /**
   * Atualiza configuração baseado no ambiente
   */
  function updateEnvironmentConfig() {
    const wasEnabled = enabled;
    checkEnvironment();
    
    if (wasEnabled !== enabled) {
      console.log(`🔄 Ambiente mudou, AdSense ${enabled ? 'habilitado' : 'desabilitado'}`);
      
      if (enabled) {
        processAds();
      } else {
        clearAds();
      }
    }
  }

  // ============================================
  // API PÚBLICA
  // ============================================
  
  window.AdsenseManager = {
    // Controle
    enabled: enabled,
    process: processAds,
    clear: clearAds,
    reload: () => {
      clearAds();
      if (enabled) {
        setTimeout(processAds, 1000);
      }
    },
    
    // Configuração
    updateEnvironment: updateEnvironmentConfig,
    setEnabled: (value) => {
      enabled = value;
      console.log(`📺 AdSense manualmente ${value ? 'habilitado' : 'desabilitado'}`);
      
      if (value) {
        processAds();
      } else {
        clearAds();
      }
    },
    
    // Informações
    isLoaded: () => adsLoaded,
    getEnvironment: () => environmentConfig,
    getConfig: () => ({ ...AdsenseConfig, enabled }),
    
    // Debug
    debug: () => {
      console.group('📺 AdSense Manager Debug');
      console.log('Enabled:', enabled);
      console.log('Loaded:', adsLoaded);
      console.log('Environment:', environmentConfig);
      console.log('Ads on page:', document.querySelectorAll('.adsbygoogle').length);
      console.log('Floating shown:', floatingAdShown);
      console.groupEnd();
    }
  };

  // ============================================
  // EVENT LISTENERS
  // ============================================
  
  // Listener para mudanças de ambiente
  window.addEventListener('environmentDetected', (event) => {
    environmentConfig = event.detail;
    enabled = environmentConfig.adsenseEnabled;
    window.AdsenseManager.enabled = enabled;
    
    console.log('🌍 Ambiente detectado via evento:', environmentConfig.environment);
    
    if (enabled) {
      processAds();
    } else {
      clearAds();
    }
  });
  
  // Listener para consentimento GDPR
  window.addEventListener('cookieConsentUpdate', (event) => {
    if (event.detail.marketing && enabled) {
      console.log('🍪 Consentimento marketing dado, carregando anúncios...');
      processAds();
    } else if (!event.detail.marketing) {
      console.log('🍪 Consentimento marketing removido, limpando anúncios...');
      clearAds();
    }
  });
  
  // Listener para mudanças de página (SPA)
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      if (enabled) {
        loadAllAds();
      }
    }, 1000);
  });

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  function init() {
    // Verifica ambiente
    checkEnvironment();
    
    // Se já tiver consentimento, processa anúncios
    if (window.cookieConsent?.marketing && enabled) {
      processAds();
    }
    
    console.log('✅ Adsense Manager Modified inicializado');
    console.log(`   Ambiente: ${environmentConfig?.environment || 'desconhecido'}`);
    console.log(`   AdSense: ${enabled ? '✅ HABILITADO' : '❌ DESABILITADO'}`);
  }

  // Inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
