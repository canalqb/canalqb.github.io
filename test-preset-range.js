/**
 * TESTE DE PRESET COM INTERVALO CORRETO
 */

// Simula as funções necessárias
function hexToBigInt(hex) {
  if (!hex || typeof hex !== 'string') return 0n;
  try {
    return BigInt('0x' + hex);
  } catch (e) {
    console.error('Erro ao converter hex para BigInt:', e);
    return 0n;
  }
}

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

// Teste com o intervalo do preset
console.log('🧪 TESTE DE PRESET COM INTERVALO CORRETO');
console.log('='.repeat(50));

const inicioHex = '800000000000018318';
const fimHex = 'fffffffffffff4867';

console.log(`\nIntervalo do Preset:`);
console.log(`INÍCIO: ${inicioHex}`);
console.log(`FIM: ${fimHex}`);

const inicio = hexToBigInt(inicioHex);
const fim = hexToBigInt(fimHex);

console.log(`\nConvertido para BigInt:`);
console.log(`INÍCIO: ${inicio}`);
console.log(`FIM: ${fim}`);

console.log(`\n🔍 Análise das coordenadas no intervalo:`);

// Testa alguns hex no intervalo
const testHexs = [
  inicioHex,
  '800000000000018319',
  '80000000000001831a',
  '80000000000001831b',
  fimHex
];

testHexs.forEach((hex, index) => {
  const coords = hexToMatrixCoords(hex);
  console.log(`${index + 1}: ${hex} -> L${coords?.row}xC${coords?.col}`);
});

// Simula getActiveCellsVertical corrigido
function getActiveCellsVertical(inicioHex, fimHex) {
  const cells = [];
  const inicio = hexToBigInt(inicioHex);
  const fim = hexToBigInt(fimHex);
  
  // Itera sobre o intervalo do preset e extrai coordenadas
  for (let hex = inicio; hex <= fim; hex++) {
    const coords = hexToMatrixCoords(hex.toString(16));
    
    if (coords) {
      // Adiciona apenas se não existir
      if (!cells.some(cell => cell.row === coords.row && cell.col === coords.col)) {
        cells.push({ row: coords.row, col: coords.col });
      }
    }
  }
  
  return cells;
}

console.log(`\n📊 Células verticais no intervalo:`);
const cells = getActiveCellsVertical(inicioHex, fimHex);
console.log(`Total: ${cells.length}`);

console.log(`\n📍 Primeiras 10 células:`);
cells.slice(0, 10).forEach((cell, index) => {
  console.log(`${index + 1}: L${cell.row}xC${cell.col}`);
});

console.log(`\n📍 Últimas 10 células:`);
cells.slice(-10).forEach((cell, index) => {
  console.log(`${cells.length - 9 + index}: L${cell.row}xC${cell.col}`);
});

console.log('='.repeat(50));
