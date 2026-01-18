import React from 'react';

export function GameStatus({ gameState, day, livingCount, deadCount }) {
  return (
    <div className="text-center mb-6">
      <span className="text-2xl text-amber-500 font-bold">
        {gameState.phase === 'finished' ? 'GAMES CONCLUDED' : day === 0 ? 'PRE-GAMES' : `DAY ${day}`}
      </span>
      <span className="mx-4 text-stone-500">|</span>
      <span className="text-lg">
        <span className="text-emerald-400">{livingCount}</span> alive
        <span className="mx-2 text-stone-600">-</span>
        <span className="text-red-400">{deadCount}</span> fallen
      </span>
    </div>
  );
}
