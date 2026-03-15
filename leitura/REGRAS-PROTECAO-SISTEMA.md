# REGRAS DE PROTEÇÃO - ARQUIVOS BLOQUEADOS

## 🚫 ARQUIVOS PROTEGIDOS CONTRA ALTERAÇÕES

### ❌ AUTO16.JS - BLOQUEADO
- **Motivo**: Módulo principal de criptografia, testado e estável
- **Função**: Geração de chaves Bitcoin sem dependências
- **Regra**: NÃO MODIFICAR sem aprovação explícita

### ❌ MATRIZ.JS - BLOQUEADO  
- **Motivo**: Sistema de matriz visual, funcionalidade completa
- **Função**: Renderização e interação com grid 16x16
- **Regra**: NÃO MODIFICAR sem aprovação explícita

## 📋 ARQUIVOS QUE PODEM SER MODIFICADOS

### ✅ PRESET-MANAGER.JS
- **Motivo**: Módulo de presets em evolução
- **Função**: Gerenciamento de presets e integração Supabase

### ✅ PUZZLES-DETECTOR.JS (integrado ao auto16.js)
- **Motivo**: Sistema de detecção pode ser expandido
- **Função**: Monitoramento de puzzles Bitcoin

## 🔒 PROCESSO DE LIBERAÇÃO

1. **Abrir Issue**: Descrever necessidade da alteração
2. **Análise**: Avaliar impacto nos módulos protegidos
3. **Teste**: Validar em ambiente isolado
4. **Aprovação**: Liberação explícita do mantenedor
5. **Implementação**: Aplicar mudanças com testes

## ⚠️ VIOLAÇÕES

Qualquer alteração nos arquivos bloqueados sem seguir o processo será considerada:
- **Risco de segurança** para o sistema
- **Potencial de bugs** em produção
- **Quebra de contratos** entre módulos

## 🎯 OBJETIVO

Manter a estabilidade do core de criptografia e matriz enquanto permite evolução controlada dos módulos periféricos.
