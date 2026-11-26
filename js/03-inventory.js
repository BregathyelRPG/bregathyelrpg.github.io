// ==============================================================================
// ITENS E MOCHILA — categorias, empilhamento, arte e detalhes
// ==============================================================================
const CATEGORIES = ['Armas', 'Armaduras', 'Escudos', 'Acessórios', 'Consumíveis', 'Utilidades'];
const RARITIES = ['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'];
const RAR_COLORS = ['#9c9991', '#53a56a', '#528fe4', '#a16de3', '#d6aa4b'];
const DICE_KINDS = [...dieTypes];
const BONUS_KINDS = [...names, 'PV máximos', 'PM máximos', 'CA', 'Iniciativa', 'Deslocamento', 'Acerto', 'Dano'];
const CONDITION_KINDS = ['Atordoado', 'Caído', 'Paralisado', 'Cego', 'Amedrontado', 'Imobilizado', 'Exausto', 'Concentrando', 'Envenenado', 'Queimando'];
const NEGATIVE_CONDITION_KINDS = CONDITION_KINDS.filter(k => k !== 'Concentrando');
function conditionKindOf(v) { return typeof v === 'string' ? v : v?.kind || v?.condition || v?.name; }
function curableConditionKinds(list) {
    return [...new Set((Array.isArray(list) ? list : []).map(conditionKindOf).filter(k => NEGATIVE_CONDITION_KINDS.includes(k)))];
}
function consumableCleanseLimit(item) {
    return Math.max(1, Math.min(6, Math.trunc(Number(item?.consumption?.conditionCount) || 1)));
}
// Ausência de uma seleção significa curar qualquer condição NEGATIVA, por sorteio.
// Uma lista de condições personalizadas restringe os possíveis alvos da cura.
function consumableCleanseFilter(item) {
    const selected = item?.consumption?.conditionKinds;
    return Array.isArray(selected)
        ? [...new Set(selected.filter(k => NEGATIVE_CONDITION_KINDS.includes(k)))]
        : [];
}
function consumableCureTargets(item, existing, random = Math.random) {
    const type = item?.consumption?.type;
    if (type !== 'Remover condições' && type !== 'Remover condição') return [];
    let eligible = curableConditionKinds(existing);
    if (type === 'Remover condição') {
        return eligible.includes(item.consumption.condition) ? [item.consumption.condition] : [];
    }
    const chosen = consumableCleanseFilter(item);
    if (chosen.length) eligible = eligible.filter(k => chosen.includes(k));
    // Fisher-Yates: não depende da ordem em que as condições foram cadastradas.
    for (let i = eligible.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
    }
    return eligible.slice(0, consumableCleanseLimit(item));
}
function consumableCleanseDetail(item) {
    const chosen = consumableCleanseFilter(item);
    return chosen.length ? ' · somente ' + chosen.join(', ') : ' · sorteio aleatório';
}
const itemId = () => globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
const cloneItem = x => JSON.parse(JSON.stringify(x));
function bag(p = c()) {
    if (!Array.isArray(p.bagSlots))
        p.bagSlots = [];
    p.bagSlots = p.bagSlots.slice(0, 40);
    while (p.bagSlots.length < 40)
        p.bagSlots.push(null);
    return p.bagSlots;
}

const stackable = x => !!x && (x.category === 'Consumíveis' || x.category === 'Utilidades' && x.stackable);
function signature(x) {
    let { id, quantity, ...rest } = x;
    return JSON.stringify(rest);
}

function canMerge(a, b, manual = false) {
    return stackable(a) && stackable(b) && (a.id === b.id || manual) && signature(a) === signature(b);
}

function bagCount(p = c()) {
    return bag(p).filter(Boolean).length;
}

function bagPlace(p, x, preferred = -1) {
    if (!x || !Number.isSafeInteger(x.quantity) || x.quantity < 1)
        return false;
    const b = bag(p), cap = Rules.capacity(p);
    let merge = b.findIndex((v, i) => i < cap && canMerge(v, x));
    if (merge >= 0) {
        const qty = b[merge].quantity + x.quantity;
        if (!Number.isSafeInteger(qty))
            return false;
        b[merge] = { ...b[merge], quantity: qty };
        return true;
    }
    let cells = [];
    if (preferred >= 0 && preferred < cap && !b[preferred])
        cells.push(preferred);
    for (let i = 0; i < cap; i++)
        if (!b[i] && !cells.includes(i))
            cells.push(i);
    const count = stackable(x) ? 1 : x.quantity;
    if (cells.length < count)
        return false;
    for (let i = 0; i < count; i++)
        b[cells[i]] = { ...cloneItem(x), id: i ? itemId() : x.id, quantity: stackable(x) ? x.quantity : 1 };
    return true;
}

function moveBag(p, from, to) {
    const b = bag(p), cap = Rules.capacity(p);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from === to || from < 0 || to < 0 || from >= 40 || to >= cap || !b[from])
        return false;
    if (canMerge(b[from], b[to], true)) {
        const qty = b[to].quantity + b[from].quantity;
        if (!Number.isSafeInteger(qty))
            return false;
        b[to] = { ...b[to], quantity: qty };
        b[from] = null;
        return true;
    }
    if (from >= cap && b[to])
        return false;
    [b[from], b[to]] = [b[to], b[from]];
    return true;
}

function organizeBag(p) {
    const b = bag(p), items = [];
    for (const x of b.filter(Boolean)) {
        const prev = items.find(v => canMerge(v, x, true) && Number.isSafeInteger(v.quantity + x.quantity));
        if (prev && Number.isSafeInteger(prev.quantity + x.quantity))
            prev.quantity += x.quantity;
        else
            items.push(x);
    }
    items.sort((a, b) => CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) || a.name.localeCompare(b.name, 'pt-BR'));
    p.bagSlots = Array.from({ length: 40 }, (_, i) => items[i] || null);
}

const artCatalog = {
    Armadura: gearArt[4], Escudo: gearArt[5], Capa: gearArt[0], Elmo: gearArt[1], Colar: gearArt[2], Anel: gearArt[6], Botas: gearArt[7], ...{
        "Espada": "assets/images/87e01a1a4999a6bf8326ce8f.webp", "Arco": "assets/images/cfbce3f153ea7ce2aeedb1a7.webp", "Cajado": "assets/images/db77b7b4d42ab3faedd44ea5.webp", "Grimório": "assets/images/de2f239a1cbe17d983375d50.webp", "Machado": "assets/images/0dc04162ba92eac42f27f4bf.webp", "Martelo": "assets/images/9f64ffb398710884b6b956cd.webp", "Adaga": "assets/images/2e3336f90ea2d2a824623176.webp", "Besta": "assets/images/8fef35889a54122ac9e82ff9.webp", "Lança": "assets/images/bb3fc63c2ff6bb3e6cada115.webp", "Maça": "assets/images/7eec7c8d52a8edd6919e7c5c.webp", "Varinha": "assets/images/870c4035f2e9300aab372321.webp", "Cimitarra": "assets/images/3d40d68406e711011f2e7012.webp", "Foice": "assets/images/6e018eacf608cfebeba59136.webp", "Katana": "assets/images/e526395c67a4e518508f7e12.webp", "Manopla": "assets/images/624fbcb39b36753ed44c8e9d.webp", "Chicote": "assets/images/5c58692911d4221624393a6c.webp", "Túnica": "assets/images/362c4c4cc99ab1af274648a0.webp", "Manto": "assets/images/fa7fb9483410dc2ba7deed47.webp", "Couro": "assets/images/3f77676c06eb7d86beb8417c.webp", "Couro reforçado": "assets/images/70071cfff4cab0d98136dafc.webp", "Cota de malha": "assets/images/cc99f14be994fde453b78780.webp", "Escamas": "assets/images/0fe443375a92ad63f33e450d.webp", "Placas": "assets/images/e3e694873d7afb5a4020b7f8.webp", "Armadura negra": "assets/images/45f7a484cfc8e65b42c3e36e.webp", "Escudo de madeira": "assets/images/6b364b6a20fe4686433038ba.webp", "Escudo de metal": "assets/images/c5785c0fb6a0f6e0705ee84a.webp", "Aljava": "assets/images/44a730153b72bf5910c879cd.webp", "Poção vermelha": "assets/images/a72be5679fb6ce518db68cfe.webp", "Poção azul": "assets/images/ef4d2b2abf2262fac266fc6f.webp", "Poção verde": "assets/images/e7627b2e6ee49339ce3d1b63.webp", "Pão": "assets/images/8496cae5d9198e471972c649.webp", "Corda": "assets/images/4b50d0d01c00fea61dee559f.webp", "Tocha": "assets/images/45d6f248e3120820831420f2.webp", "Minério": "assets/images/76ebd5b51d3fe44aab6c1626.webp", "Chave": "assets/images/95f44b4347e8cb3b1b27e1e6.webp", "Pergaminho": "assets/images/2bf31c04d970798cadf71a6e.webp"
    }
};
// v0.9.33: 24 artes aprovadas, extraídas das duas grades PNG em células separadas.
const accessoryArts = {
    "Anel de rubi": "assets/images/0ce0aa70a979809d944c071d.webp",
    "Anel de safira": "assets/images/2224dcd8dd09041eb7c188e2.webp",
    "Anel de esmeralda": "assets/images/494293997527d263c2613c53.webp",
    "Anel de ametista": "assets/images/ad887be3eebf80e8daf9b29a.webp",
    "Anel dourado": "assets/images/6dd68227aea1a93baa17217d.webp",
    "Anel sombrio": "assets/images/606c83f30fe2170ff0ba84f6.webp",
    "Colar de rubi": "assets/images/a143c88bcd001c789736720a.webp",
    "Colar de safira": "assets/images/1713f4afd7714076a2a0859e.webp",
    "Colar lunar": "assets/images/baa2bb97628e6ef449d87d73.webp",
    "Colar da natureza": "assets/images/d5850d59363449401db0b7cb.webp",
    "Colar solar": "assets/images/b30ce9e717d6508ae091b944.webp",
    "Colar arcano": "assets/images/69bbb2888c5026914f28db1c.webp",
    "Capa carmesim": "assets/images/9c35caa9cecae25ff1a6631b.webp",
    "Capa verde": "assets/images/2b2d5577147682486288ffcb.webp",
    "Capa azul": "assets/images/47dca75385c06c202426c03a.webp",
    "Capa violeta": "assets/images/f9ce6785c5c6a036087d2803.webp",
    "Botas de couro": "assets/images/fa47f952cdf0f948d2feed17.webp",
    "Botas de aço": "assets/images/bf31f2c0ce26af1ec6d8da9f.webp",
    "Botas de patrulheiro": "assets/images/4079e02a40ffcbcffb6b3c6d.webp",
    "Botas arcanas": "assets/images/9d6bf735f66477b22bca594e.webp",
    "Coroa dourada": "assets/images/2a6a9e3684b46a54fc7bda29.webp",
    "Capuz verde": "assets/images/51d37207a018fcdbd1a6276c.webp",
    "Elmo de aço": "assets/images/1add38f485e194bfb3bf88df.webp",
    "Chapéu arcano": "assets/images/0c3155a60847f75e8d28f427.webp"
};
Object.assign(artCatalog, accessoryArts);

// v0.9.34 — frascos coordenados em três tamanhos; carne com arte isolada.
// Pão e Pergaminho preservam suas imagens originais.
const CONSUMABLE_ARTS_V0934 = Object.freeze({
    "Poção vermelha pequena": "assets/images/614a3e8732ff05226e5f0d12.webp",
    "Poção azul pequena": "assets/images/cd73c9607c3d285b30bf3d3a.webp",
    "Poção verde pequena": "assets/images/1b6018f7fde80847b19e99ae.webp",
    "Carne": "assets/images/eb51ac9321df470bdbfbfede.webp",
    "Poção vermelha média": "assets/images/ee783b2c57a722c17b29eb81.webp",
    "Poção azul média": "assets/images/245f9b493d731bd76ac22275.webp",
    "Poção verde média": "assets/images/6e88fbb8b218b202b266b457.webp",
    "Poção vermelha grande": "assets/images/7ebcdc1881894e7553ce8412.webp",
    "Poção azul grande": "assets/images/9b7efd9d014b4308cd4e960f.webp",
    "Poção verde grande": "assets/images/8ed88f8dbf9fd95ff0d1bc52.webp"
});
Object.assign(artCatalog, CONSUMABLE_ARTS_V0934);
const GREEN_POTION_CLEANSE_V0934 = Object.freeze({
    'Poção verde pequena': 1,
    'Poção verde média': 3,
    'Poção verde grande': 6
});


// Benefícios modestos e permanentes, aplicados somente enquanto equipado.
// Não usam efeitos especiais nem rolagens extras.
const ACCESSORY_BONUSES_V0933 = Object.freeze({
    "Anel de rubi": { kind: "PV máximos", value: 1 },
    "Anel de safira": { kind: "PM máximos", value: 1 },
    "Anel de esmeralda": { kind: "Constituição", value: 1 },
    "Anel de ametista": { kind: "Sabedoria", value: 1 },
    "Anel dourado": { kind: "Carisma", value: 1 },
    "Anel sombrio": { kind: "Destreza", value: 1 },
    "Colar de rubi": { kind: "PV máximos", value: 2 },
    "Colar de safira": { kind: "PM máximos", value: 2 },
    "Colar lunar": { kind: "Sabedoria", value: 1 },
    "Colar da natureza": { kind: "Constituição", value: 1 },
    "Colar solar": { kind: "Carisma", value: 1 },
    "Colar arcano": { kind: "Inteligência", value: 1 },
    "Capa carmesim": { kind: "PV máximos", value: 1 },
    "Capa verde": { kind: "Iniciativa", value: 1 },
    "Capa azul": { kind: "PM máximos", value: 1 },
    "Capa violeta": { kind: "Carisma", value: 1 },
    "Botas de couro": { kind: "PV máximos", value: 1 },
    "Botas de aço": { kind: "CA", value: 1 },
    "Botas de patrulheiro": { kind: "Deslocamento", value: 1 },
    "Botas arcanas": { kind: "PM máximos", value: 1 },
    "Coroa dourada": { kind: "Carisma", value: 1 },
    "Capuz verde": { kind: "Iniciativa", value: 1 },
    "Elmo de aço": { kind: "CA", value: 1 },
    "Chapéu arcano": { kind: "Inteligência", value: 1 }
});

