// Individual action handlers

import { random, randomFloat, pick, clamp, generateId } from '../utils';
import { BATTLEFIELD_ZONES, ITEMS, getRacePassiveValue, hasRacePassive } from '../constants';
import { getRelationship, modifyRelationship, areAllies, areEnemies } from './relationships';
import { resolveCombat, getCombatPower, getWeaponName } from './combat';

export function handleHunting(hunter, nearbyChampions, allChampions) {
  const events = [];

  if (nearbyChampions.length === 0) {
    events.push({ type: 'action', text: `${hunter.name} searches for targets but finds no one.` });
    hunter.energy -= 10;
    return events;
  }

  // Find target - prefer enemies, then weak champions
  let target = nearbyChampions.find(t => areEnemies(hunter, t));
  if (!target) {
    target = nearbyChampions.reduce((weakest, t) =>
      getCombatPower(t) < getCombatPower(weakest) ? t : weakest
    , nearbyChampions[0]);
  }

  // Stealth check - can target evade?
  const stealthCheck = target.stats.stealth + randomFloat() * 30;
  const perceptionCheck = hunter.stats.intelligence * 0.5 + hunter.stats.survival * 0.5 + randomFloat() * 20;

  if (stealthCheck > perceptionCheck && randomFloat() < 0.4) {
    events.push({
      type: 'action',
      text: `${hunter.name} stalks ${target.name}, but ${target.name} slips away unnoticed.`
    });
    hunter.energy -= 15;
    return events;
  }

  // Combat!
  const result = resolveCombat(hunter, target, allChampions);

  if (result.killed) {
    events.push({
      type: 'death',
      text: `${hunter.name} ${pick(['slays', 'kills', 'defeats', 'eliminates'])} ${target.name} from ${target.realmName} in combat!`,
      severity: 'death',
      killer: hunter.name,
      victim: target.name,
      combatLog: result.combatLog,
      combatId: generateId()
    });
  } else {
    events.push({
      type: 'combat',
      text: `${hunter.name} attacks ${target.name}! ${result.winner.name} wins the fight, dealing ${Math.round(result.damage)} damage.`,
      severity: 'danger',
      combatLog: result.combatLog,
      combatId: generateId()
    });

    // Loser flees
    const fleeZone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== target.zone));
    target.zone = fleeZone.id;
    events.push({
      type: 'action',
      text: `${result.loser.name} flees to ${fleeZone.name}.`
    });
  }

  return events;
}

export function handleForaging(champion, zone) {
  const events = [];

  const successChance = (champion.stats.survival / 100) * zone.resourceChance + 0.2;

  if (randomFloat() < successChance) {
    // Find something!
    const findType = randomFloat();

    if (findType < 0.4) {
      // Food
      const foodAmount = random(15, 35);
      champion.hunger = clamp(champion.hunger + foodAmount, 0, 100);
      events.push({
        type: 'resource',
        text: `${champion.name} forages and finds edible plants and berries.`,
        severity: 'success'
      });
    } else if (findType < 0.7) {
      // Water
      const waterAmount = random(20, 40);
      champion.thirst = clamp(champion.thirst + waterAmount, 0, 100);
      events.push({
        type: 'resource',
        text: `${champion.name} finds a source of clean water.`,
        severity: 'success'
      });
    } else {
      // Item!
      const itemPool = randomFloat() < 0.3 ? ITEMS.weapons : ITEMS.supplies;
      const availableItems = itemPool.filter(i => randomFloat() < i.rarity);
      if (availableItems.length > 0) {
        const item = pick(availableItems);
        champion.inventory.push({...item});
        events.push({
          type: 'resource',
          text: `${champion.name} discovers a ${item.name}!`,
          severity: 'success'
        });
      } else {
        champion.hunger = clamp(champion.hunger + 20, 0, 100);
        events.push({ type: 'resource', text: `${champion.name} finds some berries.` });
      }
    }
  } else {
    events.push({ type: 'action', text: `${champion.name} searches but finds nothing useful.` });
  }

  champion.energy -= 12;
  return events;
}

export function handleHiding(champion, zone) {
  const events = [];

  champion.energy = clamp(champion.energy + 15, 0, 100);
  champion.sanity = clamp(champion.sanity + 5, 0, 100);

  const quality = champion.stats.stealth > 60 ? 'expertly' : champion.stats.stealth > 40 ? 'carefully' : 'nervously';
  events.push({
    type: 'action',
    text: `${champion.name} ${quality} conceals themselves in ${zone.name}.`
  });

  return events;
}

