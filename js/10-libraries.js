// ==============================================================================
// BIBLIOTECAS DE CONTEÚDO
// ==============================================================================
const LIB_INFO = {
    bestiary: ['Bestiário', 'Bestiario.json'], equipment: ['Equipamentos', 'Equipamentos.json'], skills: ['Habilidades', 'Habilidades.json'], spells: ['Magias', 'Magias.json'], market: ['Mercado', 'Mercado.json']
};
let libKind = 'bestiary', libQuery = '', libSource = false, libItemEditing = false, libItemId = null;
const libDialog = restDialogMake('contentLibraryDialog');
function libList(k = libKind) {
    if (k === 'market') return libMarketRegions();
    if (k === 'bestiary')
        return bestiary();
    state.contentLibraries ??= {};
    if (!Array.isArray(state.contentLibraries[k]))
        state.contentLibraries[k] = [];
    return state.contentLibraries[k];
}

// Regiões da biblioteca: o Mercado real continua sendo a única fonte dos dados.
// Padrão e os quatro comerciantes fixos não fazem parte da exportação.
function libMarketRegions() {
    const m = market();
    return m.regions.filter(r => r !== 'Padrão').map(name => ({
        id: name, name, merchants: m.npcs.filter(n => n.region === name && !fixedMerchant(n))
    }));
}
function libMarketExport() {
    return libMarketRegions().map(r => ({ name: r.name, merchants: r.merchants.map(n => cloneItem(n)) }));
}
function libMarketName(value) {
    const name = String(value || '').trim();
    if (!name || name.length > 60 || /[<>]/.test(name) || name.toLocaleLowerCase('pt-BR') === 'padrão')
        throw Error('Nome de região inválido.');
    return name;
}
function libMarketValidate(doc) {
    if (!Array.isArray(doc.entries) || doc.entries.length > 1000) throw Error('Regiões inválidas.');
    const namesSeen = new Set();
    return doc.entries.map(region => {
        if (!region || typeof region !== 'object' || Array.isArray(region)) throw Error('Região inválida.');
        const name = libMarketName(region.name), key = name.toLocaleLowerCase('pt-BR');
        if (namesSeen.has(key) || !Array.isArray(region.merchants) || region.merchants.length > 200)
            throw Error('Regiões ou comerciantes duplicados/inválidos.');
        namesSeen.add(key);
        const merchants = region.merchants.map(n => {
            if (!n || typeof n !== 'object' || Array.isArray(n) || typeof n.name !== 'string' || !n.name.trim() || n.name.length > 120 || !merchantTypes.includes(n.type))
                throw Error('Comerciante inválido.');
            if (n.photo && (typeof n.photo !== 'string' || !safeArt(n.photo))) throw Error('Imagem de comerciante inválida.');
            if (!Array.isArray(n.stock) || n.stock.length > 20 || !n.stock.every(x => x === null || x && typeof x === 'object' && !Array.isArray(x)))
                throw Error('Estoque inválido.');
            if (!Array.isArray(n.coins) || n.coins.length !== 3 || !n.coins.every(v => Number.isSafeInteger(v) && v >= 0))
                throw Error('Moedas inválidas.');
            const plain = cloneItem(n);
            function check(v, depth=0) {
                if (depth > 30) throw Error('Estrutura muito profunda.');
                if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) {
                    if (['__proto__','constructor','prototype'].includes(k)) throw Error('Conteúdo inválido.');
                    if (typeof x === 'string' && x.length > 6000000) throw Error('Texto ou imagem muito grande.');
                    check(x, depth+1);
                }
            }
            check(plain);
            return { id: itemId(), name: n.name.trim(), type: n.type, region: name,
                photo: n.photo || '', stock: plain.stock, prices: plain.prices && typeof plain.prices === 'object' && !Array.isArray(plain.prices) ? plain.prices : {},
                coins: n.coins, guards: Array.isArray(n.guards) ? n.guards : [], guardRefs: Array.isArray(n.guardRefs) ? n.guardRefs : [] };
        });
        return {name, merchants};
    });
}
function libMarketImport(entries) {
    const existing = new Set(market().regions.map(r => r.toLocaleLowerCase('pt-BR')));
    let added = 0, ignored = 0;
    const regions = [];
    for (const r of entries) {
        if (existing.has(r.name.toLocaleLowerCase('pt-BR'))) {ignored++;continue;}
        existing.add(r.name.toLocaleLowerCase('pt-BR'));
        regions.push(r);added++;
    }
    if (regions.length && !commitMarket(s => {
        for (const r of regions) {
            s.market.regions.push(r.name);
            s.market.npcs.push(...r.merchants);
        }
    })) throw Error('Não foi possível salvar as regiões.');
    return {added,ignored};
}
const libMarketDialog = restDialogMake('libMarketRegionDialog');
let libMarketCurrent = '';
function libMarketRegionOpen(name = '') {
    const r = libMarketRegions().find(x => x.name === name);
    libMarketCurrent = r?.name || '';
    libMarketDialog.innerHTML = `<h2>${r ? 'Região: ' + esc(r.name) : 'Criar região comercial'}</h2>
        <form id="libMarketRegionForm"><label>Nome da região<input name="name" required maxlength="60" value="${esc(r?.name || '')}" placeholder="Nome da região"></label><button type="submit">${r ? 'Renomear região' : 'Criar região'}</button></form>
        ${r ? `<h3>Comerciantes (${r.merchants.length})</h3><div class="lib-market-merchants">${r.merchants.map(n => `<button type="button" data-lib-merchant="${esc(n.id)}">${esc(n.name)} · ${esc(n.type)}</button>`).join('') || '<p>Nenhum comerciante cadastrado.</p>'}</div><div class="lib-editor-actions"><button type="button" data-lib-merchant-new>+ Cadastrar comerciante</button><button type="button" data-lib-market-view>Gerenciar estoques no Mercado</button><button type="button" data-lib-region-duplicate>Duplicar região</button><button type="button" class="lib-editor-danger" data-lib-region-delete>Excluir região</button></div>` : ''}
        <p id="libMarketError" role="status"></p><button type="button" data-lib-region-close>Fechar</button>`;
    if (!libMarketDialog.open) libMarketDialog.showModal();
}
libMarketDialog.addEventListener('submit', e => {
    if (e.target.id !== 'libMarketRegionForm') return;
    e.preventDefault();
    try {
        const name = libMarketName(e.target.elements.name.value);
        const old = libMarketCurrent;
        if (market().regions.some(r => r.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR') && r !== old)) throw Error('Já existe uma região com esse nome.');
        if (!old || old !== name) {
            if (!commitMarket(s => {
                if (old) {
                    s.market.regions[s.market.regions.indexOf(old)] = name;
                    s.market.npcs.forEach(n => {if (n.region === old) n.region = name;});
                } else s.market.regions.push(name);
            })) throw Error('Falha ao salvar.');
        }
        libMarketRegionOpen(name);
        libDraw();
    } catch (err) {libMarketDialog.querySelector('#libMarketError').textContent = err.message;}
});
libMarketDialog.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-lib-region-close')) return libMarketDialog.close();
    const old = libMarketCurrent; if (!old) return;
    if (b.hasAttribute('data-lib-region-delete')) {
        if (await openSiteDialog({title:'Excluir região?',message:'Excluir ' + old + ' e todos os seus comerciantes?',confirm:true,danger:true}) !== true) return;
        if (commitMarket(s => {s.market.regions = s.market.regions.filter(r => r !== old);s.market.npcs = s.market.npcs.filter(n => n.region !== old);})) {
            libMarketDialog.close();libDraw();
        }
    } else if (b.hasAttribute('data-lib-region-duplicate')) {
        const r=libMarketRegions().find(x => x.name===old);
        if(!r)return;
        const taken=new Set(market().regions.map(x=>x.toLocaleLowerCase('pt-BR')));
        let name=old+' (cópia)', i=2;
        while(taken.has(name.toLocaleLowerCase('pt-BR'))){name=old+' ('+(i++)+')';}
        if(name.length>60)return libMarketDialog.querySelector('#libMarketError').textContent='Nome muito longo para duplicar.';
        if(commitMarket(s=>{s.market.regions.push(name);s.market.npcs.push(...r.merchants.map(n=>({...cloneItem(n),id:itemId(),region:name})));})){libMarketRegionOpen(name);libDraw();}
    } else if (b.hasAttribute('data-lib-merchant-new') || b.hasAttribute('data-lib-merchant')) {
        marketRegion=old;
        const n=b.dataset.libMerchant ? market().npcs.find(x=>x.id===b.dataset.libMerchant) : null;
        libMarketDialog.close();
        merchantForm(n || null);
    } else if (b.hasAttribute('data-lib-market-view')) {
        marketRegion=old;
        marketView='npcs';marketNpc='';tab=3;
        libMarketDialog.close();libDialog.close();renderTab();
    }
});
function libTemplate(k, x) {
    const o = cloneItem(x);
    if (k === 'equipment') {
        o.quantity = 1;
        delete o.preparedSpells;
        delete o.ghost;
        delete o.owner;
        if (o.ammo?.enabled)
            o.ammo.current = o.ammo.max;
        if (o.charges?.enabled)
            o.charges.current = o.charges.max;
    }
    if (k === 'skills' || k === 'spells') {
        o.remaining = 0;
        o.active = false;
        delete o.cooldownRemaining;
        delete o.activeRemaining;
    }
    return o;
}

