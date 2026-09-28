// Save.js — сохранение прогресса в localStorage (§47 «сохранение»).
// Хранит деньги, звёзды по уровням, купленные костюмы/сумки/улучшения,
// собранные коллекции и открытые регионы. Всё обёрнуто в try/catch —
// приватный режим/заблокированное хранилище не должны ронять игру.
const KEY = 'manolesta.save.v1';

const DEFAULT = () => ({
  money: 0,
  bag: 'small',              // small | medium | large
  costume: 'classic',
  ownedCostumes: ['classic'],
  ownedBags: ['small'],
  upgrades: { stealth: 0, speed: 0, luck: 0, lockpick: 0, noise: 0, carry: 0 },
  levels: {},                // id -> { stars, bestTime, bestLoot, challenges:{id:true} }
  collections: {},           // collectibleId -> true
  unlockedRegions: ['ROMA'],
  seenIntro: false,
});

export class Save {
  constructor() { this.data = this.load(); }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return DEFAULT();
      const parsed = JSON.parse(raw);
      return Object.assign(DEFAULT(), parsed);
    } catch (e) { return DEFAULT(); }
  }

  persist() {
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
  }

  reset() { this.data = DEFAULT(); this.persist(); }

  addMoney(n) { this.data.money = Math.max(0, Math.round(this.data.money + n)); this.persist(); }

  levelResult(id, res) {
    const cur = this.data.levels[id] || { stars: 0, bestTime: Infinity, bestLoot: 0, challenges: {} };
    cur.stars = Math.max(cur.stars, res.stars);
    cur.bestTime = Math.min(cur.bestTime, res.time);
    cur.bestLoot = Math.max(cur.bestLoot, res.lootValue);
    for (const c of res.challenges || []) cur.challenges[c] = true;
    this.data.levels[id] = cur;
    this.persist();
  }

  starsFor(id) { return this.data.levels[id]?.stars || 0; }
  totalStars() { return Object.values(this.data.levels).reduce((a, l) => a + (l.stars || 0), 0); }

  unlockRegion(r) { if (!this.data.unlockedRegions.includes(r)) { this.data.unlockedRegions.push(r); this.persist(); } }
  isRegionUnlocked(r) { return this.data.unlockedRegions.includes(r); }

  addCollectible(id) { this.data.collections[id] = true; this.persist(); }
  hasCollectible(id) { return !!this.data.collections[id]; }

  buyCostume(id) { if (!this.data.ownedCostumes.includes(id)) this.data.ownedCostumes.push(id); this.persist(); }
  buyBag(id) { if (!this.data.ownedBags.includes(id)) this.data.ownedBags.push(id); this.persist(); }
}
