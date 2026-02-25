# Citation Hallucination Game — Build Spec

## Overview

A web-based classroom game for 11 law students (3–4 teams) that teaches hallucination detection by having students *create* fake citations, then catch each other's fakes under time pressure.

**Course**: 21st Century Lawyering (Ohio State Moritz College of Law)
**Class session**: 7-1 — Hallucinations: Causes, Detection, Mitigation
**Class date**: Wednesday, February 25, 2026, 2:00–3:25 PM
**Deployment**: Replit (web app, publicly accessible URL)

### Learning Objectives
- Explain technical and contextual reasons why LLMs hallucinate (Understanding)
- Analyze hallucination case studies to identify failures and consequences (Analyzing)
- Demonstrate use of cite-checking tools to verify AI-generated legal content (Applying)
- Evaluate court standing orders on AI use and justify their requirements (Evaluating)

---

## Game Flow

### Phase 0: Lobby
- Professor creates a game session (generates a game code)
- Students go to the URL and enter the game code + their name
- Professor assigns teams (or students pick from available teams)
- Professor can see the lobby and when everyone has joined
- Professor clicks "Start Game" to begin Phase 1

### Phase 1: Fabrication ("Be the AI") — ~20 minutes
- **Each team gets a different brief** — this is critical. If teams fabricate and verify the same brief, they'll recognize the original citations during verification, making it trivially easy. Different briefs ensure the verification phase is a genuine challenge.
- The app supports multiple briefs. Each brief has its own set of parsed citations and pre-generated hallucination options.
- Team-to-brief assignment is configured by the professor during lobby (or auto-assigned).
- Clicking a citation opens a panel showing:
  - The original citation text (in context)
  - A dropdown of hallucination types (see Hallucination Types below)
  - Pre-generated fake options for the selected type
  - A "Confirm Swap" button
- Teams should aim to alter **25–50%** of citations (~6–12 of ~20)
- A sidebar tracker shows: citations altered (with type icons), total count, and a target range indicator
- A countdown timer is visible
- Teams can undo/change their swaps until phase ends
- When timer expires (or professor manually ends), all swaps are locked

### Phase 2: Verification ("Catch the Fakes") — ~15 minutes
- Professor triggers the swap — each team gets a *different* team's altered brief (a brief they have never seen before)
- Team assignment rotation: Team A fabricated Brief 1 → verifies Brief 2 (fabricated by Team B), Team B fabricated Brief 2 → verifies Brief 3 (fabricated by Team C), Team C fabricated Brief 3 → verifies Brief 1 (fabricated by Team A)
- The brief looks identical — no visual indicators of which citations were swapped
- For each citation, students can click it and choose:
  - 🟢 **"Looks Legit"** — they believe it's unchanged
  - 🔴 **"Flag as Fake"** — they believe it was altered
  - ⚪ **Skip** (default state — no judgment made)
- Students have access to external tools (Westlaw, CourtListener, etc.) but the app does NOT include links — professor will tell them what's available
- Countdown timer visible
- Time pressure means they can't manually verify everything — they must triage

### Phase 3: Reveal & Scoreboard — ~10 minutes (professor-led discussion)
- Professor clicks "Reveal Results"
- For each team's brief, the app shows:
  - Each citation with its true status (original vs. altered)
  - If altered: what type of hallucination was used
  - Whether the verifying team correctly identified it
- **Scoreboard** shows:
  - Fabrication score: points for undetected fakes
  - Verification score: points for correctly flagged fakes
  - Combined/total score
  - Breakdown by hallucination type (which types were hardest to catch?)
- Stats panel: "Most deceptive hallucination type," "Most caught type," "Best verifier team"

---

## Scoring

### Fabrication Points (for the team that altered the brief)
- **+2 points** for each fake that went undetected (not flagged)
- **+1 point** for each fake flagged but with wrong type guess (if we add type guessing — optional)
- **+0 points** for each fake correctly caught

### Verification Points (for the team checking the brief)
- **+2 points** for correctly flagging a fake citation
- **+0 points** for skipping (no judgment)
- **-1 point** for incorrectly flagging a real citation as fake (discourages wild guessing)

### Final Score
- Each team gets a Fabrication Score (from Phase 1) + Verification Score (from Phase 2)
- Display both separately AND combined

---

## Hallucination Types

Each type maps to a real category of AI hallucination in legal contexts:

| ID | Label | Description | Difficulty to Catch |
|----|-------|-------------|-------------------|
| `fabricated_case` | Fabricated Case | The case doesn't exist at all — made-up parties, made-up citation | Easy |
| `wrong_citation` | Wrong Citation | Right case name, wrong volume/page/reporter/year/court numbers | Medium |
| `mischaracterization` | Mischaracterization | The case is real and the citation is correct, but what the brief says about it is wrong. Two practical sub-types: **(a) Exaggerated/fabricated details** — the case is on the right topic but the brief overstates the holding, adds requirements that aren't there, or fabricates facts about the case; **(b) Wrong topic** — a real case citation is swapped in that exists but is about a completely different area of law, while the brief's description stays the same. Sub-type (a) is harder to catch than (b). | Hard |
| `misquotation` | Misquotation | Direct quote has been subtly altered — words added, removed, or changed | Hard |

---

## Tech Stack

- **Backend**: Python Flask
- **Frontend**: Vanilla HTML/CSS/JavaScript (no build step)
- **Database**: SQLite (single file, simple — this is a classroom tool)
- **Hosting**: Replit
- **No external AI API calls at runtime** — all hallucination options are pre-generated and stored as static data

