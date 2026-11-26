// ==============================================================================
// PERSISTÊNCIA — backup, campanha e tutorial
// ==============================================================================
function packState(s) {
    const copy = { ...s };
    if (Array.isArray(s.characters) && s.characters.length)
        delete copy.character;
    return JSON.stringify(copy);
}

// Guardas podem ser criaturas pessoais ou modelos padrão do jogo.
// Os modelos padrão são lidos da memória, sem entrar no Bestiário salvo ou no JSON.
function guardAvailableBeasts() {
    return [...bestiary(), ...beastStandardModels()];
}
function guardRoster(n) {
    if (!n) return [];
    const available = guardAvailableBeasts();
    const byId = new Map(available.map(b => [String(b.id), b]));
    const byName = name => available.find(b => b.name.trim().toLocaleLowerCase('pt-BR') === String(name).trim().toLocaleLowerCase('pt-BR'));
    const refs = Array.isArray(n.guardRefs) ? n.guardRefs : (n.guards || []).map(name => ({ id: byName(name)?.id, count: 1 }));
    return refs.flatMap(g => {
        const b = byId.get(String(g.id)) || (g.name ? byName(g.name) : null);
        const count = Number(g.count);
        return b && Number.isInteger(count) && count > 0 && count <= 30 ? [{ b, count }] : [];
    });
}
function guardFields(n) {
    const roster = guardRoster(n);
    const available = guardAvailableBeasts();
    const render = list => list.map(b => `<label style="display:grid;grid-template-columns:1fr 85px;align-items:center;gap:8px;margin:5px 0"><span>${esc(b.name)} · Nv. ${esc(b.level)}</span><input type="number" min="0" max="30" step="1" data-guard-id="${esc(b.id)}" value="${roster.find(g => g.b.id === b.id)?.count || 0}" aria-label="Quantidade de ${esc(b.name)}"></label>`).join('');
    const custom = available.filter(b => !String(b.id).startsWith('beast-standard-'));
    const standard = available.filter(b => String(b.id).startsWith('beast-standard-'));
    return `<fieldset><legend>Guardas do Bestiário</legend><small>Use criaturas padrão ou cadastradas. Quantidade 0 = não participa. Máximo de 30 guardas por comerciante.</small>${custom.length ? `<h3>Criaturas cadastradas</h3>${render(custom)}` : ''}<h3>Modelos padrão</h3>${render(standard)}</fieldset>`;
}
function readGuardFields(f) {
    return [...f.querySelectorAll('[data-guard-id]')].map(el => ({ id: el.dataset.guardId, count: Number(el.value) })).filter(g => Number.isInteger(g.count) && g.count > 0 && g.count <= 30);
}
marketDialog.addEventListener('submit', e => {
    if (e.target.id === 'marketMerchant' && readGuardFields(e.target).reduce((n, g) => n + g.count, 0) > 30) {
        e.preventDefault();
        e.stopImmediatePropagation();
        toast('Máximo de 30 guardas por comerciante.');
    }
}, true);
function guardEncounter(i) {
    if (!i || i.status !== 'pendente' || arenaState())
        return toast('Confronto pendente. Encerre o encontro atual antes de prosseguir.');
    const p = marketFind(i.character), n = marketFind('n:' + i.merchant), roster = guardRoster(i.guardRefs?.length ? i : n || i);
    if (!p || p.hp <= 0 || !roster.length || roster.reduce((n, g) => n + g.count, 0) > 30)
        return toast('Configure os guardas no comerciante e verifique se o personagem está vivo.');
    const a = { round: 1, current: null, sequenceCurrent: null, participants: [], serial: {}, log: [], guardIncident: i.id, initiativePhase: 'start' };
    arenaAdd(a, [{ p, side: 'ally' }], roster.map(g => ({ ...g, side: 'enemy' })));
    arenaLog(a, `${p.name} foi descoberto ao tentar roubar ${n?.name || 'um comerciante'}.`);
    state.arena = a;
    i.status = 'em combate';
    if (!persist()) {
        delete state.arena;
        i.status = 'pendente';
        return;
    }
    arenaOpen();
}

