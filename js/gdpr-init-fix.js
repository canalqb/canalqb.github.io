/**
 * gdpr-init-fix.js
 * Sistema de Consentimento GDPR - Versão Otimizada
 * Compatível com Blogspot e LGPD/GDPR
 */

(function() {
  'use strict';

  // Configurações
  const CONFIG = {
    storageKey: 'canalqb_gdpr_consent',
    versionKey: 'canalqb_consent_version',
    currentVersion: '2.0.0',
    bannerDelay: 300
  };

  // Estado padrão
  const DEFAULT_CONSENT = {
    version: CONFIG.currentVersion,
    timestamp: Date.now(),
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  };

  // Cache de elementos DOM
  const elements = {
    banner: null,
    acceptAll: null,
    rejectAll: null,
    customize: null,
    settings: null,
    saveSettings: null,
    closeBtn: null,
    checkboxes: {
      analytics: null,
      marketing: null,
      preferences: null
    }
  };

  /**
   * Verifica se há consentimento salvo
   */
  function hasStoredConsent() {
    try {
      const stored = localStorage.getItem(CONFIG.storageKey);
      if (!stored) return false;
      
      const consent = JSON.parse(stored);
      // Verifica se a versão é compatível
      return consent.version === CONFIG.currentVersion;
    } catch (e) {
      console.warn('⚠️ Erro ao verificar consentimento:', e);
      return false;
    }
  }

  /**
   * Carrega consentimento salvo
   */
  function loadConsent() {
    try {
      const stored = localStorage.getItem(CONFIG.storageKey);
      if (!stored) return null;
      
      const consent = JSON.parse(stored);
      return { ...DEFAULT_CONSENT, ...consent };
    } catch (e) {
      console.warn('⚠️ Erro ao carregar consentimento:', e);
      return null;
    }
  }

  /**
   * Salva consentimento
   */
  function saveConsent(preferences) {
    try {
      const consent = {
        ...DEFAULT_CONSENT,
        ...preferences,
        version: CONFIG.currentVersion,
        timestamp: Date.now()
      };

      localStorage.setItem(CONFIG.storageKey, JSON.stringify(consent));
      console.log('💾 Consentimento salvo:', consent);
      
      return consent;
    } catch (e) {
      console.error('❌ Erro ao salvar consentimento:', e);
      return null;
    }
  }

  /**
   * Aplica consentimento ao sistema
   */
  function applyConsent(consent) {
    // Notifica sistemas externos
    window.dispatchEvent(new CustomEvent('consentUpdated', { 
      detail: consent 
    }));

    // Google Analytics (GTM)
    if (typeof gtag !== 'undefined') {
      gtag('consent', 'update', {
        ad_storage: consent.marketing ? 'granted' : 'denied',
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        personalization_storage: consent.preferences ? 'granted' : 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted'
      });
      console.log('✅ Consentimento aplicado ao Google Analytics');
    }

    // Google Tag Manager
    if (typeof dataLayer !== 'undefined') {
      dataLayer.push({
        event: 'consent_update',
        consent_analytics: consent.analytics,
        consent_marketing: consent.marketing,
        consent_preferences: consent.preferences
      });
      console.log('✅ Consentimento aplicado ao GTM');
    }

    // AdSense Manager
    if (window.AdsenseManager) {
      window.AdsenseManager.consentState = consent;
      if (consent.marketing) {
        setTimeout(() => {
          window.AdsenseManager.processAds?.();
        }, 500);
      }
      console.log('✅ Consentimento aplicado ao AdSense');
    }

    // Compatibilidade com código legado
    window.cookieConsent = consent;
  }

  /**
   * Mapeia elementos DOM
   */
  function mapElements() {
    elements.banner = document.getElementById('gdpr-consent-banner');
    elements.acceptAll = document.getElementById('consent-accept-all');
    elements.rejectAll = document.getElementById('consent-reject-all');
    elements.customize = document.getElementById('consent-customize');
    elements.settings = document.getElementById('consent-settings');
    elements.saveSettings = document.getElementById('consent-save-settings');
    elements.closeBtn = document.getElementById('consent-close-banner');
    elements.checkboxes.analytics = document.getElementById('consent-analytics');
    elements.checkboxes.marketing = document.getElementById('consent-marketing');
    elements.checkboxes.preferences = document.getElementById('consent-preferences');

    return elements.banner !== null;
  }

  /**
   * Mostra banner
   */
  function showBanner() {
    if (!elements.banner) return;
    
    elements.banner.style.display = 'block';
    elements.banner.classList.add('show');
    elements.banner.setAttribute('aria-hidden', 'false');
    
    console.log('📢 Banner GDPR exibido');
  }

  /**
   * Esconde banner com animação
   */
  function hideBanner() {
    if (!elements.banner) return;
    
    elements.banner.style.animation = 'fadeOutBanner 0.3s ease-out forwards';
    
    setTimeout(() => {
      elements.banner.style.display = 'none';
      elements.banner.classList.remove('show');
      elements.banner.setAttribute('aria-hidden', 'true');
    }, 300);
    
    console.log('✅ Banner GDPR ocultado');
  }

  /**
   * Atualiza checkboxes com estado atual
   */
  function updateCheckboxes(consent) {
    if (elements.checkboxes.analytics) {
      elements.checkboxes.analytics.checked = consent.analytics;
    }
    if (elements.checkboxes.marketing) {
      elements.checkboxes.marketing.checked = consent.marketing;
    }
    if (elements.checkboxes.preferences) {
      elements.checkboxes.preferences.checked = consent.preferences;
    }
  }

  /**
   * Toggle painel de configurações
   */
  function toggleSettings() {
    if (!elements.settings) return;
    
    const isHidden = elements.settings.classList.contains('hidden');
    
    if (isHidden) {
      // Carrega estado atual
      const currentConsent = loadConsent() || DEFAULT_CONSENT;
      updateCheckboxes(currentConsent);
      
      // Mostra painel
      elements.settings.classList.remove('hidden');
      
      if (elements.customize) {
        elements.customize.textContent = '▼ Personalizar';
        elements.customize.setAttribute('aria-expanded', 'true');
      }
      
      // Scroll suave
      setTimeout(() => {
        elements.settings.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest' 
        });
      }, 100);
      
      console.log('⚙️ Painel de configurações aberto');
    } else {
      // Esconde painel
      elements.settings.classList.add('hidden');
      
      if (elements.customize) {
        elements.customize.textContent = '⚙ Personalizar';
        elements.customize.setAttribute('aria-expanded', 'false');
      }
      
      console.log('⚙️ Painel de configurações fechado');
    }
  }

  /**
   * Handler: Aceitar todos
   */
  function handleAcceptAll(e) {
    e.preventDefault();
    
    const consent = saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    });
    
    if (consent) {
      applyConsent(consent);
      hideBanner();
      console.log('✅ Todos os cookies aceitos');
    }
  }

  /**
   * Handler: Rejeitar não essenciais
   */
  function handleRejectAll(e) {
    e.preventDefault();
    
    const consent = saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    });
    
    if (consent) {
      applyConsent(consent);
      hideBanner();
      console.log('✅ Cookies não essenciais rejeitados');
    }
  }

  /**
   * Handler: Personalizar
   */
  function handleCustomize(e) {
    e.preventDefault();
    toggleSettings();
  }

  /**
   * Handler: Salvar configurações
   */
  function handleSaveSettings(e) {
    e.preventDefault();
    
    const consent = saveConsent({
      necessary: true,
      analytics: elements.checkboxes.analytics?.checked || false,
      marketing: elements.checkboxes.marketing?.checked || false,
      preferences: elements.checkboxes.preferences?.checked || false
    });
    
    if (consent) {
      applyConsent(consent);
      hideBanner();
      
      // Feedback visual
      if (elements.saveSettings) {
        const originalText = elements.saveSettings.textContent;
        elements.saveSettings.textContent = '✓ Salvo!';
        elements.saveSettings.disabled = true;
        
        setTimeout(() => {
          elements.saveSettings.textContent = originalText;
          elements.saveSettings.disabled = false;
        }, 2000);
      }
      
      console.log('💾 Preferências personalizadas salvas:', consent);
    }
  }

  /**
   * Handler: Fechar banner (sem salvar)
   */
  function handleClose(e) {
    e.preventDefault();
    hideBanner();
    console.log('ℹ️ Banner fechado sem salvar');
  }

  /**
   * Anexa event listeners
   */
  function attachEvents() {
    if (elements.acceptAll) {
      elements.acceptAll.addEventListener('click', handleAcceptAll);
    }
    
    if (elements.rejectAll) {
      elements.rejectAll.addEventListener('click', handleRejectAll);
    }
    
    if (elements.customize) {
      elements.customize.addEventListener('click', handleCustomize);
    }
    
    if (elements.saveSettings) {
      elements.saveSettings.addEventListener('click', handleSaveSettings);
    }
    
    if (elements.closeBtn) {
      elements.closeBtn.addEventListener('click', handleClose);
    }
    
    console.log('✅ Event listeners anexados');
  }

  /**
   * Inicialização principal
   */
  function init() {
    console.log('🚀 Inicializando GDPR Manager v' + CONFIG.currentVersion);
    
    // Aguarda DOM
    if (!mapElements()) {
      console.warn('⚠️ Banner GDPR não encontrado no DOM');
      return;
    }
    
    // Verifica consentimento existente
    if (hasStoredConsent()) {
      const consent = loadConsent();
      if (consent) {
        applyConsent(consent);
        hideBanner();
        console.log('✅ Consentimento carregado:', consent);
        return;
      }
    }
    
    // Anexa eventos
    attachEvents();
    
    // Mostra banner após delay
    setTimeout(showBanner, CONFIG.bannerDelay);
  }

  /**
   * API Pública
   */
  window.gdprManager = {
    version: CONFIG.currentVersion,
    
    // Mostra banner novamente
    showBanner: () => {
      if (mapElements()) {
        showBanner();
      }
    },
    
    // Esconde banner
    hideBanner: hideBanner,
    
    // Obtém consentimento atual
    getConsent: () => loadConsent() || DEFAULT_CONSENT,
    
    // Verifica se tem consentimento específico
    hasConsent: (type) => {
      const consent = loadConsent();
      if (!consent) return false;
      return consent[type] === true;
    },
    
    // Limpa consentimento (debug)
    clearConsent: () => {
      try {
        localStorage.removeItem(CONFIG.storageKey);
        console.log('🗑️ Consentimento removido');
        location.reload();
      } catch (e) {
        console.error('❌ Erro ao limpar:', e);
      }
    },
    
    // Aceita todos programaticamente
    acceptAll: () => {
      const consent = saveConsent({
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true
      });
      if (consent) {
        applyConsent(consent);
        hideBanner();
      }
    },
    
    // Rejeita não essenciais programaticamente
    rejectAll: () => {
      const consent = saveConsent({
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false
      });
      if (consent) {
        applyConsent(consent);
        hideBanner();
      }
    }
  };

  // Compatibilidade com código legado
  window.gdprDebug = window.gdprManager;

  /**
   * Auto-inicialização
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }

  console.log('✅ GDPR Manager carregado. Use window.gdprManager para API.');
})();