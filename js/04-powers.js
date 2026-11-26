// ==============================================================================
// HABILIDADES — catálogo, modelos, painel e formulário
// ==============================================================================
const skillArtCatalog = { ...artCatalog, ...{
        "Habilidade: Golpe Poderoso": "assets/images/b21b72bdffdb470b8f74ed7c.webp", "Habilidade: Contra-ataque": "assets/images/9e8c9eb097e18ebe3c0dfa8b.webp", "Habilidade: Postura Defensiva": "assets/images/324c13346d480c9ae78e7b21.webp", "Habilidade: Segundo Fôlego": "assets/images/2ec2b2902afe2550272fb48a.webp", "Habilidade: Ataque Giratório": "assets/images/5c0175f5583ee8104413f48e.webp", "Habilidade: Golpe Divino": "assets/images/4b595e4fcdcbbcb7dcb949d8.webp", "Habilidade: Proteção Sagrada": "assets/images/72694328b3fa854d2e34171a.webp", "Habilidade: Imposição das Mãos": "assets/images/df1c6172e9019bd2b599b23f.webp", "Habilidade: Aura de Coragem": "assets/images/069fe5279f702875fc141622.webp", "Habilidade: Justiça Divina": "assets/images/b307c978ef6a592ed21a19ec.webp", "Habilidade: Fúria": "assets/images/d3905cad9d0e9b33c078f2df.webp", "Habilidade: Ataque Imprudente": "assets/images/3b5f9c2d380d54447965c874.webp", "Habilidade: Grito de Guerra": "assets/images/bc24543dfa761e7abb15a8ac.webp", "Habilidade: Golpe Brutal": "assets/images/1fc1705449ce642aeb5866cb.webp", "Habilidade: Resistência Selvagem": "assets/images/920708153b1f9b7329cf6f02.webp", "Habilidade: Cura Divina": "assets/images/f9efd9861860c36b8a565dc8.webp", "Habilidade: Purificação": "assets/images/ca2303af97c9ea812879e5be.webp", "Habilidade: Bênção": "assets/images/093051320027dcae024391ae.webp", "Habilidade: Proteção Espiritual": "assets/images/fd1d251f80b2eeab45372c06.webp", "Habilidade: Expulsar Mortos-vivos": "assets/images/02cd48a61ecfc6028b6293d6.webp", "Habilidade: Tiro Preciso": "assets/images/d32e726fba90e74b28d48b2b.webp", "Habilidade: Disparo Duplo": "assets/images/8b7c4e1490d48d6fd9c459b0.webp", "Habilidade: Chuva de Flechas": "assets/images/33750ccce637e93b11cf2b3f.webp", "Habilidade: Tiro Perfurante": "assets/images/6ab1d53fecc622049879fa46.webp", "Habilidade: Mira Concentrada": "assets/images/3d1d1b33a0b68d43561ef57f.webp", "Habilidade: Ataque Furtivo": "assets/images/29381261d0332dadd50a816e.webp", "Habilidade: Esquiva": "assets/images/efcffc175b670ac631c98820.webp", "Habilidade: Emboscada": "assets/images/90bd487c94515047fcc9df47.webp", "Habilidade: Golpe Venenoso": "assets/images/skill_poison_strike_v0923.webp", "Habilidade: Desaparecer": "assets/images/d479e11ec2616e33c33b99fa.webp", "Habilidade: Canção Revigorante": "assets/images/88df922b2ef78548d3322c84.webp", "Habilidade: Melodia Hipnótica": "assets/images/304e5bc90441d78df32a742b.webp", "Habilidade: Grito Dissonante": "assets/images/c9a68628cf4dab3e164e5dd2.webp", "Habilidade: Inspiração": "assets/images/200fbd15f76cd527af576dde.webp", "Habilidade: Canção de Proteção": "assets/images/4dabf66440dd39d2d81d728d.webp", "Habilidade: Forma Selvagem": "assets/images/a1f3848e053cdc267053ad73.webp", "Habilidade: Raízes Aprisionadoras": "assets/images/d98c6fa4a02ef2054c48b404.webp", "Habilidade: Regeneração Natural": "assets/images/b7e8ce81e665499c1ca90519.webp", "Habilidade: Comunhão Natural": "assets/images/e244bf01a4c4b5bc683f7ecd.webp", "Habilidade: Espinhos": "assets/images/322d0d75cda8dbb2448c7b78.webp", "Habilidade: Pacto Sombrio": "assets/images/dfe02cce4aed5c61bbb567fa.webp", "Habilidade: Drenar Vida": "assets/images/a1d49ffdc63c08079b054d3e.webp", "Habilidade: Maldição": "assets/images/c1c431b2ae9f7a11335c99b7.webp", "Habilidade: Proteção Abissal": "assets/images/cd2dd2fcef51b24f94d349bc.webp", "Habilidade: Visão Sombria": "assets/images/839cd5dd7cac90389ce66364.webp", "Habilidade: Punho de Ferro": "assets/images/25b87ed157fe6cf38b98f6db.webp", "Habilidade: Rajada de Golpes": "assets/images/d0997f0c17ac073444450833.webp", "Habilidade: Defesa Ágil": "assets/images/e70e0eec866c62d8f1febeea.webp", "Habilidade: Palma Atordoante": "assets/images/8a09cce719e3ff5c2bd55efa.webp", "Habilidade: Meditação": "assets/images/310cfaecce112d99483e0789.webp", "Habilidade: Concentração Mágica": "assets/images/2ba68c0eeabfc7f6e1738090.webp", "Habilidade: Amplificação": "assets/images/7df227126337c76e4aa0339b.webp", "Habilidade: Escudo Arcano": "assets/images/94023fd57ea160eb87051c5d.webp", "Habilidade: Recuperação Arcana": "assets/images/998cec866aec13370893dca0.webp", "Habilidade: Barreira Mental": "assets/images/bf97b25546f6f57c9137e5b4.webp", "Habilidade: Surto Mágico": "assets/images/eba0e39ce1edcd0aca9a3ced.webp", "Habilidade: Magia Potencializada": "assets/images/c7aa2a76082103b0ba054c72.webp", "Habilidade: Conversão de Energia": "assets/images/e1942c0cfedd5992ec3a4b44.webp", "Habilidade: Resistência Arcana": "assets/images/85e4e04635e077590e507f1b.webp", "Habilidade: Magia Duplicada": "assets/images/31f1e2e233c2ba4712b8ad9c.webp"
    } };
const SKILL_GROUPS = {
    'Guerreiro': [
        ['Golpe Poderoso', 'Habilidade: Golpe Poderoso', 'w'], ['Contra-ataque', 'Habilidade: Contra-ataque', 'counter'], ['Postura Defensiva', 'Habilidade: Postura Defensiva', 'ca'], ['Segundo Fôlego', 'Habilidade: Segundo Fôlego', 'hp'], ['Ataque Giratório', 'Habilidade: Ataque Giratório', 'area']
    ],
    'Paladino': [
        ['Golpe Divino', 'Habilidade: Golpe Divino', 'w'], ['Proteção Sagrada', 'Habilidade: Proteção Sagrada', 'ca'], ['Imposição das Mãos', 'Habilidade: Imposição das Mãos', 'hp'], ['Aura de Coragem', 'Habilidade: Aura de Coragem', 'clean'], ['Justiça Divina', 'Habilidade: Justiça Divina', 'dmg']
    ],
    'Bárbaro': [
        ['Fúria', 'Habilidade: Fúria', 'str'], ['Ataque Imprudente', 'Habilidade: Ataque Imprudente', 'hit'], ['Grito de Guerra', 'Habilidade: Grito de Guerra', 'hit'], ['Golpe Brutal', 'Habilidade: Golpe Brutal', 'w'], ['Resistência Selvagem', 'Habilidade: Resistência Selvagem', 'ca']
    ],
    'Clérigo': [
        ['Cura Divina', 'Habilidade: Cura Divina', 'hp'], ['Purificação', 'Habilidade: Purificação', 'clean'], ['Bênção', 'Habilidade: Bênção', 'hit'], ['Proteção Espiritual', 'Habilidade: Proteção Espiritual', 'ca'], ['Expulsar Mortos-vivos', 'Habilidade: Expulsar Mortos-vivos', 'fear']
    ],
    'Arqueiro': [
        ['Tiro Preciso', 'Habilidade: Tiro Preciso', 'hit'], ['Disparo Duplo', 'Habilidade: Disparo Duplo', 'w'], ['Chuva de Flechas', 'Habilidade: Chuva de Flechas', 'area'], ['Tiro Perfurante', 'Habilidade: Tiro Perfurante', 'w'], ['Mira Concentrada', 'Habilidade: Mira Concentrada', 'focus']
    ],
    'Ladino': [
        ['Ataque Furtivo', 'Habilidade: Ataque Furtivo', 'w'], ['Esquiva', 'Habilidade: Esquiva', 'ca'], ['Emboscada', 'Habilidade: Emboscada', 'w'], ['Golpe Venenoso', 'Habilidade: Golpe Venenoso', 'poison'], ['Desaparecer', 'Habilidade: Desaparecer', 'story']
    ],
    'Bardo': [
        ['Inspiração', 'Habilidade: Inspiração', 'hit'], ['Canção Revigorante', 'Habilidade: Canção Revigorante', 'mp'], ['Melodia Hipnótica', 'Habilidade: Melodia Hipnótica', 'stun'], ['Grito Dissonante', 'Habilidade: Grito Dissonante', 'dmg'], ['Canção de Proteção', 'Habilidade: Canção de Proteção', 'ca']
    ],
    'Druida': [
        ['Regeneração Natural', 'Habilidade: Regeneração Natural', 'hp'], ['Raízes Aprisionadoras', 'Habilidade: Raízes Aprisionadoras', 'immob'], ['Forma Selvagem', 'Habilidade: Forma Selvagem', 'str'], ['Espinhos', 'Habilidade: Espinhos', 'counter'], ['Comunhão Natural', 'Habilidade: Comunhão Natural', 'mp']
    ],
    'Bruxo': [
        ['Maldição', 'Habilidade: Maldição', 'weak'], ['Pacto Sombrio', 'Habilidade: Pacto Sombrio', 'story'], ['Drenar Vida', 'Habilidade: Drenar Vida', 'drain'], ['Visão Sombria', 'Habilidade: Visão Sombria', 'story'], ['Proteção Abissal', 'Habilidade: Proteção Abissal', 'ca']
    ],
    'Monge': [
        ['Rajada de Golpes', 'Habilidade: Rajada de Golpes', 'w'], ['Palma Atordoante', 'Habilidade: Palma Atordoante', 'stun'], ['Meditação', 'Habilidade: Meditação', 'mp'], ['Defesa Ágil', 'Habilidade: Defesa Ágil', 'ca'], ['Punho de Ferro', 'Habilidade: Punho de Ferro', 'w']
    ],
    'Mago': [
        ['Escudo Arcano', 'Habilidade: Escudo Arcano', 'ca'], ['Recuperação Arcana', 'Habilidade: Recuperação Arcana', 'mp'], ['Concentração Mágica', 'Habilidade: Concentração Mágica', 'focus'], ['Amplificação', 'Habilidade: Amplificação', 'w'], ['Barreira Mental', 'Habilidade: Barreira Mental', 'ca']
    ],
    'Feiticeiro': [
        ['Surto Mágico', 'Habilidade: Surto Mágico', 'dmg'], ['Magia Potencializada', 'Habilidade: Magia Potencializada', 'w'], ['Magia Duplicada', 'Habilidade: Magia Duplicada', 'area'], ['Resistência Arcana', 'Habilidade: Resistência Arcana', 'ca'], ['Conversão de Energia', 'Habilidade: Conversão de Energia', 'mp']
    ]
};
const SKILL_EFFECTS = [
    'Dano adicional à arma', 'Dano independente', 'Restaurar PV', 'Restaurar PM', 'Bônus de atributo/estatística', 'Aplicar condição', 'Remover condição', 'Efeito narrativo'
];
const SKILL_TARGETS = ['Próprio personagem', 'Um inimigo', 'Um aliado', 'Qualquer alvo', 'Todos os inimigos', 'Todos os aliados', 'Todos (incluindo o usuário)'];
const AUTO_TARGET_MODES = [
    'Automático (gatilho ou alvo único)', 'Próprio personagem', 'Atacante', 'Alvo do ataque', 'Aliado com menor % de PV', 'Todos os aliados', 'Todos os inimigos', 'Aleatório entre os permitidos', 'Escolha manual do mestre'
];
const SKILL_TRIGGERS = [
    'Ao usar', 'Enquanto ativo', 'Ao acertar ataque', 'Ao receber ataque', 'Ao receber dano', 'Ao esquivar de um ataque', 'No início do próprio turno', 'No fim do próprio turno'
];
const PROFICIENCY_ART = 'assets/images/skill_proficiencia_v0927.webp';
const skillDice = () => Object.fromEntries([...DICE_KINDS, 'fixed'].map(n => [n, 0]));
function skillEffect(kind = 'Efeito narrativo', extra = {}) {
    return {
        kind, target: 'Próprio personagem', trigger: 'Ao usar', attr: 'Força', requiresHit: false, dice: skillDice(), bonusKind: 'CA', amount: 1, condition: 'Atordoado', chance: 100, resistance: 'Nenhuma', resAttr: 'Constituição', dc: 10, turns: 1, details: '', ...extra
    };
}

