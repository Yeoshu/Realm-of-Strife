// Personality and backstory constants

export const PERSONALITY_TRAITS = {
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
  vendetta: { low: 'forgiving', mid: 'remembers', high: 'vengeful' },
  piety: { low: 'godless', mid: 'observant', high: 'devout' }
};

export const CHAMPION_ARCHETYPES = [
  {
    id: 'knight',
    name: 'Knight',
    description: 'Trained in the arts of war since youth',
    realms: [1, 2, 4],
    traitBias: { aggression: 30, bravery: 25, ruthlessness: 25, pride: 20, empathy: -20, piety: 10 },
    skillBonuses: { melee: 25, tactics: 15, intimidation: 10 },
    proficiencyBonuses: { blade: 30, polearm: 15 },
    rare: false
  },
  {
    id: 'reluctant_hero',
    name: 'Reluctant Hero',
    description: 'Thrust into battle against their will',
    realms: [3, 5, 6, 7, 8],
    traitBias: { empathy: 30, loyalty: 20, aggression: -25, ruthlessness: -20, piety: 5 },
    skillBonuses: { survival: 15, persuasion: 10 },
    proficiencyBonuses: { blade: 10 },
    rare: false
  },
  {
    id: 'ranger',
    name: 'Ranger',
    description: 'Hardened by the wilderness',
    realms: [6, 7, 10, 11, 12],
    traitBias: { cunning: 25, ruthlessness: 15, loyalty: -15, impulsiveness: -20, piety: 0 },
    skillBonuses: { survival: 25, archery: 20, stealth: 15 },
    proficiencyBonuses: { ranged: 25, blade: 10 },
    rare: false
  },
  {
    id: 'guardian',
    name: 'Guardian',
    description: 'Sworn to protect the innocent',
    realms: [3, 5, 8, 9, 11, 12],
    traitBias: { loyalty: 35, empathy: 25, bravery: 20, sociability: 15, piety: 15 },
    skillBonuses: { melee: 20, medicine: 15, tactics: 10 },
    proficiencyBonuses: { blade: 20, polearm: 15 },
    rare: false
  },
  {
    id: 'courtier',
    name: 'Courtier',
    description: 'Master of intrigue and manipulation',
    realms: [1, 3, 5, 8],
    traitBias: { cunning: 35, impulsiveness: -30, sociability: 20, loyalty: -15, piety: -5 },
    skillBonuses: { persuasion: 30, intimidation: 15, stealth: 10 },
    proficiencyBonuses: { blade: 15 },
    rare: false
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Warrior possessed by battle fury',
    realms: [2, 6, 7, 10],
    traitBias: { aggression: 40, bravery: 30, impulsiveness: 25, cunning: -20, piety: -10 },
    skillBonuses: { melee: 30, intimidation: 20 },
    proficiencyBonuses: { blade: 25, blunt: 20, unarmed: 15 },
    rare: true
  },
  {
    id: 'healer',
    name: 'Healer',
    description: 'Bound by oath to do no harm',
    realms: [3, 8, 9, 11, 12],
    traitBias: { empathy: 40, aggression: -40, ruthlessness: -35, loyalty: 20, piety: 25 },
    skillBonuses: { medicine: 35, persuasion: 15, survival: 10 },
    proficiencyBonuses: {},
    rare: true
  },
  {
    id: 'champion',
    name: 'Tourney Champion',
    description: 'Lives for glory and renown',
    realms: [1, 4, 8],
    traitBias: { pride: 30, sociability: 25, cunning: 20, bravery: 15, piety: -5 },
    skillBonuses: { melee: 25, intimidation: 15, tactics: 10 },
    proficiencyBonuses: { blade: 25, polearm: 20 },
    rare: false
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'Death from the shadows',
    realms: [3, 5, 6, 8, 12],
    traitBias: { cunning: 25, sociability: -30, impulsiveness: -20, piety: -15 },
    skillBonuses: { stealth: 30, melee: 15 },
    proficiencyBonuses: { blade: 25, ranged: 15 },
    rare: false
  },
  {
    id: 'madman',
    name: 'Madman',
    description: 'Touched by chaos itself',
    realms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    traitBias: { impulsiveness: 35, cunning: -15, piety: -30 },
    skillBonuses: { intimidation: 15 },
    proficiencyBonuses: { unarmed: 20 },
    rare: true
  },
  {
    id: 'paladin',
    name: 'Paladin',
    description: 'Holy warrior of unwavering virtue',
    realms: [1, 4, 5, 9],
    traitBias: { loyalty: 30, empathy: 25, pride: 20, ruthlessness: -30, cunning: -15, piety: 35 },
    skillBonuses: { melee: 25, medicine: 15, persuasion: 10 },
    proficiencyBonuses: { blade: 30, blunt: 15 },
    rare: true
  },
  {
    id: 'reaver',
    name: 'Reaver',
    description: 'Savage raider who delights in slaughter',
    realms: [2, 5, 6, 7, 10],
    traitBias: { aggression: 30, ruthlessness: 35, empathy: -35, cunning: 15, piety: -20 },
    skillBonuses: { melee: 25, intimidation: 20, survival: 10 },
    proficiencyBonuses: { blade: 25, blunt: 20 },
    rare: true
  },
  {
    id: 'hedge_knight',
    name: 'Hedge Knight',
    description: 'Landless warrior seeking fortune',
    realms: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    traitBias: { bravery: 15, pride: 10, loyalty: 10, piety: 0 },
    skillBonuses: { melee: 15, survival: 10 },
    proficiencyBonuses: { blade: 20, polearm: 10 },
    rare: false
  },
  {
    id: 'witch_hunter',
    name: 'Witch Hunter',
    description: 'Zealot sworn to purge dark magic',
    realms: [2, 3, 5, 9],
    traitBias: { ruthlessness: 25, bravery: 20, empathy: -25, vendetta: 20, piety: 20 },
    skillBonuses: { melee: 20, intimidation: 20, survival: 10 },
    proficiencyBonuses: { blade: 20, ranged: 15 },
    rare: true
  }
];

