// =====================================================
// BACKGROUND EXECUTION MANAGER V2 - EXECUÇÃO CONTÍNUA
// =====================================================
// Garante que a sequência NUNCA pare, mesmo em segundo plano

class BackgroundExecutionManagerV2 {
    constructor() {
        this.worker = null;
        this.isWorkerSupported = typeof Worker !== 'undefined';
        this.isRunning = false;
        this.currentSpeed = 100;
        this.fallbackInterval = null;
        this.workerActive = false;
        this.lastActivity = Date.now();
        
        this.init();
    }
    
    init() {
        console.log('🚀 Background Execution Manager V2 inicializado');
        
        // Tenta criar worker
        if (this.isWorkerSupported) {
            this.createWorker();
        }
        
        // Configura handlers de visibilidade
        this.setupVisibilityHandlers();
        
        // Inicia monitoramento contínuo
        this.startContinuousMonitoring();
        
        // Força execução contínua com fallback
        this.setupContinuousExecution();
    }
    
    createWorker() {
        try {
            this.worker = new Worker('js/background-worker.js');
            this.worker.onmessage = (e) => this.handleWorkerMessage(e);
            this.worker.onerror = (e) => this.handleWorkerError(e);
            this.workerActive = true;
            console.log('✅ Worker criado com sucesso');
        } catch (error) {
            console.warn('⚠️ Erro ao criar worker:', error);
            this.workerActive = false;
        }
    }
    
