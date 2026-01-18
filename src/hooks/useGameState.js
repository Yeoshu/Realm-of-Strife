import { useState, useMemo, useCallback, useEffect } from 'react';
import { shuffle } from '../utils';
import {
  generateAllChampions,
  generatePreExistingRelationships,
  generateChampion,
  generateEvent,
  handleDivineIntervention,
  runOpeningMelee
} from '../engine';

export function useGameState() {
  const [champions, setChampions] = useState(null);
  const [day, setDay] = useState(0);
  const [events, setEvents] = useState([]);
  const [combatLogs, setCombatLogs] = useState([]);
  const [selectedCombatLog, setSelectedCombatLog] = useState(null);
  const [gameState, setGameState] = useState({
    phase: 'setup',
    daysSinceLastDeath: 0,
    feast: false
  });
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const [speed, setSpeed] = useState(1500);
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
    newChampion.id = championId;

    setChampions(prev => prev.map(t => {
      if (t.id === championId) {
        return newChampion;
      }
      return t;
    }));

    return newChampion;
  }, [champions]);

  const regenerateAllRelationships = useCallback(() => {
    if (!champions) return;

    const clearedChampions = champions.map(t => ({
      ...t,
      relationships: {},
      grudges: {}
    }));

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
      newEvents = runOpeningMelee(newChampions);
      newGameState.phase = 'running';
    } else {
      newEvents.push({
        type: 'announcement',
        text: `Day ${newDay} dawns over the battlefield.`,
        severity: 'announcement'
      });

      const gmEvents = handleDivineIntervention(newChampions, newDay, newGameState);
      newEvents.push(...gmEvents);

      const livingOrder = shuffle(newChampions.filter(t => t.alive));
      livingOrder.forEach(champion => {
        if (champion.alive) {
          const championEvents = generateEvent(champion, newChampions, newDay, newGameState);
          newEvents.push(...championEvents);
        }
      });

      newEvents.push({
        type: 'announcement',
        text: `Night falls. The dead are mourned...`,
        severity: 'announcement'
      });

      const deathsToday = newChampions.filter(t => !t.alive).length - deadChampions.length;
      if (deathsToday > 0) {
        newGameState.daysSinceLastDeath = 0;
      } else {
        newGameState.daysSinceLastDeath++;
      }
    }

    const stillAlive = newChampions.filter(t => t.alive);
    if (stillAlive.length === 1) {
      newEvents.push({
        type: 'victory',
        text: `${stillAlive[0].name} from ${stillAlive[0].realmName} emerges victorious from the Grand Tournament!`,
        severity: 'victory'
      });
      newGameState.phase = 'finished';
    } else if (stillAlive.length === 0) {
      newEvents.push({
        type: 'announcement',
        text: `No champions survive. The Games end in tragedy.`,
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

  return {
    // State
    champions,
    day,
    events,
    combatLogs,
    selectedCombatLog,
    gameState,
    selectedChampion,
    autoPlay,
    speed,
    showEditor,
    livingChampions,
    deadChampions,

    // Setters
    setSelectedCombatLog,
    setSelectedChampion,
    setAutoPlay,
    setSpeed,
    setShowEditor,

    // Actions
    startGame,
    runDay,
    updateChampion,
    updateChampionStat,
    updateChampionRelationship,
    regenerateChampion,
    regenerateAllRelationships
  };
}
