// ==============================================================================
// CARTAS DE COMBATE E EFEITOS VISUAIS
// ==============================================================================
const TCG_LOGO = document.querySelector('header img').src;
// Arena de cartas: interface independente do motor de combate.
let tcgFace = 'front', tcgSelected = null, tcgPages = {};
function tcgReset(x) {
    if (tcgSelected !== x?.id) {
        tcgSelected = x?.id || null;
        tcgFace = 'front';
        tcgPages = {};
    }
}

function arenaCADetail(x, d) {
    const p = x.kind === 'player' ? arenaPlayer(x) : null;
    const base = arenaDataBase(x).ca;
    const lines = [`Classe de Armadura: ${d.ca}`];
    if (p) {
        const rows = heroStatsBreakdownCA(p);
        lines.push(...rows);
    } else lines.push(`CA base do Bestiário: ${base}`);
    for (const buff of powerBuffs(x).filter(b => b.kind === 'CA'))
        lines.push(`${buff.name || buff.source || 'Magia/habilidade ativa'}: ${sign(number(buff.amount))}`);
    const delta = p ? powerModDelta(x, arenaCAAttribute(p)) : 0;
    if (p && delta) lines.push(`Alteração de atributo em combate: ${sign(delta)}`);
    if (conditionHas(x, 'Paralisado')) lines.push('Paralisado: CA definida como 0');
    else if (conditionHas(x, 'Atordoado')) lines.push('Atordoado: −5 CA');
    lines.push(`CA efetiva na batalha: ${d.ca}`);
    return lines.join('\n');
}
function arenaCAAttribute(p) {
    const armor = equipment(p)[4];
    const idx = armor && armor.armorType !== 'Vestimenta' ?
        (compatible(p, armor) ? ({ Leve: 1, 'Média': 2, Pesada: 0 })[armor.armorType] : undefined) :
        ({ Mago: 3, Feiticeiro: 3, Bruxo: 3, Monge: 4, Druida: 4, 'Clérigo': 4, 'Bárbaro': 2, Bardo: 5 })[p.class];
    return idx === undefined ? 'Nenhum' : names[idx];
}
function heroStatsBreakdownCA(p) {
    const a = effectiveAttrs(p), armor = equipment(p)[4], attr = arenaCAAttribute(p);
    let base = 10 + (attr === 'Nenhum' ? 0 : Rules.mod(a[names.indexOf(attr)]));
    if (armor && armor.armorType !== 'Vestimenta' && !compatible(p, armor)) base = 10;
    const armorBonus = activeEquipment(p).reduce((n, i) => n + (['Armaduras','Escudos'].includes(i.category) ? number(i.ca) : 0),0);
    return [`Base de classe/armadura: ${base}`,`Armadura e escudo: ${sign(armorBonus)}`,`Outros bônus de equipamentos: ${sign(equipmentBonus(p,'CA'))}`];
}
function tcgCard(x, a) {
    const d = arenaData(x);
    return `<article class="tcg-mini ${x.side} ${x.id === a.current ? 'selected' : ''} ${x.id === (a.sequenceCurrent ?? a.current) ? 'turn-owner' : ''} ${d.hp <= 0 ? 'down' : ''}" data-combatant="${esc(x.id)}" data-fx-poison="${conditionHas(x, 'Envenenado') ? '1' : '0'}" data-fx-fire="${conditionHas(x, 'Queimando') ? '1' : '0'}" tabindex="0" role="button" aria-label="Selecionar ${esc(d.name)}"><div class="tcg-mini-art"><img src="${d.image}" alt=""><span class="tcg-level">${d.level}</span>${x.id === (a.sequenceCurrent ?? a.current) ? '<span class="tcg-turn-mark" aria-label="Dono do turno"><svg viewBox="0 0 20 24" width="14" height="17" aria-hidden="true"><path d="M3 2h14M3 22h14M5 3v3c0 3 3 5 5 6-2 1-5 3-5 6v3M15 3v3c0 3-3 5-5 6 2 1 5 3 5 6v3" stroke="#f5cc76" stroke-width="2" fill="none"/><path d="M6 5h8l-4 5zM6 19l4-5 4 5z" fill="#e3ab4d"/></svg></span>' : ''}</div><strong class="tcg-mini-name">${esc(d.name)}</strong>${arenaCompactBar(x, d, 'hp')}${arenaCompactBar(x, d, 'mp')}<div class="tcg-mini-conditions">${arenaConditionStrip(x)}<button class="tcg-mini-cond" data-arena="conditions" data-id="${esc(x.id)}" aria-label="Condições de ${esc(d.name)}">+</button></div></article>`;
}

