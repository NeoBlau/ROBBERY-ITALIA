// UI.js — весь DOM-интерфейс: меню, карта кампании, список уровней, HUD,
// пауза, экран результатов, магазин, персонаж и коллекция (§41).
import { GAME_TITLE, GAME_TAGLINE, REGIONS, BAGS, COSTUMES, UPGRADES, COLLECTIBLES } from '../data/gamedata.js';
import { LEVELS, levelsByRegion } from '../data/levels.js';
import { formatTime, formatMoney } from '../core/Util.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const stars = (n) => '★★★'.slice(0, n) + '☆☆☆'.slice(0, 3 - n);

export class UI {
  constructor(root, app) {
    this.root = root;
    this.app = app;               // колбэки в Game
    this.save = app.save;
    this.hudEl = null;
    this._toastT = null;
  }
  clear() { this.root.innerHTML = ''; }

  // ---------------- Главное меню ----------------
  mainMenu() {
    this.clear();
    const s = el('div', 'screen fade-in');
    const veil = el('div', 'veil'); s.appendChild(veil);
    const card = el('div', 'card');
    card.appendChild(el('h1', 'title', GAME_TITLE));
    card.appendChild(el('div', 'tricolor'));
    card.appendChild(el('p', 'tagline', GAME_TAGLINE));
    card.appendChild(el('p', 'muted', `Крадёшься. Планируешь. Рискуешь. Исчезаешь.<br><span class="badge">★ ${this.save.totalStars()}</span> &nbsp; <span class="badge">${formatMoney(this.save.data.money)}</span>`));
    const btns = el('div', 'menu-btns');
    const play = el('button', 'btn big', '▶ ИГРАТЬ'); play.onclick = () => this.map();
    const shop = el('button', 'btn sec', '🛍 Магазин'); shop.onclick = () => this.shop();
    const char = el('button', 'btn sec', '🧑‍🎤 Персонаж'); char.onclick = () => this.character();
    const coll = el('button', 'btn sec', '🗺 Коллекция'); coll.onclick = () => this.collection();
    btns.append(play, shop, char, coll);
    card.appendChild(btns);
    card.appendChild(el('p', 'hint-keys', 'ПК: WASD / стрелки — движение, Shift — бег, E — действие, Q — отвлечь, P — пауза'));
    s.appendChild(card);
    this.root.appendChild(s);
  }

  // ---------------- Карта Италии ----------------
  map() {
    this.clear();
    const s = el('div', 'screen scroll fade-in');
    s.appendChild(el('div', 'veil map'));
    s.appendChild(el('h2', null, 'Кампания — Italia'));
    s.appendChild(el('p', 'muted', `Всего звёзд: ★ ${this.save.totalStars()} · ${formatMoney(this.save.data.money)}`));

    const wrap = el('div', 'map-wrap');
    // Стилизованный силуэт Италии (SVG «сапог»), растянут под контейнер.
    wrap.innerHTML = `<svg class="italy" viewBox="0 0 100 125" preserveAspectRatio="none">
      <path d="M30 10 L48 6 L55 16 L49 26 L62 24 L70 16 L78 24 L66 38 L58 52 L56 66 L64 78 L74 96 L69 110
               L60 108 L63 120 L55 122 L51 110 L51 92 L45 82 L43 66 L50 54 L40 48 L34 34 L26 22 Z"
        fill="rgba(93,180,120,0.22)" stroke="rgba(255,255,255,0.4)" stroke-width="0.7"/>
      <circle cx="40" cy="118" r="6" fill="rgba(93,180,120,0.18)" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
      <circle cx="18" cy="88" r="6.5" fill="rgba(93,180,120,0.18)" stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>
    </svg>`;

    const totalStars = this.save.totalStars();
    for (const r of REGIONS) {
      const unlocked = totalStars >= r.requiredStars;
      const pin = el('div', 'region-pin' + (unlocked ? '' : ' locked'));
      pin.style.left = r.pos.x + '%'; pin.style.top = r.pos.y + '%';
      const rs = levelsByRegion(r.id).reduce((a, l) => a + this.save.starsFor(l.id), 0);
      pin.innerHTML = `<div class="dot" style="background:#${r.color.toString(16).padStart(6,'0')}">${unlocked ? '🏛' : '🔒'}</div>
        <div class="lbl">${r.name}</div><div class="stars">${unlocked ? '★ ' + rs : '★ ' + r.requiredStars + ' нужно'}</div>`;
      if (unlocked) pin.onclick = () => this.region(r.id);
      wrap.appendChild(pin);
    }
    s.appendChild(wrap);
    const back = el('button', 'btn sec', '← Меню'); back.onclick = () => this.mainMenu();
    s.appendChild(back);
    this.root.appendChild(s);
  }

