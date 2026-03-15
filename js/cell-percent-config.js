/**
 * CELL PERCENT CONFIG - VERSÃO SIMPLIFICADA
 * Textboxes numéricos com alta precisão
 */

(function() {
  'use strict';
  
  try {
    console.log('🚀 INICIANDO CELL PERCENT CONFIG');
    console.log('📄 document.readyState:', document.readyState);
    console.log('📄 window.location:', window.location.href);
    
    // Aguarda DOM carregar completamente
    if (document.readyState === 'loading') {
      console.log('⏳ Aguardando DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', init);
    } else {
      console.log('✅ DOM já carregado, aguardando 200ms...');
      setTimeout(init, 200); // Aguarda 200ms se já estiver carregado
    }
  } catch (error) {
    console.error('💥 ERRO CRÍTICO NO CELL PERCENT CONFIG:', error);
    console.error('Stack:', error.stack);
  }
  
  function init() {
    try {
      console.log('\n✅ INICIANDO FUNÇÃO init()');
      console.log('📍 document.querySelector(.speed-row):', document.querySelector('.speed-row'));
      
      // Encontrar seção de velocidade
      const speedRow = document.querySelector('.speed-row');
      console.log('📍 Speed row encontrada:', speedRow ? 'SIM' : 'NÃO');
      
      if (!speedRow) {
        console.error('❌ ERRO: .speed-row não encontrado!');
        console.log('🔍 Procurando por outras classes...');
        console.log('  .control-card:', document.querySelector('.control-card'));
        console.log('  #speed:', document.getElementById('speed'));
        console.log('  .speed-label:', document.querySelector('.speed-label'));
        return;
      }
    
    // Criar container principal
    const configDiv = document.createElement('div');
    configDiv.className = 'percent-config-row';
    configDiv.style.cssText = 'margin-top:15px;padding:15px;background:rgba(72,187,120,0.1);border:2px solid #48bb78;border-radius:8px;';
    
    // HTML interno
    configDiv.innerHTML = `
      <h4 style="margin-bottom:15px;font-size:14px;color:#48bb78;">
        <i class="fas fa-percentage"></i> Configuração de Células (Precisão Alta)
      </h4>
      
      <div style="margin-bottom:15px;">
        <label style="display:block;margin-bottom:5px;font-size:13px;font-weight:bold;">
          <i class="fas fa-arrow-down"></i> Mínimo (%):
        </label>
        <input type="text" id="minCellPercentInput" value="0.001" 
          style="width:100%;padding:8px;font-size:14px;border:2px solid #48bb78;border-radius:4px;font-family:monospace;">
        <small style="opacity:0.7;display:block;margin-top:5px;">Horizontal | Precisão: 16+ casas</small>
      </div>
      
      <div>
        <label style="display:block;margin-bottom:5px;font-size:13px;font-weight:bold;">
          <i class="fas fa-arrow-up"></i> Máximo (%):
        </label>
        <input type="text" id="maxCellPercentInput" value="99.999" 
          style="width:100%;padding:8px;font-size:14px;border:2px solid #63b3ed;border-radius:4px;font-family:monospace;">
        <small style="opacity:0.7;display:block;margin-top:5px;">Vertical | Precisão: 16+ casas</small>
      </div>
      
      <div style="margin-top:15px;padding:10px;background:rgba(0,0,0,0.2);border-radius:4px;font-size:12px;">
        <strong>Exemplos:</strong> 1 | 0.01 | 0.000000000001 | 0.0000000000000001
      </div>
    `;
    
    // Inserir no DOM
    speedRow.parentNode.insertBefore(configDiv, speedRow.nextSibling);
    console.log('✅ Container inserido no DOM');
    
    // Pegar referências dos inputs
    const minInput = document.getElementById('minCellPercentInput');
    const maxInput = document.getElementById('maxCellPercentInput');
    
    console.log('📝 Inputs:', minInput, maxInput);
    
    if (!minInput || !maxInput) {
      console.error('❌ ERRO: Inputs não encontrados!');
      return;
    }
    
    // Configurar evento change - MÍNIMO
    console.log('🔧 Configurando listener para Mínimo...');
    minInput.addEventListener('change', function() {
      console.log('\n🔄 ========= CHANGE MÍNIMO DISPARADO =========');
      console.log('📝 Valor no campo:', this.value);
      const val = parseFloat(this.value);
      console.log('🔍 Após parseFloat:', val);
      console.log('isNaN?', isNaN(val), 'val <= 0?', val <= 0);
      
      if (isNaN(val) || val <= 0) {
        console.error('❌ Valor INVÁLIDO detectado!', val);
        this.value = '0.001';
        window.minCellPercent = 0.001;
        console.log('⚠️ Restaurado valor padrão: 0.001');
        return;
      }
      
      window.minCellPercent = val;
      console.log(`✅ window.minCellPercent ATUALIZADO: ${val}`);
      console.log(`   Tipo: ${typeof window.minCellPercent}`);
      console.log(`   String: ${window.minCellPercent.toString()}`);
      
      // Testar conversão imediatamente
      const cells = testConvertToCells(val);
      console.log(`🎯 Conversão: ${val}% → ${cells} células`);
      console.log('🔄 ==========================================\n');
    });
    
    // Configurar evento change - MÁXIMO
    console.log('🔧 Configurando listener para Máximo...');
    maxInput.addEventListener('change', function() {
      console.log('\n🔄 ========= CHANGE MÁXIMO DISPARADO =========');
      console.log('📝 Valor no campo:', this.value);
      const val = parseFloat(this.value);
      console.log('🔍 Após parseFloat:', val);
      console.log('isNaN?', isNaN(val), 'val <= 0?', val <= 0, 'val > 100?', val > 100);
      
      if (isNaN(val) || val <= 0 || val > 100) {
        console.error('❌ Valor INVÁLIDO detectado!', val);
        this.value = '99.999';
        window.maxCellPercent = 99.999;
        console.log('⚠️ Restaurado valor padrão: 99.999');
        return;
      }
      
      window.maxCellPercent = val;
      console.log(`✅ window.maxCellPercent ATUALIZADO: ${val}`);
      console.log(`   Tipo: ${typeof window.maxCellPercent}`);
      console.log(`   String: ${window.maxCellPercent.toString()}`);
      
      // Testar conversão
      const cells = testConvertToCells(val);
      console.log(`🎯 Conversão: ${val}% → ${cells} células`);
      console.log('🔄 ==========================================\n');
    });
    
    // Configurar Enter
    [minInput, maxInput].forEach(input => {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          console.log('⌨️ ENTER pressionado!');
          e.preventDefault();
          this.blur(); // Força evento change
        }
      });
    });
    
    console.log('✅ CONFIGURAÇÃO COMPLETA! Teste digitando e pressionando Enter.');
    } catch (error) {
      console.error('💥 ERRO NA FUNÇÃO init():', error);
      console.error('Stack:', error.stack);
    }
  }
  
  // Função de conversão simplificada
  function testConvertToCells(percent) {
    const minP = 0.0000000000000001;
    const maxP = 100.0;
    const normalized = (percent - minP) / (maxP - minP);
    const cells = Math.floor(normalized * 99) + 1;
    return Math.max(1, Math.min(cells, 99));
  }
  
})();
