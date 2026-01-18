import React, { useState, useCallback, useMemo, useEffect } from 'react';

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const REALM_NAMES = [
  'Valdoria - The Golden Kingdom', 'Ironhold - The Fortress Realm', 'Mythrion - The Arcane Dominion',
  'Stormhaven - The Coastal Principality', 'Ashenmoor - The Blighted Wastes', 'Thornwood - The Wild Marches',
  'Frostgard - The Northern Reaches', 'Silkmere - The Merchant Republic', 'Grainfall - The Fertile Plains',
  'Beastmoor - The Savage Lands', 'Greenvale - The Sylvan Domain', 'Deepforge - The Mountain Clans'
];

const FIRST_NAMES = [
  'Aldric', 'Brenna', 'Cedric', 'Daria', 'Edmund', 'Freya', 'Godric', 'Helena', 'Isadora', 'Jareth',
  'Kira', 'Lucan', 'Morrigan', 'Nathaniel', 'Ophelia', 'Percival', 'Quinn', 'Rowena', 'Silas', 'Theron',
  'Ulric', 'Vivienne', 'Wulfric', 'Xanthus', 'Ysolde', 'Zephyrus', 'Astrid', 'Bjorn', 'Cressida', 'Draven',
  'Elara', 'Fenris', 'Gwendolyn', 'Hadrian', 'Isolde', 'Jasper', 'Kaelen', 'Lysander', 'Magnus', 'Nadia',
  'Orion', 'Petra', 'Ragnar', 'Seraphina', 'Tormund', 'Ursula', 'Viktor', 'Winona', 'Yorick', 'Zelda'
];

const BATTLEFIELD_ZONES = [
  { id: 'central_keep', name: 'The Central Keep', danger: 0.3, resourceChance: 0.7, description: 'Ruined fortress with abandoned armories' },
  { id: 'darkwood', name: 'The Darkwood', danger: 0.2, resourceChance: 0.4, description: 'Ancient forest where sunlight barely penetrates' },
  { id: 'mirror_lake', name: 'Mirror Lake', danger: 0.15, resourceChance: 0.5, description: 'Still waters said to be blessed by water spirits' },
  { id: 'caverns', name: 'The Undercroft', danger: 0.25, resourceChance: 0.3, description: 'Twisting tunnels carved by dwarves long ago' },
  { id: 'ruins', name: 'The Fallen Temple', danger: 0.35, resourceChance: 0.5, description: 'Crumbling shrine to forgotten gods' },
  { id: 'swamp', name: 'The Fenmire', danger: 0.4, resourceChance: 0.2, description: 'Cursed marshland shrouded in miasma' },
  { id: 'highlands', name: 'The Windswept Highlands', danger: 0.3, resourceChance: 0.25, description: 'Rocky crags battered by endless gales' },
  { id: 'meadow', name: 'The Bloodfields', danger: 0.1, resourceChance: 0.35, description: 'Open plains where armies once clashed' }
];

const ITEMS = {
  weapons: [
    { id: 'sword', name: 'Longsword', combatBonus: 25, rarity: 0.15 },
    { id: 'bow', name: 'Longbow', combatBonus: 20, rarity: 0.2 },
    { id: 'knife', name: 'Dagger', combatBonus: 12, rarity: 0.35 },
    { id: 'spear', name: 'War Spear', combatBonus: 18, rarity: 0.25 },
    { id: 'axe', name: 'Battle Axe', combatBonus: 22, rarity: 0.18 },
    { id: 'halberd', name: 'Halberd', combatBonus: 24, rarity: 0.12 },
    { id: 'mace', name: 'Flanged Mace', combatBonus: 20, rarity: 0.2 },
    { id: 'crossbow', name: 'Crossbow', combatBonus: 18, rarity: 0.22 },
    { id: 'warhammer', name: 'Warhammer', combatBonus: 23, rarity: 0.15 },
    { id: 'flail', name: 'Flail', combatBonus: 19, rarity: 0.2 }
  ],
  supplies: [
    { id: 'rations', name: 'Travel Rations', hungerRestore: 40, rarity: 0.3 },
    { id: 'waterskin', name: 'Waterskin', thirstRestore: 50, rarity: 0.35 },
    { id: 'bandages', name: 'Healer\'s Bandages', healAmount: 30, rarity: 0.2 },
    { id: 'bedroll', name: 'Bedroll', restBonus: 20, rarity: 0.25 },
    { id: 'rope', name: 'Hemp Rope', utilityBonus: 10, rarity: 0.4 },
    { id: 'tinderbox', name: 'Tinderbox', survivalBonus: 15, rarity: 0.35 },
    { id: 'healing_potion', name: 'Healing Potion', healAmount: 50, rarity: 0.1 },
    { id: 'cloak', name: 'Shadow Cloak', stealthBonus: 15, rarity: 0.08 }
  ]
};

// ============================================
// RACE SYSTEM
// ============================================

const RACES = {
  human: {
    id: 'human',
    name: 'Human',
    description: 'Versatile and adaptable, humans excel through sheer determination.',
    statBonuses: { charisma: 5, intelligence: 5 },
    passives: {
      adaptable: {
        name: 'Adaptable',
        description: '+10% to all skill checks',
        effect: 'skillBonus',
        value: 0.1
      },
      determined: {
        name: 'Determined',
        description: 'Slower sanity decay',
        effect: 'sanityDecayReduction',
        value: 0.25
      }
    },
    magicAffinity: 'neutral', // Placeholder for magic system
    magicBonus: 0,
    commonInRealms: [1, 2, 5, 8, 9],
    rarity: 0.3
  },
  elf: {
    id: 'elf',
    name: 'Elf',
    description: 'Ancient and graceful, elves possess keen senses and natural agility.',
    statBonuses: { speed: 10, stealth: 10, intelligence: 5, strength: -5 },
    passives: {
      keenSenses: {
        name: 'Keen Senses',
        description: 'Can detect nearby enemies more easily',
        effect: 'detectionBonus',
        value: 0.3
      },
      graceful: {
        name: 'Graceful',
        description: '+15% dodge chance',
        effect: 'dodgeBonus',
        value: 0.15
      },
      natureWalk: {
        name: 'Nature Walk',
        description: 'Reduced danger in forest zones',
        effect: 'zoneDangerReduction',
        zones: ['darkwood', 'meadow'],
        value: 0.5
      }
    },
    magicAffinity: 'arcane', // Placeholder for magic system
    magicBonus: 15,
    commonInRealms: [3, 11],
    rarity: 0.15
  },
  dwarf: {
    id: 'dwarf',
    name: 'Dwarf',
    description: 'Stout and resilient, dwarves are legendary craftsmen and warriors.',
    statBonuses: { strength: 10, combat: 5, survival: 5, speed: -5 },
    passives: {
      stoneborn: {
        name: 'Stoneborn',
        description: 'Reduced damage from blunt attacks',
        effect: 'damageReduction',
        damageType: 'blunt',
        value: 0.2
      },
      ironWill: {
        name: 'Iron Will',
        description: 'Resistant to fear and sanity loss',
        effect: 'sanityDecayReduction',
        value: 0.4
      },
      undergroundAffinity: {
        name: 'Underground Affinity',
        description: 'Bonus to survival in caves',
        effect: 'zoneDangerReduction',
        zones: ['caverns'],
        value: 0.6
      }
    },
    magicAffinity: 'runic', // Placeholder for magic system
    magicBonus: -5,
    commonInRealms: [2, 12],
    rarity: 0.12
  },
  orc: {
    id: 'orc',
    name: 'Orc',
    description: 'Brutal and powerful, orcs are born for warfare.',
    statBonuses: { strength: 15, combat: 10, intelligence: -10, charisma: -5 },
    passives: {
      bloodlust: {
        name: 'Bloodlust',
        description: '+20% damage when health is below 50%',
        effect: 'lowHealthDamageBonus',
        threshold: 0.5,
        value: 0.2
      },
      intimidating: {
        name: 'Intimidating',
        description: 'Enemies may flee instead of fight',
        effect: 'intimidation',
        value: 0.15
      },
      regeneration: {
        name: 'Regeneration',
        description: 'Slowly regenerates health over time',
        effect: 'healthRegen',
        value: 2
      }
    },
    magicAffinity: 'primal', // Placeholder for magic system
    magicBonus: -10,
    commonInRealms: [6, 10],
    rarity: 0.1
  },
  halfling: {
    id: 'halfling',
    name: 'Halfling',
    description: 'Small but surprisingly lucky, halflings are natural survivors.',
    statBonuses: { stealth: 15, survival: 10, strength: -10, combat: -5 },
    passives: {
      lucky: {
        name: 'Lucky',
        description: 'Small chance to avoid fatal blows',
        effect: 'deathSave',
        value: 0.1
      },
      smallTarget: {
        name: 'Small Target',
        description: '+20% dodge chance against larger foes',
        effect: 'dodgeBonus',
        value: 0.2
      },
      lightfoot: {
        name: 'Lightfoot',
        description: 'Movement between zones is safer',
        effect: 'travelSafety',
        value: 0.3
      }
    },
    magicAffinity: 'neutral', // Placeholder for magic system
    magicBonus: 0,
    commonInRealms: [8, 9, 11],
    rarity: 0.1
  },
  undead: {
    id: 'undead',
    name: 'Undead',
    description: 'Risen from death, these cursed beings feel no pain or fear.',
    statBonuses: { survival: -20, combat: 5 },
    passives: {
      feelNoPain: {
        name: 'Feel No Pain',
        description: 'Ignores injury penalties',
        effect: 'ignoreInjuryPenalty',
        value: true
      },
      undying: {
        name: 'Undying',
        description: 'Does not need food or water',
        effect: 'noHungerThirst',
        value: true
      },
      terrifying: {
        name: 'Terrifying',
        description: 'Causes sanity damage to enemies in combat',
        effect: 'combatSanityDamage',
        value: 10
      },
      sunWeakness: {
        name: 'Sun Weakness',
        description: 'Takes damage in open areas during day',
        effect: 'zoneDamage',
        zones: ['meadow', 'highlands'],
        value: 3
      }
    },
    magicAffinity: 'necromantic', // Placeholder for magic system
    magicBonus: 10,
    commonInRealms: [5, 6],
    rarity: 0.05
  },
  beastkin: {
    id: 'beastkin',
    name: 'Beastkin',
    description: 'Part human, part beast - these warriors embrace their feral nature.',
    statBonuses: { strength: 5, speed: 10, stealth: 5, charisma: -5 },
    passives: {
      feralSenses: {
        name: 'Feral Senses',
        description: 'Cannot be ambushed',
        effect: 'ambushImmunity',
        value: true
      },
      clawsAndFangs: {
        name: 'Claws and Fangs',
        description: 'Unarmed attacks deal bonus damage',
        effect: 'unarmedBonus',
        value: 8
      },
      packHunter: {
        name: 'Pack Hunter',
        description: 'Bonus damage when allied with others',
        effect: 'allyDamageBonus',
        value: 0.15
      }
    },
    magicAffinity: 'primal', // Placeholder for magic system
    magicBonus: 5,
    commonInRealms: [7, 10, 11],
    rarity: 0.08
  },
  darkElf: {
    id: 'darkElf',
    name: 'Dark Elf',
    description: 'Twisted kin of the elves, dark elves are masters of shadow and poison.',
    statBonuses: { stealth: 15, cunning: 10, intelligence: 5, empathy: -10 },
    passives: {
      shadowMeld: {
        name: 'Shadow Meld',
        description: 'Much harder to detect at night or in dark zones',
        effect: 'nightStealth',
        value: 0.4
      },
      poisonBlood: {
        name: 'Poison Blood',
        description: 'Attackers take minor damage when landing hits',
        effect: 'reflectDamage',
        value: 3
      },
      cruelty: {
        name: 'Cruelty',
        description: 'Bonus damage against wounded enemies',
        effect: 'executeBonus',
        threshold: 0.3,
        value: 0.25
      }
    },
    magicAffinity: 'shadow', // Placeholder for magic system
    magicBonus: 20,
    commonInRealms: [3, 5, 12],
    rarity: 0.06
  },
  giant: {
    id: 'giant',
    name: 'Half-Giant',
    description: 'Towering warriors with immense strength but slow reflexes.',
    statBonuses: { strength: 25, combat: 10, speed: -15, stealth: -20 },
    passives: {
      towering: {
        name: 'Towering',
        description: 'Deals +30% damage with blunt weapons',
        effect: 'weaponTypeBonus',
        weaponType: 'blunt',
        value: 0.3
      },
      thickSkin: {
        name: 'Thick Skin',
        description: 'Reduces all incoming damage',
        effect: 'flatDamageReduction',
        value: 5
      },
      earthshaker: {
        name: 'Earthshaker',
        description: 'Attacks may stagger opponents',
        effect: 'staggerChance',
        value: 0.2
      }
    },
    magicAffinity: 'primal', // Placeholder for magic system
    magicBonus: -15,
    commonInRealms: [7, 10],
    rarity: 0.04
  },
  vampire: {
    id: 'vampire',
    name: 'Vampire',
    description: 'Immortal predators who drain the life from their victims.',
    statBonuses: { strength: 10, speed: 10, charisma: 10, survival: -10 },
    passives: {
      lifeDrain: {
        name: 'Life Drain',
        description: 'Heals for a portion of damage dealt',
        effect: 'lifeSteal',
        value: 0.2
      },
      unnatural: {
        name: 'Unnatural Grace',
        description: '+10% dodge chance',
        effect: 'dodgeBonus',
        value: 0.1
      },
      sunBane: {
        name: 'Sun Bane',
        description: 'Takes significant damage in sunlit areas',
        effect: 'zoneDamage',
        zones: ['meadow', 'highlands', 'central_keep'],
        value: 8
      },
      bloodthirst: {
        name: 'Bloodthirst',
        description: 'Must kill regularly or suffer penalties',
        effect: 'killRequirement',
        daysBetween: 3,
        penalty: 'statReduction'
      }
    },
    magicAffinity: 'blood', // Placeholder for magic system
    magicBonus: 25,
    commonInRealms: [1, 5],
    rarity: 0.03
  }
};

