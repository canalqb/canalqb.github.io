document.addEventListener('DOMContentLoaded', function () {
  const banner = document.getElementById('cookie-consent-banner');
  const settings = document.getElementById('cookie-settings');

  const acceptBtn = document.getElementById('accept-cookies');
  const rejectBtn = document.getElementById('reject-cookies');
  const customizeBtn = document.getElementById('customize-cookies');
  const saveSettingsBtn = document.getElementById('save-cookie-settings');

  // Verifica se já consentiu
  const consentGiven = localStorage.getItem('cookieConsentGiven');

  if (!consentGiven) {
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }

  acceptBtn.onclick = () => {
    gtag('consent', 'update', {
      'ad_storage': 'granted',
      'analytics_storage': 'granted'
    });
    localStorage.setItem('cookieConsentGiven', 'true');
    banner.style.display = 'none';
  };

  rejectBtn.onclick = () => {
    gtag('consent', 'update', {
      'ad_storage': 'denied',
      'analytics_storage': 'denied'
    });
    localStorage.setItem('cookieConsentGiven', 'true');
    banner.style.display = 'none';
  };

  customizeBtn.onclick = () => {
    settings.classList.toggle('hidden');
  };

  saveSettingsBtn.onclick = () => {
    const functional = document.getElementById('functional-cookies').checked;
    const analytics = document.getElementById('analytics-cookies').checked;
    const ads = document.getElementById('ads-cookies').checked;

    gtag('consent', 'update', {
      'ad_storage': ads ? 'granted' : 'denied',
      'analytics_storage': analytics ? 'granted' : 'denied'
    });

    localStorage.setItem('cookieConsentGiven', 'true');
    banner.style.display = 'none';
  };
});
