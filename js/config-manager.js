/**
 * ========================================================================
 * CONFIG MANAGER - GERENCIAMENTO SEGURO DE CONFIGURAÇÕES
 * ========================================================================
 * Diferencia entre ambiente XAMPP (localhost) e produção
 * Protege dados sensíveis em ambiente de produção
 */

class ConfigManager {
  constructor() {
    this.isLocal = this.detectLocalEnvironment();
    this.config = this.loadConfig();
    this.init();
  }

  /**
   * Detecta se está rodando em ambiente local (XAMPP)
   */
  detectLocalEnvironment() {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.includes('192.168.') ||
      hostname.includes('10.') ||
      hostname.includes('172.');

    console.log(`🔍 Ambiente detectado: ${isLocal ? 'LOCAL (XAMPP)' : 'PRODUÇÃO'}`);
    console.log(`🌐 Hostname: ${hostname}`);

    return isLocal;
  }

  /**
   * Carrega configurações baseadas no ambiente
   */
  loadConfig() {
    if (this.isLocal) {
      // Configurações para ambiente XAMPP (com dados reais)
      return {
        supabase: {
          url: 'https://dhpzusdynwpnsejnlzvf.supabase.co',
          anonKey: 'sb_publishable_CzrMyXDeFQmd1cTZ4Uls3A_l83xJJsa',
          developmentMode: false  // Desabilitado para economizar memória
        },
        database: {
          host: 'db.dhpzusdynwpnsejnlzvf.supabase.co',
          port: 5432,
          database: 'postgres',
          user: 'postgres',
          connectionString: 'postgresql://postgres:[PASSWORD]@db.dhpzusdynwpnsejnlzvf.supabase.co:5432/postgres'
        },
        features: {
          supabaseEnabled: true,
          debugMode: true,
          localDatabase: true,
          productionMode: false
        },
        logging: {
          enabled: false,  // Desabilitado para economizar memória
          level: 'error',   // Apenas erros críticos
          console: true,
          remote: false
        }
      };
    } else {
      // Configurações para ambiente de produção (GitHub Pages)
      // Tenta carregar dos secrets do GitHub
      const githubSecrets = this.loadGitHubSecrets();

      if (githubSecrets) {
        return {
          supabase: {
            url: githubSecrets.SUPABASE_URL,
            anonKey: githubSecrets.SUPABASE_KEY,
            developmentMode: false,
            source: 'github-secrets'
          },
          database: {
            host: 'db.dhpzusdynwpnsejnlzvf.supabase.co',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            connectionString: null // Não exposto em produção
          },
          features: {
            supabaseEnabled: true,
            debugMode: false,
            localDatabase: false,
            productionMode: true
          },
          logging: {
            level: 'error',
            console: false,
            remote: false
          }
        };
      } else {
        // Sem secrets - modo offline
        return {
          supabase: {
            url: null,
            anonKey: null,
            developmentMode: false,
            source: 'none'
          },
          database: {
            host: null,
            port: null,
            database: null,
            user: null,
            connectionString: null
          },
          features: {
            supabaseEnabled: false,
            debugMode: false,
            localDatabase: false,
            productionMode: true
          },
          logging: {
            level: 'error',
            console: false,
            remote: false
          }
        };
      }
    }
  }

  /**
   * Carrega secrets do GitHub (se disponível)
   */
  loadGitHubSecrets() {
    // Verifica se o GitHub Secrets Loader está disponível
    if (window.GitHubSecrets && window.GitHubSecrets.isAvailable()) {
      const secrets = window.GitHubSecrets.getSecrets();
      console.log('🔑 Secrets do GitHub carregados via Config Manager');
      return secrets;
    }

    // Verifica se as variáveis foram injetadas diretamente
    if (typeof window.SUPABASE_URL !== 'undefined' && typeof window.SUPABASE_KEY !== 'undefined') {
      console.log('🔑 Secrets do GitHub encontrados como variáveis globais');
      return {
        SUPABASE_URL: window.SUPABASE_URL,
        SUPABASE_KEY: window.SUPABASE_KEY
      };
    }

    console.log('🚫 Secrets do GitHub não disponíveis');
    return null;
  }

