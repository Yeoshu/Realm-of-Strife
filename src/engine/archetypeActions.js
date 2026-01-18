// Archetype-specific actions - unique abilities for each archetype

import { random, randomFloat, pick, clamp, generateId } from '../utils';
import { BATTLEFIELD_ZONES, hasRacePassive, getRacePassiveValue } from '../constants';
import { calculateSuccessLevel, SUCCESS_LEVELS } from '../constants/skills';
import { getRelationship, modifyRelationship, areAllies, areEnemies } from './relationships';
import { resolveCombat, getCombatPower } from './combat';

// ============================================
// KNIGHT - "Rally" - Inspire nearby allies
// ============================================
export function handleKnightRally(champion, nearbyAllies, allChampions) {
  const events = [];

  if (nearbyAllies.length === 0) {
    events.push({
      type: 'action',
      text: `${champion.name} raises their weapon high, but there's no one to rally.`
    });
    champion.energy -= 5;
    return events;
  }

  const tacticsSkill = champion.skills?.tactics || 40;
  const successResult = calculateSuccessLevel(tacticsSkill, 45);

  champion.energy -= 15;

  const rallyLines = [
    `"For honor and glory!"`,
    `"Stand with me, and we shall prevail!"`,
    `"Remember your training!"`,
    `"Together, we are unbreakable!"`
  ];

  events.push({
    type: 'rally',
    text: `${champion.name} rallies nearby allies: ${pick(rallyLines)}`,
    severity: 'success'
  });

  let energyBoost = 10;
  let sanityBoost = 5;
  let relationshipBonus = 8;

  if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
    energyBoost = 20;
    sanityBoost = 15;
    relationshipBonus = 15;
    events.push({
      type: 'inspiration',
      text: `The rallying cry echoes across the battlefield! All allies are deeply inspired!`,
      severity: 'success'
    });
    champion.popularity += 5;
  } else if (successResult.successLevel === SUCCESS_LEVELS.SUCCESS) {
    events.push({
      type: 'inspiration',
      text: `The allies steel themselves, ready for battle.`
    });
  } else if (successResult.successLevel === SUCCESS_LEVELS.PARTIAL_SUCCESS) {
    energyBoost = 5;
    sanityBoost = 3;
    relationshipBonus = 5;
  } else {
    energyBoost = 3;
    sanityBoost = 0;
    relationshipBonus = 2;
    events.push({
      type: 'action',
      text: `The rallying cry falls somewhat flat, but allies acknowledge the effort.`
    });
  }

  nearbyAllies.forEach(ally => {
    ally.energy = clamp(ally.energy + energyBoost, 0, 100);
    ally.sanity = clamp(ally.sanity + sanityBoost, 0, 100);
    modifyRelationship(ally, champion.id, relationshipBonus, allChampions);
  });

  return events;
}

// ============================================
// BERSERKER - "Blood Rage" - Enter a fury state
// ============================================
export function handleBerserkerRage(champion, target, allChampions) {
  const events = [];

  // Mark champion as enraged for this combat
  champion.enraged = true;
  champion.energy -= 10;

  const rageLines = [
    `${champion.name}'s eyes turn bloodshot as they enter a berserker rage!`,
    `${champion.name} lets out a primal scream, consumed by battle fury!`,
    `A terrible madness overtakes ${champion.name}! They charge forward in a blood rage!`,
    `${champion.name} foams at the mouth, gripped by berserker fury!`
  ];

  events.push({
    type: 'rage',
    text: pick(rageLines),
    severity: 'danger'
  });

  // Rage bonuses: +30% damage, -20% defense, can't flee
  const originalCombat = champion.stats.combat;
  const originalStrength = champion.stats.strength;
  champion.stats.combat = Math.round(champion.stats.combat * 1.3);
  champion.stats.strength = Math.round(champion.stats.strength * 1.25);

  const result = resolveCombat(champion, target, allChampions, { cannotFlee: true, damageReduction: -0.2 });

  // Restore stats
  champion.stats.combat = originalCombat;
  champion.stats.strength = originalStrength;
  champion.enraged = false;

  if (result.killed) {
    events.push({
      type: 'death',
      text: `${champion.name} tears through ${target.name} in their berserker fury!`,
      severity: 'death',
      killer: champion.name,
      victim: target.name,
      combatLog: result.combatLog,
      combatId: generateId()
    });

    // Rage aftermath - might attack allies if any are nearby
    champion.sanity -= 10;
    if (champion.sanity < 40 && randomFloat() < 0.2) {
      events.push({
        type: 'psychological',
        text: `${champion.name} struggles to calm their bloodlust after the kill.`,
        severity: 'warning'
      });
    }
  } else {
    events.push({
      type: 'combat',
      text: `${champion.name}'s rage-fueled assault leaves ${target.name} reeling! ${Math.round(result.damage)} damage dealt.`,
      severity: 'danger',
      combatLog: result.combatLog,
      combatId: generateId()
    });

    // Berserker takes extra damage from fighting recklessly
    const selfDamage = random(5, 15);
    champion.health -= selfDamage;
    events.push({
      type: 'hazard',
      text: `${champion.name} takes ${selfDamage} damage from their reckless assault.`
    });
  }

  return events;
}

