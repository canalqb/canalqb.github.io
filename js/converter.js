(function () {
  const converterInput = document.getElementById('converterInput');
  const convertBtn = document.getElementById('convertBtn');
  const clearConverterBtn = document.getElementById('clearConverterBtn');
  const converterHex = document.getElementById('converterHex');
  const converterWifCompressed = document.getElementById('converterWifCompressed');
  const converterWifUncompressed = document.getElementById('converterWifUncompressed');

  if (!converterInput || !convertBtn || !clearConverterBtn || !converterHex || !converterWifCompressed || !converterWifUncompressed) return;

  // Importante: reaproveita funções do auto16.js se existirem
  function hexToBytes(hex) {
    if (typeof window.hexToBytes === 'function') return window.hexToBytes(hex);
    return Uint8Array.from(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
  }

  function bytesToHex(bytes) {
    if (typeof window.bytesToHex === 'function') return window.bytesToHex(bytes);
    return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function toWIF(hex, compressed) {
    if (typeof window.toWIF === 'function') return window.toWIF(hex, compressed);
    // fallback simples se não houver bitcoinjs
    const key = hexToBytes(hex);
    const payload = new Uint8Array([0x80, ...key, ...(compressed ? [0x01] : [])]);
    const h1 = await crypto.subtle.digest('SHA-256', payload);
    const h2 = await crypto.subtle.digest('SHA-256', h1);
    const full = new Uint8Array([...payload, ...new Uint8Array(h2).slice(0, 4)]);
    return base58(full);
  }

  const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  function base58(buf) {
    let zeros = 0;
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === 0) zeros++;
      else break;
    }
    let x = BigInt('0x' + [...buf].map(b => b.toString(16).padStart(2, '0')).join(''));
    let out = '';
    while (x > 0n) {
      out = BASE58[Number(x % 58n)] + out;
      x /= 58n;
    }
    return '1'.repeat(zeros) + out;
  }

  function detectFormat(str) {
    const s = str.trim();
    if (/^[KL][1-9A-HJ-NP-Za-km-z]{50,}$/.test(s)) return 'wif';
    if (/^[0-1]+$/.test(s)) return 'binary';
    if (/^\d+$/.test(s)) return 'decimal';
    if (/^[0-9a-fA-F]{64}$/.test(s)) return 'hex';
    return null;
  }

  function binaryToHex(bin) {
    const pad = (64 - bin.length % 64) % 64;
    const padded = bin.padStart(pad + bin.length, '0');
    const hex = BigInt('0b' + padded).toString(16);
    return hex;
  }

  function decimalToHex(dec) {
    const hex = BigInt(dec).toString(16);
    return hex;
  }

  async function convert() {
    const input = converterInput.value.trim();
    if (!input) {
      converterHex.value = converterWifCompressed.value = converterWifUncompressed.value = '';
      return;
    }

    const format = detectFormat(input);
    let hex = '';

    try {
      if (format === 'hex') {
        hex = input.toLowerCase();
      } else if (format === 'binary') {
        hex = binaryToHex(input);
      } else if (format === 'decimal') {
        hex = decimalToHex(input);
      } else if (format === 'wif') {
        // WIF -> HEX (simplificado, sem bitcoinjs)
        const decoded = base58ToUint8Array(input);
        hex = bytesToHex(decoded.slice(1, 33));
      } else {
        converterHex.value = 'Formato não reconhecido';
        converterWifCompressed.value = converterWifUncompressed.value = '';
        return;
      }

      converterHex.value = hex;
      converterWifCompressed.value = await toWIF(hex, true);
      converterWifUncompressed.value = await toWIF(hex, false);
    } catch (e) {
      converterHex.value = 'Erro na conversão';
      converterWifCompressed.value = converterWifUncompressed.value = '';
      console.error('Erro no conversor:', e);
    }
  }

  function base58ToUint8Array(b58) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let decoded = 0n;
    for (let i = 0; i < b58.length; i++) {
      const char = b58[i];
      const value = BigInt(alphabet.indexOf(char));
      decoded = decoded * 58n + value;
    }
    const hex = decoded.toString(16).padStart(68, '0'); // 1 + 32 + 4 checksum
    return Uint8Array.from(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
  }

  function clearAll() {
    converterInput.value = converterHex.value = converterWifCompressed.value = converterWifUncompressed.value = '';
  }

  convertBtn.addEventListener('click', convert);
  clearConverterBtn.addEventListener('click', clearAll);
  converterInput.addEventListener('input', () => {
    if (converterInput.value.trim()) convert(); else clearAll();
  });
})();
