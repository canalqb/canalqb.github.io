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
    try {
      if (!buf || buf.length === 0) {
        console.warn('⚠️ sha256: buffer inválido ou vazio');
        return new Uint8Array(32);
      }
      
      // Garante que buf seja Uint8Array
      const uint8Buffer = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
      return new Uint8Array(await crypto.subtle.digest('SHA-256', uint8Buffer));
    } catch (error) {
      console.error('❌ Erro na função sha256:', error);
      return new Uint8Array(32);
    }
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

    // 🚀 RECONSTRÓI O CONTEÚDO - LAYOUT UNIFICADO COMO NO EXEMPLO
    statusEl.innerHTML = `
      <style>
      .progress-card{
        border:1px solid #dcdcdc;
        border-radius:8px;
        padding:12px;
        background:#f8f9fb;
        font-family:monospace;
        margin: 10px 0;
      }
      
      .progress-header{
        display:flex;
        gap:8px;
        align-items:center;
        margin-bottom:10px;
        font-weight:bold;
        font-size: 11px;
        color: #718096;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .progress-body{
        display:flex;
        gap:20px;
        align-items:center;
        flex-wrap:wrap;
      }
      
      .progress-global{
        display:flex;
        align-items:center;
        gap:8px;
        flex: 1;
        min-width: 200px;
      }
      
      .progress-bar{
        width:200px;
        height:8px;
        background:#e5e5e5;
        border-radius:4px;
        overflow:hidden;
      }
      
      .progress-fill{
        height:100%;
        width: ${Math.min(100, porcentagem)}%;
        background:#2ecc71;
        transition: width 0.3s ease;
      }
      
      .progress-block{
        font-size:12px;
        flex: 1;
        min-width: 250px;
      }
      
      .block-title{
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .horizontal .block-title{
        color: #27ae60;
      }
      
      .vertical .block-title{
        color: #3498db;
      }
      
      .range{
        display:flex;
        gap:6px;
        margin-bottom: 3px;
      }
      
      .label{
        font-weight: bold;
      }
      
      .horizontal .label{
        color: #27ae60;
      }
      
      .vertical .label{
        color: #3498db;
      }
      
      .value{
        color: #2c3e50;
      }
      </style>

      <div class="progress-card">

        <div class="progress-header">
          <span class="icon">↔</span>
          <span class="title">PROGRESSO SEQUENCIAL</span>
        </div>

        <div class="progress-body">

          <!-- Progress Global -->
          <div class="progress-global">
            <span class="bits">${bitCount} bits</span>
            <span class="label">Global:</span>

            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>

            <span class="percent">${porcentagem.toFixed(4)}%</span>
          </div>

          <!-- Horizontal -->
          <div class="progress-block horizontal">
            <div class="block-title">(HORIZONTAL)</div>

            <div class="range">
              <span class="label">INI:</span>
              <span class="value">${inicioLimpo}</span>
            </div>

            <div class="range">
              <span class="label">FIM:</span>
              <span class="value">${fimLimpo}</span>
            </div>
          </div>

          <!-- Vertical -->
          <div class="progress-block vertical" id="vertical-progress-block">
            <div class="block-title">(VERTICAL)</div>

            <div class="range">
              <span class="label">INI V:</span>
              <span class="value">${inicioLimpo}</span>
            </div>

            <div class="range">
              <span class="label">FIM V:</span>
              <span class="value">${fimLimpo}</span>
            </div>
          </div>

        </div>

      </div>
    `;

    // 🚀 CARREGA VERTICAL USANDO NOVO LAYOUT
    if (window.VerticalProgressManager) {
      const vManager = new window.VerticalProgressManager();
      vManager.getLastVerticalProgress(bitCount).then(vData => {
        const vBlock = document.getElementById('vertical-progress-block');
        if (!vBlock) return;

        // 🚀 MOSTRA DIRETO O VALOR (COM OU SEM DADOS DO BANCO)
        // Se não houver registro em puzzle_vertical, usa intervalo padrão 2^n .. 2^(n+1)-1
        const std = calculateStandardRange(BigInt(bitCount));
        const defaultInicio = removeLeadingZeros(std.startHex);
        const defaultFim = removeLeadingZeros(std.endHex);
        const vInicio = vData && vData.inicio ? removeLeadingZeros(vData.inicio) : defaultInicio;
        const vFim = vData && vData.fim ? removeLeadingZeros(vData.fim) : defaultFim;

        vBlock.innerHTML = `
          <div class="block-title">(VERTICAL)</div>

          <div class="range">
            <span class="label">INI V:</span>
            <span class="value">${vInicio}</span>
          </div>

          <div class="range">
            <span class="label">FIM V:</span>
            <span class="value">${vFim}</span>
          </div>
        `;
      }).catch(() => {
        // 🚀 EM CASO DE ERRO, MOSTRA INTERVALO PADRÃO 2^n .. 2^(n+1)-1
        const vBlock = document.getElementById('vertical-progress-block');
        if (vBlock) {
          const std = calculateStandardRange(BigInt(bitCount));
          const defaultInicio = removeLeadingZeros(std.startHex);
          const defaultFim = removeLeadingZeros(std.endHex);
          vBlock.innerHTML = `
            <div class="block-title">(VERTICAL)</div>

            <div class="range">
              <span class="label">INI V:</span>
              <span class="value">${defaultInicio}</span>
            </div>

            <div class="range">
              <span class="label">FIM V:</span>
              <span class="value">${defaultFim}</span>
            </div>
          `;
        }
      });
    }

    setTimeout(async () => {
      try {
        const wifEl = document.getElementById('status-wif-display');
        if (wifEl) {
          wifEl.innerHTML = '';
        }
      } catch (e) { }
    }, 50);
  }

  applyPresetBtn.addEventListener('click', () => {
    const selectedValue = presetBitsInput.options[presetBitsInput.selectedIndex].value;
    if (selectedValue) {
      updateIntervalRanges(selectedValue);
    } else {
      const statusEl = document.getElementById('database-status-section');
      if (statusEl) statusEl.innerHTML = '';
      const hexRange = document.getElementById('hexRange');
      if (hexRange) hexRange.innerHTML = 'Nenhum puzzle selecionado';
      const wifRange = document.getElementById('wifRange');
      if (wifRange) wifRange.innerHTML = '';
      const wifRangeUncompressed = document.getElementById('wifRangeUncompressed');
      if (wifRangeUncompressed) wifRangeUncompressed.innerHTML = '';
    }
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
      const bits = activeCells.length > 0 ? activeCells.length : 70; // Carrega 70 por padrão se vazio
      updateIntervalRanges(bits);
    } else {
      setTimeout(initializeStatus, 100);
    }
  }
  initializeStatus();

  // 🚀 AUTO-LOAD PRESET 71 (VALOR 70) APÓS 0.5 SEGUNDOS
  setTimeout(() => {
    if (presetBitsInput && applyPresetBtn) {
      console.log('🚀 Auto-carregando Puzzle 71...');
      presetBitsInput.value = "70";
      applyPresetBtn.click();
    }
  }, 500);
});
