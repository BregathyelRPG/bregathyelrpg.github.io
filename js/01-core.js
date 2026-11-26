
'use strict';
// ==============================================================================
// NÚCLEO — constantes, regras de atributos, estado e armazenamento
// ==============================================================================
const APP_VERSION = '1.0.2';
const appVersionLabel = document.getElementById('appVersion');
if (appVersionLabel)
    appVersionLabel.textContent = 'Bregathyel · v' + APP_VERSION;
const $ = id => document.getElementById(id), names = ['Força', 'Destreza', 'Constituição', 'Inteligência', 'Sabedoria', 'Carisma'], races = {
    'Humano': [0, 0, 0, 0, 0, 0], 'Elfo': [0, 1, -1, 0, 0, 0], 'Orc': [1, 0, 0, -1, 0, 0], 'Anão': [0, 0, 1, 0, 0, -1], 'Draconato': [0, -1, 0, 0, 1, 0], 'Halfling': [0, 0, -1, 0, 0, 1], 'Tiefling': [0, 0, -1, 1, 0, 0], 'Outro': [0, 0, 0, 0, 0, 0]
}, classes = ['Guerreiro', 'Arqueiro', 'Mago', 'Ladino', 'Clérigo', 'Paladino', 'Bárbaro', 'Druida', 'Bardo', 'Monge', 'Feiticeiro', 'Bruxo', 'Outro'];
const Rules = {
    mod: n => n > 19 ? 4 + Math.floor((n - 19) / 5) : Math.floor((n - 10) / 2), capacity: c => Math.min(40, 10 + c.level - 1 + Math.floor(Math.max(0, effectiveAttrs(c)[0] - 8) / 4)), maxHP: c => Math.max(1, 10 + effectiveAttrs(c)[2] + equipmentBonus(c, "PV máximos")), maxMP: c => Math.max(0, 10 + Math.floor((Rules.mod(effectiveAttrs(c)[3]) + Rules.mod(effectiveAttrs(c)[4])) / 2) + equipmentBonus(c, "PM máximos"))
};
const fresh = () => ({
    name: 'Aelarion', race: 'Elfo', class: 'Arqueiro', subclass: '', level: 1, attrs: [12, 16, 12, 10, 14, 8], initialAttrs: [12, 16, 12, 10, 14, 8], hp: 22, mp: 11, xp: 0, movement: 9, coins: [0, 0, 0], kills: 0, sex: 'Macho', photo: ''
});

const CHARACTER_CONDITION_ART = {
    'Atordoado': 'assets/images/status_atordoado.png',
    'Caído': 'assets/images/status_caido.png',
    'Paralisado': 'assets/images/status_paralisado.png',
    'Cego': 'assets/images/status_cego.png',
    'Amedrontado': 'assets/images/status_amedrontado.png',
    'Imobilizado': 'assets/images/status_imobilizado.png',
    'Exausto': 'assets/images/status_exausto.png',
    'Concentrando': 'assets/images/status_concentrando.png',
    'Envenenado': 'assets/images/status_envenenado.png',
    'Queimando': 'assets/images/status_queimando.png'
};
function ensureRestState(p) {
    p.restState ??= { conditions: [], cooldowns: {}, cooldownUnits: {} };
    if (!Array.isArray(p.restState.conditions)) p.restState.conditions = [];
    return p.restState;
}
function characterConditionNames(p) {
    const list = ensureRestState(p).conditions || [];
    const allowed = typeof CONDITION_KINDS !== 'undefined' ? CONDITION_KINDS : Object.keys(CHARACTER_CONDITION_ART);
    return [...new Set(list.map(v => typeof v === 'string' ? v : v?.kind || v?.condition || v?.name).filter(v => allowed.includes(v)))];
}
function characterHasCondition(p, kind) {
    return characterConditionNames(p).includes(kind);
}
function toggleCharacterCondition(kind) {
    if (!Object.prototype.hasOwnProperty.call(CHARACTER_CONDITION_ART, kind)) return;
    const p = c(), rest = ensureRestState(p), list = Array.isArray(rest.conditions) ? rest.conditions : [];
    if (characterHasCondition(p, kind))
        rest.conditions = list.filter(v => (typeof v === 'string' ? v : v?.kind || v?.condition || v?.name) !== kind);
    else
        rest.conditions = [...list, kind];
    render();
}
function characterConditionTip(kind, active = false) {
    return `${kind} · ${active ? 'Ativa' : 'Inativa'} na ficha. Fora da batalha vale como marcação narrativa; na arena passa a funcionar normalmente.`;
}
function renderCharacterConditions(p) {
    const kinds = typeof CONDITION_KINDS !== 'undefined' ? CONDITION_KINDS : Object.keys(CHARACTER_CONDITION_ART);
    const active = characterConditionNames(p);
    return kinds.map(k => {
        const on = active.includes(k);
        return `<button type="button" class="hero-condition-chip ${on ? 'active' : ''}" data-condition-toggle="${esc(k)}" aria-label="${esc(k + (on ? ' — ativa; clique para remover' : ' — inativa; clique para ativar'))}" aria-pressed="${on}" title="${esc(k)}" data-tip="${esc(characterConditionTip(k, on))}"><img src="${CHARACTER_CONDITION_ART[k]}" alt="" draggable="false"></button>`;
    }).join('');
}

function renderPortraitConditions(p) {
    const host = $('portrait')?.closest('.portrait');
    if (!host)
        return;
    let overlay = host.querySelector('.hero-condition-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'hero-condition-overlay';
        host.append(overlay);
    }
    const active = characterConditionNames(p);
    overlay.innerHTML = active.map(k => `<span class="hero-condition-badge" title="${esc(k)}" role="img" aria-label="${esc(k)}" tabindex="0"><img src="${CHARACTER_CONDITION_ART[k]}" alt="" draggable="false"></span>`).join('');
    overlay.hidden = active.length === 0;
    overlay.setAttribute('aria-label', active.length ? `Condições ativas: ${active.join(', ')}` : 'Sem condições ativas');
}
const validInitialAttrs = p => Array.isArray(p.initialAttrs) && p.initialAttrs.length === 6 && p.initialAttrs.every(Number.isSafeInteger);
function attrFloor(p, i) {
    return validInitialAttrs(p) ? p.initialAttrs[i] : p.attrs[i];
}

function canDecreaseAttr(p, i) {
    return validInitialAttrs(p) && p.attrs[i] > attrFloor(p, i);
}

function initialRacial(p) {
    const r = races[p.race] || races.Outro;
    return names.map((n, i) => {
        const v = p.legacyData?.racialBonuses?.[n];
        return v !== undefined && v !== null && Number.isFinite(Number(v)) ? Number(v) : r[i];
    });
}