export function handleMovement(champion, targetZone) {
  const events = [];

  const oldZone = BATTLEFIELD_ZONES.find(z => z.id === champion.zone);
  champion.zone = targetZone.id;
  champion.energy -= 15;

  events.push({
    type: 'movement',
    text: `${champion.name} travels from ${oldZone.name} to ${targetZone.name}.`
  });

  // Travel danger
  if (randomFloat() < 0.15) {
    const damage = random(5, 15);
    champion.health -= damage;
    events.push({
      type: 'hazard',
      text: `${champion.name} is injured during the journey.`,
      severity: 'warning'
    });
  }

  return events;
}

export function handleAllianceAttempt(champion, target, allChampions) {
  const events = [];

  // Success based on charisma and existing relationship
  const currentRel = getRelationship(champion, target.id);
  const successChance = (champion.stats.charisma / 100) * 0.5 + (currentRel + 50) / 200 + 0.1;

  // Same realm bonus
  const realmBonus = champion.realm === target.realm ? 0.2 : 0;

  if (randomFloat() < successChance + realmBonus) {
    modifyRelationship(champion, target.id, 35, allChampions);
    modifyRelationship(target, champion.id, 35, allChampions);

    events.push({
      type: 'alliance',
      text: `${champion.name} and ${target.name} form an alliance!`,
      severity: 'success'
    });
  } else {
    modifyRelationship(champion, target.id, -10, allChampions);
    events.push({
      type: 'action',
      text: `${champion.name} attempts to ally with ${target.name}, but is rebuffed.`
    });
  }

  return events;
}

export function handleBetrayal(betrayer, victim, allChampions) {
  const events = [];

  // Surprise attack bonus
  const surpriseBonus = 20;
  const originalCombat = betrayer.stats.combat;
  betrayer.stats.combat += surpriseBonus;

  const result = resolveCombat(betrayer, victim, allChampions);

  betrayer.stats.combat = originalCombat;

  // Massive relationship penalties
  modifyRelationship(betrayer, victim.id, -80, allChampions);
  modifyRelationship(victim, betrayer.id, -100, allChampions);

  // Everyone who knew of the alliance loses trust in betrayer
  allChampions.filter(t => t.alive && t.id !== betrayer.id).forEach(t => {
    if (areAllies(t, victim)) {
      modifyRelationship(t, betrayer.id, -50, allChampions);
    }
  });

  if (result.killed) {
    events.push({
      type: 'death',
      text: `${betrayer.name} BETRAYS and kills their ally ${victim.name}! The audience gasps in shock.`,
      severity: 'death',
      killer: betrayer.name,
      victim: victim.name,
      combatLog: result.combatLog,
      combatId: generateId()
    });
    betrayer.popularity += 15;
    betrayer.sanity -= 25;
  } else {
    events.push({
      type: 'combat',
      text: `${betrayer.name} attempts to betray ${victim.name}! The attack wounds but does not kill.`,
      severity: 'danger',
      combatLog: result.combatLog,
      combatId: generateId()
    });

    victim.zone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== victim.zone)).id;
  }

  return events;
}

export function handleHealing(champion) {
  const events = [];

  const healItem = champion.inventory.find(i => i.healAmount);
  if (healItem) {
    champion.health = clamp(champion.health + healItem.healAmount, 0, 100);
    champion.inventory = champion.inventory.filter(i => i !== healItem);
    events.push({
      type: 'action',
      text: `${champion.name} uses their ${healItem.name} to treat their wounds.`,
      severity: 'success'
    });
  }

  return events;
}

export function handleResting(champion, zone) {
  const events = [];

  const restAmount = 25 + (champion.inventory.some(i => i.restBonus) ? 15 : 0);
  champion.energy = clamp(champion.energy + restAmount, 0, 100);
  champion.sanity = clamp(champion.sanity + 10, 0, 100);

  // Danger while sleeping
  if (randomFloat() < zone.danger * 0.3) {
    events.push({
      type: 'hazard',
      text: `${champion.name}'s rest is disturbed by ${pick(['strange noises', 'battlefield mutations', 'shifting terrain', 'distant screams'])}.`,
      severity: 'warning'
    });
    champion.sanity -= 10;
  } else {
    events.push({
      type: 'action',
      text: `${champion.name} finds a moment of peace to rest in ${zone.name}.`
    });
  }

  return events;
}