function skillProfile() {
    return { costType: 'Nenhum', cost: 0, cooldown: 0, durationMode: 'Instantânea', duration: 1, attackCount: 1, attackDistribution: 'Livre', ammoPerAttack: true, effects: [] };
}

function skillBlank(name = '', cls = 'Universal', art = 'Grimório') {
    return { id: itemId(), name, reference: cls, art, image: '', description: '', type: 'Ativa', base: skillProfile(), progress: [], remaining: 0, active: false };
}

function skillModel(cls, row, index) {
    const [name, art, code] = row, s = skillBlank(name, cls, art);
    s.id = 'modelo-' + index;
    const p = s.base;
    p.costType = 'PM';
    p.cost = 3;
    p.cooldown = 2;
    const a = ({
        Arqueiro: 'Destreza', Ladino: 'Destreza', Bardo: 'Carisma', Clérigo: 'Sabedoria', Druida: 'Sabedoria', Monge: 'Sabedoria', Mago: 'Inteligência', Bruxo: 'Inteligência', Feiticeiro: 'Inteligência'
    })[cls] || 'Força';
    const hit = { target: 'Um inimigo', attr: a, requiresHit: true, dice: { ...skillDice(), 4: 1 } };
    let e;
    if (['w', 'area', 'dmg', 'counter'].includes(code)) {
        e = skillEffect(code === 'dmg' ? 'Dano independente' : 'Dano adicional à arma', { ...hit, target: code === 'area' ? 'Todos os inimigos' : 'Um inimigo', trigger: code === 'counter' ? 'Ao receber ataque' : 'Ao usar' });
        if (code === 'counter')
            s.type = 'Automática';
    }
    else if (code === 'hp' || code === 'mp')
        e = skillEffect(code === 'hp' ? 'Restaurar PV' : 'Restaurar PM', { target: 'Qualquer alvo', dice: { ...skillDice(), 6: 1 } });
    else if (['ca', 'str', 'hit'].includes(code)) {
        p.durationMode = 'Turnos próprios';
        p.duration = 2;
        e = skillEffect('Bônus de atributo/estatística', { bonusKind: code === 'ca' ? 'CA' : code === 'str' ? 'Força' : 'Acerto', amount: 2, trigger: 'Enquanto ativo' });
    }
    else if (code === 'clean')
        e = skillEffect('Remover condição', { target: 'Um aliado', condition: 'Amedrontado' });
    else if (['focus', 'stun', 'fear', 'poison', 'immob', 'weak'].includes(code)) {
        e = skillEffect('Aplicar condição', {
            ...hit, target: code === 'focus' ? 'Próprio personagem' : 'Um inimigo', requiresHit: code !== 'focus', condition: ({ focus: 'Concentrando', stun: 'Atordoado', fear: 'Amedrontado', poison: 'Envenenado', immob: 'Imobilizado', weak: 'Exausto' })[code], turns: 2
        });
    }
    else if (code === 'drain') {
        e = skillEffect('Dano independente', hit);
        p.effects.push(skillEffect('Restaurar PV', { dice: { ...skillDice(), 4: 1 } }));
    }
    else {
        e = skillEffect();
        p.costType = 'Nenhum';
        p.cost = 0;
        p.cooldown = 0;
    }
    p.effects.unshift(e);
    s.description = ({
        w: 'Fortalece um ataque com a arma equipada.', area: 'Atinge vários inimigos com uma única técnica.', dmg: 'Causa dano independente da arma.', counter: 'Reage a um ataque recebido.', hp: 'Recupera pontos de vida.', mp: 'Recupera pontos de mana.', ca: 'Aprimora a defesa temporariamente.', hit: 'Aprimora a precisão temporariamente.', str: 'Aprimora a força temporariamente.', clean: 'Remove uma condição negativa.', focus: 'Concentra energia para uma ação posterior.', stun: 'Pode atordoar um alvo.', fear: 'Pode amedrontar um alvo.', poison: 'Pode envenenar um alvo.', immob: 'Pode imobilizar um alvo.', weak: 'Pode exaurir um alvo.', drain: 'Causa dano e restaura vida.', story: 'Efeito narrativo definido pelo mestre.'
    })[code] || '';
    if (name === 'Disparo Duplo' || name === 'Rajada de Golpes') {
        p.attackCount = 2;
        p.attackDistribution = 'Livre';
        p.ammoPerAttack = true;
        p.effects[0].dice = skillDice();
        s.description = 'Realiza dois ataques independentes com a arma ativa.';
    }
    if (name === 'Contra-ataque') {
        p.effects[0].trigger = 'Ao receber dano';
        p.effects[0].autoTarget = 'Atacante';
        p.effects[0].dice = skillDice();
    }
    if (name === 'Golpe Poderoso')
        s.progress = [[5, 2, 4], [10, 3, 4], [15, 3, 6], [20, 4, 6]].map(([level, n, d]) => {
            let q = cloneItem(p);
            q.effects[0].dice = { ...skillDice(), [d]: n };
            return { level, ...q };
        });
    return s;
}

const SKILL_LIBRARY = Object.entries(SKILL_GROUPS).flatMap(([cls, rows]) => rows.map(row => ({ cls, row }))).map(({ cls, row }, i) => skillModel(cls, row, i));
function skills(p = c()) {
    if (!Array.isArray(p.learnedSkills))
        p.learnedSkills = [];
    for (const s of p.learnedSkills) {
        for (const q of [s.base, ...(s.progress || [])].filter(Boolean)) {
            if (q.attackCount == null) {
                q.attackCount = ['Disparo Duplo', 'Rajada de Golpes'].includes(s.name) && q.effects?.some(e => e.kind === 'Dano adicional à arma' && e.trigger === 'Ao usar') ? 2 : 1;
                q.attackDistribution = 'Livre';
                q.ammoPerAttack = true;
                if (q.attackCount === 2 && q.effects.length === 1 && diceText(q.effects[0].dice) === '1D4')
                    q.effects[0].dice = skillDice();
                if (s.name === 'Contra-ataque' && s.type === 'Automática')
                    for (const e of q.effects || []) {
                        if (['Ao receber ataque', 'Ao receber dano'].includes(e.trigger) && e.kind === 'Dano adicional à arma' && (!e.autoTarget || e.autoTarget === AUTO_TARGET_MODES[0]))
                            e.autoTarget = 'Atacante';
                    }
            }
        }
    }
    return p.learnedSkills;
}

function skillCurrent(s, p = c()) {
    return (s.progress || []).filter(q => q.level <= p.level).sort((a, b) => b.level - a.level)[0] || s.base || skillProfile();
}

