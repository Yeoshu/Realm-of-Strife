// Event generation and special events

import { random, randomFloat, pick, shuffle, clamp } from '../utils';
import { BATTLEFIELD_ZONES, ITEMS, getRacePassiveValue, hasRacePassive } from '../constants';
import { modifyRelationship, areAllies } from './relationships';
import { resolveCombat } from './combat';
import { decideAction } from './decisions';
import {
  handleHunting, handleForaging, handleHiding, handleMovement,
  handleAllianceAttempt, handleBetrayal, handleHealing, handleResting,
  handleHelpAlly, handleTrapSetting, handleTheft, handleSabotage,
  handleTaunt, handleMercyOffer, handleAmbush, handleTrade,
  handleIntimidation, handleChallenge, handleGossip,
  handleEnvironmentalHazard, handlePatronGift, handleLowSanity,
  handleRandomEncounter
} from './actions';
import {
  handleGroupHunt, handleCooperativeForaging, handleCooperativeDefense,
  handleGroupRest, handleAllianceSplit, handleGroupMorale
} from './groups';

export function generateEvent(champion, allChampions, day, gameState) {
  const livingChampions = allChampions.filter(t => t.alive && t.id !== champion.id);
  const sameZoneChampions = livingChampions.filter(t => t.zone === champion.zone);
  const zone = BATTLEFIELD_ZONES.find(z => z.id === champion.zone);

  const events = [];

  // Status degradation - check for undead (no hunger/thirst)
  const noHungerThirst = hasRacePassive(champion, 'noHungerThirst');
  if (!noHungerThirst) {
    champion.hunger -= random(8, 15);
    champion.thirst -= random(10, 18);
  }
  champion.energy -= random(5, 12);
  champion.daysAlive++;
  champion.daysSinceKill = (champion.daysSinceKill || 0) + 1;

  // Race passive - health regeneration (orc)
  const healthRegen = getRacePassiveValue(champion, 'healthRegen');
  if (healthRegen && champion.health < 100) {
    champion.health = clamp(champion.health + healthRegen.value, 0, 100);
  }

  // Race passive - zone damage (vampire/undead in sunlight)
  const zoneDamage = getRacePassiveValue(champion, 'zoneDamage');
  if (zoneDamage && zoneDamage.zones && zoneDamage.zones.includes(champion.zone)) {
    champion.health -= zoneDamage.value;
    events.push({
      type: 'status',
      text: `${champion.name} suffers in the ${zone.name} - their ${champion.raceName} nature weakens them here.`,
      severity: 'warning'
    });
  }

  // Race passive - vampire bloodthirst
  const killRequirement = getRacePassiveValue(champion, 'killRequirement');
  if (killRequirement && champion.daysSinceKill > killRequirement.daysBetween) {
    champion.stats.strength = Math.max(10, champion.stats.strength - 2);
    champion.stats.speed = Math.max(10, champion.stats.speed - 2);
    events.push({
      type: 'status',
      text: `${champion.name} grows weak from bloodthirst...`,
      severity: 'warning'
    });
  }

  // Process injuries - check for undead (ignore injury penalties)
  const ignoreInjuryPenalty = hasRacePassive(champion, 'ignoreInjuryPenalty');
  champion.injuries = champion.injuries.filter(injury => {
    injury.daysLeft--;
    if (injury.daysLeft <= 0) {
      events.push({ type: 'recovery', text: `${champion.name}'s ${injury.type} has healed.` });
      return false;
    }
    if (!ignoreInjuryPenalty) {
      champion.health -= injury.severity === 'severe' ? 8 : injury.severity === 'moderate' ? 4 : 2;
    }
    return true;
  });

  // Starvation/dehydration (skip for undead)
  if (!noHungerThirst) {
    if (champion.hunger <= 0) {
      champion.health -= 15;
      events.push({ type: 'status', text: `${champion.name} is starving!`, severity: 'danger' });
    }
    if (champion.thirst <= 0) {
      champion.health -= 20;
      events.push({ type: 'status', text: `${champion.name} is dying of thirst!`, severity: 'danger' });
    }
  }

  // Race passive - death save (halfling luck)
  const deathSave = getRacePassiveValue(champion, 'deathSave');

  // Check for death from status
  if (champion.health <= 0) {
    if (deathSave && randomFloat() < deathSave.value) {
      champion.health = 1;
      events.push({
        type: 'miracle',
        text: `${champion.name} miraculously clings to life through sheer luck!`,
        severity: 'success'
      });
    } else {
      champion.alive = false;
      events.push({
        type: 'death',
        text: `${champion.name} from ${champion.realmName} has died from their injuries and exhaustion.`,
        severity: 'death'
      });
      return events;
    }
  }

  // Decide action based on personality and situation
  const action = decideAction(champion, sameZoneChampions, allChampions, day, gameState);

  switch (action.type) {
    case 'hunt':
      events.push(...handleHunting(champion, sameZoneChampions, allChampions));
      break;
    case 'forage':
      events.push(...handleForaging(champion, zone));
      break;
    case 'hide':
      events.push(...handleHiding(champion, zone));
      break;
    case 'move':
      events.push(...handleMovement(champion, action.target));
      break;
    case 'ally':
      events.push(...handleAllianceAttempt(champion, action.target, allChampions));
      break;
    case 'betray':
      events.push(...handleBetrayal(champion, action.target, allChampions));
      break;
    case 'heal':
      events.push(...handleHealing(champion));
      break;
    case 'rest':
      events.push(...handleResting(champion, zone));
      break;
    case 'trap':
      events.push(...handleTrapSetting(champion, zone, allChampions));
      break;
    case 'help_ally':
      events.push(...handleHelpAlly(champion, action.target, allChampions));
      break;
    case 'theft':
      events.push(...handleTheft(champion, action.target, allChampions));
      break;
    case 'sabotage':
      events.push(...handleSabotage(champion, action.target, allChampions));
      break;
    case 'taunt':
      events.push(...handleTaunt(champion, action.target, allChampions));
      break;
    case 'mercy':
      events.push(...handleMercyOffer(champion, action.target, allChampions));
      break;
    case 'ambush':
      events.push(...handleAmbush(champion, action.target, allChampions));
      break;
    case 'trade':
      events.push(...handleTrade(champion, action.target, allChampions));
      break;
    case 'intimidate':
      events.push(...handleIntimidation(champion, action.target, allChampions));
      break;
    case 'challenge':
      events.push(...handleChallenge(champion, action.target, allChampions));
      break;
    case 'gossip':
      events.push(...handleGossip(champion, action.listener, action.aboutTarget, allChampions));
      break;
    // Group actions
    case 'group_hunt':
      events.push(...handleGroupHunt(action.group, action.target, allChampions));
      break;
    case 'group_forage':
      events.push(...handleCooperativeForaging(action.group, zone));
      break;
    case 'group_rest':
      events.push(...handleGroupRest(action.group, zone));
      break;
    case 'defend_ally':
      events.push(...handleCooperativeDefense(action.group, action.attacker, allChampions));
      break;
  }

  // Alliance tension and morale checks
  const allyGroup = sameZoneChampions.filter(t => areAllies(champion, t));
  if (allyGroup.length > 0 && randomFloat() < 0.1) {
    const fullGroup = [champion, ...allyGroup];
    if (randomFloat() < 0.5) {
      events.push(...handleGroupMorale(fullGroup, allChampions));
    } else if (randomFloat() < 0.3) {
      events.push(...handleAllianceSplit(fullGroup, allChampions));
    }
  }

  // Random environmental events
  if (randomFloat() < zone.danger * 0.5) {
    events.push(...handleEnvironmentalHazard(champion, zone));
  }

  // Random encounter events between champions in same zone
  if (sameZoneChampions.length > 0 && randomFloat() < 0.15) {
    events.push(...handleRandomEncounter(champion, sameZoneChampions, allChampions));
  }

  // Patron gifts (based on popularity and desperation)
  if (randomFloat() < (champion.popularity / 200) * (champion.health < 40 ? 2 : 1)) {
    events.push(...handlePatronGift(champion));
  }

  // Sanity effects
  if (champion.sanity < 30) {
    events.push(...handleLowSanity(champion, allChampions));
  }

  return events;
}