function tcgIcon({ image, markup, label, action, index = '', reason = '', active = false, count = '', cd = 0, cdMax = 0, cdUnit = 'Turnos próprios', detail = '', status = '' }) {
    return `<button type="button" class="tcg-icon ${active ? 'on' : ''} ${reason ? 'unavailable' : ''} ${cd ? 'cooling' : ''}" data-tcg="${action}" data-index="${esc(index)}" data-reason="${esc(reason)}" aria-label="${esc(label)}" data-info="${esc([label, detail, cd ? 'Em recarga: ' + clockText(Math.min(cd, Math.max(1, cdMax)), cdUnit) + ' restantes.' : '', reason].filter(Boolean).join('\n'))}">${markup || `<img src="${image}" alt="">`}${cd ? `<span class="tcg-recolor" aria-hidden="true" style="--ready:${Math.max(0, Math.min(1, 1 - cd / Math.max(cd, cdMax + 1))) * 100}%">${markup || `<img src="${image}" alt="">`}</span>` : ''}${count !== '' ? `<span class="tcg-count">${esc(count)}</span>` : ''}${status ? `<span class="tcg-status">${esc(status)}</span>` : ''}</button>`;
}

function tcgPaged(items, key, max = 10) {
    const pages = Math.max(1, Math.ceil(items.length / max));
    const page = clamp(tcgPages[key] || 0, 0, pages - 1);
    tcgPages[key] = page;
    return `<div class="tcg-icons">${items.slice(page * max, (page + 1) * max).join('') || '<small class="tcg-empty">Nenhum disponível.</small>'}</div>${pages > 1 ? `<div class="tcg-paging"><button data-tcg="page" data-key="${key}" data-delta="-1" ${page === 0 ? 'disabled' : ''}>‹</button><small>${page + 1} / ${pages}</small><button data-tcg="page" data-key="${key}" data-delta="1" ${page === pages - 1 ? 'disabled' : ''}>›</button></div>` : ''}`;
}

function tcgPower(x, s, kind, i) {
    const q = powerProfile(x, s), cd = number(x.cooldowns?.[powerKey(kind, s)]), on = kind === 'skill' && passiveIsOn(x, s), automatic = kind === 'skill' && s.type === 'Automática';
    return tcgIcon({
        image: kind === 'spell' ? spellImage(s) : skillImage(s), label: s.name, action: kind, index: i, reason: on ? '' : automatic ? 'Ativada automaticamente pelo gatilho cadastrado.' : powerBlocked(x, s, kind), active: on, cd, cdMax: number(q.cooldown), cdUnit: x.cooldownUnits?.[powerKey(kind, s)] || q.cooldownUnit, status: automatic ? 'A' : '', detail: [
            q.costType === 'Nenhum' ? 'Sem custo' : `${q.cost} ${q.costType}`, `Recarga ${clockText(q.cooldown, q.cooldownUnit)}`, s.description, `Alvos: ${q.target || q.spellTarget || s.target || 'conforme efeito'} · ${q.targetMode || ''} ${q.maxTargets || ''}`, `Ativação: ${s.type || kind} · ${q.durationMode || ''} ${q.duration || ''}`, q.attackCount > 1 ? `${q.attackCount} ataques · ${q.attackDistribution}` : '', ...(q.effects || []).map(e => [kind === 'spell' ? spellEffectText(e) : skillEffectText(e), tcgEffectInfo(e)].join(' · '))
        ].filter(Boolean).join('\n')
    });
}

