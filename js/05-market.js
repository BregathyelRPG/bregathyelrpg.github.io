// ==============================================================================
// MERCADO — carteira, anúncios, negociação e comércio
// ==============================================================================
const merchantTypes = ['Ferreiro', 'Alquimista', 'Armeiro', 'Mercador arcano', 'Comerciante geral'];
const merchantPortraits = { "Ferreiro": "assets/images/82619d40a6ae69dd44f0bacb.webp", "Alquimista": "assets/images/4e4d81e935de45532316fb87.webp", "Mercador arcano": "assets/images/f8f24ea90d3f8f437d65f687.webp", "Comerciante geral": "assets/images/54314e24b4aa531ff53439b2.webp" };
const moneyNames = ['Ouro', 'Prata', 'Bronze'];
merchantPortraits.Armeiro = bregMerchantArt['Filippa Uffberth'];
function marketInit() {
    state.market ||= { npcs: [], listings: [], history: [], incidents: [] };
    const m = state.market;
    // Migração aditiva: nunca apaga mercadores ou estoques existentes.
    if (!Array.isArray(m.regions)) m.regions = ['Padrão'];
    if (!m.regions.includes('Padrão')) m.regions.unshift('Padrão');
    if (!m.defaultsV098) {
        const defaults = [
            ['Massamune','Ferreiro'], ['Hyn Paracelso','Alquimista'],
            ['Filippa Uffberth','Armeiro'], ['Elson Vespúcio','Comerciante geral']
        ];
        for (const [name,type] of defaults) {
            if (!m.npcs.some(x => x.name === name))
                m.npcs.push({id:itemId(),name,type,region:'Padrão',photo:'',
                    stock:Array(9).fill(null), prices:{},coins:[1000,0,0],guards:[],guardRefs:[]});
        }
        m.defaultsV098 = true;
        if (Store.ready && !Store.blocked) Store.save();
    }
    for (const k of ['npcs', 'listings', 'history', 'incidents'])
        if (!Array.isArray(m[k]))
            m[k] = [];
    for (const n of m.npcs) {
        normalizeWallet(n);
        if (!Array.isArray(n.stock))
            n.stock = [];
        while (n.stock.length < 9)
            n.stock.push(null);
        n.prices ||= {};
        n.region ||= 'Padrão';
        if (!m.regions.includes(n.region)) m.regions.push(n.region);
        n.guards = Array.isArray(n.guards) ? n.guards : [];
    }
    const occupied = new Map();
    for (const l of m.listings) {
        if (!occupied.has(l.owner))
            occupied.set(l.owner, new Set());
        const used = occupied.get(l.owner);
        if (!Number.isInteger(l.slot) || l.slot < 0 || used.has(l.slot)) {
            l.slot = 0;
            while (used.has(l.slot))
                l.slot++;
        }
        used.add(l.slot);
    }
    const seen = new Set();
    for (const p of state.characters) {
        normalizeWallet(p);
        if (!p.marketId || seen.has(p.marketId))
            p.marketId = itemId();
        seen.add(p.marketId);
    }
    return m;
}

const market = () => marketInit();
const coinRates = [10000n, 100n, 1n];
function coinTotal(a) {
    return a.reduce((n, v, i) => n + BigInt(v) * coinRates[i], 0n);
}

function coinSplit(total) {
    if (total < 0n)
        throw Error('Saldo insuficiente.');
    const gold = total / 10000n;
    if (gold > BigInt(Number.MAX_SAFE_INTEGER))
        throw Error('Limite de moedas excedido.');
    return [Number(gold), Number(total / 100n % 100n), Number(total % 100n)];
}

function coinsOf(p) {
    const raw = moneyNames.map((_, i) => Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(number(p.coins?.[i])))));
    try {
        return coinSplit(coinTotal(raw));
    }
    catch {
        return raw;
    }
}

function normalizeWallet(p) {
    p.coins = coinsOf(p);
}

function manageCoins(i) {
    const p = c();
    if (!state.characters.includes(p) || !coinRates[i])
        return;
    const dlg = $('coinDialog'), src = $('coins').querySelector(`[data-coin="${i}"] img`).src;
    dlg.innerHTML = `<form id="coinForm"><h2>Gerenciar ${moneyNames[i].toLowerCase()}</h2><img class="coin-preview" src="${src}" alt=""><small>Saldo atual</small><strong class="coin-current">${coinsOf(p)[i]}</strong><small class="coin-wallet">${esc(moneyText(coinsOf(p)))}</small><label>Quantidade<input name="amount" type="number" min="1" max="${Number.MAX_SAFE_INTEGER}" step="1" value="1" required></label><div class="coin-controls"><button type="button" data-coin-change="1">+ Adicionar</button><button type="button" data-coin-change="-1">− Retirar</button></div><small id="coinFeedback" aria-live="polite">100 bronze = 1 prata · 100 prata = 1 ouro</small><button type="button" id="coinClose">Fechar</button></form>`;
    const f = $('coinForm'), input = f.elements.amount, notify = $('coinFeedback');
    const refresh = () => {
        const raw = input.value, v = Number(raw), valid = raw !== '' && Number.isSafeInteger(v) && v > 0, total = coinTotal(coinsOf(p)), cost = valid ? BigInt(v) * coinRates[i] : 0n;
        f.querySelector('[data-coin-change="-1"]').disabled = !valid || cost > total;
        let addOK = valid;
        try {
            coinSplit(total + cost);
        }
        catch {
            addOK = false;
        }
        f.querySelector('[data-coin-change="1"]').disabled = !addOK;
        f.querySelector('.coin-current').textContent = coinsOf(p)[i];
        f.querySelector('.coin-wallet').textContent = moneyText(coinsOf(p));
    };
    input.oninput = refresh;
    f.onsubmit = e => e.preventDefault();
    f.onclick = e => {
        const b = e.target.closest('[data-coin-change]');
        if (!b || b.disabled || c() !== p)
            return;
        const v = Number(input.value);
        if (!Number.isSafeInteger(v) || v <= 0)
            return;
        try {
            const before = p.coins, next = coinSplit(coinTotal(coinsOf(p)) + BigInt(v) * coinRates[i] * BigInt(b.dataset.coinChange));
            p.coins = next;
            try {
                Store.save();
            }
            catch (err) {
                p.coins = before;
                throw err;
            }
            render();
            playMarketCoins();
            notify.textContent = 'Saldo atualizado · conversão automática.';
            refresh();
        }
        catch (err) {
            notify.textContent = err.message || 'Não foi possível atualizar o saldo.';
        }
    };
    $('coinClose').onclick = () => dlg.close();
    refresh();
    dlg.showModal();
    input.focus();
    input.select();
}
$('coins').addEventListener('click', e => {
    const b = e.target.closest('[data-coin]');
    if (b)
        manageCoins(Number(b.dataset.coin));
});
$('coins').addEventListener('keydown', e => {
    const b = e.target.closest('[data-coin]');
    if (b && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        manageCoins(Number(b.dataset.coin));
    }
});
function moneyText(a) {
    return moneyNames.map((n, i) => `${number(a?.[i])} ${n.toLowerCase()}`).join(' · ');
}

function moneyFields(prefix, a = [0, 0, 0]) {
    return `<div class="market-money">${moneyNames.map((n, i) => field(n, prefix + i, a[i] || 0, 'number', 'min="0" max="9007199254740991" step="1" required')).join('')}</div>`;
}

function readMoney(f, prefix) {
    return moneyNames.map((_, i) => Number(f.elements[prefix + i].value));
}

function validMoney(a) {
    return a.length === 3 && a.every(n => Number.isSafeInteger(n) && n >= 0);
}

function marketFind(key, s = state) {
    return key.startsWith('n:') ? s.market.npcs.find(p => p.id === key.slice(2)) : s.characters.find(p => p.marketId === key.slice(2));
}

function marketKey(p) {
    return p.marketId ? 'p:' + p.marketId : 'n:' + p.id;
}

function marketSlots(p) {
    return p.marketId ? bag(p) : p.stock;
}

function marketRoom(p, x) {
    if (p.marketId) {
        const same = bag(p).find((y, i) => i < Rules.capacity(p) && canMerge(y, x));
        if (same && !Number.isSafeInteger(same.quantity + x.quantity))
            return false;
        return bagPlace(p, x);
    }
    const a = p.stock, idx = a.findIndex(y => canMerge(y, x));
    if (idx >= 0) {
        if (!Number.isSafeInteger(a[idx].quantity + x.quantity))
            return false;
        a[idx].quantity += x.quantity;
        return true;
    }
    const free = a.findIndex(y => !y);
    if (!stackable(x) && x.quantity !== 1)
        return false;
    if (free < 0) {
        // Compras do mercador ficam no estoque interno, sem substituir os 8 itens da vitrine.
        a.push(cloneItem(x));
        return true;
    }
    a[free] = cloneItem(x);
    return true;
}

function takeMarketItem(p, i, q, id) {
    const a = marketSlots(p), x = a[i];
    if (!x || x.id !== id || !Number.isSafeInteger(q) || q < 1 || q > x.quantity || (!stackable(x) && q !== 1))
        throw Error('O item ou a quantidade não está mais disponível.');
    const y = { ...cloneItem(x), quantity: q };
    x.quantity -= q;
    if (!x.quantity)
        a[i] = null;
    return y;
}