// v0.9.29: 16 modelos incomuns, cada um com arte própria do arsenal 4x4.
// Arquivos separados geometricamente por célula: nenhuma remoção de fundo por cor.
const UNCOMMON_WEAPON_FAMILY = Object.freeze({
    "Espada de Aço Temperado": "Espada",
    "Arco Recurvo": "Arco",
    "Cajado Arcano": "Cajado",
    "Grimório Rúnico": "Grimório",
    "Machado de Guerra": "Machado",
    "Martelo de Batalha": "Martelo",
    "Adaga Serrilhada": "Adaga",
    "Besta Reforçada": "Besta",
    "Lança de Guerra": "Lança",
    "Maça Cravejada": "Maça",
    "Varinha Encantada": "Varinha",
    "Cimitarra do Deserto": "Cimitarra",
    "Foice de Guerra": "Foice",
    "Katana de Aço Dobrado": "Katana",
    "Manopla de Ferro": "Manopla",
    "Chicote de Espinhos": "Chicote"
});
Object.assign(artCatalog, {
    "Espada de Aço Temperado": "assets/images/307fd708c3cdff746372cc24.webp",
    "Arco Recurvo": "assets/images/e77ae1df0178e8709ee70f0e.webp",
    "Cajado Arcano": "assets/images/7298a131853436fb75489f8e.webp",
    "Grimório Rúnico": "assets/images/d44d25283f9441de008ac50b.webp",
    "Machado de Guerra": "assets/images/66b917de16d235365c963d0b.webp",
    "Martelo de Batalha": "assets/images/648a3dcc6fe2dc1e360458e1.webp",
    "Adaga Serrilhada": "assets/images/576d5240e117b1309c7a90a8.webp",
    "Besta Reforçada": "assets/images/76f11f1abd45862b4a6397c3.webp",
    "Lança de Guerra": "assets/images/4676a66cc3d7fc5bab2d98e1.webp",
    "Maça Cravejada": "assets/images/c5b2e82895ab3bfc1cb41d0a.webp",
    "Varinha Encantada": "assets/images/8f2c58af0e9520ee6390fd1e.webp",
    "Cimitarra do Deserto": "assets/images/42d7305f2a857b3abe0d92a2.webp",
    "Foice de Guerra": "assets/images/939848bd68ab489e13cdd1f3.webp",
    "Katana de Aço Dobrado": "assets/images/e70d9ea9b0c442a9bf8d326d.webp",
    "Manopla de Ferro": "assets/images/9bfe7e54d6f36edb14a83d9c.webp",
    "Chicote de Espinhos": "assets/images/d484c0d6f7d88da42022fe46.webp"
});

const accessoryLegacy = { "Anel": "Anel dourado", "Colar": "Colar de rubi", "Capa": "Capa carmesim", "Botas": "Botas de couro", "Elmo": "Elmo de aço" };
for (const [old, key] of Object.entries(accessoryLegacy))
    artCatalog[old] = accessoryArts[key];
const accessoryDefault = { Anel: "Anel dourado", Colar: "Colar de rubi", Capa: "Capa carmesim", Botas: "Botas de couro", "Elmo ou chapéu": "Elmo de aço" };
function accessoryArtKey(x) {
    return x.category === "Acessórios" && (Object.hasOwn(accessoryLegacy, x.art) || !x.art) ? (accessoryDefault[x.accessory] || accessoryLegacy[x.art] || "Capa carmesim") : x.art;
}

// v0.9.30: 12 modelos de armaduras (3 por proteção, comum/incomum/raro).
// A troca de imagem dos mantos foi aprovada: o raro Manto do Estudioso usa
// a túnica azul, enquanto as Vestes do Arcanista incomuns usam a púrpura.
// Itens antigos salvos não são modificados nem têm suas imagens removidas.
const ARMOR_MODELS_V0930 = Object.freeze({
    "Túnica de Linho": {"type": "Vestimenta", "rarity": "Comum", "ca": 0, "attribute": null, "art": "assets/images/a54dfa272a44a7ffee2e92fc.webp"},
    "Manto do Estudioso": {"type": "Vestimenta", "rarity": "Raro", "ca": 2, "attribute": "Inteligência", "art": "assets/images/95ef397015357741fbaec1b0.webp"},
    "Vestes do Arcanista": {"type": "Vestimenta", "rarity": "Incomum", "ca": 1, "attribute": null, "art": "assets/images/a9e3998b87b60496e0e63ea8.webp"},
    "Gibão de Couro": {"type": "Leve", "rarity": "Comum", "ca": 1, "attribute": null, "art": "assets/images/8bfbd03acc6ad1d330e566a7.webp"},
    "Couro Reforçado": {"type": "Leve", "rarity": "Incomum", "ca": 2, "attribute": null, "art": "assets/images/47f8ac24ba79035fc86ea471.webp"},
    "Traje do Predador": {"type": "Leve", "rarity": "Raro", "ca": 3, "attribute": "Destreza", "art": "assets/images/52388a01e67b1a1706f2ef8e.webp"},
    "Cota de Malha": {"type": "Média", "rarity": "Comum", "ca": 2, "attribute": null, "art": "assets/images/8c8b622cc2f8c67e01bb3001.webp"},
    "Armadura de Escamas": {"type": "Média", "rarity": "Incomum", "ca": 3, "attribute": null, "art": "assets/images/b72c42ab49d963b787ea6674.webp"},
    "Couraça do Guardião": {"type": "Média", "rarity": "Raro", "ca": 4, "attribute": "Constituição", "art": "assets/images/f12eeba0fbd62ff7da45a387.webp"},
    "Armadura de Placas": {"type": "Pesada", "rarity": "Comum", "ca": 3, "attribute": null, "art": "assets/images/2ea9da6666cf4e1f4ba97084.webp"},
    "Armadura Negra": {"type": "Pesada", "rarity": "Incomum", "ca": 4, "attribute": null, "art": "assets/images/f3d72bb17c995b27f5166646.webp"},
    "Armadura do Colosso": {"type": "Pesada", "rarity": "Raro", "ca": 5, "attribute": "Força", "art": "assets/images/7a25e3c993244277d57fc318.webp"},
});
for (const [name, model] of Object.entries(ARMOR_MODELS_V0930))
    artCatalog[name] = model.art;

// v0.9.32: quatro escudos, com arte própria e exclusivamente bônus de CA.
// Nenhum atributo ou efeito adicional é concedido pelos modelos de fábrica.
const SHIELD_MODELS_V0932 = Object.freeze({
    "Escudo de Madeira": { rarity: 'Comum', ca: 1, art: "assets/images/ff30c0c00135049d44a43a82.webp" },
    "Escudo de Ferro": { rarity: 'Comum', ca: 2, art: "assets/images/656da391f953a34bafbef7e2.webp" },
    "Escudo da Sentinela": { rarity: 'Incomum', ca: 3, art: "assets/images/1244dfcc54275c01be32117b.webp" },
    "Bastião do Rei": { rarity: 'Raro', ca: 4, art: "assets/images/2518a6c84baa0dc47d0efc56.webp" }
});
for (const [name, model] of Object.entries(SHIELD_MODELS_V0932))
    artCatalog[name] = model.art;

const artOptions = {
    Armas: ['Espada', 'Arco', 'Cajado', 'Grimório', 'Machado', 'Martelo', 'Adaga', 'Besta', 'Lança', 'Maça', 'Varinha', 'Cimitarra', 'Foice', 'Katana', 'Manopla', 'Chicote', ...Object.keys(UNCOMMON_WEAPON_FAMILY)], Armaduras: Object.keys(ARMOR_MODELS_V0930), Escudos: Object.keys(SHIELD_MODELS_V0932), Acessórios: [
        "Anel de rubi", "Anel de safira", "Anel de esmeralda", "Anel de ametista", "Anel dourado", "Anel sombrio", "Colar de rubi", "Colar de safira", "Colar lunar", "Colar da natureza", "Colar solar", "Colar arcano", "Capa carmesim", "Capa verde", "Capa azul", "Capa violeta", "Botas de couro", "Botas de aço", "Botas de patrulheiro", "Botas arcanas", "Coroa dourada", "Capuz verde", "Elmo de aço", "Chapéu arcano"
    ], Consumíveis: [...Object.keys(CONSUMABLE_ARTS_V0934).filter(n => n !== 'Carne'), 'Pão', 'Carne', 'Pergaminho'], Utilidades: ['Corda', 'Tocha', 'Minério', 'Chave', 'Pergaminho']
};
function safeArt(s) {
    return typeof s === 'string' && (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(s) || isBundledAsset(s)) ? s : '';
}

function itemArt(x) {
    return safeArt(x.image) || (x.art === '__none' ? '' : artCatalog[accessoryArtKey(x)] || artCatalog[x.category === 'Consumíveis' ? (x.consumption?.type === 'Restaurar PM' ? 'Poção azul' : 'Poção vermelha') : x.category === 'Utilidades' ? 'Pergaminho' : artOptions[x.category]?.[0]] || '');
}

function imageMarkup(x) {
    const a = itemArt(x);
    return a ? `<img class="item-art" src="${a}" alt="">` : `<span class="item-letter">${esc(x.category === 'Consumíveis' ? '✚' : x.category === 'Utilidades' ? '✦' : x.name.slice(0, 1).toUpperCase())}</span>`;
}

function itemDetails(x) {
    return [
        x.category, x.rarity, x.category === 'Armas' ? (x.basicAttack === false ? `Sem ataque convencional · ${x.hands} mão(s)` : `${x.attack} · ${x.hands} mão(s) · ${diceText(x.damage)} · Acerto ${sign(x.hit || 0)}`) : '', canConjureWith(x) ? `Conjuração · ${clamp(Math.trunc(number(x.spellCapacity ?? 1)), 1, 5)} espaço(s)` : '', x.category === 'Armaduras' ? `${x.armorType} · CA ${sign(x.ca || 0)}` : '', x.category === 'Escudos' ? `CA ${sign(x.ca || 0)}` : '', x.bonuses?.map(b => `${b.kind} ${sign(b.value)}`).join(', '), x.effects?.map(e => e.kind + (e.charged ? ' (carga)' : '')).join(', '), x.category === 'Consumíveis' ? `${x.consumption?.type || 'Narrativo'}${['Restaurar PV', 'Restaurar PM'].includes(x.consumption?.type) ? ' ' + diceText(x.consumption.amount) : x.consumption?.type === 'Remover condições' ? ' · até ' + consumableCleanseLimit(x) + ' negativas' + consumableCleanseDetail(x) : ''}` : '', x.description
    ].filter(Boolean).join(' · ');
}

function diceText(d) {
    return d ? [...DICE_KINDS.filter(k => d[k] > 0).map(k => `${d[k]}D${k}`), d.fixed ? `${d.fixed}` : ''].filter(Boolean).join(' + ') || '0' : '0';
}

// Equipamentos: uma fonte de verdade por personagem; mão auxiliar virtual para duas mãos.
const armorProficiency = {
    Guerreiro: ['Leve', 'Média', 'Pesada'],
    Paladino: ['Leve', 'Média', 'Pesada'],
    'Bárbaro': ['Leve', 'Média'],
    Arqueiro: ['Leve', 'Média'],
    Ladino: ['Leve', 'Média'],
    Bruxo: ['Leve']
};
// Vestimenta é proficiente para todas as classes.
function armorMasteries(p) {
    return ['Vestimenta', ...(armorProficiency[p.class] || [])];
}
const shieldProficiency = new Set(['Guerreiro', 'Paladino', 'Bárbaro', 'Clérigo']);
function number(v) {
    return Number.isFinite(Number(v)) ? Number(v) : 0;
}

function equipment(p = c()) {
    if (!Array.isArray(p.equipmentSlots))
        p.equipmentSlots = Array(9).fill(null);
    while (p.equipmentSlots.length < 9)
        p.equipmentSlots.push(null);
    return p.equipmentSlots;
}

function compatible(p, item) {
    if (!item)
        return false;
    if (item.category === 'Armaduras')
        return item.armorType === 'Vestimenta' || (armorProficiency[p.class] || []).includes(item.armorType);
    if (item.category === 'Escudos')
        return shieldProficiency.has(p.class);
    return true;
}

function activeEquipment(p) {
    return equipment(p).filter((x, i) => x && !(x.category === 'Escudos' && !compatible(p, x)) && !(i === 5 && x.category === 'Armas') && !(i === 5 && equipment(p)[3]?.hands === 2));
}

function armorMagicBonus(p, x, value) {
    // A proteção física (CA própria) não sofre essa redução.
    // Apenas bônus extras positivos de uma armadura sem proficiência recebem -2.
    const v = number(value);
    return x.category === 'Armaduras' && !compatible(p, x) && v > 0 ? Math.max(0, v - 2) : v;
}
function equipmentBonus(p, kind) {
    return activeEquipment(p).reduce((sum, x) => sum
        + (x.bonuses || []).reduce((n, b) => n + (b.kind === kind ? armorMagicBonus(p, x, b.value) : 0), 0)
        + (x.effects || []).reduce((n, e) => n + (e.kind === 'Bônus passivo' && e.trigger === 'Enquanto estiver equipado' && e.bonusKind === kind && (!e.charged || x.charges?.enabled && number(x.charges.current) >= Math.max(1, number(e.cost))) && /^[+-]?\d+$/.test(String(e.intensity).trim()) ? armorMagicBonus(p, x, e.intensity) : 0), 0), 0);
}

function effectiveAttrs(p) {
    return p.attrs.map((v, i) => Math.max(1, number(v) + equipmentBonus(p, names[i])));
}

function heavyPenalty(p) {
    return 0; // Armadura pesada não tem penalidade automática de iniciativa ou deslocamento.
}

