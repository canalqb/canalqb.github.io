import { PhpWeb } from 'https://cdn.jsdelivr.net/npm/php-wasm@0.0.9-alpha-20/PhpWeb.mjs';

const output = document.getElementById('app');
let phpOutput = '';
const php = new PhpWeb();

php.addEventListener('output', e => {
  phpOutput += e.detail + '\n';
});

php.addEventListener('ready', async () => {
  await php.run(`<?php include "/index.php"; ?>`);
  output.innerHTML = phpOutput;
});

// Carrega os arquivos PHP necessários para o FS virtual
const files = [
  'index.php',
  'head.php',
  'footer.php',
  'nav.php',
  'main.php'
];

for (const file of files) {
  const response = await fetch('phps/' + file);
  const content = await response.text();
  await php.writeFile('/' + file, content);
}
