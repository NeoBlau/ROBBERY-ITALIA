// levels.js — 5 полностью играбельных уровней (§46) + помощники кампании.
// Схема данных описана в §45. Координаты в мировых единицах (метрах),
// центр уровня в (0,0). Стены заданы центром {x,z,w,d}. Двери центрируются
// на проёме. Проёмы делаются ≥1.4 м, чтобы игрок (r≈0.32) свободно проходил.

// ------------------------------------------------------------------ ROMA 01
const casaDelVicino = {
  id: 'rom-01', name: 'Casa del Vicino', region: 'ROMA', type: 'Appartamento', mood: 'day',
  size: { w: 16, d: 14 }, start: { x: -7, z: 6 },
  walls: [
    // Перегородка север/юг (z=-1) с проёмами у x=-4 (спальня) и x=4 (кухня).
    { x: -6.4, z: -1, w: 3.2, d: 0.4 },
    { x: 0, z: -1, w: 6.4, d: 0.4 },
    { x: 6.4, z: -1, w: 3.2, d: 0.4 },
    // Стена между спальней (СЗ) и кухней (СВ) с проёмом у z=-1.6.
    { x: 0, z: -4.6, w: 0.4, d: 4.8 },
  ],
  doors: [
    { id: 'd_bed', x: -4, z: -1, w: 1.6, lock: 'open' },
    { id: 'd_kit', x: 4, z: -1, w: 1.6, lock: 'key', keyId: 'd_kit' },
    { id: 'd_mid', x: 0, z: -1.6, w: 1.2, rot: Math.PI / 2, lock: 'open' },
  ],
  props: [
    // Спальня
    { type: 'bed', x: -6, z: -4 }, { type: 'cabinet', x: -1.2, z: -6.2 },
    // Кухня
    { type: 'fridge', x: 6.6, z: -6 }, { type: 'stove', x: 2.4, z: -6 }, { type: 'counter', x: 5, z: -2.4 },
    // Гостиная
    { type: 'sofa', x: -5, z: 4.5 }, { type: 'table', x: -1, z: 3 }, { type: 'chair', x: -1, z: 4 },
    { type: 'tv', x: 0, z: 6.4 }, { type: 'plant', x: 7, z: 6 }, { type: 'rug', x: -1, z: 3 },
    { type: 'shelf', x: -7.4, z: 1 },
  ],
  mainLoot: { x: -6.2, z: -5.6, value: 1200, name: 'Orologio di Lusso', slots: 2 },
  loot: [
    { id: 'l1', kind: 'money', x: -1, z: 3, value: 180 },
    { id: 'l2', kind: 'coin', x: -6.4, z: -2.2, value: 90 },
    { id: 'l3', kind: 'phone', x: 5, z: -2.4, value: 260, big: false },
    { id: 'l4', kind: 'wine', x: 6.6, z: -3.2, value: 140 },
    { id: 'l5', kind: 'painting', x: -7.6, z: 4.5, value: 340, big: true, name: 'Quadretto' },
    { id: 'sv', kind: 'coin', x: 2.4, z: -3, value: 120, collectible: 'souvenir.coin' },
  ],
  keys: [{ id: 'k1', x: 6.5, z: 5, opens: 'd_kit' }],
  hides: [{ type: 'wardrobe', x: -2.4, z: -6.2 }],
  distractables: [{ type: 'tv', x: 0, z: 6.4 }],
  npcs: [
    { type: 'owner', dangerous: true, speed: 1.5, fov: 100, range: 6.5,
      path: [{ x: -5, z: 4, wait: 1.2 }, { x: -5, z: -4, wait: 1.5 }, { x: -1.5, z: 2 }, { x: 3, z: 4, wait: 1 }] },
  ],
  exit: { x: 6.5, z: 6, w: 1.6, d: 1.6 },
  par: { time: 80 }, reward: 600,
  challenges: [
    { id: 'ghost', type: 'noDetect', desc: 'Призрак: ни одного обнаружения' },
    { id: 'all', type: 'allLoot', desc: 'Чистая работа: собери весь лут' },
    { id: 'fast', type: 'timeUnder', param: 55, desc: 'Молния: уложись в 0:55' },
  ],
};

