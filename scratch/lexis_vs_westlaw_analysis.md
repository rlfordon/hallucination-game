# Lexis vs Westlaw Citation Checking: Analysis Notes

Tested both platforms against the Rosario brief — 23 original citations and 60 altered (hallucinated) citations across multiple hallucination types.

## The Big Picture

Neither platform is designed to catch AI-generated citation hallucinations, and it shows. Both tools are built for checking the *legal treatment* of real cases (has it been overruled? distinguished?), not for verifying whether a citation actually exists or matches the case name claimed. When confronted with fabricated citations, their behavior ranges from helpful to actively misleading.

## Citation Finding: Lexis vs Westlaw

### Originals (23 real citations)

| Metric | Lexis (cites only) | Lexis (full brief) | Westlaw (full brief) |
|--------|-------------------|--------------------|--------------------|
| Found correctly | 17 | 17 | 13 |
| Found wrong case | 2 | 2 | 1 |
| Not found | 3 | 3 | 7 + 2 citation issues |

Lexis found more of the obscure district court cases, especially the LEXIS-number citations (Moran, Clarke, Kiessling, etc.) that Westlaw couldn't resolve. This makes sense — Lexis can resolve its own LEXIS citation numbers natively.

Both platforms agree that **56 Fed. Appx. 133** resolves to **United States v. Lutz** (4th Cir. 2003), not "Smith v. State Farm" as cited in the original brief. This is likely an error in the original brief itself, or possibly a case where two opinions share the same starting page in the Federal Appendix.

For **LEXIS 159125**, the platforms diverge: Lexis found **Soldrich v. State Farm**, while Westlaw found **Mozzo v. Progressive** (the correct case per the brief). This suggests the LEXIS number may have been reassigned or there's a database discrepancy between platforms.

### Altered Citations — Lexis "Cites Only" Check (60 hallucinated citations)

This was the most revealing test. Lexis was given all 60 altered citations as a standalone list. Results:

| Outcome | Count | Concern Level |
|---------|-------|--------------|
| Flagged as "closest match" | 14 | Low — Lexis caught these |
| Flagged as "LEXIS link only" | 5 | Low — flagged but minimal info |
| Delivered wrong case silently | 22 | **HIGH — no flag despite mismatch** |
| Found correct case (real altered cites) | 3 | N/A (Daubert, Exxon, Reeves are real) |
| Not separately flagged (same vol) | 7 | Medium — hidden by deduplication |
| Not in report | 4 | Low — docket-number citations ignored |
| Delivered nearby page silently | 2 | Medium — wrong page, no flag |

**The most dangerous outcome: 22 citations where Lexis silently delivered a completely unrelated case.** For fabricated LEXIS numbers, Lexis found whatever real case happened to exist at that number and presented it as if it were the cited authority — with no warning that the case name doesn't match. Three of these even received **Positive** signals (Jefferson v. Hudgens, United States v. Hatfield, United States v. Condon), meaning Lexis was actively reassuring the user about a nonexistent citation.

The "closest match" flagging worked reasonably well for reporter-based citations with wrong volume numbers (e.g., 552 U.S. → Medellin instead of Twombly). But for LEXIS-number citations, the system largely failed to flag mismatches.

## Quote Checking

### Lexis Quote Check (full brief, 11 quotes)

- 2 correct, 9 incorrect
- Most "incorrect" results were "Cited document not found" — Lexis couldn't retrieve the full text of the LEXIS-number district court cases to verify quotes
- Flagged Kosmalski pinpoint page as incorrect
- Did NOT catch any mischaracterization

### Westlaw Quotation Analysis (full brief, 12 quotes)

- 8 matched, 4 unmatched
- **2 flagged as "Potential Mischaracterization"** — this is the standout finding:
  - **Johnson v. Progressive**: Brief says "UIM claim" but source says "UM claim" (changes the type of insurance entirely), and omits "even though the award is substantially below the insured's demand" (removes important qualifying context)
  - **Kiessling**: Brief selectively quotes, omitting "presented a low offer of settlement," "failed to engage in good faith negotiations," and "presented an offer of less than the amount due in an attempt to compel him to institute litigation"
- 4 unmatched quotes were from cases Westlaw couldn't find (3 from Kiessling, 1 from Schwendinger-Roy)

**Westlaw's mischaracterization detection is a genuine differentiator.** It does side-by-side comparison of the quoted text against the source document and highlights omissions and word changes that could alter meaning. Lexis has nothing comparable — its quote check is binary (found/not found) with no semantic analysis.

## Key Takeaways for the Hallucination Game

### What the tools catch well
- **Reporter-based citations with wrong volumes**: Both platforms flag these when the volume doesn't contain the claimed case (Lexis via "closest match," Westlaw via citation issues)
- **Case name mismatches at known reporters**: Both flagged Smith/Lutz at 56 Fed. Appx. 133
- **Quote mischaracterization** (Westlaw only): Genuine semantic analysis of whether quotes are faithful to the source

### What the tools miss badly
- **Fabricated LEXIS numbers with wrong case names**: Lexis silently delivers whatever case lives at that number. No case-name verification at all. This is the biggest gap.
- **Same-volume/different-page alterations**: Citations like "860 A.2d 439" (altered from 493) resolve to the same case and are invisible to both platforms
- **Same-LEXIS-number/different-pinpoint alterations**: "LEXIS 19806 at *7" vs "at *3" — both resolve to the same document
- **Docket-number-only citations**: Neither platform resolves Pa. Super. docket numbers or W.D. Pa. civil action numbers

### Implications for teaching

1. **Students cannot rely on Lexis/Westlaw to catch hallucinated citations.** The tools were designed for a different purpose (treatment analysis), and their citation-finding behavior can be actively misleading when citations are fabricated.

2. **The most dangerous hallucinations are LEXIS-number fabrications** — they look authoritative (specific LEXIS number, specific court, specific date) and Lexis will confidently deliver an unrelated real case at that number without any warning.

3. **Westlaw's mischaracterization detection is the one feature that directly addresses a hallucination type** (misquotation/mischaracterization). It's imperfect — it can only check quotes against cases it can find — but when it works, it provides genuinely useful semantic comparison.

4. **The "same volume, different page" hallucination type is essentially invisible to automated tools.** This is the subtlest hallucination type and requires actual legal knowledge to catch (knowing that Iqbal is at 556 U.S. 662, not 686).

### Platform comparison summary

| Capability | Lexis | Westlaw |
|-----------|-------|---------|
| Finding obscure LEXIS-number cases | Better (found 20/23) | Worse (found 15/23) |
| Flagging wrong-volume citations | Good ("closest match") | Good (citation issues) |
| Flagging wrong case names at LEXIS numbers | **Fails silently** | N/A (doesn't resolve most LEXIS#s) |
| Quote verification | Basic (found/not found) | **Much better** (semantic comparison) |
| Mischaracterization detection | None | **Yes — caught 2** |
| Overall hallucination detection | Poor | Poor, but better quote analysis |

Both platforms have a fundamental architectural gap: they verify that a citation points to *a* real case, but they don't verify that the citation points to *the claimed* case. Until that changes, citation hallucination detection will remain primarily a human skill.