export function handleHelpAlly(champion, ally, allChampions) {
  const events = [];

  const healItem = champion.inventory.find(i => i.healAmount);
  const foodItem = champion.inventory.find(i => i.hungerRestore);
  const waterItem = champion.inventory.find(i => i.thirstRestore);

  if (healItem && ally.health < 50) {
    ally.health = clamp(ally.health + Math.round(healItem.healAmount * 0.7), 0, 100);
    champion.inventory = champion.inventory.filter(i => i !== healItem);

    events.push({
      type: 'alliance',
      text: `${champion.name} tends to ${ally.name}'s wounds, sharing their ${healItem.name}.`,
      severity: 'success'
    });

    modifyRelationship(ally, champion.id, 25, allChampions);
    modifyRelationship(champion, ally.id, 10, allChampions);
    champion.popularity += 5;
  } else if (foodItem && ally.hunger < 40) {
    ally.hunger = clamp(ally.hunger + Math.round(foodItem.hungerRestore * 0.6), 0, 100);
    champion.inventory = champion.inventory.filter(i => i !== foodItem);

    events.push({
      type: 'alliance',
      text: `${champion.name} shares food with ${ally.name}.`,
      severity: 'success'
    });

    modifyRelationship(ally, champion.id, 15, allChampions);
  } else if (waterItem && ally.thirst < 40) {
    ally.thirst = clamp(ally.thirst + Math.round(waterItem.thirstRestore * 0.6), 0, 100);
    champion.inventory = champion.inventory.filter(i => i !== waterItem);

    events.push({
      type: 'alliance',
      text: `${champion.name} shares water with ${ally.name}.`,
      severity: 'success'
    });

    modifyRelationship(ally, champion.id, 15, allChampions);
  } else {
    events.push({
      type: 'action',
      text: `${champion.name} stays close to ${ally.name}, keeping watch.`
    });

    ally.sanity = clamp(ally.sanity + 5, 0, 100);
    modifyRelationship(ally, champion.id, 5, allChampions);
  }

  return events;
}

export function handleTrapSetting(champion, zone, allChampions) {
  const events = [];

  champion.energy -= 20;

  events.push({
    type: 'action',
    text: `${champion.name} sets up traps in ${zone.name}.`
  });

  // Small chance trap triggers on someone passing through
  const passerby = allChampions.find(t => t.alive && t.id !== champion.id && t.zone === champion.zone);
  if (passerby && randomFloat() < 0.25) {
    const evadeChance = passerby.stats.intelligence / 100 * 0.5 + passerby.stats.speed / 100 * 0.3;
    if (randomFloat() > evadeChance) {
      const damage = random(15, 30);
      passerby.health -= damage;
      passerby.injuries.push({ type: 'trap wound', severity: 'moderate', daysLeft: random(2, 4) });

      events.push({
        type: 'hazard',
        text: `${passerby.name} stumbles into ${champion.name}'s trap and takes ${damage} damage!`,
        severity: 'danger'
      });

      modifyRelationship(passerby, champion.id, -40, allChampions);
    }
  }

  return events;
}

export function handleTheft(champion, target, allChampions) {
  const events = [];

  if (target.inventory.length === 0) {
    events.push({
      type: 'action',
      text: `${champion.name} tries to steal from ${target.name}, but they have nothing worth taking.`
    });
    return events;
  }

  champion.energy -= 15;

  // Stealth vs awareness check
  const stealthRoll = champion.stats.stealth + champion.stats.cunning * 0.3 + randomFloat() * 30;
  let awarenessRoll = target.stats.intelligence + target.stats.survival * 0.3 + randomFloat() * 30;

  // Race passive - keen senses makes theft harder
  const keenSenses = getRacePassiveValue(target, 'detectionBonus');
  const awarenessBonus = keenSenses ? awarenessRoll * (1 + keenSenses.value) : awarenessRoll;

  if (stealthRoll > awarenessBonus) {
    // Successful theft
    const stolenItem = pick(target.inventory);
    target.inventory = target.inventory.filter(i => i !== stolenItem);
    champion.inventory.push(stolenItem);

    events.push({
      type: 'theft',
      text: `${champion.name} stealthily steals ${stolenItem.name} from ${target.name}!`,
      severity: 'warning'
    });

    // They might notice later
    if (randomFloat() < 0.4) {
      modifyRelationship(target, champion.id, -30, allChampions);
      events.push({
        type: 'social',
        text: `${target.name} realizes they've been robbed and suspects ${champion.name}.`
      });
    }
  } else {
    // Caught!
    events.push({
      type: 'confrontation',
      text: `${target.name} catches ${champion.name} trying to steal from them!`,
      severity: 'danger'
    });

    modifyRelationship(target, champion.id, -50, allChampions);

    // Might escalate to combat
    if (target.personality.aggression > 50 || target.personality.pride > 60) {
      events.push({
        type: 'action',
        text: `${target.name} attacks ${champion.name} in retaliation!`
      });
      events.push(...resolveCombatEvents(target, champion, allChampions));
    }
  }

  return events;
}

