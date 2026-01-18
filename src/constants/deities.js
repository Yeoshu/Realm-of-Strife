// Patron Deity System Constants

export const DEITIES = {
  kragorn: {
    id: 'kragorn',
    name: 'Kragorn',
    domain: 'War',
    description: 'The Blood God demands glory through combat',
    preferredActions: ['hunt', 'challenge', 'intimidate', 'group_hunt', 'archetype_blood_rage', 'archetype_smite', 'archetype_execution', 'archetype_flourish'],
    dislikedActions: ['hide', 'flee', 'mercy', 'rest'],
    favoredTraits: { aggression: 1, bravery: 1 },
    disfavoredTraits: { empathy: -1 }
  },
  morwyn: {
    id: 'morwyn',
    name: 'Morwyn',
    domain: 'Death',
    description: 'The Silent One welcomes all to the eternal dark',
    preferredActions: ['hunt', 'ambush', 'archetype_shadow_strike', 'archetype_execution', 'betray'],
    dislikedActions: ['heal', 'help_ally', 'archetype_miracle', 'mercy'],
    favoredTraits: { ruthlessness: 1, cunning: 1 },
    disfavoredTraits: { empathy: -1, loyalty: -1 }
  },
  sylvana: {
    id: 'sylvana',
    name: 'Sylvana',
    domain: 'Nature',
    description: 'The Green Mother nurtures those who respect the wilds',
    preferredActions: ['forage', 'group_forage', 'rest', 'archetype_track', 'trade'],
    dislikedActions: ['sabotage', 'theft', 'trap', 'betray'],
    favoredTraits: { empathy: 1 },
    disfavoredTraits: { ruthlessness: -1, cunning: -1 }
  },
  atheon: {
    id: 'atheon',
    name: 'Atheon',
    domain: 'Wisdom',
    description: 'The All-Knowing values cunning over brute strength',
    preferredActions: ['ally', 'archetype_scheme', 'gossip', 'trap', 'archetype_track', 'trade'],
    dislikedActions: ['archetype_chaos', 'archetype_blood_rage'],
    favoredTraits: { cunning: 1, sociability: 1 },
    disfavoredTraits: { impulsiveness: -1 }
  },
  valoris: {
    id: 'valoris',
    name: 'Valoris',
    domain: 'Honor',
    description: 'The Shining Knight rewards virtue and courage',
    preferredActions: ['challenge', 'mercy', 'help_ally', 'defend_ally', 'archetype_rally', 'archetype_shield_wall', 'archetype_inspire'],
    dislikedActions: ['betray', 'ambush', 'theft', 'archetype_shadow_strike'],
    favoredTraits: { loyalty: 1, bravery: 1 },
    disfavoredTraits: { cunning: -1, ruthlessness: -1 }
  },
  xaroth: {
    id: 'xaroth',
    name: 'Xaroth',
    domain: 'Chaos',
    description: 'The Trickster delights in discord and upheaval',
    preferredActions: ['betray', 'theft', 'sabotage', 'archetype_chaos', 'gossip', 'taunt'],
    dislikedActions: ['ally', 'help_ally', 'defend_ally', 'archetype_rally'],
    favoredTraits: { impulsiveness: 1, cunning: 1 },
    disfavoredTraits: { loyalty: -1, sociability: -1 }
  },
  seraphiel: {
    id: 'seraphiel',
    name: 'Seraphiel',
    domain: 'Mercy',
    description: 'The Compassionate One shields the weak and heals the wounded',
    preferredActions: ['mercy', 'heal', 'help_ally', 'archetype_miracle', 'archetype_inspire', 'trade'],
    dislikedActions: ['hunt', 'ambush', 'archetype_execution', 'betray'],
    favoredTraits: { empathy: 1, loyalty: 1 },
    disfavoredTraits: { ruthlessness: -1, aggression: -1 }
  },
  nemara: {
    id: 'nemara',
    name: 'Nemara',
    domain: 'Vengeance',
    description: 'The Wrathful demands that wrongs be repaid in blood',
    preferredActions: ['hunt', 'taunt', 'archetype_purge', 'intimidate', 'challenge'],
    dislikedActions: ['mercy', 'ally', 'trade'],
    favoredTraits: { vendetta: 1, aggression: 1 },
    disfavoredTraits: { empathy: -1 }
  }
};