// Helper function to get race passive effect
function getRacePassiveValue(champion, effectType) {
  if (!champion.race) return null;
  const race = RACES[champion.race];
  if (!race) return null;
  
  for (const passive of Object.values(race.passives)) {
    if (passive.effect === effectType) {
      return passive;
    }
  }
  return null;
}

// Check if champion has a specific passive effect
function hasRacePassive(champion, effectType) {
  return getRacePassiveValue(champion, effectType) !== null;
}

// Get all passive effects of a type for a champion
function applyRacePassive(champion, effectType, baseValue, context = {}) {
  const passive = getRacePassiveValue(champion, effectType);
  if (!passive) return baseValue;
  
  switch (effectType) {
    case 'skillBonus':
    case 'dodgeBonus':
    case 'detectionBonus':
      return baseValue * (1 + passive.value);
    
    case 'damageReduction':
      if (context.damageType && passive.damageType === context.damageType) {
        return baseValue * (1 - passive.value);
      }
      return baseValue;
    
    case 'flatDamageReduction':
      return Math.max(0, baseValue - passive.value);
    
    case 'zoneDangerReduction':
      if (passive.zones && passive.zones.includes(context.zone)) {
        return baseValue * (1 - passive.value);
      }
      return baseValue;
    
    case 'lowHealthDamageBonus':
      if (context.healthPercent && context.healthPercent < passive.threshold) {
        return baseValue * (1 + passive.value);
      }
      return baseValue;
    
    case 'sanityDecayReduction':
      return baseValue * (1 - passive.value);
    
    case 'lifeSteal':
      return Math.round(baseValue * passive.value);
    
    case 'unarmedBonus':
      return baseValue + passive.value;
    
    case 'weaponTypeBonus':
      if (context.weaponType === passive.weaponType) {
        return baseValue * (1 + passive.value);
      }
      return baseValue;
    
    case 'executeBonus':
      if (context.targetHealthPercent && context.targetHealthPercent < passive.threshold) {
        return baseValue * (1 + passive.value);
      }
      return baseValue;
    
    case 'allyDamageBonus':
      if (context.hasAllies) {
        return baseValue * (1 + passive.value);
      }
      return baseValue;
    
    default:
      return baseValue;
  }
}

const BODY_PARTS = [
  { id: 'head', name: 'head', vital: true, bleedRate: 1.5, damageMultiplier: 2.0 },
  { id: 'neck', name: 'neck', vital: true, bleedRate: 2.0, damageMultiplier: 2.5 },
  { id: 'chest', name: 'chest', vital: true, bleedRate: 1.2, damageMultiplier: 1.5 },
  { id: 'abdomen', name: 'abdomen', vital: true, bleedRate: 1.3, damageMultiplier: 1.3 },
  { id: 'left_arm', name: 'left arm', vital: false, bleedRate: 0.8, damageMultiplier: 0.8 },
  { id: 'right_arm', name: 'right arm', vital: false, bleedRate: 0.8, damageMultiplier: 0.8 },
  { id: 'left_hand', name: 'left hand', vital: false, bleedRate: 0.5, damageMultiplier: 0.5 },
  { id: 'right_hand', name: 'right hand', vital: false, bleedRate: 0.5, damageMultiplier: 0.5 },
  { id: 'left_leg', name: 'left leg', vital: false, bleedRate: 0.9, damageMultiplier: 0.9 },
  { id: 'right_leg', name: 'right leg', vital: false, bleedRate: 0.9, damageMultiplier: 0.9 },
  { id: 'left_foot', name: 'left foot', vital: false, bleedRate: 0.4, damageMultiplier: 0.4 },
  { id: 'right_foot', name: 'right foot', vital: false, bleedRate: 0.4, damageMultiplier: 0.4 }
];

const ATTACK_TYPES = {
  unarmed: [
    { name: 'punches', verb: 'punches', damageType: 'blunt', baseDamage: 5 },
    { name: 'kicks', verb: 'kicks', damageType: 'blunt', baseDamage: 7 },
    { name: 'elbows', verb: 'drives an elbow into', damageType: 'blunt', baseDamage: 6 },
    { name: 'knees', verb: 'knees', damageType: 'blunt', baseDamage: 8 },
    { name: 'headbutts', verb: 'headbutts', damageType: 'blunt', baseDamage: 6 },
    { name: 'grapples', verb: 'grapples and throws', damageType: 'blunt', baseDamage: 10 },
    { name: 'chokes', verb: 'attempts to choke', damageType: 'suffocation', baseDamage: 12 }
  ],
  blade: [
    { name: 'slashes', verb: 'slashes at', damageType: 'slash', baseDamage: 15 },
    { name: 'stabs', verb: 'stabs', damageType: 'pierce', baseDamage: 18 },
    { name: 'cuts', verb: 'cuts', damageType: 'slash', baseDamage: 12 },
    { name: 'thrusts', verb: 'thrusts at', damageType: 'pierce', baseDamage: 16 },
    { name: 'carves', verb: 'carves into', damageType: 'slash', baseDamage: 14 }
  ],
  blunt: [
    { name: 'bashes', verb: 'bashes', damageType: 'blunt', baseDamage: 14 },
    { name: 'crushes', verb: 'crushes', damageType: 'blunt', baseDamage: 16 },
    { name: 'smashes', verb: 'smashes', damageType: 'blunt', baseDamage: 18 },
    { name: 'swings at', verb: 'swings at', damageType: 'blunt', baseDamage: 15 },
    { name: 'hammers', verb: 'hammers', damageType: 'blunt', baseDamage: 17 }
  ],
  polearm: [
    { name: 'thrusts', verb: 'thrusts at', damageType: 'pierce', baseDamage: 16 },
    { name: 'sweeps', verb: 'sweeps at', damageType: 'blunt', baseDamage: 12 },
    { name: 'jabs', verb: 'jabs', damageType: 'pierce', baseDamage: 14 },
    { name: 'impales', verb: 'attempts to impale', damageType: 'pierce', baseDamage: 22 }
  ],
  ranged: [
    { name: 'shoots', verb: 'shoots an arrow at', damageType: 'pierce', baseDamage: 20 },
    { name: 'fires', verb: 'fires at', damageType: 'pierce', baseDamage: 18 }
  ]
};

const WOUND_DESCRIPTIONS = {
  slash: {
    minor: ['leaves a shallow cut on', 'grazes', 'nicks'],
    moderate: ['slices open', 'cuts deeply into', 'lacerates'],
    severe: ['tears open', 'rends', 'mangles'],
    critical: ['nearly severs', 'eviscerates', 'splits open']
  },
  pierce: {
    minor: ['pricks', 'scratches', 'grazes'],
    moderate: ['punctures', 'pierces', 'stabs into'],
    severe: ['impales', 'drives deep into', 'punches through'],
    critical: ['skewers', 'runs through', 'transfixes']
  },
  blunt: {
    minor: ['bruises', 'bumps', 'jars'],
    moderate: ['batters', 'cracks', 'dents'],
    severe: ['crushes', 'shatters', 'pulverizes'],
    critical: ['demolishes', 'obliterates', 'caves in']
  },
  suffocation: {
    minor: ['constricts', 'squeezes'],
    moderate: ['chokes', 'strangles'],
    severe: ['crushes the windpipe of', 'suffocates'],
    critical: ['snaps the neck of', 'crushes the throat of']
  }
};

const COMBAT_REACTIONS = [
  'staggers backward',
  'stumbles',
  'cries out in pain',
  'gasps',
  'grits their teeth',
  'snarls in fury',
  'screams',
  'doubles over',
  'falls to one knee',
  'barely stays standing',
  'spits blood',
  'clutches the wound'
];

const DODGE_DESCRIPTIONS = [
  'narrowly dodges',
  'sidesteps',
  'ducks under',
  'rolls away from',
  'deflects',
  'parries',
  'blocks',
  'twists away from',
  'leaps back from',
  'barely avoids'
];

const WEAPON_CATEGORIES = {
  sword: 'blade',
  knife: 'blade',
  axe: 'blade',
  spear: 'polearm',
  halberd: 'polearm',
  mace: 'blunt',
  warhammer: 'blunt',
  flail: 'blunt',
  bow: 'ranged',
  crossbow: 'ranged'
};

// ============================================
// PERSONALITY & BACKSTORY SYSTEM
// ============================================

