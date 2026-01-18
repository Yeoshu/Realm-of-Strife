// Skill and proficiency system constants

import { random, randomFloat, clamp } from '../utils';

// ============================================
// SKILL DEFINITIONS
// ============================================

export const SKILLS = {
  melee: {
    id: 'melee',
    name: 'Melee Combat',
    description: 'Close combat ability with weapons',
    primaryStats: ['combat', 'strength'],
    actionsAffected: ['hunting', 'combat', 'challenge', 'betrayal']
  },
  archery: {
    id: 'archery',
    name: 'Archery',
    description: 'Ranged attack skill with bows and crossbows',
    primaryStats: ['combat', 'speed'],
    actionsAffected: ['hunting', 'combat']
  },
  stealth: {
    id: 'stealth',
    name: 'Stealth',
    description: 'Moving unseen and unheard',
    primaryStats: ['stealth', 'cunning'],
    actionsAffected: ['ambush', 'theft', 'hiding', 'sabotage']
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    description: 'Wilderness skills and resourcefulness',
    primaryStats: ['survival', 'intelligence'],
    actionsAffected: ['foraging', 'trap_setting', 'hazards']
  },
  persuasion: {
    id: 'persuasion',
    name: 'Persuasion',
    description: 'Social influence and diplomacy',
    primaryStats: ['charisma', 'empathy'],
    actionsAffected: ['alliance', 'trading', 'mercy', 'gossip']
  },
  intimidation: {
    id: 'intimidation',
    name: 'Intimidation',
    description: 'Inspiring fear in others',
    primaryStats: ['strength', 'charisma'],
    actionsAffected: ['intimidation', 'taunting', 'challenge']
  },
  medicine: {
    id: 'medicine',
    name: 'Medicine',
    description: 'Treating wounds and ailments',
    primaryStats: ['intelligence', 'empathy'],
    actionsAffected: ['healing', 'help_ally']
  },
  tactics: {
    id: 'tactics',
    name: 'Tactics',
    description: 'Strategic thinking and combat awareness',
    primaryStats: ['intelligence', 'cunning'],
    actionsAffected: ['group_actions', 'combat_initiative']
  }
};

// ============================================
// WEAPON PROFICIENCY LEVELS
// ============================================

export const PROFICIENCY_LEVELS = [
  { name: 'Untrained', minValue: 0, maxValue: 19, hitModifier: -0.15, damageModifier: -0.25 },
  { name: 'Novice', minValue: 20, maxValue: 39, hitModifier: -0.05, damageModifier: -0.10 },
  { name: 'Competent', minValue: 40, maxValue: 59, hitModifier: 0, damageModifier: 0 },
  { name: 'Proficient', minValue: 60, maxValue: 79, hitModifier: 0.10, damageModifier: 0.15 },
  { name: 'Expert', minValue: 80, maxValue: 89, hitModifier: 0.15, damageModifier: 0.25 },
  { name: 'Master', minValue: 90, maxValue: 100, hitModifier: 0.20, damageModifier: 0.35 }
];

// ============================================
// WEAPON CATEGORIES
// ============================================

export const WEAPON_PROFICIENCY_CATEGORIES = {
  blade: {
    id: 'blade',
    name: 'Blade Weapons',
    weapons: ['sword', 'axe', 'knife']
  },
  blunt: {
    id: 'blunt',
    name: 'Blunt Weapons',
    weapons: ['warhammer', 'mace', 'flail']
  },
  polearm: {
    id: 'polearm',
    name: 'Polearm Weapons',
    weapons: ['halberd', 'spear']
  },
  ranged: {
    id: 'ranged',
    name: 'Ranged Weapons',
    weapons: ['bow', 'crossbow']
  },
  unarmed: {
    id: 'unarmed',
    name: 'Unarmed Combat',
    weapons: []
  }
};

// ============================================
// DEGREE OF SUCCESS SYSTEM
// ============================================

export const SUCCESS_LEVELS = {
  CRITICAL_SUCCESS: 'critical_success',
  SUCCESS: 'success',
  PARTIAL_SUCCESS: 'partial_success',
  FAILURE: 'failure',
  CRITICAL_FAILURE: 'critical_failure'
};

