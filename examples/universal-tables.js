/**
 * 🎯 EXEMPLOS UNIVERSAIS - MANAGERS DE TABELAS
 * =============================================
 * Templates genéricos para qualquer tabela do projeto OVO IA
 * 
 * Funcionalidades:
 * - CRUD genérico
 * - Validação automática
 * - Eventos personalizados
 * - Integração Supabase
 * - Tratamento de erros
 */

// ============================================
// 🏗️ TEMPLATE BASE PARA MANAGERS
// ============================================
class OvoIaTableManager {
  constructor(tableName, supabaseUrl, supabaseKey) {
    this.tableName = `ovo_ia_${tableName}`;
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.apiVersion = 'v20240301';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  // ============================================
  // 🔧 UTILITÁRIOS GENÉRICOS
  // ============================================
  
  /**
   * Faz requisição HTTP com retry
   */
  async fetchWithRetry(url, options = {}, retries = this.maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'apikey': this.supabaseKey,
          'Authorization': `Bearer ${this.supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      if (retries > 0) {
        console.warn(`⚠️ ${this.tableName}: Tentativa ${this.maxRetries - retries + 1} falhou, retrying...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Valida dados obrigatórios
   */
  validateRequiredData(data, requiredFields) {
    const missing = requiredFields.filter(field => !data[field]);
    if (missing.length > 0) {
      throw new Error(`Campos obrigatórios ausentes: ${missing.join(', ')}`);
    }
  }

  /**
   * Dispara evento personalizado
   */
  dispatchEvent(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  // ============================================
  // 📋 CRUD GENÉRICO
  // ============================================

  /**
   * Inserir novo registro
   */
  async insert(data, options = {}) {
    try {
      // Validação básica
      if (!data || typeof data !== 'object') {
        throw new Error('Dados inválidos para inserção');
      }

      // Prepara dados
      const insertData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Requisição
      const url = `${this.supabaseUrl}/rest/${this.apiVersion}/${this.tableName}`;
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        body: JSON.stringify(insertData)
      });

      const result = await response.json();

      console.log(`✅ ${this.tableName}: Registro inserido com sucesso`, result);
      this.dispatchEvent(`${this.tableName}Inserted`, { data: insertData, result });

      return {
        success: true,
        data: result,
        message: 'Registro inserido com sucesso'
      };

    } catch (error) {
      console.error(`❌ ${this.tableName}: Erro ao inserir registro`, error);
      this.dispatchEvent(`${this.tableName}Error`, { error, data, action: 'insert' });
      throw error;
    }
  }

  /**
   * Buscar todos os registros
   */
  async findAll(options = {}) {
    try {
      const {
        limit = 50,
        offset = 0,
        orderBy = 'created_at',
        order = 'desc',
        filters = {}
      } = options;

      // Constrói URL com filtros
      let url = `${this.supabaseUrl}/rest/${this.apiVersion}/${this.tableName}?`;
      const params = new URLSearchParams();
      
      // Adiciona filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, `eq.${value}`);
        }
      });
      
      // Adiciona paginação e ordenação
      params.append('order', `${orderBy}.${order}`);
      params.append('limit', limit);
      params.append('offset', offset);

      const response = await this.fetchWithRetry(url + params.toString(), { method: 'GET' });
      const data = await response.json();