// Helper function for theft combat
function resolveCombatEvents(attacker, defender, allChampions) {
  const result = resolveCombat(attacker, defender, allChampions);
  const events = [];

  if (result.killed) {
    events.push({
      type: 'death',
      text: `${result.winner.name} kills ${result.loser.name}!`,
      severity: 'death',
      combatLog: result.combatLog,
      combatId: generateId()
    });
  } else {
    events.push({
      type: 'combat',
      text: `${result.winner.name} wins the fight!`,
      severity: 'danger',
      combatLog: result.combatLog,
      combatId: generateId()
    });
  }

  return events;
}

export function handleSabotage(champion, target, allChampions) {
  const events = [];

  champion.energy -= 20;

  const cunningCheck = champion.stats.cunning + champion.stats.stealth * 0.3 + randomFloat() * 20;

  if (cunningCheck > 55) {
    const sabotageType = pick(['poison_supplies', 'damage_weapon', 'false_trail', 'spoil_water']);

    switch (sabotageType) {
      case 'poison_supplies':
        if (target.inventory.some(i => i.hungerRestore)) {
          events.push({
            type: 'sabotage',
            text: `${champion.name} poisons ${target.name}'s food supplies!`,
            severity: 'danger'
          });
          target.poisoned = true;
        }
        break;

      case 'damage_weapon':
        const weapon = target.inventory.find(i => i.combatBonus);
        if (weapon) {
          weapon.combatBonus = Math.max(5, weapon.combatBonus - 10);
          events.push({
            type: 'sabotage',
            text: `${champion.name} sabotages ${target.name}'s ${weapon.name}, weakening it!`,
            severity: 'warning'
          });
        }
        break;

      case 'false_trail':
        events.push({
          type: 'sabotage',
          text: `${champion.name} leaves a false trail to lead enemies toward ${target.name}.`
        });
        target.exposed = (target.exposed || 0) + 30;
        break;

      case 'spoil_water':
        if (target.inventory.some(i => i.thirstRestore)) {
          events.push({
            type: 'sabotage',
            text: `${champion.name} contaminates ${target.name}'s water supply!`,
            severity: 'danger'
          });
          target.waterPoisoned = true;
        }
        break;
    }
  } else {
    events.push({
      type: 'action',
      text: `${champion.name} attempts to sabotage ${target.name} but fails.`
    });
  }

  return events;
}

export function handleTaunt(champion, target, allChampions) {
  const events = [];

  const charismaCheck = champion.stats.charisma + champion.personality.pride * 0.3;
  const willCheck = target.stats.intelligence + target.personality.pride * 0.2;

  const tauntLines = [
    `"Your realm will weep when I send you home in pieces!"`,
    `"I've seen peasants fight better than you!"`,
    `"The gods themselves laugh at your weakness!"`,
    `"Your ancestors are ashamed of you!"`,
    `"Run while you can, coward!"`
  ];

  events.push({
    type: 'taunt',
    text: `${champion.name} taunts ${target.name}: ${pick(tauntLines)}`
  });

  if (charismaCheck > willCheck && randomFloat() < 0.6) {
    modifyRelationship(target, champion.id, -25, allChampions);

    if (target.personality.impulsiveness > 50 || target.personality.pride > 60) {
      target.sanity -= random(5, 15);
      events.push({
        type: 'social',
        text: `${target.name} is enraged by the mockery!`
      });

      if (target.personality.impulsiveness > 70 && randomFloat() < 0.4) {
        events.push({
          type: 'action',
          text: `${target.name} charges at ${champion.name} in blind fury!`
        });
        target.energy -= 10;
        events.push(...resolveCombatEvents(target, champion, allChampions));
      }
    }
  } else {
    events.push({
      type: 'social',
      text: `${target.name} ignores the provocation.`
    });
  }

  return events;
}

