/**
 * TESTE DE INTERVALO VERTICAL CORRIGIDO
 */

// Simula as funções necessárias
function bigIntToHex(bigint) {
  return bigint.toString(16).padStart(64, '0');
}

// Teste com o intervalo do preset
console.log('🧪 TESTE DE INTERVALO VERTICAL CORRIGIDO');
console.log('='.repeat(50));

const inicioHex = '800000000000018318';
const fimHex = 'fffffffffffff4867';

console.log(`\nIntervalo do Preset:`);
console.log(`INÍCIO: ${inicioHex}`);
console.log(`FIM: ${fimHex}`);

const inicio = BigInt('0x' + inicioHex);
const fim = BigInt('0x' + fimHex);

console.log(`\nConvertido para BigInt:`);
console.log(`INÍCIO: ${inicio}`);
console.log(`FIM: ${fim}`);

const rangeSize = fim - inicio + 1n;
console.log(`\nTamanho do intervalo: ${rangeSize}`);

console.log(`\n🔢 Geração de Hex no Intervalo:`);

// Simula geração de hex
for (let i = 0; i < 10; i++) {
  const offset = BigInt(i);
  const hexOffset = offset % rangeSize;
  const currentHex = bigIntToHex(inicio + hexOffset);
  
  console.log(`${i + 1}: ${currentHex}`);
}

console.log(`\n🔍 Verificação:`);
console.log(`Primeiro hex: ${bigIntToHex(inicio)}`);
console.log(`Último hex: ${bigIntToHex(fim)}`);
console.log(`Hex intermediário: ${bigIntToHex(inicio + 1000n)}`);

console.log('='.repeat(50));
