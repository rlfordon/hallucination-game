# Citation Hallucination Game

Flask-based classroom game where law students detect AI-generated citation hallucinations in legal briefs.

## Running

```bash
python3 app.py
```

Runs on **port 5001** (`http://localhost:5001`). Port 5000 is reserved by AirPlay Receiver on macOS.

## Architecture

- **Backend**: Flask (app.py), SQLite (database.py), game logic (game_state.py)
- **Frontend**: Vanilla JS, served from `static/js/` and `templates/`
- **Shared JS**: `static/js/common.js` — API client, `escapeHtml()`, `Timer`. Loaded by all pages. `API.token` inits as `null`; each page sets credentials in its own `DOMContentLoaded` handler (student pages use `session_token`, professor uses `prof_session_token`).
- **Data**: JSON files in `data/briefs/` and `data/hallucinations/`

## Brief Data Model (`data/briefs/<brief_id>.json`)

Top-level fields: `brief_id`, `title`, `case_name`, `court`, `docket`, `paragraphs[]`

### Paragraph structure

| Field       | Type     | Description                                                      |
|-------------|----------|------------------------------------------------------------------|
| `id`        | string   | Unique ID, e.g. `para_facts_1`                                  |
| `section`   | string   | Section heading, e.g. `"III.A.2"`                                |
| `type`      | string   | One of: `body`, `heading`, `block_quote`, `footnote`, `caption`, `signature` |
| `text`      | string   | Full paragraph text                                              |
| `citations` | array    | Citation entries (may be empty)                                  |

### Citation entry

| Field          | Type    | Description                                                    |
|----------------|---------|----------------------------------------------------------------|
| `citation_id`  | string  | e.g. `cite_01`. Shared between primary and supra references.   |
| `start`        | int     | Start byte offset in `text`                                    |
| `end`          | int     | End byte offset in `text`                                      |
| `display_text` | string  | The citation text at `text[start:end]`                         |
| `supra`        | bool    | Optional. `true` for supra references.                         |

### Supra references

When a case is introduced as a full citation (the **primary**), later references like "Ashcroft, supra" or "McDonough v. State Farm Fire & Cas. Co., supra" are **supra references**. They:

- Use the **same `citation_id`** as the primary citation
- Must have `"supra": true`
- Must be added as citation entries in the paragraph where the supra text appears
- Are easy to miss when parsing a new brief — always scan for `, supra` patterns

### Naming conventions

- Paragraph IDs: `para_<section>_<n>` (e.g. `para_sor_1`, `para_footnote2`)
- Citation IDs: `cite_NN` (zero-padded two digits, e.g. `cite_01`, `cite_23`)
- Option IDs: `cite_NN_<type>_N` where type is `fab`, `wc`, `mc`, or `mq`

## Hallucination Data Model (`data/hallucinations/<brief_id>.json`)

Keyed by `citation_id`. Each entry:

| Field              | Type   | Description                                      |
|--------------------|--------|--------------------------------------------------|
| `case_name`        | string | Case name for this citation                      |
| `original_display` | string | The original citation display text                |
| `options`          | object | Dict with keys: `fabricated_case`, `wrong_citation`, `mischaracterization`, `misquotation` |

### Hallucination types and swap mechanisms

| Type                 | Abbrev | Mechanism                                        |
|----------------------|--------|--------------------------------------------------|
| `fabricated_case`    | `fab`  | `replacement_citation` — replaces citation text  |
| `wrong_citation`     | `wc`   | `replacement_citation` — replaces citation text  |
| `mischaracterization`| `mc`   | `original_text` + `replacement_text` — replaces prose |
| `misquotation`       | `mq`   | `original_text` + `replacement_text` — replaces prose |

**Important**: `replacement_citation` is only applied to primary citations, NOT supra references. `original_text`/`replacement_text` searches **all paragraphs** — the target text is often in a block_quote or a different paragraph from the citation.

### Option fields

| Field                 | Type   | Used by   | Description                          |
|-----------------------|--------|-----------|--------------------------------------|
| `id`                  | string | all       | e.g. `cite_01_fab_1`                |
| `label`               | string | all       | Human-readable description           |
| `difficulty`          | string | all       | `easy`, `medium`, or `hard`          |
| `replacement_citation`| string | fab, wc   | New citation text to swap in         |
| `replacement_citation`| string | mc (rare) | Some mc options use wrong-topic swap |
| `original_text`       | string | mc, mq    | Text to find in brief paragraphs     |
| `replacement_text`    | string | mc, mq    | Text to replace it with              |