  // ---------------- Уровни региона ----------------
  region(regionId) {
    this.clear();
    const r = REGIONS.find((x) => x.id === regionId);
    const s = el('div', 'screen scroll fade-in');
    s.appendChild(el('div', 'veil map'));
    s.appendChild(el('h2', null, r.name));
    s.appendChild(el('p', 'muted', r.blurb));

    const list = el('div', 'level-list');
    const levels = levelsByRegion(regionId);
    levels.forEach((lv, i) => {
      const prevStars = i === 0 ? 1 : this.save.starsFor(levels[i - 1].id);
      const unlocked = i === 0 || prevStars >= 1;
      const st = this.save.starsFor(lv.id);
      const tile = el('div', 'lvl' + (unlocked ? '' : ' locked'));
      tile.innerHTML = `<div class="n">${(i + 1).toString().padStart(2, '0')}</div>
        <div class="t">${lv.name}</div><div class="type">${lv.type}</div>
        <div class="st">${unlocked ? stars(st) : ''}</div>${unlocked ? '' : '<div class="lock">🔒</div>'}`;
      if (unlocked) tile.onclick = () => this.app.playLevel(lv.id);
      list.appendChild(tile);
    });
    // Слоты «скоро» для масштабирования до 100+ уровней (§49).
    for (let i = levels.length; i < 10; i++) {
      const tile = el('div', 'lvl locked');
      tile.innerHTML = `<div class="n">${(i + 1).toString().padStart(2, '0')}</div><div class="t">Presto…</div><div class="type">скоро</div><div class="lock">🔒</div>`;
      list.appendChild(tile);
    }
    s.appendChild(list);
    const back = el('button', 'btn sec', '← Карта'); back.onclick = () => this.map();
    s.appendChild(back);
    this.root.appendChild(s);
  }

  // ---------------- HUD ----------------
  showHUD() {
    this.clear();
    const hud = el('div', null); hud.id = 'hud';
    hud.innerHTML = `
      <div class="chase-vig" id="vig"></div>
      <div class="hud-top">
        <div class="chip"><span id="hud-time">0:00</span></div>
        <div class="chip obj" id="hud-obj">🎯 Найди цель</div>
        <div class="chip"><span>🎒</span><span id="hud-inv">0/5</span> · <span id="hud-val">€0</span></div>
      </div>
      <div class="alert-meter" id="alertm"><i id="alerti"></i></div>
      <div class="lockbar" id="lockbar"><i id="locki"></i></div>
      <div class="prompt" id="prompt"></div>
      <div class="toast" id="toast"></div>
      <button class="btn sec pause-btn" id="pausebtn">⏸</button>`;
    this.root.appendChild(hud);
    this.hudEl = {
      time: hud.querySelector('#hud-time'), obj: hud.querySelector('#hud-obj'),
      inv: hud.querySelector('#hud-inv'), val: hud.querySelector('#hud-val'),
      alertm: hud.querySelector('#alertm'), alerti: hud.querySelector('#alerti'),
      prompt: hud.querySelector('#prompt'), vig: hud.querySelector('#vig'),
      lockbar: hud.querySelector('#lockbar'), locki: hud.querySelector('#locki'),
      toast: hud.querySelector('#toast'),
    };
    hud.querySelector('#pausebtn').onclick = () => this.app.pause();
  }

  updateHUD(st) {
    const h = this.hudEl; if (!h || !st) return;
    h.time.textContent = formatTime(st.time);
    h.inv.textContent = `${st.inv.used}/${st.inv.cap}`;
    h.val.textContent = formatMoney(st.inv.value);
    h.obj.innerHTML = st.objectiveDone ? '<span class="done">✅ К выходу!</span>' : '🎯 Найди цель';
    // Метр тревоги.
    if (st.suspicion > 0.02) { h.alertm.classList.add('show'); h.alerti.style.width = Math.min(100, st.suspicion * 100) + '%';
      h.alerti.style.background = st.chase ? 'var(--red)' : (st.suspicion > 0.35 ? 'var(--amber)' : 'var(--green)'); }
    else h.alertm.classList.remove('show');
    // Подсказка.
    if (st.prompt) { h.prompt.classList.add('show'); h.prompt.textContent = st.prompt.text;
      h.prompt.classList.toggle('locked', st.prompt.kind === 'exit-locked' || /Нужен|Заперто/.test(st.prompt.text)); }
    else h.prompt.classList.remove('show');
    // Взлом.
    if (st.lockProgress > 0) { h.lockbar.classList.add('show'); h.locki.style.width = Math.min(100, st.lockProgress * 100) + '%'; }
    else h.lockbar.classList.remove('show');
    // Погоня-виньетка.
    h.vig.classList.toggle('on', !!st.chase);
  }

