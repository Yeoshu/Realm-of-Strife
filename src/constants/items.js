// Item constants

export const ITEMS = {
  weapons: [
    { id: 'sword', name: 'Longsword', combatBonus: 25, rarity: 0.15, category: 'blade' },
    { id: 'bow', name: 'Longbow', combatBonus: 20, rarity: 0.2, category: 'ranged' },
    { id: 'knife', name: 'Dagger', combatBonus: 12, rarity: 0.35, category: 'blade' },
    { id: 'spear', name: 'War Spear', combatBonus: 18, rarity: 0.25, category: 'polearm' },
    { id: 'axe', name: 'Battle Axe', combatBonus: 22, rarity: 0.18, category: 'blade' },
    { id: 'halberd', name: 'Halberd', combatBonus: 24, rarity: 0.12, category: 'polearm' },
    { id: 'mace', name: 'Flanged Mace', combatBonus: 20, rarity: 0.2, category: 'blunt' },
    { id: 'crossbow', name: 'Crossbow', combatBonus: 18, rarity: 0.22, category: 'ranged' },
    { id: 'warhammer', name: 'Warhammer', combatBonus: 23, rarity: 0.15, category: 'blunt' },
    { id: 'flail', name: 'Flail', combatBonus: 19, rarity: 0.2, category: 'blunt' }
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