// ==============================================================================
// EQUIPAMENTOS E ESTATÍSTICAS DE COMBATE
// ==============================================================================
function heroStats(p) {
    const a = effectiveAttrs(p), armor = equipment(p)[4], idx = { Mago: 3, Feiticeiro: 3, Bruxo: 3, Monge: 4, Druida: 4, 'Clérigo': 4, 'Bárbaro': 2, Bardo: 5 }[p.class];
    let base = 10 + (idx === undefined ? 0 : Rules.mod(a[idx]));
    if (armor && armor.armorType !== 'Vestimenta')
        base = compatible(p, armor) ? 10 + Rules.mod(a[({ Leve: 1, 'Média': 2, Pesada: 0 })[armor.armorType]]) : 10;
    const armorBonus = activeEquipment(p).reduce((n, x) => n + (['Armaduras', 'Escudos'].includes(x.category) ? number(x.ca) : 0), 0), caBonus = equipmentBonus(p, 'CA'), moveBonus = equipmentBonus(p, 'Deslocamento'), heavy = heavyPenalty(p);
    const rows = [{
            label: 'CA', value: defenseCA(p), lines: [['Base pela classe/armadura', base], ['Armadura e escudo', sign(armorBonus)], ['Bônus por nível', sign(playerLevelCABonus(p))], ['Outros bônus de CA', sign(caBonus)], ['CA efetiva', defenseCA(p)]]
        }];
    for (let i = 0; i < 6; i++) {
        const mod = Rules.mod(effectiveAttrs(p)[i]);
        const equipmentDelta = a[i] - number(p.attrs[i]);
        rows.push({ label: names[i], value: sign(mod), negative: mod < 0, roll: i + 1, lines: [
            ['Atributo base', number(p.attrs[i])],
            ['Bônus de equipamento', sign(equipmentDelta)],
            ...(a[i] !== number(p.attrs[i]) ? [['Atributo efetivo', a[i]]] : []),
            ['Modificador', sign(mod)],
            ['Bônus por nível', sign(p.level + 1)],
            ['Total', sign(mod + p.level + 1)]
        ] });
    }
    const ini = combatStat(p, 1);
    rows.push({ label: 'Iniciativa', value: sign(ini.mod), lines: [['Modificador de Destreza', sign(Rules.mod(a[1]))], ['Bônus de equipamentos', sign(equipmentBonus(p, 'Iniciativa'))], ['Penalidade de armadura', sign(-heavyPenalty(p))], ['Iniciativa efetiva', sign(ini.mod)]] });
    const move = Math.max(0, p.movement + moveBonus - heavy);
    rows.push({
        label: 'Desloc.', value: move + ' m', lines: [['Deslocamento base', p.movement + ' m'], ['Equipamentos', sign(moveBonus) + ' m'], ['Penalidade de armadura', sign(-heavy) + ' m'], ['Deslocamento efetivo', move + ' m']]
    });
    return rows.map(r => {
        const tip = `<span class="stat-breakdown" role="tooltip"><b>${esc(r.label)}</b>${r.lines.map(([k, v], i) => `<span class="stat-breakdown-row ${i === r.lines.length - 1 ? 'total' : ''}"><span>${esc(k)}</span><span class="${String(v).startsWith('-') ? 'negative-mod' : ''}">${esc(v)}</span></span>`).join('')}</span>`, inside = `<small>${esc(r.label)}</small><strong class="${r.negative ? 'negative-mod' : ''}">${esc(r.value)}</strong>${tip}`;
        return r.roll ? `<button type="button" class="stat roll-stat has-breakdown" data-roll="${r.roll}" aria-label="Rolar ${esc(r.label)}, ${esc(r.value)}">${inside}</button>` : `<div class="stat has-breakdown" tabindex="0">${inside}</div>`;
    }).join('');
}

function combatStat(p, i) {
    if (i < 1 || i > 6)
        return null;
    const w = equipment(p)[3], a = effectiveAttrs(p), attrs = [null, 1, 0, 1, 3, 4, 5], labels = ['', 'Iniciativa', 'ATQ Físico', 'ATQ Dist.', 'Magia INT', 'Magia SAB', 'Magia CAR'];
    let idx = attrs[i], bonus = 0, blocked = false;
    const wi = names.indexOf(w?.attribute), match = w && (w.attack === 'Físico' && i === 2 || w.attack === 'Distância' && i === 3 || w.attack === 'Mágico' && i === (wi >= 3 ? wi + 1 : 4));
    if (match && wi >= 0) {
        idx = wi;
        if (i >= 4 && wi < 3)
            labels[i] = 'Magia ' + ['FOR', 'DES', 'CON'][wi];
    }
    if (i === 1)
        bonus = equipmentBonus(p, 'Iniciativa') - heavyPenalty(p);
    else {
        bonus = equipmentBonus(p, 'Acerto');
        if (match) {
            bonus += number(w.hit);
            blocked = !!(w.ammo?.enabled && number(w.ammo.current) < Math.max(1, number(w.ammo.cost)));
            if (chargeReady(w))
                bonus += number(w.charges.hit);
        }
    }
    return {
        label: labels[i], attribute: match && w.attribute === 'Nenhum' ? 'Nenhum' : names[idx], mod: (match && w.attribute === 'Nenhum' ? 0 : Rules.mod(a[idx])) + bonus, extra: bonus, level: i === 1 ? 0 : p.level + 1, blocked, index: i, weapon: match ? w : null
    };
}

function weaponTwoHand(x) {
    return x?.category === 'Armas' && Number(x.hands) === 2;
}

function possibleSlots(x) {
    if (!x)
        return [];
    if (x.category === 'Armas')
        return weaponTwoHand(x) ? [3] : [3, 5];
    if (x.category === 'Armaduras')
        return [4];
    if (x.category === 'Escudos')
        return [5];
    if (x.category === 'Acessórios')
        return ({ Capa: [0], 'Elmo ou chapéu': [1], Colar: [2], Anel: [6, 8], Botas: [7] })[x.accessory] || [];
    return [];
}

function equipPlan(p, from, to) {
    if (to === 3 && !equipment(p)[3] && bag(p)[from]?.category === 'Armas' && preparedTotal(p) >= preparedCapacity('weapon', p))
        return null;
    const bs = bag(p).slice(), es = equipment(p).slice(), x = bs[from];
    if (!x || !possibleSlots(x).includes(to))
        return null;
    bs[from] = null;
    const displaced = [];
    const take = i => {
        if (es[i]) {
            displaced.push(es[i]);
            es[i] = null;
        }
    };
    if (to === 5 && weaponTwoHand(es[3]))
        take(3);
    take(to);
    if (to === 3 && weaponTwoHand(x))
        take(5);
    es[to] = x;
    const trial = { ...p, bagSlots: bs, equipmentSlots: es };
    for (const old of displaced)
        if (!bagPlace(trial, old, from))
            return null;
    return trial;
}

function unequipPlan(p, from, to = -1) {
    const bs = bag(p).slice(), es = equipment(p).slice();
    if (from === 5 && weaponTwoHand(es[3]))
        from = 3;
    const x = es[from];
    if (!x)
        return null;
    if (to >= 0 && bs[to])
        return equipPlan(p, to, from);
    es[from] = null;
    const trial = { ...p, bagSlots: bs, equipmentSlots: es };
    if (to >= 0 && (to >= Rules.capacity(trial) || bs[to]))
        return null;
    if (!bagPlace(trial, x, to))
        return null;
    return trial;
}

function commitEquipment(p, plan) {
    if (!plan) {
        toast('Não foi possível trocar: slot incompatível ou mochila sem espaço.');
        return false;
    }
    p.bagSlots = plan.bagSlots;
    p.equipmentSlots = plan.equipmentSlots;
    render();
    return true;
}

function gearPanel() {
    const p = c(), es = equipment(p);
    return `<div><h2>Equipamentos</h2><div class="equipment">${gear.map((n, i) => {
        const ghost = i === 5 && weaponTwoHand(es[3]), x = ghost ? es[3] : es[i], bad = x && !compatible(p, x), ammo = ghost && x.attack === 'Distância' && x.ammo?.enabled;
        return `<button type="button" class="slot gear-slot ${x ? 'occupied' : ''} ${ghost ? 'gear-ghost' : ''} ${bad ? 'gear-incompatible' : ''}" data-gear="${i}" ${x ? `draggable="false" style="--rar:${RAR_COLORS[RARITIES.indexOf(x.rarity)] || RAR_COLORS[0]}"` : ''} data-tip="${esc(x ? (ghost ? (ammo ? 'Munição: ' + x.ammo.name + ' · ' + x.ammo.current + '/' + x.ammo.max : 'Ocupado por arma de duas mãos') : bad ? 'Sem proficiência · ' + x.name + ' · CA normal; bônus adicionais positivos -2' : x.name + ' · ' + itemDetails(x)) : n)}" aria-label="${esc(n + (x ? ' · ' + x.name : ''))}">${x ? (ammo ? `<span class="gear-ammo"><img class="item-art" src="${artCatalog.Aljava}" alt="Aljava"><small class="ammo-count">${x.ammo.current}</small></span>` : imageMarkup(x)) + (bad ? '<span class="gear-warning">!</span>' : '') : (`<img class="gear-art" src="${gearArt[i]}" alt="${n}">`)}</button>`;
    }).join('')}</div></div>`;
}

function chooseEquip(i) {
    const p = c(), x = bag(p)[i];
    if (!x)
        return;
    const dest = possibleSlots(x);
    if (!dest.length)
        return;
    if (dest.length === 1) {
        commitEquipment(p, equipPlan(p, i, dest[0]));
        return;
    }
    itemDialog.innerHTML = `<h2>Equipar ${esc(x.name)}</h2>${dest.map(j => `<button type="button" data-equip-dest="${j}">${gear[j]}${equipment(p)[j] ? ' · substituir ' + esc(equipment(p)[j].name) : ''}</button>`).join('')}<button type="button" data-item-close>Cancelar</button>`;
    selectedSlot = i;
    itemDialog.showModal();
}

function gearMenu(i) {
    const p = c();
    if (i === 5 && weaponTwoHand(equipment(p)[3]))
        i = 3;
    const x = equipment(p)[i];
    if (!x) {
        toast('Escolha um equipamento da mochila.');
        return;
    }
    itemDialog.innerHTML = `<div class="item-heading">${imageMarkup(x)}<h2>${esc(x.name)}</h2></div><p>${esc(itemDetails(x))}</p>${!compatible(p, x) ? '<p class="gear-warning-text">Sem proficiência: CA da armadura integral; bônus adicionais positivos reduzidos em 2 (mínimo 0).</p>' : ''}${i === 5 && x.category === 'Armas' ? '<p>Arma auxiliar: bônus de arma inativos.</p>' : ''}${i === 3 && x.category === 'Armas' ? weaponResourceButtons(x, 'active') : ''}<button type="button" data-unequip="${i}">Desequipar</button><button type="button" data-item-close>Fechar</button>`;
    itemDialog.showModal();
}

// ==============================================================================
// ABAS DA FICHA E FORMULÁRIO DE ITENS
// ==============================================================================
function renderTab() {
    const labels = ['Mochila', 'Magias', 'Habilidades', 'Mercado'];
    $('tabs').innerHTML = labels.map((n, i) => `<button data-tab="${i}" class="${tab === i ? 'active' : ''}">${n}</button>`).join('') + (tab === 3 ? `<span class="market-tab-divider" aria-hidden="true"></span><button type="button" data-mk-view="npcs" class="market-top-control ${marketView === 'npcs' ? 'active' : ''}">Lojas</button><button type="button" data-mk-view="mine" class="market-top-control ${marketView === 'mine' ? 'active' : ''}">Meus anúncios</button><button type="button" data-mk-view="offers" class="market-top-control ${marketView === 'offers' ? 'active' : ''}">Ofertas</button><button type="button" class="market-top-control" data-mk="sell-current">Vender ao mercador</button><button type="button" class="market-top-control" data-mk="direct">Negociar com jogador</button>` : '');
    const p = c(), b = bag(p), cap = Rules.capacity(p), has = !!state.characters[state.active];
    const lock = '<svg viewBox="0 0 24 24"><rect x="6" y="11" width="12" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>';
    if (tab === 3) {
        $('content').innerHTML = marketPanel();
        return;
    }
    $('content').innerHTML = `<div class="inventory">${gearPanel()}${tab === 0 ? `<div><h2 class="bag-heading">Inventário <small>${bagCount(p)} / ${cap}</small></h2><div class="bag">${b.map((x, i) => `<button type="button" class="slot bag-slot ${i >= cap ? 'locked' : ''} ${x ? 'occupied' : ''}" data-bag="${i}" ${x ? `draggable="false" style="--rar:${RAR_COLORS[RARITIES.indexOf(x.rarity)] || RAR_COLORS[0]}" data-tip="${esc(x.name + ' · ' + itemDetails(x))}" aria-label="${esc(x.name)}"` : `data-tip="${i >= cap ? 'Bloqueado' : 'Adicionar item'}" aria-label="${i >= cap ? 'Bloqueado' : 'Adicionar item'}" ${i >= cap || !has ? 'disabled' : ''}`}>${x ? imageMarkup(x) + (stackable(x) ? `<span class="item-qty">${x.quantity}</span>` : '') : i >= cap ? lock : ''}</button>`).join('')}</div><div class="bag-tools"><button type="button" data-bag-organize ${!has ? 'disabled' : ''}>Organizar</button></div>${bagCount(p) > cap ? '<small>Capacidade reduzida: retire itens em excesso antes de adicionar.</small>' : ''}</div><div class="prepared"><h2>Armas preparadas</h2>${preparedList('weapon')}</div>` : tab === 1 ? `${spellPanel(p)}` : tab === 2 ? skillPanel() : marketPanel()}</div>`;
}

const itemDialog = document.createElement('dialog');
itemDialog.id = 'itemDialog';
document.body.append(itemDialog);
let moving = null, editDraft = null, editImage = '', selectedSlot = -1;
itemDialog.addEventListener('close', () => { bagLibFormMode = null; bagLibChosen = null; });
const options = (values, sel) => values.map(v => `<option ${v === sel ? 'selected' : ''} value="${esc(v)}">${esc(v)}</option>`).join('');
const field = (label, key, val = '', type = 'text', extra = '') => `<label>${label}<input name="${key}" type="${type}" value="${esc(val)}" ${extra}></label>`;
const selectField = (label, key, values, val) => `<label>${label}<select name="${key}">${options(values, val)}</select></label>`;
const check = (label, key, val) => `<label class="item-check"><input name="${key}" type="checkbox" ${val ? 'checked' : ''}>${label}</label>`;
const diceFields = (key, d = {}) => `<div class="dice-fields">${DICE_KINDS.map(n => field('D' + n, key + n, d[n] || 0, 'number', 'min="0" max="40" step="1"')).join('')}${field('Fixo', key + 'fixed', d.fixed || 0, 'number', 'step="1"')}</div>`;
function newDraft(category) {
    return {
        id: itemId(), category, name: '', description: '', rarity: 'Comum', art: category === 'Acessórios' ? 'Capa carmesim' : artOptions[category][0] || '', image: '', quantity: 1, stackable: category === 'Consumíveis', attack: 'Físico', attribute: 'Força', hands: 1, hit: 0, damage: {}, armorType: 'Vestimenta', ca: 0, accessory: 'Capa', ammo: { enabled: false, name: 'Flechas', max: 10, current: 10, cost: 1 }, charges: { enabled: false, max: 5, current: 5, hit: 0, damage: {}, cost: 1, trigger: 'Ao atacar', activation: 'Automática' }, bonuses: [], effects: [], consumption: { type: 'Restaurar PV', amount: {}, condition: 'Envenenado', conditionCount: 1, duration: 1, bonusKind: 'Força', bonusAmount: 0 }
    };
}

