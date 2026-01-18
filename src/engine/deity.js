// Deity favor system

import { random, randomFloat, clamp } from '../utils';
import {
  DEITIES,
  FAVOR_THRESHOLDS,
  FAVOR_CHANGES,
  BLESSINGS,
  PUNISHMENTS,
  getFavorStatus,
  getDeityById
} from '../constants/deities';

/**
 * Update a champion's deity favor based on an action
 * @param {object} champion - The champion
 * @param {string} actionType - The type of action performed
 * @param {object} context - Additional context (kill, mercy, betrayal, etc.)
 * @returns {object} - Event object if notable change occurred
 */
export function updateDeityFavor(champion, actionType, context = {}) {
  if (!champion.patronDeity) return null;

  const deity = getDeityById(champion.patronDeity);
  if (!deity) return null;

  const oldFavor = champion.deityFavor;
  let favorChange = 0;

  // Determine if action is preferred, disliked, or neutral
  const isPreferred = deity.preferredActions.includes(actionType);
  const isDisliked = deity.dislikedActions.includes(actionType);

  if (isPreferred) {
    favorChange = random(FAVOR_CHANGES.preferred.min, FAVOR_CHANGES.preferred.max);
  } else if (isDisliked) {
    favorChange = random(FAVOR_CHANGES.disliked.min, FAVOR_CHANGES.disliked.max);
  } else {
    favorChange = random(FAVOR_CHANGES.neutral.min, FAVOR_CHANGES.neutral.max);
  }

  // Apply context bonuses
  if (context.kill) {
    if (isPreferred) {
      favorChange += FAVOR_CHANGES.kill;
    } else if (isDisliked) {
      favorChange -= FAVOR_CHANGES.kill;
    }
  }

  if (context.mercyGiven) {
    // Mercy deities love this, war deities hate it
    if (deity.id === 'seraphiel' || deity.id === 'valoris') {
      favorChange += FAVOR_CHANGES.mercyGiven;
    } else if (deity.id === 'kragorn' || deity.id === 'morwyn' || deity.id === 'nemara') {
      favorChange -= FAVOR_CHANGES.mercyGiven;
    }
  }

  if (context.betrayal) {
    if (deity.id === 'xaroth') {
      favorChange += FAVOR_CHANGES.betrayalCommitted;
    } else if (deity.id === 'valoris') {
      favorChange -= FAVOR_CHANGES.betrayalCommitted * 2; // Valoris really hates betrayal
    }
  }

  if (context.allyHelped) {
    if (deity.id === 'seraphiel' || deity.id === 'valoris') {
      favorChange += FAVOR_CHANGES.allyHelped;
    } else if (deity.id === 'xaroth' || deity.id === 'morwyn') {
      favorChange -= FAVOR_CHANGES.allyHelped;
    }
  }

  if (context.grudgeKill) {
    if (deity.id === 'nemara') {
      favorChange += FAVOR_CHANGES.grudgeKill;
    }
  }

  // Piety modifies magnitude (high piety = bigger swings)
  const pietyModifier = champion.personality.piety / 100;
  favorChange = Math.round(favorChange * (0.5 + pietyModifier));

  // Apply change
  const newFavor = clamp(champion.deityFavor + favorChange, -150, 150);
  champion.deityFavor = newFavor;

  // Check for threshold crossings
  const thresholdEvent = checkFavorThresholds(champion, oldFavor, newFavor, deity);

  // Generate event if significant change
  if (Math.abs(favorChange) >= 3 || thresholdEvent) {
    const event = {
      type: 'deity',
      severity: favorChange > 0 ? 'success' : 'warning'
    };

    if (favorChange > 0) {
      event.text = `${deity.name} ${getPositiveReaction()} upon ${champion.name}. (+${favorChange} favor)`;
    } else {
      event.text = `${deity.name} ${getNegativeReaction()} at ${champion.name}. (${favorChange} favor)`;
    }

    return { event, thresholdEvent };
  }

  return thresholdEvent ? { thresholdEvent } : null;
}

/**
 * Check if favor crossed a threshold and apply effects
 */
