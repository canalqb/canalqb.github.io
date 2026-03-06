/**
 * TESTE DA NOVA ORDENAÇÃO VERTICAL
 */

// Simula as funções necessárias
function bigIntToHex(bigint) {
  return bigint.toString(16).padStart(64, '0');
}

// Teste da nova ordenação vertical
console.log('🧪 TESTE DA NOVA ORDENAÇÃO VERTICAL');
console.log('='.repeat(50));

const inicioHex = '800000000000018318';
const fimHex = '800000000000018320';

console.log(`\nIntervalo do Preset:`);
console.log(`INÍCIO: ${inicioHex}`);
console.log(`FIM: ${fimHex}`);

const inicio = BigInt('0x' + inicioHex);
const fim = BigInt('0x' + fimHex);

// Simula a nova lógica vertical
const verticalHexs = [];

// Coleta todos os hex no intervalo
for (let hex = inicio; hex <= fim; hex++) {
  verticalHexs.push(hex);
}

console.log(`\n📊 Hex coletados: ${verticalHexs.length}`);

// 🚀 ORDENA VERTICALMENTE BASEADO NOS BITS QUE VARIAM
verticalHexs.sort((a, b) => {
  // Extrai os bits que variam para ordenação vertical
  const hexA = a.toString(16).padStart(64, '0');
  const hexB = b.toString(16).padStart(64, '0');
  
  // 🚀 Usa os últimos 4 hex (posições 60-63) que variam no intervalo
  const endA = hexA.substring(60, 64);
  const endB = hexB.substring(60, 64);
  
  // Compara como número para ordenação vertical
  const numA = parseInt(endA, 16);
  const numB = parseInt(endB, 16);
  
  return numA - numB;
});

console.log(`\n📍 Primeiros 10 hex em ordem vertical:`);
verticalHexs.slice(0, 10).forEach((hex, index) => {
  const hexStr = hex.toString(16).padStart(64, '0');
  const end = hexStr.substring(60, 64);
  const endNum = parseInt(end, 16);
  console.log(`${index + 1}: ${hexStr.substring(0, 16)}... (end: ${end}, num: ${endNum})`);
});

console.log(`\n📍 Últimos 10 hex em ordem vertical:`);
verticalHexs.slice(-10).forEach((hex, index) => {
  const hexStr = hex.toString(16).padStart(64, '0');
  const end = hexStr.substring(60, 64);
  const endNum = parseInt(end, 16);
  console.log(`${verticalHexs.length - 9 + index}: ${hexStr.substring(0, 16)}... (end: ${end}, num: ${endNum})`);
});

console.log(`\n🔢 Simulação da geração (primeiros 10):`);
for (let i = 0; i < 10; i++) {
  const offset = BigInt(i);
  const verticalIndex = Number(offset % BigInt(verticalHexs.length));
  const currentHex = bigIntToHex(verticalHexs[verticalIndex]);
  
  console.log(`${i + 1}: ${currentHex}`);
}

console.log('='.repeat(50));
