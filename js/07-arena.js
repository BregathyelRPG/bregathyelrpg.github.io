// ==============================================================================
// ARENA — encontros, iniciativa, ataques e condições
// ==============================================================================
const arenaDialog = document.createElement('dialog');
arenaDialog.id = 'arenaDialog';
arenaDialog.setAttribute('aria-label', 'Arena de Batalha');
document.body.append(arenaDialog);
const arenaState = () => state.arena?.participants && Array.isArray(state.arena.participants) ? state.arena : null;
const arenaPlayer = x => state.characters.find(p => p.marketId === x.playerId);
function arenaDataBase(x) {
    if (x.kind === 'player') {
        const p = arenaPlayer(x);
        if (!p)
            return { name: x.name, level: 1, hp: 0, mp: 0, maxHP: 1, maxMP: 0, ca: 0, initiative: 0, movement: 0, image: racePortrait('Humano'), missing: true };
        let r = combatStat(p, 1);
        return {
            name: p.name, level: p.level, hp: clamp(p.hp, 0, Rules.maxHP(p)), mp: clamp(p.mp, 0, Rules.maxMP(p)), maxHP: Rules.maxHP(p), maxMP: Rules.maxMP(p), ca: defenseCA(p), initiative: r.mod + r.level, movement: Math.max(0, p.movement + equipmentBonus(p, 'Deslocamento') - heavyPenalty(p)), image: p.photo || racePortrait(p.race, p.sex), source: p
        };
    }
    const b = x.beast;
    return { name: x.name, level: b.level, hp: x.hp, mp: x.mp, maxHP: b.hp, maxMP: b.mp, ca: b.ca, initiative: b.initiative, movement: b.movement, image: beastImage(b), source: x };
}

function arenaData(x) {
    const d = arenaDataBase(x);
    if (!d.missing) {
        const p = x.kind === 'player' ? arenaPlayer(x) : null;
        d.ca += powerBonus(x, 'CA');
        if (p) {
            const armor = equipment(p)[4], idx = armor && armor.armorType !== 'Vestimenta' ? (compatible(p, armor) ? ({ Leve: 1, 'Média': 2, Pesada: 0 })[armor.armorType] : undefined) : ({ Mago: 3, Feiticeiro: 3, Bruxo: 3, Monge: 4, Druida: 4, 'Clérigo': 4, 'Bárbaro': 2, Bardo: 5 })[p.class];
            if (idx !== undefined)
                d.ca += powerModDelta(x, names[idx]);
            d.maxHP += powerBonus(x, 'Constituição');
            d.maxMP += Math.floor((powerAttr(x, names[3]) + powerAttr(x, names[4])) / 2) - Math.floor((conditionAttrBase(x, names[3]) + conditionAttrBase(x, names[4])) / 2);
        }
        d.maxHP = Math.max(1, d.maxHP + powerBonus(x, 'PV máximos'));
        d.maxMP = Math.max(0, d.maxMP + powerBonus(x, 'PM máximos'));
        d.hp = clamp(d.source.hp, 0, d.maxHP);
        d.mp = clamp(d.source.mp, 0, d.maxMP);
        d.initiative += powerBonus(x, 'Iniciativa') + (p ? powerModDelta(x, names[1]) : 0);
        d.movement = Math.max(0, d.movement + powerBonus(x, 'Deslocamento'));
    }
    if (conditionHas(x, 'Paralisado'))
        d.ca = 0;
    else if (conditionHas(x, 'Atordoado'))
        d.ca -= 5;
    if (conditionHas(x, 'Imobilizado'))
        d.movement = 0;
    else if (conditionHas(x, 'Amedrontado'))
        d.movement = Math.max(0, d.movement - 5);
    return d;
}

function arenaLog(a, message) {
    a.log.push({ round: a.round, text: message });
    if (a.log.length > 250)
        a.log.shift();
}

const arenaCurrent = a => a.participants.find(x => x.id === a.current);
function arenaAlive(x) {
    return !!x && arenaData(x).hp > 0;
}

function arenaInitiative(x) {
    x.roll = null;
    x.bonus = arenaData(x).initiative;
    x.initiative = null;
    return x;
}

function arenaSort(a) {
    a.participants.sort((x, y) => y.initiative - x.initiative || y.bonus - x.bonus);
}

function arenaSave() {
    persist();
    arenaRender();
}

let arenaSheetScroll = 0;
function arenaOpen() {
    marketInit();
    if (!arenaDialog.open) {
        arenaSheetScroll = window.scrollY;
        document.body.classList.add('arena-view');
        arenaDialog.show();
        arenaRender();
        window.scrollTo(0, 0);
    }
    else
        arenaRender();
}

function arenaSetup(adding = false) {
    arenaDialog.classList.remove('tcg-live');
    const a = arenaState();
    arenaDialog.innerHTML = `<div class="arena-head"><div><h1>⚔ Arena de Batalha</h1><small>${adding ? 'Reforços' : 'Preparar encontro'}</small></div><button data-arena="${adding ? 'resume' : 'exit'}">${adding ? 'Voltar à batalha' : 'Voltar à ficha'}</button></div><form id="arenaSetup"><div class="arena-columns"><section class="arena-panel"><h2>Personagens</h2><select id="arenaPickPlayer" class="arena-picker" aria-label="Adicionar personagem"></select><div id="arenaPickedPlayers" class="arena-select-list"></div></section><section class="arena-panel"><h2>Criaturas do Bestiário</h2><select id="arenaPickBeast" class="arena-picker" aria-label="Adicionar criatura"></select><div id="arenaPickedBeasts" class="arena-select-list"></div></section></div>${adding ? '' : `<section class="arena-panel"><h2>Cenário da batalha</h2><div class="tcg-scene-picks">${Object.entries(TCG_SCENES).map(([name, src], i) => `<label><input type="radio" name="arenaScene" value="${esc(name)}" ${i === 0 ? 'checked' : ''}><img src="${src}" alt=""><span>${esc(name)}</span></label>`).join('')}</div><label>Imagem personalizada (opcional)<input id="arenaSceneUpload" type="file" accept="image/*"></label><small id="arenaSceneStatus"></small></section>`}<p id="arenaError" role="alert"></p><div class="arena-foot"><small>Iniciativa: D20 + bônus. Empates usam o maior bônus. Durante a batalha, clique em um combatente para selecioná-lo.</small><button type="submit">${adding ? 'Preparar iniciativas dos reforços' : 'Preparar iniciativas'}</button></div></form>`;
    arenaDialog.dataset.adding = adding ? '1' : '0';
    arenaRefreshSetup();
}

function arenaRefreshSetup() {
    const pp = $('arenaPickPlayer'), bp = $('arenaPickBeast');
    if (!pp || !bp)
        return;
    const taken = new Set([...$('arenaPickedPlayers').querySelectorAll('[data-player-id]')].map(x => x.dataset.playerId));
    if (arenaDialog.dataset.adding === '1')
        for (const x of arenaState()?.participants || [])
            if (x.kind === 'player')
                taken.add(x.playerId);
    const players = state.characters.filter(p => p.name && !taken.has(String(p.marketId)));
    const customBeasts = bestiary();
    const standardBeasts = beastStandardModels();
    const beasts = [...customBeasts, ...standardBeasts];
    pp.innerHTML = `<option value="">${players.length ? '+ Selecionar personagem…' : 'Nenhum personagem disponível'}</option>` + players.map(p => `<option value="${esc(p.marketId)}">${esc(p.name)}</option>`).join('');
    pp.disabled = !players.length;
    bp.innerHTML = `<option value="">${beasts.length ? '+ Selecionar criatura…' : 'Nenhuma criatura disponível'}</option>`
        + (customBeasts.length ? `<optgroup label="Criaturas cadastradas">${customBeasts.map(b => `<option value="${esc(b.id)}">${esc(b.name)}</option>`).join('')}</optgroup>` : '')
        + `<optgroup label="Modelos padrão (não exportados)">${standardBeasts.map(b => `<option value="${esc(b.id)}">${esc(b.name)} · Nv. ${esc(b.level)}</option>`).join('')}</optgroup>`;
    bp.disabled = !beasts.length;
    for (const [id, message] of [['arenaPickedPlayers', 'Nenhum personagem selecionado.'], ['arenaPickedBeasts', 'Nenhuma criatura selecionada.']]) {
        const list = $(id);
        list.querySelector('.arena-setup-empty')?.remove();
        if (!list.children.length)
            list.insertAdjacentHTML('beforeend', `<p class="arena-setup-empty">${message}</p>`);
    }
}

// Inclui modelos padrão apenas no seletor da Arena; não os adiciona ao
// Bestiário salvo nem aos arquivos JSON exportados pelo mestre.
function arenaAvailableBeasts() {
    return [...bestiary(), ...beastStandardModels()];
}

function arenaSetupPick(kind, id) {
    if (!id)
        return;
    const player = kind === 'player', list = $(player ? 'arenaPickedPlayers' : 'arenaPickedBeasts'), p = player ? state.characters.find(x => String(x.marketId) === id) : arenaAvailableBeasts().find(x => String(x.id) === id);
    if (!list || !p)
        return;
    if (player && ([...list.querySelectorAll('[data-player-id]')].some(x => x.dataset.playerId === id) || (arenaDialog.dataset.adding === '1' && arenaState()?.participants.some(x => x.playerId === p.marketId))))
        return;
    const side = player ? 'ally' : 'enemy';
    const card = document.createElement('div');
    card.className = 'arena-choice';
    card.dataset[player ? 'playerId' : 'beastId'] = id;
    card.dataset.side = side;
    card.innerHTML = `<img src="${player ? p.photo || racePortrait(p.race, p.sex) : beastImage(p)}" alt=""><span class="arena-choice-name"><strong>${esc(p.name)}</strong><small>${player ? 'Nível ' + p.level + ' · PV ' + p.hp + '/' + Rules.maxHP(p) : 'PV ' + p.hp + ' · CA ' + p.ca}</small></span>${player ? '' : '<label>Qtd.<input aria-label="Quantidade" type="number" class="arena-qty" min="1" max="30" step="1" value="1" required></label>'}<label>Lado<select class="arena-side" aria-label="Lado"><option value="ally" ${player ? 'selected' : ''}>Aliados</option><option value="enemy" ${player ? '' : 'selected'}>Inimigos</option></select></label><button type="button" class="arena-remove" data-arena-setup-remove aria-label="Remover participante">×</button>`;
    list.append(card);
    arenaRefreshSetup();
    $('arenaError').textContent = '';
}
arenaDialog.addEventListener('change', e => {
    const el = e.target;
    if (el.id === 'arenaPickPlayer' || el.id === 'arenaPickBeast') {
        arenaSetupPick(el.id === 'arenaPickPlayer' ? 'player' : 'beast', el.value);
        el.value = '';
    }
    else if (el.classList.contains('arena-side') && el.closest('#arenaSetup')) {
        el.closest('.arena-choice').dataset.side = el.value;
        $('arenaError').textContent = '';
    }
});
arenaDialog.addEventListener('click', e => {
    const el = e.target.closest('[data-arena-setup-remove]');
    if (!el)
        return;
    el.closest('.arena-choice').remove();
    arenaRefreshSetup();
    $('arenaError').textContent = '';
});
function arenaAdd(a, players, beasts) {
    let list = [];
    for (const { p, side } of players)
        if (!a.participants.some(x => x.playerId === p.marketId))
            list.push(arenaInitiative({
                id: itemId(), kind: 'player', playerId: p.marketId, name: p.name, side, conditions: cloneItem(p.restState?.conditions || []), cooldowns: { ...p.restState?.cooldowns }, cooldownUnits: { ...p.restState?.cooldownUnits }
            }));
    for (const { b, count, side } of beasts) {
        for (let i = 0; i < count; i++) {
            const n = 1 + Number(a.serial[b.id] || 0);
            a.serial[b.id] = n;
            list.push(arenaInitiative({ id: itemId(), kind: 'beast', beastId: b.id, name: b.name + ' ' + n, side, beast: cloneItem(b), hp: b.hp, mp: b.mp, conditions: [], cooldowns: {} }));
        }
    }
    a.participants.push(...list);
    for (const x of a.participants)
        for (const v of conditionList(x))
            if (v.restSourcePlayer) {
                v.sourceId = a.participants.find(y => y.kind === 'player' && y.playerId === v.restSourcePlayer)?.id || null;
            }
    a.pendingInitiative = list.map(x => x.id);
    return list;
}

function arenaNextOriginal(a) {
    const old = a.participants.findIndex(x => x.id === (a.sequenceCurrent ?? a.current)), n = a.participants.length;
    if (!n)
        return;
    let wrapped = false;
    for (let k = 1; k <= n; k++) {
        let i = (Math.max(-1, old) + k) % n;
        if (arenaAlive(a.participants[i])) {
            if (old >= 0 && i <= old) {
                if (!wrapped) {
                    wrapped = true;
                    a.round++;
                    clockRound(a);
                }
                if (!arenaAlive(a.participants[i]))
                    continue;
            }
            a.sequenceCurrent = a.current = a.participants[i].id;
            clockTickCooldown(a.participants[i], 'Turnos próprios');
            arenaLog(a, `Turno de ${arenaData(a.participants[i]).name}.`);
            return;
        }
    }
    a.sequenceCurrent = a.current = null;
    arenaLog(a, 'Nenhum combatente com PV disponível.');
}

function arenaNext(a) {
    conditionTurnNext(a);
}

const ARENA_CONDITION_ART = {
    Atordoado: ['✦', '#f0c75d'], Caído: ['↘', '#d6a47b'], Paralisado: ['ϟ', '#8ac7ff'], Cego: ['◉', '#bdbbc8'], Amedrontado: ['☾', '#b399e9'], Imobilizado: ['⛓', '#9bb7cc'], Exausto: ['◷', '#d4ab7e'], Concentrando: ['✧', '#7edbff'], Envenenado: ['☠', '#86d16c'], Queimando: ['♨', '#ff884a']
};
function arenaConditionNames(x) {
    return [...new Set((Array.isArray(x.conditions) ? x.conditions : []).map(v => typeof v === 'string' ? v : v?.kind || v?.condition || v?.name).filter(v => CONDITION_KINDS.includes(v)))];
}

function arenaConditionIcon(name, v = null) {
    const [symbol, color] = ARENA_CONDITION_ART[name] || ['✦', '#d4ae72'];
    const icon = CHARACTER_CONDITION_ART[name]
        ? `<img class="condition-art-icon" src="${CHARACTER_CONDITION_ART[name]}" alt="">`
        : symbol;
    return `<span class="arena-condition-icon" style="--condition-color:${color}" aria-label="${esc(v ? conditionDetails(v) + (v.sourceId && arenaState()?.participants.find(t => t.id === v.sourceId) ? ' · Origem: ' + arenaData(arenaState().participants.find(t => t.id === v.sourceId)).name : '') : name)}" tabindex="0">${icon}</span>`;
}

function arenaConditionStrip(x, empty = false) {
    const names = arenaConditionNames(x);
    return names.length ? `<div class="arena-condition-strip">${names.map(n => arenaConditionIcon(n, conditionList(x).find(v => v.kind === n))).join('')}</div>` : empty ? '<small>Sem condições</small>' : '';
}

const arenaConditionDialog = document.createElement('dialog');
arenaConditionDialog.id = 'arenaConditionDialog';
arenaConditionDialog.setAttribute('aria-label', 'Condições de status');
document.body.append(arenaConditionDialog);
function arenaEditConditions(x, a) {
    conditionEdit(x, a);
}

function arenaCompactBar(x, d, key) {
    let max = key === 'hp' ? d.maxHP : d.maxMP, val = d[key], label = key === 'hp' ? 'PV' : 'PM';
    return `<div class="arena-resource"><span>${label}</span><button type="button" class="arena-track ${key}" data-arena="${key}" data-id="${esc(x.id)}" aria-label="Ajustar ${label} de ${esc(d.name)} (${val}/${max})" ${d.missing ? 'disabled' : ''}><i style="width:${max ? clamp(100 * val / max, 0, 100) : 0}%"></i><b>${val}/${max}</b></button></div>`;
}

function arenaCard(x, a) {
    let d = arenaData(x);
    return `<article class="arena-card ${x.id === a.current ? 'selected' : ''} ${x.id === (a.sequenceCurrent ?? a.current) ? 'turn-owner' : ''} ${d.hp <= 0 ? 'down' : ''}" data-combatant="${esc(x.id)}" data-arena-preview="${esc(x.id)}" tabindex="0" aria-label="${esc(d.name)}, nível ${d.level}${d.hp <= 0 ? ', derrotado' : ''}"><img class="arena-portrait" src="${d.image}" alt=""><div class="arena-card-body"><div class="arena-card-title"><strong>${esc(d.name)}</strong><small>${d.missing ? 'Excluído' : d.hp <= 0 ? 'Derrotado' : 'Nv. ' + d.level}</small><button type="button" class="arena-condition-btn" data-arena="conditions" data-id="${esc(x.id)}" aria-label="Editar condições de ${esc(d.name)}" ${d.missing ? 'disabled' : ''}>✦</button></div>${arenaCompactBar(x, d, 'hp')}${arenaCompactBar(x, d, 'mp')}${arenaConditionStrip(x)}</div></article>`;
}

function arenaPreviewShow(el) {
    const x = arenaState()?.participants.find(p => p.id === el.dataset.arenaPreview);
    if (!x)
        return;
    const d = arenaData(x);
    let preview = arenaDialog.querySelector('#arenaPortraitPreview');
    if (!preview) {
        preview = document.createElement('div');
        preview.id = 'arenaPortraitPreview';
        preview.setAttribute('aria-hidden', 'true');
        arenaDialog.append(preview);
    }
    const names = arenaConditionNames(x);
    preview.innerHTML = `<img src="${d.image}" alt=""><div class="preview-info"><strong>${esc(d.name)}</strong>Nível ${d.level}${d.hp <= 0 ? ' · Derrotado' : ''}<br>PV ${d.hp}/${d.maxHP} · PM ${d.mp}/${d.maxMP}<br>CA ${d.ca} · INI ${x.initiative}<br>DESL. ${d.movement} m<div class="preview-conditions">${names.length ? 'Condições: ' + names.map(esc).join(', ') : 'Sem condições'}</div>${arenaConditionStrip(x)}</div>`;
    preview.classList.add('visible');
    const r = el.getBoundingClientRect(), w = preview.offsetWidth, h = preview.offsetHeight;
    let left = r.right + 9, top = r.top + (r.height - h) / 2;
    if (left + w > innerWidth - 8) {
        left = r.left - w - 9;
        if (left < 8) {
            left = r.left;
            top = r.bottom + 9;
            if (top + h > innerHeight - 8)
                top = r.top - h - 9;
        }
    }
    preview.style.left = clamp(left, 8, Math.max(8, innerWidth - w - 8)) + 'px';
    preview.style.top = clamp(top, 8, Math.max(8, innerHeight - h - 8)) + 'px';
}