### Project Structure
```
citation-game/
├── app.py                  # Flask app — routes and game logic
├── database.py             # SQLite setup and queries
├── game_state.py           # Game phase management, timers, team assignments
├── static/
│   ├── css/
│   │   └── style.css       # Clean, minimal styling
│   └── js/
│       ├── lobby.js        # Lobby/join screen logic
│       ├── fabrication.js  # Phase 1 — citation clicking, swap UI
│       ├── verification.js # Phase 2 — flagging UI
│       └── scoreboard.js   # Phase 3 — results display
├── templates/
│   ├── base.html           # Shared layout
│   ├── professor.html      # Professor control panel
│   ├── lobby.html          # Student join screen
│   ├── fabrication.html    # Phase 1 view
│   ├── verification.html   # Phase 2 view
│   └── scoreboard.html     # Phase 3 results
├── data/
│   ├── briefs/
│   │   ├── brief_rosario.json      # Rosario v. Liberty Mutual — parsed text + citations
│   │   ├── brief_2.json            # Second brief (TBD)
│   │   └── brief_3.json            # Third brief (TBD)
│   ├── hallucinations/
│   │   ├── brief_rosario.json      # Pre-generated fake options for Rosario brief
│   │   ├── brief_2.json            # Fake options for second brief (TBD)
│   │   └── brief_3.json            # Fake options for third brief (TBD)
└── requirements.txt        # Flask, etc.
```

---

## API Endpoints

### Professor Endpoints
```
POST   /api/game/create          — Create a new game session, returns game code
POST   /api/game/start           — Start Phase 1 (fabrication)
POST   /api/game/swap            — End Phase 1, start Phase 2 (verification)
POST   /api/game/reveal          — End Phase 2, show results
GET    /api/game/status          — Current game state (phase, timer, teams)
POST   /api/game/assign-teams    — Assign students to teams
```

### Student Endpoints
```
POST   /api/join                 — Join game with code + name
GET    /api/brief                — Get the brief with citations (format depends on phase)
POST   /api/citation/swap        — Swap a citation (Phase 1) { citation_id, hallucination_type, option_id }
POST   /api/citation/unswap      — Undo a swap (Phase 1) { citation_id }
POST   /api/citation/flag        — Flag a citation (Phase 2) { citation_id, verdict: "legit"|"fake" }
GET    /api/team/progress        — Team's current swap/flag count
```

### Shared Endpoints
```
GET    /api/scoreboard           — Final results (Phase 3 only)
GET    /api/game/phase           — Current phase (for polling — or use WebSockets)
```

### Real-Time Updates
Use **polling** (every 2–3 seconds) rather than WebSockets for simplicity on Replit. Each client polls `/api/game/phase` to detect phase transitions and `/api/team/progress` for teammate updates.

---

## Data Model

### Game Session
```json
{
  "game_id": "ABC123",
  "phase": "lobby|fabrication|verification|reveal",
  "timer_end": "2026-02-25T14:35:00Z",
  "briefs": ["brief_rosario", "brief_2", "brief_3"],
  "teams": {
    "team_1": { "name": "Team A", "members": ["Alice", "Bob", "Charlie"], "fabrication_brief": "brief_rosario", "verification_brief": "brief_2" },
    "team_2": { "name": "Team B", "members": ["Dana", "Eve", "Frank"], "fabrication_brief": "brief_2", "verification_brief": "brief_3" },
    "team_3": { "name": "Team C", "members": ["Grace", "Hank", "Iris", "Jack", "Kim"], "fabrication_brief": "brief_3", "verification_brief": "brief_rosario" }
  }
}
```

### Citation Object (in brief.json)
```json
{
  "id": "cite_01",
  "case_name": "McTernan v. City of York",
  "full_citation": "564 F.3d 636, 646 (3d Cir. 2009)",
  "citation_text_in_brief": "McTernan v. City of York, 564 F.3d 636, 646 (3d. Cir. 2009) (citations omitted)",
  "proposition": "In deciding a motion to dismiss, the court must accept all well-pleaded factual allegations as true, construe the complaint in the light most favorable to the plaintiff, and determine whether, under any reasonable reading of the complaint, the plaintiff may be entitled to relief.",
  "context_before": "A motion to dismiss pursuant to Rule 12(b)(6) challenges the legal sufficiency of a complaint. In deciding a motion to dismiss, the court must accept all well-pleaded factual allegations as true,",
  "context_after": "",
  "paragraph_index": 3,
  "is_quotation": true
}
```

### Swap Record
```json
{
  "team_id": "team_1",
  "citation_id": "cite_01",
  "hallucination_type": "mischaracterization",
  "option_id": "cite_01_mischar_1",
  "original_text": "...",
  "replacement_text": "..."
}
```

### Flag Record
```json
{
  "team_id": "team_2",
  "citation_id": "cite_01",
  "verdict": "fake"
}
```

---

## The Brief

**Case**: Rosario v. Liberty Mutual Personal Insurance Company
**Court**: E.D. Pennsylvania (Judge Kearney)
**Docket**: 2:26-cv-00276-MAK
**Document**: Brief in Support of Defendant's Amended/Renewed Motion to Dismiss
**Source**: CourtListener / PACER

This is a motion to dismiss an insurance bad faith claim. The defendant (Liberty Mutual) argues: (1) plaintiff's bad faith allegations are conclusory and fail to meet Iqbal/Twombly pleading standards, and (2) certain paragraphs about claims handling should be stricken from the breach of contract count because they're immaterial to a UIM claim.

