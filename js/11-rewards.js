// ==============================================================================
// RESUMO DE BATALHA E RECOMPENSAS
// ==============================================================================
const battleSummaryDialog = restDialogMake('battleSummaryDialog');
battleSummaryDialog.setAttribute('aria-label', 'Resumo da batalha');
function battleSummaryPlayers(a) {
    const seen = new Set();
    return a.participants.filter(x => {
        if (x.kind !== 'player' || seen.has(x.playerId) || !arenaPlayer(x))
            return false;
        seen.add(x.playerId);
        return true;
    });
}

// Preparar a recompensa sem alterar a ficha original, usando as regras existentes.
function battleRewardPlan(p, xp, coins, items) {
    const old = Number(p.xp);
    if (!Number.isSafeInteger(xp) || xp < 0 || !Number.isSafeInteger(old) || old < 0 || !Number.isSafeInteger(old + xp))
        throw Error('XP inválido para ' + p.name + '.');
    if (!validMoney(coins))
        throw Error('Moedas inválidas para ' + p.name + '.');
    let wallet;
    try {
        wallet = coinSplit(coinTotal(coinsOf(p)) + coinTotal(coins));
    }
    catch {
        throw Error('Limite de moedas excedido para ' + p.name + '.');
    }
    const plan = { p, xp: old + xp, coins: wallet };
    if (items.length) {
        const trial = cloneItem(p);
        const grouped = new Map();
        for (const { template, quantity } of items) {
            if (!template || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000)
                throw Error('Item ou quantidade inválida para ' + p.name + '.');
            const g = grouped.get(template.id);
            if (g) {
                g.quantity += quantity;
                if (g.quantity > 1000000)
                    throw Error('Quantidade máxima excedida para ' + p.name + '.');
            }
            else
                grouped.set(template.id, { template, quantity });
        }
        for (const { template, quantity } of grouped.values()) {
            const q = libTemplate('equipment', template);
            q.id = itemId();
            q.quantity = quantity;
            if (!marketRoom(trial, q))
                throw Error('Mochila de ' + p.name + ' sem espaço para ' + q.name + '. Remova ou ajuste a recompensa antes de confirmar.');
        }
        plan.bagSlots = trial.bagSlots;
    }
    return plan;
}

async function battleRewardCommit(a, plans) {
    if (arenaState() !== a)
        throw Error('A batalha não está mais disponível.');
    const keys = ['xp', 'coins', 'bagSlots', 'restState', 'hp', 'mp'];
    const previous = battleSummaryPlayers(a).map(x => {
        const p = arenaPlayer(x);
        return { p, props: keys.map(k => ({ k, value: p[k], had: Object.prototype.hasOwnProperty.call(p, k) })) };
    });
    const incident = a.guardIncident ? market().incidents.find(i => i.id === a.guardIncident) : null, oldStatus = incident?.status;
    try {
        for (const q of plans) {
            q.p.xp = q.xp;
            q.p.coins = q.coins;
            if (q.bagSlots)
                q.p.bagSlots = q.bagSlots;
        }
        restSaveEncounter(a);
        for (const { p } of previous) {
            p.hp = clamp(p.hp, 0, Rules.maxHP(p));
            p.mp = clamp(p.mp, 0, Rules.maxMP(p));
        }
        if (incident)
            incident.status = a.outcomeShown || 'encerrado';
        delete state.arena;
        await Store.flush();
    }
    catch (err) {
        state.arena = a;
        for (const { p, props } of previous)
            for (const { k, value, had } of props) {
                if (had)
                    p[k] = value;
                else
                    delete p[k];
            }
        if (incident)
            incident.status = oldStatus;
        throw Error('Não foi possível salvar. Nenhuma recompensa foi concedida e a batalha permanece aberta.');
    }
}