export function handleDivineIntervention(champions, day, gameState) {
  const events = [];
  const livingChampions = champions.filter(t => t.alive);

  // Feast event - force champions to central_keep
  if (day > 3 && randomFloat() < 0.15) {
    events.push({
      type: 'fate',
      text: 'Heralds announce a gathering at the Central Keep! Supplies have been left for the taking...',
      severity: 'announcement'
    });

    livingChampions.forEach(t => {
      const desperation = (100 - t.health) + (100 - t.hunger) + (100 - t.thirst);
      if (randomFloat() < desperation / 300 + 0.3) {
        t.zone = 'central_keep';
      }
    });

    gameState.feast = true;
  }

  // Battlefield mutation - change zone dangers
  if (day > 2 && randomFloat() < 0.1) {
    const targetZone = pick(BATTLEFIELD_ZONES);
    const newDanger = Math.min(0.8, targetZone.danger + 0.2);
    events.push({
      type: 'fate',
      text: `The Gods unleash new dangers in ${targetZone.name}!`,
      severity: 'announcement'
    });

    // Damage champions in that zone
    livingChampions.filter(t => t.zone === targetZone.id).forEach(t => {
      const damage = random(10, 25);
      t.health -= damage;
      if (t.health <= 0) {
        t.alive = false;
        events.push({
          type: 'death',
          text: `${t.name} from ${t.realmName} is killed by the battlefield mutation!`,
          severity: 'death'
        });
      }
    });
  }

  // Force confrontation if too peaceful
  if (day > 4 && gameState.daysSinceLastDeath > 2) {
    events.push({
      type: 'fate',
      text: 'Wildfire spreads across the realm! Champions are forced toward the center...',
      severity: 'announcement'
    });

    const centralZones = ['central_keep', 'ruins', 'darkwood'];
    livingChampions.forEach(t => {
      if (!centralZones.includes(t.zone)) {
        t.zone = pick(centralZones);
        t.health -= random(5, 15);
      }
    });

    gameState.daysSinceLastDeath = 0;
  }

  return events;
}

