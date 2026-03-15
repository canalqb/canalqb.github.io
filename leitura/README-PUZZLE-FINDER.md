# 🧩 PUZZLE FINDER - REGISTRO DE PUZZLES BITCOIN

## 📋 VISÃO GERAL

O **Puzzle Finder** é um sistema completo para registrar e gerenciar puzzles Bitcoin encontrados durante o processamento. Ele armazena WIFs, endereços e metadados das descobertas no Supabase.

## 🎯 FUNCIONALIDADES

### ✅ **Registro de Puzzles**
- Salva WIF comprimido e não comprimido
- Armazena endereços Bitcoin
- Registra metadados da descoberta
- Validação completa dos dados

### ✅ **Busca e Consulta**
- Busca por preset específico
- Filtragem por modo (horizontal/vertical)
- Paginação e ordenação
- Estatísticas de descobertas

### ✅ **Validação**
- Validação de chaves hexadecimais
- Validação de formato WIF
- Validação de endereços Bitcoin
- Prevenção de duplicatas

### ✅ **Integração**
- Eventos personalizados
- API REST do Supabase
- Configuração automática
- Tratamento de erros

---

## 🗄️ ESTRUTURA DA TABELA

### **Tabela:** `ovo_ia_puzzles_encontrados`

| Coluna | Tipo | Descrição |
|--------|------|----------|
| `id` | BIGINT | ID único (auto-incremento) |
| `preset` | BIGINT | Número do preset (ex: 70, 71, 72) |
| `hex_private_key` | VARCHAR(64) | Chave privada em hexadecimal |
| `wif_compressed` | VARCHAR(52) | WIF formatado (comprimido) |
| `wif_uncompressed` | VARCHAR(52) | WIF formatado (não comprimido) |
| `address_compressed` | VARCHAR(62) | Endereço Bitcoin (comprimido) |
| `address_uncompressed` | VARCHAR(62) | Endereço Bitcoin (não comprimido) |
| `bits` | BIGINT | Bits do puzzle |
| `mode` | VARCHAR(10) | Modo: 'horizontal' ou 'vertical' |
| `discovery_timestamp` | TIMESTAMP | Data/hora da descoberta |
| `matrix_coordinates` | JSONB | Coordenadas na matriz {row, col} |
| `processing_time_ms` | BIGINT | Tempo de processamento (ms) |
| `lines_processed` | BIGINT | Linhas processadas até encontrar |

---

## 🚀 INSTALAÇÃO

### **1. Criar Tabela no Supabase**

Execute o SQL do arquivo:
```sql
-- Arquivo: sql/create-puzzles-encontrados.sql
```

### **2. Adicionar Scripts ao HTML**

```html
<!-- Puzzle Finder -->
<script src="js/puzzle-finder.js"></script>
<script src="examples/puzzle-finder-usage.js"></script>
```

### **3. Configurar Supabase**

O Puzzle Finder usa a mesma configuração do Supabase já existente:
- `window.SUPABASE_URL`
- `window.SUPABASE_ANON_KEY`
- Ou configuração via `window.SupabaseDB`

---

## 📖 USO BÁSICO

### **Registrar um Puzzle Encontrado**

```javascript
async function registrarPuzzle(hexKey, mode) {
  try {
    // Converte hex para WIF
    const wifCompressed = await toWIF(hexKey, true);
    const wifUncompressed = await toWIF(hexKey, false);
    
    // Registra o puzzle
    const result = await window.PuzzleFinder.register({
      preset: 70,
      hexPrivateKey: hexKey,
      wifCompressed: wifCompressed,
      wifUncompressed: wifUncompressed,
      mode: mode,
      bits: 70,
      matrixCoordinates: { row: 0, col: 0 },
      processingTimeMs: 15000,
      linesProcessed: 50000
    });
    
    console.log('✅ Puzzle registrado:', result);
    
  } catch (error) {
    console.error('❌ Erro ao registrar:', error);
  }
}
```

