// Combat system

import { random, randomFloat, pick, clamp, generateId } from '../utils';
import {
  BATTLEFIELD_ZONES,
  BODY_PARTS,
  ATTACK_TYPES,
  WOUND_DESCRIPTIONS,
  COMBAT_REACTIONS,
  DODGE_DESCRIPTIONS,
  WEAPON_CATEGORIES,
  getRacePassiveValue,
  hasRacePassive,
  applyRacePassive
} from '../constants';
import {
  getProficiencyHitModifier,
  getProficiencyDamageModifier,
  getRelevantCombatSkill,
  calculateSuccessLevel,
  applyCombatSuccessEffects,
  SUCCESS_LEVELS
} from '../constants/skills';
import { modifyRelationship } from './relationships';

export function getCombatPower(champion) {
  let power = champion.stats.combat + champion.stats.strength * 0.5;

  // Weapon bonuses
  champion.inventory.forEach(item => {
    if (item.combatBonus) power += item.combatBonus;
  });

  // Status effects
  power *= (champion.health / 100);
  power *= (champion.energy / 100) * 0.5 + 0.5;
  power *= (champion.hunger / 100) * 0.3 + 0.7;

  // Injuries reduce combat effectiveness
  champion.injuries.forEach(injury => {
    if (injury.severity === 'severe') power *= 0.7;
    else if (injury.severity === 'moderate') power *= 0.85;
    else power *= 0.95;
  });

  return Math.max(1, power);
}

export function getWeaponCategory(champion) {
  const weapon = champion.inventory.find(i => i.combatBonus);
  if (!weapon) return 'unarmed';
  return WEAPON_CATEGORIES[weapon.id] || 'blade';
}

export function getWeaponName(champion) {
  const weapon = champion.inventory.find(i => i.combatBonus);
  return weapon ? weapon.name.toLowerCase() : 'fists';
}