export function runOpeningMelee(champions) {
  const events = [];
  const allChampions = [...champions];

  events.push({
    type: 'announcement',
    text: 'THE GRAND TOURNAMENT BEGINS! Champions take their positions on the battlefield...',
    severity: 'announcement'
  });

  events.push({
    type: 'announcement',
    text: 'The war horns sound! The battle begins!',
    severity: 'announcement'
  });

  // Each champion decides: run to central_keep or flee
  const runners = [];
  const grabbers = [];

  allChampions.forEach(champion => {
    const bravery = champion.personality.bravery;
    const combatSkill = champion.stats.combat;
    const goForIt = (bravery + combatSkill) / 2 + randomFloat() * 40;

    if (goForIt > 55) {
      grabbers.push(champion);
    } else {
      runners.push(champion);
    }
  });

  // Runners flee to various zones
  runners.forEach(champion => {
    const escapeZone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== 'central_keep'));
    champion.zone = escapeZone.id;
    events.push({
      type: 'action',
      text: `${champion.name} flees from the Central Keep to ${escapeZone.name}.`
    });

    // Small chance to grab something while running
    if (randomFloat() < 0.3) {
      const basicItem = pick(ITEMS.supplies.filter(s => s.rarity > 0.25));
      if (basicItem) {
        champion.inventory.push({...basicItem});
        events.push({
          type: 'resource',
          text: `${champion.name} grabs a ${basicItem.name} while escaping.`,
          severity: 'success'
        });
      }
    }
  });

  // Grabbers fight for supplies
  shuffle(grabbers).forEach(champion => {
    if (!champion.alive) return;

    // Get items
    const itemCount = Math.floor(champion.stats.speed / 30) + 1;
    for (let i = 0; i < itemCount; i++) {
      const itemPool = randomFloat() < 0.5 ? ITEMS.weapons : ITEMS.supplies;
      const item = pick(itemPool.filter(x => randomFloat() < x.rarity + 0.2));
      if (item) {
        champion.inventory.push({...item});
      }
    }

    if (champion.inventory.length > 0) {
      events.push({
        type: 'resource',
        text: `${champion.name} secures ${champion.inventory.map(i => i.name).join(', ')} from the Central Keep.`,
        severity: 'success'
      });
    }

    // Combat encounters
    const opponents = grabbers.filter(t => t.alive && t.id !== champion.id);
    if (opponents.length > 0 && randomFloat() < 0.5) {
      const opponent = pick(opponents);

      // Quick opening melee combat
      const result = resolveCombat(champion, opponent, allChampions);

      if (result.killed) {
        events.push({
          type: 'death',
          text: `${result.winner.name} ${pick(['cuts down', 'strikes down', 'kills'])} ${result.loser.name} from ${result.loser.realmName} in the opening melee!`,
          severity: 'death',
          killer: result.winner.name,
          victim: result.loser.name,
          combatLog: result.combatLog
        });
      } else {
        events.push({
          type: 'combat',
          text: `${champion.name} and ${opponent.name} clash at the Central Keep! ${result.winner.name} wins the exchange.`,
          severity: 'danger',
          combatLog: result.combatLog
        });
      }
    }
  });

  // Survivors flee central_keep
  grabbers.filter(t => t.alive).forEach(champion => {
    if (randomFloat() < 0.6) {
      const escapeZone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== 'central_keep'));
      champion.zone = escapeZone.id;
    }
  });

  // Knight Order forms
  const knights = allChampions.filter(t => t.alive && (t.realm === 1 || t.realm === 2 || t.realm === 4));
  if (knights.length >= 2) {
    knights.forEach(c1 => {
      knights.forEach(c2 => {
        if (c1.id !== c2.id) {
          modifyRelationship(c1, c2.id, 60, allChampions);
        }
      });
    });
    events.push({
      type: 'alliance',
      text: `The Knight Order forms: ${knights.map(c => c.name).join(', ')} ally together.`,
      severity: 'success'
    });
  }

  // Realm partner bonds
  for (let d = 1; d <= 12; d++) {
    const partners = allChampions.filter(t => t.alive && t.realm === d);
    if (partners.length === 2 && randomFloat() < 0.4) {
      modifyRelationship(partners[0], partners[1].id, 40, allChampions);
      modifyRelationship(partners[1], partners[0].id, 40, allChampions);
    }
  }

  const deaths = allChampions.filter(t => !t.alive).length;
  events.push({
    type: 'announcement',
    text: `The opening melee ends. ${deaths} champions have fallen. ${24 - deaths} remain.`,
    severity: 'announcement'
  });

  return events;
}
