/**
 * TESTE DE DEBUG DO PRESET VERTICAL CORRIGIDO
 */

// Simula as funções necessárias
function hexToMatrixCoords(hex) {
  if (typeof hex === 'bigint') {
    hex = hex.toString(16).padStart(64, '0');
  } else if (typeof hex === 'string') {
    hex = hex.padStart(64, '0');
  } else {
    return null;
  }
  
  const coordsHex = hex.substring(0, 4);
  const coords = parseInt(coordsHex, 16);
  const row = (coords >> 12) & 0x0F;
  const col = (coords >> 8) & 0x0F;
  
  if (row < 0 || row >= 16 || col < 0 || col >= 16) {
    return null;
  }
  
  return { row, col };
}

function bigIntToHex(bigint) {
  return bigint.toString(16).padStart(64, '0');
}

// Teste com um preset que gera repetição
console.log('🧪 TESTE DE DEBUG DO PRESET VERTICAL CORRIGIDO');
console.log('='.repeat(50));

// Simula um preset que causa repetição
const inicioHex = '400001000000000000';
const fimHex = '400001000100010000';

console.log(`\nIntervalo do Preset:`);
console.log(`INÍCIO: ${inicioHex}`);
console.log(`FIM: ${fimHex}`);

const inicio = BigInt('0x' + inicioHex);
const fim = BigInt('0x' + fimHex);

console.log(`\nCoordenadas:`);
console.log(`INÍCIO: L${hexToMatrixCoords(inicioHex)?.row}xC${hexToMatrixCoords(inicioHex)?.col}`);
console.log(`FIM: L${hexToMatrixCoords(fimHex)?.row}xC${hexToMatrixCoords(fimHex)?.col}`);

// Coleta alguns hex do intervalo para análise
const sampleHexs = [];
for (let i = 0; i < 20 && (inicio + BigInt(i)) <= fim; i++) {
  const hex = inicio + BigInt(i);
  const coords = hexToMatrixCoords(hex.toString(16));
  sampleHexs.push({
    hex: hex.toString(16),
    coords: coords,
    row: coords?.row,
    col: coords?.col
  });
}

console.log(`\n📊 Primeiros 20 hex do intervalo:`);
sampleHexs.forEach((item, index) => {
  console.log(`${index + 1}: ${item.hex} -> L${item.row}xC${item.col}`);
});

// Ordena verticalmente como está fazendo o código
const sortedHexs = [...sampleHexs].sort((a, b) => {
  if (!a.coords || !b.coords) return 0;
  
  // Ordem vertical: coluna primeiro, depois linha
  if (a.col !== b.col) {
    return a.col - b.col;
  }
  return a.row - b.row;
});

console.log(`\n📊 Hex ordenados verticalmente:`);
sortedHexs.forEach((item, index) => {
  console.log(`${index + 1}: ${item.hex} -> L${item.row}xC${item.col}`);
});

console.log(`\n🔍 Análise da repetição:`);
const groupedByCoords = {};
sampleHexs.forEach(item => {
  const key = `L${item.row}xC${item.col}`;
  if (!groupedByCoords[key]) {
    groupedByCoords[key] = [];
  }
  groupedByCoords[key].push(item.hex);
});

Object.entries(groupedByCoords).forEach(([coord, hexs]) => {
  console.log(`${coord}: ${hexs.length} hex`);
  hexs.slice(0, 3).forEach(hex => console.log(`  - ${hex}`));
  if (hexs.length > 3) console.log(`  ... e mais ${hexs.length - 3}`);
});

console.log('='.repeat(50));
