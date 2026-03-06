/**
 * ========================================================================
 * GITHUB SECRETS LOADER - CARREGA CONFIGURAÇÕES DO GITHUB PAGES
 * ========================================================================
 * Carrega secrets do GitHub Pages quando estiver online (produção)
 * Usa variáveis de ambiente injetadas durante o build
 */

class GitHubSecretsLoader {
  constructor() {
    this.isGitHubPages = this.detectGitHubPages();
    this.secrets = {};
    this.loaded = false;
    this.init();
  }

  /**
   * Detecta se está rodando no GitHub Pages
   */
  detectGitHubPages() {
    const hostname = window.location.hostname;
    const isGitHubPages = hostname === 'canalqb.github.io' || 
                        hostname.endsWith('.github.io') ||
                        window.location.origin.includes('github.io');
    
    console.log(`🔍 Ambiente detectado: ${isGitHubPages ? 'GITHUB PAGES' : 'OUTRO'}`);
    console.log(`🌐 Hostname: ${hostname}`);
    
    return isGitHubPages;
  }

  /**
   * Inicializa o carregador de secrets
   */
  init() {
    if (this.isGitHubPages) {
      this.loadGitHubSecrets();
    } else {
      console.log('🔧 Não está no GitHub Pages - usando configuração local');
      this.loaded = true;
    }
  }

  /**
   * Carrega secrets do GitHub Pages
   * Os secrets são injetados como variáveis globais durante o build
   */
  loadGitHubSecrets() {
    console.log('🔑 Carregando secrets do GitHub Pages...');

    // Verifica se os secrets foram injetados
    if (typeof window.SUPABASE_URL !== 'undefined' && typeof window.SUPABASE_KEY !== 'undefined') {
      this.secrets = {
        SUPABASE_URL: window.SUPABASE_URL,
        SUPABASE_KEY: window.SUPABASE_KEY
      };
      
      console.log('✅ Secrets do GitHub Pages carregados com sucesso');
      console.log('🔗 Supabase URL:', this.maskUrl(this.secrets.SUPABASE_URL));
      console.log('🔑 Supabase Key:', this.maskKey(this.secrets.SUPABASE_KEY));
      
      this.loaded = true;
      
      // Dispara evento de secrets carregados
      window.dispatchEvent(new CustomEvent('githubSecretsLoaded', {
        detail: {
          source: 'github-pages',
          url: this.maskUrl(this.secrets.SUPABASE_URL),
          hasKey: !!this.secrets.SUPABASE_KEY
        }
      }));
      
    } else {
      console.warn('⚠️ Secrets do GitHub Pages não encontrados');
      console.log('💡 Configure os secrets no GitHub Actions:');
      console.log('   - SUPABASE_URL: https://dhpzusdynwpnsejnlzvf.supabase.co');
      console.log('   - SUPABASE_KEY: sb_publishable_ZOpNfIGoHpzmx9h53xQSWw_0bf4_xb2');
      
      // Tenta carregar do arquivo de configuração fallback
      this.loadFallbackConfig();
    }
  }

