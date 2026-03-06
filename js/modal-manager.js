/**
 * ========================================================================
 * MODAL MANAGER - GERENCIAMENTO CENTRALIZADO DE MODAIS
 * ========================================================================
 * Evita sobreposição de modais e gerencia z-index automaticamente
 */

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModals = new Set();
    this.baseZIndex = 10000;
    this.currentZIndex = this.baseZIndex;
    this.init();
  }

  /**
   * Inicializa o gerenciador
   */
  init() {
    console.log('🎭 Modal Manager inicializado');
    
    // Intercepta criação de modais
    this.interceptModalCreation();
    
    // API pública
    window.ModalManager = {
      showModal: (id, options = {}) => this.showModal(id, options),
      hideModal: (id) => this.hideModal(id),
      hideAllModals: () => this.hideAllModals(),
      getActiveModals: () => Array.from(this.activeModals),
      registerModal: (id, element) => this.registerModal(id, element)
    };
  }

  /**
   * Intercepta criação de modais para gerenciar automaticamente
   */
  interceptModalCreation() {
    // Observa mudanças no DOM para novos modais
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Verifica se é um modal
            if (node.id && node.id.includes('modal')) {
              this.registerModal(node.id, node);
            }
            
            // Verifica filhos que possam ser modais
            const modals = node.querySelectorAll && node.querySelectorAll('[id*="modal"]');
            if (modals) {
              modals.forEach(modal => {
                this.registerModal(modal.id, modal);
              });
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Registra um modal no gerenciador
   */
  registerModal(id, element) {
    if (!id || !element) return;
    
    this.modals.set(id, {
      element,
      zIndex: this.baseZIndex,
      isVisible: false,
      createdAt: Date.now()
    });

    // Adiciona eventos para gerenciar visibilidade
    this.addModalEvents(id);
    
    console.log(`📝 Modal registrado: ${id}`);
  }

  /**
   * Adiciona eventos ao modal
   */
  addModalEvents(id) {
    const modal = this.modals.get(id);
    if (!modal) return;

    const element = modal.element;
    
    // Observer para mudanças de visibilidade
    const visibilityObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const isVisible = element.style.display !== 'none';
          if (isVisible !== modal.isVisible) {
            modal.isVisible = isVisible;
            if (isVisible) {
              this.onModalShown(id);
            } else {
              this.onModalHidden(id);
            }
          }
        }
      });
    });

    visibilityObserver.observe(element, {
      attributes: true,
      attributeFilter: ['style']
    });
  }

  /**
   * Chamado quando um modal é mostrado
   */
  onModalShown(id) {
    if (!this.activeModals.has(id)) {
      this.activeModals.add(id);
      this.updateZIndexes();
      console.log(`👁️ Modal mostrado: ${id} (ativos: ${this.activeModals.size})`);
    }
  }

  /**
   * Chamado quando um modal é escondido
   */
  onModalHidden(id) {
    if (this.activeModals.has(id)) {
      this.activeModals.delete(id);
      this.updateZIndexes();
      console.log(`🙈 Modal escondido: ${id} (ativos: ${this.activeModals.size})`);
    }
  }

  /**
   * Atualiza z-index dos modais ativos
   */
  updateZIndexes() {
    let zIndex = this.baseZIndex;
    
    this.activeModals.forEach(id => {
      const modal = this.modals.get(id);
      if (modal) {
        modal.element.style.zIndex = zIndex;
        modal.zIndex = zIndex;
        zIndex += 10;
      }
    });
  }

  /**
   * Mostra um modal específico
   */
  showModal(id, options = {}) {
    const modal = this.modals.get(id);
    if (!modal) {
      console.warn(`⚠️ Modal não encontrado: ${id}`);
      return false;
    }

    // Esconde outros modais se necessário
    if (options.hideOthers) {
      this.hideAllModals();
    }

    // Posiciona o modal
    if (options.position) {
      this.positionModal(id, options.position);
    }

    // Mostra o modal
    modal.element.style.display = 'block';
    modal.element.style.visibility = 'visible';
    
    // Adiciona classe de animação se especificado
    if (options.animation) {
      modal.element.classList.add(options.animation);
    }

    return true;
  }

  /**
   * Esconde um modal específico
   */
  hideModal(id) {
    const modal = this.modals.get(id);
    if (!modal) {
      console.warn(`⚠️ Modal não encontrado: ${id}`);
      return false;
    }

    modal.element.style.display = 'none';
    modal.element.style.visibility = 'hidden';
    
    return true;
  }

  /**
   * Esconde todos os modais
   */
  hideAllModals() {
    this.activeModals.forEach(id => {
      this.hideModal(id);
    });
    console.log('🌑 Todos os modais escondidos');
  }

  /**
   * Posiciona um modal
   */
  positionModal(id, position) {
    const modal = this.modals.get(id);
    if (!modal) return;

    const element = modal.element;
    
    switch (position) {
      case 'center':
        element.style.top = '50%';
        element.style.left = '50%';
        element.style.transform = 'translate(-50%, -50%)';
        break;
        
      case 'bottom-right':
        element.style.bottom = '20px';
        element.style.right = '20px';
        element.style.top = 'auto';
        element.style.left = 'auto';
        element.style.transform = 'none';
        break;
        
      case 'top-right':
        element.style.top = '20px';
        element.style.right = '20px';
        element.style.bottom = 'auto';
        element.style.left = 'auto';
        element.style.transform = 'none';
        break;
        
      default:
        if (typeof position === 'object') {
          Object.assign(element.style, position);
        }
    }
  }

  /**
   * Obtém informações sobre os modais
   */
  getModalInfo() {
    const info = {
      total: this.modals.size,
      active: this.activeModals.size,
      modals: {}
    };

    this.modals.forEach((modal, id) => {
      info.modals[id] = {
        id,
        isVisible: modal.isVisible,
        zIndex: modal.zIndex,
        createdAt: modal.createdAt
      };
    });

    return info;
  }

  /**
   * Verifica conflitos de IDs
   */
  checkForConflicts() {
    const conflicts = [];
    const seenIds = new Set();

    this.modals.forEach((modal, id) => {
      if (seenIds.has(id)) {
        conflicts.push(id);
      } else {
        seenIds.add(id);
      }
    });

    if (conflicts.length > 0) {
      console.warn('⚠️ Conflitos de IDs detectados:', conflicts);
    }

    return conflicts;
  }

  /**
   * Corrige conflitos de IDs automaticamente
   */
  fixConflicts() {
    const conflicts = this.checkForConflicts();
    const idCounts = new Map();

    this.modals.forEach((modal, id) => {
      const count = idCounts.get(id) || 0;
      idCounts.set(id, count + 1);
      
      if (count > 0) {
        // Renomeia o modal conflitante
        const newId = `${id}-conflict-${count}`;
        modal.element.id = newId;
        
        // Re-registra com novo ID
        this.modals.delete(id);
        this.modals.set(newId, modal);
        
        console.log(`🔧 Conflito resolvido: ${id} → ${newId}`);
      }
    });
  }

  /**
   * Cria um toast que não conflita com modais
   */
  showToast(message, type = 'info', duration = 3000) {
    // Esconde modais temporariamente se necessário
    const hadModals = this.activeModals.size > 0;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Estilos do toast
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : '#007bff'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: ${this.baseZIndex + 1000};
      max-width: 300px;
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remove automaticamente
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
}

// Instância global
window.modalManager = new ModalManager();

console.log('🎭 Modal Manager API disponível globalmente');
