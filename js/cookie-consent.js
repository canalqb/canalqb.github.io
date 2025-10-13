document.addEventListener('DOMContentLoaded', function () {
  const banner = document.getElementById('cookie-consent-banner');
  const settings = document.getElementById('cookie-settings');

  const acceptBtn = document.getElementById('accept-cookies');
  const rejectBtn = document.getElementById('reject-cookies');
  const customizeBtn = document.getElementById('customize-cookies');
  const saveSettingsBtn = document.getElementById('save-cookie-settings');

  // Verifica se o usuário já deu consentimento
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
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    updateGoogleConsent(consentData);
    loadConsentedScripts();
    banner.style.display = 'none';
  };

  rejectBtn.onclick = () => {
    const consentData = {
      functional: false,
      analytics: false,
      ads: false
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    updateGoogleConsent(consentData);
    banner.style.display = 'none';
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

    localStorage.setItem('cookieConsent', JSON.stringify(consentData));
    updateGoogleConsent(consentData);
    loadConsentedScripts();
    banner.style.display = 'none';
  };

  function updateGoogleConsent(consent) {
    if (typeof gtag !== 'function') return;

    gtag('consent', 'update', {
      ad_storage: consent.ads ? 'granted' : 'denied',
      analytics_storage: consent.analytics ? 'granted' : 'denied'
    });
  }

  function loadConsentedScripts() {
    const consent = JSON.parse(localStorage.getItem('cookieConsent') || '{}');

    // Carrega scripts adicionais apenas se necessário
    // Neste caso, estamos usando o GTM que já carrega tudo baseado no consentimento via gtag

    // Se você estiver usando algo fora do GTM, pode carregar manualmente aqui
  }
});