// ============================================
// ASSASSIN - "Shadow Strike" - Lethal precision attack
// ============================================
export function handleAssassinShadowStrike(champion, target, allChampions) {
  const events = [];

  champion.energy -= 20;

  const stealthSkill = champion.skills?.stealth || 50;
  const meleeSkill = champion.skills?.melee || 40;
  const combinedSkill = (stealthSkill + meleeSkill) / 2;

  const targetAwareness = (target.stats.intelligence + target.stats.survival) / 2;
  const difficulty = 50 + targetAwareness * 0.3;

  const successResult = calculateSuccessLevel(combinedSkill, difficulty);

  if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
    // Perfect strike - instant kill if target is wounded
    if (target.health < 40) {
      target.alive = false;
      champion.kills++;
      champion.daysSinceKill = 0;
      events.push({
        type: 'death',
        text: `${champion.name} emerges from the shadows and delivers a perfect killing blow to ${target.name}!`,
        severity: 'death',
        killer: champion.name,
        victim: target.name
      });
    } else {
      const damage = random(35, 50) + champion.stats.strength * 0.3;
      target.health -= damage;
      target.injuries.push({ type: 'assassin strike', severity: 'severe', daysLeft: random(3, 5), bleedRate: 3 });
      events.push({
        type: 'ambush',
        text: `${champion.name}'s blade finds its mark perfectly! ${target.name} takes ${Math.round(damage)} critical damage!`,
        severity: 'danger'
      });
      if (target.health <= 0) {
        target.alive = false;
        champion.kills++;
        champion.daysSinceKill = 0;
        events.push({
          type: 'death',
          text: `${target.name} collapses from the fatal wound!`,
          severity: 'death',
          killer: champion.name,
          victim: target.name
        });
      }
    }
  } else if (successResult.successLevel === SUCCESS_LEVELS.SUCCESS) {
    const damage = random(25, 40) + champion.stats.strength * 0.2;
    target.health -= damage;
    target.injuries.push({ type: 'stab wound', severity: 'moderate', daysLeft: random(2, 4) });
    events.push({
      type: 'ambush',
      text: `${champion.name} strikes from the shadows! ${target.name} takes ${Math.round(damage)} damage!`,
      severity: 'danger'
    });
    if (target.health <= 0) {
      target.alive = false;
      champion.kills++;
      champion.daysSinceKill = 0;
      events.push({ type: 'death', text: `${target.name} falls to the assassin's blade!`, severity: 'death' });
    }
  } else if (successResult.successLevel === SUCCESS_LEVELS.PARTIAL_SUCCESS) {
    const damage = random(10, 20);
    target.health -= damage;
    events.push({
      type: 'action',
      text: `${champion.name}'s strike grazes ${target.name} for ${damage} damage before they can react.`
    });
    modifyRelationship(target, champion.id, -30, allChampions);
  } else {
    events.push({
      type: 'action',
      text: `${target.name} senses ${champion.name}'s approach and evades the shadow strike!`
    });
    modifyRelationship(target, champion.id, -40, allChampions);

    if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_FAILURE) {
      const counterDamage = random(15, 25);
      champion.health -= counterDamage;
      events.push({
        type: 'combat',
        text: `${target.name} counters with a swift strike, dealing ${counterDamage} damage!`,
        severity: 'danger'
      });
    }
  }

  return events;
}

// ============================================
// GUARDIAN - "Shield Wall" - Protect an ally
// ============================================
export function handleGuardianShieldWall(champion, ally, allChampions) {
  const events = [];

  champion.energy -= 10;

  // Mark the champion as protecting this ally
  champion.protecting = ally.id;
  ally.protectedBy = champion.id;

  const tacticsSkill = champion.skills?.tactics || 40;
  const meleeSkill = champion.skills?.melee || 50;
  const combinedSkill = (tacticsSkill + meleeSkill) / 2;

  events.push({
    type: 'protection',
    text: `${champion.name} takes up a defensive position, ready to shield ${ally.name} from harm.`,
    severity: 'success'
  });

  modifyRelationship(ally, champion.id, 15, allChampions);

  // The protection effect will be checked during combat resolution
  // Store protection quality based on skill
  champion.protectionQuality = combinedSkill > 60 ? 'excellent' : combinedSkill > 40 ? 'good' : 'moderate';

  if (champion.protectionQuality === 'excellent') {
    events.push({
      type: 'action',
      text: `${champion.name}'s defensive stance is impeccable - they will intercept any attack on ${ally.name}.`
    });
  }

  return events;
}