function guardIncidents() {
    const d = restDialogMake('guardIncidents');
    d.innerHTML = `<h2>Confrontos pendentes</h2>${market().incidents.filter(i => i.status === 'pendente').map(i => `<p>${esc(marketFind(i.character)?.name || 'Personagem indisponível')} · ${esc(marketFind('n:' + i.merchant)?.name || 'Comerciante')} <button data-incident="${esc(i.id)}">Preparar confronto</button></p>`).join('') || '<p>Nenhum confronto pendente.</p>'}<button data-close>Fechar</button>`;
    d.onclick = e => {
        const b = e.target.closest('button');
        if (!b)
            return;
        d.close();
        if (b.dataset.incident)
            guardEncounter(market().incidents.find(i => i.id === b.dataset.incident));
    };
    d.showModal();
}

let drawResolving = false;
async function resolveDraw(a) {
    if (drawResolving)
        return;
    drawResolving = true;
    try {
        const win = await openSiteDialog({ title: 'Derrota simultânea', message: 'Ambos os lados chegaram a zero PV. OK: vitória dos aliados. Cancelar: derrota dos aliados.', confirm: true });
        if (arenaState() !== a)
            return;
        const result = win === true ? 'victory' : 'defeat';
        a.outcomeShown = result;
        arenaLog(a, 'Resultado decidido pelo mestre: ' + (result === 'victory' ? 'vitória' : 'derrota') + '.');
        persist();
        arenaRender();
        arenaBattleOutcome(result);
    }
    finally {
        drawResolving = false;
    }
}

async function compactPortrait(src) {
    const im = new Image();
    im.src = src;
    await im.decode();
    const scale = Math.min(1, 640 / Math.max(im.naturalWidth, im.naturalHeight));
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(im.naturalWidth * scale));
    cv.height = Math.max(1, Math.round(im.naturalHeight * scale));
    cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/webp', .88);
}

function backupPayload() {
    return { schema: 'bregathiel-campaign-1', version: APP_VERSION, createdAt: new Date().toISOString(), campaign: JSON.parse(packState(state)) };
}

async function downloadJSON(data, name) {
    try {
        const raw = typeof data === 'string' ? data : JSON.stringify(data);
        const payload = await embedBundledAssets(raw);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
        link.download = name;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(link.href), 3000);
        return true;
    } catch (err) {
        toast('Não foi possível exportar: ' + (err?.message || 'recurso indisponível.') + ' Tente novamente com o site conectado.');
        return false;
    }
}

