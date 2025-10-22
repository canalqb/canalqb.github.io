document.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('cookie-consent-banner');
  const settings = document.getElementById('cookie-settings');

  const btnAccept = document.getElementById('accept-cookies');
  const btnReject = document.getElementById('reject-cookies');
  const btnCustomize = document.getElementById('customize-cookies');
  const btnSaveSettings = document.getElementById('save-cookie-settings');

  // Chaves para localStorage
  const CONSENT_KEY = 'cookieConsentGiven';
  const PREFERENCES_KEY = 'cookiePreferences';

  // Função para atualizar o consentimento no gtag
  function updateGtagConsent(preferences) {
    // preferences: { ads: boolean, analytics: boolean }
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        ad_storage: preferences.ads ? 'granted' : 'denied',
        analytics_storage: preferences.analytics ? 'granted' : 'denied'
      });
    }
  }

  // Carrega preferências do localStorage (se houver)
  function loadPreferences() {
    const prefs = localStorage.getItem(PREFERENCES_KEY);
    return prefs ? JSON.parse(prefs) : null;
  }

  // Salva preferências no localStorage
  function savePreferences(preferences) {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }

  // Atualiza os checkboxes de acordo com preferências carregadas
  function applyPreferencesToUI(preferences) {
    if (!preferences) return;
    document.getElementById('functional-cookies').checked = true; // sempre true e disabled
    document.getElementById('analytics-cookies').checked = !!preferences.analytics;
    document.getElementById('ads-cookies').checked = !!preferences.ads;
  }

  // Exibe ou esconde o banner
  function toggleBanner(show) {
    banner.style.display = show ? 'block' : 'none';
  }

  // Exibe ou esconde a área de configurações detalhadas
  function toggleSettings(show) {
    settings.classList.toggle('d-none', !show);
  }

  // Inicialização do estado do banner
  const consentGiven = localStorage.getItem(CONSENT_KEY) === 'true';
  const storedPreferences = loadPreferences();

  if (consentGiven && storedPreferences) {
    // Consentimento já dado, aplicar preferências e esconder banner
    updateGtagConsent(storedPreferences);
    toggleBanner(false);
  } else {
    // Consentimento não dado ainda, mostrar banner e esconder settings
    toggleBanner(true);
    toggleSettings(false);
  }

  // Eventos

  // Aceitar todos
  btnAccept.addEventListener('click', () => {
    const prefs = { ads: true, analytics: true };
    savePreferences(prefs);
    updateGtagConsent(prefs);
    localStorage.setItem(CONSENT_KEY, 'true');
    toggleBanner(false);
  });

  // Rejeitar todos (exceto necessários)
  btnReject.addEventListener('click', () => {
    const prefs = { ads: false, analytics: false };
    savePreferences(prefs);
    updateGtagConsent(prefs);
    localStorage.setItem(CONSENT_KEY, 'true');
    toggleBanner(false);
  });

  // Mostrar/Ocultar configurações personalizadas
  btnCustomize.addEventListener('click', () => {
    const isHidden = settings.classList.contains('d-none');
    toggleSettings(isHidden);
  });

  // Salvar configurações personalizadas
  btnSaveSettings.addEventListener('click', () => {
    const analytics = document.getElementById('analytics-cookies').checked;
    const ads = document.getElementById('ads-cookies').checked;

    const prefs = { ads, analytics };
    savePreferences(prefs);
    updateGtagConsent(prefs);
    localStorage.setItem(CONSENT_KEY, 'true');
    toggleBanner(false);
    toggleSettings(false);
  });

  // Aplicar preferências no carregamento para UI (se houver)
  applyPreferencesToUI(storedPreferences);
});