// ============================================
// PALADIN - "Smite Evil" - Holy strike vs dark creatures
// ============================================
export function handlePaladinSmite(champion, target, allChampions) {
  const events = [];

  champion.energy -= 20;

  const isEvil = ['undead', 'vampire', 'dark_elf'].includes(target.race);
  const smiteMultiplier = isEvil ? 1.8 : 1.2;

  const meleeSkill = champion.skills?.melee || 50;
  const successResult = calculateSuccessLevel(meleeSkill, 45);

  const holyLines = [
    `"By the light, be purged!"`,
    `"Face divine judgment!"`,
    `"The gods condemn you!"`,
    `"Light shall cleanse your darkness!"`
  ];

  events.push({
    type: 'smite',
    text: `${champion.name} invokes holy power: ${pick(holyLines)}`,
    severity: 'warning'
  });

  let baseDamage = random(20, 35) + champion.stats.strength * 0.3;

  if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
    baseDamage *= 1.5;
    events.push({
      type: 'divine',
      text: `Divine light blazes from ${champion.name}'s weapon!`,
      severity: 'success'
    });
  } else if (successResult.successLevel === SUCCESS_LEVELS.FAILURE || successResult.successLevel === SUCCESS_LEVELS.CRITICAL_FAILURE) {
    baseDamage *= 0.5;
    events.push({
      type: 'action',
      text: `The divine power falters, but ${champion.name} presses the attack.`
    });
  }

  const finalDamage = Math.round(baseDamage * smiteMultiplier);
  target.health -= finalDamage;

  if (isEvil) {
    events.push({
      type: 'smite',
      text: `The holy strike sears ${target.name}'s dark essence! ${finalDamage} righteous damage!`,
      severity: 'danger'
    });
    target.sanity -= 10; // Dark creatures are disturbed by holy power
  } else {
    events.push({
      type: 'combat',
      text: `${champion.name}'s blessed strike deals ${finalDamage} damage to ${target.name}.`,
      severity: 'warning'
    });
  }

  if (target.health <= 0) {
    target.alive = false;
    champion.kills++;
    champion.daysSinceKill = 0;
    events.push({
      type: 'death',
      text: isEvil
        ? `${target.name} is purified by holy light!`
        : `${target.name} falls to the paladin's blade!`,
      severity: 'death',
      killer: champion.name,
      victim: target.name
    });
    champion.popularity += isEvil ? 10 : 5;
  }

  return events;
}

// ============================================
// REAVER - "Bloody Execution" - Finish off wounded foes
// ============================================
export function handleReaverExecution(champion, target, allChampions) {
  const events = [];

  if (target.health > 35) {
    events.push({
      type: 'action',
      text: `${champion.name} looks for an opportunity to execute ${target.name}, but they're not wounded enough.`
    });
    return events;
  }

  champion.energy -= 15;

  const executionLines = [
    `${champion.name} grins wickedly as they move in for the kill.`,
    `"Time to die," ${champion.name} snarls at the wounded ${target.name}.`,
    `${champion.name} circles the wounded ${target.name} like a predator.`,
    `${champion.name}'s eyes gleam with bloodlust as they approach ${target.name}.`
  ];

  events.push({
    type: 'execution',
    text: pick(executionLines),
    severity: 'danger'
  });

  const meleeSkill = champion.skills?.melee || 50;
  const executionChance = 0.5 + (meleeSkill / 200) + ((35 - target.health) / 100);

  if (randomFloat() < executionChance) {
    target.alive = false;
    champion.kills++;
    champion.daysSinceKill = 0;

    // Reaver gains benefits from brutal kills
    champion.health = clamp(champion.health + 10, 0, 100); // Bloodthirst heal
    champion.energy = clamp(champion.energy + 15, 0, 100);

    events.push({
      type: 'death',
      text: `${champion.name} brutally executes ${target.name}! The savagery is horrifying to witness.`,
      severity: 'death',
      killer: champion.name,
      victim: target.name
    });

    champion.popularity += 5; // Crowds love violence
    champion.sanity -= 5;

    // Terrify nearby champions
    allChampions.filter(c => c.alive && c.zone === champion.zone && c.id !== champion.id).forEach(witness => {
      witness.sanity -= random(5, 15);
      modifyRelationship(witness, champion.id, -15, allChampions);
    });
  } else {
    // Target fights back desperately
    events.push({
      type: 'combat',
      text: `${target.name} desperately fights off ${champion.name}'s execution attempt!`,
      severity: 'warning'
    });

    const result = resolveCombat(champion, target, allChampions);
    if (result.killed) {
      events.push({
        type: 'death',
        text: `${result.winner.name} prevails in the struggle!`,
        severity: 'death',
        combatLog: result.combatLog,
        combatId: generateId()
      });
    }
  }

  return events;
}

