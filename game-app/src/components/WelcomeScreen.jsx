import { useState, useEffect } from 'react';

// Mock leaderboard data - kan senere hentes fra API
const MOCK_LEADERBOARD = [
  { name: "Anna K.", score: 280 },
  { name: "Peter M.", score: 250 },
  { name: "Maria L.", score: 230 }
];

function WelcomeScreen({ onStart, hasPlayedToday, streak }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">
          Hvad koster det?
        </h1>
        <p className="text-lg text-gray-600">
          Dagens udfordring
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Kom igen i morgen for nye spørgsmål
        </p>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Streak counter */}
        {streak > 0 && !hasPlayedToday && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6 text-center">
            <p className="text-2xl font-bold text-yellow-700">
              🔥 Du er på {streak} {streak === 1 ? 'dag' : 'dage'} i træk!
            </p>
            <p className="text-sm text-yellow-600 mt-1">
              Fortsæt din streak i dag!
            </p>
          </div>
        )}

        {/* Game description */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-primary mb-4">
            Hvordan spiller man?
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-2xl mr-3">1️⃣</span>
              <span>Gæt prisen på 3 dagligdags ting i Danmark</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">2️⃣</span>
              <span>Få points baseret på hvor tæt du gætter</span>
            </li>
            <li className="flex items-start">
              <span className="text-2xl mr-3">3️⃣</span>
              <span>Sammenlign din score med andre</span>
            </li>
          </ul>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <p className="text-sm font-semibold text-primary mb-2">
              Point-system:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 100 point: Inden for 5% af korrekt pris</li>
              <li>• 70 point: Inden for 10%</li>
              <li>• 40 point: Inden for 20%</li>
              <li>• 10 point: For at gennemføre</li>
            </ul>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold text-primary mb-4 text-center">
            🏆 Topscore denne uge
          </h3>
          <div className="space-y-2">
            {MOCK_LEADERBOARD.map((player, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                  <span className="font-medium">{player.name}</span>
                </div>
                <span className="font-bold text-primary">{player.score} pt</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          disabled={hasPlayedToday}
          className={`w-full py-4 px-6 rounded-2xl text-white text-xl font-semibold shadow-lg transition-all ${
            hasPlayedToday
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-primary hover:bg-opacity-90 active:scale-95'
          }`}
        >
          {hasPlayedToday ? '✓ Spillet i dag - Kom tilbage i morgen!' : 'Start dagens udfordring!'}
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
