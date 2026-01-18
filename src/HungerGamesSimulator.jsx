import React from 'react';
import { useGameState } from './hooks';
import {
  Header,
  Controls,
  GameStatus,
  ChampionsPanel,
  EventsPanel,
  ChampionDetailsPanel,
  BattlefieldMap,
  ChampionEditor,
  CombatLogModal
} from './components';

export default function HungerGamesSimulator() {
  const {
    // State
    champions,
    day,
    events,
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
  } = useGameState();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Controls
          champions={champions}
          gameState={gameState}
          day={day}
          autoPlay={autoPlay}
          speed={speed}
          onStartGame={startGame}
          onRunDay={runDay}
          onToggleAutoPlay={() => setAutoPlay(!autoPlay)}
          onSpeedChange={setSpeed}
          onShowEditor={() => setShowEditor(true)}
        />

        {champions && (
          <>
            <GameStatus
              gameState={gameState}
              day={day}
              livingCount={livingChampions.length}
              deadCount={deadChampions.length}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChampionsPanel
                champions={champions}
                selectedChampion={selectedChampion}
                onSelectChampion={setSelectedChampion}
              />

              <EventsPanel
                events={events}
                onViewCombatLog={setSelectedCombatLog}
              />

              <div className="lg:col-span-1 space-y-4">
                {selectedChampion ? (
                  <ChampionDetailsPanel
                    selectedChampion={selectedChampion}
                    livingChampions={livingChampions}
                  />
                ) : (
                  <BattlefieldMap
                    livingChampions={livingChampions}
                    onSelectChampion={setSelectedChampion}
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* Initial state */}
        {!champions && (
          <div className="text-center py-20">
            <p className="text-stone-400 text-lg mb-4">Welcome to Realm of Strife - a medieval battle simulation.</p>
            <p className="text-stone-500 max-w-xl mx-auto">
              Features: Champion attributes, dynamic relationships, resource management,
              psychological states, battlefield zones, noble patrons, divine interventions,
              and emergent storytelling.
            </p>
          </div>
        )}
      </main>

      {/* Champion Editor Modal */}
      {showEditor && champions && (
        <ChampionEditor
          champions={champions}
          onClose={() => setShowEditor(false)}
          onUpdateChampion={updateChampion}
          onUpdateChampionStat={updateChampionStat}
          onUpdateChampionRelationship={updateChampionRelationship}
          onRegenerateChampion={regenerateChampion}
          onRegenerateAllRelationships={regenerateAllRelationships}
        />
      )}

      {/* Combat Log Modal */}
      <CombatLogModal
        combatLog={selectedCombatLog}
        onClose={() => setSelectedCombatLog(null)}
      />
    </div>
  );
}
