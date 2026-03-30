(function () {
  const converterInput = document.getElementById('converterInput');
  const convertBtn = document.getElementById('convertBtn');
  const clearConverterBtn = document.getElementById('clearConverterBtn');
  const converterHex = document.getElementById('converterHex');
  const converterWifCompressed = document.getElementById('converterWifCompressed');
  const converterWifUncompressed = document.getElementById('converterWifUncompressed');
  const converterInt = document.getElementById('converterInt');
  const converterBin = document.getElementById('converterBin');
  const converterPower = document.getElementById('converterPower');
  const converterMersenne = document.getElementById('converterMersenne');

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
    if (typeof window.toWIF === 'function') {
      try {
        return await window.toWIF(hex, compressed);
      } catch (error) {
        console.warn('⚠️ window.toWIF falhou, usando fallback:', error);
      }
    }
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
    // Dígitos somente: tratar como decimal (para HEX só com números, exija 0x)
    if (/^\d+$/.test(s)) return 'decimal';
    // HEX válido: exige prefixo 0x ou conter letras A-F
    if (/^0x[0-9a-fA-F]+$/.test(s) || /[a-fA-F]/.test(s)) return 'hex';
    // Binário
    if (/^[01]+$/.test(s)) return 'binary';
    // WIF
    if (/^[KL][1-9A-HJ-NP-Za-km-z]{50,}$/.test(s)) return 'wif';
    return null;
  }

  function binaryToHex(bin) {
    const hex = BigInt('0b' + bin).toString(16);
    return hex;
  }

  function decimalToHex(dec) {
    const hex = BigInt(dec).toString(16);
    return hex;
  }

  function normalizeHexTo64(h) {
    const clean = h.replace(/^0x/i, '').toLowerCase();
    if (clean.length < 64) return clean.padStart(64, '0');
    if (clean.length > 64) return clean.slice(-64);
    return clean;
  }

  function hexToBinary(h) {
    const clean = h.replace(/^0x/i, '').toLowerCase();
    return BigInt('0x' + clean).toString(2);
  }

  function hexToDecimal(h) {
    const clean = h.replace(/^0x/i, '').toLowerCase();
    return BigInt('0x' + clean).toString(10);
  }

  function largestPowerBefore(n) {
    if (n <= 1n) return 1n; // 2^0
    let k = 0n;
    let p = 1n;
    while ((p << 1n) <= n) {
      p <<= 1n;
      k++;
    }
    return p; // 2^k
  }

  function smallestMersenneAfter(n) {
    if (n < 1n) return 1n; // 2^1-1
    let p = 1n;
    while (p <= n) p <<= 1n;
    return p - 1n; // 2^(k+1)-1
  }

  async function convert() {
    const raw = converterInput.value.trim();
    // Primeiro, verifica WIF sem alterar a string
    const wifPattern = /^[KL][1-9A-HJ-NP-Za-km-z]{50,}$/;
    const isWif = wifPattern.test(raw);
    const input = isWif ? raw : raw.replace(/[\s,._]/g, ''); // remove separadores para hex/dec/bin
    if (!input) {
      converterHex.value = converterWifCompressed.value = converterWifUncompressed.value = '';
      if (converterInt) converterInt.value = '';
      if (converterBin) converterBin.value = '';
      if (converterPower) converterPower.value = '';
      if (converterMersenne) converterMersenne.value = '';
      return;
    }

    const format = isWif ? 'wif' : detectFormat(input);
    let hex = '';

    try {
      if (format === 'hex') {
        hex = input.replace(/^0x/i, '').toLowerCase();
      } else if (format === 'binary') {
        hex = binaryToHex(input);
      } else if (format === 'decimal') {
        hex = decimalToHex(input);
      } else if (format === 'wif') {
        const decoded = base58ToUint8Array(input);
        if (decoded.length < 37) throw new Error('WIF inválido');
        const payload = decoded.slice(0, decoded.length - 4);
        // Remove version (0x80) e byte de compressão (0x01) se existir
        let keyBytes = payload.slice(1);
        if (keyBytes.length === 33 && keyBytes[keyBytes.length - 1] === 0x01) {
          keyBytes = keyBytes.slice(0, 32);
        } else if (keyBytes.length > 32) {
          keyBytes = keyBytes.slice(0, 32);
        }
        hex = bytesToHex(keyBytes);
      } else {
        converterHex.value = 'Formato não reconhecido';
        converterWifCompressed.value = converterWifUncompressed.value = '';
        if (converterInt) converterInt.value = '';
        if (converterBin) converterBin.value = '';
        if (converterPower) converterPower.value = '';
        if (converterMersenne) converterMersenne.value = '';
        return;
      }

      const hex64 = normalizeHexTo64(hex);
      converterHex.value = hex64;
      converterWifCompressed.value = await toWIF(hex64, true);
      converterWifUncompressed.value = await toWIF(hex64, false);

      if (converterInt || converterBin || converterPower || converterMersenne) {
        const n = BigInt('0x' + hex64);
        if (converterInt) converterInt.value = n.toString(10);
        if (converterBin) converterBin.value = n.toString(2);
        // k tal que 2^k <= n < 2^(k+1)
        let k = 0n, p = 1n;
        while ((p << 1n) <= n) { p <<= 1n; k++; }
        const powVal = p;              // 2^k
        const mersenneVal = (p << 1n) - 1n; // 2^(k+1)-1
        if (converterPower) converterPower.value = `k=${k.toString()} ; 2^k = ${powVal.toString(10)} (hex: ${powVal.toString(16)})`;
        if (converterMersenne) converterMersenne.value = `2^(k+1)-1 = ${mersenneVal.toString(10)} (hex: ${mersenneVal.toString(16)})`;
      }
    } catch (e) {
      converterHex.value = 'Erro na conversão';
      converterWifCompressed.value = converterWifUncompressed.value = '';
      if (converterInt) converterInt.value = '';
      if (converterBin) converterBin.value = '';
      if (converterPower) converterPower.value = '';
      if (converterMersenne) converterMersenne.value = '';
      console.error('Erro no conversor:', e);
    }
  }

  function base58ToUint8Array(b58) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let zeros = 0;
    for (let i = 0; i < b58.length && b58[i] === '1'; i++) zeros++;
    let x = 0n;
    for (let i = 0; i < b58.length; i++) {
      const c = b58[i];
      const v = BigInt(alphabet.indexOf(c));
      if (v < 0n) throw new Error('char inválido');
      x = x * 58n + v;
    }
    let hex = x.toString(16);
    if (hex.length % 2) hex = '0' + hex;
    let bytes = Uint8Array.from(hex.match(/.{2}/g).map(h => parseInt(h, 16)));
    if (zeros) {
      const arr = new Uint8Array(zeros + bytes.length);
      arr.set(bytes, zeros);
      bytes = arr;
    }
    return bytes;
  }

  function clearAll() {
    converterInput.value = converterHex.value = converterWifCompressed.value = converterWifUncompressed.value = '';
    if (converterInt) converterInt.value = '';
    if (converterBin) converterBin.value = '';
    if (converterPower) converterPower.value = '';
    if (converterMersenne) converterMersenne.value = '';
  }

  convertBtn.addEventListener('click', convert);
  clearConverterBtn.addEventListener('click', clearAll);
  converterInput.addEventListener('input', () => {
    if (converterInput.value.trim()) convert(); else clearAll();
  });
})();
