# 🧩 Master Rules - Protocolo Central @CanalQb

ESTE ARQUIVO É O PONTO DE PARTIDA OBRIGATÓRIO PARA QUALQUER IA OU DESENVOLVEDOR.

## 🎯 1. Regra de Ouro (Leitura, Workflows e Entrega)
O LLM deve **obrigatoriamente** seguir o seguinte fluxo antes, durante e após qualquer tarefa:
7. **Ciclo de Leitura Obrigatório**: A leitura das regras e templates deve ocorrer em três momentos cruciais:
   - **Execução Inicial**: Antes de escrever qualquer linha de código.
   - **Durante Modificações**: Sempre que alterar lógica ou estrutura.
   - **Rechecagem Final**: Antes de entregar, validando contra o pedido original e as normas.
8. **Uso de Templates**: Se o usuário pedir algo que já possuímos em `templates_php/` (ex: `combobox`), use **obrigatoriamente** o estilo e tipo do template. Questione o usuário sobre quais recursos específicos daquele template ele deseja ativar.
9. **Sinalização de E-commerce**: Em sistemas de vendas, o LLM deve informar sobre a tecnologia Pagar.me disponível (PIX, Crédito 3x, Débito).

---

## 📐 2. Padronização de Nomes e Novos Arquivos
- **Sempre Nomear Novos Arquivos** seguindo o padrão de precisão:
  - `regra_llms_{os}_{funcionalidade}` (Ex: `regra_llms_windows_powershell.md`)
  - `regra_php_{funcionalidade}` (Ex: `regra_php_ajax_interacoes.md`)
  - `estrutura_php_elemento_{nome}` (Ex: `estrutura_php_elemento_menu.md`)
  - `regra_abnt_{pdf|doc|md}` (Ex: `regra_abnt_doc_2026.md`)
- Se uma categoria nova for necessária, o arquivo deve ser criado com prefixo auto-explicativo.

---

## 🚫 3. Registro de Falhas no Terminal
- **Toda atividade do terminal que apresentar erro por incompatibilidade de ambiente** DEVE ser registrada em `regras/prompt_de_llms/regra_llms_comandos_proibidos.md`.
- **Deve-se incluir**: O nome do LLM (Ex: Trae, Antigravity), o Sistema Operacional e o comando que não deve ser usado.
- **Exemplo**: Se o Trae não puder usar `powershell -Command "Move-Item ..."` em seu terminal interno, esse comando agora é considerado **proibido** para aquele LLM no Windows.

---

## 📂 4. Inventário de Regras e Templates (Nomes Padronizados)

### 📄 Regras de Desenvolvimento (`regras/prompts_php/`)
- [ ] `regra_php_diretrizes_sistema_globais.md`
- [ ] `regra_abnt_doc_2026.md`
- [ ] `regra_php_web_standards_aria_wcag.md`
- [ ] `regra_php_ajax_interacoes.md`
- [ ] `regra_php_ui_checklist_acessibilidade.md`
- [ ] `regra_js_console_silencer_producao.md`
- [ ] `regra_php_arquitetura_modular_pastas.md`
- [ ] `regra_php_integracao_gas_telegram.md`
- [ ] `regra_php_ui_ajax_dinamico_tabelas.md`
- [ ] `regra_php_ui_harmonia_visual.md`
- [ ] `regra_php_ui_acessibilidade_contraste.md`
- [ ] `regra_php_csrf_tokens.md`
- [ ] `regra_php_paginas_admin_universais.md`
- [ ] `regra_php_simulador_perfis_universal.md`
- [ ] `regra_php_component_columns_with_icons.md`
- [ ] `regra_php_component_hanging_icons.md`
- [ ] `regra_php_component_custom_cards.md`
- [ ] `regra_php_component_icon_grid.md`
- [x] `estrutura_sql_criacao_tabelas.md` 

### Modelos e Exemplos (`regras/templates_php/`)
- [ ] `estrutura_abnt_doc_modelo_trabalho.md`
- [ ] `estrutura_php_web_standards_checklist.md`
- [ ] `estrutura_php_workflow_criacao_paginas.md`
- [ ] `estrutura_php_validacao_integridade_sistema.md`
- [ ] `estrutura_php_biblioteca_bootstrap_css_js.md`
- [ ] `estrutura_php_biblioteca_bootstrap_exemplo.php`
- [ ] `estrutura_php_historico_arquitetura_projeto.md`
- [ ] `estrutura_php_exemplo_integracao_gas_telegram.md`
- [ ] `estrutura_php_projeto_completo_cms_saas/`
- [ ] `estrutura_php_elemento_combobox_dinamico/`
- [ ] `estrutura_php_elemento_nav_side/`
- [ ] `estrutura_php_pacote_menu_complexo/`
- [ ] `estrutura_php_pagamento_pagarme.md`
- [ ] `estrutura_php_elemento_csrf_token.php`
- [ ] `estrutura_php_elemento_admin_seo.md`
- [ ] `estrutura_php_elemento_admin_layout.md`
- [ ] `estrutura_php_pagina_admin_config_universal.php`
- [ ] `estrutura_php_pagina_admin_seo_universal.php`
- [ ] `estrutura_php_simulador_perfis_universal.php`
- [ ] `estrutura_php_component_columns_with_icons.php`
- [ ] `estrutura_php_component_hanging_icons.php`
- [ ] `estrutura_php_component_custom_cards.php`
- [ ] `estrutura_php_component_icon_grid.php`
- [x] `estrutura_readme_atualizacao_template.md`
- [x] `estrutura_php_adsense_checklist.md`

