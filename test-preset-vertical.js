/**
 * TESTE DE PRESET VERTICAL
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

// Simula getActiveCellsVertical
function getActiveCellsVertical() {
  const cells = [];
  
  // Simula células verticais para preset 71 bits
  for (let col = 0; col < 16; col++) {
    for (let row = 8; row < 16; row++) {
      cells.push({ row, col });
    }
  }
  
  return cells;
}

// Teste do modo vertical
console.log('🧪 TESTE DE PRESET VERTICAL');
console.log('='.repeat(50));

const verticalCells = getActiveCellsVertical();
console.log(`Células verticais: ${verticalCells.length}`);

console.log('\n📊 Primeiras 10 células:');
verticalCells.slice(0, 10).forEach((cell, index) => {
  console.log(`${index + 1}: Linha ${cell.row}, Coluna ${cell.col}`);
});

// Simula geração de hex vertical
console.log('\n🔢 Geração de Hex Vertical:');
for (let i = 0; i < 10; i++) {
  const presetStateCounter = BigInt(i);
  const cellIndex = Number(presetStateCounter % BigInt(verticalCells.length));
  const cell = verticalCells[cellIndex];
  
  // Converte coordenadas para hex
  const coords = (cell.row << 12) | (cell.col << 8);
  const coordsHex = coords.toString(16).padStart(4, '0');
  
  // Usa offset para variação dentro da célula
  const offset = presetStateCounter / BigInt(verticalCells.length);
  const startRange = 1n << 71n; // 71 bits
  const baseHex = bigIntToHex(startRange + offset);
  
  // Substitui os 4 primeiros hex com as coordenadas da célula
  const currentHex = coordsHex + baseHex.substring(4);
  
  console.log(`${i + 1}: ${currentHex.substring(0, 16)}... (L${cell.row}xC${cell.col})`);
}

console.log('='.repeat(50));