function tcgPanel(x, a) {
    if (!x)
        return '<aside class="tcg-sidebar"><p>Nenhum combatente selecionado.</p></aside>';
    const d = arenaData(x), p = x.kind === 'player' ? arenaPlayer(x) : null, w = p && activeWeapon(p), sk = powerList(x, 'skill'), sp = powerList(x, 'spell'), options = arenaAttackOptions(x), favoriteIds = p?.cardFavoriteIds, frontSkills = Array.isArray(favoriteIds) ? favoriteIds.map(id => sk.find(s => s.id === id)).filter(Boolean).slice(0, 9) : sk.slice(0, 9), extra = sk.filter(s => !frontSkills.includes(s)), locked = !conditionCanAct(a, x), can = p && w && canConjureWith(w);
    const disable = locked ? ' aria-disabled="true"' : '';
    const attack = options.map((o, i) => tcgIcon({
        markup: o.weapon ? imageMarkup(o.weapon) : `<span class="tcg-symbol">⚔</span>`, label: o.name, action: 'attack', index: i, reason: o.blocked ? 'Munição insuficiente.' : d.mp < o.cost ? 'PM insuficientes.' : number(x.cooldowns?.[o.key]) > 0 ? 'Em recarga.' : '', cd: number(x.cooldowns?.[o.key]), cdMax: number(o.cooldown), cdUnit: x.cooldownUnits?.[o.key] || o.cooldownUnit, detail: [`Ataque convencional · ${o.requiresHit ? 'D20 ' + sign(o.hit) : 'Sem teste de acerto'} · Dano ${diceText(o.dice)}${o.charged ? ' + ' + diceText(o.extraDamage) : ''}${o.fixed ? ' ' + sign(o.fixed) : ''}`, o.weapon ? tcgItemInfo(o.weapon) : '', ...((o.spec?.effects || []).map(tcgEffectInfo))].filter(Boolean).join('\n')
    }));
    const spellsFront = sp.slice(0, 5).map((s, i) => tcgPower(x, s, 'spell', i));
    const weaponInfo = w ? `<small class="tcg-resource-info">${esc(w.name)}${w.ammo?.enabled ? ' · ' + esc(w.ammo.name) + ': ' + w.ammo.current + '/' + w.ammo.max : ''}${w.charges?.enabled ? ' · Cargas: ' + w.charges.current + '/' + w.charges.max : ''}</small>` : '';
    const front = `<div class="tcg-face front" aria-hidden="${tcgFace !== 'front'}"><button type="button" class="tcg-hero-art" data-tcg="flip" aria-label="Virar carta"><img class="tcg-hero-fill" src="${d.image}" alt="" aria-hidden="true"><img class="tcg-hero-portrait" src="${d.image}" alt="Retrato de ${esc(d.name)}"><div class="tcg-identity"><strong>${esc(d.name)}</strong><small>${esc(p ? [p.race, p.class, p.subclass].filter(Boolean).join(' · ') : 'Criatura do Bestiário')}</small></div><div class="tcg-ca-shield" tabindex="0" data-info="${esc(arenaCADetail(x, d))}" aria-label="Detalhar CA"><small>CA</small><b>${d.ca}</b></div><div class="tcg-hero-level"><small>NV.</small><b>${d.level}</b></div><i class="tcg-flip-mark">↻</i></button>${arenaCompactBar(x, d, 'hp')}${arenaCompactBar(x, d, 'mp')}<div class="tcg-stats"><span>INI <b>${sign(d.initiative)}</b></span><span>Desloc. <b>${d.movement} m</b></span></div><div class="tcg-cond"><button data-arena="conditions" data-id="${esc(x.id)}">Condições +</button>${arenaConditionStrip(x, true)}</div>${weaponInfo}<h3>Ataque e habilidades</h3>${tcgPaged([...attack.slice(0, 1), ...frontSkills.map((s, i) => tcgPower(x, s, 'skill', sk.indexOf(s)))], 'front', 10)}<h3>Magias preparadas</h3><div class="tcg-icons">${spellsFront.join('') || `<small class="tcg-empty">${p && !can ? 'Arma ativa sem conjuração.' : 'Nenhuma magia disponível.'}</small>`}</div></div>`;
    const weapons = p ? [...(w ? [tcgIcon({ markup: imageMarkup(w), label: w.name, action: 'active-weapon', active: true, detail: tcgItemInfo(w) })] : []), ...reserves(p).map((r, i) => tcgIcon({ markup: imageMarkup(r), label: r.name, action: 'weapon', index: i, detail: tcgItemInfo(r) }))] : [];
    const cons = p ? bag(p).map((item, i) => ({ item, i })).filter(v => v.item?.category === 'Consumíveis' && v.item.quantity > 0).map((v, i) => tcgIcon({ markup: imageMarkup(v.item), label: v.item.name, action: 'consume', index: i, count: '×' + v.item.quantity, detail: tcgItemInfo(v.item) })) : [];
    const more = [...attack.slice(1), ...extra.map((s, i) => tcgPower(x, s, 'skill', sk.indexOf(s))), ...sp.slice(5).map((s, i) => tcgPower(x, s, 'spell', i + 5))];
    const buffs = (x.powerBuffs || x.buffs || []);
    const back = `<div class="tcg-face back" aria-hidden="${tcgFace !== 'back'}"><button class="tcg-back-logo" data-tcg="flip" aria-label="Voltar à frente"><img src="${TCG_LOGO}" alt="Bregathyel"><span>◆</span><small>↻</small></button><h3>${p ? 'Habilidades extras' : 'Ações extras'}</h3>${tcgPaged(more, 'extra', 10)}${p && sk.length ? '<button class="tcg-favorite-button" data-tcg="favorites">Organizar favoritas</button>' : ''}${p ? `<h3>Armas preparadas</h3>${tcgPaged(weapons, 'weapons', 5)}<h3>Consumíveis</h3>${tcgPaged(cons, 'cons', 5)}` : ''}<h3>Efeitos ativos</h3><div class="tcg-cond">${arenaConditionStrip(x, true)}${powerBuffs(x).map(b => `<span class="tcg-effect">${esc(b.kind)} ${sign(number(b.amount))}${b.remaining == null ? '' : ' · ' + b.remaining + 't'}</span>`).join('')}${sk.filter(s => passiveIsOn(x, s)).map(s => `<span class="tcg-effect" data-info="${esc(s.name)}">${esc(s.name)}</span>`).join('')}</div></div>`;
    return `<aside class="tcg-sidebar"><div class="tcg-large ${x.side} ${locked ? 'locked' : ''} ${tcgFace === 'back' ? 'flipped' : ''}"><div class="tcg-flipper">${front}${back}</div></div></aside>`;
}