export function checkFavorThresholds(champion, oldFavor, newFavor, deity) {
  // Check positive thresholds (going up)
  if (newFavor > oldFavor) {
    // Exalted
    if (newFavor >= FAVOR_THRESHOLDS.exalted && oldFavor < FAVOR_THRESHOLDS.exalted) {
      return applyBlessing(champion, deity, 'exalted');
    }
    // Champion
    if (newFavor >= FAVOR_THRESHOLDS.champion && oldFavor < FAVOR_THRESHOLDS.champion) {
      return applyBlessing(champion, deity, 'champion');
    }
    // Favored
    if (newFavor >= FAVOR_THRESHOLDS.favored && oldFavor < FAVOR_THRESHOLDS.favored) {
      return applyBlessing(champion, deity, 'favored');
    }
    // Blessed
    if (newFavor >= FAVOR_THRESHOLDS.blessed && oldFavor < FAVOR_THRESHOLDS.blessed) {
      return applyBlessing(champion, deity, 'blessed');
    }
  }

  // Check negative thresholds (going down)
  if (newFavor < oldFavor) {
    // Abandoned
    if (newFavor <= FAVOR_THRESHOLDS.abandoned && oldFavor > FAVOR_THRESHOLDS.abandoned) {
      return handleAbandonment(champion, deity);
    }
    // Forsaken
    if (newFavor <= FAVOR_THRESHOLDS.forsaken && oldFavor > FAVOR_THRESHOLDS.forsaken) {
      return applyPunishment(champion, deity, 'forsaken');
    }
    // Cursed
    if (newFavor <= FAVOR_THRESHOLDS.cursed && oldFavor > FAVOR_THRESHOLDS.cursed) {
      return applyPunishment(champion, deity, 'cursed');
    }
    // Disfavored
    if (newFavor <= FAVOR_THRESHOLDS.disfavored && oldFavor > FAVOR_THRESHOLDS.disfavored) {
      return applyPunishment(champion, deity, 'disfavored');
    }
  }

  // Check for crossing back over thresholds (removing effects)
  // Rising out of negative
  if (newFavor > oldFavor && oldFavor < 0 && newFavor >= FAVOR_THRESHOLDS.disfavored) {
    return removePunishments(champion, deity);
  }

  // Falling from positive
  if (newFavor < oldFavor && oldFavor > 0 && newFavor < FAVOR_THRESHOLDS.blessed) {
    return removeBlessings(champion, deity);
  }

  return null;
}

/**
 * Apply a blessing when crossing positive threshold
 */
function applyBlessing(champion, deity, tier) {
  const blessingData = BLESSINGS[tier]?.[deity.id];
  if (!blessingData) return null;

  // Check if already has this blessing
  if (champion.blessings.some(b => b.id === blessingData.id)) {
    return null;
  }

  champion.blessings.push({ ...blessingData, tier, deityId: deity.id });

  return {
    type: 'blessing',
    text: `${deity.name} bestows "${blessingData.name}" upon ${champion.name}! ${blessingData.description}`,
    severity: 'blessing'
  };
}

/**
 * Apply a punishment when crossing negative threshold
 */
function applyPunishment(champion, deity, tier) {
  const punishmentData = PUNISHMENTS[tier]?.[deity.id];
  if (!punishmentData) return null;

  // Check if already has this curse
  if (champion.curses.some(c => c.id === punishmentData.id)) {
    return null;
  }

  champion.curses.push({ ...punishmentData, tier, deityId: deity.id });

  return {
    type: 'curse',
    text: `${deity.name} curses ${champion.name} with "${punishmentData.name}"! ${punishmentData.description}`,
    severity: 'danger'
  };
}

/**
 * Remove blessings when falling below blessed threshold
 */
function removeBlessings(champion, deity) {
  const removed = champion.blessings.filter(b => b.deityId === deity.id);
  champion.blessings = champion.blessings.filter(b => b.deityId !== deity.id);

  if (removed.length > 0) {
    return {
      type: 'deity',
      text: `${deity.name}'s blessings fade from ${champion.name}.`,
      severity: 'warning'
    };
  }
  return null;
}

/**
 * Remove punishments when rising above disfavored threshold
 */
function removePunishments(champion, deity) {
  const removed = champion.curses.filter(c => c.deityId === deity.id);
  champion.curses = champion.curses.filter(c => c.deityId !== deity.id);

  if (removed.length > 0) {
    return {
      type: 'deity',
      text: `${deity.name}'s curses are lifted from ${champion.name}.`,
      severity: 'success'
    };
  }
  return null;
}

/**
 * Handle deity abandonment at -100 favor
 */
