# Hvad koster det? - Dagens prisudfordring

Et dagligt spil hvor brugere gætter priser på almindelige ting i Danmark.

## Hvordan skifter man dagens spørgsmål?

Dagens spørgsmål er defineret i filen `src/App.jsx` i konstanten `DAILY_QUESTIONS`.

Find følgende sektion i toppen af `src/App.jsx`:

```javascript
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
  // ... flere spørgsmål
];
```

### For at ændre spørgsmålene:

1. Åbn `src/App.jsx`
2. Find `DAILY_QUESTIONS` konstanten
3. Tilføj, fjern eller rediger spørgsmål i arrayet
4. Hver spørgsmål skal have:
   - `id`: Unikt nummer
   - `question`: Spørgsmålstekst
   - `answer`: Korrekt svar (i DKK)
   - `unit`: Enhed (typisk "kr")
5. Kør `npm run build` for at bygge appen
6. Genstart Flask serveren

### Integration med CMS/Database:

I stedet for at redigere `DAILY_QUESTIONS` manuelt, kan du senere udskifte det med et API-kald:

```javascript
const [dailyQuestions, setDailyQuestions] = useState([]);

useEffect(() => {
  // Hent dagens spørgsmål fra dit CMS/API
  fetch('/api/daily-questions')
    .then(res => res.json())
    .then(data => setDailyQuestions(data));
}, []);
```

## Udvikling

```bash
# Installer dependencies
npm install

# Start udviklings-server
npm run dev

# Byg til produktion
npm run build
```

## Point-system

- **100 point**: Inden for 5% af korrekt pris
- **70 point**: Inden for 10% af korrekt pris
- **40 point**: Inden for 20% af korrekt pris
- **10 point**: For at gennemføre

## Features

- ✅ Daglig spil-limit (via localStorage)
- ✅ Streak counter
- ✅ Point beregning
- ✅ Lead capture med email
- ✅ Mock leaderboard
- ✅ Del-funktion
- ✅ Mobil-first design
- ✅ Venligt, lyst UI

## Teknologi

- React 18
- Vite
- Tailwind CSS
- Vanilla state management (useState)