    setupVisibilityHandlers() {
        // Handler para mudança de visibilidade
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('🔄 Página em segundo plano - Forçando execução');
                this.forceBackgroundExecution();
            } else {
                console.log('🔄 Página em primeiro plano - Verificando status');
                this.checkAndRestoreExecution();
            }
        });
        
        // Handler para blur/foco da janela
        window.addEventListener('blur', () => {
            if (this.isRunning) {
                console.log('🔄 Janela perdeu foco - Mantendo execução');
                this.ensureContinuousExecution();
            }
        });
        
        window.addEventListener('focus', () => {
            console.log('🔄 Janela ganhou foco - Verificando execução');
            this.checkAndRestoreExecution();
        });
        
        // Handler para pagehide (quando usuário sai)
        window.addEventListener('pagehide', () => {
            if (this.isRunning) {
                this.saveExecutionState();
                this.forceBackgroundExecution();
            }
        });
    }
    
    startContinuousMonitoring() {
        // Monitoramento a cada 2 segundos
        setInterval(() => {
            if (this.isRunning) {
                this.checkExecutionHealth();
            }
        }, 2000);
    }
    
    setupContinuousExecution() {
        // Força execução contínua usando múltiplas estratégias
        setInterval(() => {
            if (this.isRunning) {
                this.ensureExecution();
            }
        }, 1000);
    }
    
    start(speed = 100) {
        this.currentSpeed = speed;
        this.isRunning = true;
        
        console.log('🚀 Iniciando execução contínua em background');
        
        // Inicia worker se disponível
        if (this.worker && this.workerActive) {
            this.worker.postMessage({ 
                type: 'START', 
                data: { speed } 
            });
        }
        
        // Inicia fallback garantido
        this.startFallbackExecution(speed);
        
        // Força execução imediata
        this.forceBackgroundExecution();
    }
    
    stop() {
        this.isRunning = false;
        
        if (this.worker) {
            this.worker.postMessage({ type: 'STOP' });
        }
        
        if (this.fallbackInterval) {
            clearInterval(this.fallbackInterval);
            this.fallbackInterval = null;
        }
        
        console.log('⏹️ Execução contínua parada');
    }
    
    startFallbackExecution(speed) {
        // Fallback garantido que sempre funciona
        if (this.fallbackInterval) {
            clearInterval(this.fallbackInterval);
        }
        
        this.fallbackInterval = setInterval(() => {
            if (this.isRunning) {
                this.executeFallbackCycle();
            }
        }, speed);
    }
    
    executeFallbackCycle() {
        // Executa ciclo diretamente no thread principal
        // 🚚 FIX: window.auto16.running é uma função, precisa ser chamada como running()
        if (window.auto16 && typeof window.auto16.running === 'function' && window.auto16.running()) {
            try {
                // Executa múltiplos ciclos para manter velocidade
                for (let i = 0; i < 10; i++) {
                    if (window.auto16.executeCycle) {
                        window.auto16.executeCycle();
                    }
                }
                
                // Atualiza displays se página visível
                if (!document.hidden && window.auto16.updateDisplay) {
                    window.auto16.updateDisplay();
                }
                
                this.lastActivity = Date.now();
                
            } catch (error) {
                console.error('❌ Erro no fallback execution:', error);
            }
        }
    }
    
    forceBackgroundExecution() {
        if (!this.isRunning) return;
        
        console.log('⚡ Forçando execução em background');
        
        // Força worker se disponível
        if (this.worker && this.workerActive) {
            try {
                this.worker.postMessage({ type: 'START', data: { speed: this.currentSpeed } });
            } catch (error) {
                console.warn('⚠️ Worker não responde, usando fallback');
                this.workerActive = false;
            }
        }
        
        // Garante fallback ativo
        if (!this.fallbackInterval) {
            this.startFallbackExecution(this.currentSpeed);
        }
        
        // Execução imediata
        setTimeout(() => this.executeFallbackCycle(), 100);
    }
    
    ensureContinuousExecution() {
        if (!this.isRunning) return;
        
        // Verifica se há atividade recente
        const timeSinceLastActivity = Date.now() - this.lastActivity;
        
        if (timeSinceLastActivity > 5000) { // 5 segundos sem atividade
            console.warn('⚠️ Detectada inatividade - Forçando retomada');
            this.forceBackgroundExecution();
        }
        
        // Garante que worker está ativo
        if (this.worker && !this.workerActive) {
            this.createWorker();
            if (this.workerActive && this.isRunning) {
                this.worker.postMessage({ type: 'START', data: { speed: this.currentSpeed } });
            }
        }
    }
    
    checkExecutionHealth() {
        if (!this.isRunning) return;
        
        const now = Date.now();
        const timeSinceLastActivity = now - this.lastActivity;
        
        // Se não há atividade há mais de 3 segundos, força execução
        if (timeSinceLastActivity > 3000) {
            console.warn('⚠️ Execução parou - Forçando continuidade');
            this.forceBackgroundExecution();
        }
        
        // Verifica saúde do worker
        if (this.worker && this.workerActive) {
            try {
                this.worker.postMessage({ type: 'PING' });
            } catch (error) {
                console.warn('⚠️ Worker erro - Desativando');
                this.workerActive = false;
                this.startFallbackExecution(this.currentSpeed);
            }
        }
    }
    
    checkAndRestoreExecution() {
        if (!this.isRunning) return;
        
        // 🚚 FIX: Não auto-iniciar o gerador. Apenas garantir que o worker/fallback
        // continua rodando se o usuário JA tinha iniciado.
        // window.auto16.start() só deve ser chamado pelo usuário via botão Play.
        
        // Garante worker ativo
        if (!this.workerActive && this.isWorkerSupported) {
            this.createWorker();
        }
        
        // Verifica fallback
        if (!this.fallbackInterval) {
            this.startFallbackExecution(this.currentSpeed);
        }
    }
    
    ensureExecution() {
        // Garante que sempre há execução ativa
        if (this.isRunning) {
            if (!this.fallbackInterval) {
                this.startFallbackExecution(this.currentSpeed);
            }
            
            if (!document.hidden) {
                // Em primeiro plano, atualiza displays
                if (window.auto16 && window.auto16.updateDisplay) {
                    window.auto16.updateDisplay();
                }
            }
        }
    }
    
    handleWorkerMessage(e) {
        const { type, data } = e.data;
        
        if (type === 'EXECUTE_CYCLE') {
            // Executa ciclo solicitado pelo worker
            this.executeFallbackCycle();
            this.lastActivity = Date.now();
        } else if (type === 'PONG') {
            this.workerActive = true;
            this.lastActivity = Date.now();
        }
    }
    
    handleWorkerError(e) {
        console.error('❌ Erro no worker:', e);
        this.workerActive = false;
        
        // Força fallback imediatamente
        if (this.isRunning && !this.fallbackInterval) {
            this.startFallbackExecution(this.currentSpeed);
        }
    }
    
    saveExecutionState() {
        try {
            const state = {
                isRunning: this.isRunning,
                speed: this.currentSpeed,
                timestamp: Date.now()
            };
            localStorage.setItem('backgroundExecutionStateV2', JSON.stringify(state));
        } catch (error) {
            console.warn('⚠️ Erro ao salvar estado:', error);
        }
    }
    
    destroy() {
        this.stop();
        
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        console.log('🗑️ Background Execution Manager V2 destruído');
    }
}

// Inicializa o gerenciador V2
window.BackgroundExecutionManager = new BackgroundExecutionManagerV2();

// Ao carregar a página, LIMPA o estado salvo para evitar auto-start indesejado.
// O usuário deve pressionar Play manualmente a cada sessão.
window.addEventListener('load', () => {
    try {
        localStorage.removeItem('backgroundExecutionStateV2');
        console.log('✅ Estado de background limpo. Aguardando ação do usuário.');
    } catch (error) {
        console.warn('⚠️ Erro ao limpar estado:', error);
    }
});
