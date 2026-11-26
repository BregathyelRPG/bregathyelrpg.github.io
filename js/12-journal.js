// ==============================================================================
// DIÁRIO E MISSÕES
// ==============================================================================
const journalKinds = ['Acontecimento', 'NPC', 'Lugar', 'Informação'];
const journalStatuses = { active: 'Em andamento', pending: 'Pendente', done: 'Concluída', failed: 'Fracassada' };
let journalTab = 'campaign', journalFilter = 'all', journalQuery = '';
function journalData(s = state) {
    return s.journal || { notes: [], quests: [] };
}

function journalValidate(j) {
    if (!j || !Array.isArray(j.notes) || !Array.isArray(j.quests) || j.notes.length > 10000 || j.quests.length > 10000)
        throw Error('Estrutura do diário inválida.');
    const ids = new Set(), str = (v, n) => typeof v === 'string' && v.length <= n, identifier = v => typeof v === 'string' && /^[\w-]{1,150}$/.test(v), stamp = v => str(v, 40) && Number.isFinite(Date.parse(v));
    for (const n of j.notes) {
        if (!n || !identifier(n.id) || ids.has(n.id) || !str(n.title, 120) || !n.title.trim() || !str(n.body, 20000) || !stamp(n.created) || !stamp(n.updated) || !['campaign', 'personal'].includes(n.scope) || !journalKinds.includes(n.kind) || !str(n.ownerName, 200) || !(n.scope === 'campaign' ? n.ownerId === '' : identifier(n.ownerId)))
            throw Error('Anotação inválida.');
        ids.add(n.id);
    }
    for (const q of j.quests) {
        if (!q || !identifier(q.id) || ids.has(q.id) || !str(q.title, 120) || !q.title.trim() || !str(q.body, 20000) || !str(q.reward, 2000) || !stamp(q.created) || !stamp(q.updated) || !Object.hasOwn(journalStatuses, q.status) || !['Principal', 'Secundária', 'Pessoal'].includes(q.kind) || !Array.isArray(q.members) || q.members.length > 10000 || !q.members.every(m => m && identifier(m.ownerId) && str(m.name, 200)) || new Set(q.members.map(m => m.ownerId)).size !== q.members.length || !Array.isArray(q.objectives) || q.objectives.length > 100 || !q.objectives.every(o => o && str(o.text, 300) && o.text.trim() && typeof o.done === 'boolean'))
            throw Error('Missão inválida.');
        ids.add(q.id);
    }
    return j;
}

function journalCommit(next) {
    journalValidate(next);
    const old = state.journal, had = Object.hasOwn(state, 'journal');
    state.journal = next;
    try {
        Store.save();
    }
    catch (e) {
        if (had)
            state.journal = old;
        else
            delete state.journal;
        throw Error('Não foi possível salvar. As alterações não foram registradas.');
    }
}

function journalChange(fn) {
    const next = cloneItem(journalData());
    fn(next);
    journalCommit(next);
}

function journalDate(t) {
    return new Date(t).toLocaleDateString('pt-BR');
}

function journalOwner(m) {
    return state.characters.find(p => p.marketId === m.ownerId)?.name || m.name || m.ownerName || 'Personagem removido';
}

function journalError(e) {
    const el = $('journalError');
    if (el)
        el.textContent = e.message || 'Não foi possível realizar a operação.';
}

function journalOpen(t = 'campaign') {
    journalTab = t;
    journalFilter = 'all';
    journalQuery = '';
    journalDraw();
    const d = $('journalDialog');
    if (!d.open)
        d.showModal();
}