## Known Pitfalls

- **Citation offsets are exact byte positions** in the paragraph `text` field. Unicode smart quotes (`\u201c`, `\u201d`, `\u2019`) are multi-byte in JSON source but single characters in Python strings. Always verify `text[start:end] == display_text`.

- **`original_text` is frequently NOT in the same paragraph as the citation.** Many mischaracterization/misquotation targets are in adjacent block_quote paragraphs or in paragraphs discussing the case via supra. Always run the validation script after generating data.

- **Supra references are easy to miss** when parsing a new brief. Scan for `, supra` patterns and ensure each one has a citation entry with `"supra": true` and a matching `citation_id`.

- **Some `mischaracterization` options use `replacement_citation`** instead of `original_text`/`replacement_text` (wrong-topic swaps). These behave like fabricated_case/wrong_citation mechanically.

## Adding a New Brief

There is no generic parser. `scripts/parse_brief.py` is entirely hand-coded for the Rosario brief — every paragraph is manually constructed in Python with `t.index(cite_text)` to compute offsets. Supra citations were added manually to the output JSON after initial parsing. Plan for the same manual approach on future briefs.

### Workflow

1. **Obtain source text.** Export the brief from PACER as PDF, then extract text (e.g. `pdftotext -layout`). Save as `<case>_brief_text.txt`.

2. **Structure paragraphs.** Write a parse script (or new section in `parse_brief.py`) that:
   - Fixes encoding artifacts (smart quotes, pilcrows — see `fix_encoding()`)
   - Strips PACER headers/footers and page numbers
   - Splits into paragraphs with `id`, `section`, `type`, `text`, empty `citations`
   - Assigns paragraph types: `heading`, `body`, `block_quote`, `footnote`, `caption`, `signature`
   - Use Python `t.index(cite_text)` to compute `start`/`end` offsets for each citation — this is more reliable than regex for exact positions

3. **Add primary citations.** For each case citation in the text:
   - Assign a `citation_id` (`cite_01`, `cite_02`, etc.) in order of first appearance
   - Compute `start`/`end` offsets using `text.index(display_text)`
   - Add to the paragraph's `citations` array

4. **Add supra references.** Search all paragraph text for `, supra` patterns. For each:
   - Identify which primary `citation_id` it refers to
   - Add a citation entry with `"supra": true` and the same `citation_id`
   - Compute offsets for the supra display text (e.g. `"Ashcroft, supra"`)

5. **Write the brief JSON** to `data/briefs/brief_<id>.json`.

6. **Create hallucination options.** Write `data/hallucinations/brief_<id>.json`:
   - One entry per primary citation (keyed by `citation_id`)
   - Include `case_name`, `original_display`, and `options` with all four types
   - For `original_text` fields: the target text may be in a block_quote or discussion paragraph, NOT the paragraph containing the citation. Search the whole brief to find the right snippet.
   - Aim for 2-4 options per citation, balanced across difficulty levels

7. **Validate.** Run `python3 scripts/validate_brief.py brief_<id>` and fix all errors. Pay special attention to:
   - Offset mismatches (off-by-one from smart quotes or whitespace)
   - Missing supra references (the validator's supra detection will WARN about these)
   - `original_text` not found in any paragraph (copy-paste errors, whitespace differences)

### Common mistakes

- **Off-by-one offsets from smart quotes**: `"` is one Python character but multiple bytes in the JSON source. Use `t.index()` in Python, not manual counting.
- **Forgetting supra entries**: The parse script for Rosario originally missed all 6 supra references. They had to be added retroactively.
- **`original_text` in wrong paragraph**: 11 of the Rosario hallucination options target text in a different paragraph than the citation. This is correct and expected — the validator reports these as INFO, not errors.
- **Footnotes spanning pages**: PACER page breaks can split footnotes. Reconstruct the full footnote text before parsing.

## Validation

Always run after creating or modifying brief/hallucination data:

```bash
python3 scripts/validate_brief.py <brief_id>
```

Defaults to `brief_rosario` if no argument given. Exit code 0 = clean, 1 = errors found.