function arenaPreviewHide() {
    arenaDialog.querySelector('#arenaPortraitPreview')?.classList.remove('visible');
}
arenaDialog.addEventListener('pointerover', e => {
    const el = e.target.closest('[data-arena-preview]');
    if (el && !el.contains(e.relatedTarget))
        arenaPreviewShow(el);
});
arenaDialog.addEventListener('pointerout', e => {
    const el = e.target.closest('[data-arena-preview]');
    if (el && !el.contains(e.relatedTarget))
        arenaPreviewHide();
});
arenaDialog.addEventListener('focusin', e => {
    const el = e.target.closest('[data-arena-preview]');
    if (el && !el.contains(e.relatedTarget))
        arenaPreviewShow(el);
});
arenaDialog.addEventListener('focusout', e => {
    const el = e.target.closest('[data-arena-preview]');
    if (el && !el.contains(e.relatedTarget))
        arenaPreviewHide();
});
arenaDialog.addEventListener('scroll', arenaPreviewHide, true);
window.addEventListener('resize', arenaPreviewHide);
function arenaChoose(id) {
    const a = arenaState(), x = a?.participants.find(x => x.id === id);
    if (!a || !x || a.current === id || conditionPending(a) || autoPending(a) || arenaAttackPending || powerRun || conditionRoll || pendingArenaRoll)
        return;
    if (!('sequenceCurrent' in a))
        a.sequenceCurrent = a.current;
    a.current = id;
    tcgSelecting = true;
    try {
        arenaSave();
    }
    finally {
        tcgSelecting = false;
    }
}
arenaDialog.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-combatant]')) {
        e.preventDefault();
        arenaChoose(e.target.dataset.combatant);
    }
});
window.addEventListener('scroll', arenaPreviewHide, { passive: true });
arenaDialog.addEventListener('submit', e => {
    if (e.target.id !== 'arenaSetup')
        return;
    e.preventDefault();
    const adding = arenaDialog.dataset.adding === '1', a = adding ? arenaState() : { round: 1, current: null, participants: [], log: [], serial: {} };
    if (!a)
        return;
    const players = [...e.target.querySelectorAll('[data-player-id]')].map(el => ({ p: state.characters.find(p => String(p.marketId) === el.dataset.playerId), side: el.querySelector('.arena-side').value })).filter(x => x.p);
    const beasts = [...e.target.querySelectorAll('[data-beast-id]')].map(el => ({ b: arenaAvailableBeasts().find(b => String(b.id) === el.dataset.beastId), count: Number(el.querySelector('.arena-qty').value), side: el.querySelector('.arena-side').value })).filter(x => x.b && Number.isInteger(x.count) && x.count > 0 && x.count <= 30);
    if (players.length + beasts.reduce((n, x) => n + x.count, 0) + a.participants.length > 60) {
        $('arenaError').textContent = 'Limite de 60 combatentes por batalha.';
        return;
    }
    if (!players.length && !beasts.length) {
        $('arenaError').textContent = 'Selecione ao menos um participante.';
        return;
    }
    if (!adding && (![...players, ...beasts].some(x => x.side === 'ally') || ![...players, ...beasts].some(x => x.side === 'enemy'))) {
        $('arenaError').textContent = 'Escolha ao menos um aliado e um inimigo.';
        return;
    }
    if (!adding) {
        a.scene = e.target.querySelector('[name=arenaScene]:checked')?.value || 'Floresta Lunar';
        if (e.target.dataset.sceneImage)
            a.sceneImage = e.target.dataset.sceneImage;
    }
    arenaAdd(a, players, beasts);
    if (adding && a.outcomeShown) {
        delete a.outcomeShown;
        arenaLog(a, 'Reforços chegaram: o combate continua.');
    }
    a.initiativePhase = adding ? 'reinforcements' : 'start';
    state.arena = a;
    arenaSave();
});
arenaDialog.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-arena]');
    const card = e.target.closest('[data-combatant]');
    if (!b && card && !e.target.closest('button,input,select,[aria-label].arena-condition-icon')) {
        arenaChoose(card.dataset.combatant);
        return;
    }
    if (!b || b.disabled)
        return;
    const key = b.dataset.arena, a = arenaState(), x = a?.participants.find(x => x.id === b.dataset.id);
    if (key === 'exit') {
        arenaDialog.close();
        return;
    }
    if (!a)
        return;
    if (key === 'initiative-roll') {
        arenaRollInitiative(a, x);
        return;
    }
    if (key === 'initiative-all') {
        arenaRollAll(a);
        return;
    }
    if (key === 'initiative-finish') {
        arenaFinishInitiative(a);
        return;
    }
    if (key === 'resume') {
        arenaRender();
        return;
    }
    if (key === 'add') {
        arenaSetup(true);
        return;
    }
    if (key === 'attack') {
        arenaAttackOpen();
        return;
    }
    if (key === 'skill' || key === 'spell') {
        powerOpen(key);
        return;
    }
    if (key === 'weapon') {
        powerWeaponOpen(a);
        return;
    }
    if (key === 'consumables') {
        arenaConsumablesOpen(a);
        return;
    }
    if (key === 'dice') {
        openRoll();
        return;
    }
    if (key === 'end') {
        battleSummaryOpen(a);
        return;
    }
    if (key === 'auto-resolve') {
        autoResolve(a);
        return;
    }
    if (key === 'condition-roll') {
        conditionResolve(a);
        return;
    }
    if (key === 'next') {
        if (a.outcomeShown)
            return battleSummaryOpen(a);
        arenaNext(a);
        arenaSave();
        if (conditionPending(a))
            conditionResolve(a);
        return;
    }
    if (!x)
        return;
    if (key === 'conditions') {
        arenaPreviewHide();
        arenaEditConditions(x, a);
        return;
    }
    if (key === 'choose') {
        arenaChoose(x.id);
        return;
    }
    if (key === 'hp' || key === 'mp') {
        arenaPreviewHide();
        let d = arenaData(x), max = key === 'hp' ? d.maxHP : d.maxMP, v = await openSiteDialog({ title: 'Ajustar ' + key.toUpperCase() + ' — ' + d.name, message: `Valor entre 0 e ${max}.`, value: d[key] });
        if (v === null || !Number.isSafeInteger(v) || arenaState() !== a || d.missing)
            return;
        v = clamp(v, 0, max);
        const before = d[key];
        d.source[key] = v;
        if (v !== before) {
            if (key === 'hp' && v < before)
                fxEmit(a, x, { kind: "damage", amount: before - v, defeated: v === 0, style: "plain" });
            else if (v > before)
                fxEmit(a, x, { kind: key === 'hp' ? 'heal' : 'mana', amount: v - before });
        }
        arenaLog(a, `${d.name}: ${key.toUpperCase()} ${before} → ${v}.`);
        if (!a.current && arenaAlive(x)) {
            a.current = x.id;
            if (!a.sequenceCurrent)
                a.sequenceCurrent = x.id;
        }
        arenaSave();
    }
});
let pendingArenaRoll = null;
function arenaInitiativePanel(a) {
    arenaDialog.classList.remove('tcg-live');
    const list = a.participants.filter(x => a.pendingInitiative?.includes(x.id)), remaining = list.filter(x => x.roll === null || x.roll === undefined).length;
    const reinforcement = a.initiativePhase === 'reinforcements';
    arenaDialog.innerHTML = `<div class="arena-head"><div><h1>⚔ Arena de Batalha</h1><small>${reinforcement ? 'Iniciativa dos reforços' : 'Preparar iniciativa'} · ${list.length - remaining}/${list.length} roladas</small></div><div class="arena-buttons"><button data-arena="exit">Voltar à ficha</button><button data-arena="end" class="arena-danger">Encerrar batalha</button></div></div><section class="arena-panel"><h2>Iniciativa dos combatentes</h2><small>Clique em Rolar D20 para cada combatente. A ordem será definida após todas as rolagens. Empates usam o maior bônus. O mestre poderá selecionar qualquer combatente durante a batalha.</small><div class="arena-init-grid">${list.map(x => {
        const d = arenaData(x), done = x.roll !== null && x.roll !== undefined;
        return `<article class="arena-init-card" data-side="${x.side}"><img src="${d.image}" alt=""><div><strong>${esc(d.name)}</strong><small>${x.side === 'ally' ? 'Aliado' : 'Inimigo'} · Iniciativa ${sign(x.bonus)}</small>${done ? `<b class="arena-init-result">${x.roll} ${sign(x.bonus)} = ${x.initiative}</b>` : '<small>Aguardando rolagem</small>'}</div><button data-arena="initiative-roll" data-id="${esc(x.id)}" ${done ? 'disabled' : ''}>${done ? '✓ Rolado' : '🎲 Rolar D20'}</button></article>`;
    }).join('')}</div><div class="arena-foot"><button type="button" data-arena="initiative-all" ${remaining ? '' : 'disabled'}>🎲 Rolar todas</button><small>${remaining ? `${remaining} rolagem(ns) pendente(s).` : 'Todos os resultados registrados.'}</small><button data-arena="initiative-finish" ${remaining || !list.length ? 'disabled' : ''}>${reinforcement ? 'Confirmar reforços' : 'Iniciar batalha'} ›</button></div></section>`;
}

function arenaRollInitiative(a, x) {
    if (!a.initiativePhase || !x || !a.pendingInitiative?.includes(x.id) || x.roll != null || pendingArenaRoll || $('diceDialog').open)
        return;
    openRoll();
    if (!$('diceDialog').open)
        return;
    $('diceTitle').textContent = 'Iniciativa — ' + arenaData(x).name;
    $('dicePick').hidden = true;
    $('diceClear').hidden = true;
    $('diceRoll').hidden = true;
    $('diceClose').disabled = true;
    pendingArenaRoll = { a, x };
    appendDie(20);
}

function arenaRenderRollDecision(pending) {
    const info = $('diceSummary');
    const old = $('arenaInitDecision');
    if (old)
        old.remove();
    const box = document.createElement('div');
    box.id = 'arenaInitDecision';
    box.className = 'dice-inline-decision';
    const result = pending.result;
    box.innerHTML = `<div class="dice-inline-text"><strong>${esc(arenaData(pending.x).name)}</strong><span>D20 ${result} ${sign(pending.x.bonus)} = ${result + pending.x.bonus}</span></div><div class="dice-inline-actions"><button type="button" data-arena-roll-decision="cancel">Cancelar</button><button type="button" class="dice-confirm-primary" data-arena-roll-decision="confirm">Confirmar</button></div>`;
    info.after(box);
    $('diceClose').disabled = true;
}
function finishArenaRoll() {
    const pending = pendingArenaRoll;
    if (!pending || pending.awaitingDecision || tableDice.length !== 1 || !tableDice[0].done)
        return;
    pending.result = tableDice[0].n;
    pending.awaitingDecision = true;
    arenaRenderRollDecision(pending);
}
function arenaResolveRollDecision(ok) {
    const pending = pendingArenaRoll;
    if (!pending)
        return;
    const { a, x, result } = pending;
    pendingArenaRoll = null;
    $('arenaInitDecision')?.remove();
    $('diceClose').disabled = false;
    $('diceDialog').close();
    if (!ok || arenaState() !== a || !a.initiativePhase || !a.pendingInitiative?.includes(x.id) || x.roll != null) {
        arenaRender();
        return;
    }
    x.roll = result;
    x.initiative = x.roll + x.bonus;
    arenaLog(a, `${arenaData(x).name} — iniciativa ${x.roll} ${sign(x.bonus)} = ${x.initiative}.`);
    arenaSave();
    arenaRender();
}
async function arenaRollAll(a) {
    if (!a?.initiativePhase || pendingArenaRoll || $('diceDialog').open) return;
    const list = a.participants.filter(x => a.pendingInitiative?.includes(x.id) && x.roll == null);
    if (!list.length) return;
    const rolled = list.map(x => ({ x, roll: 1 + Math.floor(Math.random() * 20) }));
    const report = rolled.map(({x,roll}) => `${arenaData(x).name}: ${roll} ${sign(x.bonus)} = ${roll + x.bonus}`).join('\n');
    const ok = await openSiteDialog({ title: 'Rolar todas as iniciativas', message: report + '\n\nConfirmar todas as rolagens?', confirm: true });
    if (!ok || arenaState() !== a || !a.initiativePhase) return;
    for (const {x,roll} of rolled) {
        if (x.roll != null || !a.pendingInitiative?.includes(x.id)) continue;
        x.roll = roll;
        x.initiative = roll + x.bonus;
        arenaLog(a, `${arenaData(x).name} — iniciativa ${roll} ${sign(x.bonus)} = ${x.initiative}.`);
    }
    arenaSave();
}
$('diceDialog').addEventListener('click', e => {
    const b = e.target.closest('[data-arena-roll-decision]');
    if (!b)
        return;
    arenaResolveRollDecision(b.dataset.arenaRollDecision === 'confirm');
});
$('diceDialog').addEventListener('cancel', e => {
    if (pendingArenaRoll)
        e.preventDefault();
});
function arenaFinishInitiative(a) {
    if (!a.initiativePhase || !a.pendingInitiative?.length || a.participants.some(x => a.pendingInitiative.includes(x.id) && x.roll == null))
        return;
    const initial = a.initiativePhase === 'start';
    delete a.initiativePhase;
    delete a.pendingInitiative;
    arenaSort(a);
    arenaLog(a, initial ? 'Batalha iniciada.' : 'Reforços adicionados.');
    if (!a.current) {
        a.sequenceCurrent = a.current = a.participants.find(arenaAlive)?.id || null;
        if (a.current)
            arenaLog(a, `Turno de ${arenaData(arenaCurrent(a)).name}.`);
    }
    arenaSave();
    if (initial) {
        const cur = arenaCurrent(a);
        if (cur) {
            clockTickCooldown(cur, 'Turnos próprios');
            conditionBeginTurn(a, cur);
            powerStartTurn(cur);
            passiveStartTurn(cur);
            autoSkills(a, cur, 'No início do próprio turno', null);
            arenaSave();
        }
        arenaBattleIntro();
    }
}

function arenaBattleIntro() {
    if (document.getElementById('arenaIntro'))
        return;
    const intro = document.createElement('dialog');
    intro.id = 'arenaIntro';
    intro.setAttribute('aria-label', 'Início da batalha');
    intro.innerHTML = `<div class="intro-scene"><div class="intro-core"><svg class="intro-emblem" viewBox="0 0 160 160" aria-hidden="true"><defs><linearGradient id="introSteel"><stop stop-color="#777b80"/><stop offset=".5" stop-color="#fff4d6"/><stop offset="1" stop-color="#8a8b91"/></linearGradient><g id="introBlade"><path d="M80 9 89 27 86 100 74 100 71 27Z" fill="url(#introSteel)" stroke="#d8c39a"/><path d="M80 15V98" stroke="#94856d" fill="none"/><path d="M60 101Q80 94 100 101L98 109 62 109Z" fill="#ac7837" stroke="#e9c477" stroke-width="2"/><rect x="75" y="109" width="10" height="26" rx="3" fill="#443024" stroke="#b88b50"/><path d="M75 115H85M75 122H85M75 129H85" stroke="#a47742"/><circle cx="80" cy="139" r="7" fill="#b5894b" stroke="#f1d28d"/></g></defs><g class="intro-sword-a"><use href="#introBlade" transform="rotate(-43 80 80)"/></g><g class="intro-sword-b"><use href="#introBlade" transform="rotate(43 80 80)"/></g></svg><div class="intro-line"></div><div class="intro-title">BATALHA!</div><div class="intro-line"></div></div><button type="button" class="intro-skip">Pular ›</button></div>`;
    document.body.append(intro);
    let timer, horn;
    function stopHorn() {
        if (horn) {
            horn.pause();
            horn.currentTime = 0;
            horn = null;
        }
    }
    function closeIntro() {
        stopHorn();
        if (intro.open)
            intro.close();
    }
    intro.addEventListener('close', () => {
        clearTimeout(timer);
        stopHorn();
        intro.remove();
    }, { once: true });
    intro.addEventListener('cancel', e => {
        e.preventDefault();
        closeIntro();
    });
    intro.querySelector('button').onclick = closeIntro;
    intro.showModal();
    if (state.volume) {
        try {
            horn = new Audio('assets/audio/93d55b1120b3d9809c96223f.mp3');
            horn.volume = clamp(state.volume / 100, 0, 1);
            horn.play().catch(() => {
            });
        }
        catch {
        }
    }
    timer = setTimeout(closeIntro, matchMedia('(prefers-reduced-motion: reduce)').matches ? 850 : 2600);
}
arenaDialog.addEventListener('close', () => {
    document.body.classList.remove('arena-view');
    persist();
    render();
    window.scrollTo(0, arenaSheetScroll);
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && arenaDialog.open && !Array.from(document.querySelectorAll('dialog[open]')).some(d => d !== arenaDialog)) {
        e.preventDefault();
        arenaDialog.close();
    }
});
// Arena: ataques básicos, separados das habilidades e efeitos especiais.
let arenaAttackPending = null;
const arenaAttackDialog = document.createElement('dialog');
arenaAttackDialog.id = 'arenaAttackDialog';
arenaAttackDialog.className = 'site-dialog';
document.body.append(arenaAttackDialog);
function arenaAttackOptions(x) {
    if (x.kind === 'beast')
        return (x.beast.attacks || []).map((w, i) => ({
            key: String(i), name: w.name, dice: w.dice, hit: number(w.hitBonus) + powerBonus(x, 'Acerto'), fixed: powerBonus(x, 'Dano'), target: w.target || 'Inimigos', requiresHit: w.requiresHit !== false, cost: Math.max(0, number(w.cost)), cooldown: Math.max(0, number(w.cooldown)), cooldownUnit: clockUnit(w.cooldownUnit), spec: w
        }));
    const p = arenaPlayer(x), w = p && activeWeapon(p);
    if (!w || w.basicAttack === false)
        return [];
    const wi = names.indexOf(w.attribute), i = w.attack === 'Físico' ? 2 : w.attack === 'Distância' ? 3 : wi >= 3 ? wi + 1 : 4, stat = combatStat(p, i), charged = chargeReady(w);
    return [{
            key: 'weapon', name: w.name, dice: w.damage, hit: stat.mod + stat.level + powerBonus(x, 'Acerto') + powerModDelta(x, stat.attribute), target: 'Inimigos', requiresHit: true, cost: 0, weapon: w, blocked: stat.blocked, charged, extraDamage: charged ? w.charges.damage : null, fixed: equipmentBonus(p, 'Dano') + powerBonus(x, 'Dano')
        }];
}

