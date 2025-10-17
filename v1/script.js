document.addEventListener("DOMContentLoaded", () => {
    const gridContainer = document.getElementById("grid");
    const gridSize = 16;
    
    // --- Configuração Fixa de Velocidade (Removido Slider) ---
    const SEQUENCE_SPEED_MS = 50; // Velocidade fixa em milissegundos
    // --------------------------------------------------------

    // Estados iniciais das seleções
    let selectedHeight = 13;
    let selectedBase = 16;
    let selectedExtraLine = null;
    let selectedExtraCols = new Set();
    // Usa timeoutId para controlar sequências H/V (substitui setInterval para controle de fluxo)
    let timeoutId = null; 
    let activeCells = new Set(); 
    let manualCells = new Set(); 
    let cellsMatrix = []; // Matriz de células para acesso rápido
    let isSequenceRunning = false; // Flag de estado da sequência

    // Contêineres dos botões e outputs
    const heightContainer = document.getElementById("height-buttons");
    const baseContainer = document.getElementById("base-buttons");
    const extraContainer = document.getElementById("extra-buttons");
    const extraColsContainer = document.createElement("div");

    const seedInput = document.getElementById("seed-input");
    const sequenceTypeRadios = document.querySelectorAll("input[name='sequence-type']");
    const hexBox = document.getElementById("hexBox");
    const wifBox = document.getElementById("wifBox");
    const wifBoxUncompressed = document.getElementById("wifBoxUncompressed");
    
    // Adiciona container para colunas extras
    extraContainer.parentNode.appendChild(extraColsContainer);
    extraColsContainer.style.marginTop = "10px";
    extraColsContainer.style.display = "none";

    // --- Funções auxiliares para células manuais ---

    function isCellInSequenceScope(row, col) {
        if (row >= selectedHeight && row <= selectedBase) return true;
        if (selectedExtraLine !== null && row === selectedExtraLine && selectedExtraCols.has(col)) return true;
        return false;
    }

    function updateManualCells() {
        // Redefine o conjunto de células manuais apenas para células ativas fora do escopo
        const newManualCells = new Set();
        activeCells.forEach(cellKey => {
            const [row, col] = cellKey.split(',').map(Number);
            if (!isCellInSequenceScope(row, col)) {
                newManualCells.add(cellKey);
            }
        });
        manualCells = newManualCells;

        // Atualiza classes visuais
        cellsMatrix.flat().forEach(cell => {
            const cellKey = `${cell.dataset.row},${cell.dataset.col}`;
            if (manualCells.has(cellKey)) {
                cell.classList.add("manual-cell");
            } else {
                cell.classList.remove("manual-cell");
            }
        });
    }

    function applyManualCells() {
        manualCells.forEach(cellKey => {
            const [row, col] = cellKey.split(',').map(Number);
            const rowIdx = row - 1;
            const colIdx = col - 1;
            
            if (cellsMatrix[rowIdx] && cellsMatrix[rowIdx][colIdx]) {
                const cell = cellsMatrix[rowIdx][colIdx];
                if (!cell.classList.contains("active")) {
                    cell.classList.add("active");
                    activeCells.add(cellKey);
                }
            }
        });
    }

    // --- Funções de criptografia (Assíncronas para Otimização de CPU) ---

    const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

    function hexToBytes(hex) {
        if (hex.length % 2 !== 0) throw new Error("Hex length must be even");
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    function concatUint8Arrays(...arrays) {
        const total = arrays.reduce((s, a) => s + a.length, 0);
        const out = new Uint8Array(total);
        let offset = 0;
        for (const a of arrays) {
            out.set(a, offset);
            offset += a.length;
        }
        return out;
    }

    async function sha256(buffer) {
        // Usa API nativa de criptografia (crypto.subtle), que é assíncrona e eficiente
        const hash = await crypto.subtle.digest("SHA-256", buffer);
        return new Uint8Array(hash);
    }

    async function doubleSha256(buffer) {
        const h1 = await sha256(buffer);
        return await sha256(h1);
    }

    function base58Encode(bytes) {
        let zeros = 0;
        while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
        let value = 0n;
        for (let i = 0; i < bytes.length; i++) {
            value = (value << 8n) + BigInt(bytes[i]);
        }
        let result = "";
        while (value > 0n) {
            result = BASE58_ALPHABET[Number(value % 58n)] + result;
            value /= 58n;
        }
        return "1".repeat(zeros) + result || "1";
    }

    async function hexToWIF(hexStr, compressed = true, version = 0x80) {
        hexStr = hexStr.trim().toLowerCase(); 
        if (!/^[0-9a-f]{64}$/.test(hexStr)) return "CHAVE INVÁLIDA"; 

        const privBytes = hexToBytes(hexStr);
        const prefix = new Uint8Array([version]);
        const suffix = compressed ? new Uint8Array([0x01]) : new Uint8Array([]);
        const payload = concatUint8Arrays(prefix, privBytes, suffix);

        const checksumFull = await doubleSha256(payload);
        const checksum = checksumFull.slice(0, 4);

        const finalBytes = concatUint8Arrays(payload, checksum);
        return base58Encode(finalBytes);
    }

    // Calcula o valor de bit baseado na posição da célula
    function calculateBitValue(row, col) {
        const bitPosition = (16 - row) * 16 + (16 - col); 
        return BigInt(2) ** BigInt(bitPosition);
    }

    // Converte número para hex de 64 caracteres (256 bits)
    function numberToHex64(num) {
        return num.toString(16).padStart(64, '0');
    }

    // Calcula o valor total de todas as células ativas
    function calculateTotalValue() {
        let total = BigInt(0);
        activeCells.forEach(cellKey => {
            const [row, col] = cellKey.split(',').map(Number);
            total += calculateBitValue(row, col);
        });
        return total;
    }
    
    // --- safeAppend (Sem Limite de Memória) ---

    /**
     * @description Função para adicionar texto, garantindo quebra de linha/página.
     * NÃO implementa limite de memória (atende ao pedido do usuário).
     * @param {HTMLTextAreaElement} box O elemento textarea de output.
     * @param {string} text O novo texto a ser adicionado (Hex ou WIF).
     */
    function safeAppend(box, text) {
        // Adiciona a nova entrada com quebra de linha ('quebra de página')
        box.value += text + "\n";
        
        // Rola para o final
        box.scrollTop = box.scrollHeight;
    }

    // Atualiza os campos de output com base nas células ativas
    async function updateOutputs() {
        if (activeCells.size === 0) {
            hexBox.value = "";
            wifBox.value = "";
            wifBoxUncompressed.value = "";
            return;
        }

        const totalValue = calculateTotalValue();
        const hex = numberToHex64(totalValue);
        
        // O 'await' nessas chamadas é crucial para não bloquear o loop da sequência
        const wifCompressed = await hexToWIF(hex, true);
        const wifUncompressed = await hexToWIF(hex, false);

        // Uso da função safeAppend sem limite de memória
        safeAppend(hexBox, hex);
        safeAppend(wifBox, wifCompressed);
        safeAppend(wifBoxUncompressed, wifUncompressed);
    }

    // --- Construção da grade (Mantida) ---

    gridContainer.innerHTML = "";
    
    // Célula vazia canto superior esquerdo
    const emptyCell = document.createElement("div");
    emptyCell.className = "empty-cell";
    emptyCell.style.gridRow = "1";
    emptyCell.style.gridColumn = "1";
    gridContainer.appendChild(emptyCell);

    // Cabeçalho superior (números das colunas)
    for (let col = 1; col <= gridSize; col++) {
        const topNumber = document.createElement("div");
        topNumber.className = "top-number";
        topNumber.textContent = col;
        topNumber.style.gridRow = "1";
        topNumber.style.gridColumn = (col + 1).toString();
        gridContainer.appendChild(topNumber);
    }

    // Linhas: número lateral + células
    for (let row = 1; row <= gridSize; row++) {
        // Número lateral da linha
        const sideNumber = document.createElement("div");
        sideNumber.className = "side-number";
        sideNumber.textContent = row;
        sideNumber.style.gridRow = (row + 1).toString();
        sideNumber.style.gridColumn = "1";
        gridContainer.appendChild(sideNumber);

        // Células da linha
        const rowCells = [];
        for (let col = 1; col <= gridSize; col++) {
            const cell = document.createElement("div");
            cell.className = "grid-cell";
            cell.style.gridRow = (row + 1).toString();
            cell.style.gridColumn = (col + 1).toString();

            cell.dataset.row = row;
            cell.dataset.col = col;

            // Event listener para clique na célula
            cell.addEventListener("click", () => {
                const cellKey = `${row},${col}`;

                if (cell.classList.contains("active")) {
                    cell.classList.remove("active");
                    activeCells.delete(cellKey);
                    manualCells.delete(cellKey);
                } else {
                    cell.classList.add("active");
                    activeCells.add(cellKey);

                    if (!isCellInSequenceScope(row, col)) {
                        manualCells.add(cellKey);
                        cell.classList.add("manual-cell");
                    }
                }

                updateOutputs().catch(e => console.error("Erro ao atualizar WIF:", e));
            });

            gridContainer.appendChild(cell);
            rowCells.push(cell);
        }
        cellsMatrix.push(rowCells);
    }


    // --- Funções de seleção (Mantidas) ---

    function createButton(num, container, onClick, disabled = false) {
        const btn = document.createElement("button");
        btn.textContent = num;
        btn.disabled = disabled;
        btn.addEventListener("click", () => onClick(num));
        container.appendChild(btn);
        return btn;
    }

    function highlightSelected(container, selectedNum) {
        [...container.children].forEach(btn => {
            btn.classList.toggle("selected", Number(btn.textContent) === selectedNum);
        });
    }

    function updateBaseButtons() {
        baseContainer.innerHTML = "";
        for (let i = 1; i <= gridSize; i++) {
            createButton(i, baseContainer, onBaseSelect, i < selectedHeight);
        }
        highlightSelected(baseContainer, selectedBase);
    }

    function updateHeightButtons() {
        heightContainer.innerHTML = "";
        for (let i = 1; i <= gridSize; i++) {
            createButton(i, heightContainer, onHeightSelect);
        }
        highlightSelected(heightContainer, selectedHeight);
    }

    function updateExtraButtons() {
        extraContainer.innerHTML = "";
        for (let i = 1; i <= gridSize; i++) {
            const disabled = i >= selectedHeight && i <= selectedBase;
            createButton(i, extraContainer, onExtraSelect, disabled);
        }
        highlightSelected(extraContainer, selectedExtraLine);
    }

    function updateExtraColsButtons() {
        extraColsContainer.innerHTML = "";
        if (selectedExtraLine === null) {
            extraColsContainer.style.display = "none";
            selectedExtraCols.clear();
            return;
        }

        extraColsContainer.style.display = "block";
        extraColsContainer.classList.add("show");

        const title = document.createElement("h5");
        title.textContent = "🎯 Selecionar Colunas da Linha Extra";
        extraColsContainer.appendChild(title);

        const buttonGroup = document.createElement("div");
        buttonGroup.className = "button-group";

        for (let col = 1; col <= gridSize; col++) {
            const btn = document.createElement("button");
            btn.textContent = col;
            btn.className = selectedExtraCols.has(col) ? "selected" : "";

            btn.addEventListener("click", () => {
                if (selectedExtraCols.has(col)) {
                    selectedExtraCols.delete(col);
                    btn.classList.remove("selected");
                } else {
                    selectedExtraCols.add(col);
                    btn.classList.add("selected");
                }
                highlightGridSelection();
                updateManualCells();
            });

            buttonGroup.appendChild(btn);
        }

        extraColsContainer.appendChild(buttonGroup);
    }

    function highlightGridSelection() {
        cellsMatrix.flat().forEach(cell => {
            cell.classList.remove("selected-cell", "extra-selected", "extra-col-selected");
        });

        for (let r = selectedHeight - 1; r <= selectedBase - 1; r++) {
            for (let c = 0; c < gridSize; c++) {
                cellsMatrix[r][c].classList.add("selected-cell");
            }
        }

        if (selectedExtraLine !== null) {
            const rowIdx = selectedExtraLine - 1;

            for (let c = 0; c < gridSize; c++) {
                cellsMatrix[rowIdx][c].classList.add("extra-selected");
            }

            selectedExtraCols.forEach(colNum => {
                if (colNum >= 1 && colNum <= gridSize) {
                    cellsMatrix[rowIdx][colNum - 1].classList.add("extra-col-selected");
                }
            });
        }
    }

    function onHeightSelect(num) {
        selectedHeight = num;
        if (selectedBase < selectedHeight) selectedBase = selectedHeight;

        updateHeightButtons();
        updateBaseButtons();
        updateExtraButtons();
        updateExtraColsButtons();
        highlightGridSelection();
        updateManualCells();
    }

    function onBaseSelect(num) {
        selectedBase = num;
        if (selectedBase < selectedHeight) selectedHeight = selectedBase;

        updateBaseButtons();
        updateExtraButtons();
        updateExtraColsButtons();
        highlightGridSelection();
        updateManualCells();
    }

    function onExtraSelect(num) {
        if (selectedExtraLine === num) {
            selectedExtraLine = null;
            selectedExtraCols.clear();
        } else {
            selectedExtraLine = num;
            selectedExtraCols.clear();
        }
        updateExtraButtons();
        updateExtraColsButtons();
        highlightGridSelection();
        updateManualCells();
    }


    // --- Controle das sequências ---

    function clearGrid() {
        cellsMatrix.flat().forEach(cell => {
            cell.classList.remove("active", "manual-cell");
        });
        activeCells.clear();
        manualCells.clear();
        hexBox.value = "";
        wifBox.value = "";
        wifBoxUncompressed.value = "";
    }

    // Função stopSequence para gerenciar H/V e Aleatório
    function stopSequence() {
        // Para o modo Aleatório se estiver rodando (requer window.stopRandom do script_random_pisca.js)
        if (window.randomRunning && window.stopRandom) {
            window.stopRandom();
        }
        
        // Para sequências H/V (usa clearTimeout para o ciclo recursivo)
        if (timeoutId !== null) {
            clearTimeout(timeoutId); 
            timeoutId = null;
        }
        isSequenceRunning = false; // Garante que a flag seja redefinida
    }

    async function startSequence() {
        stopSequence();

        // 50ms é a velocidade padrão após a remoção do slider
        const speed = SEQUENCE_SPEED_MS; 
        const type = [...sequenceTypeRadios].find(r => r.checked)?.value || "h";

        const lines = cellsMatrix.slice(selectedHeight - 1, selectedBase);
        const extraLineCells = selectedExtraLine !== null ?
            cellsMatrix[selectedExtraLine - 1].filter((_, i) => selectedExtraCols.has(i + 1)) :
            [];

        updateManualCells();
        isSequenceRunning = true; // Define o estado de execução da sequência

        if (type === "h") runHorizontal(lines, extraLineCells, speed);
        else if (type === "v") runVertical(lines, extraLineCells, speed);
        else if (type === "r") {
            if (window.runRandom) {
                // O modo aleatório usa sua própria lógica (definida em script_random_pisca.js)
                window.runRandom(lines, extraLineCells, speed);
            } else {
                console.error("Função runRandom não carregada.");
            }
        }
    }
    
    // Funções auxiliares para sequências H/V

    function clearSequenceCells(lines, extraLineCells) {
        lines.flat().forEach(cell => {
            const cellKey = `${cell.dataset.row},${cell.dataset.col}`;
            if (!manualCells.has(cellKey)) {
                cell.classList.remove("active");
                activeCells.delete(cellKey);
            }
        });
        extraLineCells.forEach(cell => {
            const cellKey = `${cell.dataset.row},${cell.dataset.col}`;
            if (!manualCells.has(cellKey)) {
                cell.classList.remove("active");
                activeCells.delete(cellKey);
            }
        });
    }

    // SEQUÊNCIA VERTICAL OTIMIZADA (usa setTimeout recursivo e await)
    async function runVertical(lines, extraLineCells, speed) {
        const columnGroups = [];
        for (let c = gridSize - 1; c >= 0; c--) {
            const columnCells = [];
            for (let r = lines.length - 1; r >= 0; r--) {
                columnCells.push(lines[r][c]);
            }
            columnGroups.push({
                columnIndex: c + 1,
                cells: columnCells
            });
        }

        const extraCellsByColumn = new Map();
        extraLineCells.forEach(cell => {
            const col = parseInt(cell.dataset.col);
            if (!extraCellsByColumn.has(col)) extraCellsByColumn.set(col, []);
            extraCellsByColumn.get(col).push(cell);
        });

        let totalCombinations = BigInt(1);
        columnGroups.forEach(group => {
            const mainBits = group.cells.length;
            const extraBits = extraCellsByColumn.has(group.columnIndex) ? extraCellsByColumn.get(group.columnIndex).length : 0;
            const columnTotal = BigInt(2) ** BigInt(mainBits + extraBits);
            // Limite para evitar cálculos BigInt excessivamente grandes (2^256)
            if (totalCombinations > BigInt(1e100)) { 
                totalCombinations = BigInt(1e100); 
                return;
            }
            totalCombinations *= columnTotal;
        });
        
        const MAX_COMBINATIONS = BigInt(2) ** BigInt(256);
        totalCombinations = totalCombinations > MAX_COMBINATIONS ? MAX_COMBINATIONS : totalCombinations;


        let currentCombination = BigInt(0);

        async function vCycle() {
            if (currentCombination >= totalCombinations || !isSequenceRunning) {
                stopSequence();
                return;
            }

            clearSequenceCells(lines, extraLineCells);
            let tempCombination = currentCombination;

            for (let i = 0; i < columnGroups.length; i++) {
                const group = columnGroups[i];
                const mainBits = group.cells.length;
                const extraCells = extraCellsByColumn.get(group.columnIndex) || [];
                const totalBitsInColumn = mainBits + extraCells.length;

                if (totalBitsInColumn > 0) {
                    const columnCombinationSpace = BigInt(2) ** BigInt(totalBitsInColumn);
                    const columnCombination = tempCombination % columnCombinationSpace;
                    tempCombination = tempCombination / columnCombinationSpace;

                    for (let bit = 0; bit < mainBits; bit++) {
                        if ((columnCombination >> BigInt(bit)) & BigInt(1)) {
                            const cell = group.cells[bit];
                            cell.classList.add("active");
                            activeCells.add(`${cell.dataset.row},${cell.dataset.col}`);
                        }
                    }

                    for (let bit = 0; bit < extraCells.length; bit++) {
                        if ((columnCombination >> BigInt(mainBits + bit)) & BigInt(1)) {
                            const cell = extraCells[bit];
                            cell.classList.add("active");
                            activeCells.add(`${cell.dataset.row},${cell.dataset.col}`);
                        }
                    }
                }
            }

            applyManualCells();
            // O 'await' força a pausa até o hashing terminar, prevenindo congestionamento
            await updateOutputs(); 
            currentCombination++;

            // Agendamento do próximo ciclo (Controle de Fluxo)
            timeoutId = setTimeout(vCycle, speed);
        }

        isSequenceRunning = true;
        await vCycle(); 
    }

    // SEQUÊNCIA HORIZONTAL OTIMIZADA (usa setTimeout recursivo e await)
    async function runHorizontal(lines, extraLineCells, speed) {
        const rowGroups = [];
        for (let r = lines.length - 1; r >= 0; r--) {
            const rowCells = [];
            for (let c = gridSize - 1; c >= 0; c--) {
                rowCells.push(lines[r][c]);
            }
            rowGroups.push({
                cells: rowCells
            });
        }

        if (extraLineCells.length > 0 && selectedExtraLine !== null) {
            const sortedExtraCells = [...extraLineCells].sort((a, b) => parseInt(b.dataset.col) - parseInt(a.dataset.col));
            rowGroups.push({ cells: sortedExtraCells });
        }

        let totalCombinations = BigInt(1);
        rowGroups.forEach(group => {
            const groupTotal = (BigInt(2) ** BigInt(group.cells.length));
            // Limite para evitar cálculos BigInt excessivamente grandes (2^256)
            if (totalCombinations > BigInt(1e100)) { 
                totalCombinations = BigInt(1e100); 
                return;
            }
            totalCombinations *= groupTotal;
        });
        
        const MAX_COMBINATIONS = BigInt(2) ** BigInt(256);
        totalCombinations = totalCombinations > MAX_COMBINATIONS ? MAX_COMBINATIONS : totalCombinations;


        let currentCombination = BigInt(0);

        async function hCycle() {
            if (currentCombination >= totalCombinations || !isSequenceRunning) {
                stopSequence();
                return;
            }

            clearSequenceCells(lines, extraLineCells);
            let tempCombination = currentCombination;

            for (let i = 0; i < rowGroups.length; i++) {
                const group = rowGroups[i];
                const bitsInRow = group.cells.length;

                if (bitsInRow > 0) {
                    const rowCombinationSpace = BigInt(2) ** BigInt(bitsInRow);
                    const rowCombination = tempCombination % rowCombinationSpace;
                    tempCombination = tempCombination / rowCombinationSpace;

                    for (let bit = 0; bit < bitsInRow; bit++) {
                        if ((rowCombination >> BigInt(bit)) & BigInt(1)) {
                            const cell = group.cells[bit];
                            cell.classList.add("active");
                            activeCells.add(`${cell.dataset.row},${cell.dataset.col}`);
                        }
                    }
                }
            }

            applyManualCells();
            // O 'await' força a pausa até o hashing terminar, prevenindo congestionamento
            await updateOutputs(); 
            currentCombination++;

            // Agendamento do próximo ciclo (Controle de Fluxo)
            timeoutId = setTimeout(hCycle, speed);
        }
        
        isSequenceRunning = true;
        await hCycle();
    }
    
    // PRNG otimizado baseado em seed
    function createSeededRandom(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }

        return function() {
            var t = (hash += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // --- Eventos dos botões principais ---

    document.getElementById("start-button").addEventListener("click", () => startSequence().catch(e => console.error("Erro ao iniciar sequência:", e)));
    document.getElementById("stop-button").addEventListener("click", stopSequence); 
    document.getElementById("clear-button").addEventListener("click", clearGrid);

    // Inicializa
    updateHeightButtons();
    updateBaseButtons();
    updateExtraButtons();
    updateExtraColsButtons();
    highlightGridSelection();

    // Inicializa os outputs
    hexBox.value = "";
    wifBox.value = "";
    wifBoxUncompressed.value = "";


    // === Torna variáveis e funções acessíveis globalmente ===
    window.gridSize = gridSize;
    window.seedInput = seedInput;
    window.activeCells = activeCells;
    window.manualCells = manualCells;
    window.applyManualCells = applyManualCells;
    window.calculateTotalValue = calculateTotalValue;
    window.numberToHex64 = numberToHex64;
    window.hexToWIF = hexToWIF; 
    window.stopSequence = stopSequence;
    window.hexBox = hexBox;
    window.wifBox = wifBox;
    window.wifBoxUncompressed = wifBoxUncompressed;
    window.createSeededRandom = createSeededRandom;
    window.safeAppend = safeAppend; 
    window.isSequenceRunning = isSequenceRunning; 

    // Funções de Clipboard e Save (Mantidas)
    function copyToClipboard(elementId) { 
        const textarea = document.getElementById(elementId);
        const copyBtn = event.currentTarget; 

        navigator.clipboard.writeText(textarea.value).then(() => {
            const icon = copyBtn.querySelector('i');
            if (!icon) return;
            const originalClass = icon.className;
            icon.className = 'bi bi-check-lg text-success';
            setTimeout(() => {
                icon.className = originalClass;
            }, 1000);

        }).catch(err => {
            console.error('Erro ao copiar:', err);
        });
    }
    
    function saveAsTxt(elementId, filename) {
        const textarea = document.getElementById(elementId);
        const blob = new Blob([textarea.value], {
            type: "text/plain;charset=utf-8"
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    window.copyToClipboard = copyToClipboard;
    window.saveAsTxt = saveAsTxt;
});
