# 🧩 Master Rules - Protocolo Central @CanalQb

ESTE ARQUIVO É O PONTO DE PARTIDA OBRIGATÓRIO PARA QUALQUER IA OU DESENVOLVEDOR.

## 🎯 1. Regra de Ouro (Leitura, Workflows e Entrega)
O LLM deve **obrigatoriamente** seguir o seguinte fluxo antes, durante e após qualquer tarefa:
1. **Ciclo de Leitura Obrigatório**: A leitura das regras deve ocorrer em três momentos cruciais:
   - **Execução Inicial**: Antes de escrever qualquer linha de código.
   - **Durante Modificações**: Sempre que alterar lógica ou estrutura.
   - **Rechecagem Final**: Antes de entregar, validando contra o pedido original e as normas.

## 📐 2. Padronização de Nomes e Arquivos
- **Nomenclatura de Arquivos MD**:
  - `regra_llms_{funcionalidade}_{ano}.md` (Ex: `regra_llms_seo_avancado_2026.md`)
  - `regra_php_{funcionalidade}.md` (Ex: `regra_php_layout_universal_container.md`)
  - `estrutura_php_{elemento}.md` (Ex: `estrutura_php_pagina_admin_universal.md`)
  - `GUIA_{NOME}_UPPERCASE.md` (Ex: `GUIA_INTEGRACAO_SUPABASE.md`)
  - `README-{MODULO}.md` (Ex: `README-PUZZLE-FINDER.md`)
  - `PROTECAO-{TIPO}.md` (Ex: `PROTECAO-RULES.md`)

- **Obrigatoriedade de Idioma**: Todas as comunicações devem ser em **Português Brasileiro (PT-BR)**

## 🎨 3. Padrões de Layout e Apresentação

### Estrutura de Documentos MD
```markdown
# 📋 [TÍTULO CLARO E DESCRITIVO]

## 🎯 Objetivo
[Descrição clara e concisa do propósito]

## 📋 Estrutura
- Seções com emojis semanticamente consistentes
- Código bem formatado com linguagem especificada
- Listas numeradas para passos
- Listas com bullets para itens

## ✅ Requisitos
- [ ] Item 1
- [ ] Item 2

## 🚀 Implementação
[Detalhes técnicos]

## 📊 Métricas
[Indicadores de sucesso]

## 🔄 Manutenção
[Instruções de atualização]
```

## 📱 4. SEO e Otimização para Leitura

### Meta Estrutura para Documentos
- **Título**: Descritivo com palavras-chave
- **Descrição**: 150-160 caracteres
- **Keywords**: 5-10 termos relevantes
- **Estrutura**: H1 > H2 > H3 > H4
- **Densidade**: 1-2% de palavras-chave

### Formatação Obrigatória
- **Negrito**: Para termos importantes `**termo**`
- **Código**: Com linguagem especificada ```javascript
- **Links**: Descritivos e funcionais
- **Imagens**: Com alt text e dimensões

## 🔧 5. Padrões Técnicos

### CSS e Design
- **Variáveis CSS**: `--cqb-primary`, `--cqb-secondary`
- **Breakpoints**: Mobile-first (320px, 768px, 992px, 1200px)
- **Contraste**: WCAG AA (4.5:1 mínimo)
- **Fontes**: Inter, Outfit, system-ui

### JavaScript
- **Funções**: camelCase
- **Constantes**: UPPER_SNAKE_CASE
- **Classes**: PascalCase
- **Eventos**: CustomEvent para comunicação

## 📋 6. Validação de Qualidade

### Checklist Obrigatório
- [ ] HTML W3C válido
- [ ] CSS sem erros
- [ ] JavaScript seguro (sem eval)
- [ ] Acessibilidade WCAG AA
- [ ] SEO otimizado
- [ ] Performance aceitável
- [ ] Mobile responsivo
- [ ] Links funcionais

## 🌐 7. Padrões de Sitemap

### Inclusão de Documentos
- **URLs**: `https://canalqb.github.io/leitura/{arquivo}.html`
- **Prioridade**: 0.6-0.8 para documentação
- **Frequência**: `monthly` ou `weekly`
- **Lastmod**: Data atual

## 🚨 8. Proibições Estritas

1. **NUNCA** usar `alert()` - usar `showToast()`
2. **NUNCA** ignorar mobile-first
3. **NUNCA** usar cores fixas (variáveis obrigatórias)
4. **NUNCA** esquecer acessibilidade
5. **NUNCA** publicar sem validação

## 📚 9. Documentação Obrigatória

### Todo arquivo MD deve conter:
- **Título claro e descritivo**
- **Objetivo bem definido**
- **Estrutura lógica**
- **Exemplos práticos**
- **Referências cruzadas**
- **Data de atualização**

## 🎯 10. Métricas de Sucesso

### Indicadores Obrigatórios
- **Performance**: < 3 segundos de carregamento
- **SEO**: 90+ Lighthouse
- **Acessibilidade**: 100% WCAG AA
- **Qualidade**: Zero erros de validação

---

**🚨 ESTE ARQUIVO SOBREPÕE QUALQUER OUTRA REGRA!**
**📖 LEITURA 100% OBRIGATÓRIA ANTES DE QUALQUER AÇÃO!**
**🏆 QUALIDADE 100% É O MÍNIMO EXIGIDO!**