export const BACKSTORY_TEMPLATES = [
  // Family situations
  { type: 'family', text: 'has sworn to protect their younger siblings', effects: { loyalty: 10, bravery: 5 }, skillEffects: { tactics: 5 }, proficiencyEffects: {} },
  { type: 'family', text: 'took the place of a family member chosen for the tournament', effects: { bravery: 15, loyalty: 10 }, skillEffects: {}, proficiencyEffects: {} },
  { type: 'family', text: 'is an orphan raised by the streets', effects: { ruthlessness: 10, empathy: -10 }, skillEffects: { stealth: 15, survival: 10 }, proficiencyEffects: { blade: 10 } },
  { type: 'family', text: 'hails from a large and loving noble house', effects: { empathy: 10, sociability: 10 }, skillEffects: { persuasion: 10 }, proficiencyEffects: { blade: 5 } },
  { type: 'family', text: 'watched their family slaughtered by raiders', effects: { vendetta: 15, aggression: 10 }, skillEffects: { melee: 10 }, proficiencyEffects: {} },
  { type: 'family', text: 'is the last of their bloodline', effects: { pride: 10, bravery: 5 }, skillEffects: { survival: 5 }, proficiencyEffects: {} },

  // Training/skills
  { type: 'training', text: 'trained in secret with a disgraced knight', effects: { bravery: 10, cunning: 5 }, skillEffects: { melee: 10 }, proficiencyEffects: { blade: 15 } },
  { type: 'training', text: 'survived harsh conditions as a peasant laborer', effects: { bravery: 5, ruthlessness: 5 }, skillEffects: { survival: 15 }, proficiencyEffects: { blunt: 10 } },
  { type: 'training', text: 'has never held a sword before this day', effects: { aggression: -15, empathy: 10 }, skillEffects: { melee: -10 }, proficiencyEffects: { blade: -15 } },
  { type: 'training', text: 'was trained at the finest war academy in the realm', effects: { pride: 15, aggression: 10 }, skillEffects: { melee: 20, tactics: 15 }, proficiencyEffects: { blade: 20, polearm: 10 } },
  { type: 'training', text: 'learned to fight in the gladiator pits', effects: { ruthlessness: 10, bravery: 10 }, skillEffects: { melee: 15, intimidation: 10 }, proficiencyEffects: { blade: 15, unarmed: 20 } },
  { type: 'training', text: 'served as a squire to a legendary knight', effects: { loyalty: 10, pride: 5 }, skillEffects: { melee: 10, tactics: 10 }, proficiencyEffects: { blade: 15, polearm: 10 } },
  { type: 'training', text: 'learned archery hunting in the forests', effects: { cunning: 5 }, skillEffects: { archery: 20, survival: 10 }, proficiencyEffects: { ranged: 25 } },
  { type: 'training', text: 'studied medicine under a wise healer', effects: { empathy: 10 }, skillEffects: { medicine: 20, survival: 5 }, proficiencyEffects: {} },
  { type: 'training', text: 'was trained as a spy and infiltrator', effects: { cunning: 15 }, skillEffects: { stealth: 20, persuasion: 10 }, proficiencyEffects: { blade: 10 } },

  // Personality history
  { type: 'personality', text: 'was mocked as a child and learned to stay unseen', effects: { sociability: -15, cunning: 10 }, skillEffects: { stealth: 15 }, proficiencyEffects: {} },
  { type: 'personality', text: 'has always commanded the respect of others', effects: { pride: 10, sociability: 10 }, skillEffects: { intimidation: 10, persuasion: 10 }, proficiencyEffects: {} },
  { type: 'personality', text: 'has a fiery temper that leads to trouble', effects: { impulsiveness: 15, aggression: 10 }, skillEffects: { intimidation: 10 }, proficiencyEffects: { unarmed: 10 } },
  { type: 'personality', text: 'is known throughout the realm for their mercy', effects: { empathy: 15, ruthlessness: -10 }, skillEffects: { persuasion: 15, medicine: 10 }, proficiencyEffects: {} },
  { type: 'personality', text: 'was betrayed by someone they trusted', effects: { loyalty: -15, vendetta: 10 }, skillEffects: { stealth: 5 }, proficiencyEffects: {} },
  { type: 'personality', text: 'believes the gods have chosen them for greatness', effects: { pride: 20, bravery: 10 }, skillEffects: {}, proficiencyEffects: {} },
  { type: 'personality', text: 'carries a dark secret that haunts them', effects: { cunning: 10, sociability: -10 }, skillEffects: { stealth: 10 }, proficiencyEffects: {} },

  // Motivations
  { type: 'motivation', text: 'seeks to restore honor to their disgraced house', effects: { pride: 10, bravery: 5 }, skillEffects: { melee: 5 }, proficiencyEffects: {} },
  { type: 'motivation', text: 'fights for someone waiting for them back home', effects: { loyalty: 15, bravery: 10 }, skillEffects: { survival: 5 }, proficiencyEffects: {} },
  { type: 'motivation', text: 'craves the wealth and power that victory brings', effects: { cunning: 10, ruthlessness: 5 }, skillEffects: { persuasion: 5 }, proficiencyEffects: {} },
  { type: 'motivation', text: 'has made peace with death and fears nothing', effects: { bravery: 15, impulsiveness: 10, empathy: 5 }, skillEffects: { melee: 5 }, proficiencyEffects: {} },
  { type: 'motivation', text: 'seeks vengeance against a rival house', effects: { vendetta: 20, aggression: 5 }, skillEffects: { melee: 5 }, proficiencyEffects: {} },
  { type: 'motivation', text: 'hopes to win freedom for their people', effects: { empathy: 15, loyalty: 10 }, skillEffects: { tactics: 5 }, proficiencyEffects: {} }
];

export const RELATIONSHIP_TEMPLATES = [
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

export function getTraitDescription(trait, value) {
  const traitInfo = PERSONALITY_TRAITS[trait];
  if (!traitInfo) return '';
  if (value < 35) return traitInfo.low;
  if (value > 65) return traitInfo.high;
  return traitInfo.mid;
}

export function generatePersonalityDescription(champion) {
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
