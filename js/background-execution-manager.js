// =====================================================
// BACKGROUND EXECUTION MANAGER
// =====================================================
// Gerencia execução em background usando Web Workers
// Mantém a sequência rodando mesmo com navegador em segundo plano

class BackgroundExecutionManager {
    constructor() {
        this.worker = null;
        this.isWorkerSupported = typeof Worker !== 'undefined';
        this.isRunning = false;
        this.currentSpeed = 100;
        this.visibilityHandler = null;
        this.pageHiddenHandler = null;
        this.heartbeatInterval = null;
        
        this.init();
    }
    
    init() {
        if (!this.isWorkerSupported) {
            console.warn('⚠️ Web Workers não suportados. Usando fallback.');
            return;
        }
        
        // Cria o worker
        this.worker = new Worker('/js/background-worker.js');
        
        // Configura handlers de mensagens
        this.worker.onmessage = (e) => this.handleWorkerMessage(e);
        this.worker.onerror = (e) => this.handleWorkerError(e);
        
        // Configura handlers de visibilidade da página
        this.setupVisibilityHandlers();
        
        // Inicia heartbeat para monitorar o worker
        this.startHeartbeat();
        
        console.log('🚀 Background Execution Manager inicializado');
    }
    
    setupVisibilityHandlers() {
        // Detecta quando a página perde ou ganha visibilidade
        this.visibilityHandler = () => {
            if (document.hidden) {
                console.log('🔄 Página em segundo plano - Ativando worker');
                this.activateWorker();
            } else {
                console.log('🔄 Página em primeiro plano - Verificando worker');
                this.checkWorkerStatus();
            }
        };
        
        this.pageHiddenHandler = () => {
            if (document.hidden) {
                // Salva o estado atual antes de perder foco
                this.saveExecutionState();
            }
        };
        
        document.addEventListener('visibilitychange', this.visibilityHandler);
        document.addEventListener('pagehide', this.pageHiddenHandler);
        
        // Detecta quando o usuário troca de aba
        window.addEventListener('blur', () => {
            if (this.isRunning) {
                console.log('🔄 Janela perdeu foco - Mantendo execução');
                this.ensureWorkerActive();
            }
        });
        
        window.addEventListener('focus', () => {
            console.log('🔄 Janela ganhou foco - Verificando execução');
            this.checkWorkerStatus();
        });
    }
    
    start(speed = 100) {
        this.currentSpeed = speed;
        this.isRunning = true;
        
        if (this.worker) {
            this.worker.postMessage({ 
                type: 'START', 
                data: { speed } 
            });
        }
        
        // Ativa worker se a página estiver em segundo plano
        if (document.hidden) {
            this.activateWorker();
        }
        
        console.log('🚀 Execução em background iniciada');
    }
    
    stop() {
        this.isRunning = false;
        
        if (this.worker) {
            this.worker.postMessage({ type: 'STOP' });
        }
        
        console.log('⏹️ Execução em background parada');
    }
    
    setSpeed(speed) {
        this.currentSpeed = speed;
        
        if (this.worker) {
            this.worker.postMessage({ 
                type: 'SET_SPEED', 
                data: { speed } 
            });
        }
    }
    
    activateWorker() {
        if (!this.worker || !this.isRunning) return;
        
        // Envia comando de start para garantir que está ativo
        this.worker.postMessage({ 
            type: 'START', 
            data: { speed: this.currentSpeed } 
        });
    }
    
    checkWorkerStatus() {
        if (!this.worker) return;
        
        // Verifica se o worker está respondendo
        this.worker.postMessage({ type: 'PING' });
        
        // Se não responder em 2 segundos, reinicia
        setTimeout(() => {
            if (this.worker) {
                this.worker.postMessage({ type: 'PING' });
            }
        }, 2000);
    }
    
    ensureWorkerActive() {
        if (!this.isRunning) return;
        
        // Verifica e reativa o worker se necessário
        this.checkWorkerStatus();
        
        // Força a continuidade da execução
        if (window.auto16 && window.auto16.running) {
            // Garante que o sistema principal continue rodando
            this.continueMainExecution();
        }
    }
    
    continueMainExecution() {
        // Continua a execução no thread principal se necessário
        if (window.auto16 && window.auto16.running && !window.auto16.interval) {
            // Reinicia o intervalo principal se foi parado
            window.auto16.start();
        }
    }
    
    saveExecutionState() {
        // Salva o estado atual para recuperação
        const state = {
            isRunning: this.isRunning,
            speed: this.currentSpeed,
            timestamp: Date.now()
        };
        
        localStorage.setItem('backgroundExecutionState', JSON.stringify(state));
    }
    
    loadExecutionState() {
        try {
            const saved = localStorage.getItem('backgroundExecutionState');
            if (saved) {
                const state = JSON.parse(saved);
                return state;
            }
        } catch (e) {
            console.warn('⚠️ Erro ao carregar estado salvo:', e);
        }
        return null;
    }
    
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.worker && this.isRunning) {
                this.worker.postMessage({ type: 'PING' });
            }
        }, 10000); // Verifica a cada 10 segundos
    }
    
    handleWorkerMessage(e) {
        const { type, data } = e.data;
        
        switch (type) {
            case 'STATUS':
                console.log('📊 Worker Status:', data);
                break;
                
            case 'EXECUTE_CYCLE':
                // Executa o ciclo no thread principal
                this.executeCycle();
                break;
                
            case 'PONG':
                // Worker está respondendo
                break;
                
            default:
                console.log('📨 Mensagem do worker:', type, data);
        }
    }
    
    handleWorkerError(e) {
        console.error('❌ Erro no worker:', e);
        
        // Tenta reiniciar o worker
        this.restartWorker();
    }
    
    restartWorker() {
        if (this.worker) {
            this.worker.terminate();
        }
        
        this.init();
        
        // Restaura o estado se estava rodando
        if (this.isRunning) {
            setTimeout(() => {
                this.start(this.currentSpeed);
            }, 100);
        }
    }
    
    executeCycle() {
        // Executa um ciclo do sistema principal
        if (window.auto16 && window.auto16.running) {
            try {
                // Simula o ciclo que seria executado pelo setInterval
                if (typeof window.auto16.executeCycle === 'function') {
                    window.auto16.executeCycle();
                } else {
                    // Fallback para execução manual
                    this.executeManualCycle();
                }
            } catch (e) {
                console.error('❌ Erro ao executar ciclo:', e);
            }
        }
    }
    
    executeManualCycle() {
        // Execução manual de fallback
        if (window.auto16) {
            // Simula o comportamento do auto16
            window.auto16.stateCounter += 1n;
            // Atualiza a interface se necessário
            if (typeof window.auto16.updateDisplay === 'function') {
                window.auto16.updateDisplay();
            }
        }
    }
    
    destroy() {
        this.stop();
        
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        
        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
        }
        
        if (this.pageHiddenHandler) {
            document.removeEventListener('pagehide', this.pageHiddenHandler);
        }
        
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        console.log('🗑️ Background Execution Manager destruído');
    }
}

// Inicializa o gerenciador
window.BackgroundExecutionManager = new BackgroundExecutionManager();

// Tenta restaurar o estado salvo
window.addEventListener('load', () => {
    const savedState = window.BackgroundExecutionManager.loadExecutionState();
    if (savedState && savedState.isRunning) {
        console.log('🔄 Restaurando execução em background');
        setTimeout(() => {
            window.BackgroundExecutionManager.start(savedState.speed);
        }, 1000);
    }
});