function libCanonical(x) {
    if (Array.isArray(x))
        return x.map(libCanonical);
    if (x && typeof x === 'object')
        return Object.fromEntries(Object.keys(x).filter(k => k !== 'id').sort().map(k => [k, libCanonical(x[k])]));
    return x;
}

function libSignature(k, x) {
    return JSON.stringify(libCanonical(libTemplate(k, x)));
}

function libValidate(k, x) {
    const bad = () => {
        throw Error('Conteúdo inválido em ' + LIB_INFO[k][0] + '.');
    };
    const obj = o => o && typeof o === 'object' && !Array.isArray(o), arr = o => Array.isArray(o) && o.length <= 10000, finite = Number.isFinite;
    function walk(o, depth = 0) {
        if (depth > 48)
            bad();
        if (!o || typeof o !== 'object')
            return;
        for (const [key, v] of Object.entries(o)) {
            if (['__proto__', 'prototype', 'constructor'].includes(key))
                bad();
            if (['image', 'photo', 'portrait'].includes(key) && (typeof v !== 'string' || v && !safeArt(v)))
                bad();
            if (key === 'id' && (typeof v !== 'string' || !/^[\w-]{1,150}$/.test(v)))
                bad();
            if (typeof v === 'number' && !finite(v))
                bad();
            if (typeof v === 'string' && /[<>]/.test(v) && !['name', 'description', 'details', 'ammoName', 'name'].includes(key))
                bad();
            if (typeof v === 'object')
                walk(v, depth + 1);
        }
    }
    const dice = d => obj(d) && Object.entries(d).every(([a, b]) => [...DICE_KINDS.map(String), 'fixed'].includes(a) && Number.isSafeInteger(b) && (a === 'fixed' || b >= 0 && b <= 40));
    const power = p => {
        if (!obj(p) || typeof p.name !== 'string' || !p.name.trim() || !obj(p.base) || !arr(p.progress) || typeof p.type !== 'string')
            bad();
        for (const q of [p.base, ...p.progress]) {
            if (!obj(q) || !arr(q.effects) || !finite(q.cost) || !finite(q.cooldown))
                bad();
            for (const e of q.effects)
                if (!obj(e) || typeof e.kind !== 'string' || typeof e.target !== 'string' || typeof e.trigger !== 'string' || !dice(e.dice))
                    bad();
        }
    };
    if (!obj(x) || typeof x.name !== 'string' || !x.name.trim() || x.name.length > 200)
        bad();
    walk(x);
    if (k === 'equipment') {
        if (!CATEGORIES.includes(x.category) || !RARITIES.includes(x.rarity) || !arr(x.effects) || !arr(x.bonuses) || typeof x.art !== 'string')
            bad();
        if (x.category === 'Armas' && (!dice(x.damage) || ![1, 2].includes(x.hands) || !obj(x.ammo) || !obj(x.charges) || !dice(x.charges.damage)))
            bad();
        if (x.category === 'Consumíveis' && (!obj(x.consumption) || !dice(x.consumption.amount)))
            bad();
        for (const e of x.effects)
            if (!obj(e) || typeof e.kind !== 'string' || typeof e.trigger !== 'string')
                bad();
        for (const b of x.bonuses)
            if (!obj(b) || typeof b.kind !== 'string' || !finite(b.value))
                bad();
    }
    else if (k === 'skills' || k === 'spells') {
        power(x);
        if (k === 'spells' && (!names.includes(x.attribute) || typeof x.target !== 'string'))
            bad();
    }
    else {
        if (!Number.isSafeInteger(x.hp) || x.hp < 1 || !Number.isSafeInteger(x.mp) || x.mp < 0 || !finite(x.ca) || !Array.isArray(x.attrs) || x.attrs.length !== 6 || !x.attrs.every(finite) || !arr(x.attacks) || !arr(x.learnedSkills) || !arr(x.learnedSpells))
            bad();
        for (const a of x.attacks) {
            if (!obj(a) || typeof a.name !== 'string' || !dice(a.dice) || !arr(a.effects))
                bad();
            for (const e of a.effects)
                if (!obj(e) || typeof e.kind !== 'string' || !dice(e.dice))
                    bad();
        }
        for (const a of [...x.learnedSkills, ...x.learnedSpells])
            power(a);
        if (x.equipment !== undefined) {
            if (!arr(x.equipment)) bad();
            for (const item of x.equipment) {
                if (!obj(item) || !CATEGORIES.includes(item.category) || typeof item.name !== 'string')
                    bad();
            }
        }
    }
    return libTemplate(k, x);
}