export function handleMercyOffer(champion, target, allChampions) {
  const events = [];

  if (target.health > 30) {
    return events;
  }

  events.push({
    type: 'mercy',
    text: `${champion.name} offers mercy to the wounded ${target.name}.`,
    severity: 'success'
  });

  const acceptChance = (100 - target.personality.pride) / 100 * 0.5 +
                       target.personality.cunning / 100 * 0.3 +
                       (target.health < 20 ? 0.3 : 0);

  if (randomFloat() < acceptChance) {
    events.push({
      type: 'mercy',
      text: `${target.name} accepts the mercy and swears not to harm ${champion.name}.`,
      severity: 'success'
    });

    modifyRelationship(target, champion.id, 40, allChampions);
    modifyRelationship(champion, target.id, 20, allChampions);
    champion.popularity += 15;

    if (champion.personality.empathy > 60) {
      champion.sanity = clamp(champion.sanity + 10, 0, 100);
    }
  } else {
    if (target.personality.pride > 70) {
      events.push({
        type: 'social',
        text: `${target.name} spits at ${champion.name}'s feet. "I need no mercy from the likes of you!"`
      });
      modifyRelationship(target, champion.id, -20, allChampions);
    } else {
      if (target.personality.cunning > 60 && randomFloat() < 0.4) {
        events.push({
          type: 'betrayal',
          text: `${target.name} pretends to accept, then attacks ${champion.name} when their guard is down!`,
          severity: 'danger'
        });
        events.push(...resolveCombatEvents(target, champion, allChampions));
      } else {
        events.push({
          type: 'social',
          text: `${target.name} refuses mercy and limps away.`
        });
      }
    }
  }

  return events;
}

export function handleAmbush(champion, target, allChampions) {
  const events = [];

  // Check if target can be ambushed (beastkin are immune)
  if (hasRacePassive(target, 'ambushImmunity')) {
    events.push({
      type: 'action',
      text: `${champion.name} tries to ambush ${target.name}, but their feral senses detect the trap!`
    });
    modifyRelationship(target, champion.id, -30, allChampions);
    return events;
  }

  champion.energy -= 25;

  // Stealth vs awareness
  const stealthRoll = champion.stats.stealth + champion.stats.cunning * 0.3 + randomFloat() * 20;
  let awarenessRoll = target.stats.intelligence + target.stats.survival * 0.3 + randomFloat() * 20;

  const keenSenses = getRacePassiveValue(target, 'detectionBonus');
  if (keenSenses) {
    awarenessRoll *= (1 + keenSenses.value);
  }

  if (stealthRoll > awarenessRoll) {
    events.push({
      type: 'ambush',
      text: `${champion.name} ambushes ${target.name} from the shadows!`,
      severity: 'danger'
    });

    // Deal damage before combat starts
    const ambushDamage = random(15, 30) + champion.stats.strength * 0.2;
    target.health -= ambushDamage;

    events.push({
      type: 'combat',
      text: `${target.name} takes ${Math.round(ambushDamage)} damage from the surprise attack!`
    });

    if (target.health <= 0) {
      target.alive = false;
      champion.kills++;
      champion.daysSinceKill = 0;
      events.push({
        type: 'death',
        text: `${target.name} is slain before they can react!`,
        severity: 'death'
      });
    } else {
      target.energy -= 20;
      events.push(...resolveCombatEvents(champion, target, allChampions));
    }
  } else {
    events.push({
      type: 'action',
      text: `${target.name} spots ${champion.name} trying to sneak up on them!`
    });
    modifyRelationship(target, champion.id, -30, allChampions);
  }

  return events;
}

export function handleTrade(champion, target, allChampions) {
  const events = [];

  if (champion.inventory.length === 0 || target.inventory.length === 0) {
    return events;
  }

  const relationship = getRelationship(champion, target.id);
  const willingness = relationship + target.personality.sociability - target.personality.aggression;

  if (willingness < 0 && randomFloat() < 0.7) {
    events.push({
      type: 'social',
      text: `${target.name} refuses to trade with ${champion.name}.`
    });
    return events;
  }

  const championItem = pick(champion.inventory);
  const targetItem = pick(target.inventory);

  const championNeeds = !champion.inventory.some(i => i.hungerRestore) && targetItem.hungerRestore;
  const targetNeeds = !target.inventory.some(i => i.combatBonus) && championItem.combatBonus;

  if (championNeeds || targetNeeds || randomFloat() < 0.4) {
    champion.inventory = champion.inventory.filter(i => i !== championItem);
    target.inventory = target.inventory.filter(i => i !== targetItem);
    champion.inventory.push(targetItem);
    target.inventory.push(championItem);

    events.push({
      type: 'trade',
      text: `${champion.name} trades ${championItem.name} for ${target.name}'s ${targetItem.name}.`,
      severity: 'success'
    });

    modifyRelationship(champion, target.id, 10, allChampions);
    modifyRelationship(target, champion.id, 10, allChampions);
  } else {
    events.push({
      type: 'social',
      text: `${champion.name} and ${target.name} discuss trading but can't reach a deal.`
    });
  }

  return events;
}

