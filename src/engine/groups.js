// Group combat and cooperative actions

import { random, randomFloat, pick, clamp } from '../utils';
import { BATTLEFIELD_ZONES, ITEMS, getRacePassiveValue, hasRacePassive, applyRacePassive } from '../constants';
import { getRelationship, modifyRelationship, areAllies } from './relationships';
import { getCombatPower } from './combat';

export function resolveGroupCombat(attackingGroup, defendingGroup, allChampions) {
  const combatLog = [];
  const zone = BATTLEFIELD_ZONES.find(z => z.id === attackingGroup[0]?.zone);

  // Opening log
  const attackerNames = attackingGroup.map(c => c.name).join(', ');
  const defenderNames = defendingGroup.map(c => c.name).join(', ');

  combatLog.push({
    text: `=== GROUP BATTLE: [${attackerNames}] vs [${defenderNames}] ===`,
    type: 'header',
    location: zone?.name || 'Unknown'
  });

  combatLog.push({
    text: `Location: ${zone?.name || 'Unknown Area'}`,
    type: 'info'
  });

  combatLog.push({
    text: `Attackers (${attackingGroup.length}): ${attackingGroup.map(c => `${c.name} [${Math.round(c.health)}HP]`).join(', ')}`,
    type: 'status'
  });

  combatLog.push({
    text: `Defenders (${defendingGroup.length}): ${defendingGroup.map(c => `${c.name} [${Math.round(c.health)}HP]`).join(', ')}`,
    type: 'status'
  });

  // Calculate group strengths
  const getGroupPower = (group) => group.reduce((sum, c) => sum + getCombatPower(c), 0);

  let attackerPower = getGroupPower(attackingGroup);
  let defenderPower = getGroupPower(defendingGroup);

  // Pack hunter bonus for beastkin
  attackingGroup.forEach(c => {
    if (hasRacePassive(c, 'allyDamageBonus')) {
      attackerPower *= 1.15;
    }
  });
  defendingGroup.forEach(c => {
    if (hasRacePassive(c, 'allyDamageBonus')) {
      defenderPower *= 1.15;
    }
  });

  combatLog.push({
    text: `Combined strength: Attackers ${Math.round(attackerPower)} vs Defenders ${Math.round(defenderPower)}`,
    type: 'info'
  });

  // Combat rounds
  const maxRounds = random(4, 10);
  let round = 0;
  const casualties = { attackers: [], defenders: [] };
  const fled = { attackers: [], defenders: [] };

  while (round < maxRounds) {
    round++;

    // Filter to living participants
    const liveAttackers = attackingGroup.filter(c => c.alive && c.health > 0);
    const liveDefenders = defendingGroup.filter(c => c.alive && c.health > 0);

    if (liveAttackers.length === 0 || liveDefenders.length === 0) break;

    combatLog.push({
      text: `--- Round ${round} ---`,
      type: 'round'
    });

    // Each attacker targets a defender
    for (const attacker of liveAttackers) {
      if (attacker.energy < 5) continue;

      const target = liveDefenders.filter(d => d.health > 0)[0] || pick(liveDefenders);
      if (!target || target.health <= 0) continue;

      // Simplified group combat - quicker resolution
      const hitChance = 40 + attacker.stats.combat * 0.4 - target.stats.speed * 0.2;
      if (random(1, 100) <= hitChance) {
        const weapon = attacker.inventory.find(i => i.combatBonus);
        let damage = random(8, 20) + attacker.stats.strength * 0.15;
        if (weapon) damage += weapon.combatBonus * 0.2;

        // Apply race passives
        damage = applyRacePassive(attacker, 'lowHealthDamageBonus', damage, { healthPercent: attacker.health / 100 });
        damage = applyRacePassive(attacker, 'executeBonus', damage, { targetHealthPercent: target.health / 100 });
        damage = applyRacePassive(target, 'flatDamageReduction', damage, {});

        damage = Math.round(damage);
        target.health -= damage;
        attacker.energy -= random(3, 6);

        combatLog.push({
          text: `${attacker.name} strikes ${target.name} for ${damage} damage!`,
          type: damage > 15 ? 'severe_hit' : 'hit',
          attacker: attacker.name,
          defender: target.name,
          damage
        });

        if (target.health <= 0) {
          target.alive = false;
          casualties.defenders.push(target);
          combatLog.push({
            text: `${target.name} falls in battle!`,
            type: 'death'
          });

          attacker.kills++;
          attacker.daysSinceKill = 0;

          // Life steal for vampires
          const lifeSteal = getRacePassiveValue(attacker, 'lifeSteal');
          if (lifeSteal) {
            const heal = Math.round(damage * lifeSteal.value);
            attacker.health = clamp(attacker.health + heal, 0, 100);
          }
        }
      }
    }

    // Defenders counter-attack
    const remainingDefenders = liveDefenders.filter(d => d.health > 0);
    for (const defender of remainingDefenders) {
      if (defender.energy < 5) continue;

      const target = liveAttackers.filter(a => a.health > 0)[0] || pick(liveAttackers);
      if (!target || target.health <= 0) continue;

      const hitChance = 40 + defender.stats.combat * 0.4 - target.stats.speed * 0.2;
      if (random(1, 100) <= hitChance) {
        const weapon = defender.inventory.find(i => i.combatBonus);
        let damage = random(8, 20) + defender.stats.strength * 0.15;
        if (weapon) damage += weapon.combatBonus * 0.2;

        damage = applyRacePassive(defender, 'lowHealthDamageBonus', damage, { healthPercent: defender.health / 100 });
        damage = applyRacePassive(target, 'flatDamageReduction', damage, {});

        damage = Math.round(damage);
        target.health -= damage;
        defender.energy -= random(3, 6);

        combatLog.push({
          text: `${defender.name} strikes back at ${target.name} for ${damage} damage!`,
          type: damage > 15 ? 'severe_hit' : 'hit',
          attacker: defender.name,
          defender: target.name,
          damage
        });

        if (target.health <= 0) {
          target.alive = false;
          casualties.attackers.push(target);
          combatLog.push({
            text: `${target.name} falls in battle!`,
            type: 'death'
          });

          defender.kills++;
          defender.daysSinceKill = 0;
        }
      }
    }

    // Check for rout (one side flees)
    const remainingAttackerPower = getGroupPower(liveAttackers.filter(a => a.health > 0));
    const remainingDefenderPower = getGroupPower(remainingDefenders.filter(d => d.health > 0));

    if (remainingAttackerPower < remainingDefenderPower * 0.4 && randomFloat() < 0.5) {
      combatLog.push({
        text: `The attackers break and flee!`,
        type: 'rout'
      });
      fled.attackers = liveAttackers.filter(a => a.health > 0);
      break;
    }

    if (remainingDefenderPower < remainingAttackerPower * 0.4 && randomFloat() < 0.5) {
      combatLog.push({
        text: `The defenders break and flee!`,
        type: 'rout'
      });
      fled.defenders = remainingDefenders.filter(d => d.health > 0);
      break;
    }
  }

  // Determine overall winner
  const survivingAttackers = attackingGroup.filter(c => c.alive && c.health > 0);
  const survivingDefenders = defendingGroup.filter(c => c.alive && c.health > 0);

  const attackersWon = survivingAttackers.length > 0 &&
    (survivingDefenders.length === 0 || getGroupPower(survivingAttackers) > getGroupPower(survivingDefenders));

  combatLog.push({
    text: `=== BATTLE ENDS ===`,
    type: 'header'
  });

  if (attackersWon) {
    combatLog.push({
      text: `Victory for: ${survivingAttackers.map(c => c.name).join(', ')}`,
      type: 'victory'
    });
  } else if (survivingDefenders.length > 0) {
    combatLog.push({
      text: `Victory for: ${survivingDefenders.map(c => c.name).join(', ')}`,
      type: 'victory'
    });
  } else {
    combatLog.push({
      text: `Both sides have been devastated.`,
      type: 'info'
    });
  }

  combatLog.push({
    text: `Casualties - Attackers: ${casualties.attackers.length}, Defenders: ${casualties.defenders.length}`,
    type: 'status'
  });

  // Update relationships
  [...attackingGroup, ...defendingGroup].forEach(c1 => {
    [...attackingGroup, ...defendingGroup].forEach(c2 => {
      if (c1.id !== c2.id) {
        const sameTeam = (attackingGroup.includes(c1) && attackingGroup.includes(c2)) ||
                         (defendingGroup.includes(c1) && defendingGroup.includes(c2));
        if (sameTeam) {
          modifyRelationship(c1, c2.id, 15, allChampions);
        } else {
          modifyRelationship(c1, c2.id, -25, allChampions);
        }
      }
    });
  });

  return {
    attackersWon,
    casualties,
    fled,
    survivingAttackers,
    survivingDefenders,
    combatLog
  };
}