function tcgRender() {
    const a = arenaState();
    if (!a) {
        arenaSetup();
        return;
    }
    if (a.initiativePhase) {
        arenaInitiativePanel(a);
        return;
    }
    const turn = arenaCurrent(a), owner = a.participants.find(x => x.id === (a.sequenceCurrent ?? a.current));
    tcgReset(turn);
    arenaDialog.classList.add('tcg-live');
    arenaDialog.innerHTML = `<div class="arena-head"><div><h1>⚔ Arena</h1><small>Rodada ${a.round} · ⌛ ${esc(owner ? arenaData(owner).name : 'Sem turno')} · ${a.participants.length} combatentes${a.outcomeShown ? ' · ' + (a.outcomeShown === 'victory' ? 'Vitória dos aliados' : 'Derrota dos aliados') : ''}</small></div><div class="arena-buttons"><button data-tcg="undo" ${tcgUndoStack.length && !tcgBusy(a) ? '' : 'disabled'}>↶ Desfazer</button><button data-arena="add">+ Participantes</button><button data-arena="exit">Voltar à ficha</button><button data-arena="end" class="arena-danger">Encerrar batalha</button>${conditionPending(a) ? '<button data-arena="condition-roll">✦ Resolver condições</button>' : ''}${autoPending(a) ? '<button data-arena="auto-resolve">✦ Resolver reações (' + a.autoQueue.length + ')</button>' : ''}<button class="tcg-end" data-arena="next" ${a.outcomeShown || (a.participants.some(arenaAlive) && !conditionPending(a) && !autoPending(a)) ? '' : 'disabled'}>${a.outcomeShown ? 'Finalizar ✓' : 'Finalizar turno ›'}</button></div></div><div class="tcg-layout">${tcgPanel(turn, a)}<div class="tcg-field" style="background-image:linear-gradient(#100d0933,#100d0944),url('${esc(a.sceneImage || TCG_SCENES[a.scene] || TCG_SCENES['Floresta Lunar'])}')"><section class="tcg-side enemy"><div class="tcg-roster">${a.participants.filter(x => x.side === 'enemy').map(x => tcgCard(x, a)).join('') || '<p>Nenhum inimigo.</p>'}</div></section><section class="tcg-side ally"><div class="tcg-roster">${a.participants.filter(x => x.side === 'ally').map(x => tcgCard(x, a)).join('') || '<p>Nenhum aliado.</p>'}</div></section></div><aside class="tcg-tests"><h3>Testes</h3>${turn ? `<div class="tcg-attrs">${names.map((n, i) => `<button data-tcg="attribute" data-index="${i}" data-info="Teste de ${n}"><small>${esc(n)}</small><b class="${powerAttr(turn, n) < 0 ? 'neg' : ''}">${sign(powerAttr(turn, n))}</b></button>`).join('')}<button data-arena="dice" aria-label="Dados livres">🎲 Dados livres</button></div>` : ''}</aside></div><section class="arena-panel tcg-log"><h3>Registro de batalha</h3><div class="arena-log" id="arenaLog" aria-live="polite">${a.log.map(x => `<div><small>R${x.round}</small> ${esc(x.text)}</div>`).join('')}</div></section>`;
    tcgRemember(a);
    arenaDialog.querySelector('[data-tcg=undo]').disabled = !tcgUndoStack.length || tcgBusy(a);
    $('arenaLog').scrollTop = $('arenaLog').scrollHeight;
    autoPromptLater();
    arenaOutcomeSchedule();
}
arenaDialog.addEventListener('click', e => {
    const shield = e.target.closest('.tcg-ca-shield[data-info]');
    if (!shield) return;
    e.preventDefault();
    e.stopPropagation();
    tcgShowTip(shield);
}, true);
arenaDialog.addEventListener('pointerover', e => {
    const b = e.target.closest('[data-info]');
    if (b)
        tcgShowTip(b);
});
arenaDialog.addEventListener('focusin', e => {
    const b = e.target.closest('[data-info]');
    if (b)
        tcgShowTip(b);
});
arenaDialog.addEventListener('click', e => {
    const b = e.target.closest('[data-tcg]');
    if (!b || b.disabled)
        return;
    const a = arenaState(), x = a && arenaCurrent(a);
    if (!a)
        return;
    const action = b.dataset.tcg, i = +b.dataset.index;
    if (action === 'undo') {
        tcgUndo();
        return;
    }
    if (!x)
        return;
    if (action === 'flip') {
        tcgFace = tcgFace === 'front' ? 'back' : 'front';
        const card = arenaDialog.querySelector('.tcg-large');
        card.classList.toggle('flipped', tcgFace === 'back');
        card.querySelector('.front').setAttribute('aria-hidden', String(tcgFace === 'back'));
        card.querySelector('.back').setAttribute('aria-hidden', String(tcgFace === 'front'));
        card.querySelector('.front').inert = tcgFace === 'back';
        card.querySelector('.back').inert = tcgFace === 'front';
        return;
    }
    if (action === 'page') {
        tcgPages[b.dataset.key] = (tcgPages[b.dataset.key] || 0) + Number(b.dataset.delta);
        arenaRender();
        return;
    }
    if (action === 'attribute') {
        if ($('diceDialog').open || !names[i])
            return;
        openRoll();
        if (!$('diceDialog').open)
            return;
        diceMode = { label: arenaData(x).name + ' — Teste de ' + names[i], attribute: names[i], mod: powerAttr(x, names[i]), level: 0, manual: true };
        tcgNarrativeLevel(arenaData(x).level);
        $('diceTitle').textContent = diceMode.label;
        return;
    }
    if (action === 'favorites') {
        tcgFavorites(a, x);
        return;
    }
    if (action === 'active-weapon') {
        tcgShowTip(b);
        return;
    }
    if (!conditionCanAct(a, x) || powerRun || arenaAttackPending)
        return toast('Resolva as ações pendentes ou condições antes de continuar.');
    if (b.dataset.reason)
        return toast(b.dataset.reason);
    if (action === 'attack')
        arenaAttackOpen(i);
    else if (action === 'skill' || action === 'spell')
        powerOpen(action, i);
    else if (action === 'consume')
        arenaConsumablesOpen(a, i);
    else if (action === 'weapon') {
        const p = arenaPlayer(x);
        if (p && switchPrepared(p, i)) {
            arenaLog(a, `${p.name} equipou ${activeWeapon(p).name}.`);
            arenaSave();
        }
    }
});
function tcgFavorites(a, x) {
    const p = arenaPlayer(x), sk = powerList(x, 'skill');
    if (!p || !sk.length)
        return;
    const selected = Array.isArray(p.cardFavoriteIds) ? p.cardFavoriteIds : sk.slice(0, 9).map(s => s.id);
    powerDialog.innerHTML = `<form><h2>Habilidades favoritas</h2><p>Escolha até nove habilidades para a frente da carta. As demais continuam disponíveis no verso.</p><div class="tcg-fav-list">${sk.map(s => `<label class="tcg-fav-row"><input type="checkbox" name="fav" value="${esc(s.id)}" ${selected.includes(s.id) ? 'checked' : ''}><img src="${skillImage(s)}" alt=""><span>${esc(s.name)}</span></label>`).join('')}</div><p id="tcgFavCount"></p><div class="arena-buttons"><button type="submit">Salvar favoritas</button><button type="button" data-fav-close>Cancelar</button></div></form>`;
    const f = powerDialog.querySelector('form'), update = () => {
        const n = f.querySelectorAll('[name=fav]:checked').length;
        f.querySelectorAll('[name=fav]').forEach(b => b.disabled = !b.checked && n >= 9);
        $('tcgFavCount').textContent = n + '/9';
        f.querySelector('[type=submit]').disabled = n > 9;
    };
    f.onchange = update;
    f.querySelector('[data-fav-close]').onclick = () => powerDialog.close();
    f.onsubmit = e => {
        e.preventDefault();
        if (arenaState() !== a || arenaCurrent(a) !== x)
            return;
        const ids = [...f.querySelectorAll('[name=fav]:checked')].map(b => b.value);
        if (ids.length > 9)
            return;
        p.cardFavoriteIds = ids;
        powerDialog.close();
        arenaSave();
    };
    update();
    powerDialog.showModal();
}