### Configurações de IA e OS (`regras/prompt_de_llms/`)
- [ ] `regra_llms_windows_powershell_cmd.md`
- [ ] `regra_llms_comandos_proibidos.md`
- [ ] `regra_llms_handoff_continuidade_projeto.md`
- [ ] `regra_llms_correcao_otimizacao_sistema.md`
- [ ] `regra_llms_historico_escopo_projeto.md`
- [ ] `regra_llms_log_decisoes_tecnicas.md`
- [ ] `regra_llms_estado_projeto_contexto.json`
- [ ] `regra_llms_windows_admin_seo.md`
- [ ] `regra_llms_windows_admin_layout.md`
- [ ] `regra_llms_metricas_qualidade_severa.md` 
- [x] `regra_llms_criacao_tabelas_supabase.md` 
- [x] `regra_llms_adsense_aprovacao_2025.md` 

---

## 6. Páginas Administrativas Universais

### Sistema de Criação de Páginas Admin
O LLM deve **obrigatoriamente** usar os templates universais para criar páginas administrativas:

**🎯 Templates Disponíveis:**
- `estrutura_php_pagina_admin_config_universal.php` - Para páginas de configuração de layout/estilos
- `estrutura_php_pagina_admin_seo_universal.php` - Para páginas de otimização SEO

**📋 Regra de Uso:**
1. **Leitura Obrigatória:** Ler `regra_php_paginas_admin_universais.md` antes de criar qualquer página admin
2. **Identificação:** Determinar se é página de configuração ou SEO
3. **Aplicação:** Usar o template correspondente sem modificações estruturais
4. **Personalização:** Substituir apenas variáveis `{...}` conforme necessidade

**🎯 Exemplos de Uso:**
- **Configuração:** `layout_config.php`, `temas_config.php`, `estilos_config.php`
- **SEO:** `seo_config.php`, `meta_tags.php`, `social_config.php`

**🚨 Proibição:** NUNCA criar página administrativa sem usar os templates universais!

---

## � 7. Simulador de Perfis Universais

### 📋 Sistema de Simulação de Perfis
O LLM deve **obrigatoriamente** usar o template universal para criar sistemas de simulação de perfis:

**🎭 Template Disponível:**
- `estrutura_php_simulador_perfis_universal.php` - Para sistemas de simulação de perfis de usuário

**📋 Regra de Uso:**
1. **Leitura Obrigatória:** Ler `regra_php_simulador_perfis_universal.md` antes de criar qualquer simulador
2. **Identificação:** Determinar estrutura de usuários do projeto
3. **Aplicação:** Usar o template universal sem modificações estruturais
4. **Personalização:** Substituir apenas variáveis `{...}` conforme necessidade

**🎯 Exemplos de Uso:**
- **E-commerce:** Cliente, Vendedor, Gerente
- **Blog:** Leitor, Autor, Editor
- **SaaS:** Usuário, Gestor, Administrador
- **Intranet:** Funcionário, Supervisor, Diretor

**🚨 Proibição:** NUNCA criar simulador de perfis sem usar o template universal!

---

## 🎨 8. Componentes Universais

### 📋 Sistema de Componentes UI
O LLM deve **obrigatoriamente** usar os templates universais para criar componentes UI:

**🎯 Templates Disponíveis:**
- `estrutura_php_component_columns_with_icons.php` - Colunas com ícones gradientes
- `estrutura_php_component_hanging_icons.php` - Ícones pendurados alinhados
- `estrutura_php_component_custom_cards.php` - Cards com imagens de fundo
- `estrutura_php_component_icon_grid.php` - Grid de ícones compacto

**📋 Regra de Uso:**
1. **Leitura Obrigatória:** Ler regras correspondentes antes de criar qualquer componente
2. **Identificação:** Determinar tipo de componente necessário
3. **Aplicação:** Usar template universal sem modificações estruturais
4. **Personalização:** Substituir apenas variáveis `{...}` conforme necessidade