export function handleGroupHunt(group, target, allChampions) {
  const events = [];

  const hunterNames = group.map(c => c.name).join(' and ');
  events.push({
    type: 'group_action',
    text: `${hunterNames} hunt together, tracking ${target.name}!`,
    severity: 'danger'
  });

  // Check if target has allies nearby who will defend
  const targetAllies = allChampions.filter(c =>
    c.alive && c.id !== target.id && c.zone === target.zone && areAllies(target, c)
  );

  if (targetAllies.length > 0) {
    events.push({
      type: 'group_action',
      text: `${target.name}'s allies rally to defend them!`
    });

    const defendingGroup = [target, ...targetAllies];
    const result = resolveGroupCombat(group, defendingGroup, allChampions);

    events.push({
      type: 'battle',
      text: `A group battle erupts!`,
      combatLog: result.combatLog,
      severity: 'danger'
    });

    // Report casualties
    result.casualties.attackers.forEach(c => {
      events.push({
        type: 'death',
        text: `${c.name} from ${c.realmName} has been slain in the battle!`,
        severity: 'death'
      });
    });
    result.casualties.defenders.forEach(c => {
      events.push({
        type: 'death',
        text: `${c.name} from ${c.realmName} has been slain in the battle!`,
        severity: 'death'
      });
    });
  } else {
    // Just the group vs the lone target
    const result = resolveGroupCombat(group, [target], allChampions);

    events.push({
      type: 'battle',
      text: `${target.name} faces ${group.length} opponents alone!`,
      combatLog: result.combatLog,
      severity: 'danger'
    });

    if (result.casualties.defenders.length > 0) {
      events.push({
        type: 'death',
        text: `${target.name} is overwhelmed and slain!`,
        severity: 'death'
      });
    } else if (result.fled.defenders.length > 0) {
      events.push({
        type: 'action',
        text: `${target.name} manages to escape the hunters!`
      });
      // Move to random zone
      const escapeZone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== target.zone));
      target.zone = escapeZone.id;
    }
  }

  return events;
}

