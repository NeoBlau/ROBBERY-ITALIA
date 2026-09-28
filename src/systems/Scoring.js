// Scoring.js — звёзды, челленджи и экономика (§26, §40).
// Работает с итоговой статистикой уровня и возвращает результат для экрана
// MISSION COMPLETE и для сохранения.

export function evaluate(level, stats) {
  const data = level.data;
  const par = data.par || { time: 120, loot: 1 };

  // Собранная доля лута по ценности.
  const lootFraction = stats.totalLootValue > 0 ? stats.lootValue / stats.totalLootValue : 1;

  const condStealth = stats.detections === 0;
  const condLoot = lootFraction >= 0.7;
  const condTime = stats.time <= par.time;

  let stars = 1;
  if (condStealth || condLoot) stars = 2;
  if (condStealth && condLoot && condTime) stars = 3;

  // Челленджи (§26).
  const done = [];
  for (const ch of data.challenges || []) {
    let ok = false;
    switch (ch.type) {
      case 'noDetect': ok = stats.detections === 0; break;
      case 'allLoot': ok = lootFraction >= 0.999; break;
      case 'noDisguise': ok = !stats.usedDisguise; break;
      case 'timeUnder': ok = stats.time <= ch.param; break;
      case 'noNoise': ok = !stats.alarmRaised; break;
      case 'noHide': ok = !stats.usedHide; break;
      default: ok = false;
    }
    if (ok) done.push(ch.id);
  }

  // Экономика.
  const base = data.reward || 500;
  const starBonus = [0, 0, 250, 800][stars] || 0;
  const challengeBonus = done.length * 300;
  const money = Math.round(stats.lootValue + base * 0.5 + starBonus + challengeBonus);

  return {
    stars, lootFraction, money, challenges: done,
    lootValue: stats.lootValue, totalLootValue: stats.totalLootValue,
    time: stats.time, detections: stats.detections,
    condStealth, condLoot, condTime,
  };
}
