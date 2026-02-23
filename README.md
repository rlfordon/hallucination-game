# Citation Hallucination Game

A web-based classroom game that teaches law students to detect AI hallucinations in legal citations. Teams compete in two phases: first they "play the AI" by swapping real citations for fake ones in a legal brief, then they swap briefs and race to catch each other's fakes using cite-checking tools like Westlaw and CourtListener.

Built for the **21st Century Lawyering** course at Ohio State Moritz College of Law, class session on Hallucinations: Causes, Detection, Mitigation.

## How It Works

### Phase 0: Lobby
- Professor creates a game session (generates a 6-character game code)
- Students join by entering the code and their name
- Professor assigns students to teams (default: 3 teams)

### Phase 1: Fabrication (~20 min)
Each team receives a legal brief with ~23 clickable citations. For each citation, teams choose from pre-generated hallucination options across four types:

| Type | Description | Difficulty |
|------|-------------|------------|
| Fabricated Case | Case doesn't exist at all | Easy-Medium |
| Wrong Citation | Right case name, wrong volume/page/year | Medium |
| Mischaracterization | Real case, but the brief misstates the holding | Hard |
| Misquotation | Direct quote subtly altered | Hard |

Teams aim to alter 25-50% of citations. A tracker shows progress.

### Phase 2: Verification (~15 min)
Teams rotate briefs (Team A verifies Team B's work, B verifies C's, etc.). The altered brief looks identical to the original -- no visual hints. For each citation, students flag it as "Looks Legit" or "Flag as Fake." Time pressure forces triage.

### Phase 3: Reveal & Scoreboard
Results are revealed with per-team breakdowns and stats by hallucination type.

## Scoring

- **Fabrication**: +2 points per undetected fake
- **Verification**: +2 for correctly flagging a fake, -1 for incorrectly flagging a real citation
- Final score = fabrication + verification

## Running Locally

```bash
pip install -r requirements.txt
python app.py
```

The app runs at `http://localhost:5000`. The professor dashboard is at `/professor`.

## Project Structure

```
hallucination-game/
├── app.py                  # Flask routes and API endpoints
├── database.py             # SQLite database (game.db, auto-created)
├── game_state.py           # Brief loading, swap application, scoring
├── requirements.txt        # flask>=3.0
├── scripts/
│   └── parse_brief.py      # Parses raw brief text into structured JSON
├── data/
│   ├── briefs/
│   │   └── brief_rosario.json      # Parsed brief with citation spans
│   └── hallucinations/
│       └── brief_rosario.json      # Pre-generated fake options per citation
├── static/
│   ├── css/style.css
│   └── js/
│       ├── lobby.js
│       ├── fabrication.js
│       ├── verification.js
│       └── scoreboard.js
└── templates/
    ├── base.html
    ├── lobby.html
    ├── professor.html
    ├── fabrication.html
    ├── verification.html
    └── scoreboard.html
```

## The Brief

The included brief is from **Rosario v. Liberty Mutual Personal Insurance Company** (E.D. Pa., 2:26-cv-00276-MAK) -- a motion to dismiss an insurance bad faith claim. It contains 23 citations covering familiar 1L concepts (12(b)(6) motions, Iqbal/Twombly pleading standards). Each citation has 2-4 pre-generated hallucination options.

## Adding a New Brief

1. Create `data/briefs/brief_[name].json` with paragraphs and citation spans
2. Create `data/hallucinations/brief_[name].json` with fake options per citation
3. The app discovers new briefs automatically

## Tech Stack

- **Backend**: Python / Flask
- **Frontend**: Vanilla HTML/CSS/JS (no build step)
- **Database**: SQLite
- **Real-time**: Polling (every few seconds)
- **AI calls**: None at runtime -- all hallucination options are pre-generated