function arenaRender() {
    tcgRender();
    fxSchedule();
    const card = arenaDialog.querySelector('.tcg-large');
    if (card) {
        card.querySelector('.front').inert = tcgFace === 'back';
        card.querySelector('.back').inert = tcgFace === 'front';
    }
}

let tcgUndoStack = [], tcgStable = null, tcgUndoArena = null, tcgSelecting = false;
function tcgBusy(a) {
    return !!(a.initiativePhase || arenaAttackPending || powerRun || conditionRoll || pendingArenaRoll || conditionPending(a) || autoPending(a));
}

function tcgSnapshot(a) {
    return JSON.stringify({ arena: a, characters: state.characters, active: state.active });
}

function tcgComparable(raw) {
    const z = JSON.parse(raw);
    delete z.arena.current;
    delete z.arena.log;
    delete z.arena.outcomeShown;
    return JSON.stringify(z);
}

function tcgRemember(a) {
    if (tcgUndoArena !== a) {
        tcgUndoArena = a;
        tcgUndoStack = [];
        tcgStable = null;
    }
    if (tcgBusy(a))
        return;
    const next = tcgSnapshot(a);
    if (!tcgSelecting && tcgStable && tcgComparable(tcgStable) !== tcgComparable(next)) {
        tcgUndoStack.push(tcgStable);
        if (tcgUndoStack.length > 8)
            tcgUndoStack.shift();
    }
    tcgStable = next;
}

async function tcgUndo() {
    const a = arenaState();
    if (!a || tcgBusy(a) || !tcgUndoStack.length)
        return;
    const ok = await openSiteDialog({ title: 'Desfazer última ação', message: 'Restaurar o estado anterior da batalha, incluindo PV, PM, itens, condições, recargas, abates e turno?', confirm: true });
    if (!ok || a !== arenaState() || tcgBusy(a))
        return;
    const z = JSON.parse(tcgUndoStack.pop());
    fxReset();
    clearTimeout(arenaOutcomeTimer);
    state.arena = z.arena;
    state.characters = z.characters;
    state.active = z.active;
    state.character = state.characters[state.active] || state.characters[0];
    tcgUndoArena = state.arena;
    tcgStable = tcgSnapshot(state.arena);
    tcgSelected = null;
    persist();
    arenaRender();
}