/**
 * Calculate the degree of success for a skill check
 * @param {number} skillValue - The character's skill value (0-100)
 * @param {number} difficulty - The difficulty of the check (0-100, default 50)
 * @returns {object} - Result containing successLevel and roll details
 */
export function calculateSuccessLevel(skillValue, difficulty = 50) {
  const targetNumber = skillValue - difficulty + 50;
  const roll = random(1, 100);

  const criticalThreshold = targetNumber * 0.15;
  const successThreshold = targetNumber;
  const partialThreshold = targetNumber + 15;
  const failureThreshold = targetNumber + 35;

  let successLevel;
  if (roll <= criticalThreshold) {
    successLevel = SUCCESS_LEVELS.CRITICAL_SUCCESS;
  } else if (roll <= successThreshold) {
    successLevel = SUCCESS_LEVELS.SUCCESS;
  } else if (roll <= partialThreshold) {
    successLevel = SUCCESS_LEVELS.PARTIAL_SUCCESS;
  } else if (roll <= failureThreshold) {
    successLevel = SUCCESS_LEVELS.FAILURE;
  } else {
    successLevel = SUCCESS_LEVELS.CRITICAL_FAILURE;
  }

  return {
    successLevel,
    roll,
    targetNumber,
    margin: targetNumber - roll
  };
}

/**
 * Get the proficiency level object for a given proficiency value
 */
export function getProficiencyLevel(proficiencyValue) {
  for (const level of PROFICIENCY_LEVELS) {
    if (proficiencyValue >= level.minValue && proficiencyValue <= level.maxValue) {
      return level;
    }
  }
  return PROFICIENCY_LEVELS[0]; // Default to untrained
}

/**
 * Get hit modifier based on proficiency value
 */
export function getProficiencyHitModifier(proficiencyValue) {
  const level = getProficiencyLevel(proficiencyValue);
  return level.hitModifier;
}

/**
 * Get damage modifier based on proficiency value
 */
export function getProficiencyDamageModifier(proficiencyValue) {
  const level = getProficiencyLevel(proficiencyValue);
  return 1 + level.damageModifier;
}

/**
 * Calculate a skill value from stats and bonuses
 * @param {string} skillId - The skill identifier
 * @param {object} stats - Character stats object
 * @param {object} raceBonus - Race skill bonuses
 * @param {object} archetypeBonus - Archetype skill bonuses
 * @param {object} backstoryBonus - Backstory skill bonuses
 * @returns {number} - Calculated skill value (0-100)
 */
export function calculateSkill(skillId, stats, raceBonus = {}, archetypeBonus = {}, backstoryBonus = {}) {
  const skill = SKILLS[skillId];
  if (!skill) return 30; // Default base

  // Calculate base from primary stats (average of primary stats * 0.5)
  const primaryStatSum = skill.primaryStats.reduce((sum, statName) => {
    // Map personality traits to their values if they're not in stats
    const value = stats[statName] ?? 50;
    return sum + value;
  }, 0);
  const baseFromStats = (primaryStatSum / skill.primaryStats.length) * 0.5;

  // Add some randomness
  const randomVariance = random(-10, 10);

  // Add bonuses
  const raceBonusValue = raceBonus[skillId] || 0;
  const archetypeBonusValue = archetypeBonus[skillId] || 0;
  const backstoryBonusValue = backstoryBonus[skillId] || 0;

  const totalSkill = baseFromStats + randomVariance + raceBonusValue + archetypeBonusValue + backstoryBonusValue;

  return clamp(Math.round(totalSkill), 5, 95);
}

/**
 * Calculate a proficiency value from bonuses
 * @param {string} categoryId - The weapon category identifier
 * @param {object} raceBonus - Race proficiency bonuses
 * @param {object} archetypeBonus - Archetype proficiency bonuses
 * @param {object} backstoryBonus - Backstory proficiency bonuses
 * @returns {number} - Calculated proficiency value (0-100)
 */