// ============================================
// WITCH HUNTER - "Purging Flames" - Hunt magical beings
// ============================================
export function handleWitchHunterPurge(champion, target, allChampions) {
  const events = [];

  champion.energy -= 20;

  const magicalRaces = ['undead', 'vampire', 'dark_elf', 'elf'];
  const isMagical = magicalRaces.includes(target.race);

  const huntingLines = [
    `"I smell your corruption, ${target.raceName}!"`,
    `"No dark magic can save you now!"`,
    `"The flame cleanses all!"`,
    `"Your kind must be purged!"`
  ];

  if (isMagical) {
    events.push({
      type: 'witch_hunt',
      text: `${champion.name} identifies ${target.name} as a magical creature: ${pick(huntingLines)}`,
      severity: 'danger'
    });
  } else {
    events.push({
      type: 'action',
      text: `${champion.name} attacks ${target.name} with zealous fury!`
    });
  }

  const meleeSkill = champion.skills?.melee || 50;
  const intimidationSkill = champion.skills?.intimidation || 40;
  const combinedSkill = (meleeSkill + intimidationSkill) / 2;

  const difficulty = isMagical ? 40 : 50; // Easier against magical targets
  const successResult = calculateSuccessLevel(combinedSkill, difficulty);

  let damage = random(18, 32) + champion.stats.strength * 0.25;

  if (isMagical) {
    damage *= 1.5; // Bonus damage vs magical creatures
    target.sanity -= 15; // Magical creatures fear witch hunters
  }

  if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
    damage *= 1.4;
    if (isMagical) {
      // Suppress magical passives temporarily
      target.magicSuppressed = 2; // For 2 days
      events.push({
        type: 'witch_hunt',
        text: `${champion.name}'s strike disrupts ${target.name}'s magical essence!`,
        severity: 'success'
      });
    }
  } else if (successResult.successLevel === SUCCESS_LEVELS.FAILURE) {
    damage *= 0.6;
  }

  const finalDamage = Math.round(damage);
  target.health -= finalDamage;

  events.push({
    type: 'combat',
    text: `${champion.name} strikes ${target.name} for ${finalDamage} damage!`,
    severity: 'warning'
  });

  if (target.health <= 0) {
    target.alive = false;
    champion.kills++;
    champion.daysSinceKill = 0;
    events.push({
      type: 'death',
      text: isMagical
        ? `${target.name} is purged of their dark magic!`
        : `${target.name} falls to the witch hunter's blade!`,
      severity: 'death',
      killer: champion.name,
      victim: target.name
    });
    champion.popularity += isMagical ? 10 : 3;
  }

  return events;
}

// ============================================
// TOURNEY CHAMPION - "Flourish" - Flashy attack for fame
// ============================================
export function handleTourneyFlourish(champion, target, allChampions) {
  const events = [];

  champion.energy -= 15;

  const flourishLines = [
    `${champion.name} performs an elaborate sword flourish before attacking!`,
    `${champion.name} salutes the imaginary crowd before engaging!`,
    `"Watch closely!" ${champion.name} announces before a dazzling display of swordwork!`,
    `${champion.name} spins their weapon dramatically, playing to an unseen audience!`
  ];

  events.push({
    type: 'flourish',
    text: pick(flourishLines),
    severity: 'info'
  });

  const meleeSkill = champion.skills?.melee || 60;
  const tacticsSkill = champion.skills?.tactics || 40;
  const performanceSkill = (meleeSkill + champion.stats.charisma) / 2;

  const successResult = calculateSuccessLevel(performanceSkill, 50);

  // Always gain some popularity for the showmanship
  champion.popularity += successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS ? 15 :
                         successResult.successLevel === SUCCESS_LEVELS.SUCCESS ? 10 :
                         successResult.successLevel === SUCCESS_LEVELS.PARTIAL_SUCCESS ? 5 : 3;

  if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
    events.push({
      type: 'flourish',
      text: `The flourish is MAGNIFICENT! ${champion.name}'s reputation soars!`,
      severity: 'success'
    });

    // Impressive flourish might intimidate opponent
    if (target.personality.bravery < 50) {
      target.energy -= 10;
      events.push({
        type: 'social',
        text: `${target.name} is visibly shaken by the display of skill!`
      });
    }
  } else if (successResult.successLevel === SUCCESS_LEVELS.FAILURE ||
             successResult.successLevel === SUCCESS_LEVELS.CRITICAL_FAILURE) {
    events.push({
      type: 'action',
      text: `The flourish is clumsy - ${champion.name} nearly drops their weapon!`
    });
    champion.energy -= 5; // Wasted effort
  }

  // Now the actual attack
  const result = resolveCombat(champion, target, allChampions);

  if (result.killed) {
    events.push({
      type: 'death',
      text: `${champion.name} defeats ${target.name} with style! The crowd goes wild!`,
      severity: 'death',
      killer: champion.name,
      victim: target.name,
      combatLog: result.combatLog,
      combatId: generateId()
    });
    champion.popularity += 10;
  } else {
    events.push({
      type: 'combat',
      text: `${result.winner.name} wins the bout!`,
      severity: 'warning',
      combatLog: result.combatLog,
      combatId: generateId()
    });
    // Even losing gracefully can gain some popularity
    if (result.loser.id === champion.id && champion.alive) {
      champion.popularity += 3;
    }
  }

  return events;
}