The brief is accessible to law students without deep insurance law knowledge — the legal concepts (12(b)(6) motions, pleading standards, Iqbal/Twombly) are familiar from 1L Civil Procedure.

### Brief Display Notes
- Strip the PACER header lines ("Case 2:26-cv-00276-MAK...") and footer lines ("LEGAL/174061944.1") from each page
- Fix encoding: replace â€™ with ', â€œ with ", â€? with ", Â¶ with ¶
- Display as flowing text with section headings preserved
- Citations should be visually distinguished (e.g., slightly different background on hover, underlined, or highlighted) but not garish — they should look like part of a normal brief

---

## Extracted Citations with Pre-Generated Hallucination Options

Below are all 23 citations from the brief. For each one, I've listed the applicable hallucination types and pre-generated fake options students can choose from.

Each option has a **short label** (what the student sees in the UI) and a **replacement** (what gets swapped into the brief). Labels follow a consistent format: a brief phrase describing what's wrong, marked with difficulty.

---

### Citation 1: McTernan v. City of York
- **Full cite**: McTernan v. City of York, 564 F.3d 636, 646 (3d Cir. 2009)
- **Used for**: Standard of review — motion to dismiss requires accepting well-pleaded facts as true
- **Has quotation**: Yes — "construe the complaint in the light most favorable to the plaintiff..."
- **Location**: Section III.A.1 (Standard of Review)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Misspelled party name | **McTiernan v. City of York, 564 F.3d 636, 646 (3d Cir. 2009)** | Hard |
| `fabricated_case` | Entirely fabricated case | **Harrington v. City of Lancaster, 578 F.3d 412, 419 (3d Cir. 2010)** — plausible Third Circuit case | Medium |
| `wrong_citation` | Wrong pinpoint page | **McTernan v. City of York, 564 F.3d 636, 651 (3d Cir. 2009)** — page 651 instead of 646 | Medium |
| `wrong_citation` | Transposed volume number | **McTernan v. City of York, 546 F.3d 636, 646 (3d Cir. 2009)** — volume 546 instead of 564 | Medium |
| `mischaracterization` | Exaggerated standard | Change proposition to: "the court must accept all factual allegations as true, including those that are merely conclusory in nature" — overstates by including conclusory allegations, which courts actually DON'T have to accept | Hard |
| `misquotation` | Swapped key phrase | Change "any reasonable reading" to "the most favorable reading" — legally distinct meaning | Hard |

---

### Citation 2: Ashcroft v. Iqbal
- **Full cite**: Ashcroft v. Iqbal, 556 U.S. 662 (2009)
- **Used for**: Pleading standard — "more than unadorned accusation," plausibility requirement
- **Has quotation**: Yes — extended block quote about Rule 8
- **Location**: Section III.A.2 (multiple appearances throughout)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `wrong_citation` | Wrong year | **Ashcroft v. Iqbal, 556 U.S. 662, 678 (2011)** — 2011 instead of 2009 | Medium |
| `wrong_citation` | Wrong starting page | **Ashcroft v. Iqbal, 556 U.S. 686 (2009)** — page 686 instead of 662 | Medium |
| `misquotation` | Smoothed awkward phrasing | Change "demands more than an unadorned, the defendant-unlawfully-harmed-me accusation" to "demands more than an unadorned accusation that the defendant unlawfully harmed the plaintiff" — sounds more natural but is not the actual quote | Hard |
| `misquotation` | Merged two distinct phrases | Change "labels and conclusions" to "labels, conclusions, and formulaic recitations" — combines phrases from different parts of the opinion | Hard |

*Note: Iqbal is cited many times in this brief. The swap should apply to the first/primary citation. Subsequent short-form cites (Ashcroft, 556 U.S. at 678) would automatically update if the main citation is swapped.*

---

### Citation 3: Bell Atlantic Corp. v. Twombly
- **Full cite**: Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 557 (2007)
- **Used for**: Cited parenthetically within Iqbal discussion
- **Has quotation**: No (referenced for "labels and conclusions" language)
- **Location**: Section III.A.2

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `wrong_citation` | Wrong pinpoint page | **Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 555 (2007)** — page 555 instead of 557 | Medium |
| `fabricated_case` | Wrong volume and year | **Bell Atlantic Corp. v. Twombly, 540 U.S. 544, 557 (2005)** — pre-dates the actual 2007 decision | Medium |
| `mischaracterization` | Exaggerated standard | Change text to say Twombly requires "specific evidentiary facts demonstrating a reasonable likelihood of success" — dramatically overstates the pleading standard | Hard |

---

### Citation 4: Kiessling v. State Farm Mut. Auto Ins. Co.
- **Full cite**: 2019 U.S. Dist. LEXIS 24085, at *5-6 (E.D. Pa. 2019)
- **Used for**: Three-part analysis for surviving 12(b)(6); bad faith claims are fact-specific
- **Has quotation**: No (paraphrased holdings)
- **Location**: Section III.A.2 (two appearances)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Misspelled party name | **Keisling v. State Farm Mut. Auto Ins. Co., 2019 U.S. Dist. LEXIS 24085 (E.D. Pa. 2019)** — Keisling instead of Kiessling | Hard |
| `fabricated_case` | Entirely fabricated case | **Patterson v. State Farm Mut. Auto Ins. Co., 2019 U.S. Dist. LEXIS 31742 (E.D. Pa. 2019)** | Medium |
| `mischaracterization` | Exaggerated requirements | Change the three-part test to add a fourth step: "the court must also consider whether the plaintiff has identified specific individuals responsible for the bad faith conduct" — fabricated additional requirement that isn't in Kiessling | Hard |
| `mischaracterization` | Wrong topic — real case | Swap citation to **Rivera v. State Farm Mut. Auto Ins. Co., 2019 U.S. Dist. LEXIS 27435 (E.D. Pa. 2019)** — keep the same description of the three-part test, but this is actually an employment retaliation case *(verify citation exists before use)* | Medium |

