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
  }

  acceptBtn.onclick = () => {
    localStorage.setItem(
      'cookieConsent',
      JSON.stringify({
        functional: true,
        analytics: true,
        ads: true
      })
    );
    loadConsentedScripts();
    banner.style.display = 'none';
  };

  rejectBtn.onclick = () => {
    localStorage.setItem(
      'cookieConsent',
      JSON.stringify({
        functional: false,
        analytics: false,
        ads: false
      })
    );
    banner.style.display = 'none';
  };

  customizeBtn.onclick = () => {
    settings.classList.toggle('hidden');
  };

  saveSettingsBtn.onclick = () => {
    const functional = document.getElementById('functional-cookies').checked;
    const analytics = document.getElementById('analytics-cookies').checked;
    const ads = document.getElementById('ads-cookies').checked;

    localStorage.setItem(
      'cookieConsent',
      JSON.stringify({ functional, analytics, ads })
    );

    loadConsentedScripts();
    banner.style.display = 'none';
  };

  function loadConsentedScripts() {
    const consent = JSON.parse(localStorage.getItem('cookieConsent') || '{}');

    if (consent.analytics) {
      // Exemplo: carregando Google Analytics
      const ga = document.createElement('script');
      ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX';
      ga.async = true;
      document.head.appendChild(ga);

      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    }

    if (consent.ads) {
      // Exemplo: permitir anúncios personalizados (AdSense já está no HTML)
      // Google cuida do consentimento se você usa o modo de consentimento (Consent Mode v2)
    }
  }

  // Se já houver consentimento, carrega scripts permitidos
  if (localStorage.getItem('cookieConsent')) {
    loadConsentedScripts();
  }
});