function commitMarket(fn) {
    if (arenaState())
        return toast('Encerre a batalha antes de negociar.'), false;
    market();
    const old = state, trial = cloneItem(state);
    trial.character = trial.characters[trial.active] || cloneItem(state.character);
    try {
        fn(trial);
        state = trial;
        Store.save();
    }
    catch (e) {
        state = old;
        toast(e.message || 'Não foi possível concluir.');
        return false;
    }
    render();
    return true;
}

const marketCoinSound = 'assets/audio/7d0b242f8e907f9714961cba.mp3';
function playMarketCoins() {
    if (!state.volume)
        return;
    try {
        const a = new Audio(marketCoinSound);
        a.volume = clamp(state.volume / 100, 0, 1);
        a.play().catch(() => {
        });
    }
    catch {
    }
}

function recordMarket(s, text) {
    s.market.history.unshift({ text, at: new Date().toISOString() });
}

function exchangeMarket({ a, b, itemsA = [], itemsB = [], moneyA = [0, 0, 0], moneyB = [0, 0, 0], listing = null }) {
    const ok = commitMarket(s => {
        const pa = marketFind(a, s), pb = marketFind(b, s);
        if (!pa || !pb || a === b)
            throw Error('Participantes inválidos.');
        if (!validMoney(moneyA) || !validMoney(moneyB))
            throw Error('Valores inválidos.');
        const ca = coinsOf(pa), cb = coinsOf(pb);
        if (coinTotal(ca) < coinTotal(moneyA) || coinTotal(cb) < coinTotal(moneyB))
            throw Error('Saldo insuficiente.');
        const extract = (p, items) => {
            if (new Set(items.map(x => x.i)).size !== items.length)
                throw Error('Itens duplicados.');
            return items.map(x => takeMarketItem(p, x.i, x.q, x.id));
        };
        const aa = extract(pa, itemsA), bb = extract(pb, itemsB);
        if (listing) {
            const j = s.market.listings.findIndex(x => x.id === listing && x.owner === b);
            if (j < 0)
                throw Error('Oferta indisponível.');
            bb.push(s.market.listings[j].item);
            s.market.listings.splice(j, 1);
        }
        if (!aa.length && !bb.length && !moneyA.some(Boolean) && !moneyB.some(Boolean))
            throw Error('A negociação está vazia.');
        for (const x of aa)
            if (!marketRoom(pb, x))
                throw Error('Sem espaço no estoque ou mochila de ' + pb.name + '.');
        for (const x of bb)
            if (!marketRoom(pa, x))
                throw Error('Sem espaço no estoque ou mochila de ' + pa.name + '.');
        pa.coins = coinSplit(coinTotal(ca) - coinTotal(moneyA) + coinTotal(moneyB));
        pb.coins = coinSplit(coinTotal(cb) - coinTotal(moneyB) + coinTotal(moneyA));
        if (!pb.marketId && aa.length === 1 && !bb.length && moneyA.every(v => !v)) {
            pb.prices ||= {};
            const x = aa[0], cost = moneyB.slice();
            if (!pb.prices[x.id])
                pb.prices[x.id] = { buy: cost, sell: cost.map(v => Math.min(Number.MAX_SAFE_INTEGER, Math.ceil(v * 1.5))) };
        }
        recordMarket(s, `${pa.name} ↔ ${pb.name}: ${aa.map(x => x.name + ' ×' + x.quantity).join(', ') || 'sem itens'} (${moneyText(moneyA)}) ↔ ${bb.map(x => x.name + ' ×' + x.quantity).join(', ') || 'sem itens'} (${moneyText(moneyB)})`);
    });
    if (ok && (moneyA.some(Boolean) || moneyB.some(Boolean)))
        playMarketCoins();
    return ok;
}

const marketDialog = document.createElement('dialog');
marketDialog.id = 'marketDialog';
document.body.append(marketDialog);
let marketView = 'npcs', marketSearch = '', marketItemContext = null, tradeDraft = null, marketNpc = '', marketPage = 0;
let marketRegion = 'Padrão', marketSpeech = '', marketSpeechOwner = '';
let marketSpeechTimer = null, marketSpeechVisible = false;
const marketLastLines = new Map();
function marketSpeak(n, action = 'entry') {
    if (!n) return;
    const options = bregMerchantDialogues[n.name];
    const kind = action === 'entry' && options && Math.random() < 0.10 ? 'egg' : action;
    const lines = options?.[kind] || options?.entry || ['Boas-vindas à minha loja.'];
    const key = n.name + ':' + kind, prev = marketLastLines.get(key);
    const other = lines.length > 1 ? lines.filter(x => x !== prev) : lines;
    const line = other[Math.floor(Math.random() * other.length)];
    marketLastLines.set(key,line);
    marketSpeech = line;
    marketSpeechOwner = n.id;
    marketShowSpeech(n.name, line);
    const bubble = document.querySelector('#content .merchant-speech');
    if (bubble && document.querySelector('#content [data-market-current]')?.dataset.marketCurrent === n.id)
        bubble.textContent = line;
    return line;
}

// Falas no canto superior esquerdo, com leitura possível sobre janelas modais.
function marketShowSpeech(name, line) {
    const host = document.getElementById('merchantFloatingSpeech') || (() => {
        const el = document.createElement('div');
        el.id = 'merchantFloatingSpeech';
        el.className = 'merchant-floating-speech';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        document.body.append(el);
        return el;
    })();
    const html = `<strong>${esc(name)}</strong><span>${esc(line)}</span>`;
    host.innerHTML = html;
    host.hidden = false;
    marketSpeechVisible = true;
    marketSyncModalSpeech();
    clearTimeout(marketSpeechTimer);
    marketSpeechTimer = setTimeout(() => {
        marketSpeechVisible = false;
        host.hidden = true;
        marketSyncModalSpeech();
    }, 6500);
}
function marketSyncModalSpeech() {
    let overlay = marketDialog.querySelector('.merchant-dialog-speech');
    if (!marketDialog.open || !marketSpeechVisible) {
        if (overlay) overlay.remove();
        return;
    }
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'merchant-dialog-speech merchant-floating-speech';
        overlay.setAttribute('role', 'status');
        marketDialog.append(overlay);
    }
    overlay.innerHTML = document.getElementById('merchantFloatingSpeech')?.innerHTML || '';
}
function marketLeaveMerchant() {
    if (marketView !== 'npcs') return;
    const leaving = market().npcs.find(x => x.id === marketNpc);
    if (leaving) marketSpeak(leaving, 'exit');
    marketSpeechOwner = '';
}

function marketSpeakById(id, action) {
    const n = market().npcs.find(x => x.id === id);
    if (n) return marketSpeak(n, action);
    return '';
}

function mkOpen(html) {
    marketDialog.innerHTML = html;
    if (!marketDialog.open)
        marketDialog.showModal();
    marketSyncModalSpeech();
}

function mkClose() {
    if (marketDialog.open)
        marketDialog.close();
}

const mkBack = '<button type="button" data-mk="close">Fechar</button>';
function mkItem(x) {
    return `<div class="market-item">${imageMarkup(x)}<div><strong style="color:${RAR_COLORS[RARITIES.indexOf(x.rarity)] || RAR_COLORS[0]}">${esc(x.name)}${x.quantity > 1 ? ' ×' + x.quantity : ''}</strong><small>${esc(itemDetails(x))}</small></div></div>`;
}


