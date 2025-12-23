/**
 * gdpr-consent-analytics.js
 * Gerenciador de Consentimento GDPR + Google Analytics
 * Compatível com Blogspot, respeitando regulações de privacidade
 */

(function() {
  'use strict';

  const CONSENT_CONFIG = {
    storageKey: 'canalqb_gdpr_consent',
    versionKey: 'canalqb_consent_version',
    currentVersion: '1.0.0',
    cookieExpiry: 365 * 24 * 60 * 60 * 1000 // 1 ano
  };

  const CONSENT_DEFAULTS = {
    necessary: true, // Sempre necessário
    analytics: false,
    marketing: false,
    preferences: false
  };

  class GDPRConsentManager {
    constructor() {
      this.consent = { ...CONSENT_DEFAULTS };
      this.banner = null;
      this.isConsented = false;
      this.loadConsent();
    }

    /**
     * Carrega preferências de consentimento armazenadas
     */
    loadConsent() {
      try {
        const stored = sessionStorage.getItem(CONSENT_CONFIG.storageKey);
        if (stored) {
          this.consent = { ...CONSENT_DEFAULTS, ...JSON.parse(stored) };
          this.isConsented = true;
        }
      } catch (e) {
        console.warn('⚠️ Erro ao carregar consentimento:', e);
      }
    }

    /**
     * Salva preferências de consentimento
     */
    saveConsent(preferences) {
      try {
        this.consent = { ...CONSENT_DEFAULTS, ...preferences };
        sessionStorage.setItem(CONSENT_CONFIG.storageKey, JSON.stringify(this.consent));
        this.isConsented = true;

        // Log para auditoria
        console.log('💾 Consentimento salvo:', this.consent);

        // Notifica globalmente
        window.dispatchEvent(new CustomEvent('consentUpdated', { detail: this.consent }));
      } catch (e) {
        console.error('❌ Erro ao salvar consentimento:', e);
      }
    }

    /**
     * Verifica se tipo de consentimento foi dado
     */
    hasConsent(type = 'all') {
      if (type === 'all') {
        return this.consent.analytics && this.consent.marketing;
      }
      return this.consent[type] === true;
    }

    /**
     * Aplica consentimento a trakcing/ads
     */
    applyConsent() {
      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('consent', 'update', {
          ad_storage: this.consent.marketing ? 'granted' : 'denied',
          analytics_storage: this.consent.analytics ? 'granted' : 'denied',
          personalization_storage: this.consent.preferences ? 'granted' : 'denied'
        });
      }

      // Google Tag Manager
      if (typeof dataLayer !== 'undefined') {
        dataLayer.push({
          event: 'consent_update',
          consent: this.consent
        });
      }

      // Notifica AdSense Manager
      if (window.AdsenseManager) {
        window.AdsenseManager.consentUpdated = this.consent;
      }

      console.log('✅ Consentimento aplicado ao sistema');
    }

    /**
     * Retorna objeto com estado de consentimento
     */
    getConsentState() {
      return { ...this.consent };
    }
  }

  // Instância global
  window.consentManager = new GDPRConsentManager();

  /**
   * Gerenciador da Interface de Consentimento
   */
  class ConsentUI {
    constructor(manager) {
      this.manager = manager;
      this.banner = null;
      this.settings = null;
      this.init();
    }

    init() {
      if (this.manager.isConsented) {
        console.log('ℹ️ Consentimento já obtido');
        this.manager.applyConsent();
        this.hideBanner();
      } else {
        this.createBanner();
        this.attachEvents();
      }
    }

    /**
     * Cria banner de consentimento
     */
    createBanner() {
      this.banner = document.getElementById('gdpr-consent-banner');
      if (!this.banner) {
        console.warn('⚠️ Banner de consentimento não encontrado no DOM');
        return;
      }

      this.banner.style.display = 'block';
      this.banner.setAttribute('role', 'dialog');
      this.banner.setAttribute('aria-modal', 'true');
      this.banner.setAttribute('aria-labelledby', 'consent-title');
    }

    /**
     * Anexa eventos aos botões
     */
    attachEvents() {
      // Aceitar todos
      const btnAcceptAll = document.getElementById('consent-accept-all');
      if (btnAcceptAll) {
        btnAcceptAll.addEventListener('click', () => this.acceptAll());
      }

      // Rejeitar não-necessários
      const btnRejectAll = document.getElementById('consent-reject-all');
      if (btnRejectAll) {
        btnRejectAll.addEventListener('click', () => this.rejectAll());
      }

      // Personalizar
      const btnCustomize = document.getElementById('consent-customize');
      if (btnCustomize) {
        btnCustomize.addEventListener('click', () => this.toggleSettings());
      }

      // Salvar personalizado
      const btnSave = document.getElementById('consent-save-settings');
      if (btnSave) {
        btnSave.addEventListener('click', () => this.saveSettings());
      }

      // Fechar banner (X)
      const btnClose = document.getElementById('consent-close-banner');
      if (btnClose) {
        btnClose.addEventListener('click', () => this.rejectAll());
      }
    }

    /**
     * Aceita todos os consentimentos
     */
    acceptAll() {
      const preferences = {
        necessary: true,
        analytics: true,
        marketing: true,
        preferences: true
      };

      this.manager.saveConsent(preferences);
      this.manager.applyConsent();
      this.hideBanner();

      console.log('✅ Todos os consentimentos aceitos');
    }

    /**
     * Rejeita consentimentos não-necessários
     */
    rejectAll() {
      const preferences = {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false
      };

      this.manager.saveConsent(preferences);
      this.manager.applyConsent();
      this.hideBanner();

      console.log('✅ Consentimentos rejeitados (mantendo necessários)');
    }

    /**
     * Alterna exibição de configurações
     */
    toggleSettings() {
      const settings = document.getElementById('consent-settings');
      if (!settings) return;

      const isHidden = settings.classList.contains('hidden');
      if (isHidden) {
        settings.classList.remove('hidden');
        this.updateCheckboxes();
      } else {
        settings.classList.add('hidden');
      }
    }

    /**
     * Atualiza checkboxes com estado atual
     */
    updateCheckboxes() {
      const state = this.manager.getConsentState();

      const cbAnalytics = document.getElementById('consent-analytics');
      const cbMarketing = document.getElementById('consent-marketing');
      const cbPreferences = document.getElementById('consent-preferences');

      if (cbAnalytics) cbAnalytics.checked = state.analytics;
      if (cbMarketing) cbMarketing.checked = state.marketing;
      if (cbPreferences) cbPreferences.checked = state.preferences;
    }

    /**
     * Salva preferências personalizadas
     */
    saveSettings() {
      const preferences = {
        necessary: true,
        analytics: document.getElementById('consent-analytics')?.checked || false,
        marketing: document.getElementById('consent-marketing')?.checked || false,
        preferences: document.getElementById('consent-preferences')?.checked || false
      };

      this.manager.saveConsent(preferences);
      this.manager.applyConsent();
      this.hideBanner();
      this.toggleSettings();

      console.log('✅ Configurações personalizadas salvas');
    }

    /**
     * Oculta banner
     */
    hideBanner() {
      if (!this.banner) return;

      this.banner.style.animation = 'fadeOutBanner 0.3s ease-out forwards';
      setTimeout(() => {
        this.banner.style.display = 'none';
      }, 300);
    }

    /**
     * Mostra banner novamente (para debug/testes)
     */
    showBanner() {
      if (!this.banner) return;
      this.manager.isConsented = false;
      this.banner.style.display = 'block';
      this.banner.style.animation = 'fadeInBanner 0.3s ease-in';
    }
  }

  // Inicializa interface
  const consentUI = new ConsentUI(window.consentManager);

  /**
   * Integração com Google Analytics (com verificação de consentimento)
   */
  function initGoogleAnalytics() {
    try {
      // Aguarda GTM estar pronto
      if (typeof gtag === 'function') {
        console.log('✅ Google Analytics pronto');
      } else {
        console.log('ℹ️ Google Analytics ainda não carregado');
      }
    } catch (e) {
      console.warn('⚠️ Erro ao inicializar Analytics:', e.message);
    }
  }

  /**
   * Rastreamento de eventos customizados
   */
  function trackConsentEvent(action, details = {}) {
    if (typeof gtag !== 'undefined' && window.consentManager.hasConsent('analytics')) {
      gtag('event', action, {
        event_category: 'Consent',
        event_label: JSON.stringify(details),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Listener para mudanças de consentimento
   */
  window.addEventListener('consentUpdated', (e) => {
    console.log('📢 Consentimento atualizado:', e.detail);
    trackConsentEvent('consent_updated', e.detail);

    // Recarrega anúncios se marketing foi aceito
    if (e.detail.marketing && window.AdsenseManager) {
      window.AdsenseManager.processAds?.();
    }
  });

  /**
   * Inicialização principal
   */
  function init() {
    console.log('🚀 Inicializando GDPR Consent Manager...');

    // Aplicar consentimento imediatamente
    setTimeout(() => {
      try {
        window.consentManager.applyConsent();
        initGoogleAnalytics();
        console.log('✅ GDPR Manager inicializado');
      } catch (e) {
        console.warn('⚠️ Erro na inicialização:', e.message);
      }
    }, 100);
  }

  // Executa quando DOM está pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /**
   * API Pública
   */
  window.consentAPI = {
    manager: window.consentManager,
    ui: consentUI,
    acceptAll: () => consentUI.acceptAll(),
    rejectAll: () => consentUI.rejectAll(),
    showBanner: () => consentUI.showBanner(),
    hideBanner: () => consentUI.hideBanner(),
    getConsent: () => window.consentManager.getConsentState(),
    hasConsent: (type) => window.consentManager.hasConsent(type),
    trackEvent: trackConsentEvent
  };

  // Compatibilidade com código anterior
  window.cookieConsent = window.consentManager.consent;

  console.log('✅ GDPR Consent Manager carregado com sucesso');
})();