export function selectTargetBodyPart(attacker, defender, isAimed) {
  // Aimed attacks can target specific parts, random attacks are weighted
  if (isAimed && attacker.stats.combat > 50) {
    // Skilled fighters aim for vital areas
    const vitalParts = BODY_PARTS.filter(p => p.vital);
    return pick(vitalParts);
  }

  // Weight towards torso and limbs
  const weights = {
    head: 5, neck: 2, chest: 20, abdomen: 15,
    left_arm: 12, right_arm: 12, left_hand: 4, right_hand: 4,
    left_leg: 10, right_leg: 10, left_foot: 3, right_foot: 3
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = random(1, totalWeight);

  for (const part of BODY_PARTS) {
    roll -= weights[part.id];
    if (roll <= 0) return part;
  }

  return BODY_PARTS[2]; // chest as fallback
}

export function calculateHitChance(attacker, defender, attackType, weaponCategory = 'unarmed') {
  let baseChance = 50;

  // Attacker bonuses
  baseChance += attacker.stats.combat * 0.3;
  baseChance += attacker.stats.speed * 0.1;

  // Defender penalties (their evasion)
  baseChance -= defender.stats.speed * 0.25;
  baseChance -= defender.stats.combat * 0.15;

  // Fatigue affects both
  baseChance *= (attacker.energy / 100) * 0.3 + 0.7;
  baseChance += (100 - defender.energy) * 0.1;

  // Injuries affect dodge ability
  defender.injuries.forEach(inj => {
    if (inj.bodyPart?.includes('leg') || inj.bodyPart?.includes('foot')) {
      baseChance += 10;
    }
  });

  // Proficiency modifier for hit chance
  const proficiency = attacker.proficiencies?.[weaponCategory] || 0;
  const profMod = getProficiencyHitModifier(proficiency);
  baseChance *= (1 + profMod);

  // Relevant skill bonus (melee or archery)
  const relevantSkill = getRelevantCombatSkill(weaponCategory);
  const skillValue = attacker.skills?.[relevantSkill] || 0;
  baseChance += skillValue * 0.15;

  // Race passives - dodge bonus for defender
  const defenderDodge = getRacePassiveValue(defender, 'dodgeBonus');
  if (defenderDodge) {
    baseChance *= (1 - defenderDodge.value);
  }

  // Race passive - small target (halflings)
  const smallTarget = getRacePassiveValue(defender, 'dodgeBonus');
  if (smallTarget && attacker.race !== 'halfling') {
    baseChance *= (1 - smallTarget.value);
  }

  return clamp(baseChance, 15, 95);
}

export function calculateDamage(attacker, attackType, bodyPart, weapon, defender = null, context = {}) {
  let damage = attackType.baseDamage;

  // Strength modifier
  damage += attacker.stats.strength * 0.2;

  // Weapon bonus
  let weaponCategory = 'unarmed';
  if (weapon) {
    damage += weapon.combatBonus * 0.3;

    // Get weapon category from item or fallback to WEAPON_CATEGORIES mapping
    weaponCategory = weapon.category || WEAPON_CATEGORIES[weapon.id] || 'blade';

    // Race passive - weapon type bonus (giants with blunt weapons)
    damage = applyRacePassive(attacker, 'weaponTypeBonus', damage, { weaponType: weaponCategory });
  } else {
    // Unarmed - check for claws and fangs (beastkin)
    damage = applyRacePassive(attacker, 'unarmedBonus', damage, {});
  }

  // Proficiency damage modifier
  const proficiency = attacker.proficiencies?.[weaponCategory] || 0;
  damage *= getProficiencyDamageModifier(proficiency);

  // Body part multiplier
  damage *= bodyPart.damageMultiplier;

  // Random variance
  damage *= (0.7 + randomFloat() * 0.6);

  // Race passive - low health damage bonus (orc bloodlust)
  const healthPercent = attacker.health / 100;
  damage = applyRacePassive(attacker, 'lowHealthDamageBonus', damage, { healthPercent });

  // Race passive - execute bonus (dark elf cruelty) against wounded enemies
  if (defender) {
    const targetHealthPercent = defender.health / 100;
    damage = applyRacePassive(attacker, 'executeBonus', damage, { targetHealthPercent });
  }

  // Race passive - ally damage bonus (beastkin pack hunter)
  if (context.hasAllies) {
    damage = applyRacePassive(attacker, 'allyDamageBonus', damage, { hasAllies: true });
  }

  // Round final damage
  damage = Math.round(damage);

  // Apply defender's damage reduction if applicable
  if (defender) {
    // Flat damage reduction (giant thick skin)
    damage = applyRacePassive(defender, 'flatDamageReduction', damage, {});

    // Damage type reduction (dwarf stoneborn vs blunt)
    damage = applyRacePassive(defender, 'damageReduction', damage, { damageType: attackType.damageType });
  }

  return Math.max(1, Math.round(damage));
}

export function getWoundSeverity(damage) {
  if (damage >= 25) return 'critical';
  if (damage >= 15) return 'severe';
  if (damage >= 8) return 'moderate';
  return 'minor';
}

export function generateCombatLogEntry(attacker, defender, attackType, bodyPart, hit, damage, blocked, weapon) {
  const weaponName = weapon ? weapon.name.toLowerCase() : null;
  const weaponPhrase = weaponName ? ` with ${weaponName === 'fists' ? 'bare fists' : `the ${weaponName}`}` : '';

  if (!hit) {
    const dodgeDesc = pick(DODGE_DESCRIPTIONS);
    return {
      text: `${attacker.name} ${attackType.verb} ${defender.name}${weaponPhrase}, but ${defender.name} ${dodgeDesc} the attack!`,
      type: 'miss',
      attacker: attacker.name,
      defender: defender.name
    };
  }

  if (blocked) {
    return {
      text: `${attacker.name} ${attackType.verb} ${defender.name}${weaponPhrase}, but the blow is partially blocked!`,
      type: 'blocked',
      attacker: attacker.name,
      defender: defender.name,
      damage: Math.round(damage * 0.5)
    };
  }

  const severity = getWoundSeverity(damage);
  const woundDescs = WOUND_DESCRIPTIONS[attackType.damageType] || WOUND_DESCRIPTIONS.blunt;
  const woundDesc = pick(woundDescs[severity]);
  const reaction = pick(COMBAT_REACTIONS);

  let text = `${attacker.name} ${attackType.verb} ${defender.name}${weaponPhrase} and ${woundDesc} the ${bodyPart.name}!`;

  if (severity === 'severe' || severity === 'critical') {
    text += ` ${defender.name} ${reaction}.`;
  }

  if (damage >= 30 && bodyPart.vital) {
    text += ` Blood sprays from the wound!`;
  }

  return {
    text,
    type: 'hit',
    severity,
    attacker: attacker.name,
    defender: defender.name,
    bodyPart: bodyPart.name,
    damage,
    damageType: attackType.damageType
  };
}

export function simulateCombatExchange(attacker, defender, round, combatLog) {
  const weapon = attacker.inventory.find(i => i.combatBonus);
  const weaponCategory = getWeaponCategory(attacker);
  const attackTypes = ATTACK_TYPES[weaponCategory];
  const attackType = pick(attackTypes);

  const isAimed = attacker.stats.combat > 60 && randomFloat() < 0.3;
  const bodyPart = selectTargetBodyPart(attacker, defender, isAimed);

  const hitChance = calculateHitChance(attacker, defender, attackType, weaponCategory);
  const roll = random(1, 100);
  const hit = roll <= hitChance;

  // Calculate degree of success using skill system
  const relevantSkill = getRelevantCombatSkill(weaponCategory);
  const skillValue = attacker.skills?.[relevantSkill] || 50;
  const defenderTactics = defender.skills?.tactics || 30;
  const difficulty = 50 + (defenderTactics - 30) * 0.3; // Defender's tactics increases difficulty
  const successResult = calculateSuccessLevel(skillValue, difficulty);

  // Check for block/parry
  const blockChance = defender.stats.combat * 0.2 + (defender.inventory.some(i => i.combatBonus) ? 15 : 0);
  const blocked = hit && random(1, 100) <= blockChance;

  let damage = 0;
  let stunned = false;
  let counterattack = false;

  if (hit) {
    damage = calculateDamage(attacker, attackType, bodyPart, weapon, defender);

    // Apply degree of success effects
    if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_SUCCESS) {
      // Critical hit: +50% damage and chance to stun
      damage = Math.round(damage * 1.5);
      stunned = randomFloat() < 0.5;
      combatLog.push({
        text: `CRITICAL HIT! ${attacker.name} strikes with devastating precision!`,
        type: 'critical',
        round
      });
    } else if (successResult.successLevel === SUCCESS_LEVELS.PARTIAL_SUCCESS) {
      // Partial success: reduced damage
      damage = Math.round(damage * 0.75);
    }

    if (blocked) damage = Math.round(damage * 0.5);
  } else {
    // Check for critical failure (counterattack opportunity)
    if (successResult.successLevel === SUCCESS_LEVELS.CRITICAL_FAILURE) {
      counterattack = true;
      combatLog.push({
        text: `${attacker.name} overextends badly! ${defender.name} seizes the opening!`,
        type: 'critical_miss',
        round
      });
    }
  }

  const logEntry = generateCombatLogEntry(attacker, defender, attackType, bodyPart, hit, damage, blocked, weapon);
  logEntry.round = round;
  logEntry.hitChance = hitChance;
  logEntry.roll = roll;
  logEntry.successLevel = successResult.successLevel;
  combatLog.push(logEntry);

  // Apply damage
  if (hit) {
    defender.health -= damage;

    // Energy cost from being hit
    defender.energy -= Math.round(damage * 0.3);

    // Stun effect reduces defender's next action
    if (stunned) {
      defender.energy -= 15;
      combatLog.push({
        text: `${defender.name} is stunned by the blow!`,
        type: 'stun',
        round
      });
    }

    // Record injury for significant hits
    if (damage >= 10) {
      const injurySeverity = getWoundSeverity(damage);
      defender.injuries.push({
        type: `${attackType.damageType} wound to ${bodyPart.name}`,
        bodyPart: bodyPart.id,
        severity: injurySeverity,
        daysLeft: random(2, 6),
        bleedRate: bodyPart.bleedRate * (damage / 20)
      });

      // Critical hits to vital areas can be instantly fatal
      if (bodyPart.vital && damage >= 25 && randomFloat() < 0.3) {
        defender.health = Math.min(defender.health, -10);
        combatLog.push({
          text: `The ${bodyPart.name} wound proves fatal! ${defender.name} collapses!`,
          type: 'fatal',
          round
        });
      }
    }
  }

  // Handle counterattack from critical failure
  if (counterattack && defender.health > 0 && defender.energy > 10) {
    const counterDamage = random(10, 20) + defender.stats.strength * 0.1;
    attacker.health -= counterDamage;
    combatLog.push({
      text: `${defender.name} counterattacks for ${Math.round(counterDamage)} damage!`,
      type: 'counterattack',
      round
    });
  }

  // Attacker energy cost
  attacker.energy -= random(3, 8);

  return { hit, damage, blocked, bodyPart, stunned, counterattack };
}

