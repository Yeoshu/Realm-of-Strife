// Champion generation

import { random, randomFloat, pick, clamp, generateId } from '../utils';
import { REALM_NAMES, FIRST_NAMES, RACES, CHAMPION_ARCHETYPES, BACKSTORY_TEMPLATES } from '../constants';
import { calculateSkill, calculateProficiency, SKILLS, WEAPON_PROFICIENCY_CATEGORIES } from '../constants/skills';
import { DEITIES, PIETY_THRESHOLDS, ARCHETYPE_DEITY_AFFINITY } from '../constants/deities';
import { modifyRelationship } from './relationships';

export function generateChampion(realm, usedNames) {
  let name;
  do {
    name = pick(FIRST_NAMES);
  } while (usedNames.has(name));
  usedNames.add(name);

  // Select race based on realm and rarity
  const raceEntries = Object.values(RACES);
  const availableRaces = raceEntries.filter(r => {
    // Common races in this realm have higher chance
    const isCommon = r.commonInRealms.includes(realm);
    const chance = isCommon ? r.rarity * 2 : r.rarity;
    return randomFloat() < chance;
  });

  // Default to human if no race selected, otherwise pick from available
  const selectedRace = availableRaces.length > 0 ? pick(availableRaces) : RACES.human;
  const raceBonus = selectedRace.statBonuses || {};

  // Noble realms (1, 2, 4) get stat bonuses
  const isNoble = realm <= 2 || realm === 4;
  const nobleBonus = isNoble ? 15 : 0;

  // Realm-specific bonuses
  const realmBonuses = {
    1: { charisma: 10 },
    2: { strength: 10, combat: 10 },
    3: { intelligence: 15 },
    4: { speed: 10, survival: 5 },
    7: { strength: 5, survival: 10 },
    11: { survival: 15 },
    12: { stealth: 10, survival: 5 }
  };

  const bonus = realmBonuses[realm] || {};

  // Select archetype
  const availableArchetypes = CHAMPION_ARCHETYPES.filter(a =>
    a.realms.includes(realm) && (a.rare ? randomFloat() < 0.2 : true)
  );
  const archetype = pick(availableArchetypes) || CHAMPION_ARCHETYPES[0];

  // Generate base personality with archetype influence
  const personality = {
    aggression: clamp(random(20, 80) + (archetype.traitBias.aggression || 0), 5, 95),
    loyalty: clamp(random(20, 80) + (archetype.traitBias.loyalty || 0), 5, 95),
    cunning: clamp(random(20, 80) + (archetype.traitBias.cunning || 0) + (raceBonus.cunning || 0), 5, 95),
    bravery: clamp(random(20, 80) + (archetype.traitBias.bravery || 0), 5, 95),
    empathy: clamp(random(20, 80) + (archetype.traitBias.empathy || 0) + (raceBonus.empathy || 0), 5, 95),
    pride: clamp(random(20, 80) + (archetype.traitBias.pride || 0), 5, 95),
    ruthlessness: clamp(random(20, 80) + (archetype.traitBias.ruthlessness || 0), 5, 95),
    sociability: clamp(random(20, 80) + (archetype.traitBias.sociability || 0), 5, 95),
    impulsiveness: clamp(random(20, 80) + (archetype.traitBias.impulsiveness || 0), 5, 95),
    vendetta: clamp(random(15, 70) + (archetype.traitBias.vendetta || 0), 5, 95),
    piety: clamp(random(20, 80) + (archetype.traitBias.piety || 0), 5, 95)
  };

  // Generate backstory (1-2 elements)
  const backstoryCount = randomFloat() < 0.3 ? 2 : 1;
  const backstories = [];
  const usedTypes = new Set();
  const backstorySkillBonuses = {};
  const backstoryProficiencyBonuses = {};

  for (let i = 0; i < backstoryCount; i++) {
    const available = BACKSTORY_TEMPLATES.filter(b => !usedTypes.has(b.type));
    if (available.length > 0) {
      const story = pick(available);
      usedTypes.add(story.type);
      backstories.push(story);

      // Apply backstory effects to personality
      Object.entries(story.effects).forEach(([trait, mod]) => {
        if (personality[trait] !== undefined) {
          personality[trait] = clamp(personality[trait] + mod, 5, 95);
        }
      });

      // Accumulate backstory skill bonuses
      if (story.skillEffects) {
        Object.entries(story.skillEffects).forEach(([skill, mod]) => {
          backstorySkillBonuses[skill] = (backstorySkillBonuses[skill] || 0) + mod;
        });
      }

      // Accumulate backstory proficiency bonuses
      if (story.proficiencyEffects) {
        Object.entries(story.proficiencyEffects).forEach(([prof, mod]) => {
          backstoryProficiencyBonuses[prof] = (backstoryProficiencyBonuses[prof] || 0) + mod;
        });
      }
    }
  }

  // Generate skills based on stats, race, archetype, and backstory
  const raceSkillBonuses = selectedRace.skillBonuses || {};
  const archetypeSkillBonuses = archetype.skillBonuses || {};

  // Build combined stats including personality traits for skill calculation
  const combinedStats = {
    ...personality,
    strength: clamp(random(20, 60) + nobleBonus + (bonus.strength || 0) + (raceBonus.strength || 0), 0, 100),
    speed: clamp(random(25, 65) + (bonus.speed || 0) + (raceBonus.speed || 0), 0, 100),
    stealth: clamp(random(20, 60) + (bonus.stealth || 0) + (raceBonus.stealth || 0), 0, 100),
    intelligence: clamp(random(30, 70) + (bonus.intelligence || 0) + (raceBonus.intelligence || 0), 0, 100),
    charisma: clamp(random(20, 60) + (bonus.charisma || 0) + (raceBonus.charisma || 0), 0, 100),
    survival: clamp(random(15, 55) + (bonus.survival || 0) + (raceBonus.survival || 0), 0, 100),
    combat: clamp(random(15, 50) + nobleBonus + (bonus.combat || 0) + (raceBonus.combat || 0), 0, 100)
  };

  const skills = {};
  Object.keys(SKILLS).forEach(skillId => {
    skills[skillId] = calculateSkill(
      skillId,
      combinedStats,
      raceSkillBonuses,
      archetypeSkillBonuses,
      backstorySkillBonuses
    );
  });

  // Generate weapon proficiencies based on race, archetype, and backstory
  const raceProfBonuses = selectedRace.proficiencyBonuses || {};
  const archetypeProfBonuses = archetype.proficiencyBonuses || {};

  const proficiencies = {};
  Object.keys(WEAPON_PROFICIENCY_CATEGORIES).forEach(categoryId => {
    proficiencies[categoryId] = calculateProficiency(
      categoryId,
      raceProfBonuses,
      archetypeProfBonuses,
      backstoryProficiencyBonuses
    );
  });

  // Select patron deity based on piety and archetype affinity
  let patronDeity = null;
  if (personality.piety >= PIETY_THRESHOLDS.godless) {
    // Higher piety = more likely to have a deity
    const deityChance = (personality.piety - PIETY_THRESHOLDS.godless) / (100 - PIETY_THRESHOLDS.godless);
    if (randomFloat() < deityChance + 0.3) { // Base 30% chance + piety bonus
      // Get archetype deity affinities
      const affinities = ARCHETYPE_DEITY_AFFINITY[archetype.id] || [];
      const deityIds = Object.keys(DEITIES);

      // Weight selection toward affinity deities
      if (affinities.length > 0 && randomFloat() < 0.7) {
        // 70% chance to pick from affinity deities
        patronDeity = pick(affinities);
      } else {
        // Random deity
        patronDeity = pick(deityIds);
      }
    }
  }

  return {
    id: generateId(),
    name,
    realm,
    realmName: REALM_NAMES[realm - 1],
    alive: true,

    // Race
    race: selectedRace.id,
    raceName: selectedRace.name,
    raceDescription: selectedRace.description,

    // Core attributes (0-100) - includes race bonuses (using pre-calculated values)
    stats: {
      strength: combinedStats.strength,
      speed: combinedStats.speed,
      stealth: combinedStats.stealth,
      intelligence: combinedStats.intelligence,
      charisma: combinedStats.charisma,
      survival: combinedStats.survival,
      combat: combinedStats.combat
    },

    // Magic (placeholder for future magic system)
    magic: {
      affinity: selectedRace.magicAffinity,
      power: clamp(random(10, 50) + (selectedRace.magicBonus || 0), 0, 100),
      knownSpells: [],
      mana: 100,
      maxMana: 100
    },

    // Status
    health: 100,
    hunger: 100,
    thirst: 100,
    energy: 100,
    sanity: 100,

    // Inventory
    inventory: [],

    // Location
    zone: 'central_keep',

    // Relationships: { otherId: value } where value is -100 to 100
    relationships: {},

    // Tracking
    kills: 0,
    daysAlive: 0,
    daysSinceKill: 0,
    popularity: random(10, 40) + (isNoble ? 20 : 0),
    injuries: [],

    // Expanded personality
    personality,
    archetype: archetype.id,
    archetypeName: archetype.name,
    archetypeDesc: archetype.description,
    backstories: backstories.map(b => b.text),

    // Skills and proficiencies
    skills,
    proficiencies,

    // Track who wronged them (for vendetta system)
    grudges: {},

    // Deity system
    patronDeity,
    deityFavor: 0,
    blessings: [],
    curses: [],
    abandonedBy: []
  };
}

