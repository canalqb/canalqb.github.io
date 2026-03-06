/**
 * ========================================================================
 * CONFIG TESTER - VERIFICAÇÃO DE CONFIGURAÇÃO
 * ========================================================================
 * Script para testar se a configuração está funcionando corretamente
 */

class ConfigTester {
  constructor() {
    this.results = {
      environment: null,
      configManager: false,
      githubSecrets: false,
      supabase: false,
      backgroundProcessor: false
    };
    this.init();
  }

  /**
   * Inicializa o testador
   */
  init() {
    console.log('🧪 Iniciando testes de configuração...');
    
    // Aguarda um pouco para os scripts carregarem
    setTimeout(() => {
      this.runAllTests();
    }, 2000);
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log('🔍 Executando bateria de testes...');
    
    // Testa ambiente
    this.testEnvironment();
    
    // Testa Config Manager
    this.testConfigManager();
    
    // Testa GitHub Secrets
    this.testGitHubSecrets();
    
    // Testa Supabase
    await this.testSupabase();
    
    // Testa Background Processor
    this.testBackgroundProcessor();
    
    // Exibe resultados
    this.displayResults();
  }

  /**
   * Testa detecção de ambiente
   */
  testEnvironment() {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || 
                   hostname === '127.0.0.1' || 
                   hostname.includes('192.168.') ||
                   hostname.includes('10.') ||
                   hostname.includes('172.');
    
    this.results.environment = {
      hostname,
      isLocal,
      environment: isLocal ? 'development' : 'production'
    };
    
    console.log(`🌐 Ambiente: ${this.results.environment.environment} (${hostname})`);
  }

  /**
   * Testa Config Manager
   */
  testConfigManager() {
    if (window.ConfigManager) {
      this.results.configManager = true;
      
      const config = window.ConfigManager.getSafeConfig();
      console.log('✅ Config Manager disponível');
      console.log('📊 Config:', config);
    } else {
      console.log('❌ Config Manager não disponível');
    }
  }

  /**
   * Testa GitHub Secrets
   */
  testGitHubSecrets() {
    if (window.GitHubSecrets) {
      this.results.githubSecrets = true;
      
      const isGitHubPages = window.GitHubSecrets.isGitHubPages();
      const isAvailable = window.GitHubSecrets.isAvailable();
      const secrets = window.GitHubSecrets.getSecrets();
      
      console.log('✅ GitHub Secrets Loader disponível');
      console.log(`🚀 GitHub Pages: ${isGitHubPages}`);
      console.log(`🔑 Secrets disponíveis: ${isAvailable}`);
      
      if (secrets) {
        console.log('🔗 URL:', secrets.SUPABASE_URL ? '***CONFIGURADO***' : 'NÃO CONFIGURADO');
        console.log('🔐 KEY:', secrets.SUPABASE_KEY ? '***CONFIGURADO***' : 'NÃO CONFIGURADO');
      }
    } else {
      console.log('❌ GitHub Secrets Loader não disponível');
    }
  }

  /**
   * Testa configuração do Supabase
   */
  async testSupabase() {
    try {
      // Verifica se as variáveis globais existem
      const hasGlobalVars = typeof window.SUPABASE_URL !== 'undefined' && 
                           typeof window.SUPABASE_KEY !== 'undefined';
      
      if (hasGlobalVars) {
        console.log('✅ Variáveis globais do Supabase encontradas');
        this.results.supabase = true;
        
        // Testa conexão (apenas se tiver biblioteca)
        if (typeof supabase !== 'undefined') {
          try {
            const client = supabase.createClient(
              window.SUPABASE_URL,
              window.SUPABASE_KEY
            );
            
            // Testa conexão simples
            const { data, error } = await client
              .from('puzzle_progress')
              .select('count')
              .limit(1);
            
            if (error) {
              console.log('⚠️ Supabase conectado mas com erro:', error.message);
            } else {
              console.log('✅ Supabase conectado com sucesso');
            }
          } catch (error) {
            console.log('❌ Erro ao testar conexão Supabase:', error.message);
          }
        } else {
          console.log('⚠️ Biblioteca Supabase não encontrada');
        }
      } else {
        console.log('❌ Variáveis globais do Supabase não encontradas');
        
        // Verifica se está em ambiente local (pode ser normal)
        if (this.results.environment && this.results.environment.isLocal) {
          console.log('ℹ️ Em ambiente local, isso pode ser normal');
        }
      }
    } catch (error) {
      console.error('❌ Erro ao testar Supabase:', error);
    }
  }