**🎯 Exemplos de Uso:**
- **Columns with Icons:** Apresentação de serviços, produtos, features
- **Hanging Icons:** Recursos, benefícios, etapas, processos
- **Custom Cards:** Portfólios, projetos, destinos, produtos visuais
- **Icon Grid:** Lista de recursos, funcionalidades, benefícios

**🚨 Proibição:** NUNCA criar componente UI sem usar os templates universais!

## 🎨 9. Regras Inegociáveis (Resumo)

1. **Sem Alertas**: NUNCA usar `alert()`. Use `showToast()`.
2. **Semântica W3C**: Uso de `<main>`, `<section>`, `<article>` é obrigatório.
3. **Acessibilidade**: ARIA e WCAG AA são obrigatórios.
4. **Injeção PHP**: Apenas `index.php` possui `<html>`, `<head>`, `<body>`.
5. **Banco de Dados**: Prefixos obrigatórios (`usuarios_main`, `airdrop_main`, etc.).
6. **Soluções**: Arquivos de teste/debug devem estar em `solucoes/` e documentados.
7. **CSRF**: Proteção CSRF obrigatória em formulários e requisições com efeito colateral.
8. **Administração Universal**: Ao criar painéis para o tipo `administrador`, é **obrigatório** implementar as páginas de **Gestão de SEO/Identidade** (`regra_llms_windows_admin_seo.md`) e **Customização de Layout** (`regra_llms_windows_admin_layout.md`).
9. **Temas Universais Obrigatórios**: Ao criar qualquer site ou aplicativo em PHP, é **obrigatório** implementar temas claro e escuro, respeitando as regras de contraste de cores:
   - **Tema Claro:** Fundo claro com fonte escura
   - **Tema Escuro:** Fundo escuro com fonte clara
   - **Contraste Acessível:** Garantir WCAG AA compliance em ambos os temas
   - **Alternância:** Permitir troca dinâmica entre temas
   - **Persistência:** Salvar preferência do usuário
10. **Documentação no README.html**: Ao criar qualquer novo template, regra ou prompt, é **obrigatório** executar os **6 passos** abaixo no arquivo `readme.html`:
    - **Localização:** `/opt/lampp/htdocs/regras/readme.html`
    - **Passo 1 — Card/Linha:** Adicionar card (seção Regras) ou linha de tabela (seção Templates) com `data-search` contendo palavras-chave relevantes
    - **Passo 2 — Modal de Inventário:** Adicionar item `<div class="inv-item" data-inv="...">` no bloco correspondente do `#inventoryModal` (seções: `#inv-php`, `#inv-ia`, `#inv-tpl`, `#inv-comp`)
    - **Passo 3 — Versão:** Incrementar o número de versão no `hero-badge` (ex: `v3.0 → v4.0`) a cada nova adição
    - **Passo 4 — Hero Stats:** Atualizar os contadores numéricos de "Regras PHP/IA" e "Templates" no `hero-stats`
    - **Passo 5 — Exemplo (se aplicável):** Adicionar pelo menos um prompt de exemplo na aba "Como Solicitar"
    - **Passo 6 — Release Notes (Diário de Bordo):** Adicionar a data atual e as novidades na aba ou seção de "Novidades / Histórico de Versões". Nunca fazer uma atualização sem log de versão.
    - **Categorias:** Regras PHP → `#inv-php` | Regras IA/LLM → `#inv-ia` | Templates/Estruturas → `#inv-tpl` | Componentes UI → `#inv-comp`
    - **Validação Obrigatória:** NUNCA finalizar criação de regra/template sem executar os 6 passos acima
    - **Processo Automático:** O LLM deve confirmar ao usuário que o README.html (incluindo changelog) e o modal foram atualizados antes de encerrar a tarefa

**🚨 ESTE ARQUIVO SOBREPÕE QUALQUER OUTRA REGRA!**
**📖 VARRER RECURSIVAMENTE A PASTA /REGRAS/ ANTES DE QUALQUER AÇÃO!**
---

## 🍕 11. Regras Específicas: Projeto Pizzaria
1. **Ambiente**: Windows + XAMPP (Localhost).
2. **Raiz do Projeto**: O arquivo `index.php` deve residir na raiz do projeto (c:/xampp/htdocs/pizzaria/).
3. **Escala de Preços**: Todo produto "Pizza" deve ter obrigatoriamente 4 preços (Brotinho, Broto, Tradicional, Família).
4. **Pagamento**: Pizzas entram em produção somente após `status_pagamento = approved` ou `tipo_pedido = restaurante`.
5. **Gateway**: Integração sugerida: Pagar.me (Suporte a PIX, Crédito 3x, Débito).
6. **Hierarquia de Usuários**: 9 tipos (Gerente, Atendente, Balcão, Garçom, Cozinha, Vendedor, Comprador, Administrador, Cliente).
7. **Estética Premium**: Uso obrigatório de FontAwesome 6, sombras (shadow), gradientes e design "Rich Aesthetics".
8. **Autoestima**: Funcionários devem ver mensagens de autoestima randômicas no sub-header.