// ============================================
// RANGER - "Track Prey" - Hunt down a specific target
// ============================================
export function handleRangerTrack(champion, targetChampion, allChampions) {
  const events = [];

  champion.energy -= 10;

  const survivalSkill = champion.skills?.survival || 60;
  const stealthSkill = champion.skills?.stealth || 40;
  const trackingSkill = (survivalSkill + stealthSkill) / 2;

  const difficulty = 45 + (targetChampion.stats.stealth * 0.2);
  const successResult = calculateSuccessLevel(trackingSkill, difficulty);

  events.push({
    type: 'tracking',
    text: `${champion.name} studies the ground, tracking ${targetChampion.name}'s movements...`
  });

  if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
    // Perfect track - find them and get initiative
    champion.zone = targetChampion.zone;
    champion.hasInitiative = true;
    events.push({
      type: 'tracking',
      text: `${champion.name} tracks ${targetChampion.name} to ${BATTLEFIELD_ZONES.find(z => z.id === targetChampion.zone)?.name} and approaches undetected!`,
      severity: 'success'
    });
  } else if (successResult.successLevel === SUCCESS_LEVELS.SUCCESS) {
    // Good track - find their location
    champion.zone = targetChampion.zone;
    events.push({
      type: 'tracking',
      text: `${champion.name} follows the trail to ${BATTLEFIELD_ZONES.find(z => z.id === targetChampion.zone)?.name}!`,
      severity: 'success'
    });
  } else if (successResult.successLevel === SUCCESS_LEVELS.PARTIAL_SUCCESS) {
    // Partial - learn their general area
    events.push({
      type: 'tracking',
      text: `${champion.name} determines ${targetChampion.name} is somewhere in ${BATTLEFIELD_ZONES.find(z => z.id === targetChampion.zone)?.name}.`
    });
  } else {
    events.push({
      type: 'action',
      text: `${champion.name} loses the trail. ${targetChampion.name}'s location remains unknown.`
    });

    if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_FAILURE) {
      // Wander into danger
      const dangerZone = pick(BATTLEFIELD_ZONES.filter(z => z.danger > 0.4));
      if (dangerZone) {
        champion.zone = dangerZone.id;
        events.push({
          type: 'hazard',
          text: `While searching, ${champion.name} wanders into ${dangerZone.name}.`,
          severity: 'warning'
        });
      }
    }
  }

  return events;
}

// ============================================
// HEALER - "Miracle Cure" - Powerful healing without items
// ============================================
export function handleHealerMiracle(champion, target, allChampions) {
  const events = [];

  // Can heal self or ally
  const patient = target || champion;
  champion.energy -= 25;

  const medicineSkill = champion.skills?.medicine || 70;
  const successResult = calculateSuccessLevel(medicineSkill, 40);

  const healingLines = [
    `${champion.name} places their hands on ${patient.name === champion.name ? 'their own wounds' : patient.name + "'s wounds"} and concentrates.`,
    `${champion.name} begins an intricate healing ritual.`,
    `${champion.name} calls upon ancient healing knowledge.`,
    `${champion.name}'s hands glow faintly as they work their healing arts.`
  ];

  events.push({
    type: 'healing',
    text: pick(healingLines)
  });

  let healAmount = random(25, 40);
  let injuriesHealed = 0;

  if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
    healAmount = random(45, 60);
    // Heal an injury too
    if (patient.injuries.length > 0) {
      const healed = patient.injuries.shift();
      injuriesHealed = 1;
      events.push({
        type: 'healing',
        text: `The healing is miraculous! ${patient.name}'s ${healed.type} is completely mended!`,
        severity: 'success'
      });
    }
    events.push({
      type: 'healing',
      text: `${patient.name} is restored for ${healAmount} health!`,
      severity: 'success'
    });
  } else if (successResult.successLevel === SUCCESS_LEVELS.SUCCESS) {
    events.push({
      type: 'healing',
      text: `${champion.name}'s healing restores ${healAmount} health to ${patient.name}.`,
      severity: 'success'
    });
  } else if (successResult.successLevel === SUCCESS_LEVELS.PARTIAL_SUCCESS) {
    healAmount = Math.round(healAmount * 0.6);
    events.push({
      type: 'healing',
      text: `The healing is partially successful, restoring ${healAmount} health.`
    });
  } else {
    healAmount = Math.round(healAmount * 0.3);
    events.push({
      type: 'action',
      text: `${champion.name}'s healing falters, only restoring ${healAmount} health.`
    });

    if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_FAILURE) {
      champion.energy -= 15; // Exhausting failure
      events.push({
        type: 'hazard',
        text: `The failed healing attempt leaves ${champion.name} exhausted.`
      });
    }
  }

  patient.health = clamp(patient.health + healAmount, 0, 100);

  if (patient.id !== champion.id) {
    modifyRelationship(patient, champion.id, 25, allChampions);
    champion.popularity += 5;
  }

  return events;
}

