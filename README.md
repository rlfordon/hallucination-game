# Citation Hallucination Game

**[Play it live](https://hallucination-game.replit.app/)**

A web-based game where law students detect AI-generated citation hallucinations in real legal briefs. Teams compete to plant convincing fakes and then catch each other's fakes using cite-checking tools like Westlaw and CourtListener — all under time pressure. A solo practice mode is also available for individual study.

Built for the **21st Century Lawyering** course at Ohio State Moritz College of Law. First run: February 2026, 11 students, 3 teams.

## Teacher's Guide

**[Read the full Teacher's Guide](Teachers%20Guide.md)** — everything you need to run the game in your own classroom, including:

- Learning objectives and how the game addresses them
- Step-by-step instructions for each phase
- Suggested readings and pre-class preparation
- Timing options (50, 75, or 85 minutes)
- Debrief discussion questions
- Assessment ideas (reflection prompts, standing orders analysis)
- Lessons learned from the first run

## How the Game Works

### Team Game (Classroom)

1. **Fabrication** (~20 min) — Teams receive a legal brief with ~23 citations. They choose which citations to alter by selecting from pre-generated hallucination options across four types:

   | Type | Difficulty | What It Tests |
   |------|-----------|--------------|
   | Fabricated Case | Easy | Does this case exist at all? |
   | Wrong Citation | Medium | Are the volume/page/year correct? |
   | Mischaracterization | Hard | Does the case actually say what the brief claims? |
   | Misquotation | Hard | Is this quote accurate word-for-word? |

2. **Verification** (~20 min) — Teams swap briefs and race to flag the fakes. The altered brief looks identical to the original — no visual hints. Time pressure forces triage: you can't check all 23 citations, so which do you prioritize?

3. **Reveal** — Results show detection rates by hallucination type. The pattern that emerges is the lesson: students catch fabricated cases easily but miss mischaracterizations and misquotations. That gap is where AI verification tools run out and human judgment begins.

### Solo Practice

Jump straight into a brief with system-generated hallucinations. No game code, no teams, no timer. Good for pre-class homework or post-class reinforcement.

## The Brief

The included brief is from **Rosario v. Liberty Mutual Personal Insurance Company** (E.D. Pa., 2:26-cv-00276-MAK) — a motion to dismiss an insurance bad faith claim. It covers familiar 1L concepts (12(b)(6) motions, Iqbal/Twombly pleading standards), with 23 citations and 2–4 hallucination options per citation across all four types.

## Run Your Own Instance

The game is a Python/Flask app with no build step and no external API calls — all hallucination options are pre-generated. To run locally:

```bash
pip install -r requirements.txt
python app.py
```

Opens at `http://localhost:5001`. The professor dashboard is at `/professor`.

For hosted deployment, the app runs on any platform that supports Python (Replit, Render, Railway, etc.). SQLite is the only database — no external database setup needed.

## Add Your Own Briefs

Each brief needs two JSON files:

1. **Brief data** (`data/briefs/brief_[name].json`) — the brief text broken into paragraphs, with each citation's position and metadata
2. **Hallucination options** (`data/hallucinations/brief_[name].json`) — pre-generated fakes for each citation, organized by type and difficulty

Good briefs for this exercise have 15–25 citations, a mix of well-known and obscure cases, some direct quotations, and accessible legal concepts. Real briefs from PACER or CourtListener work best.

After creating both files, validate with:

```bash
python scripts/validate_brief.py brief_[name]
```

The app discovers new briefs automatically. See [CLAUDE.md](CLAUDE.md) for the detailed data model and step-by-step authoring workflow.

## Project Structure

```
hallucination-game/
├── app.py                  # Flask routes and API endpoints
├── database.py             # SQLite database (game.db, auto-created)
├── game_state.py           # Brief loading, swap application, scoring
├── data/
│   ├── briefs/             # Parsed briefs with citation spans
│   └── hallucinations/     # Pre-generated hallucination options per citation
├── scripts/
│   ├── parse_brief.py      # Brief text → structured JSON
│   └── validate_brief.py   # Data integrity checks
├── static/                 # CSS and vanilla JS (no build step)
└── templates/              # Flask/Jinja2 HTML templates
```

## License

[MIT](LICENSE)

## Contact

Rebecca Fordon — fordon.4@osu.edu