# Hvad koster det? - Deployment Guide

## Quick Start

### 1. Install Dependencies

```bash
# Python dependencies (Flask backend)
pip3 install -r requirements.txt

# Node dependencies (only needed for development)
cd game-app
npm install
cd ..
```

### 2. Start the Server

```bash
python3 main.py
```

The server will start on `http://localhost:8000`

### 3. Access the Applications

- **Slot Game** (original): `http://localhost:8000/`
- **Hvad koster det?**: `http://localhost:8000/game`
- **Admin Panel**: `http://localhost:8000/admin`

## Changing Daily Questions

### Option 1: Edit Source Code (Recommended for now)

1. Open `game-app/src/App.jsx`
2. Find the `DAILY_QUESTIONS` constant (around line 7)
3. Edit the questions:

```javascript
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
```

4. Rebuild the app:

```bash
cd game-app
npm run build
cd ..
```

5. Restart the Flask server

### Option 2: Future API Integration

The code is prepared for integration with a CMS or API. To switch to dynamic questions:

1. Create a Flask endpoint in `app/routes.py`:

```python
@app.get("/api/daily-questions")
def get_daily_questions():
    # Fetch from your database/CMS
    return jsonify([
        {"id": 1, "question": "...", "answer": 110, "unit": "kr"},
        # ...
    ])
```

2. Update `game-app/src/App.jsx` to fetch questions:

```javascript
const [dailyQuestions, setDailyQuestions] = useState(DAILY_QUESTIONS);

useEffect(() => {
  fetch('/api/daily-questions')
    .then(res => res.json())
    .then(data => setDailyQuestions(data))
    .catch(err => console.error('Using default questions', err));
}, []);
```

## Customization

### Colors

Edit `game-app/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: '#0F2A41',      // Main blue color
      background: '#F8FCFF',   // Light background
    },
  },
}
```

### Point System

Edit the `calculatePoints` function in `game-app/src/App.jsx`:

```javascript
function calculatePoints(guess, correctAnswer) {
  const difference = Math.abs(guess - correctAnswer);
  const percentageOff = (difference / correctAnswer) * 100;
  
  if (percentageOff <= 5) return 100;
  if (percentageOff <= 10) return 70;
  if (percentageOff <= 20) return 40;
  return 10;
}
```

### Lead Capture API

The game currently sends POST requests to `/api/leads`. To handle these:

1. Add a route in `app/routes.py`:

```python
@app.post("/api/leads")
def capture_lead():
    data = request.get_json()
    email = data.get('email')
    name = data.get('name', '')
    consent = data.get('consent', False)
    score = data.get('score', 0)
    
    # Save to database or send to CRM
    # ... your implementation
    
    return jsonify({"success": True, "message": "Tak!"})
```

## Development

### Running Dev Server

For faster development with hot reload:

```bash
cd game-app
npm run dev
```

This starts a Vite dev server at `http://localhost:5173`

### Building for Production

```bash
cd game-app
npm run build
```

This creates optimized files in `game-app/dist/` which Flask serves.

## File Structure

```
├── app/                    # Flask application
│   ├── __init__.py        # App factory with /game route
│   ├── routes.py          # API endpoints
│   └── ...
├── game-app/              # React game
│   ├── src/
│   │   ├── App.jsx        # Main game logic (EDIT QUESTIONS HERE)
│   │   ├── components/    # React components
│   │   └── ...
│   ├── dist/              # Built files (served by Flask)
│   └── package.json
├── static/                # Original slot game static files
├── main.py               # Flask entry point
└── requirements.txt      # Python dependencies
```

## Troubleshooting

### Game doesn't load at /game

1. Check that `game-app/dist/` exists
2. Run `cd game-app && npm run build`
3. Restart Flask server

### Questions don't update

1. Make sure you edited the right file: `game-app/src/App.jsx`
2. Rebuild: `cd game-app && npm run build`
3. Clear browser cache (Ctrl+Shift+R)
4. Restart Flask server

### "Module not found" errors

```bash
# Reinstall Python dependencies
pip3 install -r requirements.txt

# Reinstall Node dependencies
cd game-app
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### On Replit

1. Set the run command to: `python3 main.py`
2. Expose port 8000
3. Add environment variables if needed (see main README.md)

### On Other Platforms

1. Use a production WSGI server (e.g., gunicorn):
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8000 "app:create_app()"
   ```

2. Serve static files with nginx (optional but recommended for production)

3. Set up environment variables for production

## Support

For questions about the game logic, see `game-app/README.md`

For questions about the Flask backend, see `README.md`