export function handleCooperativeForaging(group, zone) {
  const events = [];

  const names = group.map(c => c.name).join(', ');
  events.push({
    type: 'group_action',
    text: `${names} forage together in ${zone.name}.`
  });

  // Better success rate when foraging together
  const combinedSurvival = group.reduce((sum, c) => sum + c.stats.survival, 0) / group.length;
  const bonusChance = 0.15 * (group.length - 1);

  if (randomFloat() < zone.resourceChance + bonusChance) {
    // Shared food find
    const foodAmount = random(20, 40) + combinedSurvival * 0.3;
    group.forEach(c => {
      c.hunger = clamp(c.hunger + foodAmount / group.length + random(5, 15), 0, 100);
    });

    events.push({
      type: 'resource',
      text: `The group finds a cache of edible plants and shares them!`
    });
  }

  if (randomFloat() < zone.resourceChance + bonusChance) {
    // Shared water find
    const waterAmount = random(25, 45);
    group.forEach(c => {
      c.thirst = clamp(c.thirst + waterAmount / group.length + random(5, 15), 0, 100);
    });

    events.push({
      type: 'resource',
      text: `The group locates a water source and drinks their fill.`
    });
  }

  // Chance to find items (higher with more people)
  if (randomFloat() < 0.15 + bonusChance) {
    const item = pick([...ITEMS.weapons, ...ITEMS.supplies].filter(i => randomFloat() < i.rarity * 1.5));
    if (item) {
      // Give to whoever needs it most
      const recipient = group.reduce((best, c) => {
        if (item.combatBonus && !c.inventory.some(i => i.combatBonus)) return c;
        if (item.healAmount && c.health < best.health) return c;
        if (item.hungerRestore && c.hunger < best.hunger) return c;
        return best;
      }, group[0]);

      recipient.inventory.push({...item});
      events.push({
        type: 'resource',
        text: `The group finds a ${item.name}! ${recipient.name} claims it.`
      });
    }
  }

  // Bonding through cooperation
  group.forEach(c1 => {
    group.forEach(c2 => {
      if (c1.id !== c2.id) {
        modifyRelationship(c1, c2.id, random(3, 8), []);
      }
    });
  });

  return events;
}

export function handleCooperativeDefense(defenders, attacker, allChampions) {
  const events = [];

  const defenderNames = defenders.map(c => c.name).join(' and ');
  events.push({
    type: 'group_action',
    text: `${defenderNames} form a defensive line against ${attacker.name}!`,
    severity: 'warning'
  });

  // Check if attacker has allies
  const attackerAllies = allChampions.filter(c =>
    c.alive && c.id !== attacker.id && c.zone === attacker.zone && areAllies(attacker, c)
  );

  const attackingGroup = [attacker, ...attackerAllies];

  if (attackerAllies.length > 0) {
    events.push({
      type: 'group_action',
      text: `${attacker.name}'s allies join the assault!`
    });
  }

  const result = resolveGroupCombat(attackingGroup, defenders, allChampions);

  events.push({
    type: 'battle',
    text: `${attackingGroup.length} attackers clash with ${defenders.length} defenders!`,
    combatLog: result.combatLog,
    severity: 'danger'
  });

  // Report results
  result.casualties.attackers.forEach(c => {
    events.push({
      type: 'death',
      text: `${c.name} from ${c.realmName} has fallen!`,
      severity: 'death'
    });
  });
  result.casualties.defenders.forEach(c => {
    events.push({
      type: 'death',
      text: `${c.name} from ${c.realmName} has been slain!`,
      severity: 'death'
    });
  });

  if (result.fled.attackers.length > 0) {
    const fledNames = result.fled.attackers.map(c => c.name).join(', ');
    events.push({
      type: 'action',
      text: `${fledNames} flee from the battle!`
    });
    result.fled.attackers.forEach(c => {
      const escapeZone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== c.zone));
      c.zone = escapeZone.id;
    });
  }

  return events;
}

