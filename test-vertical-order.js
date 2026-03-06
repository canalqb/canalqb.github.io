/**
 * TESTE DE ORDEM VERTICAL CORRETA
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

// Teste com o intervalo do preset
console.log('🧪 TESTE DE ORDEM VERTICAL CORRETA');
console.log('='.repeat(50));

const inicioHex = '800000000000018318';
const fimHex = '800000000000018320'; // Intervalo menor para teste

console.log(`\nIntervalo do Preset (reduzido para teste):`);
console.log(`INÍCIO: ${inicioHex}`);
console.log(`FIM: ${fimHex}`);

const inicio = BigInt('0x' + inicioHex);
const fim = BigInt('0x' + fimHex);

// Simula a lógica vertical
const verticalHexs = [];

// Coleta todos os hex no intervalo
for (let hex = inicio; hex <= fim; hex++) {
  verticalHexs.push(hex);
}

console.log(`\n📊 Hex no intervalo (ordem original):`);
verticalHexs.forEach((hex, index) => {
  const coords = hexToMatrixCoords(hex.toString(16));
  console.log(`${index + 1}: ${hex.toString(16)} -> L${coords?.row}xC${coords?.col}`);
});

// Ordena verticalmente: por coordenadas (coluna, linha)
verticalHexs.sort((a, b) => {
  const coordsA = hexToMatrixCoords(a.toString(16));
  const coordsB = hexToMatrixCoords(b.toString(16));
  
  if (!coordsA || !coordsB) return 0;
  
  // Ordem vertical: coluna primeiro, depois linha
  if (coordsA.col !== coordsB.col) {
    return coordsA.col - coordsB.col;
  }
  return coordsA.row - coordsB.row;
});

console.log(`\n📊 Hex em ordem vertical:`);
verticalHexs.forEach((hex, index) => {
  const coords = hexToMatrixCoords(hex.toString(16));
  console.log(`${index + 1}: ${hex.toString(16)} -> L${coords?.row}xC${coords?.col}`);
});

console.log(`\n🔢 Geração sequencial em modo vertical:`);
for (let i = 0; i < Math.min(10, verticalHexs.length); i++) {
  const currentHex = bigIntToHex(verticalHexs[i]);
  console.log(`${i + 1}: ${currentHex}`);
}

console.log('='.repeat(50));