function libCommit(k, next) {
    const old = libList(k);
    if (k === 'bestiary')
        state.bestiary = next;
    else
        state.contentLibraries[k] = next;
    try {
        Store.save();
        return true;
    }
    catch (e) {
        if (k === 'bestiary')
            state.bestiary = old;
        else
            state.contentLibraries[k] = old;
        libMessage('Não foi possível salvar. Verifique o espaço do navegador e exporte um backup.');
        return false;
    }
}

function libMessage(t) {
    const n = $('libMessage');
    if (n)
        n.textContent = t;
    else
        toast(t);
}

function libMerge(k, incoming) {
    const validated = incoming.map(x => libValidate(k, x)), next = libList(k).slice(), seen = new Set(next.map(x => libSignature(k, x))), ids = new Set(next.map(x => x.id));
    let added = 0, ignored = 0;
    for (const x of validated) {
        // v0.9.35: bibliotecas antigas não podem reintroduzir a aljava decorativa.
        if (k === 'equipment' && isDecorativeQuiverV0935(x)) { ignored++; continue; }
        const sig = libSignature(k, x);
        if (seen.has(sig)) {
            ignored++;
            continue;
        }
        if (!x.id || ids.has(x.id))
            x.id = itemId();
        seen.add(sig);
        ids.add(x.id);
        next.push(x);
        added++;
    }
    if (added && !libCommit(k, next))
        return null;
    return { added, ignored };
}

