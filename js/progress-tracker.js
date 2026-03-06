/**
 * progress-tracker.js
 * Gerenciador de progresso com BigInt para cálculos precisos
 * Rastreia linhas processadas e atualiza banco incrementalmente
 */

(function () {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  const CONFIG = {
    LINHAS_POR_ATUALIZACAO: 1000, // AJUSTE ESTE VALOR CONFORME NECESSÁRIO
    POLLING_INTERVAL: 60000, // 60 segundos
    DEBOUNCE_DELAY: 500
  };

  // ============================================
  // ESTADO GLOBAL
  // ============================================
  let currentPreset = null;
  let linhasProcessadas = 0;
  let inicioAtual = null;
  let fimAtual = null;
  let inicioOriginal = null;
  let fimOriginal = null;
  let isTracking = false;
  let updateTimer = null;
  let pollingTimer = null;
  let trackingStartTime = null; // Tempo de início do rastreamento

  // ============================================
  // FUNÇÕES BIGINT - PRECISÃO TOTAL
  // ============================================

  /**
   * Converte hexadecimal para BigInt
   * @param {string} hex - String hexadecimal
   * @returns {BigInt} Número BigInt
   */
  function hexToBigInt(hex) {
    // Remove prefixo 0x se existir
    const cleanHex = hex.replace(/^0x/, '');
    return BigInt('0x' + cleanHex);
  }

  /**
   * Converte BigInt para hexadecimal SEM padding (limpo)
   * @param {BigInt} num - Número BigInt
   * @returns {string} String hexadecimal limpa
   */
  function bigIntToHex(num) {
    return num.toString(16);
  }

  /**
   * Incrementa valor hexadecimal por N
   * @param {string} hex - Valor hexadecimal
   * @param {number} increment - Quantidade a incrementar
   * @returns {string} Novo valor hexadecimal
   */
  function incrementHex(hex, increment) {
    const bigInt = hexToBigInt(hex);
    const result = bigInt + BigInt(increment);
    return bigIntToHex(result);
  }

  /**
   * Decrementa valor hexadecimal por N
   * @param {string} hex - Valor hexadecimal
   * @param {number} decrement - Quantidade a decrementar
   * @returns {string} Novo valor hexadecimal
   */
  function decrementHex(hex, decrement) {
    const bigInt = hexToBigInt(hex);
    const result = bigInt - BigInt(decrement);
    return bigIntToHex(result);
  }

  /**
   * Calcula porcentagem processada
   * @param {string} inicioOriginal - Início do intervalo total
   * @param {string} fimOriginal - Fim do intervalo total
   * @param {string} inicioAtual - Início atual
   * @returns {number} Porcentagem (0-100)
   */
  function calcularPorcentagem(inicioOriginal, fimOriginal, inicioAtual) {
    try {
      const totalBigInt = hexToBigInt(fimOriginal) - hexToBigInt(inicioOriginal);
      const processadoBigInt = hexToBigInt(inicioAtual) - hexToBigInt(inicioOriginal);

      // Evita divisão por zero
      if (totalBigInt === 0n) return 0;

      // Calcula porcentagem com precisão
      const porcentagem = (Number(processadoBigInt * 10000n / totalBigInt) / 100);

      return Math.min(100, Math.max(0, porcentagem));
    } catch (error) {
      console.error('Erro ao calcular porcentagem:', error);
      return 0;
    }
  }

  // ============================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================

  // Função para remover zeros desnecessários
  function removeLeadingZeros(hex) {
    if (!hex || typeof hex !== 'string') return hex;
    return hex.replace(/^0+/, '') || '0';
  }

  // ============================================
  // INTERFACE DO USUÁRIO
  // ============================================

  /**
   * Cria modal de progresso
   */
  function createProgressModal() {
    // Remove modal existente se houver
    const existing = document.getElementById('preset-progress-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'preset-progress-modal';
    modal.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      min-width: 300px;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    `;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-weight: 600; font-size: 14px;">Sincronizando com Banco</span>
        <button id="close-progress-modal" style="background: transparent; border: none; color: white; cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px; line-height: 1;">×</button>
      </div>
      <div style="margin-bottom: 8px; font-size: 12px; opacity: 0.9;">
        <span id="progress-linhas">0</span> / <span id="progress-total">${CONFIG.LINHAS_POR_ATUALIZACAO}</span> linhas processadas
      </div>
      <div style="background: rgba(255, 255, 255, 0.1); height: 8px; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">
        <div id="progress-bar" style="background: linear-gradient(90deg, #28a745, #20c997); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
      </div>
      <div style="font-size: 11px; opacity: 0.7; text-align: center;">
        Falta <span id="progress-percent">100</span>% - Conto com você! 🙏
      </div>
      <div style="margin-top: 8px; font-size: 10px; opacity: 0.6; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px;">
        <div>Próxima atualização em: <span id="progress-eta">calculando...</span></div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listener para fechar
    document.getElementById('close-progress-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    return modal;
  }

  /**
   * Atualiza interface do modal
   * @param {number} linhas - Linhas processadas
   */
  function updateProgressUI(linhas) {
    const modal = document.getElementById('preset-progress-modal');
    if (!modal) return;

    const porcentagem = Math.min(100, (linhas / CONFIG.LINHAS_POR_ATUALIZACAO) * 100);
    const faltam = 100 - porcentagem;
    const faltamLinhas = CONFIG.LINHAS_POR_ATUALIZACAO - linhas;

    const linhasEl = document.getElementById('progress-linhas');
    const percentEl = document.getElementById('progress-percent');
    const barEl = document.getElementById('progress-bar');
    const etaEl = document.getElementById('progress-eta');
    const ajudasEl = document.getElementById('progress-ajudas');

    if (linhasEl) linhasEl.textContent = linhas;
    if (percentEl) percentEl.textContent = faltam.toFixed(1);
    if (barEl) barEl.style.width = porcentagem + '%';
    
    // Calcula e atualiza número de carteiras (ajudas)
    if (ajudasEl) {
      const totalCarteiras = window.vezesAjudadas || 0;
      ajudasEl.textContent = totalCarteiras;
    }

    // Calcula e exibe tempo estimado
    if (etaEl && faltamLinhas > 0) {
      // Obtém velocidade atual (linhas por segundo)
      const tempoDecorrido = (Date.now() - trackingStartTime) / 1000; // segundos
      const velocidade = tempoDecorrido > 0 ? linhas / tempoDecorrido : 0; // linhas/segundo

      if (velocidade > 0) {
        const segundosRestantes = faltamLinhas / velocidade;
        const minutos = Math.floor(segundosRestantes / 60);
        const segundos = Math.floor(segundosRestantes % 60);

        if (minutos > 0) {
          etaEl.textContent = `${minutos}m ${segundos}s`;
        } else {
          etaEl.textContent = `${segundos}s`;
        }
      } else {
        etaEl.textContent = 'calculando...';
      }
    } else if (etaEl) {
      etaEl.textContent = faltamLinhas <= 0 ? 'Atualizando...' : 'calculando...';
    }

    // Mostra modal se estava oculto
    modal.style.display = 'block';
  }

  /**
   * Esconde modal de progresso
   */
  function hideProgressModal() {
    const modal = document.getElementById('preset-progress-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  // ============================================
  // RASTREAMENTO DE PROGRESSO
  // ============================================

  /**
   * Inicia rastreamento para um preset
   * @param {number} preset - Número do preset
   * @param {string} inicio - Hex de início
   * @param {string} fim - Hex de fim
   */
  async function startTracking(preset, inicio, fim) {
    if (isTracking) {
      console.warn('⚠️ Rastreamento já em execução');
      return;
    }

    try {
      currentPreset = preset;
      inicioAtual = inicio.toLowerCase();
      fimAtual = fim.toLowerCase();
      inicioOriginal = inicio.toLowerCase();
      fimOriginal = fim.toLowerCase();
      linhasProcessadas = 0;
      isTracking = true;
      trackingStartTime = Date.now(); // Marca tempo inicial

      // Cria modal
      createProgressModal();
      updateProgressUI(0);

      console.log(`🚀 Rastreamento iniciado para preset ${preset}`);
      console.log(`  Início: ${removeLeadingZeros(inicioAtual)}`);
      console.log(`  Fim: ${removeLeadingZeros(fimAtual)}`);
      console.log(`  Atualizar a cada: ${CONFIG.LINHAS_POR_ATUALIZACAO} linhas`);

    } catch (error) {
      console.error('❌ Erro ao iniciar rastreamento:', error);
      isTracking = false;
    }
  }

  /**
   * Registra linha processada
   */
  function trackLine() {
    if (!isTracking) return;

    linhasProcessadas++;
    updateProgressUI(linhasProcessadas);

    // Debug detalhado
    console.log(`📊 Linha processada: ${linhasProcessadas}/${CONFIG.LINHAS_POR_ATUALIZACAO}`);

    // Verifica se deve atualizar banco
    if (linhasProcessadas >= CONFIG.LINHAS_POR_ATUALIZACAO) {
      console.log(`🔄 Atingiu limite de ${CONFIG.LINHAS_POR_ATUALIZACAO} linhas. Agendando atualização...`);
      scheduleUpdate();
    }
  }

  /**
   * Agenda atualização com debounce
   */
  function scheduleUpdate() {
    if (updateTimer) clearTimeout(updateTimer);

    updateTimer = setTimeout(() => {
      updateDatabase();
    }, CONFIG.DEBOUNCE_DELAY);
  }

  /**
   * Atualiza banco de dados
   */
  async function updateDatabase() {
    if (!isTracking || !currentPreset) {
      console.warn('⚠️ updateDatabase: não está rastreando ou preset é null');
      return;
    }

    try {
      console.log(`💾 Atualizando banco após ${linhasProcessadas} linhas...`);
      console.log(`  Estado atual - Início: ${removeLeadingZeros(inicioAtual)}, Fim: ${removeLeadingZeros(fimAtual)}`);

      // Calcula novos valores
      const novoInicio = incrementHex(inicioAtual, CONFIG.LINHAS_POR_ATUALIZACAO);
      const novoFim = decrementHex(fimAtual, CONFIG.LINHAS_POR_ATUALIZACAO);

      console.log(`  Novos valores - Início: ${removeLeadingZeros(novoInicio)}, Fim: ${removeLeadingZeros(novoFim)}`);

      // Atualiza no Supabase
      if (window.SupabaseDB && window.SupabaseDB.isReady()) {
        await window.SupabaseDB.update(currentPreset, novoInicio, novoFim);

        // Atualiza estado local
        inicioAtual = novoInicio;
        fimAtual = novoFim;
        linhasProcessadas = 0;
        trackingStartTime = Date.now(); // Reinicia tempo de início

        console.log(`✅ Banco atualizado. Zerando contador para ${linhasProcessadas}`);
        console.log(`🔄 Reiniciando contagem: 0/${CONFIG.LINHAS_POR_ATUALIZACAO}`);

        // Atualiza UI
        updateProgressUI(0);

        // Dispara evento customizado
        window.dispatchEvent(new CustomEvent('progressUpdated', {
          detail: {
            preset: currentPreset,
            inicio: novoInicio,
            fim: novoFim
          }
        }));

        console.log(`✅ Banco atualizado com sucesso`);
        console.log(`  Novo início: ${removeLeadingZeros(novoInicio)}`);
        console.log(`  Novo fim: ${removeLeadingZeros(novoFim)}`);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar banco:', error);
    }
  }

  /**
   * Para rastreamento
   */
  function stopTracking() {
    if (!isTracking) return;

    // Se houver linhas pendentes, atualiza antes de parar
    if (linhasProcessadas > 0) {
      console.log(`ℹ️ Atualizando ${linhasProcessadas} linhas pendentes antes de parar...`);
      updateDatabase();
    }

    isTracking = false;
    currentPreset = null;
    linhasProcessadas = 0;
    hideProgressModal();

    if (updateTimer) {
      clearTimeout(updateTimer);
      updateTimer = null;
    }

    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }

    console.log('🛑 Rastreamento parado');
  }

  /**
   * Força atualização imediata
   */
  async function forceUpdate() {
    if (!isTracking || linhasProcessadas === 0) {
      console.log('ℹ️ Nenhuma atualização pendente');
      return;
    }

    await updateDatabase();
  }

  /**
   * Obtém status atual
   */
  function getStatus() {
    return {
      isTracking,
      preset: currentPreset,
      linhasProcessadas,
      linhasPorAtualizacao: CONFIG.LINHAS_POR_ATUALIZACAO,
      inicioAtual,
      fimAtual,
      inicioOriginal,
      fimOriginal,
      porcentagemTotal: inicioOriginal && fimOriginal && inicioAtual
        ? calcularPorcentagem(inicioOriginal, fimOriginal, inicioAtual)
        : 0
    };
  }

  // ============================================
  // API PÚBLICA
  // ============================================
  window.ProgressTracker = {
    // Configuração
    config: CONFIG,
    setLinhasPorAtualizacao: (num) => {
      CONFIG.LINHAS_POR_ATUALIZACAO = num;
      console.log(`✅ Linhas por atualização definidas: ${num}`);
    },

    // Controle
    start: startTracking,
    stop: stopTracking,
    track: trackLine,
    forceUpdate: forceUpdate,

    // Status
    getStatus: getStatus,
    isActive: () => isTracking,

    // Utilitários BigInt
    utils: {
      hexToBigInt,
      bigIntToHex,
      incrementHex,
      decrementHex,
      calcularPorcentagem
    },

    // UI
    showModal: () => {
      const modal = document.getElementById('preset-progress-modal');
      if (modal) modal.style.display = 'block';
    },
    hideModal: hideProgressModal
  };

  console.log('✅ progress-tracker.js carregado. Use window.ProgressTracker para API.');

})();