function skillImage(s) {
    return (s.name === 'Golpe Venenoso' && (!s.image || s.image === 'assets/images/90221202ae34706c8ed7bf8b.webp') ? skillArtCatalog['Habilidade: Golpe Venenoso'] : safeArt(s.image)) || skillArtCatalog[s.art] || skillArtCatalog.Grimório;
}

function skillEffectText(e) {
    return [
        e.kind, ['Dano adicional à arma', 'Dano independente', 'Restaurar PV', 'Restaurar PM'].includes(e.kind) ? diceText(e.dice) : '', e.kind === 'Bônus de atributo/estatística' ? e.bonusKind + ' ' + sign(e.amount) : '', e.kind.includes('condição') ? e.condition : '', e.target, e.trigger, e.autoTarget && e.autoTarget !== AUTO_TARGET_MODES[0] && !['Ao usar', 'Enquanto ativo'].includes(e.trigger) ? e.autoTarget : '', e.requiresHit ? 'Teste de ' + e.attr : '', e.chance < 100 ? e.chance + '%' : '', e.kind === 'Aplicar condição' ? clockText(e.turns, e.durationUnit) : '', e.details
    ].filter(Boolean).join(' · ');
}

function skillDescription(s, p = c()) {
    const q = skillCurrent(s, p);
    return [
        s.type, s.reference, q.costType !== 'Nenhum' ? q.cost + ' ' + q.costType : 'Sem custo', q.cooldown ? 'Recarga: ' + clockText(q.cooldown, q.cooldownUnit) : 'Sem recarga', q.attackCount > 1 ? q.attackCount + ' ataques independentes · ' + q.attackDistribution : '', clockTimed(q.durationMode) ? 'Duração: ' + clockText(q.duration, q.durationMode) : q.durationMode, ...q.effects.map(skillEffectText)
    ];
}

let skillView = 'mine';
function modelNameKey(name) {
    return String(name || '').trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}
function skillModels() {
    // Modelos personalizados prevalecem em caso de nomes iguais;
    // nunca excluímos dados antigos, apenas evitamos cartões repetidos.
    const unique = new Map();
    for (const x of SKILL_LIBRARY)
        unique.set(modelNameKey(x.name), x);
    for (const x of libList('skills'))
        unique.set(modelNameKey(x.name), x);
    return [...unique.values()];
}
function skillItems() {
    return skillView === 'library' ? skillModels() : skills();
}

function skillTiles() {
    const passive = skillView === 'mine' ? `<button type="button" class="skill-tile skill-proficiency-tile" data-skill-proficiency="1" aria-label="Proficiência em armaduras"><span class="skill-picture"><img src="${PROFICIENCY_ART}" alt="" class="skill-proficiency-art"></span><span>Proficiência</span></button>` : '';
    return passive + skillItems().map(s => `<button type="button" class="skill-tile ${skillView === 'mine' && s.remaining > 0 ? 'skill-cooling' : ''}" data-skill-id="${esc(s.id)}"><span class="skill-picture"><img src="${skillImage(s)}" alt="">${skillView === 'mine' && s.remaining > 0 ? `<span class="skill-count">${s.remaining}</span>` : ''}</span><span>${esc(s.name)}</span></button>`).join('') || '<p class="empty-note">' + (skillView === 'library' ? 'Nenhum modelo encontrado.' : 'Nenhuma habilidade aprendida.') + '</p>';
}

function skillPanel() {
    return `<div class="other-tab skill-panel"><h2>Habilidades</h2><div class="skill-nav"><button type="button" data-skill-view="mine" class="${skillView === 'mine' ? 'selected' : ''}">Minhas habilidades (${skills().length + 1})</button><button type="button" data-skill-view="library" class="${skillView === 'library' ? 'selected' : ''}">Biblioteca (${skillModels().length})</button></div>${skillView === 'library' ? '<div class="skill-library-toolbar"><button type="button" data-skill-new>+ Novo</button></div>' : ''}<div id="skillTiles" class="skill-tiles">${skillTiles()}</div></div>`;
}

