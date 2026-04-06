/**
 * Footer Modal Manager - Sistema para carregar páginas do footer em modais
 */
(function() {
  'use strict';

  // Cache para páginas já carregadas
  const pageCache = new Map();

  /**
   * Cria um modal para exibir conteúdo da página
   */
  function createPageModal(pageId, title, content) {
    // Remove modal existente se houver
    const existingModal = document.getElementById(`footer-modal-${pageId}`);
    if (existingModal) {
      existingModal.remove();
    }

    // Cria o modal
    const modal = document.createElement('div');
    modal.id = `footer-modal-${pageId}`;
    modal.className = 'footer-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `footer-modal-title-${pageId}`);
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="modal-header">
        <h2 id="footer-modal-title-${pageId}">
          <i class="fas fa-info-circle"></i>
          <span>${title}</span>
        </h2>
        <button class="modal-close-btn" onclick="FooterModalManager.closeModal('${pageId}')" aria-label="Fechar modal">
          ×
        </button>
      </div>
      <div class="modal-body">
        <div class="page-content">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Adiciona backdrop
    const backdrop = document.createElement('div');
    backdrop.id = `footer-modal-backdrop-${pageId}`;
    backdrop.className = 'modal-backdrop';
    backdrop.onclick = () => FooterModalManager.closeModal(pageId);
    document.body.appendChild(backdrop);

    return modal;
  }

  /**
   * Carrega uma página via fetch
   */
  async function loadPage(pageUrl) {
    if (pageCache.has(pageUrl)) {
      return pageCache.get(pageUrl);
    }

    try {
      const response = await fetch(pageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      
      // Parse do HTML para extrair o conteúdo principal
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Tenta encontrar o conteúdo principal
      let content = '';
      const mainContent = doc.querySelector('main, .main-content, .content, #content, body');
      
      if (mainContent) {
        // Remove elementos desnecessários
        const clone = mainContent.cloneNode(true);
        const unwantedElements = clone.querySelectorAll('script, style, nav, header, footer, .sidebar, .ads');
        unwantedElements.forEach(el => el.remove());
        content = clone.innerHTML;
      } else {
        // Fallback: usa o body inteiro
        const bodyClone = doc.body.cloneNode(true);
        const unwantedElements = bodyClone.querySelectorAll('script, style, nav, header, footer, .sidebar, .ads');
        unwantedElements.forEach(el => el.remove());
        content = bodyClone.innerHTML;
      }

      // Cacheia o conteúdo
      pageCache.set(pageUrl, content);
      return content;

    } catch (error) {
      console.error(`Erro ao carregar página ${pageUrl}:`, error);
      return `
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h3>Erro ao carregar página</h3>
          <p>Não foi possível carregar o conteúdo desta página.</p>
          <p><small>Erro: ${error.message}</small></p>
          <button class="btn btn-primary" onclick="FooterModalManager.closeModal('${pageUrl}')">
            Fechar
          </button>
        </div>
      `;
    }
  }

  /**
   * Mostra um modal com o conteúdo da página
   */
  async function showModal(pageUrl, title) {
    // Extrai o ID da página da URL
    const pageId = pageUrl.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // Mostra loading
    const loadingModal = createPageModal(pageId, title, `
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    `);
    
    // Mostra o modal de loading
    loadingModal.style.display = 'flex';
    loadingModal.setAttribute('aria-hidden', 'false');
    document.getElementById(`footer-modal-backdrop-${pageId}`).style.display = 'block';

    // Carrega o conteúdo
    const content = await loadPage(pageUrl);
    
    // Atualiza o modal com o conteúdo
    const modal = document.getElementById(`footer-modal-${pageId}`);
    if (modal) {
      const contentDiv = modal.querySelector('.page-content');
      if (contentDiv) {
        contentDiv.innerHTML = content;
      }
    }

    console.log(`📄 Modal do footer mostrado: ${title}`);
  }

  /**
   * Fecha um modal
   */
  function closeModal(pageId) {
    const modal = document.getElementById(`footer-modal-${pageId}`);
    const backdrop = document.getElementById(`footer-modal-backdrop-${pageId}`);
    
    if (modal) {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
    
    if (backdrop) {
      backdrop.style.display = 'none';
    }

    console.log(`📄 Modal do footer fechado: ${pageId}`);
  }

  /**
   * Inicializa os links do footer
   */
  function initFooterLinks() {
    const footerLinks = document.querySelectorAll('.footer-nav a.dynamic-link');
    
    footerLinks.forEach(link => {
      // Remove o comportamento padrão
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const href = link.getAttribute('href');
        const title = link.textContent.trim();
        
        if (href) {
          await showModal(href, title);
        }
      });
    });

    console.log('📄 Links do footer inicializados para modais');
  }

  /**
   * Inicializa o gerenciador
   */
  function init() {
    // Inicializa os links quando o DOM estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initFooterLinks);
    } else {
      initFooterLinks();
    }

    // Adiciona listener para ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Fecha todos os modais do footer
        document.querySelectorAll('.footer-modal[aria-hidden="false"]').forEach(modal => {
          const pageId = modal.id.replace('footer-modal-', '');
          closeModal(pageId);
        });
      }
    });

    console.log('📄 Footer Modal Manager inicializado');
  }

  // API pública
  window.FooterModalManager = {
    showModal,
    closeModal,
    loadPage,
    clearCache: () => pageCache.clear(),
    getCacheSize: () => pageCache.size
  };

  // Inicialização
  init();

})();
