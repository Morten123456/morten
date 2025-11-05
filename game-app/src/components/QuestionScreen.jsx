import { useState } from 'react';

function QuestionScreen({ question, questionNumber, totalQuestions, onSubmit, previousAnswer }) {
  const [guess, setGuess] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!guess || isNaN(guess) || Number(guess) <= 0) {
      alert('Indtast venligst et gyldigt tal');
      return;
    }

    setShowFeedback(true);
    
    // Vent lidt før vi går videre til næste spørgsmål
    setTimeout(() => {
      onSubmit(Number(guess));
      setGuess('');
      setShowFeedback(false);
    }, 2500);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col">
      {/* Header med progress */}
      <header className="mb-8">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-primary">
            Hvad koster det?
          </h1>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Spørgsmål {questionNumber} af {totalQuestions}</span>
            <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Previous answer feedback (hvis der er et) */}
      {previousAnswer && !showFeedback && (
        <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
          <p className="text-green-800 font-semibold mb-1">
            Sidste svar: {previousAnswer.feedback}
          </p>
          <p className="text-green-700 text-sm">
            Du fik {previousAnswer.points} point
          </p>
        </div>
      )}

      {/* Main question card */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">💰</div>
            <h2 className="text-2xl font-bold text-primary mb-2">
              {question.question}
            </h2>
          </div>

          {!showFeedback ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="guess" className="block text-sm font-medium text-gray-700 mb-2">
                  Dit gæt (i DKK):
                </label>
                <div className="relative">
                  <input
                    id="guess"
                    type="number"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Indtast beløb"
                    className="w-full px-4 py-4 text-2xl font-semibold text-center border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl text-gray-400">
                    kr
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 px-6 bg-primary text-white text-xl font-semibold rounded-2xl shadow-lg hover:bg-opacity-90 active:scale-95 transition-all"
              >
                Send dit gæt
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="animate-pulse">
                <div className="text-6xl mb-4">⏳</div>
                <p className="text-xl text-gray-600">
                  Tjekker dit svar...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="text-center text-sm text-gray-500">
          💡 Tænk på hvad du normalt betaler for lignende ting
        </div>
      </div>
    </div>
  );
}

export default QuestionScreen;