  /**
   * Carrega configuração fallback (para desenvolvimento)
   */
  loadFallbackConfig() {
    console.log('🔄 Tentando carregar configuração fallback...');
    
    // Tenta carregar do arquivo local-config.json
    fetch('/config/local-config.json')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Arquivo de configuração não encontrado');
      })
      .then(config => {
        if (this.isLocalEnvironment()) {
          this.secrets = {
            SUPABASE_URL: config.supabase.url,
            SUPABASE_KEY: config.supabase.anonKey
          };
          
          console.log('✅ Configuração fallback carregada (ambiente local)');
          this.loaded = true;
          
          window.dispatchEvent(new CustomEvent('githubSecretsLoaded', {
            detail: {
              source: 'fallback-local',
              url: this.maskUrl(this.secrets.SUPABASE_URL),
              hasKey: !!this.secrets.SUPABASE_KEY
            }
          }));
        } else {
          console.warn('⚠️ Configuração fallback disponível apenas em ambiente local');
          this.loaded = false;
        }
      })
      .catch(error => {
        console.error('❌ Erro ao carregar configuração fallback:', error);
        this.loaded = false;
        
        // Dispara evento de erro
        window.dispatchEvent(new CustomEvent('githubSecretsError', {
          detail: {
            error: error.message,
            source: 'fallback-load'
          }
        }));
      });
  }

  /**
   * Verifica se está em ambiente local
   */
  isLocalEnvironment() {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname === '0.0.0.0' ||
           hostname.includes('192.168.') ||
           hostname.includes('10.') ||
           hostname.includes('172.');
  }

  /**
   * Mascara URL para log seguro
   */
  maskUrl(url) {
    if (!url) return 'N/A';
    return url.replace(/https?:\/\//, 'https://').substring(0, 30) + '...';
  }

  /**
   * Mascara chave para log seguro
   */
  maskKey(key) {
    if (!key) return 'N/A';
    return key.substring(0, 10) + '...' + key.substring(key.length - 5);
  }

  /**
   * Obtém os secrets carregados
   */
  getSecrets() {
    if (!this.loaded) {
      console.warn('⚠️ Secrets ainda não foram carregados');
      return null;
    }
    
    return this.secrets;
  }

  /**
   * Verifica se os secrets estão disponíveis
   */
  isAvailable() {
    return this.loaded && 
           this.secrets.SUPABASE_URL && 
           this.secrets.SUPABASE_KEY;
  }

  /**
   * Obtém configuração do Supabase
   */
  getSupabaseConfig() {
    if (!this.isAvailable()) {
      return null;
    }
    
    return {
      url: this.secrets.SUPABASE_URL,
      anonKey: this.secrets.SUPABASE_KEY,
      enabled: true
    };
  }

  /**
   * Cria banner informativo no GitHub Pages
   */
  showGitHubPagesBanner() {
    if (!this.isGitHubPages) return;

    const banner = document.createElement('div');
    banner.id = 'github-pages-banner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #0366d6, #24292e);
      color: white;
      padding: 8px 16px;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    
    const status = this.isAvailable() ? '✅ Conectado' : '⚠️ Offline';
    const statusColor = this.isAvailable() ? '#28a745' : '#ffc107';
    
    banner.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
        <span>🚀</span>
        <span>GitHub Pages - Produção</span>
        <span style="color: ${statusColor};">${status}</span>
        <span>•</span>
        <span>Supabase: ${this.isAvailable() ? 'ATIVO' : 'INATIVO'}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 2px 8px; border-radius: 4px; cursor: pointer; margin-left: 10px;">×</button>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Remove automaticamente após 10 segundos
    setTimeout(() => {
      if (banner.parentNode) {
        banner.remove();
      }
    }, 10000);
  }

  /**
   * Injeta variáveis de ambiente para desenvolvimento
   * (Simula o que o GitHub Actions faria)
   */
  injectDevelopmentVars() {
    if (this.isLocalEnvironment() && !this.isGitHubPages) {
      // Para desenvolvimento local - simula os secrets
      window.SUPABASE_URL = 'https://dhpzusdynwpnsejnlzvf.supabase.co';
      window.SUPABASE_KEY = 'sb_publishable_ZOpNfIGoHpzmx9h53xQSWw_0bf4_xb2';
      
      console.log('🔧 Variáveis de desenvolvimento injetadas para teste local');
    }
  }
}

// Instância global do GitHub Secrets Loader
window.githubSecretsLoader = new GitHubSecretsLoader();

// API pública
window.GitHubSecrets = {
  isGitHubPages: () => window.githubSecretsLoader.isGitHubPages,
  getSecrets: () => window.githubSecretsLoader.getSecrets(),
  isAvailable: () => window.githubSecretsLoader.isAvailable(),
  getSupabaseConfig: () => window.githubSecretsLoader.getSupabaseConfig(),
  injectDevVars: () => window.githubSecretsLoader.injectDevelopmentVars()
};

// Para desenvolvimento: injeta variáveis se não estiver no GitHub Pages
if (!window.githubSecretsLoader.isGitHubPages) {
  window.githubSecretsLoader.injectDevelopmentVars();
}

// Mostra banner se estiver no GitHub Pages
if (window.githubSecretsLoader.isGitHubPages) {
  setTimeout(() => {
    window.githubSecretsLoader.showGitHubPagesBanner();
  }, 1000);
}

console.log('🔑 GitHub Secrets Loader API disponível globalmente');
