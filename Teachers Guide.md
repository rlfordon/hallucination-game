# Citation Hallucination Game — Teacher's Guide

*A competitive classroom exercise for teaching AI hallucination detection in legal practice*

**Author**: Rebecca Fordon, Ohio State Moritz College of Law
**First run**: February 25, 2026 (21st Century Lawyering, Spring 2026)
**Game repository**: [github.com/rlfordon/hallucination-game](https://github.com/rlfordon/hallucination-game)

---

## 1. Overview & Why This Game

The Citation Hallucination Game is a web-based exercise where law students, working in teams, plant fake citations in a real legal brief and then try to catch another team's fakes under time pressure. It runs in a browser — no downloads, no accounts, no setup beyond sharing a URL and game code.

The core pedagogical insight: students learn the hallucination taxonomy by *creating* fakes, not just identifying pre-planted ones. When you ask a student to choose between fabricating a case, swapping a citation number, mischaracterizing a holding, or subtly altering a quote, they have to understand what each type *is* and reason about what makes one harder to detect than another. They're doing Bloom's taxonomy in reverse — evaluating difficulty before they've even started verifying.

The time pressure is the other critical element. Students can't check all 23 citations in 20 minutes — they have to triage. That's exactly the position lawyers are in when reviewing AI-generated work under deadline. The question stops being "can you catch every error?" and becomes "given limited time, which errors do you prioritize?"

**Results from the first run** (February 25, 2026, 11 students, 3 teams):

- Students caught **100%** of fabricated cases — the "easy" hallucination type
- Students caught roughly **50%** of mischaracterizations and misquotations — the "hard" types
- That gap *is* the lesson: existing tools solve the easy end of the spectrum; human judgment is still essential for the hard end

---

## 2. Learning Objectives

The game maps to four learning objectives that follow a Bloom's taxonomy progression:

| Level | Objective | How the Game Addresses It |
|-------|-----------|--------------------------|
| **Understanding** | Explain technical and contextual reasons why LLMs hallucinate | Pre-class readings build the knowledge base; the four hallucination types in the game map to real failure patterns |
| **Analyzing** | Analyze hallucination case studies to identify failures and consequences | Fabrication phase forces students to categorize hallucination types and reason about which are hardest to detect |
| **Applying** | Demonstrate use of cite-checking tools to verify AI-generated legal content | Verification phase requires hands-on use of CourtListener, Westlaw, Lexis, and other tools under time pressure |
| **Evaluating** | Evaluate court standing orders on AI use and justify their requirements | Post-game debrief connects the experience to court requirements — "Do these orders address the types you missed?" |

The game doesn't address all four objectives on its own. The first objective relies on pre-class readings, and the fourth benefits from a post-game discussion segment on court standing orders. The game is the centerpiece, but it works best within a full class session.

---

## 3. Before Class: What Students Need

### Prior Knowledge

Students should come to class understanding:

- **Why LLMs hallucinate** — at a conceptual level, not a technical deep dive. They should know that hallucinations aren't random glitches but follow predictable patterns (knowledge cutoffs, sycophancy, task complexity, etc.).
- **What has actually happened** when lawyers relied on AI-hallucinated citations. Real cases ground the exercise — without them, the game feels like a puzzle rather than professional preparation.

### Suggested Readings (~35–40 minutes total)

These are the readings assigned for the first run. Adapt to your course:

- **Rebecca Fordon — ["What the Science Says About AI Hallucinations in Legal Research"](https://www.ailawlibrarians.com/2026/02/19/what-the-science-says-about-hallucinations-in-legal-research/)** (~12 min) — Six practical patterns for when and why LLMs hallucinate
- **Declaration of Celeste H.G. Boyd — [*N.Z. v. Fenix International Limited*](https://www.courtlistener.com/docket/68990373/176/2/nz-v-fenix-international-limited/) (C.D. Cal. 2025)** (~15 min) — Sworn declaration reconstructing how AI-hallucinated citations ended up in filed briefs
- **Jason Koebler & Jules Roscoe — ["18 Lawyers Caught Using AI Explain Why They Did It"](https://www.404media.co/18-lawyers-caught-using-ai-explain-why-they-did-it/) (404 Media, Sept 2025)** (~10 min) — Investigative journalism; 90% of sanctioned lawyers were solo/small firm

If you substitute your own readings, make sure students arrive understanding (a) why hallucinations happen, (b) what they look like in real cases, and (c) who is most at risk and why. The game assumes this baseline.

### Tool Access

Students need access to at least some verification tools during the game. Here's what we used:

| Tool | Access | Notes |
|------|--------|-------|
| **CaseStrainer** | Free, no account needed | Citation verification tool from UW Law. [wolf.law.uw.edu/casestrainer](https://wolf.law.uw.edu/casestrainer/) |
| **CourtListener** | Free, no account needed | Good for checking if a case exists. [courtlistener.com](https://www.courtlistener.com) |
| **IsThisCaseReal.com** | Free, no account needed | Quick case existence check. [isthiscasereal.com](https://isthiscasereal.com) |
| **Westlaw** | Institutional (law school) | Full citation verification, KeyCite, reading opinions. The Litigation Document Analyzer feature can process an entire brief but takes ~10+ minutes. |
| **Lexis** | Institutional (law school) | Shepard's verification, reading opinions |
| **Citation Extractor Gem** | Free (Google Gemini) | Extracts all citations from a brief into a table for batch checking |

At minimum, students need CaseStrainer, CourtListener, or IsThisCaseReal (all free) plus Westlaw or Lexis (institutional). The free tools catch fabricated cases; the research platforms are needed for the harder types.

### Optional: Solitaire Mode for Pre-Class Practice

The game has a **solitaire mode** where students practice individually — no game code, no teams, no timer. The system auto-generates hallucinations and students verify at their own pace. Access it from the landing page by clicking "Solo Practice."

Solitaire mode is useful as:

- **Pre-class homework**: "Before class, play one round in solitaire mode so you understand the interface and the hallucination types. Come to class ready to play competitively." This eliminates the 5 minutes you'd otherwise spend explaining the UI.
- **Post-class reinforcement**: Students who want more practice can replay on their own.
- **Asynchronous alternative**: If you can't dedicate a full class session, solitaire mode lets students experience the verification challenge individually, though they'll miss the fabrication phase and the team dynamics.

Solitaire mode skips fabrication entirely — students only verify. The pedagogical tradeoff is real: students don't get the taxonomy-learning that comes from choosing hallucination types. For the full learning arc, use the team game in class.

---

## 4. Running the Game: Step by Step

### Setup (~5 minutes)

1. **Before class**: Test the app yourself. Create a test session, join from a second browser tab, run through the full game loop (fabrication → verification → reveal). Test with multiple browsers, not just multiple tabs in the same browser.

2. **In class**: Navigate to the game URL and click **Create Session**. The app generates a game code.

3. **Share the code**: Display it on the projector. Students go to the game URL and enter the code plus their name.

4. **Assign teams**: The professor assigns teams (or lets students pick from available teams). Aim for 3–4 teams of 3–4 students each. The game works best with at least 3 teams so verification feels like a genuine puzzle — you're reviewing a brief altered by a team you weren't on.

5. **Brief assignment**: If running with multiple briefs, each team gets a different brief for fabrication and verifies a brief they haven't seen. If running with a single brief (current configuration), all teams fabricate and verify the same brief — acknowledge this to students and lean into harder hallucination types.

6. **Click "Start Game"** to begin Phase 1.

### Phase 1: Fabrication ("Be the AI") — ~20 minutes

**What to tell students:**

- "Your team has a real legal brief with 23 citations. Your job: alter 6 to 12 of them to introduce hallucinations — just like an AI might."
- "Click any citation to open the editing panel. Choose a hallucination type, pick from the pre-generated options, and click Confirm Swap."
- "You can undo or change your swaps until time runs out."
- "A mix of easy and hard hallucinations is more strategic than all one type. Easy fakes can serve as decoys while the hard ones slip through."
- "This is collaborative — all team members can work on the brief at the same time from your own devices. **Reload the page** to see what your teammates have entered. Divide up the citations so you're not working on the same ones — one person can override another's swap if they're not coordinating."

**What to watch for:**

- **Teams finishing too fast**: If a team burns through their swaps in 5 minutes, they probably picked all easy types. Nudge them toward mischaracterizations and misquotations — "Think about what would be hardest to catch. That's where the points are."
- **Teams stuck on what to pick**: The pre-generated options do the heavy lifting. Students don't write their own fakes — they choose from curated options. If a team seems paralyzed, remind them there's no wrong answer and they can change swaps until the timer ends.
- **Teammates overwriting each other**: The app uses last-write-wins — if two students swap the same citation, the second one sticks. Tell teams to divide up citations ("each person take a section") and communicate about who's working on what.

**Tip**: Walk the room during fabrication. It's the most social phase — teams are debating strategy, laughing at the options, learning the taxonomy by arguing about difficulty. That conversation *is* the learning.

**Short on time?** The professor dashboard has a **Skip Fabrication** button that auto-generates random swaps for all teams and jumps straight to verification. This saves 15–20 minutes but sacrifices the fabrication phase's taxonomy learning. Consider this for the compact timing option or for a second run where students already understand the hallucination types.

### Phase 2: Verification ("Catch the Fakes") — ~20–25 minutes

> **Important timing note**: The first run used 15 minutes for verification — it wasn't enough. Students felt unable to attempt the harder hallucination types, and the Westlaw Litigation Document Analyzer didn't finish processing in time. **Use 20–25 minutes.** The time pressure lesson still lands — they still can't verify everything — but they need enough breathing room to at least *attempt* mischaracterizations and see their tool results come back.

**What to tell students:**

- "You're now reviewing a brief that another team altered. It looks like a normal brief — there are no visual hints about what was changed."
- "Click any citation to review it. Mark it as 'Looks Legit' or 'Flag as Fake.' You can also skip citations you don't get to."
- "You won't have time to check all 23 citations manually. Triage is part of the exercise — decide what to check first and which tools to use."
- "False accusations cost you a point, so don't flag everything. Be confident before you flag."

**Tools to point students toward:**

- **Immediate**: Submit the full brief text to Westlaw's Litigation Document Analyzer right away — it takes 10-15 minutes to return results. Do this first, then use other tools while you wait.
- **Fast checks**: CaseStrainer, CourtListener, and IsThisCaseReal for citation verification. Takes seconds per citation.
- **Deep checks**: Pull up specific cases on Westlaw or Lexis. Read the actual holding. Compare quoted text to the source. This is how you catch mischaracterizations and misquotations.

**The triage lesson**: Students will naturally gravitate toward the fastest tools first. That's correct — it mirrors real practice. The insight comes when they realize the fast tools only catch the easy hallucination types. For the hard types, you have to read the case. That takes time they may not have.

### Phase 3: Reveal & Debrief — ~10 minutes

**Click "Reveal Results"** on the professor control panel. The app shows:

- Each citation's true status (original vs. altered)
- For altered citations: the hallucination type used
- Whether the verifying team correctly identified it
- A scoreboard with fabrication points, verification points, and combined totals
- Breakdown by hallucination type — which types were hardest to catch

**Download Report**: After revealing results, click **Download Report** on the scoreboard page to save a self-contained HTML file with all scores, detail tables, detection rate breakdowns, and annotated briefs showing every hallucination. The file opens in any browser and prints cleanly to PDF. Useful for your records, sharing with absent students, or attaching to the reflection assignment so students can reference specific results.

**Discussion flow:**

1. **Start with the scoreboard**: Celebrate the winning team, then pivot immediately to the type breakdown. "Which types did you catch? Which slipped through?"

2. **Draw out the pattern**: Fabricated cases caught at high rates; mischaracterizations and misquotations caught at much lower rates. "Why is that? What tools did you use for the easy ones? What would you have needed for the hard ones?"

3. **Connect to the difficulty spectrum**: "The gap between 'does this case exist?' and 'does this case say what the brief claims?' is where AI verification tools run out and human judgment begins. That gap is where the most dangerous hallucinations live."

4. **The honest question**: "How many of you, if you were under a filing deadline and exhausted, would have stopped after the existence check and called it good enough?" 

---

## 5. The Four Hallucination Types

| Type | Difficulty | What It Tests | What Catches It | Real-World Example |
|------|-----------|--------------|----------------|-------------------|
| **Fabricated Case** | Easy | Can you verify that a case exists? | CaseStrainer, CourtListener, IsThisCaseReal, Westlaw/Lexis — the case simply won't be in any database | *Mata v. Avianca* (S.D.N.Y. 2023) — ChatGPT generated six entirely fictitious cases with fabricated citations |
| **Wrong Citation** | Medium | Can you verify citation details (volume, page, reporter, year, court)? | Westlaw/Lexis KeyCite/Shepard's — the correct case exists but the citation details don't match | Boyd Declaration — citation formats silently corrupted across editing rounds with ChatGPT |
| **Mischaracterization** | Hard | Can you verify that a case actually supports the proposition attributed to it? | **Human review needed** — you must read the actual opinion and compare it to the brief's characterization | *Flycatcher Corp. v. Affable Avenue* (S.D.N.Y. 2026) — default judgment entered where AI-cited cases existed but didn't support the claimed propositions |
| **Misquotation** | Hard | Can you verify that a direct quote actually appears in the source? | **Human review needed** — you must find the passage in the opinion and compare it word-for-word | Boyd Declaration Appendix A — real cases attributed with fabricated quotes; words subtly added, removed, or changed |

**Why the difficulty spectrum matters**: Existing tools reliably solve the left side of the spectrum (existence, citation accuracy). The right side (does the case say what the brief claims? is the quote exact?) still requires a human reading the opinion. Court standing orders that only require certification that "all citations are real" address the easy problem. The game makes students experience the hard problem firsthand.

---

## 6. Debrief Discussion Guide

The debrief is where the game experience becomes transferable knowledge. These questions work whether you have 10 minutes or 30.

### Tier 1: Start Here (5–10 minutes)

- **"Which hallucination types did you catch? Which slipped through? Why?"** This is the central question. Let students name the pattern before you label it. They'll say something like "we caught the fake cases but missed the ones where the case was real but said the wrong thing" — that's the existence/accuracy gap in their own words.

- **"What was your verification strategy? What did you check first, and why?"** Surfaces the triage decisions they made. Did they start with the fastest tool? The most suspicious-looking citation? Random order? Connect their strategies to real practice: "When you're reviewing an AI-drafted memo at 11 PM before a filing deadline, this is exactly the calculation you'll make."

### Tier 2: Connecting to Cases (~5 minutes)

- **"How does your experience compare to what happened in the Boyd declaration?"** Boyd had verification protocols — she just didn't follow them under stress. Students just experienced the time pressure that makes verification break down. This is where empathy replaces judgment.

- **"The 404 Media piece found that 90% of sanctioned lawyers were solo or small-firm practitioners. After playing this game, does that statistic surprise you? Why or why not?"** Connects the systemic factors (no colleagues to check your work, no firm-wide quality control) to what students experienced.

### Tier 3: Looking Forward (~5–10 minutes)

- **"After today, what's your non-negotiable verification minimum — the one thing you'll always do, even on a bad week?"** This is the "Bad Week Failsafe" question. Push students toward something concrete and sustainable: "I will always run a case existence check." "I will always read the actual opinion for the three most important citations." The point is not perfection; it's a floor.

- **Court standing orders** (if you have time for a full segment): "Do the court orders you've seen address the types of hallucinations you missed today? Or do they mostly focus on the easy types?" Most standing orders require disclosure and certification that citations are real — they don't address mischaracterizations or misquotations. The game gives students firsthand evidence for why orders that stop at "certify your citations exist" aren't enough.

---

## 7. Timing Options

| Segment | Compact (50 min) | Standard (75 min) | Extended (85 min) |
|---------|:-:|:-:|:-:|
| Opening discussion | — | — | 15 min |
| Setup & instructions | 5 min | 5 min | 5 min |
| Phase 1: Fabrication | 15 min | 20 min | 20 min |
| Phase 2: Verification | 15 min | 20–25 min | 20–25 min |
| Phase 3: Reveal | 5 min | 5 min | 5 min |
| Debrief / standing orders | 10 min | 20 min | 15–20 min |

**Compact** works when the game supplements other activities, but students may not have time to attempt the harder hallucination types. If you're truly squeezed, use **Skip Fabrication** (auto-generates swaps) to reclaim 15 minutes — though you'll lose the taxonomy learning from the fabrication phase. **Standard** (recommended) gives enough time for the full tool workflow including Westlaw Litigation Document Analyzer results. **Extended** adds an opening discussion of readings before the game and a fuller standing orders segment after.

---

## 8. Tips & Lessons Learned

These are from the February 25, 2026 first run. I'll update as I run the game again.

### What Worked

- **Students loved the competitive element.** The scoring system created genuine investment in both phases. Teams strategized about difficulty mix during fabrication and argued about triage priorities during verification.
- **The fabrication phase taught the taxonomy.** Students debated the differences between hallucination types while choosing their swaps. "Is a wrong page number harder to catch than a wrong year?" — that's exactly the analysis I wanted them to do, and it happened organically.
- **The results data drove the debrief.** Having concrete numbers (100% catch rate on fabricated cases, ~50% on mischaracterizations) was far more compelling than lecturing about the difficulty spectrum. Students could see their own blind spots.
- **Concurrent team collaboration.** Each student joined individually on their own device and could make swaps simultaneously. Teams naturally divided up the citations.

### What to Watch For

- **Verification needs 20+ minutes.** 15 minutes was too tight. Students couldn't attempt the harder hallucination types and didn't get to see their Westlaw Litigation Document Analyzer results (it takes ~10 minutes to process a full brief). 20–25 minutes preserves the time pressure lesson while giving students breathing room for the hard types.

- **Test the app before class — seriously.** Run through the full game loop with multiple browsers (not just multiple tabs). The first run had bugs that surfaced during class. This is a recurring pattern with custom-built exercises: they're pedagogically ambitious but ship with rough edges. Budget time for testing.

- **Students will catch fabricated cases easily — that's the point, not a failure.** If your students catch every fabrication, the game is working. The lesson is in the *gap* between that success and their failure to catch mischaracterizations. Don't be demoralized by a lopsided scoreboard; use it.

- **Single-brief mode has a familiarity advantage.** If all teams work with the same brief, students will have some familiarity with the citations when they move to verification. This makes verification easier than intended. Mitigations: (a) tell students upfront, (b) encourage harder hallucination types during fabrication, (c) name the limitation during debrief. Running with different briefs per team is the ideal design.

- **Westlaw Litigation Document Analyzer is slow but valuable.** The best workflow: submit the brief immediately at the start of verification, use faster tools while waiting, Westlaw results arrive near the end as a "check your work" moment. This actually mirrors real practice — kick off the thorough automated check AND do manual spot-checking in parallel.

- **The -1 penalty for false accusations matters.** It prevents teams from flagging everything. Without it, the optimal strategy is to flag all 23 citations. The penalty forces students to be confident before flagging — which is the verification lesson.

---

## 9. Customization & the Repository

The game is open-source and designed to be customizable. The repository is at [github.com/rlfordon/hallucination-game](https://github.com/rlfordon/hallucination-game).

### Adding Your Own Briefs

Each brief is stored as a JSON file with two components:

1. **Brief data** (`data/briefs/brief_[name].json`): The brief text broken into sections, with each citation parsed and identified — case name, full citation, the proposition it supports, surrounding context, and whether it contains a direct quotation.

2. **Hallucination options** (`data/hallucinations/brief_[name].json`): Pre-generated fake options for each citation, organized by hallucination type. Each option has a label (what the student sees in the UI) and a replacement (what gets swapped into the brief text).

**Good briefs for this exercise** have:

- 15–25 citations (fewer feels sparse; more overwhelms the verification phase)
- A mix of frequently cited cases (Iqbal, Twombly) and less well-known ones
- Some direct quotations (needed for the misquotation type)
- Accessible legal concepts — ideally 1L-level so you're testing verification skills, not substantive knowledge
- Real briefs from PACER or CourtListener, not AI-generated ones

The first brief (*Rosario v. Liberty Mutual*, E.D. Pa., motion to dismiss) worked well because 12(b)(6) motions and Iqbal/Twombly pleading standards are familiar from Civil Procedure.

---

## 10. Assessment

### Reflection Questions

The first run used a two-question reflection submitted the day after class:

> 1. **The verification experience.** What surprised you about trying to catch citation errors under time pressure? After doing it yourself, what's your honest assessment — is thorough verification of AI-generated legal content realistic in everyday practice?
>
> 2. **The exercise itself.** What was the most useful thing the Citation Hallucination Game made you do or think about? If you were redesigning it, what's one thing you would change or add?

**A note on question design**: These two questions intentionally separate the substantive learning reflection (question 1) from the pedagogical feedback (question 2). This avoids students conflating "I learned a lot" with "I liked the exercise" — both are useful data, but for different purposes. Responses to question 2 will help you iterate on the exercise; responses to question 1 tell you whether the learning objectives landed.

### Other Assessment Options

- **Standing orders analysis**: After the game, assign 2–3 court standing orders on AI use. Ask students to evaluate whether the orders address the hallucination types they experienced. This extends the fourth learning objective (Evaluating) beyond the class session.
- **Verification protocol design**: Ask students to design their own "Bad Week Failsafe" — a non-negotiable minimum verification workflow that could survive their worst day. Connects directly to the Boyd declaration and the game's time pressure lesson.
- **No formal grading needed**: The game works well as a participation exercise. The reflection is enough to capture learning. Grading the game scores would incentivize gaming the game rather than learning from it.

---

*This guide was written after the first run of the game. It's honest about what went wrong (bugs, timing) because that's more useful than a polished sales pitch. If you run the game and learn something I didn't, I'd love to hear about it — fordon.4@osu.edu.*
