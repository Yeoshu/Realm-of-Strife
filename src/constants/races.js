// Race system constants and helpers

export const RACES = {
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
    magicAffinity: 'neutral',
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
    magicAffinity: 'arcane',
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
    magicAffinity: 'runic',
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
    magicAffinity: 'primal',
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
    magicAffinity: 'neutral',
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
    magicAffinity: 'necromantic',
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
    magicAffinity: 'primal',
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
    magicAffinity: 'shadow',
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
    magicAffinity: 'primal',
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
    magicAffinity: 'blood',
    magicBonus: 25,
    commonInRealms: [1, 5],
    rarity: 0.03
  }
};

// Helper function to get race passive effect
export function getRacePassiveValue(champion, effectType) {
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
export function hasRacePassive(champion, effectType) {
  return getRacePassiveValue(champion, effectType) !== null;
}

// Get all passive effects of a type for a champion
export function applyRacePassive(champion, effectType, baseValue, context = {}) {
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