function battleSummaryOpen(a) {
    if (!a || arenaState() !== a || battleSummaryDialog.open)
        return;
    if (fxBusy(a) || arenaAttackPending || powerRun || conditionRoll || pendingArenaRoll || conditionPending(a) || autoPending(a)) {
        toast('Resolva as ações, condições e reações pendentes antes de encerrar.');
        return;
    }
    const players = battleSummaryPlayers(a), outcome = a.outcomeShown, allies = a.participants.filter(x => x.side === 'ally'), enemies = a.participants.filter(x => x.side === 'enemy'), down = a.participants.filter(x => !arenaAlive(x)).length;
    let catalog = libList('equipment').slice().sort((x, y) => x.name.localeCompare(y.name, 'pt-BR'));
    const side = (list, label) => `<section class="bs-side"><h3>${label}</h3>${list.map(x => {
        const d = arenaData(x);
        return `<div class="bs-combatant"><span>${esc(d.name)}</span><small class="${d.hp > 0 ? 'bs-live' : 'bs-down'}">${d.hp > 0 ? 'Sobrevivente' : 'Derrotado'} · ${d.hp}/${d.maxHP} PV</small></div>`;
    }).join('') || '<small>Nenhum participante.</small>'}</section>`;
    const fieldHTML = (name, attr, max, j = -1) => `<label class="bs-count-card"><span class="bs-count-title">${j < 0 ? '<span class="bs-xp-icon">XP</span>' : `<img src="${['assets/images/beaceba8a79b8bd64ebc71c3.webp','assets/images/5a5405fd7fd92c6bf69f9c36.webp','assets/images/988dba89541f904a9c08271c.webp'][j]}" alt="">`}${name}</span><span class="bs-stepper"><button type="button" data-bs-step="-1" aria-label="Diminuir ${name}">−</button><input type="number" inputmode="numeric" min="0" max="${max}" step="1" value="0" required ${attr}><button type="button" data-bs-step="1" aria-label="Aumentar ${name}">+</button></span></label>`;
    battleSummaryDialog.innerHTML = `<form><h2>⚔ Resumo da batalha</h2><p style="text-align:center">${outcome === 'victory' ? 'Vitória dos aliados' : outcome === 'defeat' ? 'Derrota dos aliados' : 'Encerramento manual'}</p><div class="bs-stat"><div><b>${a.initiativePhase && !a.current ? 0 : a.round}</b><small>Rodadas</small></div><div><b>${enemies.filter(x => !arenaAlive(x)).length}</b><small>Inimigos derrotados</small></div><div><b>${a.participants.length - down}</b><small>Sobreviventes</small></div></div><div class="bs-sides">${side(allies, 'Aliados')}${side(enemies, 'Inimigos')}</div><h3>Distribuição de recompensas</h3><p>O mestre decide o XP, as moedas e os itens de cada personagem. Nada é calculado automaticamente.</p>${players.map((x, i) => {
        const p = arenaPlayer(x);
        return `<section class="bs-reward" data-reward-index="${i}"><h4>${esc(p.name)}</h4><small>${x.side === 'ally' ? 'Aliado' : 'Inimigo'} · XP atual: ${esc(p.xp)} · ${arenaAlive(x) ? 'Sobrevivente' : 'Derrotado'}</small><small>Saldo atual: ${esc(moneyText(coinsOf(p)))}</small><div class="bs-reward-grid">${fieldHTML('XP', 'data-reward-xp', Number.MAX_SAFE_INTEGER - Math.max(0, Number(p.xp) || 0))}${moneyNames.map((n, j) => fieldHTML(n, `data-reward-coin="${j}"`, Number.MAX_SAFE_INTEGER, j)).join('')}</div><div class="bs-reward-items"><small>Itens da biblioteca de equipamentos</small><div data-item-rows></div><button type="button" class="bs-add-item" data-bs-add>+ Adicionar item</button></div></section>`;
    }).join('') || '<p>Nenhum personagem de jogador participou.</p>'}<div class="bs-total">XP total a conceder: <b id="bsTotal">0</b><span>Moedas: <b id="bsMoneyTotal">0 ouro · 0 prata · 0 bronze</b></span><span>Itens (unidades): <b id="bsItemTotal">0</b></span></div><p>Ao confirmar, XP e moedas serão somados às fichas e os itens irão para as mochilas. A biblioteca não será consumida. PV, PM, condições e recargas seguem as regras atuais. O registro do encontro será descartado.</p><p class="bs-error" role="alert"></p><div class="bs-actions"><button type="button" data-bs-back>Voltar à batalha</button><button type="submit" class="bs-confirm-green">✓ Confirmar e encerrar</button></div></form>`;
    const form = battleSummaryDialog.querySelector('form'), cards = [...form.querySelectorAll('[data-reward-index]')], error = form.querySelector('.bs-error'), submit = form.querySelector('[type=submit]');
    const format = n => n.toLocaleString('pt-BR'), amount = f => f && f.validity.valid && f.value !== '' && Number.isSafeInteger(Number(f.value)) ? BigInt(Number(f.value)) : 0n;
    const update = () => {
        let xp = 0n, coins = [0n, 0n, 0n], items = 0n;
        for (const card of cards) {
            xp += amount(card.querySelector('[data-reward-xp]'));
            card.querySelectorAll('[data-reward-coin]').forEach((f, i) => coins[i] += amount(f));
            for (const r of card.querySelectorAll('.bs-item-row'))
                if (r.querySelector('select').value !== '')
                    items += amount(r.querySelector('input'));
        }
        form.querySelector('#bsTotal').textContent = format(xp);
        form.querySelector('#bsMoneyTotal').textContent = coins.map((v, i) => format(v) + ' ' + moneyNames[i].toLowerCase()).join(' · ');
        form.querySelector('#bsItemTotal').textContent = format(items);
    };
    form.addEventListener('input', () => {
        error.textContent = '';
        update();
    });
    form.addEventListener('change', update);
    function refreshRewardLibrary(createdIds = [], targetRow = null) {
        catalog = libList('equipment').slice().sort((x,y) => x.name.localeCompare(y.name,'pt-BR'));
        for (const row of form.querySelectorAll('.bs-item-row')) {
            const select = row.querySelector('select');
            const selectedId = select.selectedOptions[0]?.dataset.itemId;
            select.innerHTML = `<option value="">Selecione…</option>${catalog.map((x,i) => `<option value="${i}" data-item-id="${esc(x.id)}">${esc(x.name)} · ${esc(x.category)}</option>`).join('')}`;
            const desired = (row === targetRow && createdIds[0]) || selectedId;
            if (desired) {
                const idx = catalog.findIndex(x=>x.id === desired);
                if(idx >= 0) select.value = String(idx);
            }
        }
        update();
    }
    let rewardLibraryBefore = null, rewardLibraryRow = null;
    libDialog.addEventListener('close', () => {
        if (!rewardLibraryBefore || !battleSummaryDialog.open) return;
        const created = libList('equipment').filter(x => !rewardLibraryBefore.has(x.id)).map(x=>x.id);
        rewardLibraryBefore = null;
        refreshRewardLibrary(created, rewardLibraryRow);
        rewardLibraryRow = null;
    }, { signal: (() => {const controller = new AbortController(); battleSummaryDialog.addEventListener('close',()=>controller.abort(),{once:true}); return controller.signal;})() });
    form.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b)
            return;
        if (b.hasAttribute('data-bs-step')) {
            const input = b.closest('.bs-stepper').querySelector('input');
            const value = Number(input.value) || 0, delta = Number(b.dataset.bsStep);
            input.value = String(Math.max(0,Math.min(Number(input.max),value + delta)));
            input.dispatchEvent(new Event('input',{bubbles:true}));
        }
        else if (b.hasAttribute('data-bs-new')) {
            rewardLibraryBefore = new Set(libList('equipment').map(x=>x.id));
            rewardLibraryRow = b.closest('.bs-item-row');
            libraryOpen('equipment');
            // A biblioteca permite criar um modelo e retornar à recompensa.
        }
        else if (b.hasAttribute('data-bs-add')) {
            const host = b.closest('.bs-reward').querySelector('[data-item-rows]'), row = document.createElement('div');
            row.className = 'bs-item-row';
            row.innerHTML = `<label>Item<select required><option value="">Selecione…</option>${catalog.map((x, i) => `<option value="${i}" data-item-id="${esc(x.id)}">${esc(x.name)} · ${esc(x.category)}</option>`).join('')}</select></label><label>Qtd.<input type="number" inputmode="numeric" min="1" max="1000000" step="1" value="1" required></label><button type="button" data-bs-remove aria-label="Remover item">✕</button><button type="button" data-bs-new>+ Criar item na biblioteca</button>`;
            host.append(row);
            row.querySelector('select').focus();
            update();
        }
        else if (b.hasAttribute('data-bs-remove')) {
            b.closest('.bs-item-row').remove();
            error.textContent = '';
            update();
        }
    });
    form.querySelector('[data-bs-back]').onclick = () => battleSummaryDialog.close();
    form.onsubmit = async e => {
        e.preventDefault();
        if (arenaState() !== a || submit.disabled)
            return;
        error.textContent = '';
        if (!form.reportValidity())
            return;
        try {
            const plans = cards.map((card, i) => {
                const p = arenaPlayer(players[i]);
                if (!p)
                    throw Error('Personagem indisponível.');
                const items = [...card.querySelectorAll('.bs-item-row')].map(r => ({ template: catalog[Number(r.querySelector('select').value)], quantity: Number(r.querySelector('input').value) }));
                return battleRewardPlan(p, Number(card.querySelector('[data-reward-xp]').value), [...card.querySelectorAll('[data-reward-coin]')].map(f => Number(f.value)), items);
            });
            submit.disabled = true;
            await battleRewardCommit(a, plans);
        }
        catch (err) {
            error.textContent = err.message || 'Não foi possível distribuir as recompensas.';
            submit.disabled = false;
            return;
        }
        battleSummaryDialog.close();
        arenaDialog.close();
        toast('Batalha encerrada. Recompensas registradas nas fichas.');
    };
    battleSummaryDialog.showModal();
}
/* v0.9.0 — diário e missões, dados locais da campanha */