---

### Citation 5: Brown v. Progressive Insurance Company
- **Full cite**: 860 A.2d 493 (Pa. Super. 2004)
- **Used for**: Mere dispute as to value does not amount to bad faith (in footnote 2)
- **Has quotation**: No
- **Location**: Footnote 2

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `wrong_citation` | Wrong year | **Brown v. Progressive Insurance Company, 860 A.2d 493 (Pa. Super. 2006)** | Medium |
| `mischaracterization` | Exaggerated holding | Change to: "any dispute as to the value of a claim, no matter how substantial the difference, cannot form the basis of a bad faith action" — overstates Brown by adding "no matter how substantial," which goes further than the actual holding | Hard |
| `fabricated_case` | Wrong company name | **Brown v. Progressive Casualty Insurance Company, 862 A.2d 519 (Pa. Super. 2004)** — similar but fabricated | Medium |

---

### Citation 6: Johnson v. Progressive Ins. Co.
- **Full cite**: 987 A.2d 781 (Pa. Super. 2009)
- **Used for**: Reaffirmed Brown — low offer doesn't equal bad faith (in footnote 2)
- **Has quotation**: Yes — extended quote about "floodgate of litigation"
- **Location**: Footnote 2

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `wrong_citation` | Transposed volume digits | **Johnson v. Progressive Ins. Co., 978 A.2d 781 (Pa. Super. 2009)** — 978 instead of 987 | Medium |
| `misquotation` | Synonym swap in quote | Change "nothing more than a normal dispute" to "nothing more than a routine disagreement" — close but not the actual language | Hard |
| `mischaracterization` | Fabricated case details | Change to: "the court held that an insurer's offer of less than 50% of the claim's established value creates a rebuttable presumption of bad faith" — fabricates a specific percentage threshold that doesn't exist in the case | Hard |

---

### Citation 7: Smith v. State Farm Mut. Auto Ins. Co.
- **Full cite**: 56 Fed. Appx. 133, 136 (3d Cir. 2012)
- **Used for**: String cite — courts routinely dismiss bare-bones bad faith claims
- **Location**: Section III.A.2 (string cite paragraph)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Wrong year | **Smith v. State Farm Mut. Auto Ins. Co., 56 Fed. Appx. 133, 136 (3d Cir. 2003)** — plausible since low Fed. Appx. volume | Medium |
| `fabricated_case` | Entirely fabricated case | **Sullivan v. State Farm Mut. Auto Ins. Co., 61 Fed. Appx. 227, 230 (3d Cir. 2012)** | Medium |
| `wrong_citation` | Wrong pinpoint page | **Smith v. State Farm Mut. Auto Ins. Co., 56 Fed. Appx. 133, 138 (3d Cir. 2012)** | Medium |

---

### Citation 8: Rosenthal v. Am. States Ins. Co.
- **Full cite**: 2019 U.S. Dist. LEXIS 50485, *14 (M.D. Pa. 2019)
- **Used for**: String cite — courts dismiss bare-bones bad faith claims
- **Location**: Section III.A.2 (string cite paragraph)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Wrong defendant name | **Rosenthal v. American General Ins. Co., 2019 U.S. Dist. LEXIS 50485, *14 (M.D. Pa. 2019)** — American General instead of American States | Medium |
| `fabricated_case` | Wrong LEXIS number + district | **Rosenthal v. Am. States Ins. Co., 2019 U.S. Dist. LEXIS 54082, *14 (E.D. Pa. 2019)** | Medium |

---

### Citation 9: Moran v. United Servs. Auto. Ass'n
- **Full cite**: 2019 U.S. Dist. LEXIS 24080, *13 (M.D. Pa. 2019)
- **Used for**: String cite
- **Location**: Section III.A.2 (string cite paragraph)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Wrong district | **Moran v. United Services Automobile Association, 2019 U.S. Dist. LEXIS 24080, *13 (E.D. Pa. 2019)** — E.D. instead of M.D. | Medium |
| `wrong_citation` | Transposed LEXIS digits | **Moran v. United Servs. Auto. Ass'n, 2019 U.S. Dist. LEXIS 24800, *13 (M.D. Pa. 2019)** — 24800 instead of 24080 | Medium |

---

### Citation 10: Clarke v. Liberty Mut. Ins. Co.
- **Full cite**: 2019 U.S. Dist. LEXIS 21507, *16 (M.D. Pa. 2019)
- **Used for**: String cite
- **Location**: Section III.A.2 (string cite paragraph)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Dropped letter from name | **Clark v. Liberty Mut. Ins. Co., 2019 U.S. Dist. LEXIS 21507, *16 (M.D. Pa. 2019)** — "Clark" instead of "Clarke" | Hard |
| `fabricated_case` | Entirely fabricated case | **Collins v. Liberty Mut. Ins. Co., 2019 U.S. Dist. LEXIS 28914, *12 (M.D. Pa. 2019)** | Medium |

---

