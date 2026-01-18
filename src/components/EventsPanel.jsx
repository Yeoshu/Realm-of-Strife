import React from 'react';

function getSeverityColor(severity) {
  switch (severity) {
    case 'death': return 'bg-red-900/50 border-red-500 text-red-100';
    case 'danger': return 'bg-orange-900/30 border-orange-500 text-orange-100';
    case 'warning': return 'bg-yellow-900/30 border-yellow-500 text-yellow-100';
    case 'success': return 'bg-emerald-900/30 border-emerald-500 text-emerald-100';
    case 'announcement': return 'bg-amber-900/40 border-amber-400 text-amber-100';
    case 'victory': return 'bg-gradient-to-r from-amber-600 to-yellow-500 border-yellow-300 text-black font-bold';
    default: return 'bg-stone-800/50 border-stone-600 text-stone-200';
  }
}

export function EventsPanel({ events, onViewCombatLog }) {
  return (
    <div className="lg:col-span-1 space-y-4">
      <h2 className="text-xl font-bold text-amber-500 border-b border-amber-900/50 pb-2 tracking-wider">EVENTS</h2>

      <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2">
        {events.map((event, i) => (
          <div
            key={i}
            className={`p-3 rounded border-l-4 ${getSeverityColor(event.severity)}`}
          >
            <p className="text-sm leading-relaxed">{event.text}</p>
            {event.combatLog && (
              <button
                onClick={() => onViewCombatLog(event.combatLog)}
                className="mt-2 text-xs px-2 py-1 bg-stone-700 hover:bg-stone-600 rounded text-amber-400 hover:text-amber-300 transition-colors"
              >
                View Combat Log
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
