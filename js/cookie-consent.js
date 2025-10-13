document.addEventListener('DOMContentLoaded', function () {
  const banner = document.getElementById('cookie-consent-banner');
  const settings = document.getElementById('cookie-settings');

  const acceptBtn = document.getElementById('accept-cookies');
  const rejectBtn = document.getElementById('reject-cookies');
  const customizeBtn = document.getElementById('customize-cookies');
  const saveSettingsBtn = document.getElementById('save-cookie-settings');

  // Se já consentiu, esconde o banner imediatamente
  if (localStorage.getItem('cookieConsent')) {
    banner.classList.add('hidden');
    loadConsentedScripts();
  } else {
    banner.classList.remove('hidden');
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
    banner.classList.add('hidden');
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
      console.log('Google Analytics ativado.');
      // gtag('config', 'UA-XXXXXXXXX-X'); // seu código GA aqui, se tiver
    } else {
      console.log('Google Analytics desativado.');
    }

    if (consent.ads) {
      console.log('Anúncios ativados.');
      (adsbygoogle = window.adsbygoogle || []).push({});
    } else {
      console.log('Anúncios desativados.');
    }
  }
});
