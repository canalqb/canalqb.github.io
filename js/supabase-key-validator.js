/**
 * ========================================================================
 * SUPABASE KEY VALIDATOR - VALIDAÇÃO DE CHAVES SUPABASE
 * ========================================================================
 * Ferramenta para validar e testar chaves do Supabase
 */

class SupabaseKeyValidator {
  constructor() {
    this.validationResults = {
      url: false,
      key: false,
      format: false,
      connection: false
    };
    this.init();
  }

  /**
   * Inicializa o validador
   */
  init() {
    console.log('🔑 Supabase Key Validator inicializado');
    
    // Aguarda um pouco para os scripts carregarem
    setTimeout(() => {
      this.validateAll();
    }, 1000);
  }

  /**
   * Valida todos os aspectos das chaves
   */
  async validateAll() {
    console.log('🔍 Iniciando validação completa das chaves...');
    
    // Valida URL
    this.validateURL();
    
    // Valida chave
    this.validateKey();
    
    // Valida formato
    this.validateFormat();
    
    // Testa conexão
    await this.testConnection();
    
    // Exibe resultados
    this.displayResults();
  }

  /**
   * Valida a URL do Supabase
   */
  validateURL() {
    const url = this.getSupabaseURL();
    
    if (!url) {
      console.log('❌ URL do Supabase não encontrada');
      this.validationResults.url = false;
      return;
    }
    
    // Verifica formato da URL
    const urlPattern = /^https:\/\/[a-zA-Z0-9.-]+\.supabase\.co$/;
    const isValidFormat = urlPattern.test(url);
    
    if (isValidFormat) {
      console.log('✅ URL do Supabase válida:', url);
      this.validationResults.url = true;
    } else {
      console.log('❌ URL do Supabase inválida:', url);
      this.validationResults.url = false;
    }
  }

  /**
   * Valida a chave do Supabase
   */
  validateKey() {
    const key = this.getSupabaseKey();
    
    if (!key) {
      console.log('❌ Chave do Supabase não encontrada');
      this.validationResults.key = false;
      return;
    }
    
    // Verifica se é uma chave publishable (começa com sb_publishable_)
    const isPublishable = key.startsWith('sb_publishable_');
    
    // Verifica se é uma chave JWT (começa com eyJ)
    const isJWT = key.startsWith('eyJ');
    
    if (isPublishable) {
      console.log('✅ Chave do Supabase (publishable) encontrada');
      this.validationResults.key = true;
      this.validationResults.format = true;
    } else if (isJWT) {
      console.log('✅ Chave do Supabase (JWT) encontrada');
      this.validationResults.key = true;
      
      // Tenta decodificar o JWT para validar
      this.validateJWT(key);
    } else {
      console.log('❌ Formato de chave desconhecido:', key.substring(0, 20) + '...');
      console.log('💡 Use sb_publishable_ ou eyJ (JWT)');
      this.validationResults.key = false;
      this.validationResults.format = false;
    }
  }

  /**
   * Valida o formato JWT
   */
  validateJWT(key) {
    try {
      // Divide o JWT em partes
      const parts = key.split('.');
      if (parts.length !== 3) {
        console.log('❌ JWT inválido: não tem 3 partes');
        this.validationResults.format = false;
        return;
      }
      
      // Tenta decodificar o payload (parte do meio)
      const payload = JSON.parse(atob(parts[1]));
      
      // Verifica se o payload tem os campos esperados
      const hasRequiredFields = payload.iss && payload.aud && payload.exp;
      
      if (hasRequiredFields) {
        console.log('✅ JWT válido e bem formatado');
        console.log('📅 Expira em:', new Date(payload.exp * 1000).toLocaleString());
        console.log('🏢 Emissor:', payload.iss);
        console.log('👥 Audiência:', payload.aud);
        
        this.validationResults.format = true;
      } else {
        console.log('❌ JWT mal formatado: campos obrigatórios faltando');
        this.validationResults.format = false;
      }
      
    } catch (error) {
      console.log('❌ Erro ao decodificar JWT:', error.message);
      this.validationResults.format = false;
    }
  }

  /**
   * Valida o formato geral
   */
  validateFormat() {
    const url = this.getSupabaseURL();
    const key = this.getSupabaseKey();
    
    if (url && key && this.validationResults.format) {
      console.log('✅ Formato geral válido');
      this.validationResults.format = true;
    } else {
      console.log('❌ Formato geral inválido');
      this.validationResults.format = false;
    }
  }