### Citation 11: McDonough v. State Farm Fire & Cas. Co.
- **Full cite**: 2019 U.S. Dist. LEXIS 19806, at *3 (E.D. Pa. 2019)
- **Used for**: String cite; also discussed in detail — plaintiff's conclusory statements about withheld payments were insufficient
- **Has quotation**: Yes — paraphrased allegations about "unreasonably withheld payment"
- **Location**: Section III.A.2 (string cite + detailed discussion)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `mischaracterization` | Fabricated case details | Change to: "the court dismissed the bad faith claim, noting that plaintiff had failed to allege a specific dollar amount of damages or identify the individual adjuster responsible for the denial" — adds fabricated requirements (dollar amount, named individual) that aren't in the case | Hard |
| `wrong_citation` | Wrong pinpoint page | **McDonough v. State Farm Fire & Cas. Co., 2019 U.S. Dist. LEXIS 19806, at *7 (E.D. Pa. 2019)** | Medium |
| `fabricated_case` | Wrong insurance company | **McDonough v. Allstate Fire & Cas. Co., 2019 U.S. Dist. LEXIS 19806, at *3 (E.D. Pa. 2019)** | Medium |

---

### Citation 12: Kosmalski v. Progressive Preferred Ins.
- **Full cite**: 2018 U.S. Dist. LEXIS 74124, at *1 (E.D. Pa. 2018)
- **Used for**: String cite; also quoted — "Absent additional facts regarding... the Court is unable to infer bad faith"
- **Has quotation**: Yes
- **Location**: Section III.A.2 (string cite + detailed quote later)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `misquotation` | Paraphrased instead of quoted | Change "the Court is unable to infer bad faith" to "the Court cannot conclusively determine bad faith" — similar meaning, different words | Hard |
| `wrong_citation` | Wrong pinpoint page | **Kosmalski v. Progressive Preferred Ins., 2018 U.S. Dist. LEXIS 74124, at *8 (E.D. Pa. 2018)** | Medium |
| `fabricated_case` | Misspelled party name | **Kowalski v. Progressive Preferred Ins., 2018 U.S. Dist. LEXIS 74124 (E.D. Pa. 2018)** — Kowalski instead of Kosmalski | Hard |

---

### Citation 13: Jones v. Allstate Ins. Co.
- **Full cite**: 2017 U.S. Dist. LEXIS 93673, at *1 (E.D. Pa. 2017)
- **Used for**: Detailed example — bad faith claim dismissed (disagreement over UIM value)
- **Has quotation**: No (paraphrased)
- **Location**: Section III.A.2 (detailed discussion paragraph)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `mischaracterization` | Fabricated case details | Change to: "Judge Pappert dismissed the bad faith claim, noting that the plaintiff had failed to allege that the insurer's conduct deviated from established industry claims-handling guidelines" — fabricates a requirement about "industry guidelines" not in the case | Hard |
| `mischaracterization` | Wrong topic — real case | Swap citation to **Daubert v. Merrell Dow Pharmaceuticals, Inc., 509 U.S. 579 (1993)** — keep the existing description about dismissing a bad faith claim, but Daubert is actually about expert witness admissibility standards | Medium |
| `fabricated_case` | Wrong insurer name | **Jones v. Nationwide Ins. Co., 2017 U.S. Dist. LEXIS 93673, at *1 (E.D. Pa. 2017)** | Medium |

---

### Citation 14: Mozzo v. Progressive Ins. Co.
- **Full cite**: 2015 U.S. Dist. LEXIS 159125, at *9-10 (E.D. Pa. 2015)
- **Used for**: String cite
- **Location**: Section III.A.2 (string cite paragraph)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Wrong district | **Mozzo v. Progressive Ins. Co., 2015 U.S. Dist. LEXIS 159125, at *9-10 (M.D. Pa. 2015)** | Medium |
| `fabricated_case` | Entirely fabricated case | **Moretti v. Progressive Ins. Co., 2015 U.S. Dist. LEXIS 162408, at *6 (E.D. Pa. 2015)** | Medium |

---

### Citation 15: Atiyeh v. National Fire Ins. Co. of Hartford
- **Full cite**: 742 F. Supp. 2d 591 (E.D. Pa. 2010)
- **Used for**: String cite — end of the long string cite
- **Location**: Section III.A.2 (string cite paragraph)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `wrong_citation` | Wrong year | **Atiyeh v. National Fire Ins. Co. of Hartford, 742 F. Supp. 2d 591 (E.D. Pa. 2012)** | Medium |
| `fabricated_case` | Swapped entity name | **Atiyeh v. Hartford Fire Ins. Co., 742 F. Supp. 2d 591 (E.D. Pa. 2010)** — different (but real) Hartford entity | Hard |
| `fabricated_case` | Entirely fabricated case | **Azimi v. National Fire Ins. Co. of Hartford, 748 F. Supp. 2d 612 (E.D. Pa. 2010)** | Medium |

---

### Citation 16: Pasqualino v. State Farm Mut. Auto. Ins. Co.
- **Full cite**: 2015 U.S. Dist. LEXIS 69318 (E.D. Pa. 2015)
- **Used for**: Bad faith claim dismissed
- **Location**: Section III.A.2

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Wrong district | **Pasqualino v. State Farm Mut. Auto. Ins. Co., 2015 U.S. Dist. LEXIS 69318 (M.D. Pa. 2015)** | Medium |
| `fabricated_case` | Wrong party name + LEXIS number | **Pasquarelli v. State Farm Mut. Auto. Ins. Co., 2015 U.S. Dist. LEXIS 71205 (E.D. Pa. 2015)** | Medium |

---

