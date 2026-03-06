// 🎯 GERENCIADOR DE PROGRESSO VERTICAL - OVO IA (V2 - puzzle_vertical)

class VerticalProgressManager {
  constructor() {
    this.initConfiguration();
    this.currentPreset = null;
    this.isEnabled = !!(this.supabaseUrl && this.supabaseKey);
    
    if (this.isEnabled) {
      console.log('✅ VerticalProgressManager (V2): Configurado para ' + this.supabaseUrl);
    } else {
      console.warn('⚠️ VerticalProgressManager: Supabase não configurado corretamente');
    }
  }

  /**
   * Inicializa configuração a partir dos managers globais
   */
  initConfiguration() {
    if (window.ConfigManager && window.ConfigManager.isSupabaseAvailable()) {
      const config = window.ConfigManager.getSupabaseConfig();
      this.supabaseUrl = config.url;
      this.supabaseKey = config.anonKey;
    } 
    else if (window.GitHubSecrets && window.GitHubSecrets.isAvailable()) {
      const config = window.GitHubSecrets.getSupabaseConfig();
      this.supabaseUrl = config.url;
      this.supabaseKey = config.anonKey;
    }
    else {
      this.supabaseUrl = window.SUPABASE_URL || 'https://dhpzusdynwpnsejnlzvf.supabase.co';
      this.supabaseKey = window.SUPABASE_KEY || 'sb_publishable_CzrMyXDeFQmd1cTZ4Uls3A_l83xJJsa'; // 🚀 CORREÇÃO: Mesma chave do modo horizontal
    }
  }

  // 🚀 Salva progresso vertical a cada 1000 verificações (UPSERT na puzzle_vertical)
  async saveVerticalProgress(hexValue, verificationCount = 0) {
    if (!this.currentPreset || !this.isEnabled) return;

    try {
      const presetNumber = Number(this.currentPreset.bits);
      
      // Remove zeros à esquerda para manter o banco limpo
      const cleanInicio = hexValue.replace(/^0+/, '') || '0';
      const cleanFim = this.currentPreset.fim.replace(/^0+/, '') || '0';
      
      const data = {
        preset: presetNumber,
        inicio: cleanInicio,
        fim: cleanFim
      };

      // Tenta Upsert via REST API do Supabase
      const response = await fetch(`${this.supabaseUrl}/rest/v1/puzzle_vertical`, {
        method: 'POST',
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates' // Importante para o Upsert baseado na PK
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log(`💾 [Vertical] Progresso salvo no banco (Preset ${presetNumber}): ${hexValue}`);
      } else {
        const errorText = await response.text();
        console.error('❌ Erro Supabase Vertical (V2):', response.status, errorText);
        if (response.status === 404) {
          console.warn('💡 A tabela "puzzle_vertical" parece não existir no seu Supabase. Crie-a usando o script SQL fornecido.');
        }
      }
    } catch (error) {
      // Falha de rede ou outro erro - não interrompe o motor
      console.warn('⚠️ Falha ao salvar progresso vertical (Offline?):', error.message);
    }
  }

  // 🚀 Busca último progresso para o preset no modo vertical
  async getLastVerticalProgress(presetBits) {
    if (!this.isEnabled) return null;
    
    try {
      const url = `${this.supabaseUrl}/rest/v1/puzzle_vertical?preset=eq.${presetBits}&select=preset,inicio,fim`;
      const response = await fetch(url, {
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.length > 0 ? data[0] : null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar progresso vertical:', error);
    }
    return null;
  }

  // 🚀 Define preset atual (bits, inicio_original, fim)
  setCurrentPreset(bits, inicio, fim) {
    this.currentPreset = { bits, inicio, fim };
  }

  // 🚀 Calcula valor inverso (Simetria/Espelhamento dentro do intervalo)
  calculateInverse(hexValue, startHex, endHex) {
    try {
      const val = BigInt('0x' + hexValue);
      const start = BigInt('0x' + startHex);
      const end = BigInt('0x' + endHex);
      
      // Cálculo de simetria: Distância do início é aplicada a partir do fim para trás
      const inverted = end - (val - start);
      
      return inverted.toString(16).padStart(64, '0');
    } catch (error) {
      console.error('❌ Erro ao calcular inverso:', error);
      return null;
    }
  }
}

// Exporta globalmente
window.VerticalProgressManager = VerticalProgressManager;