export const FAVOR_THRESHOLDS = {
  // Positive thresholds
  blessed: 25,
  favored: 50,
  champion: 75,
  exalted: 100,
  // Negative thresholds
  disfavored: -25,
  cursed: -50,
  forsaken: -75,
  abandoned: -100
};

export const FAVOR_CHANGES = {
  // Preferred actions grant favor
  preferred: { min: 3, max: 8 },
  // Disliked actions lose favor
  disliked: { min: -8, max: -3 },
  // Neutral actions have small random change
  neutral: { min: -1, max: 1 },
  // Special context bonuses
  kill: 5,
  mercyGiven: 3,
  betrayalCommitted: 4,
  allyHelped: 2,
  grudgeKill: 8
};

export const PIETY_THRESHOLDS = {
  godless: 25,   // Below this, champion may not have a deity
  observant: 50, // Normal religious behavior
  devout: 75     // Strong religious behavior
};

// Blessings granted at positive favor thresholds
export const BLESSINGS = {
  // Blessed tier (+25)
  blessed: {
    kragorn: { id: 'warriors_favor', name: "Warrior's Favor", effect: 'combatBonus', value: 5, description: 'Combat skill +5' },
    morwyn: { id: 'deaths_touch', name: "Death's Touch", effect: 'critChance', value: 0.05, description: '+5% critical hit chance' },
    sylvana: { id: 'natures_bounty', name: "Nature's Bounty", effect: 'forageBonus', value: 0.2, description: '+20% forage success' },
    atheon: { id: 'keen_mind', name: 'Keen Mind', effect: 'cunningBonus', value: 10, description: 'Cunning +10' },
    valoris: { id: 'honorable_presence', name: 'Honorable Presence', effect: 'allyBonus', value: 10, description: '+10 to alliance attempts' },
    xaroth: { id: 'chaos_luck', name: 'Chaos Luck', effect: 'escapeBonus', value: 0.15, description: '+15% escape chance' },
    seraphiel: { id: 'healing_hands', name: 'Healing Hands', effect: 'healBonus', value: 0.2, description: '+20% healing received' },
    nemara: { id: 'vengeful_strike', name: 'Vengeful Strike', effect: 'grudgeDamage', value: 0.15, description: '+15% damage to grudge targets' }
  },
  // Favored tier (+50)
  favored: {
    kragorn: { id: 'blood_fury', name: 'Blood Fury', effect: 'healthRegen', value: 2, description: '+2 health regen per day in combat zones' },
    morwyn: { id: 'shroud_of_death', name: 'Shroud of Death', effect: 'stealthBonus', value: 15, description: 'Stealth +15' },
    sylvana: { id: 'wild_resilience', name: 'Wild Resilience', effect: 'sanityProtection', value: 0.3, description: '30% sanity loss reduction' },
    atheon: { id: 'strategic_insight', name: 'Strategic Insight', effect: 'trapBonus', value: 0.25, description: '+25% trap effectiveness' },
    valoris: { id: 'shield_of_valor', name: 'Shield of Valor', effect: 'damageReduction', value: 0.1, description: '10% damage reduction' },
    xaroth: { id: 'maddening_presence', name: 'Maddening Presence', effect: 'enemySanityDrain', value: 3, description: 'Enemies lose 3 sanity when near' },
    seraphiel: { id: 'blessed_recovery', name: 'Blessed Recovery', effect: 'injuryHealBonus', value: 1, description: 'Injuries heal 1 day faster' },
    nemara: { id: 'scent_of_blood', name: 'Scent of Blood', effect: 'trackingBonus', value: 0.3, description: '+30% tracking success vs grudge targets' }
  },
  // Champion tier (+75)
  champion: {
    kragorn: { id: 'avatar_of_war', name: 'Avatar of War', effect: 'damageBonus', value: 0.2, description: '+20% damage dealt' },
    morwyn: { id: 'deathbringer', name: 'Deathbringer', effect: 'executeThreshold', value: 0.15, description: 'Execute enemies below 15% health' },
    sylvana: { id: 'one_with_nature', name: 'One with Nature', effect: 'zoneImmunity', value: ['darkwood', 'swamp'], description: 'Immune to hazards in nature zones' },
    atheon: { id: 'omniscience', name: 'Omniscience', effect: 'ambushImmunity', value: true, description: 'Cannot be ambushed' },
    valoris: { id: 'rallying_cry', name: 'Rallying Cry', effect: 'allyHealthBonus', value: 10, description: 'Nearby allies gain +10 health' },
    xaroth: { id: 'anarchist', name: 'Anarchist', effect: 'betrayalPower', value: 0.3, description: '+30% betrayal damage' },
    seraphiel: { id: 'sanctuary', name: 'Sanctuary', effect: 'mercySuccess', value: 0.4, description: '+40% mercy acceptance chance' },
    nemara: { id: 'relentless_hunter', name: 'Relentless Hunter', effect: 'grudgeTracking', value: true, description: 'Always know grudge target location' }
  },
  // Exalted tier (+100)
  exalted: {
    kragorn: { id: 'immortal_warrior', name: 'Immortal Warrior', effect: 'deathSave', value: 0.25, description: '25% chance to survive fatal blow' },
    morwyn: { id: 'embrace_of_death', name: 'Embrace of Death', effect: 'deathAura', value: 5, description: 'Enemies near you lose 5 health per day' },
    sylvana: { id: 'natures_avatar', name: "Nature's Avatar", effect: 'survivalMastery', value: true, description: 'Never lose hunger/thirst in nature zones' },
    atheon: { id: 'grand_architect', name: 'Grand Architect', effect: 'schemeSuccess', value: 0.5, description: '+50% scheme success, +25 to all alliances' },
    valoris: { id: 'paragon', name: 'Paragon', effect: 'inspiringPresence', value: true, description: 'Allies cannot betray you, gain +15 to all stats near you' },
    xaroth: { id: 'lord_of_chaos', name: 'Lord of Chaos', effect: 'chaosMastery', value: true, description: 'Random beneficial events happen near you' },
    seraphiel: { id: 'divine_protection', name: 'Divine Protection', effect: 'deathSave', value: 0.3, description: '30% chance to survive fatal blow' },
    nemara: { id: 'avatar_of_vengeance', name: 'Avatar of Vengeance', effect: 'vengeancePower', value: true, description: 'Double damage to grudge targets, auto-track all enemies' }
  }
};