function validateCampaign(doc) {
    const bad = m => {
        throw Error('Backup inválido: ' + m);
    };
    if (doc?.schema !== 'bregathiel-campaign-1')
        bad('use um backup completo do Bregathyel.');
    const s = cloneItem(doc.campaign);
    if (!s || !Array.isArray(s.characters) || !Number.isInteger(s.active) || s.active < 0 || s.active >= Math.max(1, s.characters.length))
        bad('personagens ou seleção.');
    const id = v => typeof v === 'string' && /^[\w-]{1,150}$/.test(v);
    const validNum = v => Number.isSafeInteger(v) && v >= 0;
    const ids = new Set();
    for (const p of s.characters) {
        if (!p || typeof p.name !== 'string' || !id(p.marketId) || ids.has(p.marketId) || !Array.isArray(p.attrs) || p.attrs.length !== 6 || !p.attrs.every(Number.isSafeInteger) || !validNum(p.hp) || !validNum(p.mp) || !validNum(p.level) || p.level < 1 || !validNum(p.xp) || !validMoney(p.coins) || !validNum(p.kills) || !Number.isFinite(p.movement))
            bad('ficha de personagem.');
        ids.add(p.marketId);
        for (const [k, max] of [['bagSlots', 40], ['equipmentSlots', 9], ['preparedWeapons', 40], ['learnedSkills', 10000], ['learnedSpells', 10000]])
            if (p[k] !== undefined && (!Array.isArray(p[k]) || p[k].length > max))
                bad('lista ' + k + '.');
    }
    const m = s.market;
    if (!m || !['npcs', 'listings', 'history', 'incidents'].every(k => Array.isArray(m[k])))
        bad('Mercado.');
    const npcs = new Set();
    for (const n of m.npcs) {
        if (!n || !id(n.id) || npcs.has(n.id) || typeof n.name !== 'string' || !Array.isArray(n.stock) || n.stock.length > 9 || !validMoney(n.coins))
            bad('comerciante.');
        npcs.add(n.id);
    }
    for (const l of m.listings) {
        if (!l || !id(l.id) || !ids.has(String(l.owner).slice(2)) || !l.item || !validMoney(l.price))
            bad('anúncio sem proprietário ou inválido.');
    }
    if (s.bestiary !== undefined && !Array.isArray(s.bestiary))
        bad('Bestiário.');
    const beasts = new Set();
    for (const b of s.bestiary || []) {
        if (!b || !id(b.id) || beasts.has(b.id) || typeof b.name !== 'string' || !validNum(b.hp) || !validNum(b.mp) || !Number.isFinite(b.ca) || !Array.isArray(b.attrs) || b.attrs.length !== 6 || !b.attrs.every(Number.isFinite))
            bad('criatura.');
        beasts.add(b.id);
    }
    if (s.arena) {
        const a = s.arena;
        if (!Array.isArray(a.participants) || !a.participants.length || a.participants.length > 60 || !Array.isArray(a.log) || !validNum(a.round) || !a.serial)
            bad('Arena.');
        const seen = new Set();
        for (const x of a.participants) {
            if (!x || !id(x.id) || seen.has(x.id) || !['ally', 'enemy'].includes(x.side) || !['player', 'beast'].includes(x.kind) || x.kind === 'player' && !ids.has(x.playerId) || x.kind === 'beast' && (!x.beast || !Array.isArray(x.beast.attrs) || !validNum(x.hp) || !validNum(x.mp)))
                bad('combatente.');
            seen.add(x.id);
        }
        if (a.current && !seen.has(a.current) || a.sequenceCurrent && !seen.has(a.sequenceCurrent))
            bad('turno inválido.');
    }
    // Reject executable URLs and broken embedded portrait fields; all exported images are local raster data.
    function walk(o, depth = 0) {
        if (depth > 100)
            bad('estrutura profunda demais.');
        if (!o || typeof o !== 'object')
            return;
        for (const [k, v] of Object.entries(o)) {
            if (['__proto__', 'constructor', 'prototype'].includes(k))
                bad('chave reservada.');
            if (['photo', 'image', 'portrait'].includes(k) && typeof v === 'string' && v && !/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v) && !/^data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+$/.test(v) && !isBundledAsset(v))
                bad('imagem externa ou inválida.');
            if (['id', 'marketId', 'playerId', 'beastId'].includes(k) && typeof v === 'string' && !id(v))
                bad('identificador inválido.');
            if (typeof v === 'object')
                walk(v, depth + 1);
        }
    }
    if (s.journal !== undefined) {
        try {
            journalValidate(s.journal);
        }
        catch (e) {
            bad(e.message);
        }
    }
    walk(s);
    s.dark = s.dark !== false;
    s.volume = clamp(number(s.volume ?? 70), 0, 100);
    s.character = s.characters[s.active] || { ...fresh(), name: '', photo: '' };
    return s;
}

async function restoreCampaign(doc) {
    const s = validateCampaign(doc);
    const before = state, wasBlocked = Store.blocked;
    adoptLoadedState(s);
    // Restaurar backup antigo não deve reintroduzir a Aljava decorativa.
    purgeDecorativeQuiverV0935(state);
    Store.blocked = false;
    try {
        await Store.flush();
    } catch (err) {
        adoptLoadedState(before);
        Store.blocked = wasBlocked;
        throw new Error('Falha ao restaurar no armazenamento. A campanha anterior foi mantida.');
    }
    tab = 0;
    marketView = 'mine';
    marketNpc = '';
    marketPage = 0;
    marketInit();
    render();
    return true;
}

