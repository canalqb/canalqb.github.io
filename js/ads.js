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
  // GERENCIAMENTO DO ANÚNCIO FLUTUANTE
  // ========================================
  const floatingAd = document.getElementById('floatingAd');
  const closeFloatingBtn = document.getElementById('closeFloatingAd');
  let floatingAdTimer = null;
  let autoCloseTimer = null;
  let floatingAdClosed = false;

  function showFloatingAd() {
    if (!AD_CONFIG.enableFloating || !floatingAd || floatingAdClosed) return;

    floatingAd.style.display = 'block';
    console.log('📢 Anúncio flutuante exibido');

    // Inicializa o anúncio dentro do flutuante se ainda não foi
    const floatingAdElement = floatingAd.querySelector('.adsbygoogle');
    if (floatingAdElement && !floatingAdElement.dataset.adsbygoogleStatus) {
      try {
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log('✅ Anúncio flutuante AdSense inicializado');
      } catch (error) {
        console.warn('⚠️ Erro ao inicializar anúncio flutuante:', error);
      }
    }

    // Auto-fechar após delay (opcional)
    if (AD_CONFIG.enableAutoClose) {
      autoCloseTimer = setTimeout(() => {
        hideFloatingAd();
        console.log('⏱️ Anúncio flutuante fechado automaticamente');
      }, AD_CONFIG.floatingCloseDelay);
    }
  }

  function hideFloatingAd() {
    if (!floatingAd) return;
    
    floatingAd.style.display = 'none';
    floatingAdClosed = true;
    
    if (autoCloseTimer) {
      clearTimeout(autoCloseTimer);
      autoCloseTimer = null;
    }
    
    console.log('❌ Anúncio flutuante fechado');
  }

  function scheduleFloatingAd() {
    if (!AD_CONFIG.enableFloating) return;

    // Primeira exibição após delay inicial
    floatingAdTimer = setTimeout(() => {
      showFloatingAd();

      // Reexibir periodicamente se o usuário fechar
      const reShowInterval = setInterval(() => {
        if (floatingAdClosed) {
          floatingAdClosed = false;
          showFloatingAd();
        }
      }, AD_CONFIG.floatingShowInterval);

      // Salva referência para limpeza se necessário
      window.floatingAdInterval = reShowInterval;
    }, AD_CONFIG.floatingDelay);
  }

  // Evento de fechar anúncio flutuante
  if (closeFloatingBtn) {
    closeFloatingBtn.addEventListener('click', () => {
      hideFloatingAd();
    });
  }

  // ========================================
  // MONITORAMENTO DE BLOQUEADORES DE ANÚNCIO
  // ========================================
  function detectAdBlocker() {
    // Verifica se AdSense está carregado
    const adsbygoogleLoaded = typeof window.adsbygoogle !== 'undefined';
    
    if (!adsbygoogleLoaded) {
      console.warn('⚠️ AdSense pode estar bloqueado ou não carregado');
      showAdBlockWarning();  // <-- Mostra aviso
      return true;
    }

    // Verifica se há elementos de anúncio visíveis
    const adElements = document.querySelectorAll('.adsbygoogle');
    let hasVisibleAd = false;

    adElements.forEach(ad => {
      const rect = ad.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) {
        hasVisibleAd = true;
      }
    });

    if (!hasVisibleAd && adElements.length > 0) {
      console.warn('⚠️ Nenhum anúncio visível detectado');
      showAdBlockWarning();  // <-- Mostra aviso
    }

    return !hasVisibleAd && adElements.length > 0;
  }

  // ========================================
  // AVISO DE BLOQUEADOR DE ANÚNCIOS (NOVA FUNÇÃO)
  // ========================================
  function showAdBlockWarning() {
    if (document.getElementById('adBlockWarning')) return; // Evita duplicar

    const warning = document.createElement('div');
    warning.id = 'adBlockWarning';
    warning.style.position = 'fixed';
    warning.style.top = '0';
    warning.style.left = '0';
    warning.style.right = '0';
    warning.style.backgroundColor = '#f44336'; // vermelho vibrante
    warning.style.color = 'white';
    warning.style.padding = '15px';
    warning.style.textAlign = 'center';
    warning.style.fontSize = '16px';
    warning.style.zIndex = '9999';
    warning.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
    warning.style.display = 'flex';
    warning.style.justifyContent = 'space-between';
    warning.style.alignItems = 'center';

    warning.innerHTML = `
      <span>⚠️ Detectamos que você está usando um bloqueador de anúncios. Por favor, considere desativá-lo para apoiar nosso site.</span>
      <button id="closeAdBlockWarning" style="
        background: transparent;
        border: none;
        color: white;
        font-weight: bold;
        font-size: 18px;
        cursor: pointer;
        margin-left: 20px;
      " aria-label="Fechar aviso de bloqueador de anúncios">&times;</button>
    `;

    document.body.appendChild(warning);

    document.getElementById('closeAdBlockWarning').addEventListener('click', () => {
      warning.style.display = 'none';
    });
  }

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

    // Agenda anúncio flutuante
    scheduleFloatingAd();

    // Track impressão inicial
    trackAdInteraction('page_load', 'ads_initialized');
  }

  // Inicia o sistema
  init();

  // ========================================
  // EXPORTA FUNÇÕES PÚBLICAS (OPCIONAL)
  // ========================================
  window.AdsManager = {
    showFloating: showFloatingAd,
    hideFloating: hideFloatingAd,
    refresh: initializeAds,
    config: AD_CONFIG
  };

  console.log('✅ ads.js carregado com sucesso');
});

// ========================================
// FALLBACK PARA ANÚNCIOS NÃO CARREGADOS
// ========================================
window.addEventListener('load', () => {
  setTimeout(() => {
    const adElements = document.querySelectorAll('.adsbygoogle');
    
    adElements.forEach((ad, index) => {
      // Verifica se o anúncio foi preenchido
      const isEmpty = ad.innerHTML.trim() === '';
      const hasNoHeight = ad.offsetHeight === 0;
      
      if (isEmpty || hasNoHeight) {
        console.warn(`⚠️ Anúncio ${index + 1} pode não ter carregado corretamente`);
        
        // Opcional: adiciona placeholder ou mensagem
        // ad.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">Anúncio</div>';
      }
    });
  }, 3000);
});