export function handleIntimidation(champion, target, allChampions) {
  const events = [];

  const intimidationBonus = getRacePassiveValue(champion, 'intimidation');
  const baseIntimidate = champion.stats.strength + champion.stats.charisma * 0.3 + champion.kills * 5;
  const intimidateCheck = baseIntimidate + (intimidationBonus ? intimidationBonus.value * 100 : 0);

  const resistCheck = target.personality.bravery + target.stats.combat * 0.3 +
                      (target.personality.pride > 70 ? 20 : 0);

  const intimidateLines = [
    `"Leave now, or die where you stand."`,
    `"I've killed stronger than you. Walk away."`,
    `"This is your only warning."`,
    `"Your equipment would look better on me. Give it up."`,
    `"I can smell your fear."`
  ];

  events.push({
    type: 'intimidation',
    text: `${champion.name} tries to intimidate ${target.name}: ${pick(intimidateLines)}`
  });

  if (intimidateCheck > resistCheck) {
    if (target.personality.bravery < 40) {
      const escapeZone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== target.zone));
      target.zone = escapeZone.id;
      events.push({
        type: 'social',
        text: `${target.name} is terrified and flees to ${escapeZone.name}!`,
        severity: 'warning'
      });
    } else if (randomFloat() < 0.5 && target.inventory.length > 0) {
      const droppedItem = pick(target.inventory);
      target.inventory = target.inventory.filter(i => i !== droppedItem);
      champion.inventory.push(droppedItem);
      events.push({
        type: 'social',
        text: `${target.name}, unnerved, drops their ${droppedItem.name} and backs away.`
      });
    } else {
      events.push({
        type: 'social',
        text: `${target.name} backs down, avoiding ${champion.name}'s gaze.`
      });
    }

    modifyRelationship(target, champion.id, -20, allChampions);
    target.sanity -= random(5, 10);

    if (hasRacePassive(champion, 'combatSanityDamage')) {
      const sanityDmg = getRacePassiveValue(champion, 'combatSanityDamage');
      target.sanity -= sanityDmg.value;
      events.push({
        type: 'horror',
        text: `The unnatural presence of ${champion.name} shakes ${target.name}'s sanity!`
      });
    }
  } else {
    events.push({
      type: 'social',
      text: `${target.name} stands their ground, unimpressed.`
    });

    if (target.personality.pride > 70) {
      modifyRelationship(target, champion.id, -15, allChampions);
    }
  }

  return events;
}

export function handleChallenge(champion, target, allChampions) {
  const events = [];

  const challengeLines = [
    `challenges ${target.name} to single combat!`,
    `demands ${target.name} face them in honorable battle!`,
    `throws down the gauntlet before ${target.name}!`,
    `calls out ${target.name} for a duel to the death!`
  ];

  events.push({
    type: 'challenge',
    text: `${champion.name} ${pick(challengeLines)}`,
    severity: 'warning'
  });

  const acceptChance = (target.personality.pride / 100) * 0.4 +
                       (target.personality.bravery / 100) * 0.3 +
                       (getCombatPower(target) > getCombatPower(champion) * 0.8 ? 0.3 : 0);

  if (target.personality.pride > 70 || randomFloat() < acceptChance) {
    events.push({
      type: 'challenge',
      text: `${target.name} accepts the challenge!`
    });

    champion.energy = clamp(champion.energy + 10, 0, 100);
    target.energy = clamp(target.energy + 10, 0, 100);

    const result = resolveCombat(champion, target, allChampions);

    if (result.killed) {
      events.push({
        type: 'death',
        text: `${result.winner.name} is victorious! ${result.loser.name} has fallen!`,
        severity: 'death',
        combatLog: result.combatLog,
        combatId: generateId()
      });
    } else {
      events.push({
        type: 'combat',
        text: `${result.winner.name} wins the duel!`,
        severity: 'danger',
        combatLog: result.combatLog,
        combatId: generateId()
      });
    }

    const winner = champion.alive ? champion : target;
    if (winner.alive) {
      winner.popularity += 15;
      events.push({
        type: 'social',
        text: `${winner.name} is victorious! Their fame spreads across the battlefield.`
      });
    }
  } else {
    events.push({
      type: 'social',
      text: `${target.name} refuses the challenge, slipping away.`
    });

    target.popularity -= 10;
    champion.popularity += 5;
  }

  return events;
}