// v0.9.10 — Mercado padrão: economia de referência e modelos da biblioteca.
const FIXED_MERCHANTS = ['Massamune', 'Hyn Paracelso', 'Filippa Uffberth', 'Elson Vespúcio'];
function fixedMerchant(n) { return !!n && FIXED_MERCHANTS.includes(n.name) && (n.region || 'Padrão') === 'Padrão'; }
// Oito produtos por comerciante, usando apenas modelos que já existem no jogo.
const MARKET_SEED = {
    'Massamune': [['Espada',3,0,0],['Adaga',0,35,0],['Machado',2,25,0],['Martelo',2,0,0],['Lança',0,90,0],['Katana',12,0,0],['Espada de Aço Temperado',6,0,0],['Machado de Guerra',5,0,0]],
    'Hyn Paracelso': [['Poção vermelha pequena',0,15,0],['Poção vermelha média',0,45,0],['Poção vermelha grande',1,20,0],['Poção azul pequena',0,15,0],['Poção azul média',0,45,0],['Poção azul grande',1,20,0],['Poção verde pequena',0,30,0],['Poção verde média',0,85,0]],
    'Filippa Uffberth': [['Gibão de Couro',0,50,0],['Couro Reforçado',1,30,0],['Cota de Malha',4,0,0],['Armadura de Placas',35,0,0],['Escudo de Madeira',0,25,0],['Escudo de Ferro',1,40,0],['Armadura de Escamas',7,0,0],['Couraça do Guardião',18,0,0]],
    'Elson Vespúcio': [['Pão',0,0,10],['Corda',0,2,0],['Tocha',0,0,30],['Chave',0,3,0],['Pergaminho',0,8,0],['Minério',0,5,0],['Carne',0,0,40],['Botas de couro',0,60,0]]
};
const MARKET_START_CASH = {'Massamune':[35,60,0],'Hyn Paracelso':[18,45,0],'Filippa Uffberth':[30,40,0],'Elson Vespúcio':[12,45,80]};
// Guardas predefinidos, usando os IDs estáveis das 24 criaturas originais.
const MARKET_DEFAULT_GUARDS_V0946 = {
    'Massamune': [['Guarda', 2]],
    'Hyn Paracelso': [['Guarda', 2]],
    'Filippa Uffberth': [['Guarda', 1], ['Orc', 1]],
    'Elson Vespúcio': [['Bandido', 2]]
};
function marketSeedGuardsV0946(m) {
    if (m.defaultGuardsV0946) return;
    const standards = beastStandardModels();
    for (const npc of m.npcs) {
        if (!fixedMerchant(npc)) continue;
        // Nunca substitui a configuração que já tenha sido feita pelo mestre.
        const refs = Array.isArray(npc.guardRefs) ? npc.guardRefs : [];
        if (refs.length || (Array.isArray(npc.guards) && npc.guards.length)) continue;
        const entries = MARKET_DEFAULT_GUARDS_V0946[npc.name] || [];
        npc.guardRefs = entries.map(([name, count]) => {
            const b = standards.find(x => x.name === name);
            if (!b) throw Error('Guarda padrão ausente: ' + name);
            return { id: b.id, count };
        });
        npc.guards = entries.flatMap(([name, count]) => Array(count).fill(name));
    }
    m.defaultGuardsV0946 = true;
    if (Store.ready && !Store.blocked) Store.save();
}
function marketSeedDefaults() {
    const m = market();
    marketSeedGuardsV0946(m);
    // v0.9.45: atualiza somente os quatro mercadores originais, uma única vez.
    // Não altera mercadores criados/copiados, anúncios, mochilas ou transações.
    if (!m.defaultEightGoodsV0945) {
        const models = BAG_BASIC_MODELS;
        // Faz o plano completo antes de modificar o estado: sem estoques parciais.
        const prepared = Object.fromEntries(Object.entries(MARKET_SEED).map(([name, goods]) => {
            const items = goods.map(([label, gold, silver, bronze]) => {
                const model = models.find(x => x.name === label);
                if (!model) throw Error('Modelo de mercadoria padrão ausente: ' + label);
                return {model, sell:[gold,silver,bronze]};
            });
            return [name,items];
        }));
        for (const n of m.npcs) {
            if (!fixedMerchant(n)) continue;
            const newStock = Array(9).fill(null);
            const newPrices = {};
            for (const [i,entry] of prepared[n.name].entries()) {
                const x = libTemplate('equipment', entry.model);
                x.id = itemId();
                x.quantity = (x.category === 'Consumíveis' || x.category === 'Utilidades') ? 5 : 1;
                newStock[i] = x;
                newPrices[x.id] = {buy:coinSplit(coinTotal(entry.sell)/2n),sell:entry.sell.slice()};
            }
            n.stock = newStock;
            n.prices = newPrices;
            // Saldo e guardas continuam como estão.
        }
        m.defaultEightGoodsV0945 = true;
        // Evita que as migrações antigas alterem a nova vitrine.
        m.standardQuiverRemovedV0924 = true;
        m.elsonOreRestockedV0925 = true;
        m.defaultStockV0910 = true;
        if (Store.ready && !Store.blocked) Store.save();
    }
    // v0.9.24: a aljava do comércio padrão não possui função na munição do arco.
    // Migração pontual: retira apenas a oferta antiga de Elson, sem tocar em
    // itens comprados, anúncios dos jogadores ou inventários personalizados.
    if (!m.standardQuiverRemovedV0924) {
        for (const n of m.npcs) {
            if (!fixedMerchant(n) || n.name !== 'Elson Vespúcio') continue;
            for (let i = 0; i < n.stock.length; i++) {
                const item = n.stock[i];
                if (item?.name !== 'Aljava' || item.category !== 'Utilidades') continue;
                n.stock[i] = null;
                if (item.id) delete n.prices[item.id];
            }
        }
        m.standardQuiverRemovedV0924 = true;
        if (Store.ready && !Store.blocked) Store.save();
    }
    // v0.9.25: completa apenas o sexto espaço VAZIO do Elson nos mercados
    // já inicializados. Os estoques personalizados e os itens dos jogadores
    // permanecem intactos; não reintroduz a aljava decorativa.
    if (!m.elsonOreRestockedV0925) {
        const model = BAG_BASIC_MODELS.find(x => x.category === 'Utilidades' && x.name === 'Minério');
        if (model) {
            for (const n of m.npcs) {
                if (!fixedMerchant(n) || n.name !== 'Elson Vespúcio' || n.stock[5]) continue;
                const x = libTemplate('equipment', model);
                x.id = itemId();
                x.quantity = 5;
                n.stock[5] = x;
                n.prices[x.id] = { buy: coinSplit(250n), sell: [0, 5, 0] };
            }
        }
        m.elsonOreRestockedV0925 = true;
        if (Store.ready && !Store.blocked) Store.save();
    }
    if (m.defaultStockV0910) return;
    const models = [...BAG_BASIC_MODELS, ...libList('equipment')];
    let seeded = 0;
    for (const n of m.npcs) {
        if (!fixedMerchant(n)) continue;
        const goods = MARKET_SEED[n.name];
        for (let i = 0; i < goods.length; i++) {
            if (n.stock[i]) continue; // Nunca substitui itens já cadastrados.
            const [label, gold, silver, bronze] = goods[i];
            const model = models.find(x => x.name === label);
            if (!model) continue;
            const x = libTemplate('equipment', model);
            x.id = itemId();
            x.quantity = x.category === 'Consumíveis' || x.category === 'Utilidades' ? 5 : 1;
            n.stock[i] = x;
            n.prices[x.id] = {buy:coinSplit(coinTotal([gold,silver,bronze])/2n),sell:[gold,silver,bronze]};
            seeded++;
        }
        // Corrige apenas o saldo-padrão antigo de 1000 ouros; preserva saldos personalizados.
        if (coinTotal(coinsOf(n)) === 10000000n) n.coins = MARKET_START_CASH[n.name].slice();
    }
    m.defaultStockV0910 = true;
    if (Store.ready && !Store.blocked) Store.save();
}
function marketShelfLibrary(id, slot, category='Armas') {
    const tabs = CATEGORIES.map(k=>`<button type="button" data-mk="shelf-category" data-id="${esc(id)}" data-i="${slot}" data-category="${esc(k)}" class="${k===category?'selected':''}">${esc(k)}</button>`).join('');
    const models = bagLibEntries(category).filter(({item}) => !(item.category === 'Utilidades' && item.name === 'Aljava'));
    mkOpen(`<h2>Biblioteca de itens · Estoque</h2><p>Escolha um modelo existente para expor na banca. O modelo original permanece intacto.</p><div class="baglib-tabs">${tabs}</div><div class="baglib-grid market-shelf-library">${models.map(({item},i)=>`<button type="button" class="baglib-tile" style="--rar:${RAR_COLORS[RARITIES.indexOf(item.rarity)] || RAR_COLORS[0]}" data-mk="shelf-pick" data-id="${esc(id)}" data-i="${slot}" data-category="${esc(category)}" data-model="${i}">${imageMarkup(item)}<span>${esc(item.name)}</span></button>`).join('')}</div>${mkBack}`);
}
function marketShelfPrice(x) {
    const nm = String(x.name || '').toLowerCase();
    if (nm.includes('poção')) return nm.includes('grande') ? [1,20,0] : nm.includes('média') ? [0,45,0] : [0,15,0];
    if (x.category === 'Armas') return [1,0,0];
    if (x.category === 'Armaduras') return [2,0,0];
    if (x.category === 'Escudos') return [0,25,0];
    if (x.category === 'Consumíveis' || x.category === 'Utilidades') return [0,2,0];
    return [0,20,0];
}
function marketMoneyEdit(id) {
    const n = market().npcs.find(x => x.id === id);
    if (!n) return;
    mkOpen(`<h2>Moedas e guardas · ${esc(n.name)}</h2><form id="marketCash" data-id="${esc(id)}">${moneyFields('cash',coinsOf(n))}${guardFields(n)}<button type="submit">Salvar dinheiro e guardas</button></form>${mkBack}`);
}

