// === script_random_pisca.js ===
// Modo Aleatório VERDADEIRO com Seed Criptográfico
// Gera TODAS as combinações possíveis de forma TOTALMENTE aleatória
// Usa crypto.getRandomValues() para aleatoriedade real sem padrões

// === Variáveis globais ===
window.timeoutId = null;
window.randomRunning = false;
let allCells = [];
let iterationCount = 0;
const maxIterations = 10000;

// 🔹 Função auxiliar: mantém textarea com no máximo N linhas
function safeAppend(box, text) {
    const maxLines = 100;
    let lines = (box.value + text + "\n").split("\n").filter(line => line.length > 0);
    if (lines.length > maxLines) {
        lines = lines.slice(-maxLines);
    }
    box.value = lines.join("\n") + "\n";
    box.scrollTop = box.scrollHeight;
}

// 🔹 Gerador de números aleatórios criptograficamente seguro
// Usa a seed do usuário como entropia adicional (opcional)
function getSecureRandom() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / 0xFFFFFFFF; // Retorna float entre 0 e 1
}

// 🔹 Gera sequência COMPLETAMENTE ALEATÓRIA de bits
// Cada bit tem 50% de chance de ser 0 ou 1 (distribuição uniforme)
// Permite gerar de 0% a 100% de células ativas de forma natural
function generateRandomBitSequence(bitLength, seed) {
    const bits = [];
    
    // Usa seed como modificador opcional da entropia
    let seedInfluence = 0;
    if (seed && seed.length > 0) {
        for (let i = 0; i < seed.length; i++) {
            seedInfluence += seed.charCodeAt(i);
        }
        seedInfluence = seedInfluence / 1000; // Normaliza
    }
    
    // Gera cada bit de forma TOTALMENTE aleatória
    for (let i = 0; i < bitLength; i++) {
        // Aleatoriedade pura do sistema
        const randomValue = getSecureRandom();
        
        // Adiciona micro-influência da seed (opcional, muito sutil)
        const threshold = 0.5 + (seedInfluence * 0.001);
        
        // Cada bit é independente - permite qualquer % de células ativas
        bits.push(randomValue > threshold ? 1 : 0);
    }
    
    return bits;
}

// 🔹 Estatísticas da iteração atual (para log)
function getSequenceStats(bitSequence) {
    const onesCount = bitSequence.filter(b => b === 1).length;
    const percentage = ((onesCount / bitSequence.length) * 100).toFixed(2);
    return { onesCount, percentage };
}

// 🔸 Lógica do ciclo (com aleatoriedade REAL)
function runCycle(speed) {
    // Verifica se deve continuar
    if (!window.randomRunning || iterationCount >= maxIterations) {
        window.randomRunning = false;
        window.timeoutId = null;
        console.log("🔸 Modo aleatório finalizado.");
        return;
    }

    // 1. Gera sequência COMPLETAMENTE ALEATÓRIA
    const seed = seedInput.value || "canalqb";
    const bitLength = allCells.length;
    const bitSequence = generateRandomBitSequence(bitLength, seed);
    
    // 2. Log de estatísticas (a cada 100 iterações para não sobrecarregar)
    if (iterationCount % 100 === 0) {
        const stats = getSequenceStats(bitSequence);
        console.log(`📊 Iteração ${iterationCount}: ${stats.onesCount}/${bitLength} células ativas (${stats.percentage}%)`);
    }

    // 3. Atualiza células com base nos bits aleatórios
    for (let i = 0; i < bitLength; i++) {
        const cell = allCells[i];
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellKey = `${row},${col}`;

        // Não sobrescreve células marcadas manualmente
        const isManual = manualCells.has(cellKey);
        
        if (!isManual) {
            const isOn = bitSequence[i] === 1;
            
            if (isOn) {
                cell.classList.add("active");
                activeCells.add(cellKey);
            } else {
                cell.classList.remove("active");
                activeCells.delete(cellKey);
            }
        }
    }

    // 4. Reaplica células manuais (garantia)
    applyManualCells();

    // 5. Calcula valores e WIF
    const totalValue = calculateTotalValue();
    const hex = numberToHex64(totalValue);

    // 6. Calcula WIFs em paralelo sem bloquear o ciclo
    Promise.all([
        window.hexToWIF(hex, true),
        window.hexToWIF(hex, false)
    ]).then(([wifCompressed, wifUncompressed]) => {
        safeAppend(hexBox, hex);
        safeAppend(wifBox, wifCompressed);
        safeAppend(wifBoxUncompressed, wifUncompressed);
    }).catch(err => {
        console.error("Erro ao calcular WIF:", err);
    });

    // 7. Incrementa contador
    iterationCount++;

    // 8. Agenda próximo ciclo com ajuste para background
    scheduleNextCycle(speed);
}

