/**
 * EXEMPLOS DE USO - PUZZLE FINDER
 * =================================
 * Demonstra como registrar e buscar puzzles encontrados
 */

// ============================================
// EXEMPLO 1: REGISTRAR PUZZLE ENCONTRADO
// ============================================
async function exampleRegisterPuzzle() {
  try {
    const puzzleData = {
      preset: 70,
      hexPrivateKey: '4000000000000000a9',
      wifCompressed: 'Kz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7uKz7u',
      wifUncompressed: '5Hz7uHz7uHz7uHz7uHz7uHz7uHz7uHz7uHz7uHz7uHz7uHz7uHz7uHz7uHz7uHz7u',
      addressCompressed: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      addressUncompressed: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      mode: 'horizontal',
      bits: 70,
      matrixCoordinates: { row: 0, col: 0 },
      processingTimeMs: 15000,
      linesProcessed: 50000
    };
    
    const result = await window.PuzzleFinder.register(puzzleData);
    console.log('✅ Puzzle registrado:', result);
    
  } catch (error) {
    console.error('❌ Erro ao registrar puzzle:', error);
  }
}

// ============================================
// EXEMPLO 2: BUSCAR TODOS OS PUZZLES
// ============================================
async function exampleGetAllPuzzles() {
  try {
    const result = await window.PuzzleFinder.findAll({
      limit: 10,
      orderBy: 'discovery_timestamp',
      order: 'desc'
    });
    
    console.log('📊 Puzzles encontrados:', result.data);
    
  } catch (error) {
    console.error('❌ Erro ao buscar puzzles:', error);
  }
}

// ============================================
// EXEMPLO 3: BUSCAR PUZZLES DE UM PRESET ESPECÍFICO
// ============================================
async function exampleGetPuzzlesByPreset(preset) {
  try {
    const result = await window.PuzzleFinder.findAll({
      preset: preset,
      limit: 20,
      orderBy: 'discovery_timestamp',
      order: 'desc'
    });
    
    console.log(`📊 Puzzles do preset ${preset}:`, result.data);
    
  } catch (error) {
    console.error('❌ Erro ao buscar puzzles do preset:', error);
  }
}

// ============================================
// EXEMPLO 4: VERIFICAR SE PUZZLE JÁ FOI ENCONTRADO
// ============================================
async function exampleCheckDuplicate(hexKey, mode) {
  try {
    const isDuplicate = await window.PuzzleFinder.checkDuplicate(hexKey, mode);
    
    if (isDuplicate) {
      console.log('⚠️ Puzzle já foi encontrado anteriormente');
    } else {
      console.log('✅ Puzzle é novo e pode ser registrado');
    }
    
    return isDuplicate;
    
  } catch (error) {
    console.error('❌ Erro ao verificar duplicidade:', error);
    return false;
  }
}

// ============================================
// EXEMPLO 5: OBTER ESTATÍSTICAS
// ============================================
async function exampleGetStats() {
  try {
    const result = await window.PuzzleFinder.getStats();
    
    console.log('📈 Estatísticas de descobertas:');
    console.log(`Total: ${result.stats.total}`);
    console.log(`Horizontal: ${result.stats.horizontal}`);
    console.log(`Vertical: ${result.stats.vertical}`);
    console.log('Por preset:', result.stats.presets);
    
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
  }
}