function marketPanel() {
    // Preservar a visualização escolhida: anúncios e ofertas não podem ficar ocultos.
    marketSeedDefaults();
    requestAnimationFrame(marketFitLayout);
    const m = market(), p = c(), key = marketKey(p), has = state.characters.includes(p), cap = Rules.capacity(p), b = bag(p);
    const own = m.listings.filter(x => x.owner === key);
    const offers = m.listings.filter(x => x.owner !== key && (!marketSearch || (`${x.item.name} ${marketFind(x.owner)?.name || ''}`).toLowerCase().includes(marketSearch.toLowerCase())));
    const pages = Math.max(1, Math.ceil((marketView === 'mine' ? Math.max(9, ...own.map(x => x.slot + 1)) : offers.length) / 9));
    marketPage = clamp(marketPage, 0, pages - 1);
    if (!m.regions.includes(marketRegion)) marketRegion = 'Padrão';
    const regionNpcs = m.npcs.filter(x => (x.region || 'Padrão') === marketRegion);
    const n = regionNpcs.find(x => x.id === marketNpc) || regionNpcs[0];
    marketNpc = n?.id || '';
    if (marketView === 'npcs' && n && marketSpeechOwner !== n.id) marketSpeak(n,'entry');
    const tile = (x, attrs, label) => `<button type="button" class="slot ${x ? 'occupied' : ''}" ${attrs} ${x ? `style="--rar:${RAR_COLORS[RARITIES.indexOf(x.rarity)] || RAR_COLORS[0]}" aria-label="${esc(label || x.name)}"` : `aria-label="${esc(label || 'Espaço vazio')}"`}>${x ? imageMarkup(x) + (stackable(x) ? `<span class="item-qty">${x.quantity}</span>` : '') + `<span class="market-slot-name">${esc(x.name)}</span>` : '<span class="market-empty">+</span>'}</button>`;
    const ownTiles = Array.from({ length: 9 }, (_, i) => {
        const j = i + 9 * marketPage, l = own.find(x => x.slot === j);
        return l ? tile(l.item, `data-mk="listing-open" data-id="${esc(l.id)}" data-market-list="${esc(l.id)}"`, l.item.name) : tile(null, `data-mk="announce" data-market-drop data-list-slot="${j}" ${!has || j >= 9 ? 'disabled' : ''}`, 'Anunciar neste espaço');
    }).join('');
    const offerTiles = Array.from({ length: 9 }, (_, i) => {
        const l = offers[i + 9 * marketPage];
        return l ? tile(l.item, `data-mk="listing-open" data-id="${esc(l.id)}" data-market-list="${esc(l.id)}"`, l.item.name) : tile(null, 'disabled', 'Sem oferta');
    }).join('');
    return `<div class="market-layout"><section><h2 class="bag-heading">Mochila <small>${bagCount(p)} / ${cap}</small></h2><div class="bag">${b.map((x, i) => `<button type="button" class="slot bag-slot ${i >= cap ? 'locked' : ''} ${x ? 'occupied' : ''}" data-bag="${i}" ${x ? `draggable="false" style="--rar:${RAR_COLORS[RARITIES.indexOf(x.rarity)] || RAR_COLORS[0]}" aria-label="${esc(x.name)}"` : `disabled aria-label="${i >= cap ? 'Bloqueado' : 'Vazio'}"`}>${x ? imageMarkup(x) + (stackable(x) ? `<span class="item-qty">${x.quantity}</span>` : '') : i >= cap ? '<svg viewBox="0 0 24 24"><rect x="6" y="11" width="12" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>' : ''}</button>`).join('')}</div><small class="market-caption">Somente itens da mochila podem ser negociados.</small></section><section>${marketView === 'mine'  ? `<div class="merchant-scene market-community-scene"><img class="merchant-shop-art" src="assets/images/market_announcements_v0949.webp" alt="Feira medieval com comerciantes e aventureiros negociando"><div class="market-grid market-community-stock">${ownTiles}</div></div><small class="market-caption">Clique em um espaço vazio para anunciar um item. Clique no item anunciado para cancelar e devolvê-lo à mochila. ${own.length}/9 anúncios.</small>` : marketView === 'offers' ? `<label>Pesquisar<input id="marketSearch" value="${esc(marketSearch)}" placeholder="Item ou vendedor"></label><div class="merchant-scene market-community-scene"><img class="merchant-shop-art" src="assets/images/market_offers_v0949.webp" alt="Dois aventureiros se cumprimentam enquanto trocam um pacote"><div class="market-grid market-community-stock">${offerTiles}</div></div><small class="market-caption">${offers.length} oferta(s) de outros personagens. Clique para negociar.</small>` : `<div class="merchant-showcase"><div class="merchant-selector"><span class="merchant-strip-title">Região:</span>${m.regions.map(r => `<button type="button" class="${r === marketRegion ? 'selected' : ''}" data-mk="region-select" data-region="${esc(r)}">${esc(r)}</button>`).join('')}<button type="button" data-mk="region-new" title="Nova região" aria-label="Criar região">+</button></div><div class="merchant-selector merchant-npc-tabs"><span class="merchant-strip-title">Comerciante:</span>${regionNpcs.map(x => `<button type="button" class="${x.id === n?.id ? 'selected' : ''}" data-mk="npc-select" data-id="${esc(x.id)}">${esc(x.name)}</button>`).join('')}${marketRegion !== 'Padrão' ? '<button type="button" data-mk="npc-new" title="Novo comerciante" aria-label="Novo comerciante">+</button>' : ''}</div>${n ? `<div class="merchant-scene" data-market-current="${esc(n.id)}"><img class="merchant-shop-art" loading="lazy" src="${safeArt(n.photo) || bregMerchantArt[n.name] || merchantPortraits[n.type] || merchantPortraits.Ferreiro}" alt="${esc('Loja de ' + n.name)}"><button type="button" class="merchant-scene-name" data-mk="npc-money" data-id="${esc(n.id)}" title="Editar moedas e guardas">${esc(n.name)} <small>· ${esc(moneyText(n.coins))}</small></button>${!fixedMerchant(n) ? `<button type="button" class="merchant-edit-corner" data-mk="npc-edit" data-id="${esc(n.id)}" title="Editar comerciante">✎</button>` : ''}<div class="merchant-speech" aria-live="polite">${esc(marketSpeechOwner === n.id ? marketSpeech : '')}</div><div class="market-grid merchant-stock">${Array.from({ length: 8 }, (_, i) => {
        const x = n?.stock[i];
        return tile(x, `data-mk="${x ? 'npc-product' : 'npc-item'}" data-id="${esc(n.id)}" data-i="${i}" ${x ? `data-market-stock="${i}"` : ''}`, x?.name || 'Cadastrar produto');
    }).join('')}</div></div>` : `<div class="merchant-scene-empty">Nenhum comerciante nesta região. Use + para adicionar.</div>`}</div>`}${marketView === 'offers' && pages > 1 ? `<div class="market-offer-pager"><button type="button" data-mk="page-prev" ${marketPage === 0 ? 'disabled' : ''} aria-label="Página anterior" title="Página anterior">‹</button><button type="button" data-mk="page-next" ${marketPage === pages - 1 ? 'disabled' : ''} aria-label="Próxima página" title="Próxima página">›</button></div>` : ''}${m.incidents.some(i => i.status === 'pendente') ? `<button data-act="incidents">Confrontos pendentes (${m.incidents.filter(i => i.status === 'pendente').length})</button>` : ''}</section></div>`;
}

function announceForm(i = -1, slot = -1) {
    const p = c(), own = market().listings.filter(x => x.owner === marketKey(p));
    if (slot < 0)
        slot = Array.from({ length: 9 }, (_, j) => j).find(j => !own.some(x => x.slot === j)) ?? -1;
    if (slot < 0 || slot >= 9 || own.some(x => x.slot === slot))
        return toast('Os nove espaços de anúncios estão ocupados.');
    const b = bag(), options = b.map((x, j) => x ? `<option value="${j}" ${i === j ? 'selected' : ''}>${esc(x.name)} ×${x.quantity}</option>` : '').join('');
    if (!options)
        return toast('Nenhum item disponível na mochila.');
    mkOpen(`<h2>Anunciar item · espaço ${slot + 1}</h2><form id="marketAnnounce" data-list-slot="${slot}"><label>Item<select name="slot">${options}</select></label>${field('Quantidade', 'quantity', 1, 'number', 'min="1" step="1" required')}<div class="announce-qty-tools"><button type="button" data-qty-step="-1">−</button><button type="button" data-qty-step="1">+</button><button type="button" data-qty-max>Máx.</button><small id="announceAvailable"></small></div><p class="form-error" id="announceError" role="alert"></p>${selectField('Modalidade', 'mode', ['Venda', 'Permuta', 'Mista', 'Doação'], 'Venda')}${moneyFields('price')}${field('Itens desejados / condições', 'wanted', '')}<p>O item ficará reservado até a negociação ou cancelamento.</p><button type="submit">Anunciar</button></form>${mkBack}`);
    const f = $('marketAnnounce');
    f.elements.slot.addEventListener('change', () => {
        f.elements.quantity.value = 1;
        refreshAnnounce(f);
    });
    f.elements.quantity.addEventListener('input', () => refreshAnnounce(f));
    f.addEventListener('click', e => {
        const t = e.target.closest('[data-qty-step],[data-qty-max]');
        if (!t)
            return;
        const q = f.elements.quantity, max = Number(q.max);
        q.value = t.hasAttribute('data-qty-max') ? max : clamp((Number(q.value) || 1) + Number(t.dataset.qtyStep), 1, max);
        refreshAnnounce(f);
    });
    refreshAnnounce(f);
}

function cancelListing(id) {
    return commitMarket(s => {
        const j = s.market.listings.findIndex(x => x.id === id && x.owner === marketKey(c()));
        if (j < 0)
            throw Error('Anúncio indisponível.');
        const l = s.market.listings[j], p = marketFind(l.owner, s);
        if (!marketRoom(p, l.item))
            throw Error('Libere espaço para recuperar o item.');
        s.market.listings.splice(j, 1);
    });
}