export function handleGroupRest(group, zone) {
  const events = [];

  const names = group.map(c => c.name).join(', ');
  events.push({
    type: 'group_action',
    text: `${names} take turns keeping watch while the others rest.`
  });

  // Better rest with watch rotation
  group.forEach(c => {
    const restBonus = 15 + (group.length - 1) * 5;
    c.energy = clamp(c.energy + restBonus + random(5, 15), 0, 100);

    // Sanity improves with companions
    c.sanity = clamp(c.sanity + random(3, 8), 0, 100);
  });

  events.push({
    type: 'action',
    text: `The group sleeps soundly, protected by their allies.`
  });

  // Small chance of bonding conversations
  if (randomFloat() < 0.3) {
    const [c1, c2] = [pick(group), pick(group)];
    if (c1 && c2 && c1.id !== c2.id) {
      const topics = [
        'their homes',
        'those they left behind',
        'their fears',
        'their hopes for survival',
        'battles past',
        'the cruelty of fate'
      ];
      events.push({
        type: 'social',
        text: `${c1.name} and ${c2.name} talk quietly about ${pick(topics)}.`
      });
      modifyRelationship(c1, c2.id, random(5, 12), []);
      modifyRelationship(c2, c1.id, random(5, 12), []);
    }
  }

  return events;
}

export function handleAllianceSplit(group, allChampions) {
  const events = [];

  // Check for tensions within the group
  let mostTense = null;
  let tensionLevel = 0;

  group.forEach(c1 => {
    group.forEach(c2 => {
      if (c1.id !== c2.id) {
        const rel = getRelationship(c1, c2.id);
        if (rel < tensionLevel) {
          tensionLevel = rel;
          mostTense = [c1, c2];
        }
      }
    });
  });

  if (mostTense && tensionLevel < -20) {
    const [c1, c2] = mostTense;

    events.push({
      type: 'alliance',
      text: `Tension boils over between ${c1.name} and ${c2.name}!`,
      severity: 'warning'
    });

    // Break alliance
    modifyRelationship(c1, c2.id, -30, allChampions);
    modifyRelationship(c2, c1.id, -30, allChampions);

    if (c1.personality.aggression > 60 || c2.personality.aggression > 60) {
      events.push({
        type: 'betrayal',
        text: `Their alliance shatters and they come to blows!`,
        severity: 'danger'
      });
      // Note: Combat resolution would be imported from combat.js
    } else {
      events.push({
        type: 'alliance',
        text: `The alliance fractures. ${c2.name} storms off alone.`
      });
      const escapeZone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== c2.zone));
      c2.zone = escapeZone.id;
    }
  }

  return events;
}

export function handleGroupMorale(group, allChampions) {
  const events = [];

  // Check overall group morale
  const avgSanity = group.reduce((sum, c) => sum + c.sanity, 0) / group.length;
  const avgHealth = group.reduce((sum, c) => sum + c.health, 0) / group.length;

  if (avgSanity < 30 || avgHealth < 30) {
    events.push({
      type: 'morale',
      text: `Despair spreads through the alliance...`
    });

    // Someone might crack
    const weakest = group.reduce((w, c) => c.sanity < w.sanity ? c : w, group[0]);
    if (weakest.sanity < 20 && randomFloat() < 0.3) {
      events.push({
        type: 'breakdown',
        text: `${weakest.name} breaks down, sobbing uncontrollably.`
      });

      // Others might comfort or abandon
      const empathetic = group.filter(c => c.id !== weakest.id && c.personality.empathy > 50);
      if (empathetic.length > 0) {
        const helper = pick(empathetic);
        events.push({
          type: 'social',
          text: `${helper.name} comforts ${weakest.name}, helping them hold on.`
        });
        weakest.sanity = clamp(weakest.sanity + 10, 0, 100);
        modifyRelationship(weakest, helper.id, 20, allChampions);
      }
    }
  } else if (avgSanity > 60 && avgHealth > 60) {
    // Good morale - small sanity boost
    if (randomFloat() < 0.2) {
      events.push({
        type: 'morale',
        text: `The alliance's spirits are high. Together, they feel they might survive this.`
      });
      group.forEach(c => {
        c.sanity = clamp(c.sanity + 3, 0, 100);
      });
    }
  }

  return events;
}
