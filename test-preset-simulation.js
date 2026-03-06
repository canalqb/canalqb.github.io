/**
 * TESTE DE SIMULAÇÃO DO PRESET VERTICAL
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

// Teste de simulação exata do modo vertical
console.log('🧪 TESTE DE SIMULAÇÃO DO PRESET VERTICAL');
console.log('='.repeat(50));

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

// Simula a verificação do código
const coordsInicio = hexToMatrixCoords(inicio.toString(16));
const coordsFim = hexToMatrixCoords(fim.toString(16));

console.log(`\n🔍 Verificação do código:`);
console.log(`coordsInicio.row: ${coordsInicio?.row}`);
console.log(`coordsFim.row: ${coordsFim?.row}`);
console.log(`coordsInicio.col: ${coordsInicio?.col}`);
console.log(`coordsFim.col: ${coordsFim?.col}`);
console.log(`Mesma linha: ${coordsInicio?.row === coordsFim?.row}`);
console.log(`Mesma coluna: ${coordsInicio?.col === coordsFim?.col}`);
console.log(`Mesma coordenada: ${coordsInicio?.row === coordsFim?.row && coordsInicio?.col === coordsFim?.col}`);

// Simula a geração de hex
console.log(`\n🔢 Simulação da geração (primeiros 20):`);

for (let i = 0; i < 20; i++) {
  const offset = BigInt(i);
  
  if (coordsInicio && coordsFim && 
      coordsInicio.row === coordsFim.row && 
      coordsInicio.col === coordsFim.col) {
    // 📍 Intervalo em única coordenada: usa sequência normal
    const rangeSize = fim - inicio + 1n;
    const hexOffset = offset % rangeSize;
    const currentHex = bigIntToHex(inicio + hexOffset);
    
    console.log(`${i + 1}: ${currentHex} (sequência normal)`);
  } else {
    // 📍 Intervalo em múltiplas coordenadas: usa ordenação vertical
    console.log(`${i + 1}: (usaria ordenação vertical)`);
  }
}

console.log('='.repeat(50));