function merchantForm(n = null) {
    if (fixedMerchant(n)) return marketMoneyEdit(n.id);
    const t = n?.type || merchantTypes[0];
    mkOpen(`<h2>${n ? 'Editar' : 'Novo'} comerciante</h2><form id="marketMerchant" data-id="${n?.id || ''}">${selectField('Região', 'region', market().regions, n?.region || marketRegion)}${selectField('Aparência padrão', 'type', merchantTypes, t)}${field('Nome', 'name', n?.name || t, 'text', 'required maxlength="120"')}<label>Retrato personalizado<input type="file" accept="image/*" name="photo"></label><img class="market-face" id="marketPortrait" src="${safeArt(n?.photo) || merchantPortraits[t]}"><button type="button" data-mk="reset-photo">Usar retrato padrão</button>${moneyFields('cash', coinsOf(n || {}))}${guardFields(n)}<button type="submit">Salvar comerciante</button>${n && !fixedMerchant(n) ? `<button type="button" class="market-danger" data-mk="npc-delete" data-id="${esc(n.id)}">Excluir comerciante</button>` : ''}</form>${mkBack}`);
    marketDialog.dataset.photo = n?.photo || '';
}

function merchantOpen(id) {
    const n = marketFind('n:' + id);
    if (!n)
        return;
    marketNpc = id;
    marketView = 'npcs';
    tab = 3;
    mkClose();
    renderTab();
}

function listingOpen(id) {
    const l = market().listings.find(x => x.id === id);
    if (!l)
        return;
    const mine = l.owner === marketKey(c());
    mkOpen(`<h2>${mine ? 'Meu anúncio' : 'Oferta'}</h2>${mkItem(l.item)}<p>${esc(marketFind(l.owner)?.name || 'Ficha indisponível')} · ${esc(l.mode)} · ${esc(moneyText(l.price))}</p><p>${esc(l.wanted || '')}</p><button data-mk="${mine ? 'cancel-list' : 'buy-list'}" data-id="${esc(id)}">${mine ? 'Cancelar anúncio' : 'Negociar'}</button>${mkBack}`);
}

function merchantProduct(id, i) {
    const n = marketFind('n:' + id), x = n?.stock[i];
    if (!x)
        return;
    const has = state.characters.includes(c());
    mkOpen(`<h2>${esc(n.name)}</h2>${mkItem(x)}<small>Compra: ${moneyText(n.prices?.[x.id]?.buy)} · Venda: ${moneyText(n.prices?.[x.id]?.sell)}</small><div class="market-tools"><button data-mk="npc-price" data-id="${esc(id)}" data-i="${i}">Editar</button><button data-mk="npc-buy" data-id="${esc(id)}" data-i="${i}" ${has ? '' : 'disabled'}>Comprar</button><button data-mk="haggle" data-id="${esc(id)}" data-i="${i}" ${has ? '' : 'disabled'}>Pechinchar</button><button data-mk="steal" data-id="${esc(id)}" data-i="${i}" ${has ? '' : 'disabled'}>Roubar</button><button data-mk="npc-remove" data-id="${esc(id)}" data-i="${i}">Excluir</button></div>${mkBack}`);
}

function tradeRows(p, prefix, pre = -1) {
    const cards = marketSlots(p).map((x, i) => x ? `<div class="trade-card"><label class="trade-choice" aria-label="Oferecer ${esc(x.name)}"><input type="checkbox" name="${prefix}pick${i}" ${i === pre ? 'checked' : ''}>${imageMarkup(x)}<span class="trade-count">×${x.quantity}</span><span class="trade-name" style="color:${RAR_COLORS[RARITIES.indexOf(x.rarity)] || RAR_COLORS[0]}">${esc(x.name)}</span></label><label class="trade-qty" ${x.quantity === 1 ? 'style="display:none"' : ''}>Qtd.<input type="number" name="${prefix}q${i}" value="1" min="1" max="${x.quantity}" step="1" required aria-label="Quantidade de ${esc(x.name)}" data-item-id="${esc(x.id)}"></label></div>` : '').join('');
    return cards ? `<div class="trade-grid">${cards}</div>` : '<div class="trade-empty">Nenhum item disponível</div>';
}

function tradeCoins(prefix, price = [0, 0, 0], p) {
    return `<div class="trade-coins">${moneyNames.map((n, i) => `<label><span><i class="trade-coin-dot c${i}"></i>${n}</span><input type="number" name="${prefix}Money${i}" value="${price[i] || 0}" min="0" max="${Number.MAX_SAFE_INTEGER}" step="1" required aria-label="${n} oferecido por ${esc(p.name)}"></label>`).join('')}</div>`;
}

function tradeSide(p, prefix, price, pre = -1, l = null) {
    const photo = safeArt(p.photo) || (p.marketId ? racePortrait(p.race, p.sex) : merchantPortraits[p.type] || merchantPortraits.Ferreiro);
    return `<section class="trade-side"><div class="trade-person"><img src="${photo}" alt=""><div><h3>${esc(p.name)}</h3><small>Saldo: ${esc(moneyText(coinsOf(p)))}</small></div></div><div class="trade-label">Itens que oferece</div>${l ? `<div class="trade-reserved"><small>Item do anúncio (já incluído)</small>${mkItem(l.item)}<small>${esc(l.wanted || '')}</small></div>` : ''}${tradeRows(p, prefix, pre)}<div class="trade-pay"><div class="trade-label">Moedas que oferece</div>${tradeCoins(prefix, price, p)}<div class="trade-summary" data-summary="${prefix}"></div><label class="trade-accept"><input type="checkbox" name="accept${prefix.toUpperCase()}" required><span data-accept-label="${prefix}">Aceitar oferta</span></label></div></section>`;
}

function updateTradeView(f) {
    for (const prefix of ['a', 'b']) {
        const participant = marketFind(tradeDraft[prefix]);
        if (!participant)
            continue;
        const items = tradeSelection(f, participant, prefix), reserved = prefix === 'b' && tradeDraft.listing ? market().listings.find(x => x.id === tradeDraft.listing) : null;
        const names = items.map(x => marketSlots(participant)[x.i]?.name + ' ×' + x.q);
        if (reserved)
            names.unshift(reserved.item.name + ' ×' + reserved.item.quantity);
        const money = readMoney(f, prefix + 'Money');
        f.querySelector(`[data-summary="${prefix}"]`).textContent = (names.length ? names.join(', ') : 'Sem itens') + ' · ' + (money.some(Boolean) ? moneyText(money) : 'Sem moedas');
        f.querySelector(`[data-accept-label="${prefix}"]`).textContent = f.elements['accept' + prefix.toUpperCase()].checked ? 'Oferta aceita' : 'Aceitar oferta';
    }
    f.querySelector('[type=submit]').disabled = !(f.elements.acceptA.checked && f.elements.acceptB.checked);
}

function tradeForm(key, listing = null, pre = -1, sellSlot = -1) {
    const p = c(), b = marketFind(key), l = listing && market().listings.find(x => x.id === listing);
    if (!b || p === b)
        return toast('Escolha outro participante.');
    tradeDraft = { a: marketKey(p), b: key, listing };
    const sale = sellSlot >= 0 && !b.marketId ? bag(p)[sellSlot] : null;
    const price = l?.price || (pre >= 0 ? b.prices?.[b.stock[pre]?.id]?.sell : null) || [0, 0, 0];
    const merchantBuys = sale ? (b.prices?.[sale.id]?.buy || coinSplit(coinTotal(marketShelfPrice(sale)) / 2n)) : [0, 0, 0];
    mkOpen(`<h2 class="trade-title">${sale ? 'Vender ao mercador' : 'Negociação'}</h2><p class="trade-intro">Selecione os itens e informe as moedas que cada participante oferece. A transferência só ocorre quando ambos aceitam.</p><form id="marketTrade"><div class="market-trade">${tradeSide(p, 'a', price, sellSlot)}${tradeSide(b, 'b', merchantBuys, pre, l)}</div><div class="trade-price-tools"><button type="button" data-mk="roll-price">🎲 Sortear valor</button><small id="tradePriceNote">Valor fixo + dados, ou somente dados.</small></div><div class="trade-footer"><small>Alterações na oferta cancelam os aceites.</small><div><button type="button" data-mk="close">Cancelar</button><button type="submit" disabled>Confirmar negociação</button></div></div></form>`);
    updateTradeView($('marketTrade'));
}

function tradeSelection(f, p, prefix) {
    return marketSlots(p).flatMap((x, i) => f.elements[prefix + 'pick' + i]?.checked ? [{ i, q: Number(f.elements[prefix + 'q' + i].value), id: f.elements[prefix + 'q' + i].dataset.itemId }] : []);
}

function chooseTrade() {
    const options = state.characters.filter(p => p !== c());
    mkOpen(`<h2>Negociar com</h2>${options.map(p => `<button data-mk="trade-start" data-id="${marketKey(p)}">${esc(p.name)}</button>`).join('') || '<p>Nenhum participante disponível.</p>'}${mkBack}`);
}

