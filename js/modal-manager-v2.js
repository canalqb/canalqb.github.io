/**
 * Modal Manager - Sistema Anti-Sobreposição
 * Gerencia múltiplos modais evitando que um oculte o outro
 */
(function() {
  'use strict';

  // Sistema de camadas para modais
  const modalLayers = {
    10001: [], // Camada 1
    10002: [], // Camada 2
    10003: [], // Camada 3
    10004: [], // Camada 4
    10005: []  // Camada 5
  };

  // Mapeamento de modais para suas camadas
  const modalToLayer = {
    'puzzlesListModal': 10001,
    'eggs-modal': 10002,
    'found-wallets-modal': 10003,
    'preset-progress-modal': 10004,
    'gdpr-consent-banner': 10005
  };

  // Posicionamentos para evitar sobreposição
  const positionOffsets = {
    'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    'top-right': { top: '20px', right: '20px', transform: 'none' },
    'top-left': { top: '20px', left: '20px', transform: 'none' },
    'bottom-right': { bottom: '20px', right: '20px', transform: 'none' },
    'bottom-left': { bottom: '20px', left: '20px', transform: 'none' },
    'center-right': { top: '50%', right: '20px', transform: 'translateY(-50%)' },
    'center-left': { top: '50%', left: '20px', transform: 'translateY(-50%)' }
  };

  /**
   * Obtém a posição preferida para um modal
   */
  function getModalPosition(modalId) {
    const positions = {
      'puzzlesListModal': 'center-right',
      'eggs-modal': 'center',
      'found-wallets-modal': 'center',
      'preset-progress-modal': 'bottom-right',
      'gdpr-consent-banner': 'bottom-center'
    };
    return positions[modalId] || 'center';
  }

  /**
   * Verifica se há conflito de posição
   */
  function hasPositionConflict(modalId, position) {
    const layer = modalToLayer[modalId];
    if (!layer) return false;

    return modalLayers[layer].some(existingModal => {
      const existingPos = getModalPosition(existingModal);
      return existingPos === position;
    });
  }

  /**
   * Obtém uma posição não conflitante
   */
  function getAvailablePosition(modalId) {
    const preferredPos = getModalPosition(modalId);
    
    if (!hasPositionConflict(modalId, preferredPos)) {
      return preferredPos;
    }

    // Tenta outras posições
    const alternativePositions = [
      'top-right', 'top-left', 'bottom-right', 'bottom-left',
      'center-right', 'center-left', 'center'
    ];

    for (const pos of alternativePositions) {
      if (!hasPositionConflict(modalId, pos)) {
        return pos;
      }
    }

    // Se todas estiverem ocupadas, usa a preferida com offset
    return preferredPos;
  }

  /**
   * Aplica posicionamento ao modal
   */
  function applyModalPosition(modal, position) {
    const offset = positionOffsets[position];
    if (!offset) return;

    // Remove posicionamentos anteriores
    modal.style.removeProperty('top');
    modal.style.removeProperty('bottom');
    modal.style.removeProperty('left');
    modal.style.removeProperty('right');
    modal.style.removeProperty('transform');

    // Aplica novo posicionamento
    Object.entries(offset).forEach(([prop, value]) => {
      modal.style[prop] = value;
    });

    // Adiciona offset adicional se houver conflito
    const modalId = modal.id;
    const layer = modalToLayer[modalId];
    if (layer && modalLayers[layer].length > 1) {
      const index = modalLayers[layer].indexOf(modalId);
      if (index > 0) {
        // Adiciona offset baseado no índice
        if (position.includes('right')) {
          const currentRight = parseInt(modal.style.right) || 20;
          modal.style.right = (currentRight + (index * 40)) + 'px';
        } else if (position.includes('left')) {
          const currentLeft = parseInt(modal.style.left) || 20;
          modal.style.left = (currentLeft + (index * 40)) + 'px';
        } else if (position.includes('top')) {
          const currentTop = parseInt(modal.style.top) || 20;
          modal.style.top = (currentTop + (index * 40)) + 'px';
        } else if (position.includes('bottom')) {
          const currentBottom = parseInt(modal.style.bottom) || 20;
          modal.style.bottom = (currentBottom + (index * 40)) + 'px';
        }
      }
    }
  }

  /**
   * Adiciona header e botão X se não existir
   */
  function ensureModalStructure(modal) {
    if (!modal) return;

    // Verifica se já tem header
    let header = modal.querySelector('.modal-header');
    if (!header) {
      header = document.createElement('div');
      header.className = 'modal-header';
      
      // Título
      const title = document.createElement('h2');
      title.textContent = modal.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      header.appendChild(title);
      
      // Botão de fechar
      const closeBtn = document.createElement('button');
      closeBtn.className = 'modal-close-btn';
      closeBtn.innerHTML = '×';
      closeBtn.setAttribute('aria-label', 'Fechar modal');
      closeBtn.onclick = () => hideModal(modal.id);
      header.appendChild(closeBtn);
      
      // Insere no início do modal
      modal.insertBefore(header, modal.firstChild);
    }

    // Verifica se tem body
    let body = modal.querySelector('.modal-body');
    if (!body) {
      body = document.createElement('div');
      body.className = 'modal-body';
      
      // Move conteúdo existente para o body
      while (modal.children.length > 1) {
        if (modal.children[1] !== header) {
          body.appendChild(modal.children[1]);
        } else {
          modal.removeChild(modal.children[1]);
        }
      }
      
      modal.appendChild(body);
    }
  }

  /**
   * Mostra um modal
   */
  function showModal(modalId, options = {}) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`⚠️ Modal não encontrado: ${modalId}`);
      return false;
    }

    // Garante estrutura correta
    ensureModalStructure(modal);

    // Adiciona à camada apropriada
    const layer = modalToLayer[modalId];
    if (layer && !modalLayers[layer].includes(modalId)) {
      modalLayers[layer].push(modalId);
    }

    // Aplica posicionamento
    const position = options.position || getAvailablePosition(modalId);
    applyModalPosition(modal, position);

    // Mostra o modal
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');

    // Adiciona backdrop se necessário
    if (options.backdrop !== false) {
      showBackdrop(modalId);
    }

    console.log(`👁️ Modal mostrado: ${modalId} (posição: ${position})`);
    return true;
  }

  /**
   * Esconde um modal
   */
  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.warn(`⚠️ Modal não encontrado: ${modalId}`);
      return false;
    }

    // Remove da camada
    const layer = modalToLayer[modalId];
    if (layer) {
      const index = modalLayers[layer].indexOf(modalId);
      if (index > -1) {
        modalLayers[layer].splice(index, 1);
      }
    }

    // Esconde o modal
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');

    // Remove backdrop
    hideBackdrop(modalId);

    console.log(`🙈 Modal escondido: ${modalId}`);
    return true;
  }

  /**
   * Mostra backdrop
   */
  function showBackdrop(modalId) {
    let backdrop = document.getElementById(`${modalId}-backdrop`);
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = `${modalId}-backdrop`;
      backdrop.className = 'modal-backdrop';
      backdrop.onclick = () => hideModal(modalId);
      document.body.appendChild(backdrop);
    }
    backdrop.style.display = 'block';
  }

  /**
   * Esconde backdrop
   */
  function hideBackdrop(modalId) {
    const backdrop = document.getElementById(`${modalId}-backdrop`);
    if (backdrop) {
      backdrop.style.display = 'none';
    }
  }

  /**
   * Esconde todos os modais
   */
  function hideAllModals() {
    Object.keys(modalToLayer).forEach(modalId => {
      hideModal(modalId);
    });
    console.log('🌑 Todos os modais escondidos');
  }

  /**
   * Reorganiza modais na mesma camada
   */
  function reorganizeModals() {
    Object.keys(modalLayers).forEach(layer => {
      modalLayers[layer].forEach((modalId, index) => {
        const modal = document.getElementById(modalId);
        if (modal && modal.style.display !== 'none') {
          const position = getModalPosition(modalId);
          applyModalPosition(modal, position);
        }
      });
    });
  }

  /**
   * Inicializa o gerenciador
   */
  function init() {
    // Adiciona listeners para ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Esconde o modal mais recente
        let latestModal = null;
        let latestLayer = 0;
        
        Object.keys(modalLayers).forEach(layer => {
          modalLayers[layer].forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && modal.style.display !== 'none' && parseInt(layer) > latestLayer) {
              latestModal = modalId;
              latestLayer = parseInt(layer);
            }
          });
        });
        
        if (latestModal) {
          hideModal(latestModal);
        }
      }
    });

    // Reorganiza quando a janela é redimensionada
    window.addEventListener('resize', () => {
      setTimeout(reorganizeModals, 100);
    });

    console.log('🎭 Modal Manager Anti-Sobreposição inicializado');
  }

  // API pública
  window.ModalManager = {
    showModal,
    hideModal,
    hideAllModals,
    reorganizeModals,
    getActiveModals: () => {
      const active = [];
      Object.keys(modalLayers).forEach(layer => {
        modalLayers[layer].forEach(modalId => {
          const modal = document.getElementById(modalId);
          if (modal && modal.style.display !== 'none') {
            active.push(modalId);
          }
        });
      });
      return active;
    },
    getModalInfo: () => {
      const info = { total: 0, active: 0, layers: {} };
      Object.keys(modalLayers).forEach(layer => {
        info.layers[layer] = modalLayers[layer].length;
        info.total += modalLayers[layer].length;
        modalLayers[layer].forEach(modalId => {
          const modal = document.getElementById(modalId);
          if (modal && modal.style.display !== 'none') {
            info.active++;
          }
        });
      });
      return info;
    }
  };

  // Inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
