/**
 * Sistema de Debug Automatizado para Auto16
 * Simula testes automáticos para identificar problemas
 */

(function() {
  'use strict';
  
  // Estado do sistema de debug
  let debugMode = false;
  let testResults = [];
  let currentTest = null;
  
  /**
   * Inicia o modo debug
   */
  function startDebugMode() {
    debugMode = true;
    testResults = [];
    console.log('🔧 DEBUG MODE ATIVADO - Sistema de auto-teste iniciado');
    
    // Cria painel de debug
    createDebugPanel();
    
    // Inicia testes automáticos
    runAutoTests();
  }
  
  /**
   * Para o modo debug
   */
  function stopDebugMode() {
    debugMode = false;
    console.log('🔧 DEBUG MODE DESATIVADO');
    
    // Remove painel de debug
    const panel = document.getElementById('debug-panel');
    if (panel) panel.remove();
  }
  
  /**
   * Cria painel de debug na interface
   */
  function createDebugPanel() {
    // Remove painel existente
    const existing = document.getElementById('debug-panel');
    if (existing) existing.remove();
    
    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 400px;
      max-height: 600px;
      background: #1a1a1a;
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      border: 2px solid #00ff00;
      border-radius: 8px;
      padding: 15px;
      z-index: 10000;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
    `;
    
    panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; color: #00ff00;">🔧 DEBUG AUTO-TEST</h3>
        <button onclick="window.debugAutoTest.stopDebug()" style="background: #ff0000; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">✕</button>
      </div>
      <div id="debug-output" style="background: #000; padding: 10px; border-radius: 4px; min-height: 400px; max-height: 500px; overflow-y: auto;"></div>
      <div style="margin-top: 10px; display: flex; gap: 5px;">
        <button onclick="window.debugAutoTest.runAutoTests()" style="background: #00aa00; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🔄 Rodar Testes</button>
        <button onclick="window.debugAutoTest.clearResults()" style="background: #aa6600; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">🧹 Limpar</button>
        <button onclick="window.debugAutoTest.exportResults()" style="background: #0066aa; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">📋 Exportar</button>
      </div>
    `;
    
    document.body.appendChild(panel);
  }
  
  /**
   * Adiciona mensagem ao painel de debug
   */
  function addDebugMessage(message, type = 'info') {
    const output = document.getElementById('debug-output');
    if (!output) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '#00ff00',
      success: '#00ff88',
      error: '#ff4444',
      warning: '#ffaa00',
      test: '#88aaff'
    };
    
    const div = document.createElement('div');
    div.style.cssText = `color: ${colors[type]}; margin: 2px 0; padding: 2px 0; border-bottom: 1px solid #333;`;
    div.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${message}`;
    
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  }
  
  /**
   * Executa testes automáticos
   */
  async function runAutoTests() {
    if (!debugMode) return;
    
    addDebugMessage('🚀 Iniciando bateria de testes automáticos...', 'test');
    testResults = [];
    
    // Teste 1: Verificar estado do sistema
    await testSystemState();
    
    // Teste 2: Testar modo normal sem preset
    await testNormalMode();
    
    // Teste 3: Testar modo preset
    await testPresetMode();
    
    // Teste 4: Testar células selecionadas manualmente
    await testManualCells();
    
    // Teste 5: Testar sequência vertical/horizontal
    await testSequenceModes();
    
    // Relatório final
    generateTestReport();
    
    addDebugMessage('✅ Bateria de testes concluída!', 'success');
  }
  
  /**
   * Teste 1: Verificar estado do sistema
   */
  async function testSystemState() {
    currentTest = 'Verificação do Sistema';
    addDebugMessage(`📊 ${currentTest}: Iniciando...`, 'info');
    
    const checks = [
      {
        name: 'window.presetManager',
        test: () => window.presetManager !== undefined,
        critical: true
      },
      {
        name: 'window.matrizAPI',
        test: () => window.matrizAPI !== undefined,
        critical: true
      },
      {
        name: 'window.normalMode',
        test: () => window.normalMode !== undefined,
        critical: true
      },
      {
        name: 'window.presetExecutor',
        test: () => window.presetExecutor !== undefined,
        critical: true
      }
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const check of checks) {
      try {
        const result = check.test();
        if (result) {
          addDebugMessage(`  ✅ ${check.name}: OK`, 'success');
          passed++;
        } else {
          addDebugMessage(`  ❌ ${check.name}: FALHOU${check.critical ? ' (CRÍTICO)' : ''}`, 'error');
          failed++;
        }
      } catch (error) {
        addDebugMessage(`  ⚠️ ${check.name}: ERRO - ${error.message}`, 'warning');
        failed++;
      }
    }
    
    testResults.push({
      test: currentTest,
      passed,
      failed,
      total: checks.length,
      status: failed === 0 ? 'success' : (failed > 2 ? 'error' : 'warning')
    });
    
    addDebugMessage(`📊 ${currentTest}: ${passed}/${checks.length} testes passaram`, failed === 0 ? 'success' : 'warning');
  }
  
  /**
   * Teste 2: Modo normal sem preset
   */
  async function testNormalMode() {
    currentTest = 'Modo Normal';
    addDebugMessage(`📊 ${currentTest}: Iniciando...`, 'info');
    
    // Verifica se não há preset ativo
    const hasPreset = window.presetManager && window.presetManager.hasActivePreset();
    
    if (hasPreset) {
      addDebugMessage(`  ⚠️ Pulando teste - preset ativo detectado`, 'warning');
      testResults.push({
        test: currentTest,
        status: 'skipped',
        reason: 'Preset ativo'
      });
      return;
    }
    
    try {
      // Testa obtenção de células ativas
      const activeCells = window.matrizAPI.getActiveCells();
      addDebugMessage(`  ✅ getActiveCells(): ${activeCells.length} células`, 'success');
      
      // Testa modo horizontal
      const horizontalCells = window.matrizAPI.getActiveCells();
      addDebugMessage(`  ✅ Modo Horizontal: ${horizontalCells.length} células`, 'success');
      
      // Testa modo vertical
      const verticalCells = window.matrizAPI.getActiveCellsVertical();
      addDebugMessage(`  ✅ Modo Vertical: ${verticalCells.length} células`, 'success');
      
      testResults.push({
        test: currentTest,
        status: 'success',
        details: `${activeCells.length} células ativas`
      });
      
    } catch (error) {
      addDebugMessage(`  ❌ Erro no modo normal: ${error.message}`, 'error');
      testResults.push({
        test: currentTest,
        status: 'error',
        error: error.message
      });
    }
  }
  
  /**
   * Teste 3: Modo preset
   */
  async function testPresetMode() {
    currentTest = 'Modo Preset';
    addDebugMessage(`📊 ${currentTest}: Iniciando...`, 'info');
    
    // Verifica se há preset ativo
    const hasPreset = window.presetManager && window.presetManager.hasActivePreset();
    
    if (!hasPreset) {
      addDebugMessage(`  ⚠️ Pulando teste - nenhum preset ativo`, 'warning');
      testResults.push({
        test: currentTest,
        status: 'skipped',
        reason: 'Sem preset ativo'
      });
      return;
    }
    
    try {
      // Obtém informações do preset
      const presetBits = window.presetManager.getCurrentBits();
      const presetData = window.presetManager.getCurrentData();
      
      addDebugMessage(`  ✅ Preset ativo: ${presetBits} bits`, 'success');
      
      if (presetData) {
        addDebugMessage(`  ✅ Dados do preset: ${presetData.inicio?.substring(0, 20)}...`, 'success');
      }
      
      // Testa funções do preset executor
      const isRunning = window.presetExecutor.isRunning();
      addDebugMessage(`  ✅ Estado do executor: ${isRunning ? 'rodando' : 'parado'}`, 'success');
      
      testResults.push({
        test: currentTest,
        status: 'success',
        details: `${presetBits} bits, executor: ${isRunning ? 'ativo' : 'inativo'}`
      });
      
    } catch (error) {
      addDebugMessage(`  ❌ Erro no modo preset: ${error.message}`, 'error');
      testResults.push({
        test: currentTest,
        status: 'error',
        error: error.message
      });
    }
  }
  
  /**
   * Teste 4: Células selecionadas manualmente
   */
  async function testManualCells() {
    currentTest = 'Células Manuais';
    addDebugMessage(`📊 ${currentTest}: Iniciando...`, 'info');
    
    try {
      // Obtém células selecionadas
      const selectedCells = window.matrizAPI.getSelectedCells();
      addDebugMessage(`  ✅ Células selecionadas: ${selectedCells.length}`, 'success');
      
      if (selectedCells.length > 0) {
        addDebugMessage(`  📋 Células: ${selectedCells.map(c => `L${c.row+1}xC${c.col+1}`).join(', ')}`, 'info');
        
        // Verifica se estão no range ativo
        const range = window.matrizAPI.getRange();
        const outOfRange = selectedCells.filter(cell => 
          cell.row < range.altura - 1 || cell.row >= range.base
        );
        
        addDebugMessage(`  ✅ Fora do range: ${outOfRange.length} células`, 'success');
      }
      
      testResults.push({
        test: currentTest,
        status: 'success',
        details: `${selectedCells.length} células selecionadas`
      });
      
    } catch (error) {
      addDebugMessage(`  ❌ Erro ao testar células manuais: ${error.message}`, 'error');
      testResults.push({
        test: currentTest,
        status: 'error',
        error: error.message
      });
    }
  }
  
  /**
   * Teste 5: Modos de sequência
   */
  async function testSequenceModes() {
    currentTest = 'Modos de Sequência';
    addDebugMessage(`📊 ${currentTest}: Iniciando...`, 'info');
    
    try {
      // Testa ordenação horizontal
      const horizontalCells = window.matrizAPI.getActiveCells();
      const horizontalSorted = [...horizontalCells].sort((a, b) => {
        if (a.row !== b.row) return b.row - a.row; // L16 → L1
        return b.col - a.col; // C16 → C1
      });
      
      addDebugMessage(`  ✅ Ordenação Horizontal: ${horizontalSorted.length} células`, 'success');
      addDebugMessage(`  📋 Primeira: L${horizontalSorted[0]?.row+1}xC${horizontalSorted[0]?.col+1}`, 'info');
      addDebugMessage(`  📋 Última: L${horizontalSorted[horizontalSorted.length-1]?.row+1}xC${horizontalSorted[horizontalSorted.length-1]?.col+1}`, 'info');
      
      // Testa ordenação vertical
      const verticalCells = window.matrizAPI.getActiveCellsVertical();
      const verticalSorted = [...verticalCells].sort((a, b) => {
        if (a.col !== b.col) return b.col - a.col; // C16 → C1
        return a.row - b.row; // L1 → L16
      });
      
      addDebugMessage(`  ✅ Ordenação Vertical: ${verticalSorted.length} células`, 'success');
      addDebugMessage(`  📋 Primeira: L${verticalSorted[0]?.row+1}xC${verticalSorted[0]?.col+1}`, 'info');
      addDebugMessage(`  📋 Última: L${verticalSorted[verticalSorted.length-1]?.row+1}xC${verticalSorted[verticalSorted.length-1]?.col+1}`, 'info');
      
      testResults.push({
        test: currentTest,
        status: 'success',
        details: `Horizontal: ${horizontalSorted.length}, Vertical: ${verticalSorted.length}`
      });
      
    } catch (error) {
      addDebugMessage(`  ❌ Erro nos modos de sequência: ${error.message}`, 'error');
      testResults.push({
        test: currentTest,
        status: 'error',
        error: error.message
      });
    }
  }
  
  /**
   * Gera relatório final dos testes
   */
  function generateTestReport() {
    addDebugMessage('📋 RELATÓRIO FINAL:', 'test');
    
    const totalTests = testResults.length;
    const passed = testResults.filter(t => t.status === 'success').length;
    const failed = testResults.filter(t => t.status === 'error').length;
    const warnings = testResults.filter(t => t.status === 'warning').length;
    const skipped = testResults.filter(t => t.status === 'skipped').length;
    
    addDebugMessage(`📊 Total: ${totalTests} | ✅ Passaram: ${passed} | ❌ Falharam: ${failed} | ⚠️ Avisos: ${warnings} | ⏭️ Pulados: ${skipped}`, 
      failed === 0 ? 'success' : (failed > 2 ? 'error' : 'warning'));
    
    // Detalhes dos testes
    testResults.forEach(result => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'error' ? '❌' : 
                   result.status === 'warning' ? '⚠️' : '⏭️';
      
      addDebugMessage(`  ${icon} ${result.test}: ${result.details || result.reason || result.error || 'OK'}`, 
        result.status === 'success' ? 'success' : result.status);
    });
    
    // Recomendações
    if (failed > 0) {
      addDebugMessage('🔧 RECOMENDAÇÕES:', 'warning');
      addDebugMessage('  • Verifique os erros críticos primeiro', 'warning');
      addDebugMessage('  • Certifique-se de que todos os scripts foram carregados', 'warning');
      addDebugMessage('  • Verifique o console do navegador para detalhes', 'warning');
    } else if (warnings > 0) {
      addDebugMessage('💡 SUGESTÕES:', 'info');
      addDebugMessage('  • Alguns componentes podem precisar de atenção', 'info');
      addDebugMessage('  • Verifique se o comportamento é o esperado', 'info');
    } else {
      addDebugMessage('🎉 SISTEMA FUNCIONANDO PERFEITAMENTE!', 'success');
    }
  }
  
  /**
   * Limpa resultados dos testes
   */
  function clearResults() {
    const output = document.getElementById('debug-output');
    if (output) {
      output.innerHTML = '';
    }
    testResults = [];
    addDebugMessage('🧹 Resultados limpos', 'info');
  }
  
  /**
   * Exporta resultados para CSV
   */
  function exportResults() {
    if (testResults.length === 0) {
      addDebugMessage('⚠️ Nenhum resultado para exportar', 'warning');
      return;
    }
    
    let csv = 'Teste,Status,Detalheses,Erro\n';
    testResults.forEach(result => {
      csv += `"${result.test}","${result.status}","${result.details || result.reason || ''}","${result.error || ''}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    addDebugMessage('📋 Resultados exportados', 'success');
  }
  
  // API pública
  window.debugAutoTest = {
    start: startDebugMode,
    stop: stopDebugMode,
    run: runAutoTests,
    runAutoTests: runAutoTests,  // Adicionado para compatibilidade
    clear: clearResults,
    clearResults: clearResults,  // Adicionado para compatibilidade
    export: exportResults,
    exportResults: exportResults,  // Adicionado para compatibilidade
    addMessage: addDebugMessage,
    getResults: () => testResults
  };
  
  // Atalho global
  window.startDebug = startDebugMode;
  window.stopDebug = stopDebugMode;
  
  // Auto-inicia se detectado parâmetro debug
  if (window.location.search.includes('debug=true')) {
    setTimeout(startDebugMode, 2000);
  }
  
  console.log('🔧 Debug Auto-Test carregado. Use window.startDebug() para ativar');
  
})();