function marketRoll(title, attr, callback, die = 20, count = 1) {
    if (!dieTypes.includes(die) || !Number.isInteger(count) || count < 1 || count > 40)
        return toast('Dados inválidos.');
    mkClose();
    openRoll();
    $('diceTitle').textContent = title;
    $('dicePick').hidden = true;
    $('diceClear').hidden = true;
    $('diceRoll').hidden = true;
    for (let i = 0; i < count; i++)
        appendDie(die);
    const n = tableDice.reduce((sum, x) => sum + x.n, 0), mod = Rules.mod(effectiveAttrs(c())[attr]);
    let done = false;
    const finish = () => {
        if (done)
            return;
        done = true;
        clearInterval(timer);
        $('diceDialog').removeEventListener('close', finish);
        callback(n, mod);
    };
    const timer = setInterval(() => {
        if (!diceBusy) {
            clearInterval(timer);
            const result = document.createElement('small');
            result.textContent = `${names[attr]} ${sign(mod)} · Total: ${n + mod}`;
            $('diceSummary').append(result);
            finish();
        }
    }, 60);
    $('diceDialog').addEventListener('close', finish, { once: true });
}

function masterDiceFields() {
    return `<div class="item-cols">${selectField('Dado definido pelo mestre', 'testDie', dieTypes.map(String), '20')}${field('Quantidade de dados', 'testCount', 1, 'number', 'min="1" max="40" step="1" required')}</div>`;
}

function haggleForm(id, i) {
    const n = marketFind('n:' + id), x = n?.stock[i];
    if (!x)
        return;
    mkOpen(`<h2>Pechinchar</h2>${mkItem(x)}<form id="marketHaggle" data-id="${esc(id)}">${masterDiceFields()}<small>O mestre define os dados. Soma dos dados + Carisma; o mestre interpreta o resultado e decide o preço.</small><button type="submit">Rolar</button></form>${mkBack}`);
}

