import React from 'react';
import { BATTLEFIELD_ZONES } from '../constants';

export function BattlefieldMap({ livingChampions, onSelectChampion }) {
  return (
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
                      onClick={() => onSelectChampion(t)}
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
  );
}
