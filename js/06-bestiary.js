// ==============================================================================
// BESTIÁRIO
// ==============================================================================
const BEAST_ART = {
    "Goblin": "assets/images/0d2bfbc1ebd57cec921429ca.webp", "Esqueleto": "assets/images/4a1764fb7730ec1764f5eaaa.webp", "Troll": "assets/images/1a8e33337cb326327978a9f9.webp", "Guarda": "assets/images/41e8adeb91f4cbb28ecdbff1.webp", "Lobo": "assets/images/f97ae16e086467a148fed11b.webp", "Aranha gigante": "assets/images/74d8dc5674a50c841ca7df14.webp", "Golem": "assets/images/422082fef19e52244a5cc68a.webp", "Dragão": "assets/images/4210e66a0ca88a219f72140c.webp", "Rato gigante": "assets/images/54d7fc3767217d97c3d09bff.webp", "Zumbi": "assets/images/962d3a432d420147308739d3.webp", "Fantasma": "assets/images/380c5ab3bf9015fc31c6b6ce.webp", "Orc": "assets/images/350ab360f0ec953e6bdf2058.webp", "Ogro": "assets/images/7c532ae5b5a79e53325a1880.webp", "Minotauro": "assets/images/3833c3d63647f7bca2f9d48c.webp", "Harpia": "assets/images/c4264d95d8ff8928b9ab2555.webp", "Lobisomem": "assets/images/16f53ff3efbd0840ee02d286.webp", "Vampiro": "assets/images/86532895e25b17fd98ab0851.webp", "Demônio": "assets/images/308deb49f158604dacfe997d.webp", "Geleia": "assets/images/f269053fd5268f6dac073d49.webp", "Serpente": "assets/images/669f0bd651c23fdd959144a8.webp", "Grifo": "assets/images/1b5685174bf2bbc6b501d33d.webp", "Elemental de fogo": "assets/images/42f09c101ad52467a2390626.webp", "Bandido": "assets/images/e4c00532824b63cd9cbc2305.webp", "Necromante": "assets/images/a58b8061927bebe34f4e2e3c.webp"
};
const beastDialog = document.createElement('dialog');
beastDialog.id = 'beastDialog';
document.body.append(beastDialog);
let beastDraft = null, beastSearch = '', beastAttackDraft = null, beastAttackIndex = -1;
function bestiary() {
    if (!Array.isArray(state.bestiary))
        state.bestiary = [];
    return state.bestiary;
}

function beastImage(x) {
    return x.image || BEAST_ART[x.art] || BEAST_ART.Goblin;
}

function blankBeast(art = 'Goblin') {
    return {
        id: itemId(), name: '', art, image: '', description: '', level: 1, hp: 10, mp: 0, ca: 10, attrs: [10, 10, 10, 10, 10, 10], initiative: 0, movement: 9, attacks: [], learnedSkills: [], learnedSpells: [], equipment: []
    };
}


