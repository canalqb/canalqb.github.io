// adFloating.js

document.addEventListener('DOMContentLoaded', () => {
  // Verifica se usuário já fechou o anúncio
  if (localStorage.getItem('adFloatingClosed') === 'true') {
    return; // Não mostra o anúncio
  }

  // Cria container do anúncio flutuante
  const adContainer = document.createElement('div');
  adContainer.id = 'myFloatingAd';
  adContainer.className = 'ad-floating';

  // Botão fechar
  const closeBtn = document.createElement('button');
  closeBtn.id = 'closeAdBtn';
  closeBtn.className = 'close-btn';
  closeBtn.setAttribute('aria-label', 'Fechar anúncio');
  closeBtn.innerHTML = '&times;';
  adContainer.appendChild(closeBtn);

  // Área do anúncio Google
  const adIns = document.createElement('ins');
  adIns.className = 'adsbygoogle';
  adIns.style.display = 'block';
  adIns.setAttribute('data-ad-client', 'ca-pub-XXXXXXXXXXXXXXXX'); // <-- Substitua pelo seu ID real do Google AdSense
  adIns.setAttribute('data-ad-slot', '1234567890'); // <-- Substitua pelo seu Slot real
  adIns.setAttribute('data-ad-format', 'auto');
  adIns.setAttribute('data-full-width-responsive', 'true');
  adContainer.appendChild(adIns);

  // Insere no body
  document.body.appendChild(adContainer);

  // Carrega o script do Adsense (somente uma vez)
  if (!window.adsbygoogleLoaded) {
    const script = document.createElement('script');
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
    script.async = true;
    document.head.appendChild(script);
    window.adsbygoogleLoaded = true;
  }

  // Inicializa o anúncio
  (adsbygoogle = window.adsbygoogle || []).push({});

  // Evento para fechar anúncio
  closeBtn.addEventListener('click', () => {
    adContainer.style.display = 'none';
    localStorage.setItem('adFloatingClosed', 'true');
  });
});