function backupOpen() {
    const d = restDialogMake('backupDialog');
    const stamp = () => new Date().toISOString().slice(0, 10);
    d.innerHTML = `<h2>Backup completo</h2><p>Proteja todos os personagens, o Bestiário, o Mercado, os equipamentos, as magias o diário, as missões e a batalha em andamento em um único arquivo JSON.</p><p><small>O armazenamento do navegador depende do perfil e do endereço do aplicativo. Guarde uma cópia fora do navegador antes de atualizar.</small></p>${Store.blocked ? '<p>Não foi possível ler os dados originais. Eles não serão sobrescritos automaticamente.</p><button id="backupRaw">Exportar dados originais</button>' : ''}<div style="display:grid;gap:9px"><button id="backupExport">Exportar campanha</button><button id="backupRestore">Restaurar campanha</button><input id="backupFile" type="file" accept=".json,application/json" hidden><button id="backupCancel">Fechar</button></div><p id="backupError" role="alert"></p>`;
    $('backupExport').onclick = () => downloadJSON(backupPayload(), 'Bregathyel_campanha_' + stamp() + '.json');
    if ($('backupRaw'))
        $('backupRaw').onclick = () => {
            try {
                downloadJSON(localStorage.getItem(Store.key) || '', 'Bregathyel_dados_originais_' + stamp() + '.json');
            }
            catch {
                toast('Não foi possível ler o armazenamento.');
            }
        };
    $('backupRestore').onclick = () => $('backupFile').click();
    $('backupCancel').onclick = () => d.close();
    $('backupFile').onchange = async (e) => {
        const f = e.target.files[0];
        if (!f)
            return;
        try {
            if (f.size > 64 * 1024 * 1024)
                throw Error('Arquivo acima de 64 MB.');
            const doc = JSON.parse(await f.text());
            validateCampaign(doc);
            if (await openSiteDialog({
                title: 'Restaurar campanha?', message: 'Isso substituirá os dados atuais. Uma cópia dos dados acessíveis será exportada antes da restauração.', confirm: true, danger: true
            }) !== true)
                return;
            if (Store.blocked) {
                const raw = localStorage.getItem(Store.key);
                if (raw && !(await downloadJSON(raw, 'Bregathyel_dados_originais_' + stamp() + '.json')))
                    throw Error('Não foi possível gerar a cópia de segurança. Restauração cancelada.');
            }
            else if (!(await downloadJSON(backupPayload(), 'Bregathyel_antes_de_restaurar_' + stamp() + '.json')))
                throw Error('Não foi possível gerar a cópia de segurança. Restauração cancelada.');
            await restoreCampaign(doc);
            d.close();
            toast('Campanha restaurada.');
        }
        catch (err) {
            $('backupError').textContent = err.message || 'Não foi possível restaurar.';
        }
        finally {
            e.target.value = '';
        }
    };
    d.showModal();
}

function tutorialOpen() {
    const d = restDialogMake('tutorialDialog');
    const chapters = [
        ['Primeiros passos', 'Em Ficha, crie ou importe personagens. Distribua os seis valores iniciais sem repetições. Troque de personagem pelo menu Trocar; Ctrl+S salva. XP aumenta atributos; nível é manual.'], ['Recursos e equipamentos', 'Arraste PV, PM e XP. Clique nas moedas ou caveira para gerenciar valores. 100 bronzes = 1 prata e 100 pratas = 1 ouro. Na Mochila, arraste itens para equipar ou preparar armas; somente a arma ativa concede os bônus de arma.'], ['Magias e habilidades', 'Aprenda habilidades e magias livremente conforme o mestre. Habilidades não precisam de preparação. Armas com conjuração têm de 1 a 5 espaços de magia, limitados pela classe e nível. Arraste as magias para a arma; somente a ativa permite conjurar suas magias preparadas.'], ['Mercado', 'Anuncie itens da mochila, negocie por moedas, permuta ou doação. Ambos os lados precisam aceitar. Cadastre comerciantes, estoque de nove espaços, saldo e guardas do Bestiário. Pechincha usa Carisma; roubo usa Destreza e CD do mestre. Falhar ou empatar no roubo abre a iniciativa dos guardas.'], ['Bestiário e Arena', 'Crie criaturas com ataques e estatísticas próprias. Selecione jogadores e monstros, lados e quantidades. Todos rolam iniciativa visualmente. Clique em cartões para escolher o combatente; Fim do turno segue a ordem original. Ataques precisam superar CA; resistência precisa superar CD. Crítico natural de 20 em acerto dobra dados, não bônus fixos.'], ['Condições e reações', 'Configure chances, duração, resistência e gatilhos. Condições iguais não acumulam nem renovam. Resolva resistências, danos por turno e escolhas de alvo pendentes antes de continuar. Custos e recargas são aplicados mesmo em falhas de ataque.'], ['Descanso', 'Encerre a batalha e use Área do Mestre → Descansar. Selecione participantes; o descanso curto permite valores, porcentagens ou dados, o longo restaura PV/PM e recargas. Remoção de condições é opcional. XP, munições, cargas e recompensas são gerenciados manualmente.'], ['Diário e missões', 'Em Área do Mestre, abra Diário e missões. Registre acontecimentos, NPCs e lugares, crie missões com objetivos e participantes, e anote informações pessoais por personagem. O mestre muda a situação das missões e distribui as recompensas manualmente. As anotações fazem parte do backup completo.'], ['Salvamento e segurança', 'Exportar ficha salva um personagem; Backup completo salva a campanha inteira, incluindo Mercado, Arena, diário e missões. Guarde cópias fora do navegador. O Bregathyel é local e não sincroniza outros dispositivos. Evite fechar o navegador durante rolagens ou ações em andamento.']
    ];
    d.innerHTML = `<h2>Tutorial do Bregathyel</h2>${chapters.map(([h, t]) => `<details style="margin:8px 0;border:1px solid #87663d;border-radius:5px;padding:10px"><summary style="cursor:pointer;color:#dcb477">${esc(h)}</summary><p>${esc(t)}</p></details>`).join('')}<button>Fechar</button>`;
    d.querySelector('button').onclick = () => d.close();
    d.showModal();
}