function handleAbandonment(champion, deity) {
  // Remove all blessings and curses from this deity
  champion.blessings = champion.blessings.filter(b => b.deityId !== deity.id);
  champion.curses = champion.curses.filter(c => c.deityId !== deity.id);

  // Add to abandoned list (can't re-worship)
  if (!champion.abandonedBy.includes(deity.id)) {
    champion.abandonedBy.push(deity.id);
  }

  // Sanity hit
  champion.sanity = clamp(champion.sanity - 20, 0, 100);

  // Clear deity
  champion.patronDeity = null;
  champion.deityFavor = 0;

  return {
    type: 'abandonment',
    text: `${deity.name} has ABANDONED ${champion.name}! Their sanity fractures from the divine rejection.`,
    severity: 'death'
  };
}

/**
 * Get effect value for a specific blessing/curse effect type
 */
export function getDeityEffectValue(champion, effectType) {
  let value = 0;

  // Check blessings
  champion.blessings?.forEach(blessing => {
    if (blessing.effect === effectType) {
      if (typeof blessing.value === 'number') {
        value += blessing.value;
      } else {
        value = blessing.value; // For boolean or array effects
      }
    }
  });

  // Check curses (penalties)
  champion.curses?.forEach(curse => {
    if (curse.effect === effectType) {
      if (typeof curse.value === 'number') {
        value += curse.value;
      } else {
        value = curse.value;
      }
    }
  });

  return value;
}

/**
 * Check if champion has a specific effect type active
 */
export function hasDeityEffect(champion, effectType) {
  const fromBlessings = champion.blessings?.some(b => b.effect === effectType);
  const fromCurses = champion.curses?.some(c => c.effect === effectType);
  return fromBlessings || fromCurses;
}

/**
 * Apply daily divine status effects
 */
export function applyDivineStatusEffects(champion) {
  const events = [];

  if (!champion.alive) return events;

  // Health drain from curse
  const healthDrain = getDeityEffectValue(champion, 'healthDrain');
  if (healthDrain) {
    champion.health = clamp(champion.health - healthDrain, 0, 100);
    if (healthDrain > 0) {
      events.push({
        type: 'curse',
        text: `${champion.name} suffers from divine affliction. (-${healthDrain} health)`,
        severity: 'warning'
      });
    }
  }

  // Sanity drain from curse
  const sanityDrain = getDeityEffectValue(champion, 'sanityDrain');
  if (sanityDrain) {
    champion.sanity = clamp(champion.sanity - sanityDrain, 0, 100);
    if (sanityDrain > 0) {
      events.push({
        type: 'curse',
        text: `${champion.name}'s mind is plagued by divine torment. (-${sanityDrain} sanity)`,
        severity: 'warning'
      });
    }
  }

  // Energy drain from curse
  const energyDrain = getDeityEffectValue(champion, 'energyDrain');
  if (energyDrain) {
    champion.energy = clamp(champion.energy - energyDrain, 0, 100);
  }

  // Relationship decay from curse
  const relationshipDecay = getDeityEffectValue(champion, 'relationshipDecay');
  if (relationshipDecay) {
    Object.keys(champion.relationships).forEach(otherId => {
      if (champion.relationships[otherId] > -100) {
        champion.relationships[otherId] = clamp(champion.relationships[otherId] - relationshipDecay, -100, 100);
      }
    });
  }

  // Health regen from blessing
  const healthRegen = getDeityEffectValue(champion, 'healthRegen');
  if (healthRegen && champion.health < 100) {
    champion.health = clamp(champion.health + healthRegen, 0, 100);
  }

  return events;
}

/**
 * Check for divine death save
 */
export function checkDivineDeathSave(champion) {
  const deathSaveChance = getDeityEffectValue(champion, 'deathSave');
  if (deathSaveChance && randomFloat() < deathSaveChance) {
    champion.health = 1;
    const deity = getDeityById(champion.patronDeity);
    return {
      type: 'miracle',
      text: `${deity?.name || 'The gods'} intervene! ${champion.name} miraculously survives!`,
      severity: 'blessing'
    };
  }
  return null;
}

// Helper functions for flavor text
function getPositiveReaction() {
  const reactions = ['smiles', 'nods approvingly', 'grants favor', 'bestows grace', 'shows pleasure'];
  return reactions[Math.floor(Math.random() * reactions.length)];
}

function getNegativeReaction() {
  const reactions = ['frowns', 'shows displeasure', 'grows angry', 'turns away', 'shows disappointment'];
  return reactions[Math.floor(Math.random() * reactions.length)];
}
