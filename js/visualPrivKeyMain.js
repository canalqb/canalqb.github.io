// ###############################################################################
// #                                                                             #
// #        JS script for creating Visual 16x16 (256bit) BTC private keys        #
// #                                                                             #
// #           Visual private key generator (c) 2019 by MrFreeDragon             #
// #                                                                             #
// ###############################################################################

(() => {
  const cellSize = 28;
  const gridCount = 16;
  const canvasSize = cellSize * gridCount;

  const cellFillColor = "green";   // Cell color when bit=1
  const cellNoFillColor = "white"; // Cell color when bit=0
  const cellBlockColor = "#a8a8a8"; // Cell color when line/column blocked

  const BTCOrderBin = "1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111010111010101011101101110011100110101011110100100010100000001110111011111111010010010111101000110011010000001101100100000101000000".split("");

  // HTML elements
  const canvas = document.getElementById("BTCpic");
  const ctx = canvas.getContext("2d");

  const BTCbin = document.getElementById("BTCb");
  const BTChex = document.getElementById("BTCh");
  const BTCp_gen = document.getElementById("BTCpub");
  const BTCaddr_gen = document.getElementById("BTCaddr");
  const BTCp_c_gen = document.getElementById("BTCpubC");
  const BTCaddr_c_gen = document.getElementById("BTCaddrC");
  const BTCadd_trans = document.getElementById("BTCaddrCheck");
  const BTCadd_c_trans = document.getElementById("BTCaddrCheckC");

  const HEXtick = document.getElementById("ownHEX");
  const HEXinput = document.getElementById("BTChIn");
  const HEXform = document.getElementById("ownHEXform");
  const AdvOptform = document.getElementById("AdvOptDIV");

  const ExportKeyType = document.getElementById("IsCompressedExportKey");
  const ExportDIV = document.getElementById("ExportKey");
  const ExportPriv = document.getElementById("PrivKeyExport");
  const ExportWIF = document.getElementById("PrivKeyWIF");
  const ExportAddr = document.getElementById("AddressExport");

  const PrivKeyCaution = document.getElementById("Caution");

  // State variables
  let BTCpk = Array.from({ length: gridCount }, () => Array(gridCount).fill(0));
  let blockX = Array(gridCount).fill(0);
  let blockY = Array(gridCount).fill(0);
  let IsLinesBlockOption = false;
  let LastCell = [-1, -1];
  let timer = null;
  let BlockExplorer = "https://btc.com/";
  let APIrequestURL = "https://blockchain.info/q/getreceivedbyaddress/";

  // Setup canvas
  canvas.width = canvasSize + cellSize;
  canvas.height = canvasSize + cellSize;

  // Draw grid lines and labels
  function drawGrid() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setLineDash([1, 3]);
    ctx.strokeStyle = "blue";

    // vertical lines
    for (let x = cellSize - 0.5; x <= canvasSize + cellSize; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, cellSize);
      ctx.lineTo(x, canvasSize + cellSize);
      ctx.stroke();
    }

    // horizontal lines
    for (let y = cellSize - 0.5; y <= canvasSize + cellSize; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(cellSize, y);
      ctx.lineTo(canvasSize + cellSize, y);
      ctx.stroke();
    }

    // Labels 1-16 on X and Y axes
    ctx.font = "bold 12px Verdana";
    ctx.fillStyle = "green";

    for (let i = 1; i <= gridCount; i++) {
      ctx.fillText(i, 5, 20 + i * cellSize);
      ctx.fillText(i, 5 + i * cellSize, 20);
    }
  }

  // Fill cells based on BTCpk array and blocks
  function fillAllCells() {
    for (let x = 0; x < gridCount; x++) {
      for (let y = 0; y < gridCount; y++) {
        let color = BTCpk[y][x] === 1 ? cellFillColor : cellNoFillColor;
        if (blockX[x] === 1 || blockY[y] === 1) color = cellBlockColor;
        ctx.fillStyle = color;
        ctx.fillRect(cellSize + x * cellSize, cellSize + y * cellSize, cellSize - 1, cellSize - 1);
      }
    }
  }

  // Convert BTCpk array to binary string
  function privFromArr() {
    return BTCpk.flat().join('');
  }

  // Convert binary string to hex string
  function bin2hex(bin) {
    let hex = '';
    let res = bin.length % 4;
    for (let i = 0; i < bin.length - res; i += 4) {
      let chunk = bin.substr(bin.length - i - 4, 4);
      hex = parseInt(chunk, 2).toString(16) + hex;
    }
    if (res > 0) {
      hex = parseInt(bin.substr(0, res), 2).toString(16) + hex;
    }
    return hex;
  }

  // Convert hex string to binary string with padding
  function hex2bin(hex) {
    return hex.split('').map(ch => parseInt(ch, 16).toString(2).padStart(4, '0')).join('');
  }

  // Pad string to length with char (left pad)
  function pad(str, len, ch) {
    return ch.repeat(len - str.length) + str;
  }

  // Check if binary number is less or equal BTC order
  function isInOrder(binStr) {
    if (binStr.length > 256) return false;
    if (binStr.length < 256) return true; // smaller length means smaller number

    for (let i = 0; i < 256; i++) {
      if (binStr[i] > BTCOrderBin[i]) return false;
      if (binStr[i] < BTCOrderBin[i]) return true;
    }
    return true;
  }

  // Calculate keys and addresses (using BitcoinJS or similar library)
  function legacyAddr(sec_key_hex) {
    const secKey = pad(sec_key_hex, 64, '0');
    const hash = Crypto.util.hexToBytes(secKey);
    const eckey = new Bitcoin.ECKey(hash);
    const eckey_c = new Bitcoin.ECKey(hash);

    const curve = getSECCurveByName("secp256k1");
    const pt = curve.getG().multiply(eckey.priv);

    eckey_c.pub = getEncoded(pt, true);
    eckey_c.pubKeyHash = Bitcoin.Util.sha256ripe160(eckey_c.pub);

    const hash160 = eckey.getPubKeyHash();
    const hash160_c = eckey_c.getPubKeyHash();

    const pubkey = Crypto.util.bytesToHex(getEncoded(pt, false));
    const pubkey_c = Crypto.util.bytesToHex(eckey_c.pub);

    const addr = new Bitcoin.Address(hash160);
    const addr_c = new Bitcoin.Address(hash160_c);

    return [pubkey, addr.toString(), pubkey_c, addr_c.toString()];
  }

  // Get encoded public key (compressed or uncompressed)
  function getEncoded(pt, compressed) {
    const x = pt.getX().toBigInteger();
    const y = pt.getY().toBigInteger();
    let enc = integerToBytes(x, 32);
    if (compressed) {
      enc.unshift(y.isEven() ? 0x02 : 0x03);
    } else {
      enc.unshift(0x04);
      enc = enc.concat(integerToBytes(y, 32));
    }
    return enc;
  }

  // Fill or clear a cell on canvas and update BTCpk array
  function fillCell([x, y]) {
    if (x < 0 || y < 0 || x >= gridCount || y >= gridCount) return;
    if (x === LastCell[0] && y === LastCell[1]) return; // same cell as last filled

    if (blockX[x] === 1 || blockY[y] === 1) return; // blocked line or column

    BTCpk[y][x] = BTCpk[y][x] === 0 ? 1 : 0;
    const color = BTCpk[y][x] === 1 ? cellFillColor : cellNoFillColor;

    ctx.fillStyle = color;
    ctx.fillRect(cellSize + x * cellSize, cellSize + y * cellSize, cellSize - 1, cellSize - 1);

    LastCell = [x, y];
    updateKeyAndAddress();
  }

  // Event handler for canvas click
  function onCanvasClick(evt) {
    const rect = canvas.getBoundingClientRect();
    const mx = evt.clientX - rect.left - cellSize;
    const my = evt.clientY - rect.top - cellSize;

    if (mx < 0 || my < 0) return;

    const x = Math.floor(mx / cellSize);
    const y = Math.floor(my / cellSize);

    fillCell([x, y]);
  }

  // Toggle blocking of lines/columns
  function toggleBlockLine(e) {
    IsLinesBlockOption = e.target.checked;
    if (IsLinesBlockOption) {
      AdvOptform.style.display = "block";
    } else {
      AdvOptform.style.display = "none";
      blockX.fill(0);
      blockY.fill(0);
    }
    fillAllCells();
  }

  // Block or unblock line or column
  function blockLineOrCol(type, index) {
    if (!IsLinesBlockOption) return;

    if (type === 'X') {
      blockX[index] = blockX[index] === 0 ? 1 : 0;
    } else if (type === 'Y') {
      blockY[index] = blockY[index] === 0 ? 1 : 0;
    }
    fillAllCells();
  }

  // Update hex and binary fields, and compute keys and addresses
  function updateKeyAndAddress() {
    const priv_bin = privFromArr();
    BTCbin.value = priv_bin;

    const priv_hex = bin2hex(priv_bin).padStart(64, '0');
    BTChex.value = priv_hex;

    if (!isInOrder(priv_bin)) {
      PrivKeyCaution.style.display = "block";
    } else {
      PrivKeyCaution.style.display = "none";
    }

    const [pub, addr, pubC, addrC] = legacyAddr(priv_hex);

    BTCp_gen.value = pub;
    BTCaddr_gen.value = addr;
    BTCp_c_gen.value = pubC;
    BTCaddr_c_gen.value = addrC;

    ExportPriv.value = priv_hex;
    ExportWIF.value = ""; // Here you can add conversion to WIF if needed
    ExportAddr.value = ExportKeyType.checked ? addrC : addr;
  }

  // Load private key from hex input
  function loadHexKey() {
    const hexKey = HEXinput.value.trim();
    if (!hexKey.match(/^[0-9a-fA-F]{1,64}$/)) {
      alert("Chave hexadecimal inválida!");
      return;
    }
    const binKey = hex2bin(hexKey).padStart(256, '0');

    for (let i = 0; i < gridCount; i++) {
      for (let j = 0; j < gridCount; j++) {
        BTCpk[i][j] = +binKey[i * gridCount + j];
      }
    }
    fillAllCells();
    updateKeyAndAddress();
  }

  // Initialization
  function init() {
    drawGrid();
    fillAllCells();
    updateKeyAndAddress();

    canvas.addEventListener('click', onCanvasClick);

    HEXtick.addEventListener('change', (e) => {
      if (e.target.checked) {
        HEXform.style.display = "block";
      } else {
        HEXform.style.display = "none";
      }
    });

    document.getElementById("ownHEXbtn").addEventListener('click', loadHexKey);

    document.getElementById("LinesBlockOption").addEventListener('change', toggleBlockLine);

    ExportKeyType.addEventListener('change', updateKeyAndAddress);
  }

  init();

})();
