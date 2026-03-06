/**
 * ========================================================================
 * BACKGROUND PROCESSOR - MANTÉM PROCESSAMENTO CONTÍNUO
 * ========================================================================
 * Garante que o processamento continue com a mesma intensidade
 * mesmo quando a página entra em segundo plano
 */

class BackgroundProcessor {
  constructor() {
    this.isRunning = false;
    this.isInBackground = false;
    this.processors = new Map();
    this.visibilityHandlers = [];
    this.worker = null;
    this.fallbackInterval = null;
    
    this.init();
  }

  init() {
    // Detecta mudança de visibilidade da página
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    document.addEventListener('pagehide', this.handlePageHide.bind(this));
    document.addEventListener('pageshow', this.handlePageShow.bind(this));
    
    // Detecta foco/perda de foco da janela
    window.addEventListener('blur', this.handleBlur.bind(this));
    window.addEventListener('focus', this.handleFocus.bind(this));
    
    // Inicializa interface visual
    this.initVisualInterface();
    
    console.log('🔄 Background Processor inicializado');
  }

  /**
   * Inicializa a interface visual de indicadores
   */
  initVisualInterface() {
    this.indicator = document.getElementById('background-indicator');
    this.statusText = document.getElementById('background-text');
    this.statusBadge = document.getElementById('background-status-badge');
    this.statusBadgeText = document.getElementById('background-status-text');
    this.legend = document.getElementById('background-legend');
    
    // 🚀 ADICIONA EVENTO DE HOVER PARA MOSTRAR LEGENDA
    if (this.indicator) {
      this.indicator.addEventListener('mouseenter', () => this.showLegend());
      this.indicator.addEventListener('mouseleave', () => this.hideLegend());
      this.indicator.addEventListener('click', () => this.toggleLegend());
    }
    
    // Atualiza estado inicial
    this.updateVisualInterface();
  }

  /**
   * Atualiza a interface visual baseada no estado atual
   */
  updateVisualInterface() {
    if (!this.indicator || !this.statusBadge) return;
    
    const isProcessing = this.isRunning || this.hasActiveProcessors();
    
    // Atualiza indicador principal
    if (isProcessing) {
      this.indicator.className = 'background-indicator visible processing';
      this.statusText.textContent = this.isInBackground ? '⚡ Background' : '🔄 Processando';
    } else {
      this.indicator.className = 'background-indicator visible stopped';
      this.statusText.textContent = '⏸️ Parado';
    }
    
    // Atualiza badge de status
    this.statusBadge.className = `background-status-badge visible ${this.isInBackground ? 'in-background' : 'in-foreground'}`;
    this.statusBadgeText.textContent = this.isInBackground ? '📱 Background' : '🖥️ Foreground';
    
    // Log detalhado
    if (this.isInBackground && isProcessing) {
      console.log('⚡ Processamento contínuo em background detectado');
    }
  }

  /**
   * Verifica se há processadores ativos
   */
  hasActiveProcessors() {
    let hasActive = false;
    this.processors.forEach((processor, name) => {
      if (processor.isRunning && processor.isRunning()) {
        // DEBUG MODE - DESABILITADO PARA ECONOMIZAR MEMÓRIA
        const DEBUG_MODE = false;
      }
    });
    return hasActive;
  }

  /**
   * Detecta quando a página entra/sai do background
   */
  handleVisibilityChange() {
    const wasInBackground = this.isInBackground;
    this.isInBackground = document.hidden;
    
    if (wasInBackground !== this.isInBackground) {
      console.log(`📱 Página ${this.isInBackground ? 'ENTROU' : 'SAIU'} do background`);
      
      // Atualiza interface visual
      this.updateVisualInterface();
      
      // Notifica todos os processadores sobre mudança
      this.notifyProcessors('visibilityChange', {
        isInBackground: this.isInBackground,
        timestamp: Date.now()
      });
      
      // Ajusta estratégia de processamento
      this.adjustProcessingStrategy();
    }
  }

  /**
   * Trata quando a página está prestes a ser ocultada
   */
  handlePageHide() {
    console.log('🔄 Página prestes a ser ocultada - mantendo processamento');
    this.isInBackground = true;
    this.updateVisualInterface();
    this.adjustProcessingStrategy();
  }

  /**
   * Trata quando a página volta a ser mostrada
   */
  handlePageShow() {
    console.log('🔄 Página voltou a ser mostrada');
    this.isInBackground = false;
    this.updateVisualInterface();
    this.adjustProcessingStrategy();
  }

  /**
   * Trata perda de foco da janela
   */
  handleBlur() {
    if (!this.isInBackground) {
      console.log('🔄 Janela perdeu foco - mantendo processamento');
      this.isInBackground = true;
      this.updateVisualInterface();
      this.adjustProcessingStrategy();
    }
  }

  /**
   * Trata quando a janela ganha foco
   */
  handleFocus() {
    if (this.isInBackground) {
      console.log('🔄 Janela ganhou foco - retomando processamento normal');
      this.isInBackground = false;
      this.updateVisualInterface();
      this.adjustProcessingStrategy();
    }
  }