export function generatePreExistingRelationships(champions) {
  const events = [];

  // Realm partner relationships (same realm champions)
  for (let d = 1; d <= 12; d++) {
    const partners = champions.filter(t => t.realm === d);
    if (partners.length === 2) {
      const [t1, t2] = partners;

      // Check for sibling relationship (rare)
      if (randomFloat() < 0.08) {
        t1.relationships[t2.id] = 70 + random(0, 20);
        t2.relationships[t1.id] = 70 + random(0, 20);
        t1.backstories.push(`is the sibling of ${t2.name}`);
        t2.backstories.push(`is the sibling of ${t1.name}`);
        events.push({
          type: 'backstory',
          text: `${t1.name} and ${t2.name} from ${t1.realmName} are siblings - a tragic twist of fate.`,
          severity: 'announcement'
        });
      }
      // Romantic relationship (rare)
      else if (randomFloat() < 0.06) {
        t1.relationships[t2.id] = 65 + random(0, 25);
        t2.relationships[t1.id] = 65 + random(0, 25);
        events.push({
          type: 'backstory',
          text: `${t1.name} and ${t2.name} from ${t1.realmName} are romantically involved.`,
          severity: 'announcement'
        });
      }
      // Childhood friends
      else if (randomFloat() < 0.2) {
        const bondStrength = random(30, 55);
        t1.relationships[t2.id] = bondStrength;
        t2.relationships[t1.id] = bondStrength + random(-10, 10);
        events.push({
          type: 'backstory',
          text: `${t1.name} and ${t2.name} from ${t1.realmName} grew up as friends.`,
          severity: 'info'
        });
      }
      // Rivals
      else if (randomFloat() < 0.12) {
        t1.relationships[t2.id] = -25 - random(0, 25);
        t2.relationships[t1.id] = -25 - random(0, 25);
        events.push({
          type: 'backstory',
          text: `${t1.name} and ${t2.name} from ${t1.realmName} are bitter rivals.`,
          severity: 'warning'
        });
      }
      // One-sided grudge
      else if (randomFloat() < 0.1) {
        const holder = pick([t1, t2]);
        const target = holder === t1 ? t2 : t1;
        holder.relationships[target.id] = -20 - random(0, 20);
        holder.grudges[target.id] = 'pre-existing';
        events.push({
          type: 'backstory',
          text: `${holder.name} holds a grudge against their realm partner ${target.name}.`,
          severity: 'warning'
        });
      }
    }
  }

  // Knight order alliances
  const knights = champions.filter(t => t.realm <= 2 || t.realm === 4);
  knights.forEach(c1 => {
    knights.forEach(c2 => {
      if (c1.id !== c2.id && c1.realm !== c2.realm) {
        // Knights from noble realms tend to ally
        if (!c1.relationships[c2.id]) {
          c1.relationships[c2.id] = random(15, 35);
        }

        // But some are rivals from training
        if (randomFloat() < 0.15) {
          c1.relationships[c2.id] = -20 - random(0, 25);
          c2.relationships[c1.id] = -20 - random(0, 25);
          events.push({
            type: 'backstory',
            text: `${c1.name} (D${c1.realm}) and ${c2.name} (D${c2.realm}) competed fiercely in tournament circuits.`,
            severity: 'warning'
          });
        }
      }
    });
  });

  // Cross-realm connections (rare)
  for (let i = 0; i < 3; i++) {
    if (randomFloat() < 0.4) {
      const t1 = pick(champions);
      const t2 = pick(champions.filter(t => t.realm !== t1.realm && t.id !== t1.id));

      if (t2 && !t1.relationships[t2.id]) {
        // Admiration from training scores
        if (randomFloat() < 0.5) {
          t1.relationships[t2.id] = random(20, 40);
          events.push({
            type: 'backstory',
            text: `${t1.name} was impressed by ${t2.name} during training.`,
            severity: 'info'
          });
        } else {
          // Instant dislike
          t1.relationships[t2.id] = -15 - random(0, 20);
          events.push({
            type: 'backstory',
            text: `${t1.name} took an instant dislike to ${t2.name}.`,
            severity: 'warning'
          });
        }
      }
    }
  }

  // Personality-based initial impressions
  champions.forEach(t1 => {
    champions.forEach(t2 => {
      if (t1.id !== t2.id && !t1.relationships[t2.id]) {
        let modifier = 0;

        // Similar personalities attract (or repel)
        if (t1.personality.sociability > 60 && t2.personality.sociability > 60) {
          modifier += random(5, 15);
        }
        if (t1.personality.empathy > 60 && t2.personality.empathy > 60) {
          modifier += random(5, 10);
        }

        // Arrogant people irritate others
        if (t2.personality.pride > 70 && t1.personality.pride < 50) {
          modifier -= random(5, 15);
        }

        // Aggressive champions make others wary
        if (t2.personality.aggression > 70) {
          modifier -= random(5, 15);
        }

        // Vengeful people remember slights
        if (t1.personality.vendetta > 60) {
          modifier -= random(0, 10);
        }

        if (modifier !== 0) {
          t1.relationships[t2.id] = clamp(modifier, -30, 30);
        }
      }
    });
  });

  return events;
}

export function generateAllChampions() {
  const usedNames = new Set();
  const champions = [];

  for (let realm = 1; realm <= 12; realm++) {
    champions.push(generateChampion(realm, usedNames));
    champions.push(generateChampion(realm, usedNames));
  }

  return champions;
}