function configureInitialAttrs() {
    const p = c();
    if (validInitialAttrs(p) || !state.characters.includes(p))
        return;
    const dlg = $('modal'), racial = initialRacial(p), values = [15, 14, 13, 12, 10, 8];
    const base = p.attrs.map((v, i) => v - racial[i]), exact = new Set(base).size === 6 && base.every(v => values.includes(v));
    dlg.innerHTML = `<form><h2>Confirmar atributos iniciais</h2><p>Ficha de ${esc(p.name)} criada antes desta atualização. Escolha a distribuição original, sem os bônus raciais. Isso será salvo permanentemente.</p><div class="allocation">${names.map((n, i) => `<label>${n}${racial[i] ? ' (' + sign(racial[i]) + ' racial)' : ''}<select name="a${i}" required><option value="">Escolher</option>${values.map(v => `<option ${exact && base[i] === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>`).join('')}</div><small>Os pontos investidos serão preservados. Se algum atributo estiver abaixo do inicial, ele será restaurado e os XP disponíveis serão descontados até o valor restaurado.</small><div style="display:flex;gap:10px;margin-top:12px"><button type="submit">Confirmar valores iniciais</button><button type="button" id="cancelInitialAttrs">Cancelar</button></div></form>`;
    const f = dlg.querySelector('form'), fields = names.map((_, i) => f.elements['a' + i]);
    const update = () => {
        for (const field of fields)
            for (const o of field.options)
                o.disabled = !!o.value && fields.some(other => other !== field && other.value === o.value);
    };
    fields.forEach(x => x.onchange = update);
    update();
    $('cancelInitialAttrs').onclick = () => dlg.close();
    f.onsubmit = e => {
        e.preventDefault();
        if (c() !== p || validInitialAttrs(p))
            return;
        const a = fields.map(x => Number(x.value));
        if (new Set(a).size !== 6 || a.some(v => !values.includes(v)))
            return;
        p.initialAttrs = a.map((v, i) => v + racial[i]);
        let deficit = 0;
        p.attrs = p.attrs.map((v, i) => {
            deficit += Math.max(0, p.initialAttrs[i] - v);
            return Math.max(v, p.initialAttrs[i]);
        });
        p.xp = Math.max(0, p.xp - deficit);
        dlg.close();
        render();
        toast('Atributos iniciais registrados.');
    };
    dlg.showModal();
}

const Store = createBregathyelStore('bregathiel.rebuild.0.1');
let state = { character: fresh(), dark: true, volume: 70 };
let tab = 0;
function adoptLoadedState(loaded) {
    state = loaded || { character: fresh(), dark: true, volume: 70 };
    state.characters = Array.isArray(state.characters) ? state.characters : [state.character || fresh()];
    state.active = Math.max(0, Math.min(state.characters.length - 1, Number(state.active) || 0));
    state.character = state.characters[state.active] || { ...fresh(), name: '', photo: '' };
}
adoptLoadedState(state);
const c = () => state.character;
function persist() {
    try {
        Store.save();
        return true;
    }
    catch (e) {
        toast(Store.blocked ? 'Dados originais protegidos. Abra Backup completo.' : 'Não foi possível salvar. Faça um backup completo.');
        return false;
    }
}

function switchCharacter(i) {
    if (!state.characters[i])
        return;
    state.active = i;
    state.character = state.characters[i];
    render();
    persist();
}

function addCharacter(p) {
    state.characters.push(p);
    switchCharacter(state.characters.length - 1);
}

function renderSwitch() {
    $('switchList').innerHTML = state.characters.map((p, i) => !String(p.name || '').trim() || String(p.name).trim().toLowerCase() === 'novo personagem' ? '' : `<button type="button" data-switch="${i}" class="${i === state.active ? 'active' : ''}">${i === state.active ? '✓ ' : ''}${esc(p.name)}</button>`).join('');
}

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const sign = n => n >= 0 ? '+' + n : String(n);
const esc = s => String(s).replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x]));
// ==============================================================================
// FICHA — arte, render principal e quadro de recursos
// ==============================================================================
const gearArt = ['assets/images/6157dcf2598e2e78f7b17f62.webp', 'assets/images/59fc4657c181340086f66ea0.webp', 'assets/images/6f0844248cc4dbbc1ba6e371.webp', 'assets/images/ef2b86a549e1b7fe44873a2c.webp', 'assets/images/005d5cb3739e71d8cf0902c8.webp', 'assets/images/33172332c6d48823738f9f75.webp', 'assets/images/9d66263c5d63b812532af74d.webp', 'assets/images/a27f0c30fb6ee0143cc2dd8b.webp', 'assets/images/2376d22cb7a0fb5e584d7c52.webp'];
const gear = ['Capa', 'Cabeça', 'Colar', 'Mão principal', 'Corpo', 'Mão auxiliar', 'Anel I', 'Pés', 'Anel II'];
const raceArt = {
    "Humano": "assets/images/f57bc9139545089bf33dc015.webp", "Elfo": "assets/images/0e945ffd23b9ef2355152eb7.webp", "Orc": "assets/images/6a9e4691c7bc7716bfe43df3.webp", "Anão": "assets/images/7d7d276afbb3fd24697610b0.webp", "Draconato": "assets/images/22164d2ff8a5074b1e99848f.webp", "Halfling": "assets/images/e396ac694e18507e053bee02.webp", "Tiefling": "assets/images/c9ac3a9c9265295e4f1ecb8f.webp"
};
const raceArtFemale = {
    'Humano': 'assets/images/race_humano_femea.webp',
    'Elfo': 'assets/images/race_elfo_femea.webp',
    'Orc': 'assets/images/race_orc_femea.webp',
    'Anão': 'assets/images/race_anao_femea.webp',
    'Draconato': 'assets/images/race_draconato_femea.webp',
    'Halfling': 'assets/images/race_halfling_femea.webp',
    'Tiefling': 'assets/images/race_tiefling_femea.webp'
};
function racePortrait(r, sex = 'Macho') {
    if (sex === 'Fêmea' && raceArtFemale[r]) return raceArtFemale[r];
    return raceArt[r] || raceArt.Humano;
}

function toast(t) {
    const dialogs = [...document.querySelectorAll('dialog:modal')], d = document.activeElement?.closest('dialog:modal') || dialogs.at(-1);
    document.querySelectorAll('.dialog-notice').forEach(n => n.remove());
    clearTimeout(toast.timer);
    $('notice').hidden = true;
    if (d) {
        const n = document.createElement('div');
        n.className = 'dialog-notice';
        n.setAttribute('role', 'status');
        n.textContent = t;
        d.prepend(n);
        toast.timer = setTimeout(() => n.remove(), 4000);
    }
    else {
        $('notice').textContent = t;
        $('notice').hidden = false;
        toast.timer = setTimeout(() => $('notice').hidden = true, 3000);
    }
}

function render() {
    renderSwitch();
    normalizeWallet(c());
    let p = c(), ea = effectiveAttrs(p), m = ea.map(Rules.mod);
    ensureRestState(p);
    p.hp = clamp(p.hp, 0, resourceMax('hp', p));
    p.mp = clamp(p.mp, 0, resourceMax('mp', p));
    document.body.classList.toggle('light', !state.dark);
    $('themeSwitch').setAttribute('aria-checked', String(!!state.dark));
    $('volume').value = state.volume;
    $('name').textContent = p.name;
    $('identity').textContent = [p.race, p.class, p.level >= 3 ? p.subclass : ''].filter(Boolean).join(' · ');
    $('portrait').src = p.photo || racePortrait(p.race, p.sex);
    renderPortraitConditions(p);
    $('levelText').textContent = 'Nível ' + p.level;
    renderLevelAura(p.level);
    $('kills').textContent = p.kills;
    renderResources();
    $('stats').innerHTML = heroStats(p);
    $('heroConditions').innerHTML = renderCharacterConditions(p);
    $('coins').innerHTML = ['Ouro', 'Prata', 'Bronze'].map((n, i) => `<div data-coin="${i}" role="button" tabindex="0" aria-label="Gerenciar ${n}"><img src="${['assets/images/beaceba8a79b8bd64ebc71c3.webp', 'assets/images/5a5405fd7fd92c6bf69f9c36.webp', 'assets/images/988dba89541f904a9c08271c.webp'][i]}"><small style="display:block">${n}</small><strong>${p.coins[i]}</strong></div>`).join('');
    $('attributes').innerHTML = (`<div><h2>Pontos de atributos</h2><small>Disponíveis: ${p.xp}</small>${!validInitialAttrs(p) && state.characters.includes(p) ? '<br><button data-act="initial-attrs" style="font-size:12px;margin-top:5px">Confirmar atributos iniciais</button>' : ''}</div>` + names.map((n, i) => `<div class="attribute"><button type="button" class="attribute-test" data-attribute-test="${i}" aria-label="Testar ${esc(n)}">${n} <span class="attribute-mod ${m[i] < 0 ? 'negative-mod' : ''}">${m[i] < 0 ? '−' + Math.abs(m[i]) : sign(m[i])}</span></button><div><button data-attr="${i}" data-delta="-1" ${canDecreaseAttr(p, i) ? '' : 'disabled'} data-tip="${validInitialAttrs(p) ? 'Mínimo inicial: ' + attrFloor(p, i) : 'Confirme os atributos iniciais'}">−</button><strong data-tip="${ea[i] !== p.attrs[i] ? `Base: ${p.attrs[i]} · Equipamentos: ${sign(ea[i] - p.attrs[i])}` : `Base: ${p.attrs[i]}`}${validInitialAttrs(p) ? ` · Inicial: ${p.initialAttrs[i]}` : ''}">${ea[i]}</strong><button data-attr="${i}" data-delta="1" ${p.xp < 1 ? 'disabled' : ''}>+</button></div></div>`).join(''));
    renderTab();
    persist();
}

// ==============================================================================
// CLASSES — subclasses, afinidades e capacidade de preparo
// ==============================================================================
const subclassesByClass = {
    "Guerreiro": ["Campeão", "Mestre de Batalha", "Cavaleiro Arcano", "Cavaleiro", "Samurai", "Arqueiro Arcano", "Guerreiro Rúnico", "Guerreiro Psiônico"],
    "Mago": [
        "Escola de Abjuração", "Escola de Adivinhação", "Escola de Conjuração", "Escola de Encantamento", "Escola de Evocação", "Escola de Ilusão", "Escola de Necromancia", "Escola de Transmutação", "Magia de Guerra", "Ordem dos Escribas", "Cronurgia", "Graviturgy"
    ],
    "Ladino": ["Ladrão", "Assassino", "Trapaceiro Arcano", "Inquisitivo", "Batedor", "Espadachim", "Mentor", "Fantasma", "Lâmina da Alma"],
    "Clérigo": [
        "Domínio da Vida", "Domínio da Luz", "Domínio da Guerra", "Domínio do Conhecimento", "Domínio da Natureza", "Domínio da Tempestade", "Domínio da Enganação", "Domínio da Morte", "Domínio da Forja", "Domínio da Ordem", "Domínio da Paz", "Domínio do Crepúsculo"
    ],
    "Arqueiro": ["Atirador de Elite", "Arqueiro Arcano", "Caçador", "Batedor", "Mestre das Feras", "Andarilho do Horizonte", "Perseguidor das Sombras"],
    "Paladino": [
        "Juramento da Devoção", "Juramento dos Anciões", "Juramento da Vingança", "Juramento da Coroa", "Juramento da Conquista", "Juramento da Redenção", "Juramento da Glória", "Juramento dos Vigilantes", "Quebrador de Juramento"
    ],
    "Bárbaro": [
        "Caminho do Berserker", "Caminho do Guerreiro Totêmico", "Caminho do Guardião Ancestral", "Caminho do Arauto da Tempestade", "Caminho do Zelote", "Caminho da Besta", "Caminho da Magia Selvagem", "Caminho da Árvore do Mundo"
    ],
    "Bardo": [
        "Colégio do Conhecimento", "Colégio do Valor", "Colégio do Glamour", "Colégio das Espadas", "Colégio dos Sussurros", "Colégio da Eloquência", "Colégio da Criação", "Colégio da Dança"
    ],
    "Druida": [
        "Círculo da Terra", "Círculo da Lua", "Círculo dos Sonhos", "Círculo do Pastor", "Círculo dos Esporos", "Círculo das Estrelas", "Círculo do Fogo Selvagem", "Círculo do Mar"
    ],
    "Monge": [
        "Caminho da Mão Aberta", "Caminho da Sombra", "Caminho dos Quatro Elementos", "Caminho da Morte Longa", "Caminho da Alma Solar", "Caminho do Mestre Bêbado", "Caminho do Kensei", "Caminho da Misericórdia", "Caminho do Eu Astral", "Caminho do Dragão Ascendente"
    ],
    "Patrulheiro": [
        "Caçador", "Mestre das Feras", "Perseguidor das Sombras", "Andarilho do Horizonte", "Matador de Monstros", "Andarilho Feérico", "Guardião do Enxame", "Guardião Dracônico"
    ],
    "Feiticeiro": ["Linhagem Dracônica", "Magia Selvagem", "Alma Divina", "Magia das Sombras", "Mente Aberrante", "Alma Mecânica", "Feitiçaria Lunar", "Feitiçaria da Tempestade"],
    "Bruxo": [
        "Patrono Arquifada", "Patrono Corruptor", "Patrono Grande Antigo", "Patrono Celestial", "Patrono Lâmina Maldita", "Patrono Gênio", "Patrono Morto-Vivo", "Patrono Imortal"
    ]
};
const classAffinity = { Guerreiro: 0, 'Bárbaro': 0, Ladino: 0, Arqueiro: 0, Monge: 0, Paladino: 1, Patrulheiro: 1, Mago: 2, Feiticeiro: 2, Bruxo: 2, 'Clérigo': 2, Druida: 2, Bardo: 2 };
const arcaneBonus = new Set([
    'Cavaleiro Arcano', 'Arqueiro Arcano', 'Trapaceiro Arcano', 'Guerreiro Rúnico', 'Caminho dos Quatro Elementos', 'Caminho da Alma Solar', 'Caminho do Dragão Ascendente', 'Caminho da Magia Selvagem'
]);
const martialBonus = new Set(['Magia de Guerra', 'Domínio da Guerra', 'Domínio da Forja', 'Colégio do Valor', 'Colégio das Espadas', 'Colégio da Dança', 'Círculo da Lua', 'Patrono Lâmina Maldita']);
function preparedCapacity(kind, p) {
    const affinity = classAffinity[p.class] ?? 0;
    return Math.min(5, (kind === 'weapon' ? 3 - affinity : 1 + affinity) + (p.level >= 11 ? 2 : p.level >= 6 ? 1 : 0) + (p.level >= 15 && (kind === 'weapon' ? martialBonus : arcaneBonus).has(p.subclass) ? 1 : 0));
}

function preparedList(kind) {
    if (kind === 'weapon')
        return preparedWeaponList(c());
    const limit = preparedCapacity(kind, c());
    return `<div class="prepared-list">${Array.from({ length: 5 }, (_, i) => `<div class="prepared-row ${i >= limit ? 'locked' : ''}"><img src="${(kind === 'weapon' ? gearArt[3] : "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20100%20100%22%3E%3Cpath%20d%3D%22M12%2018L48%2026%2048%2085%2012%2076ZM52%2026L88%2018%2088%2076%2052%2085Z%22%20fill%3D%22%2366543b%22%20stroke%3D%22%23b29a70%22%20stroke-width%3D%223%22/%3E%3Cpath%20d%3D%22M20%2032L40%2038M20%2045L40%2051M60%2038L80%2032M60%2051L80%2045%22%20stroke%3D%22%23b29a70%22%20stroke-width%3D%223%22/%3E%3C/svg%3E")}" alt=""><div>${i >= limit ? 'Bloqueado' : kind === 'weapon' ? 'Espaço de arma ' + (i + 1) : 'Espaço de magia ' + (i + 1)}<small>${i >= limit ? 'Indisponível' : 'Vazio'}</small></div></div>`).join('')}</div><small>0 / ${limit} preparados</small>`;
}

// ==============================================================================
// NÍVEL E RECURSOS — sons, aura, raios, barras de PV/PM/XP
// ==============================================================================
const resourceSounds = {
    "damage": [
        "assets/audio/056be25c81c54deb9e078742.webm", "assets/audio/74e13d44b95c912051aeb3b5.webm", "assets/audio/13c0ce42bbeed1df8aa090eb.webm", "assets/audio/7bdc499179759d59e0e69e1b.webm", "assets/audio/41a62cbe528e70cd232ac393.webm", "assets/audio/3a18c6324db541e0fe146db3.webm", "assets/audio/6d9cdd30b01ad1f02063ea7a.webm", "assets/audio/e11f29d8e8137304e06b7936.webm", "assets/audio/e1264ca11dcc8854a15f1711.webm", "assets/audio/d8a16009f206f09ff067cb0d.webm"
    ], "heal": ["assets/audio/c347b10559ffae33fe062c35.webm"], "mana": ["assets/audio/3b586ecb9d3df42485deae2c.webm"], "cleanse": ["assets/audio/pocao_verde_v0939.mp3"]
};
let lastDamage = -1;
resourceSounds.level = ["assets/audio/9967f12249bc2335a075a1b9.webm"];
let lastLevelClick = -Infinity;
function playLevelUp() {
    const now = performance.now();
    if (now - lastLevelClick > 650)
        playResourceSound('level');
    lastLevelClick = now;
}

function playResourceSound(kind) {
    if (!state.volume)
        return;
    const pool = resourceSounds[kind];
    if (!pool)
        return;
    let i = 0;
    if (kind === 'damage') {
        i = (lastDamage + 1 + Math.floor(Math.random() * Math.max(1, pool.length - 1))) % pool.length;
        lastDamage = i;
    }
    try {
        const audio = new Audio(pool[i]);
        audio.volume = clamp(state.volume / 100, 0, 1);
        audio.play().catch(() => {
        });
    }
    catch {
    }
}

const levelColors = ['', '210,233,255', '73,217,239', '55,139,255', '151,97,245', '232,75,206', '255,65,65', '255,139,43', '255,212,71'];
let boltTimer = 0, boltStage = 0;
const reducedBolts = matchMedia('(prefers-reduced-motion: reduce)');
const boltNS = 'http://www.w3.org/2000/svg';
const boltRand = (a, b) => a + Math.random() * (b - a);
const boltClamp = (v, max) => Math.max(1, Math.min(max - 1, v));
const boltCleanup = new Set();
function stopBolts() {
    clearTimeout(boltTimer);
    boltTimer = 0;
    for (const t of boltCleanup)
        clearTimeout(t);
    boltCleanup.clear();
    const svg = $('level').querySelector('.level-bolts');
    if (svg)
        svg.replaceChildren();
}

function boltPoints(a, b, w, h) {
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy) || 1, n = Math.max(3, Math.round(length / 6));
    const pts = [a];
    for (let i = 1; i < n; i++) {
        const t = i / n, j = boltRand(-5, 5) * Math.sin(Math.PI * t) * .85;
        pts.push([boltClamp(a[0] + dx * t - dy / length * j, w), boltClamp(a[1] + dy * t + dx / length * j, h)]);
    }
    pts.push(b);
    return pts;
}

function boltPath(group, points, branch = false) {
    const d = points.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    for (const cls of ['bolt-edge', 'bolt-core']) {
        const p = document.createElementNS(boltNS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('pathLength', '1');
        p.setAttribute('class', cls + (branch ? ' bolt-branch' : ''));
        group.append(p);
    }
}

function spawnBolt(svg, w, h) {
    const x = boltRand(8, w - 8), y = boltRand(4, h - 4), direction = boltRand(0, Math.PI * 2), len = boltRand(15, Math.min(66, Math.max(25, h * 1.4)));
    let a = [x, y], b = [boltClamp(x + Math.cos(direction) * len, w), boltClamp(y + Math.sin(direction) * len, h)];
    if (Math.random() < .38) {
        a = [x, boltRand(1, 5)];
        b = [boltClamp(x + boltRand(-28, 28), w), boltRand(h * .54, h - 1)];
        if (Math.random() < .25)
            [a, b] = [b, a];
    }
    const pts = boltPoints(a, b, w, h), g = document.createElementNS(boltNS, 'g');
    g.setAttribute('class', 'bolt-strike');
    g.style.setProperty('--strike-delay', Math.round(boltRand(0, 85)) + 'ms');
    boltPath(g, pts);
    if (Math.random() < .56 && pts.length > 3) {
        const count = Math.random() < .27 ? 2 : 1;
        for (let i = 0; i < count; i++) {
            const root = pts[Math.floor(boltRand(1, pts.length - 1))], ang = direction + (Math.random() < .5 ? -1 : 1) * boltRand(.6, 1.55), l = boltRand(9, 24);
            boltPath(g, boltPoints(root, [boltClamp(root[0] + Math.cos(ang) * l, w), boltClamp(root[1] + Math.sin(ang) * l, h)], w, h), true);
        }
    }
    svg.append(g);
    const t = setTimeout(() => {
        g.remove();
        boltCleanup.delete(t);
    }, 480);
    boltCleanup.add(t);
}

function scheduleBolts(delay) {
    boltTimer = setTimeout(() => {
        boltTimer = 0;
        const el = $('level'), svg = el.querySelector('.level-bolts');
        if (!svg || !el.classList.contains('lightning') || document.hidden || reducedBolts.matches) {
            stopBolts();
            return;
        }
        const w = el.clientWidth + 10, h = el.clientHeight + 10;
        if (w > 18 && h > 12) {
            svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
            const r = Math.random(), n = r < .52 ? 1 : r < .87 ? 2 : 3;
            for (let i = 0; i < n; i++)
                spawnBolt(svg, w, h);
        }
        scheduleBolts(boltStage === 8 ? boltRand(520, 1050) : boltRand(700, 1450));
    }, delay);
}

function renderLevelAura(level) {
    const el = $('level'), stage = Math.min(8, Math.floor((Math.max(1, level) - 1) / 5)), progress = stage ? Math.min(1, ((level - 1) % 5) / 4) : 0;
    el.dataset.stage = stage;
    el.classList.toggle('evolved', stage > 0);
    el.classList.toggle('lightning', stage >= 7);
    el.style.setProperty('--aura-rgb', levelColors[stage] || '180,140,75');
    el.style.setProperty('--aura-power', stage ? Math.min(1, .38 + stage * .072 + progress * .095) : 0);
    el.style.setProperty('--aura-speed', Math.max(.8, 1.8 - stage * .08) + 's');
    if (!el.querySelector('.level-bolts'))
        el.insertAdjacentHTML('beforeend', '<svg class="level-bolts" aria-hidden="true"></svg>');
    boltStage = stage;
    if (stage >= 7 && !reducedBolts.matches && !document.hidden) {
        if (!boltTimer)
            scheduleBolts(110);
    }
    else
        stopBolts();
}
document.addEventListener('visibilitychange', () => renderLevelAura(c().level));
reducedBolts.addEventListener('change', () => renderLevelAura(c().level));
function chooseSubclass(reselect = false) {
    const p = c(), options = subclassesByClass[p.class] || [], dlg = $('modal');
    if ((p.subclass && !reselect) || p.level < 3 || !options.length || dlg.open)
        return;
    dlg.classList.add('scroll-open');
    dlg.innerHTML = `<form><h2>Escolher subclasse</h2><p>${esc(p.name)} · ${esc(p.class)}</p><label>Subclasse<select name="subclass" required><option value="">Selecione uma subclasse</option>${options.map(n => `<option value="${esc(n)}" ${n === p.subclass ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label><div class="dialog-actions"><button type="submit">Confirmar</button><button type="button" id="cancelSubclass">Cancelar</button></div></form>`;
    dlg.querySelector('#cancelSubclass').onclick = () => dlg.close();
    dlg.querySelector('form').onsubmit = e => {
        e.preventDefault();
        const value = e.currentTarget.elements.subclass.value;
        if (!options.includes(value) || p !== c() || p.level < 3)
            return;
        p.subclass = value;
        dlg.close();
        render();
    };
    dlg.showModal();
    playScroll();
}

function resourceMax(k, p = c()) {
    if (k === 'xp')
        return 20;
    const combatant = arenaState()?.participants.find(x => x.kind === 'player' && x.playerId === p.marketId);
    if (combatant) {
        const d = arenaData(combatant);
        return k === 'hp' ? d.maxHP : d.maxMP;
    }
    return k === 'hp' ? Rules.maxHP(p) : Rules.maxMP(p);
}

function renderResources() {
    const p = c();
    $('bars').innerHTML = [['PV', 'hp', 'hp'], ['PM', 'mp', 'mana'], ['XP', 'xp', 'xp']].map(([name, k, kind]) => `<div class="bar ${kind}"><span>${name}</span><div class="track resource-track" tabindex="0" role="slider" aria-label="${name}" data-resource="${k}" aria-valuemin="0"><div class="fill"></div><span class="resource-value"></span></div></div>`).join('');
    for (const el of $('bars').querySelectorAll('.resource-track'))
        updateTrack(el, p);
}

function updateTrack(el, p = c()) {
    const k = el.dataset.resource, max = resourceMax(k, p), v = Math.max(0, Number(p[k]) || 0);
    el.querySelector('.fill').style.width = clamp(v / Math.max(1, max) * 100, 0, 100) + '%';
    el.querySelector('.resource-value').textContent = k === 'xp' ? String(v) : `${v} / ${max}`;
    el.setAttribute('aria-valuemax', String(k === 'xp' ? Math.max(max, v) : max));
    el.setAttribute('aria-valuenow', String(v));
    el.closest('.bar').classList.toggle('low', k === 'hp' && v / Math.max(1, max) < .3);
}

let drag = null;
function dragUpdate(e) {
    if (!drag || drag.id !== e.pointerId)
        return;
    const { el, p, k, start, startX, max, rect } = drag;
    const frac = clamp((e.clientX - rect.left) / Math.max(1, rect.width), 0, 1);
    const before = p[k];
    let value;
    if (k === 'xp' && start > 20) {
        value = Math.max(0, start + Math.round((e.clientX - startX) / Math.max(1, rect.width) * 20));
        if (e.clientX >= rect.right && e.clientX > startX)
            drag.extra = true;
    }
    else
        value = Math.round(frac * max);
    if (k === 'xp' && start === 20 && frac >= 1)
        drag.extra = true;
    if (k === 'xp')
        value = Math.min(Number.MAX_SAFE_INTEGER, value);
    p[k] = value;
    if (value !== before && !drag.sound) {
        const kind = k === 'hp' ? (value < before ? 'damage' : 'heal') : k === 'mp' && value > before ? 'mana' : null;
        if (kind) {
            playResourceSound(kind);
            drag.sound = true;
        }
    }
    updateTrack(el, p);
}

async function offerExtraXP(p) {
    if (p !== c() || p.xp < 20)
        return;
    const yes = await openSiteDialog({ title: 'Mais de 20 XP?', message: 'Deseja adicionar mais pontos de experiência?', confirm: true });
    if (yes !== true || p !== c())
        return;
    const amount = await openSiteDialog({ title: 'Adicionar XP', message: 'Quantos pontos adicionais?', value: 1 });
    if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0 && p === c()) {
        p.xp = Math.min(Number.MAX_SAFE_INTEGER, p.xp + Math.floor(amount));
        render();
    }
}
$('bars').addEventListener('pointerdown', e => {
    const el = e.target.closest('.resource-track');
    if (!el || drag || e.button !== 0)
        return;
    if (!state.characters[state.active])
        return;
    e.preventDefault();
    const k = el.dataset.resource, p = c();
    drag = { el, p, k, id: e.pointerId, max: resourceMax(k, p), rect: el.getBoundingClientRect(), start: p[k], startX: e.clientX, sound: false, extra: false };
    el.setPointerCapture(e.pointerId);
    el.focus({ preventScroll: true });
    dragUpdate(e);
});
$('bars').addEventListener('pointermove', dragUpdate);
function endDrag(e) {
    if (!drag || drag.id !== e.pointerId)
        return;
    const d = drag;
    if (e.type === 'pointerup')
        dragUpdate(e);
    drag = null;
    const offer = e.type === 'pointerup' && d.k === 'xp' && d.p.xp >= 20 && ((d.start < 20 && d.p.xp === 20) || d.extra);
    render();
    if (offer)
        offerExtraXP(d.p);
}
$('bars').addEventListener('pointerup', endDrag);
$('bars').addEventListener('pointercancel', endDrag);
$('bars').addEventListener('lostpointercapture', endDrag);
$('bars').addEventListener('keydown', e => {
    const el = e.target.closest('.resource-track');
    if (!el || !state.characters[state.active])
        return;
    const k = el.dataset.resource, p = c(), max = resourceMax(k, p), before = p[k];
    if (!['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight', 'Home', 'End'].includes(e.key))
        return;
    e.preventDefault();
    const up = e.key === 'ArrowUp' || e.key === 'ArrowRight';
    if (k === 'xp' && before >= 20 && (up || e.key === 'End')) {
        offerExtraXP(p);
        return;
    }
    const n = e.key === 'Home' ? 0 : e.key === 'End' ? max : before + (up ? 1 : -1);
    p[k] = clamp(n, 0, k === 'xp' ? Math.max(20, before) : max);
    if (p[k] !== before) {
        if (k === 'hp')
            playResourceSound(p[k] < before ? 'damage' : 'heal');
        else if (k === 'mp' && p[k] > before)
            playResourceSound('mana');
    }
    render();
    $('bars').querySelector(`[data-resource="${k}"]`).focus({ preventScroll: true });
    if (k === 'xp' && before < 20 && p.xp === 20)
        offerExtraXP(p);
});
// ==============================================================================
// DIÁLOGOS DO SITE, FICHAS (cadastro/importação) E AÇÕES DE MENU
// ==============================================================================
const siteDialog = $('siteDialog');
let dialogResolve = null;
function openSiteDialog({ title, message = '', value, confirm = false, danger = false }) {
    if (siteDialog.open)
        siteDialog.close('cancel');
    const number = typeof value === 'number';
    $('siteDialogTitle').textContent = title;
    $('siteDialogMessage').textContent = message;
    $('siteDialogMessage').hidden = !message;
    const field = $('siteDialogValue');
    field.hidden = !number;
    field.disabled = !number;
    field.required = number;
    field.value = number ? String(value) : '';
    $('siteDialogCancel').hidden = !(number || confirm);
    $('siteDialogOK').classList.toggle('danger', danger);
    siteDialog.returnValue = 'cancel';
    return new Promise(resolve => {
        dialogResolve = resolve;
        siteDialog.showModal();
        if (number) {
            field.focus();
            field.select();
        }
        else if (confirm) {
            $('siteDialogCancel').focus();
        }
        else {
            $('siteDialogOK').focus();
        }
    });
}
$('siteDialogCancel').onclick = () => siteDialog.close('cancel');
siteDialog.addEventListener('cancel', () => {
    siteDialog.returnValue = 'cancel';
});
siteDialog.addEventListener('close', () => {
    const finish = dialogResolve;
    dialogResolve = null;
    if (finish)
        finish(siteDialog.returnValue === 'ok' ? ($('siteDialogValue').disabled ? true : Number($('siteDialogValue').value)) : null);
});
async function deleteCharacter() {
    if (!state.characters[state.active]) {
        toast('Nenhuma ficha cadastrada.');
        return;
    }
    const target = c();
    if (arenaState()?.participants.some(x => x.playerId === target.marketId))
        return toast('Encerre a batalha antes de excluir este personagem.');
    if (market().listings.some(x => x.owner === marketKey(target)))
        return toast('Cancele os anúncios antes de excluir a ficha.');
    const result = await openSiteDialog({ title: 'Tem certeza?', message: 'Excluir a ficha de ' + target.name + '?', confirm: true, danger: true });
    if (result !== true)
        return;
    const index = state.characters.indexOf(target);
    if (index < 0)
        return;
    state.characters.splice(index, 1);
    if (!state.characters.length) {
        state.active = 0;
        state.character = { ...fresh(), name: '', photo: '' };
        render();
        persist();
    }
    else
        switchCharacter(Math.max(0, index - 1));
}

const scrollSound = 'assets/audio/eec53f0665eb8f952f31d0d5.mp3';
function playScroll() {
    try {
        let a = new Audio(scrollSound);
        a.volume = state.volume / 100;
        a.play().catch(() => {
        });
    }
    catch {
    }
}

function characterForm(isNew = true) {
    const p = fresh(), dlg = $('modal');
    const rr = Object.hasOwn(races, p.race) ? p.race : 'Outro', cc = classes.includes(p.class) ? p.class : 'Outro';
    dlg.classList.add('scroll-open');
    dlg.innerHTML = `<form><h2>Novo personagem</h2><label>Nome<input name="name" required value="${esc(isNew ? '' : p.name)}"></label><label>Raça<select name="race">${Object.keys(races).map(x => `<option ${rr === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>Sexo<select name="sex"><option value="Macho">Macho</option><option value="Fêmea">Fêmea</option></select></label><label class="custom-field" id="raceCustom">Outra raça<input name="raceOther" value="${esc(rr === 'Outro' ? p.race : '')}"></label><small id="racial"></small><label>Classe<select name="class">${classes.map(x => `<option ${cc === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label class="custom-field" id="classCustom">Outra classe<input name="classOther" value="${esc(cc === 'Outro' ? p.class : '')}"></label>${isNew ? '<h3>Atributos</h3><div class="allocation">' + names.map((n, i) => `<label>${n}<select name="a${i}" required><option value="">Escolher</option>${[15, 14, 13, 12, 10, 8].map(v => `<option>${v}</option>`).join('')}</select></label>`).join('') + '</div>' : ''}<div style="display:flex;gap:10px"><button type="submit">Confirmar</button><button type="button" id="cancel">Cancelar</button></div></form>`;
    let f = dlg.querySelector('form');
    function custom() {
        for (const k of ['race', 'class']) {
            let active = f.elements[k].value === 'Outro';
            $(k + 'Custom').hidden = !active;
            f.elements[k + 'Other'].required = active;
            f.elements[k + 'Other'].disabled = !active;
        }
        $('racial').textContent = isNew ? races[f.elements.race.value].map((v, i) => v ? names[i] + ' ' + sign(v) : '').filter(Boolean).join(' · ') || 'Sem bônus racial' : '';
    }
    function allocation() {
        let fields = names.map((_, i) => f.elements['a' + i]);
        for (const field of fields)
            for (const o of field.options)
                o.disabled = !!o.value && fields.some(other => other !== field && other.value === o.value);
    }
    f.elements.race.onchange = custom;
    f.elements.class.onchange = custom;
    custom();
    if (isNew) {
        for (let i = 0; i < 6; i++)
            f.elements['a' + i].onchange = allocation;
        allocation();
    }
    $('cancel').onclick = () => dlg.close();
    f.onsubmit = e => {
        e.preventDefault();
        let d = new FormData(f), race = d.get('race') === 'Outro' ? d.get('raceOther').trim() : d.get('race'), cls = d.get('class') === 'Outro' ? d.get('classOther').trim() : d.get('class'), name = d.get('name').trim();
        if (!name || !race || !cls)
            return;
        if (isNew) {
            let a = names.map((_, i) => Number(d.get('a' + i)));
            if (new Set(a).size !== 6 || a.some(v => ![15, 14, 13, 12, 10, 8].includes(v)))
                return;
            let p = { ...fresh(), name, race, sex: d.get('sex') === 'Fêmea' ? 'Fêmea' : 'Macho', class: cls, attrs: a.map((v, i) => v + races[d.get('race')][i]), photo: '' };
            p.initialAttrs = [...p.attrs];
            p.hp = Rules.maxHP(p);
            p.mp = Rules.maxMP(p);
            addCharacter(p);
        }
        dlg.close();
    };
    dlg.showModal();
    if (isNew)
        playScroll();
}

async function save() {
    try {
        await Store.flush();
        toast('Ficha salva com sucesso!');
    }
    catch {
        toast('Não foi possível salvar. Exporte a ficha.');
    }
}

function exportFile() {
    const name = c().name.replace(/[^\p{L}\p{N}_-]/gu, '_') + '.json';
    downloadJSON({ schema: 'bregathiel-rebuild-1', character: c() }, name);
}

function action(a) {
    switch (a) {
        case 'new':
            characterForm(true);
            break;
        case 'initial-attrs':
            configureInitialAttrs();
            break;
        case 'import':
            $('file').click();
            break;
        case 'export':
            exportFile();
            break;
        case 'save':
            save();
            break;
        case 'delete':
            deleteCharacter();
            break;
        case 'photo':
            $('photo').click();
            break;
        case 'level+': {
            const before = c().level;
            c().level++;
            playLevelUp();
            render();
            if (before < 3 && c().level >= 3)
                chooseSubclass(true);
            else if (c().level >= 3 && !c().subclass)
                chooseSubclass();
            break;
        }
        case 'level-':
            c().level = Math.max(1, c().level - 1);
            render();
            break;
        case 'theme':
            state.dark = !state.dark;
            render();
            break;
        case 'bestiary':
            libraryOpen('bestiary');
            break;
        case 'libraries':
            libraryOpen('bestiary');
            break;
        case 'arena':
            arenaOpen();
            break;
        case 'rest':
            restOpen();
            break;
        case 'journal':
            journalOpen();
            break;
        case 'backup':
            backupOpen();
            break;
        case 'incidents':
            guardIncidents();
            break;
        case 'tutorial':
            tutorialOpen();
            break;
        case 'history':
            historyOpen();
            break;
    }
}
$('switchButton').onclick = () => $('switchButton').parentElement.classList.toggle('expanded');
$('switchList').onclick = e => {
    let b = e.target.closest('[data-switch]');
    if (b) {
        switchCharacter(Number(b.dataset.switch));
        $('switchButton').parentElement.classList.remove('expanded');
        b.blur();
    }
};
document.addEventListener('click', e => {
    let b = e.target.closest('[data-act],[data-tab],[data-attr],[data-condition-toggle]');
    if (!b)
        return;
    let d = b.dataset;
    if (d.conditionToggle)
        toggleCharacterCondition(d.conditionToggle);
    else if (d.act) {
        // Saídas da área do comerciante para painéis do mestre também se despedem.
        if (tab === 3 && typeof marketLeaveMerchant === 'function' &&
            ['arena', 'bestiary', 'journal', 'rest'].includes(d.act)) marketLeaveMerchant();
        action(d.act);
    }
    else if (d.tab !== undefined) {
        if (tab === 3 && Number(d.tab) !== 3 && typeof marketLeaveMerchant === 'function') marketLeaveMerchant();
        tab = Number(d.tab);
        renderTab();
    }
    else if (d.attr !== undefined) {
        let i = Number(d.attr), delta = Number(d.delta);
        if (Number.isInteger(i) && i >= 0 && i < 6 && (delta === 1 && c().xp > 0 || delta === -1 && canDecreaseAttr(c(), i))) {
            c().attrs[i] += delta;
            c().xp -= delta;
            c().hp = Math.min(c().hp, resourceMax('hp', c()));
            c().mp = Math.min(c().mp, resourceMax('mp', c()));
            render();
        }
    }
});
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
    }
});
const settingsMenu = $('settingsMenu'), settingsTrigger = $('settingsTrigger');
function setSettingsOpen(open) {
    settingsMenu.classList.toggle('open', open);
    settingsTrigger.setAttribute('aria-expanded', String(open));
}

let lastSettingsPointer = '';
settingsTrigger.addEventListener('pointerdown', e => lastSettingsPointer = e.pointerType);
settingsMenu.addEventListener('pointerenter', e => {
    if (e.pointerType === 'mouse')
        setSettingsOpen(true);
});
settingsMenu.addEventListener('pointerleave', e => {
    if (e.pointerType === 'mouse')
        setSettingsOpen(false);
});
settingsTrigger.addEventListener('click', e => {
    if (e.detail === 0 || lastSettingsPointer !== 'mouse')
        setSettingsOpen(!settingsMenu.classList.contains('open'));
    else
        setSettingsOpen(true);
});
document.addEventListener('pointerdown', e => {
    if (!settingsMenu.contains(e.target))
        setSettingsOpen(false);
});
document.addEventListener('pointerup', e => {
    if (e.pointerType !== 'mouse' || !settingsMenu.classList.contains('open'))
        return;
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    if (!settingsMenu.contains(hit))
        setSettingsOpen(false);
});
settingsMenu.addEventListener('focusout', e => {
    if (!settingsMenu.contains(e.relatedTarget))
        setSettingsOpen(false);
});
settingsMenu.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        setSettingsOpen(false);
        settingsTrigger.focus();
    }
});
$('volume').oninput = e => {
    state.volume = Number(e.target.value);
    if (diceMasterGain)
        diceMasterGain.gain.value = clamp(state.volume / 100, 0, 1);
    persist();
};
$('photo').onchange = async (e) => {
    let f = e.target.files[0];
    if (!f)
        return;
    const target = c();
    let r = new FileReader();
    r.onload = async () => {
        try {
            const img = await compactPortrait(r.result);
            if (state.characters.includes(target)) {
                target.photo = img;
                render();
            }
        }
        catch {
            toast('Não foi possível abrir o retrato.');
        }
    };
    r.readAsDataURL(f);
    e.target.value = '';
};
function importCharacter(d) {
    if (d.schema === 'bregathiel-rebuild-1') {
        const p = d.character;
        if (!p || !Array.isArray(p.attrs) || p.attrs.length !== 6 || !p.attrs.every(Number.isFinite) || typeof p.name !== 'string')
            throw Error('Formato inválido');
        return { ...fresh(), ...p, initialAttrs: validInitialAttrs(p) ? [...p.initialAttrs] : null };
    }
    if (!d || typeof d.name !== 'string' || !d.stats || typeof d.stats !== 'object' || !names.every(n => d.stats[n] !== null && d.stats[n] !== undefined && Number.isFinite(Number(d.stats[n]))))
        throw Error('Formato inválido');
    const num = (v, f = 0) => v === null || v === '' || v === undefined || !Number.isFinite(Number(v)) ? f : Number(v);
    const attrs = names.map((n, i) => num(d.stats[n]) + num(d.racialBonuses?.[n], (races[d.race] || races.Outro)[i]));
    const p = {
        ...fresh(), name: d.name, race: String(d.race || 'Outro'), sex: d.sex === 'Fêmea' || d.sex === 'Feminino' ? 'Fêmea' : 'Macho', class: String(d.className || 'Outro'), subclass: String(d.subclass || ''), level: Math.max(1, Math.floor(num(d.level, 1))), attrs, initialAttrs: null, xp: Math.max(0, num(d.experience)), movement: Math.max(0, num(parseFloat(d.speed), 9)), coins: ['gold', 'silver', 'bronze'].map(k => Math.max(0, num(d.coins?.[k]))), kills: Math.max(0, num(d.monsterKills ?? d.enemyKills)), photo: typeof d.portrait === 'string' && d.portrait.startsWith('data:image/') ? d.portrait : '', player: String(d.player || ''), alignment: String(d.alignment || ''), legacyData: d
    };
    p.hp = clamp(num(d.hpCurrent, Rules.maxHP(p)), 0, Rules.maxHP(p));
    p.mp = clamp(num(d.manaCurrent, Rules.maxMP(p)), 0, Rules.maxMP(p));
    return p;
}
$('file').onchange = async (e) => {
    try {
        let f = e.target.files[0];
        if (!f)
            return;
        let d = JSON.parse(await f.text());
        addCharacter(importCharacter(d));
        toast(d.schema === 'bregathiel-rebuild-1' ? 'Ficha importada' : 'Ficha antiga importada; equipamentos e magias preservados para migração futura.');
    }
    catch {
        openSiteDialog({ title: 'Importação inválida', message: 'Arquivo inválido ou formato de ficha não reconhecido.' });
    }
    finally {
        e.target.value = '';
    }
};
// CA sem armadura: armaduras e bônus de equipamento serão conectados na etapa de equipamentos.
// ==============================================================================
// DEFESA
// ==============================================================================
// Progressão defensiva dos jogadores: +1 a cada 4 níveis, até +5 no nível 20.
// Calculada em tempo real, sem gravar na ficha ou duplicar após importação.
function playerLevelCABonus(p) {
    return Math.min(5, Math.floor(Math.max(1, Math.min(20, Math.trunc(Number(p?.level) || 1))) / 4));
}
function defenseCA(p) {
    const a = effectiveAttrs(p), armor = equipment(p)[4], idx = { Mago: 3, Feiticeiro: 3, Bruxo: 3, Monge: 4, Druida: 4, 'Clérigo': 4, 'Bárbaro': 2, Bardo: 5 }[p.class];
    let base = 10 + (idx === undefined ? 0 : Rules.mod(a[idx]));
    if (armor && armor.armorType !== 'Vestimenta') {
        base = compatible(p, armor) ? 10 + Rules.mod(a[({ Leve: 1, 'Média': 2, Pesada: 0 })[armor.armorType]]) : 10;
    }
    return Math.max(0, base + playerLevelCABonus(p) + equipmentBonus(p, 'CA') + activeEquipment(p).reduce((n, x) => n + (['Armaduras', 'Escudos'].includes(x.category) ? number(x.ca) : 0), 0));
}