  /**
   * Testa Background Processor
   */
  testBackgroundProcessor() {
    if (window.backgroundProcessor) {
      this.results.backgroundProcessor = true;
      
      const state = window.backgroundProcessor.getBackgroundState();
      console.log('✅ Background Processor disponível');
      console.log('📊 Estado:', state);
    } else {
      console.log('❌ Background Processor não disponível');
    }
  }

  /**
   * Exibe resultados completos
   */
  displayResults() {
    console.log('\n📋 RESULTADOS DOS TESTES');
    console.log('='.repeat(50));
    
    // Ambiente
    console.log(`🌐 Ambiente: ${this.results.environment.environment}`);
    console.log(`   Hostname: ${this.results.environment.hostname}`);
    console.log(`   Local: ${this.results.environment.isLocal ? 'SIM' : 'NÃO'}`);
    
    // Config Manager
    console.log(`⚙️ Config Manager: ${this.results.configManager ? '✅ OK' : '❌ FALHOU'}`);
    
    // GitHub Secrets
    console.log(`🔑 GitHub Secrets: ${this.results.githubSecrets ? '✅ OK' : '❌ FALHOU'}`);
    
    // Supabase
    console.log(`🗄️ Supabase: ${this.results.supabase ? '✅ OK' : '❌ FALHOU'}`);
    
    // Background Processor
    console.log(`🔄 Background Processor: ${this.results.backgroundProcessor ? '✅ OK' : '❌ FALHOU'}`);
    
    // Resumo
    const passed = Object.values(this.results).filter(v => v === true).length;
    const total = Object.keys(this.results).length;
    
    console.log(`\n📊 RESUMO: ${passed}/${total} testes passaram`);
    
    if (passed === total) {
      console.log('🎉 Todos os testes passaram! Configuração está perfeita.');
    } else {
      console.log('⚠️ Alguns testes falharam. Verifique os logs acima.');
    }
    
    // Cria relatório visual
    this.createVisualReport();
  }

  /**
   * Cria um relatório visual na página
   */
  createVisualReport() {
    const report = document.createElement('div');
    report.id = 'config-test-report';
    report.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #333;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 500px;
      font-family: monospace;
      font-size: 14px;
    `;
    
    const passed = Object.values(this.results).filter(v => v === true).length;
    const total = Object.keys(this.results).length;
    const status = passed === total ? '🎉 PERFEITO' : '⚠️ ATENÇÃO';
    
    report.innerHTML = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #333;">🧪 TESTE DE CONFIGURAÇÃO</h3>
        <div style="font-size: 18px; font-weight: bold; color: ${passed === total ? '#28a745' : '#ffc107'};">
          ${status}
        </div>
        <div style="color: #666;">${passed}/${total} testes passaram</div>
      </div>
      
      <div style="border-top: 1px solid #ddd; padding-top: 15px;">
        <div><strong>🌐 Ambiente:</strong> ${this.results.environment.environment}</div>
        <div><strong>🔗 Hostname:</strong> ${this.results.environment.hostname}</div>
        <div><strong>⚙️ Config Manager:</strong> ${this.results.configManager ? '✅' : '❌'}</div>
        <div><strong>🔑 GitHub Secrets:</strong> ${this.results.githubSecrets ? '✅' : '❌'}</div>
        <div><strong>🗄️ Supabase:</strong> ${this.results.supabase ? '✅' : '❌'}</div>
        <div><strong>🔄 Background Processor:</strong> ${this.results.backgroundProcessor ? '✅' : '❌'}</div>
      </div>
      
      <div style="text-align: center; margin-top: 15px;">
        <button onclick="this.parentElement.remove()" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">Fechar</button>
      </div>
    `;
    
    document.body.appendChild(report);
    
    // Remove automaticamente após 10 segundos
    setTimeout(() => {
      if (report.parentNode) {
        report.remove();
      }
    }, 10000);
  }

  /**
   * Executa teste específico
   */
  static runTest(testName) {
    const tester = new ConfigTester();
    setTimeout(() => {
      switch(testName) {
        case 'environment':
          tester.testEnvironment();
          break;
        case 'config':
          tester.testConfigManager();
          break;
        case 'secrets':
          tester.testGitHubSecrets();
          break;
        case 'supabase':
          tester.testSupabase();
          break;
        case 'background':
          tester.testBackgroundProcessor();
          break;
        default:
          console.log('❌ Teste não encontrado:', testName);
      }
    }, 1000);
  }
}

// Instância global
window.configTester = new ConfigTester();

// API pública
window.ConfigTester = {
  runAll: () => window.configTester.runAllTests(),
  runTest: (testName) => ConfigTester.runTest(testName),
  getResults: () => window.configTester.results
};

console.log('🧪 Config Tester API disponível globalmente');