  /**
   * Inicializa o gerenciador de configurações
   */
  init() {
    // Adiciona informações ao console (apenas em desenvolvimento)
    if (this.isLocal) {
      console.log('🔧 Config Manager: Modo Desenvolvimento (XAMPP)');
      console.log('🗄️ Supabase URL:', this.config.supabase.url);
      console.log('🔑 Supabase Key disponível');
      console.log('🐛 Debug mode: ATIVADO');
    } else {
      console.log('🚀 Config Manager: Modo Produção');
      console.log('🔒 Dados sensíveis protegidos');
      console.log('🛡️ Supabase: DESABILITADO');
    }

    // Dispara evento de configuração carregada
    window.dispatchEvent(new CustomEvent('configLoaded', {
      detail: {
        isLocal: this.isLocal,
        config: this.getSafeConfig()
      }
    }));
  }

  /**
   * Obtém configuração segura (sem dados sensíveis)
   */
  getSafeConfig() {
    return {
      isLocal: this.isLocal,
      environment: this.isLocal ? 'development' : 'production',
      features: this.config.features,
      logging: this.config.logging,
      // Não expõe chaves ou strings de conexão
      supabase: {
        enabled: this.config.supabase.url !== null,
        url: this.config.supabase.url ? '***CONFIGURADO***' : 'NÃO CONFIGURADO'
      }
    };
  }

  /**
   * Obtém configuração completa (apenas em ambiente local)
   */
  getConfig() {
    if (!this.isLocal) {
      console.warn('⚠️ Tentativa de acessar configuração completa em ambiente de produção bloqueada');
      return this.getSafeConfig();
    }
    return this.config;
  }

  /**
   * Obtém configuração do Supabase
   */
  getSupabaseConfig() {
    if (!this.isLocal) {
      console.warn('⚠️ Supabase não disponível em ambiente de produção');
      return null;
    }
    return this.config.supabase;
  }

  /**
   * Verifica se o Supabase está disponível
   */
  isSupabaseAvailable() {
    return this.isLocal && this.config.supabase.url && this.config.supabase.anonKey;
  }

  /**
   * Salva configurações no localStorage (apenas desenvolvimento)
   */
  saveLocalConfig(key, value) {
    if (!this.isLocal) {
      console.warn('⚠️ Salvamento local não permitido em produção');
      return false;
    }

    try {
      const localData = JSON.parse(localStorage.getItem('localConfig') || '{}');
      localData[key] = value;
      localStorage.setItem('localConfig', JSON.stringify(localData));
      console.log(`💾 Configuração local salva: ${key}`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar configuração local:', error);
      return false;
    }
  }

  /**
   * Carrega configurações do localStorage (apenas desenvolvimento)
   */
  loadLocalConfig(key) {
    if (!this.isLocal) {
      console.warn('⚠️ Carregamento local não permitido em produção');
      return null;
    }

    try {
      const localData = JSON.parse(localStorage.getItem('localConfig') || '{}');
      return localData[key] || null;
    } catch (error) {
      console.error('❌ Erro ao carregar configuração local:', error);
      return null;
    }
  }

  /**
   * Limpa configurações locais
   */
  clearLocalConfig() {
    if (!this.isLocal) {
      console.warn('⚠️ Limpeza local não permitida em produção');
      return false;
    }

    try {
      localStorage.removeItem('localConfig');
      console.log('🗑️ Configurações locais limpas');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar configurações locais:', error);
      return false;
    }
  }

  /**
   * Obtém informações do ambiente
   */
  getEnvironmentInfo() {
    return {
      isLocal: this.isLocal,
      environment: this.isLocal ? 'development' : 'production',
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }
}

// Instância global do Config Manager
window.configManager = new ConfigManager();

// API pública
window.ConfigManager = {
  isLocal: () => window.configManager.isLocal,
  getConfig: () => window.configManager.getConfig(),
  getSafeConfig: () => window.configManager.getSafeConfig(),
  getSupabaseConfig: () => window.configManager.getSupabaseConfig(),
  isSupabaseAvailable: () => window.configManager.isSupabaseAvailable(),
  saveLocal: (key, value) => window.configManager.saveLocalConfig(key, value),
  loadLocal: (key) => window.configManager.loadLocalConfig(key),
  clearLocal: () => window.configManager.clearLocalConfig(),
  getEnvironment: () => window.configManager.getEnvironmentInfo()
};

console.log('🔧 Config Manager API disponível globalmente');
