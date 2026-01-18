import React from 'react';
import { BATTLEFIELD_ZONES } from '../constants';

function getHealthColor(health) {
  if (health > 70) return 'bg-emerald-500';
  if (health > 40) return 'bg-yellow-500';
  if (health > 20) return 'bg-orange-500';
  return 'bg-red-500';
}

export function ChampionsPanel({ champions, selectedChampion, onSelectChampion }) {
  return (
    <div className="lg:col-span-1 space-y-4">
      <h2 className="text-xl font-bold text-amber-500 border-b border-amber-900/50 pb-2 tracking-wider">CHAMPIONS</h2>

      <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
        {champions.map(champion => (
          <div
            key={champion.id}
            onClick={() => onSelectChampion(champion.id === selectedChampion?.id ? null : champion)}
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
                <span className="text-red-500 text-sm">Dead</span>
              )}
            </div>

            {champion.alive && (
              <div className="mt-2 flex gap-2 text-xs text-stone-400">
                <span>@ {BATTLEFIELD_ZONES.find(z => z.id === champion.zone)?.name}</span>
                {champion.kills > 0 && <span className="text-red-400">Kills: {champion.kills}</span>}
                {champion.inventory.length > 0 && <span>Items: {champion.inventory.length}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