### Citation 17: Zaloga v. Provident Life & Accident Ins. Co. of Am.
- **Full cite**: 671 F. Supp. 2d 623 (M.D. Pa. 2009)
- **Used for**: Motion to strike — decision is in trial court's discretion; purpose is to streamline litigation
- **Location**: Section III.B.1

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `mischaracterization` | Overstated burden | Change to: "motions to strike are disfavored and should only be granted when the moving party demonstrates substantial prejudice" — makes the standard much harder | Hard |
| `wrong_citation` | Wrong district | **Zaloga v. Provident Life & Accident Ins. Co. of Am., 671 F. Supp. 2d 623 (E.D. Pa. 2009)** | Medium |
| `fabricated_case` | Fabricated party name + numbers | **Zagorski v. Provident Life & Accident Ins. Co. of Am., 674 F. Supp. 2d 718 (M.D. Pa. 2009)** | Medium |

---

### Citation 18: Lane v. McLean
- **Full cite**: 2018 U.S. Dist. LEXIS 54033 (M.D. Pa. 2018)
- **Used for**: Moving party must show allegations have no possible relation to controversy
- **Location**: Section III.B.1

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Wrong district | **Lane v. McLean, 2018 U.S. Dist. LEXIS 54033 (E.D. Pa. 2018)** | Medium |
| `fabricated_case` | Misspelled name + wrong LEXIS | **Lane v. MacLean, 2018 U.S. Dist. LEXIS 58217 (M.D. Pa. 2018)** | Medium |
| `mischaracterization` | Lowered the standard | Change to: "the moving party need only show that the challenged allegations are not directly relevant to the primary claims" — "not directly relevant" is much easier than "no possible relation" | Hard |

---

### Citation 19: Hoffer v. Grane Ins. Co.
- **Full cite**: 2014 U.S. Dist. LEXIS (M.D. Pa. 2014)
- **Used for**: Definition of "immaterial" and "impertinent" matter
- **Note**: The original brief appears to be missing the LEXIS number — this is a real error in the actual filing!
- **Location**: Section III.B.2

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `fabricated_case` | Changed defendant + added LEXIS number | **Hoffer v. Grane Healthcare Co., 2014 U.S. Dist. LEXIS 87432 (M.D. Pa. 2014)** | Medium |
| `mischaracterization` | Subtly wrong definition | Change "immaterial" definition to: "matter that is unlikely to influence the outcome of the case" — subtly different from "has no essential or important relationship to the claim for relief" | Hard |

*Instructor note: The incomplete citation (missing LEXIS number) in the original brief is itself interesting — you could point this out during debrief as a real-world citation error that tools might or might not catch.*

---

### Citation 20: Stepanovich v. State Farm
- **Full cite**: No. 1239 WDA, 2013 No. 1296 WDA 2012 (Pa. Super. October 15, 2013)
- **Used for**: UIM claim = disagreement over third-party liability and/or damages
- **Has quotation**: Yes — block quote about "the contract is not technically breached until..."
- **Location**: Section III.B.2

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `misquotation` | Added concepts not in original | Change "the contract is not technically breached until there has been a determination of liability and an award of damages in excess of the tortfeasor's liability limits" to "the contract is not breached until damages have been conclusively established through litigation or arbitration" — adds "arbitration" concept | Hard |
| `mischaracterization` | Fabricated case details | Change to: "the contract is not technically breached until there has been a determination of liability, an award of damages, and exhaustion of all available appellate remedies" — adds a fabricated "exhaustion of appeals" requirement not in the case | Hard |
| `fabricated_case` | Wrong insurer | **Stepanovich v. Nationwide Ins. Co., No. 1239 WDA 2012 (Pa. Super. October 15, 2013)** | Medium |

---

### Citation 21: Schwendinger-Roy v. State Farm Mut. Auto. Ins. Co.
- **Full cite**: No. 11-CIV-445 (W.D. Pa. July 10, 2012)
- **Used for**: Evidence of claims handling is immaterial/impertinent in UIM contract claim
- **Has quotation**: No (paraphrased)
- **Location**: Section III.B.2 (string cite + detailed discussion)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `mischaracterization` | Wrong topic — real case | Swap citation to **Exxon Shipping Co. v. Baker, 554 U.S. 471 (2008)** — keep the existing description about precluding claims-handling evidence, but this is actually a maritime punitive damages case | Medium |
| `fabricated_case` | Shortened hyphenated name | **Schwendinger v. State Farm Mut. Auto. Ins. Co., No. 11-CIV-445 (W.D. Pa. July 10, 2012)** — dropped "-Roy" | Hard |
| `wrong_citation` | Wrong district | **Schwendinger-Roy v. State Farm Mut. Auto. Ins. Co., No. 11-CIV-445 (E.D. Pa. July 10, 2012)** | Medium |

---

### Citation 22: Moninghoff v. Tillet
- **Full cite**: 2012 U.S. Dist. LEXIS 190896 (E.D. Pa. June 27, 2012)
- **Used for**: Separating UIM claims from bad faith claims — different issues involved
- **Has quotation**: Yes — "The UIM claims require determination of liability and assessment of the plaintiff's injuries. The process that the insurer went through in investigating the plaintiff's claim is not relevant to that issue..."
- **Location**: Section III.B.2 (detailed discussion with quote)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `misquotation` | Weakened absolute to qualified | Change "is not relevant to that issue" to "has only limited relevance to the UIM determination" — "not relevant" becomes "limited relevance," much weaker | Hard |
| `wrong_citation` | Wrong district | **Moninghoff v. Tillet, 2012 U.S. Dist. LEXIS 190896 (M.D. Pa. June 27, 2012)** | Medium |
| `fabricated_case` | Extra letter in name | **Moninghoff v. Tillett, 2012 U.S. Dist. LEXIS 190896 (E.D. Pa. June 27, 2012)** — double-t | Hard |

