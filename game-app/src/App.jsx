import { useState, useEffect } from 'react';
import WelcomeScreen from './components/WelcomeScreen';
import QuestionScreen from './components/QuestionScreen';
import ResultScreen from './components/ResultScreen';
import LeadForm from './components/LeadForm';

/**
 * DAGENS SPØRGSMÅL - Skift disse for at ændre dagens udfordring
 * 
 * Du kan senere hente disse data fra et CMS, Google Sheet eller Base44.
 * Bare udskift denne array med et API-kald i useEffect.
 */
const DAILY_QUESTIONS = [
  {
    id: 1,
    question: "Hvad koster en stor familiepizza i Danmark (ca.)?",
    answer: 110,
    unit: "kr"
  },
  {
    id: 2,
    question: "Hvad koster en bilvask i vaskehal (standard)?",
    answer: 80,
    unit: "kr"
  },
  {
    id: 3,
    question: "Hvad koster en almindelig elregning pr. måned for en lejlighed (vejledende)?",
    answer: 500,
    unit: "kr"
  }
];

// Funktion til at beregne points baseret på afstand fra korrekt svar
function calculatePoints(guess, correctAnswer) {
  const difference = Math.abs(guess - correctAnswer);
  const percentageOff = (difference / correctAnswer) * 100;
  
  if (percentageOff <= 5) return 100;
  if (percentageOff <= 10) return 70;
  if (percentageOff <= 20) return 40;
  return 10;
}

// Funktion til at få feedback-tekst
function getFeedbackText(guess, correctAnswer) {
  const difference = Math.abs(guess - correctAnswer);
  const percentageOff = (difference / correctAnswer) * 100;
  
  if (guess === correctAnswer) {
    return "Perfekt! Du ramte præcis!";
  } else if (percentageOff <= 5) {
    return `Fantastisk! Du ramte ${difference} kr fra.`;
  } else if (percentageOff <= 10) {
    return `Godt gættet! Du ramte ${difference} kr fra.`;
  } else if (percentageOff <= 20) {
    return `Ikke dårligt! Du var ${difference} kr fra.`;
  } else {
    return `Du var ${difference} kr fra. Prøv igen i morgen!`;
  }
}

// Dagens dato som streng (YYYY-MM-DD)
function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const [streak, setStreak] = useState(0);

  // Check om brugeren har spillet i dag (via localStorage)
  useEffect(() => {
    const lastPlayedDate = localStorage.getItem('lastPlayedDate');
    const todayDate = getTodayDateString();
    
    if (lastPlayedDate === todayDate) {
      setHasPlayedToday(true);
    }

    // Check streak
    const savedStreak = parseInt(localStorage.getItem('streak') || '0');
    setStreak(savedStreak);
  }, []);

  const startGame = () => {
    if (hasPlayedToday) {
      alert('Du har allerede spillet i dag! Kom tilbage i morgen for nye spørgsmål.');
      return;
    }
    setCurrentScreen('question');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setTotalScore(0);
  };

  const submitAnswer = (guess) => {
    const currentQuestion = DAILY_QUESTIONS[currentQuestionIndex];
    const points = calculatePoints(guess, currentQuestion.answer);
    const feedback = getFeedbackText(guess, currentQuestion.answer);
    
    const answerData = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      guess,
      correctAnswer: currentQuestion.answer,
      points,
      feedback
    };
    
    setAnswers([...answers, answerData]);
    setTotalScore(totalScore + points);
    
    // Næste spørgsmål eller resultat
    if (currentQuestionIndex < DAILY_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Markér at brugeren har spillet i dag
      const todayDate = getTodayDateString();
      localStorage.setItem('lastPlayedDate', todayDate);
      
      // Opdater streak
      const lastPlayedDate = localStorage.getItem('lastPlayedDate');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      let newStreak = 1;
      if (lastPlayedDate === yesterdayString) {
        newStreak = streak + 1;
      }
      setStreak(newStreak);
      localStorage.setItem('streak', newStreak.toString());
      
      setCurrentScreen('result');
    }
  };

  const handleLeadSubmit = async (leadData) => {
    // Mock POST til /api/leads - kan udskiftes med rigtigt endpoint senere
    console.log('Sender lead data:', leadData);
    
    try {
      // Placeholder API call
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...leadData,
          score: totalScore,
          date: getTodayDateString()
        })
      });
      
      // For nu viser vi bare en success besked
      alert('Tak for din tilmelding! Du modtager en mail snart.');
    } catch (error) {
      console.error('Fejl ved indsendelse:', error);
      // Hvis API ikke findes endnu, viser vi stadig success
      alert('Tak for din tilmelding! Du modtager en mail snart.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === 'welcome' && (
        <WelcomeScreen 
          onStart={startGame}
          hasPlayedToday={hasPlayedToday}
          streak={streak}
        />
      )}
      
      {currentScreen === 'question' && (
        <QuestionScreen
          question={DAILY_QUESTIONS[currentQuestionIndex]}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={DAILY_QUESTIONS.length}
          onSubmit={submitAnswer}
          previousAnswer={currentQuestionIndex > 0 ? answers[currentQuestionIndex - 1] : null}
        />
      )}
      
      {currentScreen === 'result' && (
        <ResultScreen
          answers={answers}
          totalScore={totalScore}
          maxScore={DAILY_QUESTIONS.length * 100}
        />
      )}
      
      {currentScreen === 'lead' && (
        <LeadForm
          onSubmit={handleLeadSubmit}
          totalScore={totalScore}
        />
      )}
    </div>
  );
}

export default App;