// ============================================
// COURTIER - "Scheme" - Manipulate multiple relationships
// ============================================
export function handleCourtierScheme(champion, targets, allChampions) {
  const events = [];

  if (targets.length < 2) {
    events.push({
      type: 'action',
      text: `${champion.name} looks for victims to manipulate, but finds no suitable targets.`
    });
    return events;
  }

  champion.energy -= 15;

  const persuasionSkill = champion.skills?.persuasion || 60;
  const stealthSkill = champion.skills?.stealth || 40;
  const schemeSkill = (persuasionSkill + champion.stats.charisma + stealthSkill) / 3;

  const target1 = targets[0];
  const target2 = targets[1];

  const schemeTypes = [
    {
      name: 'sow_discord',
      text: `${champion.name} whispers lies to ${target1.name} about ${target2.name}.`,
      effect: (success) => {
        const penalty = success >= SUCCESS_LEVELS.SUCCESS ? -30 : success >= SUCCESS_LEVELS.PARTIAL_SUCCESS ? -15 : -5;
        modifyRelationship(target1, target2.id, penalty, allChampions);
        if (success >= SUCCESS_LEVELS.SUCCESS) {
          modifyRelationship(target2, target1.id, Math.round(penalty * 0.5), allChampions);
        }
        return penalty;
      }
    },
    {
      name: 'false_alliance',
      text: `${champion.name} convinces ${target1.name} that ${target2.name} seeks an alliance.`,
      effect: (success) => {
        if (success >= SUCCESS_LEVELS.SUCCESS) {
          modifyRelationship(target1, target2.id, 20, allChampions);
          // But this will backfire later
          target1.deceived = { by: champion.id, about: target2.id };
        }
        return success >= SUCCESS_LEVELS.SUCCESS ? 20 : 0;
      }
    },
    {
      name: 'blame_shift',
      text: `${champion.name} convinces ${target1.name} that ${target2.name} stole from them.`,
      effect: (success) => {
        const penalty = success >= SUCCESS_LEVELS.SUCCESS ? -40 : success >= SUCCESS_LEVELS.PARTIAL_SUCCESS ? -20 : -10;
        modifyRelationship(target1, target2.id, penalty, allChampions);
        champion.grudges = champion.grudges || {};
        target1.grudges = target1.grudges || {};
        if (success >= SUCCESS_LEVELS.SUCCESS) {
          target1.grudges[target2.id] = 'theft';
        }
        return penalty;
      }
    }
  ];

  const scheme = pick(schemeTypes);
  events.push({
    type: 'scheme',
    text: scheme.text
  });

  const difficulty = 50 + (target1.stats.intelligence * 0.2);
  const successResult = calculateSuccessLevel(schemeSkill, difficulty);

  const effect = scheme.effect(successResult.successLevel);

  if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
    events.push({
      type: 'scheme',
      text: `The deception is flawless! ${target1.name} is completely fooled.`,
      severity: 'warning'
    });
  } else if (successResult.successLevel === SUCCESS_LEVELS.SUCCESS) {
    events.push({
      type: 'scheme',
      text: `${target1.name} believes the courtier's words.`
    });
  } else if (successResult.successLevel === SUCCESS_LEVELS.PARTIAL_SUCCESS) {
    events.push({
      type: 'social',
      text: `${target1.name} seems uncertain but is somewhat swayed.`
    });
  } else {
    events.push({
      type: 'social',
      text: `${target1.name} doesn't believe ${champion.name}'s claims.`
    });

    if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_FAILURE) {
      modifyRelationship(target1, champion.id, -30, allChampions);
      events.push({
        type: 'social',
        text: `${target1.name} sees through the manipulation and is furious!`,
        severity: 'warning'
      });
    }
  }

  return events;
}