---

### Citation 23: Wagner v. State Farm Mut. Auto. Ins. Co.
- **Full cite**: 2014 U.S. Dist. LEXIS 194554 (E.D. Pa. Feb. 20, 2014)
- **Used for**: Claims handling info not relevant to breach of contract/UIM claim; court precluded deposition
- **Has quotation**: Yes — "information about claims handling is not relevant to a breach of contract claim"
- **Location**: Section III.B.2 (string cite + detailed discussion)

| Type | Label | Replacement | Difficulty |
|------|-------|-------------|------------|
| `mischaracterization` | Exaggerated holding | Change to: "the court precluded the deposition and held that in all UIM breach of contract cases, information about claims handling is per se irrelevant and may not be sought through any discovery mechanism" — overstates by adding "per se" and "all cases" and "any mechanism," far more absolute than what the court actually said | Hard |
| `misquotation` | Changed legal concept | Change "not relevant to a breach of contract claim" to "generally not admissible in a breach of contract action" — swaps "relevant" (discovery) for "admissible" (evidence), legally distinct | Hard |
| `wrong_citation` | Wrong year | **Wagner v. State Farm Mut. Auto. Ins. Co., 2014 U.S. Dist. LEXIS 194554 (E.D. Pa. Feb. 20, 2015)** | Medium |

---

## UI Design Notes

### General Aesthetic
- **Clean and minimal** — professional, not gamified/cartoon-like
- White/light gray backgrounds, dark text
- Accent color: a single muted color for interactive elements (e.g., a deep blue or teal)
- The brief should look like a real legal document — use a serif font (Georgia, Times New Roman) for the brief text
- UI chrome (buttons, sidebar, header) uses a clean sans-serif (Inter, system-ui)
- No emojis in the UI except maybe the 🟢/🔴 verdict indicators in Phase 2

### Lobby Screen
- Game code displayed large at top (for professor to project)
- List of joined students, organized by team
- Professor sees a "Start Game" button
- Students see "Waiting for professor to start..."

### Fabrication Screen (Phase 1)
- **Left panel (70%)**: The brief, rendered as clean flowing text. Citations are underlined with a subtle dotted border. Hovering highlights them. Clicking opens the right panel for that citation.
- **Right panel (30%)**: When a citation is selected:
  - Shows the citation in context (a sentence or two around it)
  - Dropdown: "Choose hallucination type" with the 4 types
  - After selecting a type, shows the pre-generated options as radio buttons with the replacement text
  - "Confirm Swap" button
  - "Cancel" button
- **Top bar**: Timer (countdown), team name, citations altered count (e.g., "4 of 23 altered — target: 6-12")
- Already-swapped citations get a subtle indicator visible only to the fabricating team (e.g., a small colored dot next to them)

### Verification Screen (Phase 2)
- **Left panel (70%)**: The altered brief. Looks identical to the original — no visual hints about what was changed. Citations are clickable.
- **Right panel (30%)**: When a citation is clicked:
  - Shows the citation text
  - Two large buttons: "Looks Legit" (green outline) and "Flag as Fake" (red outline)
  - Once decided, shows a small indicator on the citation in the brief
- **Top bar**: Timer, team name, progress (e.g., "Reviewed: 8/23, Flagged: 3")

### Scoreboard Screen (Phase 3)
- **Per-team breakdown**:
  - List of all citations
  - For each: original? altered? (if altered, what type?) Correctly identified?
  - Color-coded: green for correct calls, red for misses
- **Summary stats**:
  - Fabrication score, verification score, total
  - Breakdown by hallucination type — bar chart or simple table
- **Class-wide stats**:
  - Which hallucination type was caught most/least often
  - Most deceptive swap (specific citation that fooled the most)

