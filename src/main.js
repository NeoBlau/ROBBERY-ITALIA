// main.js — точка входа. Создаёт игру и обрабатывает фатальные ошибки.
import { Game } from './game/Game.js';

const canvas = document.getElementById('scene');
const uiRoot = document.getElementById('ui-root');
const touchRoot = document.getElementById('touch-root');

try {
  window.__game = new Game(canvas, uiRoot, touchRoot);
} catch (err) {
  console.error(err);
  uiRoot.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;color:#fff;font-family:sans-serif">
    <div><h2>Ошибка запуска</h2><pre style="white-space:pre-wrap;color:#ffb0a0">${(err && err.stack || err)}</pre></div></div>`;
}
