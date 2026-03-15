// =====================================================
// BACKGROUND WORKER - Execução contínua em background
// =====================================================
// Mantém a sequência rodando mesmo quando o navegador perde foco

let isRunning = false;
let interval = null;
let currentSpeed = 100;

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
    
    // Inicia o loop de execução
    runLoop();
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
        runLoop();
    }
    
    self.postMessage({ 
        type: 'STATUS', 
        data: { speed: currentSpeed, message: `Velocidade atualizada para ${newSpeed}ms` } 
    });
}

function runLoop() {
    if (!isRunning) return;
    
    interval = setInterval(() => {
        if (!isRunning) {
            clearInterval(interval);
            return;
        }
        
        // Envia comando para executar o próximo ciclo
        self.postMessage({ 
            type: 'EXECUTE_CYCLE', 
            data: { timestamp: Date.now() } 
        });
    }, currentSpeed);
}

// Manter o worker vivo
self.addEventListener('online', () => {
    self.postMessage({ type: 'STATUS', data: { online: true } });
});

self.addEventListener('offline', () => {
    self.postMessage({ type: 'STATUS', data: { online: false } });
});