// ============================================
// MADMAN - "Unpredictable" - Chaotic random action
// ============================================
export function handleMadmanChaos(champion, nearbyChampions, allChampions, zone) {
  const events = [];

  champion.energy -= random(5, 20); // Even energy cost is random

  const chaosLines = [
    `${champion.name}'s eyes glaze over as madness takes hold!`,
    `${champion.name} begins laughing uncontrollably!`,
    `${champion.name} hears voices only they can understand!`,
    `A wild look crosses ${champion.name}'s face!`
  ];

  events.push({
    type: 'madness',
    text: pick(chaosLines),
    severity: 'warning'
  });

  const chaosEffect = random(1, 10);

  switch (chaosEffect) {
    case 1: // Scream and reveal position
      events.push({
        type: 'madness',
        text: `${champion.name} screams incoherently, alerting everyone in ${zone.name}!`
      });
      champion.exposed = (champion.exposed || 0) + 50;
      break;

    case 2: // Attack random person (including allies)
      if (nearbyChampions.length > 0) {
        const randomTarget = pick(nearbyChampions);
        events.push({
          type: 'madness',
          text: `${champion.name} attacks ${randomTarget.name} without warning!`,
          severity: 'danger'
        });
        const damage = random(10, 30);
        randomTarget.health -= damage;
        modifyRelationship(randomTarget, champion.id, -50, allChampions);
      }
      break;

    case 3: // Drop items
      if (champion.inventory.length > 0) {
        const droppedItem = champion.inventory.pop();
        events.push({
          type: 'madness',
          text: `${champion.name} throws away their ${droppedItem.name}!`
        });
      }
      break;

    case 4: // Gain strange insight (temporary stat boost)
      champion.stats.intelligence += 20;
      setTimeout(() => { champion.stats.intelligence -= 20; }, 0);
      events.push({
        type: 'madness',
        text: `${champion.name} mutters cryptic prophecies... some seem eerily accurate.`
      });
      champion.popularity += 5;
      break;

    case 5: // Terrify everyone nearby
      nearbyChampions.forEach(nearby => {
        nearby.sanity -= random(10, 20);
        modifyRelationship(nearby, champion.id, -20, allChampions);
      });
      events.push({
        type: 'horror',
        text: `${champion.name}'s mad ravings disturb everyone nearby!`,
        severity: 'warning'
      });
      break;

    case 6: // Self-harm
      const selfDamage = random(5, 20);
      champion.health -= selfDamage;
      events.push({
        type: 'madness',
        text: `${champion.name} claws at their own face, dealing ${selfDamage} damage to themselves!`
      });
      break;

    case 7: // Sudden clarity - full energy restore
      champion.energy = 100;
      champion.sanity = clamp(champion.sanity + 20, 0, 100);
      events.push({
        type: 'madness',
        text: `A moment of terrifying clarity! ${champion.name} suddenly seems completely lucid.`,
        severity: 'success'
      });
      break;

    case 8: // Make a "friend"
      if (nearbyChampions.length > 0) {
        const newFriend = pick(nearbyChampions);
        modifyRelationship(champion, newFriend.id, 50, allChampions);
        events.push({
          type: 'madness',
          text: `${champion.name} decides ${newFriend.name} is their "best friend" and begins following them.`
        });
      }
      break;

    case 9: // Impressive feat of strength
      champion.popularity += 10;
      events.push({
        type: 'madness',
        text: `${champion.name} performs an impossible feat of strength, lifting a massive boulder!`,
        severity: 'success'
      });
      break;

    case 10: // Flee in random direction
      const randomZone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== champion.zone));
      champion.zone = randomZone.id;
      events.push({
        type: 'madness',
        text: `${champion.name} runs screaming into ${randomZone.name}!`
      });
      break;
  }

  return events;
}