// ============================================
// EXEMPLO 6: INTEGRAR COM PROCESSAMENTO EXISTENTE
// ============================================
async function integrateWithProcessing(hexKey, mode, processingInfo) {
  try {
    // 1. Verifica se já foi encontrado
    const isDuplicate = await window.PuzzleFinder.checkDuplicate(hexKey, mode);
    if (isDuplicate) {
      console.log('⚠️ Puzzle já registrado, ignorando...');
      return false;
    }
    
    // 2. Converte hex para WIF (usando funções existentes)
    const wifCompressed = await toWIF(hexKey, true);
    const wifUncompressed = await toWIF(hexKey, false);
    
    // 3. Gera endereços (se tiver função disponível)
    let addressCompressed = null;
    let addressUncompressed = null;
    
    try {
      // Se tiver função de gerar endereço
      if (window.generateBitcoinAddress) {
        addressCompressed = await window.generateBitcoinAddress(hexKey, true);
        addressUncompressed = await window.generateBitcoinAddress(hexKey, false);
      }
    } catch (e) {
      console.warn('⚠️ Não foi possível gerar endereços:', e);
    }
    
    // 4. Registra o puzzle
    const puzzleData = {
      preset: processingInfo.preset || 70,
      hexPrivateKey: hexKey,
      wifCompressed: wifCompressed,
      wifUncompressed: wifUncompressed,
      addressCompressed: addressCompressed,
      addressUncompressed: addressUncompressed,
      mode: mode,
      bits: processingInfo.bits || processingInfo.preset,
      matrixCoordinates: processingInfo.coordinates || null,
      processingTimeMs: processingInfo.processingTime || null,
      linesProcessed: processingInfo.linesProcessed || null
    };
    
    const result = await window.PuzzleFinder.register(puzzleData);
    
    // 5. Mostra notificação
    showNotification('🎉 PUZZLE ENCONTRADO!', {
      preset: puzzleData.preset,
      mode: puzzleData.mode,
      wif: wifCompressed.substring(0, 8) + '...',
      address: addressCompressed
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro ao integrar puzzle encontrado:', error);
    throw error;
  }
}

// ============================================
// EXEMPLO 7: INTERFACE DE USUÁRIO
// ============================================
function showNotification(title, data) {
  // Determina tipo e cor baseada no título ou dados
  let bgColor, borderColor, icon;
  
  if (title.includes('🎉') || title.includes('PUZZLE ENCONTRADO')) {
    bgColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    borderColor = '#667eea';
    icon = '🎉';
  } else if (title.includes('⚠️') || (data.type && data.type === 'warning')) {
    bgColor = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    borderColor = '#f5576c';
    icon = '⚠️';
  } else if (title.includes('❌') || title.includes('Erro')) {
    bgColor = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
    borderColor = '#ff6b6b';
    icon = '❌';
  } else {
    bgColor = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
    borderColor = '#4facfe';
    icon = 'ℹ️';
  }
  
  // Cria modal de notificação
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${bgColor};
    color: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 10000;
    max-width: 400px;
    font-family: monospace;
    border: 2px solid ${borderColor};
    animation: slideInRight 0.3s ease-out;
  `;
  
  // Constrói conteúdo baseado nos dados
  let content = `<div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">${icon} ${title}</div>`;
  
  if (typeof data === 'object' && data !== null) {
    content += '<div style="font-size: 12px; line-height: 1.5;">';
    
    if (data.preset) content += `<div>Preset: <strong>${data.preset}</strong></div>`;
    if (data.mode) content += `<div>Modo: <strong>${data.mode}</strong></div>`;
    if (data.wif) content += `<div>WIF: <strong>${data.wif}</strong></div>`;
    if (data.address) content += `<div>Address: <strong>${data.address.substring(0, 10)}...</strong></div>`;
    if (data.message) content += `<div style="margin-top: 5px;">${data.message}</div>`;
    if (data.error) content += `<div style="margin-top: 5px; opacity: 0.9;">${data.error}</div>`;
    
    content += '</div>';
  } else {
    content += `<div style="font-size: 12px;">${data}</div>`;
  }
  
  modal.innerHTML = content + `
    <button onclick="this.parentElement.remove()" style="
      margin-top: 15px;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    ">Fechar</button>
  `;
  
  // Adiciona animação CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(modal);
  
  // Remove automaticamente após 10 segundos
  setTimeout(() => {
    if (modal.parentElement) {
      modal.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => modal.remove(), 300);
    }
  }, 10000);
}

// ============================================
// EXEMPLO 8: ESCUTAR EVENTOS
// ============================================
function setupEventListeners() {
  // Escuta quando um puzzle é encontrado
  window.addEventListener('puzzleFound', (event) => {
    const puzzleData = event.detail;
    console.log('🎉 Evento: Puzzle encontrado!', puzzleData);
    
    // Pode fazer ações adicionais aqui
    // - Atualizar UI
    // - Enviar notificações
    // - Salvar em cache local
  });
  
  // Escuta erros ao registrar puzzle
  window.addEventListener('puzzleFoundError', (event) => {
    const { error, puzzleData } = event.detail;
    console.error('❌ Evento: Erro ao registrar puzzle', error, puzzleData);
    
    // Mostra erro para usuário
    showNotification('❌ Erro ao registrar puzzle', { error: error });
  });
  
  // 🚀 ESCUTA DUPLICATAS - DESATIVADO (CONFORME SOLICITADO)
  /*
  window.addEventListener('puzzleFoundDuplicate', (event) => {
    const { hexKey, mode, preset } = event.detail;
    console.log('⚠️ Evento: Puzzle duplicado ignorado', {
      hexKey: hexKey.substring(0, 8) + '...',
      mode: mode,
      preset: preset
    });
    
    // Mostra aviso amigável para usuário
    showNotification('⚠️ Puzzle já encontrado', {
      message: `Chave ${hexKey.substring(0, 8)}... já foi registrada anteriormente`,
      type: 'warning'
    });
  });
  */
}

// ============================================
// EXEMPLO 9: FUNÇÃO CONVENIENTE PARA REGISTRO RÁPIDO
// ============================================
async function quickRegisterPuzzle(hexKey, mode, preset = 70) {
  try {
    // Validação básica
    if (!window.PuzzleFinder.validateHexPrivateKey(hexKey)) {
      throw new Error('Chave privada inválida');
    }
    
    // Converte para WIF
    const wifCompressed = await toWIF(hexKey, true);
    const wifUncompressed = await toWIF(hexKey, false);
    
    // Registra
    const result = await window.PuzzleFinder.register({
      preset: preset,
      hexPrivateKey: hexKey,
      wifCompressed: wifCompressed,
      wifUncompressed: wifUncompressed,
      mode: mode,
      bits: preset
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro no registro rápido:', error);
    throw error;
  }
}

// ============================================
// EXPORTAÇÃO DE EXEMPLOS
// ============================================
window.PuzzleFinderExamples = {
  registerPuzzle: exampleRegisterPuzzle,
  getAllPuzzles: exampleGetAllPuzzles,
  getPuzzlesByPreset: exampleGetPuzzlesByPreset,
  checkDuplicate: exampleCheckDuplicate,
  getStats: exampleGetStats,
  integrateWithProcessing: integrateWithProcessing,
  quickRegister: quickRegisterPuzzle,
  setupEventListeners: setupEventListeners
};

// Configura listeners automaticamente
setupEventListeners();

console.log('✅ Exemplos do Puzzle Finder carregados. Use window.PuzzleFinderExamples');
