/**
 * gdpr-consent-analytics.js
 * Integração GDPR + Google Analytics/GTM
 * Versão Otimizada e Modular
 */

(function() {
  'use strict';

  // Configurações
  const CONFIG = {
    gtmId: 'GTM-NLMLKHPS', // Seu GTM ID
    gaId: null, // GA4 ID (opcional, se usar GA direto)
    consentKey: 'canalqb_gdpr_consent',
    eventCategory: 'GDPR_Consent'
  };

  /**
   * Gerenciador de Analytics
   */
  class AnalyticsManager {
    constructor() {
      this.initialized = false;
      this.gtmReady = false;
      this.gaReady = false;
    }

    /**
     * Inicializa Google Analytics (se necessário)
     */
    initGA() {
      if (!CONFIG.gaId || this.gaReady) return;
      
      try {
        // Verifica se já existe
        if (typeof gtag === 'function') {
          this.gaReady = true;
          console.log('✅ Google Analytics já inicializado');
          return;
        }

        // Carrega GA4
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.gaId}`;
        
        script.onload = () => {
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          
          gtag('js', new Date());
          gtag('config', CONFIG.gaId, {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
          
          this.gaReady = true;
          console.log('✅ Google Analytics inicializado');
        };
        
        document.head.appendChild(script);
      } catch (e) {
        console.warn('⚠️ Erro ao inicializar GA:', e);
      }
    }

    /**
     * Verifica se GTM está pronto
     */
    checkGTM() {
      if (typeof dataLayer !== 'undefined' && dataLayer.length > 0) {
        this.gtmReady = true;
        console.log('✅ Google Tag Manager detectado');
        return true;
      }
      return false;
    }

    /**
     * Aplica consentimento ao Google
     */
    applyConsent(consent) {
      const consentMap = {
        ad_storage: consent.marketing ? 'granted' : 'denied',
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        personalization_storage: consent.preferences ? 'granted' : 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted'
      };

      // Google Analytics
      if (typeof gtag === 'function') {
        gtag('consent', 'update', consentMap);
        console.log('✅ Consentimento aplicado ao gtag:', consentMap);
      }

      // Google Tag Manager
      if (this.gtmReady) {
        dataLayer.push({
          event: 'consent_update',
          consent_analytics: consent.analytics,
          consent_marketing: consent.marketing,
          consent_preferences: consent.preferences,
          consent_timestamp: consent.timestamp
        });
        console.log('✅ Consentimento aplicado ao GTM');
      }
    }

    /**
     * Rastreia evento customizado
     */
    trackEvent(action, label = '', value = 1) {
      // Google Analytics
      if (typeof gtag === 'function') {
        gtag('event', action, {
          event_category: CONFIG.eventCategory,
          event_label: label,
          value: value,
          timestamp: new Date().toISOString()
        });
        console.log('📊 Evento rastreado (GA):', action, label);
      }

      // Google Tag Manager
      if (this.gtmReady) {
        dataLayer.push({
          event: action,
          eventCategory: CONFIG.eventCategory,
          eventLabel: label,
          eventValue: value
        });
        console.log('📊 Evento rastreado (GTM):', action, label);
      }
    }

    /**
     * Rastreia pageview
     */
    trackPageView(path, title) {
      if (typeof gtag === 'function') {
        gtag('event', 'page_view', {
          page_path: path || window.location.pathname,
          page_title: title || document.title
        });
        console.log('📄 Pageview rastreado:', path || window.location.pathname);
      }
    }

    /**
     * Inicializa Analytics baseado no consentimento
     */
    init(consent) {
      if (this.initialized) return;
      
      console.log('🚀 Inicializando Analytics Manager');
      
      // Verifica GTM
      this.checkGTM();
      
      // Inicializa GA se necessário
      if (CONFIG.gaId && consent.analytics) {
        this.initGA();
      }
      
      // Aplica consentimento
      this.applyConsent(consent);
      
      this.initialized = true;
      console.log('✅ Analytics Manager inicializado');
    }
  }

  // Instância global
  const analytics = new AnalyticsManager();
  window.analyticsManager = analytics;

  /**
   * Listener: Consentimento atualizado
   */
  window.addEventListener('consentUpdated', (e) => {
    const consent = e.detail;
    console.log('📢 Evento consentUpdated recebido:', consent);
    
    // Inicializa/atualiza analytics
    if (!analytics.initialized) {
      analytics.init(consent);
    } else {
      analytics.applyConsent(consent);
    }
    
    // Rastreia evento de consentimento
    analytics.trackEvent('consent_updated', JSON.stringify({
      analytics: consent.analytics,
      marketing: consent.marketing,
      preferences: consent.preferences
    }));
    
    // Recarrega anúncios se marketing aceito
    if (consent.marketing && window.AdsenseManager) {
      setTimeout(() => {
        window.AdsenseManager.processAds?.();
      }, 500);
    }
  });

  /**
   * Listener: DOMContentLoaded
   */
  function onDOMReady() {
    console.log('🚀 Analytics integration: DOM pronto');
    
    // Carrega consentimento salvo
    try {
      const stored = localStorage.getItem(CONFIG.consentKey);
      if (stored) {
        const consent = JSON.parse(stored);
        analytics.init(consent);
      } else {
        console.log('ℹ️ Nenhum consentimento salvo, aguardando decisão do usuário');
      }
    } catch (e) {
      console.warn('⚠️ Erro ao carregar consentimento:', e);
    }
  }

  /**
   * Auto-inicialização
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  } else {
    setTimeout(onDOMReady, 100);
  }

  /**
   * API Pública
   */
  window.gdprAnalytics = {
    // Rastreia evento
    track: (action, label, value) => {
      analytics.trackEvent(action, label, value);
    },
    
    // Rastreia pageview
    pageView: (path, title) => {
      analytics.trackPageView(path, title);
    },
    
    // Obtém status
    getStatus: () => ({
      initialized: analytics.initialized,
      gtmReady: analytics.gtmReady,
      gaReady: analytics.gaReady
    }),
    
    // Força inicialização
    init: (consent) => {
      analytics.init(consent);
    }
  };

  console.log('✅ GDPR Analytics Integration carregado');
})();