export function handleGossip(champion, listener, aboutTarget, allChampions) {
  const events = [];

  if (!aboutTarget || aboutTarget.id === listener.id || aboutTarget.id === champion.id) {
    return events;
  }

  const gossipTypes = [
    { type: 'negative', text: `whispers to ${listener.name} about ${aboutTarget.name}'s cowardice.`, effect: -15 },
    { type: 'negative', text: `tells ${listener.name} that ${aboutTarget.name} cannot be trusted.`, effect: -20 },
    { type: 'negative', text: `warns ${listener.name} that ${aboutTarget.name} plans to betray them.`, effect: -25 },
    { type: 'positive', text: `speaks well of ${aboutTarget.name} to ${listener.name}.`, effect: 15 },
    { type: 'neutral', text: `shares information about ${aboutTarget.name}'s location with ${listener.name}.`, effect: 0 }
  ];

  const gossip = pick(gossipTypes.filter(g =>
    champion.personality.cunning > 50 || g.type !== 'negative'
  ));

  events.push({
    type: 'gossip',
    text: `${champion.name} ${gossip.text}`
  });

  const believeChance = 0.5 + (champion.stats.charisma - listener.stats.intelligence) / 200;

  if (randomFloat() < believeChance) {
    modifyRelationship(listener, aboutTarget.id, gossip.effect, allChampions);

    if (gossip.effect < -15) {
      events.push({
        type: 'social',
        text: `${listener.name} believes the gossip and grows suspicious of ${aboutTarget.name}.`
      });
    }
  }

  modifyRelationship(listener, champion.id, 5, allChampions);

  return events;
}

export function handleEnvironmentalHazard(champion, zone) {
  const events = [];

  const hazards = {
    central_keep: ['Abandoned trap', 'collapsing supply crate'],
    darkwood: ['falling branch', 'poisonous plant', 'hidden pit'],
    mirror_lake: ['sudden current', 'water predator', 'slippery rocks'],
    caverns: ['cave-in', 'toxic gas pocket', 'underground creature'],
    ruins: ['collapsing wall', 'hidden spike trap', 'unstable floor'],
    swamp: ['quicksand', 'venomous snake', 'toxic gas'],
    highlands: ['rockslide', 'crumbling ledge', 'strong winds'],
    meadow: ['sudden storm', 'battlefield fire', 'dire wolves']
  };

  const hazard = pick(hazards[zone.id] || ['unexpected danger']);

  const survivalCheck = champion.stats.survival + champion.stats.speed * 0.3 + randomFloat() * 30;

  if (survivalCheck > 60) {
    events.push({
      type: 'hazard',
      text: `${champion.name} narrowly avoids a ${hazard}.`
    });
  } else {
    const damage = random(10, 30);
    champion.health -= damage;

    if (champion.health <= 0) {
      champion.alive = false;
      events.push({
        type: 'death',
        text: `${champion.name} from ${champion.realmName} is killed by a ${hazard}.`,
        severity: 'death'
      });
    } else {
      champion.injuries.push({ type: hazard, severity: damage > 20 ? 'severe' : 'moderate', daysLeft: random(2, 4) });
      events.push({
        type: 'hazard',
        text: `${champion.name} is injured by a ${hazard}, taking ${damage} damage.`,
        severity: 'danger'
      });
    }
  }

  return events;
}

export function handlePatronGift(champion) {
  const events = [];

  const giftQuality = champion.popularity > 60 ? 'premium' : champion.popularity > 30 ? 'standard' : 'basic';

  let gift;
  if (giftQuality === 'premium') {
    gift = pick([...ITEMS.weapons.filter(w => w.combatBonus > 18), ...ITEMS.supplies.filter(s => s.healAmount > 30)]);
  } else if (giftQuality === 'standard') {
    gift = pick([...ITEMS.supplies]);
  } else {
    gift = { id: 'basic_food', name: 'bread and cheese', hungerRestore: 30 };
  }

  if (gift.hungerRestore) {
    champion.hunger = clamp(champion.hunger + gift.hungerRestore, 0, 100);
  } else {
    champion.inventory.push({...gift});
  }

  events.push({
    type: 'patron',
    text: `A raven delivers a gift! ${champion.name} receives ${gift.name} from a patron.`,
    severity: 'success'
  });

  return events;
}

