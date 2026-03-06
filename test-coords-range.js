/**
 * TESTE DE COORDENADAS DO PRESET
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

// Teste com o intervalo do preset
console.log('🧪 TESTE DE COORDENADAS DO PRESET');
console.log('='.repeat(50));

const inicioHex = '800000000000018318';
const fimHex = 'fffffffffffff4867';

console.log(`\nIntervalo do Preset:`);
console.log(`INÍCIO: ${inicioHex}`);
console.log(`FIM: ${fimHex}`);

const coordsInicio = hexToMatrixCoords(inicioHex);
const coordsFim = hexToMatrixCoords(fimHex);

console.log(`\nCoordenadas extraídas:`);
console.log(`INÍCIO: L${coordsInicio?.row}xC${coordsInicio?.col}`);
console.log(`FIM: L${coordsFim?.row}xC${coordsFim?.col}`);

// Simula getActiveCellsVertical corrigido
function getActiveCellsVertical(inicioHex, fimHex) {
  const cells = [];
  
  const coordsInicio = hexToMatrixCoords(inicioHex);
  const coordsFim = hexToMatrixCoords(fimHex);
  
  if (coordsInicio && coordsFim) {
    // Gera células no range de coordenadas
    const startRow = coordsInicio.row;
    const endRow = coordsFim.row;
    const startCol = coordsInicio.col;
    const endCol = coordsFim.col;
    
    console.log(`\nRange de coordenadas:`);
    console.log(`Linhas: ${startRow} a ${endRow}`);
    console.log(`Colunas: ${startCol} a ${endCol}`);
    
    // Gera na ordem vertical (coluna por coluna)
    for (let col = startCol; col <= endCol; col++) {
      for (let row = startRow; row <= endRow; row++) {
        if (!cells.some(cell => cell.row === row && cell.col === col)) {
          cells.push({ row: row, col: col });
        }
      }
    }
  }
  
  return cells;
}

console.log(`\n📊 Células verticais geradas:`);
const cells = getActiveCellsVertical(inicioHex, fimHex);
console.log(`Total: ${cells.length}`);

console.log(`\n📍 Células geradas:`);
cells.forEach((cell, index) => {
  console.log(`${index + 1}: L${cell.row}xC${cell.col}`);
});

console.log('='.repeat(50));
