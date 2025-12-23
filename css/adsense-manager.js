/**
 * adsense-manager.js
 * Gerenciador completo de anúncios AdSense para Blogspot
 * Otimizado para SEO, performance e conformidade Google
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
      autoCloseFloating: 15000
    },
    storage: 'adClosedStates',
    maxRetries: 3,
    retryDelay: 1000
  };

  // Estado global
  let adsLoaded = false;
  let adAttempts = 0;
  let floatingAdShown = false;

  /**
   * Inicializa o script AdSense
   */
  function initAdsenseScript() {
    if (window.adsbygoogleLoaded) return;
    
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + AdsenseConfig.clientId;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.adsbygoogleLoaded = true;
      loadAllAds();
    };
    script.onerror = () => {
      console.warn('⚠️ Erro ao carregar script AdSense');
      retryAdsenseLoad();
    };
    
    document.head.appendChild(script);
  }

  /**
   * Carrega todos os anúncios
   */
  function loadAllAds() {
    if (adsLoaded) return;
    adsLoaded = true;

    // Espera o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        processAds();
      });
    } else {
      processAds();
    }
  }

  /**
   * Processa anúncios com retry inteligente
   */
  function processAds() {
    try {
      const adElements = document.querySelectorAll('.adsbygoogle');
      
      if (adElements.length === 0) {
        console.log('ℹ️ Nenhum elemento de anúncio encontrado');
        return;
      }

      adElements.forEach((ad, idx) => {
        if (!ad.dataset.adProcessed) {
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            ad.dataset.adProcessed = 'true';
            console.log(`✅ Anúncio ${idx + 1} carregado`);
          } catch (e) {
            console.warn(`⚠️ Erro ao processar anúncio ${idx + 1}:`, e.message);
          }
        }
      });

      // Monitora visibilidade
      monitorAdVisibility();
    } catch (err) {
      console.error('❌ Erro ao processar anúncios:', err);
    }
  }

  /**
   * Retry para carregamento de AdSense
   */
  function retryAdsenseLoad() {
    if (adAttempts < AdsenseConfig.maxRetries) {
      adAttempts++;
      console.log(`🔄 Tentativa ${adAttempts} de ${AdsenseConfig.maxRetries}`);
      setTimeout(initAdsenseScript, AdsenseConfig.retryDelay);
    }
  }

  /**
   * Monitora visibilidade de anúncios para detectar bloqueio
   */
  function monitorAdVisibility() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const rect = entry.target.getBoundingClientRect();
          const height = rect.height;
          const width = rect.width;

          if (height > 0 && width > 0) {
            console.log('👁️ Anúncio visível');
            trackEvent('ad_visible', entry.target.className);
          } else {
            console.warn('⚠️ Anúncio não renderizado corretamente');
          }
        }
      });
    }, { threshold: 0.5 });

    document.querySelectorAll('.adsbygoogle').forEach(ad => {
      observer.observe(ad);
    });
  }

  /**
   * Anúncio Flutuante com Comportamento Inteligente
   */
  function initFloatingAd() {
    const floatingContainer = document.getElementById('floatingAd');
    if (!floatingContainer) return;

    // Verifica se foi fechado na sessão
    if (getClosedAdState('floating')) {
      floatingContainer.style.display = 'none';
      return;
    }

    // Mostra após delay
    setTimeout(() => {
      // Verifica scroll para melhor posicionamento
      if (window.scrollY > 500) {
        showFloatingAd(floatingContainer);
      }
    }, AdsenseConfig.delays.floatingAd);

    // Reinicia anúncio se usuário scrollar muito
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.scrollY;
      if (currentScroll - lastScroll > 1000 && !floatingAdShown) {
        lastScroll = currentScroll;
      }
    }, { passive: true });
  }

  /**
   * Mostra anúncio flutuante
   */
  function showFloatingAd(container) {
    if (floatingAdShown) return;
    floatingAdShown = true;

    container.style.display = 'block';
    container.style.animation = 'slideInAd 0.5s ease-out';

    // Carrega anúncio
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.warn('⚠️ Erro ao carregar anúncio flutuante:', e.message);
    }

    // Botão fechar
    const closeBtn = container.querySelector('.ad-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        hideFloatingAd(container);
        setClosedAdState('floating', true);
        trackEvent('ad_closed', 'floating');
      });
    }

    // Auto-close (opcional)
    // setTimeout(() => hideFloatingAd(container), AdsenseConfig.delays.autoCloseFloating);
  }

  /**
   * Oculta anúncio flutuante
   */
  function hideFloatingAd(container) {
    container.style.animation = 'slideOutAd 0.5s ease-in forwards';
    setTimeout(() => {
      container.style.display = 'none';
    }, 500);
  }

  /**
   * Gerenciamento de estado de anúncios fechados
   */
  function getClosedAdState(key) {
    try {
      const stored = sessionStorage.getItem(AdsenseConfig.storage);
      if (!stored) return false;
      const states = JSON.parse(stored);
      return states[key] || false;
    } catch {
      return false;
    }
  }

  function setClosedAdState(key, value) {
    try {
      const stored = sessionStorage.getItem(AdsenseConfig.storage) || '{}';
      const states = JSON.parse(stored);
      states[key] = value;
      sessionStorage.setItem(AdsenseConfig.storage, JSON.stringify(states));
    } catch {
      console.warn('⚠️ Erro ao salvar estado de anúncio');
    }
  }

  /**
   * Rastreamento de eventos de anúncios (integra com Analytics)
   */
  function trackEvent(action, label) {
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        event_category: 'AdSense',
        event_label: label,
        value: 1
      });
    }
  }

  /**
   * Monitora desbloqueadores de anúncio
   */
  function detectAdBlocker() {
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsense-test-ad';
    testAd.style.display = 'none';
    document.body.appendChild(testAd);

    setTimeout(() => {
      const styles = window.getComputedStyle(testAd);
      if (styles.display === 'none' && styles.visibility === 'hidden') {
        console.warn('⚠️ Possível bloqueador de anúncios detectado');
        trackEvent('adblocker_detected', 'yes');
      }
      testAd.remove();
    }, 1000);
  }

  /**
   * Otimização Responsiva de Anúncios
   */
  function optimizeForDevice() {
    const isMobile = window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

    document.body.dataset.deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

    // Ajusta exibição de anúncios por dispositivo
    if (isMobile) {
      document.getElementById('ad-banner-top')?.style.setProperty('display', 'block', 'important');
    }
  }

  /**
   • Lazy Load de Anúncios
   */
  function lazyLoadAds() {
    const adObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.adLoaded) {
          entry.target.dataset.adLoaded = 'true';
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
          } catch (e) {
            console.warn('⚠️ Erro ao carregar anúncio lazy:', e.message);
          }
        }
      });
    }, { rootMargin: '50px' });

    document.querySelectorAll('.adsbygoogle:not([data-ad-loaded])').forEach(ad => {
      adObserver.observe(ad);
    });
  }

  /**
   * Inicialização Principal
   */
  function init() {
    console.log('🚀 Inicializando AdSense Manager...');

    // Aguarda consentimento (se houver)
    const checkConsent = setInterval(() => {
      if (window.cookieConsent !== undefined) {
        clearInterval(checkConsent);
        if (window.cookieConsent.ads !== false) {
          initAdsenseScript();
        } else {
          console.log('ℹ️ Anúncios bloqueados por preferência do usuário');
        }
      }
    }, 100);

    // Timeout de fallback
    setTimeout(() => {
      clearInterval(checkConsent);
      if (!adsLoaded) {
        initAdsenseScript();
      }
    }, 3000);

    // Inicializa outras funcionalidades
    optimizeForDevice();
    detectAdBlocker();
    initFloatingAd();
    lazyLoadAds();

    // Reprocessa anúncios dinamicamente
    window.addEventListener('load', () => {
      setTimeout(processAds, 1000);
    });

    // Reinicia lazy load após mudança de DOM
    const observer = new MutationObserver(() => {
      lazyLoadAds();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Aguarda DOM pronto
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exporta para uso global
  window.AdsenseManager = {
    config: AdsenseConfig,
    trackEvent,
    processAds,
    reloadAds: () => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.warn('⚠️ Erro ao recarregar anúncios:', e.message);
      }
    }
  };

  console.log('✅ AdSense Manager carregado com sucesso');
})();