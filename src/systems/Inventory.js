// Inventory.js — простой инвентарь с ограниченной вместимостью (§9).
// Крупный лут занимает несколько слотов. Отдаёт суммарную ценность для оценки.
import { BAGS } from '../data/gamedata.js';

export class Inventory {
  constructor(save) {
    const bag = BAGS[save.data.bag] || BAGS.small;
    this.capacity = bag.slots + (save.data.upgrades.carry || 0) * 2;
    this.items = [];       // {id, kind, name, value, slots, isMain, collectible}
    this.used = 0;
  }
  get freeSlots() { return this.capacity - this.used; }
  canFit(slots) { return this.used + slots <= this.capacity; }
  add(item) {
    const slots = item.slots ?? 1;
    if (!this.canFit(slots)) return false;
    this.items.push(item); this.used += slots; return true;
  }
  hasMain() { return this.items.some((i) => i.isMain); }
  totalValue() { return this.items.reduce((a, i) => a + (i.value || 0), 0); }
  count() { return this.items.length; }
  collectibles() { return this.items.filter((i) => i.collectible).map((i) => i.collectible); }
}
