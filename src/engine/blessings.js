// Blessing and curse effect application for combat and other systems

import { getDeityEffectValue, hasDeityEffect } from './deity';

/**
 * Get combat modifier from blessings/curses
 * @param {object} champion - The champion
 * @returns {number} - Combat bonus/penalty
 */
export function getCombatBlessingModifier(champion) {
  let modifier = 0;

  // Combat bonuses
  modifier += getDeityEffectValue(champion, 'combatBonus');
  modifier += getDeityEffectValue(champion, 'combatPenalty');

  return modifier;
}

/**
 * Get damage modifier from blessings/curses
 * @param {object} champion - The attacker
 * @param {object} target - The defender (optional, for grudge checks)
 * @returns {number} - Damage multiplier (1.0 = normal)
 */
export function getDamageBlessingModifier(champion, target = null) {
  let modifier = 1.0;

  // Damage bonus
  const damageBonus = getDeityEffectValue(champion, 'damageBonus');
  if (damageBonus) {
    modifier += damageBonus;
  }

  // Grudge damage bonus
  if (target && champion.grudges?.[target.id]) {
    const grudgeDamage = getDeityEffectValue(champion, 'grudgeDamage');
    if (grudgeDamage) {
      modifier += grudgeDamage;
    }

    // Vengeance power (double damage to grudge targets)
    if (hasDeityEffect(champion, 'vengeancePower')) {
      modifier *= 2;
    }
  }

  // Betrayal power bonus
  // This would be applied when betraying an ally (checked in betrayal action handler)

  return modifier;
}

/**
 * Get damage reduction from blessings
 * @param {object} champion - The defender
 * @returns {number} - Damage reduction multiplier (1.0 = no reduction)
 */
export function getDamageReductionModifier(champion) {
  const reduction = getDeityEffectValue(champion, 'damageReduction');
  return 1.0 - (reduction || 0);
}

/**
 * Get critical hit chance modifier
 * @param {object} champion - The attacker
 * @returns {number} - Additional crit chance (0-1)
 */
export function getCritChanceModifier(champion) {
  return getDeityEffectValue(champion, 'critChance') || 0;
}

/**
 * Check if champion can execute low health targets
 * @param {object} champion - The attacker
 * @param {object} target - The defender
 * @returns {boolean} - True if target should be executed
 */
export function canExecute(champion, target) {
  const threshold = getDeityEffectValue(champion, 'executeThreshold');
  if (threshold && target.health <= target.health * threshold) {
    return true;
  }
  return false;
}

/**
 * Get healing modifier from blessings/curses
 * @param {object} champion - The champion receiving healing
 * @returns {number} - Healing multiplier (1.0 = normal)
 */
export function getHealingModifier(champion) {
  let modifier = 1.0;

  // Check for no healing curse
  if (hasDeityEffect(champion, 'noHealing')) {
    return 0;
  }

  // Healing bonus
  const healBonus = getDeityEffectValue(champion, 'healBonus');
  if (healBonus) {
    modifier += healBonus;
  }

  // Healing penalty
  const healPenalty = getDeityEffectValue(champion, 'healingPenalty');
  if (healPenalty) {
    modifier += healPenalty; // Already negative
  }

  return Math.max(0, modifier);
}

/**
 * Get forage success modifier
 * @param {object} champion - The champion
 * @returns {number} - Forage multiplier (1.0 = normal)
 */
export function getForageModifier(champion) {
  let modifier = 1.0;

  const bonus = getDeityEffectValue(champion, 'forageBonus');
  if (bonus) modifier += bonus;

  const penalty = getDeityEffectValue(champion, 'foragePenalty');
  if (penalty) modifier += penalty;

  return Math.max(0, modifier);
}

/**
 * Get escape/flee chance modifier
 * @param {object} champion - The champion
 * @returns {number} - Additional escape chance (0-1)
 */
export function getEscapeModifier(champion) {
  return getDeityEffectValue(champion, 'escapeBonus') || 0;
}