### **Buscar Puzzles Encontrados**

```javascript
// Todos os puzzles
const todos = await window.PuzzleFinder.findAll({
  limit: 10,
  orderBy: 'discovery_timestamp',
  order: 'desc'
});

// Puzzles de um preset específico
const preset70 = await window.PuzzleFinder.findAll({
  preset: 70,
  limit: 20
});

// Apenas modo horizontal
const horizontais = await window.PuzzleFinder.findAll({
  mode: 'horizontal',
  limit: 50
});
```

### **Verificar Duplicatas**

```javascript
const hexKey = '4000000000000000a9';
const isDuplicate = await window.PuzzleFinder.checkDuplicate(hexKey, 'horizontal');

if (isDuplicate) {
  console.log('⚠️ Puzzle já foi encontrado');
} else {
  console.log('✅ Puzzle é novo');
}
```

### **Obter Estatísticas**

```javascript
const stats = await window.PuzzleFinder.getStats();
console.log('📊 Estatísticas:', stats.stats);
// Ex: { total: 5, horizontal: 3, vertical: 2, presets: {70: 2, 71: 3} }
```

---

## 🎛️ API COMPLETA

### **window.PuzzleFinder**

| Método | Descrição | Parâmetros |
|--------|----------|------------|
| `register(data)` | Registra puzzle encontrado | `puzzleData` object |
| `findAll(options)` | Busca puzzles encontrados | `options` object |
| `checkDuplicate(hex, mode)` | Verifica duplicata | `hexKey`, `mode` |
| `getStats()` | Obtém estatísticas | - |
| `isReady()` | Verifica se está pronto | - |
| `getConfig()` | Obtém configuração | - |

### **Dados para Registro**

```javascript
const puzzleData = {
  preset: 70,                    // Obrigatório
  hexPrivateKey: '4000...',      // Obrigatório (64 chars hex)
  wifCompressed: 'Kz7u...',     // Obrigatório (52 chars)
  wifUncompressed: '5Hz7...',    // Obrigatório (52 chars)
  addressCompressed: '1A1z...', // Opcional
  addressUncompressed: '1A1z...', // Opcional
  mode: 'horizontal',           // Obrigatório ('horizontal' ou 'vertical')
  bits: 70,                     // Opcional (default = preset)
  matrixCoordinates: {row:0,col:0}, // Opcional
  processingTimeMs: 15000,      // Opcional
  linesProcessed: 50000          // Opcional
};
```

---

## 🎡 EVENTOS

### **puzzleFound**
Disparado quando um puzzle é registrado com sucesso.

```javascript
window.addEventListener('puzzleFound', (event) => {
  const puzzleData = event.detail;
  console.log('🎉 Puzzle encontrado!', puzzleData);
});
```

### **puzzleFoundError**
Disparado quando ocorre erro ao registrar.

```javascript
window.addEventListener('puzzleFoundError', (event) => {
  const { error, puzzleData } = event.detail;
  console.error('❌ Erro ao registrar puzzle:', error);
});
```

---

## 🔧 EXEMPLOS PRÁTICOS

### **Integração com Processamento**

```javascript
async function onPuzzleFound(hexKey, mode, processingInfo) {
  try {
    // 1. Verifica duplicata
    const isDuplicate = await window.PuzzleFinder.checkDuplicate(hexKey, mode);
    if (isDuplicate) return false;
    
    // 2. Prepara dados
    const wifCompressed = await toWIF(hexKey, true);
    const wifUncompressed = await toWIF(hexKey, false);
    
    // 3. Registra
    const result = await window.PuzzleFinder.register({
      preset: processingInfo.preset,
      hexPrivateKey: hexKey,
      wifCompressed: wifCompressed,
      wifUncompressed: wifUncompressed,
      mode: mode,
      bits: processingInfo.bits,
      processingTimeMs: processingInfo.elapsedTime,
      linesProcessed: processingInfo.linesProcessed
    });
    
    // 4. Notifica usuário
    showNotification('🎉 PUZZLE ENCONTRADO!', {
      preset: processingInfo.preset,
      mode: mode,
      wif: wifCompressed.substring(0, 8) + '...'
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro ao registrar puzzle:', error);
  }
}
```

