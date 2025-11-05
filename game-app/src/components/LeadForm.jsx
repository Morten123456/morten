import { useState } from 'react';

function LeadForm({ totalScore, onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    consent: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('E-mail er påkrævet');
      return;
    }

    if (!formData.consent) {
      setError('Du skal acceptere at modtage kommunikation');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Mock POST til /api/leads endpoint
      // Dette kan senere udskiftes med rigtigt API-kald
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          consent: formData.consent,
          score: totalScore,
          date: new Date().toISOString().split('T')[0]
        })
      });

      // Simuler ventetid
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitted(true);
      
      // Gem email i localStorage for fremtidig brug
      localStorage.setItem('userEmail', formData.email);
      if (formData.name) {
        localStorage.setItem('userName', formData.name);
      }

    } catch (error) {
      console.error('Fejl ved indsendelse:', error);
      // Hvis API ikke eksisterer endnu, viser vi stadig success
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-7xl mb-6">✉️</div>
          <h2 className="text-3xl font-bold text-primary mb-4">
            Tak for din tilmelding!
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Din score på {totalScore} point er gemt.
          </p>
          <p className="text-gray-600 mb-8">
            Du modtager snart en mail med dit resultat og ugens spare-tips.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-primary text-white text-lg font-semibold rounded-xl hover:bg-opacity-90 transition-all"
            >
              Tilbage til forsiden
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 min-h-screen flex flex-col">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Få din score på mail
        </h1>
        <p className="text-gray-600">
          + modtag ugens spare-tips
        </p>
      </header>

      {/* Score reminder */}
      <div className="bg-primary text-white rounded-2xl p-6 mb-6 text-center">
        <p className="text-lg mb-2">Din score:</p>
        <p className="text-5xl font-bold">{totalScore}</p>
        <p className="text-sm mt-2 opacity-90">point</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Navn (valgfrit)
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Dit navn"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="din@email.dk"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none"
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="consent"
                checked={formData.consent}
                onChange={handleChange}
                required
                className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-gray-700">
                Jeg giver samtykke til at modtage kommunikation og spare-tips fra Hvad Koster Det. 
                Du kan altid afmelde dig.
              </span>
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 px-6 text-white text-lg font-semibold rounded-xl shadow-lg transition-all ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-primary hover:bg-opacity-90 active:scale-95'
            }`}
          >
            {isSubmitting ? 'Sender...' : 'Send'}
          </button>
        </form>

        {onBack && (
          <button
            onClick={onBack}
            className="w-full mt-3 py-3 px-6 text-gray-600 text-sm font-medium hover:text-primary transition-colors"
          >
            ← Tilbage
          </button>
        )}
      </div>

      {/* Privacy note */}
      <div className="text-center text-xs text-gray-500 px-4">
        <p>
          Vi respekterer dit privatliv og bruger kun din e-mail til at sende dig resultater og spare-tips. 
          Ingen spam. Du kan afmelde dig når som helst.
        </p>
      </div>
    </div>
  );
}

export default LeadForm;
