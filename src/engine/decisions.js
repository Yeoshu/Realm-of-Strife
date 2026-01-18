// AI decision-making system

import { random, randomFloat, pick } from '../utils';
import { BATTLEFIELD_ZONES, hasRacePassive } from '../constants';
import { areAllies, areEnemies, calculateCompatibility } from './relationships';
import { getCombatPower } from './combat';

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

  // CUNNING + STEALTHY: Ambush instead of direct combat
  if (p.cunning > 60 && champion.stats.stealth > 50 && nearbyEnemies.length > 0) {
    const ambushTarget = nearbyEnemies.find(t => !hasRacePassive(t, 'ambushImmunity'));
    if (ambushTarget && randomFloat() < 0.3) {
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

  // INTIMIDATING: Try to scare off weaker opponents
  if ((p.aggression > 50 || p.pride > 60) && isStrong && nearbyChampions.length > 0) {
    const weakerTarget = nearbyChampions.find(t => getCombatPower(t) < getCombatPower(champion) * 0.7);
    if (weakerTarget && randomFloat() < 0.2) {
      return { type: 'intimidate', target: weakerTarget };
    }
  }

  // EMPATHETIC: Offer mercy to wounded enemies, help allies
  if (p.empathy > 70) {
    // Help wounded allies first
    if (nearbyAllies.length > 0) {
      const needyAlly = nearbyAllies.find(a => a.health < 40 || a.hunger < 30);
      if (needyAlly && champion.inventory.some(i => i.healAmount || i.hungerRestore)) {
        return { type: 'help_ally', target: needyAlly };
      }
    }
    // Offer mercy to badly wounded enemies
    if (nearbyWounded.length > 0 && p.ruthlessness < 40) {
      const mercyTarget = nearbyWounded.find(t => !areAllies(champion, t));
      if (mercyTarget && randomFloat() < 0.3) {
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

  // THEFT: Cunning and desperate or greedy
  if (p.cunning > 50 && champion.stats.stealth > 40 && nearbyChampions.length > 0) {
    const theftTarget = nearbyChampions.find(t => t.inventory.length > 0 && !areAllies(champion, t));
    if (theftTarget) {
      const theftChance = (desperateForFood || desperateForWater) ? 0.4 : (p.ruthlessness > 60 ? 0.2 : 0.1);
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

  // SOCIABLE: More likely to seek alliances
  if (p.sociability > 55 && p.loyalty > 40 && nearbyNeutrals.length > 0) {
    const potential = nearbyNeutrals.find(t => {
      const compatibility = calculateCompatibility(champion, t);
      return compatibility > 0 || t.realm === champion.realm;
    });
    if (potential && randomFloat() < (p.sociability / 150)) {
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

  if (randomFloat() < 0.5) {
    return { type: 'forage' };
  }

  // Random movement (impulsive more likely)
  if (randomFloat() < (0.2 + p.impulsiveness / 200)) {
    return { type: 'move', target: pick(BATTLEFIELD_ZONES) };
  }

  return { type: 'hide' };
}