/**
 * Agenda o próximo ciclo considerando o estado do background
 */
function scheduleNextCycle(baseSpeed) {
    // Ajusta velocidade baseado no estado do background
    let adjustedSpeed = baseSpeed;
    
    if (window.BackgroundProcessor && window.BackgroundProcessor.isInBackground()) {
      // Em background: mantém a mesma velocidade (não diminui)
      adjustedSpeed = baseSpeed;
      console.log(`⚡ Random processando em background com velocidade mantida: ${adjustedSpeed}ms`);
    } else {
      // Em foreground: usa velocidade normal
      adjustedSpeed = baseSpeed;
    }
    
    window.timeoutId = setTimeout(() => runCycle(baseSpeed), adjustedSpeed);
}

/**
 * Registra o processador aleatório no Background Processor
 */
function registerRandomWithBackgroundProcessor() {
  if (window.BackgroundProcessor) {
    window.BackgroundProcessor.register('random-pisca', {
      onVisibilityChange: (data) => {
        console.log('🔄 Random: Mudança de visibilidade detectada', data);
        // Se estiver rodando, o próximo ciclo já será ajustado automaticamente
      },
      enableAggressiveMode: (data) => {
        console.log('⚡ Random: Modo agressivo ativado', data);
        // Mantém velocidade máxima para processamento contínuo
      },
      enableNormalMode: (data) => {
        console.log('🔄 Random: Modo normal ativado', data);
        // Retorna à velocidade normal
      },
      optimizeForLongBackground: (data) => {
        console.log('🔧 Random: Otimizando para long background', data);
        // Limpa variáveis desnecessárias se possível
        if (window.gc) {
          window.gc();
        }
      }
    });
  }
}

// Inicializa o Background Processor para random
setTimeout(() => {
  registerRandomWithBackgroundProcessor();
}, 100);

// === Inicializa o modo aleatório ===
window.runRandom = function (lines, extraLineCells, speed) {
    // Para qualquer execução anterior
    window.stopRandom();

    // Monta array de células na ordem correta (de trás pra frente)
    const allCellsInInterval = [];
    for (let r = lines.length - 1; r >= 0; r--) {
        for (let c = gridSize - 1; c >= 0; c--) {
            allCellsInInterval.push(lines[r][c]);
        }
    }

    // Combina linha extra + linhas do intervalo
    allCells = extraLineCells.concat(allCellsInInterval);
    iterationCount = 0;

    console.log(`🎲 Iniciando modo ALEATÓRIO REAL com ${allCells.length} células`);
    console.log(`🔐 Usando crypto.getRandomValues() - sem padrões repetitivos`);
    console.log(`⚡ Velocidade: ${speed}ms | Max iterações: ${maxIterations}`);
    console.log(`📈 Cada iteração pode ter de 0% a 100% de células ativas`);

    // Inicia o loop
    window.randomRunning = true;
    runCycle(speed);
};

// === Interrompe o modo aleatório ===
window.stopRandom = function () {
    window.randomRunning = false;
    if (window.timeoutId) {
        clearTimeout(window.timeoutId);
        window.timeoutId = null;
    }
    console.log("🔸 Modo aleatório interrompido.");
};
