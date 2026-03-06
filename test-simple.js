/**
 * TESTE SIMPLES DE GERAÇÃO VERTICAL
 */

// Teste direto da geração
console.log('🧪 TESTE SIMPLES DE GERAÇÃO VERTICAL');
console.log('='.repeat(50));

// Gera hex verticalmente
for (let col = 0; col < 2; col++) {
  for (let row = 8; row < 10; row++) {
    const coords = (row << 12) | (col << 8);
    const coordsHex = coords.toString(16).padStart(4, '0');
    const hex = '0x' + coordsHex + '0000000000000000';
    
    console.log(`Linha ${row}, Coluna ${col}:`);
    console.log(`  coords: ${coords}`);
    console.log(`  coordsHex: ${coordsHex}`);
    console.log(`  hex: ${hex}`);
    console.log('');
  }
}

console.log('='.repeat(50));