export function calculateProficiency(categoryId, raceBonus = {}, archetypeBonus = {}, backstoryBonus = {}) {
  // Base proficiency with some randomness
  const base = random(15, 35);

  // Add bonuses
  const raceBonusValue = raceBonus[categoryId] || 0;
  const archetypeBonusValue = archetypeBonus[categoryId] || 0;
  const backstoryBonusValue = backstoryBonus[categoryId] || 0;

  const totalProficiency = base + raceBonusValue + archetypeBonusValue + backstoryBonusValue;

  return clamp(Math.round(totalProficiency), 0, 100);
}

/**
 * Get the relevant skill for a combat action
 * @param {string} weaponCategory - The weapon category being used
 * @returns {string} - The relevant skill id
 */
export function getRelevantCombatSkill(weaponCategory) {
  return weaponCategory === 'ranged' ? 'archery' : 'melee';
}

/**
 * Get skill description based on skill level
 */
export function getSkillDescription(skillValue) {
  if (skillValue >= 90) return 'masterful';
  if (skillValue >= 75) return 'expert';
  if (skillValue >= 60) return 'skilled';
  if (skillValue >= 45) return 'competent';
  if (skillValue >= 30) return 'novice';
  return 'untrained';
}

/**
 * Apply degree of success effects to combat
 */
export function applyCombatSuccessEffects(successLevel, baseDamage) {
  switch (successLevel) {
    case SUCCESS_LEVELS.CRITICAL_SUCCESS:
      return {
        damage: Math.round(baseDamage * 1.5),
        stun: true,
        message: 'Critical hit!'
      };
    case SUCCESS_LEVELS.SUCCESS:
      return {
        damage: baseDamage,
        stun: false,
        message: null
      };
    case SUCCESS_LEVELS.PARTIAL_SUCCESS:
      return {
        damage: Math.round(baseDamage * 0.75),
        stun: false,
        message: 'Glancing blow'
      };
    case SUCCESS_LEVELS.FAILURE:
      return {
        damage: 0,
        stun: false,
        message: 'Miss'
      };
    case SUCCESS_LEVELS.CRITICAL_FAILURE:
      return {
        damage: 0,
        stun: false,
        counterattack: true,
        message: 'Critical miss!'
      };
    default:
      return { damage: baseDamage, stun: false, message: null };
  }
}

/**
 * Apply degree of success effects to foraging
 */
export function applyForagingSuccessEffects(successLevel) {
  switch (successLevel) {
    case SUCCESS_LEVELS.CRITICAL_SUCCESS:
      return {
        findRareItem: true,
        bonusSupplies: true,
        message: 'Excellent find!'
      };
    case SUCCESS_LEVELS.SUCCESS:
      return {
        findRareItem: false,
        bonusSupplies: false,
        message: null
      };
    case SUCCESS_LEVELS.PARTIAL_SUCCESS:
      return {
        findRareItem: false,
        bonusSupplies: false,
        reducedYield: true,
        message: 'Slim pickings'
      };
    case SUCCESS_LEVELS.FAILURE:
      return {
        findRareItem: false,
        bonusSupplies: false,
        nothing: true,
        message: 'Found nothing'
      };
    case SUCCESS_LEVELS.CRITICAL_FAILURE:
      return {
        findRareItem: false,
        bonusSupplies: false,
        injury: true,
        message: 'Injured while searching!'
      };
    default:
      return { findRareItem: false, bonusSupplies: false, message: null };
  }
}

/**
 * Apply degree of success effects to theft
 */
export function applyTheftSuccessEffects(successLevel) {
  switch (successLevel) {
    case SUCCESS_LEVELS.CRITICAL_SUCCESS:
      return {
        stealBest: true,
        cleanEscape: true,
        message: 'Perfect theft!'
      };
    case SUCCESS_LEVELS.SUCCESS:
      return {
        stealBest: false,
        cleanEscape: true,
        message: null
      };
    case SUCCESS_LEVELS.PARTIAL_SUCCESS:
      return {
        stealBest: false,
        cleanEscape: false,
        caughtButEscape: true,
        message: 'Spotted but escaped'
      };
    case SUCCESS_LEVELS.FAILURE:
      return {
        stealBest: false,
        cleanEscape: false,
        caught: true,
        message: 'Caught!'
      };
    case SUCCESS_LEVELS.CRITICAL_FAILURE:
      return {
        stealBest: false,
        cleanEscape: false,
        combatEnsues: true,
        message: 'Caught and attacked!'
      };
    default:
      return { stealBest: false, cleanEscape: true, message: null };
  }
}

