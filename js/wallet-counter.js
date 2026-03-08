/**
 * ========================================================================
 * WALLET COUNTER - CONTADOR DE CARTEIRAS ENCONTRADAS
 * ========================================================================
 * Atualiza o contador de carteiras encontradas em tempo real
 */

// 🚀 EVITA DUPLICAÇÃO DA CLASSE
if (typeof window.WalletCounter === 'undefined') {

class WalletCounter {
  constructor() {
    this.count = 0;
    this.init();
  }

  /**
   * Inicializa o contador
   */
  init() {
    // Carrega contador do localStorage
    const savedCount = localStorage.getItem('wallet_counter_count');
    this.count = savedCount ? parseInt(savedCount, 10) : 0;
    
    // Inicializa contador global
    window.vezesAjudadas = this.count;
    
    // API pública
    window.WalletCounter = {
      increment: () => this.increment(),
      getCount: () => this.getCount(),
      reset: () => this.reset(),
      updateModal: () => this.updateModal()
    };
    
    // Sincroniza com modal existente
    setTimeout(() => this.updateModal(), 100);
    
    console.log('💰 Wallet Counter inicializado');
  }

  /**
   * Incrementa o contador
   */
  increment() {
    this.count++;
    window.vezesAjudadas = this.count;
    
    // Salva no localStorage
    localStorage.setItem('wallet_counter_count', this.count.toString());
    
    this.updateModal();
    
    // Mostra notificação silenciosa
    this.showNotification();
  }

  /**
   * Obtém o contador atual
   */
  getCount() {
    return this.count;
  }

  /**
   * Reseta o contador
   */
  reset() {
    this.count = 0;
    window.vezesAjudadas = 0;
    
    // Remove do localStorage
    localStorage.removeItem('wallet_counter_count');
    
    this.updateModal();
  }

  /**
   * Atualiza o modal com o contador atual
   */
  updateModal() {
    const ajudasEl = document.getElementById('progress-ajudas');
    if (ajudasEl) {
      ajudasEl.textContent = this.count;
    }
    
    // Atualiza também outros elementos que possam mostrar o contador
    const counterElements = document.querySelectorAll('[data-wallet-count]');
    counterElements.forEach(el => {
      el.textContent = this.count;
    });
  }

  /**
   * Mostra notificação silenciosa
   */
  showNotification() {
    // Cria toast temporário
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #28a745;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-family: 'Segoe UI', sans-serif;
      z-index: 20000;
      animation: slideInRight 0.3s ease;
    `;
    toast.innerHTML = `💰 Carteira encontrada!`;
    
    document.body.appendChild(toast);
    
    // Remove automaticamente
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 2000);
  }

  /**
   * Força sincronização com o modal
   */
  syncWithModal() {
    // Verifica se o modal existe e atualiza
    const modal = document.getElementById('preset-progress-modal');
    if (modal) {
      this.updateModal();
    }
  }
}

// Instância global
window.walletCounter = new WalletCounter();

// Adiciona estilos para animações
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

console.log('💰 Wallet Counter API disponível globalmente');

// 🚀 FECHA O BLOCO CONDICIONAL
}

// Exporta globalmente
window.WalletCounter = WalletCounter;