  /**
   * Ajusta a estratégia de processamento baseado no estado da página
   */
  adjustProcessingStrategy() {
    if (this.isInBackground) {
      // Em background: usa estratégia mais agressiva
      this.enableAggressiveProcessing();
    } else {
      // Em foreground: usa estratégia normal
      this.enableNormalProcessing();
    }
  }

  /**
   * Habilita processamento agressivo para background
   */
  enableAggressiveProcessing() {
    console.log('⚡ Ativando processamento agressivo (background)');
    
    // Notifica todos os processadores para usar modo agressivo
    this.notifyProcessors('enableAggressiveMode', {
      reason: 'background',
      timestamp: Date.now()
    });
  }

  /**
   * Habilita processamento normal para foreground
   */
  enableNormalProcessing() {
    console.log('🔄 Ativando processamento normal (foreground)');
    
    // Notifica todos os processadores para usar modo normal
    this.notifyProcessors('enableNormalMode', {
      reason: 'foreground',
      timestamp: Date.now()
    });
  }

  /**
   * Registra um processador que será notificado sobre mudanças de background
   */
  registerProcessor(name, processor) {
    this.processors.set(name, processor);
    
    // Notifica o processador sobre o estado atual
    if (processor.onVisibilityChange) {
      processor.onVisibilityChange({
        isInBackground: this.isInBackground,
        timestamp: Date.now()
      });
    }
    
    // Atualiza interface visual
    this.updateVisualInterface();
    
    console.log(`📝 Processador '${name}' registrado`);
  }

  /**
   * Remove um processador
   */
  unregisterProcessor(name) {
    this.processors.delete(name);
    
    // Atualiza interface visual
    this.updateVisualInterface();
    
    console.log(`🗑️ Processador '${name}' removido`);
  }

  /**
   * Notifica todos os processores sobre um evento
   */
  notifyProcessors(event, data) {
    this.processors.forEach((processor, name) => {
      try {
        if (processor[event]) {
          processor[event](data);
        }
      } catch (error) {
          console.error(`❌ Erro ao notificar processador '${name}':`, error);
        }
    });
  }

  /**
   * Obtém o estado atual do background
   */
  getBackgroundState() {
    return {
      isInBackground: this.isInBackground,
      isRunning: this.isRunning,
      processorCount: this.processors.size,
      timestamp: Date.now()
    };
  }

  /**
   * Força o processamento a continuar mesmo em background
   */
  forceContinueProcessing() {
    console.log('🚀 Forçando continuidade do processamento');
    this.isInBackground = false;
    this.enableNormalProcessing();
  }

  /**
   * Inicia o monitoramento de performance
   */
  startPerformanceMonitoring() {
    // Monitora performance do processamento
    setInterval(() => {
      const state = this.getBackgroundState();
      
      // Se estiver em background por muito tempo, força otimização
      if (state.isInBackground && Date.now() - state.timestamp > 30000) {
        console.log('⚠️ Detectado longo período em background - otimizando');
        this.optimizeForLongBackground();
      }
    }, 10000); // Verifica a cada 10 segundos
  }

  /**
   * Otimiza para longos períodos em background
   */
  optimizeForLongBackground() {
    // Reduz garbage collection se possível
    if (window.gc) {
      window.gc();
    }
    
    // Notifica processadores para otimizar
    this.notifyProcessors('optimizeForLongBackground', {
      duration: Date.now() - this.getBackgroundState().timestamp
    });
  }

  /**
   * Para o monitoramento
   */
  stop() {
    this.isRunning = false;
    this.processors.clear();
    console.log('🛑 Background Processor parado');
  }

  // 🚀 MÉTODOS PARA CONTROLE DA LEGENDA
  showLegend() {
    if (this.legend) {
      this.legend.style.opacity = '1';
      this.legend.style.transform = 'translateX(0)';
      this.legend.style.pointerEvents = 'auto';
    }
  }

  hideLegend() {
    if (this.legend) {
      this.legend.style.opacity = '0';
      this.legend.style.transform = 'translateX(20px)';
      this.legend.style.pointerEvents = 'none';
    }
  }

  toggleLegend() {
    if (this.legend) {
      const isVisible = this.legend.style.opacity === '1';
      if (isVisible) {
        this.hideLegend();
      } else {
        this.showLegend();
      }
    }
  }
}

// Instância global do Background Processor
window.backgroundProcessor = new BackgroundProcessor();

// Inicia monitoramento de performance
window.backgroundProcessor.startPerformanceMonitoring();

// API pública
window.BackgroundProcessor = {
  register: (name, processor) => window.backgroundProcessor.registerProcessor(name, processor),
  unregister: (name) => window.backgroundProcessor.unregisterProcessor(name),
  getState: () => window.backgroundProcessor.getBackgroundState(),
  forceContinue: () => window.backgroundProcessor.forceContinueProcessing(),
  isInBackground: () => window.backgroundProcessor.isInBackground
};

console.log('🔄 Background Processor API disponível globalmente');
