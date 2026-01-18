import React from 'react';

export function Controls({
  champions,
  gameState,
  day,
  autoPlay,
  speed,
  onStartGame,
  onRunDay,
  onToggleAutoPlay,
  onSpeedChange,
  onShowEditor
}) {
  return (
    <div className="flex flex-wrap gap-4 items-center justify-center mb-6">
      {!champions && (
        <button
          onClick={onStartGame}
          className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded tracking-wider transition-all hover:scale-105"
        >
          BEGIN THE TOURNAMENT
        </button>
      )}

      {champions && gameState.phase !== 'finished' && (
        <>
          {gameState.phase === 'ready' && day === 0 && (
            <button
              onClick={onShowEditor}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded tracking-wider transition-all"
            >
              EDIT CHAMPIONS
            </button>
          )}

          <button
            onClick={onRunDay}
            disabled={autoPlay}
            className="px-6 py-2 bg-red-700 hover:bg-red-600 disabled:bg-stone-700 text-white font-bold rounded tracking-wider transition-all"
          >
            {day === 0 ? 'START OPENING MELEE' : `ADVANCE TO DAY ${day + 1}`}
          </button>

          <button
            onClick={onToggleAutoPlay}
            className={`px-6 py-2 font-bold rounded tracking-wider transition-all ${
              autoPlay ? 'bg-amber-600 text-black' : 'bg-stone-700 hover:bg-stone-600 text-white'
            }`}
          >
            {autoPlay ? 'PAUSE' : 'AUTO-PLAY'}
          </button>

          <select
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="px-4 py-2 bg-stone-800 border border-stone-600 rounded text-stone-200"
          >
            <option value={2500}>Slow</option>
            <option value={1500}>Normal</option>
            <option value={800}>Fast</option>
            <option value={300}>Very Fast</option>
          </select>
        </>
      )}

      {champions && (
        <button
          onClick={onStartGame}
          className="px-6 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded tracking-wider transition-all"
        >
          NEW GAME
        </button>
      )}
    </div>
  );
}