  toast(msg) {
    const h = this.hudEl; if (!h) return;
    h.toast.textContent = msg; h.toast.classList.add('show');
    clearTimeout(this._toastT); this._toastT = setTimeout(() => h.toast.classList.remove('show'), 1600);
  }

  // ---------------- Пауза ----------------
  pause() {
    const s = el('div', 'screen fade-in'); s.id = 'pause-screen';
    s.appendChild(el('div', 'veil'));
    const card = el('div', 'card');
    card.appendChild(el('h2', null, 'Пауза'));
    const btns = el('div', 'menu-btns');
    const resume = el('button', 'btn', '▶ Продолжить'); resume.onclick = () => this.app.resume();
    const restart = el('button', 'btn sec', '↺ Заново'); restart.onclick = () => this.app.restart();
    const quit = el('button', 'btn sec', '✖ В карту'); quit.onclick = () => this.app.quitToMap();
    btns.append(resume, restart, quit); card.appendChild(btns);
    s.appendChild(card); this.root.appendChild(s);
  }
  closePause() { document.getElementById('pause-screen')?.remove(); }

  // ---------------- Результаты ----------------
  result(res, level, nextId) {
    this.clear();
    const s = el('div', 'screen scroll fade-in');
    s.appendChild(el('div', 'veil'));
    const card = el('div', 'card');
    if (res.status === 'lose') {
      card.appendChild(el('h2', null, res.reason === 'caught' ? '🚔 Пойман!' : 'Провал'));
      card.appendChild(el('p', 'muted', 'Тебя схватили. Попробуй тише — следи за конусами обзора и используй укрытия.'));
    } else {
      card.appendChild(el('h2', null, '✅ MISSIONE COMPLETA'));
      const sd = el('div', 'stars-big');
      sd.innerHTML = [0, 1, 2].map((i) => `<span class="${i < res.stars ? 'star-on' : 'star-off'}">★</span>`).join('');
      card.appendChild(sd);
      const box = el('div', null);
      box.appendChild(this._stat('Основная цель', res.lootValue >= 0 ? '✅' : '—'));
      box.appendChild(this._stat('Лут собрано', Math.round(res.lootFraction * 100) + '%'));
      box.appendChild(this._stat('Время', formatTime(res.time) + (res.condTime ? ' ⏱✅' : '')));
      box.appendChild(this._stat('Обнаружений', res.detections + (res.condStealth ? ' 👻' : '')));
      box.appendChild(this._stat('Награда', formatMoney(res.money)));
      card.appendChild(box);
      // Челленджи.
      if (level.data.challenges?.length) {
        card.appendChild(el('h3', null, 'Испытания'));
        for (const ch of level.data.challenges) {
          const ok = res.challenges.includes(ch.id);
          const line = el('div', 'chal-line');
          line.innerHTML = `<span class="${ok ? 'ok' : 'no'}">${ok ? '✅' : '⬜'} ${ch.desc}</span><span class="${ok ? 'ok' : 'no'}">${ok ? '+€300' : ''}</span>`;
          card.appendChild(line);
        }
      }
    }
    const btns = el('div', 'row');
    if (res.status === 'win' && nextId) {
      const next = el('button', 'btn', '▶ Дальше'); next.onclick = () => this.app.playLevel(nextId); btns.appendChild(next);
    }
    const retry = el('button', 'btn sec', '↺ Заново'); retry.onclick = () => this.app.playLevel(level.data.id);
    const map = el('button', 'btn sec', '🗺 Карта'); map.onclick = () => this.region(level.data.region);
    btns.append(retry, map);
    card.appendChild(btns);
    s.appendChild(card); this.root.appendChild(s);
  }
  _stat(k, v) { const d = el('div', 'stat-line'); d.innerHTML = `<span class="muted">${k}</span><span>${v}</span>`; return d; }