// Mochila: modelos simples por categoria, mantidos fora do save para não aumentar a campanha.
// Os modelos que o jogador cadastrar são persistidos em contentLibraries.equipment.
let bagLibCategory = CATEGORIES[0], bagLibSlot = -1, bagLibChosen = null, bagLibFormMode = null;
function basicBagModels() {
    // Cada poção já tem nome próprio e arte por tamanho; não criar duplicatas.
    const presets = CATEGORIES.flatMap(category => (artOptions[category] || [])
        .map(art => ({ category, art, name: art, size: category === 'Consumíveis' ? (art.split(' ').at(-1)) : null })));
    return presets.map(({ category, art, name, size }, idx) => {
        const x = newDraft(category);
        x.id = 'basic-' + CATEGORIES.indexOf(category) + '-' + idx;
        x.name = name;
        x.art = art;
        const uncommonFamily = category === 'Armas' ? UNCOMMON_WEAPON_FAMILY[art] : null;
        x.rarity = uncommonFamily ? 'Incomum' : 'Comum';
        x.quantity = 1;
        x.description = uncommonFamily
            ? 'Versão incomum de ' + uncommonFamily + ', com dano base 1D6. Mantém as regras da família original.'
            : 'Item comum de aventura. Pode ser personalizado antes de ser adicionado à mochila.';
        if (category === 'Armas') {
            const family = uncommonFamily || art;
            const ranged = ['Arco', 'Besta', 'Varinha'];
            const magic = ['Cajado', 'Grimório'];
            x.attack = magic.includes(family) ? 'Mágico' : ranged.includes(family) ? 'Distância' : 'Físico';
            x.attribute = x.attack === 'Distância' ? 'Destreza' : x.attack === 'Mágico' ? 'Inteligência' : 'Força';
            x.hands = ['Arco', 'Besta', 'Lança', 'Foice', 'Cajado', 'Martelo'].includes(family) ? 2 : 1;
            // Regras somente para os modelos novos; itens existentes nos saves permanecem intactos.
            x.damage = uncommonFamily ? { 6: 1 } : { 4: 1 };
            x.basicAttack = family !== 'Grimório';
            x.spellEnabled = magic.includes(family);
            x.spellCapacity = 1;
        }
        if (category === 'Armaduras') {
            const model = ARMOR_MODELS_V0930[art];
            x.armorType = model.type;
            x.rarity = model.rarity;
            x.ca = model.ca;
            x.bonuses = model.attribute ? [{ kind: model.attribute, value: 1 }] : [];
            x.description = `${art} · ${model.type.toLowerCase()} ${model.rarity.toLowerCase()}. `
                + `Concede CA +${model.ca}`
                + (model.attribute ? ` e +1 em ${model.attribute} enquanto equipada.` : '.')
                + ' Armaduras fora da proficiência mantêm a CA, mas reduzem bônus extras positivos em 2 (mínimo 0).';
        }
        if (category === 'Escudos') {
            const model = SHIELD_MODELS_V0932[art];
            x.rarity = model.rarity;
            x.ca = model.ca;
            x.bonuses = []; // Sem bônus de atributos: apenas CA.
            x.effects = [];
            x.description = `${art} · ${model.rarity.toLowerCase()} · Concede +${model.ca} de CA quando equipado por uma classe proficiente em escudos.`;
        }
        if (category === 'Acessórios') {
            x.accessory = /Anel/.test(art) ? 'Anel' : /Colar/.test(art) ? 'Colar' : /Capa/.test(art) ? 'Capa' : /Botas/.test(art) ? 'Botas' : 'Elmo ou chapéu';
            const bonus = ACCESSORY_BONUSES_V0933[art];
            x.bonuses = bonus ? [{ ...bonus }] : [];
            x.effects = [];
            x.description = bonus ? `${art}. Enquanto equipado: +${bonus.value} em ${bonus.kind}.` : x.description;
        }
        if (category === 'Consumíveis') {
            const recovery = art.startsWith('Poção vermelha ') ? 'Restaurar PV'
                : art.startsWith('Poção azul ') ? 'Restaurar PM'
                : ['Pão', 'Carne'].includes(art) ? 'Restaurar PV' : null;
            const cleanse = GREEN_POTION_CLEANSE_V0934[art];
            x.consumption.type = cleanse ? 'Remover condições' : recovery || 'Narrativo';
            x.consumption.amount = recovery ? art === 'Pão' ? { fixed: 1 }
                : art === 'Carne' ? { fixed: 5 }
                : size === 'grande' ? { 6: 2 } : size === 'média' ? { 4: 2 } : { 4: 1 } : {};
            if (cleanse) {
                x.consumption.conditionCount = cleanse;
                x.consumption.conditionKinds = []; // Padrão: sortear entre todas as condições negativas.
                x.description = `Remove aleatoriamente até ${cleanse} condição(ões) negativa(s) do alvo, sem remover concentração.`;
            } else if (recovery) {
                x.description = ['Pão', 'Carne'].includes(art)
                    ? `Recupera ${art === 'Pão' ? 1 : 5} PV fixos.`
                    : (recovery === 'Restaurar PV' ? 'Recupera pontos de vida' : 'Recupera pontos de mana') + ' em ' + diceText(x.consumption.amount) + '.';
            }
            x.stackable = true;
        }
        if (category === 'Utilidades') x.stackable = true;
        return x;
    });
}
const BAG_BASIC_MODELS = basicBagModels();
// v0.9.35 — A aljava foi mantida SOMENTE como indicador visual da munição
// de arco/besta; ela não é mais um item separado da categoria Utilidades.
// Limpeza idempotente dos dados de teste antigos, inclusive bibliotecas e lojas.
function isDecorativeQuiverV0935(item) {
    return !!item && item.category === 'Utilidades' &&
        String(item.name || '').trim().toLocaleLowerCase('pt-BR') === 'aljava';
}
function purgeDecorativeQuiverV0935(s = state) {
    let removed = 0;
    const scrubSlots = slots => {
        if (!Array.isArray(slots)) return;
        for (let i = 0; i < slots.length; i++) {
            if (isDecorativeQuiverV0935(slots[i])) { slots[i] = null; removed++; }
        }
    };
    if (Array.isArray(s.contentLibraries?.equipment)) {
        const before = s.contentLibraries.equipment.length;
        s.contentLibraries.equipment = s.contentLibraries.equipment.filter(x => !isDecorativeQuiverV0935(x));
        removed += before - s.contentLibraries.equipment.length;
    }
    for (const p of Array.isArray(s.characters) ? s.characters : []) {
        scrubSlots(p.bagSlots);
        scrubSlots(p.equipmentSlots);
    }
    if (s.market && typeof s.market === 'object') {
        for (const n of Array.isArray(s.market.npcs) ? s.market.npcs : []) {
            if (!Array.isArray(n.stock)) continue;
            for (let i = 0; i < n.stock.length; i++) {
                const item = n.stock[i];
                if (!isDecorativeQuiverV0935(item)) continue;
                if (item.id && n.prices) delete n.prices[item.id];
                n.stock[i] = null;
                removed++;
            }
        }
        if (Array.isArray(s.market.listings)) {
            const before = s.market.listings.length;
            s.market.listings = s.market.listings.filter(l => !isDecorativeQuiverV0935(l?.item));
            removed += before - s.market.listings.length;
        }
    }
    return removed;
}
// v0.9.31: as 12 armaduras novas substituem DEFINITIVAMENTE os modelos
// de teste Túnica, Manto, Couro, Escamas e Placas. O catálogo padrão só tem 12.
const RETIRED_ARMOR_NAMES_V0931 = new Set(['Túnica', 'Manto', 'Couro', 'Escamas', 'Placas']);
function isRetiredArmorModelV0931(item) {
    return !!item && item.category === 'Armaduras' &&
        RETIRED_ARMOR_NAMES_V0931.has(String(item.name || '').trim());
}
// Migração da campanha de testes: apaga os cinco modelos obsoletos tanto da
// biblioteca como de inventários, equipamentos e estoques/anúncios ativos.
// Idempotente: poderá rodar em toda inicialização sem criar entradas novas.
function purgeRetiredArmorsV0931(s = state) {
    let removed = 0;
    const scrubSlots = slots => {
        if (!Array.isArray(slots)) return;
        for (let i = 0; i < slots.length; i++) {
            if (isRetiredArmorModelV0931(slots[i])) { slots[i] = null; removed++; }
        }
    };
    if (Array.isArray(s.contentLibraries?.equipment)) {
        const before = s.contentLibraries.equipment.length;
        s.contentLibraries.equipment = s.contentLibraries.equipment.filter(x => !isRetiredArmorModelV0931(x));
        removed += before - s.contentLibraries.equipment.length;
    }
    for (const p of Array.isArray(s.characters) ? s.characters : []) {
        scrubSlots(p.bagSlots);
        scrubSlots(p.equipmentSlots);
    }
    if (s.market && typeof s.market === 'object') {
        for (const n of Array.isArray(s.market.npcs) ? s.market.npcs : []) {
            if (!Array.isArray(n.stock)) continue;
            for (let i = 0; i < n.stock.length; i++) {
                const x = n.stock[i];
                if (!isRetiredArmorModelV0931(x)) continue;
                if (x.id && n.prices) delete n.prices[x.id];
                n.stock[i] = null;
                removed++;
            }
        }
        if (Array.isArray(s.market.listings)) {
            const before = s.market.listings.length;
            s.market.listings = s.market.listings.filter(l => !isRetiredArmorModelV0931(l?.item));
            removed += before - s.market.listings.length;
        }
    }
    return removed;
}
// v0.9.32: escudos antigos de teste são substituídos pelos novos modelos.
const RETIRED_SHIELD_NAMES_V0932 = new Set(['Escudo de madeira', 'Escudo de metal']);
function isRetiredShieldV0932(item) {
    return !!item && item.category === 'Escudos' &&
        RETIRED_SHIELD_NAMES_V0932.has(String(item.name || '').trim());
}
function replaceLegacyShieldsV0932(s = state) {
    let changed = 0;
    const scrubSlots = slots => {
        if (!Array.isArray(slots)) return;
        for (let i = 0; i < slots.length; i++) {
            if (isRetiredShieldV0932(slots[i])) { slots[i] = null; changed++; }
        }
    };
    if (Array.isArray(s.contentLibraries?.equipment)) {
        const before = s.contentLibraries.equipment.length;
        s.contentLibraries.equipment = s.contentLibraries.equipment.filter(x => !isRetiredShieldV0932(x));
        changed += before - s.contentLibraries.equipment.length;
    }
    for (const p of Array.isArray(s.characters) ? s.characters : []) {
        scrubSlots(p.bagSlots);
        scrubSlots(p.equipmentSlots);
    }
    if (s.market && typeof s.market === 'object') {
        for (const merchant of Array.isArray(s.market.npcs) ? s.market.npcs : []) {
            if (!Array.isArray(merchant.stock)) continue;
            for (let i = 0; i < merchant.stock.length; i++) {
                const old = merchant.stock[i];
                if (!isRetiredShieldV0932(old)) continue;
                if (merchant.name === 'Filippa Uffberth' && (merchant.region || 'Padrão') === 'Padrão') {
                    const key = old.name.toLocaleLowerCase('pt-BR') === 'escudo de metal' ? 'Escudo de Ferro' : 'Escudo de Madeira';
                    const template = BAG_BASIC_MODELS.find(x => x.category === 'Escudos' && x.name === key);
                    if (template) {
                        merchant.stock[i] = { ...cloneItem(template), id: old.id || itemId(), quantity: 1 };
                        changed++;
                        continue;
                    }
                }
                if (old.id && merchant.prices) delete merchant.prices[old.id];
                merchant.stock[i] = null;
                changed++;
            }
        }
        if (Array.isArray(s.market.listings)) {
            const before = s.market.listings.length;
            s.market.listings = s.market.listings.filter(l => !isRetiredShieldV0932(l?.item));
            changed += before - s.market.listings.length;
        }
    }
    return changed;
}
// v0.9.33: atualiza acessórios padronizados já existentes nas fichas de teste.
// Preserva acessórios personalizados com bônus/efeitos preexistentes.
function updateAccessoriesV0933(s = state) {
    let changed = 0;
    const visit = item => {
        if (!item || item.category !== 'Acessórios') return;
        const bonus = ACCESSORY_BONUSES_V0933[item.name];
        if (!bonus || (item.bonuses?.length || 0) > 0 || (item.effects?.length || 0) > 0) return;
        if (item.image) return; // manter artes enviadas pelo jogador
        item.bonuses = [{ ...bonus }];
        item.art = item.name; // arte atualizada também nos itens que usavam ícones genéricos
        item.description = item.description?.startsWith('Item comum de aventura.')
            ? `${item.name}. Enquanto equipado: +${bonus.value} em ${bonus.kind}.`
            : item.description;
        changed++;
    };
    for (const p of Array.isArray(s.characters) ? s.characters : []) {
        for (const item of p.bagSlots || []) visit(item);
        for (const item of p.equipmentSlots || []) visit(item);
    }
    for (const item of s.contentLibraries?.equipment || []) visit(item);
    for (const npc of s.market?.npcs || []) for (const item of npc.stock || []) visit(item);
    for (const listing of s.market?.listings || []) visit(listing?.item);
    return changed;
}
// v0.9.34 — normaliza consumíveis de teste e atualiza artes de todas as poções.
function updateConsumablesV0934(s = state) {
    if (s.consumablesV0934Migrated) return 0;
    let changed = 0;
    const defaults = new Map(BAG_BASIC_MODELS.filter(x => x.category === 'Consumíveis').map(x => [x.name, x]));
    const visit = item => {
        if (!item || item.category !== 'Consumíveis') return;
        const oldGreen = item.name === 'Poção verde';
        const key = oldGreen ? 'Poção verde pequena' : item.name;
        const model = defaults.get(key);
        if (!model) return;
        // Artes próprias enviadas manualmente não são substituídas.
        if (!item.image) item.art = model.art;
        if (oldGreen || key === 'Pão' || key === 'Carne' || key.startsWith('Poção verde ')) {
            item.name = key;
            item.consumption = cloneItem(model.consumption);
            item.description = model.description;
        }
        changed++;
    };
    for (const p of Array.isArray(s.characters) ? s.characters : [])
        for (const item of p.bagSlots || []) visit(item);
    for (const item of s.contentLibraries?.equipment || []) visit(item);
    for (const n of s.market?.npcs || []) for (const item of n.stock || []) visit(item);
    for (const listing of s.market?.listings || []) visit(listing?.item);
    s.consumablesV0934Migrated = true;
    return changed + 1; // persistir também a flag da migração
}
// Evita duplicar modelos que já existiam na biblioteca compartilhável.
function bagLibModelKey(x) {
    let name = String(x.name || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    if (x.category === 'Consumíveis' && ['pocao vermelha', 'pocao azul'].includes(name)) name += ' pequena';
    return x.category + ':' + name;
}
function bagLibEntries(category = bagLibCategory) {
    const entries = [], seen = new Set();
    const add = (item, custom) => {
        if (item.category !== category) return;
        // Itens legados não retornam à seleção nem após importar uma biblioteca.
        if (isRetiredArmorModelV0931(item) || isRetiredShieldV0932(item) || isDecorativeQuiverV0935(item)) return;
        const key = bagLibModelKey(item);
        if (seen.has(key)) return;
        seen.add(key);
        entries.push({ item, custom });
    };
    // Prioridade para o modelo padrão: armas em 1D4 e poções em tamanhos definidos.
    BAG_BASIC_MODELS.forEach(item => add(item, false));
    libList('equipment').forEach(item => add(item, true));
    return entries;
}
function bagLibOpen(slot = bagLibSlot, category = bagLibCategory) {
    bagLibSlot = slot;
    bagLibCategory = CATEGORIES.includes(category) ? category : CATEGORIES[0];
    bagLibChosen = null;
    bagLibFormMode = null;
    const entries = bagLibEntries();
    itemDialog.innerHTML = `<h2>Adicionar à Mochila</h2><nav class="baglib-tabs" aria-label="Categorias de itens">${CATEGORIES.map(k => `<button type="button" class="${k === bagLibCategory ? 'selected' : ''}" data-baglib-tab="${esc(k)}" aria-pressed="${k === bagLibCategory}">${esc(k)}</button>`).join('')}</nav><div class="baglib-toolbar"><span>${esc(bagLibCategory)} <small>· ${entries.length} modelos</small></span><button type="button" data-baglib-new>+ Novo</button></div><div class="baglib-grid">${entries.map(({ item, custom }, i) => `<button type="button" class="baglib-tile" data-baglib-select="${i}" aria-label="Ver ${esc(item.name)}">${imageMarkup(item)}<span>${esc(item.name)}</span>${custom ? '<small>Criado</small>' : ''}</button>`).join('')}</div><div class="baglib-footer"><button type="button" data-item-close>Fechar</button></div>`;
    if (!itemDialog.open) itemDialog.showModal();
}
function bagLibPreview(index) {
    const model = bagLibEntries()[index];
    if (!model) return;
    bagLibChosen = cloneItem(model.item);
    const x = bagLibChosen;
    itemDialog.innerHTML = `<h2>Detalhes do item</h2><div class="baglib-preview"><div class="baglib-preview-img">${imageMarkup(x)}</div><div><h3>${esc(x.name)}</h3><p>${esc(x.category)} · ${esc(x.rarity)}</p></div></div><p class="baglib-description">${esc(x.description || 'Sem descrição.')}</p><p class="baglib-info">${esc(itemDetails({ ...x, description: '' }))}</p><p id="baglibError" role="alert"></p><div class="baglib-actions"><button type="button" data-baglib-back>← Voltar</button><button type="button" data-baglib-edit>Editar cópia</button><button type="button" data-baglib-add>Adicionar à mochila</button></div>`;
}
function bagLibStartForm(mode) {
    if (mode === 'copy' && !bagLibChosen) return;
    bagLibFormMode = mode;
    const d = mode === 'copy' ? cloneItem(bagLibChosen) : newDraft(bagLibCategory);
    d.id = itemId();
    d.quantity = 1;
    openItemForm(d, bagLibSlot, false);
    const title = itemDialog.querySelector('h2');
    if (title) title.textContent = mode === 'copy' ? 'Editar cópia · ' + d.category : 'Novo modelo · ' + d.category;
    const submit = itemDialog.querySelector('#itemForm button[type="submit"]');
    if (submit) submit.textContent = mode === 'copy' ? 'Adicionar cópia à mochila' : 'Salvar na biblioteca';
}
function bagLibAdd() {
    if (!bagLibChosen) return;
    const d = libTemplate('equipment', bagLibChosen);
    d.id = itemId();
    d.quantity = 1;
    if (!bagPlace(c(), d, bagLibSlot)) {
        const err = document.querySelector('#baglibError');
        if (err) err.textContent = 'Mochila cheia. Libere espaço antes de adicionar.';
        return;
    }
    itemDialog.close();
    render();
    toast('Item adicionado à mochila.');
}
function categoryMenu(slot = -1) {
    if (!libItemEditing && !marketItemContext) {
        bagLibOpen(slot, CATEGORIES[0]);
        return;
    }
    selectedSlot = slot;
    itemDialog.innerHTML = `<h2>${libItemEditing ? 'Cadastrar modelo' : marketItemContext ? 'Adicionar ao estoque' : 'Adicionar à mochila'}</h2><div class="category-picker">${CATEGORIES.map(k => `<button type="button" data-category="${k}">${k}</button>`).join('')}</div><button type="button" data-item-close>Cancelar</button>`;
    if (!itemDialog.open)
        itemDialog.showModal();
}

function effectRow(e = {}, i) {
    return `<fieldset class="item-effect"><legend>Efeito ${i + 1}</legend>${selectField('Efeito', 'kind', ['Envenenamento', 'Queimadura', 'Roubo de vida', 'Reflexão de dano', 'Contra-ataque', 'Aplicar condição', 'Bônus passivo', 'Personalizado'], e.kind || 'Envenenamento')}${selectField('Gatilho', 'trigger', ['Ao acertar um ataque', 'Ao receber um ataque', 'Ao receber dano', 'Enquanto estiver equipado'], e.trigger || 'Ao acertar um ataque')}<div class="item-cols">${field('Chance (%)', 'chance', e.chance ?? 100, 'number', 'min="1" max="100"')}${field('Duração', 'duration', e.duration ?? 1, 'number', 'min="1"')}${clockSelect('durationUnit', e.durationUnit, 'Contar duração em')}${clockSelect('dotUnit', e.dotUnit, 'Dano periódico a cada')}${field('Intensidade / dados (ex.: 1D4 + 2)', 'intensity', e.intensity || '1D4')}${selectField('Estatística (bônus passivo)', 'bonusKind', BONUS_KINDS, e.bonusKind || 'CA')}${selectField('Condição', 'condition', CONDITION_KINDS, e.condition || 'Envenenado')}</div>${check('Depende de carga mágica', 'charged', e.charged)}${field('Custo de carga', 'cost', e.cost ?? 1, 'number', 'min="1"')}${selectField('Resistência', 'resistance', ['Nenhuma', 'Inicial', 'Inicial e a cada turno', 'Inicial e a cada rodada'], e.resistance || 'Nenhuma')}${selectField('Atributo de resistência', 'resAttr', names, e.resAttr || 'Constituição')}${field('CD', 'dc', e.dc ?? 10, 'number', 'min="0"')}${field('Detalhes', 'details', e.details || '')}<small>Para bônus passivo, use gatilho Enquanto estiver equipado e intensidade inteira. Efeitos personalizados são narrativos.</small><button type="button" data-remove-effect>Remover efeito</button></fieldset>`;
}

function bonusRow(b = {}) {
    return `<div class="bonus-row">${selectField('Estatística', 'kind', BONUS_KINDS, b.kind || 'CA')}${field('Valor', 'value', b.value ?? 1, 'number', 'step="1"')}<button type="button" data-remove-bonus aria-label="Remover bônus">×</button></div>`;
}

function openItemForm(d, slot = -1, editing = false) {
    if (d.category === 'Acessórios')
        d = { ...d, art: accessoryArtKey(d) };
    editDraft = cloneItem(d);
    editImage = d.image || '';
    selectedSlot = slot;
    const k = d.category, weapon = k === 'Armas', armor = k === 'Armaduras', shield = k === 'Escudos', acc = k === 'Acessórios', cons = k === 'Consumíveis', util = k === 'Utilidades', equip = weapon || armor || shield || acc;
    itemDialog.innerHTML = `<h2>${editing ? 'Editar' : 'Adicionar'} · ${k}</h2><form id="itemForm">${weapon ? '<section data-wstep="0">' : ''}<div class="item-cols">${field('Nome', 'name', d.name, 'text', 'required maxlength="120"')}${selectField('Raridade', 'rarity', RARITIES, d.rarity)}</div><label>Imagem</label><div class="art-picker">${(artCatalog[d.art] && !artOptions[k].includes(d.art) ? [d.art, ...artOptions[k]] : artOptions[k]).map(a => `<button type="button" data-art="${a}" class="${d.art === a && !editImage ? 'chosen' : ''}"><img src="${artCatalog[a]}" alt="">${a}</button>`).join('')}<label class="upload-art"><span>Enviar imagem</span><input type="file" accept="image/*" id="itemPhoto"></label><button type="button" data-item-noart>Sem imagem</button><img id="itemPreview" ${editImage ? 'src="' + safeArt(editImage) + '"' : 'hidden'} alt="Prévia"></div><label>Descrição<textarea name="description" rows="2" maxlength="4000">${esc(d.description)}</textarea></label>${!libItemEditing && (!editing || stackable(d)) ? field('Quantidade', 'quantity', d.quantity, 'number', 'min="1" max="1000000" step="1" required') : ''}${util ? check('Empilhável', 'stackable', d.stackable) : ''}${weapon ? `</section><section data-wstep="1">${check('Possui ataque convencional', 'basicAttack', d.basicAttack !== false)}<div class="item-cols">${selectField('Tipo de ataque', 'attack', ['Físico', 'Distância', 'Mágico'], d.attack)}${selectField('Atributo de ataque', 'attribute', ['Nenhum', ...names], d.attribute)}${selectField('Empunhadura', 'hands', ['1', '2'], String(d.hands))}${field('Bônus de acerto', 'hit', d.hit, 'number', 'step="1"')}</div><h3>Dano base</h3>${diceFields('damage', d.damage)}</section><section data-wstep="2">${check('Permite conjuração de magias', 'spellEnabled', canConjureWith(d))}<div id="spellCapacityField">${field('Capacidade de magias preparadas', 'spellCapacity', d.spellCapacity ?? 1, 'number', 'min="1" max="5" step="1" required')}</div>${check('Usa munição', 'ammoEnabled', d.ammo?.enabled)}<div id="ammoFields" class="item-cols">${field('Nome da munição', 'ammoName', d.ammo?.name || 'Flechas')}${field('Capacidade', 'ammoMax', d.ammo?.max ?? 10, 'number', 'min="1"')}${field('Atual', 'ammoCurrent', d.ammo?.current ?? 10, 'number', 'min="0"')}${field('Consumo por ataque', 'ammoCost', d.ammo?.cost ?? 1, 'number', 'min="1"')}</div>${check('Usa cargas mágicas', 'chargeEnabled', d.charges?.enabled)}<div id="chargeFields"><div class="item-cols">${field('Capacidade', 'chargeMax', d.charges?.max ?? 5, 'number', 'min="1"')}${field('Atual', 'chargeCurrent', d.charges?.current ?? 5, 'number', 'min="0"')}${field('Acerto extra', 'chargeHit', d.charges?.hit ?? 0, 'number')}${field('Consumo', 'chargeCost', d.charges?.cost ?? 1, 'number', 'min="1"')}${selectField('Quando consome', 'chargeTrigger', ['Ao atacar', 'Quando ativa o efeito'], d.charges?.trigger || 'Ao atacar')}${selectField('Ativação', 'chargeActivation', ['Automática', 'Manual'], d.charges?.activation || 'Automática')}</div><h3>Dano adicional com carga</h3>${diceFields('chargeDamage', d.charges?.damage)}</div></section>` : ''}${armor ? selectField('Tipo de proteção', 'armorType', ['Vestimenta', 'Leve', 'Média', 'Pesada'], d.armorType) : ''}${armor || shield ? field('Bônus de CA', 'ca', d.ca, 'number', 'step="1"') : ''}${acc ? selectField('Tipo de acessório', 'accessory', ['Capa', 'Elmo ou chapéu', 'Colar', 'Anel', 'Botas'], d.accessory) : ''}${equip ? `${weapon ? '<section data-wstep="3">' : ''}<h3>Bônus permanentes</h3><div id="bonusRows">${(d.bonuses || []).map(bonusRow).join('')}</div><button type="button" data-add-bonus>+ Adicionar bônus</button>${weapon ? '</section><section data-wstep="4">' : ''}<h3>Efeitos especiais <small id="effectCount"></small></h3><div id="effectRows">${(d.effects || []).map(effectRow).join('')}</div><button type="button" data-add-effect>+ Adicionar efeito</button>${weapon ? '</section>' : ''}` : ''}${cons ? `<h3>Efeito ao consumir</h3>${selectField('Efeito', 'consType', ['Restaurar PV', 'Restaurar PM', 'Remover condição', 'Remover condições', 'Aplicar condição', 'Bônus temporário', 'Narrativo'], d.consumption?.type || 'Restaurar PV')}${diceFields('consAmount', d.consumption?.amount)}${selectField('Condição', 'consCondition', CONDITION_KINDS, d.consumption?.condition || 'Envenenado')}${field('Quantidade de condições negativas removidas', 'consConditionCount', d.consumption?.conditionCount ?? 1, 'number', 'min="1" max="6" step="1"')}<fieldset id="consConditionTargets" class="cons-condition-targets"><legend>Condições que esta poção pode curar</legend><small>Sem seleção: sorteia entre todas as condições negativas. Se marcar uma ou mais, só essas poderão ser curadas.</small><div class="cons-condition-grid">${NEGATIVE_CONDITION_KINDS.map(k => `<label class="item-check"><input type="checkbox" name="consConditionKinds" value="${esc(k)}" ${consumableCleanseFilter(d).includes(k) ? 'checked' : ''}>${esc(k)}</label>`).join('')}</div></fieldset>${selectField('Estatística temporária', 'consBonus', BONUS_KINDS, d.consumption?.bonusKind || 'Força')}${field('Valor do bônus', 'consBonusAmount', d.consumption?.bonusAmount ?? 0, 'number')}${field('Duração', 'consDuration', d.consumption?.duration ?? 1, 'number', 'min="1"')}${clockSelect('consDurationUnit', d.consumption?.durationUnit, 'Contar duração em')}${clockSelect('consDotUnit', d.consumption?.dotUnit, 'Dano periódico a cada')}` : ''}<p id="itemError" role="alert"></p><div class="item-actions"><button type="button" data-item-close>Cancelar</button><button type="submit">${libItemEditing ? 'Salvar modelo' : editing ? 'Salvar' : marketItemContext ? 'Adicionar ao estoque' : 'Adicionar à mochila'}</button></div></form>`;
    if (!itemDialog.open)
        itemDialog.showModal();
    const f = $('itemForm');
    if (acc && !editing)
        f.elements.accessory.addEventListener('change', () => {
            if (editImage || f.dataset.artManual === '1')
                return;
            editDraft.art = accessoryDefault[f.elements.accessory.value] || 'Capa carmesim';
            f.querySelectorAll('[data-art]').forEach(b => b.classList.toggle('chosen', b.dataset.art === editDraft.art));
        });
    f.dataset.editing = editing ? '1' : '0';
    updateForm();
    f.addEventListener('change', updateForm);
    f.onsubmit = e => {
        e.preventDefault();
        saveItem(f);
    };
    if (weapon)
        setupWizard(f, ['Identidade', 'Combate', 'Recursos', 'Bônus', 'Efeitos'], 0, true);
    refreshHelp(f);
}

function effectLimit(r) {
    return r === 'Lendário' ? 3 : r === 'Épico' ? 2 : 1;
}

function updateForm() {
    const f = $('itemForm');
    if (!f)
        return;
    if ($('spellCapacityField')) {
        const enabled = f.elements.spellEnabled.checked;
        $('spellCapacityField').hidden = !enabled;
        f.elements.spellCapacity.disabled = !enabled;
    }
    for (const [id, name] of [['ammoFields', 'ammoEnabled'], ['chargeFields', 'chargeEnabled']])
        if ($(id))
            $(id).hidden = !f.elements[name].checked;
    const n = $('effectRows')?.children.length || 0, limit = effectLimit(f.elements.rarity.value);
    if ($('consConditionTargets')) {
        const multi = f.elements.consType.value === 'Remover condições';
        $('consConditionTargets').hidden = !multi;
        f.elements.consConditionCount.closest('label').hidden = !multi;
        f.elements.consCondition.closest('label').hidden = !['Remover condição', 'Aplicar condição'].includes(f.elements.consType.value);
    }
    if ($('effectCount'))
        $('effectCount').textContent = `${n}/${limit}`;
    const button = f.querySelector('[data-add-effect]');
    if (button)
        button.disabled = n >= limit;
}

function saveItem(f) {
    const p = c(), v = k => f.elements[k]?.value ?? '', n = (k, def = 0) => v(k) === '' ? def : Number(v(k)), is = k => !!f.elements[k]?.checked, readDice = key => Object.fromEntries([...DICE_KINDS, 'fixed'].map(d => [d, n(key + d)]));
    const d = { ...editDraft, name: v('name').trim(), description: v('description').trim(), rarity: v('rarity'), image: editImage, quantity: n('quantity', 1) };
    const error = t => {
        $('itemError').textContent = t;
    };
    if (!d.name)
        return error('Informe o nome.');
    if (!Number.isSafeInteger(d.quantity) || d.quantity < 1)
        return error('Quantidade inválida.');
    if (d.category === 'Utilidades')
        d.stackable = is('stackable');
    if (d.category === 'Consumíveis')
        d.consumption = {
            type: v('consType'), amount: readDice('consAmount'), condition: v('consCondition'), conditionCount: Math.max(1, Math.min(6, Math.trunc(n('consConditionCount', 1)))), conditionKinds: v('consType') === 'Remover condições' ? [...f.querySelectorAll('[name="consConditionKinds"]:checked')].map(el => el.value) : [], bonusKind: v('consBonus'), bonusAmount: n('consBonusAmount'), duration: n('consDuration', 1), durationUnit: clockUnit(v('consDurationUnit')), dotUnit: clockUnit(v('consDotUnit'))
        };
    // Atualiza apenas a descrição automática das poções, sem apagar texto próprio do mestre.
    if (d.category === 'Consumíveis' && d.consumption.type === 'Remover condições' &&
        /^Remove (aleatoriamente )?até \d+ condição\(ões\) negativa\(s\)/.test(d.description)) {
        const chosen = consumableCleanseFilter(d);
        d.description = chosen.length
            ? `Remove até ${consumableCleanseLimit(d)} condição(ões) negativa(s) dentre: ${chosen.join(', ')}.`
            : `Remove aleatoriamente até ${consumableCleanseLimit(d)} condição(ões) negativa(s) do alvo, sem remover concentração.`;
    }
    if (d.category === 'Armas') {
        d.basicAttack = is('basicAttack');
        d.attack = v('attack');
        d.spellEnabled = is('spellEnabled');
        d.spellCapacity = clamp(Math.trunc(n('spellCapacity', 1)), 1, 5);
        d.attribute = v('attribute');
        d.hands = n('hands', 1);
        d.hit = n('hit');
        d.damage = readDice('damage');
        d.ammo = { enabled: is('ammoEnabled'), name: v('ammoName'), max: n('ammoMax'), current: n('ammoCurrent'), cost: n('ammoCost') };
        d.charges = {
            enabled: is('chargeEnabled'), max: n('chargeMax'), current: n('chargeCurrent'), cost: n('chargeCost'), hit: n('chargeHit'), damage: readDice('chargeDamage'), trigger: v('chargeTrigger'), activation: v('chargeActivation')
        };
        for (const a of [d.ammo, d.charges])
            if (a.enabled && (a.current > a.max || a.cost > a.max))
                return error('Revise a capacidade e o consumo do recurso.');
    }
    if (d.category === 'Armaduras')
        d.armorType = v('armorType');
    if (['Armaduras', 'Escudos'].includes(d.category))
        d.ca = n('ca');
    if (d.category === 'Acessórios')
        d.accessory = v('accessory');
    d.bonuses = [...f.querySelectorAll('.bonus-row')].map(r => ({ kind: r.querySelector('[name=kind]').value, value: Number(r.querySelector('[name=value]').value) }));
    d.effects = [...f.querySelectorAll('.item-effect')].map(r => Object.fromEntries([...r.querySelectorAll('input,select')].map(el => [el.name, el.type === 'checkbox' ? el.checked : el.type === 'number' ? Number(el.value) : el.value])));
    if (d.effects.length > effectLimit(d.rarity))
        return error('Remova os efeitos excedentes para essa raridade.');
    if (bagLibFormMode === 'model') {
        const msg = libSaveModel('equipment', d, null);
        if (msg) return error(msg);
        const category = bagLibCategory, slot = bagLibSlot;
        bagLibFormMode = null;
        bagLibOpen(slot, category);
        toast('Modelo salvo na biblioteca.');
        return;
    }
    if (bagLibFormMode === 'copy') {
        // Cópia exclusiva da ficha, sem alterar ou criar modelos na biblioteca.
        d.id = itemId();
    }
    if (libItemEditing) {
        const msg = libSaveModel('equipment', d, libItemId);
        if (msg)
            return error(msg);
        itemDialog.close();
        return;
    }
    if (marketItemContext) {
        const { id, i } = marketItemContext;
        if (!stackable(d) && d.quantity !== 1)
            return error('Cadastre uma unidade por espaço.');
        if (!commitMarket(s => {
            const n = marketFind('n:' + id, s);
            if (!n || n.stock[i])
                throw Error('Espaço indisponível.');
            n.stock[i] = cloneItem(d);
        }))
            return error('Não foi possível salvar o produto.');
        marketItemContext = null;
        itemDialog.close();
        merchantOpen(id);
        return;
    }
    const b = bag(p);
    if (f.dataset.editing === '1') {
        const before = b[selectedSlot];
        if (!before)
            return error('Item não encontrado.');
        if (!stackable(d) && d.quantity > 1)
            return error('Divida a pilha antes de desativar o empilhamento.');
        b[selectedSlot] = d;
    }
    else if (!bagPlace(p, d, selectedSlot))
        return error('Mochila cheia. Libere espaços antes de adicionar.');
    itemDialog.close();
    render();
    toast('Item salvo na mochila.');
}

function itemMenu(i) {
    const x = bag()[i];
    if (!x)
        return;
    selectedSlot = i;
    itemDialog.innerHTML = `<div class="item-heading">${imageMarkup(x)}<h2 style="color:${RAR_COLORS[RARITIES.indexOf(x.rarity)] || RAR_COLORS[0]}">${esc(x.name)}</h2></div><p>${esc(itemDetails(x))}</p>${stackable(x) ? `<p>Quantidade: ${x.quantity}</p><button type="button" data-item-op="add">Adicionar unidades</button><button type="button" data-item-op="remove">Remover unidades</button>` : ''}${x.category === 'Consumíveis' ? '<button type="button" data-item-op="consume">Usar / consumir</button>' : ''}${possibleSlots(x).length ? '<button type="button" data-item-op="equip">Equipar</button>' : ''}${x.category === 'Armas' ? '<button type="button" data-prepare-bag="' + i + '">Preparar arma</button>' : ''}<button type="button" data-item-op="move">Mover / unir pilha</button><button type="button" data-item-op="edit">Editar</button><button type="button" data-item-op="duplicate">Duplicar item</button><button type="button" data-item-op="announce">Anunciar no Mercado</button><button type="button" data-item-op="discard">Descartar</button><button type="button" data-item-close>Fechar</button>`;
    itemDialog.showModal();
}
itemDialog.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b)
        return;
    const d = b.dataset;
    if ('itemClose' in d) {
        itemDialog.close();
        return;
    }
    if (d.baglibTab) { bagLibOpen(bagLibSlot, d.baglibTab); return; }
    if ('baglibSelect' in d) { bagLibPreview(Number(d.baglibSelect)); return; }
    if ('baglibNew' in d) { bagLibStartForm('model'); return; }
    if ('baglibBack' in d) { bagLibOpen(bagLibSlot, bagLibCategory); return; }
    if ('baglibEdit' in d) { bagLibStartForm('copy'); return; }
    if ('baglibAdd' in d) { bagLibAdd(); return; }
    if (d.category) {
        openItemForm(newDraft(d.category), selectedSlot);
        return;
    }
    if (d.art || 'itemNoart' in d) {
        if ($('itemForm'))
            $('itemForm').dataset.artManual = '1';
        editDraft.art = d.art || '__none';
        editImage = '';
        $('itemPreview').hidden = true;
        itemDialog.querySelectorAll('[data-art]').forEach(el => el.classList.toggle('chosen', el === b));
        return;
    }
    if ('addBonus' in d) {
        $('bonusRows').insertAdjacentHTML('beforeend', bonusRow());
        return;
    }
    if ('removeBonus' in d) {
        b.closest('.bonus-row').remove();
        return;
    }
    if ('addEffect' in d) {
        if ($('effectRows').children.length < effectLimit($('itemForm').elements.rarity.value))
            $('effectRows').insertAdjacentHTML('beforeend', effectRow({}, $('effectRows').children.length));
        updateForm();
        return;
    }
    if ('removeEffect' in d) {
        b.closest('.item-effect').remove();
        updateForm();
        return;
    }
    if (d.equipDest !== undefined) {
        itemDialog.close();
        commitEquipment(c(), equipPlan(c(), selectedSlot, +d.equipDest));
        return;
    }
    if (d.unequip !== undefined) {
        itemDialog.close();
        commitEquipment(c(), unequipPlan(c(), +d.unequip));
        return;
    }
    if (!d.itemOp)
        return;
    const p = c(), i = selectedSlot, x = bag(p)[i];
    if (!x)
        return;
    itemDialog.close();
    if (d.itemOp === 'announce') {
        announceForm(i);
        return;
    }
    if (d.itemOp === 'consume') {
        consumeItem(p, i);
        return;
    }
    if (d.itemOp === 'equip') {
        chooseEquip(i);
        return;
    }
    if (d.itemOp === 'edit') {
        openItemForm(x, i, true);
        return;
    }
    if (d.itemOp === 'move') {
        moving = { p, i };
        toast('Escolha o espaço de destino.');
        return;
    }
    if (d.itemOp === 'duplicate') {
        const copy = { ...cloneItem(x), id: itemId() };
        if (!bagPlace(p, copy))
            return toast('Mochila cheia.');
    }
    else if (d.itemOp === 'discard') {
        if (await openSiteDialog({ title: 'Tem certeza?', message: 'Descartar ' + x.name + '?', confirm: true, danger: true }) !== true)
            return;
        bag(p)[i] = null;
    }
    else {
        const amount = await openSiteDialog({ title: d.itemOp === 'add' ? 'Adicionar unidades' : 'Remover unidades', message: x.name, value: 1 });
        if (typeof amount !== 'number' || amount <= 0)
            return;
        const q = Math.floor(amount);
        if (d.itemOp === 'add')
            x.quantity = Math.min(Number.MAX_SAFE_INTEGER, x.quantity + q);
        else {
            x.quantity -= q;
            if (x.quantity <= 0)
                bag(p)[i] = null;
        }
    }
    render();
});
itemDialog.addEventListener('change', e => {
    if (e.target.id !== 'itemPhoto')
        return;
    const f = e.target.files[0];
    if (!f)
        return;
    const current = editDraft;
    const reader = new FileReader();
    reader.onload = () => {
        const im = new Image();
        im.onload = () => {
            if (editDraft !== current || !$('itemPreview'))
                return;
            const cv = document.createElement('canvas'), scale = Math.min(1, 256 / Math.max(im.width, im.height));
            cv.width = Math.max(1, Math.round(im.width * scale));
            cv.height = Math.max(1, Math.round(im.height * scale));
            cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
            editImage = cv.toDataURL('image/webp', .82);
            $('itemPreview').src = editImage;
            $('itemPreview').hidden = false;
            itemDialog.querySelectorAll('[data-art]').forEach(el => el.classList.remove('chosen'));
        };
        im.src = reader.result;
    };
    reader.readAsDataURL(f);
});
$('content').addEventListener('click', e => {
    const el = e.target.closest('[data-gear],[data-bag],[data-bag-add],[data-bag-organize]');
    if (!el || !state.characters[state.active])
        return;
    if ('gear' in el.dataset) {
        const j = +el.dataset.gear;
        if (moving) {
            const m = moving;
            moving = null;
            if (m.p === c())
                commitEquipment(c(), equipPlan(c(), m.i, j));
        }
        else
            gearMenu(j);
        return;
    }
    if ('bagAdd' in el.dataset) {
        categoryMenu();
        return;
    }
    if ('bagOrganize' in el.dataset) {
        organizeBag(c());
        render();
        return;
    }
    const i = Number(el.dataset.bag);
    if (moving) {
        const m = moving;
        moving = null;
        if (m.p === c() && moveBag(c(), m.i, i))
            render();
        else
            toast('Destino inválido.');
        return;
    }
    if (bag()[i])
        itemMenu(i);
    else if (i < Rules.capacity(c()))
        categoryMenu(i);
});
// v0.9.36 — consumo rápido pela foto: a rolagem é feita em memória, sem modal.
// Este atalho não substitui o uso tradicional nem as ações de consumíveis na Arena.
function quickConsumableEligible(p, i) {
    if (!p || !Number.isInteger(i) || pendingPotion || $('diceDialog').open)
        return false;
    if (arenaState()?.participants?.some(v => v.kind === 'player' && v.playerId === p.marketId))
        return false;
    const x = bag(p)[i];
    return !!x && x.category === 'Consumíveis' && x.quantity > 0 &&
        ['Restaurar PV', 'Restaurar PM', 'Remover condições', 'Remover condição'].includes(x.consumption?.type);
}

