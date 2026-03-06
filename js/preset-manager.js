document.addEventListener('DOMContentLoaded', () => {

  /* =====================================================
     GERENCIADOR DE PRESETS BITCOIN
  ===================================================== */

  let currentPresetData = null;
  let isUsingSupabaseRange = false;
  let currentPresetBits = 0n;
  window.presetExpressoAtivo = false; // 🚀 FLAG PARA DIFERENCIAR PRESETS DE SELEÇÃO MANUAL

  function hexToBytes(hex) {
    if (!hex || typeof hex !== 'string' || hex.length === 0) return new Uint8Array(32);
    hex = hex.replace(/^0x/, '');
    if (hex.length % 2 !== 0) hex = '0' + hex;
    if (hex.length < 64) hex = hex.padStart(64, '0');
    return Uint8Array.from(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
  }

  function removeLeadingZeros(hex) {
    if (!hex || typeof hex !== 'string') return hex;
    return hex.replace(/^0+/, '') || '0';
  }

  function updateSpeedControlVisibility() {
    const databaseSection = document.getElementById('database-status-section');
    const selecaoLinhasCard = document.querySelector('.selecao-linhas-card');
    const configAvancadasCard = document.querySelector('.config-avancadas-card');
    const hasPreset = currentPresetBits > 0n;

    if (databaseSection) databaseSection.style.display = 'block';
    if (selecaoLinhasCard) selecaoLinhasCard.style.display = 'block';
    if (configAvancadasCard) {
      configAvancadasCard.style.flex = '';
      configAvancadasCard.style.maxWidth = '';
    }
  }

  async function applyPresetBits(bitCount) {
    const n = Number(bitCount);
    if (!Number.isFinite(n) || n < 1 || n > 256) return;

    console.log(`🎯 Aplicando preset de ${n} bits...`);
    currentPresetBits = BigInt(n);
    window.presetExpressoAtivo = true; // 🚀 ATIVA MODO PRESET

    if (window.matrizAPI) window.matrizAPI.applyPreset(n);
    updateSpeedControlVisibility();

    window.dispatchEvent(new CustomEvent('presetChanged', { detail: { preset: n } }));

    const hexBox = document.getElementById('hexBox');
    const wifBox = document.getElementById('wifBox');
    const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');

    if (hexBox) hexBox.value = '';
    if (wifBox) wifBox.value = '';
    if (wifBoxUncompressed) wifBoxUncompressed.value = '';

    if (window.matrizAPI) {
      window.matrizAPI.setGridState(Array(256).fill(false));
      window.matrizAPI.draw();
    }

    window.dispatchEvent(new CustomEvent('resetCounters'));
    currentPresetData = null;
    isUsingSupabaseRange = false;

    return { preset: n, hasSupabaseData: !!currentPresetData, isUsingSupabaseRange };
  }

  window.addEventListener('presetRangeUpdated', (event) => {
    const { bitCount, startHex, endHex, usingSupabase, supabaseData } = event.detail;
    currentPresetBits = BigInt(bitCount);
    isUsingSupabaseRange = usingSupabase;

    if (usingSupabase && supabaseData) {
      currentPresetData = supabaseData;
      // 🚀 REMOVIDO: Não usar ProgressTracker aqui - modal deve aparecer só quando processar
    } else {
      currentPresetData = null;
      if (window.ProgressTracker) window.ProgressTracker.stop();
    }

    updateSpeedControlVisibility();

    window.dispatchEvent(new CustomEvent('presetApplied', {
      detail: {
        bitCount: Number(bitCount),
        data: { inicio: startHex, fim: endHex },
        usingSupabase: usingSupabase
      }
    }));
  });

  function calculateRealValue(stateCounter, presetBits, dualMode = false, dualLowOffset = 0n, dualHighOffset = 0n, dualFromLow = true) {
    let realValue;
    if (isUsingSupabaseRange && currentPresetData) {
      const start = BigInt('0x' + currentPresetData.inicio);
      const end = BigInt('0x' + currentPresetData.fim);
      if (dualMode) {
        realValue = dualFromLow ? (start + dualLowOffset) : (end - dualHighOffset);
      } else {
        realValue = start + stateCounter;
      }
    } else if (presetBits > 0n) {
      const startRange = 1n << presetBits;
      const endRange = (1n << (presetBits + 1n)) - 1n;
      if (dualMode) {
        realValue = dualFromLow ? (startRange + dualLowOffset) : (endRange - dualHighOffset);
      } else {
        realValue = startRange + stateCounter;
      }
    } else {
      realValue = stateCounter;
    }
    return realValue;
  }

  function getDisplayRange(realValue, presetBits) {
    if (presetBits > 0n) {
      let start, end;
      if (isUsingSupabaseRange && currentPresetData) {
        start = BigInt('0x' + currentPresetData.inicio);
        end = BigInt('0x' + currentPresetData.fim);
      } else {
        start = 1n << presetBits;
        end = (1n << (presetBits + 1n)) - 1n;
      }
      return { start: start, end: end, displayStart: realValue, displayEnd: end };
    }
    return null;
  }

  function shouldStop(stateCounter, presetBits, dualMode = false, dualLowOffset = 0n, dualHighOffset = 0n) {
    if (!dualMode || presetBits === 0n) return false;
    let start, end;
    if (isUsingSupabaseRange && currentPresetData) {
      start = BigInt('0x' + currentPresetData.inicio);
      end = BigInt('0x' + currentPresetData.fim);
    } else {
      start = 1n << presetBits;
      end = (1n << (presetBits + 1n)) - 1n;
    }
    return (start + dualLowOffset > end - dualHighOffset);
  }

  function gridToHexWithPreset(currentRealValue, presetBits, running = false) {
    if (presetBits > 0n && running && currentRealValue > 0n) return currentRealValue.toString(16);
    let decimalValue = 0n;
    const gridState = window.matrizAPI ? window.matrizAPI.getGridState() : Array(256).fill(false);
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const idx = row * 16 + col;
        if (gridState[idx]) {
          const bit_index = (16 - (row + 1)) * 16 + (16 - (col + 1));
          decimalValue |= (1n << BigInt(bit_index));
        }
      }
    }
    if (presetBits > 0n) {
      if (isUsingSupabaseRange && currentPresetData) decimalValue += BigInt('0x' + currentPresetData.inicio);
      else decimalValue += (1n << presetBits);
    }
    return decimalValue.toString(16) || '0';
  }

  function resetPreset() {
    currentPresetData = null;
    isUsingSupabaseRange = false;
    currentPresetBits = 0n;
    window.presetExpressoAtivo = false; // 🚀 DESATIVA MODO PRESET

    if (window.matrizAPI) {
      window.matrizAPI.setRange(12, 16);
      window.matrizAPI.setExtraRow(null, []);
    }
    updateSpeedControlVisibility();
    console.log('🔄 Preset resetado e modo normal restabelecido');
  }

  function initializePresetManager() {
    const presetBitsInput = document.getElementById('presetBits');
    const applyPresetBtn = document.getElementById('applyPresetBtn');
    if (applyPresetBtn && presetBitsInput) {
      applyPresetBtn.addEventListener('click', () => {
        const selectedValue = presetBitsInput.options[presetBitsInput.selectedIndex].value;
        applyPresetBits(selectedValue);
      });
    }
    window.addEventListener('presetChanged', () => updateSpeedControlVisibility());
    setTimeout(updateSpeedControlVisibility, 500);
    console.log('✅ Gerenciador de presets inicializado');
  }

  window.presetManager = {
    applyPreset: applyPresetBits,
    reset: resetPreset,
    getCurrentData: () => currentPresetData,
    getCurrentBits: () => currentPresetBits,
    isUsingSupabase: () => isUsingSupabaseRange,
    hasActivePreset: () => {
      // 🚀 VERIFICAÇÃO RIGOROSA: Só é preset se foi ativado via dropdown
      return window.presetExpressoAtivo === true;
    },
    calculateRealValue,
    getDisplayRange,
    shouldStop,
    gridToHex: gridToHexWithPreset,
    updateSpeedControlVisibility,
    getStartEnd: () => {
      if (!currentPresetData) return null;
      return { start: BigInt('0x' + currentPresetData.inicio), end: BigInt('0x' + currentPresetData.fim) };
    }
  };

  initializePresetManager();
});
