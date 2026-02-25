# Citation Hallucination Game

A Flask web app that teaches law students to detect AI hallucinations in legal citations through a team-based classroom game.

## Running

```bash
python app.py
```

Runs on port 5000. Professor dashboard at `/professor`.

## Architecture

- **Backend**: Python/Flask (`app.py`), SQLite (`database.py`), game logic (`game_state.py`)
- **Frontend**: Vanilla HTML/CSS/JS in `templates/` and `static/`
- **Data**: JSON files in `data/briefs/` and `data/hallucinations/`

## Dependencies

- Flask >= 3.0 (installed via pip)
- Python 3.11

## Key Files

| File | Purpose |
|------|---------|
| `app.py` | Flask routes and API endpoints |
| `database.py` | SQLite database management |
| `game_state.py` | Brief loading, swap application, scoring |
| `data/briefs/` | Parsed legal briefs with citation spans |
| `data/hallucinations/` | Pre-generated fake citation options |
