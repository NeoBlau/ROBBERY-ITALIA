// Collision.js — простая физика: круг против набора AABB и проверка
// линии видимости (луч против стен). Всё в плоскости XZ.
import { segIntersectsAABB } from '../core/Util.js';

// Прямоугольник-коллайдер: {minX, minZ, maxX, maxZ}.
export function aabbFromCenter(cx, cz, w, d) {
  return { minX: cx - w / 2, minZ: cz - d / 2, maxX: cx + w / 2, maxZ: cz + d / 2 };
}

// Двигает круг (x,z,r) на (dx,dz) с разрешением столкновений по осям.
// colliders — массив AABB. Возвращает новую позицию {x,z} и флаг hit.
export function moveCircle(x, z, r, dx, dz, colliders) {
  let hit = false;
  let nx = x + dx;
  // Разрешение по X
  for (const c of colliders) {
    if (nx + r > c.minX && nx - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) {
      hit = true;
      if (dx > 0) nx = c.minX - r; else if (dx < 0) nx = c.maxX + r;
    }
  }
  let nz = z + dz;
  for (const c of colliders) {
    if (nx + r > c.minX && nx - r < c.maxX && nz + r > c.minZ && nz - r < c.maxZ) {
      hit = true;
      if (dz > 0) nz = c.minZ - r; else if (dz < 0) nz = c.maxZ + r;
    }
  }
  return { x: nx, z: nz, hit };
}

// true, если отрезок из (ax,az) в (bx,bz) перекрыт хотя бы одной стеной.
export function lineBlocked(ax, az, bx, bz, blockers) {
  for (const c of blockers) {
    // Небольшое сжатие, чтобы касание угла не считалось перекрытием.
    if (segIntersectsAABB(ax, az, bx, bz, c.minX + 0.02, c.minZ + 0.02, c.maxX - 0.02, c.maxZ - 0.02)) return true;
  }
  return false;
}
