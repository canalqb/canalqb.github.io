import { PhpWeb } from 'https://cdn.jsdelivr.net/npm/php-wasm@0.0.9-alpha-20/PhpWeb.mjs';

const output = document.getElementById('app');
let phpOutput = '';
const php = new PhpWeb();

// Captura saída padrão do PHP
php.addEventListener('output', e => {
  phpOutput += e.detail + '\n';
});

// Quando o PHP estiver pronto...
php.addEventListener('ready', async () => {
  output.innerHTML = 'Executando PHP...';

  // ✅ Executa o index.php após garantir que todos os arquivos estão carregados
  try {
    await php.run(`<?php include "/index.php"; ?>`);
    output.innerHTML = phpOutput;
  } catch (err) {
    output.textContent = 'Erro ao executar PHP: ' + err.message;
  }
});

// ✅ Antes de executar, carregue TODOS os arquivos PHP no FS virtual
const phpFiles = ['index.php', 'head.php', 'nav.php', 'main.php', 'footer.php'];

for (const file of phpFiles) {
  const res = await fetch('phps/' + file);
  if (!res.ok) {
    output.textContent = `Erro ao carregar ${file}: ${res.statusText}`;
    throw new Error(`Erro ao carregar ${file}`);
  }
  const content = await res.text();
  await php.writeFile('/' + file, content);
}
