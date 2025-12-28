// puzzles.js

// CONFIGURAÇÃO: você pode definir os puzzles de duas formas:
// 1) como objeto JS: const puzzleConfig = { 1: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH', 2: '1CUNEB...' }
// 2) ou como string com linhas "1;address" (no seu exemplo original).
// Aqui eu mostro como aceitar ambos os formatos (se quiser, edite abaixo).

/* ====== INSTRUÇÕES: coloque sua configuração AQUI ====== */
// Exemplo estilo objeto:
const puzzleConfig = {
1: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
2: '1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb',
3: '19ZewH8Kk1PDbSNdJ97FP4EiCjTRaZMZQA',
4: '1EhqbyUMvvs7BfL8goY6qcPbD6YKfPqb7e',
5: '1E6NuFjCi27W5zoXg8TRdcSRq84zJeBW3k',
6: '1PitScNLyp2HCygzadCh7FveTnfmpPbfp8',
7: '1McVt1vMtCC7yn5b9wgX1833yCcLXzueeC',
8: '1M92tSqNmQLYw33fuBvjmeadirh1ysMBxK',
9: '1CQFwcjw1dwhtkVWBttNLDtqL7ivBonGPV',
10: '1LeBZP5QCwwgXRtmVUvTVrraqPUokyLHqe',
11: '1PgQVLmst3Z314JrQn5TNiys8Hc38TcXJu',
12: '1DBaumZxUkM4qMQRt2LVWyFJq5kDtSZQot',
13: '1Pie8JkxBT6MGPz9Nvi3fsPkr2D8q3GBc1',
14: '1ErZWg5cFCe4Vw5BzgfzB74VNLaXEiEkhk',
15: '1QCbW9HWnwQWiQqVo5exhAnmfqKRrCRsvW',
16: '1BDyrQ6WoF8VN3g9SAS1iKZcPzFfnDVieY',
17: '1HduPEXZRdG26SUT5Yk83mLkPyjnZuJ7Bm',
18: '1GnNTmTVLZiqQfLbAdp9DVdicEnB5GoERE',
19: '1NWmZRpHH4XSPwsW6dsS3nrNWfL1yrJj4w',
20: '1HsMJxNiV7TLxmoF6uJNkydxPFDog4NQum',
21: '14oFNXucftsHiUMY8uctg6N487riuyXs4h',
22: '1CfZWK1QTQE3eS9qn61dQjV89KDjZzfNcv',
23: '1L2GM8eE7mJWLdo3HZS6su1832NX2txaac',
24: '1rSnXMr63jdCuegJFuidJqWxUPV7AtUf7',
25: '15JhYXn6Mx3oF4Y7PcTAv2wVVAuCFFQNiP',
26: '1JVnST957hGztonaWK6FougdtjxzHzRMMg',
27: '128z5d7nN7PkCuX5qoA4Ys6pmxUYnEy86k',
28: '12jbtzBb54r97TCwW3G1gCFoumpckRAPdY',
29: '19EEC52krRUK1RkUAEZmQdjTyHT7Gp1TYT',
30: '1LHtnpd8nU5VHEMkG2TMYYNUjjLc992bps',
31: '1LhE6sCTuGae42Axu1L1ZB7L96yi9irEBE',
32: '1FRoHA9xewq7DjrZ1psWJVeTer8gHRqEvR',
33: '187swFMjz1G54ycVU56B7jZFHFTNVQFDiu',
34: '1PWABE7oUahG2AFFQhhvViQovnCr4rEv7Q',
35: '1PWCx5fovoEaoBowAvF5k91m2Xat9bMgwb',
36: '1Be2UF9NLfyLFbtm3TCbmuocc9N1Kduci1',
37: '14iXhn8bGajVWegZHJ18vJLHhntcpL4dex',
38: '1HBtApAFA9B2YZw3G2YKSMCtb3dVnjuNe2',
39: '122AJhKLEfkFBaGAd84pLp1kfE7xK3GdT8',
40: '1EeAxcprB2PpCnr34VfZdFrkUWuxyiNEFv',
41: '1L5sU9qvJeuwQUdt4y1eiLmquFxKjtHr3E',
42: '1E32GPWgDyeyQac4aJxm9HVoLrrEYPnM4N',
43: '1PiFuqGpG8yGM5v6rNHWS3TjsG6awgEGA1',
44: '1CkR2uS7LmFwc3T2jV8C1BhWb5mQaoxedF',
45: '1NtiLNGegHWE3Mp9g2JPkgx6wUg4TW7bbk',
46: '1F3JRMWudBaj48EhwcHDdpeuy2jwACNxjP',
47: '1Pd8VvT49sHKsmqrQiP61RsVwmXCZ6ay7Z',
48: '1DFYhaB2J9q1LLZJWKTnscPWos9VBqDHzv',
49: '12CiUhYVTTH33w3SPUBqcpMoqnApAV4WCF',
50: '1MEzite4ReNuWaL5Ds17ePKt2dCxWEofwk',
51: '1NpnQyZ7x24ud82b7WiRNvPm6N8bqGQnaS',
52: '15z9c9sVpu6fwNiK7dMAFgMYSK4GqsGZim',
53: '15K1YKJMiJ4fpesTVUcByoz334rHmknxmT',
54: '1KYUv7nSvXx4642TKeuC2SNdTk326uUpFy',
55: '1LzhS3k3e9Ub8i2W1V8xQFdB8n2MYCHPCa',
56: '17aPYR1m6pVAacXg1PTDDU7XafvK1dxvhi',
57: '15c9mPGLku1HuW9LRtBf4jcHVpBUt8txKz',
58: '1Dn8NF8qDyyfHMktmuoQLGyjWmZXgvosXf',
59: '1HAX2n9Uruu9YDt4cqRgYcvtGvZj1rbUyt',
60: '1Kn5h2qpgw9mWE5jKpk8PP4qvvJ1QVy8su',
61: '1AVJKwzs9AskraJLGHAZPiaZcrpDr1U6AB',
62: '1Me6EfpwZK5kQziBwBfvLiHjaPGxCKLoJi',
63: '1NpYjtLira16LfGbGwZJ5JbDPh3ai9bjf4',
64: '16jY7qLJnxb7CHZyqBP8qca9d51gAjyXQN',
65: '18ZMbwUFLMHoZBbfpCjUJQTCMCbktshgpe',
66: '13zb1hQbWVsc2S7ZTZnP2G4undNNpdh5so',
67: '1BY8GQbnueYofwSuFAT3USAhGjPrkxDdW9',
68: '1MVDYgVaSN6iKKEsbzRUAYFrYJadLYZvvZ',
69: '19vkiEajfhuZ8bs8Zu2jgmC6oqZbWqhxhG',
70: '19YZECXj3SxEZMoUeJ1yiPsw8xANe7M7QR',
71: '1PWo3JeB9jrGwfHDNpdGK54CRas7fsVzXU',
72: '1JTK7s9YVYywfm5XUH7RNhHJH1LshCaRFR',
73: '12VVRNPi4SJqUTsp6FmqDqY5sGosDtysn4',
74: '1FWGcVDK3JGzCC3WtkYetULPszMaK2Jksv',
75: '1J36UjUByGroXcCvmj13U6uwaVv9caEeAt',
76: '1DJh2eHFYQfACPmrvpyWc8MSTYKh7w9eRF',
77: '1Bxk4CQdqL9p22JEtDfdXMsng1XacifUtE',
78: '15qF6X51huDjqTmF9BJgxXdt1xcj46Jmhb',
79: '1ARk8HWJMn8js8tQmGUJeQHjSE7KRkn2t8',
80: '1BCf6rHUW6m3iH2ptsvnjgLruAiPQQepLe',
81: '15qsCm78whspNQFydGJQk5rexzxTQopnHZ',
82: '13zYrYhhJxp6Ui1VV7pqa5WDhNWM45ARAC',
83: '14MdEb4eFcT3MVG5sPFG4jGLuHJSnt1Dk2',
84: '1CMq3SvFcVEcpLMuuH8PUcNiqsK1oicG2D',
85: '1Kh22PvXERd2xpTQk3ur6pPEqFeckCJfAr',
86: '1K3x5L6G57Y494fDqBfrojD28UJv4s5JcK',
87: '1PxH3K1Shdjb7gSEoTX7UPDZ6SH4qGPrvq',
88: '16AbnZjZZipwHMkYKBSfswGWKDmXHjEpSf',
89: '19QciEHbGVNY4hrhfKXmcBBCrJSBZ6TaVt',
90: '1L12FHH2FHjvTviyanuiFVfmzCy46RRATU',
91: '1EzVHtmbN4fs4MiNk3ppEnKKhsmXYJ4s74',
92: '1AE8NzzgKE7Yhz7BWtAcAAxiFMbPo82NB5',
93: '17Q7tuG2JwFFU9rXVj3uZqRtioH3mx2Jad',
94: '1K6xGMUbs6ZTXBnhw1pippqwK6wjBWtNpL',
95: '19eVSDuizydXxhohGh8Ki9WY9KsHdSwoQC',
96: '15ANYzzCp5BFHcCnVFzXqyibpzgPLWaD8b',
97: '18ywPwj39nGjqBrQJSzZVq2izR12MDpDr8',
98: '1CaBVPrwUxbQYYswu32w7Mj4HR4maNoJSX',
99: '1JWnE6p6UN7ZJBN7TtcbNDoRcjFtuDWoNL',
100: '1KCgMv8fo2TPBpddVi9jqmMmcne9uSNJ5F',
101: '1CKCVdbDJasYmhswB6HKZHEAnNaDpK7W4n',
102: '1PXv28YxmYMaB8zxrKeZBW8dt2HK7RkRPX',
103: '1AcAmB6jmtU6AiEcXkmiNE9TNVPsj9DULf',
104: '1EQJvpsmhazYCcKX5Au6AZmZKRnzarMVZu',
105: '1CMjscKB3QW7SDyQ4c3C3DEUHiHRhiZVib',
106: '18KsfuHuzQaBTNLASyj15hy4LuqPUo1FNB',
107: '15EJFC5ZTs9nhsdvSUeBXjLAuYq3SWaxTc',
108: '1HB1iKUqeffnVsvQsbpC6dNi1XKbyNuqao',
109: '1GvgAXVCbA8FBjXfWiAms4ytFeJcKsoyhL',
110: '12JzYkkN76xkwvcPT6AWKZtGX6w2LAgsJg',
111: '1824ZJQ7nKJ9QFTRBqn7z7dHV5EGpzUpH3',
112: '18A7NA9FTsnJxWgkoFfPAFbQzuQxpRtCos',
113: '1NeGn21dUDDeqFQ63xb2SpgUuXuBLA4WT4',
114: '174SNxfqpdMGYy5YQcfLbSTK3MRNZEePoy',
115: '1NLbHuJebVwUZ1XqDjsAyfTRUPwDQbemfv',
116: '1MnJ6hdhvK37VLmqcdEwqC3iFxyWH2PHUV',
117: '1KNRfGWw7Q9Rmwsc6NT5zsdvEb9M2Wkj5Z',
118: '1PJZPzvGX19a7twf5HyD2VvNiPdHLzm9F6',
119: '1GuBBhf61rnvRe4K8zu8vdQB3kHzwFqSy7',
120: '17s2b9ksz5y7abUm92cHwG8jEPCzK3dLnT',
121: '1GDSuiThEV64c166LUFC9uDcVdGjqkxKyh',
122: '1Me3ASYt5JCTAK2XaC32RMeH34PdprrfDx',
123: '1CdufMQL892A69KXgv6UNBD17ywWqYpKut',
124: '1BkkGsX9ZM6iwL3zbqs7HWBV7SvosR6m8N',
125: '1PXAyUB8ZoH3WD8n5zoAthYjN15yN5CVq5',
126: '1AWCLZAjKbV1P7AHvaPNCKiB7ZWVDMxFiz',
127: '1G6EFyBRU86sThN3SSt3GrHu1sA7w7nzi4',
128: '1MZ2L1gFrCtkkn6DnTT2e4PFUTHw9gNwaj',
129: '1Hz3uv3nNZzBVMXLGadCucgjiCs5W9vaGz',
130: '1Fo65aKq8s8iquMt6weF1rku1moWVEd5Ua',
131: '16zRPnT8znwq42q7XeMkZUhb1bKqgRogyy',
132: '1KrU4dHE5WrW8rhWDsTRjR21r8t3dsrS3R',
133: '17uDfp5r4n441xkgLFmhNoSW1KWp6xVLD',
134: '13A3JrvXmvg5w9XGvyyR4JEJqiLz8ZySY3',
135: '16RGFo6hjq9ym6Pj7N5H7L1NR1rVPJyw2v',
136: '1UDHPdovvR985NrWSkdWQDEQ1xuRiTALq',
137: '15nf31J46iLuK1ZkTnqHo7WgN5cARFK3RA',
138: '1Ab4vzG6wEQBDNQM1B2bvUz4fqXXdFk2WT',
139: '1Fz63c775VV9fNyj25d9Xfw3YHE6sKCxbt',
140: '1QKBaU6WAeycb3DbKbLBkX7vJiaS8r42Xo',
141: '1CD91Vm97mLQvXhrnoMChhJx4TP9MaQkJo',
142: '15MnK2jXPqTMURX4xC3h4mAZxyCcaWWEDD',
143: '13N66gCzWWHEZBxhVxG18P8wyjEWF9Yoi1',
144: '1NevxKDYuDcCh1ZMMi6ftmWwGrZKC6j7Ux',
145: '19GpszRNUej5yYqxXoLnbZWKew3KdVLkXg',
146: '1M7ipcdYHey2Y5RZM34MBbpugghmjaV89P',
147: '18aNhurEAJsw6BAgtANpexk5ob1aGTwSeL',
148: '1FwZXt6EpRT7Fkndzv6K4b4DFoT4trbMrV',
149: '1CXvTzR6qv8wJ7eprzUKeWxyGcHwDYP1i2',
150: '1MUJSJYtGPVGkBCTqGspnxyHahpt5Te8jy',
151: '13Q84TNNvgcL3HJiqQPvyBb9m4hxjS3jkV',
152: '1LuUHyrQr8PKSvbcY1v1PiuGuqFjWpDumN',
153: '18192XpzzdDi2K11QVHR7td2HcPS6Qs5vg',
154: '1NgVmsCCJaKLzGyKLFJfVequnFW9ZvnMLN',
155: '1AoeP37TmHdFh8uN72fu9AqgtLrUwcv2wJ',
156: '1FTpAbQa4h8trvhQXjXnmNhqdiGBd1oraE',
157: '14JHoRAdmJg3XR4RjMDh6Wed6ft6hzbQe9',
158: '19z6waranEf8CcP8FqNgdwUe1QRxvUNKBG',
159: '14u4nA5sugaswb6SZgn5av2vuChdMnD9E5',
160: '1NBC8uXJy1GiJ6drkiZa1WuKn51ps7EPTv',

};

