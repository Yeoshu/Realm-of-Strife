// AI decision-making system

import { random, randomFloat, pick } from '../utils';
import { BATTLEFIELD_ZONES, hasRacePassive } from '../constants';
import { getRelevantSkillForAction, getProficiencyDamageModifier } from '../constants/skills';
import { areAllies, areEnemies, calculateCompatibility } from './relationships';
import { getCombatPower } from './combat';
import { ARCHETYPE_ACTIONS } from './archetypeActions';

/**
 * Calculate how much a champion prefers an action based on their relevant skill
 * @param {object} champion - The champion
 * @param {string} actionType - The type of action
 * @returns {number} - Multiplier between 0.7 and 1.5
 */
function calculateActionPreference(champion, actionType) {
  const skillId = getRelevantSkillForAction(actionType);
  if (!skillId || !champion.skills) return 1.0;

  const skillLevel = champion.skills[skillId] || 0;
  // 0.7 to 1.5 multiplier based on skill (0 = 0.7x, 100 = 1.5x)
  return 0.7 + (skillLevel / 100) * 0.8;
}

/**
 * Evaluate the best weapon for a champion based on proficiency
 * @param {object} champion - The champion
 * @returns {object|null} - The best weapon or null
 */
function evaluateWeaponChoice(champion) {
  const weapons = champion.inventory.filter(i => i.combatBonus);
  if (weapons.length === 0) return null;
  if (weapons.length === 1) return weapons[0];

  // Score weapons by: combatBonus * proficiencyModifier
  let bestWeapon = weapons[0];
  let bestScore = 0;

  weapons.forEach(weapon => {
    const category = weapon.category || 'blade';
    const proficiency = champion.proficiencies?.[category] || 0;
    const profMod = getProficiencyDamageModifier(proficiency);
    const score = weapon.combatBonus * profMod;

    if (score > bestScore) {
      bestScore = score;
      bestWeapon = weapon;
    }
  });

  return bestWeapon;
}

/**
 * Check if champion should prefer ranged or melee combat
 * @param {object} champion - The champion
 * @returns {string} - 'ranged' or 'melee'
 */
function preferredCombatStyle(champion) {
  const archerySkill = champion.skills?.archery || 0;
  const meleeSkill = champion.skills?.melee || 0;
  const rangedProf = champion.proficiencies?.ranged || 0;
  const meleeProfs = Math.max(
    champion.proficiencies?.blade || 0,
    champion.proficiencies?.blunt || 0,
    champion.proficiencies?.polearm || 0
  );

  const rangedScore = archerySkill + rangedProf;
  const meleeScore = meleeSkill + meleeProfs;

  return rangedScore > meleeScore + 20 ? 'ranged' : 'melee';
}