      return {
        success: true,
        data: data,
        count: data.length,
        options: { limit, offset, orderBy, order }
      };

    } catch (error) {
      console.error(`❌ ${this.tableName}: Erro ao buscar registros`, error);
      this.dispatchEvent(`${this.tableName}Error`, { error, action: 'findAll' });
      throw error;
    }
  }

  /**
   * Buscar por ID
   */
  async findById(id) {
    try {
      if (!id) {
        throw new Error('ID é obrigatório');
      }

      const url = `${this.supabaseUrl}/rest/${this.apiVersion}/${this.tableName}?id=eq.${id}&limit=1`;
      const response = await this.fetchWithRetry(url, { method: 'GET' });
      const data = await response.json();

      if (data.length === 0) {
        throw new Error(`Registro com ID ${id} não encontrado`);
      }

      return {
        success: true,
        data: data[0]
      };

    } catch (error) {
      console.error(`❌ ${this.tableName}: Erro ao buscar registro por ID`, error);
      this.dispatchEvent(`${this.tableName}Error`, { error, id, action: 'findById' });
      throw error;
    }
  }

  /**
   * Atualizar registro
   */
  async update(id, data) {
    try {
      if (!id) {
        throw new Error('ID é obrigatório para atualização');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Dados inválidos para atualização');
      }

      // Prepara dados
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const url = `${this.supabaseUrl}/rest/${this.apiVersion}/${this.tableName}?id=eq.${id}`;
      const response = await this.fetchWithRetry(url, {
        method: 'PATCH',
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      console.log(`✅ ${this.tableName}: Registro ${id} atualizado com sucesso`, result);
      this.dispatchEvent(`${this.tableName}Updated`, { id, data: updateData, result });

      return {
        success: true,
        data: result,
        message: 'Registro atualizado com sucesso'
      };

    } catch (error) {
      console.error(`❌ ${this.tableName}: Erro ao atualizar registro`, error);
      this.dispatchEvent(`${this.tableName}Error`, { error, id, data, action: 'update' });
      throw error;
    }
  }

  /**
   * Excluir registro
   */
  async delete(id) {
    try {
      if (!id) {
        throw new Error('ID é obrigatório para exclusão');
      }

      const url = `${this.supabaseUrl}/rest/${this.apiVersion}/${this.tableName}?id=eq.${id}`;
      await this.fetchWithRetry(url, { method: 'DELETE' });

      console.log(`✅ ${this.tableName}: Registro ${id} excluído com sucesso`);
      this.dispatchEvent(`${this.tableName}Deleted`, { id });

      return {
        success: true,
        message: 'Registro excluído com sucesso'
      };

    } catch (error) {
      console.error(`❌ ${this.tableName}: Erro ao excluir registro`, error);
      this.dispatchEvent(`${this.tableName}Error`, { error, id, action: 'delete' });
      throw error;
    }
  }

  /**
   * Contar registros
   */
  async count(filters = {}) {
    try {
      let url = `${this.supabaseUrl}/rest/${this.apiVersion}/${this.tableName}?`;
      const params = new URLSearchParams();
      
      // Adiciona filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, `eq.${value}`);
        }
      });
      
      // Adiciona apenas contagem
      params.append('select', 'count');

      const response = await this.fetchWithRetry(url + params.toString(), { method: 'GET' });
      const data = await response.json();

      return {
        success: true,
        count: data[0]?.count || 0
      };

    } catch (error) {
      console.error(`❌ ${this.tableName}: Erro ao contar registros`, error);
      throw error;
    }
  }
}

// ============================================
// 🧩 EXEMPLO: MANAGER DE PUZZLES
// ============================================
class OvoIaPuzzlesManager extends OvoIaTableManager {
  constructor(supabaseUrl, supabaseKey) {
    super('puzzles_encontrados', supabaseUrl, supabaseKey);
  }

  /**
   * Registrar puzzle encontrado
   */
  async registerPuzzle(puzzleData) {
    // Validação específica para puzzles
    this.validateRequiredData(puzzleData, [
      'preset', 'hex_private_key', 'wif_compressed', 'wif_uncompressed', 'mode'
    ]);

    // Validações adicionais
    if (!['horizontal', 'vertical'].includes(puzzleData.mode)) {
      throw new Error('Modo deve ser "horizontal" ou "vertical"');
    }

    if (puzzleData.hex_private_key.length !== 64) {
      throw new Error('Chave privada deve ter 64 caracteres hexadecimais');
    }

    return await this.insert(puzzleData);
  }

  /**
   * Buscar puzzles por preset
   */
  async findByPreset(preset, options = {}) {
    return await this.findAll({
      ...options,
      filters: { preset }
    });
  }

  /**
   * Buscar puzzles por modo
   */
  async findByMode(mode, options = {}) {
    return await this.findAll({
      ...options,
      filters: { mode }
    });
  }

  /**
   * Verificar se puzzle já existe
   */
  async checkDuplicate(hexPrivateKey) {
    try {
      const result = await this.findAll({
        limit: 1,
        filters: { hex_private_key: hexPrivateKey }
      });
      
      return result.data.length > 0;
    } catch (error) {
      console.warn('⚠️ Erro ao verificar duplicata:', error);
      return false;
    }
  }

  /**
   * Obter estatísticas
   */
  async getStats() {
    try {
      const [horizontal, vertical, total] = await Promise.all([
        this.findByMode('horizontal', { limit: 1000 }),
        this.findByMode('vertical', { limit: 1000 }),
        this.findAll({ limit: 1000 })
      ]);

      const stats = {
        total: total.data.length,
        horizontal: horizontal.data.length,
        vertical: vertical.data.length,
        presets: {}
      };

      // Agrupa por preset
      total.data.forEach(puzzle => {
        if (!stats.presets[puzzle.preset]) {
          stats.presets[puzzle.preset] = { total: 0, horizontal: 0, vertical: 0 };
        }
        stats.presets[puzzle.preset].total++;
        stats.presets[puzzle.preset][puzzle.mode]++;
      });

      return {
        success: true,
        stats: stats
      };

    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      throw error;
    }
  }
}