### **Registro Rápido**

```javascript
// Função conveniente para registro rápido
async function quickRegister(hexKey, mode, preset = 70) {
  const wifCompressed = await toWIF(hexKey, true);
  const wifUncompressed = await toWIF(hexKey, false);
  
  return await window.PuzzleFinder.register({
    preset: preset,
    hexPrivateKey: hexKey,
    wifCompressed: wifCompressed,
    wifUncompressed: wifUncompressed,
    mode: mode,
    bits: preset
  });
}
```

---

## 🔍 VALIDAÇÕES

### **Chave Privada Hexadecimal**
- Deve ter exatamente 64 caracteres
- Apenas caracteres hexadecimais (0-9, a-f)
- Case insensitive (convertido para minúsculas)

### **WIF (Wallet Import Format)**
- Comprimido: 52 caracteres
- Não comprimido: 51 caracteres
- Base58 encoding

### **Endereço Bitcoin**
- Legacy (1...): 34 caracteres
- P2SH (3...): 34 caracteres  
- Bech32 (bc1...): 42-62 caracteres

---

## 🛡️ SEGURANÇA

### **Row Level Security (RLS)**
- Inserções permitidas para usuários anônimos
- Leitura pública para visualização
- Atualizações apenas pelo serviço
- Exclusões apenas pelo serviço

### **Validações**
- Validação de formato no cliente
- Constraints no banco de dados
- Prevenção de SQL injection
- Tratamento de erros robusto

---

## 📊 MONITORAMENTO

### **Logs Automáticos**
- ✅ Sucesso ao registrar puzzle
- ❌ Erros ao registrar
- ⚠️ Tentativas de duplicata
- 📊 Estatísticas de uso

### **Métricas Disponíveis**
- Total de puzzles encontrados
- Puzzles por preset
- Puzzles por modo
- Tempo médio de descoberta

---

## 🚨 SOLUÇÃO DE PROBLEMAS

### **"Puzzle Finder não está pronto"**
```javascript
// Verifique a configuração do Supabase
console.log('Config:', window.PuzzleFinder.getConfig());

// Verifique se o Supabase está disponível
if (!window.SupabaseDB || !window.SupabaseDB.isReady()) {
  console.error('Supabase não está configurado');
}
```

### **"Chave privada inválida"**
```javascript
// Valide antes de registrar
if (!window.PuzzleFinder.validateHexPrivateKey(hexKey)) {
  console.error('Formato inválido - deve ter 64 chars hex');
}
```

### **"Erro ao registrar puzzle"**
```javascript
// Verifique a conexão
try {
  await window.PuzzleFinder.findAll({ limit: 1 });
  console.log('✅ Conexão OK');
} catch (error) {
  console.error('❌ Problema de conexão:', error);
}
```

---

## 🔄 ATUALIZAÇÕES

### **Versão 1.0.0**
- ✅ Registro básico de puzzles
- ✅ Validação de dados
- ✅ Busca e consulta
- ✅ Eventos personalizados

### **Planejado**
- 🔄 Dashboard de descobertas
- 🔄 Exportação em CSV
- 🔄 Notificações por email
- 🔄 Integração com blockchain

---

## 📝 LICENÇA

Este projeto faz parte do sistema OVO IA e está sob a mesma licença do projeto principal.

---

## 🤝 SUPORTE

Para dúvidas ou problemas:
1. Verifique o console do navegador
2. Confira a configuração do Supabase
3. Teste com os exemplos fornecidos
4. Consulte os logs de erros

**Desenvolvido para o projeto OVO IA - Puzzle Bitcoin Finder** 🧩
