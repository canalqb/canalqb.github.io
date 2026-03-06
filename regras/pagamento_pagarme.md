# Padrão de Checkout e Pagamento: Pagar.me (Pix, Débito e Crédito)
Se o LLM receber solicitação para criar ou modificar módulos de compra e venda online para produtos da pizzaria (E-commerce / E-store), a documentação técnica oficial de refêrencia será esta: Pagar.me via cURL, integrando Pix, Débito, e em até 3x no Crédito.

## Condições Principais
⚠️ Use apenas PHP + MySQL, sem frameworks externos.
⚠️ Todos os scripts devem estar na pasta `modulos/` para chamadas padronizadas (ex: `include 'modulos/checkout.php'`).
⚠️ A Segurança do Cartão (Tokenização) pelo banco é inegociável, nunca armazene CVV cru. Mande os dados por Pagar.me JS SDK.
⚠️ Verificação de webhook exige requisição externa. No localhost informe a necessidade de serviços como o `Ngrok`.

## Estrutura Otimizada (prompt guiado)
1. `modulos/config.php` – Constantes e configurações (chave `PAGARME_SECRET_KEY` + `PAGARME_URL`, variáveis vitais CNPJ/LGPD).
2. `modulos/carrinho.php` – Manipulação de sessão, listagem e botões (add_to_cart).
3. `modulos/checkout.php` – Formulários de cliente e meio de pagamentos, com conversões automáticas (centavos R$ 197,00 => 19700).
4. `modulos/processar_pagamento.php` – Requisição cURL. Se `metodo == 'pix'` adiciona prazo validade QR e método `pix`. Se `metodo == 'credito'`, mapeia `credit_card['installments']`. Executa Update local de `aguardando` pagamento em banco de dados `pedidos`.
5. `modulos/webhook.php` – O ouvinte de endpoint. Captura tipo de request da Pagar.me com POST raw parameters de JSON, confirma assinatura e atualiza banco (`UPDATE pedidos SET status = 'pago'`).
6. `modulos/obrigado.php` – Tela da conversão, instruindo próximos passos do pedido da cozinha.
7. `modulos/erro.php` – Interceptação para chargebacks ou timeouts de sessão no pagamento.