const PERSONALITY_TRAITS = {
  // Core temperament
  aggression: { low: 'peaceful', mid: 'measured', high: 'violent' },
  loyalty: { low: 'treacherous', mid: 'pragmatic', high: 'devoted' },
  cunning: { low: 'naive', mid: 'shrewd', high: 'manipulative' },
  bravery: { low: 'cowardly', mid: 'cautious', high: 'fearless' },
  // New traits
  empathy: { low: 'cold', mid: 'reserved', high: 'compassionate' },
  pride: { low: 'humble', mid: 'confident', high: 'arrogant' },
  ruthlessness: { low: 'merciful', mid: 'practical', high: 'merciless' },
  sociability: { low: 'loner', mid: 'selective', high: 'gregarious' },
  impulsiveness: { low: 'calculating', mid: 'balanced', high: 'reckless' },
  vendetta: { low: 'forgiving', mid: 'remembers', high: 'vengeful' }
};

const CHAMPION_ARCHETYPES = [
  { 
    id: 'knight',
    name: 'Knight',
    description: 'Trained in the arts of war since youth',
    realms: [1, 2, 4],
    traitBias: { aggression: 30, bravery: 25, ruthlessness: 25, pride: 20, empathy: -20 },
    rare: false
  },
  {
    id: 'reluctant_hero',
    name: 'Reluctant Hero',
    description: 'Thrust into battle against their will',
    realms: [3, 5, 6, 7, 8],
    traitBias: { empathy: 30, loyalty: 20, aggression: -25, ruthlessness: -20 },
    rare: false
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Hardened by the wilderness',
    realms: [6, 7, 10, 11, 12],
    traitBias: { cunning: 25, ruthlessness: 15, loyalty: -15, impulsiveness: -20 },
    rare: false
  },
  {
    id: 'guardian',
    name: 'Guardian',
    description: 'Sworn to protect the innocent',
    realms: [3, 5, 8, 9, 11, 12],
    traitBias: { loyalty: 35, empathy: 25, bravery: 20, sociability: 15 },
    rare: false
  },
  {
    id: 'courtier',
    name: 'Courtier',
    description: 'Master of intrigue and manipulation',
    realms: [1, 3, 5, 8],
    traitBias: { cunning: 35, impulsiveness: -30, sociability: 20, loyalty: -15 },
    rare: false
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Warrior possessed by battle fury',
    realms: [2, 6, 7, 10],
    traitBias: { aggression: 40, bravery: 30, impulsiveness: 25, cunning: -20 },
    rare: true
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Bound by oath to do no harm',
    realms: [3, 8, 9, 11, 12],
    traitBias: { empathy: 40, aggression: -40, ruthlessness: -35, loyalty: 20 },
    rare: true
  },
  {
    id: 'champion',
    name: 'Tourney Champion',
    description: 'Lives for glory and renown',
    realms: [1, 4, 8],
    traitBias: { pride: 30, sociability: 25, cunning: 20, bravery: 15 },
    rare: false
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Death from the shadows',
    realms: [3, 5, 6, 8, 12],
    traitBias: { cunning: 25, sociability: -30, impulsiveness: -20 },
    rare: false
  },
  {
    id: 'madman',
    name: 'Madman',
    description: 'Touched by chaos itself',
    realms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    traitBias: { impulsiveness: 35, cunning: -15 },
    rare: true
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy warrior of unwavering virtue',
    realms: [1, 4, 5, 9],
    traitBias: { loyalty: 30, empathy: 25, pride: 20, ruthlessness: -30, cunning: -15 },
    rare: true
  },
  {
    id: 'reaver',
    name: 'Reaver',
    description: 'Savage raider who delights in slaughter',
    realms: [2, 5, 6, 7, 10],
    traitBias: { aggression: 30, ruthlessness: 35, empathy: -35, cunning: 15 },
    rare: true
  },
  {
    id: 'hedge_knight',
    name: 'Hedge Knight',
    description: 'Landless warrior seeking fortune',
    realms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    traitBias: { bravery: 15, pride: 10, loyalty: 10 },
    rare: false
  },
  {
    id: 'witch_hunter',
    name: 'Witch Hunter',
    description: 'Zealot sworn to purge dark magic',
    realms: [2, 3, 5, 9],
    traitBias: { ruthlessness: 25, bravery: 20, empathy: -25, vendetta: 20 },
    rare: true
  }
];

const BACKSTORY_TEMPLATES = [
  // Family situations
  { type: 'family', text: 'has sworn to protect their younger siblings', effects: { loyalty: 10, bravery: 5 } },
  { type: 'family', text: 'took the place of a family member chosen for the tournament', effects: { bravery: 15, loyalty: 10 } },
  { type: 'family', text: 'is an orphan raised by the streets', effects: { ruthlessness: 10, empathy: -10 } },
  { type: 'family', text: 'hails from a large and loving noble house', effects: { empathy: 10, sociability: 10 } },
  { type: 'family', text: 'watched their family slaughtered by raiders', effects: { vendetta: 15, aggression: 10 } },
  { type: 'family', text: 'is the last of their bloodline', effects: { pride: 10, bravery: 5 } },
  
  // Training/skills
  { type: 'training', text: 'trained in secret with a disgraced knight', effects: { bravery: 10, cunning: 5 } },
  { type: 'training', text: 'survived harsh conditions as a peasant laborer', effects: { bravery: 5, ruthlessness: 5 } },
  { type: 'training', text: 'has never held a sword before this day', effects: { aggression: -15, empathy: 10 } },
  { type: 'training', text: 'was trained at the finest war academy in the realm', effects: { pride: 15, aggression: 10 } },
  { type: 'training', text: 'learned to fight in the gladiator pits', effects: { ruthlessness: 10, bravery: 10 } },
  { type: 'training', text: 'served as a squire to a legendary knight', effects: { loyalty: 10, pride: 5 } },
  
  // Personality history
  { type: 'personality', text: 'was mocked as a child and learned to stay unseen', effects: { sociability: -15, cunning: 10 } },
  { type: 'personality', text: 'has always commanded the respect of others', effects: { pride: 10, sociability: 10 } },
  { type: 'personality', text: 'has a fiery temper that leads to trouble', effects: { impulsiveness: 15, aggression: 10 } },
  { type: 'personality', text: 'is known throughout the realm for their mercy', effects: { empathy: 15, ruthlessness: -10 } },
  { type: 'personality', text: 'was betrayed by someone they trusted', effects: { loyalty: -15, vendetta: 10 } },
  { type: 'personality', text: 'believes the gods have chosen them for greatness', effects: { pride: 20, bravery: 10 } },
  { type: 'personality', text: 'carries a dark secret that haunts them', effects: { cunning: 10, sociability: -10 } },
  
  // Motivations
  { type: 'motivation', text: 'seeks to restore honor to their disgraced house', effects: { pride: 10, bravery: 5 } },
  { type: 'motivation', text: 'fights for someone waiting for them back home', effects: { loyalty: 15, bravery: 10 } },
  { type: 'motivation', text: 'craves the wealth and power that victory brings', effects: { cunning: 10, ruthlessness: 5 } },
  { type: 'motivation', text: 'has made peace with death and fears nothing', effects: { bravery: 15, impulsiveness: 10, empathy: 5 } },
  { type: 'motivation', text: 'seeks vengeance against a rival house', effects: { vendetta: 20, aggression: 5 } },
  { type: 'motivation', text: 'hopes to win freedom for their people', effects: { empathy: 15, loyalty: 10 } }
];

const RELATIONSHIP_TEMPLATES = [
  // Positive relationships
  { type: 'childhood_friends', description: 'grew up together in the same village', baseValue: 50, mutual: true, sameRealm: true },
  { type: 'siblings', description: 'share the same blood', baseValue: 70, mutual: true, sameRealm: true },
  { type: 'betrothed', description: 'are promised to each other', baseValue: 75, mutual: true, sameRealm: true },
  { type: 'shield_brothers', description: 'trained together as warriors', baseValue: 40, mutual: true, sameRealm: true },
  { type: 'liege_vassal', description: 'share a bond of fealty', baseValue: 35, mutual: true, sameRealm: true },
  { type: 'admiration', description: 'admires their skill at arms', baseValue: 30, mutual: false, sameRealm: false },
  { type: 'knight_alliance', description: 'swore an oath of alliance', baseValue: 35, mutual: true, sameRealm: false, knightOnly: true },
  
  // Negative relationships  
  { type: 'rivals', description: 'are bitter rivals', baseValue: -40, mutual: true, sameRealm: true },
  { type: 'blood_feud', description: 'holds a blood grudge against', baseValue: -35, mutual: false, sameRealm: true },
  { type: 'house_war', description: 'come from warring houses', baseValue: -30, mutual: true, sameRealm: true },
  { type: 'jealousy', description: 'burns with jealousy toward', baseValue: -25, mutual: false, sameRealm: true },
  { type: 'realm_hatred', description: 'despises all from that realm', baseValue: -30, mutual: false, sameRealm: false },
  { type: 'tournament_rival', description: 'competed fiercely in past tournaments', baseValue: -35, mutual: true, sameRealm: false, knightOnly: true }
];

function getTraitDescription(trait, value) {
  const traitInfo = PERSONALITY_TRAITS[trait];
  if (!traitInfo) return '';
  if (value < 35) return traitInfo.low;
  if (value > 65) return traitInfo.high;
  return traitInfo.mid;
}

function generatePersonalityDescription(champion) {
  const dominated = [];
  const traits = champion.personality;
  
  // Find the most extreme traits
  Object.entries(traits).forEach(([trait, value]) => {
    if (value > 70 || value < 30) {
      dominated.push({ trait, value, desc: getTraitDescription(trait, value) });
    }
  });
  
  // Sort by extremity
  dominated.sort((a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50));
  
  return dominated.slice(0, 3).map(d => d.desc).filter(Boolean);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = () => Math.random();
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

const generateId = () => Math.random().toString(36).substr(2, 9);

// ============================================
// TRIBUTE GENERATION
// ============================================

function generateChampion(realm, usedNames) {
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
    vendetta: clamp(random(15, 70) + (archetype.traitBias.vendetta || 0), 5, 95)
  };

  // Generate backstory (1-2 elements)
  const backstoryCount = randomFloat() < 0.3 ? 2 : 1;
  const backstories = [];
  const usedTypes = new Set();
  
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
    
    // Core attributes (0-100) - includes race bonuses
    stats: {
      strength: clamp(random(20, 60) + nobleBonus + (bonus.strength || 0) + (raceBonus.strength || 0), 0, 100),
      speed: clamp(random(25, 65) + (bonus.speed || 0) + (raceBonus.speed || 0), 0, 100),
      stealth: clamp(random(20, 60) + (bonus.stealth || 0) + (raceBonus.stealth || 0), 0, 100),
      intelligence: clamp(random(30, 70) + (bonus.intelligence || 0) + (raceBonus.intelligence || 0), 0, 100),
      charisma: clamp(random(20, 60) + (bonus.charisma || 0) + (raceBonus.charisma || 0), 0, 100),
      survival: clamp(random(15, 55) + (bonus.survival || 0) + (raceBonus.survival || 0), 0, 100),
      combat: clamp(random(15, 50) + nobleBonus + (bonus.combat || 0) + (raceBonus.combat || 0), 0, 100)
    },
    
    // Magic (placeholder for future magic system)
    magic: {
      affinity: selectedRace.magicAffinity,
      power: clamp(random(10, 50) + (selectedRace.magicBonus || 0), 0, 100),
      knownSpells: [], // Placeholder
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
    
    // Relationships: { odId: value } where value is -100 to 100
    relationships: {},
    
    // Tracking
    kills: 0,
    daysAlive: 0,
    daysSinceKill: 0, // For vampire bloodthirst
    popularity: random(10, 40) + (isNoble ? 20 : 0),
    injuries: [],
    
    // Expanded personality
    personality,
    archetype: archetype.id,
    archetypeName: archetype.name,
    archetypeDesc: archetype.description,
    backstories: backstories.map(b => b.text),
    
    // Track who wronged them (for vendetta system)
    grudges: {}
  };
}

