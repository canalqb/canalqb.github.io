import { PhpWeb } from 'https://cdn.jsdelivr.net/npm/php-wasm@0.0.9-alpha-20/PhpWeb.mjs';

const output = document.getElementById('app');
let phpOutput = '';
const php = new PhpWeb();

php.addEventListener('output', e => {
  phpOutput += e.detail + '\n';
});

php.addEventListener('error', e => {
  phpOutput += '[PHP ERROR] ' + e.detail + '\n';
});

php.addEventListener('ready', async () => {
  output.textContent = 'Executando PHP...';

  try {
    // Executa o index.php, que faz os includes internos
    await php.run('<?php include "/index.php"; ?>');
    output.innerHTML = phpOutput;
  } catch (err) {
    output.textContent = 'Erro na execução do PHP: ' + err.message;
  }
});

(async () => {
  // Carregar todos os arquivos PHP para o FS virtual do PHP WASM
  const phpFiles = ['index.php', 'head.php', 'nav.php', 'main.php', 'footer.php'];

  for (const file of phpFiles) {
    const res = await fetch('phps/' + file);
    if (!res.ok) {
      output.textContent = `Erro ao carregar ${file}: ${res.statusText}`;
      return;
    }
    const content = await res.text();
    await php.writeFile('/' + file, content);
  }
})();
