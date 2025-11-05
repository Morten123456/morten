import { useState } from 'react';
import LeadForm from './LeadForm';

function ResultScreen({ answers, totalScore, maxScore }) {
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  const getPerformanceEmoji = () => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 70) return '🌟';
    if (percentage >= 50) return '👍';
    return '💪';
  };

  const getPerformanceText = () => {
    if (percentage >= 90) return 'Fantastisk!';
    if (percentage >= 70) return 'Rigtig godt!';
    if (percentage >= 50) return 'Godt forsøg!';
    return 'Prøv igen i morgen!';
  };

  const handleShare = () => {
    const message = `Jeg fik ${totalScore} point i Hvad Koster Det? – kan du slå mig? 🎯`;
    
    // Kopier til clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message).then(() => {
        setShareMessage('Link kopieret! 📋');
        setTimeout(() => setShareMessage(''), 3000);
      });
    } else {
      setShareMessage(message);
    }
  };

  if (showLeadForm) {
    return <LeadForm totalScore={totalScore} onBack={() => setShowLeadForm(false)} />;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Godt klaret!
        </h1>
      </header>

      {/* Score card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 text-center">
        <div className="text-7xl mb-4">{getPerformanceEmoji()}</div>
        <h2 className="text-3xl font-bold text-primary mb-2">
          {getPerformanceText()}
        </h2>
        <div className="text-6xl font-bold text-primary my-6">
          {totalScore}
        </div>
        <p className="text-xl text-gray-600 mb-4">
          point af {maxScore} mulige
        </p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {percentage}% korrekt
        </p>
      </div>

      {/* Detailed results */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-primary mb-4">
          Dine svar:
        </h3>
        <div className="space-y-4">
          {answers.map((answer, index) => (
            <div key={answer.questionId} className="border-b border-gray-200 pb-4 last:border-0">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Spørgsmål {index + 1}
              </p>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Dit gæt:</p>
                  <p className="text-lg font-bold text-primary">{answer.guess} kr</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-sm text-gray-600 mb-1">Korrekt svar:</p>
                  <p className="text-lg font-bold text-green-600">{answer.correctAnswer} kr</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">{answer.feedback}</p>
                <span className="text-lg font-bold text-yellow-600">
                  +{answer.points} pt
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-primary mb-2 text-center">
          📧 Få din score på mail
        </h3>
        <p className="text-gray-600 text-center mb-4">
          + modtag ugens spare-tips direkte i din indbakke
        </p>
        <button
          onClick={() => setShowLeadForm(true)}
          className="w-full py-4 px-6 bg-primary text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-opacity-90 active:scale-95 transition-all"
        >
          Ja tak, send mig resultatet
        </button>
      </div>

      {/* Share button */}
      <div className="text-center mb-6">
        <button
          onClick={handleShare}
          className="w-full py-3 px-6 bg-white border-2 border-primary text-primary text-lg font-semibold rounded-xl hover:bg-primary hover:text-white transition-all"
        >
          📤 Del dit resultat
        </button>
        {shareMessage && (
          <p className="text-sm text-green-600 mt-2 font-medium">
            {shareMessage}
          </p>
        )}
      </div>

      {/* Come back tomorrow */}
      <div className="text-center text-gray-600">
        <p className="text-lg font-medium mb-1">
          🗓️ Kom tilbage i morgen
        </p>
        <p className="text-sm">
          for nye spørgsmål og en ny chance for at forbedre din score!
        </p>
      </div>
    </div>
  );
}

export default ResultScreen;