/**
 * Get ambush success modifier
 * @param {object} champion - The ambusher
 * @returns {number} - Ambush success modifier
 */
export function getAmbushModifier(champion) {
  let modifier = 0;

  const penalty = getDeityEffectValue(champion, 'ambushPenalty');
  if (penalty) modifier += penalty;

  return modifier;
}

/**
 * Check if champion is immune to ambush
 * @param {object} champion - The potential target
 * @returns {boolean} - True if immune
 */
export function isAmbushImmune(champion) {
  return hasDeityEffect(champion, 'ambushImmunity');
}

/**
 * Get alliance/diplomacy modifier
 * @param {object} champion - The champion attempting alliance
 * @returns {number} - Alliance success modifier
 */
export function getAllianceModifier(champion) {
  let modifier = 0;

  const bonus = getDeityEffectValue(champion, 'allyBonus');
  if (bonus) modifier += bonus;

  const penalty = getDeityEffectValue(champion, 'allyPenalty');
  if (penalty) modifier += penalty;

  return modifier;
}

/**
 * Check if champion is forbidden from forming alliances
 * @param {object} champion - The champion
 * @returns {boolean} - True if forbidden
 */
export function isAllianceForbidden(champion) {
  return hasDeityEffect(champion, 'allianceForbidden');
}

/**
 * Get mercy acceptance modifier
 * @param {object} champion - The champion offering mercy
 * @returns {number} - Mercy acceptance modifier (0-1 bonus)
 */
export function getMercyModifier(champion) {
  let modifier = 0;

  const bonus = getDeityEffectValue(champion, 'mercySuccess');
  if (bonus) modifier += bonus;

  const penalty = getDeityEffectValue(champion, 'mercyPenalty');
  if (penalty) modifier += penalty;

  return modifier;
}

/**
 * Get trap effectiveness modifier
 * @param {object} champion - The champion setting trap
 * @returns {number} - Trap bonus (0-1)
 */
export function getTrapModifier(champion) {
  return getDeityEffectValue(champion, 'trapBonus') || 0;
}

/**
 * Get tracking bonus for grudge targets
 * @param {object} champion - The tracker
 * @param {object} target - The target
 * @returns {number} - Tracking bonus (0-1)
 */
export function getTrackingModifier(champion, target = null) {
  let modifier = 0;

  // Tracking bonus vs grudge targets
  if (target && champion.grudges?.[target.id]) {
    modifier += getDeityEffectValue(champion, 'trackingBonus') || 0;
  }

  // Grudge tracking (always know grudge target location)
  if (hasDeityEffect(champion, 'grudgeTracking')) {
    modifier = 1.0; // Guaranteed success
  }

  return modifier;
}

/**
 * Check if champion is immune to zone hazards
 * @param {object} champion - The champion
 * @param {string} zoneId - The zone to check
 * @returns {boolean} - True if immune
 */
export function isZoneHazardImmune(champion, zoneId) {
  const immuneZones = getDeityEffectValue(champion, 'zoneImmunity');
  if (Array.isArray(immuneZones) && immuneZones.includes(zoneId)) {
    return true;
  }
  return false;
}

/**
 * Check if champion takes extra zone damage
 * @param {object} champion - The champion
 * @param {string} zoneId - The zone to check
 * @returns {number} - Damage multiplier (1.0 = normal, 2.0 = double)
 */
export function getZoneDamageMultiplier(champion, zoneId) {
  const vulnerableZones = getDeityEffectValue(champion, 'zoneVulnerability');
  if (Array.isArray(vulnerableZones) && vulnerableZones.includes(zoneId)) {
    return 2.0;
  }
  return 1.0;
}

/**
 * Get injury healing modifier
 * @param {object} champion - The champion
 * @returns {number} - Days to add/subtract from injury duration
 */