function stealForm(id, i) {
    const n = marketFind('n:' + id), x = n?.stock[i];
    if (!x)
        return;
    if (arenaState())
        return toast('Encerre a batalha antes de tentar roubar.');
    if (!guardRoster(n).length)
        return toast('Associe ao menos um guarda do Bestiário ao comerciante.');
    mkOpen(`<h2>Tentar roubar</h2>${mkItem(x)}<form id="marketSteal" data-id="${id}" data-i="${i}">${field('Quantidade', 'quantity', 1, 'number', `min="1" max="${x.quantity}" step="1" required`)}${field('CD definida pelo mestre', 'dc', 15, 'number', 'min="0" step="1" required')}${masterDiceFields()}<small>Soma dos dados + Destreza. Empate é falha.</small><button type="submit">Tentar roubar</button></form>${mkBack}`);
}
marketDialog.addEventListener('input', e => {
    const f = e.target.closest('#marketTrade');
    if (!f)
        return;
    if (!e.target.name.startsWith('accept')) {
        f.elements.acceptA.checked = false;
        f.elements.acceptB.checked = false;
    }
    updateTradeView(f);
});
marketDialog.addEventListener('change', e => {
    const f = e.target.closest('#marketMerchant');
    if (!f)
        return;
    if (e.target.name === 'type' && !marketDialog.dataset.photo)
        $('marketPortrait').src = merchantPortraits[e.target.value];
    if (e.target.name === 'photo' && e.target.files[0]) {
        const r = new FileReader();
        r.onload = () => {
            const im = new Image();
            im.onload = () => {
                if (!$('marketPortrait'))
                    return;
                const cv = document.createElement('canvas'), scale = Math.min(1, 256 / Math.max(im.width, im.height));
                cv.width = Math.max(1, Math.round(im.width * scale));
                cv.height = Math.max(1, Math.round(im.height * scale));
                cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
                marketDialog.dataset.photo = cv.toDataURL('image/webp', .8);
                $('marketPortrait').src = marketDialog.dataset.photo;
            };
            im.src = r.result;
        };
        r.readAsDataURL(e.target.files[0]);
    }
});
marketDialog.addEventListener('submit', e => {
    const f = e.target;
    e.preventDefault();
    const v = k => f.elements[k].value;
    let ok = false;
    if (f.id === 'marketAnnounce') {
        const p = c(), i = +v('slot'), x = bag(p)[i], price = readMoney(f, 'price');
        if (!refreshAnnounce(f))
            return;
        if (!x || !validMoney(price))
            return toast('Oferta inválida.');
        ok = commitMarket(s => {
            const slot = +f.dataset.listSlot;
            if (!Number.isInteger(slot) || slot < 0 || slot >= 9 || s.market.listings.some(l => l.owner === marketKey(p) && l.slot === slot))
                throw Error('Espaço de anúncio indisponível.');
            const a = marketFind(marketKey(p), s), item = takeMarketItem(a, i, +v('quantity'), x.id);
            s.market.listings.push({ id: itemId(), owner: marketKey(p), slot, item, mode: v('mode'), price: v('mode') === 'Doação' || v('mode') === 'Permuta' ? [0, 0, 0] : price, wanted: v('wanted') });
        });
    }
    else if (f.id === 'marketRegionForm') {
        const name = v('regionName').trim();
        if (!name || name.length > 60 || market().regions.some(x => x.toLowerCase() === name.toLowerCase()))
            return toast('Digite um nome de região novo (até 60 caracteres).');
        ok = commitMarket(s => {s.market.regions.push(name);});
        if (ok) {marketRegion = name; marketNpc = ''; marketSpeechOwner = '';}
    }
    else if (f.id === 'marketCash') {
        const cash=readMoney(f,'cash');
        if (!validMoney(cash)) return toast('Moedas inválidas.');
        ok=commitMarket(s=>{
            const n=marketFind('n:'+f.dataset.id,s);
            if (!n) throw Error('Comerciante não encontrado.');
            const guards=readGuardFields(f);
            n.coins=coinSplit(coinTotal(cash));
            n.guards=guards.flatMap(g=>Array(g.count).fill(guardAvailableBeasts().find(b=>b.id===g.id)?.name||'Guarda'));
            n.guardRefs=guards;
        });
    }
    else if (f.id === 'marketMerchant') {
        const cash = readMoney(f, 'cash'), name = v('name').trim();
        if (!name || !validMoney(cash))
            return;
        ok = commitMarket(s => {
            let n = s.market.npcs.find(x => x.id === f.dataset.id);
            if (!n) {
                n = { id: itemId(), stock: Array(9).fill(null), prices: {} };
                s.market.npcs.push(n);
            }
            Object.assign(n, {
                region: v('region'), type: v('type'), name, photo: marketDialog.dataset.photo || '', coins: coinSplit(coinTotal(cash)), guards: readGuardFields(f).flatMap(g => Array(g.count).fill(guardAvailableBeasts().find(b => b.id === g.id)?.name || 'Guarda')), guardRefs: readGuardFields(f)
            });
        });
    }
    else if (f.id === 'marketTrade') {
        const a = marketFind(tradeDraft.a), b = marketFind(tradeDraft.b);
        if (!a || !b || !f.elements.acceptA.checked || !f.elements.acceptB.checked)
            return;
        const giving = tradeSelection(f,a,'a').length;
        const receiving = tradeSelection(f,b,'b').length;
        ok = exchangeMarket({ ...tradeDraft, itemsA: tradeSelection(f, a, 'a'), itemsB: tradeSelection(f, b, 'b'), moneyA: readMoney(f, 'aMoney'), moneyB: readMoney(f, 'bMoney') });
        if (ok && !b.marketId) marketSpeakById(b.id, receiving ? 'buy' : giving ? 'sell' : 'buy');
    }
    else if (f.id === 'marketPrices') {
        const id = f.dataset.id, i = +f.dataset.i, buy = readMoney(f, 'buy'), sell = readMoney(f, 'sell'), quantity = Number(f.elements.quantity.value);
        if (!validMoney(buy) || !validMoney(sell) || !Number.isSafeInteger(quantity) || quantity<1 || quantity>1000000)
            return;
        ok = commitMarket(s => {
            const n = marketFind('n:' + id, s), x = n.stock[i];
            if (!x)
                throw Error('Produto indisponível.');
            n.prices ||= {};
            x.quantity=quantity;
            n.prices[x.id] = { buy, sell };
        });
    }
    else if (f.id === 'marketHaggle') {
        const die = +v('testDie'), count = +v('testCount');
        const merchantId = f.dataset.id;
        marketRoll('Pechinchar', 5, (roll, mod) => {
            openSiteDialog({ title: 'Pechincha', message: `Dados ${roll} ${sign(mod)} = ${roll + mod}. O mestre decide o novo preço.` }).then(() => {
                const npc = market().npcs.find(x => x.id === merchantId);
                if (!npc) return;
                mkOpen(`<h2>Resposta de ${esc(npc.name)}</h2><p>O mestre decide se a pechincha foi aceita. Isso não altera valores automaticamente.</p><div class="market-tools"><button data-mk="haggle-result-yes" data-id="${esc(npc.id)}">Aceita</button><button data-mk="haggle-result-no" data-id="${esc(npc.id)}">Recusada</button></div>${mkBack}`);
            });
        }, die, count);
        return;
    }
    else if (f.id === 'marketSteal') {
        const id = f.dataset.id, i = +f.dataset.i, dc = +v('dc'), q = +v('quantity'), n = marketFind('n:' + id), x = n.stock[i], key = marketKey(c());
        if (!x || !Number.isSafeInteger(q) || q < 1 || q > x.quantity || !Number.isSafeInteger(dc) || dc < 0)
            return;
        if (arenaState() || !guardRoster(n).length)
            return toast('Configure os guardas e encerre a batalha anterior.');
        const probe = cloneItem(c());
        if (!marketRoom(probe, { ...cloneItem(x), quantity: q }))
            return toast('Mochila sem espaço.');
        marketRoll('Tentativa de roubo', 1, (die, mod) => {
            const success = die + mod > dc;
            const saved = commitMarket(s => {
                const player = marketFind(key, s), npc = marketFind('n:' + id, s);
                if (success) {
                    const item = takeMarketItem(npc, i, q, x.id);
                    if (!marketRoom(player, item))
                        throw Error('Mochila sem espaço.');
                }
                else
                    s.market.incidents.push({
                        id: itemId(), character: key, merchant: id, guards: npc.guards || [], guardRefs: guardRoster(npc).map(g => ({ id: g.b.id, count: g.count })), roll: die + mod, dc, status: 'pendente', at: new Date().toISOString()
                    });
                recordMarket(s, `${player.name}: roubo em ${npc.name} · ${die + mod} contra CD ${dc} · ${success ? 'sucesso' : 'descoberto'}`);
            });
            if (saved) {
                // Exibe a resposta do comerciante no resultado, antes da Arena.
                // O balão da loja sozinho fica encoberto pelos diálogos e pelo combate.
                const merchantReply = !success ? marketSpeakById(id, 'steal') : '';
                const finish = async () => {
                    const outcome = success
                        ? 'Item recebido.'
                        : `${n.name}: “${merchantReply}”\n\nOs guardas avançam. Prepare a iniciativa!`;
                    await openSiteDialog({
                        title: success ? 'Roubo bem-sucedido!' : 'Você foi descoberto!',
                        message: `Dados ${die} ${sign(mod)} = ${die + mod} · CD ${dc}.\n\n${outcome}`
                    });
                    if (!success)
                        guardEncounter(market().incidents.at(-1));
                };
                if ($('diceDialog').open)
                    $('diceDialog').addEventListener('close', finish, { once: true });
                else
                    finish();
            }
        }, +v('testDie'), +v('testCount'));
        return;
    }
    if (ok) {
        if (f.id === 'marketAnnounce') {
            tab = 3;
            marketView = 'mine';
            marketPage = 0;
            renderTab();
        }
        if (f.id === 'marketRegionForm') {marketView = 'npcs'; renderTab();}
        if (f.id === 'marketMerchant') {
            marketView = 'npcs';
            marketNpc = f.dataset.id || market().npcs.at(-1)?.id || '';
            marketRegion = market().npcs.find(x => x.id === marketNpc)?.region || 'Padrão';
            marketSpeechOwner = '';
            marketPage = 0;
            renderTab();
        }
        mkClose();
        toast(f.id === 'marketAnnounce' ? 'Item reservado em Meus anúncios. Você pode cancelar para recuperá-lo.' : 'Mercado atualizado.');
    }
});
function marketAction(b) {
    const { mk: a, id, i } = b.dataset, n = id && marketFind('n:' + id);
    if (a === 'close')
        return mkClose();
    if (a === 'roll-price')
        return openTradePrice();
    if (a === 'announce')
        return announceForm(-1, Number(b.dataset.listSlot ?? -1));
    if (a === 'sell-current') {
        if (!marketNpc) return toast('Selecione um mercador.');
        const options = bag(c()).flatMap((x, i) => x ? `<button type="button" data-mk="sell-item" data-i="${i}">${esc(x.name)} ×${x.quantity}</button>` : []);
        return mkOpen(`<h2>Vender ao mercador</h2><p>Escolha o item. O preço pode ser negociado e ambos precisam aceitar.</p>${options.join('') || '<p>Nenhum item na mochila.</p>'}${mkBack}`);
    }
    if (a === 'sell-item')
        return tradeForm('n:' + marketNpc, null, -1, Number(i));
    if (a === 'listing-open')
        return listingOpen(id);
    if (a === 'npc-product') {marketSpeakById(id, 'product'); return merchantProduct(id, +i);}
    if (a === 'haggle-result-yes' || a === 'haggle-result-no') {
        // A decisão do mestre encerra a pechincha: não voltar à tela do dado.
        mkClose();
        if ($('diceDialog').open) $('diceDialog').close();
        marketSpeakById(id, a === 'haggle-result-yes' ? 'haggleYes' : 'haggleNo');
        return;
    }
    if (a === 'page-prev' || a === 'page-next') {
        marketPage += a === 'page-prev' ? -1 : 1;
        return renderTab();
    }
    if (a === 'history')
        return mkOpen(`<h2>Histórico</h2>${market().history.map(h => `<div class="market-card"><small>${esc(new Date(h.at).toLocaleString('pt-BR'))}</small>${esc(h.text)}</div>`).join('') || '<p>Nenhuma negociação registrada.</p>'}${mkBack}`);
    if (a === 'cancel-list') {
        if (cancelListing(id))
            mkClose();
        return;
    }
    if (a === 'direct')
        return chooseTrade();
    if (a === 'trade-start')
        return tradeForm(id);
    if (a === 'buy-list') {
        const l = market().listings.find(x => x.id === id);
        if (l)
            return tradeForm(l.owner, id);
        return;
    }
    if (a === 'region-select') {
        if (b.dataset.region === marketRegion) {
            if (marketRegion !== 'Padrão') mkOpen(`<h2>Região: ${esc(marketRegion)}</h2><p>Excluir esta região e todos os comerciantes dela?</p><button type="button" class="market-danger" data-mk="region-delete" data-region="${esc(marketRegion)}">Excluir região</button>${mkBack}`);
            return;
        }
        marketRegion = b.dataset.region; marketNpc = ''; marketSpeechOwner = '';
        renderTab(); return;
    }
    if (a === 'npc-select') {
        if (marketNpc === id) return;
        marketNpc = id; marketSpeechOwner = '';
        renderTab(); return;
    }
    if (a === 'region-new')
        return mkOpen('<h2>Nova região</h2><form id="marketRegionForm"><label>Nome da região<input name="regionName" maxlength="60" required placeholder="Ex.: Porto Velho"></label><button type="submit">Criar região</button></form>'+mkBack);
    if (a === 'region-delete') {
        const region = b.dataset.region;
        if (!region || region === 'Padrão') return;
        openSiteDialog({title:'Excluir região?',message:'Todos os comerciantes desta região e seus estoques serão excluídos. Essa ação não pode ser desfeita.',confirm:true,danger:true}).then(yes=>{
            if (!yes) return;
            if (commitMarket(s=>{s.market.npcs = s.market.npcs.filter(x=>x.region !== region);s.market.regions=s.market.regions.filter(r=>r!==region);})) {
                marketRegion='Padrão';marketNpc='';marketSpeechOwner='';mkClose();renderTab();
            }
        });
        return;
    }
    if (a === 'npc-delete') {
        if (!n || fixedMerchant(n)) return;
        openSiteDialog({title:'Excluir comerciante?',message:`Excluir ${n.name} e todos os seus produtos?`,confirm:true,danger:true}).then(yes=>{
            if (yes && commitMarket(s=>{s.market.npcs=s.market.npcs.filter(x=>x.id!==id);})) {
                marketNpc='';marketSpeechOwner='';mkClose();renderTab();
            }
        });
        return;
    }
    if (a === 'npc-money') return marketMoneyEdit(id);
    if (a === 'shelf-category') return marketShelfLibrary(id,+i,b.dataset.category);
    if (a === 'shelf-pick') {
        const selected = bagLibEntries(b.dataset.category)[Number(b.dataset.model)];
        if (!selected) return;
        const item=libTemplate('equipment', selected.item);item.id=itemId();item.quantity=1;
        const price=marketShelfPrice(item);
        if (commitMarket(s=>{
            const npc=marketFind('n:'+id,s);
            if (!npc || npc.stock[+i]) throw Error('Espaço de produto indisponível.');
            npc.stock[+i]=item;npc.prices ||= {};
            npc.prices[item.id]={buy:coinSplit(coinTotal(price)/2n),sell:price};
        })) {mkClose();renderTab();}
        return;
    }
    if (a === 'npc-new')
        return merchantForm();
    if (a === 'npc-edit')
        return merchantForm(n);
    if (a === 'npc-open')
        return merchantOpen(id);
    if (a === 'reset-photo') {
        marketDialog.dataset.photo = '';
        $('marketPortrait').src = merchantPortraits[$('marketMerchant').elements.type.value];
        return;
    }
    if (a === 'trade-npc')
        return tradeForm('n:' + id);
    if (a === 'npc-buy')
        return tradeForm('n:' + id, null, +i);
    if (a === 'npc-item') {
        return marketShelfLibrary(id,+i);
    }
    if (a === 'npc-price') {
        const x = n.stock[+i], p = n.prices?.[x.id] || {};
        return mkOpen(`<h2>Preços sugeridos · ${esc(x.name)}</h2><form id="marketPrices" data-id="${id}" data-i="${i}"><label>Quantidade disponível<input name="quantity" type="number" min="1" max="1000000" step="1" value="${x.quantity}" required></label><h3>Comerciante compra</h3>${moneyFields('buy', p.buy)}<h3>Comerciante vende</h3>${moneyFields('sell', p.sell)}<small>Valores negociáveis. Conversão automática de moedas.</small><button type="submit">Salvar preços</button></form>${mkBack}`);
    }
    if (a === 'npc-remove') {
        openSiteDialog({ title: 'Tem certeza?', message: 'Retirar este produto do estoque?', confirm: true, danger: true }).then(ok => {
            if (ok && commitMarket(s => {
                marketFind('n:' + id, s).stock[+i] = null;
            }))
                merchantOpen(id);
        });
        return;
    }
    if (a === 'steal')
        return stealForm(id, +i);
    if (a === 'haggle')
        return haggleForm(id, +i);
}
for (const target of [$('content'), $('tabs'), marketDialog])
    target.addEventListener('click', e => {
        const b = e.target.closest('[data-mk],[data-mk-view]');
        if (!b)
            return;
        if (b.dataset.mkView) {
            if (marketView === 'npcs' && b.dataset.mkView !== 'npcs') marketLeaveMerchant();
            if (marketView !== 'npcs' && b.dataset.mkView === 'npcs') marketSpeechOwner = '';
            marketView = b.dataset.mkView;
            marketPage = 0;
            renderTab();
        }
        else
            marketAction(b);
    });
