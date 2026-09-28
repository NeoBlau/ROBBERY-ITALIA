// Detection.js — система обнаружения (§12). Считает зрение каждого опасного
// NPC (дистанция + сектор обзора + линия видимости), с учётом маскировки (§20)
// и приседания/укрытия. Не делает мгновенным — накопление идёт в самом NPC.
import { lineBlocked } from '../world/Collision.js';
import { angleDiff, angleTo, dist } from '../core/Util.js';

export function computeVision(npc, player, blockers, disguise, stealthUp = 0) {
  if (player.hidden) return { canSee: false, closeness: 0 };
  if (!(npc.dangerous || npc.type === 'owner')) return { canSee: false, closeness: 0 };

  let range = npc.range;
  let rateMul = 1;
  // Маскировка: если игрок «свой» для этого NPC — заметно меньше внимания,
  // но полностью невидимым не делает (§20).
  if (disguise && npc.disguiseZone && disguise === npc.disguiseZone) {
    range *= 0.5; rateMul = 0.4;
  }
  // Улучшение скрытности снижает эффективную дистанцию.
  range *= (1 - stealthUp * 0.05);

  const d = dist(npc.x, npc.z, player.x, player.z);
  if (d > range) return { canSee: false, closeness: 0 };

  const a = angleTo(npc.x, npc.z, player.x, player.z);
  if (angleDiff(a, npc.angle) > npc.fov / 2) return { canSee: false, closeness: 0 };

  if (lineBlocked(npc.x, npc.z, player.x, player.z, blockers)) return { canSee: false, closeness: 0 };

  // «Близость»: чем ближе игрок к центру взгляда и меньше дистанция — тем
  // быстрее растёт подозрение.
  const distFactor = 1 - (d / range) * 0.6;
  const angFactor = 1 - angleDiff(a, npc.angle) / (npc.fov / 2) * 0.4;
  const closeness = Math.max(0.15, distFactor * angFactor * rateMul);
  return { canSee: true, closeness };
}