function arenaAttackTargets(a, x, opt) {
    return a.participants.filter(t => arenaAlive(t) && (opt.target === 'Próprio conjurador' ? t === x : opt.target === 'Aliados' ? t.side === x.side : opt.target === 'Qualquer personagem' ? true : t.side !== x.side));
}

function arenaAttackOpen(preselected = null) {
    const a = arenaState(), x = a && arenaCurrent(a);
    if (!conditionCanAct(a, x) || a.initiativePhase || arenaAttackPending)
        return;
    arenaPreviewHide();
    const options = arenaAttackOptions(x);
    if (!options.length) {
        toast('Nenhuma arma ativa ou ataque cadastrado.');
        return;
    }
    arenaAttackDialog.innerHTML = `<form><h2>Atacar — ${esc(arenaData(x).name)}</h2><label>Ataque<select name="attack">${options.map(o => `<option value="${esc(o.key)}">${esc(o.name)}</option>`).join('')}</select></label><label>Alvo<select name="target"></select></label><p class="attack-info"></p><p class="attack-error" role="alert"></p><div class="arena-buttons"><button type="submit">Rolar ataque</button><button type="button" data-close>Cancelar</button></div></form>`;
    const f = arenaAttackDialog.querySelector('form'), refresh = () => {
        const o = options.find(z => z.key === f.elements.attack.value), targets = arenaAttackTargets(a, x, o), sel = f.elements.target, old = sel.value;
        sel.innerHTML = targets.map(t => `<option value="${esc(t.id)}">${esc(arenaData(t).name)} · CA ${arenaData(t).ca}${conditionHas(x, 'Cego') ? ' (+5 pela cegueira)' : ''}</option>`).join('');
        if (targets.some(t => t.id === old))
            sel.value = old;
        f.querySelector('.attack-info').textContent = `${o.requiresHit ? 'D20 ' + sign(o.hit + number(conditionList(x).find(v => v.kind === 'Concentrando')?.focus)) : 'Sem teste de acerto'} · Dano ${diceText(o.dice)}${o.charged ? ' + ' + diceText(o.extraDamage) + ' (carga)' : ''}${o.cost ? ' · ' + o.cost + ' PM' : ''}`;
        const err = o.blocked ? 'Munição insuficiente.' : arenaData(x).mp < o.cost ? 'PM insuficientes.' : !targets.length ? 'Nenhum alvo disponível.' : number(x.cooldowns?.[o.key]) > 0 ? 'Ataque em recarga.' : '';
        f.querySelector('.attack-error').textContent = err;
        f.querySelector('[type=submit]').disabled = !!err;
    };
    f.elements.attack.onchange = refresh;
    f.querySelector('[data-close]').onclick = () => arenaAttackDialog.close();
    f.onsubmit = e => {
        e.preventDefault();
        const opt = arenaAttackOptions(x).find(z => z.key === f.elements.attack.value), t = a.participants.find(z => z.id === f.elements.target.value);
        if (!opt || !arenaAttackTargets(a, x, opt).includes(t) || arenaState() !== a || arenaCurrent(a) !== x || !conditionCanAct(a, x) || opt.blocked || arenaData(x).mp < opt.cost || number(x.cooldowns?.[opt.key]) > 0)
            return;
        arenaAttackDialog.close();
        arenaAttackStart(a, x, t, opt);
    };
    if (preselected !== null && options[preselected]) {
        f.elements.attack.value = options[preselected].key;
        f.elements.attack.closest('label').hidden = true;
    }
    refresh();
    arenaAttackDialog.showModal();
}

function arenaDamageDice(o, crit) {
    const dice = [];
    for (const d of DICE_KINDS) {
        let n = Math.max(0, Math.trunc(number(o.dice?.[d]))) + Math.max(0, Math.trunc(number(o.extraDamage?.[d])));
        for (let j = 0; j < Math.min(161, n * (crit ? 2 : 1)) && dice.length < 161; j++)
            dice.push(d);
    }
    return { dice, fixed: number(o.dice?.fixed) + number(o.extraDamage?.fixed) + number(o.fixed) };
}

function arenaAttackStart(a, x, t, o) {
    if ($('diceDialog').open || arenaAttackPending || !conditionCanAct(a, x) || !arenaAttackTargets(a, x, o).includes(t) || o.blocked || arenaData(x).mp < number(o.cost) || number(x.cooldowns?.[o.key]) > 0)
        return;
    const d = arenaDamageDice(o, true);
    if (d.dice.length > 160)
        return toast('Ataque com dados demais. Ajuste o cadastro.');
    openRoll();
    if (!$('diceDialog').open)
        return;
    const focus = conditionList(x).find(v => v.kind === 'Concentrando');
    o = { ...o, hit: o.hit + (o.requiresHit ? number(focus?.focus) : 0) };
    if (focus && o.requiresHit)
        conditionRemove(a, x, 'Concentrando', 'consumido pelo ataque');
    const r = arenaAttackPending = { a, x, t, o, phase: 'hit', sum: 0, maxDie: false, effectArmed: !!o.weapon?.chargeArmed };
    $('diceTitle').textContent = 'Ataque — ' + arenaData(x).name + ' → ' + arenaData(t).name;
    $('dicePick').hidden = true;
    $('diceClear').hidden = true;
    $('diceRoll').hidden = true;
    $('diceClose').disabled = true;
    const w = o.weapon;
    if (w?.ammo?.enabled)
        w.ammo.current -= Math.max(1, number(w.ammo.cost));
    if (o.charged && w) {
        if (w.charges.trigger === 'Ao atacar' && (number(w.charges.hit) !== 0 || diceText(o.extraDamage) !== '0'))
            w.charges.current -= Math.max(1, number(w.charges.cost));
        w.chargeArmed = false;
    }
    if (o.cost)
        arenaData(x).source.mp -= o.cost;
    if (o.cooldown)
        clockCooldown(x, o.key, o.cooldown, o.cooldownUnit);
    persist();
    if (o.requiresHit)
        appendDie(20);
    else
        arenaAttackHit(r, null);
}

function arenaAttackSummary(text, total) {
    const el = $('diceSummary');
    el.textContent = text;
    if (total !== undefined) {
        const strong = document.createElement('strong');
        strong.className = 'roll-total';
        strong.textContent = String(total);
        el.append(strong);
    }
}

function arenaAttackNextButton(label, fn) {
    const b = $('arenaDamageNext');
    b.hidden = false;
    b.textContent = label;
    b.onclick = () => {
        b.hidden = true;
        fn();
    };
}

function arenaAttackEnd() {
    arenaAttackPending = null;
    $('arenaDamageNext').hidden = true;
    $('diceClose').disabled = false;
    arenaSave();
}

function arenaAttackHit(r, n) {
    const ca = arenaData(r.t).ca + (conditionHas(r.x, 'Cego') ? 5 : 0), total = n === null ? null : n + r.o.hit, hit = n === null || total > ca;
    r.critical = n === 20 && hit;
    const log = `${arenaData(r.x).name} — ${r.o.name} contra ${arenaData(r.t).name}: ${n === null ? 'sem teste' : `${n} ${sign(r.o.hit)} = ${total} contra CA ${ca}`} · ${hit ? (r.critical ? 'CRÍTICO' : 'acerto') : 'falha'}.`;
    arenaLog(r.a, log);
    arenaAttackSummary(log, total ?? undefined);
    if (!hit) {
        fxEmit(r.a, r.t, { kind: "miss", source: r.x.id, style: fxAttackStyle(r.o) });
        effectDispatch(r, false, 0);
        arenaAttackEnd();
        return;
    }
    r.phase = 'ready';
    const d = arenaDamageDice(r.o, r.critical);
    r.remaining = d.dice;
    r.fixed = d.fixed;
    if (r.o.charged && r.o.weapon?.charges.trigger === 'Quando ativa o efeito' && (number(r.o.weapon.charges.hit) !== 0 || diceText(r.o.extraDamage) !== '0'))
        r.o.weapon.charges.current -= Math.max(1, number(r.o.weapon.charges.cost));
    persist();
    arenaAttackNextButton('Rolar dano', () => arenaAttackDamageBatch(r));
}

function arenaAttackDamageBatch(r) {
    r.phase = 'damage';
    clearDiceTable();
    $('diceTitle').textContent = r.critical ? 'Dano crítico — ' + r.o.name : 'Dano — ' + r.o.name;
    const batch = r.remaining.splice(0, 40);
    if (batch.length)
        for (const d of batch)
            appendDie(d);
    else
        arenaAttackFinishDamage(r);
}

function arenaAttackFinishDamage(r) {
    const damage = Math.max(0, r.sum + r.fixed - (conditionHas(r.x, 'Exausto') ? 5 : 0)), { d, before, after } = conditionDamage(r.a, r.t, damage, r.maxDie, r.critical, { source: r.x.id, style: fxAttackStyle(r.o), label: r.o.name });
    arenaLog(r.a, `${d.name} recebeu ${before - after} de dano (${before} → ${after} PV).`);
    if (before > 0 && after === 0) {
        arenaLog(r.a, `${d.name} foi derrotado por ${arenaData(r.x).name}.`);
        if (r.x.kind === 'player' && r.x.side !== r.t.side) {
            const p = arenaPlayer(r.x);
            p.kills = killCount(p) + 1;
            playResourceSound('kill');
        }
    }
    else if (before > after)
        playResourceSound('damage');
    arenaAttackSummary(`Dados: ${r.sum} ${sign(r.fixed)} fixo${conditionHas(r.x, 'Exausto') ? ' −5 exaustão' : ''} · ${d.name}: ${before} → ${after} PV`, damage);
    effectDispatch(r, true, before - after);
    arenaAttackEnd();
}

function arenaAttackDiceDone() {
    const r = arenaAttackPending;
    if (!r || !tableDice.length || tableDice.some(t => !t.done))
        return;
    if (r.phase === 'hit')
        arenaAttackHit(r, tableDice[0].n);
    else if (r.phase === 'damage') {
        r.sum += tableDice.reduce((n, d) => n + d.n, 0);
        r.maxDie ||= tableDice.some(d => d.n === d.d);
        if (r.remaining.length) {
            r.phase = 'ready';
            arenaAttackSummary('Dano parcial: ' + r.sum);
            arenaAttackNextButton('Rolar dados restantes', () => arenaAttackDamageBatch(r));
        }
        else
            arenaAttackFinishDamage(r);
    }
}
$('diceDialog').addEventListener('cancel', e => {
    if (arenaAttackPending)
        e.preventDefault();
});
// Condições de combate: dados por participante, sem alterar os modelos do Bestiário.
// ==============================================================================
// RELÓGIO, CONDIÇÕES E RECARGAS
// ==============================================================================
const conditionRules = {
    Atordoado: '−5 CA', Caído: 'Não pode agir até ser removido', Paralisado: 'CA = 0', Cego: 'Acerto exige superar CA + 5', Amedrontado: '−5 deslocamento', Imobilizado: 'Deslocamento = 0', Exausto: '−5 dano (mínimo 0)', Concentrando: '+2 de acerto por turno após o primeiro; consumido no ataque', Envenenado: 'Dano periódico', Queimando: 'Dano periódico'
};
const CLOCK_UNITS = ['Turnos próprios', 'Rodadas'];
function clockUnit(v) {
    return v === 'Rodadas' ? 'Rodadas' : 'Turnos próprios';
}

function clockText(n, unit) {
    return number(n) + ' ' + (clockUnit(unit) === 'Rodadas' ? 'rodada(s)' : 'turno(s) próprios');
}

function clockSelect(name, value, label = 'Unidade de tempo') {
    return selectField(label, name, CLOCK_UNITS, clockUnit(value));
}

function clockCooldown(x, key, n, unit) {
    x.cooldowns ??= {};
    x.cooldownUnits ??= {};
    x.cooldowns[key] = number(n) + 1;
    x.cooldownUnits[key] = clockUnit(unit);
}

function clockTickCooldown(x, unit) {
    for (const k of Object.keys(x?.cooldowns || {}))
        if (clockUnit(x.cooldownUnits?.[k]) === unit)
            x.cooldowns[k] = Math.max(0, x.cooldowns[k] - 1);
}

function clockTimed(mode) {
    return CLOCK_UNITS.includes(mode);
}

function clockStamp(a, v) {
    if (clockUnit(v.durationUnit) === 'Rodadas')
        v.roundApplied = number(a.round);
    return v;
}

function clockRound(a) {
    const completed = number(a.round) - 1;
    for (const x of a.participants) {
        clockTickCooldown(x, 'Rodadas');
        for (const v of [...conditionList(x)]) {
            if (clockUnit(v.durationUnit) === 'Rodadas' && v.remaining != null && number(v.roundApplied) < completed) {
                v.remaining--;
                if (v.remaining <= 0)
                    conditionRemove(a, x, v.kind, 'expirou');
            }
        }
        const old = powerBuffs(x);
        x.powerBuffs = old.filter(b => {
            if (clockUnit(b.durationUnit) === 'Rodadas' && b.remaining != null && number(b.roundApplied) < completed)
                b.remaining--;
            return b.remaining == null || b.remaining > 0;
        });
        for (const b of old)
            if (!x.powerBuffs.includes(b))
                arenaLog(a, `${arenaData(x).name}: bônus de ${b.kind} expirou.`);
        for (const [id, v] of Object.entries(x.activePassives || {}))
            if (clockUnit(v.durationUnit) === 'Rodadas' && v.remaining != null && number(v.roundApplied) < completed && --v.remaining <= 0)
                passiveOff(a, x, powerList(x, 'skill').find(s => s.id === id) || { id, name: 'Habilidade passiva' });
        const d = arenaData(x);
        if (d.source) {
            d.source.hp = Math.min(d.source.hp, d.maxHP);
            d.source.mp = Math.min(d.source.mp, d.maxMP);
        }
    }
    for (const x of a.participants) {
        if (!arenaAlive(x))
            continue;
        for (const v of conditionList(x)) {
            if (v.resistance === 'eachRound')
                conditionQueue(a, x, v, 'repeat');
            if (conditionDot(v.kind) && clockUnit(v.dotUnit) === 'Rodadas')
                conditionQueue(a, x, v, 'dot');
        }
    }
}

function conditionList(x) {
    if (!x)
        return [];
    let old = Array.isArray(x.conditions) ? x.conditions : [];
    if (old.some(v => typeof v === 'string' || !v?.kind || !v.id)) {
        x.conditions = old.map(v => {
            let k = typeof v === 'string' ? v : v?.kind || v?.condition || v?.name;
            return { kind: k, id: itemId(), remaining: null, resistance: 'none', attr: names[2], dc: 10, dice: { fixed: 0 }, focus: 0, started: false, ...(typeof v === 'object' ? v : {}), kind: k };
        }).filter(v => CONDITION_KINDS.includes(v.kind));
    }
    else
        x.conditions = old;
    return x.conditions;
}

const conditionHas = (x, k) => arenaConditionNames(x || {}).includes(k);
const conditionDot = k => k === 'Envenenado' || k === 'Queimando';
function conditionRemove(a, x, k, why) {
    x.conditions = conditionList(x).filter(v => v.kind !== k);
    arenaLog(a, `${arenaData(x).name}: ${k} ${why}.`);
}

function conditionPut(a, x, v) {
    if (conditionHas(x, v.kind))
        return false;
    conditionList(x).push(clockStamp(a, v));
    fxEmit(a, x, { kind: "condition", label: v.kind, style: v.kind === 'Envenenado' ? 'poison' : v.kind === 'Queimando' ? 'fire' : 'arcane' });
    arenaLog(a, `${arenaData(x).name}: ${v.kind} aplicado${v.remaining === null ? '' : ` (${clockText(v.remaining, v.durationUnit)})`}.`);
    return true;
}

function conditionAttrBase(x, attr) {
    const i = names.indexOf(attr);
    return Rules.mod(number((x.kind === 'player' ? effectiveAttrs(arenaPlayer(x)) : x.beast.attrs)[i < 0 ? 2 : i]));
}

function conditionAttr(x, attr) {
    return powerAttr(x, attr);
}

function conditionQueue(a, x, v, type) {
    a.conditionTasks ??= [];
    a.conditionTasks.push({ id: itemId(), target: x.id, condition: v.id, kind: v.kind, type, config: cloneItem(v) });
}

function conditionTasks(a) {
    return a?.conditionTasks || [];
}

function conditionPending(a) {
    return conditionTasks(a).length > 0;
}

function conditionCanAct(a, x) {
    return !!a && arenaState() === a && !a.initiativePhase && !a.outcomeShown && arenaAlive(x) && !conditionHas(x, 'Caído') && !conditionPending(a) && !autoPending(a) && !arenaAttackPending && !powerRun && !conditionRoll && !pendingArenaRoll;
}