// Punishments applied at negative favor thresholds
export const PUNISHMENTS = {
  // Disfavored tier (-25)
  disfavored: {
    kragorn: { id: 'cowards_mark', name: "Coward's Mark", effect: 'combatPenalty', value: -5, description: 'Combat skill -5' },
    morwyn: { id: 'lifes_burden', name: "Life's Burden", effect: 'healingPenalty', value: -0.2, description: '-20% healing received' },
    sylvana: { id: 'natures_rejection', name: "Nature's Rejection", effect: 'foragePenalty', value: -0.2, description: '-20% forage success' },
    atheon: { id: 'fools_brand', name: "Fool's Brand", effect: 'cunningPenalty', value: -10, description: 'Cunning -10' },
    valoris: { id: 'dishonored', name: 'Dishonored', effect: 'allyPenalty', value: -15, description: '-15 to alliance attempts' },
    xaroth: { id: 'predictable', name: 'Predictable', effect: 'ambushPenalty', value: -0.2, description: '-20% ambush success' },
    seraphiel: { id: 'cold_heart', name: 'Cold Heart', effect: 'mercyPenalty', value: -0.3, description: '-30% mercy acceptance' },
    nemara: { id: 'forgiving_weakness', name: 'Forgiving Weakness', effect: 'grudgeDamagePenalty', value: -0.15, description: '-15% damage to grudge targets' }
  },
  // Cursed tier (-50)
  cursed: {
    kragorn: { id: 'bloodthirst_curse', name: 'Bloodthirst Curse', effect: 'sanityDrain', value: 3, description: 'Lose 3 sanity per day without combat' },
    morwyn: { id: 'deaths_rejection', name: "Death's Rejection", effect: 'healthDrain', value: 2, description: 'Lose 2 health per day' },
    sylvana: { id: 'natures_wrath', name: "Nature's Wrath", effect: 'zoneVulnerability', value: ['darkwood', 'swamp'], description: 'Take double damage in nature zones' },
    atheon: { id: 'clouded_mind', name: 'Clouded Mind', effect: 'skillPenalty', value: -10, description: '-10 to all skills' },
    valoris: { id: 'marked_betrayer', name: 'Marked Betrayer', effect: 'relationshipDecay', value: 5, description: 'All relationships decay by 5 per day' },
    xaroth: { id: 'ordered_fate', name: 'Ordered Fate', effect: 'luckPenalty', value: -0.1, description: '-10% to all random chances' },
    seraphiel: { id: 'guilt_ridden', name: 'Guilt Ridden', effect: 'sanityDrain', value: 5, description: 'Lose 5 sanity per day' },
    nemara: { id: 'hollow_vengeance', name: 'Hollow Vengeance', effect: 'combatPenalty', value: -10, description: 'Combat skill -10' }
  },
  // Forsaken tier (-75)
  forsaken: {
    kragorn: { id: 'war_gods_scorn', name: "War God's Scorn", effect: 'energyDrain', value: 10, description: 'Lose 10 extra energy per day' },
    morwyn: { id: 'unending_agony', name: 'Unending Agony', effect: 'injuryPenalty', value: 2, description: 'Injuries last 2 days longer' },
    sylvana: { id: 'blighted', name: 'Blighted', effect: 'poisonVulnerability', value: 2, description: 'Take double poison/environmental damage' },
    atheon: { id: 'madness_descends', name: 'Madness Descends', effect: 'sanityMax', value: -30, description: 'Max sanity reduced by 30' },
    valoris: { id: 'outcast', name: 'Outcast', effect: 'allianceForbidden', value: true, description: 'Cannot form new alliances' },
    xaroth: { id: 'cosmic_joke', name: 'Cosmic Joke', effect: 'randomMisfortune', value: 0.2, description: '20% chance of random bad event each day' },
    seraphiel: { id: 'light_forsaken', name: 'Light Forsaken', effect: 'noHealing', value: true, description: 'Cannot receive healing' },
    nemara: { id: 'vendetta_broken', name: 'Vendetta Broken', effect: 'grudgeReset', value: true, description: 'All grudges are cleared' }
  }
};