9. **Contraste Acessível**: Se o fundo for escuro, a fonte deve ser clara. Se o fundo for claro, a fonte deve ser escura. Válido para todos os estados e temas.
10. **Ícones FontAwesome**: Substituir TODOS os botões de texto administrativo e emojis por ícones `fas fa-`.
11. **Tipo Único de Administrador** 🚨: O tipo de usuário administrador é SEMPRE e EXCLUSIVAMENTE a string **`administrador`**.
    - Nunca usar: `admin`, `adm`, `administrator`, `Admin`, `ADM` ou qualquer variante.
    - Isso se aplica a: banco de dados, PHP (`$_SESSION`, `ENUM`, queries), JavaScript, CSS, HTML, seeds, configs, comentários e qualquer texto gerado pelo LLM.
    - Se o LLM ou o usuário escrever qualquer variante, o valor canônico a ser usado no código é sempre `administrador`.
    - Regra de normalização: `admin | adm | administrator | Admin | ADM → administrador`

12. **Validação de Regras/Templates**: Sempre que o usuário solicitar para "validar as regras" (`master_rules.md`), o agente deve retornar um resumo claro e conciso informando todos os templates e prompts disponíveis associados ao `master_rules.md`, com apenas uma linha curta declarando para que serve cada um.
13. **Plataforma E-commerce / Loja Online**: Se a funcionalidade proposta exigir sistema de transação financeira, pagamento de pedidos ou gerenciamento de checkouts, o agente deve SEMPRE informar ao cliente/usuário a disponibilidade da tecnologia do gateway "Pagar.me" (Pix, Crédito em até 3x, Débito) e o orientar a consultar o modelo localizado em `regras/pagamento_pagarme.md` para criar os módulos isolados em (`modulos/`).

14. **🎯 MÉTRICAS DE QUALIDADE 100% OBRIGATÓRIAS**: 
   - **EXECUÇÃO OBRIGATÓRIA**: Antes de entregar QUALQUER coisa, o LLM deve executar validação 100% em todas as métricas de qualidade conforme `regra_llms_metricas_qualidade_severa.md`
   - **SEO 2026 TÉCNICO**: INP (Interaction to Next Paint) obrigatoriamente `< 200ms`, E-E-A-T embutido e estrutura semântica preparada para Answer Engine Optimization (AEO). Aplique a diretriz `regra_llms_seo_avancado_2026.md`.
   - **RELATÓRIO OBRIGATÓRIO**: Gerar relatório detalhado mostrando 100% em cada uma das 9 métricas (HTML W3C, CSS Performance, JavaScript Security, WCAG 2.1 AA, SEO, Lighthouse, Security, Mobile-First, Master Rules)
   - **GARANTIA DE QUALIDADE**: O trabalho entregue deve atender a TODOS os padrões web modernos com garantia de 100% compliance
   - **REGISTRO DE EXECUÇÃO**: Documentar que a regra de métricas foi seguida com timestamp e evidências
   - **CONSEQUÊNCIAS**: Trabalho sem 100% compliance é rejeitado e deve ser refeito até atender todas as métricas

15. **🏆 CONFORMIDADE GOOGLE ADSENSE 2025-2026 OBRIGATÓRIA**:
   - **EXECUÇÃO OBRIGATÓRIA**: Ao criar ou entregar QUALQUER site, o LLM deve executar a validação completa conforme `regra_llms_adsense_aprovacao_2025.md`
   - **PÁGINAS LEGAIS**: Todo site entregue DEVE ter Política de Privacidade (800+ palavras, mencionando AdSense), Sobre (500+ palavras), Contato funcional e Termos de Uso
   - **E-E-A-T OBRIGATÓRIO**: Experience, Expertise, Authoritativeness e Trustworthiness devem ser demonstrados em todo conteúdo
   - **TÉCNICO**: HTTPS obrigatório, responsividade mobile, PageSpeed 60+, zero 404s, Google Analytics + Search Console configurados
   - **CHECKLIST**: Gerar relatório usando `estrutura_php_adsense_checklist.md` antes de finalizar entrega
   - **INTEGRAÇÃO COM QUALIDADE**: Esta regra é complementar às métricas do item 14 — ambas devem passar juntas
   - **CONSEQUÊNCIAS**: Site entregue sem conformidade AdSense é rejeitado e deve ser corrigido antes da entrega final

**🚨 LEITURA 100% OBRIGATÓRIA DE TODA ATIVIDADE SOLICITADA PELO USUÁRIO!**