export function decideAction(champion, nearbyChampions, allChampions, day, gameState) {
  const p = champion.personality;
  const desperateForFood = champion.hunger < 30;
  const desperateForWater = champion.thirst < 30;
  const injured = champion.health < 50;
  const badlyInjured = champion.health < 30;
  const exhausted = champion.energy < 30;
  const hasWeapon = champion.inventory.some(i => i.combatBonus);
  const combatCapable = getCombatPower(champion) > 40;
  const isStrong = getCombatPower(champion) > 60;

  // Get archetype-specific action info
  const archetypeAction = ARCHETYPE_ACTIONS[champion.archetype];
  const canUseArchetypeAction = archetypeAction && champion.energy > 20;

  // Skill-based preferences
  const meleePreference = calculateActionPreference(champion, 'hunt');
  const stealthPreference = calculateActionPreference(champion, 'ambush');
  const survivalPreference = calculateActionPreference(champion, 'forage');
  const persuasionPreference = calculateActionPreference(champion, 'ally');
  const medicinePreference = calculateActionPreference(champion, 'heal');
  const intimidationPreference = calculateActionPreference(champion, 'intimidate');

  // Preferred combat style based on skills
  const combatStyle = preferredCombatStyle(champion);
  const hasRangedWeapon = champion.inventory.some(i => i.category === 'ranged');
  const preferRanged = combatStyle === 'ranged' && hasRangedWeapon;

  // Find potential allies and enemies nearby
  const nearbyAllies = nearbyChampions.filter(t => areAllies(champion, t));
  const nearbyEnemies = nearbyChampions.filter(t => areEnemies(champion, t));
  const nearbyNeutrals = nearbyChampions.filter(t => !areAllies(champion, t) && !areEnemies(champion, t));
  const nearbyWounded = nearbyChampions.filter(t => t.health < 30);

  // Find anyone they have a grudge against
  const grudgeTargets = nearbyChampions.filter(t => champion.grudges[t.id] || champion.relationships[t.id] < -50);

  // Calculate group power for group decisions
  const allyGroup = [champion, ...nearbyAllies];
  const groupPower = allyGroup.reduce((sum, c) => sum + getCombatPower(c), 0);
  const hasStrongAlliance = nearbyAllies.length >= 1;
  const hasLargeAlliance = nearbyAllies.length >= 2;

  // ============================================
  // GROUP ACTION DECISIONS (when allies present)
  // ============================================

  if (hasStrongAlliance) {
    // GROUP DEFENSE: Rally allies to defend against attackers
    if (nearbyEnemies.length > 0) {
      const strongestEnemy = nearbyEnemies.reduce((s, e) => getCombatPower(e) > getCombatPower(s) ? e : s, nearbyEnemies[0]);
      const enemyPower = getCombatPower(strongestEnemy);

      if (enemyPower > getCombatPower(champion) * 0.8 && randomFloat() < 0.4) {
        return { type: 'defend_ally', group: allyGroup, attacker: strongestEnemy };
      }
    }

    // GROUP HUNT: Coordinated attack on enemies
    if (nearbyEnemies.length > 0 && p.aggression > 40) {
      const targetEnemy = nearbyEnemies.find(e => groupPower > getCombatPower(e) * 1.3);
      if (targetEnemy && randomFloat() < 0.35) {
        return { type: 'group_hunt', group: allyGroup, target: targetEnemy };
      }
    }

    // Hunt lone targets together (ruthless packs)
    if (p.ruthlessness > 50 || p.aggression > 55) {
      const loneTarget = nearbyChampions.find(t =>
        !areAllies(champion, t) &&
        !allChampions.some(ally => ally.alive && ally.id !== t.id && ally.zone === t.zone && areAllies(t, ally))
      );
      if (loneTarget && randomFloat() < 0.25) {
        return { type: 'group_hunt', group: allyGroup, target: loneTarget };
      }
    }
  }

  // GROUP FORAGING: Forage together for better results
  if (hasStrongAlliance && (desperateForFood || desperateForWater)) {
    if (randomFloat() < 0.5) {
      return { type: 'group_forage', group: allyGroup };
    }
  }

  // GROUP REST: Rest together for safety
  if (hasStrongAlliance && exhausted) {
    if (randomFloat() < 0.6) {
      return { type: 'group_rest', group: allyGroup };
    }
  }

  // Cooperative foraging when not desperate but allies present
  if (hasStrongAlliance && !nearbyEnemies.length && randomFloat() < 0.2) {
    return { type: 'group_forage', group: allyGroup };
  }

  // ============================================
  // ARCHETYPE-SPECIFIC ACTION DECISIONS
  // ============================================

  if (canUseArchetypeAction) {
    // KNIGHT: Rally allies when multiple are present
    if (champion.archetype === 'knight' && nearbyAllies.length >= 1) {
      const allyNeedsBoost = nearbyAllies.some(a => a.energy < 50 || a.sanity < 60);
      if (allyNeedsBoost && randomFloat() < 0.35) {
        return { type: 'archetype_rally', allies: nearbyAllies };
      }
    }

    // BERSERKER: Blood rage when health is moderate and enemy is present
    if (champion.archetype === 'berserker' && nearbyEnemies.length > 0 && champion.health > 40) {
      const strongEnemy = nearbyEnemies.find(e => getCombatPower(e) > getCombatPower(champion) * 0.7);
      if (strongEnemy && (p.aggression > 60 || p.impulsiveness > 50) && randomFloat() < 0.4) {
        return { type: 'archetype_blood_rage', target: strongEnemy };
      }
    }

    // ASSASSIN: Shadow strike against wounded or unaware targets
    if (champion.archetype === 'assassin' && nearbyChampions.length > 0) {
      const woundedTarget = nearbyChampions.find(t => t.health < 50 && !areAllies(champion, t));
      if (woundedTarget && randomFloat() < 0.4) {
        return { type: 'archetype_shadow_strike', target: woundedTarget };
      }
    }

    // GUARDIAN: Shield wall to protect wounded allies
    if (champion.archetype === 'guardian' && nearbyAllies.length > 0 && nearbyEnemies.length > 0) {
      const woundedAlly = nearbyAllies.find(a => a.health < 50);
      if (woundedAlly && randomFloat() < 0.5) {
        return { type: 'archetype_shield_wall', ally: woundedAlly };
      }
    }

    // PALADIN: Smite evil races (undead, vampire, dark_elf)
    if (champion.archetype === 'paladin' && nearbyEnemies.length > 0) {
      const evilTarget = nearbyEnemies.find(e => ['undead', 'vampire', 'dark_elf'].includes(e.race));
      if (evilTarget && randomFloat() < 0.6) {
        return { type: 'archetype_smite', target: evilTarget };
      }
      // Also smite regular enemies if righteous
      if (p.empathy > 50 && p.loyalty > 50 && randomFloat() < 0.25) {
        return { type: 'archetype_smite', target: pick(nearbyEnemies) };
      }
    }

    // REAVER: Execute wounded enemies
    if (champion.archetype === 'reaver' && nearbyChampions.length > 0) {
      const woundedPrey = nearbyChampions.find(t => t.health < 35 && !areAllies(champion, t));
      if (woundedPrey && randomFloat() < 0.6) {
        return { type: 'archetype_execution', target: woundedPrey };
      }
    }

    // WITCH HUNTER: Purge magical races
    if (champion.archetype === 'witch_hunter' && nearbyChampions.length > 0) {
      const magicalTarget = nearbyChampions.find(t =>
        ['undead', 'vampire', 'dark_elf', 'elf'].includes(t.race) && !areAllies(champion, t)
      );
      if (magicalTarget && randomFloat() < 0.55) {
        return { type: 'archetype_purge', target: magicalTarget };
      }
    }

    // TOURNEY CHAMPION: Flourish for glory
    if (champion.archetype === 'champion' && nearbyEnemies.length > 0 && combatCapable) {
      // More likely when audience (other champions) present
      const hasAudience = nearbyChampions.length >= 2;
      const flourishChance = hasAudience ? 0.4 : 0.2;
      if (p.pride > 50 && randomFloat() < flourishChance) {
        return { type: 'archetype_flourish', target: pick(nearbyEnemies) };
      }
    }

    // RANGER: Track specific enemies when they're not nearby
    if (champion.archetype === 'ranger' && nearbyEnemies.length === 0) {
      const knownEnemies = allChampions.filter(t =>
        t.alive && t.id !== champion.id && (areEnemies(champion, t) || champion.grudges[t.id])
      );
      if (knownEnemies.length > 0 && randomFloat() < 0.3) {
        return { type: 'archetype_track', target: pick(knownEnemies) };
      }
    }

    // HEALER: Miracle cure for self or allies
    if (champion.archetype === 'healer') {
      // Heal wounded ally
      const woundedAlly = nearbyAllies.find(a => a.health < 60);
      if (woundedAlly && randomFloat() < 0.6) {
        return { type: 'archetype_miracle', target: woundedAlly };
      }
      // Heal self
      if (injured && randomFloat() < 0.5) {
        return { type: 'archetype_miracle', target: null }; // null = self
      }
    }

    // COURTIER: Scheme to manipulate relationships
    if (champion.archetype === 'courtier' && nearbyChampions.length >= 2) {
      const potentialTargets = nearbyChampions.filter(t => !areAllies(champion, t));
      if (potentialTargets.length >= 2 && p.cunning > 50 && randomFloat() < 0.35) {
        return { type: 'archetype_scheme', targets: potentialTargets.slice(0, 2) };
      }
    }

    // MADMAN: Unpredictable chaos
    if (champion.archetype === 'madman') {
      // Higher chance when sanity is low
      const chaosChance = champion.sanity < 40 ? 0.5 : 0.25;
      if (randomFloat() < chaosChance) {
        return { type: 'archetype_chaos', nearbyChampions };
      }
    }

    // RELUCTANT HERO: Inspire hope in allies
    if (champion.archetype === 'reluctant_hero' && nearbyAllies.length > 0) {
      const demoralized = nearbyAllies.some(a => a.sanity < 50);
      if (demoralized && randomFloat() < 0.4) {
        return { type: 'archetype_inspire', allies: nearbyAllies };
      }
    }

    // HEDGE KNIGHT: Offer services when alone and need resources
    if (champion.archetype === 'hedge_knight' && nearbyNeutrals.length > 0) {
      const needsResources = champion.inventory.length < 2 || champion.hunger < 50;
      if (needsResources && randomFloat() < 0.3) {
        return { type: 'archetype_gambit', target: pick(nearbyNeutrals) };
      }
    }
  }

  // ============================================
  // INDIVIDUAL ACTION DECISIONS
  // ============================================

  // VENDETTA: Vengeful champions prioritize payback
  if (p.vendetta > 65 && grudgeTargets.length > 0 && combatCapable) {
    const target = grudgeTargets.reduce((worst, t) =>
      (champion.relationships[t.id] || 0) < (champion.relationships[worst.id] || 0) ? t : worst
    , grudgeTargets[0]);
    if (randomFloat() < p.vendetta / 100) {
      if (hasStrongAlliance && randomFloat() < 0.5) {
        return { type: 'group_hunt', group: allyGroup, target };
      }
      return { type: 'hunt', target, reason: 'vendetta' };
    }
  }

  // IMPULSIVE: Reckless champions act without thinking
  if (p.impulsiveness > 70 && randomFloat() < 0.3) {
    if (nearbyChampions.length > 0 && hasWeapon) {
      return { type: 'hunt', target: pick(nearbyChampions), reason: 'impulse' };
    }
    if (randomFloat() < 0.5) {
      return { type: 'move', target: pick(BATTLEFIELD_ZONES), reason: 'restless' };
    }
  }

  // PROUD: Challenge strong opponents to honorable combat
  if (p.pride > 75 && isStrong && nearbyEnemies.length > 0 && randomFloat() < 0.25) {
    const worthyOpponent = nearbyEnemies.find(t => getCombatPower(t) > getCombatPower(champion) * 0.7);
    if (worthyOpponent) {
      return { type: 'challenge', target: worthyOpponent };
    }
  }

  // CUNNING + STEALTHY: Ambush instead of direct combat (skill preference affects chance)
  if (p.cunning > 60 && champion.stats.stealth > 50 && nearbyEnemies.length > 0) {
    const ambushTarget = nearbyEnemies.find(t => !hasRacePassive(t, 'ambushImmunity'));
    const ambushChance = 0.3 * stealthPreference; // Skilled stealthers more likely to ambush
    if (ambushTarget && randomFloat() < ambushChance) {
      return { type: 'ambush', target: ambushTarget };
    }
  }

  // RUTHLESS + AGGRESSIVE: Predatory hunting
  if (p.ruthlessness > 60 && p.aggression > 55 && hasWeapon && nearbyChampions.length > 0) {
    const weakTarget = nearbyChampions.find(t => getCombatPower(t) < getCombatPower(champion) * 0.6);
    if (weakTarget && randomFloat() < (p.ruthlessness / 100)) {
      return { type: 'hunt', target: weakTarget, reason: 'predatory' };
    }
  }

  // INTIMIDATING: Try to scare off weaker opponents (skill preference affects chance)
  if ((p.aggression > 50 || p.pride > 60) && isStrong && nearbyChampions.length > 0) {
    const weakerTarget = nearbyChampions.find(t => getCombatPower(t) < getCombatPower(champion) * 0.7);
    const intimidateChance = 0.2 * intimidationPreference; // Skilled intimidators more likely to try
    if (weakerTarget && randomFloat() < intimidateChance) {
      return { type: 'intimidate', target: weakerTarget };
    }
  }

  // EMPATHETIC: Offer mercy to wounded enemies, help allies (medicine skill affects priority)
  if (p.empathy > 70 || medicinePreference > 1.2) {
    // Help wounded allies first - skilled healers are more proactive
    if (nearbyAllies.length > 0) {
      const healthThreshold = 40 + (medicinePreference - 1) * 20; // Skilled healers help at higher health
      const needyAlly = nearbyAllies.find(a => a.health < healthThreshold || a.hunger < 30);
      if (needyAlly && champion.inventory.some(i => i.healAmount || i.hungerRestore)) {
        return { type: 'help_ally', target: needyAlly };
      }
    }
    // Offer mercy to badly wounded enemies
    if (nearbyWounded.length > 0 && p.ruthlessness < 40) {
      const mercyTarget = nearbyWounded.find(t => !areAllies(champion, t));
      const mercyChance = 0.3 * persuasionPreference; // Persuasive characters more likely to offer mercy
      if (mercyTarget && randomFloat() < mercyChance) {
        return { type: 'mercy', target: mercyTarget };
      }
    }
  }

  // CUNNING: Spread gossip to manipulate relationships
  if (p.cunning > 60 && nearbyChampions.length > 0 && randomFloat() < 0.15) {
    const listener = pick(nearbyChampions);
    const aboutTarget = pick(allChampions.filter(t => t.alive && t.id !== listener.id && t.id !== champion.id));
    if (aboutTarget) {
      return { type: 'gossip', listener, aboutTarget };
    }
  }

  // TAUNTING: Aggressive or prideful champions taunt enemies
  if ((p.aggression > 55 || p.pride > 65) && nearbyEnemies.length > 0 && randomFloat() < 0.15) {
    return { type: 'taunt', target: pick(nearbyEnemies) };
  }

  // COWARDLY: Flee from any threat
  if (p.bravery < 30 && nearbyChampions.length > 0) {
    const threats = nearbyChampions.filter(t => getCombatPower(t) > getCombatPower(champion) * 0.8);
    if (threats.length > 0) {
      const saferZone = BATTLEFIELD_ZONES.find(z => z.id !== champion.zone && z.danger < 0.3);
      if (saferZone) {
        return { type: 'move', target: saferZone, reason: 'flee' };
      }
      return { type: 'hide', reason: 'fear' };
    }
  }

  // PROUD: Won't back down from challenges, seeks glory
  if (p.pride > 70 && nearbyEnemies.length > 0 && combatCapable) {
    return { type: 'hunt', target: pick(nearbyEnemies), reason: 'pride' };
  }

  // High aggression + weapon + enemy nearby = hunt
  if (p.aggression > 60 && hasWeapon && nearbyEnemies.length > 0 && combatCapable) {
    return { type: 'hunt', target: pick(nearbyEnemies) };
  }

  // BETRAYAL: Low loyalty + high cunning + high ruthlessness
  if (nearbyAllies.length > 0 && p.loyalty < 35 && p.cunning > 55 && p.ruthlessness > 50) {
    const targetAlly = nearbyAllies.find(a =>
      a.inventory.length > champion.inventory.length ||
      (a.health < champion.health && p.ruthlessness > 70)
    );
    const betrayChance = ((100 - p.loyalty) + p.ruthlessness + p.cunning) / 400;
    if (targetAlly && randomFloat() < betrayChance) {
      return { type: 'betray', target: targetAlly };
    }
  }

  // THEFT: Cunning and desperate or greedy (stealth skill affects chance)
  if (p.cunning > 50 && champion.stats.stealth > 40 && nearbyChampions.length > 0) {
    const theftTarget = nearbyChampions.find(t => t.inventory.length > 0 && !areAllies(champion, t));
    if (theftTarget) {
      const baseChance = (desperateForFood || desperateForWater) ? 0.4 : (p.ruthlessness > 60 ? 0.2 : 0.1);
      const theftChance = baseChance * stealthPreference; // Skilled thieves are more likely to attempt
      if (randomFloat() < theftChance) {
        return { type: 'theft', target: theftTarget };
      }
    }
  }

  // SABOTAGE: Very cunning champions sabotage enemies
  if (p.cunning > 70 && nearbyEnemies.length > 0 && randomFloat() < 0.1) {
    const sabotageTarget = nearbyEnemies.find(t => t.inventory.length > 0);
    if (sabotageTarget) {
      return { type: 'sabotage', target: sabotageTarget };
    }
  }

  // Desperate survival actions
  if (desperateForFood || desperateForWater) {
    if (p.ruthlessness > 60 && nearbyChampions.length > 0 && randomFloat() < 0.3) {
      const target = nearbyChampions.find(t => t.inventory.some(i => i.hungerRestore || i.thirstRestore));
      if (target && getCombatPower(champion) > getCombatPower(target) * 0.8) {
        return { type: 'hunt', target, reason: 'desperate_theft' };
      }
    }
    return { type: 'forage' };
  }

  // Healing if injured and has supplies
  if (injured && champion.inventory.some(i => i.healAmount)) {
    return { type: 'heal' };
  }

  // Rest if exhausted (but brave/impulsive might push through)
  if (exhausted && !(p.bravery > 70 && p.impulsiveness > 60)) {
    return { type: 'rest' };
  }

  // TRADING: Sociable champions might trade with others
  if (p.sociability > 50 && champion.inventory.length > 0 && nearbyNeutrals.length > 0) {
    const tradePartner = nearbyNeutrals.find(t => t.inventory.length > 0 && (champion.relationships[t.id] || 0) > -20);
    if (tradePartner && randomFloat() < 0.15) {
      return { type: 'trade', target: tradePartner };
    }
  }

  // SOCIABLE: More likely to seek alliances (persuasion skill affects chance)
  if (p.sociability > 55 && p.loyalty > 40 && nearbyNeutrals.length > 0) {
    const potential = nearbyNeutrals.find(t => {
      const compatibility = calculateCompatibility(champion, t);
      return compatibility > 0 || t.realm === champion.realm;
    });
    const allyChance = (p.sociability / 150) * persuasionPreference; // Persuasive characters seek alliances more
    if (potential && randomFloat() < allyChance) {
      return { type: 'ally', target: potential };
    }
  }

  // LONER: Prefer solitude, avoid others
  if (p.sociability < 35 && nearbyChampions.length > 0) {
    const quietZone = BATTLEFIELD_ZONES.find(z => z.id !== champion.zone);
    if (quietZone && randomFloat() < 0.4) {
      return { type: 'move', target: quietZone, reason: 'solitude' };
    }
  }

  // Hunt if aggressive and capable
  if (p.aggression > 50 && combatCapable && nearbyChampions.length > 0) {
    const weakTarget = nearbyChampions.find(t => getCombatPower(t) < getCombatPower(champion) * 0.7);
    if (weakTarget && !(p.empathy > 65 && (champion.relationships[weakTarget.id] || 0) > 0)) {
      return { type: 'hunt', target: weakTarget };
    }
  }

  // Move to better zone if in danger
  if (nearbyEnemies.length > 0 && !combatCapable) {
    const saferZone = BATTLEFIELD_ZONES.find(z => z.id !== champion.zone && z.danger < 0.25);
    if (saferZone) {
      return { type: 'move', target: saferZone };
    }
  }

  // CUNNING: Set traps
  if (p.cunning > 55 && champion.inventory.some(i => i.id === 'rope') && randomFloat() < (p.cunning / 200)) {
    return { type: 'trap' };
  }

  // Default actions based on personality
  if (p.bravery > 60 && isStrong && randomFloat() < 0.3) {
    return { type: 'move', target: pick(BATTLEFIELD_ZONES), reason: 'hunting_grounds' };
  }

  // Default foraging - skilled foragers are more likely to choose this
  const forageChance = 0.5 * survivalPreference;
  if (randomFloat() < forageChance) {
    return { type: 'forage' };
  }

  // Random movement (impulsive more likely)
  if (randomFloat() < (0.2 + p.impulsiveness / 200)) {
    return { type: 'move', target: pick(BATTLEFIELD_ZONES) };
  }

  return { type: 'hide' };
}
