// Combat-related constants

export const BODY_PARTS = [
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

export const ATTACK_TYPES = {
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

export const WOUND_DESCRIPTIONS = {
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

export const COMBAT_REACTIONS = [
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

export const DODGE_DESCRIPTIONS = [
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

export const WEAPON_CATEGORIES = {
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
