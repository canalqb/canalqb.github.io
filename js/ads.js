<!-- ============================================ -->
<!-- ARQUIVO: js/ads.js -->
<!-- ============================================ -->
/*
document.addEventListener('DOMContentLoaded', () => {
  // Inicializa anúncios estáticos (topo e in-feed)
  initStaticAds();
  
  // Inicializa anúncio flutuante
  initFloatingAd();
});

// Inicializa anúncios estáticos do Google AdSense
function initStaticAds() {
  try {
    // Inicializa os anúncios do topo e in-feed
    (adsbygoogle = window.adsbygoogle || []).push({});
    (adsbygoogle = window.adsbygoogle || []).push({});
    
    console.log('✅ Anúncios estáticos inicializados');
  } catch (error) {
    console.error('❌ Erro ao inicializar anúncios estáticos:', error);
  }
}

// Gerencia o anúncio flutuante
function initFloatingAd() {
  const floatingAd = document.getElementById('floatingAd');
  const closeBtn = document.getElementById('closeFloatingAd');
  
  if (!floatingAd || !closeBtn) {
    console.warn('⚠️ Elementos do anúncio flutuante não encontrados');
    return;
  }

  // Variável para controlar se o anúncio foi fechado
  let adClosed = false;

  // Mostra o anúncio flutuante após 5 segundos
  setTimeout(() => {
    if (!adClosed) {
      floatingAd.style.display = 'block';
      
      try {
        // Inicializa o anúncio flutuante
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log('✅ Anúncio flutuante exibido');
      } catch (error) {
        console.error('❌ Erro ao inicializar anúncio flutuante:', error);
      }
    }
  }, 5000);

  // Evento para fechar o anúncio
  closeBtn.addEventListener('click', () => {
    floatingAd.style.display = 'none';
    adClosed = true;
    console.log('🚫 Anúncio flutuante fechado pelo usuário');
  });

  // Opcional: Fecha automaticamente após 30 segundos se não for fechado
  setTimeout(() => {
    if (!adClosed) {
      floatingAd.style.display = 'none';
      console.log('⏱️ Anúncio flutuante fechado automaticamente');
    }
  }, 30000);
}

// Função auxiliar para recarregar anúncios (útil para SPAs)
function reloadAds() {
  try {
    (adsbygoogle = window.adsbygoogle || []).push({});
    console.log('🔄 Anúncios recarregados');
  } catch (error) {
    console.error('❌ Erro ao recarregar anúncios:', error);
  }
}

// Exporta funções para uso global se necessário
window.reloadAds = reloadAds;
*/
<!-- ============================================ -->
