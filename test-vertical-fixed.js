/**
 * TESTE DE GERAÇÃO VERTICAL CORRIGIDO
 */

// Função de conversão corrigida
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

// Função de geração vertical
function generateVerticalCells(inicioHex, fimHex) {
  const cells = [];
  const inicio = BigInt('0x' + inicioHex);
  const fim = BigInt('0x' + fimHex);
  
  // Gera hex na ordem vertical (coluna por coluna)
  for (let col = 0; col < 16; col++) {
    for (let row = 0; row < 16; row++) {
      // Converte coordenadas para hex
      const coords = (row << 12) | (col << 8);
      const hex = BigInt(coords) << BigInt(48); // Move para os 16 bits superiores
      
      // Verifica se está no intervalo
      if (hex >= inicio && hex <= fim) {
        cells.push({ row, col, hex: hex.toString(16).padStart(64, '0') });
      }
    }
  }
  
  return cells;
}

// Teste
console.log('🧪 TESTE DE GERAÇÃO VERTICAL CORRIGIDO');
console.log('='.repeat(50));

const inicioHex = '800000000000000000';
const fimHex = '800000000000000008';

console.log(`\nIntervalo: ${inicioHex} a ${fimHex}`);

const cells = generateVerticalCells(inicioHex, fimHex);

console.log(`\n📊 Células geradas: ${cells.length}`);
console.log('📍 Primeiras 10 células:');

cells.slice(0, 10).forEach((cell, index) => {
  console.log(`${index + 1}:`, {
    row: cell.row,
    col: cell.col,
    hex: cell.hex.substring(0, 16) + '...',
    coords: hexToMatrixCoords(cell.hex)
  });
});

console.log('\n🔍 Análise da sequência:');
console.log('Esperado: 800000000000000000, 800000000000000001, 800000000000000002...');
console.log('Gerado:');

cells.slice(0, 5).forEach((cell, index) => {
  console.log(`${index + 1}: ${cell.hex}`);
});

console.log('='.repeat(50));