function journalDraw() {
    const d = restDialogMake('journalDialog'), j = journalData(), personal = journalTab === 'personal', quest = journalTab === 'quests', p = state.characters.includes(c()) ? c() : null;
    d.innerHTML = `<div class="journal-heading"><div><small>O TOMO DOS AVENTUREIROS</small><h2>Diário e missões</h2></div><button type="button" data-j-close>Fechar</button></div><div class="journal-tabs">${[['campaign', 'Diário de campanha'], ['quests', 'Missões'], ['personal', 'Anotações pessoais']].map(([k, t]) => `<button type="button" data-j-tab="${k}" aria-pressed="${journalTab === k}">${t}</button>`).join('')}</div><p class="journal-intro">${quest ? 'Registre objetivos, acompanhe o progresso e defina as recompensas livremente.' : 'Registre suas aventuras sem interferir nas mecânicas da ficha.'}${personal ? ` Personagem ativo: <b>${esc(p?.name || 'Nenhum')}</b>. Anotações locais, sem controle de acesso.` : ''}</p><div class="journal-toolbar"><button type="button" data-j-new ${personal && !p ? 'disabled' : ''}>+ ${quest ? 'Nova missão' : 'Nova anotação'}</button><input id="journalSearch" aria-label="Pesquisar" placeholder="Pesquisar…" value="${esc(journalQuery)}"><select id="journalFilter" aria-label="Filtrar"><option value="all">${quest ? 'Todas as situações' : 'Todas as categorias'}</option>${(quest ? Object.entries(journalStatuses) : journalKinds.map(k => [k, k])).map(([k, v]) => `<option value="${esc(k)}" ${journalFilter === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div><p id="journalError" role="alert"></p><div id="journalRows"></div>`;
    d.querySelector('[data-j-close]').onclick = () => d.close();
    d.querySelectorAll('[data-j-tab]').forEach(b => b.onclick = () => {
        journalTab = b.dataset.jTab;
        journalFilter = 'all';
        journalQuery = '';
        journalDraw();
    });
    d.querySelector('[data-j-new]').onclick = () => quest ? journalQuestEdit() : journalNoteEdit();
    $('journalFilter').onchange = e => {
        journalFilter = e.target.value;
        journalRows();
    };
    $('journalSearch').oninput = e => {
        journalQuery = e.target.value;
        journalRows();
    };
    journalRows();
}

function journalRows() {
    const j = journalData(), quest = journalTab === 'quests', query = journalQuery.trim().toLocaleLowerCase('pt-BR'), p = c();
    const rows = (quest ? j.quests : j.notes.filter(n => n.scope === journalTab && (n.scope !== 'personal' || n.ownerId === p.marketId))).filter(x => (journalFilter === 'all' || (quest ? x.status : x.kind) === journalFilter) && [x.title, x.body, x.kind, x.reward, ...(x.objectives || []).map(o => o.text), ...(x.members || []).map(journalOwner)].join(' ').toLocaleLowerCase('pt-BR').includes(query)).slice().sort((a, b) => b.updated.localeCompare(a.updated));
    $('journalRows').innerHTML = rows.map(x => quest ? `<article class="journal-card"><div class="journal-card-top"><div><small>${esc(x.kind)} · ${journalDate(x.updated)}</small><h3>${esc(x.title)}</h3></div><span class="journal-status" data-status="${x.status}">${journalStatuses[x.status]}</span></div>${x.body ? `<div class="journal-body">${esc(x.body)}</div>` : ''}<small>Participantes: ${x.members.length ? x.members.map(m => esc(journalOwner(m))).join(', ') : 'Grupo / não especificados'}</small>${x.objectives.length ? `<div class="journal-progress"><span>${x.objectives.filter(o => o.done).length} de ${x.objectives.length} objetivos</span><progress value="${x.objectives.filter(o => o.done).length}" max="${x.objectives.length}"></progress></div><div class="journal-objectives">${x.objectives.map((o, i) => `<label><input type="checkbox" data-j-objective="${i}" data-j-id="${esc(x.id)}" ${o.done ? 'checked' : ''} ${['done', 'failed'].includes(x.status) ? 'disabled' : ''}><span>${esc(o.text)}</span></label>`).join('')}</div>` : ''}${x.reward ? `<div class="journal-reward"><b>Recompensa prevista</b><div class="journal-body">${esc(x.reward)}</div></div>` : ''}<div class="journal-actions"><button data-j-edit="${esc(x.id)}">Editar</button><label>Situação <select data-j-status="${esc(x.id)}">${Object.entries(journalStatuses).map(([k, v]) => `<option value="${k}" ${x.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label><button data-j-delete="${esc(x.id)}">Excluir</button></div></article>` : `<article class="journal-card"><div class="journal-card-top"><div><small>${esc(x.kind)} · ${journalDate(x.updated)}</small><h3>${esc(x.title)}</h3></div></div><div class="journal-body">${esc(x.body)}</div><div class="journal-actions"><button data-j-edit="${esc(x.id)}">Editar</button><button data-j-delete="${esc(x.id)}">Excluir</button></div></article>`).join('') || '<p class="journal-empty">Nenhum registro encontrado. Crie o primeiro ou altere os filtros.</p>';
    const host = $('journalRows');
    host.onclick = async (e) => {
        const b = e.target.closest('button');
        if (!b)
            return;
        try {
            if (b.dataset.jEdit) {
                const x = (quest ? journalData().quests : journalData().notes).find(x => x.id === b.dataset.jEdit);
                if (x)
                    quest ? journalQuestEdit(x) : journalNoteEdit(x);
            }
            else if (b.dataset.jDelete) {
                const id = b.dataset.jDelete;
                if (await openSiteDialog({ title: 'Excluir registro?', message: 'Esta anotação ou missão será removida do diário.', confirm: true, danger: true }) !== true)
                    return;
                journalChange(j => {
                    const k = quest ? 'quests' : 'notes';
                    j[k] = j[k].filter(x => x.id !== id);
                });
                journalRows();
            }
        }
        catch (err) {
            journalError(err);
        }
    };
    host.onchange = e => {
        const f = e.target;
        try {
            if (f.dataset.jStatus) {
                journalChange(j => {
                    const q = j.quests.find(x => x.id === f.dataset.jStatus);
                    if (!q)
                        throw Error('Missão indisponível.');
                    q.status = f.value;
                    q.updated = new Date().toISOString();
                });
            }
            else if (f.dataset.jId) {
                journalChange(j => {
                    const q = j.quests.find(x => x.id === f.dataset.jId);
                    if (!q || ['done', 'failed'].includes(q.status) || !q.objectives[Number(f.dataset.jObjective)])
                        throw Error('Objetivo indisponível.');
                    q.objectives[Number(f.dataset.jObjective)].done = f.checked;
                    q.updated = new Date().toISOString();
                });
            }
            else
                return;
            journalRows();
        }
        catch (err) {
            journalRows();
            journalError(err);
        }
    };
}

function journalEditor(title, markup, save) {
    const d = restDialogMake('journalEditDialog');
    d.innerHTML = `<h2>${esc(title)}</h2><form class="journal-form">${markup}<p class="journal-edit-error" role="alert"></p><div class="journal-actions"><button type="submit">Salvar</button><button type="button" data-j-cancel>Cancelar</button></div></form>`;
    const f = d.querySelector('form');
    f.querySelector('[data-j-cancel]').onclick = () => d.close();
    f.onsubmit = e => {
        e.preventDefault();
        if (!f.reportValidity())
            return;
        try {
            save(f);
            d.close();
            journalRows();
            toast('Registro salvo.');
        }
        catch (err) {
            f.querySelector('.journal-edit-error').textContent = err.message || 'Não foi possível salvar.';
        }
    };
    d.showModal();
    return f;
}

function journalText(label, name, value, max, required = false) {
    return `<label>${label}<textarea name="${name}" maxlength="${max}" rows="5" ${required ? 'required' : ''}>${esc(value || '')}</textarea></label>`;
}

function journalTitle(x) {
    return `<label>Título<input name="entryTitle" maxlength="120" value="${esc(x?.title || '')}" required></label>`;
}

function journalNoteEdit(n) {
    const scope = n?.scope || journalTab, owner = scope === 'personal' ? (n ? { marketId: n.ownerId, name: n.ownerName } : state.characters.includes(c()) ? c() : null) : null;
    if (scope === 'personal' && !owner)
        return;
    journalEditor(n ? 'Editar anotação' : 'Nova anotação', journalTitle(n) + `<label>Categoria<select name="kind">${journalKinds.map(k => `<option ${n?.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label>` + journalText('Anotação', 'body', n?.body, 20000, true), f => {
        const now = new Date().toISOString(), entry = {
            id: n?.id || itemId(), scope, ownerId: owner?.marketId || '', ownerName: String(owner?.name || '').slice(0, 200), kind: f.elements.kind.value, title: f.elements.entryTitle.value.trim(), body: f.elements.body.value.trim(), created: n?.created || now, updated: now
        };
        if (!entry.title || !entry.body)
            throw Error('Preencha título e anotação.');
        journalChange(j => {
            const i = j.notes.findIndex(x => x.id === entry.id);
            if (i < 0)
                j.notes.push(entry);
            else
                j.notes[i] = entry;
        });
    });
}

function journalQuestEdit(q) {
    const members = state.characters.map(p => ({ ownerId: p.marketId, name: String(p.name || '').slice(0, 200) }));
    for (const m of q?.members || [])
        if (!members.some(p => p.ownerId === m.ownerId))
            members.push(m);
    journalEditor(q ? 'Editar missão' : 'Nova missão', journalTitle(q) + `<div class="journal-form-grid"><label>Tipo<select name="kind">${['Principal', 'Secundária', 'Pessoal'].map(k => `<option ${q?.kind === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label><label>Situação<select name="status">${Object.entries(journalStatuses).map(([k, v]) => `<option value="${k}" ${(q?.status || 'pending') === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div>` + journalText('Descrição', 'body', q?.body, 20000) + `<fieldset><legend>Participantes (opcional)</legend><div class="journal-objectives">${members.map(m => `<label><input type="checkbox" name="members" value="${esc(m.ownerId)}" ${q?.members.some(z => z.ownerId === m.ownerId) ? 'checked' : ''}> ${esc(journalOwner(m))}</label>`).join('') || '<small>Nenhum personagem cadastrado.</small>'}</div></fieldset>` + journalText('Objetivos (um por linha)', 'objectives', q?.objectives.map(o => o.text).join('\n'), 30100) + journalText('Recompensa prevista (XP, moedas, itens ou outras)', 'reward', q?.reward, 2000) + '<small>As recompensas são apenas registradas aqui. O mestre concede os valores e itens pelas ferramentas existentes. A conclusão é sempre manual.</small>', f => {
        const now = new Date().toISOString(), lines = f.elements.objectives.value.split('\n').map(x => x.trim()).filter(Boolean);
        if (lines.length > 100 || lines.some(x => x.length > 300))
            throw Error('Até 100 objetivos, com 300 caracteres cada.');
        const previous = (q?.objectives || []).slice(), objectives = lines.map(text => {
            const i = previous.findIndex(o => o.text === text);
            return { text, done: i >= 0 ? previous.splice(i, 1)[0].done : false };
        });
        const ids = new Set(new FormData(f).getAll('members'));
        const entry = {
            id: q?.id || itemId(), title: f.elements.entryTitle.value.trim(), kind: f.elements.kind.value, status: f.elements.status.value, body: f.elements.body.value.trim(), reward: f.elements.reward.value.trim(), members: members.filter(m => ids.has(m.ownerId)), objectives, created: q?.created || now, updated: now
        };
        if (!entry.title)
            throw Error('Preencha o título.');
        if (entry.kind === 'Pessoal' && !entry.members.length)
            throw Error('Selecione ao menos um personagem para uma missão pessoal.');
        journalChange(j => {
            const i = j.quests.findIndex(x => x.id === entry.id);
            if (i < 0)
                j.quests.push(entry);
            else
                j.quests[i] = entry;
        });
    });
}
async function bootBregathyel() {
    const indicator = document.getElementById('storageStatus');
    try {
        const loaded = await Store.init();
        adoptLoadedState(loaded);
        // Migração única: versões anteriores gravavam os catálogos prontos nas
        // bibliotecas de Equipamentos e Magias. Nesta campanha não há modelos
        // próprios a conservar nessas duas áreas; ambas começam vazias.
        // O marcador impede que cópias feitas posteriormente sejam apagadas.
        let librariesReset = false;
        if (!state.librarySeparationV0942) {
            state.contentLibraries ??= {};
            state.contentLibraries.equipment = [];
            state.contentLibraries.spells = [];
            state.librarySeparationV0942 = true;
            librariesReset = true;
        }
        if (indicator) { indicator.textContent = ''; indicator.hidden = true; }
        if (Store.backend !== 'indexedDB') toast('IndexedDB indisponível: armazenamento limitado. Exporte um backup regularmente.');
        marketInit();
        // Desenvolvimento: os itens das fichas são apenas testes e não
        // precisam ser preservados quando seus modelos forem substituídos.
        const replacedModels = purgeRetiredArmorsV0931(state) + replaceLegacyShieldsV0932(state) + updateAccessoriesV0933(state) + updateConsumablesV0934(state) + purgeDecorativeQuiverV0935(state);
        if (replacedModels || librariesReset) {
            try { await Store.save(); }
            catch (e) { toast('Não foi possível salvar a atualização dos equipamentos antigos.'); }
        }
        render();
    } catch (err) {
        if (indicator) { indicator.hidden = false; indicator.textContent = 'Falha na abertura do banco local'; }
        toast('Não foi possível abrir os dados da campanha. Abra Backup completo para recuperar os dados originais.');
        // Não inicializar com uma ficha vazia para evitar sobrescrever informações existentes.
        Store.blocked = true;
        marketInit();
        render();
    } finally {
        document.body.removeAttribute('data-app-loading');
        document.getElementById('storageLoading')?.remove();
    }
}
bootBregathyel();


