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
            const lib = window.bitcoin || window.bitcoinjs;
            if (!lib || !lib.ECPair) {
                console.warn('⚠️ Biblioteca bitcoinjs não carregada');
                return null;
            }

            const keyPair = lib.ECPair.fromWIF(wif);
            const { address } = lib.payments.p2pkh({ pubkey: keyPair.publicKey });
            return address;
        } catch (error) {
            console.error('❌ Erro ao converter WIF:', error.message);
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

        const address = wifToAddress(wif);
        if (!address) return false;

        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CONFIG.STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CONFIG.STORE_NAME);

            const data = {
                address,
                wif,
                compressed,
                timestamp: Date.now()
            };

            const request = store.put(data);

            request.onsuccess = () => {
                totalWifsStored++;
                resolve(true);
            };

            request.onerror = () => {
                // Ignora erro de duplicata silenciosamente
                resolve(false);
            };
        });
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
            console.error('❌ Erro ao consultar blockchain.info:', error);
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
                    console.error(`❌ Erro no lote ${Math.floor(i / CONFIG.BATCH_SIZE) + 1}:`, error);
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      z-index: 99999;
      min-width: 700px;
      max-width: 90vw;
      max-height: 85vh;
      overflow-y: auto;
      font-family: 'Segoe UI', sans-serif;
      border: 3px solid rgba(255,255,255,0.3);
    `;

        modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 15px;">
        <h2 style="margin: 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
          🥚 EGGS ENCONTRADOS
        </h2>
        <button onclick="document.getElementById('eggs-modal').style.display='none'" 
                style="background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; font-size: 28px; width: 40px; height: 40px; border-radius: 50%; transition: all 0.3s; font-weight: bold;">
          ×
        </button>
      </div>
      <div id="eggs-content" style="font-size: 14px;">
        <p style="text-align: center; opacity: 0.8; font-size: 16px;">Nenhum egg encontrado ainda...</p>
      </div>
      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid rgba(255,255,255,0.2); text-align: center; font-size: 12px; opacity: 0.7;">
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
            content.innerHTML = '<p style="text-align: center; opacity: 0.8; font-size: 16px;">Nenhum egg encontrado ainda...</p>';
            return;
        }

        let html = `
      <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
        <strong style="font-size: 24px; display: block; margin-bottom: 5px;">Total de Eggs: ${eggsFound.length}</strong>
        <div style="font-size: 14px; opacity: 0.8;">Parabéns! Você encontrou carteiras com saldo!</div>
      </div>
    `;

        eggsFound.forEach((egg, index) => {
            html += `
        <div style="background: rgba(255,255,255,0.15); padding: 18px; border-radius: 12px; margin-bottom: 15px; border-left: 5px solid #ffd700; transition: all 0.3s; cursor: pointer;" 
             onmouseover="this.style.background='rgba(255,255,255,0.25)'" 
             onmouseout="this.style.background='rgba(255,255,255,0.15)'">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="font-size: 18px;">🥚 Egg #${index + 1}</strong>
            <span style="background: linear-gradient(135deg, #ffd700, #ffed4e); color: #333; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 10px rgba(255,215,0,0.3);">
              💰 ${egg.balance} BTC
            </span>
          </div>
          <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 8px;">
            <div style="font-family: monospace; font-size: 13px; word-break: break-all; margin-bottom: 8px;">
              <strong style="color: #ffd700;">Address:</strong><br>
              <span style="color: #fff; user-select: all;">${egg.address}</span>
            </div>
            <div style="font-family: monospace; font-size: 13px; word-break: break-all;">
              <strong style="color: #ffd700;">WIF:</strong><br>
              <span style="color: #fff; user-select: all;">${egg.wif}</span>
            </div>
          </div>
          <div style="font-size: 12px; opacity: 0.8; display: flex; justify-content: space-between;">
            <span><strong>Tipo:</strong> ${egg.compressed ? '🔒 Comprimida' : '🔓 Não Comprimida'}</span>
            <span><strong>Data:</strong> ${new Date(egg.timestamp).toLocaleString('pt-BR')}</span>
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
     * Cria indicador de progresso
     */
    function createProgressIndicator() {
        let indicator = document.getElementById('eggs-progress-indicator');
        if (indicator) return;

        indicator = document.createElement('div');
        indicator.id = 'eggs-progress-indicator';
        indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0,0,0,0.85);
      color: white;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-family: 'Segoe UI', sans-serif;
      z-index: 9999;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      min-width: 250px;
    `;

        indicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">🥚</span>
        <div style="flex: 1;">
          <div style="font-weight: bold; margin-bottom: 4px;">Eggs Hunter</div>
          <div id="eggs-progress-text" style="font-size: 11px; opacity: 0.8;">Inicializando...</div>
        </div>
      </div>
    `;

        document.body.appendChild(indicator);
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