// ------------------------------------------------------------------ ROMA 02
const pizzeria = {
  id: 'rom-02', name: 'Pizzeria da Mario', region: 'ROMA', type: 'Ristorante', mood: 'night',
  size: { w: 18, d: 14 }, start: { x: -7.5, z: 6 },
  walls: [
    // Зал (юг) отделён от кухни/склада (север) стеной z=-1.
    { x: -6.6, z: -1, w: 4.8, d: 0.4 },
    { x: 1.2, z: -1, w: 6.0, d: 0.4 },
    { x: 7.6, z: -1, w: 2.8, d: 0.4 },
    // Склад в СВ углу.
    { x: 4.6, z: -4.6, w: 0.4, d: 4.8 },
    { x: 6.4, z: -6.8, w: 3.6, d: 0.4 },
  ],
  doors: [
    { id: 'd_kitchen', x: -3.2, z: -1, w: 1.6, lock: 'open' },
    { id: 'd_store', x: 4.6, z: -1.8, w: 1.4, rot: Math.PI / 2, lock: 'lockpick' },
    { id: 'd_back', x: 8.2, z: -1, w: 1.4, lock: 'key', keyId: 'd_back' },
  ],
  props: [
    // Зал
    { type: 'table', x: -6, z: 4 }, { type: 'chair', x: -6, z: 3.2 }, { type: 'chair', x: -6, z: 4.8 },
    { type: 'table', x: -1, z: 4 }, { type: 'chair', x: -1, z: 3.2 },
    { type: 'table', x: 4.5, z: 4.5 }, { type: 'plant', x: 8, z: 5.5 }, { type: 'plant', x: -8, z: 1 },
    { type: 'counter', x: 6.5, z: 1.5 },
    // Кухня
    { type: 'stove', x: -6, z: -5.5 }, { type: 'counter', x: -3, z: -6 }, { type: 'fridge', x: 0.5, z: -6.2 },
    { type: 'shelf', x: 1.8, z: -2 },
    // Склад
    { type: 'crate', x: 6, z: -5.5 }, { type: 'crate', x: 7.2, z: -4 }, { type: 'barrel', x: 8, z: -5.5 },
  ],
  mainLoot: { x: -6, z: -3, value: 1600, name: 'Macchina Espresso Pro', slots: 3 },
  loot: [
    { id: 'l1', kind: 'money', x: 6.5, z: 1.2, value: 320 },
    { id: 'l2', kind: 'wine', x: -3, z: -6, value: 160 },
    { id: 'l3', kind: 'wine', x: 8, z: -5.2, value: 220, big: false },
    { id: 'l4', kind: 'coin', x: -1, z: 4, value: 80 },
    { id: 'l5', kind: 'antique', x: 6.5, z: -5.5, value: 480, big: true, name: 'Anfora Antica' },
    { id: 'sv', kind: 'art', x: -8, z: 4.5, value: 150, collectible: 'souvenir.art' },
  ],
  keys: [{ id: 'k1', x: 0.5, z: -4.8, opens: 'd_back' }],
  hides: [{ type: 'closet', x: -8, z: -5.5 }, { type: 'crate', x: 3.4, z: 5.5 }],
  distractables: [{ type: 'radio', x: 6.5, z: 1.5 }],
  npcs: [
    { type: 'cook', dangerous: true, speed: 1.4, fov: 95, range: 6,
      path: [{ x: -6, z: -4.5, wait: 1.5 }, { x: -3, z: -5, wait: 1 }, { x: 0.5, z: -4.5, wait: 1.2 }] },
    { type: 'waiter', dangerous: true, speed: 1.8, fov: 90, range: 5.5, disguiseZone: 'waiter',
      path: [{ x: -6, z: 4 }, { x: -1, z: 4, wait: 0.8 }, { x: 4.5, z: 4.5 }, { x: 6.5, z: 1.5, wait: 1 }] },
  ],
  exit: { x: 8.2, z: 1, w: 1.4, d: 2.2 },
  par: { time: 100 }, reward: 850,
  challenges: [
    { id: 'ghost', type: 'noDetect', desc: 'Никем не замечен' },
    { id: 'nodis', type: 'noDisguise', desc: 'Без маскировки' },
    { id: 'fast', type: 'timeUnder', param: 75, desc: 'Быстрый ужин: до 1:15' },
  ],
};