export function resolveCombat(attacker, defender, allChampions) {
  const combatLog = [];
  const zone = BATTLEFIELD_ZONES.find(z => z.id === attacker.zone);

  // Opening log
  combatLog.push({
    text: `=== COMBAT BEGINS: ${attacker.name} vs ${defender.name} ===`,
    type: 'header',
    location: zone?.name || 'Unknown'
  });

  combatLog.push({
    text: `Location: ${zone?.name || 'Unknown Area'}`,
    type: 'info'
  });

  const attackerWeapon = getWeaponName(attacker);
  const defenderWeapon = getWeaponName(defender);
  combatLog.push({
    text: `${attacker.name} wields: ${attackerWeapon}. ${defender.name} wields: ${defenderWeapon}.`,
    type: 'info'
  });

  combatLog.push({
    text: `${attacker.name}: ${Math.round(attacker.health)} HP, ${Math.round(attacker.energy)} Energy`,
    type: 'status',
    champion: attacker.name
  });

  combatLog.push({
    text: `${defender.name}: ${Math.round(defender.health)} HP, ${Math.round(defender.energy)} Energy`,
    type: 'status',
    champion: defender.name
  });

  // Determine number of exchanges based on stats and health
  const maxRounds = random(3, 8);
  let round = 0;
  let combatEnded = false;

  while (round < maxRounds && !combatEnded) {
    round++;
    combatLog.push({
      text: `--- Round ${round} ---`,
      type: 'round'
    });

    // Determine who attacks this round (can be both, one, or counter-attacks)
    const attackerSpeed = attacker.stats.speed + random(-10, 10);
    const defenderSpeed = defender.stats.speed + random(-10, 10);

    // Faster combatant goes first
    const first = attackerSpeed >= defenderSpeed ? attacker : defender;
    const second = first === attacker ? defender : attacker;

    // First attack
    if (first.health > 0 && first.energy > 5) {
      simulateCombatExchange(first, second, round, combatLog);
    }

    // Check for death
    if (second.health <= 0) {
      combatEnded = true;
      break;
    }

    // Counter-attack (if defender survived and has energy)
    if (second.health > 0 && second.energy > 5 && randomFloat() < 0.7) {
      simulateCombatExchange(second, first, round, combatLog);
    }

    // Check for death
    if (first.health <= 0) {
      combatEnded = true;
      break;
    }

    // Check for disengagement (low health or energy)
    if (attacker.health < 30 || defender.health < 30 ||
        attacker.energy < 15 || defender.energy < 15) {
      if (randomFloat() < 0.4) {
        const fleeing = attacker.health < defender.health ? attacker : defender;
        combatLog.push({
          text: `${fleeing.name} breaks off and attempts to flee!`,
          type: 'disengage'
        });
        combatEnded = true;
      }
    }
  }

  // Determine winner
  const winner = attacker.health > defender.health ? attacker : defender;
  const loser = winner === attacker ? defender : attacker;
  const killed = loser.health <= 0;
  const totalDamageToLoser = combatLog
    .filter(e => e.defender === loser.name && e.damage)
    .reduce((sum, e) => sum + e.damage, 0);

  // Closing log
  combatLog.push({
    text: `=== COMBAT ENDS ===`,
    type: 'header'
  });

  if (killed) {
    combatLog.push({
      text: `${loser.name} has been slain by ${winner.name}!`,
      type: 'death'
    });

    loser.alive = false;
    winner.kills++;
    winner.popularity += 10;
    winner.sanity -= random(5, 20);
    winner.daysSinceKill = 0;

    // Race passive - life steal (vampire)
    const lifeSteal = getRacePassiveValue(winner, 'lifeSteal');
    if (lifeSteal) {
      const healAmount = Math.round(totalDamageToLoser * lifeSteal.value);
      winner.health = clamp(winner.health + healAmount, 0, 100);
      combatLog.push({
        text: `${winner.name} drains life from their victim, healing for ${healAmount} HP!`,
        type: 'info'
      });
    }

    // Loot
    const lootedItems = [];
    loser.inventory.forEach(item => {
      if (randomFloat() < 0.7) {
        winner.inventory.push(item);
        lootedItems.push(item.name);
      }
    });

    if (lootedItems.length > 0) {
      combatLog.push({
        text: `${winner.name} claims: ${lootedItems.join(', ')}`,
        type: 'loot'
      });
    }
  } else {
    combatLog.push({
      text: `${winner.name} wins the exchange! ${loser.name} retreats with ${Math.round(loser.health)} HP remaining.`,
      type: 'victory'
    });

    // Add wound if not already added
    if (!loser.injuries.some(i => i.type === 'combat wound')) {
      const severity = totalDamageToLoser > 40 ? 'severe' : totalDamageToLoser > 25 ? 'moderate' : 'minor';
      loser.injuries.push({ type: 'combat wound', severity, daysLeft: random(2, 5) });
    }
  }

  combatLog.push({
    text: `Final - ${attacker.name}: ${Math.max(0, Math.round(attacker.health))} HP | ${defender.name}: ${Math.max(0, Math.round(defender.health))} HP`,
    type: 'status'
  });

  // Relationship changes
  modifyRelationship(attacker, defender.id, -30, allChampions);
  modifyRelationship(defender, attacker.id, -40, allChampions);

  return {
    winner,
    loser,
    damage: totalDamageToLoser,
    killed,
    combatLog
  };
}