  /**
   * Testa a conexão com o Supabase
   */
  async testConnection() {
    const url = this.getSupabaseURL();
    const key = this.getSupabaseKey();
    
    if (!url || !key) {
      console.log('❌ Não é possível testar conexão: URL ou chave ausentes');
      this.validationResults.connection = false;
      return;
    }
    
    try {
      console.log('🔌 Testando conexão com Supabase...');
      
      // Faz uma requisição simples para testar
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Conexão com Supabase estabelecida com sucesso');
        this.validationResults.connection = true;
      } else {
        console.log('❌ Erro na conexão:', response.status, response.statusText);
        
        if (response.status === 401) {
          console.log('🔑 Erro 401: Chave inválida ou expirada');
          console.log('💡 Verifique se a chave está correta no dashboard do Supabase');
        } else if (response.status === 403) {
          console.log('🚫 Erro 403: Permissão negada');
          console.log('💡 Verifique as permissões da chave no Supabase');
        }
        
        this.validationResults.connection = false;
      }
      
    } catch (error) {
      console.log('❌ Erro ao testar conexão:', error.message);
      this.validationResults.connection = false;
    }
  }

  /**
   * Obtém a URL do Supabase
   */
  getSupabaseURL() {
    // Tenta várias fontes
    if (window.SUPABASE_URL) return window.SUPABASE_URL;
    if (window.ConfigManager) {
      const config = window.ConfigManager.getConfig();
      if (config && config.supabase && config.supabase.url) {
        return config.supabase.url;
      }
    }
    if (window.GitHubSecrets) {
      const secrets = window.GitHubSecrets.getSecrets();
      if (secrets && secrets.SUPABASE_URL) {
        return secrets.SUPABASE_URL;
      }
    }
    return null;
  }

  /**
   * Obtém a chave do Supabase
   */
  getSupabaseKey() {
    // Tenta várias fontes
    if (window.SUPABASE_KEY) return window.SUPABASE_KEY;
    if (window.ConfigManager) {
      const config = window.ConfigManager.getConfig();
      if (config && config.supabase && config.supabase.anonKey) {
        return config.supabase.anonKey;
      }
    }
    if (window.GitHubSecrets) {
      const secrets = window.GitHubSecrets.getSecrets();
      if (secrets && secrets.SUPABASE_KEY) {
        return secrets.SUPABASE_KEY;
      }
    }
    return null;
  }

  /**
   * Exibe os resultados da validação
   */
  displayResults() {
    console.log('\n📋 RESULTADOS DA VALIDAÇÃO');
    console.log('='.repeat(50));
    
    console.log(`🌐 URL: ${this.validationResults.url ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    console.log(`🔑 Chave: ${this.validationResults.key ? '✅ VÁLIDA' : '❌ INVÁLIDA'}`);
    console.log(`📝 Formato: ${this.validationResults.format ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
    console.log(`🔌 Conexão: ${this.validationResults.connection ? '✅ FUNCIONANDO' : '❌ FALHOU'}`);
    
    const passed = Object.values(this.validationResults).filter(v => v === true).length;
    const total = Object.keys(this.validationResults).length;
    
    console.log(`\n📊 RESUMO: ${passed}/${total} validações passaram`);
    
    // Cria relatório visual
    this.createValidationReport();
  }

  /**
   * Cria um relatório visual
   */
  createValidationReport() {
    const report = document.createElement('div');
    report.id = 'supabase-validation-report';
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
      max-width: 600px;
      font-family: monospace;
      font-size: 14px;
    `;
    
    const passed = Object.values(this.validationResults).filter(v => v === true).length;
    const total = Object.keys(this.validationResults).length;
    const status = passed === total ? '🎉 PERFEITO' : '⚠️ PROBLEMAS';
    const statusColor = passed === total ? '#28a745' : '#ffc107';
    
    report.innerHTML = `
      <div style="text-align: center; margin-bottom: 15px;">
        <h3 style="margin: 0; color: #333;">🔑 VALIDAÇÃO SUPABASE</h3>
        <div style="font-size: 18px; font-weight: bold; color: ${statusColor};">
          ${status}
        </div>
        <div style="color: #666;">${passed}/${total} validações passaram</div>
      </div>
      
      <div style="border-top: 1px solid #ddd; padding-top: 15px;">
        <div><strong>🌐 URL:</strong> ${this.validationResults.url ? '✅ Válida' : '❌ Inválida'}</div>
        <div><strong>🔑 Chave:</strong> ${this.validationResults.key ? '✅ Válida' : '❌ Inválida'}</div>
        <div><strong>📝 Formato:</strong> ${this.validationResults.format ? '✅ JWT OK' : '❌ JWT Erro'}</div>
        <div><strong>🔌 Conexão:</strong> ${this.validationResults.connection ? '✅ Funcionando' : '❌ Falhou'}</div>
      </div>
      
      ${!this.validationResults.connection ? `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 10px; margin-top: 15px; border-radius: 5px;">
          <strong>💡 SOLUÇÃO:</strong><br>
          ${this.validationResults.key ? 'A chave JWT está correta, mas pode estar expirada.' : 'Use a chave JWT completa do dashboard do Supabase.'}<br>
          <small>Acesse: <code>https://supabase.com/dashboard/project/dhpzusdynwpnsejnlzvf/settings/api-keys</code></small>
        </div>
      ` : ''}
      
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
    
    // Remove automaticamente após 15 segundos
    setTimeout(() => {
      if (report.parentNode) {
        report.remove();
      }
    }, 15000);
  }

  /**
   * Gera a chave correta para cópia
   */
  static generateCorrectKey() {
    const correctKey = 'sb_publishable_CzrMyXDeFQmd1cTZ4Uls3A_l83xJJsa';
    
    console.log('🔑 Chave Supabase correta gerada:');
    console.log(correctKey);
    console.log('📋 Copie e cole esta chave nos secrets do GitHub Actions');
    
    // Copia para o clipboard
    navigator.clipboard.writeText(correctKey).then(() => {
      console.log('✅ Chave copiada para o clipboard!');
    }).catch(() => {
      console.log('⚠️ Não foi possível copiar automaticamente');
    });
    
    return correctKey;
  }
}

// Instância global
window.supabaseKeyValidator = new SupabaseKeyValidator();

// API pública
window.SupabaseValidator = {
  validateAll: () => window.supabaseKeyValidator.validateAll(),
  getResults: () => window.supabaseKeyValidator.validationResults,
  generateKey: () => SupabaseKeyValidator.generateCorrectKey()
};

console.log('🔑 Supabase Key Validator API disponível globalmente');