$('content').addEventListener('change', e => {
    if (e.target.id === 'marketSearch') {
        marketSearch = e.target.value;
        marketPage = 0;
        renderTab();
    }
    if (e.target.id === 'marketNpc') {
        marketNpc = e.target.value;
        renderTab();
    }
});
itemDialog.addEventListener('close', () => {
    marketItemContext = null;
});
const priceDialog = document.createElement('dialog');
priceDialog.id = 'tradePriceDialog';
document.body.append(priceDialog);
function openTradePrice() {
    const f = $('marketTrade');
    if (!f || !tradeDraft)
        return;
    const a = marketFind(tradeDraft.a), b = marketFind(tradeDraft.b);
    if (!a || !b)
        return;
    const suggested = tradeSelection(f, a, 'a').length && !tradeSelection(f, b, 'b').length ? 'b' : 'a';
    priceDialog.innerHTML = `<h2>Sortear valor da negociação</h2><form id="tradePriceForm"><label>Quem paga?<select name="payer"><option value="a" ${suggested === 'a' ? 'selected' : ''}>${esc(a.name)}</option><option value="b" ${suggested === 'b' ? 'selected' : ''}>${esc(b.name)}</option></select></label><label>Moeda<select name="coin">${moneyNames.map((n, i) => `<option value="${i}">${n}</option>`).join('')}</select></label><label>Valor-base<input name="base" type="number" min="0" max="${Number.MAX_SAFE_INTEGER - 4000}" step="1" value="0" required></label><small>Use zero para um preço totalmente aleatório. O resultado substitui o valor oferecido na moeda selecionada, mantendo as outras moedas e os itens.</small><div class="trade-price-actions"><button type="button" id="cancelTradePrice">Cancelar</button><button type="submit">Abrir dados</button></div></form>`;
    priceDialog.showModal();
    priceDialog.querySelector('#cancelTradePrice').onclick = () => priceDialog.close();
}
priceDialog.addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, base = Number(f.elements.base.value), coin = Number(f.elements.coin.value), payer = f.elements.payer.value, trade = $('marketTrade');
    if (!trade || !Number.isSafeInteger(base) || base < 0 || base > Number.MAX_SAFE_INTEGER - 4000 || ![0, 1, 2].includes(coin) || !['a', 'b'].includes(payer))
        return;
    priceDialog.close();
    openRoll();
    tradePriceRoll = { base, coin, payer, trade };
    $('diceTitle').textContent = 'Sortear valor · ' + moneyNames[coin];
    $('diceApplyPrice').hidden = false;
    $('diceApplyPrice').disabled = true;
    updateDiceSummary();
});
$('diceApplyPrice').onclick = () => {
    const r = tradePriceRoll;
    if (!r || diceBusy || !tableDice.length || tableDice.some(x => !x.done) || !marketDialog.open || $('marketTrade') !== r.trade)
        return;
    const total = tableDice.reduce((a, x) => a + x.n, 0), value = r.base + total;
    if (!Number.isSafeInteger(value) || value < 0)
        return;
    const f = r.trade, field = f.elements[r.payer + 'Money' + r.coin], payer = marketFind(tradeDraft[r.payer]);
    field.value = String(value);
    f.elements.acceptA.checked = false;
    f.elements.acceptB.checked = false;
    updateTradeView(f);
    const note = $('tradePriceNote');
    note.textContent = `${payer.name}: ${r.base} + ${total} = ${value} ${moneyNames[r.coin].toLowerCase()}` + ((!validMoney(readMoney(f, r.payer + 'Money')) || coinTotal(readMoney(f, r.payer + 'Money')) > coinTotal(coinsOf(payer))) ? ' · Saldo insuficiente; ajuste a oferta.' : '');
    $('diceDialog').close();
};
resourceSounds.kill = ["assets/audio/d2d3d112321a3b32ac2e6eaf.mp3"];
// ==============================================================================
// INIMIGOS DERROTADOS E MODO ACAMPAMENTO
// ==============================================================================
function killCount(p) {
    const n = Number(p.kills);
    return Number.isSafeInteger(n) && n >= 0 ? n : 0;
}

function manageKills() {
    const p = c();
    if (!state.characters.includes(p))
        return;
    const dlg = $('killDialog');
    if (dlg.open)
        return;
    const src = $('killsControl').querySelector('img').src;
    dlg.innerHTML = `<form id="killForm"><h2>Inimigos derrotados</h2><img class="kill-preview" src="${src}" alt=""><small>Total de abates</small><strong class="kill-current" aria-live="polite">${killCount(p)}</strong><label>Quantidade<input name="amount" type="number" min="1" max="${Number.MAX_SAFE_INTEGER}" step="1" value="1" required></label><div class="kill-controls"><button type="button" data-kill-change="1">+ Adicionar</button><button type="button" data-kill-change="-1">− Retirar</button></div><small id="killFeedback" aria-live="polite"></small><button type="button" id="killClose">Fechar</button></form>`;
    const f = $('killForm'), input = f.elements.amount, notify = $('killFeedback');
    const refresh = () => {
        const v = Number(input.value), n = killCount(p), valid = input.value !== '' && Number.isSafeInteger(v) && v > 0;
        f.querySelector('[data-kill-change="1"]').disabled = !valid || !Number.isSafeInteger(n + v);
        f.querySelector('[data-kill-change="-1"]').disabled = !valid || v > n;
        f.querySelector('.kill-current').textContent = n;
    };
    input.oninput = refresh;
    f.onsubmit = e => e.preventDefault();
    f.onclick = e => {
        const b = e.target.closest('[data-kill-change]');
        if (!b || b.disabled || c() !== p)
            return;
        const v = Number(input.value), delta = Number(b.dataset.killChange), next = killCount(p) + v * delta;
        if (!Number.isSafeInteger(v) || v <= 0 || !Number.isSafeInteger(next) || next < 0)
            return;
        const before = p.kills;
        p.kills = next;
        try {
            Store.save();
        }
        catch (err) {
            p.kills = before;
            notify.textContent = 'Não foi possível salvar a alteração.';
            return;
        }
        render();
        if (delta === 1)
            playResourceSound('kill');
        notify.textContent = 'Contador atualizado.';
        refresh();
    };
    $('killClose').onclick = () => dlg.close();
    refresh();
    dlg.showModal();
    input.focus();
    input.select();
}
$('killsControl').addEventListener('click', manageKills);
$('killsControl').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        manageKills();
    }
});
const campToggle = $('campToggle');
let campScroll = 0;
function setCampView(open) {
    if (open && document.querySelector('dialog[open]'))
        return;
    if (open) {
        campScroll = window.scrollY;
        document.activeElement?.blur();
        setSettingsOpen(false);
    }
    document.body.classList.toggle('camp-view', open);
    campToggle.setAttribute('aria-expanded', String(!open));
    campToggle.textContent = open ? '▾ Mostrar ficha' : '▴ Recolher ficha';
    campToggle.setAttribute('aria-label', open ? 'Mostrar ficha' : 'Recolher ficha para ver o acampamento');
    if (open)
        window.scrollTo(0, 0);
    else
        window.scrollTo(0, campScroll);
    campToggle.focus({ preventScroll: true });
}
campToggle.addEventListener('click', () => setCampView(!document.body.classList.contains('camp-view')));
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('camp-view'))
        setCampView(false);
});


function marketFitLayout() {
    const root=document.querySelector('#content .market-layout');
    if (!root) return;
    const left=root.children[0], scene=root.querySelector('.merchant-scene');
    if (!left || !scene) return;
    const target=left.getBoundingClientRect().bottom;
    const top=scene.getBoundingClientRect().top;
    const fit=Math.round(target-top-7);
    if (fit>=230) scene.style.height=fit+'px';
}
window.addEventListener('resize',()=>{if (document.querySelector('#content .market-layout')) requestAnimationFrame(marketFitLayout);});
