# Citation Hallucination Game

**[Play it live](https://hallucination-game.replit.app/)**

A web-based game that teaches law students to detect AI-generated citation hallucinations in legal briefs. In the classroom team mode, teams compete in two phases: first they "play the AI" by swapping real citations for fake ones, then they swap briefs and race to catch each other's fakes using cite-checking tools like Westlaw and CourtListener. A solo practice mode lets individual students sharpen their skills on their own.

Built for the **21st Century Lawyering** course at Ohio State Moritz College of Law, class session on Hallucinations: Causes, Detection, Mitigation.

## Game Modes

### Solo Practice
Jump straight into a brief with system-generated hallucinations. Choose how many citations to alter, flag what looks fake, and see your results immediately. No game code or professor needed.

### Team Game (Classroom)

#### Phase 0: Lobby
- Professor creates a game session (generates a 6-character game code)
- Students join by entering the code and their name
- Students choose a team (default: 3 teams)

#### Phase 1: Fabrication (~20 min)
Each team receives a legal brief with ~23 clickable citations. For each citation, teams choose from pre-generated hallucination options across four types:

| Type | Description | Difficulty |
|------|-------------|------------|
| Fabricated Case | Case doesn't exist at all | Easy-Medium |
| Wrong Citation | Right case name, wrong volume/page/year | Medium |
| Mischaracterization | Real case, but the brief misstates the holding | Hard |
| Misquotation | Direct quote subtly altered | Hard |

Teams aim to alter 25-50% of citations. The professor can also skip this phase and have the system auto-generate swaps.

#### Phase 2: Verification (~15 min)
Teams rotate briefs (Team A verifies Team B's work, B verifies C's, etc.). The altered brief looks identical to the original -- no visual hints. For each citation, students flag it as "Looks Legit" or "Flag as Fake." Time pressure forces triage.

#### Phase 3: Reveal & Scoreboard
Results are revealed with per-team breakdowns, detection rates by hallucination type, and an annotated brief showing every swap with color-coded highlights.

## Scoring

- **Fabrication** (team mode only): +2 points per undetected fake
- **Verification**: +2 for correctly flagging a fake, -1 for incorrectly flagging a real citation
- Team mode total = fabrication + verification

## The Brief

The included brief is from **Rosario v. Liberty Mutual Personal Insurance Company** (E.D. Pa., 2:26-cv-00276-MAK) -- a motion to dismiss an insurance bad faith claim. It contains 23 citations covering familiar 1L concepts (12(b)(6) motions, Iqbal/Twombly pleading standards). Each citation has 2-4 pre-generated hallucination options across all four types.

## Running Locally

```bash
pip install -r requirements.txt
python app.py
```

The app runs at `http://localhost:5001`. The professor dashboard is at `/professor`.

## Project Structure

```
hallucination-game/
├── app.py                  # Flask routes and API endpoints
├── database.py             # SQLite database (game.db, auto-created)
├── game_state.py           # Brief loading, swap application, scoring
├── requirements.txt        # flask>=3.0
├── scripts/
│   ├── parse_brief.py      # Parses raw brief text into structured JSON
│   └── validate_brief.py   # Validates brief + hallucination data integrity
├── data/
│   ├── briefs/
│   │   └── brief_rosario.json      # Parsed brief with citation spans
│   └── hallucinations/
│       └── brief_rosario.json      # Pre-generated fake options per citation
├── static/
│   ├── css/style.css
│   └── js/
│       ├── common.js        # Shared API client, utilities, timer
│       ├── landing.js       # Landing page / solitaire start
│       ├── lobby.js         # Team game join flow
│       ├── fabrication.js   # Phase 1: swap citations
│       ├── verification.js  # Phase 2: flag citations
│       ├── review-brief.js  # Annotated brief rendering
│       └── scoreboard.js    # Phase 3: results display
└── templates/
    ├── base.html
    ├── landing.html         # Mode selection landing page
    ├── lobby.html           # Team game join + waiting room
    ├── professor.html       # Professor control panel
    ├── fabrication.html
    ├── verification.html
    └── scoreboard.html
```

## Tech Stack

- **Backend**: Python / Flask
- **Frontend**: Vanilla HTML/CSS/JS (no build step)
- **Database**: SQLite
- **Real-time**: Polling (every few seconds)
- **AI calls**: None at runtime -- all hallucination options are pre-generated

## Adding a New Brief

1. Create `data/briefs/brief_[name].json` with paragraphs and citation spans
2. Create `data/hallucinations/brief_[name].json` with fake options per citation
3. Run `python scripts/validate_brief.py brief_[name]` to check for errors
4. The app discovers new briefs automatically

See `CLAUDE.md` for the detailed data model and step-by-step workflow.

## License

[MIT](LICENSE)