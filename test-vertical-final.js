/**
 * TESTE FINAL DO MODO VERTICAL
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

// Teste para entender o que está acontecendo
console.log('🧪 TESTE FINAL DO MODO VERTICAL');
console.log('='.repeat(50));

const inicioHex = '800000000000018318';
const fimHex = '800000000000018320';

console.log(`\nIntervalo do Preset:`);
console.log(`INÍCIO: ${inicioHex}`);
console.log(`FIM: ${fimHex}`);

const inicio = BigInt('0x' + inicioHex);
const fim = BigInt('0x' + fimHex);

console.log(`\nCoordenadas:`);
console.log(`INÍCIO: L${hexToMatrixCoords(inicioHex)?.row}xC${hexToMatrixCoords(inicioHex)?.col}`);
console.log(`FIM: L${hexToMatrixCoords(fimHex)?.row}xC${hexToMatrixCoords(fimHex)?.col}`);

// Verifica se está em única coordenada
const coordsInicio = hexToMatrixCoords(inicio.toString(16));
const coordsFim = hexToMatrixCoords(fim.toString(16));

console.log(`\n🔍 Análise:`);
console.log(`Mesma coordenada: ${coordsInicio?.row === coordsFim?.row && coordsInicio?.col === coordsFim?.col}`);

if (coordsInicio?.row === coordsFim?.row && coordsInicio?.col === coordsFim?.col) {
  console.log(`\n📍 Está em única coordenada - usando sequência normal:`);
  
  for (let i = 0; i < 10; i++) {
    const offset = BigInt(i);
    const rangeSize = fim - inicio + 1n;
    const hexOffset = offset % rangeSize;
    const currentHex = bigIntToHex(inicio + hexOffset);
    
    console.log(`${i + 1}: ${currentHex}`);
  }
} else {
  console.log(`\n📍 Está em múltiplas coordenadas - usando ordenação vertical:`);
  // Lógica vertical aqui
}

console.log(`\n🤔 O que você espera para modo vertical em única coordenada?`);
console.log(`Talvez uma ordem diferente baseada nos bits internos?`);

console.log('='.repeat(50));
