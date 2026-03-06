const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
let options = '';
for (let i = 0; i <= 256; i++) {
    let puzzle = i + 1;
    let next = i + 1;
    options += `          <option value="${i}">Puzzle ${puzzle} (2^${i} a 2^${next} - 1)</option>\n`;
}
options += '          <option value="">Nenhuma carteira com saldo</option>\n        ';

html = html.replace(/(<select class="form-select" id="presetBits"[^>]*>)[\s\S]*?(<\/select>)/, `$1\n${options}$2`);
fs.writeFileSync('index.html', html);
console.log('Done!');