function libArt(k, x) {
    return k === 'market' ? (x.merchants[0] ? (safeArt(x.merchants[0].photo) || bregMerchantArt[x.merchants[0].name] || merchantPortraits[x.merchants[0].type]) : '') : k === 'equipment' ? itemArt(x) : k === 'skills' ? skillImage(x) : k === 'spells' ? spellImage(x) : beastImage(x);
}

function libDescription(k, x) {
    return k === 'market' ? `${x.merchants.length} comerciante(s)` : k === 'equipment' ? itemDetails(x) : k === 'skills' ? `${x.type} · ${x.reference}` : k === 'spells' ? `${x.type} · ${x.attribute}` : `Nível ${x.level} · PV ${x.hp} · CA ${x.ca}`;
}

// A opção "Copiar modelos" consulta somente os catálogos padrão, nunca
// os pertences das fichas nem os estoques dos mercadores.
function libSources(k) {
    if (k === 'market') return [{x: {name:'Região comercial padrão',merchants:market().npcs.filter(fixedMerchant)}, origin:'Modelo padrão (cópia independente)'}];
    const originals = k === 'equipment' ? BAG_BASIC_MODELS
        : k === 'skills' ? SKILL_LIBRARY
        : k === 'spells' ? SPELL_LIBRARY : beastStandardModels();
    return originals.map(x => ({ x, origin: 'Modelo padrão' }));
}