function refreshAnnounce(f) {
    const x = bag(c())[Number(f.elements.slot.value)], q = f.elements.quantity, max = x ? (stackable(x) ? number(x.quantity) : 1) : 0;
    q.max = String(max);
    q.readOnly = max === 1;
    if (max === 1)
        q.value = '1';
    const v = Number(q.value), ok = !!x && Number.isSafeInteger(v) && v >= 1 && v <= max;
    q.setCustomValidity(ok ? '' : `Informe uma quantidade entre 1 e ${max}.`);
    f.querySelector('#announceAvailable').textContent = `Disponíveis: ${max}`;
    f.querySelector('#announceError').textContent = ok ? '' : `Informe uma quantidade entre 1 e ${max}.`;
    f.querySelector('[type=submit]').disabled = !ok;
    f.querySelector('[data-qty-step="-1"]').disabled = v <= 1;
    f.querySelector('[data-qty-step="1"]').disabled = v >= max;
    f.querySelector('[data-qty-max]').disabled = max <= 1;
    return ok;
}
$('attributes').addEventListener('click', e => {
    const b = e.target.closest('[data-attribute-test]');
    if (!b || $('diceDialog').open)
        return;
    const i = +b.dataset.attributeTest;
    openRoll();
    if (!$('diceDialog').open)
        return;
    diceMode = { label: 'Teste de ' + names[i], attribute: names[i], mod: Rules.mod(effectiveAttrs(c())[i]), level: 0, manual: true };
    tcgNarrativeLevel(c().level);
    $('diceTitle').textContent = diceMode.label;
});
// ==============================================================================
// AJUDAS DE FORMULÁRIO E ASSISTENTES
// ==============================================================================
let lockedTimer;
function lockedExplanation(b) {
    const kind = b.dataset.lockedKind, i = +b.dataset.lockedIndex, p = c(), w = kind === 'spell' ? chosenSpellWeapon(p) : null, limit = preparedCapacity(kind, p), messages = [];
    if (w && i >= clamp(Math.trunc(number(w.spellCapacity ?? 1)), 1, 5))
        messages.push(`Esta arma comporta ${clamp(Math.trunc(number(w.spellCapacity ?? 1)), 1, 5)} magia(s). É necessária uma arma com maior capacidade.`);
    if (i >= limit) {
        const next = [6, 11, 15].find(l => l > p.level && preparedCapacity(kind, { ...p, level: l }) > i);
        messages.push(next ? `Disponível no nível ${next}, mantendo sua classe e subclasse atuais.` : `Sua classe e subclasse permitem ${limit} espaço(s) no nível atual; este espaço não é desbloqueado pela progressão atual.`);
    }
    if (!messages.length)
        messages.push('Este espaço está indisponível.');
    document.querySelectorAll('.locked-explanation').forEach(n => n.remove());
    clearTimeout(lockedTimer);
    const n = document.createElement('div');
    n.className = 'locked-explanation';
    n.setAttribute('role', 'status');
    n.textContent = messages.join(' ');
    document.body.append(n);
    const r = b.getBoundingClientRect();
    n.style.left = Math.max(8, Math.min(innerWidth - n.offsetWidth - 8, r.left)) + 'px';
    n.style.top = Math.max(8, Math.min(innerHeight - n.offsetHeight - 8, r.bottom + 6)) + 'px';
    lockedTimer = setTimeout(() => {
        n.style.opacity = '0';
        setTimeout(() => n.remove(), 280);
    }, 4000);
}
$('content').addEventListener('click', e => {
    const b = e.target.closest('[data-locked-kind]');
    if (!b)
        return;
    e.preventDefault();
    e.stopImmediatePropagation();
    lockedExplanation(b);
}, true);
const fieldHints = {
    'attribute': 'Escolha o modificador somado ao acerto. Nenhum mantém apenas os demais bônus.', 'attack': 'Categoria do ataque convencional da arma.', 'hands': 'Uma ou duas mãos ocupadas ao equipar.', 'hit': 'Bônus da arma somado ao teste de acerto, não ao dano.', 'spellCapacity': 'Espaços da arma, limitados também pela classe e nível do personagem.', 'ammoMax': 'Quantidade máxima de munição armazenada.', 'ammoCurrent': 'Munição disponível agora.', 'ammoCost': 'Unidades gastas em cada ataque.', 'chargeMax': 'Quantidade máxima de cargas armazenadas.', 'chargeCurrent': 'Cargas disponíveis agora.', 'chargeHit': 'Bônus de acerto enquanto a carga estiver ativa.', 'chargeCost': 'Cargas consumidas por uso ou ativação.', 'chargeTrigger': 'Determina quando a carga será descontada.', 'chargeActivation': 'Automática ou ativada manualmente antes de atacar.', 'bonusKind': 'Atributo ou estatística afetada pelo bônus.', 'chance': 'Chance de ativação quando ocorre o gatilho. Resistência é um teste separado.', 'trigger': 'Evento que ativa este efeito.', 'kind': 'Define o que o efeito faz.', 'intensity': 'Dados e valor fixo do efeito. Para bônus passivo, use um inteiro.', 'resistance': 'Define se o alvo testa resistência ao receber o efeito ou também a cada turno.', 'resAttr': 'Modificador usado pelo alvo para resistir.', 'dc': 'Resultado que o alvo precisa superar; empate é falha.', 'duration': 'Quantidade na unidade escolhida.', 'turns': 'Quantidade de duração da condição.', 'effectDuration': 'Quantidade na unidade escolhida.', 'effectDurationMode': 'Turnos próprios, rodadas completas ou remoção manual.', 'cooldown': 'Tempo de espera na unidade escolhida; 0 significa sem recarga.', 'durationUnit': 'Turno é a vez individual; rodada é um ciclo de todos os combatentes.', 'dotUnit': 'Dano no início do turno do afetado ou no início de cada nova rodada.', 'cooldownUnit': 'Rodadas contam ciclos completos após a aplicação; turnos seguem a regra anterior.', 'costType': 'Recurso consumido ao usar a magia ou habilidade.', 'cost': 'Quantidade do recurso gasta a cada uso.', 'spellTarget': 'Grupo de combatentes que pode receber a magia.', 'targetMode': 'Um alvo, até um limite escolhido ou todos os alvos permitidos.', 'maxTargets': 'Limite de alvos selecionáveis por uso.', 'evoLevel': 'Nível a partir do qual este perfil substitui o anterior.', 'spellHit': 'Se marcado, o conjurador deve superar a CA do alvo.', 'type': 'Classifica a magia ou habilidade e orienta a configuração inicial.', 'ca': 'Bônus de Classe de Armadura concedido pela proteção.', 'armorType': 'Categoria de proteção; a compatibilidade depende da classe.', 'autoTarget': 'Como o alvo de uma reação automática é escolhido.', 'attr': 'Modificador usado no teste de acerto.', 'requiresHit': 'Exige superar a CA do alvo para aplicar o efeito.', 'target': 'Quem pode receber o efeito.', 'durationMode': 'Como o efeito termina.', 'condition': 'Condição de status aplicada ou removida.'
};
function refreshHelp(root) {
    for (const l of root.querySelectorAll('label')) {
        const el = l.querySelector('input[name],select[name]');
        if (!el || l.querySelector('.field-hint'))
            continue;
        let h = fieldHints[el.name];
        if (!h)
            continue;
        if (el.name === 'attribute' && root.id === 'spellForm')
            h = 'Modificador utilizado no teste de conjuração.';
        if (el.name === 'type' && root.id === 'spellForm')
            h = 'Ofensiva causa dano; restauradora cura; defensiva protege; suporte modifica estatísticas; utilitária resolve situações narrativas.';
        const text = document.createElement('small');
        text.className = 'field-hint';
        text.textContent = '(' + h + ')';
        if (el.type === 'checkbox')
            l.append(text);
        else
            l.insertBefore(text, el);
    }
}

