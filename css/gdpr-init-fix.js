/**
 * gdpr-init-fix.js
 * Fix para garantir funcionamento dos botões GDPR
 * Carregue ANTES dos outros scripts
 */

(function() {
  'use strict';

  // Verificar se há consentimento prévio
  function hasConsentStored() {
    try {
      return !!sessionStorage.getItem('canalqb_gdpr_consent');
    } catch {
      return false;
    }
  }

  // Mostrar banner se necessário
  function showBannerIfNeeded() {
    const banner = document.getElementById('gdpr-consent-banner');
    if (!banner) {
      console.warn('⚠️ Banner GDPR não encontrado');
      return;
    }

    if (!hasConsentStored()) {
      console.log('📢 Mostrando banner GDPR');
      banner.style.display = 'block';
      banner.classList.add('show');
    } else {
      console.log('✅ Consentimento já obtido, ocultando banner');
      banner.style.display = 'none';
    }
  }

  // Anexar eventos dos botões
  function attachButtonEvents() {
    // Botão Aceitar Todos
    const btnAcceptAll = document.getElementById('consent-accept-all');
    if (btnAcceptAll) {
      btnAcceptAll.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('✅ Aceitar Todos clicado');
        
        const prefs = {
          necessary: true,
          analytics: true,
          marketing: true,
          preferences: true
        };

        try {
          sessionStorage.setItem('canalqb_gdpr_consent', JSON.stringify(prefs));
          console.log('💾 Preferências salvas:', prefs);
          
          hideBanner();
          
          // Trigger do evento
          window.dispatchEvent(new CustomEvent('consentUpdated', { detail: prefs }));
        } catch (err) {
          console.error('❌ Erro ao salvar:', err);
        }
      });
    }

    // Botão Rejeitar
    const btnReject = document.getElementById('consent-reject-all');
    if (btnReject) {
      btnReject.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('✅ Rejeitar clicado');
        
        const prefs = {
          necessary: true,
          analytics: false,
          marketing: false,
          preferences: false
        };

        try {
          sessionStorage.setItem('canalqb_gdpr_consent', JSON.stringify(prefs));
          console.log('💾 Preferências salvas:', prefs);
          
          hideBanner();
          
          // Trigger do evento
          window.dispatchEvent(new CustomEvent('consentUpdated', { detail: prefs }));
        } catch (err) {
          console.error('❌ Erro ao salvar:', err);
        }
      });
    }

    // Botão Personalizar
    const btnCustomize = document.getElementById('consent-customize');
    if (btnCustomize) {
      btnCustomize.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('⚙️ Personalizar clicado');
        
        const settings = document.getElementById('consent-settings');
        if (settings) {
          settings.classList.toggle('hidden');
        }
      });
    }

    // Botão Salvar Configurações
    const btnSave = document.getElementById('consent-save-settings');
    if (btnSave) {
      btnSave.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('💾 Salvar Configurações clicado');
        
        const analytics = document.getElementById('consent-analytics')?.checked || false;
        const marketing = document.getElementById('consent-marketing')?.checked || false;
        const preferences = document.getElementById('consent-preferences')?.checked || false;

        const prefs = {
          necessary: true,
          analytics: analytics,
          marketing: marketing,
          preferences: preferences
        };

        try {
          sessionStorage.setItem('canalqb_gdpr_consent', JSON.stringify(prefs));
          console.log('💾 Preferências personalizadas salvas:', prefs);
          
          hideBanner();
          
          // Trigger do evento
          window.dispatchEvent(new CustomEvent('consentUpdated', { detail: prefs }));
        } catch (err) {
          console.error('❌ Erro ao salvar:', err);
        }
      });
    }

    // Botão Fechar (X)
    const btnClose = document.getElementById('consent-close-banner');
    if (btnClose) {
      btnClose.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('✅ Fechar banner clicado');
        hideBanner();
      });
    }
  }

  // Ocultar banner
  function hideBanner() {
    const banner = document.getElementById('gdpr-consent-banner');
    if (banner) {
      banner.style.animation = 'fadeOutBanner 0.3s ease-out forwards';
      setTimeout(() => {
        banner.style.display = 'none';
      }, 300);
    }
  }

  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🔧 Inicializando GDPR Fix...');
      setTimeout(() => {
        showBannerIfNeeded();
        attachButtonEvents();
      }, 100);
    });
  } else {
    console.log('🔧 Inicializando GDPR Fix (DOM já pronto)...');
    setTimeout(() => {
      showBannerIfNeeded();
      attachButtonEvents();
    }, 100);
  }

  // API global para teste
  window.gdprDebug = {
    showBanner: () => {
      const banner = document.getElementById('gdpr-consent-banner');
      if (banner) {
        banner.style.display = 'block';
        banner.classList.add('show');
      }
    },
    getConsent: () => {
      try {
        return JSON.parse(sessionStorage.getItem('canalqb_gdpr_consent') || '{}');
      } catch {
        return null;
      }
    },
    clearConsent: () => {
      try {
        sessionStorage.removeItem('canalqb_gdpr_consent');
        console.log('✅ Consentimento limpo');
        window.location.reload();
      } catch (err) {
        console.error('❌ Erro:', err);
      }
    }
  };

  console.log('✅ GDPR Fix carregado. Use window.gdprDebug para debug.');
})();