// Prévia visual ampliada, dentro da própria biblioteca, como nas habilidades.
// Não usar title: ele produz apenas a dica pequena nativa do navegador.
function libPreviewLines(k, x) {
    if (k === 'market') return [libDescription(k,x), ...x.merchants.map(n => n.name + ' · ' + n.type)];
    if (k === 'bestiary') return [
        `Nível ${x.level} · PV ${x.hp} · PM ${x.mp} · CA ${x.ca}`,
        `Iniciativa ${x.initiative >= 0 ? '+' : ''}${x.initiative} · Deslocamento ${x.movement} m`,
        Array.isArray(x.attrs) ? names.map((n, i) => `${n.slice(0,3).toUpperCase()} ${x.attrs[i]}`).join(' · ') : '',
        x.attacks?.length ? 'Ataques: ' + x.attacks.map(a => a.name).join(', ') : '',
        x.equipment?.length ? 'Equipamentos: ' + x.equipment.map(a => a.name).join(', ') : '',
        x.learnedSkills?.length ? 'Habilidades: ' + x.learnedSkills.map(a => a.name).join(', ') : '',
        x.learnedSpells?.length ? 'Magias: ' + x.learnedSpells.map(a => a.name).join(', ') : ''
    ];
    if (k === 'skills') return skillDescription(x);
    if (k === 'spells') return spellDetails(x);
    if (k === 'equipment') return [libDescription(k, x)];
    return [];
}
function libHidePreview() {
    const preview = document.getElementById('libHoverPreview');
    if (!preview) return;
    if (preview.matches(':popover-open')) preview.hidePopover();
    preview.remove();
}
function libShowPreview(tile) {
    if (!tile || !libDialog.open) return;
    const k = libKind, srcIndex = tile.dataset.libCopy;
    const x = srcIndex !== undefined ? libShownSources[Number(srcIndex)]?.x
        : libList(k).find(z => z.id === tile.dataset.libEdit);
    if (!x) return libHidePreview();
    const art = libArt(k, x), title = x.name || '';
    const lines = libPreviewLines(k, x).filter(Boolean);
    libHidePreview();
    const preview = document.createElement('div');
    preview.id = 'libHoverPreview';
    preview.className = 'lib-expanded-preview';
    preview.setAttribute('role', 'tooltip');
    preview.setAttribute('popover', 'manual');
    preview.innerHTML = `<div class="lib-preview-head">${art ? `<img src="${esc(art)}" alt="">` : ''}<strong>${esc(title)}</strong></div>${x.description ? `<p class="lib-preview-description">${esc(x.description)}</p>` : ''}${lines.map(t => `<p>${esc(String(t))}</p>`).join('')}`;
    // A preview is a top-layer popover: it stays visible even when the modal scrolls.
    document.body.append(preview);
    preview.showPopover();
    const r = tile.getBoundingClientRect(), w = preview.offsetWidth, h = preview.offsetHeight;
    const left = r.right + w + 12 <= innerWidth - 10 ? r.right + 12 : r.left - w - 12;
    preview.style.left = Math.max(8, Math.min(innerWidth - w - 8, left)) + 'px';
    preview.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.top)) + 'px';
}
libDialog.addEventListener('pointerover', e => {
    const tile = e.target.closest('.lib-content-tile');
    if (tile && !tile.contains(e.relatedTarget)) libShowPreview(tile);
});
libDialog.addEventListener('pointerout', e => {
    const tile = e.target.closest('.lib-content-tile');
    if (tile && !tile.contains(e.relatedTarget)) libHidePreview();
});
libDialog.addEventListener('focusin', e => {
    const tile = e.target.closest('.lib-content-tile');
    if (tile) libShowPreview(tile);
});
libDialog.addEventListener('focusout', e => {
    if (e.target.closest('.lib-content-tile')) libHidePreview();
});
libDialog.addEventListener('scroll', e => {
    if (e.target.id === 'libRows' || e.target === libDialog) libHidePreview();
}, true);
libDialog.addEventListener('close', libHidePreview);

let libShownSources = [];
function libTile(k, x, origin = '', index = null) {
    const source = libSource;
    const src = libArt(k, x);
    const action = source ? `data-lib-copy="${index}"` : `data-lib-edit="${esc(x.id)}"`;
    return `<button type="button" class="lib-content-tile" ${action} aria-label="${source ? 'Copiar' : 'Editar'} ${esc(x.name)}">
        <span class="lib-content-art">${src ? `<img src="${esc(src)}" alt="" loading="lazy">` : '<span class="lib-no-art" aria-hidden="true">✦</span>'}</span>
        <span class="lib-content-name">${esc(x.name)}</span>
        ${source ? `<span class="lib-origin">${esc(origin)}</span>` : ''}
    </button>`;
}
function libRows() {
    const host = $('libRows');
    if (!host) return;
    const k = libKind, query = libQuery.toLocaleLowerCase('pt-BR');
    host.className = 'lib-content-grid';
    libShownSources = libSource ? libSources(k) : [];
    const rows = libSource ? libShownSources.map((v, i) => ({ ...v, index: i })) : libList(k).map(x => ({ x }));
    host.innerHTML = rows.filter(({ x, origin }) => (x.name + ' ' + (origin || '') + ' ' + (x.category || '') + (k === 'market' ? ' ' + x.merchants.map(n => n.name).join(' ') : '')).toLocaleLowerCase('pt-BR').includes(query))
      .map(({x, origin, index}) => libTile(k, x, origin, index)).join('') || `<p class="empty-note">${libSource ? 'Nenhum modelo padrão disponível.' : 'Nenhum conteúdo encontrado.'}</p>`;
}

function libraryOpen(k = libKind) {
    libKind = k;
    libQuery = '';
    libSource = false;
    libDraw();
    if (!libDialog.open)
        libDialog.showModal();
}