function setupWizard(f, titles, initial = 0, early = false) {
    const sections = [...f.querySelectorAll('[data-wstep]')];
    let step = initial;
    const nav = document.createElement('div');
    nav.className = 'wizard-nav';
    f.insertBefore(nav, sections[0]);
    const actions = f.querySelector('.item-actions'), submit = actions.querySelector('[type=submit]'), prev = document.createElement('button'), next = document.createElement('button');
    prev.type = next.type = 'button';
    prev.textContent = 'Anterior';
    next.textContent = 'Próximo';
    actions.insertBefore(prev, submit);
    actions.insertBefore(next, submit);
    function show(i) {
        step = i;
        if (f.id === 'spellForm')
            spellWizardStep = i;
        if (f.id === 'skillForm')
            skillWizardStep = i;
        sections.forEach((x, j) => x.hidden = j !== i);
        nav.innerHTML = titles.map((t, j) => `<span class="${j === i ? 'current' : j < i ? 'passed' : ''}">${j + 1}. ${t}</span>`).join('');
        prev.disabled = i === 0;
        next.hidden = i === titles.length - 1;
        submit.hidden = !early && i !== titles.length - 1;
        submit.textContent = early && i < titles.length - 1 ? 'Finalizar agora' : f.id === 'spellForm' ? 'Salvar magia' : 'Confirmar';
    }
    function valid(section) {
        for (const el of section.querySelectorAll('input,select,textarea')) {
            if (el.disabled || el.closest('[hidden]:not([data-wstep])'))
                continue;
            if (!el.checkValidity()) {
                el.reportValidity();
                return false;
            }
        }
        return true;
    }
    prev.onclick = () => show(Math.max(0, step - 1));
    next.onclick = () => {
        if (valid(sections[step]))
            show(Math.min(titles.length - 1, step + 1));
    };
    f.noValidate = true;
    f.addEventListener('submit', e => {
        const before = step;
        for (let j = 0; j < sections.length; j++) {
            show(j);
            if (!valid(sections[j])) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }
        }
        show(before);
    }, true);
    show(step);
}