export function getInjuryHealingModifier(champion) {
  let modifier = 0;

  // Faster healing from blessing
  const bonus = getDeityEffectValue(champion, 'injuryHealBonus');
  if (bonus) modifier -= bonus;

  // Slower healing from curse
  const penalty = getDeityEffectValue(champion, 'injuryPenalty');
  if (penalty) modifier += penalty;

  return modifier;
}

/**
 * Get cunning stat modifier
 * @param {object} champion - The champion
 * @returns {number} - Cunning bonus/penalty
 */
export function getCunningModifier(champion) {
  let modifier = 0;

  modifier += getDeityEffectValue(champion, 'cunningBonus') || 0;
  modifier += getDeityEffectValue(champion, 'cunningPenalty') || 0;

  return modifier;
}

/**
 * Get stealth modifier
 * @param {object} champion - The champion
 * @returns {number} - Stealth bonus
 */
export function getStealthModifier(champion) {
  return getDeityEffectValue(champion, 'stealthBonus') || 0;
}

/**
 * Get sanity protection modifier
 * @param {object} champion - The champion
 * @returns {number} - Sanity loss reduction (0-1)
 */
export function getSanityProtection(champion) {
  return getDeityEffectValue(champion, 'sanityProtection') || 0;
}

/**
 * Get luck modifier for random chances
 * @param {object} champion - The champion
 * @returns {number} - Luck modifier (-0.1 to 0.1)
 */
export function getLuckModifier(champion) {
  return getDeityEffectValue(champion, 'luckPenalty') || 0;
}

/**
 * Get scheme success modifier
 * @param {object} champion - The champion
 * @returns {number} - Scheme bonus (0-1)
 */
export function getSchemeModifier(champion) {
  return getDeityEffectValue(champion, 'schemeSuccess') || 0;
}

/**
 * Check if allies cannot betray this champion
 * @param {object} champion - The champion
 * @returns {boolean} - True if protected from betrayal
 */
export function isProtectedFromBetrayal(champion) {
  return hasDeityEffect(champion, 'inspiringPresence');
}

/**
 * Get nearby ally stat bonus
 * @param {object} champion - The champion with inspiring presence
 * @returns {number} - Stat bonus for nearby allies
 */
export function getInspiringPresenceBonus(champion) {
  if (hasDeityEffect(champion, 'inspiringPresence')) {
    return 15;
  }
  return 0;
}

/**
 * Get death aura damage
 * @param {object} champion - The champion with death aura
 * @returns {number} - Damage dealt to nearby enemies per day
 */
export function getDeathAuraDamage(champion) {
  return getDeityEffectValue(champion, 'deathAura') || 0;
}

/**
 * Get enemy sanity drain from maddening presence
 * @param {object} champion - The champion with maddening presence
 * @returns {number} - Sanity drained from nearby enemies
 */
export function getMaddeningPresenceDrain(champion) {
  return getDeityEffectValue(champion, 'enemySanityDrain') || 0;
}

/**
 * Check if champion has survival mastery (no hunger/thirst in nature zones)
 * @param {object} champion - The champion
 * @returns {boolean} - True if has mastery
 */
export function hasSurvivalMastery(champion) {
  return hasDeityEffect(champion, 'survivalMastery');
}

/**
 * Get max sanity modifier from curses
 * @param {object} champion - The champion
 * @returns {number} - Max sanity reduction
 */
export function getMaxSanityModifier(champion) {
  return getDeityEffectValue(champion, 'sanityMax') || 0;
}

/**
 * Check if random misfortune should occur
 * @param {object} champion - The champion with cosmic joke curse
 * @returns {number} - Chance of misfortune (0-1)
 */
export function getMisfortuneChance(champion) {
  return getDeityEffectValue(champion, 'randomMisfortune') || 0;
}

/**
 * Check if chaos mastery is active (random good events)
 * @param {object} champion - The champion
 * @returns {boolean} - True if has chaos mastery
 */
export function hasChaosMastery(champion) {
  return hasDeityEffect(champion, 'chaosMastery');
}