// ============================================
// 📊 EXEMPLO: MANAGER DE ESTATÍSTICAS
// ============================================
class OvoIaStatisticsManager extends OvoIaTableManager {
  constructor(supabaseUrl, supabaseKey) {
    super('estatisticas', supabaseUrl, supabaseKey);
  }

  /**
   * Atualizar estatísticas de um preset
   */
  async updatePresetStats(preset, stats) {
    const existing = await this.findByPreset(preset);
    
    if (existing.data.length > 0) {
      // Atualiza existente
      return await this.update(existing.data[0].id, {
        ...stats,
        updated_at: new Date().toISOString()
      });
    } else {
      // Cria novo
      return await this.insert({
        preset,
        ...stats
      });
    }
  }

  /**
   * Buscar estatísticas por preset
   */
  async findByPreset(preset) {
    return await this.findAll({
      limit: 1,
      filters: { preset }
    });
  }

  /**
   * Incrementar contador
   */
  async incrementCounter(preset, field, increment = 1) {
    const existing = await this.findByPreset(preset);
    
    if (existing.data.length > 0) {
      const current = existing.data[0];
      const updateData = {
        [field]: (current[field] || 0) + increment,
        last_discovery: new Date().toISOString()
      };
      
      return await this.update(current.id, updateData);
    } else {
      return await this.insert({
        preset,
        [field]: increment,
        last_discovery: new Date().toISOString()
      });
    }
  }
}

// ============================================
// 📝 EXEMPLO: MANAGER DE LOGS
// ============================================
class OvoIaLogsManager extends OvoIaTableManager {
  constructor(supabaseUrl, supabaseKey) {
    super('logs_processamento', supabaseUrl, supabaseKey);
  }

  /**
   * Registrar log
   */
  async log(level, message, details = {}) {
    const logData = {
      level, // 'info', 'warning', 'error', 'debug'
      message,
      details,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      session_id: this.getSessionId()
    };

    return await this.insert(logData);
  }

  /**
   * Registrar erro
   */
  logError(message, error = {}) {
    return this.log('error', message, {
      error: error.message || error,
      stack: error.stack,
      type: 'javascript_error'
    });
  }

  /**
   * Registrar informação
   */
  logInfo(message, details = {}) {
    return this.log('info', message, details);
  }

  /**
   * Registrar warning
   */
  logWarning(message, details = {}) {
    return this.log('warning', message, details);
  }

  /**
   * Buscar logs por nível
   */
  async findByLevel(level, options = {}) {
    return await this.findAll({
      ...options,
      filters: { level },
      orderBy: 'timestamp',
      order: 'desc'
    });
  }

  /**
   * Buscar logs recentes
   */
  async findRecent(hours = 24, options = {}) {
    const since = new Date();
    since.setHours(since.getHours() - hours);
    
    return await this.findAll({
      ...options,
      filters: {
        timestamp: `gte.${since.toISOString()}`
      },
      orderBy: 'timestamp',
      order: 'desc'
    });
  }

  /**
   * Obter ID de sessão
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('ovo_ia_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('ovo_ia_session_id', sessionId);
    }
    return sessionId;
  }
}

// ============================================
// 🚀 EXPORTAÇÃO E USO
// ============================================
window.OvoIaExamples = {
  // Classes base
  OvoIaTableManager,
  
  // Managers específicos
  OvoIaPuzzlesManager,
  OvoIaStatisticsManager,
  OvoIaLogsManager,
  
  // Factory para criar managers
  createManager: (tableName, supabaseUrl, supabaseKey) => {
    return new OvoIaTableManager(tableName, supabaseUrl, supabaseKey);
  },
  
  // Factory para managers especializados
  createPuzzlesManager: (supabaseUrl, supabaseKey) => {
    return new OvoIaPuzzlesManager(supabaseUrl, supabaseKey);
  },
  
  createStatisticsManager: (supabaseUrl, supabaseKey) => {
    return new OvoIaStatisticsManager(supabaseUrl, supabaseKey);
  },
  
  createLogsManager: (supabaseUrl, supabaseKey) => {
    return new OvoIaLogsManager(supabaseUrl, supabaseKey);
  }
};

console.log('✅ Exemplos universais de tabelas carregados. Use window.OvoIaExamples');
