import React from 'react';

export function CombatLogModal({ combatLog, onClose }) {
  if (!combatLog) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="min-h-full flex items-start justify-center p-4 py-8">
        <div className="bg-stone-900 border border-amber-700 rounded-lg max-w-2xl w-full relative">
          <div className="sticky top-0 bg-stone-900 flex items-center justify-between p-4 border-b border-stone-700 rounded-t-lg z-10">
            <h3 className="text-xl font-bold text-amber-500 tracking-wider">COMBAT LOG</h3>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center"
            >
              x
            </button>
          </div>

          <div className="p-4 font-mono text-sm">
            {combatLog.map((entry, i) => {
              let className = "py-1 ";
              let prefix = "";

              switch (entry.type) {
                case 'header':
                  className += "text-amber-400 font-bold text-center border-b border-stone-700 pb-2 mb-2";
                  break;
                case 'round':
                  className += "text-stone-500 mt-3 mb-1";
                  break;
                case 'info':
                  className += "text-stone-400 italic";
                  break;
                case 'status':
                  className += "text-blue-400";
                  prefix = "> ";
                  break;
                case 'miss':
                  className += "text-stone-500";
                  prefix = "o ";
                  break;
                case 'blocked':
                  className += "text-yellow-500";
                  prefix = "* ";
                  break;
                case 'hit':
                  if (entry.severity === 'critical') {
                    className += "text-red-400 font-bold";
                    prefix = "! ";
                  } else if (entry.severity === 'severe') {
                    className += "text-orange-400";
                    prefix = "! ";
                  } else if (entry.severity === 'moderate') {
                    className += "text-yellow-400";
                    prefix = "* ";
                  } else {
                    className += "text-stone-300";
                    prefix = "- ";
                  }
                  break;
                case 'fatal':
                  className += "text-red-500 font-bold";
                  prefix = "X ";
                  break;
                case 'death':
                  className += "text-red-500 font-bold text-center mt-2";
                  prefix = "DEATH: ";
                  break;
                case 'victory':
                  className += "text-emerald-400 font-bold text-center mt-2";
                  prefix = "VICTORY: ";
                  break;
                case 'disengage':
                  className += "text-yellow-500 italic";
                  prefix = "<- ";
                  break;
                case 'loot':
                  className += "text-amber-400";
                  prefix = "+ ";
                  break;
                default:
                  className += "text-stone-300";
              }

              return (
                <div key={i} className={className}>
                  {prefix}{entry.text}
                  {entry.damage && entry.type === 'hit' && (
                    <span className="text-red-400 ml-2">[-{entry.damage} HP]</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-0 bg-stone-900 p-4 border-t border-stone-700 flex justify-end rounded-b-lg">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-stone-700 hover:bg-stone-600 rounded text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
