// =====================================================
// BACKGROUND WORKER - Execução contínua em background
// =====================================================
// Mantém a sequência rodando mesmo quando o navegador perde foco

let isRunning = false;
let interval = null;
let currentSpeed = 100;
let batchCounter = 0;
let batchSize = 50; // Executa múltiplos ciclos por mensagem

// Comunicar com o thread principal
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch (type) {
        case 'START':
            startExecution(data.speed || 100);
            break;
        case 'STOP':
            stopExecution();
            break;
        case 'SET_SPEED':
            updateSpeed(data.speed);
            break;
        case 'PING':
            self.postMessage({ type: 'PONG', data: { running: isRunning, speed: currentSpeed } });
            break;
    }
};

function startExecution(speed) {
    if (isRunning) return;
    
    isRunning = true;
    currentSpeed = speed;
    
    self.postMessage({ 
        type: 'STATUS', 
        data: { running: true, message: 'Worker iniciado' } 
    });
    
    // Inicia o loop de execução otimizado
    runOptimizedLoop();
}

function stopExecution() {
    isRunning = false;
    
    if (interval) {
        clearInterval(interval);
        interval = null;
    }
    
    self.postMessage({ 
        type: 'STATUS', 
        data: { running: false, message: 'Worker parado' } 
    });
}

function updateSpeed(newSpeed) {
    currentSpeed = newSpeed;
    
    if (isRunning && interval) {
        clearInterval(interval);
        runOptimizedLoop();
    }
    
    self.postMessage({ 
        type: 'STATUS', 
        data: { speed: currentSpeed, message: `Velocidade atualizada para ${newSpeed}ms` } 
    });
}

function runOptimizedLoop() {
    if (!isRunning) return;
    
    // Usa intervalo menor para maior velocidade
    const optimizedSpeed = Math.max(currentSpeed / 10, 10); // 10x mais rápido
    
    interval = setInterval(() => {
        if (!isRunning) {
            clearInterval(interval);
            return;
        }
        
        // Executa múltiplos ciclos em batch
        for (let i = 0; i < batchSize && isRunning; i++) {
            self.postMessage({ 
                type: 'EXECUTE_CYCLE', 
                data: { 
                    timestamp: Date.now(),
                    batchIndex: i,
                    batchSize: batchSize
                } 
            });
        }
        
        batchCounter++;
        
        // Ajusta dinamicamente o batch size baseado na velocidade
        if (batchCounter % 100 === 0) {
            adjustBatchSize();
        }
    }, optimizedSpeed);
}

function adjustBatchSize() {
    // Ajusta o batch size baseado na velocidade atual
    if (currentSpeed < 50) {
        batchSize = 100; // Muito rápido
    } else if (currentSpeed < 200) {
        batchSize = 50; // Rápido
    } else {
        batchSize = 25; // Normal
    }
}

// Manter o worker vivo
self.addEventListener('online', () => {
    self.postMessage({ type: 'STATUS', data: { online: true } });
});

self.addEventListener('offline', () => {
    self.postMessage({ type: 'STATUS', data: { online: false } });
});