function quickRollConsumable(amount = {}) {
    const dice = DICE_KINDS.map(sides => ({ sides, count: Math.max(0, Math.floor(number(amount[sides]))) }));
    if (dice.reduce((total, v) => total + v.count, 0) > 40)
        return null; // mesmo limite de segurança da mesa de dados
    let total = number(amount.fixed);
    for (const { sides, count } of dice)
        for (let n = 0; n < count; n++)
            total += Math.floor(Math.random() * sides) + 1;
    return Math.max(0, Math.floor(total));
}

let quickEffectTimer = 0;
function quickPotionFeedback(color, amount, label) {
    const portrait = document.querySelector('#characterSheet .hero .portrait');
    if (!portrait)
        return;
    clearTimeout(quickEffectTimer);
    portrait.querySelectorAll('.potion-quick-flash,.potion-quick-result').forEach(el => el.remove());
    const flash = document.createElement('div');
    flash.className = 'potion-quick-flash';
    flash.style.setProperty('--potion-quick-color', color);
    const text = document.createElement('div');
    text.className = 'potion-quick-result';
    text.style.setProperty('--potion-quick-color', color);
    const value = document.createElement('strong');
    value.textContent = '+' + amount;
    const small = document.createElement('span');
    small.textContent = label;
    text.append(value, small);
    portrait.append(flash, text);
    quickEffectTimer = setTimeout(() => {
        flash.remove();
        text.remove();
    }, 1550);
}

