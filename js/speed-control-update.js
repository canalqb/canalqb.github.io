/**
 * SPEED CONTROL UPDATE- 1ms to 1000ms
 * =====================================
 * Atualiza o controle de velocidade para suportar 1-1000ms
 */

(function() {
  'use strict';
  
  // Aguarda DOM carregar
  document.addEventListener('DOMContentLoaded', function() {
   const speedInput = document.getElementById('speed');
   const speedValue = document.getElementById('speedValue');
   const speedHints = document.querySelector('.speed-hints');
    
    if (speedInput) {
      // Atualiza atributos do input
      speedInput.setAttribute('min', '1');
      speedInput.setAttribute('max', '1000');
      speedInput.setAttribute('step', '1');
      
     console.log('✅ Speed control updated: 1-1000ms');
    } else {
     console.error('❌ Speed input not found');
    }
    
    // Atualiza display do valor
    if (speedValue && speedInput) {
      speedInput.addEventListener('input', function() {
        speedValue.textContent = this.value;
      });
    }
    
    // Atualiza dicas
    if (speedHints) {
      speedHints.innerHTML = `
        <small>Rápido (1ms)</small>
        <small>Médio (50ms)</small>
        <small>Lento (1000ms)</small>
      `;
    }
  });
})();
