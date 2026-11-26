// Camada de armazenamento 0.9.1 — funciona no GitHub Pages, sem servidor.
// O JSON permanece idêntico ao da 0.9.0; imagens da campanha continuam
// no estado exportável, enquanto o estado é salvo inteiro no IndexedDB.
'use strict';
function createBregathyelStore(legacyKey) {
    const store = {
        key: legacyKey, blocked: false, backend: 'pending', db: null,
        ready: false, pending: null, writing: null, lastError: null,
        async init() {
            let legacyRaw = null;
            try { legacyRaw = localStorage.getItem(this.key); }
            catch (err) { /* acesso a storage pode estar desativado */ }
            let fallback = null;
            if (legacyRaw) {
                try {
                    fallback = JSON.parse(legacyRaw);
                    if (!fallback || typeof fallback !== 'object' ||
                        (!Array.isArray(fallback.characters) && !fallback.character))
                        throw new Error('Formato inválido');
                } catch (err) { this.blocked = true; fallback = null; }
            }
            try {
                this.db = await this.openDatabase();
                this.backend = 'indexedDB';
                const stored = await this.readDB();
                if (stored !== undefined) {
                    let parsed;
                    try {
                        parsed = JSON.parse(stored);
                        if (!parsed || typeof parsed !== 'object' ||
                            (!Array.isArray(parsed.characters) && !parsed.character)) throw Error('Dados inválidos');
                    } catch (err) { throw Error('O banco existente contém dados inválidos. A versão antiga foi preservada.'); }
                    this.blocked = false;
                    this.ready = true;
                    return parsed;
                }
                if (fallback && !this.blocked) {
                    await this.writeDB(legacyRaw); // só considerar migrado após confirmação
                }
                this.ready = true;
                return fallback;
            } catch (err) {
                if (this.db) {
                    this.db.close(); this.db = null;
                    // Não sobrescrever uma base existente e possivelmente corrompida.
                    throw err;
                }
                // O navegador pode não fornecer IndexedDB (privacidade, file:// etc).
                this.backend = 'localStorage';
                this.ready = true;
                return fallback;
            }
        },
        openDatabase() {
            return new Promise((resolve, reject) => {
                if (!('indexedDB' in window)) return reject(Error('IndexedDB não disponível'));
                let request;
                try { request = indexedDB.open('bregathyel.campaigns', 1); }
                catch (err) { return reject(err); }
                request.onupgradeneeded = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || Error('Não foi possível abrir IndexedDB'));
                request.onblocked = () => reject(Error('Feche outras abas do aplicativo e recarregue.'));
            });
        },
        readDB() {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('kv', 'readonly');
                const req = tx.objectStore('kv').get('campaign');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error || Error('Erro ao ler campanha'));
            });
        },
        writeDB(raw) {
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction('kv', 'readwrite');
                tx.objectStore('kv').put(raw, 'campaign');
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error || Error('Falha no IndexedDB'));
                tx.onabort = () => reject(tx.error || Error('Gravação interrompida'));
            });
        },
        save() {
            if (this.blocked || !this.ready) throw Error('Dados protegidos ou ainda não carregados.');
            const snapshot = packState(state);
            if (this.backend === 'localStorage') {
                localStorage.setItem(this.key, snapshot);
                return Promise.resolve();
            }
            this.pending = snapshot; // coalescer alterações feitas durante a mesma gravação
            if (!this.writing) {
                this.writing = Promise.resolve().then(async () => {
                    while (this.pending !== null) {
                        const raw = this.pending;
                        this.pending = null;
                        await this.writeDB(raw);
                    }
                    this.lastError = null;
                }).catch(err => {
                    this.lastError = err;
                    this.pending = null;
                    const status = document.getElementById('storageStatus');
                    if (status) { status.hidden = false; status.textContent = 'Erro ao salvar — exporte um backup'; }
                    if (typeof toast === 'function') toast('Falha ao salvar no dispositivo. Exporte um backup antes de fechar a página.');
                    throw err;
                }).finally(() => {
                    this.writing = null;
                    if (this.pending !== null && this.ready && !this.blocked) {
                        try { this.save(); } catch (err) { this.lastError = err; }
                    }
                });
                this.writing.catch(() => {}); // callbacks antigos ainda chamam save sem await
            }
            return this.writing;
        },
        async flush() {
            const task = this.save();
            await task;
            if (this.lastError) throw this.lastError;
            return true;
        }
    };
    return store;
}

// Somente caminhos gerados na distribuição oficial podem ser tratados como arte fixa.
const BREG_ASSET_RE = /^assets\/images\/[a-f0-9]{24}\.(?:png|webp|jpe?g|svg)$/;
function isBundledAsset(src) { return typeof src === 'string' && BREG_ASSET_RE.test(src); }
const bregAssetCache = new Map();
async function embedBundledAssets(jsonString) {
    const paths = [...new Set(jsonString.match(/assets\/(?:images|audio)\/[a-f0-9]{24}\.[a-z0-9]+/g) || [])];
    let result = jsonString;
    for (const path of paths) {
        let uri = bregAssetCache.get(path);
        if (!uri) {
            const res = await fetch(path);
            if (!res.ok) throw new Error('Arte indisponível: ' + path);
            const blob = await res.blob();
            uri = await new Promise((resolve, reject) => {
                const r = new FileReader();
                r.onload = () => resolve(r.result);
                r.onerror = () => reject(Error('Falha ao ler arte'));
                r.readAsDataURL(blob);
            });
            bregAssetCache.set(path, uri);
        }
        result = result.split(path).join(uri);
    }
    return result;
}