// ------------------------------------------------------------------ ROMA 03
const laVilla = {
  id: 'rom-03', name: 'La Villa', region: 'ROMA', type: 'Villa', mood: 'evening',
  size: { w: 22, d: 18 }, start: { x: 0, z: 7.5 },
  walls: [
    // Центральный холл — вертикальный коридор x∈[-3.2,3.2] на всю высоту.
    // Левая стена холла (x=-3.2) с проёмами у z=-4 (СЗ) и z=4 (ЮЗ).
    { x: -3.2, z: -6.9, w: 0.4, d: 4.2 }, { x: -3.2, z: 0, w: 0.4, d: 6.4 }, { x: -3.2, z: 6.9, w: 0.4, d: 4.2 },
    // Правая стена холла (x=3.2) с проёмами у z=-4 (СВ) и z=4 (ЮВ).
    { x: 3.2, z: -6.9, w: 0.4, d: 4.2 }, { x: 3.2, z: 0, w: 0.4, d: 6.4 }, { x: 3.2, z: 6.9, w: 0.4, d: 4.2 },
    // Горизонтальные перегородки, делящие крылья на N/S комнаты.
    { x: -7.1, z: 0, w: 7.8, d: 0.4 }, { x: 7.1, z: 0, w: 7.8, d: 0.4 },
  ],
  doors: [
    { id: 'd_nw', x: -3.2, z: -4, w: 1.6, rot: Math.PI / 2, lock: 'open' },
    { id: 'd_sw', x: -3.2, z: 4, w: 1.6, rot: Math.PI / 2, lock: 'open' },
    { id: 'd_ne', x: 3.2, z: -4, w: 1.6, rot: Math.PI / 2, lock: 'key', keyId: 'd_ne' },
    { id: 'd_se', x: 3.2, z: 4, w: 1.6, rot: Math.PI / 2, lock: 'lockpick' },
  ],
  props: [
    // СЗ спальня (ключ + украшения)
    { type: 'bed', x: -8, z: -5.5 }, { type: 'cabinet', x: -4.4, z: -7.5 },
    // СВ кабинет (за ключом) — главная картина
    { type: 'shelf', x: 9.6, z: -6 }, { type: 'table', x: 6, z: -6 }, { type: 'chair', x: 6, z: -7 },
    // ЮЗ гостиная
    { type: 'sofa', x: -8, z: 5.5 }, { type: 'tv', x: -10.4, z: 3 }, { type: 'rug', x: -7.5, z: 5.5 }, { type: 'plant', x: -4.4, z: 7.5 },
    // ЮВ столовая (выход)
    { type: 'table', x: 6.5, z: 4.5 }, { type: 'chair', x: 5.5, z: 4.5 }, { type: 'counter', x: 10, z: 3 },
    // Холл
    { type: 'fountain', x: 0, z: 0 }, { type: 'plant', x: -1.6, z: -8 }, { type: 'plant', x: 1.6, z: 8 },
  ],
  mainLoot: { x: 9.6, z: -7, value: 3200, name: 'Dipinto del Maestro', slots: 3 },
  loot: [
    { id: 'l1', kind: 'jewelry', x: -4.4, z: -7.5, value: 620, big: false },
    { id: 'l2', kind: 'money', x: -8, z: 5.5, value: 300 },
    { id: 'l3', kind: 'watch', x: 6, z: -6, value: 540 },
    { id: 'l4', kind: 'wine', x: 10, z: 3, value: 200 },
    { id: 'l5', kind: 'statue', x: 1.6, z: 1.6, value: 260, collectible: 'souvenir.statue' },
    { id: 'l6', kind: 'camera', x: -10.4, z: 4.5, value: 380, big: true, name: 'Cinepresa d\'Epoca' },
  ],
  keys: [{ id: 'k1', x: -8, z: -7, opens: 'd_ne' }],
  hides: [{ type: 'wardrobe', x: -10.4, z: -5.5 }, { type: 'curtain', x: 10.6, z: -6 }, { type: 'closet', x: -10.6, z: 7 }],
  distractables: [{ type: 'tv', x: -10.4, z: 3 }],
  npcs: [
    { type: 'owner', dangerous: true, speed: 1.5, fov: 100, range: 6.5,
      path: [{ x: -8, z: 5, wait: 1 }, { x: -5, z: 5 }, { x: -8, z: 7, wait: 1 }] },
    { type: 'guard', dangerous: true, speed: 1.7, fov: 105, range: 8,
      path: [{ x: 1.7, z: 6, wait: 1 }, { x: 1.7, z: -6 }, { x: -1.7, z: -6, wait: 0.8 }, { x: -1.7, z: 6 }] },
  ],
  dogs: [
    { speed: 2.3, fov: 80, range: 5.5, path: [{ x: -8, z: -6 }, { x: -5, z: -3, wait: 0.6 }, { x: -9, z: -3 }] },
  ],
  exit: { x: 9.5, z: 7.5, w: 1.8, d: 1.8 },
  par: { time: 150 }, reward: 1600,
  challenges: [
    { id: 'ghost', type: 'noDetect', desc: 'Никем не замечен' },
    { id: 'nohide', type: 'noHide', desc: 'Ни разу не прятался' },
    { id: 'all', type: 'allLoot', desc: 'Обчисти виллу подчистую' },
  ],
};