  // ---------------- Магазин ----------------
  shop() {
    this.clear();
    const s = el('div', 'screen scroll fade-in'); s.appendChild(el('div', 'veil'));
    s.appendChild(el('h2', null, '🛍 Магазин'));
    const bal = el('p', 'muted', formatMoney(this.save.data.money)); s.appendChild(bal);
    const refresh = () => { bal.textContent = 'Баланс: ' + formatMoney(this.save.data.money); };
    refresh();

    // Сумки.
    s.appendChild(el('h3', null, 'Сумки (вместимость)'));
    const bags = el('div', 'shop-grid');
    for (const [id, b] of Object.entries(BAGS)) {
      const owned = this.save.data.ownedBags.includes(id);
      const eq = this.save.data.bag === id;
      const it = el('div', 'shop-item' + (eq ? ' equipped' : ''));
      it.innerHTML = `<h3>${b.name}</h3><p>${b.slots} слотов</p>`;
      const btn = el('button', 'btn' + (owned ? ' sec' : ''), owned ? (eq ? '✔ Надета' : 'Выбрать') : formatMoney(b.price));
      btn.onclick = () => {
        if (owned) { this.save.data.bag = id; this.save.persist(); this.shop(); }
        else if (this.save.data.money >= b.price) { this.save.addMoney(-b.price); this.save.buyBag(id); this.save.data.bag = id; this.save.persist(); this.shop(); }
        else this.toast('Недостаточно денег');
      };
      it.appendChild(btn); bags.appendChild(it);
    }
    s.appendChild(bags);

    // Улучшения.
    s.appendChild(el('h3', null, 'Улучшения'));
    const ups = el('div', 'shop-grid');
    for (const [id, u] of Object.entries(UPGRADES)) {
      const lvl = this.save.data.upgrades[id] || 0;
      const it = el('div', 'shop-item');
      const barsHtml = Array.from({ length: u.max }, (_, i) => `<span class="${i < lvl ? 'on' : ''}"></span>`).join('');
      it.innerHTML = `<h3>${u.name}</h3><p>${u.desc}</p><div class="upg-bar">${barsHtml}</div>`;
      const maxed = lvl >= u.max; const cost = maxed ? 0 : u.cost(lvl);
      const btn = el('button', 'btn', maxed ? 'MAX' : formatMoney(cost));
      btn.disabled = maxed;
      btn.onclick = () => { if (this.save.data.money >= cost) { this.save.addMoney(-cost); this.save.data.upgrades[id] = lvl + 1; this.save.persist(); this.shop(); } else this.toast('Недостаточно денег'); };
      it.appendChild(btn); ups.appendChild(it);
    }
    s.appendChild(ups);
    const back = el('button', 'btn sec', '← Меню'); back.onclick = () => this.mainMenu(); s.appendChild(back);
    this.root.appendChild(s);
  }

  // ---------------- Персонаж / костюмы ----------------
  character() {
    this.clear();
    const s = el('div', 'screen scroll fade-in'); s.appendChild(el('div', 'veil'));
    s.appendChild(el('h2', null, '🧑‍🎤 Костюмы'));
    s.appendChild(el('p', 'muted', 'Баланс: ' + formatMoney(this.save.data.money)));
    const grid = el('div', 'shop-grid');
    for (const [id, c] of Object.entries(COSTUMES)) {
      const owned = this.save.data.ownedCostumes.includes(id);
      const eq = this.save.data.costume === id;
      const it = el('div', 'shop-item' + (eq ? ' equipped' : ''));
      const swatch = `<div style="width:100%;height:40px;border-radius:8px;background:#${c.color.toString(16).padStart(6,'0')};margin-bottom:6px"></div>`;
      it.innerHTML = `${swatch}<h3>${c.name}</h3><p>${c.desc}</p>`;
      const btn = el('button', 'btn' + (owned ? ' sec' : ''), owned ? (eq ? '✔ Надет' : 'Надеть') : formatMoney(c.price));
      btn.onclick = () => {
        if (owned) { this.save.data.costume = id; this.save.persist(); this.character(); }
        else if (this.save.data.money >= c.price) { this.save.addMoney(-c.price); this.save.buyCostume(id); this.save.data.costume = id; this.save.persist(); this.character(); }
        else this.toast('Недостаточно денег');
      };
      it.appendChild(btn); grid.appendChild(it);
    }
    s.appendChild(grid);
    const back = el('button', 'btn sec', '← Меню'); back.onclick = () => this.mainMenu(); s.appendChild(back);
    this.root.appendChild(s);
  }

  // ---------------- Коллекция ----------------
  collection() {
    this.clear();
    const s = el('div', 'screen scroll fade-in'); s.appendChild(el('div', 'veil'));
    s.appendChild(el('h2', null, '🗺 Collezione — Souvenir d\'Italia'));
    const grid = el('div', 'shop-grid');
    for (const [id, c] of Object.entries(COLLECTIBLES)) {
      const has = this.save.hasCollectible(id);
      const it = el('div', 'shop-item');
      it.innerHTML = `<h3>${has ? c.name : '???'}</h3><p>${has ? '✅ Найдено' : '🔒 Спрятано на уровнях'}</p>`;
      grid.appendChild(it);
    }
    s.appendChild(grid);
    const have = Object.keys(COLLECTIBLES).filter((id) => this.save.hasCollectible(id)).length;
    s.appendChild(el('p', 'muted', `Собрано: ${have} / ${Object.keys(COLLECTIBLES).length}`));
    const back = el('button', 'btn sec', '← Меню'); back.onclick = () => this.mainMenu(); s.appendChild(back);
    this.root.appendChild(s);
  }
}
