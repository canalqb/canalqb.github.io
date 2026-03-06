# 💳 Estrutura de Pagamento Pagar.me (V5)

Este documento descreve a integração segura com a Pagar.me para sistemas de E-commerce.

## 🧱 Arquivos Necessários
- `/config_pagarme.php`: Credenciais e URLs da API.
- `/checkout.php`: Interface de coleta de dados.
- `/processar_pagamento.php`: Lógica de integração via cURL.
- `/webhook.php`: Recebimento de status em tempo real.

## 🔑 Configuração (config_pagarme.php)
```php
<?php
define("PAGARME_SECRET_KEY", "sk_test_XXXXXX");
define("PAGARME_URL", "https://api.pagar.me/core/v5/orders");
?>
```

## 🛒 Fluxo de Processamento (processar_pagamento.php)
```php
<?php
// Exemplo simplificado de payload para PIX, Débito e Crédito (até 3x)
$data = [
    "items" => [["amount" => 19700, "description" => "Pedido #1", "quantity" => 1]],
    "customer" => ["name" => $nome, "email" => $email, "document" => $cpf, "type" => "individual"],
    "payments" => [
        [
            "payment_method" => $metodo_escolhido, // 'pix', 'credit_card', 'debit_card'
            "credit_card" => [
                "installments" => $parcelas, // max 3 conforme regra de negócio
                "card" => ["number" => $num, "holder_name" => $nome, "exp_month" => $m, "exp_year" => $y, "cvv" => $cvv]
            ]
        ]
    ]
];
```

## 🛡️ Segurança Obrigatória
1. **Tokenização**: Em produção, NUNCA envie os dados do cartão em texto puro para o seu servidor. Use o `pagarme-js` no frontend para gerar um `card_token`.
2. **HTTPS**: Obrigatório para transações de cartão.
3. **Webhooks**: Valide a assinatura do Pagar.me para evitar falsificações de status.

---
*Regra master: Sempre utilize centavos para valores monetários (Ex: R$ 1,00 = 100).*