function quickConsumeAtPortrait(p, i) {
    if (p !== c() || !quickConsumableEligible(p, i))
        return false;
    const x = bag(p)[i];
    const type = x.consumption.type;
    let gained = 0, kind = '', label = '', sound = 'heal', color = '#ff4e5f', curedNames = [];
    if (type === 'Restaurar PV' || type === 'Restaurar PM') {
        const key = type === 'Restaurar PV' ? 'hp' : 'mp';
        const max = key === 'hp' ? Rules.maxHP(p) : Rules.maxMP(p);
        const missing = Math.max(0, max - p[key]);
        if (!missing) {
            toast(`O personagem já está com ${key === 'hp' ? 'PV' : 'PM'} completos.`);
            return false;
        }
        const rolled = quickRollConsumable(x.consumption.amount || {});
        if (rolled === null) {
            toast('Esta poção excede o limite de 40 dados.');
            return false;
        }
        gained = Math.min(missing, rolled);
        if (!gained) {
            toast('O consumível não recuperou pontos.');
            return false;
        }
        p[key] += gained;
        kind = key;
        label = key === 'hp' ? 'PV' : 'PM';
        sound = key === 'hp' ? 'heal' : 'mana';
        color = key === 'hp' ? '#ff4556' : '#3a9eff';
    } else {
        const stored = p.restState?.conditions || [];
        const cured = consumableCureTargets(x, stored);
        curedNames = cured;
        if (!cured.length) {
            toast('O personagem não possui condições negativas que essa poção possa remover.');
            return false;
        }
        p.restState ??= { conditions: [], cooldowns: {} };
        p.restState.conditions = stored.filter(v => !cured.includes(conditionKindOf(v)));
        gained = cured.length;
        kind = 'cleanse';
        label = gained === 1 ? 'condição curada' : 'condições curadas';
        sound = 'cleanse';
        color = '#42db83';
    }
    x.quantity--;
    if (!x.quantity)
        bag(p)[i] = null;
    render();
    playResourceSound(sound);
    quickPotionFeedback(color, gained, label);
    toast(curedNames.length ? `${x.name}: removidas ${curedNames.join(', ')} · 1 unidade utilizada.` : `${x.name}: +${gained} ${label} · 1 unidade utilizada.`);
    return true;
}