// ============================================
// RELUCTANT HERO - "Inspire Hope" - Boost ally morale
// ============================================
export function handleReluctantHeroInspire(champion, nearbyAllies, allChampions) {
  const events = [];

  if (nearbyAllies.length === 0) {
    events.push({
      type: 'action',
      text: `${champion.name} has no one nearby to comfort.`
    });
    return events;
  }

  champion.energy -= 10;

  const persuasionSkill = champion.skills?.persuasion || 40;
  const empathy = champion.personality?.empathy || 60;
  const inspireSkill = (persuasionSkill + empathy) / 2;

  const successResult = calculateSuccessLevel(inspireSkill, 40);

  const inspireLines = [
    `"We don't have to be monsters here. We can survive together."`,
    `"I didn't ask for this either. But we can get through it."`,
    `"Stay with me. I won't let you face this alone."`,
    `"There has to be another way. We just have to find it."`
  ];

  events.push({
    type: 'inspire',
    text: `${champion.name} speaks to their allies: ${pick(inspireLines)}`
  });

  let sanityBoost = 15;
  let relationshipBonus = 10;

  if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
    sanityBoost = 25;
    relationshipBonus = 20;
    events.push({
      type: 'inspire',
      text: `The words strike deep. A sense of hope fills the air.`,
      severity: 'success'
    });
    champion.popularity += 5;
  } else if (successResult.successLevel === SUCCESS_LEVELS.SUCCESS) {
    events.push({
      type: 'inspire',
      text: `The allies find comfort in ${champion.name}'s words.`
    });
  } else if (successResult.successLevel === SUCCESS_LEVELS.PARTIAL_SUCCESS) {
    sanityBoost = 8;
    relationshipBonus = 5;
  } else {
    sanityBoost = 3;
    relationshipBonus = 2;
    events.push({
      type: 'social',
      text: `The words ring hollow in this place of death.`
    });
  }

  nearbyAllies.forEach(ally => {
    ally.sanity = clamp(ally.sanity + sanityBoost, 0, 100);
    modifyRelationship(ally, champion.id, relationshipBonus, allChampions);
  });

  // Reluctant hero also gains sanity from helping others
  champion.sanity = clamp(champion.sanity + Math.round(sanityBoost * 0.5), 0, 100);

  return events;
}

// ============================================
// HEDGE KNIGHT - "Sellsword's Gambit" - Offer services for payment
// ============================================
export function handleHedgeKnightGambit(champion, target, allChampions) {
  const events = [];

  if (!target || areAllies(champion, target) || areEnemies(champion, target)) {
    events.push({
      type: 'action',
      text: `${champion.name} looks for someone to make a deal with.`
    });
    return events;
  }

  champion.energy -= 5;

  const gambitLines = [
    `"I'll watch your back... for a price."`,
    `"My sword is for hire. What can you offer?"`,
    `"We could help each other survive this."`,
    `"I propose a business arrangement."`
  ];

  events.push({
    type: 'negotiation',
    text: `${champion.name} approaches ${target.name}: ${pick(gambitLines)}`
  });

  const persuasionSkill = champion.skills?.persuasion || 30;
  const targetNeed = (100 - target.health) / 100 + (target.inventory.length < 2 ? 0.2 : 0);
  const acceptChance = 0.3 + (persuasionSkill / 200) + targetNeed - (target.personality.pride / 200);

  if (randomFloat() < acceptChance && target.inventory.length > 0) {
    const payment = pick(target.inventory);
    target.inventory = target.inventory.filter(i => i !== payment);
    champion.inventory.push(payment);

    modifyRelationship(champion, target.id, 25, allChampions);
    modifyRelationship(target, champion.id, 20, allChampions);

    events.push({
      type: 'deal',
      text: `${target.name} agrees! They give ${champion.name} their ${payment.name} as payment.`,
      severity: 'success'
    });

    // Mark the arrangement
    champion.contractWith = target.id;
    target.hiredProtector = champion.id;
  } else if (target.personality.pride > 70) {
    events.push({
      type: 'social',
      text: `${target.name} scoffs at the offer. "I need no sellsword's help!"`
    });
    modifyRelationship(target, champion.id, -10, allChampions);
  } else {
    events.push({
      type: 'social',
      text: `${target.name} declines the offer, preferring to go it alone.`
    });
  }

  return events;
}

// Export a map of archetype to their special action
export const ARCHETYPE_ACTIONS = {
  knight: { action: 'rally', handler: handleKnightRally, description: 'Rally nearby allies' },
  berserker: { action: 'blood_rage', handler: handleBerserkerRage, description: 'Enter a berserker rage' },
  assassin: { action: 'shadow_strike', handler: handleAssassinShadowStrike, description: 'Deadly precision strike' },
  guardian: { action: 'shield_wall', handler: handleGuardianShieldWall, description: 'Protect an ally' },
  paladin: { action: 'smite', handler: handlePaladinSmite, description: 'Holy strike against evil' },
  reaver: { action: 'execution', handler: handleReaverExecution, description: 'Execute wounded foes' },
  witch_hunter: { action: 'purge', handler: handleWitchHunterPurge, description: 'Hunt magical beings' },
  champion: { action: 'flourish', handler: handleTourneyFlourish, description: 'Flashy attack for fame' },
  ranger: { action: 'track', handler: handleRangerTrack, description: 'Track down a target' },
  healer: { action: 'miracle', handler: handleHealerMiracle, description: 'Powerful healing' },
  courtier: { action: 'scheme', handler: handleCourtierScheme, description: 'Manipulate relationships' },
  madman: { action: 'chaos', handler: handleMadmanChaos, description: 'Unpredictable action' },
  reluctant_hero: { action: 'inspire', handler: handleReluctantHeroInspire, description: 'Inspire hope in allies' },
  hedge_knight: { action: 'gambit', handler: handleHedgeKnightGambit, description: 'Offer services for payment' }
};