// Archetype piety biases
export const ARCHETYPE_PIETY_BIAS = {
  paladin: 35,
  healer: 25,
  guardian: 15,
  knight: 10,
  reluctant_hero: 5,
  ranger: 0,
  hedge_knight: 0,
  courtier: -5,
  champion: -5,
  berserker: -10,
  assassin: -15,
  reaver: -20,
  witch_hunter: 20, // Zealous but in a different way
  madman: -30
};

// Deity affinity based on archetype (which deities an archetype is more likely to worship)
export const ARCHETYPE_DEITY_AFFINITY = {
  paladin: ['valoris', 'seraphiel'],
  healer: ['seraphiel', 'sylvana'],
  guardian: ['valoris', 'atheon'],
  knight: ['valoris', 'kragorn'],
  reluctant_hero: ['seraphiel', 'sylvana'],
  ranger: ['sylvana', 'nemara'],
  hedge_knight: ['kragorn', 'valoris'],
  courtier: ['atheon', 'xaroth'],
  champion: ['kragorn', 'valoris'],
  berserker: ['kragorn', 'nemara'],
  assassin: ['morwyn', 'xaroth'],
  reaver: ['kragorn', 'morwyn'],
  witch_hunter: ['valoris', 'nemara'],
  madman: ['xaroth', 'morwyn']
};

export function getDeityById(deityId) {
  return DEITIES[deityId] || null;
}

export function getFavorStatus(favor) {
  if (favor >= FAVOR_THRESHOLDS.exalted) return 'exalted';
  if (favor >= FAVOR_THRESHOLDS.champion) return 'champion';
  if (favor >= FAVOR_THRESHOLDS.favored) return 'favored';
  if (favor >= FAVOR_THRESHOLDS.blessed) return 'blessed';
  if (favor <= FAVOR_THRESHOLDS.abandoned) return 'abandoned';
  if (favor <= FAVOR_THRESHOLDS.forsaken) return 'forsaken';
  if (favor <= FAVOR_THRESHOLDS.cursed) return 'cursed';
  if (favor <= FAVOR_THRESHOLDS.disfavored) return 'disfavored';
  return 'neutral';
}

export function getFavorStatusColor(status) {
  const colors = {
    exalted: 'text-yellow-300',
    champion: 'text-yellow-400',
    favored: 'text-amber-400',
    blessed: 'text-amber-500',
    neutral: 'text-stone-400',
    disfavored: 'text-orange-400',
    cursed: 'text-red-400',
    forsaken: 'text-red-500',
    abandoned: 'text-red-600'
  };
  return colors[status] || 'text-stone-400';
}