// ==============================================================================
// ARRASTAR E SOLTAR ITENS
// ==============================================================================
let dragged = null, pendingDrag = null, suppressDragClickUntil = 0, returnTile = null;
const dragContent = $('content');
function dragPlan(p, d, el) {
    if (d.kind === 'bag' && el.dataset.gear !== undefined)
        return equipPlan(p, d.i, +el.dataset.gear);
    if (d.kind === 'gear' && el.dataset.bag !== undefined)
        return unequipPlan(p, d.i, +el.dataset.bag);
    return null;
}

function validDrop(d, el) {
    if (!el || d.p !== c() || !el.isConnected || el.hasAttribute('data-locked-kind'))
        return false;
    if (el.matches('#characterSheet .hero .portrait'))
        return d.kind === 'bag' && quickConsumableEligible(d.p, d.i);
    if (el.hasAttribute('data-market-drop'))
        return !el.disabled && d.kind === 'bag' && !!bag(d.p)[d.i] && market().listings.filter(x => x.owner === marketKey(d.p) && x.slot < 9).length < 9;
    if (d.kind === 'spell')
        return el.dataset.spellSlot !== undefined && !el.disabled && canPrepareSpell(d.p, d.i, +el.dataset.spellSlot);
    if (el.hasAttribute('data-weapon-empty')) {
        return d.kind === 'bag' && !el.disabled && bag(d.p)[d.i]?.category === 'Armas' && preparedTotal(d.p) < preparedCapacity('weapon', d.p) && !!(activeWeapon(d.p) || equipPlan(d.p, d.i, 3));
    }
    if (d.kind === 'bag' && el.dataset.bag !== undefined) {
        const j = +el.dataset.bag, cap = Rules.capacity(d.p), bs = bag(d.p);
        return j !== d.i && j >= 0 && j < cap && !!bs[d.i] && !(d.i >= cap && bs[j] && !canMerge(bs[d.i], bs[j], true));
    }
    return !!dragPlan(d.p, d, el);
}

function dragTarget(e) {
    return document.elementFromPoint(e.clientX, e.clientY)?.closest('#characterSheet .hero .portrait,#content [data-bag],#content [data-gear],#content [data-weapon-empty], #content [data-spell-slot],#content [data-market-drop]') || null;
}

function clearDragMarks() {
    dragContent.querySelectorAll('.drop-valid,.drop-target').forEach(el => el.classList.remove('drop-valid', 'drop-target'));
    document.querySelector('#characterSheet .hero .portrait')?.classList.remove('drop-valid', 'drop-target');
}

function dragTileCleanup() {
    if (returnTile) {
        returnTile.remove();
        returnTile = null;
    }
    dragContent.querySelectorAll('.drag-source').forEach(el => el.classList.remove('drag-source'));
}

function beginItemDrag(d, e) {
    dragTileCleanup();
    dragged = d;
    pendingDrag = null;
    hideInspect();
    moving = null;
    const rect = d.el.getBoundingClientRect(), tile = d.el.cloneNode(true);
    tile.removeAttribute('id');
    tile.removeAttribute('data-bag');
    tile.removeAttribute('data-gear');
    tile.removeAttribute('data-tip');
    tile.removeAttribute('aria-label');
    tile.removeAttribute('draggable');
    tile.setAttribute('aria-hidden', 'true');
    tile.tabIndex = -1;
    tile.classList.remove('gear-ghost', 'gear-incompatible', 'locked', 'drop-valid', 'drop-target', 'drop-rejected');
    tile.classList.add('item-drag-tile');
    tile.style.width = rect.width + 'px';
    tile.style.height = rect.height + 'px';
    tile.style.left = e.clientX + 'px';
    tile.style.top = e.clientY + 'px';
    d.tile = tile;
    document.body.append(tile);
    document.body.classList.add('item-dragging');
    d.el.classList.add('drag-source');
    try {
        d.el.setPointerCapture(d.pointerId);
    }
    catch {
    }
    dragContent.querySelectorAll('[data-bag],[data-gear],[data-weapon-empty],[data-spell-slot],[data-market-drop]').forEach(el => {
        if (validDrop(d, el))
            el.classList.add('drop-valid');
    });
    const portrait = document.querySelector('#characterSheet .hero .portrait');
    if (validDrop(d, portrait))
        portrait.classList.add('drop-valid');
}

function updateItemDrag(e) {
    let d = dragged || pendingDrag;
    if (!d || d.pointerId !== e.pointerId)
        return;
    if (!dragged) {
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5)
            return;
        if (!d.el.isConnected || d.p !== c()) {
            pendingDrag = null;
            return;
        }
        beginItemDrag(d, e);
    }
    e.preventDefault();
    d.tile.style.left = e.clientX + 'px';
    d.tile.style.top = e.clientY + 'px';
    dragContent.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    document.querySelector('#characterSheet .hero .portrait')?.classList.remove('drop-target');
    const el = dragTarget(e);
    if (el?.classList.contains('drop-valid'))
        el.classList.add('drop-target');
}

function endItemDrag(e, cancel = false) {
    if (pendingDrag && (!e || e.pointerId === pendingDrag.pointerId))
        pendingDrag = null;
    const d = dragged;
    if (!d || (e && e.pointerId !== d.pointerId))
        return;
    dragged = null;
    suppressDragClickUntil = performance.now() + 350;
    document.body.classList.remove('item-dragging');
    clearDragMarks();
    try {
        if (d.el.hasPointerCapture(d.pointerId))
            d.el.releasePointerCapture(d.pointerId);
    }
    catch {
    }
    const el = !cancel && e ? dragTarget(e) : null;
    const same = el === d.el;
    let ok = false;
    if (validDrop(d, el)) {
        if (el.matches('#characterSheet .hero .portrait')) {
            ok = quickConsumeAtPortrait(d.p, d.i);
        }
        else if (el.hasAttribute('data-market-drop')) {
            announceForm(d.i, Number(el.dataset.listSlot ?? -1));
            ok = true;
        }
        else if (d.kind === 'spell')
            ok = prepareSpell(d.p, d.i, +el.dataset.spellSlot);
        else if (el.hasAttribute('data-weapon-empty'))
            ok = prepareFromBag(d.p, d.i);
        else if (d.kind === 'bag' && el.dataset.bag !== undefined) {
            ok = moveBag(d.p, d.i, +el.dataset.bag);
            if (ok)
                render();
        }
        else
            ok = commitEquipment(d.p, dragPlan(d.p, d, el));
    }
    if (ok) {
        d.tile.remove();
        d.el.classList.remove('drag-source');
        return;
    }
    if (!d.el.isConnected) {
        d.tile.remove();
        return;
    }
    const rect = d.el.getBoundingClientRect();
    returnTile = d.tile;
    d.tile.classList.add('returning');
    d.tile.style.left = (rect.left + rect.width / 2) + 'px';
    d.tile.style.top = (rect.top + rect.height / 2) + 'px';
    setTimeout(() => {
        d.tile.remove();
        if (returnTile === d.tile) {
            returnTile = null;
            d.el.classList.remove('drag-source');
            if (!cancel && !same && d.el.isConnected) {
                d.el.classList.remove('drop-rejected');
                void d.el.offsetWidth;
                d.el.classList.add('drop-rejected');
                setTimeout(() => d.el.classList.remove('drop-rejected'), 320);
            }
        }
    }, 180);
}
dragContent.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !e.isPrimary || dragged || !state.characters[state.active])
        return;
    const el = e.target.closest('[data-bag],[data-gear],[data-spell-id]');
    if (!el || !el.classList.contains('occupied'))
        return;
    if (el.dataset.spellId) {
        pendingDrag = { p: c(), i: el.dataset.spellId, kind: 'spell', el, pointerId: e.pointerId, x: e.clientX, y: e.clientY };
        return;
    }
    const kind = el.dataset.bag !== undefined ? 'bag' : 'gear';
    let i = +el.dataset[kind];
    if (kind === 'gear' && i === 5 && weaponTwoHand(equipment(c())[3]))
        i = 3;
    if (!(kind === 'bag' ? bag()[i] : equipment(c())[i]))
        return;
    pendingDrag = { p: c(), i, kind, el, pointerId: e.pointerId, x: e.clientX, y: e.clientY };
});
window.addEventListener('pointermove', updateItemDrag, { passive: false });
window.addEventListener('pointerup', e => endItemDrag(e));
window.addEventListener('pointercancel', e => endItemDrag(e, true));
window.addEventListener('blur', () => endItemDrag(null, true));
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && (dragged || pendingDrag)) {
        e.preventDefault();
        endItemDrag(null, true);
    }
});
dragContent.addEventListener('click', e => {
    if (e.detail !== 0 && performance.now() < suppressDragClickUntil) {
        e.preventDefault();
        e.stopImmediatePropagation();
    }
}, true);
dragContent.addEventListener('dragstart', e => e.preventDefault());
// Inspection card mounted outside inventory stacking contexts.
// ==============================================================================
// INSPEÇÃO DE ITENS
// ==============================================================================
const inspect = document.createElement('aside');
inspect.className = 'item-inspect';
inspect.hidden = true;
document.body.append(inspect);
let inspected = null;
function hideInspect() {
    inspect.hidden = true;
    inspected = null;
}

