/**
 * ========================================================================
 * EGGS HUNTER V2 - VERIFICADOR AVANÇADO DE SALDO EM WIFs
 * ========================================================================
 * Sistema que acumula 1000 WIFs únicas antes de fazer verificação em lote.
 * Usa IndexedDB para armazenamento local temporário.
 */

(function () {
    'use strict';

    // 🥚 CONFIGURAÇÕES
    const CONFIG = {
        MAX_WIFS_BEFORE_CHECK: 1000,  // Acumula 1000 WIFs antes de verificar
        BATCH_SIZE: 20,               // Máximo de endereços por consulta API
        CHECK_INTERVAL: 2000,         // Intervalo entre verificações (2s)
        DB_NAME: 'EggsHunterDB',
        DB_VERSION: 1,
        STORE_NAME: 'wifs'
    };

    // 🥚 ESTADO GLOBAL
    let db = null;
    let eggsFound = [];
    let isChecking = false;
    let totalWifsStored = 0;

    // 🥚 FILA DE GRAVAÇÃO EM LOTE PARA ALTA PERFORMANCE
    let pendingWifs = [];
    let isSavingBatch = false;

    /**
     * Inicializa IndexedDB
     */
    async function initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                db = request.result;
                console.log('✅ IndexedDB inicializado');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Cria store para WIFs se não existir
                if (!db.objectStoreNames.contains(CONFIG.STORE_NAME)) {
                    const store = db.createObjectStore(CONFIG.STORE_NAME, { keyPath: 'address' });
                    store.createIndex('wif', 'wif', { unique: false });
                    store.createIndex('compressed', 'compressed', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log('📦 Store de WIFs criado');
                }
            };
        });
    }

    /**
     * Converte WIF para Address
     */
    function wifToAddress(wif) {
        try {
            // 🚀 DETECÇÃO DE BIBLIOTECA (bitcoinjs modern vs legacy)
            const lib = window.bitcoin || window.bitcoinjs;
            const legacyLib = window.Bitcoin;

            // MODO MODERNO (v3+)
            if (lib && lib.ECPair) {
                const keyPair = lib.ECPair.fromWIF(wif);
                const { address } = lib.payments.p2pkh({ pubkey: keyPair.publicKey });
                return address;
            }

            // MODO LEGADO (v0.x - window.Bitcoin.ECKey)
            if (legacyLib && legacyLib.ECKey) {
                const key = new legacyLib.ECKey(wif);
                return key.getBitcoinAddress().toString();
            }

            console.warn('⚠️ Nenhuma biblioteca BitcoinJS válida encontrada para conversão de WIF.');
            return null;
        } catch (error) {
            if (error.message && !error.message.includes('not in range')) {
                console.error('❌ Erro ao converter WIF para endereço:', error.message);
            }
            return null;
        }
    }

    /**
     * Adiciona WIF ao IndexedDB
     */
    async function addWifToDB(wif, compressed) {
        if (!db) {
            console.warn('⚠️ DB não inicializado');
            return false;
        }

        // 🚡 DEBUG: Log do WIF recebido
        console.log(`🔍 [DEBUG] WIF recebido: ${wif.substring(0, 15)}... (comprimido: ${compressed})`);
        
        if (wif.includes('Erro')) {
            console.warn('⚠️ WIF inválido ignorado pelo EggsHunter');
            return false;
        }

        const address = wifToAddress(wif);
        if (!address) {
            console.warn(`⚠️ [DEBUG] Falha ao converter WIF para endereço: ${wif.substring(0, 20)}...`);
            return false;
        }

        console.log(`✅ [DEBUG] WIF válido: ${wif.substring(0, 20)}... → ${address.substring(0, 15)}...`);

        pendingWifs.push({
            address,
            wif,
            compressed,
            timestamp: Date.now()
        });

        // Retorna true de forma otimista, a gravação será em lote
        return true;
    }

    /**
     * Processa WIFs pendentes e grava em lote para não travar o loop de eventos
     */
    async function processPendingWifs() {
        if (pendingWifs.length === 0 || isSavingBatch || !db) return;

        isSavingBatch = true;
        // Processar lotes menores para manter a interface fluida
        const batch = pendingWifs.splice(0, 1000);

        try {
            await new Promise((resolve, reject) => {
                const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(CONFIG.STORE_NAME);

                let addedCount = 0;

                transaction.oncomplete = () => {
                    totalWifsStored += addedCount;
                    resolve();
                };

                transaction.onerror = (e) => {
                    console.error('❌ Erro na gravação do lote:', e);
                    resolve();
                };

                batch.forEach(item => {
                    const request = store.put(item);
                    request.onsuccess = () => { addedCount++; };
                });
            });
        } catch (error) {
            console.error('❌ Erro em processPendingWifs:', error);
        } finally {
            isSavingBatch = false;
        }
    }

    /**
     * Conta quantas WIFs estão armazenadas
     */
    async function countWifs() {
        if (!db) return 0;

        return new Promise((resolve) => {
            const transaction = db.transaction([CONFIG.STORE_NAME], 'readonly');
            const store = transaction.objectStore(CONFIG.STORE_NAME);
            const request = store.count();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
        });
    }

    /**
     * Obtém todas as WIFs armazenadas
     */
    async function getAllWifs() {
        if (!db) return [];

        return new Promise((resolve) => {
            const transaction = db.transaction([CONFIG.STORE_NAME], 'readonly');
            const store = transaction.objectStore(CONFIG.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => resolve([]);
        });
    }

    /**
     * Limpa todas as WIFs do banco
     */
    async function clearWifsDB() {
        if (!db) return;

        return new Promise((resolve) => {
            const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                totalWifsStored = 0;
                console.log('🗑️ Banco de WIFs limpo');
                resolve();
            };
            request.onerror = () => resolve();
        });
    }

    /**
     * Consulta saldo de múltiplos endereços
     */
    async function checkBalances(addresses) {
        if (!addresses || addresses.length === 0) return {};

        const apiUrl = `https://blockchain.info/balance?active=${addresses.join('|')}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            // Evitar poluir o console com erros 429 inevitáveis ao disparar muitas requisições
            if (!error.message.includes('429') && !error.message.includes('Failed to fetch')) {
                console.error('❌ Erro ao consultar blockchain.info:', error);
            }
            throw error;
        }
    }

    /**
     * Processa verificação de saldo em lote
     */
    async function processWifsBatch() {
        if (isChecking) return;

        const count = await countWifs();

        // Só processa se tiver pelo menos 1000 WIFs
        if (count < CONFIG.MAX_WIFS_BEFORE_CHECK) {
            console.log(`📊 WIFs acumuladas: ${count}/${CONFIG.MAX_WIFS_BEFORE_CHECK}`);
            return;
        }

        isChecking = true;
        console.log(`🔍 Iniciando verificação de ${count} WIFs...`);

        try {
            const allWifs = await getAllWifs();
            const totalBatches = Math.ceil(allWifs.length / CONFIG.BATCH_SIZE);
            let processed = 0;

            for (let i = 0; i < allWifs.length; i += CONFIG.BATCH_SIZE) {
                const batch = allWifs.slice(i, i + CONFIG.BATCH_SIZE);
                const addresses = batch.map(item => item.address);

                try {
                    const balances = await checkBalances(addresses);

                    // Verifica quais têm saldo
                    batch.forEach(item => {
                        const balanceData = balances[item.address];
                        if (balanceData && balanceData.final_balance > 0) {
                            const balanceBTC = (balanceData.final_balance / 1e8).toFixed(8);

                            eggsFound.push({
                                wif: item.wif,
                                address: item.address,
                                balance: balanceBTC,
                                compressed: item.compressed,
                                timestamp: new Date().toISOString()
                            });

                            console.log(`🥚 [EGGS] SALDO ENCONTRADO! ${item.address} = ${balanceBTC} BTC`);

                            // 🚀 NOTIFICAÇÃO IMEDIATA
                            if (typeof showToast === 'function') {
                                showToast(`🎉 CARTEIRA COM SALDO ENCONTRADA! ${item.address} = ${balanceBTC} BTC`, 'success');
                            }

                            // 🚀 REGISTRA NO SUPABASE VIA PUZZLE FINDER (SEM PRESET)
                            if (window.PuzzleFinder && typeof window.PuzzleFinder.register === 'function') {
                                try {
                                    const lib = window.bitcoin || window.bitcoinjs;
                                    const keyPair = lib.ECPair.fromWIF(item.wif);
                                    const hexKey = lib.Buffer ? 
                                        lib.Buffer.from(keyPair.privateKey).toString('hex') : 
                                        Array.from(keyPair.privateKey).map(b => b.toString(16).padStart(2, '0')).join('');
                                    
                                    // Determina qual WIF/Endereço preencher baseado no tipo
                                    const regData = {
                                        preset: 0, // Indica que não pertence a um puzzle numerado específico
                                        hexPrivateKey: hexKey,
                                        wifCompressed: item.compressed ? item.wif : '',
                                        wifUncompressed: !item.compressed ? item.wif : '',
                                        addressCompressed: item.compressed ? item.address : '',
                                        addressUncompressed: !item.compressed ? item.address : '',
                                        mode: 'horizontal', // Fallback obrigatório
                                        matrixCoordinates: 'eggs-hunter',
                                        processingTimeMs: 0,
                                        linesProcessed: totalWifsStored
                                    };

                                    window.PuzzleFinder.register(regData).catch(e => {
                                        if (e.code !== 'DUPLICATE_PUZZLE') {
                                            console.warn('⚠️ Erro ao registrar Egg no Supabase:', e.message);
                                        }
                                    });
                                } catch (e) {
                                    console.error('❌ Erro ao preparar registro de Egg:', e);
                                }
                            }
                        }
                    });

                    processed += batch.length;
                    const progress = ((processed / allWifs.length) * 100).toFixed(1);
                    console.log(`📊 Progresso: ${progress}% (${processed}/${allWifs.length})`);

                    // Aguarda 1 segundo entre lotes para não sobrecarregar a API
                    if (i + CONFIG.BATCH_SIZE < allWifs.length) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                } catch (error) {
                    if (error && error.message && !error.message.includes('429') && !error.message.includes('Failed to fetch')) {
                        console.error(`❌ Erro no lote ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}:`, error);
                    }
                }
            }

            console.log(`✅ Verificação concluída! ${eggsFound.length} eggs encontrados.`);

            // Limpa o banco após verificação
            await clearWifsDB();

            // Atualiza o modal
            if (eggsFound.length > 0) {
                updateEggsModal();
            }

        } catch (error) {
            console.error('❌ Erro ao processar WIFs:', error);
        } finally {
            isChecking = false;
        }
    }

    /**
     * Cria o modal "Eggs"
     */
    function createEggsModal() {
        let modal = document.getElementById('eggs-modal');
        if (modal) return;

        modal = document.createElement('div');
        modal.id = 'eggs-modal';
        modal.style.cssText = `
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--bg-card);
      color: var(--text-primary);
      padding: 30px;
      border-radius: 20px;
      box-shadow: var(--shadow-lg);
      z-index: 99999;
      min-width: 700px;
      max-width: 90vw;
      max-height: 85vh;
      overflow-y: auto;
      font-family: inherit;
      border: 2px solid var(--border-color);
    `;

        modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid var(--border-color); padding-bottom: 15px;">
        <h2 style="margin: 0; font-size: 28px; font-weight: bold; color: var(--accent-color);">
          🥚 EGGS ENCONTRADOS
        </h2>
        <button onclick="document.getElementById('eggs-modal').style.display='none'; document.getElementById('eggs-backdrop').style.display='none'" 
                style="background: var(--bg-tertiary); border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; transition: all 0.3s; font-weight: bold; display: flex; align-items: center; justify-content: center;">
          ×
        </button>
      </div>
      <div id="eggs-content" style="font-size: 14px;">
        <p style="text-align: center; color: var(--text-muted); font-size: 16px;">Nenhum egg encontrado ainda...</p>
      </div>
      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid var(--border-color); text-align: center; font-size: 12px; color: var(--text-muted);">
        💡 O sistema acumula 1000 WIFs antes de verificar saldo
      </div>
    `;

        document.body.appendChild(modal);

        // Backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'eggs-backdrop';
        backdrop.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.7);
      z-index: 99998;
      backdrop-filter: blur(5px);
    `;
        backdrop.onclick = () => {
            modal.style.display = 'none';
            backdrop.style.display = 'none';
        };
        document.body.appendChild(backdrop);
    }

    /**
     * Atualiza o conteúdo do modal
     */
    function updateEggsModal() {
        const content = document.getElementById('eggs-content');
        if (!content) return;

        if (eggsFound.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 16px;">Nenhum egg encontrado ainda...</p>';
            return;
        }

        let html = `
      <div style="background: var(--bg-tertiary); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center; border: 1px solid var(--border-color);">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <strong style="font-size: 24px; display: block; margin-bottom: 5px; color: var(--text-primary);">Total de Eggs: ${eggsFound.length}</strong>
        <div style="font-size: 14px; color: var(--text-secondary);">Parabéns! Você encontrou carteiras com saldo!</div>
      </div>
    `;

        eggsFound.forEach((egg, index) => {
            html += `
        <div style="background: var(--bg-secondary); padding: 18px; border-radius: 12px; margin-bottom: 15px; border-left: 5px solid var(--accent-color); border-top: 1px solid var(--border-color); border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); transition: all 0.3s; cursor: pointer;" 
             onmouseover="this.style.background='var(--bg-tertiary)'" 
             onmouseout="this.style.background='var(--bg-secondary)'">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 18px; color: var(--text-primary);">🥚 Egg #${index + 1}</strong>
            <span style="background: var(--accent-color); color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 16px; box-shadow: var(--shadow-sm);">
              💰 ${egg.balance} BTC
            </span>
          </div>
          <div style="background: var(--bg-primary); padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--border-color);">
            <div style="font-family: monospace; font-size: 13px; word-break: break-all; margin-bottom: 8px;">
              <strong style="color: var(--accent-color);">Address:</strong><br>
              <span style="color: var(--text-primary); user-select: all;">${egg.address}</span>
            </div>
            <div style="font-family: monospace; font-size: 13px; word-break: break-all;">
              <strong style="color: var(--accent-color);">WIF:</strong><br>
              <span style="color: var(--text-primary); user-select: all;">${egg.wif}</span>
            </div>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span><strong style="color: var(--text-secondary);">Tipo:</strong> ${egg.compressed ? '🔒 Comprimida' : '🔓 Não Comprimida'}</span>
            <span><strong style="color: var(--text-secondary);">Data:</strong> ${new Date(egg.timestamp).toLocaleString('pt-BR')}</span>
          </div>
        </div>
      `;
        });

        content.innerHTML = html;
        showEggsModal();
    }

    /**
     * Mostra o modal
     */
    function showEggsModal() {
        const modal = document.getElementById('eggs-modal');
        const backdrop = document.getElementById('eggs-backdrop');

        if (modal) modal.style.display = 'block';
        if (backdrop) backdrop.style.display = 'block';
    }

    /**
     * Torna um elemento arrastável (Desktop e Mobile)
     */
    function makeDraggable(element) {
        const header = element.querySelector('.indicator-header');
        if (!header) return;

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = dragMouseDown;
        header.ontouchstart = dragTouchStart;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function dragTouchStart(e) {
            const touch = e.touches[0];
            pos3 = touch.clientX;
            pos4 = touch.clientY;
            document.ontouchend = closeDragElement;
            document.ontouchmove = elementTouchDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            // Calcula novas posições
            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;

            // Mantém dentro da tela (opcional)
            const padding = 10;
            newTop = Math.max(padding, Math.min(window.innerHeight - element.offsetHeight - padding, newTop));
            newLeft = Math.max(padding, Math.min(window.innerWidth - element.offsetWidth - padding, newLeft));

            element.style.top = newTop + "px";
            element.style.left = newLeft + "px";
            element.style.bottom = "auto"; // Remove bottom fixo se houver
        }

        function elementTouchDrag(e) {
            const touch = e.touches[0];
            pos1 = pos3 - touch.clientX;
            pos2 = pos4 - touch.clientY;
            pos3 = touch.clientX;
            pos4 = touch.clientY;
            
            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;
            
            element.style.top = newTop + "px";
            element.style.left = newLeft + "px";
            element.style.bottom = "auto";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
            document.ontouchend = null;
            document.ontouchmove = null;
        }
    }

    /**
     * Cria indicador de progresso
     */
    function createProgressIndicator() {
        let indicator = document.getElementById('eggs-progress-indicator');
        if (indicator) return;

        indicator = document.createElement('div');
        indicator.id = 'eggs-progress-indicator';
        
        // Estrutura rica de modal
        indicator.innerHTML = `
            <div class="indicator-header">
                <div class="header-info">
                    <i class="fas fa-arrows-alt"></i>
                    <span>Status</span>
                </div>
                <button class="indicator-close-btn" onclick="this.closest('#eggs-progress-indicator').style.display='none'" title="Ocultar">
                    ×
                </button>
            </div>
            <div class="indicator-body">
                <div class="indicator-icon">🥚</div>
                <div class="indicator-info">
                    <div class="indicator-title">Eggs Hunter</div>
                    <div id="eggs-progress-text">Inicializando...</div>
                </div>
            </div>
        `;

        document.body.appendChild(indicator);
        
        // Torna arrastável
        makeDraggable(indicator);
    }

    /**
     * Atualiza indicador de progresso
     */
    async function updateProgressIndicator() {
        const text = document.getElementById('eggs-progress-text');
        if (!text) return;

        const count = await countWifs();
        const percentage = ((count / CONFIG.MAX_WIFS_BEFORE_CHECK) * 100).toFixed(1);

        if (isChecking) {
            text.innerHTML = '🔍 Verificando saldos...';
        } else if (count >= CONFIG.MAX_WIFS_BEFORE_CHECK) {
            text.innerHTML = `✅ ${count} WIFs prontas para verificação`;
        } else {
            text.innerHTML = `📊 ${count}/${CONFIG.MAX_WIFS_BEFORE_CHECK} WIFs (${percentage}%)`;
        }
    }

    /**
     * Inicializa o sistema
     */
    async function init() {
        try {
            await initDB();
            createEggsModal();
            createProgressIndicator();

            // Processa inserções em lote do DB a cada 500ms (ALTA PERFORMANCE)
            setInterval(processPendingWifs, 500);

            // Atualiza indicador a cada 2 segundos
            setInterval(updateProgressIndicator, 2000);

            // Verifica se deve processar a cada 5 segundos
            setInterval(async () => {
                const count = await countWifs();
                if (count >= CONFIG.MAX_WIFS_BEFORE_CHECK && !isChecking) {
                    await processWifsBatch();
                }
            }, 5000);

            console.log('✅ Eggs Hunter V2 inicializado');
            console.log(`📊 Acumulará ${CONFIG.MAX_WIFS_BEFORE_CHECK} WIFs antes de verificar`);
        } catch (error) {
            console.error('❌ Erro ao inicializar Eggs Hunter:', error);
        }
    }

    // 🥚 API PÚBLICA
    window.EggsHunter = {
        addWif: async (wif, compressed) => {
            const added = await addWifToDB(wif, compressed);
            if (added) {
                updateProgressIndicator();
            }
            return added;
        },

        showModal: showEggsModal,
        getEggsFound: () => eggsFound,
        getWifsCount: countWifs,
        clearWifs: clearWifsDB,
        forceCheck: processWifsBatch,

        clearEggs: () => {
            eggsFound = [];
            updateEggsModal();
            console.log('🔄 Eggs encontrados limpos');
        },

        getStats: async () => {
            const count = await countWifs();
            return {
                wifsStored: count,
                eggsFound: eggsFound.length,
                isChecking,
                maxBeforeCheck: CONFIG.MAX_WIFS_BEFORE_CHECK
            };
        }
    };

    // Auto-inicialização
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
