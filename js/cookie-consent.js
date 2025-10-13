document.addEventListener('DOMContentLoaded', function () {
  const banner = document.getElementById('cookie-consent-banner');
  const settings = document.getElementById('cookie-settings');

  const acceptBtn = document.getElementById('accept-cookies');
  const rejectBtn = document.getElementById('reject-cookies');
  const customizeBtn = document.getElementById('customize-cookies');
  const saveSettingsBtn = document.getElementById('save-cookie-settings');

  if (!localStorage.getItem('cookieConsent')) {
    banner.style.display = 'block';
  } else {
    loadConsentedScripts();
  }

  acceptBtn.onclick = () => {
    const consentData = {
      functional: true,
      analytics: true,
      ads: true
    };
    saveConsentAndApply(consentData);
  };

  rejectBtn.onclick = () => {
    const consentData = {
      functional: false,
      analytics: false,
      ads: false
    };
    saveConsentAndApply(consentData);
  };

  customizeBtn.onclick = () => {
    settings.classList.toggle('hidden');
  };

  saveSettingsBtn.onclick = () => {
    const consentData = {
      functional: document.getElementById('functional-cookies').checked,
      analytics: document.getElementById('analytics-cookies').checked,
      ads: document.getElementById('ads-cookies').checked
    };
    saveConsentAndApply(consentData);
  };

  function saveConsentAndApply(consentData) {
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    updateGoogleConsent(consentData);
    loadConsentedScripts();
    banner.style.display = 'none';
  }

  function updateGoogleConsent(consent) {
    if (typeof gtag !== 'function') return;

    gtag('consent', 'update', {
      ad_storage: consent.ads ? 'granted' : 'denied',
      analytics_storage: consent.analytics ? 'granted' : 'denied'
    });
  }

  function loadConsentedScripts() {
    const consent = JSON.parse(localStorage.getItem('cookieConsent') || '{}');

    if (consent.analytics) {
      // Inicialize o Google Analytics, se necessário
      console.log('Google Analytics ativado.');
      // Exemplo: gtag('config', 'UA-XXXXXXXXX-X');
      // Ou carregar scripts adicionais aqui
    } else {
      console.log('Google Analytics desativado.');
    }

    if (consent.ads) {
      // Inicialize scripts de anúncios
      console.log('Anúncios ativados.');
      // Por exemplo, forçar carregamento dos anúncios do Google AdSense:
      (adsbygoogle = window.adsbygoogle || []).push({});
    } else {
      console.log('Anúncios desativados.');
    }
  }
});