/**
 * Apply degree of success effects to ambush
 */
export function applyAmbushSuccessEffects(successLevel) {
  switch (successLevel) {
    case SUCCESS_LEVELS.CRITICAL_SUCCESS:
      return {
        criticalStrike: true,
        surpriseRound: true,
        damageMultiplier: 1.5,
        message: 'Perfect ambush!'
      };
    case SUCCESS_LEVELS.SUCCESS:
      return {
        criticalStrike: false,
        surpriseRound: true,
        damageMultiplier: 1.25,
        message: null
      };
    case SUCCESS_LEVELS.PARTIAL_SUCCESS:
      return {
        criticalStrike: false,
        surpriseRound: false,
        damageMultiplier: 1.0,
        message: 'Spotted at last moment'
      };
    case SUCCESS_LEVELS.FAILURE:
      return {
        criticalStrike: false,
        surpriseRound: false,
        detected: true,
        damageMultiplier: 1.0,
        message: 'Detected!'
      };
    case SUCCESS_LEVELS.CRITICAL_FAILURE:
      return {
        criticalStrike: false,
        surpriseRound: false,
        targetStrikesFirst: true,
        damageMultiplier: 1.0,
        message: 'Ambush reversed!'
      };
    default:
      return { criticalStrike: false, surpriseRound: true, damageMultiplier: 1.0, message: null };
  }
}

/**
 * Apply degree of success effects to alliance attempts
 */
export function applyAllianceSuccessEffects(successLevel) {
  switch (successLevel) {
    case SUCCESS_LEVELS.CRITICAL_SUCCESS:
      return {
        relationshipBonus: 50,
        strongAlliance: true,
        message: 'Strong bond formed!'
      };
    case SUCCESS_LEVELS.SUCCESS:
      return {
        relationshipBonus: 35,
        strongAlliance: false,
        message: null
      };
    case SUCCESS_LEVELS.PARTIAL_SUCCESS:
      return {
        relationshipBonus: 20,
        tentative: true,
        message: 'Tentative agreement'
      };
    case SUCCESS_LEVELS.FAILURE:
      return {
        relationshipBonus: 0,
        rejected: true,
        message: 'Proposal rejected'
      };
    case SUCCESS_LEVELS.CRITICAL_FAILURE:
      return {
        relationshipBonus: -15,
        offended: true,
        message: 'Deeply offended!'
      };
    default:
      return { relationshipBonus: 35, strongAlliance: false, message: null };
  }
}

/**
 * Get the relevant skill for an action type
 */
export function getRelevantSkillForAction(actionType) {
  const actionSkillMap = {
    hunt: 'melee',
    hunting: 'melee',
    combat: 'melee',
    challenge: 'melee',
    betray: 'melee',
    betrayal: 'melee',
    ambush: 'stealth',
    theft: 'stealth',
    hide: 'stealth',
    hiding: 'stealth',
    sabotage: 'stealth',
    forage: 'survival',
    foraging: 'survival',
    trap: 'survival',
    trap_setting: 'survival',
    ally: 'persuasion',
    alliance: 'persuasion',
    trade: 'persuasion',
    trading: 'persuasion',
    mercy: 'persuasion',
    gossip: 'persuasion',
    intimidate: 'intimidation',
    intimidation: 'intimidation',
    taunt: 'intimidation',
    taunting: 'intimidation',
    heal: 'medicine',
    healing: 'medicine',
    help_ally: 'medicine',
    group_hunt: 'tactics',
    group_forage: 'tactics',
    group_rest: 'tactics',
    defend_ally: 'tactics'
  };

  return actionSkillMap[actionType] || null;
}