function conditionBeginTurn(a, x) {
    if (!x)
        return;
    for (const v of conditionList(x)) {
        v.tick = true;
        if (v.kind === 'Concentrando') {
            if (v.started)
                v.focus = number(v.focus) + 2;
            v.started = true;
            arenaLog(a, `${arenaData(x).name}: concentração ${sign(v.focus || 0)} no próximo acerto.`);
        }
        if (v.resistance === 'each')
            conditionQueue(a, x, v, 'repeat');
        if (conditionDot(v.kind) && clockUnit(v.dotUnit) !== 'Rodadas')
            conditionQueue(a, x, v, 'dot');
    }
}

function conditionEndTurn(a, x) {
    if (!x)
        return;
    for (const v of [...conditionList(x)]) {
        if (!v.tick)
            continue;
        v.tick = false;
        if (clockUnit(v.durationUnit) !== 'Rodadas' && v.remaining !== null && v.remaining !== undefined) {
            v.remaining--;
            if (v.remaining <= 0)
                conditionRemove(a, x, v.kind, 'expirou');
        }
    }
}

function conditionTurnNext(a) {
    if (a.outcomeShown || a.initiativePhase || arenaAttackPending || powerRun || conditionRoll || pendingArenaRoll || conditionPending(a) || autoPending(a))
        return;
    const old = a.participants.find(x => x.id === (a.sequenceCurrent ?? a.current));
    if (a.autoEndTurn !== old?.id) {
        autoSkills(a, old, 'No fim do próprio turno', null);
        if (autoPending(a)) {
            a.autoEndTurn = old?.id;
            return;
        }
    }
    delete a.autoEndTurn;
    conditionEndTurn(a, old);
    powerExpire(a, old);
    passiveEndTurn(a, old);
    arenaNextOriginal(a);
    const cur = arenaCurrent(a);
    if (cur) {
        conditionBeginTurn(a, cur);
        powerStartTurn(cur);
        passiveStartTurn(cur);
        autoSkills(a, cur, 'No início do próprio turno', null);
    }
}

function conditionDamage(a, x, damage, maxDie = false, critical = false, visual = {}) {
    const d = arenaData(x), before = d.hp, after = Math.max(0, before - Math.max(0, damage));
    d.source.hp = after;
    fxEmit(a, x, { kind: "damage", amount: before - after, critical, defeated: before > 0 && after === 0, ...visual });
    if (before > after && (maxDie || critical) && conditionHas(x, 'Concentrando'))
        conditionRemove(a, x, 'Concentrando', 'interrompido pelo dano');
    return { before, after, d };
}

let conditionRoll = null;
function conditionTaskValid(a, t) {
    const x = a.participants.find(x => x.id === t.target);
    return x && arenaAlive(x) && (t.type === 'initial' ? !conditionHas(x, t.kind) : conditionList(x).some(v => v.id === t.condition));
}

function conditionPrune(a) {
    while (conditionTasks(a).length && !conditionTaskValid(a, a.conditionTasks[0]))
        a.conditionTasks.shift();
}

function conditionResolve(a) {
    if (!a || conditionRoll || $('diceDialog').open)
        return;
    conditionPrune(a);
    if (!conditionPending(a)) {
        arenaSave();
        return;
    }
    const task = a.conditionTasks[0], x = a.participants.find(x => x.id === task.target), v = task.config;
    openRoll();
    if (!$('diceDialog').open)
        return;
    $('dicePick').hidden = true;
    $('diceClear').hidden = true;
    $('diceRoll').hidden = true;
    $('diceClose').disabled = true;
    conditionRoll = { a, task, x, phase: 'rolling' };
    const r = conditionRoll;
    const dot = task.type === 'dot';
    $('diceTitle').textContent = (dot ? 'Dano por ' + task.kind : 'Resistência — ' + task.kind) + ' · ' + arenaData(x).name;
    if (task.result !== undefined) {
        r.phase = 'ready';
        conditionShowResult(r);
        return;
    }
    if (!dot) {
        appendDie(20);
        return;
    }
    r.fixed = number(v.dice?.fixed);
    r.remaining = [];
    for (const d of DICE_KINDS)
        for (let j = 0; j < Math.min(40, Math.max(0, Math.trunc(number(v.dice?.[d])))); j++)
            r.remaining.push(d);
    r.sum = 0;
    r.maxDie = false;
    conditionBatch(r);
}

function conditionBatch(r) {
    r.phase = 'rolling';
    clearDiceTable();
    $('diceTitle').textContent = 'Dano por ' + r.task.kind + ' · ' + arenaData(r.x).name;
    const batch = r.remaining.splice(0, 40);
    if (batch.length)
        batch.forEach(appendDie);
    else
        conditionFinishRoll(r);
}

function conditionDiceDone() {
    const r = conditionRoll;
    if (!r || r.phase !== 'rolling' || !tableDice.length || tableDice.some(d => !d.done))
        return;
    if (r.task.type === 'dot') {
        r.sum += tableDice.reduce((s, d) => s + d.n, 0);
        r.maxDie ||= tableDice.some(d => d.n === d.d);
        if (r.remaining.length) {
            r.phase = 'batch';
            arenaAttackSummary('Dano parcial: ' + r.sum);
            arenaAttackNextButton('Rolar dados restantes', () => conditionBatch(r));
            return;
        }
    }
    else
        r.sum = tableDice[0].n;
    conditionFinishRoll(r);
}

function conditionFinishRoll(r) {
    r.task.result = r.task.type === 'dot' ? Math.max(0, r.sum + r.fixed) : r.sum;
    r.task.maxDie = !!r.maxDie;
    r.phase = 'ready';
    persist();
    conditionShowResult(r);
}

function conditionShowResult(r) {
    const { task, x } = r;
    const dot = task.type === 'dot', mod = dot ? 0 : conditionAttr(x, task.config.attr), total = task.result + mod;
    arenaAttackSummary(dot ? `${task.kind}: ${total} de dano. Confirme para aplicar.` : `D20 ${task.result} ${sign(mod)} = ${total} contra CD ${task.config.dc} · ${total > task.config.dc ? 'Resistiu' : 'Falhou'}`, total);
    arenaAttackNextButton(dot ? 'Aplicar dano' : 'Confirmar resistência', () => conditionCommit(r));
}

function conditionCommit(r) {
    const { a, task, x } = r;
    if (arenaState() !== a || a.conditionTasks[0]?.id !== task.id)
        return;
    if (conditionTaskValid(a, task)) {
        if (task.type === 'dot') {
            const { before, after, d } = conditionDamage(a, x, task.result, task.maxDie, false, { style: task.kind === 'Envenenado' ? 'poison' : 'fire' });
            arenaLog(a, `${d.name}: ${task.kind} causou ${before - after} de dano (${before} → ${after} PV).`);
            if (before > after)
                playResourceSound('damage');
            if (before > 0 && after === 0)
                effectCredit(a, a.participants.find(y => y.id === task.config.sourceId), x, before, after);
        }
        else {
            const total = task.result + conditionAttr(x, task.config.attr), ok = total > task.config.dc;
            arenaLog(a, `${arenaData(x).name}: resistência a ${task.kind} ${total} contra CD ${task.config.dc} — ${ok ? 'sucesso' : 'falha'}.`);
            if (task.type === 'initial') {
                if (!ok)
                    conditionPut(a, x, task.config);
            }
            else if (ok)
                conditionRemove(a, x, task.kind, 'removido pela resistência');
        }
    }
    a.conditionTasks.shift();
    conditionPrune(a);
    conditionRoll = null;
    $('arenaDamageNext').hidden = true;
    $('diceClose').disabled = false;
    arenaSave();
    $('diceDialog').close();
}
$('diceDialog').addEventListener('cancel', e => {
    if (conditionRoll)
        e.preventDefault();
});
function conditionDetails(v) {
    return `${v.kind} · ${conditionRules[v.kind]}${v.kind === 'Concentrando' ? ' (' + sign(number(v.focus)) + ')' : ''} · ${v.remaining == null ? 'até remoção' : clockText(v.remaining, v.durationUnit)}${conditionDot(v.kind) ? ' · ' + diceText(v.dice) + ' a cada ' + (clockUnit(v.dotUnit) === 'Rodadas' ? 'rodada' : 'turno do afetado') : ''}${v.resistance && v.resistance !== 'none' ? ' · ' + v.attr + ' CD ' + v.dc + (v.resistance === 'each' ? ' a cada turno' : v.resistance === 'eachRound' ? ' a cada rodada' : ' inicial') : ''}`;
}

