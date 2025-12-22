/**
 * ads.js - Gerenciador de Anúncios Google AdSense
 * CanalQb - Gerador de Private Keys Bitcoin
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // CONFIGURAÇÕES
  // ========================================
  const AD_CONFIG = {
    floatingDelay: 8000,        // Tempo para mostrar anúncio flutuante (8s)
    floatingCloseDelay: 15000,  // Tempo para fechar automaticamente (15s)
    floatingShowInterval: 60000, // Intervalo para reexibir (60s)
    enableFloating: true,        // Ativar/desativar anúncio flutuante
    enableAutoClose: false       // Fechar automaticamente após delay
  };

  // ========================================
  // INICIALIZAÇÃO DOS ANÚNCIOS ADSENSE
  // ========================================
  function initializeAds() {
    try {
      // Carrega os anúncios AdSense na página
      const adElements = document.querySelectorAll('.adsbygoogle');
      
      adElements.forEach((ad, index) => {
        // Verifica se o anúncio já foi inicializado
        if (!ad.dataset.adsbygoogleStatus) {
          try {
            (adsbygoogle = window.adsbygoogle || []).push({});
            console.log(`✅ Anúncio ${index + 1} inicializado`);
          } catch (error) {
            console.warn(`⚠️ Erro ao inicializar anúncio ${index + 1}:`, error);
          }
        }
      });
    } catch (error) {
      console.error('❌ Erro ao inicializar anúncios:', error);
    }
  }

  // ========================================
  // MONITORAMENTO DE BLOQUEADORES DE ANÚNCIO
  // ========================================
  function detectAdBlocker() {
    // Verifica se o AdSense está carregado corretamente
    const adsbygoogleLoaded = typeof window.adsbygoogle !== 'undefined';
    
    // Se o AdSense não estiver carregado, retorna true, indicando bloqueio
    if (!adsbygoogleLoaded) {
      console.warn('⚠️ AdSense não carregado corretamente ou bloqueado');
      return true; // Indica que o bloqueador de anúncios foi detectado
    }

    // Verifica se há elementos de anúncio visíveis
    const adElements = document.querySelectorAll('.adsbygoogle');
    let hasVisibleAd = false;

    // Verifica se algum anúncio está visível na página
    adElements.forEach(ad => {
      const rect = ad.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) {
        hasVisibleAd = true;
      }
    });

    // Se não houver anúncios visíveis ou o AdSense não carregou como esperado, retorna "true" indicando bloqueio
    if (!hasVisibleAd && adElements.length > 0) {
      console.warn('⚠️ Nenhum anúncio visível detectado');
      return true; // Indica que o bloqueador de anúncios foi detectado
    }

    // Caso contrário, não há bloqueio
    return false;
  }

  // ========================================
  // AVISO DE BLOQUEADOR DE ANÚNCIOS (REMOVIDO)
  // ========================================
  // A parte do código que exibe a mensagem foi removida para não mostrar o aviso

  // ========================================
  // ANALYTICS E TRACKING (OPCIONAL)
  // ========================================
  function trackAdInteraction(action, label) {
    // Integração com Google Analytics (se disponível)
    if (typeof gtag !== 'undefined') {
      gtag('event', action, {
        'event_category': 'Ads',
        'event_label': label
      });
    }
    console.log(`📊 Track: ${action} - ${label}`);
  }

  // ========================================
  // RESPONSIVE ADS REFRESH
  // ========================================
  let lastWidth = window.innerWidth;

  function handleResize() {
    const currentWidth = window.innerWidth;
    
    // Recarrega anúncios se mudança significativa de largura
    if (Math.abs(currentWidth - lastWidth) > 100) {
      console.log('📱 Resize detectado, anúncios podem ser atualizados');
      lastWidth = currentWidth;
      
      // Aqui você pode implementar lógica de refresh se necessário
      // Nota: AdSense geralmente lida com isso automaticamente
    }
  }

  // Debounce para resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(handleResize, 250);
  });

  // ========================================
  // INICIALIZAÇÃO PRINCIPAL
  // ========================================
  function init() {
    console.log('🚀 Inicializando sistema de anúncios...');

    // Aguarda o carregamento do AdSense
    setTimeout(() => {
      initializeAds();
      
      // Detecta bloqueador (opcional)
      setTimeout(() => {
        const isBlocked = detectAdBlocker();
        if (isBlocked) {
          console.log('🛡️ Possível bloqueador de anúncios detectado');
        } else {
          console.log('✅ Sistema de anúncios funcionando normalmente');
        }
      }, 2000);
    }, 1000);

    // Track impressão inicial
    trackAdInteraction('page_load', 'ads_initialized');
  }

  // Inicia o sistema
  init();

  // ========================================
  // EXPORTA FUNÇÕES PÚBLICAS (OPCIONAL)
  // ========================================
  window.AdsManager = {
    refresh: initializeAds,
    config: AD_CONFIG
  };

  console.log('✅ ads.js carregado com sucesso');
});