function refreshSpellFields(f) {
    const hide = (el, v) => {
        if (el)
            el.closest('label').hidden = v;
    };
    hide(f.elements.maxTargets, f.elements.targetMode.value !== 'Múltiplos');
    hide(f.elements.cost, f.elements.costType.value === 'Nenhum');
    for (const e of f.querySelectorAll('.skill-effect')) {
        for (const k of ['target', 'trigger', 'attr', 'requiresHit'])
            hide(e.querySelector('[name="' + k + '"]'), true);
        const res = e.querySelector('[name=resistance]');
        for (const k of ['resAttr', 'dc'])
            hide(e.querySelector('[name="' + k + '"]'), res?.value === 'Nenhuma');
        hide(e.querySelector('[name=effectDuration]'), !clockTimed(e.querySelector('[name=effectDurationMode]')?.value));
    }
}
spellDialog.addEventListener('change', e => {
    const f = $('spellForm');
    if (f)
        refreshSpellFields(f);
});
// Keep optional controls out of browser validation and explain effects in other forms.
function refreshItemFields(f) {
    for (const id of ['ammoFields', 'chargeFields']) {
        const box = $(id);
        if (box)
            for (const el of box.querySelectorAll('input,select'))
                el.disabled = box.hidden;
    }
    for (const e of f.querySelectorAll('.item-effect')) {
        const kind = e.querySelector('[name=kind]')?.value, res = e.querySelector('[name=resistance]')?.value;
        for (const k of ['resAttr', 'dc', 'cost', 'bonusKind', 'condition', 'duration', 'durationUnit', 'dotUnit']) {
            const el = e.querySelector('[name="' + k + '"]');
            if (!el)
                continue;
            let hide = ['resAttr', 'dc'].includes(k) ? res === 'Nenhuma' : k === 'cost' ? !e.querySelector('[name=charged]').checked : k === 'bonusKind' ? kind !== 'Bônus passivo' : k === 'condition' ? kind !== 'Aplicar condição' : !['Envenenamento', 'Queimadura', 'Aplicar condição'].includes(kind);
            el.closest('label').hidden = hide;
        }
    }
}
itemDialog.addEventListener('change', () => {
    const f = $('itemForm');
    if (f)
        refreshItemFields(f);
});
const formObserver = new MutationObserver(() => {
    for (const id of ['itemForm', 'spellForm', 'skillForm', 'beastForm']) {
        const f = $(id);
        if (f) {
            refreshHelp(f);
            if (id === 'itemForm')
                refreshItemFields(f);
        }
    }
});
for (const d of [itemDialog, skillDialog, spellDialog, beastDialog])
    formObserver.observe(d, { childList: true, subtree: true });