function tcgEffectInfo(e) {
    return [
        e.kind || e.condition, e.condition && e.kind !== e.condition ? 'Condição: ' + e.condition : '', e.trigger ? 'Gatilho: ' + e.trigger : '', e.chance != null ? 'Chance: ' + e.chance + '%' : '', e.intensity ? 'Intensidade: ' + e.intensity : '', e.dotUnit && (['Envenenamento', 'Queimadura'].includes(e.kind) || conditionDot(e.condition) && e.kind === 'Aplicar condição') ? 'Dano periódico: ' + (clockUnit(e.dotUnit) === 'Rodadas' ? 'a cada rodada' : 'a cada turno do afetado') : '', e.dice ? 'Dados: ' + diceText(e.dice) : '', (e.kind === 'Aplicar condição' || ['Envenenamento', 'Queimadura'].includes(e.kind)) ? 'Duração: ' + clockText(e.turns || e.duration, e.durationUnit) : e.kind === 'Bônus de atributo/estatística' && e.durationMode ? (clockTimed(e.durationMode) ? 'Duração: ' + clockText(e.duration, e.durationMode) : 'Duração: até remoção manual') : '', e.resistance && e.resistance !== 'Nenhuma' && e.resistance !== 'none' ? 'Resistência: ' + e.resistance + ' · ' + (e.resAttr || e.attr || 'CON') + ' · CD ' + (e.dc ?? 10) : 'Resistência: nenhuma', e.charged ? 'Consome ' + (e.cost || 1) + ' carga(s)' : '', e.details
    ].filter(Boolean).join(' · ');
}

function tcgConsumptionInfo(c) {
    const type = c.type || 'Narrativo';
    return [
        type, ['Restaurar PV', 'Restaurar PM'].includes(type) ? 'Recuperação: ' + diceText(c.amount) : '', ['Aplicar condição', 'Remover condição'].includes(type) ? 'Condição: ' + (c.condition || '—') : '', type === 'Aplicar condição' ? 'Duração: ' + clockText(c.duration, c.durationUnit) : '', type === 'Bônus temporário' ? (c.bonusKind || 'Bônus') + ' ' + sign(number(c.bonusAmount)) + ' · ' + clockText(c.duration, c.durationUnit) : ''
    ].filter(Boolean).join(' · ');
}

function tcgItemInfo(w) {
    return [
        itemDetails(w), w.attribute ? 'Atributo: ' + w.attribute : '', w.ammo?.enabled ? `Munição: ${w.ammo.current}/${w.ammo.max} · ${w.ammo.cost || 1} por ataque` : '', w.charges?.enabled ? `Cargas: ${w.charges.current}/${w.charges.max} · ${w.charges.trigger || ''} · ${w.charges.activation || ''}` : '', ...(w.effects || []).map(tcgEffectInfo), w.category === 'Consumíveis' && w.consumption ? tcgConsumptionInfo(w.consumption) : ''
    ].filter(Boolean).join('\n');
}

let tcgTipTimer = 0;
function tcgHideTip() {
    clearTimeout(tcgTipTimer);
    document.getElementById('tcgHoverTip')?.remove();
}

function tcgShowTip(b) {
    tcgHideTip();
    if (!b?.dataset.info)
        return;
    const t = document.createElement('div');
    t.id = 'tcgHoverTip';
    t.setAttribute('role', 'tooltip');
    const [head, ...lines] = b.dataset.info.split('\n');
    t.innerHTML = '<strong>' + esc(head) + '</strong>' + lines.map(l => '<p>' + esc(l) + '</p>').join('');
    arenaDialog.append(t);
    t.addEventListener('pointerenter', () => clearTimeout(tcgTipTimer));
    t.addEventListener('pointerleave', tcgHideTip);
    const r = b.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    t.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left)) + 'px';
    t.style.top = Math.max(8, r.top - h - 8) + 'px';
    if (r.top < h + 8)
        t.style.top = Math.min(innerHeight - h - 8, r.bottom + 8) + 'px';
}
arenaDialog.addEventListener('pointerout', e => {
    if (e.target.closest('[data-info]') && !e.relatedTarget?.closest?.('[data-info],#tcgHoverTip'))
        tcgTipTimer = setTimeout(tcgHideTip, 200);
});
arenaDialog.addEventListener('focusout', tcgHideTip);
arenaDialog.addEventListener('click', e => {
    if (!e.target.closest('[data-info]'))
        tcgHideTip();
});
window.addEventListener('scroll', tcgHideTip, { passive: true });
function tcgNarrativeLevel(level) {
    document.getElementById('tcgLevelOption')?.remove();
    if (!diceMode)
        return;
    const value = number(level) + 1, box = document.createElement('label');
    box.id = 'tcgLevelOption';
    box.className = 'tcg-level-option';
    box.innerHTML = `<input type="checkbox"> Incluir bônus de nível (${sign(value)})`;
    box.querySelector('input').onchange = e => {
        if (diceMode) {
            diceMode.level = e.target.checked ? value : 0;
            updateDiceSummary();
        }
    };
    $('diceSummary').before(box);
}