function conditionEdit(x, a) {
    if (conditionPending(a)) {
        toast('Resolva as condições pendentes primeiro.');
        return;
    }
    const dlg = arenaConditionDialog, active = conditionList(x);
    dlg.innerHTML = `<form id="arenaConditionForm"><h2>Condições — ${esc(arenaData(x).name)}</h2><div class="condition-active">${active.map(v => `<div>${arenaConditionIcon(v.kind)} <span>${esc(conditionDetails(v))}</span><button type="button" data-remove-condition="${esc(v.kind)}">Remover</button></div>`).join('') || '<small>Sem condições ativas.</small>'}</div><h3>Aplicar condição</h3><label>Condição<select name="kind">${CONDITION_KINDS.filter(k => !conditionHas(x, k)).map(k => `<option>${esc(k)}</option>`).join('')}</select></label><small id="conditionRule"></small><label>Duração (0 = até remoção)<input name="turns" type="number" min="0" max="999" value="0" required></label>${clockSelect('durationUnit', null, 'Contar duração em')}<label>Resistência<select name="resistance"><option value="none">Nenhuma</option><option value="initial">Inicial</option><option value="each">Inicial e a cada turno próprio</option><option value="eachRound">Inicial e a cada rodada</option></select></label><div id="conditionResistance" class="condition-fields" hidden><label>Atributo<select name="attr">${names.map((n, i) => `<option ${i === 2 ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label><label>CD<input name="dc" type="number" step="1" min="0" max="999" value="10" required></label></div><div id="conditionDamage" hidden><h3>Dano periódico</h3>${clockSelect('dotUnit', null, 'Dano periódico a cada')}<div class="condition-fields">${[...DICE_KINDS, 'fixed'].map(d => `<label>${d === 'fixed' ? 'Fixo' : 'D' + d}<input name="d${d}" type="number" min="0" max="${d === 'fixed' ? 99999 : 40}" value="0" required></label>`).join('')}</div></div><p id="conditionError" role="alert"></p><div class="condition-actions"><button type="button" data-condition-close>Fechar</button><button type="submit">Aplicar</button></div></form>`;
    const f = dlg.querySelector('form'), change = () => {
        const k = f.elements.kind.value;
        $('conditionRule').textContent = conditionRules[k] || 'Todas as condições já estão ativas.';
        $('conditionDamage').hidden = !conditionDot(k);
        $('conditionResistance').hidden = f.elements.resistance.value === 'none';
        f.querySelector('[type=submit]').disabled = !k;
    };
    f.elements.kind.onchange = change;
    f.elements.resistance.onchange = change;
    f.querySelector('[data-condition-close]').onclick = () => dlg.close();
    f.querySelectorAll('[data-remove-condition]').forEach(b => b.onclick = () => {
        conditionRemove(a, x, b.dataset.removeCondition, 'removido pelo mestre');
        arenaSave();
        dlg.close();
        conditionEdit(x, a);
    });
    f.onsubmit = e => {
        e.preventDefault();
        if (arenaState() !== a || conditionPending(a))
            return;
        const k = f.elements.kind.value;
        if (!CONDITION_KINDS.includes(k) || conditionHas(x, k))
            return;
        const turns = Number(f.elements.turns.value), dice = Object.fromEntries([...DICE_KINDS, 'fixed'].map(d => [d, Number(f.elements['d' + d].value)]));
        if (conditionDot(k) && !Object.values(dice).some(n => n > 0)) {
            $('conditionError').textContent = 'Defina pelo menos um dado ou dano fixo.';
            return;
        }
        const v = {
            id: itemId(), kind: k, remaining: turns || null, durationUnit: clockUnit(f.elements.durationUnit.value), dotUnit: clockUnit(f.elements.dotUnit.value), resistance: f.elements.resistance.value, attr: f.elements.attr.value, dc: Number(f.elements.dc.value), dice, focus: 0, started: k === 'Concentrando' && (a.sequenceCurrent ?? a.current) === x.id, tick: false
        };
        dlg.close();
        if (v.resistance === 'none')
            conditionPut(a, x, v);
        else
            conditionQueue(a, x, v, 'initial');
        arenaSave();
        if (conditionPending(a))
            conditionResolve(a);
    };
    change();
    dlg.showModal();
}

// Efeitos de equipamentos, ligados ao resultado real de cada ataque.
// ==============================================================================
// EFEITOS E PODERES
// ==============================================================================
function effectDice(value) {
    const s = String(value ?? '').trim().toUpperCase().replace(/\s/g, '');
    if (!s || !/^\+?(?:\d*D\d+|\d+)(?:[+-](?:\d*D\d+|\d+))*$/.test(s))
        return null;
    const out = { fixed: 0 };
    for (const token of s.match(/[+-]?(?:\d*D\d+|\d+)/g) || []) {
        if (token.includes('D')) {
            const [n, d] = token.split('D'), count = n === '' || n === '+' ? 1 : Number(n);
            if (!DICE_KINDS.includes(Number(d)) || !Number.isSafeInteger(count) || count < 0 || count > 40)
                return null;
            out[d] = (out[d] || 0) + count;
            if (out[d] > 40)
                return null;
        }
        else
            out.fixed += Number(token);
    }
    return Number.isSafeInteger(out.fixed) ? out : null;
}

function effectRoll(d, critical = false) {
    let total = number(d.fixed), max = false, parts = [];
    for (const k of DICE_KINDS)
        for (let i = 0; i < number(d[k]) * (critical ? 2 : 1); i++) {
            const n = rollValue(k);
            total += n;
            max ||= n === k;
            parts.push(n);
        }
    return { total: Math.max(0, total), max, detail: parts.length ? parts.join('+') + ' ' + sign(number(d.fixed)) : String(total) };
}

function effectCredit(a, source, target, before, after) {
    if (before <= 0 || after !== 0)
        return;
    if (source?.kind === 'player' && source.side !== target.side) {
        const p = arenaPlayer(source);
        if (p) {
            p.kills = killCount(p) + 1;
            playResourceSound('kill');
        }
    }
    arenaLog(a, `${arenaData(target).name} foi derrotado${source ? ' por ' + arenaData(source).name : ''}.`);
}

function effectSources(x) {
    return x?.kind === 'player' && arenaPlayer(x) ? activeEquipment(arenaPlayer(x)) : [];
}

function effectCondition(e) {
    return e.kind === 'Envenenamento' ? 'Envenenado' : e.kind === 'Queimadura' ? 'Queimando' : e.kind === 'Aplicar condição' ? e.condition : null;
}

function effectChargeAvailable(item, e, r) {
    if (!e.charged)
        return true;
    return !!(item.charges?.enabled && number(item.charges.current) >= Math.max(1, number(e.cost)) && (item.charges.activation !== 'Manual' || (item === r.o.weapon ? r.effectArmed : item.chargeArmed)));
}

function effectApply(r, owner, target, item, e, damage) {
    const a = r.a, kind = effectCondition(e), label = `${item.name} — ${e.kind}`;
    if (!arenaAlive(owner) || !effectChargeAvailable(item, e, r))
        return;
    if (kind && (!arenaAlive(target) || conditionHas(target, kind) || conditionTasks(a).some(t => t.target === target.id && t.kind === kind && t.type === 'initial')))
        return;
    if (['Reflexão de dano', 'Contra-ataque'].includes(e.kind) && !arenaAlive(target))
        return;
    if (e.kind === 'Contra-ataque' && (conditionHas(owner, 'Caído') || arenaAttackOptions(owner)[0]?.blocked))
        return;
    if (['Roubo de vida', 'Reflexão de dano'].includes(e.kind) && damage <= 0)
        return;
    const chance = clamp(number(e.chance ?? 100), 0, 100);
    if (chance <= 0)
        return;
    const roll = chance === 100 ? null : rollValue(100);
    if (roll !== null && roll > chance) {
        arenaLog(a, `${label}: não ativou (${roll}/${chance}%).`);
        return;
    }
    const dice = effectDice(e.intensity);
    if ((conditionDot(kind) || ['Roubo de vida', 'Reflexão de dano', 'Contra-ataque'].includes(e.kind)) && !dice) {
        arenaLog(a, `${label}: intensidade inválida. Use dados (ex.: 1D4) ou valor fixo.`);
        return;
    }
    if (e.kind === 'Bônus passivo' || e.kind === 'Personalizado') {
        arenaLog(a, `${label}: efeito narrativo/manual (${e.details || 'mestre define a aplicação'}).`);
        return;
    }
    if (e.charged) {
        item.charges.current -= Math.max(1, number(e.cost));
        if (item.charges.activation === 'Manual')
            item.chargeArmed = false;
    }
    arenaLog(a, `${label}: ativado${roll === null ? ' (100%)' : ` (${roll}/${chance}%)`}.`);
    if (kind) {
        const v = {
            id: itemId(), kind, remaining: Math.max(1, Math.trunc(number(e.duration) || 1)), durationUnit: clockUnit(e.durationUnit), dotUnit: clockUnit(e.dotUnit), resistance: e.resistance === 'Inicial e a cada rodada' ? 'eachRound' : e.resistance === 'Inicial e a cada turno' ? 'each' : e.resistance === 'Inicial' ? 'initial' : 'none', attr: e.resAttr || names[2], dc: number(e.dc ?? 10), dice: dice || { fixed: 0 }, focus: 0, started: kind === 'Concentrando' && (a.sequenceCurrent ?? a.current) === target.id, tick: false, sourceId: owner.id
        };
        if (v.resistance === 'none')
            conditionPut(a, target, v);
        else
            conditionQueue(a, target, v, 'initial');
        return;
    }
    if (e.kind === 'Roubo de vida') {
        const dr = effectRoll(dice), d = arenaData(owner), gain = Math.min(d.maxHP - d.hp, damage, dr.total);
        d.source.hp = d.hp + Math.max(0, gain);
        if (gain > 0)
            fxEmit(a, owner, { kind: "heal", amount: gain });
        arenaLog(a, `${label}: ${dr.detail} → ${Math.max(0, gain)} PV restaurados.`);
        if (gain > 0)
            playResourceSound('heal');
        return;
    }
    if (e.kind === 'Contra-ataque' || e.kind === 'Reflexão de dano') {
        let crit = false;
        if (e.kind === 'Contra-ataque') {
            if (conditionHas(owner, 'Caído'))
                return;
            const opt = arenaAttackOptions(owner)[0], hit = opt?.hit ?? conditionAttr(owner, names[0]) + (arenaData(owner).level || 1) + 1;
            if (opt?.blocked)
                return;
            const n = rollValue(20), ca = arenaData(target).ca + (conditionHas(owner, 'Cego') ? 5 : 0);
            arenaLog(a, `${label}: D20 ${n} ${sign(hit)} contra CA ${ca}.`);
            if (opt?.weapon?.ammo?.enabled)
                opt.weapon.ammo.current -= Math.max(1, number(opt.weapon.ammo.cost));
            if (n + hit <= ca)
                return;
            crit = n === 20;
        }
        const dr = effectRoll(dice, crit), total = Math.max(0, (e.kind === 'Reflexão de dano' ? Math.min(damage, dr.total) : dr.total) - (e.kind === 'Contra-ataque' && conditionHas(owner, 'Exausto') ? 5 : 0));
        const { before, after, d } = conditionDamage(a, target, total, dr.max, crit, { source: owner.id, style: "melee", reaction: e.kind === 'Contra-ataque' });
        arenaLog(a, `${label}: ${dr.detail} → ${before - after} de dano em ${d.name}.`);
        effectCredit(a, owner, target, before, after);
        if (after > 0 && before > after)
            playResourceSound('damage');
    }
}

function effectDispatch(r, hit, damage, offensiveEquipment = true) {
    const entries = [];
    const add = (owner, target, trigger) => {
        for (const item of effectSources(owner))
            for (const e of item.effects || [])
                if (e.trigger === trigger)
                    entries.push({ owner, target, item, e });
    };
    if (hit && offensiveEquipment)
        add(r.x, r.t, 'Ao acertar um ataque');
    add(r.t, r.x, 'Ao receber um ataque');
    if (damage > 0)
        add(r.t, r.x, 'Ao receber dano');
    for (const v of entries)
        effectApply(r, v.owner, v.target, v.item, v.e, damage);
    if (hit)
        autoSkills(r.a, r.x, 'Ao acertar ataque', r.t, !!r.critical);
    autoSkills(r.a, r.t, 'Ao receber ataque', r.x);
    if (damage > 0)
        autoSkills(r.a, r.t, 'Ao receber dano', r.x);
    if (!hit)
        autoSkills(r.a, r.t, 'Ao esquivar de um ataque', r.x);
}

// Habilidades e magias: resolução por ação, com dados compartilhados por efeito.
const powerDialog = document.createElement('dialog');
powerDialog.id = 'arenaPowerDialog';
powerDialog.className = 'site-dialog';
document.body.append(powerDialog);
let powerRun = null, powerRollWait = null;
function powerWeaponOpen(a) {
    const x = arenaCurrent(a), p = x?.kind === 'player' ? arenaPlayer(x) : null;
    if (!p || !conditionCanAct(a, x))
        return;
    powerDialog.innerHTML = `<h2>Trocar arma — ${esc(p.name)}</h2><p>Ativa: ${esc(activeWeapon(p)?.name || 'Nenhuma')}</p><div class="power-tiles">${reserves(p).map((w, i) => `<button data-weapon-choice="${i}">${imageMarkup(w)}<span>${esc(w.name)}</span></button>`).join('')}</div><button data-weapon-close>Fechar</button>`;
    powerDialog.querySelector('[data-weapon-close]').onclick = () => powerDialog.close();
    powerDialog.querySelectorAll('[data-weapon-choice]').forEach(b => b.onclick = () => {
        if (arenaState() === a && arenaCurrent(a) === x && switchPrepared(p, +b.dataset.weaponChoice)) {
            arenaLog(a, `${p.name} equipou ${activeWeapon(p).name}.`);
            powerDialog.close();
            arenaSave();
        }
    });
    powerDialog.showModal();
}

function powerList(x, kind) {
    if (!x)
        return [];
    const p = x.kind === 'player' ? arenaPlayer(x) : x.beast;
    if (!p)
        return [];
    if (kind === 'skill')
        return skills(p);
    if (x.kind === 'beast')
        return spells(p);
    const w = activeWeapon(p);
    return canConjureWith(w) ? spellSlots(w).slice(0, spellLimit(w, p)).map(id => spells(p).find(s => s.id === id)).filter(Boolean) : [];
}

function powerKey(kind, s) {
    return kind + ':' + s.id;
}

function powerBuffs(x) {
    return x?.powerBuffs || [];
}

function powerBonus(x, k) {
    return powerBuffs(x).reduce((n, b) => n + (b.kind === k ? number(b.amount) : 0), 0);
}

function powerAttr(x, k) {
    if (k === 'Nenhum')
        return 0;
    const i = names.indexOf(k), p = x.kind === 'player' ? arenaPlayer(x) : x.beast;
    const raw = x.kind === 'player' ? effectiveAttrs(p) : p.attrs;
    return Rules.mod(Math.max(1, number(raw[i < 0 ? 2 : i]) + powerBonus(x, names[i < 0 ? 2 : i])));
}

function powerModDelta(x, k) {
    return k === 'Nenhum' ? 0 : powerAttr(x, k) - conditionAttrBase(x, k);
}

function powerProfile(x, s) {
    return skillCurrent(s, { level: arenaDataBase(x).level });
}

function powerTargetRule(e, s, kind) {
    if (kind === 'spell')
        return s.target === 'Próprio conjurador' ? 'self' : s.target === 'Aliados' ? 'ally' : s.target === 'Qualquer personagem' ? 'any' : 'enemy';
    const z = e.target;
    return z === 'Próprio personagem' ? 'self' : z === 'Um aliado' || z === 'Todos os aliados' ? 'ally' : z === 'Qualquer alvo' || z === 'Todos (incluindo o usuário)' ? 'any' : 'enemy';
}

function powerTargets(a, x, s, kind, e) {
    const rule = powerTargetRule(e, s, kind);
    return a.participants.filter(t => (arenaAlive(t) || e.kind === 'Restaurar PV') && (rule === 'self' ? t === x : rule === 'ally' ? t.side === x.side : rule === 'enemy' ? t.side !== x.side : true));
}

function powerEffects(q) {
    return (q.effects || []).filter(e => ['Ao usar', 'Enquanto ativo'].includes(e.trigger || 'Ao usar'));
}

function powerBlocked(x, s, kind) {
    const q = powerProfile(x, s), d = arenaData(x), w = x.kind === 'player' ? activeWeapon(arenaPlayer(x)) : null, k = powerKey(kind, s);
    if (kind === 'skill' && s.type === 'Passiva' && passiveIsOn(x, s))
        return 'Passiva ativa. Desative para interromper.';
    if (number(x.cooldowns?.[k]) > 0)
        return 'Em recarga: ' + clockText(Math.min(x.cooldowns[k], Math.max(1, number(q.cooldown))), x.cooldownUnits?.[k]) + '.';
    if (q.costType === 'PV' && number(q.cost) > 0 && d.hp <= number(q.cost) || q.costType === 'PM' && d.mp < number(q.cost))
        return 'Recursos insuficientes.';
    if (kind === 'spell' && number(q.chargeCost) > 0 && (!w?.charges?.enabled || number(w.charges.current) < number(q.chargeCost)))
        return 'Cargas da arma insuficientes.';
    if (kind === 'skill' && powerEffects(q).some(e => e.kind === 'Dano adicional à arma') && (!arenaAttackOptions(x).length || arenaAttackOptions(x)[0].blocked))
        return 'Arma ativa ou munição indisponível.';
    if (kind === 'skill' && q.attackCount > 1) {
        const opt = arenaAttackOptions(x)[0];
        if (powerEffects(q).some(e => e.kind === 'Dano adicional à arma') && opt?.weapon?.ammo?.enabled && number(opt.weapon.ammo.current) < Math.max(1, number(opt.weapon.ammo.cost)) * (q.ammoPerAttack === false ? 1 : q.attackCount))
            return 'Munição insuficiente para todos os ataques.';
    }
    if (!powerEffects(q).length && !(kind === 'skill' && ['Passiva', 'Mista'].includes(s.type)))
        return 'Ativada automaticamente pelo gatilho cadastrado.';
    return '';
}

function powerOpen(kind, preselected = null) {
    const a = arenaState(), x = a && arenaCurrent(a);
    if (!a || !conditionCanAct(a, x) || powerRun || a.initiativePhase)
        return;
    arenaPreviewHide();
    const list = powerList(x, kind);
    if (!list.length)
        return toast(kind === 'spell' ? 'Nenhuma magia disponível na arma ativa.' : 'Nenhuma habilidade aprendida.');
    powerDialog.innerHTML = `<form><h2>${kind === 'spell' ? 'Magias' : 'Habilidades'} — ${esc(arenaData(x).name)}</h2><div class="power-tiles">${list.map((s, i) => `<button type="button" data-power-select="${i}"><img src="${kind === 'spell' ? spellImage(s) : skillImage(s)}" alt=""><span>${esc(s.name)}</span>${kind === 'skill' && passiveIsOn(x, s) ? '<small class="passive-on">ATIVA</small>' : kind === 'skill' && s.type === 'Automática' ? '<small>Automática</small>' : ''}${number(x.cooldowns?.[powerKey(kind, s)]) ? `<small>Recarga: ${clockText(x.cooldowns[powerKey(kind, s)], x.cooldownUnits?.[powerKey(kind, s)])}</small>` : ''}</button>`).join('')}</div><div id="powerFields"></div><p id="powerError" role="alert"></p><div class="arena-buttons"><button type="submit">Usar</button><button type="button" data-power-close>Cancelar</button></div></form>`;
    const f = powerDialog.querySelector('form');
    let s = list[preselected ?? 0] || list[0];
    if (preselected !== null)
        f.querySelector('.power-tiles').hidden = true;
    function draw() {
        const q = powerProfile(x, s), effects = powerEffects(q), err = powerBlocked(x, s, kind);
        f.querySelectorAll('[data-power-select]').forEach((b, i) => b.classList.toggle('selected', list[i] === s));
        $('powerFields').innerHTML = `<h3>${esc(s.name)}</h3><p>${esc(s.description || '')}</p>${kind === 'skill' && passiveIsOn(x, s) ? '<button type="button" data-passive-off>Desativar habilidade</button>' : ''}<small>${esc(q.costType === 'Nenhum' ? 'Sem custo' : q.cost + ' ' + q.costType)} · Recarga: ${clockText(q.cooldown, q.cooldownUnit)}${kind === 'spell' ? '' : ' · ' + esc(q.durationMode || 'Instantânea')}</small>${kind === 'skill' && q.attackCount > 1 ? multiTargetMarkup(a, x, s, q, effects) : effects.map((e, i) => {
            const ts = powerTargets(a, x, s, kind, e), all = kind === 'skill' && e.target.startsWith('Todos') || kind === 'spell' && s.targetMode === 'Todos os permitidos', multi = kind === 'spell' && s.multiple && s.targetMode !== 'Todos os permitidos' && powerTargetRule(e, s, kind) !== 'self';
            return `<fieldset data-power-effect="${i}"><legend>${esc(kind === 'spell' ? spellEffectText(e) : skillEffectText(e))}</legend>${ts.map((t, j) => `<label class="power-target"><input type="${multi || all ? 'checkbox' : 'radio'}" name="power${i}" value="${esc(t.id)}" ${all || j === 0 ? 'checked' : ''} ${all ? 'disabled' : ''}>${esc(arenaData(t).name)} · PV ${arenaData(t).hp}/${arenaData(t).maxHP}</label>`).join('') || '<small>Nenhum alvo disponível.</small>'}${multi ? `<small>Até ${Math.max(1, number(s.maxTargets))} alvos.</small>` : ''}</fieldset>`;
        }).join('')}`;
        $('powerError').textContent = err;
        f.querySelector('[type=submit]').disabled = !!err;
    }
    f.onclick = e => {
        const b = e.target.closest('[data-power-select]');
        if (b) {
            s = list[+b.dataset.powerSelect];
            draw();
        }
        if (e.target.closest('[data-power-close]'))
            powerDialog.close();
        if (e.target.closest('[data-passive-off]')) {
            passiveOff(a, x, s);
            persist();
            arenaSave();
            powerDialog.close();
        }
    };
    f.onsubmit = e => {
        e.preventDefault();
        if (arenaState() !== a || arenaCurrent(a) !== x || !conditionCanAct(a, x) || powerBlocked(x, s, kind))
            return;
        const q = powerProfile(x, s), effects = powerEffects(q);
        if (kind === 'skill' && q.attackCount > 1) {
            const groups = multiReadTargets(f, a, x, s, q, effects);
            if (!groups)
                return;
            powerDialog.close();
            powerExecute(a, x, s, kind, groups[0], groups);
            return;
        }
        const jobs = effects.map((effect, i) => ({ effect, targets: [...f.querySelectorAll(`[name="power${i}"]:checked`)].map(v => a.participants.find(t => t.id === v.value)).filter(t => powerTargets(a, x, s, kind, effect).includes(t)) }));
        if (jobs.some(j => !j.targets.length || kind === 'spell' && s.multiple && s.targetMode !== 'Todos os permitidos' && j.targets.length > Math.max(1, number(s.maxTargets)))) {
            $('powerError').textContent = 'Selecione os alvos dentro do limite.';
            return;
        }
        const merged = [];
        for (const j of jobs) {
            const old = j.effect.kind === 'Dano adicional à arma' && merged.find(v => v.effect.kind === j.effect.kind && v.effect.chance === j.effect.chance && v.targets.map(t => t.id).join() === j.targets.map(t => t.id).join());
            if (old) {
                const dice = { ...old.effect.dice };
                for (const k of [...DICE_KINDS, 'fixed'])
                    dice[k] = number(dice[k]) + number(j.effect.dice?.[k]);
                old.effect = { ...old.effect, dice };
            }
            else
                merged.push(j);
        }
        powerDialog.close();
        powerExecute(a, x, s, kind, merged);
    };
    draw();
    powerDialog.showModal();
}

function powerDiceDone() {
    if (!powerRollWait || tableDice.some(t => !t.done) || !tableDice.length)
        return;
    const done = powerRollWait;
    powerRollWait = null;
    done(tableDice.map(t => ({ n: t.n, d: t.d })));
}

async function powerDice(title, ds) {
    clearDiceTable();
    $('diceTitle').textContent = title;
    let results = [];
    for (let i = 0; i < ds.length; i += 40) {
        const batch = ds.slice(i, i + 40);
        clearDiceTable();
        results.push(...await new Promise(resolve => {
            powerRollWait = resolve;
            for (const d of batch)
                appendDie(d);
        }));
    }
    return results;
}

function powerPause(message, total, label = 'Continuar') {
    arenaAttackSummary(message, total);
    return new Promise(resolve => arenaAttackNextButton(label, resolve));
}

function powerDiceArray(obj) {
    return DICE_KINDS.flatMap(d => Array(Math.min(80, Math.max(0, Math.trunc(number(obj?.[d]))))).fill(d));
}

function powerHeal(a, t, key, n) {
    const d = arenaData(t), max = key === 'hp' ? d.maxHP : d.maxMP, old = d[key], gain = Math.min(Math.max(0, n), Math.max(0, max - old));
    d.source[key] = old + gain;
    if (gain)
        fxEmit(a, t, { kind: key === 'hp' ? 'heal' : 'mana', amount: gain });
    arenaLog(a, `${d.name}: +${gain} ${key === 'hp' ? 'PV' : 'PM'}.`);
    if (gain)
        playResourceSound(key === 'hp' ? 'heal' : 'mana');
}

function powerPutBuff(a, x, t, s, kind, q, e) {
    t.powerBuffs ??= [];
    const key = powerKey(kind, s) + ':' + x.id + ':' + e.bonusKind;
    t.powerBuffs = t.powerBuffs.filter(b => b.key !== key);
    t.powerBuffs.push({
        key, source: x.id, power: powerKey(kind, s), kind: e.bonusKind, amount: number(e.amount), durationUnit: clockUnit(kind === 'spell' && e.durationMode ? e.durationMode : q.durationMode), roundApplied: number(a.round), remaining: kind === 'spell' && e.durationMode ? clockTimed(e.durationMode) ? Math.max(1, number(e.duration)) : null : clockTimed(q.durationMode) ? Math.max(1, number(q.duration)) : q.durationMode === 'Instantânea' && !(kind === 'skill' && ['Passiva', 'Mista'].includes(s.type) && e.trigger === 'Enquanto ativo') ? 1 : null, tick: false
    });
    arenaLog(a, `${arenaData(t).name}: ${e.bonusKind} ${sign(number(e.amount))} — ${s.name}.`);
}

function powerApplyCondition(a, x, t, e) {
    if (conditionHas(t, e.condition) || !CONDITION_KINDS.includes(e.condition) || !arenaAlive(t))
        return;
    const v = {
        id: itemId(), kind: e.condition, remaining: Math.max(1, number(e.turns)), durationUnit: clockUnit(e.durationUnit), dotUnit: clockUnit(e.dotUnit), resistance: e.resistance === 'Inicial e a cada rodada' ? 'eachRound' : e.resistance === 'Inicial e a cada turno' ? 'each' : e.resistance === 'Inicial' ? 'initial' : 'none', attr: e.resAttr || names[2], dc: number(e.dc), dice: cloneItem(e.dice || { fixed: 0 }), focus: 0, started: e.condition === 'Concentrando' && (a.sequenceCurrent ?? a.current) === t.id, tick: false, sourceId: x.id
    };
    if (v.resistance === 'none')
        conditionPut(a, t, v);
    else if (!conditionTasks(a).some(z => z.target === t.id && z.kind === v.kind && z.type === 'initial'))
        conditionQueue(a, t, v, 'initial');
}

async function powerExecute(a, x, s, kind, jobs, attackGroups = null) {
    if (powerRun || $('diceDialog').open || !conditionCanAct(a, x) || arenaCurrent(a) !== x)
        return;
    const q = powerProfile(x, s), d = arenaData(x), w = x.kind === 'player' ? activeWeapon(arenaPlayer(x)) : null, k = powerKey(kind, s);
    const weaponJob = kind === 'skill' && jobs.some(j => j.effect.kind === 'Dano adicional à arma');
    if (powerBlocked(x, s, kind))
        return;
    openRoll();
    if (!$('diceDialog').open)
        return;
    powerRun = { a, x, s };
    $('dicePick').hidden = true;
    $('diceClear').hidden = true;
    $('diceRoll').hidden = true;
    $('diceClose').disabled = true;
    try {
        if (q.costType === 'PV')
            d.source.hp -= number(q.cost);
        if (q.costType === 'PM')
            d.source.mp -= number(q.cost);
        if (kind === 'spell' && number(q.chargeCost) > 0)
            w.charges.current -= number(q.chargeCost);
        if (q.cooldown)
            clockCooldown(x, k, q.cooldown, q.cooldownUnit);
        arenaLog(a, `${d.name} usou ${s.name}${q.cost ? ' · custo ' + q.cost + ' ' + q.costType : ''}.`);
        persist();
        const groups = attackGroups || [jobs];
        for (let shot = 0; shot < groups.length; shot++) {
            if (!arenaAlive(x) || conditionHas(x, 'Caído'))
                break;
            const jobs = groups[shot];
            if (!jobs.some(j => j.targets.some(t => arenaAlive(t) || j.effect.kind === 'Restaurar PV'))) {
                arenaLog(a, `${s.name}: ataque ${shot + 1} cancelado — alvo derrotado.`);
                continue;
            }
            const opt = weaponJob ? arenaAttackOptions(x)[0] : null;
            if (weaponJob && (!opt || opt.blocked && !(q.ammoPerAttack === false && shot > 0))) {
                arenaLog(a, `${s.name}: ataque interrompido — arma ou munição indisponível.`);
                break;
            }
            if (groups.length > 1)
                arenaLog(a, `${s.name}: ataque ${shot + 1}/${groups.length}.`);
            if (opt?.weapon?.ammo?.enabled && (q.ammoPerAttack !== false || shot === 0))
                opt.weapon.ammo.current -= Math.max(1, number(opt.weapon.ammo.cost));
            const armed = !!opt?.weapon?.chargeArmed;
            if (opt?.charged && opt.weapon) {
                if (opt.weapon.charges.trigger === 'Ao atacar' && (number(opt.weapon.charges.hit) !== 0 || diceText(opt.extraDamage) !== '0'))
                    opt.weapon.charges.current -= Math.max(1, number(opt.weapon.charges.cost));
                opt.weapon.chargeArmed = false;
            }
            const focus = number(conditionList(x).find(v => v.kind === 'Concentrando')?.focus), hits = new Map();
            let focusUsed = false, chargeSpent = false;
            const weaponTargets = new Set();
            for (const j of jobs) {
                const e = j.effect, offensive = ['Dano independente', 'Dano adicional à arma'].includes(e.kind), attr = kind === 'spell' ? s.attribute : e.attr || names[0], requires = e.kind === 'Dano adicional à arma' || (kind === 'spell' ? s.requiresHit === true : e.requiresHit || offensive);
                const targets = [];
                for (const t of j.targets) {
                    if (!arenaAlive(t) && e.kind !== 'Restaurar PV')
                        continue;
                    let crit = false, hit = true;
                    if (requires) {
                        if (!hits.has(t.id)) {
                            const bonus = (e.kind === 'Dano adicional à arma' && opt ? opt.hit : powerAttr(x, attr) + arenaDataBase(x).level + 1 + (x.kind === 'player' ? equipmentBonus(arenaPlayer(x), 'Acerto') : 0) + powerBonus(x, 'Acerto')) + (focusUsed ? 0 : focus);
                            if (!focusUsed) {
                                if (conditionHas(x, 'Concentrando'))
                                    conditionRemove(a, x, 'Concentrando', 'consumido pelo ataque');
                                focusUsed = true;
                            }
                            const [v] = await powerDice(`${s.name}${groups.length > 1 ? ' ' + (shot + 1) + '/' + groups.length : ''} — ${d.name} → ${arenaData(t).name}`, [20]);
                            const ca = arenaData(t).ca + (conditionHas(x, 'Cego') ? 5 : 0);
                            hit = v.n + bonus > ca;
                            crit = hit && v.n === 20;
                            hits.set(t.id, { hit, crit });
                            if (!hit)
                                fxEmit(a, t, { kind: "miss", source: x.id, style: fxPowerStyle(s, e, opt) });
                            const msg = `${arenaData(t).name}: ${v.n} ${sign(bonus)} contra CA ${ca} — ${hit ? (crit ? 'CRÍTICO' : 'acerto') : 'falha'}`;
                            arenaLog(a, msg);
                            await powerPause(msg, v.n + bonus);
                        }
                        else
                            ({ hit, crit } = hits.get(t.id));
                        if (!hit) {
                            if (opt && e.kind === 'Dano adicional à arma')
                                effectDispatch({ a, x, t, o: opt, effectArmed: armed }, false, 0);
                            continue;
                        }
                    }
                    if (number(e.chance ?? 100) < 100 && rollValue(100) > number(e.chance))
                        continue;
                    targets.push({ t, crit });
                }
                if (!targets.length)
                    continue;
                const isDice = offensive || ['Restaurar PV', 'Restaurar PM'].includes(e.kind);
                let ds = powerDiceArray(e.dice), fixed = number(e.dice?.fixed);
                if (e.kind === 'Dano adicional à arma' && opt) {
                    const basic = arenaDamageDice(opt, false);
                    ds = [...basic.dice, ...ds];
                    fixed += basic.fixed;
                    if (opt.charged && opt.weapon?.charges.trigger === 'Quando ativa o efeito' && !chargeSpent && (number(opt.weapon.charges.hit) !== 0 || diceText(opt.extraDamage) !== '0')) {
                        opt.weapon.charges.current -= Math.max(1, number(opt.weapon.charges.cost));
                        chargeSpent = true;
                    }
                }
                else if (offensive) {
                    fixed += powerBonus(x, 'Dano');
                }
                if (isDice) {
                    const rolls = await powerDice(`${s.name} — ${offensive ? 'dano' : 'recuperação'}`, ds), base = rolls.reduce((n, v) => n + v.n, 0);
                    await powerPause(`Rolagem compartilhada: ${base} ${sign(fixed)}`, base + fixed);
                    for (const { t, crit } of targets) {
                        const extra = crit && offensive ? await powerDice(`${s.name} — crítico em ${arenaData(t).name}`, ds) : [], sum = base + fixed + extra.reduce((n, v) => n + v.n, 0);
                        if (offensive) {
                            const damage = Math.max(0, sum - (conditionHas(x, 'Exausto') ? 5 : 0)), { before, after } = conditionDamage(a, t, damage, [...rolls, ...extra].some(v => v.n === v.d), crit, { source: x.id, style: fxPowerStyle(s, e, opt), reaction: false });
                            arenaLog(a, `${arenaData(t).name}: ${before - after} de dano (${before} → ${after} PV).`);
                            effectCredit(a, x, t, before, after);
                            if (before > after && after > 0)
                                playResourceSound('damage');
                            if (e.kind === 'Dano adicional à arma' && !weaponTargets.has(t.id)) {
                                weaponTargets.add(t.id);
                                effectDispatch({ a, x, t, o: opt, effectArmed: armed, critical: crit }, true, before - after);
                            }
                            else if (e.kind === 'Dano independente') {
                                effectDispatch({ a, x, t, o: {}, effectArmed: false, critical: crit }, true, before - after, false);
                            }
                            if (extra.length)
                                await powerPause(`Crítico: ${damage} de dano em ${arenaData(t).name}`, damage);
                        }
                        else
                            powerHeal(a, t, e.kind === 'Restaurar PV' ? 'hp' : 'mp', sum);
                    }
                }
                else
                    for (const { t } of targets) {
                        if (e.kind === 'Aplicar condição')
                            powerApplyCondition(a, x, t, e);
                        else if (e.kind === 'Remover condição' && conditionHas(t, e.condition))
                            conditionRemove(a, t, e.condition, 'removido por ' + s.name);
                        else if (e.kind === 'Bônus de atributo/estatística')
                            powerPutBuff(a, x, t, s, kind, q, e);
                        else if (e.kind === 'Efeito narrativo')
                            arenaLog(a, `${s.name}: ${e.details || 'efeito narrativo a critério do mestre'}.`);
                    }
                persist();
            }
        }
        if (kind === 'skill' && ['Passiva', 'Mista'].includes(s.type) && (s.type === 'Passiva' || q.effects.some(e => e.trigger === 'Enquanto ativo')))
            passiveOn(a, x, s, q);
        arenaAttackSummary(s.name + ' — ação concluída. Consulte o registro da batalha.');
    }
    catch (err) {
        console.error(err);
        arenaAttackSummary('Ação interrompida. Confira o registro e os recursos.');
    }
    finally {
        powerRun = null;
        powerRollWait = null;
        $('arenaDamageNext').hidden = true;
        $('diceClose').disabled = false;
        arenaSave();
    }
}
$('diceDialog').addEventListener('cancel', e => {
    if (powerRun)
        e.preventDefault();
});
function powerExpire(a, x) {
    if (!x)
        return;
    for (const b of powerBuffs(x)) {
        if (b.tick && b.remaining != null && clockUnit(b.durationUnit) !== 'Rodadas')
            b.remaining--;
        b.tick = false;
    }
    const old = powerBuffs(x);
    x.powerBuffs = old.filter(b => b.remaining == null || b.remaining > 0);
    for (const b of old)
        if (!x.powerBuffs.includes(b))
            arenaLog(a, `${arenaData(x).name}: bônus de ${b.kind} expirou.`);
    const d = arenaData(x);
    if (d.source) {
        d.source.hp = Math.min(d.source.hp, d.maxHP);
        d.source.mp = Math.min(d.source.mp, d.maxMP);
    }
}

function powerStartTurn(x) {
    for (const b of powerBuffs(x))
        b.tick = true;
}

// v0.8.2: habilidades contínuas, reações por evento e consumíveis na Arena.
// ==============================================================================
// HABILIDADES PASSIVAS E AUTOMÁTICAS
// ==============================================================================
function passiveIsOn(x, s) {
    return !!x?.activePassives?.[s.id];
}

function passiveOn(a, x, s, q) {
    x.activePassives ??= {};
    x.activePassives[s.id] = { remaining: clockTimed(q.durationMode) ? Math.max(1, number(q.duration)) : null, durationUnit: clockUnit(q.durationMode), roundApplied: number(a.round), tick: false };
    arenaLog(a, `${arenaData(x).name}: ${s.name} ativa.`);
}

function passiveOff(a, x, s) {
    if (!passiveIsOn(x, s))
        return;
    delete x.activePassives[s.id];
    for (const t of a.participants) {
        t.powerBuffs = powerBuffs(t).filter(b => !(b.source === x.id && b.power === powerKey('skill', s)));
        const d = arenaData(t);
        if (d.source) {
            d.source.hp = Math.min(d.source.hp, d.maxHP);
            d.source.mp = Math.min(d.source.mp, d.maxMP);
        }
    }
    arenaLog(a, `${arenaData(x).name}: ${s.name} desativada.`);
}

function passiveStartTurn(x) {
    for (const v of Object.values(x?.activePassives || {}))
        v.tick = true;
}

function passiveEndTurn(a, x) {
    if (!x)
        return;
    for (const [id, v] of Object.entries(x.activePassives || {})) {
        if (v.tick && v.remaining !== null && clockUnit(v.durationUnit) !== 'Rodadas' && --v.remaining <= 0)
            passiveOff(a, x, powerList(x, 'skill').find(s => s.id === id) || { id, name: 'Habilidade passiva' });
        else
            v.tick = false;
    }
}

let autoSkillDepth = 0;
function autoTargetChoice(a, x, s, e, eventTarget, trigger) {
    const ts = powerTargets(a, x, s, 'skill', e), valid = t => !!t && (arenaAlive(t) || e.kind === 'Restaurar PV'), group = side => a.participants.filter(t => valid(t) && t.side === side), mode = e.autoTarget || AUTO_TARGET_MODES[0];
    const attackEvent = ['Ao acertar ataque', 'Ao receber ataque', 'Ao receber dano', 'Ao esquivar de um ataque'].includes(trigger), attacker = trigger === 'Ao acertar ataque' ? x : eventTarget, target = trigger === 'Ao acertar ataque' ? eventTarget : x;
    const fixed = targets => ({ targets: targets.filter(valid), choices: [] }), manual = choices => ({ targets: [], choices });
    if (mode === 'Próprio personagem')
        return fixed([x]);
    if (mode === 'Atacante' || mode === 'Alvo do ataque')
        return fixed(attackEvent ? [mode === 'Atacante' ? attacker : target] : []);
    if (mode === 'Todos os aliados')
        return fixed(group(x.side));
    if (mode === 'Todos os inimigos')
        return fixed(a.participants.filter(t => valid(t) && t.side !== x.side));
    if (mode === 'Aliado com menor % de PV') {
        const allies = group(x.side);
        allies.sort((u, v) => arenaData(u).hp / Math.max(1, arenaData(u).maxHP) - arenaData(v).hp / Math.max(1, arenaData(v).maxHP));
        return fixed(allies.slice(0, 1));
    }
    if (mode === 'Aleatório entre os permitidos')
        return fixed(ts.length ? [ts[rollValue(ts.length) - 1]] : []);
    if (mode === 'Escolha manual do mestre')
        return manual(ts);
    if (e.target?.startsWith('Todos'))
        return fixed(ts);
    if (e.target === 'Próprio personagem')
        return fixed([x]);
    if (eventTarget && ts.includes(eventTarget))
        return fixed([eventTarget]);
    if (ts.length === 1)
        return fixed(ts);
    return manual(ts);
}

function autoPending(a) {
    return !!a?.autoQueue?.length;
}

function autoQueueAdd(a, x, s, trigger, eventTarget, eventCritical, jobs) {
    (a.autoQueue ??= []).push({
        owner: x.id, skill: s.id, trigger, eventTarget: eventTarget?.id || null, eventCritical, jobs: jobs.map(j => ({ e: cloneItem(j.e), targets: j.targets.map(t => t.id), choices: j.choices.map(t => t.id) }))
    });
}

function autoEligible(x, s, q) {
    if (!arenaAlive(x) || conditionHas(x, 'Caído') || !s || !['Automática', 'Mista', 'Passiva'].includes(s.type))
        return false;
    if (s.type === 'Passiva' && !passiveIsOn(x, s))
        return false;
    if (s.type === 'Mista' && q.effects.some(e => e.trigger === 'Enquanto ativo') && !passiveIsOn(x, s))
        return false;
    if (number(x.cooldowns?.[powerKey('skill', s)]) > 0)
        return false;
    const d = arenaData(x), cost = Math.max(0, number(q.cost));
    return !(q.costType === 'PV' && cost > 0 && d.hp <= cost || q.costType === 'PM' && d.mp < cost);
}

function autoDamageSpec(e, opt) {
    const dice = { ...e.dice };
    if (opt) {
        const basic = arenaDamageDice(opt, false);
        for (const d of basic.dice)
            dice[d] = number(dice[d]) + 1;
        dice.fixed = number(dice.fixed) + basic.fixed;
    }
    return dice;
}

async function autoExecute(a, x, s, q, trigger, eventTarget, eventCritical, jobs) {
    if (!autoEligible(x, s, q) || !jobs.length || powerRun || $('diceDialog').open)
        return;
    const reactiveWeapon = jobs.some(j => j.e.kind === 'Dano adicional à arma') && trigger !== 'Ao acertar ataque', opt = reactiveWeapon ? arenaAttackOptions(x)[0] : null;
    if (reactiveWeapon && (!opt || opt.blocked)) {
        arenaLog(a, `${s.name}: reação sem arma ativa ou munição.`);
        return;
    }
    const d = arenaData(x), cost = Math.max(0, number(q.cost)), k = powerKey('skill', s);
    openRoll();
    if (!$('diceDialog').open)
        return;
    powerRun = { a, x, s };
    autoSkillDepth++;
    $('dicePick').hidden = true;
    $('diceClear').hidden = true;
    $('diceRoll').hidden = true;
    $('diceClose').disabled = true;
    try {
        if (q.costType === 'PV')
            d.source.hp -= cost;
        if (q.costType === 'PM')
            d.source.mp -= cost;
        if (q.cooldown)
            clockCooldown(x, k, q.cooldown, q.cooldownUnit);
        arenaLog(a, `${d.name}: ${s.name} (${trigger})${cost ? ' · custo ' + cost + ' ' + q.costType : ''}.`);
        await powerPause(`${d.name} — ${s.name}!`, undefined, 'Resolver reação');
        const armed = !!opt?.weapon?.chargeArmed;
        let chargeSpent = false;
        const w = opt?.weapon;
        if (w?.ammo?.enabled)
            w.ammo.current -= Math.max(1, number(w.ammo.cost));
        if (opt?.charged && w) {
            if (w.charges.trigger === 'Ao atacar' && (number(w.charges.hit) !== 0 || diceText(opt.extraDamage) !== '0')) {
                w.charges.current -= Math.max(1, number(w.charges.cost));
                chargeSpent = true;
            }
            w.chargeArmed = false;
        }
        const hits = new Map(), weaponTargets = new Set();
        let focus = number(conditionList(x).find(v => v.kind === 'Concentrando')?.focus), focusUsed = false;
        for (const { e, targets } of jobs) {
            const accepted = [];
            const offensive = ['Dano adicional à arma', 'Dano independente'].includes(e.kind);
            for (const t of targets) {
                if (!arenaAlive(t) && e.kind !== 'Restaurar PV')
                    continue;
                const reuse = trigger === 'Ao acertar ataque' && t === eventTarget;
                let crit = reuse && eventCritical;
                if (!reuse && (e.requiresHit || offensive)) {
                    if (!hits.has(t.id)) {
                        const bonus = (e.kind === 'Dano adicional à arma' && opt ? opt.hit : powerAttr(x, e.attr || names[0]) + arenaDataBase(x).level + 1 + (x.kind === 'player' ? equipmentBonus(arenaPlayer(x), 'Acerto') : 0) + powerBonus(x, 'Acerto')) + (focusUsed ? 0 : focus);
                        if (!focusUsed) {
                            if (conditionHas(x, 'Concentrando'))
                                conditionRemove(a, x, 'Concentrando', 'consumido pela reação');
                            focusUsed = true;
                        }
                        const [v] = await powerDice(`${s.name} — ${d.name} → ${arenaData(t).name}`, [20]);
                        const ca = arenaData(t).ca + (conditionHas(x, 'Cego') ? 5 : 0), hit = v.n + bonus > ca;
                        hits.set(t.id, { hit, crit: v.n === 20 && hit });
                        if (!hit)
                            fxEmit(a, t, { kind: "miss", source: x.id, style: fxPowerStyle(s, e, opt), reaction: true });
                        const msg = `${s.name}: D20 ${v.n} ${sign(bonus)} contra CA ${ca} — ${hit ? 'acerto' : 'falha'}.`;
                        arenaLog(a, msg);
                        await powerPause(msg, v.n + bonus);
                    }
                    const h = hits.get(t.id);
                    if (!h.hit)
                        continue;
                    crit = h.crit;
                }
                if (number(e.chance ?? 100) < 100) {
                    const [v] = await powerDice(`${s.name} — chance de ativação`, [100]);
                    const success = v.n <= number(e.chance);
                    await powerPause(`${v.n} / ${e.chance}% — ${success ? 'ativou' : 'não ativou'}`, v.n);
                    if (!success)
                        continue;
                }
                accepted.push({ t, crit });
            }
            if (!accepted.length)
                continue;
            if (offensive || ['Restaurar PV', 'Restaurar PM'].includes(e.kind)) {
                const dice = offensive ? autoDamageSpec(e, e.kind === 'Dano adicional à arma' ? opt : null) : e.dice || {}, ds = powerDiceArray(dice), rolls = await powerDice(`${s.name} — ${offensive ? 'dano' : 'recuperação'}`, ds), base = rolls.reduce((n, v) => n + v.n, 0), fixed = number(dice.fixed);
                await powerPause(`${offensive ? 'Dano' : 'Recuperação'}: ${base} ${sign(fixed)}`, base + fixed);
                if (opt?.charged && w?.charges.trigger === 'Quando ativa o efeito' && !chargeSpent && (number(w.charges.hit) !== 0 || diceText(opt.extraDamage) !== '0')) {
                    w.charges.current -= Math.max(1, number(w.charges.cost));
                    chargeSpent = true;
                }
                for (const { t, crit } of accepted) {
                    const extra = crit && offensive ? await powerDice(`${s.name} — crítico em ${arenaData(t).name}`, ds) : [], sum = base + fixed + extra.reduce((n, v) => n + v.n, 0);
                    if (offensive) {
                        const damage = Math.max(0, sum - (conditionHas(x, 'Exausto') ? 5 : 0)), { before, after } = conditionDamage(a, t, damage, [...rolls, ...extra].some(v => v.n === v.d), crit, { source: x.id, style: fxPowerStyle(s, e, opt), reaction: true });
                        arenaLog(a, `${s.name}: ${arenaData(t).name} recebeu ${before - after} de dano.`);
                        effectCredit(a, x, t, before, after);
                        if (before > after && after > 0)
                            playResourceSound('damage');
                        if (opt && e.kind === 'Dano adicional à arma' && !weaponTargets.has(t.id)) {
                            weaponTargets.add(t.id);
                            for (const item of effectSources(x))
                                for (const ef of item.effects || [])
                                    if (ef.trigger === 'Ao acertar um ataque' && !['Contra-ataque', 'Reflexão de dano'].includes(ef.kind))
                                        effectApply({ a, x, t, o: opt, effectArmed: armed }, x, t, item, ef, before - after);
                        }
                        if (extra.length)
                            await powerPause(`Crítico: ${damage} de dano`, damage);
                    }
                    else
                        powerHeal(a, t, e.kind === 'Restaurar PV' ? 'hp' : 'mp', sum);
                }
            }
            else
                for (const { t } of accepted) {
                    if (e.kind === 'Aplicar condição')
                        powerApplyCondition(a, x, t, e);
                    else if (e.kind === 'Remover condição' && conditionHas(t, e.condition))
                        conditionRemove(a, t, e.condition, 'removido por ' + s.name);
                    else if (e.kind === 'Bônus de atributo/estatística')
                        powerPutBuff(a, x, t, s, 'skill', q, e);
                    else if (e.kind === 'Efeito narrativo')
                        arenaLog(a, `${s.name}: ${e.details || 'efeito narrativo a critério do mestre'}.`);
                }
            persist();
        }
        arenaAttackSummary(`${s.name} — reação concluída.`);
    }
    catch (err) {
        console.error(err);
        arenaAttackSummary('Reação interrompida. Confira o registro.');
    }
    finally {
        autoSkillDepth--;
        powerRun = null;
        powerRollWait = null;
        $('arenaDamageNext').hidden = true;
        $('diceClose').disabled = false;
        arenaSave();
    }
}

function autoSkills(a, x, trigger, eventTarget, eventCritical = false) {
    if (autoSkillDepth || !a || !arenaAlive(x) || conditionHas(x, 'Caído'))
        return;
    for (const s of powerList(x, 'skill')) {
        const q = powerProfile(x, s);
        if (!autoEligible(x, s, q))
            continue;
        const jobs = (q.effects || []).filter(e => e.trigger === trigger).map(e => ({ e, ...autoTargetChoice(a, x, s, e, eventTarget, trigger) })).filter(j => j.targets.length || j.choices.length);
        if (!jobs.length)
            continue;
        autoQueueAdd(a, x, s, trigger, eventTarget, eventCritical, jobs);
        arenaLog(a, `${s.name}: reação aguardando resolução.`);
        autoPromptLater();
    }
}

const autoDialog = document.createElement('dialog');
autoDialog.id = 'arenaAutoDialog';
document.body.append(autoDialog);
function autoResolve(a) {
    if (fxBusy(a))
        return;
    if (!a || !autoPending(a) || !arenaDialog.open || powerRun || arenaAttackPending || autoDialog.open || document.querySelector('dialog[open]:not(#arenaDialog)'))
        return;
    const task = a.autoQueue[0], x = a.participants.find(t => t.id === task.owner), s = x && powerList(x, 'skill').find(z => z.id === task.skill), q = s && powerProfile(x, s);
    const byId = id => a.participants.find(t => t.id === id);
    const valid = (id, e) => {
        const t = byId(id);
        return t && (arenaAlive(t) || e.kind === 'Restaurar PV');
    };
    if (!x || !s || !autoEligible(x, s, q)) {
        a.autoQueue.shift();
        arenaSave();
        return;
    }
    const jobs = task.jobs.map(j => ({ ...j, targets: j.targets.filter(id => valid(id, j.e)), choices: j.choices.filter(id => valid(id, j.e)) })).filter(j => j.targets.length || j.choices.length);
    const finish = (selected, skip = false) => {
        if (arenaState() !== a || a.autoQueue[0] !== task)
            return;
        if (autoDialog.open)
            autoDialog.close();
        a.autoQueue.shift();
        if (skip)
            arenaLog(a, `${s.name}: reação cancelada pelo mestre.`);
        else
            autoExecute(a, x, s, q, task.trigger, byId(task.eventTarget), task.eventCritical, selected);
        arenaSave();
    };
    if (!jobs.some(j => j.choices.length)) {
        finish(jobs.map(j => ({ e: j.e, targets: j.targets.map(byId) })));
        return;
    }
    arenaPreviewHide();
    autoDialog.innerHTML = `<form><h2>${esc(s.name)} — selecionar alvo</h2><div class="skill-form-heading"><img src="${skillImage(s)}" alt=""><div><strong>${esc(arenaData(x).name)}</strong><p>${esc(task.trigger)} · ${q.cost ? esc(q.cost + ' ' + q.costType) : 'Sem custo'}</p></div></div>${jobs.map((j, i) => `<fieldset><legend>${esc(j.e.kind)}</legend>${j.choices.length ? j.choices.map(id => {
        const t = byId(id), d = arenaData(t);
        return `<label class="power-target"><input type="radio" name="autoChoice${i}" value="${esc(id)}" required>${esc(d.name)} · ${t.side === x.side ? 'Aliado' : 'Inimigo'} · PV ${d.hp}/${d.maxHP}</label>`;
    }).join('') : j.targets.map(id => `<p>${esc(arenaData(byId(id)).name)}</p>`).join('')}</fieldset>`).join('')}<div class="arena-buttons"><button type="submit">Confirmar alvo(s)</button><button type="button" data-auto-skip>Cancelar reação</button></div></form>`;
    const f = autoDialog.querySelector('form');
    f.onsubmit = ev => {
        ev.preventDefault();
        const selected = jobs.map((j, i) => ({ e: j.e, targets: (j.choices.length ? [f.querySelector(`[name="autoChoice${i}"]:checked`)?.value] : j.targets).filter(id => valid(id, j.e)).map(byId) }));
        if (selected.some(j => !j.targets.length))
            return;
        finish(selected);
    };
    f.querySelector('[data-auto-skip]').onclick = () => finish([], true);
    autoDialog.oncancel = ev => {
        ev.preventDefault();
        autoDialog.close();
    };
    autoDialog.showModal();
}

let autoPromptTimer = 0;
function autoPromptLater() {
    clearTimeout(autoPromptTimer);
    autoPromptTimer = setTimeout(() => {
        const a = arenaState();
        if (autoPending(a))
            autoResolve(a);
    }, 0);
}
document.addEventListener('close', autoPromptLater, true);
// ==============================================================================
// ARENA — consumíveis e desfecho da batalha
// ==============================================================================
function arenaConsumablesOpen(a, preselected = null) {
    const x = arenaCurrent(a), p = x?.kind === 'player' ? arenaPlayer(x) : null;
    if (!p || !conditionCanAct(a, x) || powerRun)
        return;
    arenaPreviewHide();
    const items = bag(p).map((item, i) => ({ item, i })).filter(v => v.item?.category === 'Consumíveis' && v.item.quantity > 0);
    if (!items.length)
        return toast('Nenhum consumível na mochila.');
    let selected = items[preselected ?? 0] || items[0];
    powerDialog.innerHTML = `<form><h2>Consumíveis — ${esc(p.name)}</h2><div class="power-tiles">${items.map(({ item }, i) => `<button type="button" data-consumable="${i}">${imageMarkup(item)}<span>${esc(item.name)} ×${item.quantity}</span></button>`).join('')}</div><div id="consumableFields"></div><p id="consumableError" role="alert"></p><div class="arena-buttons"><button type="submit">Consumir</button><button type="button" data-consumable-close>Cancelar</button></div></form>`;
    const f = powerDialog.querySelector('form');
    if (preselected !== null)
        f.querySelector('.power-tiles').hidden = true;
    function draw() {
        const c = selected.item.consumption || {}, type = c.type || 'Narrativo';
        f.querySelectorAll('[data-consumable]').forEach((b, i) => b.classList.toggle('selected', items[i] === selected));
        $('consumableFields').innerHTML = `<h3>${esc(selected.item.name)}</h3><p>${esc(itemDetails(selected.item))}</p><label>Quem recebe?<select name="target">${a.participants.filter(t => t.side === x.side && (arenaAlive(t) || type === 'Restaurar PV')).map(t => `<option value="${esc(t.id)}" ${t === x ? 'selected' : ''}>${esc(arenaData(t).name)} · PV ${arenaData(t).hp}/${arenaData(t).maxHP} · PM ${arenaData(t).mp}/${arenaData(t).maxMP}</option>`).join('')}</select></label><div id="arenaCleanseChoices"></div>`;
        function drawCleanse() {
            const box = $('arenaCleanseChoices');
            if (!box || type !== 'Remover condições') return;
            const t = a.participants.find(v => v.id === f.elements.target.value);
            const eligible = curableConditionKinds(t?.conditions);
            const allowed = consumableCleanseFilter(selected.item);
            const possible = allowed.length ? eligible.filter(k => allowed.includes(k)) : eligible;
            const limit = consumableCleanseLimit(selected.item);
            box.innerHTML = `<fieldset><legend>Até ${limit} condição(ões) negativa(s)</legend><small>${allowed.length ? 'Cura apenas: ' + esc(allowed.join(', ')) : 'Sorteio aleatório entre as condições negativas ativas'}.</small><small>${possible.length ? ' · Elegíveis no alvo: ' + esc(possible.join(', ')) : ' · Nenhuma condição elegível neste alvo.'}</small></fieldset>`;
        }
        f.elements.target.addEventListener('change', drawCleanse);
        drawCleanse();
    }
    f.onclick = e => {
        const b = e.target.closest('[data-consumable]');
        if (b) {
            selected = items[+b.dataset.consumable];
            draw();
        }
        if (e.target.closest('[data-consumable-close]'))
            powerDialog.close();
    };
    f.onsubmit = e => {
        e.preventDefault();
        const t = a.participants.find(t => t.id === f.elements.target.value);
        if (!t || t.side !== x.side || arenaState() !== a || arenaCurrent(a) !== x || !conditionCanAct(a, x))
            return;
        if (['Remover condições', 'Remover condição'].includes(selected.item.consumption?.type) &&
            !consumableCureTargets(selected.item, t.conditions).length) {
            $('consumableError').textContent = 'O alvo não possui condições que essa poção possa curar.';
            return;
        }
        powerDialog.close();
        arenaConsume(a, x, t, selected.i, selected.item.id);
    };
    draw();
    powerDialog.showModal();
}

async function arenaConsume(a, x, t, index, id) {
    const p = arenaPlayer(x), item = bag(p)[index];
    if (!item || item.id !== id || !item.quantity || powerRun || $('diceDialog').open || !conditionCanAct(a, x) || t.side !== x.side)
        return;
    const cons = item.consumption || {}, type = cons.type || 'Narrativo';
    if (!arenaAlive(t) && type !== 'Restaurar PV')
        return;
    const restore = type === 'Restaurar PV' || type === 'Restaurar PM';
    const dice = restore ? powerDiceArray(cons.amount) : [];
    const rollRequired = restore && dice.length > 0;
    const curedKinds = consumableCureTargets(item, t.conditions);
    if (['Remover condições', 'Remover condição'].includes(type) && !curedKinds.length)
        return toast('O alvo não possui condições que essa poção possa curar.');
    if (rollRequired) {
        openRoll();
        if (!$('diceDialog').open)
            return;
        powerRun = { a, x, s: item };
        $('dicePick').hidden = true;
        $('diceClear').hidden = true;
        $('diceRoll').hidden = true;
        $('diceClose').disabled = true;
    }
    try {
        let total = 0;
        if (restore) {
            if (rollRequired) {
                const rolls = await powerDice(`${item.name} — ${arenaData(t).name}`, dice);
                total = Math.max(0, rolls.reduce((n, r) => n + r.n, 0) + number(cons.amount?.fixed));
                await powerPause(`Recuperação: ${total} ${type === 'Restaurar PV' ? 'PV' : 'PM'}`, total, 'Aplicar recuperação');
            } else {
                total = Math.max(0, number(cons.amount?.fixed));
            }
        }
        item.quantity--;
        if (item.quantity === 0)
            bag(p)[index] = null;
        arenaLog(a, `${p.name} usou ${item.name} em ${arenaData(t).name}.`);
        if (restore)
            powerHeal(a, t, type === 'Restaurar PV' ? 'hp' : 'mp', total);
        else if (type === 'Remover condição' || type === 'Remover condições') {
            for (const kind of curedKinds)
                conditionRemove(a, t, kind, 'removido por ' + item.name);
            playResourceSound('cleanse');
        }
        else if (type === 'Aplicar condição')
            powerApplyCondition(a, x, t, {
                condition: cons.condition, turns: cons.duration, durationUnit: clockUnit(cons.durationUnit), dotUnit: clockUnit(cons.dotUnit), resistance: 'Nenhuma', dice: cons.amount || { fixed: 0 }
            });
        else if (type === 'Bônus temporário')
            powerPutBuff(a, x, t, item, 'consumível', { durationMode: clockUnit(cons.durationUnit), duration: Math.max(1, number(cons.duration)) }, { bonusKind: cons.bonusKind, amount: number(cons.bonusAmount) });
        else if (type === 'Narrativo')
            arenaLog(a, `${item.description || 'Efeito narrativo a critério do mestre'}.`);
        if (rollRequired)
            arenaAttackSummary(`${item.name} — consumido.`);
        persist();
    }
    finally {
        if (rollRequired) {
            powerRun = null;
            powerRollWait = null;
            $('arenaDamageNext').hidden = true;
            $('diceClose').disabled = false;
        }
        arenaSave();
    }
}

// Resultado de combate: observa o estado somente depois de todas as ações e diálogos.
const arenaOutcomeAudio = { victory: 'assets/audio/212c32e8b59a93ebc179c322.mp3', defeat: 'assets/audio/cd1aed01a8630cca3d9309a5.mp3' };
let arenaOutcomeTimer = 0;
function arenaOutcomeOf(a) {
    if (!a || a.initiativePhase)
        return null;
    const allies = a.participants.filter(x => x.side === 'ally'), enemies = a.participants.filter(x => x.side === 'enemy');
    if (!allies.length || !enemies.length)
        return null;
    const al = allies.some(arenaAlive), en = enemies.some(arenaAlive);
    return al && !en ? 'victory' : en && !al ? 'defeat' : !al && !en ? 'draw' : null;
}

function arenaOutcomeSchedule() {
    clearTimeout(arenaOutcomeTimer);
    arenaOutcomeTimer = setTimeout(arenaOutcomeCheck, 0);
}

function arenaOutcomeCheck() {
    const a = arenaState();
    if (fxBusy(a))
        return;
    if (!a || !arenaDialog.open || a.outcomeShown || a.initiativePhase || arenaAttackPending || powerRun || conditionRoll || pendingArenaRoll || document.querySelector('dialog[open]:not(#arenaDialog)') || !$('arenaLog') || conditionPending(a) || autoPending(a))
        return;
    const result = arenaOutcomeOf(a);
    if (!result)
        return;
    if (result === 'draw') {
        resolveDraw(a);
        return;
    }
    a.outcomeShown = result;
    arenaLog(a, result === 'victory' ? 'Vitória dos aliados.' : 'Vitória dos inimigos — derrota dos aliados.');
    persist();
    arenaRender();
    arenaBattleOutcome(result);
}

function arenaBattleOutcome(result) {
    if ($('arenaOutcome'))
        return;
    const victory = result === 'victory', duration = victory ? 3500 : 6800, dialog = document.createElement('dialog');
    dialog.id = 'arenaOutcome';
    dialog.className = victory ? 'win' : 'loss';
    dialog.setAttribute('aria-label', victory ? 'Vitória' : 'Derrota');
    dialog.style.setProperty('--outcome-time', duration + 'ms');
    const sparks = Array.from({ length: 38 }, (_, i) => `<i class="outcome-spark" style="--x:${5 + ((i * 83) % 91)}%;--y:${35 + ((i * 53) % 61)}%;--r:${2 + i % 4}px;--speed:${1.3 + i % 7 * .27}s;--delay:${i % 9 * .13}s;--drift:${(i % 9 - 4) * 14}px"></i>`).join('');
    dialog.innerHTML = `<div class="outcome-scene">${victory ? '' : '<div class="outcome-smoke"></div>'}${sparks}<div class="outcome-core">${victory ? `<svg class="outcome-emblem" viewBox="0 0 160 160" aria-hidden="true"><defs><linearGradient id="outcomeSteel"><stop stop-color="#777b80"/><stop offset=".5" stop-color="#fff4d6"/><stop offset="1" stop-color="#8a8b91"/></linearGradient><g id="outcomeBlade"><path d="M80 9 89 27 86 100 74 100 71 27Z" fill="url(#outcomeSteel)" stroke="#d8c39a"/><path d="M80 15V98" stroke="#94856d" fill="none"/><path d="M60 101Q80 94 100 101L98 109 62 109Z" fill="#ac7837" stroke="#e9c477" stroke-width="2"/><rect x="75" y="109" width="10" height="26" rx="3" fill="#443024" stroke="#b88b50"/><path d="M75 115H85M75 122H85M75 129H85" stroke="#a47742"/><circle cx="80" cy="139" r="7" fill="#b5894b" stroke="#f1d28d"/></g></defs><g class="intro-sword-a"><use href="#outcomeBlade" transform="rotate(-43 80 80)"/></g><g class="intro-sword-b"><use href="#outcomeBlade" transform="rotate(43 80 80)"/></g></svg>` : `<svg class="outcome-emblem" viewBox="0 0 160 160" aria-hidden="true"><defs><linearGradient id="outcomeBone" x2="0" y2="1"><stop stop-color="#e0c2a0"/><stop offset="1" stop-color="#78605c"/></linearGradient></defs><g fill="none" stroke="#955950" stroke-width="4" opacity=".7"><path d="M22 26 138 134M138 26 22 134"/><path d="M14 30 30 14M130 146 146 130M130 14 146 30M14 130 30 146"/></g><path d="M80 18C48 18 30 39 30 66c0 22 12 33 24 39v20l12 13h28l12-13v-20c12-6 24-17 24-39 0-27-18-48-50-48Z" fill="url(#outcomeBone)" stroke="#dbb79e" stroke-width="2"/><path d="M43 66c0-15 27-17 30-2 2 12-4 20-14 20S43 77 43 66ZM117 66c0-15-27-17-30-2-2 12 4 20 14 20s16-7 16-18ZM80 81l-9 17h18Z" fill="#190f11"/><path d="M58 109h44M64 109v21m11-21v25m10-25v25m11-25v21" stroke="#3f2928" stroke-width="3"/><path d="m79 20-8 13 9 9-5 13" fill="none" stroke="#6d4a44" stroke-width="2"/></svg>`}<div class="intro-line"></div><div class="intro-title">${victory ? 'VITÓRIA!' : 'DERROTA!'}</div><div class="intro-line"></div><div class="outcome-sub">${victory ? 'Os aliados triunfaram.' : 'Os inimigos prevaleceram.'}</div></div><button type="button" class="intro-skip">Pular ›</button></div>`;
    document.body.append(dialog);
    let timer, audio;
    function stop() {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
            audio = null;
        }
    }
    function close() {
        stop();
        if (dialog.open)
            dialog.close();
    }
    const encounter = arenaState();
    dialog.addEventListener('close', () => {
        clearTimeout(timer);
        stop();
        dialog.remove();
        if (encounter && arenaState() === encounter && arenaDialog.open)
            arenaRender();
    }, { once: true });
    dialog.addEventListener('cancel', e => {
        e.preventDefault();
        close();
    });
    dialog.querySelector('button').onclick = close;
    dialog.showModal();
    if (state.volume) {
        try {
            audio = new Audio(arenaOutcomeAudio[result]);
            audio.volume = clamp(state.volume / 100, 0, 1);
            audio.play().catch(() => {
            });
        }
        catch {
        }
    }
    timer = setTimeout(close, duration);
}

// O evento close não borbulha; captura garante que o resultado só apareça após os dados.
document.addEventListener('close', arenaOutcomeSchedule, true);
// Descanso: regras independentes da arena, cena original em quadros e áudio local.
// ==============================================================================
// DESCANSO
// ==============================================================================
const restArt = 'assets/images/adcf1b21cc5163d4b17e2673.webp', restFireArt = 'assets/images/45a19b2de6772a2031de1c6f.webp', restAudio = 'assets/audio/f304321ceeeda7960e66e81a.ogg';
let restRunning = false;
function restSaveEncounter(a) {
    for (const x of a.participants) {
        if (x.kind !== 'player')
            continue;
        const p = arenaPlayer(x);
        if (!p)
            continue;
        const conditions = cloneItem(conditionList(x));
        for (const v of conditions) {
            const owner = a.participants.find(y => y.id === v.sourceId);
            v.restSourcePlayer = owner?.kind === 'player' ? owner.playerId : (v.restSourcePlayer || null);
            v.sourceId = null;
            v.tick = false;
            v.roundApplied = 0;
        }
        p.restState = { conditions, cooldowns: { ...x.cooldowns }, cooldownUnits: { ...x.cooldownUnits } };
    }
}

function restDialogMake(id) {
    let d = $(id);
    if (!d) {
        d = document.createElement('dialog');
        d.id = id;
        document.body.append(d);
    }
    return d;
}

function restOpen() {
    if (restRunning)
        return;
    if (arenaState())
        return toast('Encerre a batalha antes de descansar.');
    const players = state.characters.filter(p => String(p.name || '').trim());
    if (!players.length)
        return toast('Cadastre um personagem para descansar.');
    const d = restDialogMake('restDialog');
    let type = 'long';
    d.innerHTML = `<form><h2>Descanso do grupo</h2><div class="rest-top"><strong>Participantes</strong><button type="button" id="restAll">Desmarcar todos</button></div><div class="rest-roster">${players.map((p, i) => `<label class="rest-person"><input type="checkbox" name="participant" value="${i}" checked><img src="${p.photo || racePortrait(p.race, p.sex)}" alt=""><span><strong>${esc(p.name)}</strong><small>PV ${p.hp}/${Rules.maxHP(p)} · PM ${p.mp}/${Rules.maxMP(p)}</small></span></label>`).join('')}</div><div class="rest-types"><button type="button" data-rest-type="short">Descanso curto</button><button type="button" data-rest-type="long" class="selected">Descanso longo</button></div><div class="rest-fields">${[['hp', 'PV'], ['mp', 'PM']].map(([k, label]) => `<div><strong>Recuperar ${label}</strong><span data-rest-full>100% do máximo</span><select name="${k}Mode" aria-label="Modo de recuperação de ${label}" hidden><option value="none">Nenhuma</option><option value="fixed">Valor fixo</option><option value="percent">Porcentagem</option><option value="dice" selected>Dados</option></select><input name="${k}Value" aria-label="Recuperação de ${label}" placeholder="Ex.: 2D6 + 3" value="" hidden></div>`).join('')}</div><div class="rest-options"><label><input type="checkbox" name="reset" checked disabled>Reiniciar recargas de habilidades e magias</label><label><input type="checkbox" name="conditions">Remover condições de status</label></div><small>Não recupera munições ou cargas mágicas, nem concede XP.</small><p id="restError" role="alert"></p><div class="rest-actions"><button type="submit">Iniciar descanso</button><button type="button" id="restCancel">Cancelar</button></div></form>`;
    const f = d.querySelector('form'), checks = [...f.querySelectorAll('[name=participant]')];
    function refreshAll() {
        $('restAll').textContent = checks.every(x => x.checked) ? 'Desmarcar todos' : 'Selecionar todos';
    }
    $('restAll').onclick = () => {
        let on = !checks.every(x => x.checked);
        checks.forEach(x => x.checked = on);
        refreshAll();
    };
    checks.forEach(x => x.onchange = refreshAll);
    function refresh() {
        d.querySelectorAll('[data-rest-type]').forEach(b => b.classList.toggle('selected', b.dataset.restType === type));
        d.querySelectorAll('[data-rest-full]').forEach(el => el.hidden = type === 'short');
        for (const k of ['hp', 'mp']) {
            const mode = f.elements[k + 'Mode'], val = f.elements[k + 'Value'];
            mode.hidden = type === 'long';
            val.hidden = type === 'long' || mode.value === 'none';
            val.placeholder = mode.value === 'dice' ? 'Ex.: 2D6 + 3' : mode.value === 'percent' ? 'Ex.: 25' : 'Ex.: 10';
            val.setAttribute('inputmode', mode.value === 'dice' ? 'text' : 'numeric');
        }
        f.elements.reset.disabled = type === 'long';
        if (type === 'long')
            f.elements.reset.checked = true;
    }
    d.querySelectorAll('[data-rest-type]').forEach(b => b.onclick = () => {
        type = b.dataset.restType;
        f.elements.reset.checked = type === 'long';
        refresh();
    });
    for (const k of ['hp', 'mp'])
        f.elements[k + 'Mode'].onchange = refresh;
    $('restCancel').onclick = () => d.close();
    refresh();
    f.onsubmit = e => {
        e.preventDefault();
        if (restRunning || arenaState())
            return;
        try {
            const selected = checks.filter(x => x.checked).map(x => players[+x.value]).filter(p => state.characters.includes(p));
            if (!selected.length)
                throw Error('Selecione ao menos um personagem.');
            const options = {
                type, reset: type === 'long' || f.elements.reset.checked, conditions: f.elements.conditions.checked, hp: restSpec(type, f.elements.hpMode.value, f.elements.hpValue.value), mp: restSpec(type, f.elements.mpMode.value, f.elements.mpValue.value)
            };
            d.close();
            restExecute(selected, options);
        }
        catch (err) {
            $('restError').textContent = err.message;
        }
    };
    d.showModal();
}

function restSpec(type, mode, raw) {
    if (type === 'long')
        return { mode: 'full' };
    if (mode === 'none')
        return { mode };
    const txt = String(raw).trim();
    if (mode === 'fixed' || mode === 'percent') {
        const clean = txt.replace('%', '');
        if (!/^\d+$/.test(clean) || !Number.isSafeInteger(+clean) || +clean > 1000000 || (mode === 'percent' && +clean > 100))
            throw Error('Informe um valor inteiro válido (porcentagem de 0 a 100).');
        return { mode, value: +clean };
    }
    let normalized = txt.toUpperCase().replace(/\s+/g, '');
    if (!/^\+?\d*D\d+(?:\+\d*D\d+|\+\d+)*$/.test(normalized) && !/^\d+(?:\+\d*D\d+|\+\d+)+$/.test(normalized))
        throw Error('Use uma expressão como 2D6 + 3.');
    let ds = [], fixed = 0;
    for (const t of normalized.replace(/^\+/, '').split('+')) {
        let m = t.match(/^(\d*)D(\d+)$/);
        if (m) {
            let count = Number(m[1] || 1), sides = Number(m[2]);
            if (!DICE_KINDS.includes(sides) || count < 1 || count > 40 || ds.length + count > 40)
                throw Error('Use dados disponíveis na mesa, até 40 por recuperação.');
            for (let i = 0; i < count; i++)
                ds.push(sides);
        }
        else
            fixed += Number(t);
    }
    if (!Number.isSafeInteger(fixed) || fixed > 1000000)
        throw Error('Valor fixo muito alto.');
    return { mode: 'dice', ds, fixed };
}

async function restAmount(p, k, spec) {
    const max = k === 'hp' ? Rules.maxHP(p) : Rules.maxMP(p);
    if (spec.mode === 'full')
        return max;
    if (spec.mode === 'none')
        return 0;
    if (spec.mode === 'fixed')
        return spec.value;
    if (spec.mode === 'percent')
        return Math.floor(max * spec.value / 100);
    if (spec.mode === 'dice') {
        const rolls = await powerDice(`Descanso — ${p.name} · ${k === 'hp' ? 'PV' : 'PM'}`, spec.ds);
        const total = rolls.reduce((n, r) => n + r.n, 0) + spec.fixed;
        await powerPause(`Recuperação: ${total} ${k === 'hp' ? 'PV' : 'PM'}`, total, 'Confirmar recuperação');
        return total;
    }
    return 0;
}

async function restExecute(players, options) {
    if (restRunning || arenaState())
        return;
    restRunning = true;
    const results = [];
    let rolling = false;
    try {
        rolling = options.hp.mode === 'dice' || options.mp.mode === 'dice';
        if (rolling) {
            openRoll();
            if (!$('diceDialog').open)
                throw Error('Feche a mesa de dados antes de descansar.');
            $('dicePick').hidden = true;
            $('diceClear').hidden = true;
            $('diceRoll').hidden = true;
            $('diceClose').disabled = true;
        }
        for (const p of players) {
            const h = await restAmount(p, 'hp', options.hp), m = await restAmount(p, 'mp', options.mp);
            results.push({ p, h, m });
        }
        if (rolling) {
            $('arenaDamageNext').hidden = true;
            $('diceClose').disabled = false;
            $('diceDialog').close();
        }
        if (arenaState())
            throw Error('Não é possível descansar durante uma batalha.');
        for (const r of results) {
            const p = r.p;
            const hp = clamp(number(p.hp), 0, Rules.maxHP(p)), mp = clamp(number(p.mp), 0, Rules.maxMP(p));
            p.hp = Math.min(Rules.maxHP(p), hp + r.h);
            p.mp = Math.min(Rules.maxMP(p), mp + r.m);
            r.hp = p.hp - hp;
            r.mp = p.mp - mp;
            p.restState ??= { conditions: [], cooldowns: {} };
            r.conditions = options.conditions ? (p.restState.conditions || []).length : 0;
            r.cooldowns = options.reset ? Object.values(p.restState.cooldowns || {}).filter(v => number(v) > 0).length : 0;
            if (options.conditions)
                p.restState.conditions = [];
            if (options.reset) {
                p.restState.cooldowns = {};
                p.restState.cooldownUnits = {};
            }
        }
        persist();
        render();
        restShowScene(results, options.type);
    }
    catch (err) {
        restRunning = false;
        toast(err.message || 'Não foi possível iniciar o descanso.');
        if (rolling && $('diceDialog').open) {
            powerRollWait = null;
            $('arenaDamageNext').hidden = true;
            $('diceClose').disabled = false;
            $('diceDialog').close();
        }
    }
}
$('diceDialog').addEventListener('cancel', e => {
    if (restRunning)
        e.preventDefault();
});
function restShowScene(results, type) {
    const d = restDialogMake('restScene');
    d.innerHTML = `<div class="rest-painting"><img class="rest-static" src="${restArt}" alt="Quatro aventureiros descansando ao redor de uma fogueira na floresta"><img class="rest-fire" src="${restFireArt}" alt="" aria-hidden="true"><div class="rest-light" aria-hidden="true"></div><div class="rest-embers" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<i style="--dx:${(i * 17) % 53 - 26}px;--sx:${47 + (i * 13) % 7}%;--sy:${63 + (i * 3) % 4}%;--dur:${1.8 + (i % 5) * .35}s;--delay:-${(i * .43) % 2.9}s;--rise:${55 + (i * 31) % 106}px;--size:${1 + i % 3}px"></i>`).join('')}</div></div><div class="rest-scene-title">Descanso ${type === 'long' ? 'longo' : 'curto'}</div><button class="rest-continue" type="button" hidden>Continuar aventura</button>`;
    let sound = null, done = false;
    const button = d.querySelector('button');
    const timer = setTimeout(() => {
        button.hidden = false;
        button.focus({ preventScroll: true });
    }, 2400);
    const stop = () => {
        clearTimeout(timer);
        if (sound) {
            sound.pause();
            sound.currentTime = 0;
            sound = null;
        }
    };
    function finish() {
        if (done)
            return;
        done = true;
        stop();
        d.close();
        restShowSummary(results);
    }
    ;
    d.oncancel = e => {
        e.preventDefault();
    };
    d.onclose = () => {
        stop();
        if (!done) {
            done = true;
            restShowSummary(results);
        }
    };
    button.onclick = finish;
    d.showModal();
    if (state.volume) {
        try {
            sound = new Audio(restAudio);
            sound.loop = true;
            sound.volume = clamp(state.volume / 100, 0, 1);
            sound.play().catch(() => {
            });
        }
        catch {
        }
    }
}

function restShowSummary(results) {
    restRunning = false;
    const d = restDialogMake('restSummary');
    d.innerHTML = `<h2>Descanso concluído</h2>${results.map(r => `<div class="rest-result"><strong>${esc(r.p.name)}</strong><span class="rest-gain">+${r.hp} PV · +${r.mp} PM</span><br><small>PV ${r.p.hp}/${Rules.maxHP(r.p)} · PM ${r.p.mp}/${Rules.maxMP(r.p)}${r.conditions ? ' · ' + r.conditions + ' condições removidas' : ''}${r.cooldowns ? ' · ' + r.cooldowns + ' recargas reiniciadas' : ''}</small></div>`).join('')}<button type="button">Voltar à ficha</button>`;
    d.querySelector('button').onclick = () => d.close();
    d.showModal();
}

// Revisão de estabilidade e documentação — 0.7.0.