function generatePreExistingRelationships(champions) {
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

function generateAllChampions() {
  const usedNames = new Set();
  const champions = [];
  
  for (let realm = 1; realm <= 12; realm++) {
    champions.push(generateChampion(realm, usedNames));
    champions.push(generateChampion(realm, usedNames));
  }
  
  return champions;
}

// ============================================
// RELATIONSHIP SYSTEM
// ============================================

function getRelationship(champion, otherId) {
  return champion.relationships[otherId] || 0;
}

function modifyRelationship(champion, otherId, delta, allChampions) {
  const current = getRelationship(champion, otherId);
  const newValue = clamp(current + delta, -100, 100);
  champion.relationships[otherId] = newValue;
  
  // Track grudges for vengeful champions
  if (delta < -20 && champion.personality && champion.personality.vendetta > 50) {
    if (!champion.grudges) champion.grudges = {};
    champion.grudges[otherId] = (champion.grudges[otherId] || 0) + Math.abs(delta);
  }
  
  // Reputation spreads - others hear about interactions
  allChampions.forEach(t => {
    if (t.id !== champion.id && t.id !== otherId && t.alive) {
      const witnessChance = t.zone === champion.zone ? 0.5 : 0.1;
      if (randomFloat() < witnessChance) {
        const spreadDelta = Math.round(delta * 0.3);
        const currentWithWitness = getRelationship(t, champion.id);
        t.relationships[champion.id] = clamp(currentWithWitness + (delta > 0 ? spreadDelta : -spreadDelta), -100, 100);
      }
    }
  });
}

function areAllies(t1, t2) {
  return getRelationship(t1, t2.id) > 40 && getRelationship(t2, t1.id) > 40;
}

function areEnemies(t1, t2) {
  return getRelationship(t1, t2.id) < -30 || getRelationship(t2, t1.id) < -30;
}

// ============================================
// COMBAT SYSTEM
// ============================================

function getCombatPower(champion) {
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

// ============================================
// DETAILED COMBAT SYSTEM
// ============================================

function getWeaponCategory(champion) {
  const weapon = champion.inventory.find(i => i.combatBonus);
  if (!weapon) return 'unarmed';
  return WEAPON_CATEGORIES[weapon.id] || 'blade';
}

function getWeaponName(champion) {
  const weapon = champion.inventory.find(i => i.combatBonus);
  return weapon ? weapon.name.toLowerCase() : 'fists';
}

function selectTargetBodyPart(attacker, defender, isAimed) {
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

function calculateHitChance(attacker, defender, attackType) {
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

function calculateDamage(attacker, attackType, bodyPart, weapon, defender = null, context = {}) {
  let damage = attackType.baseDamage;
  
  // Strength modifier
  damage += attacker.stats.strength * 0.2;
  
  // Weapon bonus
  if (weapon) {
    damage += weapon.combatBonus * 0.3;
    
    // Race passive - weapon type bonus (giants with blunt weapons)
    const weaponType = WEAPON_CATEGORIES[weapon.id];
    damage = applyRacePassive(attacker, 'weaponTypeBonus', damage, { weaponType });
  } else {
    // Unarmed - check for claws and fangs (beastkin)
    damage = applyRacePassive(attacker, 'unarmedBonus', damage, {});
  }
  
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

function getWoundSeverity(damage) {
  if (damage >= 25) return 'critical';
  if (damage >= 15) return 'severe';
  if (damage >= 8) return 'moderate';
  return 'minor';
}

function generateCombatLogEntry(attacker, defender, attackType, bodyPart, hit, damage, blocked, weapon) {
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

function simulateCombatExchange(attacker, defender, round, combatLog) {
  const weapon = attacker.inventory.find(i => i.combatBonus);
  const weaponCategory = getWeaponCategory(attacker);
  const attackTypes = ATTACK_TYPES[weaponCategory];
  const attackType = pick(attackTypes);
  
  const isAimed = attacker.stats.combat > 60 && randomFloat() < 0.3;
  const bodyPart = selectTargetBodyPart(attacker, defender, isAimed);
  
  const hitChance = calculateHitChance(attacker, defender, attackType);
  const roll = random(1, 100);
  const hit = roll <= hitChance;
  
  // Check for block/parry
  const blockChance = defender.stats.combat * 0.2 + (defender.inventory.some(i => i.combatBonus) ? 15 : 0);
  const blocked = hit && random(1, 100) <= blockChance;
  
  let damage = 0;
  if (hit) {
    damage = calculateDamage(attacker, attackType, bodyPart, weapon);
    if (blocked) damage = Math.round(damage * 0.5);
  }
  
  const logEntry = generateCombatLogEntry(attacker, defender, attackType, bodyPart, hit, damage, blocked, weapon);
  logEntry.round = round;
  logEntry.hitChance = hitChance;
  logEntry.roll = roll;
  combatLog.push(logEntry);
  
  // Apply damage
  if (hit) {
    defender.health -= damage;
    
    // Energy cost from being hit
    defender.energy -= Math.round(damage * 0.3);
    
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
  
  // Attacker energy cost
  attacker.energy -= random(3, 8);
  
  return { hit, damage, blocked, bodyPart };
}

function resolveCombat(attacker, defender, allChampions) {
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
    winner.daysSinceKill = 0; // Reset for vampire bloodthirst
    
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

// ============================================
// GROUP COMBAT & COOPERATIVE ACTIONS
// ============================================

function resolveGroupCombat(attackingGroup, defendingGroup, allChampions) {
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
            text: `💀 ${target.name} falls in battle!`,
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
            text: `💀 ${target.name} falls in battle!`,
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
      text: `🏆 Victory for: ${survivingAttackers.map(c => c.name).join(', ')}`,
      type: 'victory'
    });
  } else if (survivingDefenders.length > 0) {
    combatLog.push({
      text: `🏆 Victory for: ${survivingDefenders.map(c => c.name).join(', ')}`,
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
          modifyRelationship(c1, c2.id, 15, allChampions); // Fought together
        } else {
          modifyRelationship(c1, c2.id, -25, allChampions); // Enemies
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

function handleGroupHunt(group, target, allChampions) {
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

function handleCooperativeForaging(group, zone) {
  const events = [];
  
  const names = group.map(c => c.name).join(', ');
  events.push({
    type: 'group_action',
    text: `${names} forage together in ${zone.name}.`
  });
  
  // Better success rate when foraging together
  const combinedSurvival = group.reduce((sum, c) => sum + c.stats.survival, 0) / group.length;
  const bonusChance = 0.15 * (group.length - 1); // Bonus for cooperation
  
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

function handleCooperativeDefense(defenders, attacker, allChampions) {
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

function handleGroupRest(group, zone) {
  const events = [];
  
  const names = group.map(c => c.name).join(', ');
  events.push({
    type: 'group_action',
    text: `${names} take turns keeping watch while the others rest.`
  });
  
  // Better rest with watch rotation
  group.forEach(c => {
    const restBonus = 15 + (group.length - 1) * 5; // More watchers = better sleep
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

function handleAllianceSplit(group, allChampions) {
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
      events.push(...resolveCombat(c1, c2, allChampions));
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

function handleGroupMorale(group, allChampions) {
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

// ============================================
// EVENT GENERATORS
// ============================================

function generateEvent(champion, allChampions, day, gameState) {
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
    // Check for lucky escape
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
    // New interaction types
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

// Random passive encounters that add flavor
function handleRandomEncounter(champion, nearbyChampions, allChampions) {
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
      // Might affect relationship slightly
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
      // Witness something about another champion
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

function decideAction(champion, nearbyChampions, allChampions, day, gameState) {
  const p = champion.personality; // shorthand
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
      
      // If enemy is threatening and we have allies, consider group defense
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
      // Bring allies if available for vendetta
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
    // Chance scales with how treacherous they are
    const betrayChance = ((100 - p.loyalty) + p.ruthlessness + p.cunning) / 400;
    if (targetAlly && randomFloat() < betrayChance) {
      return { type: 'betray', target: targetAlly };
    }
  }
  
  // THEFT: Cunning and desperate or greedy
  if (p.cunning > 50 && champion.stats.stealth > 40 && nearbyChampions.length > 0) {
    const theftTarget = nearbyChampions.find(t => t.inventory.length > 0 && !areAllies(champion, t));
    if (theftTarget) {
      // More likely if desperate or ruthless
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
    // Desperate + ruthless might steal from others
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
    const tradePartner = nearbyNeutrals.find(t => t.inventory.length > 0 && getRelationship(champion, t.id) > -20);
    if (tradePartner && randomFloat() < 0.15) {
      return { type: 'trade', target: tradePartner };
    }
  }
  
  // SOCIABLE: More likely to seek alliances
  if (p.sociability > 55 && p.loyalty > 40 && nearbyNeutrals.length > 0) {
    // Look for compatible personalities
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
    if (weakTarget && !(p.empathy > 65 && getRelationship(champion, weakTarget.id) > 0)) {
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
    // Brave and strong - actively hunt
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

// Calculate how well two champions would get along
function calculateCompatibility(t1, t2) {
  let score = 0;
  
  // Same realm bonus
  if (t1.realm === t2.realm) score += 20;
  
  // Similar sociability
  if (Math.abs(t1.personality.sociability - t2.personality.sociability) < 25) score += 10;
  
  // Both empathetic
  if (t1.personality.empathy > 55 && t2.personality.empathy > 55) score += 15;
  
  // Both loyal
  if (t1.personality.loyalty > 55 && t2.personality.loyalty > 55) score += 15;
  
  // Clashing pride
  if (t1.personality.pride > 65 && t2.personality.pride > 65) score -= 20;
  
  // One aggressive, one peaceful - tension
  if (Math.abs(t1.personality.aggression - t2.personality.aggression) > 40) score -= 10;
  
  // Ruthless people make others uncomfortable
  if (t1.personality.ruthlessness > 70 || t2.personality.ruthlessness > 70) score -= 15;
  
  // Vengeful + any negative history
  if (t1.personality.vendetta > 60 && (t1.relationships[t2.id] || 0) < 0) score -= 25;
  
  return score;
}

function handleHunting(hunter, nearbyChampions, allChampions) {
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

function handleForaging(champion, zone) {
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

function handleHiding(champion, zone) {
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

function handleMovement(champion, targetZone) {
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

function handleAllianceAttempt(champion, target, allChampions) {
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

function handleBetrayal(betrayer, victim, allChampions) {
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
    betrayer.popularity += 15; // Audiences love drama
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

function handleHealing(champion) {
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

function handleResting(champion, zone) {
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

function handleHelpAlly(champion, ally, allChampions) {
  const events = [];
  
  // Check what kind of help we can give
  const healItem = champion.inventory.find(i => i.healAmount);
  const foodItem = champion.inventory.find(i => i.hungerRestore);
  const waterItem = champion.inventory.find(i => i.thirstRestore);
  
  if (healItem && ally.health < 50) {
    // Share medical supplies
    ally.health = clamp(ally.health + Math.round(healItem.healAmount * 0.7), 0, 100);
    champion.inventory = champion.inventory.filter(i => i !== healItem);
    
    events.push({
      type: 'alliance',
      text: `${champion.name} tends to ${ally.name}'s wounds, sharing their ${healItem.name}.`,
      severity: 'success'
    });
    
    // Strengthen bond
    modifyRelationship(ally, champion.id, 25, allChampions);
    modifyRelationship(champion, ally.id, 10, allChampions);
    
    // Audience loves compassion
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
    // Just stay close and provide comfort
    events.push({
      type: 'action',
      text: `${champion.name} stays close to ${ally.name}, keeping watch.`
    });
    
    ally.sanity = clamp(ally.sanity + 5, 0, 100);
    modifyRelationship(ally, champion.id, 5, allChampions);
  }
  
  return events;
}

function handleTrapSetting(champion, zone, allChampions) {
  const events = [];
  
  champion.energy -= 20;
  
  // Trap success determined later when someone enters zone
  // For now, just mark the action
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

// ============================================
// NEW INTERACTION HANDLERS
// ============================================

function handleTheft(champion, target, allChampions) {
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
  const awarenessRoll = target.stats.intelligence + target.stats.survival * 0.3 + randomFloat() * 30;
  
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
      events.push(...resolveCombat(target, champion, allChampions));
    }
  }
  
  return events;
}

function handleSabotage(champion, target, allChampions) {
  const events = [];
  
  champion.energy -= 20;
  
  const cunningCheck = champion.stats.cunning + champion.stats.stealth * 0.3 + randomFloat() * 20;
  
  if (cunningCheck > 55) {
    // Sabotage succeeds
    const sabotageType = pick(['poison_supplies', 'damage_weapon', 'false_trail', 'spoil_water']);
    
    switch (sabotageType) {
      case 'poison_supplies':
        if (target.inventory.some(i => i.hungerRestore)) {
          events.push({
            type: 'sabotage',
            text: `${champion.name} poisons ${target.name}'s food supplies!`,
            severity: 'danger'
          });
          // Mark the food as poisoned (will hurt them when they eat it)
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
        // Increase chance of others finding target
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

function handleTaunt(champion, target, allChampions) {
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
    // Taunt succeeds
    modifyRelationship(target, champion.id, -25, allChampions);
    
    if (target.personality.impulsiveness > 50 || target.personality.pride > 60) {
      target.sanity -= random(5, 15);
      events.push({
        type: 'social',
        text: `${target.name} is enraged by the mockery!`
      });
      
      // Impulsive targets might attack immediately
      if (target.personality.impulsiveness > 70 && randomFloat() < 0.4) {
        events.push({
          type: 'action',
          text: `${target.name} charges at ${champion.name} in blind fury!`
        });
        // Target attacks at disadvantage due to rage
        target.energy -= 10;
        events.push(...resolveCombat(target, champion, allChampions));
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

function handleMercyOffer(champion, target, allChampions) {
  const events = [];
  
  // Can only offer mercy to wounded enemies
  if (target.health > 30) {
    return events;
  }
  
  events.push({
    type: 'mercy',
    text: `${champion.name} offers mercy to the wounded ${target.name}.`,
    severity: 'success'
  });
  
  // Target's response based on personality
  const acceptChance = (100 - target.personality.pride) / 100 * 0.5 + 
                       target.personality.cunning / 100 * 0.3 +
                       (target.health < 20 ? 0.3 : 0);
  
  if (randomFloat() < acceptChance) {
    // Mercy accepted
    events.push({
      type: 'mercy',
      text: `${target.name} accepts the mercy and swears not to harm ${champion.name}.`,
      severity: 'success'
    });
    
    modifyRelationship(target, champion.id, 40, allChampions);
    modifyRelationship(champion, target.id, 20, allChampions);
    champion.popularity += 15;
    
    // Empathetic champions gain sanity from showing mercy
    if (champion.personality.empathy > 60) {
      champion.sanity = clamp(champion.sanity + 10, 0, 100);
    }
  } else {
    // Mercy rejected
    if (target.personality.pride > 70) {
      events.push({
        type: 'social',
        text: `${target.name} spits at ${champion.name}'s feet. "I need no mercy from the likes of you!"`
      });
      modifyRelationship(target, champion.id, -20, allChampions);
    } else {
      // Might be a trick
      if (target.personality.cunning > 60 && randomFloat() < 0.4) {
        events.push({
          type: 'betrayal',
          text: `${target.name} pretends to accept, then attacks ${champion.name} when their guard is down!`,
          severity: 'danger'
        });
        events.push(...resolveCombat(target, champion, allChampions));
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

function handleAmbush(champion, target, allChampions) {
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
  
  // Keen senses bonus
  const keenSenses = getRacePassiveValue(target, 'detectionBonus');
  if (keenSenses) {
    awarenessRoll *= (1 + keenSenses.value);
  }
  
  if (stealthRoll > awarenessRoll) {
    // Ambush succeeds - attacker gets free hits
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
      // Combat continues with target at disadvantage
      target.energy -= 20; // Panic
      events.push(...resolveCombat(champion, target, allChampions));
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

function handleRescueAttempt(champion, captive, captor, allChampions) {
  const events = [];
  
  // This is a high-risk action
  champion.energy -= 30;
  
  events.push({
    type: 'rescue',
    text: `${champion.name} attempts to rescue ${captive.name} from ${captor.name}!`,
    severity: 'warning'
  });
  
  // Combined might vs captor
  const rescueStrength = champion.stats.combat + champion.stats.strength * 0.5;
  const captorStrength = captor.stats.combat + captor.stats.strength * 0.5;
  
  if (rescueStrength > captorStrength * 0.9 || randomFloat() < 0.3) {
    // Rescue succeeds
    events.push({
      type: 'rescue',
      text: `${champion.name} successfully frees ${captive.name}!`,
      severity: 'success'
    });
    
    modifyRelationship(captive, champion.id, 50, allChampions);
    modifyRelationship(captor, champion.id, -40, allChampions);
    champion.popularity += 20;
    
    // Combat likely ensues
    if (captor.personality.aggression > 40) {
      events.push(...resolveCombat(champion, captor, allChampions));
    }
  } else {
    // Rescue fails
    events.push({
      type: 'action',
      text: `The rescue attempt fails! ${captor.name} drives off ${champion.name}.`
    });
    
    const damage = random(10, 25);
    champion.health -= damage;
    modifyRelationship(captor, champion.id, -30, allChampions);
  }
  
  return events;
}

function handleTrade(champion, target, allChampions) {
  const events = [];
  
  if (champion.inventory.length === 0 || target.inventory.length === 0) {
    return events;
  }
  
  // Check if target is willing to trade
  const relationship = getRelationship(champion, target.id);
  const willingness = relationship + target.personality.sociability - target.personality.aggression;
  
  if (willingness < 0 && randomFloat() < 0.7) {
    events.push({
      type: 'social',
      text: `${target.name} refuses to trade with ${champion.name}.`
    });
    return events;
  }
  
  // Find items to trade
  const championItem = pick(champion.inventory);
  const targetItem = pick(target.inventory);
  
  // Check if trade makes sense for both parties
  const championNeeds = !champion.inventory.some(i => i.hungerRestore) && targetItem.hungerRestore;
  const targetNeeds = !target.inventory.some(i => i.combatBonus) && championItem.combatBonus;
  
  if (championNeeds || targetNeeds || randomFloat() < 0.4) {
    // Trade happens
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

function handleIntimidation(champion, target, allChampions) {
  const events = [];
  
  // Race passive - intimidating presence (orc)
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
    `"I can smell your fear."`,
  ];
  
  events.push({
    type: 'intimidation',
    text: `${champion.name} tries to intimidate ${target.name}: ${pick(intimidateLines)}`
  });
  
  if (intimidateCheck > resistCheck) {
    // Intimidation succeeds
    if (target.personality.bravery < 40) {
      // Coward flees
      const escapeZone = pick(BATTLEFIELD_ZONES.filter(z => z.id !== target.zone));
      target.zone = escapeZone.id;
      events.push({
        type: 'social',
        text: `${target.name} is terrified and flees to ${escapeZone.name}!`,
        severity: 'warning'
      });
    } else if (randomFloat() < 0.5 && target.inventory.length > 0) {
      // Drops an item
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
    
    // Undead terrifying passive
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

function handleChallenge(champion, target, allChampions) {
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
  
  // Will they accept?
  const acceptChance = (target.personality.pride / 100) * 0.4 +
                       (target.personality.bravery / 100) * 0.3 +
                       (getCombatPower(target) > getCombatPower(champion) * 0.8 ? 0.3 : 0);
  
  if (target.personality.pride > 70 || randomFloat() < acceptChance) {
    events.push({
      type: 'challenge',
      text: `${target.name} accepts the challenge!`
    });
    
    // Honorable combat - both get a moment to prepare
    champion.energy = clamp(champion.energy + 10, 0, 100);
    target.energy = clamp(target.energy + 10, 0, 100);
    
    events.push(...resolveCombat(champion, target, allChampions));
    
    // Winner gains honor/popularity
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
    
    // Refusing costs honor
    target.popularity -= 10;
    champion.popularity += 5;
  }
  
  return events;
}

function handleGossip(champion, listener, aboutTarget, allChampions) {
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
  
  // Cunning champions spread more convincing gossip
  const gossip = pick(gossipTypes.filter(g => 
    champion.personality.cunning > 50 || g.type !== 'negative'
  ));
  
  events.push({
    type: 'gossip',
    text: `${champion.name} ${gossip.text}`
  });
  
  // Listener's intelligence determines if they believe it
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
  
  // Bonding through gossip
  modifyRelationship(listener, champion.id, 5, allChampions);
  
  return events;
}

function handleEnvironmentalHazard(champion, zone) {
  const events = [];
  
  const hazards = {
    central_keep: ['Abandoned trap', 'collapsing supply crate'],
    forest: ['falling branch', 'poisonous plant', 'hidden pit'],
    lake: ['sudden current', 'water predator', 'slippery rocks'],
    caves: ['cave-in', 'toxic gas pocket', 'underground creature'],
    ruins: ['collapsing wall', 'hidden spike trap', 'unstable floor'],
    swamp: ['quicksand', 'venomous snake', 'toxic gas'],
    cliffs: ['rockslide', 'crumbling ledge', 'strong winds'],
    meadow: ['sudden storm', 'battlefield fire', 'dire wolves']
  };
  
  const hazard = pick(hazards[zone.id] || ['unexpected danger']);
  
  // Survival check
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

function handlePatronGift(champion) {
  const events = [];
  
  // Better gifts for more popular champions
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

function handleLowSanity(champion, allChampions) {
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
  
  // Paranoia might cause attacking allies
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

function handleDivineIntervention(champions, day, gameState) {
  const events = [];
  const livingChampions = champions.filter(t => t.alive);
  
  // Feast event - force champions to central_keep
  if (day > 3 && randomFloat() < 0.15) {
    events.push({
      type: 'fate',
      text: '🎺 Heralds announce a gathering at the Central Keep! Supplies have been left for the taking...',
      severity: 'announcement'
    });
    
    livingChampions.forEach(t => {
      // Desperate champions more likely to go
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
      text: `⚠️ The Gods unleash new dangers in ${targetZone.name}!`,
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
      text: '🔥 Wildfire spreads across the realm! Champions are forced toward the center...',
      severity: 'announcement'
    });
    
    const centralZones = ['central_keep', 'ruins', 'forest'];
    livingChampions.forEach(t => {
      if (!centralZones.includes(t.zone)) {
        t.zone = pick(centralZones);
        t.health -= random(5, 15); // Damage from fleeing
      }
    });
    
    gameState.daysSinceLastDeath = 0;
  }
  
  return events;
}

// ============================================
// OPENING MELEE (Day 1 Special)
// ============================================

function runOpeningMelee(champions) {
  const events = [];
  const allChampions = [...champions];
  
  events.push({
    type: 'announcement',
    text: '⚔️ THE GRAND TOURNAMENT BEGINS! Champions take their positions on the battlefield...',
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
          combatLog: result.combatLog,
          combatId: generateId()
        });
      } else {
        events.push({
          type: 'combat',
          text: `${champion.name} and ${opponent.name} clash at the Central Keep! ${result.winner.name} wins the exchange.`,
          severity: 'danger',
          combatLog: result.combatLog,
          combatId: generateId()
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
    text: `💀 The opening melee ends. ${deaths} champions have fallen. ${24 - deaths} remain.`,
    severity: 'announcement'
  });
  
  return events;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function HungerGamesSimulator() {
  const [champions, setChampions] = useState(null);
  const [day, setDay] = useState(0);
  const [events, setEvents] = useState([]);
  const [combatLogs, setCombatLogs] = useState([]);
  const [selectedCombatLog, setSelectedCombatLog] = useState(null);
  const [gameState, setGameState] = useState({
    phase: 'setup', // setup, ready, opening melee, running, finished
    daysSinceLastDeath: 0,
    feast: false
  });
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [editingChampion, setEditingChampion] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  const livingChampions = useMemo(() => 
    champions?.filter(t => t.alive) || [], 
    [champions]
  );

  const deadChampions = useMemo(() => 
    champions?.filter(t => !t.alive) || [], 
    [champions]
  );

  const startGame = useCallback(() => {
    const newChampions = generateAllChampions();
    const relationshipEvents = generatePreExistingRelationships(newChampions);
    
    setChampions(newChampions);
    setDay(0);
    
    // Show backstory events first, then the announcement
    const initialEvents = [
      { type: 'announcement', text: 'The champions have been chosen. The Grand Tournament will begin shortly...', severity: 'announcement' },
      ...relationshipEvents
    ];
    
    setEvents(initialEvents);
    setCombatLogs([]);
    setSelectedCombatLog(null);
    setGameState({ phase: 'ready', daysSinceLastDeath: 0, feast: false });
    setSelectedChampion(null);
    setShowEditor(false);
    setEditingChampion(null);
  }, []);

  const updateChampion = useCallback((championId, updates) => {
    setChampions(prev => prev.map(t => {
      if (t.id === championId) {
        return { ...t, ...updates };
      }
      return t;
    }));
  }, []);

  const updateChampionStat = useCallback((championId, statType, statName, value) => {
    setChampions(prev => prev.map(t => {
      if (t.id === championId) {
        return {
          ...t,
          [statType]: {
            ...t[statType],
            [statName]: Number(value)
          }
        };
      }
      return t;
    }));
  }, []);

  const updateChampionRelationship = useCallback((championId, otherId, value) => {
    setChampions(prev => prev.map(t => {
      if (t.id === championId) {
        return {
          ...t,
          relationships: {
            ...t.relationships,
            [otherId]: Number(value)
          }
        };
      }
      return t;
    }));
  }, []);

  const regenerateChampion = useCallback((championId) => {
    const champion = champions.find(t => t.id === championId);
    if (!champion) return;
    
    const usedNames = new Set(champions.filter(t => t.id !== championId).map(t => t.name));
    const newChampion = generateChampion(champion.realm, usedNames);
    newChampion.id = championId; // Keep same ID
    
    // Preserve relationships others have with this champion
    setChampions(prev => prev.map(t => {
      if (t.id === championId) {
        return newChampion;
      }
      return t;
    }));
    
    setEditingChampion(newChampion);
  }, [champions]);

  const regenerateAllRelationships = useCallback(() => {
    if (!champions) return;
    
    // Clear all relationships
    const clearedChampions = champions.map(t => ({
      ...t,
      relationships: {},
      grudges: {}
    }));
    
    // Generate new relationships
    const relationshipEvents = generatePreExistingRelationships(clearedChampions);
    
    setChampions(clearedChampions);
    setEvents(prev => [...relationshipEvents, ...prev]);
  }, [champions]);

  const runDay = useCallback(() => {
    if (!champions || livingChampions.length <= 1) return;
    
    let newEvents = [];
    const newDay = day + 1;
    const newChampions = JSON.parse(JSON.stringify(champions));
    const newGameState = { ...gameState };
    
    if (newDay === 1) {
      // Opening Melee
      newEvents = runOpeningMelee(newChampions);
      newGameState.phase = 'running';
    } else {
      // Regular day
      newEvents.push({
        type: 'announcement',
        text: `☀️ Day ${newDay} dawns over the battlefield.`,
        severity: 'announcement'
      });
      
      // Fate interventions
      const gmEvents = handleDivineIntervention(newChampions, newDay, newGameState);
      newEvents.push(...gmEvents);
      
      // Each living champion takes their turn
      const livingOrder = shuffle(newChampions.filter(t => t.alive));
      livingOrder.forEach(champion => {
        if (champion.alive) {
          const championEvents = generateEvent(champion, newChampions, newDay, newGameState);
          newEvents.push(...championEvents);
        }
      });
      
      // Night falls
      newEvents.push({
        type: 'announcement',
        text: `🌙 Night falls. The dead are mourned...`,
        severity: 'announcement'
      });
      
      // Count deaths
      const deathsToday = newChampions.filter(t => !t.alive).length - deadChampions.length;
      if (deathsToday > 0) {
        newGameState.daysSinceLastDeath = 0;
      } else {
        newGameState.daysSinceLastDeath++;
      }
    }
    
    // Check for winner
    const stillAlive = newChampions.filter(t => t.alive);
    if (stillAlive.length === 1) {
      newEvents.push({
        type: 'victory',
        text: `🏆 ${stillAlive[0].name} from ${stillAlive[0].realmName} emerges victorious from the Grand Tournament!`,
        severity: 'victory'
      });
      newGameState.phase = 'finished';
    } else if (stillAlive.length === 0) {
      newEvents.push({
        type: 'announcement',
        text: `💀 No champions survive. The Games end in tragedy.`,
        severity: 'death'
      });
      newGameState.phase = 'finished';
    }
    
    setChampions(newChampions);
    setDay(newDay);
    setEvents(prev => [...newEvents, ...prev]);
    setGameState(newGameState);
  }, [champions, day, gameState, livingChampions, deadChampions]);

  // Auto-play effect
  useEffect(() => {
    if (autoPlay && gameState.phase === 'running' && livingChampions.length > 1) {
      const timer = setTimeout(runDay, speed);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, gameState.phase, livingChampions.length, runDay, speed]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'death': return 'bg-red-900/50 border-red-500 text-red-100';
      case 'danger': return 'bg-orange-900/30 border-orange-500 text-orange-100';
      case 'warning': return 'bg-yellow-900/30 border-yellow-500 text-yellow-100';
      case 'success': return 'bg-emerald-900/30 border-emerald-500 text-emerald-100';
      case 'announcement': return 'bg-amber-900/40 border-amber-400 text-amber-100';
      case 'victory': return 'bg-gradient-to-r from-amber-600 to-yellow-500 border-yellow-300 text-black font-bold';
      default: return 'bg-stone-800/50 border-stone-600 text-stone-200';
    }
  };

  const getHealthColor = (health) => {
    if (health > 70) return 'bg-emerald-500';
    if (health > 40) return 'bg-yellow-500';
    if (health > 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRelationshipDisplay = (champion, other) => {
    const rel = getRelationship(champion, other.id);
    if (rel > 60) return { text: 'Allied', color: 'text-emerald-400' };
    if (rel > 30) return { text: 'Friendly', color: 'text-green-400' };
    if (rel > -20) return { text: 'Neutral', color: 'text-stone-400' };
    if (rel > -50) return { text: 'Hostile', color: 'text-orange-400' };
    return { text: 'Enemy', color: 'text-red-400' };
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Header */}
      <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/50 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-center tracking-wider" style={{ fontFamily: "Georgia, serif" }}>
            <span className="text-amber-500">REALM OF STRIFE</span>
          </h1>
          <p className="text-center text-stone-400 mt-2 tracking-widest text-sm">MEDIEVAL BATTLE SIMULATION</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-center mb-6">
          {!champions && (
            <button
              onClick={startGame}
              className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded tracking-wider transition-all hover:scale-105"
            >
              BEGIN THE TOURNAMENT
            </button>
          )}
          
          {champions && gameState.phase !== 'finished' && (
            <>
              {gameState.phase === 'ready' && day === 0 && (
                <button
                  onClick={() => setShowEditor(true)}
                  className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded tracking-wider transition-all"
                >
                  ✏️ EDIT CHAMPIONS
                </button>
              )}
              
              <button
                onClick={runDay}
                disabled={autoPlay}
                className="px-6 py-2 bg-red-700 hover:bg-red-600 disabled:bg-stone-700 text-white font-bold rounded tracking-wider transition-all"
              >
                {day === 0 ? 'START OPENING MELEE' : `ADVANCE TO DAY ${day + 1}`}
              </button>
              
              <button
                onClick={() => setAutoPlay(!autoPlay)}
                className={`px-6 py-2 font-bold rounded tracking-wider transition-all ${
                  autoPlay ? 'bg-amber-600 text-black' : 'bg-stone-700 hover:bg-stone-600 text-white'
                }`}
              >
                {autoPlay ? '⏸ PAUSE' : '▶ AUTO-PLAY'}
              </button>
              
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="px-4 py-2 bg-stone-800 border border-stone-600 rounded text-stone-200"
              >
                <option value={2500}>Slow</option>
                <option value={1500}>Normal</option>
                <option value={800}>Fast</option>
                <option value={300}>Very Fast</option>
              </select>
            </>
          )}
          
          {champions && (
            <button
              onClick={startGame}
              className="px-6 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded tracking-wider transition-all"
            >
              NEW GAME
            </button>
          )}
        </div>

        {/* Game Status */}
        {champions && (
          <div className="text-center mb-6">
            <span className="text-2xl text-amber-500 font-bold">
              {gameState.phase === 'finished' ? 'GAMES CONCLUDED' : day === 0 ? 'PRE-GAMES' : `DAY ${day}`}
            </span>
            <span className="mx-4 text-stone-500">|</span>
            <span className="text-lg">
              <span className="text-emerald-400">{livingChampions.length}</span> alive
              <span className="mx-2 text-stone-600">•</span>
              <span className="text-red-400">{deadChampions.length}</span> fallen
            </span>
          </div>
        )}

        {champions && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Champions Panel */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-bold text-amber-500 border-b border-amber-900/50 pb-2 tracking-wider">CHAMPIONS</h2>
              
              <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                {champions.map(champion => (
                  <div
                    key={champion.id}
                    onClick={() => setSelectedChampion(champion.id === selectedChampion?.id ? null : champion)}
                    className={`p-3 rounded cursor-pointer transition-all border ${
                      !champion.alive 
                        ? 'bg-stone-900/50 border-stone-800 opacity-50' 
                        : selectedChampion?.id === champion.id
                          ? 'bg-amber-900/30 border-amber-600'
                          : 'bg-stone-900/50 border-stone-700 hover:border-stone-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-bold ${!champion.alive ? 'line-through text-stone-500' : 'text-stone-100'}`}>
                          {champion.name}
                        </span>
                        <span className="text-stone-500 text-sm ml-2">R{champion.realm}</span>
                        <span className="text-purple-400 text-xs ml-2">{champion.raceName}</span>
                      </div>
                      {champion.alive ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-stone-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getHealthColor(champion.health)} transition-all`}
                              style={{ width: `${champion.health}%` }}
                            />
                          </div>
                          <span className="text-xs text-stone-400 w-8">{Math.round(champion.health)}%</span>
                        </div>
                      ) : (
                        <span className="text-red-500 text-sm">💀</span>
                      )}
                    </div>
                    
                    {champion.alive && (
                      <div className="mt-2 flex gap-2 text-xs text-stone-400">
                        <span>📍 {BATTLEFIELD_ZONES.find(z => z.id === champion.zone)?.name}</span>
                        {champion.kills > 0 && <span className="text-red-400">⚔ {champion.kills}</span>}
                        {champion.inventory.length > 0 && <span>🎒 {champion.inventory.length}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Events Panel */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-xl font-bold text-amber-500 border-b border-amber-900/50 pb-2 tracking-wider">EVENTS</h2>
              
              <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
                {events.map((event, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded border-l-4 ${getSeverityColor(event.severity)}`}
                  >
                    <p className="text-sm leading-relaxed">{event.text}</p>
                    {event.combatLog && (
                      <button
                        onClick={() => setSelectedCombatLog(event.combatLog)}
                        className="mt-2 text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        ⚔ View Combat Log
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-1 space-y-4">
              {selectedChampion ? (
                <>
                  <h2 className="text-xl font-bold text-amber-500 border-b border-amber-900/50 pb-2 tracking-wider">
                    {selectedChampion.name.toUpperCase()}
                  </h2>
                  
                  <div className="bg-stone-900/50 rounded p-4 border border-stone-700 space-y-4 max-h-[600px] overflow-y-auto">
                    <div>
                      <p className="text-amber-400">{selectedChampion.realmName}</p>
                      <p className="text-stone-400 text-sm">
                        {selectedChampion.alive ? `📍 ${BATTLEFIELD_ZONES.find(z => z.id === selectedChampion.zone)?.name}` : '💀 Deceased'}
                      </p>
                    </div>
                    
                    {/* Race */}
                    <div className="bg-stone-800/50 rounded p-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-purple-400">{selectedChampion.raceName}</span>
                        {selectedChampion.magic && (
                          <span className="text-xs text-blue-400 capitalize">({selectedChampion.magic.affinity} affinity)</span>
                        )}
                      </div>
                      <p className="text-stone-400 text-xs mb-2">{selectedChampion.raceDescription}</p>
                      
                      {/* Race Passives */}
                      {selectedChampion.race && RACES[selectedChampion.race] && (
                        <div className="flex flex-wrap gap-1">
                          {Object.values(RACES[selectedChampion.race].passives).map((passive, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-0.5 bg-purple-900/50 border border-purple-700/50 rounded text-xs text-purple-300"
                              title={passive.description}
                            >
                              {passive.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Archetype & Personality */}
                    <div>
                      <h3 className="text-sm font-bold text-amber-400 mb-1">{selectedChampion.archetypeName}</h3>
                      <p className="text-stone-400 text-xs italic mb-2">{selectedChampion.archetypeDesc}</p>
                      
                      {/* Key traits */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {generatePersonalityDescription(selectedChampion).map((trait, i) => (
                          <span key={i} className="px-2 py-0.5 bg-stone-800 rounded text-xs text-stone-300 capitalize">
                            {trait}
                          </span>
                        ))}
                      </div>
                      
                      {/* Backstory */}
                      {selectedChampion.backstories && selectedChampion.backstories.length > 0 && (
                        <div className="text-xs text-stone-400 italic">
                          {selectedChampion.backstories.map((story, i) => (
                            <p key={i}>• {selectedChampion.name} {story}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedChampion.alive && (
                      <>
                        {/* Status Bars */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-xs text-stone-400">Health</span>
                            <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                              <div className={`h-full ${getHealthColor(selectedChampion.health)}`} style={{ width: `${selectedChampion.health}%` }} />
                            </div>
                            <span className="w-8 text-xs text-right">{Math.round(selectedChampion.health)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-xs text-stone-400">Hunger</span>
                            <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500" style={{ width: `${selectedChampion.hunger}%` }} />
                            </div>
                            <span className="w-8 text-xs text-right">{Math.round(selectedChampion.hunger)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-xs text-stone-400">Thirst</span>
                            <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${selectedChampion.thirst}%` }} />
                            </div>
                            <span className="w-8 text-xs text-right">{Math.round(selectedChampion.thirst)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-xs text-stone-400">Energy</span>
                            <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500" style={{ width: `${selectedChampion.energy}%` }} />
                            </div>
                            <span className="w-8 text-xs text-right">{Math.round(selectedChampion.energy)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-16 text-xs text-stone-400">Sanity</span>
                            <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                              <div className="h-full bg-pink-500" style={{ width: `${selectedChampion.sanity}%` }} />
                            </div>
                            <span className="w-8 text-xs text-right">{Math.round(selectedChampion.sanity)}</span>
                          </div>
                        </div>
                        
                        {/* Personality Traits */}
                        <div>
                          <h3 className="text-sm font-bold text-stone-400 mb-2">PERSONALITY</h3>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {Object.entries(selectedChampion.personality).map(([trait, value]) => (
                              <div key={trait} className="flex justify-between items-center">
                                <span className="text-stone-400 capitalize">{trait}</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-12 h-1.5 bg-stone-700 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${value > 65 ? 'bg-red-500' : value < 35 ? 'bg-blue-500' : 'bg-stone-500'}`}
                                      style={{ width: `${value}%` }}
                                    />
                                  </div>
                                  <span className="text-stone-500 w-6 text-right">{value}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Stats */}
                        <div>
                          <h3 className="text-sm font-bold text-stone-400 mb-2">ATTRIBUTES</h3>
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {Object.entries(selectedChampion.stats).map(([stat, value]) => (
                              <div key={stat} className="flex justify-between">
                                <span className="text-stone-400 capitalize">{stat}</span>
                                <span className="text-stone-200">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Inventory */}
                        <div>
                          <h3 className="text-sm font-bold text-stone-400 mb-2">INVENTORY</h3>
                          {selectedChampion.inventory.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {selectedChampion.inventory.map((item, i) => (
                                <span key={i} className="px-2 py-1 bg-stone-800 rounded text-xs text-stone-300">
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-stone-500 text-xs">Empty</p>
                          )}
                        </div>

                        {/* Relationships */}
                        <div>
                          <h3 className="text-sm font-bold text-stone-400 mb-2">RELATIONSHIPS</h3>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {livingChampions
                              .filter(t => t.id !== selectedChampion.id)
                              .sort((a, b) => {
                                const relA = Math.abs(getRelationship(selectedChampion, a.id));
                                const relB = Math.abs(getRelationship(selectedChampion, b.id));
                                return relB - relA;
                              })
                              .map(other => {
                                const rel = getRelationshipDisplay(selectedChampion, other);
                                return (
                                  <div key={other.id} className="flex justify-between text-xs">
                                    <span className="text-stone-400">{other.name}</span>
                                    <span className={rel.color}>{rel.text}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Injuries */}
                        {selectedChampion.injuries.length > 0 && (
                          <div>
                            <h3 className="text-sm font-bold text-red-400 mb-2">INJURIES</h3>
                            <div className="space-y-1">
                              {selectedChampion.injuries.map((injury, i) => (
                                <div key={i} className="text-xs text-red-300">
                                  {injury.type} ({injury.severity}) - {injury.daysLeft} days
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Stats */}
                    <div className="pt-2 border-t border-stone-700">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-2xl font-bold text-red-400">{selectedChampion.kills}</p>
                          <p className="text-xs text-stone-500">Kills</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-amber-400">{selectedChampion.popularity}</p>
                          <p className="text-xs text-stone-500">Popularity</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-stone-400">{selectedChampion.daysAlive}</p>
                          <p className="text-xs text-stone-500">Days</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-amber-500 border-b border-amber-900/50 pb-2 tracking-wider">BATTLEFIELD MAP</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {BATTLEFIELD_ZONES.map(zone => {
                      const championsHere = livingChampions.filter(t => t.zone === zone.id);
                      return (
                        <div 
                          key={zone.id}
                          className={`p-3 rounded border ${
                            championsHere.length > 0 
                              ? 'bg-stone-800/50 border-amber-700' 
                              : 'bg-stone-900/30 border-stone-800'
                          }`}
                        >
                          <p className="font-bold text-sm text-stone-200">{zone.name}</p>
                          <p className="text-xs text-stone-500 mb-2">{zone.description}</p>
                          {championsHere.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {championsHere.map(t => (
                                <span 
                                  key={t.id}
                                  onClick={() => setSelectedChampion(t)}
                                  className="px-1.5 py-0.5 bg-stone-700 rounded text-xs cursor-pointer hover:bg-stone-600"
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Initial state */}
        {!champions && (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg mb-4">Welcome to Realm of Strife - a medieval battle simulation.</p>
            <p className="text-stone-500 max-w-xl mx-auto">
              Features: Champion attributes, dynamic relationships, resource management, 
              psychological states, battlefield zones, noble patrons, divine interventions, 
              and emergent storytelling.
            </p>
          </div>
        )}
      </main>

      {/* Champion Editor Modal */}
      {showEditor && champions && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditor(false);
              setEditingChampion(null);
            }
          }}
        >
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <div className="bg-stone-900 border border-blue-700 rounded-lg max-w-6xl w-full">
              <div className="sticky top-0 bg-stone-900 flex items-center justify-between p-4 border-b border-stone-700 rounded-t-lg z-10">
                <h3 className="text-xl font-bold text-blue-400 tracking-wider">TRIBUTE EDITOR</h3>
                <div className="flex gap-2">
                  <button
                    onClick={regenerateAllRelationships}
                    className="px-3 py-1 bg-purple-700 hover:bg-purple-600 rounded text-white text-sm"
                  >
                    Regenerate Relationships
                  </button>
                  <button
                    onClick={() => {
                      setShowEditor(false);
                      setEditingChampion(null);
                    }}
                    className="text-stone-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="flex">
                {/* Champion List */}
                <div className="w-64 border-r border-stone-700 p-4 max-h-[70vh] overflow-y-auto">
                  <h4 className="text-sm font-bold text-stone-400 mb-3">SELECT TRIBUTE</h4>
                  <div className="space-y-1">
                    {champions.map(champion => (
                      <button
                        key={champion.id}
                        onClick={() => setEditingChampion(champion)}
                        className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                          editingChampion?.id === champion.id
                            ? 'bg-blue-700 text-white'
                            : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                        }`}
                      >
                        <span className="font-bold">{champion.name}</span>
                        <span className="text-stone-400 ml-2">R{champion.realm}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Editor Panel */}
                <div className="flex-1 p-4 max-h-[70vh] overflow-y-auto">
                  {editingChampion ? (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">Name</label>
                          <input
                            type="text"
                            value={editingChampion.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              updateChampion(editingChampion.id, { name: newName });
                              setEditingChampion(prev => ({ ...prev, name: newName }));
                            }}
                            className="w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-stone-400 mb-1">Realm</label>
                          <select
                            value={editingChampion.realm}
                            onChange={(e) => {
                              const newRealm = Number(e.target.value);
                              updateChampion(editingChampion.id, { 
                                realm: newRealm,
                                realmName: REALM_NAMES[newRealm - 1]
                              });
                              setEditingChampion(prev => ({ 
                                ...prev, 
                                realm: newRealm,
                                realmName: REALM_NAMES[newRealm - 1]
                              }));
                            }}
                            className="w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded text-white"
                          >
                            {REALM_NAMES.map((name, i) => (
                              <option key={i} value={i + 1}>{name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Archetype */}
                      <div>
                        <label className="block text-sm text-stone-400 mb-1">Archetype</label>
                        <select
                          value={editingChampion.archetype}
                          onChange={(e) => {
                            const arch = CHAMPION_ARCHETYPES.find(a => a.id === e.target.value);
                            if (arch) {
                              updateChampion(editingChampion.id, {
                                archetype: arch.id,
                                archetypeName: arch.name,
                                archetypeDesc: arch.description
                              });
                              setEditingChampion(prev => ({
                                ...prev,
                                archetype: arch.id,
                                archetypeName: arch.name,
                                archetypeDesc: arch.description
                              }));
                            }
                          }}
                          className="w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded text-white"
                        >
                          {CHAMPION_ARCHETYPES.map(arch => (
                            <option key={arch.id} value={arch.id}>{arch.name} - {arch.description}</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Race */}
                      <div>
                        <label className="block text-sm text-stone-400 mb-1">Race</label>
                        <select
                          value={editingChampion.race}
                          onChange={(e) => {
                            const race = RACES[e.target.value];
                            if (race) {
                              updateChampion(editingChampion.id, {
                                race: race.id,
                                raceName: race.name,
                                raceDescription: race.description,
                                magic: {
                                  ...editingChampion.magic,
                                  affinity: race.magicAffinity
                                }
                              });
                              setEditingChampion(prev => ({
                                ...prev,
                                race: race.id,
                                raceName: race.name,
                                raceDescription: race.description,
                                magic: {
                                  ...prev.magic,
                                  affinity: race.magicAffinity
                                }
                              }));
                            }
                          }}
                          className="w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded text-white"
                        >
                          {Object.values(RACES).map(race => (
                            <option key={race.id} value={race.id}>{race.name} - {race.description}</option>
                          ))}
                        </select>
                        
                        {/* Show race passives */}
                        {editingChampion.race && RACES[editingChampion.race] && (
                          <div className="mt-2 p-2 bg-stone-800/50 rounded">
                            <p className="text-xs text-stone-400 mb-1">Passives:</p>
                            <div className="flex flex-wrap gap-1">
                              {Object.values(RACES[editingChampion.race].passives).map((passive, i) => (
                                <span 
                                  key={i} 
                                  className="px-2 py-0.5 bg-purple-900/50 border border-purple-700/50 rounded text-xs text-purple-300"
                                  title={passive.description}
                                >
                                  {passive.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Backstory */}
                      <div>
                        <label className="block text-sm text-stone-400 mb-1">Backstory (one per line)</label>
                        <textarea
                          value={editingChampion.backstories?.join('\n') || ''}
                          onChange={(e) => {
                            const newBackstories = e.target.value.split('\n').filter(s => s.trim());
                            updateChampion(editingChampion.id, { backstories: newBackstories });
                            setEditingChampion(prev => ({ ...prev, backstories: newBackstories }));
                          }}
                          className="w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded text-white h-20 text-sm"
                          placeholder="has a younger sibling to protect..."
                        />
                      </div>
                      
                      {/* Stats */}
                      <div>
                        <h4 className="text-sm font-bold text-stone-400 mb-2">ATTRIBUTES</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Object.entries(editingChampion.stats).map(([stat, value]) => (
                            <div key={stat}>
                              <label className="block text-xs text-stone-400 mb-1 capitalize">{stat}</label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={value}
                                onChange={(e) => {
                                  const newValue = clamp(Number(e.target.value), 0, 100);
                                  updateChampionStat(editingChampion.id, 'stats', stat, newValue);
                                  setEditingChampion(prev => ({
                                    ...prev,
                                    stats: { ...prev.stats, [stat]: newValue }
                                  }));
                                }}
                                className="w-full px-2 py-1 bg-stone-800 border border-stone-600 rounded text-white text-sm"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Personality */}
                      <div>
                        <h4 className="text-sm font-bold text-stone-400 mb-2">PERSONALITY</h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {Object.entries(editingChampion.personality).map(([trait, value]) => (
                            <div key={trait}>
                              <label className="block text-xs text-stone-400 mb-1 capitalize">{trait}</label>
                              <input
                                type="range"
                                min="5"
                                max="95"
                                value={value}
                                onChange={(e) => {
                                  const newValue = Number(e.target.value);
                                  updateChampionStat(editingChampion.id, 'personality', trait, newValue);
                                  setEditingChampion(prev => ({
                                    ...prev,
                                    personality: { ...prev.personality, [trait]: newValue }
                                  }));
                                }}
                                className="w-full"
                              />
                              <div className="text-xs text-center text-stone-500">{value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Relationships */}
                      <div>
                        <h4 className="text-sm font-bold text-stone-400 mb-2">RELATIONSHIPS</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                          {champions.filter(t => t.id !== editingChampion.id).map(other => {
                            const rel = editingChampion.relationships[other.id] || 0;
                            return (
                              <div key={other.id} className="bg-stone-800 p-2 rounded">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-stone-300 font-medium">{other.name}</span>
                                  <span className="text-xs text-stone-500">R{other.realm}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-red-400 w-6">-100</span>
                                  <input
                                    type="range"
                                    min="-100"
                                    max="100"
                                    value={rel}
                                    onChange={(e) => {
                                      const newValue = Number(e.target.value);
                                      updateChampionRelationship(editingChampion.id, other.id, newValue);
                                      setEditingChampion(prev => ({
                                        ...prev,
                                        relationships: { ...prev.relationships, [other.id]: newValue }
                                      }));
                                    }}
                                    className="flex-1 h-2"
                                    style={{ minWidth: 0 }}
                                  />
                                  <span className="text-xs text-emerald-400 w-6">100</span>
                                  <span className={`text-sm font-bold w-10 text-right ${
                                    rel > 30 ? 'text-emerald-400' : rel < -30 ? 'text-red-400' : 'text-stone-400'
                                  }`}>{rel}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-stone-700">
                        <button
                          onClick={() => regenerateChampion(editingChampion.id)}
                          className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded text-white text-sm"
                        >
                          🎲 Randomize This Champion
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-stone-500 py-20">
                      <p className="text-lg mb-2">Select a champion to edit</p>
                      <p className="text-sm">You can modify names, stats, personality traits, backstories, and relationships</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="sticky bottom-0 bg-stone-900 p-4 border-t border-stone-700 flex justify-end gap-2 rounded-b-lg">
                <button
                  onClick={() => {
                    setShowEditor(false);
                    setEditingChampion(null);
                  }}
                  className="px-6 py-2 bg-blue-700 hover:bg-blue-600 rounded text-white font-bold"
                >
                  Done Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combat Log Modal */}
      {selectedCombatLog && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedCombatLog(null);
          }}
        >
          <div className="min-h-full flex items-start justify-center p-4 py-8">
            <div className="bg-stone-900 border border-amber-700 rounded-lg max-w-2xl w-full relative">
              <div className="sticky top-0 bg-stone-900 flex items-center justify-between p-4 border-b border-stone-700 rounded-t-lg z-10">
                <h3 className="text-xl font-bold text-amber-500 tracking-wider">COMBAT LOG</h3>
                <button
                  onClick={() => setSelectedCombatLog(null)}
                  className="text-stone-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              
              <div className="p-4 font-mono text-sm">
              {selectedCombatLog.map((entry, i) => {
                let className = "py-1 ";
                let prefix = "";
                
                switch (entry.type) {
                  case 'header':
                    className += "text-amber-400 font-bold text-center border-b border-stone-700 pb-2 mb-2";
                    break;
                  case 'round':
                    className += "text-stone-500 mt-3 mb-1";
                    break;
                  case 'info':
                    className += "text-stone-400 italic";
                    break;
                  case 'status':
                    className += "text-blue-400";
                    prefix = "▸ ";
                    break;
                  case 'miss':
                    className += "text-stone-500";
                    prefix = "○ ";
                    break;
                  case 'blocked':
                    className += "text-yellow-500";
                    prefix = "◐ ";
                    break;
                  case 'hit':
                    if (entry.severity === 'critical') {
                      className += "text-red-400 font-bold";
                      prefix = "◆ ";
                    } else if (entry.severity === 'severe') {
                      className += "text-orange-400";
                      prefix = "◆ ";
                    } else if (entry.severity === 'moderate') {
                      className += "text-yellow-400";
                      prefix = "● ";
                    } else {
                      className += "text-stone-300";
                      prefix = "• ";
                    }
                    break;
                  case 'fatal':
                    className += "text-red-500 font-bold";
                    prefix = "☠ ";
                    break;
                  case 'death':
                    className += "text-red-500 font-bold text-center mt-2";
                    prefix = "💀 ";
                    break;
                  case 'victory':
                    className += "text-emerald-400 font-bold text-center mt-2";
                    prefix = "🏆 ";
                    break;
                  case 'disengage':
                    className += "text-yellow-500 italic";
                    prefix = "↩ ";
                    break;
                  case 'loot':
                    className += "text-amber-400";
                    prefix = "⊕ ";
                    break;
                  default:
                    className += "text-stone-300";
                }
                
                return (
                  <div key={i} className={className}>
                    {prefix}{entry.text}
                    {entry.damage && entry.type === 'hit' && (
                      <span className="text-red-400 ml-2">[-{entry.damage} HP]</span>
                    )}
                  </div>
                );
              })}
              </div>
              
              <div className="sticky bottom-0 bg-stone-900 p-4 border-t border-stone-700 flex justify-end rounded-b-lg">
                <button
                  onClick={() => setSelectedCombatLog(null)}
                  className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fonts via link would be needed in production */}
    </div>
  );
}
