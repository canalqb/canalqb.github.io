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
   * Mostra notificação de sincronização de lote (Ajudas)
   */
  showNotification() {
    // Cria toast temporário
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #3182ce;
      color: white;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      font-family: 'Segoe UI', sans-serif;
      z-index: 20000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.2);
      animation: slideInRight 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    toast.innerHTML = `✨ Lote sincronizado! (+1000)`;
    
    document.body.appendChild(toast);
    
    // Remove automaticamente
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 2500);
  }

  /**
   * Mostra notificação real de carteira encontrada (RECOMPENSA)
   */
  showWalletFoundNotification() {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      padding: 20px 30px;
      border-radius: 15px;
      font-size: 20px;
      font-weight: 800;
      z-index: 30000;
      box-shadow: 0 0 50px rgba(245, 158, 11, 0.5);
      border: 2px solid gold;
      text-align: center;
      animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;
    toast.innerHTML = `💰 🤑 CARTEIRA ALVO ENCONTRADA! 🚀 💎`;
    
    document.body.appendChild(toast);
    
    // Efeito de confete ou som poderia ser adicionado aqui
    setTimeout(() => {
       if (toast.parentNode) toast.remove();
    }, 10000); // Fica 10 seg na tela
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