// Undo history belongs to the open battle session, not the campaign file.
arenaDialog.addEventListener('close', () => {
    tcgUndoArena = null;
    tcgStable = null;
    tcgUndoStack = [];
    tcgHideTip();
});
const TCG_SCENES = { "Floresta Lunar": "assets/images/arena_scene_forest_moon.webp", "Ruínas Antigas": "assets/images/arena_scene_ruins_day.webp", "Forja Vulcânica": "assets/images/arena_scene_lava_forge.webp", "Passagem Nevada": "assets/images/arena_scene_snow_pass.webp", "Ruínas do Deserto": "assets/images/arena_scene_desert_sunset.webp", "Pântano Sombrio": "assets/images/arena_scene_swamp_moon.webp" };
arenaDialog.addEventListener('change', e => {
    if (e.target.id !== 'arenaSceneUpload')
        return;
    const form = e.target.closest('form'), file = e.target.files[0], status = $('arenaSceneStatus');
    delete form.dataset.sceneImage;
    if (!file) {
        status.textContent = '';
        return;
    }
    if (!file.type.startsWith('image/')) {
        status.textContent = 'Selecione uma imagem.';
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        const image = new Image();
        image.onload = () => {
            if (!form.isConnected)
                return;
            const scale = Math.min(1, 1600 / image.width, 1000 / image.height), cv = document.createElement('canvas');
            cv.width = Math.max(1, Math.round(image.width * scale));
            cv.height = Math.max(1, Math.round(image.height * scale));
            cv.getContext('2d').drawImage(image, 0, 0, cv.width, cv.height);
            form.dataset.sceneImage = cv.toDataURL('image/webp', .85);
            status.textContent = 'Cenário personalizado selecionado.';
        };
        image.onerror = () => {
            status.textContent = 'Imagem inválida.';
        };
        image.src = reader.result;
    };
    reader.readAsDataURL(file);
});
// 0.8.2 — purely visual events. Never persisted; no rolls or combat mutations here.
let fxQueue = [], fxTimer = 0, fxPlaying = false, fxArena = null, fxGeneration = 0;
const fxReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function fxBusy(a) {
    return !!a && fxArena === a && (fxPlaying || fxQueue.length > 0);
}

function fxReset() {
    fxGeneration++;
    clearTimeout(fxTimer);
    fxTimer = 0;
    fxQueue = [];
    fxPlaying = false;
    fxArena = null;
    document.getElementById('battleFxLayer')?.remove();
}

function fxAttackStyle(o) {
    const t = String(o?.weapon?.attack || o?.spec?.type || '').toLowerCase();
    return t.includes('dist') ? 'ranged' : t.includes('mág') || t.includes('mag') ? 'arcane' : 'melee';
}

function fxPowerStyle(s, e, opt) {
    if (e?.kind === 'Dano adicional à arma' && opt)
        return fxAttackStyle(opt);
    const name = String(s?.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/fogo|chama|flamej|incend|queim/.test(name))
        return 'fire';
    if (/gelo|gelid|congel|nevasca/.test(name))
        return 'ice';
    if (/raio|relamp|trovao|eletric/.test(name))
        return 'lightning';
    if (/veneno|tox|peconh/.test(name))
        return 'poison';
    return e?.attr === 'Força' || e?.attr === 'Destreza' ? 'melee' : 'arcane';
}

function fxEmit(a, t, e) {
    if (!a || arenaState() !== a || !arenaDialog.open || !t?.id)
        return;
    if (fxArena !== a) {
        fxReset();
        fxArena = a;
    }
    fxQueue.push({ ...e, target: t.id });
    fxSchedule();
}

function fxSchedule() {
    if (fxTimer || fxPlaying || !fxQueue.length)
        return;
    fxTimer = setTimeout(() => {
        fxTimer = 0;
        fxFlush();
    }, 35);
}

function fxCard(id) {
    return [...arenaDialog.querySelectorAll('.tcg-mini')].find(el => el.dataset.combatant === id);
}

function fxCenter(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * .42, w: r.width, h: r.height };
}

function fxLayer() {
    let l = document.getElementById('battleFxLayer');
    if (!l) {
        l = document.createElement('div');
        l.id = 'battleFxLayer';
        l.setAttribute('aria-hidden', 'true');
        document.body.append(l);
    }
    return l;
}

function fxNode(layer, cls, x, y, text = '') {
    const n = document.createElement('div');
    n.className = cls;
    n.style.left = x + 'px';
    n.style.top = y + 'px';
    n.textContent = text;
    layer.append(n);
    return n;
}

