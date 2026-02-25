# Session Notes — 2026-02-24

## Self-Service Team Selection
- Added `POST /api/choose-team` endpoint so students can pick their own team from the lobby waiting screen instead of waiting for the professor to assign them
- Updated `lobby.js` `renderTeams()` to show "Join" buttons on team cards, with the current team highlighted
- Professor can still override via the existing `/api/game/assign-teams` endpoint

## Auth Credential Isolation
- Fixed a bug where testing professor and student in the same browser caused cross-contamination of session tokens
- `common.js` `API.token` no longer reads from localStorage on init (set to `null`)
- Each page now explicitly sets credentials on `DOMContentLoaded`:
  - Lobby, fabrication, verification, scoreboard read `session_token` / `game_id`
  - Professor panel reads `prof_session_token` / `prof_game_id`
- This allows testing both roles in the same browser without conflicts

## Verification View — Supra Display Fix
- Fixed `renderSidePanel()` in `verification.js` — it was showing the supra text in the review panel instead of the primary citation because the inner `break` didn't exit the outer loop
- Changed to filter for `!cite.supra` so the primary citation text always displays

## Missing Citation Tags
- Added citation entries for later appearances of Kosmalski (cite_12) and Jones v. Allstate (cite_13) that were untagged:
  - `para_jones_intro`: two `cite_13` supra entries (case name + LEXIS cite)
  - `para_kosmalski_pasqualino`: one `cite_12` supra entry
- Validator passes clean: 32 citations, 0 errors, 0 warnings

## Multi-Swap Offset Bug
- Fixed garbled text when multiple `replacement_citation` swaps hit the same paragraph (e.g., `para_string_cite` with 9 citations)
- Root cause: first-pass swaps changed text length but didn't recalculate offsets for non-swapped citations in the same paragraph
- Fix: call `_recalculate_offsets(para)` after all first-pass replacements per paragraph (game_state.py)

## Professor Review Brief — Team Selector
- Changed "Review Team Briefs" dropdown from selecting the fabricating team to selecting the reviewing team
- Added `fabrication_team` to `/api/game/status` response
- `loadTeamBrief()` now maps reviewing team -> `fabrication_team` to fetch the right brief

## Data Exports
- `hallucination_options.csv` — all 79 hallucination options, one per row (original citation, replacement, original/replacement text, category, description)
- `case_list.csv` — 83 rows (23 original, 60 altered), with reporter citation and results from multiple platform checks across 8 columns

## Session — 2026-02-25

### Citation Corrections in Game Data
- **Smith v. State Farm**: Original brief had typo "56 Fed. Appx. 133" — correct cite is **506 Fed. Appx. 133**. Fixed in brief JSON (text, offsets, display_text) and hallucination JSON (original_display, replacement citations). The wc_2 option changed from "65 Fed. Appx." to "560 Fed. Appx." (transposition of 506).
- **Mozzo v. Progressive**: Original brief had typo "LEXIS 159125" — correct cite is **LEXIS 192**. Fixed in brief JSON and hallucination JSON. The wc_1 option changed from "LEXIS 159215" to "LEXIS 129" (transposition of 192).
- Both fixes required recalculating offsets for all 9 citations in `para_string_cite`. Validation passed clean.

### Lexis vs Westlaw Analysis (scratch/lexis_vs_westlaw_analysis.md)
- Documented detailed comparison of Lexis and Westlaw brief-checking behavior against both original and altered citations
- Key finding: neither platform is designed to catch hallucinated citations — both verify that a cite points to *a* real case, but not *the claimed* case
- Lexis silently delivered wrong cases for 22 of 60 fabricated LEXIS numbers (cites-only check)
- Westlaw's mischaracterization detection is a genuine differentiator — caught 2 real issues in original brief

### Altered Citations with Propositions (scratch/altered_citations_with_propositions.md)
- Created document with 60 paragraphs embedding each altered citation in its legal proposition context
- Used to re-test Lexis and Westlaw with case names visible alongside citations

### Platform Check Results (case_list.csv — 8 columns)
Columns: Westlaw Get & Print, Lexis Brief Check (cites only), Lexis Brief Check (full brief), Westlaw Brief Check (full brief), Lexis Brief Check (altered propositions), Westlaw Brief Check (altered propositions)

**Key findings from altered-propositions checks:**
- **Lexis with context**: Transposed LEXIS numbers now returned "Unverified" instead of silently delivering wrong cases. Case names in context helped Lexis catch fabrications it missed in cites-only mode.
- **Westlaw with context**: Found several LEXIS-number cases **by case name** despite wrong LEXIS numbers (Rosenthal, Kosmalski, McDonough, Mozzo, Pasqualino, Lane) — silently resolved to correct case without flagging the wrong number.
- **Westlaw mischaracterization**: Caught 4 potential issues — 3× "for" vs "to" in Iqbal quote (real error in original brief), 1× "reckless" difference in Kosmalski quote.
- **Rivera/Reeves LEXIS 27435**: Both platforms silently delivered the real case (Reeves v. Stoddard) when given fabricated name "Rivera" — no name-mismatch flag on either platform.
- **Same-volume/different-page**: Largely invisible to both platforms. Some flagged via "closest match" or "table of cases" nearby page, but no name verification.
- **Docket-number citations**: Neither platform resolves Pa. Super. or W.D. Pa. docket numbers.

### Gemini Citation Extraction Test
- Tested Google Gemini extraction tool on original Rosario brief
- Found all 23 unique cases correctly
- One error: listed Twombly volume number (550) as a pinpoint page
- Accurately reproduced the Smith (56) and Mozzo (159125) typos from the original brief
