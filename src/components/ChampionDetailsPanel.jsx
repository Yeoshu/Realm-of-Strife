import React from 'react';
import { BATTLEFIELD_ZONES, RACES } from '../constants';
import { DEITIES, getFavorStatus, getFavorStatusColor } from '../constants/deities';
import { getRelationship } from '../engine';
import { generatePersonalityDescription } from '../constants/personality';

function getHealthColor(health) {
  if (health > 70) return 'bg-emerald-500';
  if (health > 40) return 'bg-yellow-500';
  if (health > 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getRelationshipDisplay(champion, other) {
  const rel = getRelationship(champion, other.id);
  if (rel > 60) return { text: 'Allied', color: 'text-emerald-400' };
  if (rel > 30) return { text: 'Friendly', color: 'text-green-400' };
  if (rel > -20) return { text: 'Neutral', color: 'text-stone-400' };
  if (rel > -50) return { text: 'Hostile', color: 'text-orange-400' };
  return { text: 'Enemy', color: 'text-red-400' };
}

function getCharacterLogs(events, championName) {
  if (!events || !championName) return [];

  return events
    .filter(event => {
      // Check if champion is killer or victim in death events
      if (event.killer === championName || event.victim === championName) return true;

      // Check if champion appears in combat log entries
      if (event.combatLog && Array.isArray(event.combatLog)) {
        return event.combatLog.some(entry =>
          entry.attacker === championName ||
          entry.defender === championName ||
          entry.champion === championName
        );
      }

      return false;
    })
    .sort((a, b) => {
      // Sort by day if available, otherwise maintain order
      const dayA = a.day || 0;
      const dayB = b.day || 0;
      return dayA - dayB;
    });
}

function getLogSummary(event, championName) {
  if (!event.combatLog || !Array.isArray(event.combatLog)) {
    return event.text || 'Unknown event';
  }

  const header = event.combatLog.find(e => e.type === 'header');
  if (header) return header.text;

  return event.text || 'Combat encounter';
}

function getLogOutcome(event, championName) {
  if (!event.combatLog) return null;

  // Use event-level victim/killer if available (most reliable)
  if (event.victim === championName) {
    return { text: 'DIED', color: 'text-red-500' };
  }
  if (event.killer === championName) {
    return { text: 'KILLED', color: 'text-emerald-500' };
  }

  // Check fatal entries - these indicate who received a killing blow
  const fatalEntry = event.combatLog.find(e => e.type === 'fatal');
  if (fatalEntry) {
    if (fatalEntry.defender === championName) {
      return { text: 'DIED', color: 'text-red-500' };
    }
    if (fatalEntry.attacker === championName) {
      return { text: 'KILLED', color: 'text-emerald-500' };
    }
  }

  const deathEntry = event.combatLog.find(e => e.type === 'death');
  const victoryEntry = event.combatLog.find(e => e.type === 'victory');

  if (victoryEntry) {
    if (victoryEntry.text?.includes(championName)) {
      return { text: 'WON', color: 'text-emerald-400' };
    }
    // If there's a death but champion is in victory, they won
    if (deathEntry && !deathEntry.text?.includes(championName)) {
      return { text: 'KILLED', color: 'text-emerald-500' };
    }
    return { text: 'LOST', color: 'text-orange-400' };
  }

  if (deathEntry) {
    if (deathEntry.text?.includes(championName)) {
      return { text: 'DIED', color: 'text-red-500' };
    }
  }

  const disengageEntry = event.combatLog.find(e => e.type === 'disengage');
  if (disengageEntry) {
    return { text: 'FLED', color: 'text-yellow-400' };
  }

  return null;
}

function getFavorBarColor(favor) {
  if (favor >= 75) return 'bg-yellow-400';
  if (favor >= 50) return 'bg-yellow-500';
  if (favor >= 25) return 'bg-amber-500';
  if (favor >= 0) return 'bg-stone-500';
  if (favor >= -25) return 'bg-orange-500';
  if (favor >= -50) return 'bg-red-500';
  if (favor >= -75) return 'bg-red-600';
  return 'bg-red-700';
}

export function ChampionDetailsPanel({ selectedChampion, livingChampions, events, onViewCombatLog }) {
  if (!selectedChampion) return null;

  const characterLogs = getCharacterLogs(events, selectedChampion.name);

  return (
    <>
      <h2 className="text-xl font-bold text-amber-500 border-b border-amber-900/50 pb-2 tracking-wider">
        {selectedChampion.name.toUpperCase()}
      </h2>

      <div className="bg-stone-900/50 rounded p-4 border border-stone-700 space-y-4 max-h-[600px] overflow-y-auto">
        <div>
          <p className="text-amber-400">{selectedChampion.realmName}</p>
          <p className="text-stone-400 text-sm">
            {selectedChampion.alive ? `@ ${BATTLEFIELD_ZONES.find(z => z.id === selectedChampion.zone)?.name}` : 'Deceased'}
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
                <p key={i}>- {selectedChampion.name} {story}</p>
              ))}
            </div>
          )}
        </div>

        {/* Patron Deity */}
        {selectedChampion.patronDeity && (
          <div className="bg-stone-800/50 rounded p-2">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-sm font-bold text-amber-400">
                  {DEITIES[selectedChampion.patronDeity]?.name}
                </span>
                <span className="text-xs text-stone-400 ml-2">
                  ({DEITIES[selectedChampion.patronDeity]?.domain})
                </span>
              </div>
              <span className={`text-xs font-bold capitalize ${getFavorStatusColor(getFavorStatus(selectedChampion.deityFavor))}`}>
                {getFavorStatus(selectedChampion.deityFavor)}
              </span>
            </div>

            {/* Favor Bar */}
            <div className="mb-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-500 w-12">Favor</span>
                <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden relative">
                  {/* Center marker */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-stone-500 z-10" />
                  {/* Favor bar */}
                  {selectedChampion.deityFavor >= 0 ? (
                    <div
                      className={`h-full ${getFavorBarColor(selectedChampion.deityFavor)} absolute left-1/2`}
                      style={{ width: `${(selectedChampion.deityFavor / 150) * 50}%` }}
                    />
                  ) : (
                    <div
                      className={`h-full ${getFavorBarColor(selectedChampion.deityFavor)} absolute right-1/2`}
                      style={{ width: `${(Math.abs(selectedChampion.deityFavor) / 150) * 50}%` }}
                    />
                  )}
                </div>
                <span className="text-stone-400 w-8 text-right">{selectedChampion.deityFavor}</span>
              </div>
            </div>

            {/* Blessings */}
            {selectedChampion.blessings && selectedChampion.blessings.length > 0 && (
              <div className="mb-1">
                <span className="text-xs text-amber-500 font-bold">Blessings: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedChampion.blessings.map((blessing, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-amber-900/50 border border-amber-700/50 rounded text-xs text-amber-300"
                      title={blessing.description}
                    >
                      {blessing.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Curses */}
            {selectedChampion.curses && selectedChampion.curses.length > 0 && (
              <div>
                <span className="text-xs text-red-500 font-bold">Curses: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedChampion.curses.map((curse, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-red-900/50 border border-red-700/50 rounded text-xs text-red-300"
                      title={curse.description}
                    >
                      {curse.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Deity / Godless */}
        {!selectedChampion.patronDeity && selectedChampion.alive && (
          <div className="bg-stone-800/30 rounded p-2">
            <span className="text-xs text-stone-500 italic">
              {selectedChampion.abandonedBy && selectedChampion.abandonedBy.length > 0
                ? `Abandoned by the gods (${selectedChampion.abandonedBy.map(id => DEITIES[id]?.name).join(', ')})`
                : 'Godless - worships no deity'}
            </span>
          </div>
        )}

        {selectedChampion.alive && (
          <>
            {/* Status Bars */}
            <div className="space-y-2">
              {[
                { label: 'Health', value: selectedChampion.health, color: getHealthColor(selectedChampion.health) },
                { label: 'Hunger', value: selectedChampion.hunger, color: 'bg-amber-500' },
                { label: 'Thirst', value: selectedChampion.thirst, color: 'bg-blue-500' },
                { label: 'Energy', value: selectedChampion.energy, color: 'bg-purple-500' },
                { label: 'Sanity', value: selectedChampion.sanity, color: 'bg-pink-500' }
              ].map(stat => (
                <div key={stat.label} className="flex items-center gap-2">
                  <span className="w-16 text-xs text-stone-400">{stat.label}</span>
                  <div className="flex-1 h-2 bg-stone-700 rounded-full overflow-hidden">
                    <div className={`h-full ${stat.color}`} style={{ width: `${stat.value}%` }} />
                  </div>
                  <span className="w-8 text-xs text-right">{Math.round(stat.value)}</span>
                </div>
              ))}
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

        {/* Combat History */}
        {characterLogs.length > 0 && (
          <div className="pt-2 border-t border-stone-700">
            <h3 className="text-sm font-bold text-stone-400 mb-2">COMBAT HISTORY</h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {characterLogs.map((event, i) => {
                const outcome = getLogOutcome(event, selectedChampion.name);
                return (
                  <div
                    key={event.combatId || i}
                    className="flex items-center gap-2 p-2 bg-stone-800/50 rounded hover:bg-stone-800 cursor-pointer transition-colors"
                    onClick={() => onViewCombatLog && onViewCombatLog(event.combatLog)}
                  >
                    {event.day && (
                      <span className="text-xs text-stone-500 shrink-0">Day {event.day}</span>
                    )}
                    <span className="text-xs text-stone-300 truncate flex-1 min-w-0">
                      {getLogSummary(event, selectedChampion.name)}
                    </span>
                    {outcome && (
                      <span className={`text-xs font-bold ${outcome.color} shrink-0`}>
                        {outcome.text}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
