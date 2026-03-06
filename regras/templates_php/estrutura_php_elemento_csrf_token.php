<?php
declare(strict_types=1);
function csrf_token_start(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) session_start();
    if (empty($_SESSION['csrf']) || ($_SESSION['csrf']['exp'] ?? 0) < time()) {
        $_SESSION['csrf'] = ['value' => bin2hex(random_bytes(32)), 'exp' => time() + 1800];
    }
}
function csrf_token(): string { csrf_token_start(); return (string)$_SESSION['csrf']['value']; }
function csrf_input(): string { return '<input type="hidden" name="_csrf" value="'.htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8').'">'; }
function csrf_valid(): bool {
    csrf_token_start();
    $t = $_POST['_csrf'] ?? ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? null);
    if (!$t) return false;
    if (($_SESSION['csrf']['exp'] ?? 0) < time()) return false;
    return hash_equals((string)$_SESSION['csrf']['value'], (string)$t);
}
function csrf_require(): void {
    if (!csrf_valid()) { http_response_code(419); exit('CSRF inválido ou expirado'); }
}

