/**
 * ========================================================================
 * PRESET RANGES MODIFIED - CALCULADOR DE INTERVALOS COM INTEGRAÇÃO SUPABASE
 * ========================================================================
 */

function removeLeadingZeros(hex) {
  if (!hex || typeof hex !== 'string') return hex;
  
  // 🚀 CORREÇÃO: Mantém pelo menos 16 dígitos hexadecimais (64 bits)
  // Para não remover zeros significativos de valores como 4000000000000004a9
  const cleaned = hex.replace(/^0+/, '');
  
  // Se o resultado for muito curto, mantém zeros significativos
  if (cleaned.length < 16) {
    return hex; // Retorna o valor original se for muito curto
  }
  
  return cleaned || '0';
}

document.addEventListener('DOMContentLoaded', () => {
  const presetBitsInput = document.getElementById('presetBits');
  const applyPresetBtn = document.getElementById('applyPresetBtn');

  if (!presetBitsInput || !applyPresetBtn) {
    console.warn('Elementos de preset não encontrados no DOM');
    return;
  }

  async function sha256(buf) {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  }

  function hexToBytes(hex) {
    if (!hex || typeof hex !== 'string' || hex.length === 0) return new Uint8Array(32);
    hex = hex.replace(/^0x/, '');
    if (hex.length % 2 !== 0) hex = '0' + hex;
    if (hex.length < 64) hex = hex.padStart(64, '0');
    else if (hex.length > 64) hex = hex.slice(-64);
    return Uint8Array.from(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
  }

  function base58Encode(buf) {
    const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let x = BigInt('0x' + [...buf].map(b => b.toString(16).padStart(2, '0')).join(''));
    let out = '';
    while (x > 0n) {
      out = BASE58[Number(x % 58n)] + out;
      x /= 58n;
    }
    return out;
  }

  async function toWIF(hex, compressed) {
    if (typeof window.toWIF === 'function') return window.toWIF(hex, compressed);
    try {
      const paddedHex = hex.padStart(64, '0');
      const key = hexToBytes(paddedHex);
      const payload = new Uint8Array([0x80, ...key, ...(compressed ? [0x01] : [])]);
      const h1 = await sha256(payload);
      const h2 = await sha256(h1);
      const full = new Uint8Array([...payload, ...h2.slice(0, 4)]);
      return base58Encode(full);
    } catch (error) {
      console.error('Erro ao converter para WIF:', error);
      return 'Erro na conversão';
    }
  }

  function calculateStandardRange(bits) {
    const start = 1n << BigInt(bits);
    const end = (1n << (BigInt(bits) + 1n)) - 1n;
    return {
      start,
      end,
      startHex: start.toString(16),
      endHex: end.toString(16)
    };
  }

  async function updateIntervalRanges(bitCount) {
    const hexRange = document.getElementById('hexRange');
    const wifRange = document.getElementById('wifRange');
    const wifRangeUncompressed = document.getElementById('wifRangeUncompressed');

    try {
      const bits = BigInt(bitCount);
      const standardRange = calculateStandardRange(bits);
      let displayStart = standardRange.startHex;
      let displayEnd = standardRange.endHex;
      let usingSupabase = false;

      let dataForStatus = {
        inicio: standardRange.startHex,
        fim: standardRange.endHex,
        updated_at: new Date().toISOString(),
        preset: Number(bitCount),
        isStandard: true
      };

      if (window.SupabaseDB && window.SupabaseDB.isReady()) {
        try {
          const supabaseData = await window.SupabaseDB.fetch(Number(bitCount));
          if (supabaseData) {
            displayStart = supabaseData.inicio;
            displayEnd = supabaseData.fim;  // 🚀 CORREÇÃO: Atualiza também o FIM!
            usingSupabase = true;
            dataForStatus = { ...supabaseData, isStandard: false };
          } else {
            try {
              await window.SupabaseDB.create(Number(bitCount), standardRange.startHex, standardRange.endHex);
            } catch (e) { }
          }
        } catch (e) { }
      }

      const startHexPadded = displayStart.padStart(64, '0');
      const endHexPadded = displayEnd.padStart(64, '0');

      if (hexRange) {
        hexRange.innerHTML = usingSupabase
          ? `<div style="color: #28a745; font-weight: bold;">📊 ${removeLeadingZeros(startHexPadded)} até ${removeLeadingZeros(endHexPadded)}</div>`
          : `${removeLeadingZeros(startHexPadded)} até ${removeLeadingZeros(endHexPadded)}`;
      }

      const startWifCompressed = await toWIF(startHexPadded, true);
      const endWifCompressed = await toWIF(endHexPadded, true);

      if (wifRange) {
        wifRange.innerHTML = usingSupabase
          ? `<div style="color: #28a745;">${startWifCompressed} até ${endWifCompressed}</div>`
          : `${startWifCompressed} até ${endWifCompressed}`;
      }

      if (wifRangeUncompressed) {
        const swu = await toWIF(startHexPadded, false);
        const ewu = await toWIF(endHexPadded, false);
        wifRangeUncompressed.textContent = `${swu} até ${ewu}`;
      }

      updateDatabaseStatusSection(dataForStatus, bitCount);

      const databaseSection = document.getElementById('database-status-section');
      if (databaseSection) databaseSection.style.display = 'block';

      window.dispatchEvent(new CustomEvent('presetRangeUpdated', {
        detail: {
          bitCount: Number(bitCount),
          startHex: startHexPadded,
          endHex: endHexPadded,
          usingSupabase,
          standardRange: {
            startHex: removeLeadingZeros(standardRange.startHex),
            endHex: removeLeadingZeros(standardRange.endHex)
          },
          supabaseData: usingSupabase ? dataForStatus : null
        }
      }));

    } catch (error) {
      console.error('❌ Erro no updateIntervalRanges:', error);
    }
  }

  function updateDatabaseStatusSection(data, bitCount) {
    const statusEl = document.getElementById('database-status-section');
    if (!statusEl) return;
    statusEl.style.display = 'block';

    const isStandard = data.isStandard === true;
    const standardRange = calculateStandardRange(BigInt(bitCount));
    const inicioLimpo = removeLeadingZeros(data.inicio);
    const fimLimpo = removeLeadingZeros(data.fim);

    const totalBigInt = standardRange.end - standardRange.start;
    const currentBigInt = BigInt('0x' + inicioLimpo);
    const processedBigInt = currentBigInt - standardRange.start;

    let porcentagem = 0;
    if (totalBigInt > 0n) {
      porcentagem = Number(processedBigInt * 10000n / totalBigInt) / 100;
    }

    const mensagemInfo = isStandard
      ? '📌 Este é o intervalo inicial do preset. Nenhum progresso salvo.'
      : '💡 Intervalo recuperado do banco de dados (progresso global).';

    // 🚀 RECONSTRÓI O CONTEÚDO - VERSÃO COMPACTA
    statusEl.innerHTML = `
      <!-- CARD HORIZONTAL (GLOBAL) -->
      <div class="database-status-card" style="background: #f7fafc; border: 1px solid #edf2f7; border-left: 4px solid #38a169; padding: 10px 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-size: 13px;">
        <div style="font-size: 11px; color: #718096; margin-bottom: 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
           <i class="fas fa-arrows-alt-h"></i> Progresso Sequencial (Horizontal)
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 15px; flex: 1; min-width: 150px;">
            <div style="color: #276749; font-weight: 700;">${bitCount} bits</div>
            <div style="flex: 1;">
              <div style="display: flex; justify-content: space-between; font-size: 10px;">
                <span>Global:</span>
                <span style="color: #38a169; font-weight: bold;">${porcentagem.toFixed(4)}%</span>
              </div>
              <div style="background: #e2e8f0; height: 5px; border-radius: 3px; overflow: hidden;">
                <div style="background: #48bb78; height: 100%; width: ${Math.min(100, porcentagem)}%;"></div>
              </div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; flex: 2; min-width: 250px; background: white; padding: 5px 8px; border-radius: 4px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 10px;">
            <div><span style="color: #38a169; font-weight: bold;">INI:</span> ${inicioLimpo}</div>
            <div><span style="color: #38a169; font-weight: bold;">FIM:</span> ${fimLimpo}</div>
          </div>
          <div id="status-wif-display" style="font-family: monospace; font-size: 10px; color: #4a5568; min-width: 150px;">
            <span style="color: #38a169; font-weight: bold;">WIF:</span> Carregando...
          </div>
        </div>
      </div>

      <!-- CARD VERTICAL (EXCLUSIVO) -->
      <div id="vertical-status-card-container">
      </div>
    `;

    // 🚀 CARREGA VERTICAL DIRETO SEM LOADING
    if (window.VerticalProgressManager) {
      const vManager = new window.VerticalProgressManager();
      vManager.getLastVerticalProgress(bitCount).then(vData => {
        const vContainer = document.getElementById('vertical-status-card-container');
        if (!vContainer) return;

        // 🚀 MOSTRA DIRETO O VALOR (COM OU SEM DADOS DO BANCO)
        const vInicio = vData ? removeLeadingZeros(vData.inicio) : inicioLimpo;
        const vFim = vData ? removeLeadingZeros(vData.fim) : fimLimpo;
        const vStatus = vData ? 'PONTO DE RETOMADA' : 'AGUARDANDO INÍCIO';
        const vStatusColor = vData ? '#d1e9ff' : '#e2e8f0';
        const vStatusTextColor = vData ? '#2c5282' : '#718096';

        vContainer.innerHTML = `
          <div class="database-status-card" style="background: #f0f7ff; border: 1px solid #e1effe; border-left: 4px solid #3182ce; padding: 10px 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-size: 13px;">
            <div style="font-size: 11px; color: #4a5568; margin-bottom: 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
               <i class="fas fa-arrows-alt-v"></i> Progresso Sequencial (Vertical)
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; flex-direction: column; flex: 2; min-width: 250px; background: white; padding: 5px 8px; border-radius: 4px; border: 1px solid #d1e9ff; font-family: monospace; font-size: 10px;">
                <div><span style="color: #3182ce; font-weight: bold;">INI V:</span> ${vInicio}</div>
                <div><span style="color: #3182ce; font-weight: bold;">FIM V:</span> ${vFim}</div>
              </div>
              <div style="font-size: 10px; color: #4a5568; flex: 1; text-align: right;">
                <span style="background: ${vStatusColor}; color: ${vStatusTextColor}; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${vStatus}</span>
              </div>
            </div>
          </div>
        `;
      }).catch(() => {
        // 🚀 EM CASO DE ERRO, MOSTRA VALORES PADRÃO
        const vContainer = document.getElementById('vertical-status-card-container');
        if (vContainer) {
          vContainer.innerHTML = `
            <div class="database-status-card" style="background: #f0f7ff; border: 1px solid #e1effe; border-left: 4px solid #3182ce; padding: 10px 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-size: 13px;">
              <div style="font-size: 11px; color: #4a5568; margin-bottom: 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
                 <i class="fas fa-arrows-alt-v"></i> Progresso Sequencial (Vertical)
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                <div style="display: flex; flex-direction: column; flex: 2; min-width: 250px; background: white; padding: 5px 8px; border-radius: 4px; border: 1px solid #d1e9ff; font-family: monospace; font-size: 10px;">
                  <div><span style="color: #3182ce; font-weight: bold;">INI V:</span> ${inicioLimpo}</div>
                  <div><span style="color: #3182ce; font-weight: bold;">FIM V:</span> ${fimLimpo}</div>
                </div>
                <div style="font-size: 10px; color: #4a5568; flex: 1; text-align: right;">
                  <span style="background: #e2e8f0; color: #718096; padding: 2px 6px; border-radius: 4px; font-weight: bold;">AGUARDANDO INÍCIO</span>
                </div>
              </div>
            </div>
          `;
        }
      });
    } else {
      // 🚀 SE VERTICAL PROGRESS MANAGER NÃO EXISTE, MOSTRA VALORES PADRÃO
      const vContainer = document.getElementById('vertical-status-card-container');
      if (vContainer) {
        vContainer.innerHTML = `
          <div class="database-status-card" style="background: #f0f7ff; border: 1px solid #e1effe; border-left: 4px solid #3182ce; padding: 10px 15px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-size: 13px;">
            <div style="font-size: 11px; color: #4a5568; margin-bottom: 5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">
               <i class="fas fa-arrows-alt-v"></i> Progresso Sequencial (Vertical)
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; flex-direction: column; flex: 2; min-width: 250px; background: white; padding: 5px 8px; border-radius: 4px; border: 1px solid #d1e9ff; font-family: monospace; font-size: 10px;">
                <div><span style="color: #3182ce; font-weight: bold;">INI V:</span> ${inicioLimpo}</div>
                <div><span style="color: #3182ce; font-weight: bold;">FIM V:</span> ${fimLimpo}</div>
              </div>
              <div style="font-size: 10px; color: #4a5568; flex: 1; text-align: right;">
                <span style="background: #e2e8f0; color: #718096; padding: 2px 6px; border-radius: 4px; font-weight: bold;">AGUARDANDO INÍCIO</span>
              </div>
            </div>
          </div>
        `;
      }
    }

    setTimeout(async () => {
      try {
        const wifStart = await toWIF(data.inicio.padStart(64, '0'), true);
        const wifEnd = await toWIF(data.fim.padStart(64, '0'), true);
        const wifEl = document.getElementById('status-wif-display');
        if (wifEl) {
          wifEl.innerHTML = `
            <span style="color: #38a169; font-weight: bold;">WIF:</span> ${wifStart.substring(0, 8)}... | ${wifEnd.substring(0, 8)}...
          `;
        }
      } catch (e) { }
    }, 50);
  }

  applyPresetBtn.addEventListener('click', () => {
    const selectedValue = presetBitsInput.options[presetBitsInput.selectedIndex].value;
    if (selectedValue) updateIntervalRanges(selectedValue);
  });

  presetBitsInput.addEventListener('change', () => {
    const statusEl = document.getElementById('database-status-section');
    if (statusEl) statusEl.innerHTML = '';
  });

  // 🚀 ESCUTA EVENTOS DE PARADA PARA ATUALIZAR INTERFACE
  window.addEventListener('verticalProgressStopped', async (event) => {
    const { preset } = event.detail;
    console.log('🔄 Atualizando interface após parada vertical...');
    await updateIntervalRanges(preset);
  });

  window.addEventListener('progressUpdated', async (event) => {
    const { preset } = event.detail;
    if (preset && presetBitsInput && presetBitsInput.value === preset.toString()) {
      await updateIntervalRanges(preset);
    }
  });

  window.addEventListener('presetChanged', async (event) => {
    const { preset } = event.detail;
    await updateIntervalRanges(preset);
  });

  window.addEventListener('matrixChanged', async (event) => {
    const { bits } = event.detail;
    if (!window.presetManager || !window.presetManager.hasActivePreset()) {
      await updateIntervalRanges(bits);
    }
  });

  // INICIALIZAÇÃO ROBUSTA: Detecta o estado inicial da matriz imediatamente
  function initializeStatus() {
    if (window.matrizAPI && typeof window.matrizAPI.getActiveCells === 'function') {
      const activeCells = window.matrizAPI.getActiveCells();
      const bits = activeCells.length > 0 ? activeCells.length : 80;
      updateIntervalRanges(bits);
    } else {
      setTimeout(initializeStatus, 100);
    }
  }
  initializeStatus();
});