export function handleLowSanity(champion, allChampions) {
  const events = [];

  const effects = [
    { type: 'hallucination', text: `${champion.name} screams at shadows, revealing their position.` },
    { type: 'paranoia', text: `${champion.name} becomes increasingly paranoid and erratic.` },
    { type: 'breakdown', text: `${champion.name} breaks down crying, overwhelmed by the battlefield.` },
    { type: 'reckless', text: `${champion.name}'s sanity slips, making them dangerously unpredictable.` }
  ];

  const effect = pick(effects);
  events.push({
    type: 'psychological',
    text: effect.text,
    severity: 'warning'
  });

  if (effect.type === 'paranoia' && champion.personality.aggression > 50) {
    const nearbyAlly = allChampions.find(t => t.alive && t.zone === champion.zone && areAllies(champion, t));
    if (nearbyAlly && randomFloat() < 0.2) {
      events.push({
        type: 'action',
        text: `In their paranoid state, ${champion.name} lashes out at ${nearbyAlly.name}!`
      });
      modifyRelationship(champion, nearbyAlly.id, -30, allChampions);
      modifyRelationship(nearbyAlly, champion.id, -40, allChampions);
    }
  }

  return events;
}

export function handleRandomEncounter(champion, nearbyChampions, allChampions) {
  const events = [];
  const other = pick(nearbyChampions);

  if (!other || !other.alive) return events;

  const relationship = getRelationship(champion, other.id);
  const encounterType = pick([
    'glance', 'avoid', 'nod', 'stare_down', 'recognize', 'share_fire',
    'hear_scream', 'find_tracks', 'witness', 'cross_paths'
  ]);

  switch (encounterType) {
    case 'glance':
      events.push({
        type: 'encounter',
        text: `${champion.name} and ${other.name} catch sight of each other across ${BATTLEFIELD_ZONES.find(z => z.id === champion.zone)?.name}.`
      });
      if (relationship < -30) {
        events.push({
          type: 'social',
          text: `Hatred passes between them silently.`
        });
      }
      break;

    case 'avoid':
      if (champion.personality.sociability < 50 || relationship < 0) {
        events.push({
          type: 'encounter',
          text: `${champion.name} spots ${other.name} and deliberately moves to avoid them.`
        });
      }
      break;

    case 'nod':
      if (relationship > 20) {
        events.push({
          type: 'encounter',
          text: `${champion.name} and ${other.name} exchange a respectful nod as they pass.`
        });
        modifyRelationship(champion, other.id, 3, allChampions);
        modifyRelationship(other, champion.id, 3, allChampions);
      }
      break;

    case 'stare_down':
      if (champion.personality.pride > 50 && other.personality.pride > 50) {
        events.push({
          type: 'encounter',
          text: `${champion.name} and ${other.name} lock eyes in a tense stare-down. Neither backs away.`
        });
        if (randomFloat() < 0.2) {
          modifyRelationship(champion, other.id, -10, allChampions);
          modifyRelationship(other, champion.id, -10, allChampions);
        }
      }
      break;

    case 'recognize':
      if (champion.realm === other.realm) {
        events.push({
          type: 'encounter',
          text: `${champion.name} recognizes ${other.name} from back home in ${champion.realmName}.`
        });
        modifyRelationship(champion, other.id, 5, allChampions);
      }
      break;

    case 'share_fire':
      if (relationship > 10 && champion.personality.sociability > 40) {
        events.push({
          type: 'encounter',
          text: `${champion.name} and ${other.name} share a fire in silence, an unspoken truce.`
        });
        champion.energy = clamp(champion.energy + 5, 0, 100);
        other.energy = clamp(other.energy + 5, 0, 100);
        modifyRelationship(champion, other.id, 8, allChampions);
        modifyRelationship(other, champion.id, 8, allChampions);
      }
      break;

    case 'hear_scream':
      const deadChampions = allChampions.filter(t => !t.alive);
      if (deadChampions.length > 0) {
        events.push({
          type: 'atmosphere',
          text: `${champion.name} hears a distant scream echoing across the battlefield.`
        });
        champion.sanity -= random(2, 5);
      }
      break;

    case 'find_tracks':
      events.push({
        type: 'encounter',
        text: `${champion.name} finds fresh tracks - ${other.name} passed through here recently.`
      });
      break;

    case 'witness':
      if (other.inventory.length > 2) {
        events.push({
          type: 'encounter',
          text: `${champion.name} observes that ${other.name} is well-supplied.`
        });
      } else if (other.health < 40) {
        events.push({
          type: 'encounter',
          text: `${champion.name} notices ${other.name} is wounded and limping.`
        });
      }
      break;

    case 'cross_paths':
      events.push({
        type: 'encounter',
        text: `${champion.name} crosses paths with ${other.name}. They watch each other warily but keep moving.`
      });
      break;
  }

  return events;
}
