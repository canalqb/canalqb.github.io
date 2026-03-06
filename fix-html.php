<?php
$html = file_get_contents('index.html');
$options = '';
for ($i = 0; $i <= 256; $i++) {
    $puzzle = $i + 1;
    $options .= '<option value="' . $i . '">Puzzle ' . $puzzle . '</option>' . "\n";
}
$options .= '<option value="">Nenhuma carteira com saldo</option>' . "\n";
$html = preg_replace(
    '/(<select class="form-select" id="presetBits"[^>]*>).*?(<\/select>)/is',
    "$1\n" . $options . "$2",
    $html
);
if(file_put_contents('index.html', $html)) {
    echo "Sucesso!";
} else {
    echo "Falha ao salvar.";
}
?>
