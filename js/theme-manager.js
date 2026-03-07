/**
 * ========================================================================
 * THEME MANAGER - CONTROLE DE TEMAS CLARO/ESCURO
 * ========================================================================
 * Implementa alternância entre temas claro e escuro conforme master_rules.md
 */

class ThemeManager {
  constructor() {
    this.storageKey = 'canalqb-theme';
    this.themeToggle = document.getElementById('theme-toggle');
    this.themeIcon = document.getElementById('theme-icon');
    this.html = document.documentElement;
    
    this.init();
  }

  /**
   * Inicializa o gerenciador de temas
   */
  init() {
    // Carrega tema salvo ou detecta preferência do sistema
    this.loadTheme();
    
    // Adiciona evento de clique ao botão
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
    }
    
    // Observa mudanças de preferência do sistema
    this.watchSystemTheme();
    
    console.log('🎨 Theme Manager inicializado');
  }

  /**
   * Carrega o tema salvo ou detecta preferência do sistema
   */
  loadTheme() {
    const savedTheme = localStorage.getItem(this.storageKey);
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Prioridade: tema salvo > preferência do sistema > claro (padrão)
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    this.setTheme(theme);
  }

  /**
   * Alterna entre temas claro e escuro
   */
  toggleTheme() {
    const currentTheme = this.html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    this.setTheme(newTheme);
    this.saveTheme(newTheme);
    
    // Feedback visual
    this.showThemeChangeFeedback(newTheme);
  }

  /**
   * Aplica o tema especificado
   */
  setTheme(theme) {
    this.html.setAttribute('data-theme', theme);
    this.updateIcon(theme);
    
    // Dispara evento personalizado
    this.html.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme }
    }));
  }

  /**
   * Salva a preferência de tema
   */
  saveTheme(theme) {
    localStorage.setItem(this.storageKey, theme);
  }

  /**
   * Atualiza o ícone do botão conforme o tema
   */
  updateIcon(theme) {
    if (this.themeIcon) {
      this.themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
      
      // Atualiza title do botão
      const button = this.themeIcon.closest('button');
      if (button) {
        button.title = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
        button.setAttribute('aria-label', button.title);
      }
    }
  }

  /**
   * Observa mudanças na preferência de tema do sistema
   */
  watchSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', (e) => {
      // Só muda se não houver tema salvo (respeita escolha explícita do usuário)
      if (!localStorage.getItem(this.storageKey)) {
        const systemTheme = e.matches ? 'dark' : 'light';
        this.setTheme(systemTheme);
      }
    });
  }

  /**
   * Mostra feedback visual da mudança de tema
   */
  showThemeChangeFeedback(theme) {
    if (window.ModalManager && window.ModalManager.showToast) {
      const message = theme === 'dark' ? '🌙 Tema escuro ativado' : '☀️ Tema claro ativado';
      window.ModalManager.showToast(message, 'success', 2000);
    }
  }

  /**
   * Obtém o tema atual
   */
  getCurrentTheme() {
    return this.html.getAttribute('data-theme') || 'light';
  }

  /**
   * Verifica se o tema escuro está ativo
   */
  isDarkTheme() {
    return this.getCurrentTheme() === 'dark';
  }

  /**
   * Reseta para a preferência do sistema
   */
  resetToSystemTheme() {
    localStorage.removeItem(this.storageKey);
    this.loadTheme();
  }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  window.themeManager = new ThemeManager();
});

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}
