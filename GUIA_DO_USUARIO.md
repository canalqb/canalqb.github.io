# 🧩 Guia do Usuário: Explorador de Chaves Bitcoin

Bem-vindo ao **Explorador de Chaves Bitcoin**, uma ferramenta educacional e colaborativa projetada para demonstrar visualmente como as chaves privadas do Bitcoin são formadas e para ajudar na busca coletiva por "puzzles" (desafios) da rede Bitcoin.

Este documento explica todos os recursos do site em uma linguagem simples, sem necessidade de conhecimentos técnicos em programação.

---

## 🎨 1. A Matriz Visual (Grid 16x16)
O quadrado central com 256 pequenos blocos é a representação visual de uma **Chave Privada Bitcoin**.
- **Blocos Brancos**: Representam o bit `0` (desligado).
- **Blocos Verdes**: Representam o bit `1` (ligado).
- **Faixa Azul**: Indica a área da chave que está sendo alterada automaticamente pelo sistema.
- **Interatividade**: Você pode clicar nos blocos para ligar ou desligar bits manualmente e ver a chave mudar em tempo real.

---

## 🚀 2. Modos de Busca
O site oferece diferentes maneiras de explorar as chaves:

### 📥 Presets (Puzzles Oficiais)
No topo, você pode escolher um "Puzzle" específico (ex: Puzzle 66, 70, 130). 
- Ao selecionar um puzzle e clicar em **Aplicar**, o sistema configura automaticamente a matriz para a faixa correta de bits onde aquela carteira premiada se encontra.

### ↔️ Modo Horizontal (Sequencial)
O sistema testa as chaves uma após a outra, começando pelas duas pontas do intervalo (início e fim) e indo em direção ao meio. É a busca mais organizada.

### ↕️ Modo Vertical
Uma abordagem diferente que explora as combinações de bits seguindo as colunas da matriz. Ideal para cobrir áreas que o modo horizontal ainda não alcançou.

### 🎲 Modo Aleatório
O sistema gera chaves de forma totalmente imprevisível dentro da faixa escolhida. É como "tentar a sorte" em diferentes pontos do mapa ao mesmo tempo.

---

## ☁️ 3. Sincronização e Colaboração
Um dos recursos mais poderosos do site é o trabalho em equipe:
- **Salvamento Automático**: Enquanto você deixa o site rodando no modo sequencial, seu progresso é enviado para um banco de dados global.
- **Ajuda Coletiva**: Se você fechar o site e voltar depois, o sistema saberá onde você parou. Além disso, você estará ajudando a comunidade a "limpar" faixas de chaves que já foram testadas.
- **🏆 Galeria de Localizadas**: No menu superior, o botão **Localizadas** mostra todas as carteiras com saldo que já foram encontradas pelos usuários deste sistema.

---

## 🥚 4. Eggs Hunter (Caçador de Ovos)
Este é um sistema silencioso que roda em segundo plano:
- Ele acumula chaves geradas e, a cada 1000 chaves, faz uma verificação rápida na rede Bitcoin para ver se alguma delas possui saldo.
- Se encontrar algo, ele registra automaticamente na galeria de conquistas.

---

## 🛠️ 5. Ferramentas Adicionais
- **Velocidade**: Você pode ajustar o controle deslizante para processar chaves mais rápido ou mais devagar, dependendo da potência do seu computador.
- **Formatos de Chave**: O site exibe a chave em três formatos:
  - **HEX**: O código "bruto" da chave.
  - **WIF (C)**: A chave formatada para ser importada em carteiras modernas (Comprimida).
  - **WIF (U)**: O formato antigo de chaves (Não Comprimida).
- **Modo Noturno**: Clique no ícone da Lua/Sol no topo para alternar entre o tema claro e escuro.
- **Uso em Segundo Plano**: O site foi otimizado para continuar trabalhando mesmo se você mudar de aba ou minimizar o navegador.

---

## ⚠️ Observação Importante
Esta ferramenta é estritamente **educacional**. Embora ela seja capaz de encontrar chaves reais, a probabilidade matemática de achar uma chave com saldo fora dos puzzles conhecidos é extremamente baixa. Use para aprender e contribuir com a busca coletiva!

---
*Desenvolvido com ❤️ pela comunidade @CanalQb*