const FX_COLORS = { melee: '#ffe2a3', ranged: '#f4ce86', arcane: '#b897ff', fire: '#ff9044', ice: '#91eaff', lightning: '#b6c8ff', poison: '#9bdc53', plain: '#ff7365' };
function fxPlay(ev, layer) {
    const card = fxCard(ev.target);
    if (!card)
        return;
    const p = fxCenter(card), style = ev.style || 'plain', color = FX_COLORS[style] || FX_COLORS.plain, reduce = fxReduced(), from = ev.source && fxCard(ev.source), attack = ev.kind === 'damage' || ev.kind === 'miss';
    const duration = reduce ? 280 : 720;
    const float = (text, cls, dy = 0) => {
        const n = fxNode(layer, 'battle-fx-float ' + cls, p.x, p.y + dy, text);
        n.style.setProperty('--fx-duration', duration + 'ms');
    };
    if (ev.reaction && from) {
        const f = fxCenter(from);
        const n = fxNode(layer, 'battle-fx-reaction', f.x, f.y - f.h * .36, 'REAÇÃO');
        n.style.setProperty('--fx-duration', duration + 'ms');
    }
    if (attack && from && from !== card && !reduce && ['ranged', 'arcane', 'fire', 'ice', 'lightning', 'poison'].includes(style)) {
        const f = fxCenter(from), dx = p.x - f.x, dy = p.y - f.y, dist = Math.hypot(dx, dy);
        const n = fxNode(layer, 'battle-fx-projectile ' + (style === 'ranged' ? 'arrow' : 'orb'), f.x, f.y);
        n.style.setProperty('--fx-color', color);
        n.style.setProperty('--fx-angle', Math.atan2(dy, dx) + 'rad');
        n.animate([{ transform: 'translate(-50%,-50%) rotate(var(--fx-angle)) translateX(0)', opacity: 1 }, { transform: 'translate(-50%,-50%) rotate(var(--fx-angle)) translateX(' + dist + 'px)', opacity: 1, offset: .85 }, { transform: 'translate(-50%,-50%) rotate(var(--fx-angle)) translateX(' + dist + 'px)', opacity: 0 }], { duration: 220, fill: 'forwards', easing: 'ease-in' });
    }
    const lag = attack && from && from !== card && ['ranged', 'arcane', 'fire', 'ice', 'lightning', 'poison'].includes(style) && !reduce ? 180 : 0;
    const impact = () => {
        if (!layer.isConnected)
            return;
        const current = fxCard(ev.target);
        if (!current)
            return;
        const c = fxCenter(current);
        let tint = color, cls = 'damage', label = '';
        if (ev.kind === 'miss') {
            label = 'ERROU';
            cls = 'miss';
            tint = '#eee3cf';
        }
        else if (ev.kind === 'heal') {
            label = '+' + ev.amount + ' PV';
            cls = 'heal';
            tint = '#91f39a';
        }
        else if (ev.kind === 'mana') {
            label = '+' + ev.amount + ' PM';
            cls = 'mana';
            tint = '#7fcaff';
        }
        else if (ev.kind === 'condition') {
            label = ev.label;
            cls = 'condition';
        }
        else {
            label = '−' + ev.amount;
            cls = ev.critical ? 'critical' : 'damage';
            if (ev.critical)
                label = 'CRÍTICO · ' + label;
        }
        const n = fxNode(layer, 'battle-fx-float ' + cls, c.x, c.y, label);
        n.style.setProperty('--fx-duration', (duration - lag) + 'ms');
        n.style.setProperty('--fx-color', tint);
        if (ev.kind !== 'miss' && !reduce) {
            const ring = fxNode(layer, 'battle-fx-impact ' + (style === 'melee' && attack ? 'slash' : 'ring'), c.x, c.y);
            ring.style.setProperty('--fx-color', tint);
            ring.style.setProperty('--fx-size', Math.min(c.w, c.h) * .88 + 'px');
            if (ev.kind === 'damage' && ev.amount > 0)
                current.animate([
                    { translate: '0 0', filter: ev.defeated ? 'grayscale(0)' : 'brightness(1)' }, { translate: '-5px 0', filter: 'brightness(1.25)' }, { translate: '5px 0' }, { translate: '-3px 0' }, { translate: '0 0', filter: ev.defeated ? 'grayscale(1)' : 'brightness(1)' }
                ], { duration: ev.defeated ? 490 : 300 });
            else
                current.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.35)' }, { filter: 'brightness(1)' }], { duration: 330 });
        }
        if (ev.defeated) {
            const d = fxNode(layer, 'battle-fx-float defeat', c.x, c.y + 28, 'DERROTADO');
            d.style.setProperty('--fx-duration', (duration - lag) + 'ms');
        }
    };
    if (lag)
        setTimeout(impact, lag);
    else
        impact();
}

function fxFlush() {
    const a = arenaState();
    if (!arenaDialog.open || a !== fxArena) {
        fxReset();
        return;
    }
    if (!arenaDialog.classList.contains('tcg-live') || document.querySelector('dialog[open]:not(#arenaDialog)'))
        return;
    if (!fxQueue.length)
        return;
    // Adjacent distinct targets can animate together (area effects); repeated strikes on one target remain separate.
    const batch = [fxQueue.shift()], ids = new Set([batch[0].target]);
    while (fxQueue.length && batch.length < 12 && !ids.has(fxQueue[0].target) && fxQueue[0].kind === batch[0].kind && fxQueue[0].source === batch[0].source) {
        const e = fxQueue.shift();
        ids.add(e.target);
        batch.push(e);
    }
    fxPlaying = true;
    const gen = fxGeneration, l = fxLayer();
    for (const e of batch)
        fxPlay(e, l);
    fxTimer = setTimeout(() => {
        if (gen !== fxGeneration)
            return;
        fxTimer = 0;
        l.remove();
        fxPlaying = false;
        if (fxQueue.length)
            fxSchedule();
        else {
            autoPromptLater();
            arenaOutcomeSchedule();
        }
    }, fxReduced() ? 320 : 790);
}
document.addEventListener('close', () => {
    fxSchedule();
    if (arenaDialog.open && arenaState()) {
        autoPromptLater();
        arenaOutcomeSchedule();
    }
}, true);
arenaDialog.addEventListener('close', fxReset);
// Bibliotecas compartilháveis — modelos independentes das fichas.