// ------------------------------------------------------------------ ROMA 04
const negozioDiLusso = {
  id: 'rom-04', name: 'Negozio di Lusso', region: 'ROMA', type: 'Boutique', mood: 'day',
  size: { w: 18, d: 14 }, start: { x: -7.5, z: 6 },
  walls: [
    // Торговый зал (юг) и подсобка/склад (север).
    { x: -6.4, z: -1.5, w: 5.2, d: 0.4 },
    { x: 2.6, z: -1.5, w: 6.4, d: 0.4 },
    { x: 8, z: -1.5, w: 2, d: 0.4 },
    { x: -1, z: -4.5, w: 0.4, d: 4 }, // делит склад
  ],
  doors: [
    { id: 'd_back', x: -2.6, z: -1.5, w: 1.6, lock: 'lockpick' },
    { id: 'd_stock', x: 6, z: -1.5, w: 1.6, lock: 'key', keyId: 'd_stock' },
  ],
  props: [
    // Зал (витрины)
    { type: 'displayCase', x: -6, z: 3 }, { type: 'displayCase', x: -2, z: 3 }, { type: 'displayCase', x: 2, z: 3 },
    { type: 'displayCase', x: 6, z: 3 }, { type: 'counter', x: 0, z: 6 }, { type: 'plant', x: -8, z: 5.5 }, { type: 'plant', x: 8, z: 5.5 },
    { type: 'shelf', x: -8.4, z: 1 }, { type: 'shelf', x: 8.4, z: 1 },
    // Склад
    { type: 'crate', x: -4, z: -5.5 }, { type: 'crate', x: -6, z: -5.5 }, { type: 'shelf', x: -8, z: -4.5 },
    { type: 'crate', x: 3, z: -5.5 }, { type: 'barrel', x: 7.5, z: -5.5 },
  ],
  mainLoot: { x: 6, z: 3, value: 2600, name: 'Borsa Firmata', slots: 2 },
  loot: [
    { id: 'l1', kind: 'watch', x: -6, z: 3, value: 700 },
    { id: 'l2', kind: 'jewelry', x: -2, z: 3, value: 640 },
    { id: 'l3', kind: 'bag', x: 2, z: 3, value: 520, big: true, name: 'Borsetta' },
    { id: 'l4', kind: 'money', x: 0, z: 6, value: 400 },
    { id: 'l5', kind: 'antique', x: -8, z: -4.5, value: 460, big: true, name: 'Vaso di Design' },
    { id: 'sv', kind: 'card', x: 3, z: -5.5, value: 120, collectible: 'souvenir.card' },
  ],
  keys: [{ id: 'k1', x: -4, z: -6, opens: 'd_stock' }],
  hides: [{ type: 'closet', x: 8.4, z: -4.5 }, { type: 'crate', x: -8.4, z: 6 }],
  distractables: [{ type: 'radio', x: 0, z: 6 }],
  cameras: [
    { x: -6, z: -0.5, dir: Math.PI, sweep: 55, fov: 50, range: 7, speed: 0.7 },
    { x: 6, z: -0.5, dir: Math.PI, sweep: 55, fov: 50, range: 7, speed: 0.55 },
  ],
  camSwitches: [{ x: 8.4, z: -1.0 }],
  npcs: [
    { type: 'seller', dangerous: true, speed: 1.5, fov: 95, range: 6,
      path: [{ x: -4, z: 4.5, wait: 1 }, { x: 0, z: 5 }, { x: 4, z: 4.5, wait: 1 }] },
    { type: 'guard', dangerous: true, speed: 1.7, fov: 110, range: 8,
      path: [{ x: -7, z: 1.5, wait: 0.6 }, { x: 7, z: 1.5, wait: 0.6 }, { x: 0, z: 4 }] },
  ],
  exit: { x: 8, z: 6.2, w: 1.8, d: 1.6 },
  par: { time: 120 }, reward: 1800,
  challenges: [
    { id: 'ghost', type: 'noDetect', desc: 'Не поднимай тревогу камер' },
    { id: 'nonoise', type: 'noNoise', desc: 'Без сигнализации' },
    { id: 'fast', type: 'timeUnder', param: 90, desc: 'Шопинг за 1:30' },
  ],
};