### Professor Control Panel
- Visible only to the professor (separate URL or auth)
- Shows current phase, timer, all team progress
- Buttons: "Start Game," "End Fabrication / Start Swap," "Reveal Results"
- Can manually adjust timer
- Can see what each team has done (but shouldn't need to during the exercise)

---

## Implementation Priorities

Build in this order:

### MVP (must have for Wednesday)
1. **Brief display** — render the brief with clickable citations
2. **Fabrication flow** — click citation → pick type → pick option → confirm
3. **Team management** — basic join flow, team assignment
4. **Phase transitions** — professor controls to move between phases
5. **Verification flow** — click citation → flag or approve
6. **Reveal screen** — show what was real vs. fake, basic scoring
7. **Timer display** — countdown visible to students

### Nice to Have (if time permits)
8. Polished scoreboard with type-by-type breakdown
9. Progress indicators for teammates
10. Undo/change swaps during Phase 1
11. Professor dashboard showing real-time team progress
12. Animation/reveal effect when showing results

### Can Skip
- Authentication (use simple game codes)
- Persistent storage across sessions (SQLite is fine but in-memory works too)
- Mobile optimization (students will use laptops)

---

## Debrief Discussion Guide (for professor, not in the app)

After revealing results, guide discussion toward:

1. **Which hallucination types were hardest to catch?**
   - Expected: `mischaracterization` (especially exaggerated holdings) and `misquotation` are hardest; `fabricated_case` is easiest; "wrong topic" mischaracterizations fall in between
   - This maps to real-world findings — tools catch fake cases but struggle with subtle overstatements of real holdings

2. **What verification strategies did teams use during Phase 2?**
   - Did anyone use Westlaw/Lexis? CourtListener? Just gut instinct?
   - Who triaged effectively vs. tried to check everything and ran out of time?

3. **What made your team's fakes effective or ineffective?**
   - Subtle changes (one letter in a name, transposed digits) vs. wholesale fabrication
   - The most dangerous hallucinations look almost right

4. **Connection to real cases:**
   - In Mata v. Avianca, the hallucinated cases were completely fabricated — the easiest type to catch. Why weren't they caught?
   - In the Boyd case, a Yale-educated 17-year lawyer missed hallucinations. What does that tell us about the role of expertise?

5. **Connection to court standing orders:**
   - Now that you've seen how easy it is to create convincing fakes (and how hard to catch some types), do court standing orders requiring certification of AI-verified citations make sense?
   - Are standing orders enough? What else would help?

---

## Brief Text (Cleaned, for brief.json)

The full brief text has been saved to:
`Class Prep/rosario_brief_text.txt`

When building `brief.json`, the builder should:
1. Clean encoding artifacts (â€™ → ', â€œ → ", etc.)
2. Strip PACER headers and LEGAL/ footers from each page
3. Parse the text into paragraphs, preserving section structure
4. For each paragraph, identify citation spans (start/end character positions)
5. Map each citation span to a citation ID from the list above
6. Store the full paragraph text with citation positions marked

### Citation Span Format (in brief.json)
```json
{
  "paragraphs": [
    {
      "id": "para_1",
      "section": "III.A.1",
      "text": "In deciding a motion to dismiss, the court must accept all well-pleaded factual allegations as true, \"construe the complaint in the light most favorable to the plaintiff, and determine whether, under any reasonable reading of the complaint, the plaintiff may be entitled to relief.\" McTernan v. City of York, 564 F.3d 636, 646 (3d. Cir. 2009) (citations omitted).",
      "citations": [
        {
          "citation_id": "cite_01",
          "start": 247,
          "end": 320,
          "display_text": "McTernan v. City of York, 564 F.3d 636, 646 (3d. Cir. 2009)"
        }
      ]
    }
  ]
}
```

---

## Hallucination Options Data (for hallucinations.json)

Structure:
```json
{
  "cite_01": {
    "case_name": "McTernan v. City of York",
    "original_display": "McTernan v. City of York, 564 F.3d 636, 646 (3d. Cir. 2009) (citations omitted)",
    "options": {
      "fabricated_case": [
        {
          "id": "cite_01_fab_1",
          "label": "Subtle misspelling of party name",
          "replacement_citation": "McTiernan v. City of York, 564 F.3d 636, 646 (3d Cir. 2009) (citations omitted)",
          "difficulty": "hard"
        },
        {
          "id": "cite_01_fab_2",
          "label": "Completely fabricated Third Circuit case",
          "replacement_citation": "Harrington v. City of Lancaster, 578 F.3d 412, 419 (3d Cir. 2010) (citations omitted)",
          "difficulty": "medium"
        }
      ],
      "wrong_citation": [
        {
          "id": "cite_01_wc_1",
          "label": "Wrong pinpoint page (651 instead of 646)",
          "replacement_citation": "McTernan v. City of York, 564 F.3d 636, 651 (3d Cir. 2009) (citations omitted)",
          "difficulty": "medium"
        }
      ],
      "mischaracterization": [
        {
          "id": "cite_01_wh_1",
          "label": "Inverted standard — says courts need NOT accept allegations",
          "replacement_text": "...the court need not accept legal conclusions couched as factual allegations, even at the motion to dismiss stage. McTernan v. City of York, 564 F.3d 636, 646 (3d. Cir. 2009) (citations omitted).",
          "difficulty": "hard",
          "note": "This replaces the surrounding sentence, not just the citation"
        }
      ],
      "misquotation": [
        {
          "id": "cite_01_mq_1",
          "label": "Changed 'any reasonable reading' to 'the most favorable reading'",
          "replacement_text": "\"construe the complaint in the light most favorable to the plaintiff, and determine whether, under the most favorable reading of the complaint, the plaintiff may be entitled to relief.\"",
          "difficulty": "hard"
        }
      ]
    }
  }
}
```

*The full hallucinations.json should follow this pattern for all 23 citations, using the options listed in the Extracted Citations section above.*

---

## Notes for the Builder

1. **The brief PDF is saved at**: `Class Prep/rosario_brief.pdf` (for reference)
2. **The plain text is at**: `Class Prep/rosario_brief_text.txt`
3. **This is a classroom tool for one session** — don't over-engineer. Simple, working, and reliable beats polished.
4. **Test with 3-4 browser tabs** simulating different team members to verify the flow works.
5. **The professor will project her screen** showing the professor control panel, so make that view clean and easy to read from the back of the room.
6. **No authentication needed** — game codes are sufficient. This runs on a single day in a controlled classroom.
7. **Encoding**: The raw text from CourtListener has encoding issues (smart quotes rendered as â€™ etc.). Clean these during brief.json generation.
8. **Citation 19 (Hoffer)** has an incomplete LEXIS number in the original brief — this is a real error in the actual filing. Preserve it as-is; the professor may point it out during debrief.
9. **Multiple briefs**: The app supports 3+ briefs. Each team fabricates on one brief and verifies a different one (one they've never seen). Start development with the Rosario brief only — the other briefs will be added later in the same JSON format. The app should gracefully handle any number of briefs (minimum: number of teams).
10. **Adding a new brief**: To add a brief, create a `brief_[name].json` in `data/briefs/` and a matching `brief_[name].json` in `data/hallucinations/`. The app picks up new briefs automatically. The professor assigns briefs to teams during lobby setup.