// v0.9.41: modelos originais calculados em memória, nunca inseridos automaticamente
// no save do mestre. Os itens e poderes são cópias dos catálogos existentes.
const BEAST_PRESET_DATA = [
 // nome, arte, nível, PV, PM, CA, atributo principal, ataques, itens, magias, habilidades
 ['Rato Gigante','Rato gigante',1,12,0,11,12,[['Mordida',1,4]],[],[],[]],
 ['Lobo','Lobo',2,19,0,12,14,[['Mordida',2,6],['Garras',2,4]],[],[],[]],
 ['Goblin','Goblin',2,16,0,12,12,[['Adaga',2,4]],['Adaga','Poção vermelha pequena'],[],['Ataque Furtivo']],
 ['Esqueleto','Esqueleto',3,25,0,12,14,[['Espada',3,6]],['Espada'],[],[]],
 ['Bandido','Bandido',3,29,0,12,13,[['Adaga',3,6]],['Adaga','Poção vermelha pequena'],[],['Ataque Furtivo']],
 ['Zumbi','Zumbi',3,35,0,10,15,[['Golpe brutal',2,6]],[],[],[]],
 ['Guarda','Guarda',4,47,0,15,15,[['Espada',4,8]],['Espada','Escudo de Ferro','Gibão de Couro'],[],['Postura Defensiva']],
 ['Aranha Gigante','Aranha gigante',5,49,0,13,16,[['Mordida venenosa',5,8]],[],[],['Golpe Venenoso']],
 ['Orc','Orc',5,59,0,13,18,[['Machado',5,8]],['Machado','Couro Reforçado'],[],['Golpe Poderoso']],
 ['Serpente','Serpente',6,54,0,14,16,[['Mordida venenosa',6,8]],[],[],['Golpe Venenoso']],
 ['Geleia','Geleia',6,72,0,11,17,[['Toque corrosivo',5,10]],[],['Gota Ácida'],[]],
 ['Harpia','Harpia',6,62,8,14,16,[['Garras',6,8]],[],['Rajada de Vento'],['Esquiva']],
 ['Troll','Troll',7,105,0,13,20,[['Garras',7,10]],[],[],['Segundo Fôlego']],
 ['Ogro','Ogro',8,118,0,12,21,[['Clava',8,12]],['Maça'],[],['Golpe Brutal']],
 ['Minotauro','Minotauro',9,132,0,15,22,[['Machado pesado',9,12],['Investida',9,10]],['Machado'],[],['Golpe Poderoso']],
 ['Grifo','Grifo',9,115,0,16,19,[['Garras',9,10],['Bicada',9,8]],[],[],['Ataque Giratório']],
 ['Fantasma','Fantasma',10,104,35,17,17,[['Toque espectral',10,10]],[],['Dardo Sombrio','Véu Ilusório'],[]],
 ['Lobisomem','Lobisomem',11,150,0,16,21,[['Garras',11,12],['Mordida',10,10]],[],[],['Segundo Fôlego']],
 ['Golem','Golem',12,205,0,19,24,[['Punho de pedra',12,12]],[],[],['Resistência Selvagem']],
 ['Elemental de Fogo','Elemental de fogo',13,190,65,18,21,[['Toque flamejante',13,12]],[],['Chama Fugaz','Faísca Elétrica'],[]],
 ['Necromante','Necromante',14,168,95,17,18,[['Cajado',12,8]],['Cajado','Poção azul média','Poção vermelha média'],['Dardo Sombrio','Míssil Arcano'],[]],
 ['Vampiro','Vampiro',15,230,85,19,23,[['Mordida',15,12]],[],['Dardo Sombrio','Véu Ilusório'],['Segundo Fôlego']],
 ['Demônio','Demônio',17,310,110,21,25,[['Garras infernais',17,12],['Golpe demoníaco',16,12]],[],['Chama Fugaz','Dardo Sombrio'],['Golpe Brutal']],
 ['Dragão','Dragão',20,520,180,25,30,[['Garras dracônicas',20,12],['Mordida colossal',20,20],['Sopro de fogo',21,20]],[],['Chama Fugaz','Míssil Arcano','Escudo Protetor'],['Resistência Selvagem']]
];
function beastPresetAttack(name, bonus, sides, level) {
    return {
        id: itemId(), name, description: 'Ataque do modelo padrão; ajuste conforme a campanha.',
        hitBonus: bonus, type: /sopro|espectral|flamejante|corrosivo/i.test(name) ? 'Mágico' : 'Físico',
        target: 'Inimigos', maxTargets: /sopro/i.test(name) ? 3 : 1,
        cost: /sopro/i.test(name) ? 10 : 0, cooldown: /sopro/i.test(name) ? 3 : 0,
        cooldownUnit: 'Turnos', requiresHit: true,
        dice: { [sides]: Math.max(1, Math.min(4, Math.ceil(level / 7))) }, effects: []
    };
}
function beastPresetEquipment(name) {
    // Não criar modelos de equipamentos novos ou modificar os itens originais.
    const exact = BAG_BASIC_MODELS.find(x => x.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'));
    const fallback = BAG_BASIC_MODELS.find(x => x.name.toLocaleLowerCase('pt-BR').startsWith(name.toLocaleLowerCase('pt-BR')));
    return exact || fallback || null;
}
// v1.0.1 — Progressão exclusivamente dos monstros; não altera SPELL_LIBRARY.
// Dados ofensivos são definidos por nível, com PM proporcional à potência.
function beastSpellTier(level) {
    const n = Math.max(1, Math.min(20, Math.trunc(Number(level) || 1)));
    if (n >= 20) return { dice: {10: 6}, cost: 18 };
    if (n >= 17) return { dice: {8: 5}, cost: 14 };
    if (n >= 14) return { dice: {8: 4}, cost: 11 };
    if (n >= 13) return { dice: {6: 4}, cost: 9 };
    if (n >= 10) return { dice: {6: 3}, cost: 7 };
    if (n >= 5) return { dice: {6: 2}, cost: 4 };
    return { dice: {4: 1}, cost: 1 };
}
function beastTuneSpell(spell, level) {
    const x = cloneItem(spell);
    const tier = beastSpellTier(level);
    const phases = [x.base, ...(Array.isArray(x.progress) ? x.progress : [])].filter(Boolean);
    for (const phase of phases) {
        const damage = (phase.effects || []).filter(e => e.kind === 'Dano independente');
        if (damage.length) {
            // Cada magia ofensiva conserva seus alvos e efeitos, ajustando só dano e PM.
            for (const effect of damage) effect.dice = { ...skillDice(), ...tier.dice };
            phase.costType = 'PM';
            phase.cost = tier.cost;
        } else if (phase.costType === 'PM') {
            // Base estável: evoluir repetidas vezes não acumula custos antigos.
            // Magias sem dano conservam sua natureza e efeitos originais.
            if (!Number.isFinite(phase.beastBaseCost))
                phase.beastBaseCost = Math.max(1, Math.trunc(Number(phase.cost) || 1));
            phase.cost = Math.min(12, phase.beastBaseCost + Math.ceil(level / 4));
        }
    }
    return x;
}
function beastBalanceToLevel(x, target, fromLevel) {
    const source = Math.max(1, Math.min(20, Math.trunc(Number(fromLevel) || 1)));
    const level = Math.max(1, Math.min(20, Math.trunc(Number(target) || 1)));
    const delta = level - source;
    const before = JSON.stringify(x);
    const ratio = (level + 3) / (source + 3);
    x.hp = Math.max(1, Math.round(x.hp * ratio));
    x.ca = Math.max(1, Math.round(x.ca + delta / 4));
    x.attrs = x.attrs.map(v => Math.max(1, Math.round(v + delta / 3)));
    x.initiative = Math.round(x.initiative + delta / 4);
    if (x.mp > 0 || x.learnedSpells?.length) {
        x.mp = Math.max(level * 3, Math.round(x.mp * ratio));
    }
    for (const atk of x.attacks || []) {
        atk.hitBonus = Math.round((Number(atk.hitBonus) || 0) + delta);
        // Mantém o tipo dos dados e os efeitos do ataque original.
        const dice = atk.dice || {};
        for (const side of DICE_KINDS) if ((dice[side] || 0) > 0)
            dice[side] = Math.max(1, Math.min(40, Math.round(dice[side] * ratio)));
        if ((atk.cost || 0) > 0) atk.cost = Math.max(1, Math.round(atk.cost * ratio));
    }
    x.learnedSpells = (x.learnedSpells || []).map(spell => beastTuneSpell(spell, level));
    x.level = level;
    x.balanceLevel = level;
    return JSON.stringify(x) !== before;
}
function beastStandardModels() {
    return BEAST_PRESET_DATA.map(([name, art, level, hp, mp, ca, main, attacks, items, magics, abilities], idx) => {
        const beast = blankBeast(art);
        beast.id = 'beast-standard-' + (idx + 1);
        beast.name = name;
        beast.description = 'Modelo padrão de nível ' + level + '. Equipamentos e poderes são cópias independentes dos modelos existentes. Balanceamento inicial ajustável pelo mestre.';
        beast.level = level; beast.balanceLevel = level; beast.hp = hp; beast.mp = mp; beast.ca = ca;
        beast.attrs = [main, Math.max(8, main-2), Math.max(10, main-1), Math.max(8, main-5), Math.max(8, main-4), Math.max(8, main-5)];
        beast.initiative = Math.floor((beast.attrs[1]-10)/2);
        beast.movement = ['Dragão','Grifo','Harpia'].includes(name) ? 18 : 9;
        beast.attacks = attacks.map(([n,b,d]) => beastPresetAttack(n,b,d,level));
        beast.equipment = items.map(beastPresetEquipment).filter(Boolean).map(x => cloneItem(x));
        beast.learnedSpells = magics.map(n => SPELL_LIBRARY.find(x => x.name === n)).filter(Boolean).map(x => beastTuneSpell(x, level));
        if (beast.learnedSpells.length && beast.mp === 0) beast.mp = Math.max(12, level * 3);
        beast.learnedSkills = abilities.map(n => SKILL_LIBRARY.find(x => x.name === n)).filter(Boolean).map(x => cloneItem(x));
        return beast;
    });
}

function beastOpen() {
    // O Bestiário já faz parte da Biblioteca; a mesma tela gerencia todos os cadastros.
    beastDraft = null;
    libraryOpen('bestiary');
}

function beastCardFace(x) {
    return `<span class="beast-card-art"><img src="${esc(beastImage(x))}" alt="" loading="lazy"><span class="beast-card-shield beast-ca"><small>CA</small><b>${esc(x.ca)}</b></span><span class="beast-card-shield beast-level"><small>NV.</small><b>${esc(x.level)}</b></span></span><strong class="beast-card-name">${esc(x.name)}</strong><span class="beast-card-resources"><span class="beast-card-hp"><small>PV</small><b>${esc(x.hp)}</b></span><span class="beast-card-mp"><small>PM</small><b>${esc(x.mp)}</b></span></span>`;
}

function beastListTiles() {
    return bestiary().filter(x => x.name.toLocaleLowerCase('pt-BR').includes(beastSearch.toLocaleLowerCase('pt-BR'))).map(x => `<button type="button" class="beast-tile" data-beast-edit="${esc(x.id)}">${beastCardFace(x)}</button>`).join('') || '<p>Nenhuma criatura cadastrada.</p>';
}

function beastList() {
    beastDialog.innerHTML = `<h2>Bestiário <small>(${bestiary().length})</small></h2><div class="beast-top"><button data-beast-new>+ Criar criatura</button><button data-beast-library>Biblioteca / JSON</button><input id="beastSearch" placeholder="Pesquisar criatura" value="${esc(beastSearch)}"></div><div class="beast-grid" id="beastTiles">${beastListTiles()}</div><div class="beast-bottom"><button data-beast-close>Fechar</button></div>`;
}

function beastRead() {
    let f = $('beastForm');
    if (!f)
        return;
    const v = k => f.elements[k].value, n = k => Number(v(k));
    Object.assign(beastDraft, {
        name: v('name').trim(), description: v('description'), level: n('level'), hp: n('hp'), mp: n('mp'), ca: n('ca'), initiative: n('initiative'), movement: n('movement'), attrs: names.map((_, i) => n('a' + i))
    });
}

function beastForm() {
    const x = beastDraft;
    beastDialog.innerHTML = `<form id="beastForm"><h2>${bestiary().some(b => b.id === x.id) ? 'Editar' : 'Cadastrar'} criatura</h2><div class="beast-heading"><img id="beastPreview" src="${beastImage(x)}" alt="Retrato"><div>${field('Nome', 'name', x.name, 'text', 'required maxlength="120"')}<button type="button" data-beast-art>Escolher retrato</button><label>Foto personalizada<input id="beastUpload" type="file" accept="image/*"></label></div></div><div class="beast-fields">${[['Nível', 'level', 1], ['PV máximo', 'hp', 1], ['PM máximo', 'mp', 0], ['CA', 'ca', 0], ['Iniciativa (bônus)', 'initiative', null], ['Deslocamento (m)', 'movement', 0]].map(([l, k, m]) => field(l, k, x[k], 'number', `required step="1" ${m === null ? '' : 'min="' + m + '"'}`)).join('')}</div><div class="beast-balance-tools"><button type="button" data-beast-balance>Balancear para este nível</button><small>Recalcula PV, PM, CA, atributos, ataques e dano/custo das magias somente nesta cópia. Confira os valores antes de salvar.</small></div><h3>Atributos</h3><div class="beast-fields">${names.map((n, i) => field(n, 'a' + i, x.attrs[i], 'number', 'required min="1" step="1"')).join('')}</div><label>Descrição<textarea name="description" rows="2">${esc(x.description)}</textarea></label>${`<section class="beast-section"><div class="beast-top"><h3>Equipamentos e consumíveis (${(x.equipment || []).length})</h3><button type="button" data-beast-equipment-add>+ Adicionar modelo</button></div>${(x.equipment || []).map((a,i) => `<div class="beast-entry"><span>${esc(a.name)} · ${esc(a.category)}</span><button type="button" data-beast-equipment-remove="${i}">Remover</button></div>`).join('') || '<small>Nenhum cadastrado.</small>'}</section>`}${[['Ataques', 'attacks', 'attack'], ['Habilidades', 'learnedSkills', 'skill'], ['Magias', 'learnedSpells', 'spell']].map(([label, key, kind]) => `<section class="beast-section"><div class="beast-top"><h3>${label} (${x[key].length})</h3><button type="button" data-beast-add="${kind}">+ Adicionar</button></div>${x[key].map((a, i) => `<div class="beast-entry ${kind !== 'attack' ? 'beast-power-entry' : ''}" ${kind !== 'attack' ? `data-beast-preview-kind="${kind}" data-index="${i}"` : ''}><span>${esc(a.name)}${kind === 'attack' ? ` · ${sign(a.hitBonus)} acerto · ${esc(diceText(a.dice))} dano` : ''}</span><button type="button" data-beast-action="${kind}" data-index="${i}">Editar</button><button type="button" data-beast-remove="${kind}" data-index="${i}">Remover</button></div>`).join('') || '<small>Nenhum cadastrado.</small>'}</section>`).join('')}<p id="beastError" role="alert"></p><div class="beast-bottom"><button type="submit">Salvar criatura</button>${bestiary().some(b => b.id === x.id) ? '<button type="button" data-beast-duplicate>Duplicar</button><button type="button" data-beast-delete>Excluir</button>' : ''}<button type="button" data-beast-back>Cancelar</button></div></form>`;
}


function beastPreviewLines(kind, x) {
    return kind === 'skill' ? skillDescription(x) : kind === 'spell' ? spellDetails(x) : [];
}

function beastHidePreview() {
    beastDialog.querySelector('.beast-expanded-preview')?.remove();
}

function beastPreviewRecord(tile) {
    const kind = tile?.dataset.beastPreviewKind, i = Number(tile?.dataset.index);
    if (!kind || !Number.isFinite(i) || !beastDraft)
        return null;
    const list = beastDraft[kind === 'skill' ? 'learnedSkills' : 'learnedSpells'];
    const x = list?.[i];
    return x ? { kind, x } : null;
}

function beastShowPreview(tile) {
    const rec = beastPreviewRecord(tile);
    if (!rec || !beastDialog.open)
        return beastHidePreview();
    const { kind, x } = rec;
    beastHidePreview();
    const art = kind === 'skill' ? skillImage(x) : spellImage(x), lines = beastPreviewLines(kind, x).filter(Boolean);
    const preview = document.createElement('div');
    preview.className = 'beast-expanded-preview';
    preview.setAttribute('role', 'tooltip');
    preview.innerHTML = `<div class="beast-preview-head">${art ? `<img src="${esc(art)}" alt="">` : ''}<strong>${esc(x.name || '')}</strong></div>${x.description ? `<p class="beast-preview-description">${esc(x.description)}</p>` : ''}${lines.map(t => `<p>${esc(String(t))}</p>`).join('')}`;
    beastDialog.append(preview);
    const r = tile.getBoundingClientRect(), w = preview.offsetWidth, h = preview.offsetHeight;
    const left = r.right + w + 12 <= innerWidth - 10 ? r.right + 12 : r.left - w - 12;
    preview.style.left = Math.max(8, Math.min(innerWidth - w - 8, left)) + 'px';
    preview.style.top = Math.max(8, Math.min(innerHeight - h - 8, r.top)) + 'px';
}

function beastAttackForm() {
    let a = beastAttackDraft;
    beastDialog.innerHTML = `<form id="beastAttackForm"><h2>Configurar ataque</h2>${field('Nome', 'name', a.name, 'text', 'required maxlength="120"')}<div class="beast-fields">${field('Bônus de acerto (D20 + bônus)', 'hitBonus', a.hitBonus, 'number', 'required step="1"')}${selectField('Tipo', 'type', ['Físico', 'Distância', 'Mágico'], a.type)}${selectField('Alvos permitidos', 'target', ['Inimigos', 'Aliados', 'Qualquer personagem', 'Próprio conjurador'], a.target)}${field('Máximo de alvos', 'maxTargets', a.maxTargets, 'number', 'required min="1" step="1"')}${field('Custo de PM', 'cost', a.cost, 'number', 'required min="0" step="1"')}${field('Recarga (0 = nenhuma)', 'cooldown', a.cooldown, 'number', 'required min="0" step="1"')}${clockSelect('cooldownUnit', a.cooldownUnit, 'Contar recarga em')}</div>${check('Exige teste de acerto', 'requiresHit', a.requiresHit)}<h3>Dano</h3><div class="dice-fields">${[...DICE_KINDS, 'fixed'].map(k => field(k === 'fixed' ? 'Fixo' : 'D' + k, 'd' + k, a.dice[k] || 0, 'number', k === 'fixed' ? 'required step="1"' : 'required min="0" max="40" step="1"')).join('')}</div><label>Descrição<textarea name="description" rows="2">${esc(a.description)}</textarea></label><h3>Efeitos adicionais</h3>${a.effects.map((e, i) => skillEffectForm(e, i).replace('data-skill-effect-remove', 'data-beast-effect-remove')).join('')}<button type="button" data-beast-effect-add>+ Adicionar efeito</button><p id="beastError" role="alert"></p><div class="beast-bottom"><button type="submit">Salvar ataque</button><button type="button" data-beast-attack-back>Cancelar</button></div></form>`;
}

function beastReadAttack() {
    const f = $('beastAttackForm');
    if (!f)
        return;
    let a = beastAttackDraft, g = k => [...f.querySelectorAll(`[name="${k}"]`)].find(el => !el.closest('.skill-effect')), v = k => g(k).value, n = k => Number(v(k));
    Object.assign(a, {
        name: v('name').trim(), description: v('description'), hitBonus: n('hitBonus'), type: v('type'), target: v('target'), maxTargets: n('maxTargets'), cost: n('cost'), cooldown: n('cooldown'), cooldownUnit: clockUnit(v('cooldownUnit')), requiresHit: g('requiresHit').checked, dice: Object.fromEntries([...DICE_KINDS, 'fixed'].map(k => [k, n('d' + k)]))
    });
    a.effects = [...f.querySelectorAll('.skill-effect')].map(el => {
        const g = k => el.querySelector(`[name="${k}"]`), v = k => g(k).value, n = k => Number(v(k));
        return {
            kind: v('kind'), target: v('target'), trigger: v('trigger'), attr: v('attr'), requiresHit: g('requiresHit').checked, dice: Object.fromEntries([...DICE_KINDS, 'fixed'].map(k => [k, n('d' + k)])), bonusKind: v('bonusKind'), amount: n('amount'), condition: v('condition'), chance: n('chance'), resistance: v('resistance'), resAttr: v('resAttr'), dc: n('dc'), turns: n('turns'), durationUnit: clockUnit(v('durationUnit')), dotUnit: clockUnit(v('dotUnit')), details: v('details')
        };
    });
}

function beastAction(kind, i = -1) {
    beastRead();
    const k = ({ attack: 'attacks', skill: 'learnedSkills', spell: 'learnedSpells' })[kind], a = beastDraft[k][i];
    if (kind === 'attack') {
        beastAttackIndex = i;
        beastAttackDraft = a ? cloneItem(a) : { id: itemId(), name: '', description: '', hitBonus: 0, type: 'Físico', target: 'Inimigos', maxTargets: 1, cost: 0, cooldown: 0, requiresHit: true, dice: skillDice(), effects: [] };
        beastAttackForm();
        return;
    }
    if (kind === 'skill') {
        skillDialog.dataset.detail = '';
        openSkillForm(a || skillBlank(), a?.id || null);
        skillOwner = beastDraft;
    }
    else {
        spellDialog.dataset.detail = '';
        openSpellForm(a || spellBlank(), a?.id || null);
        spellOwner = beastDraft;
    }
}
for (const dlg of [skillDialog, spellDialog])
    dlg.addEventListener('close', () => {
        if (beastDialog.open && beastDraft && $('beastForm'))
            beastForm();
    });

beastDialog.addEventListener('pointerover', e => {
    const tile = e.target.closest('.beast-power-entry');
    if (tile && !tile.contains(e.relatedTarget))
        beastShowPreview(tile);
});
beastDialog.addEventListener('pointerout', e => {
    const tile = e.target.closest('.beast-power-entry');
    if (tile && !tile.contains(e.relatedTarget))
        beastHidePreview();
});
beastDialog.addEventListener('focusin', e => {
    const tile = e.target.closest('.beast-power-entry');
    if (tile)
        beastShowPreview(tile);
});
beastDialog.addEventListener('focusout', e => {
    if (e.target.closest('.beast-power-entry'))
        beastHidePreview();
});
beastDialog.addEventListener('scroll', beastHidePreview, true);
beastDialog.addEventListener('close', beastHidePreview);

beastDialog.addEventListener('input', e => {
    if (e.target.id === 'beastSearch') {
        beastSearch = e.target.value;
        $('beastTiles').innerHTML = beastListTiles();
    }
});
beastDialog.addEventListener('change', e => {
    if (e.target.name === 'kind' && $('beastAttackForm')) {
        beastReadAttack();
        beastAttackForm();
        return;
    }
    if (e.target.id !== 'beastUpload')
        return;
    let f = e.target.files[0], d = beastDraft;
    if (!f)
        return;
    const reader = new FileReader();
    reader.onload = () => {
        const im = new Image();
        im.onload = () => {
            if (d !== beastDraft || !$('beastPreview'))
                return;
            const cv = document.createElement('canvas'), s = Math.min(1, 256 / Math.max(im.width, im.height));
            cv.width = Math.max(1, Math.round(im.width * s));
            cv.height = Math.max(1, Math.round(im.height * s));
            cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
            d.image = cv.toDataURL('image/webp', .8);
            $('beastPreview').src = d.image;
        };
        im.src = reader.result;
    };
    reader.readAsDataURL(f);
});
beastDialog.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b)
        return;
    const d = b.dataset, has = k => k in d;
    if (has('beastLibrary')) {
        beastDialog.close();
        libraryOpen('bestiary');
        return;
    }
    if (has('beastClose')) {
        beastDialog.close();
        return;
    }
    if (has('beastNew')) {
        beastDraft = blankBeast();
        beastForm();
        return;
    }
    if (d.beastEdit) {
        beastDraft = cloneItem(bestiary().find(x => x.id === d.beastEdit));
        beastForm();
        return;
    }
    if (has('beastBack')) {
        if (beastDialog.dataset.libraryOwner === '1')
            beastDialog.close();
        else
            beastOpen();
        return;
    }
    if (has('beastBalance')) {
        const raw = Number($('beastForm')?.elements.level.value);
        if (!Number.isSafeInteger(raw) || raw < 1 || raw > 20) {
            $('beastError').textContent = 'Escolha um nível entre 1 e 20.';
            return;
        }
        const old = Math.max(1, Math.min(20, Math.trunc(Number(beastDraft.balanceLevel ?? beastDraft.level) || 1)));
        beastRead();
        if (!beastBalanceToLevel(beastDraft, raw, old)) {
            $('beastError').textContent = 'Nenhum ajuste necessário neste nível. Você ainda pode editar os valores manualmente.';
            return;
        }
        beastForm();
        toast('Criatura balanceada para o nível ' + raw + '. Revise e salve a ficha.');
        return;
    }
    if (has('beastArt')) {
        beastRead();
        beastDialog.innerHTML = `<h2>Escolher retrato da criatura</h2><div class="beast-grid">${Object.entries(BEAST_ART).map(([n, img]) => `<button class="beast-tile" data-beast-art-choice="${esc(n)}"><img src="${img}" alt="">${esc(n)}</button>`).join('')}</div><button data-beast-art-back>Voltar</button>`;
        return;
    }
    if (d.beastArtChoice) {
        beastDraft.art = d.beastArtChoice;
        beastDraft.image = '';
        if (!beastDraft.name)
            beastDraft.name = d.beastArtChoice;
        beastForm();
        return;
    }
    if (has('beastArtBack')) {
        beastForm();
        return;
    }
    if (has('beastEquipmentAdd')) {
        beastRead();
        const entries = BAG_BASIC_MODELS.filter(x => ['Armas','Armaduras','Escudos','Acessórios','Consumíveis','Utilidades'].includes(x.category));
        beastDialog.innerHTML = `<h2>Adicionar equipamento existente</h2><div class="beast-grid">${entries.map((x,i) => `<button type="button" class="beast-tile" data-beast-equipment-choice="${i}">${esc(x.name)} <small>${esc(x.category)}</small></button>`).join('')}</div><button type="button" data-beast-equipment-back>Voltar</button>`;
        return;
    }
    if (has('beastEquipmentChoice')) {
        const source = BAG_BASIC_MODELS[Number(d.beastEquipmentChoice)];
        if (source) (beastDraft.equipment ??= []).push(cloneItem(source));
        beastForm();
        return;
    }
    if (has('beastEquipmentBack')) { beastForm(); return; }
    if (has('beastEquipmentRemove')) {
        beastRead();
        (beastDraft.equipment ??= []).splice(Number(d.beastEquipmentRemove), 1);
        beastForm();
        return;
    }
    if (d.beastAdd || d.beastAction) {
        beastAction(d.beastAdd || d.beastAction, d.beastAction ? +d.index : -1);
        return;
    }
    if (d.beastRemove) {
        beastRead();
        beastDraft[({ attack: 'attacks', skill: 'learnedSkills', spell: 'learnedSpells' })[d.beastRemove]].splice(+d.index, 1);
        beastForm();
        return;
    }
    if (has('beastEffectAdd') || has('beastEffectRemove')) {
        beastReadAttack();
        if (has('beastEffectAdd'))
            beastAttackDraft.effects.push(skillEffect());
        else
            beastAttackDraft.effects.splice(+d.beastEffectRemove, 1);
        beastAttackForm();
        return;
    }
    if (has('beastAttackBack')) {
        beastForm();
        return;
    }
    if (has('beastDuplicate')) {
        beastRead();
        let x = cloneItem(beastDraft);
        x.id = itemId();
        x.name += ' (cópia)';
        beastDraft = x;
        beastForm();
        return;
    }
    if (has('beastDelete')) {
        const id = beastDraft.id;
        if (market().npcs.some(n => guardRoster(n).some(g => g.b.id === id)))
            return toast('Remova esta criatura dos guardas dos comerciantes antes de excluí-la.');
        if (await openSiteDialog({ title: 'Tem certeza?', message: 'Excluir ' + beastDraft.name + ' do Bestiário?', confirm: true, danger: true }) === true) {
            if (beastDialog.dataset.libraryOwner === '1') {
                if (arenaState()?.participants?.some(p => p.beastId === id)) {
                    $('beastError').textContent = 'Criatura vinculada a uma batalha.';
                    return;
                }
                if (libCommit('bestiary', bestiary().filter(x => x.id !== id)))
                    beastDialog.close();
            }
            else {
                state.bestiary = bestiary().filter(x => x.id !== id);
                persist();
                beastOpen();
            }
        }
        return;
    }
});
beastDialog.addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.id === 'beastAttackForm') {
        beastReadAttack();
        let a = beastAttackDraft;
        if (!a.name || [a, ...a.effects].some(q => DICE_KINDS.reduce((n, k) => n + (q.dice[k] || 0), 0) > 40)) {
            $('beastError').textContent = 'Informe um nome e use no máximo 40 dados por efeito.';
            return;
        }
        if (beastAttackIndex < 0)
            beastDraft.attacks.push(cloneItem(a));
        else
            beastDraft.attacks[beastAttackIndex] = cloneItem(a);
        beastForm();
        return;
    }
    if (e.target.id !== 'beastForm')
        return;
    beastRead();
    let x = beastDraft;
    if (!x.name) {
        $('beastError').textContent = 'Informe o nome da criatura.';
        return;
    }
    if (beastDialog.dataset.libraryOwner === '1') {
        const msg = libSaveModel('bestiary', x, bestiary().some(z => z.id === x.id) ? x.id : null);
        if (msg) {
            $('beastError').textContent = msg;
            return;
        }
        beastDialog.close();
        return;
    }
    const list = bestiary(), i = list.findIndex(z => z.id === x.id);
    if (i < 0)
        list.push(cloneItem(x));
    else
        list[i] = cloneItem(x);
    persist();
    beastOpen();
    toast('Criatura salva.');
});
// Arena — estrutura de encontros e turnos (v0.8.2).