// ------------------------------------------------------------------ ROMA 05
const piccoloMuseo = {
  id: 'rom-05', name: 'Piccolo Museo', region: 'ROMA', type: 'Museo', mood: 'night',
  size: { w: 22, d: 18 }, start: { x: 0, z: 7.5 },
  walls: [
    // Центральный зал x∈[-3.2,3.2]. Левая стена с проёмом у z=4 (d_wl).
    { x: -3.2, z: -2.9, w: 0.4, d: 12.2 }, { x: -3.2, z: 6.9, w: 0.4, d: 4.2 },
    // Правая стена с проёмом у z=4 (d_wr).
    { x: 3.2, z: -2.9, w: 0.4, d: 12.2 }, { x: 3.2, z: 6.9, w: 0.4, d: 4.2 },
    // Стена хранилища (север) с проёмом у x=0 (d_vault).
    { x: -2, z: -6, w: 2.4, d: 0.4 }, { x: 2, z: -6, w: 2.4, d: 0.4 },
  ],
  doors: [
    { id: 'd_wl', x: -3.2, z: 4, w: 1.6, rot: Math.PI / 2, lock: 'open' },
    { id: 'd_wr', x: 3.2, z: 4, w: 1.6, rot: Math.PI / 2, lock: 'lockpick' },
    { id: 'd_vault', x: 0, z: -6, w: 1.6, lock: 'key', keyId: 'd_vault' },
  ],
  props: [
    // Левое крыло
    { type: 'pedestal', x: -8, z: -5 }, { type: 'pedestal', x: -8, z: 0 }, { type: 'displayCase', x: -6, z: 6 },
    // Правое крыло
    { type: 'pedestal', x: 8, z: -5 }, { type: 'pedestal', x: 8, z: 0 }, { type: 'displayCase', x: 6, z: 6 },
    // Центральный зал (коридор x=0 держим свободным для прохода к хранилищу)
    { type: 'plant', x: -2.4, z: 6 }, { type: 'plant', x: 2.4, z: 6 },
    // Хранилище
    { type: 'displayCase', x: 0, z: -7.6 },
  ],
  mainLoot: { x: 0, z: -7.6, value: 5000, name: 'Reperto Raro', slots: 3 },
  loot: [
    { id: 'l1', kind: 'statue', x: -8, z: -5, value: 900, big: true, name: 'Statua Classica' },
    { id: 'l2', kind: 'statue', x: 8, z: -5, value: 900, big: true, name: 'Busto di Marmo' },
    { id: 'l3', kind: 'jewelry', x: -6, z: 6, value: 700 },
    { id: 'l4', kind: 'antique', x: 6, z: 6, value: 760 },
    { id: 'l5', kind: 'coin', x: 1.8, z: 3, value: 320 },
    { id: 'sv', kind: 'mask', x: 6, z: 0, value: 260, collectible: 'souvenir.mask' },
  ],
  keys: [{ id: 'k1', x: 9.5, z: 0, opens: 'd_vault' }],
  hides: [{ type: 'curtain', x: -10.6, z: -5 }, { type: 'curtain', x: 10.6, z: -5 }, { type: 'closet', x: -10.6, z: 7 }],
  distractables: [{ type: 'radio', x: -6, z: 6 }],
  cameras: [
    { x: -3.4, z: -7, dir: 0.6, sweep: 50, fov: 48, range: 8, speed: 0.6 },
    { x: 3.4, z: -7, dir: Math.PI - 0.6, sweep: 50, fov: 48, range: 8, speed: 0.5 },
    { x: 0, z: 7.6, dir: Math.PI, sweep: 70, fov: 55, range: 9, speed: 0.4 },
  ],
  camSwitches: [{ x: -10.6, z: 0 }],
  npcs: [
    { type: 'guard', dangerous: true, speed: 1.7, fov: 110, range: 8.5,
      path: [{ x: 1.7, z: 6, wait: 0.6 }, { x: 1.7, z: -4 }, { x: -1.7, z: -4, wait: 1 }, { x: -1.7, z: 6 }] },
    { type: 'guard', dangerous: true, speed: 1.7, fov: 110, range: 8.5,
      path: [{ x: -8, z: 6, wait: 0.6 }, { x: -8, z: -5 }, { x: -8, z: 6 }] },
    { type: 'guard', dangerous: true, speed: 1.6, fov: 105, range: 8,
      path: [{ x: 8, z: 5, wait: 0.6 }, { x: 8, z: -5 }, { x: 8, z: 5 }] },
  ],
  police: [
    { type: 'police', speed: 2.1, fov: 120, range: 9, path: [{ x: 0, z: 7.5 }, { x: 0, z: 3 }] },
    { type: 'police', speed: 2.1, fov: 120, range: 9, path: [{ x: 2, z: 7.5 }, { x: 2, z: 3 }] },
  ],
  exit: { x: -9, z: 7, w: 1.8, d: 1.8 },
  par: { time: 170 }, reward: 3000,
  challenges: [
    { id: 'ghost', type: 'noDetect', desc: 'Идеальное ограбление' },
    { id: 'nonoise', type: 'noNoise', desc: 'Без тревоги' },
    { id: 'fast', type: 'timeUnder', param: 130, desc: 'Взлёт: до 2:10' },
  ],
};

export const LEVELS = [casaDelVicino, pizzeria, laVilla, negozioDiLusso, piccoloMuseo];

const byId = new Map(LEVELS.map((l) => [l.id, l]));
export const getLevel = (id) => byId.get(id) || null;
export const levelsByRegion = (region) => LEVELS.filter((l) => l.region === region);

export function nextLevelId(id) {
  const l = getLevel(id); if (!l) return null;
  const list = levelsByRegion(l.region);
  const i = list.findIndex((x) => x.id === id);
  return i >= 0 && i + 1 < list.length ? list[i + 1].id : null;
}
