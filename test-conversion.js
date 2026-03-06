/**
 * TESTE DE CONVERSÃO HEX → COORDENADAS
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
  
  // Pega os 4 primeiros HEX (16 bits) para coordenadas
  const coordsHex = hex.substring(0, 4);
  const coords = parseInt(coordsHex, 16);
  
  // Converte para linha e coluna (16x16 = 256 posições)
  const row = Math.floor(coords / 16);
  const col = coords % 16;
  
  // Valida coordenadas
  if (row < 0 || row >= 16 || col < 0 || col >= 16) {
    return null;
  }
  
  return { row, col };
}

// Teste de conversão
console.log('🧪 TESTE DE CONVERSÃO HEX → COORDENADAS');
console.log('='.repeat(50));

// Teste específico para o problema reportado
const problemHex = '800000000000000000';
console.log('\n🔍 ANÁLISE DO PROBLEMA:');
console.log('Hex completo:', problemHex);
console.log('4 primeiros hex:', problemHex.substring(0, 4));
console.log('Valor decimal:', parseInt(problemHex.substring(0, 4), 16));

// Teste com valores que deveriam funcionar
const testCases = [
  { hex: '8000', desc: 'Linha 8, Coluna 0' },
  { hex: '8001', desc: 'Linha 8, Coluna 1' },
  { hex: '8002', desc: 'Linha 8, Coluna 2' },
  { hex: '800f', desc: 'Linha 8, Coluna 15' },
  { hex: '8010', desc: 'Linha 9, Coluna 0' },
  { hex: '801f', desc: 'Linha 9, Coluna 15' },
  { hex: '80f0', desc: 'Linha 15, Coluna 0' },
  { hex: '80ff', desc: 'Linha 15, Coluna 15' }
];

testCases.forEach(test => {
  const coords = hexToMatrixCoords(test.hex);
  console.log(`\n${test.desc}:`, {
    hex: test.hex,
    coords: coords
  });
});

// Teste com o hex problemático
console.log('\n🚨 TESTE COM HEX PROBLEMÁTICO:');
const problemCoords = hexToMatrixCoords(problemHex);
console.log('Resultado:', problemCoords);

// Teste detalhado do cálculo
console.log('\n🔍 ANÁLISE DETALHADA:');
const coordsHex = problemHex.substring(0, 4);
const coords = parseInt(coordsHex, 16);
console.log('coordsHex:', coordsHex);
console.log('coords decimal:', coords);
console.log('coords binary:', coords.toString(2).padStart(16, '0'));
console.log('coords >> 12:', (coords >> 12).toString(2));
console.log('coords >> 8:', (coords >> 8).toString(2));
console.log('(coords >> 12) & 0xF:', ((coords >> 12) & 0xF).toString(2));
console.log('(coords >> 8) & 0xF:', ((coords >> 8) & 0xF).toString(2));

console.log('='.repeat(50));
