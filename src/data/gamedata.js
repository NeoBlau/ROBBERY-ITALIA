// gamedata.js — статические справочники: предметы, костюмы, сумки, улучшения,
// регионы кампании. Уровни лежат в отдельном файле levels.js.

export const BAGS = {
  small:  { name: 'Piccola Borsa', slots: 5,  price: 0 },
  medium: { name: 'Borsa Media',   slots: 10, price: 2500 },
  large:  { name: 'Grande Borsa',  slots: 20, price: 9000 },
};

// Костюмы (§20, §35). Некоторые дают небольшой бонус к скрытности в
// определённых зонах (disguise = тип, к которому «свой»).
export const COSTUMES = {
  classic:  { name: 'Ladro Classico', price: 0,    color: 0x2b3a67, hat: 0x14141a, disguise: null,       desc: 'Полосатая классика. Ни к кому не «свой», зато стиль.' },
  waiter:   { name: 'Cameriere',      price: 1200, color: 0x1c1c22, hat: null,     disguise: 'waiter',   desc: 'Официант. Меньше подозрений в ресторанах и барах.' },
  courier:  { name: 'Corriere',       price: 1500, color: 0xe0a02a, hat: 0xe0a02a, disguise: 'courier',  desc: 'Курьер. Свободно ходит у входов и складов.' },
  cleaner:  { name: 'Pulizie',        price: 1800, color: 0x2f7d6a, hat: null,     disguise: 'cleaner',  desc: 'Уборщик. Незаметен в коридорах и подсобках.' },
  tourist:  { name: 'Turista',        price: 1000, color: 0xff7043, hat: 0xf4c94a, disguise: 'tourist',  desc: 'Турист. Меньше внимания в публичных местах.' },
  gondolier:{ name: 'Gondoliere',     price: 2200, color: 0x1f5f8e, hat: 0xf0e6c0, disguise: 'gondolier',desc: 'Гондольер. Свой у каналов Венеции.' },
  curator:  { name: 'Curatore',       price: 2600, color: 0x3a2f4a, hat: null,     disguise: 'curator',  desc: 'Музейный работник. Меньше подозрений среди экспонатов.' },
};

// Улучшения (§34). Каждый уровень немного меняет параметр.
export const UPGRADES = {
  stealth:  { name: 'Скрытность', max: 5, cost: (l) => 600 + l * 500,  desc: 'Медленнее растёт подозрение врагов.' },
  speed:    { name: 'Скорость',   max: 5, cost: (l) => 700 + l * 550,  desc: 'Быстрее ходьба и бег.' },
  luck:     { name: 'Удача',      max: 5, cost: (l) => 500 + l * 450,  desc: 'Больше ценность лута и шанс редкостей.' },
  lockpick: { name: 'Взлом',      max: 5, cost: (l) => 650 + l * 500,  desc: 'Быстрее взлом замков.' },
  noise:    { name: 'Тихий шаг',  max: 5, cost: (l) => 550 + l * 480,  desc: 'Меньше шума от движения.' },
  carry:    { name: 'Карманы',    max: 3, cost: (l) => 1500 + l * 1200,desc: '+2 слота инвентаря за уровень.' },
};

// Регионы кампании (§2, §3, §30). order — порядок открытия.
// requiredStars — сколько всего звёзд нужно, чтобы открыть регион.
export const REGIONS = [
  { id: 'ROMA',    name: 'Roma',              order: 0, requiredStars: 0,  color: 0x9c3b2e, pos: { x: 52, y: 54 }, blurb: 'Вечный город: квартиры, виллы, музеи.' },
  { id: 'FIRENZE', name: 'Firenze',           order: 1, requiredStars: 8,  color: 0x8a5a34, pos: { x: 46, y: 44 }, blurb: 'Галереи, антиквариат, ренессанс.' },
  { id: 'MILANO',  name: 'Milano',            order: 2, requiredStars: 16, color: 0x5b6472, pos: { x: 39, y: 21 }, blurb: 'Мода, пентхаусы, дизайнерские бутики.' },
  { id: 'VENEZIA', name: 'Venezia',           order: 3, requiredStars: 24, color: 0x2e6f8e, pos: { x: 60, y: 24 }, blurb: 'Каналы, маски, палаццо и яхты.' },
  { id: 'NAPOLI',  name: 'Napoli',            order: 4, requiredStars: 32, color: 0xc23b2b, pos: { x: 60, y: 69 }, blurb: 'Порт, склады, старые кварталы.' },
  { id: 'AMALFI',  name: 'Costa Amalfitana',  order: 5, requiredStars: 40, color: 0x2b8fb0, pos: { x: 64, y: 76 }, blurb: 'Роскошные виллы и яхты у моря.' },
];

// Коллекция сувениров (§36).
export const COLLECTIBLES = {
  'souvenir.mask':     { name: 'Maschera Veneziana', set: 'Souvenir d\'Italia' },
  'souvenir.statue':   { name: 'Statuetta di David', set: 'Souvenir d\'Italia' },
  'souvenir.coin':     { name: 'Moneta Antica',      set: 'Souvenir d\'Italia' },
  'souvenir.card':     { name: 'Cartolina di Roma',  set: 'Souvenir d\'Italia' },
  'souvenir.art':      { name: 'Mini Affresco',      set: 'Souvenir d\'Italia' },
};

export const CONFIG = {
  baseSpeedWalk: 3.0,      // м/с
  baseSpeedRun: 5.4,
  playerRadius: 0.32,
  npcRadius: 0.34,
  // Шум (§13): радиус слышимости для действий.
  noise: { walk: 1.4, run: 5.5, door: 4.5, glass: 9, drop: 8, distraction: 8, alarm: 22 },
  // Обнаружение (§12): скорость набора «подозрения» в секунду при виде игрока.
  detect: { suspectRate: 1.15, loseRate: 0.55, alertThreshold: 1.0, catchDist: 0.75 },
};

export const GAME_TITLE = 'MANO LESTA';
export const GAME_TAGLINE = 'Un ladro. Cento colpi.';