function libDraw() {
    const k = libKind;
    libDialog.dataset.category = k;
    libDialog.innerHTML = `<div class="lib-page-head"><div><h2>Bestiário e bibliotecas</h2><p class="lib-help">Gerencie criaturas, equipamentos, habilidades, magias e regiões comerciais em um único lugar.</p></div><button type="button" data-lib-close aria-label="Fechar biblioteca">✕ Fechar</button></div>
    <nav class="lib-tabs" aria-label="Categorias da biblioteca">${Object.entries(LIB_INFO).map(([id, v]) => `<button type="button" data-lib-tab="${id}" aria-pressed="${k === id}" class="${k === id ? 'selected' : ''}">${v[0]} <small>${libList(id).length}</small></button>`).join('')}</nav>
    <div class="lib-toolbar"><button type="button" data-lib-new class="lib-primary">+ ${{ bestiary: 'Criar criatura', equipment: 'Cadastrar equipamento', skills: 'Cadastrar habilidade', spells: 'Cadastrar magia', market: 'Criar região' }[k]}</button><button type="button" data-lib-source>${libSource ? '← Voltar à biblioteca' : 'Copiar modelos padrão'}</button><div class="lib-toolbar-files"><button type="button" data-lib-import>⇧ Importar JSON</button><button type="button" data-lib-export>⇩ Exportar JSON</button></div><input id="libFile" type="file" accept=".json,application/json" hidden></div>
    <input id="libSearch" type="search" placeholder="${{ bestiary: 'Pesquisar criatura', equipment: 'Pesquisar equipamento', skills: 'Pesquisar habilidade', spells: 'Pesquisar magia', market: 'Pesquisar região ou comerciante' }[k]}" value="${esc(libQuery)}" aria-label="Pesquisar na biblioteca"><p id="libMessage" role="status" aria-live="polite"></p><div id="libRows"></div>`;
    libRows();
}

function libEdit(k, x) {
    if (k === 'market') return libMarketRegionOpen(x?.name || '');
    if (k === 'equipment') {
        libItemEditing = true;
        libItemId = x?.id || null;
        if (x)
            openItemForm(x, -1, true);
        else
            categoryMenu(-1);
        return;
    }
    if (k === 'skills' || k === 'spells') {
        const owner = { learnedSkills: k === 'skills' ? libList(k) : [], learnedSpells: k === 'spells' ? libList(k) : [] };
        if (k === 'skills') {
            openSkillForm(x || skillBlank(), x?.id || null);
            skillOwner = owner;
            skillDialog.dataset.libraryOwner = '1';
            libEditorActions();
        }
        else {
            openSpellForm(x || spellBlank(), x?.id || null);
            spellOwner = owner;
            spellDialog.dataset.libraryOwner = '1';
            libEditorActions();
        }
        return;
    }
    beastDraft = x ? cloneItem(x) : blankBeast();
    beastDialog.dataset.libraryOwner = '1';
    beastForm();
    if (!beastDialog.open)
        beastDialog.showModal();
}