const skillDialog = document.createElement('dialog');
skillDialog.id = 'skillDialog';
document.body.append(skillDialog);
let skillDraft = null, skillOwner = null, skillEditId = null, skillProfileIndex = -1, skillFormImage = '', skillWizardStep = 0;
const skillSelect = (label, name, opts, val) => `<label>${label}<select name="${name}">${opts.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
const skillField = (label, name, val, type = 'text', extra = '') => `<label>${label}<input name="${name}" type="${type}" value="${esc(val ?? '')}" ${extra}></label>`;
function skillEffectForm(e, i, auto = false) {
    return `<fieldset class="skill-effect"><legend>Efeito ${i + 1}</legend><div class="item-cols">${skillSelect('Efeito', 'kind', SKILL_EFFECTS, e.kind)}${skillSelect('Alvo', 'target', SKILL_TARGETS, e.target)}${skillSelect('Gatilho', 'trigger', SKILL_TRIGGERS, e.trigger)}${auto === true ? skillSelect('Seleção automática de alvo', 'autoTarget', AUTO_TARGET_MODES, e.autoTarget || AUTO_TARGET_MODES[0]) : ''}${skillSelect('Atributo de acerto', 'attr', names, e.attr)}</div>${auto === true ? '<small>Aplica-se aos gatilhos automáticos. Aleatório e escolha manual respeitam o grupo de alvos; modos explícitos escolhem o alvo indicado.</small>' : ''}<label class="item-check"><input name="requiresHit" type="checkbox" ${e.requiresHit ? 'checked' : ''}> Exige teste de acerto</label><div class="skill-effect-dice" ${!['Dano adicional à arma', 'Dano independente', 'Restaurar PV', 'Restaurar PM', 'Aplicar condição'].includes(e.kind) ? 'hidden' : ''}><label>Dados e valor fixo</label><div class="dice-fields">${[...DICE_KINDS, 'fixed'].map(k => skillField(k === 'fixed' ? 'Fixo' : 'D' + k, 'd' + k, e.dice?.[k] || 0, 'number', k === 'fixed' ? 'step="1"' : 'min="0" max="40" step="1"')).join('')}</div></div><div class="item-cols skill-effect-bonus" ${e.kind !== 'Bônus de atributo/estatística' ? 'hidden' : ''}>${skillSelect('Estatística', 'bonusKind', BONUS_KINDS, e.bonusKind)}${skillField('Valor', 'amount', e.amount, 'number', 'step="1"')}</div><div class="item-cols skill-effect-condition" ${!e.kind.includes('condição') ? 'hidden' : ''}>${skillSelect('Condição', 'condition', CONDITION_KINDS, e.condition)}${skillField('Duração', 'turns', e.turns, 'number', 'min="1" step="1"')}${clockSelect('durationUnit', e.durationUnit, 'Contar duração em')}${clockSelect('dotUnit', e.dotUnit, 'Dano periódico a cada')}${skillSelect('Resistência', 'resistance', ['Nenhuma', 'Inicial', 'Inicial e a cada turno', 'Inicial e a cada rodada'], e.resistance)}${skillSelect('Atributo de resistência', 'resAttr', names, e.resAttr)}${skillField('CD', 'dc', e.dc, 'number', 'min="0" step="1"')}</div>${skillField('Chance (%)', 'chance', e.chance, 'number', 'min="1" max="100" step="1"')}${skillField('Detalhes', 'details', e.details)}<button type="button" data-skill-effect-remove="${i}">Remover efeito</button></fieldset>`;
}

function skillFormProfile() {
    return skillProfileIndex < 0 ? skillDraft.base : skillDraft.progress[skillProfileIndex];
}

function collectSkillForm() {
    const f = $('skillForm');
    if (!f)
        return;
    const v = n => f.elements[n]?.value ?? '';
    skillDraft.name = v('skillName').trim();
    skillDraft.reference = v('reference');
    skillDraft.type = v('type');
    skillDraft.description = v('description');
    skillDraft.image = skillFormImage;
    const q = skillFormProfile();
    if (skillProfileIndex >= 0)
        q.level = Math.max(2, Math.trunc(number(v('evoLevel'))));
    q.costType = v('costType');
    q.cost = q.costType === 'Nenhum' ? 0 : Math.max(0, Math.trunc(number(v('cost'))));
    q.cooldown = Math.max(0, Math.trunc(number(v('cooldown'))));
    q.cooldownUnit = clockUnit(v('cooldownUnit'));
    q.durationMode = v('durationMode');
    q.duration = Math.max(1, Math.trunc(number(v('duration'))));
    q.attackCount = clamp(Math.trunc(number(v('attackCount'))) || 1, 1, 20);
    q.attackDistribution = v('attackDistribution') || 'Livre';
    q.ammoPerAttack = !!f.elements.ammoPerAttack?.checked;
    q.effects = [...f.querySelectorAll('.skill-effect')].map(el => {
        const a = n => el.querySelector(`[name="${n}"]`), t = n => a(n)?.value ?? '', n = k => Math.trunc(number(t(k)));
        return {
            kind: t('kind'), target: t('target'), trigger: t('trigger'), autoTarget: t('autoTarget') || AUTO_TARGET_MODES[0], attr: t('attr'), requiresHit: a('requiresHit').checked, dice: Object.fromEntries([...DICE_KINDS, 'fixed'].map(k => [k, k === 'fixed' ? n('d' + k) : clamp(n('d' + k), 0, 40)])), bonusKind: t('bonusKind'), amount: n('amount'), condition: t('condition'), chance: clamp(n('chance'), 1, 100), resistance: t('resistance'), resAttr: t('resAttr'), dc: Math.max(0, n('dc')), turns: Math.max(1, n('turns')), durationUnit: clockUnit(t('durationUnit')), dotUnit: clockUnit(t('dotUnit')), details: t('details')
        };
    });
}

function drawSkillForm() {
    const s = skillDraft, q = skillFormProfile();
    skillDialog.innerHTML = `<form id="skillForm"><h2>${skillEditId ? 'Editar' : 'Cadastrar'} habilidade</h2><section data-wstep="0"><div class="skill-form-heading"><img id="skillPreview" src="${skillImage({ ...s, image: skillFormImage })}" alt="Arte da habilidade"><div>${skillField('Nome', 'skillName', s.name, 'text', 'required maxlength="120"')}${skillSelect('Classe de referência', 'reference', ['Universal', ...Object.keys(SKILL_GROUPS)], s.reference)}<label class="skill-upload">Imagem personalizada<input id="skillUpload" type="file" accept="image/*"></label><button type="button" data-skill-art>Escolher arte existente</button></div></div>${skillSelect('Tipo', 'type', ['Ativa', 'Passiva', 'Automática', 'Mista'], s.type)}<label>Descrição<textarea name="description" rows="2">${esc(s.description)}</textarea></label></section><section data-wstep="1"><div class="skill-profile-nav"><button type="button" data-skill-profile="-1" class="${skillProfileIndex < 0 ? 'selected' : ''}">Base</button>${s.progress.map((p, i) => `<button type="button" data-skill-profile="${i}" class="${i === skillProfileIndex ? 'selected' : ''}">Nível ${p.level}</button>`).join('')}<button type="button" data-skill-evo-add>+ Evolução</button></div>${skillProfileIndex >= 0 ? `<div class="item-cols">${skillField('A partir do nível', 'evoLevel', q.level, 'number', 'min="2" step="1"')}<button type="button" data-skill-evo-remove>Remover evolução</button></div>` : ''}<div class="item-cols">${skillSelect('Custo', 'costType', ['Nenhum', 'PV', 'PM'], q.costType)}${skillField('Quantidade', 'cost', q.cost, 'number', 'min="0" step="1"')}${skillField('Recarga (0 = nenhuma)', 'cooldown', q.cooldown, 'number', 'min="0" step="1"')}${clockSelect('cooldownUnit', q.cooldownUnit, 'Contar recarga em')}${skillSelect('Duração', 'durationMode', ['Instantânea', 'Turnos próprios', 'Rodadas', 'Até desativar manualmente', 'Contínua'], q.durationMode)}${skillField('Quantidade de duração', 'duration', q.duration, 'number', 'min="1" step="1"')}</div></section><section data-wstep="2"><fieldset><legend>Ataques independentes</legend><div class="item-cols">${skillField('Quantidade de ataques', 'attackCount', q.attackCount ?? 1, 'number', 'min="1" max="20" step="1"')}${skillSelect('Distribuição dos ataques', 'attackDistribution', ['Livre', 'Mesmo alvo', 'Alvos diferentes'], q.attackDistribution || 'Livre')}</div><label class="item-check"><input type="checkbox" name="ammoPerAttack" ${q.ammoPerAttack !== false ? 'checked' : ''}> Consumir munição por ataque</label><small class="field-hint">(Uma ação com vários ataques separados. Custo e recarga são cobrados uma vez. Aplicável a habilidades de ataque manual.)</small></fieldset></section><section data-wstep="3"><h3>Efeitos deste perfil</h3>${q.effects.map((e, i) => skillEffectForm(e, i, true)).join('')}<button type="button" data-skill-effect-add>+ Adicionar efeito</button></section><p id="skillError" role="alert"></p><div class="item-actions"><button type="button" data-skill-close>Cancelar</button><button type="submit">Salvar habilidade</button></div></form>`;
    setupWizard($('skillForm'), ['Identidade', 'Custo e duração', 'Ataques', 'Efeitos'], skillWizardStep, false);
}

function openSkillForm(s, id = null) {
    skillOwner = c();
    skillEditId = id;
    skillDraft = cloneItem(s);
    skillFormImage = s.image || '';
    skillProfileIndex = -1;
    skillWizardStep = 0;
    drawSkillForm();
    if (!skillDialog.open)
        skillDialog.showModal();
}

function showSkillDetails(s, model) {
    skillDialog.innerHTML = `<div class="skill-form-heading"><img src="${skillImage(s)}" alt=""><h2>${esc(s.name)}</h2></div><p>${esc(s.description)}</p><div class="skill-detail-lines">${skillDescription(s).map(t => `<p>${esc(t)}</p>`).join('')}</div>${s.progress?.length ? `<h3>Evolução por nível</h3>${s.progress.map(q => `<p>Nível ${q.level} · ${esc(q.effects.map(skillEffectText).join(' / '))}</p>`).join('')}` : ''}${model ? '<button type="button" data-skill-learn="model">Usar modelo</button><button type="button" data-skill-learn="blank">Personalizar do zero</button>' + (libList('skills').some(x => x.id === s.id) ? '<button type="button" data-skill-edit-model>Editar modelo</button>' : '') : '<button type="button" data-skill-edit>Editar habilidade</button><button type="button" data-skill-delete>Remover habilidade</button>'}<button type="button" data-skill-close>Fechar</button>`;
    skillDialog.dataset.detail = s.id;
    skillDialog.dataset.model = model ? 'yes' : 'no';
    if (!skillDialog.open)
        skillDialog.showModal();
}
$('content').addEventListener('click', e => {
    const b = e.target.closest('[data-skill-view],[data-skill-new],[data-skill-id],[data-skill-proficiency]');
    if (!b || !state.characters[state.active])
        return;
    if (b.hasAttribute('data-skill-proficiency')) {
        skillDialog.innerHTML = `<div class="skill-form-heading"><img src="${PROFICIENCY_ART}" alt=""><h2>Proficiência — ${esc(c().class)}</h2></div><p>Treinamento fixo da classe. Não ocupa espaço de habilidade e não pode ser removido.</p><p><strong>Armaduras dominadas:</strong> ${esc(armorMasteries(c()).join(', '))}.</p><p>Qualquer armadura pode ser equipada. Sem proficiência, a CA base é 10 e a proteção física da armadura é integral; os bônus adicionais positivos da própria armadura são reduzidos em 2 (mínimo 0).</p><button type="button" data-skill-close>Fechar</button>`;
        skillDialog.dataset.detail = '';
        if (!skillDialog.open) skillDialog.showModal();
        return;
    }
    if (b.dataset.skillView) {
        skillView = b.dataset.skillView;
        renderTab();
    }
    else if (b.hasAttribute('data-skill-new') && skillView === 'library')
        libEdit('skills', null);
    else {
        const s = skillItems().find(x => x.id === b.dataset.skillId);
        if (s)
            showSkillDetails(s, skillView === 'library');
    }
});
function inspectSkill(el) {
    if (document.querySelector('dialog[open]'))
        return;
    if (el.hasAttribute('data-skill-proficiency')) {
        inspect.style.setProperty('--item-rarity', '#b58b4b');
        inspect.innerHTML = `<div class="inspect-art"><img src="${PROFICIENCY_ART}" alt=""></div><div class="inspect-details"><h3>Proficiência</h3><p>Passiva fixa · ${esc(c().class)}</p><p>Armaduras: ${esc(armorMasteries(c()).join(', '))}</p><p>Armaduras sem proficiência mantêm proteção física, mas bônus adicionais positivos -2.</p></div>`;
        inspected = el;
        inspect.hidden = false;
        const r = el.getBoundingClientRect(), w = inspect.offsetWidth, h = inspect.offsetHeight;
        inspect.style.left = clamp(r.right + 10 + w > innerWidth ? r.left - w - 10 : r.right + 10, 8, Math.max(8, innerWidth - w - 8)) + 'px';
        inspect.style.top = clamp(r.top + (r.height - h) / 2, 8, Math.max(8, innerHeight - h - 8)) + 'px';
        return;
    }
    const s = skillItems().find(x => x.id === el.dataset.skillId);
    if (!s)
        return;
    inspect.style.setProperty('--item-rarity', '#b58b4b');
    inspect.innerHTML = `<div class="inspect-art"><img src="${skillImage(s)}" alt=""></div><div class="inspect-details"><h3>${esc(s.name)}</h3>${skillDescription(s).map(t => `<p>${esc(t)}</p>`).join('')}${s.description ? `<p class="inspect-desc">${esc(s.description)}</p>` : ''}</div>`;
    inspected = el;
    inspect.hidden = false;
    const r = el.getBoundingClientRect(), w = inspect.offsetWidth, h = inspect.offsetHeight;
    inspect.style.left = clamp(r.right + 10 + w > innerWidth ? r.left - w - 10 : r.right + 10, 8, Math.max(8, innerWidth - w - 8)) + 'px';
    inspect.style.top = clamp(r.top + (r.height - h) / 2, 8, Math.max(8, innerHeight - h - 8)) + 'px';
}
$('content').addEventListener('pointerover', e => {
    const el = e.target.closest('[data-skill-id],[data-skill-proficiency]');
    if (el && el !== inspected && e.pointerType !== 'touch')
        inspectSkill(el);
});
$('content').addEventListener('focusin', e => {
    const el = e.target.closest('[data-skill-id],[data-skill-proficiency]');
    if (el)
        inspectSkill(el);
});
skillDialog.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b)
        return;
    const d = b.dataset;
    if ('skillClose' in d) {
        skillDialog.close();
        return;
    }
    const s = (skillDialog.dataset.model === 'yes' ? skillModels() : skills()).find(x => x.id === skillDialog.dataset.detail);
    if (d.skillLearn && s) {
        const copy = d.skillLearn === 'model' ? cloneItem(s) : skillBlank(s.name, s.reference, s.art);
        copy.id = itemId();
        openSkillForm(copy);
        return;
    }
    if ('skillEditModel' in d && s && libList('skills').some(x => x.id === s.id)) {
        libEdit('skills', s);
        return;
    }
    if ('skillEdit' in d && s) {
        openSkillForm(s, s.id);
        return;
    }
    if ('skillDelete' in d && s) {
        const owner = c();
        skillDialog.close();
        if (await openSiteDialog({ title: 'Tem certeza?', message: 'Remover ' + s.name + '?', confirm: true, danger: true }) === true) {
            owner.learnedSkills = skills(owner).filter(x => x.id !== s.id);
            render();
        }
        return;
    }
    if (!skillDraft)
        return;
    if (d.skillArt !== undefined) {
        collectSkillForm();
        skillDialog.innerHTML = `<h2>Escolher arte</h2><div class="skill-art-picker">${Object.keys(skillArtCatalog).map(a => `<button type="button" data-skill-art-choice="${esc(a)}"><img src="${skillArtCatalog[a]}" alt="">${esc(a)}</button>`).join('')}</div><button type="button" data-skill-art-back>Voltar</button>`;
        return;
    }
    if (d.skillArtChoice) {
        skillDraft.art = d.skillArtChoice;
        skillFormImage = '';
        drawSkillForm();
        return;
    }
    if ('skillArtBack' in d) {
        drawSkillForm();
        return;
    }
    if (d.skillProfile !== undefined) {
        collectSkillForm();
        skillProfileIndex = +d.skillProfile;
        drawSkillForm();
    }
    else if ('skillEvoAdd' in d) {
        collectSkillForm();
        let level = Math.max(2, ...skillDraft.progress.map(x => x.level + 1));
        skillDraft.progress.push({ ...cloneItem(skillFormProfile()), level });
        skillProfileIndex = skillDraft.progress.length - 1;
        drawSkillForm();
    }
    else if ('skillEvoRemove' in d) {
        collectSkillForm();
        skillDraft.progress.splice(skillProfileIndex, 1);
        skillProfileIndex = -1;
        drawSkillForm();
    }
    else if ('skillEffectAdd' in d) {
        collectSkillForm();
        skillFormProfile().effects.push(skillEffect());
        drawSkillForm();
    }
    else if (d.skillEffectRemove !== undefined) {
        collectSkillForm();
        skillFormProfile().effects.splice(+d.skillEffectRemove, 1);
        drawSkillForm();
    }
});
skillDialog.addEventListener('change', e => {
    if (e.target.name === 'kind') {
        collectSkillForm();
        drawSkillForm();
        return;
    }
    if (e.target.id !== 'skillUpload')
        return;
    const f = e.target.files[0], draft = skillDraft;
    if (!f)
        return;
    const reader = new FileReader();
    reader.onload = () => {
        const im = new Image();
        im.onload = () => {
            if (skillDraft !== draft || !$('skillPreview'))
                return;
            const cv = document.createElement('canvas'), scale = Math.min(1, 256 / Math.max(im.width, im.height));
            cv.width = Math.max(1, Math.round(im.width * scale));
            cv.height = Math.max(1, Math.round(im.height * scale));
            cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
            skillFormImage = cv.toDataURL('image/webp', .8);
            $('skillPreview').src = skillFormImage;
        };
        im.src = reader.result;
    };
    reader.readAsDataURL(f);
});
skillDialog.addEventListener('submit', e => {
    if (e.target.id !== 'skillForm')
        return;
    e.preventDefault();
    collectSkillForm();
    const s = skillDraft, error = m => $('skillError').textContent = m;
    if (!s.name)
        return error('Informe o nome.');
    if (new Set(s.progress.map(q => q.level)).size !== s.progress.length)
        return error('Não repita níveis de evolução.');
    for (const q of [s.base, ...s.progress]) {
        if (q.attackCount > 1 && (!['Ativa', 'Mista'].includes(s.type) || !q.effects.some(e => ['Dano adicional à arma', 'Dano independente'].includes(e.kind) && e.trigger === 'Ao usar') || q.effects.some(e => e.trigger === 'Ao usar' && e.target.startsWith('Todos'))))
            return error('Ataques múltiplos exigem habilidade ativa/mista com dano e alvos individuais. Para área use um único ataque.');
    }
    for (const q of [s.base, ...s.progress])
        for (const f of q.effects)
            if (DICE_KINDS.reduce((n, k) => n + (f.dice[k] || 0), 0) > 40)
                return error('Máximo de 40 dados por efeito.');
    s.progress.sort((a, b) => a.level - b.level);
    if (skillDialog.dataset.libraryOwner === '1') {
        const msg = libSaveModel('skills', s, skillEditId);
        if (msg)
            return error(msg);
        skillDialog.close();
        renderTab();
        toast('Modelo de habilidade salvo na biblioteca.');
        return;
    }
    const list = skills(skillOwner), i = list.findIndex(x => x.id === skillEditId);
    if (i >= 0)
        list[i] = cloneItem(s);
    else
        list.push(cloneItem(s));
    skillDialog.close();
    skillView = 'mine';
    render();
    toast('Habilidade salva.');
});
// ==============================================================================
// MAGIAS — catálogo, painel e formulário
// ==============================================================================
const spellArtCatalog = {
    "Fogo": "assets/images/c58dd633d38a883e46d7ac8a.webp", "Gelo": "assets/images/37e5564c8b0a264892222f76.webp", "Eletricidade": "assets/images/bb75a016faae42ad4734a9c2.webp", "Água": "assets/images/6128c87a76fc26970b3bfd51.webp", "Vento": "assets/images/1f7edbdbabccc7d3bfa93e9f.webp", "Terra": "assets/images/61d33bfb491d3b0387b13ea1.webp", "Veneno": "assets/images/46b792e6bb9f87d2defb442d.webp", "Ácido": "assets/images/be7eb4c4b8abb3cc305ae5de.webp", "Natureza": "assets/images/2ba34cec74d870f6bd5fe037.webp", "Cura": "assets/images/571ae045d3d669cb9728bcfa.webp", "Restauração de mana": "assets/images/99e7f20ff58392498c08b3c5.webp", "Proteção": "assets/images/8b4017abe4682584e438b675.webp", "Luz divina": "assets/images/614288bb32f98228e01ad063.webp", "Sombras": "assets/images/0da8b069ebd8ad864cd69cc7.webp", "Energia arcana": "assets/images/f53282c6f5c70d4e2e29304b.webp", "Ilusão": "assets/images/2a0b9ce0c126788b06f79723.webp", "Invocação": "assets/images/f28b5d606edaf576f82dfd76.webp", "Energia espiritual": "assets/images/a8278db6a6c4d05574f91c73.webp"
};
const spellDialog = document.createElement('dialog');
spellDialog.id = 'spellDialog';
document.body.append(spellDialog);
spellDialog.addEventListener('close', () => { delete spellDialog.dataset.fromSpellLibrary; });
let spellDraft = null, spellOwner = null, spellEditId = null, spellProfileIndex = -1, spellFormImage = '', spellWeaponId = '';
function spells(p = c()) {
    if (!Array.isArray(p.learnedSpells))
        p.learnedSpells = [];
    return p.learnedSpells;
}

function spellBlank() {
    return { ...skillBlank('', 'Universal', 'Fogo'), type: 'Ofensiva', attribute: 'Inteligência', target: 'Inimigos', multiple: false, maxTargets: 1, requiresHit: true };
}

function spellImage(x) {
    return safeArt(x.image) || spellArtCatalog[x.art] || spellArtCatalog.Fogo;
}

// Magias iniciais leves: somente efeitos que a Arena já sabe executar.
// Arte e definição são compartilhadas entre personagens; nenhuma entrada
// é automaticamente gravada nas campanhas ou copiada para outras fichas.
const SPELL_STARTERS = [
    ['Chama Fugaz', 'Fogo', 'Dano independente', 'Ofensiva', 'Uma pequena chama que atinge um inimigo.', 1],
    ['Lança de Gelo', 'Gelo', 'Dano independente', 'Ofensiva', 'Projétil gelado de curto alcance.', 1],
    ['Faísca Elétrica', 'Eletricidade', 'Dano independente', 'Ofensiva', 'Descarga elétrica breve.', 1],
    ['Jato de Água', 'Água', 'Dano independente', 'Ofensiva', 'Jato concentrado de água.', 1],
    ['Rajada de Vento', 'Vento', 'Dano independente', 'Ofensiva', 'Golpe de ar comprimido.', 1],
    ['Pedra Cortante', 'Terra', 'Dano independente', 'Ofensiva', 'Fragmento de rocha arremessado.', 1],
    ['Névoa Venenosa', 'Veneno', 'Dano independente', 'Ofensiva', 'Pequena nuvem venenosa em um alvo.', 2],
    ['Gota Ácida', 'Ácido', 'Dano independente', 'Ofensiva', 'Ácido concentrado lançado à distância.', 1],
    ['Espinho Natural', 'Natureza', 'Dano independente', 'Ofensiva', 'Espinho mágico lançado em um inimigo.', 1],
    ['Toque Restaurador', 'Cura', 'Restaurar PV', 'Restauradora', 'Recupera uma pequena quantidade de vida.', 2],
    ['Fonte de Mana', 'Restauração de mana', 'Restaurar PM', 'Restauradora', 'Recupera um pouco de mana.', 2],
    ['Escudo Protetor', 'Proteção', 'Bônus de atributo/estatística', 'Defensiva', 'Reforça temporariamente a defesa de um aliado.', 2],
    ['Luz Sagrada', 'Luz divina', 'Dano independente', 'Ofensiva', 'Raio concentrado de luz.', 1],
    ['Dardo Sombrio', 'Sombras', 'Dano independente', 'Ofensiva', 'Pequeno dardo de energia sombria.', 1],
    ['Míssil Arcano', 'Energia arcana', 'Dano independente', 'Ofensiva', 'Energia arcana disparada contra um alvo.', 1],
    ['Véu Ilusório', 'Ilusão', 'Efeito narrativo', 'Utilitária', 'Cria uma ilusão breve, a critério do mestre.', 1],
    ['Chamado Etéreo', 'Invocação', 'Efeito narrativo', 'Utilitária', 'Invocação narrativa breve, definida pelo mestre.', 1],
    ['Bênção Espiritual', 'Energia espiritual', 'Bônus de atributo/estatística', 'Suporte', 'Fortalece temporariamente a defesa de um aliado.', 2]
];
const SPELL_LIBRARY = SPELL_STARTERS.map(([name, art, effect, type, description, cost], i) => {
    const x = spellBlank();
    x.id = 'spell-modelo-' + i;
    x.name = name;
    x.art = art;
    x.type = type;
    x.description = description;
    x.attribute = ['Restauradora', 'Suporte', 'Defensiva'].includes(type) ? 'Sabedoria' : 'Inteligência';
    x.target = type === 'Ofensiva' ? 'Inimigos' : 'Aliados';
    if (type === 'Utilitária')
        x.target = 'Qualquer personagem';
    x.requiresHit = type === 'Ofensiva';
    x.targetMode = 'Único';
    x.multiple = false;
    x.maxTargets = 1;
    x.base.costType = 'PM';
    x.base.cost = cost;
    const target = type === 'Ofensiva' ? 'Um inimigo' : type === 'Utilitária' ? 'Qualquer alvo' : 'Um aliado';
    const data = { target, trigger: 'Ao usar', attr: x.attribute, requiresHit: x.requiresHit };
    if (['Dano independente', 'Restaurar PV', 'Restaurar PM'].includes(effect))
        data.dice = { ...skillDice(), 4: 1 };
    if (effect === 'Bônus de atributo/estatística')
        Object.assign(data, { bonusKind: 'CA', amount: 1, durationMode: 'Turnos próprios', duration: 2 });
    x.base.effects = [skillEffect(effect, data)];
    return x;
});
// Uma arte = um cartão no catálogo. Modelos básicos oficiais têm prioridade.
// Modelos antigos/personalizados repetidos permanecem gravados e editáveis
// pelo gerenciamento de bibliotecas; não são apagados nem regravados aqui.
function spellModels() {
    const unique = new Map();
    for (const x of SPELL_LIBRARY)
        unique.set(spellImage(x), x);
    for (const x of libList('spells')) {
        const art = spellImage(x);
        if (!unique.has(art))
            unique.set(art, x);
    }
    return [...unique.values()];
}
function spellAlreadyLearned(p, model) {
    return spells(p).some(x => libSignature('spells', x) === libSignature('spells', model));
}
function spellLibraryError(message) {
    const e = $('spellLibraryError');
    if (e) e.textContent = message;
    else toast(message);
}
function showSpellLibrary() {
    spellDialog.dataset.fromSpellLibrary = '1';
    spellDraft = null;
    delete spellDialog.dataset.detail;
    delete spellDialog.dataset.libraryPreview;
    delete spellDialog.dataset.libraryOwner;
    spellDialog.innerHTML = `<h2>Biblioteca de magias</h2><p>Escolha uma magia pronta ou crie um modelo reutilizável.</p><div class="spell-library-toolbar"><span>${spellModels().length} magias disponíveis</span><button type="button" data-spell-library-new>+ Novo</button></div><div class="spell-library-grid">${spellModels().map(x => `<button type="button" class="spell-library-tile" data-spell-library-pick="${esc(x.id)}"><img src="${spellImage(x)}" alt=""><span>${esc(x.name)}</span></button>`).join('')}</div><p id="spellLibraryError" role="alert"></p><div class="spell-library-actions"><button type="button" data-spell-close>Fechar</button></div>`;
    if (!spellDialog.open) spellDialog.showModal();
}
function showSpellLibraryPreview(x) {
    spellDraft = null;
    spellDialog.dataset.libraryPreview = x.id;
    delete spellDialog.dataset.detail;
    spellDialog.innerHTML = `<div class="skill-form-heading"><img src="${spellImage(x)}" alt=""><h2>${esc(x.name)}</h2></div><p>${esc(x.description)}</p><div class="skill-detail-lines">${spellDetails(x).map(t => `<p>${esc(t)}</p>`).join('')}</div><p id="spellLibraryError" role="alert"></p><div class="spell-library-actions"><button type="button" data-spell-library-back>Voltar</button><button type="button" data-spell-library-editcopy>Editar cópia</button><button type="button" data-spell-library-add>Adicionar</button></div>`;
    if (!spellDialog.open) spellDialog.showModal();
}

function spellEffectForm(e, i) {
    const q = spellFormProfile();
    return skillEffectForm(e, i).replace('data-skill-effect-remove', 'data-spell-effect-remove').replace('</fieldset>', `<div class="spell-buff-duration" ${e.kind === 'Bônus de atributo/estatística' ? '' : 'hidden'}>${skillSelect('Duração do bônus', 'effectDurationMode', ['Turnos próprios', 'Rodadas', 'Até remoção manual'], e.durationMode === 'Rodadas' || (e.durationMode == null && q.durationMode === 'Rodadas') ? 'Rodadas' : e.durationMode === 'Contínua' || e.durationMode === 'Até desativar manualmente' || (e.durationMode == null && ['Contínua', 'Até desativar manualmente'].includes(q.durationMode)) ? 'Até remoção manual' : 'Turnos próprios')}${skillField('Quantidade de duração', 'effectDuration', e.duration ?? (clockTimed(q.durationMode) ? q.duration : 1), 'number', 'min="1" step="1"')}</div></fieldset>`);
}

function canConjureWith(w) {
    return w?.category === 'Armas' && (typeof w.spellEnabled === 'boolean' ? w.spellEnabled : w.attack === 'Mágico');
}

function allSpellWeapons(p = c()) {
    return [activeWeapon(p), ...reserves(p), ...bag(p)].filter(x => x?.category === 'Armas');
}

function magicWeapons(p = c()) {
    return allSpellWeapons(p).filter(canConjureWith);
}

function chosenSpellWeapon(p = c()) {
    const a = magicWeapons(p);
    return a.find(x => x.id === spellWeaponId) || a[0] || null;
}

function spellLimit(w, p = c()) {
    return canConjureWith(w) ? Math.min(clamp(Math.trunc(number(w.spellCapacity ?? 1)), 1, 5), preparedCapacity('spell', p)) : 0;
}

function spellSlots(w) {
    if (!Array.isArray(w.preparedSpells))
        w.preparedSpells = [];
    return w.preparedSpells;
}

function spellPrepared(w, p = c()) {
    if (!w)
        return '<p class="empty-note">Nenhuma arma permite conjuração. Ative essa opção no cadastro de uma arma na mochila.</p>';
    const cap = spellLimit(w, p), slots = spellSlots(w), list = spells(p);
    return `<div class="prepared-list">${Array.from({ length: 5 }, (_, i) => {
        const x = list.find(z => z.id === slots[i]), locked = i >= cap;
        return `<button type="button" class="prepared-row ${x ? 'spell-filled' : ''} ${locked ? 'locked' : ''}" data-spell-slot="${i}" ${locked ? `data-locked-kind="spell" data-locked-index="${i}" aria-disabled="true"` : ''}>${x ? `<img src="${spellImage(x)}" alt=""><div>${esc(x.name)}<small>${locked ? 'Bloqueado' : 'Preparada'}</small></div>` : `<img src="${gearArt[1]}" alt=""><div>${locked ? 'Bloqueado' : 'Espaço ' + (i + 1)}<small>${locked ? 'Indisponível' : 'Arraste uma magia'}</small></div>`}</button>`;
    }).join('')}</div><small>${slots.slice(0, cap).filter(id => list.some(x => x.id === id)).length} / ${cap} preparadas · Capacidade da arma: ${clamp(Math.trunc(number(w.spellCapacity ?? 1)), 1, 5)}</small>`;
}

let spellView = 'mine';
function spellItems(p = c()) {
    return spellView === 'library' ? spellModels() : spells(p);
}
function spellTiles(p = c()) {
    return spellItems(p).map(x => `<button type="button" class="skill-tile occupied" data-spell-id="${esc(x.id)}"><span class="skill-picture"><img src="${spellImage(x)}" alt=""></span><span>${esc(x.name)}</span></button>`).join('') || '<p class="empty-note">' + (spellView === 'library' ? 'Nenhum modelo encontrado.' : 'Nenhuma magia aprendida.') + '</p>';
}

function spellPanel(p = c()) {
    const w = chosenSpellWeapon(p), a = magicWeapons(p);
    return `<div class="other-tab skill-panel"><h2>Magias</h2><div class="skill-nav"><button type="button" data-spell-view="mine" class="${spellView === 'mine' ? 'selected' : ''}">Minhas magias (${spells(p).length})</button><button type="button" data-spell-view="library" class="${spellView === 'library' ? 'selected' : ''}">Biblioteca (${spellModels().length})</button></div>${spellView === 'library' ? '<div class="skill-library-toolbar"><button type="button" data-spell-new>+ Novo</button></div>' : ''}<div id="spellTiles" class="skill-tiles">${spellTiles(p)}</div></div><div class="prepared"><h2>Magias preparadas</h2>${w ? `<label>Arma mágica<select id="spellWeaponSelect">${a.map(x => `<option value="${esc(x.id)}" ${x === w ? 'selected' : ''}>${esc(x.name)}${x === activeWeapon(p) ? ' (ativa)' : ''}</option>`).join('')}</select></label><div class="prepared-row">${imageMarkup(w)}<div>${esc(w.name)}<small>${w === activeWeapon(p) ? 'Ativa' : 'Reserva / mochila'}</small></div></div>` : ''}${spellPrepared(w, p)}</div>`;
}

function canPrepareSpell(p, id, i) {
    const w = chosenSpellWeapon(p);
    return !!w && !state.combatActive && !arenaState() && i >= 0 && i < spellLimit(w, p) && spells(p).some(x => x.id === id) && !spellSlots(w).some((x, j) => x === id && j !== i);
}

function prepareSpell(p, id, i) {
    if (!canPrepareSpell(p, id, i))
        return false;
    spellSlots(chosenSpellWeapon(p))[i] = id;
    render();
    return true;
}

function spellFormProfile() {
    return spellProfileIndex < 0 ? spellDraft.base : spellDraft.progress[spellProfileIndex];
}

function collectSpellForm() {
    const f = $('spellForm');
    if (!f)
        return;
    const v = n => f.elements[n]?.value ?? '';
    spellDraft.name = v('skillName').trim();
    spellDraft.attribute = v('attribute');
    spellDraft.target = v('spellTarget');
    spellDraft.targetMode = v('targetMode') || (spellDraft.multiple ? 'Múltiplos' : 'Único');
    spellDraft.multiple = spellDraft.targetMode !== 'Único';
    spellDraft.maxTargets = Math.max(1, Math.trunc(number(v('maxTargets'))));
    spellDraft.requiresHit = f.elements.spellHit.checked;
    spellDraft.type = v('type');
    spellDraft.description = v('description');
    spellDraft.image = spellFormImage;
    const q = spellFormProfile();
    if (spellProfileIndex >= 0)
        q.level = Math.max(2, Math.trunc(number(v('evoLevel'))));
    q.chargeCost = Math.max(0, Math.trunc(number(v('chargeCost'))));
    q.costType = v('costType');
    q.cost = q.costType === 'Nenhum' ? 0 : Math.max(0, Math.trunc(number(v('cost'))));
    q.cooldown = Math.max(0, Math.trunc(number(v('cooldown'))));
    q.cooldownUnit = clockUnit(v('cooldownUnit'));
    q.durationMode = v('durationMode');
    q.duration = Math.max(1, Math.trunc(number(v('duration'))));
    q.effects = [...f.querySelectorAll('.skill-effect')].map(el => {
        const a = n => el.querySelector(`[name="${n}"]`), t = n => a(n)?.value ?? '', n = k => Math.trunc(number(t(k)));
        return {
            kind: t('kind'), target: t('target'), trigger: t('trigger'), attr: t('attr'), requiresHit: a('requiresHit').checked, dice: Object.fromEntries([...DICE_KINDS, 'fixed'].map(k => [k, k === 'fixed' ? n('d' + k) : clamp(n('d' + k), 0, 40)])), bonusKind: t('bonusKind'), amount: n('amount'), condition: t('condition'), chance: clamp(n('chance'), 1, 100), resistance: t('resistance'), resAttr: t('resAttr'), dc: Math.max(0, n('dc')), turns: Math.max(1, n('turns')), durationUnit: clockUnit(t('durationUnit')), dotUnit: clockUnit(t('dotUnit')), durationMode: t('effectDurationMode') || q.durationMode, duration: Math.max(1, n('effectDuration') || q.duration), details: t('details')
        };
    });
}

let spellWizardStep = 0;
function drawSpellForm() {
    const s = spellDraft, q = spellFormProfile();
    spellDialog.innerHTML = `<form id="spellForm"><h2>${spellEditId ? 'Editar' : 'Cadastrar'} magia</h2><div class="skill-profile-nav"><button type="button" data-spell-profile="-1" class="${spellProfileIndex < 0 ? 'selected' : ''}">Base</button>${s.progress.map((p, i) => `<button type="button" data-spell-profile="${i}" class="${i === spellProfileIndex ? 'selected' : ''}">Nível ${p.level}</button>`).join('')}<button type="button" data-spell-evo-add>+ Evolução</button></div><section data-wstep="0"><div class="skill-form-heading"><img id="spellPreview" src="${spellImage({ ...s, image: spellFormImage })}" alt="Arte da magia"><div>${skillField('Nome', 'skillName', s.name, 'text', 'required maxlength="120"')}<label class="skill-upload">Imagem personalizada<input id="spellUpload" type="file" accept="image/*"></label><button type="button" data-spell-art>Escolher arte existente</button></div></div>${skillSelect('Tipo', 'type', ['Ofensiva', 'Defensiva', 'Restauradora', 'Suporte', 'Utilitária'], s.type)}<label>Descrição<textarea name="description" rows="2">${esc(s.description)}</textarea></label></section><section data-wstep="1"><div class="item-cols">${skillSelect('Atributo de conjuração', 'attribute', names, s.attribute)}${skillSelect('Custo', 'costType', ['Nenhum', 'PV', 'PM'], q.costType)}${skillField('Quantidade', 'cost', q.cost, 'number', 'min="0" step="1"')}${skillField('Cargas da arma (0 = nenhuma)', 'chargeCost', q.chargeCost || 0, 'number', 'min="0" step="1"')}</div></section><section data-wstep="2">${skillSelect('Alvos permitidos', 'spellTarget', ['Inimigos', 'Aliados', 'Qualquer personagem', 'Próprio conjurador'], s.target)}${skillSelect('Quantidade de alvos', 'targetMode', ['Único', 'Múltiplos', 'Todos os permitidos'], s.targetMode || (s.multiple ? 'Múltiplos' : 'Único'))}${skillField('Máximo de alvos', 'maxTargets', s.maxTargets, 'number', 'min="1" step="1"')}${check('Exige teste de acerto', 'spellHit', s.requiresHit)}</section><section data-wstep="3"><h3>Efeitos deste perfil</h3>${q.effects.map(spellEffectForm).join('')}<button type="button" data-spell-effect-add>+ Adicionar efeito</button></section><section data-wstep="4">${skillField('Recarga (0 = nenhuma)', 'cooldown', q.cooldown, 'number', 'min="0" step="1"')}${clockSelect('cooldownUnit', q.cooldownUnit, 'Contar recarga em')}${spellProfileIndex >= 0 ? `<div class="item-cols">${skillField('A partir do nível', 'evoLevel', q.level, 'number', 'min="2" step="1"')}<button type="button" data-spell-evo-remove>Remover evolução</button></div>` : '<p>Use + Evolução para definir um perfil a partir de outro nível. Cada perfil pode ter custos, efeitos e recarga próprios.</p>'}<div hidden>${skillSelect('Duração', 'durationMode', ['Instantânea', 'Turnos próprios', 'Rodadas', 'Até desativar manualmente', 'Contínua'], q.durationMode)}${skillField('Quantidade de duração', 'duration', q.duration, 'number', 'min="1" step="1"')}</div></section><p id="spellError" role="alert"></p><div class="item-actions"><button type="button" data-spell-close>Cancelar</button><button type="submit">Salvar magia</button></div></form>`;
    const f = $('spellForm');
    setupWizard(f, ['Identidade', 'Conjuração', 'Alvos', 'Efeitos', 'Progressão'], spellWizardStep, false);
    refreshHelp(f);
    refreshSpellFields(f);
}

function openSpellForm(s, id = null) {
    delete spellDialog.dataset.libraryOwner;
    spellOwner = c();
    spellEditId = id;
    spellDraft = cloneItem(s);
    spellFormImage = s.image || '';
    spellProfileIndex = -1;
    spellWizardStep = 0;
    drawSpellForm();
    if (!spellDialog.open)
        spellDialog.showModal();
}

function spellEffectText(e) {
    return [
        e.kind, ['Dano adicional à arma', 'Dano independente', 'Restaurar PV', 'Restaurar PM'].includes(e.kind) ? diceText(e.dice) : '', e.kind === 'Bônus de atributo/estatística' ? e.bonusKind + ' ' + sign(e.amount) : '', e.kind === 'Bônus de atributo/estatística' && e.durationMode ? (clockTimed(e.durationMode) ? clockText(e.duration, e.durationMode) : 'Até remoção manual') : '', e.kind.includes('condição') ? e.condition : '', e.kind === 'Aplicar condição' ? clockText(e.turns, e.durationUnit) : '', e.chance < 100 ? e.chance + '%' : '', e.details
    ].filter(Boolean).join(' · ');
}

function spellDetails(x) {
    const q = skillCurrent(x);
    return [
        x.type, 'Conjuração: ' + x.attribute, x.target + (x.targetMode === 'Todos os permitidos' ? ' · todos os permitidos' : x.multiple ? ' · até ' + x.maxTargets + ' alvos' : ''), x.requiresHit ? 'Exige teste de acerto' : 'Sem teste de acerto', q.costType === 'Nenhum' ? 'Sem custo' : q.cost + ' ' + q.costType, q.chargeCost ? 'Cargas: ' + q.chargeCost : '', q.cooldown ? 'Recarga: ' + clockText(q.cooldown, q.cooldownUnit) : '', ...q.effects.map(spellEffectText)
    ].filter(Boolean);
}

function showSpellModelDetails(x) {
    spellDraft = null;
    delete spellDialog.dataset.detail;
    spellDialog.dataset.libraryPreview = x.id;
    spellDialog.innerHTML = `<div class="skill-form-heading"><img src="${spellImage(x)}" alt=""><h2>${esc(x.name)}</h2></div><p>${esc(x.description)}</p><div class="skill-detail-lines">${spellDetails(x).map(t => `<p>${esc(t)}</p>`).join('')}</div><button type="button" data-spell-model-use>Usar modelo</button><button type="button" data-spell-model-blank>Personalizar do zero</button>${libList('spells').some(z => z.id === x.id) ? '<button type="button" data-spell-model-edit>Editar modelo</button>' : ''}<button type="button" data-spell-close>Fechar</button>`;
    if (!spellDialog.open) spellDialog.showModal();
}

function showSpellDetails(x) {
    spellDraft = null;
    delete spellDialog.dataset.libraryPreview;
    spellDialog.innerHTML = `<div class="skill-form-heading"><img src="${spellImage(x)}" alt=""><h2>${esc(x.name)}</h2></div><p>${esc(x.description)}</p>${spellDetails(x).map(t => `<p>${esc(t)}</p>`).join('')}<button data-spell-edit>Editar magia</button><button data-spell-delete>Remover magia</button><button data-spell-close>Fechar</button>`;
    spellDialog.dataset.detail = x.id;
    if (!spellDialog.open)
        spellDialog.showModal();
}

const spellContent = $('content');
spellContent.addEventListener('change', e => {
    if (e.target.id === 'spellWeaponSelect') {
        spellWeaponId = e.target.value;
        renderTab();
    }
});
spellContent.addEventListener('click', e => {
    const b = e.target.closest('[data-spell-view],[data-spell-new],[data-spell-id],[data-spell-slot]');
    if (!b || !state.characters[state.active])
        return;
    if (b.dataset.spellView) {
        spellView = b.dataset.spellView;
        renderTab();
    }
    else if (b.hasAttribute('data-spell-new') && spellView === 'library')
        libEdit('spells', null);
    else if (b.dataset.spellId) {
        const x = spellItems().find(z => z.id === b.dataset.spellId);
        if (x) {
            if (spellView === 'library') showSpellModelDetails(x);
            else showSpellDetails(x);
        }
    }
    else {
        const w = chosenSpellWeapon(), i = +b.dataset.spellSlot;
        if (!w || i >= spellLimit(w) || state.combatActive)
            return;
        const list = spells().filter(x => canPrepareSpell(c(), x.id, i));
        spellDialog.innerHTML = `<h2>Preparar magia</h2>${list.map(x => `<button data-spell-pick="${esc(x.id)}" data-spell-index="${i}">${esc(x.name)}</button>`).join('') || '<p>Nenhuma magia disponível.</p>'}${spellSlots(w)[i] ? `<button data-spell-remove-slot="${i}">Despreparar</button>` : ''}<button data-spell-close>Cancelar</button>`;
        spellDialog.showModal();
    }
});
function inspectSpell(el) {
    if (dragged || document.querySelector('dialog[open]'))
        return;
    const x = el.dataset.spellId ? spellItems().find(z => z.id === el.dataset.spellId) : spells().find(z => z.id === spellSlots(chosenSpellWeapon() || {})[+el.dataset.spellSlot]);
    if (!x)
        return;
    inspect.style.setProperty('--item-rarity', '#b58b4b');
    inspect.innerHTML = `<div class="inspect-art"><img src="${spellImage(x)}" alt=""></div><div class="inspect-details"><h3>${esc(x.name)}</h3>${spellDetails(x).map(t => `<p>${esc(t)}</p>`).join('')}<p>${esc(x.description)}</p></div>`;
    inspected = el;
    inspect.hidden = false;
    const r = el.getBoundingClientRect(), w = inspect.offsetWidth, h = inspect.offsetHeight;
    inspect.style.left = clamp(r.right + 10 + w > innerWidth ? r.left - w - 10 : r.right + 10, 8, Math.max(8, innerWidth - w - 8)) + 'px';
    inspect.style.top = clamp(r.top + (r.height - h) / 2, 8, Math.max(8, innerHeight - h - 8)) + 'px';
}
spellContent.addEventListener('pointerover', e => {
    const el = e.target.closest('[data-spell-id],[data-spell-slot]');
    if (el && e.pointerType !== 'touch' && el !== inspected)
        inspectSpell(el);
});
spellDialog.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b)
        return;
    const d = b.dataset;
    if ('spellClose' in d) {
        spellDialog.close();
        return;
    }
    if ('spellModelUse' in d || 'spellModelBlank' in d || 'spellModelEdit' in d) {
        const model = spellModels().find(x => x.id === spellDialog.dataset.libraryPreview);
        if (!model) return spellLibraryError('Magia não encontrada.');
        if ('spellModelEdit' in d) {
            const custom = libList('spells').find(x => x.id === model.id);
            if (custom) libEdit('spells', custom);
        } else {
            const draft = 'spellModelBlank' in d ? { ...spellBlank(), name: model.name, art: model.art, image: model.image || '' } : cloneItem(model);
            draft.id = itemId();
            openSpellForm(draft);
        }
        return;
    }
    if ('spellLibraryBack' in d) {
        showSpellLibrary();
        return;
    }
    if ('spellLibraryNew' in d) {
        libEdit('spells', null);
        return;
    }
    if (d.spellLibraryPick) {
        const model = spellModels().find(x => x.id === d.spellLibraryPick);
        if (model) showSpellLibraryPreview(model);
        return;
    }
    if ('spellLibraryAdd' in d || 'spellLibraryEditcopy' in d) {
        const model = spellModels().find(x => x.id === spellDialog.dataset.libraryPreview);
        if (!model) return spellLibraryError('Magia não encontrada.');
        if ('spellLibraryEditcopy' in d) {
            const draft = cloneItem(model);
            draft.id = itemId();
            openSpellForm(draft);
            delete spellDialog.dataset.libraryOwner;
            return;
        }
        const owner = c();
        if (spellAlreadyLearned(owner, model))
            return spellLibraryError('Este personagem já possui uma magia idêntica.');
        const copy = libTemplate('spells', model);
        copy.id = itemId();
        spells(owner).push(copy);
        spellDialog.close();
        render();
        toast('Magia aprendida.');
        return;
    }
    if (d.spellPick) {
        if (prepareSpell(c(), d.spellPick, +d.spellIndex))
            spellDialog.close();
        return;
    }
    if (d.spellRemoveSlot !== undefined) {
        const w = chosenSpellWeapon();
        if (w && !state.combatActive) {
            spellSlots(w)[+d.spellRemoveSlot] = null;
            spellDialog.close();
            render();
        }
        return;
    }
    const x = spells().find(z => z.id === spellDialog.dataset.detail);
    if ('spellEdit' in d && x) {
        openSpellForm(x, x.id);
        return;
    }
    if ('spellDelete' in d && x) {
        const p = c();
        spellDialog.close();
        if (await openSiteDialog({ title: 'Tem certeza?', message: 'Remover ' + x.name + '?', confirm: true, danger: true }) === true) {
            p.learnedSpells = spells(p).filter(z => z.id !== x.id);
            for (const w of allSpellWeapons(p))
                w.preparedSpells = spellSlots(w).map(id => id === x.id ? null : id);
            render();
        }
        return;
    }
    if (!spellDraft)
        return;
    if ('spellArt' in d) {
        collectSpellForm();
        spellDialog.innerHTML = `<h2>Escolher arte da magia</h2><div class="skill-art-picker">${Object.keys(spellArtCatalog).map(a => `<button data-spell-art-choice="${esc(a)}"><img src="${spellArtCatalog[a]}" alt="">${esc(a)}</button>`).join('')}</div><button data-spell-art-back>Voltar</button>`;
        return;
    }
    if (d.spellArtChoice) {
        spellDraft.art = d.spellArtChoice;
        spellFormImage = '';
        drawSpellForm();
        return;
    }
    if ('spellArtBack' in d) {
        drawSpellForm();
        return;
    }
    if (d.spellProfile !== undefined) {
        collectSpellForm();
        spellProfileIndex = +d.spellProfile;
        drawSpellForm();
    }
    else if ('spellEvoAdd' in d) {
        collectSpellForm();
        const level = Math.max(2, ...spellDraft.progress.map(x => x.level + 1));
        spellDraft.progress.push({ ...cloneItem(spellFormProfile()), level });
        spellProfileIndex = spellDraft.progress.length - 1;
        drawSpellForm();
    }
    else if ('spellEvoRemove' in d) {
        collectSpellForm();
        spellDraft.progress.splice(spellProfileIndex, 1);
        spellProfileIndex = -1;
        drawSpellForm();
    }
    else if ('spellEffectAdd' in d) {
        collectSpellForm();
        spellFormProfile().effects.push(skillEffect(spellDraft.type === 'Ofensiva' ? 'Dano independente' : spellDraft.type === 'Restauradora' ? 'Restaurar PV' : 'Efeito narrativo', {
            attr: spellDraft.attribute, requiresHit: spellDraft.requiresHit, target: ({ 'Inimigos': 'Um inimigo', 'Aliados': 'Um aliado', 'Qualquer personagem': 'Qualquer alvo', 'Próprio conjurador': 'Próprio personagem' })[spellDraft.target] || 'Qualquer alvo'
        }));
        drawSpellForm();
    }
    else if (d.spellEffectRemove !== undefined) {
        collectSpellForm();
        spellFormProfile().effects.splice(+d.spellEffectRemove, 1);
        drawSpellForm();
    }
});
spellDialog.addEventListener('change', e => {
    if (e.target.name === 'type') {
        const f = $('spellForm');
        f.elements.spellHit.checked = e.target.value === 'Ofensiva';
        return;
    }
    if (e.target.name === 'kind') {
        collectSpellForm();
        drawSpellForm();
        return;
    }
    if (e.target.id !== 'spellUpload')
        return;
    const f = e.target.files[0], d = spellDraft;
    if (!f)
        return;
    const r = new FileReader();
    r.onload = () => {
        const im = new Image();
        im.onload = () => {
            if (d !== spellDraft || !$('spellPreview'))
                return;
            const cv = document.createElement('canvas'), scale = Math.min(1, 256 / Math.max(im.width, im.height));
            cv.width = Math.max(1, Math.round(im.width * scale));
            cv.height = Math.max(1, Math.round(im.height * scale));
            cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
            spellFormImage = cv.toDataURL('image/webp', .8);
            $('spellPreview').src = spellFormImage;
        };
        im.src = r.result;
    };
    r.readAsDataURL(f);
});
spellDialog.addEventListener('submit', e => {
    if (e.target.id !== 'spellForm')
        return;
    e.preventDefault();
    collectSpellForm();
    const x = spellDraft, error = t => $('spellError').textContent = t;
    if (!x.name)
        return error('Informe o nome.');
    if (new Set(x.progress.map(q => q.level)).size !== x.progress.length)
        return error('Não repita níveis de evolução.');
    for (const q of [x.base, ...x.progress])
        for (const f of q.effects)
            if (DICE_KINDS.reduce((n, k) => n + (f.dice[k] || 0), 0) > 40)
                return error('Máximo de 40 dados por efeito.');
    x.progress.sort((a, b) => a.level - b.level);
    if (spellDialog.dataset.libraryOwner === '1') {
        if (spellModels().some(z => z.id !== spellEditId && modelNameKey(z.name) === modelNameKey(x.name)))
            return error('Já existe uma magia com esse nome na biblioteca. Edite a existente ou escolha outro nome.');
        const msg = libSaveModel('spells', x, spellEditId);
        if (msg)
            return error(msg);
        spellDialog.close();
        if (state.characters[state.active]) renderTab();
        toast('Modelo de magia salvo na biblioteca.');
        return;
    }
    const a = spells(spellOwner), i = a.findIndex(z => z.id === spellEditId);
    if (a.some((z, j) => j !== i && libSignature('spells', z) === libSignature('spells', x)))
        return error('Este personagem já possui uma magia idêntica.');
    if (i >= 0)
        a[i] = cloneItem(x);
    else
        a.push(cloneItem(x));
    spellDialog.close();
    spellView = 'mine';
    render();
    toast('Magia salva.');
});
// Mercado local: transações atômicas, estoque e ofertas em custódia.