function multiTargetMarkup(a, x, s, q, effects) {
    return `<p>${q.attackCount} ataques independentes · ${esc(q.attackDistribution || 'Livre')} · custo e recarga únicos.</p>${Array.from({ length: q.attackCount }, (_, j) => `<fieldset><legend>Ataque ${j + 1}</legend>${effects.map((e, i) => {
        const ts = powerTargets(a, x, s, 'skill', e);
        return `<label>${esc(skillEffectText(e))}<select name="multi_${j}_${i}">${ts.map(t => `<option value="${esc(t.id)}">${esc(arenaData(t).name)} · PV ${arenaData(t).hp}/${arenaData(t).maxHP}</option>`).join('')}</select></label>`;
    }).join('')}</fieldset>`).join('')}`;
}

function multiReadTargets(f, a, x, s, q, effects) {
    const groups = [], primary = effects.findIndex(e => ['Dano adicional à arma', 'Dano independente'].includes(e.kind)), fail = m => {
        $('powerError').textContent = m;
        return null;
    };
    if (primary < 0)
        return fail('Adicione um efeito de dano.');
    for (let j = 0; j < q.attackCount; j++) {
        const jobs = effects.map((effect, i) => ({ effect, targets: powerTargets(a, x, s, 'skill', effect).filter(t => t.id === f.elements[`multi_${j}_${i}`]?.value) }));
        if (jobs.some(z => !z.targets.length))
            return fail('Selecione todos os alvos.');
        const id = jobs[primary].targets[0].id;
        if (jobs.some(z => ['Dano adicional à arma', 'Dano independente'].includes(z.effect.kind) && z.targets[0].id !== id))
            return fail('Os efeitos de dano de cada ataque devem atingir o mesmo alvo.');
        groups.push(jobs);
    }
    const ids = groups.map(g => g[primary].targets[0].id), n = new Set(ids).size;
    if (q.attackDistribution === 'Mesmo alvo' && n !== 1)
        return fail('Escolha o mesmo alvo para todos os ataques.');
    if (q.attackDistribution === 'Alvos diferentes' && n !== ids.length)
        return fail('Escolha alvos diferentes.');
    return groups;
}
Object.assign(fieldHints, {
    basicAttack: 'Desmarque para armas destinadas somente à conjuração, como grimórios.', attackCount: 'Número de ataques independentes por uso. Cada ataque tem seu próprio acerto, dano e crítico.', attackDistribution: 'Define se os ataques podem repetir o alvo.', ammoPerAttack: 'Se marcado, gasta a munição exigida pela arma em cada ataque; caso contrário, gasta uma vez por ação.'
});