// // OU: exemplo em string (se preferir colar o bloco "1;address\n2;address")
// const puzzleConfigString = `1;1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH
// 2;1CUNEBjYrCn2y1SdiUMohaKUi4wpP326Lb`;
// ======================================================

(function () {
  // Parse puzzleConfig / puzzleConfigString em um mapa consistente
  function buildPuzzleMap() {
    const map = new Map();

    if (typeof puzzleConfig === 'object' && !Array.isArray(puzzleConfig)) {
      Object.keys(puzzleConfig).forEach(k => {
        const n = parseInt(k, 10);
        if (!Number.isNaN(n)) map.set(n, String(puzzleConfig[k]).trim());
      });
    }

    if (typeof window.puzzleConfigString === 'string') {
      const lines = window.puzzleConfigString.split(/\r?\n/);
      lines.forEach(line => {
        const parts = line.split(';').map(s => s.trim());
        if (parts.length >= 2) {
          const n = parseInt(parts[0], 10);
          if (!Number.isNaN(n)) map.set(n, parts[1]);
        }
      });
    }

    return map; // Map<number, address>
  }

  const puzzles = buildPuzzleMap(); // Map
  if (puzzles.size === 0) {
    console.warn('puzzles.js: nenhuma puzzle encontrada em puzzleConfig ou puzzleConfigString.');
  }

  // DOM references
  const wifBox = document.getElementById('wifBox');
  const wifBoxUncompressed = document.getElementById('wifBoxUncompressed');
  const wifListEl = document.getElementById('wifList'); // lista ordenada por puzzle
  const foundPuzzlesList = document.getElementById('foundPuzzlesList'); // seção adicional, se quiser

  // Estado interno (evitar duplicatas)
  // Map<puzzleNumber, { address, wif, type }>
  const found = new Map();

  // converte um WIF em endereço (p2pkh). Retorna string address ou lança erro.
  function wifToAddress(wif) {
    // bitcoinjs já foi carregado pelo HTML
    const keyPair = bitcoinjs.ECPair.fromWIF(wif);
    const { address } = bitcoinjs.payments.p2pkh({ pubkey: keyPair.publicKey });
    return address;
  }

  // Verifica um WIF (string) contra os puzzles; se bater, registra e re-renderiza listagem
  function checkWifAgainstPuzzles(wif, typeLabel) {
    if (!wif || !wif.trim()) return;
    wif = wif.trim();

    try {
      const address = wifToAddress(wif);
      // procurar matches (puzzles podem ter múltiplos números com mesmo address? assumimos único)
      for (const [puzzleNumber, puzzleAddress] of puzzles.entries()) {
        if (address === puzzleAddress) {
          // se já achamos esse puzzle, não duplicar (pode atualizar wif se necessário)
          const prev = found.get(puzzleNumber);
          if (!prev) {
            found.set(puzzleNumber, { address, wif, type: typeLabel, timestamp: Date.now() });
            renderFoundList();
            console.info(`puzzles.js: MATCH puzzle #${puzzleNumber} -> ${wif} (${typeLabel})`);
          } else {
            // se o mesmo puzzle foi encontrado com outro tipo de WIF, atualize para incluir (concise)
            if (prev.wif !== wif) {
              // armazenar ambos wifs em um array simples
              const combined = {
                address,
                wif: prev.wif + ' | ' + wif,
                type: prev.type === typeLabel ? typeLabel : (prev.type + ' / ' + typeLabel),
                timestamp: Date.now()
              };
              found.set(puzzleNumber, combined);
              renderFoundList();
              console.info(`puzzles.js: puzzle #${puzzleNumber} atualizado com novo WIF.`);
            }
          }
        }
      }
    } catch (err) {
      // WIF inválido — apenas ignore ou logue se for útil
      // console.debug('puzzles.js: WIF inválido ou erro ao derivar:', err.message);
    }
  }

  // Renderiza a lista de puzzles encontrados em ordem
  function renderFoundList() {
    if (!wifListEl) return;

    // criar array ordenado por número
    const entries = Array.from(found.entries())
      .sort((a, b) => a[0] - b[0]); // sort by puzzle number

    // limpar
    wifListEl.innerHTML = '';

    entries.forEach(([puzzleNumber, info]) => {
      const li = document.createElement('li');
      li.className = 'list-group-item d-flex justify-content-between align-items-start';
		li.innerHTML = `
		  <div>
			<div><p>Puzzle #${puzzleNumber}</p></div> 
				<div id="${puzzleNumber}" value="${info.wif}">${info.wif}</div>
		  </div>
		  <i class="fas fa-copy" data-target="${puzzleNumber}"></i>
		`;


      wifListEl.appendChild(li);
    });

    // também atualizar foundPuzzlesList se existir (simples lista texto)
if (foundPuzzlesList) {
  foundPuzzlesList.innerHTML = '';
  /* entries.forEach(([puzzleNumber, info]) => {
    const li = document.createElement('li');
    li.textContent = `Puzzle#${puzzleNumber}: ${info.wif}`;
    foundPuzzlesList.appendChild(li);
  }); */
}



  }

  // Observadores: MutationObserver para detectar alterações de valor (scripts que escrevem no textarea)
  function observeTextarea(el, typeLabel) {
    if (!el) return;

    // Ao iniciar, cheque o valor atual
    if (el.value && el.value.trim()) {
      // se o textarea tiver várias linhas, checar cada linha (cada WIF por linha)
      const lines = el.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      lines.forEach(l => checkWifAgainstPuzzles(l, typeLabel));
    }

    // MutationObserver para mudanças em childList/characterData (alguns scripts setam .value sem disparar input)
    const mo = new MutationObserver(() => {
      // Delay mínimo para garantir que o .value foi atualizado
      setTimeout(() => {
        const lines = el.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        lines.forEach(l => checkWifAgainstPuzzles(l, typeLabel));
      }, 10);
    });

    mo.observe(el, { characterData: true, childList: true, subtree: true });

    // Também observe eventos 'input' e 'change' — alguns scripts disparam input
    el.addEventListener('input', () => {
      const lines = el.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      lines.forEach(l => checkWifAgainstPuzzles(l, typeLabel));
    });

    el.addEventListener('change', () => {
      const lines = el.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      lines.forEach(l => checkWifAgainstPuzzles(l, typeLabel));
    });

    // Interval fallback: alguns scripts podem setar value via innerHTML/node replace; tentamos checar a cada 300ms (leve)
    let lastValue = el.value;
    setInterval(() => {
      if (el.value !== lastValue) {
        lastValue = el.value;
        const lines = el.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        lines.forEach(l => checkWifAgainstPuzzles(l, typeLabel));
      }
    }, 300);
  }

  // Inicializa observadores nos dois textareas
  document.addEventListener('DOMContentLoaded', () => {
    // Se os elementos ainda não existirem, tente novamente breve
    const retry = () => {
      const a = document.getElementById('wifBox');
      const b = document.getElementById('wifBoxUncompressed');
      if (!a || !b) {
        // tenta de novo daqui a 100ms
        setTimeout(retry, 100);
        return;
      }
      observeTextarea(a, 'comprimido');
      observeTextarea(b, 'não comprimido');

      // checagem inicial global (se o script anterior já gerou WIFs)
      if (a.value) a.dispatchEvent(new Event('input'));
      if (b.value) b.dispatchEvent(new Event('input'));

      // também execute checagem de testData se existir
      if (window.testData && Array.isArray(window.testData)) checkTestData();
    };
    retry();
  });

  // Função opcional: verifica `window.testData` se existir — escreve em #results se existir
  function checkTestData() {
    if (!Array.isArray(window.testData)) return;
    const resultsDiv = document.getElementById('results');
    window.testData.forEach((data, index) => {
      try {
        const keyPair = bitcoinjs.ECPair.fromWIF(data.wif);
        const { address } = bitcoinjs.payments.p2pkh({ pubkey: keyPair.publicKey });
        const isCorrect = address === data.expected;
        if (resultsDiv) {
          const card = document.createElement('div');
          card.className = 'wif-card mb-2 p-2 border';
          card.innerHTML = `
            <div><strong>WIF #${index + 1}:</strong> <span class="mono">${data.wif}</span></div>
            <div>Endereço Gerado: <span class="mono">${address}</span></div>
            <div>Endereço Esperado: <span class="mono">${data.expected}</span></div>
            <div>Status: <strong class="${isCorrect ? 'text-success' : 'text-danger'}">${isCorrect ? '✅ SUCESSO' : '❌ FALHOU'}</strong></div>
          `;
          resultsDiv.appendChild(card);
        } else {
          console.log(`testData #${index + 1}: generated=${address} expected=${data.expected} ok=${address===data.expected}`);
        }
      } catch (err) {
        if (resultsDiv) {
          const card = document.createElement('div');
          card.className = 'wif-card mb-2 p-2 border';
          card.innerHTML = `
            <div><strong>WIF #${index + 1}:</strong> <span class="mono">${data.wif}</span></div>
            <div class="text-danger">Erro ao gerar endereço: ${err.message}</div>
            <div>Endereço Esperado: <span class="mono">${data.expected}</span></div>
            <div>Status: <strong class="text-danger">❌ ERRO</strong></div>
          `;
          resultsDiv.appendChild(card);
        } else {
          console.error(`testData #${index + 1}: erro ao gerar endereço para WIF:`, err);
        }
      }
    });
  }
})();
