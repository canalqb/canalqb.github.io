// Script para controle do botão fechar do anúncio flutuante
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('closeAdBtn');
  const floatingAd = document.getElementById('myFloatingAd');

  if (closeBtn && floatingAd) {
    closeBtn.addEventListener('click', () => {
      floatingAd.style.display = 'none';
    });
  }
});
