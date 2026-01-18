// Relationship system

import { clamp, randomFloat } from '../utils';

export function getRelationship(champion, otherId) {
  return champion.relationships[otherId] || 0;
}

export function modifyRelationship(champion, otherId, delta, allChampions) {
  const current = getRelationship(champion, otherId);
  const newValue = clamp(current + delta, -100, 100);
  champion.relationships[otherId] = newValue;

  // Track grudges for vengeful champions
  if (delta < -20 && champion.personality && champion.personality.vendetta > 50) {
    if (!champion.grudges) champion.grudges = {};
    champion.grudges[otherId] = (champion.grudges[otherId] || 0) + Math.abs(delta);
  }

  // Reputation spreads - others hear about interactions
  allChampions.forEach(t => {
    if (t.id !== champion.id && t.id !== otherId && t.alive) {
      const witnessChance = t.zone === champion.zone ? 0.5 : 0.1;
      if (randomFloat() < witnessChance) {
        const spreadDelta = Math.round(delta * 0.3);
        const currentWithWitness = getRelationship(t, champion.id);
        t.relationships[champion.id] = clamp(currentWithWitness + (delta > 0 ? spreadDelta : -spreadDelta), -100, 100);
      }
    }
  });
}

export function areAllies(t1, t2) {
  return getRelationship(t1, t2.id) > 40 && getRelationship(t2, t1.id) > 40;
}

export function areEnemies(t1, t2) {
  return getRelationship(t1, t2.id) < -30 || getRelationship(t2, t1.id) < -30;
}

// Calculate how well two champions would get along
export function calculateCompatibility(t1, t2) {
  let score = 0;

  // Same realm bonus
  if (t1.realm === t2.realm) score += 20;

  // Similar sociability
  if (Math.abs(t1.personality.sociability - t2.personality.sociability) < 25) score += 10;

  // Both empathetic
  if (t1.personality.empathy > 55 && t2.personality.empathy > 55) score += 15;

  // Both loyal
  if (t1.personality.loyalty > 55 && t2.personality.loyalty > 55) score += 15;

  // Clashing pride
  if (t1.personality.pride > 65 && t2.personality.pride > 65) score -= 20;

  // One aggressive, one peaceful - tension
  if (Math.abs(t1.personality.aggression - t2.personality.aggression) > 40) score -= 10;

  // Ruthless people make others uncomfortable
  if (t1.personality.ruthlessness > 70 || t2.personality.ruthlessness > 70) score -= 15;

  // Vengeful + any negative history
  if (t1.personality.vendetta > 60 && (t1.relationships[t2.id] || 0) < 0) score -= 25;

  return score;
}