function inspectItem(el) {
    if (dragged || document.querySelector('dialog[open]') || !state.characters[state.active])
        return;
    const p = c(), i = +(el.dataset.gear ?? el.dataset.bag), eq = el.dataset.gear !== undefined, ghost = eq && i === 5 && weaponTwoHand(equipment(p)[3]), x = el.dataset.marketList !== undefined ? market().listings.find(l => l.id === el.dataset.marketList)?.item : el.dataset.marketStock !== undefined ? market().npcs.find(n => n.id === marketNpc)?.stock[+el.dataset.marketStock] : eq ? equipment(p)[ghost ? 3 : i] : bag(p)[i];
    if (!x) {
        hideInspect();
        return;
    }
    const ammo = ghost && x.attack === 'Distância' && x.ammo?.enabled;
    const color = RAR_COLORS[RARITIES.indexOf(x.rarity)] || RAR_COLORS[0];
    const rows = [];
    if (ammo)
        rows.push('Munição: ' + x.ammo.name, `${x.ammo.current} / ${x.ammo.max}`);
    else {
        if (x.category === 'Armas') {
            rows.push(`${x.attack} · ${x.hands} mão(s)`, `Acerto: ${sign(x.hit || 0)}`, `Dano: ${diceText(x.damage)}`);
            if (x.ammo?.enabled)
                rows.push(`${x.ammo.name}: ${x.ammo.current}/${x.ammo.max}`);
            if (x.charges?.enabled)
                rows.push(`Cargas: ${x.charges.current}/${x.charges.max}`, `Dano adicional: ${diceText(x.charges.damage)}`);
        }
        if (x.category === 'Armaduras')
            rows.push(x.armorType);
        if (['Armaduras', 'Escudos'].includes(x.category))
            rows.push('CA ' + sign(x.ca || 0));
        if (x.category === 'Consumíveis')
            rows.push(`${x.consumption?.type || 'Narrativo'} · ${diceText(x.consumption?.amount)}`);
        if (stackable(x))
            rows.push('Quantidade: ' + x.quantity);
        for (const b of x.bonuses || [])
            rows.push(`${b.kind}: ${sign(b.value)}`);
        for (const eff of x.effects || [])
            rows.push(`${eff.kind} · ${eff.chance ?? 100}%`);
    }
    inspect.style.setProperty('--item-rarity', color);
    inspect.innerHTML = `<div class="inspect-art">${ammo ? `<img src="${artCatalog.Aljava}" alt="Aljava">` : imageMarkup(x)}</div><div class="inspect-details"><h3>${esc(ammo ? 'Aljava' : x.name)}</h3><small>${esc(x.rarity + ' · ' + x.category)}</small>${rows.map(t => `<p>${esc(t)}</p>`).join('')}${eq && !compatible(p, x) ? '<p class="inspect-warn">Sem proficiência: bônus adicionais positivos -2; proteção física normal.</p>' : ''}${!ammo && x.description ? `<p class="inspect-desc">${esc(x.description)}</p>` : ''}</div>`;
    inspected = el;
    inspect.hidden = false;
    const r = el.getBoundingClientRect(), w = inspect.offsetWidth, h = inspect.offsetHeight;
    let left = r.right + 10;
    if (left + w > innerWidth - 8)
        left = r.left - w - 10;
    left = clamp(left, 8, Math.max(8, innerWidth - w - 8));
    inspect.style.left = left + 'px';
    inspect.style.top = clamp(r.top + (r.height - h) / 2, 8, Math.max(8, innerHeight - h - 8)) + 'px';
}
$('content').addEventListener('pointerover', e => {
    if (e.pointerType === 'touch')
        return;
    const el = e.target.closest('.slot.occupied');
    if (el && el !== inspected)
        inspectItem(el);
});
$('content').addEventListener('pointerout', e => {
    if (inspected && !inspected.contains(e.relatedTarget))
        hideInspect();
});
$('content').addEventListener('focusin', e => {
    const el = e.target.closest('.slot.occupied');
    if (el)
        inspectItem(el);
});
$('content').addEventListener('focusout', hideInspect);
$('content').addEventListener('click', hideInspect, true);
$('content').addEventListener('dragstart', hideInspect, true);
window.addEventListener('scroll', hideInspect, true);
window.addEventListener('resize', hideInspect);
new MutationObserver(() => {
    if (inspected && !inspected.isConnected)
        hideInspect();
}).observe($('content'), { childList: true, subtree: true });
// Restore potions using the approved dice renderer; one consumption per roll.
// ==============================================================================
// CONSUMÍVEIS E ARMAS PREPARADAS
// ==============================================================================
let pendingPotion = null;
function consumeItem(p, i) {
    if (arenaState()?.participants.some(x => x.kind === 'player' && x.playerId === p.marketId))
        return toast('Use os consumíveis pela Arena durante o encontro.');
    const x = bag(p)[i];
    if (!x || x.category !== 'Consumíveis' || x.quantity < 1 || pendingPotion)
        return;
    const type = x.consumption?.type || 'Narrativo';
    if (type === 'Narrativo') {
        x.quantity--;
        if (x.quantity === 0)
            bag(p)[i] = null;
        render();
        toast(x.name + ' consumido.');
        return;
    }
    if (type === 'Remover condições' || type === 'Remover condição') {
        const list = p.restState?.conditions || [];
        const removed = consumableCureTargets(x, list);
        if (!removed.length)
            return toast('O personagem não possui condições elegíveis para essa poção.');
        p.restState ??= { conditions: [], cooldowns: {} };
        p.restState.conditions = list.filter(v => !removed.includes(conditionKindOf(v)));
        x.quantity--;
        if (!x.quantity) bag(p)[i] = null;
        render();
        playResourceSound('cleanse');
        toast(`${x.name}: ${removed.length} condição(ões) removida(s): ${removed.join(', ')}.`);
        return;
    }
    if (!['Restaurar PV', 'Restaurar PM'].includes(type)) {
        toast('Este efeito será integrado ao sistema de condições e combate.');
        return;
    }
    // Recuperações fixas não devem abrir rolagem ou herdar dados anteriores.
    const fixedAmount = Number(x.consumption?.amount?.fixed || 0);
    if (!DICE_KINDS.some(k => Number(x.consumption?.amount?.[k]) > 0)) {
        const k = type === 'Restaurar PV' ? 'hp' : 'mp';
        const gain = Math.min(Math.max(0, fixedAmount), Math.max(0, (k === 'hp' ? Rules.maxHP(p) : Rules.maxMP(p)) - p[k]));
        p[k] += gain;
        x.quantity--;
        if (!x.quantity) bag(p)[i] = null;
        render();
        playResourceSound(k === 'hp' ? 'heal' : 'mana');
        toast(`${x.name}: +${gain} ${k === 'hp' ? 'PV' : 'PM'}.`);
        return;
    }
    const d = x.consumption.amount || {}, counts = DICE_KINDS.map(k => [k, Math.max(0, Math.floor(number(d[k])))]), count = counts.reduce((a, v) => a + v[1], 0);
    if (count > 40) {
        toast('A mesa suporta até 40 dados por rolagem. Ajuste a receita.');
        return;
    }
    if ($('diceDialog').open)
        return;
    openRoll();
    $('diceTitle').textContent = x.name;
    $('dicePick').hidden = true;
    $('diceClear').hidden = true;
    $('diceRoll').hidden = true;
    pendingPotion = { p, i, id: x.id, name: x.name, type, fixed: number(d.fixed) };
    for (const [k, n] of counts)
        for (let j = 0; j < n; j++)
            appendDie(k);
    if (!count) {
        $('diceStage').textContent = 'Recuperação de valor fixo';
        finishPotion();
    }
}

function finishPotion() {
    const roll = pendingPotion;
    if (!roll)
        return;
    pendingPotion = null;
    const { p, i, id, type, fixed } = roll, x = bag(p)[i];
    if (!x || x.id !== id || x.quantity < 1)
        return;
    const k = type === 'Restaurar PV' ? 'hp' : 'mp', label = k === 'hp' ? 'PV' : 'PM', total = Math.max(0, tableDice.reduce((a, it) => a + it.n, 0) + fixed), max = k === 'hp' ? Rules.maxHP(p) : Rules.maxMP(p), gain = Math.min(total, Math.max(0, max - p[k]));
    p[k] += gain;
    x.quantity--;
    if (!x.quantity)
        bag(p)[i] = null;
    render();
    if ($('diceDialog').open) {
        const sum = $('diceSummary');
        sum.textContent = tableDice.map(it => `D${it.d}: ${it.n}`).join(' + ') + (fixed ? ` ${sign(fixed)} fixo` : '');
        const result = document.createElement('strong');
        result.className = 'roll-total';
        result.textContent = `+${gain} ${label}`;
        sum.append(result);
        const hint = document.createElement('small');
        hint.textContent = `Recuperação rolada: ${total} · ${x.quantity} restante(s)`;
        sum.append(hint);
    }
    playResourceSound(k === 'hp' ? 'heal' : 'mana');
    toast(`${roll.name}: +${gain} ${label}`);
}

// Armas preparadas: a mão principal é a arma ativa; reservas nunca concedem bônus.
function reserves(p = c()) {
    if (!Array.isArray(p.preparedWeapons))
        p.preparedWeapons = [];
    return p.preparedWeapons;
}

function activeWeapon(p = c()) {
    const w = equipment(p)[3];
    return w?.category === 'Armas' ? w : null;
}

function preparedTotal(p = c()) {
    return reserves(p).length + (activeWeapon(p) ? 1 : 0);
}

function chargeReady(w) {
    return !!(w?.charges?.enabled && number(w.charges.current) >= Math.max(1, number(w.charges.cost)) && (w.charges.activation === 'Automática' || w.chargeArmed));
}

function preparedWeaponList(p) {
    const limit = preparedCapacity('weapon', p), a = activeWeapon(p), r = reserves(p), items = [...(a ? [{ x: a, k: 'active' }] : []), ...r.map((x, i) => ({ x, k: String(i) }))];
    return `<div class="prepared-list">${Array.from({ length: Math.max(5, items.length) }, (_, i) => {
        const it = items[i], locked = i >= limit;
        if (!it)
            return `<button type="button" class="prepared-row ${locked ? 'locked' : ''}" data-weapon-empty ${locked ? `data-locked-kind="weapon" data-locked-index="${i}" aria-disabled="true"` : ''}><img src="${gearArt[3]}" alt=""><div>${locked ? 'Bloqueado' : '+ Preparar arma'}<small>${locked ? 'Indisponível' : 'Clique ou arraste da mochila'}</small></div></button>`;
        const { x, k } = it;
        return `<button type="button" class="prepared-row prepared-weapon ${k === 'active' ? 'weapon-active' : ''} ${locked ? 'weapon-overflow' : ''}" data-prepared-weapon="${k}">${imageMarkup(x)}<div><span>${esc(x.name)}</span><small>${k === 'active' ? '✦ Ativa' : locked ? 'Acima do limite' : 'Preparada'}${x.ammo?.enabled ? ' · ' + esc(x.ammo.name) + ': ' + x.ammo.current + '/' + x.ammo.max : ''}${x.charges?.enabled ? ' · Cargas: ' + x.charges.current + '/' + x.charges.max : ''}</small></div></button>`;
    }).join('')}</div><small>${items.length} / ${limit} preparados</small>${items.length > limit ? '<p class="weapon-overflow-note">Limite reduzido: devolva as reservas excedentes à mochila.</p>' : ''}`;
}

function prepareFromBag(p, i) {
    const x = bag(p)[i];
    if (x?.category !== 'Armas')
        return false;
    if (preparedTotal(p) >= preparedCapacity('weapon', p)) {
        toast('Limite de armas preparadas atingido.');
        return false;
    }
    if (!activeWeapon(p)) {
        const plan = equipPlan(p, i, 3);
        if (!plan) {
            toast('Não há espaço para a troca de equipamentos.');
            return false;
        }
        return commitEquipment(p, plan);
    }
    bag(p)[i] = null;
    reserves(p).push(x);
    render();
    return true;
}

function choosePrepared() {
    if (preparedTotal() >= preparedCapacity('weapon', c()))
        return toast('Limite de armas preparadas atingido.');
    const opts = bag().map((x, i) => x?.category === 'Armas' ? `<button type="button" data-prepare-bag="${i}">${esc(x.name)}</button>` : '').join('');
    itemDialog.innerHTML = '<h2>Preparar arma da mochila</h2>' + (opts || '<p>Nenhuma arma na mochila.</p>') + '<button type="button" data-item-close>Cancelar</button>';
    itemDialog.showModal();
}

function switchPrepared(p, i) {
    const r = reserves(p), x = r[i], a = activeWeapon(p);
    if (!x || i + (a ? 1 : 0) >= preparedCapacity('weapon', p))
        return false;
    const es = equipment(p).slice(), rs = r.slice(), trial = { ...p, bagSlots: bag(p).slice(), equipmentSlots: es, preparedWeapons: rs };
    rs.splice(i, 1);
    if (a)
        rs.splice(i, 0, a);
    es[3] = x;
    if (weaponTwoHand(x) && es[5]) {
        const old = es[5];
        es[5] = null;
        if (!bagPlace(trial, old)) {
            toast('Libere espaço na mochila para a mão auxiliar.');
            return false;
        }
    }
    p.bagSlots = trial.bagSlots;
    p.equipmentSlots = es;
    p.preparedWeapons = rs;
    render();
    return true;
}

function returnPrepared(p, i) {
    const x = reserves(p)[i];
    if (!x)
        return false;
    if (!bagPlace(p, x)) {
        toast('Mochila cheia.');
        return false;
    }
    reserves(p).splice(i, 1);
    render();
    return true;
}

function weaponResourceButtons(x, k) {
    return `${x.ammo?.enabled ? `<button type="button" data-weapon-resource="ammo" data-weapon-key="${k}">${esc(x.ammo.name)}: ${x.ammo.current}/${x.ammo.max} · Ajustar</button>` : ''}${x.charges?.enabled ? `<button type="button" data-weapon-resource="charges" data-weapon-key="${k}">Cargas: ${x.charges.current}/${x.charges.max} · Ajustar</button>${x.charges.activation === 'Manual' && k === 'active' ? `<button type="button" data-weapon-arm="${k}">${x.chargeArmed ? 'Desativar' : 'Ativar'} carga no próximo ataque</button>` : ''}` : ''}`;
}

function weaponByKey(k, p = c()) {
    return k === 'active' ? activeWeapon(p) : reserves(p)[Number(k)];
}

function preparedMenu(k) {
    const x = weaponByKey(k);
    if (!x)
        return;
    const i = Number(k), locked = k !== 'active' && i + (activeWeapon() ? 1 : 0) >= preparedCapacity('weapon', c());
    itemDialog.innerHTML = `<div class="item-heading">${imageMarkup(x)}<h2>${esc(x.name)}</h2></div><p>${esc(itemDetails(x))}</p>${k === 'active' ? '<p>Arma ativa</p>' : `<button type="button" data-activate-weapon="${k}" ${locked ? 'disabled' : ''}>Tornar ativa</button>`}${weaponResourceButtons(x, k)}${k === 'active' ? '<button type="button" data-unequip="3">Devolver à mochila</button>' : `<button type="button" data-return-weapon="${k}">Devolver à mochila</button>`}<button type="button" data-item-close>Fechar</button>`;
    itemDialog.showModal();
}
$('content').addEventListener('click', e => {
    const b = e.target.closest('[data-prepared-weapon],[data-weapon-empty]');
    if (!b || !state.characters[state.active])
        return;
    if (b.hasAttribute('data-weapon-empty'))
        choosePrepared();
    else
        preparedMenu(b.dataset.preparedWeapon);
});
itemDialog.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b)
        return;
    const d = b.dataset, p = c();
    if (d.prepareBag !== undefined) {
        itemDialog.close();
        prepareFromBag(p, +d.prepareBag);
    }
    else if (d.activateWeapon !== undefined) {
        itemDialog.close();
        switchPrepared(p, +d.activateWeapon);
    }
    else if (d.returnWeapon !== undefined) {
        itemDialog.close();
        returnPrepared(p, +d.returnWeapon);
    }
    else if (d.weaponResource) {
        const x = weaponByKey(d.weaponKey, p), r = x?.[d.weaponResource];
        if (!r)
            return;
        itemDialog.close();
        const val = await openSiteDialog({ title: d.weaponResource === 'ammo' ? r.name : 'Cargas mágicas', message: 'Quantidade atual (máximo ' + r.max + ')', value: r.current });
        if (typeof val === 'number') {
            r.current = clamp(Math.floor(val), 0, number(r.max));
            if (!r.current && d.weaponResource === 'charges')
                x.chargeArmed = false;
            render();
        }
    }
    else if (d.weaponArm !== undefined) {
        const x = weaponByKey(d.weaponArm, p);
        if (!x)
            return;
        itemDialog.close();
        if (number(x.charges.current) < Math.max(1, number(x.charges.cost)))
            return toast('Cargas insuficientes.');
        x.chargeArmed = !x.chargeArmed;
        render();
        toast(x.chargeArmed ? 'Carga preparada para o próximo ataque.' : 'Carga desativada.');
    }
});
// Habilidades: modelos imutáveis, cópias independentes por ficha e perfis de evolução.

