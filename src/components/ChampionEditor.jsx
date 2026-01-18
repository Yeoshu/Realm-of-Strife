import React, { useState } from 'react';
import { REALM_NAMES, CHAMPION_ARCHETYPES, RACES } from '../constants';
import { clamp } from '../utils';

export function ChampionEditor({
  champions,
  onClose,
  onUpdateChampion,
  onUpdateChampionStat,
  onUpdateChampionRelationship,
  onRegenerateChampion,
  onRegenerateAllRelationships
}) {
  const [editingChampion, setEditingChampion] = useState(null);

  const handleClose = () => {
    setEditingChampion(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div className="bg-stone-900 border border-blue-700 rounded-lg max-w-6xl w-full">
          <div className="sticky top-0 bg-stone-900 flex items-center justify-between p-4 border-b border-stone-700 rounded-t-lg z-10">
            <h3 className="text-xl font-bold text-blue-400 tracking-wider">CHAMPION EDITOR</h3>
            <div className="flex gap-2">
              <button
                onClick={onRegenerateAllRelationships}
                className="px-3 py-1 bg-purple-700 hover:bg-purple-600 rounded text-white text-sm"
              >
                Regenerate Relationships
              </button>
              <button
                onClick={handleClose}
                className="text-stone-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
              >
                x
              </button>
            </div>
          </div>

          <div className="flex">
            {/* Champion List */}
            <div className="w-64 border-r border-stone-700 p-4 max-h-[70vh] overflow-y-auto">
              <h4 className="text-sm font-bold text-stone-400 mb-3">SELECT CHAMPION</h4>
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
                          onUpdateChampion(editingChampion.id, { name: newName });
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
                          onUpdateChampion(editingChampion.id, {
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
                          onUpdateChampion(editingChampion.id, {
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
                          onUpdateChampion(editingChampion.id, {
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
                        onUpdateChampion(editingChampion.id, { backstories: newBackstories });
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
                              onUpdateChampionStat(editingChampion.id, 'stats', stat, newValue);
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
                              onUpdateChampionStat(editingChampion.id, 'personality', trait, newValue);
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
                                  onUpdateChampionRelationship(editingChampion.id, other.id, newValue);
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
                      onClick={() => {
                        onRegenerateChampion(editingChampion.id);
                        // The parent will update the champion, we need to sync
                        const updated = champions.find(c => c.id === editingChampion.id);
                        if (updated) setEditingChampion(updated);
                      }}
                      className="px-4 py-2 bg-amber-700 hover:bg-amber-600 rounded text-white text-sm"
                    >
                      Randomize This Champion
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
              onClick={handleClose}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-600 rounded text-white font-bold"
            >
              Done Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