// Ações de gerenciamento só aparecem em editores abertos a partir desta biblioteca.
function libEditorActions() {
    for (const [kind, dialog, active] of [
        ['equipment', itemDialog, libItemEditing],
        ['skills', skillDialog, skillDialog.dataset.libraryOwner === '1'],
        ['spells', spellDialog, spellDialog.dataset.libraryOwner === '1']
    ]) {
        const id = kind === 'equipment' ? libItemId : kind === 'skills' ? skillEditId : spellEditId;
        if (!active || !id || !libList(kind).some(x => x.id === id)) continue;
        const form = dialog.querySelector('form');
        if (!form || form.querySelector('.lib-editor-actions')) continue;
        const bar = document.createElement('div');
        bar.className = 'lib-editor-actions';
        bar.innerHTML = `<button type="button" data-lib-editor-duplicate="${kind}">Duplicar modelo</button><button type="button" data-lib-editor-delete="${kind}" class="lib-editor-danger">Excluir modelo</button>`;
        form.append(bar);
    }
}
// Formulários de magia/habilidade podem ser redesenhados a cada etapa.
const libEditorObserver = new MutationObserver(() => libEditorActions());
for (const dlg of [itemDialog, skillDialog, spellDialog]) {
    libEditorObserver.observe(dlg, {childList:true, subtree:true});
    dlg.addEventListener('click', async e => {
        const btn = e.target.closest('[data-lib-editor-duplicate],[data-lib-editor-delete]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const kind = btn.dataset.libEditorDuplicate || btn.dataset.libEditorDelete;
        const id = kind === 'equipment' ? libItemId : kind === 'skills' ? skillEditId : spellEditId;
        const x = libList(kind).find(z => z.id === id);
        if (!x) return;
        if (btn.hasAttribute('data-lib-editor-duplicate')) {
            const q = cloneItem(x);
            q.id = itemId();
            q.name += ' (cópia)';
            try {
                const r = libMerge(kind, [q]);
                if (r) {
                    dlg.close();
                    libDraw();
                    libMessage('Modelo duplicado.');
                }
            } catch (err) { alert(err.message || 'Não foi possível duplicar.'); }
        } else {
            if (await openSiteDialog({title:'Excluir modelo?',message:x.name+' — as cópias nas fichas não serão alteradas.',confirm:true,danger:true}) !== true) return;
            if (libCommit(kind, libList(kind).filter(z => z.id !== x.id))) {
                dlg.close();
                libDraw();
                libMessage('Modelo excluído.');
            }
        }
    });
}

function libSaveModel(k, x, id) {
    let d;
    try {
        d = libValidate(k, x);
    }
    catch (e) {
        return e.message;
    }
    const next = libList(k).slice(), i = next.findIndex(z => z.id === id);
    d.id = i >= 0 ? next[i].id : itemId();
    if (i >= 0)
        next[i] = d;
    else
        next.push(d);
    return libCommit(k, next) ? '' : 'Não foi possível salvar.';
}

function libGive(k, x) {
    const d = restDialogMake('libraryGiveDialog');
    d.innerHTML = `<h2>${k === 'equipment' ? 'Entregar item' : 'Ensinar'}: ${esc(x.name)}</h2><form id="libGiveForm"><label>Personagem<select name="player" required>${state.characters.map(p => `<option value="${esc(p.marketId)}" ${p === c() ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></label>${k === 'equipment' ? field('Quantidade', 'quantity', 1, 'number', 'min="1" max="1000000" required step="1"') : ''}<p id="libGiveError" role="alert"></p><button type="submit">Confirmar</button><button type="button" id="libGiveCancel">Cancelar</button></form>`;
    $('libGiveCancel').onclick = () => d.close();
    $('libGiveForm').onsubmit = e => {
        e.preventDefault();
        const f = e.target, p = state.characters.find(z => z.marketId === f.elements.player.value), err = t => $('libGiveError').textContent = t;
        if (!p)
            return err('Escolha um personagem.');
        if (state.combatActive || arenaState())
            return err('Encerre a batalha antes de distribuir conteúdo.');
        const q = libTemplate(k, x);
        q.id = itemId();
        const key = k === 'equipment' ? 'bagSlots' : k === 'skills' ? 'learnedSkills' : 'learnedSpells', old = cloneItem(p[key] || []);
        if (k === 'equipment') {
            q.quantity = Number(f.elements.quantity.value);
            if (!Number.isSafeInteger(q.quantity) || q.quantity < 1 || q.quantity > 1000000)
                return err('Quantidade inválida.');
            if (!bagPlace(p, q))
                return err('Mochila sem espaço suficiente.');
        }
        else {
            const list = k === 'skills' ? skills(p) : spells(p);
            if (list.some(z => libSignature(k, z) === libSignature(k, q)))
                return err('Este personagem já conhece esse conteúdo.');
            list.push(q);
        }
        try {
            Store.save();
        }
        catch (e) {
            p[key] = old;
            return err('Não foi possível salvar.');
        }
        d.close();
        render();
        libMessage('Cópia entregue a ' + p.name + '.');
    };
    if (!d.open)
        d.showModal();
}
libDialog.addEventListener('input', e => {
    if (e.target.id === 'libSearch') {
        libQuery = e.target.value;
        libRows();
    }
});
libDialog.addEventListener('change', async (e) => {
    if (e.target.id !== 'libFile')
        return;
    const f = e.target.files[0], k = libKind;
    if (!f)
        return;
    try {
        if (f.size > 40 * 1024 * 1024)
            throw Error('Arquivo maior que 40 MiB. Divida a biblioteca.');
        const doc = JSON.parse(await f.text());
        if (k === 'market') {
            if (doc.schema !== 'bregathyel-library-1' || doc.category !== 'market') throw Error('Selecione um JSON da biblioteca Mercado.');
            const r = libMarketImport(libMarketValidate(doc));
            libSource = false; libDraw();
            return libMessage(`${r.added} região(ões) importada(s); ${r.ignored} já existente(s).`);
        }
        if (doc.schema !== 'bregathyel-library-1' || doc.category !== k || !Array.isArray(doc.entries) || doc.entries.length > 10000)
            throw Error('Selecione um JSON da biblioteca ' + LIB_INFO[k][0] + '.');
        const r = libMerge(k, doc.entries);
        if (r) {
            libKind = k;
            libSource = false;
            libDraw();
            libMessage(`${r.added} adicionado(s); ${r.ignored} idêntico(s) ignorado(s).`);
        }
    }
    catch (e) {
        libMessage(e.message || 'Arquivo inválido.');
    }
    finally {
        e.target.value = '';
    }
});
libDialog.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b)
        return;
    const d = b.dataset, k = libKind, has = a => a in d;
    if (d.libTab)
        return libraryOpen(d.libTab);
    if (has('libClose'))
        return libDialog.close();
    if (has('libSource')) {
        libSource = !libSource;
        libDraw();
        return;
    }
    if (has('libNew'))
        return libEdit(k, null);
    if (has('libImport'))
        return $('libFile').click();
    if (has('libExport'))
        return downloadJSON({ schema: 'bregathyel-library-1', version: APP_VERSION, category: k, entries: k === 'market' ? libMarketExport() : libList(k).map(x => libTemplate(k, x)) }, LIB_INFO[k][1]);
    if (has('libCopy')) {
        try {
            const model = libShownSources[+d.libCopy]?.x;
            if (!model) return libMessage('Modelo indisponível.');
            if (k === 'market') {
                const taken = new Set(market().regions.map(x => x.toLocaleLowerCase('pt-BR')));
                let name = 'Região comercial (cópia)', i = 2;
                while (taken.has(name.toLocaleLowerCase('pt-BR'))) name = 'Região comercial (' + (i++) + ')';
                const r = libMarketImport(libMarketValidate({entries:[{name,merchants:model.merchants}]}));
                if (r.added) {libSource=false;libDraw();libMarketRegionOpen(name);libMessage('Região padrão copiada para edição.');}
                return;
            }
            const copy = cloneItem(model);
            copy.id = itemId();
            const r = libMerge(k, [copy]);
            if (r) {
                libDraw();
                libMessage(r.added ? 'Modelo copiado.' : 'Já existe um modelo idêntico.');
            }
        }
        catch (e) {
            libMessage(e.message);
        }
        return;
    }
    const x = libList(k).find(z => z.id === (d.libEdit || d.libDuplicate || d.libGive || d.libDelete));
    if (!x)
        return;
    if (d.libEdit)
        return libEdit(k, x);
    if (d.libGive)
        return libGive(k, x);
    if (d.libDuplicate) {
        if (k === 'market') return libMarketRegionOpen(x.name);
        const q = cloneItem(x);
        q.id = itemId();
        q.name += ' (cópia)';
        try {
            const r = libMerge(k, [q]);
            if (r) {
                libDraw();
                libMessage('Modelo duplicado.');
            }
        }
        catch (e) {
            libMessage(e.message);
        }
        return;
    }
    if (d.libDelete) {
        if (k === 'market') return libMarketRegionOpen(x.name);
        if (k === 'bestiary' && (market().npcs.some(n => guardRoster(n).some(g => g.b.id === x.id)) || arenaState()?.participants?.some(p => p.beastId === x.id)))
            return libMessage('Criatura vinculada a comerciante ou batalha. Remova a associação primeiro.');
        if (await openSiteDialog({ title: 'Excluir modelo?', message: x.name + ' — as cópias nas fichas não serão alteradas.', confirm: true, danger: true }) !== true)
            return;
        if (libCommit(k, libList(k).filter(z => z.id !== x.id))) {
            libDraw();
            libMessage('Modelo excluído.');
        }
    }
});
itemDialog.addEventListener('close', () => {
    libItemEditing = false;
    libItemId = null;
    if (libDialog.open)
        libDraw();
});
for (const d of [skillDialog, spellDialog, beastDialog])
    d.addEventListener('close', () => {
        delete d.dataset.libraryOwner;
        if (libDialog.open)
            libDraw();
    });
document.addEventListener('click', e => {
    const b = e.target.closest('[data-library-open]');
    if (b)
        libraryOpen(b.dataset.libraryOpen);
});
// Resumo de batalha e recompensas manuais — v0.8.4.


// Ao fechar o editor de comerciante, a aba Mercado reflete o estado salvo.
marketDialog.addEventListener('close', () => { if (libDialog.open && libKind === 'market') libDraw(); });
