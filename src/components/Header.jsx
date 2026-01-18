import React from 'react';

export function Header() {
  return (
    <header className="bg-gradient-to-b from-stone-900 to-stone-950 border-b border-amber-900/50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center tracking-wider" style={{ fontFamily: "Georgia, serif" }}>
          <span className="text-amber-500">REALM OF STRIFE</span>
        </h1>
        <p className="text-center text-stone-400 mt-2 tracking-widest text-sm">MEDIEVAL BATTLE SIMULATION</p>
      </div>
    </header>
  );
}
