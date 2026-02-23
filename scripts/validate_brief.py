#!/usr/bin/env python3
"""Validate brief and hallucination JSON data for consistency.

Usage:
    python3 scripts/validate_brief.py [brief_id]

Defaults to brief_rosario if no argument given.
Exit code 0 if no errors, 1 if errors found.
"""

import json
import os
import re
import sys

# ANSI color codes
RED = "\033[91m"
YELLOW = "\033[93m"
GREEN = "\033[92m"
CYAN = "\033[96m"
RESET = "\033[0m"

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def main():
    brief_id = sys.argv[1] if len(sys.argv) > 1 else "brief_rosario"

    brief_path = os.path.join(DATA_DIR, "briefs", f"{brief_id}.json")
    hall_path = os.path.join(DATA_DIR, "hallucinations", f"{brief_id}.json")

    if not os.path.exists(brief_path):
        print(f"{RED}ERROR{RESET}: Brief file not found: {brief_path}")
        sys.exit(1)
    if not os.path.exists(hall_path):
        print(f"{RED}ERROR{RESET}: Hallucination file not found: {hall_path}")
        sys.exit(1)

    brief = load_json(brief_path)
    hallucinations = load_json(hall_path)

    errors = 0
    warnings = 0
    citations_validated = 0

    paragraphs = brief.get("paragraphs", [])

    # Build lookup structures
    # citation_id -> list of (para_id, cite_entry) for all occurrences
    cite_locations = {}
    # citation_id -> list of (para_id, cite_entry) for primary (non-supra) only
    primary_cites = {}
    # citation_id -> list of (para_id, cite_entry) for supra only
    supra_cites = {}

    for para in paragraphs:
        for cite in para.get("citations", []):
            cid = cite["citation_id"]
            entry = (para["id"], cite)

            cite_locations.setdefault(cid, []).append(entry)
            if cite.get("supra"):
                supra_cites.setdefault(cid, []).append(entry)
            else:
                primary_cites.setdefault(cid, []).append(entry)

    print(f"\n{CYAN}=== Validating {brief_id} ==={RESET}\n")

    # ---------------------------------------------------------------
    # 1. Citation offset checks
    # ---------------------------------------------------------------
    print(f"{CYAN}--- Citation offset checks ---{RESET}")
    for para in paragraphs:
        for cite in para.get("citations", []):
            cid = cite["citation_id"]
            start = cite["start"]
            end = cite["end"]
            display = cite["display_text"]
            actual = para["text"][start:end]
            citations_validated += 1

            if actual != display:
                print(
                    f"  {RED}ERROR{RESET}: [{para['id']}] {cid}: offset mismatch\n"
                    f"         expected: {display!r}\n"
                    f"         actual:   {actual!r}"
                )
                errors += 1
            else:
                supra_tag = " (supra)" if cite.get("supra") else ""
                print(f"  {GREEN}OK{RESET}: [{para['id']}] {cid}{supra_tag}: offsets correct")

    # ---------------------------------------------------------------
    # 2. Supra detection
    # ---------------------------------------------------------------
    print(f"\n{CYAN}--- Supra reference detection ---{RESET}")
    # Pattern: case name followed by ", supra" (with optional period)
    supra_pattern = re.compile(r"([A-Z][\w\-'.]+(?:\s+v\.?\s+[A-Z][\w\-'.]+(?:\s+[\w&.]+)*)?),\s*supra\.?")

    supra_found_count = 0
    for para in paragraphs:
        text = para["text"]
        for m in supra_pattern.finditer(text):
            supra_found_count += 1
            match_text = m.group(0)
            match_start = m.start()

            # Check if any supra citation covers this position
            has_supra_cite = False
            for cite in para.get("citations", []):
                if cite.get("supra") and cite["start"] <= match_start < cite["end"]:
                    has_supra_cite = True
                    # Cross-reference: does this supra's citation_id have a primary?
                    cid = cite["citation_id"]
                    if cid not in primary_cites:
                        print(
                            f"  {RED}ERROR{RESET}: [{para['id']}] supra {cid} has no primary citation anywhere in brief"
                        )
                        errors += 1
                    else:
                        print(f"  {GREEN}OK{RESET}: [{para['id']}] supra detected and captured: {match_text!r} -> {cid}")
                    break

            if not has_supra_cite:
                print(
                    f"  {YELLOW}WARN{RESET}: [{para['id']}] supra reference in text but no citation entry: {match_text!r}"
                )
                warnings += 1

    if supra_found_count == 0:
        print(f"  (no supra references found in text)")

    # ---------------------------------------------------------------
    # 3. Hallucination target reachability
    # ---------------------------------------------------------------
    print(f"\n{CYAN}--- Hallucination target reachability ---{RESET}")
    for cid, cite_data in hallucinations.items():
        options = cite_data.get("options", {})
        for htype, opts in options.items():
            for opt in opts:
                oid = opt["id"]

                # Check original_text targets
                if "original_text" in opt:
                    original_text = opt["original_text"]
                    found_para = None
                    for para in paragraphs:
                        if original_text in para["text"]:
                            found_para = para["id"]
                            break

                    if found_para is None:
                        print(
                            f"  {RED}ERROR{RESET}: {oid}: original_text not found in ANY paragraph\n"
                            f"         text: {original_text[:80]!r}..."
                        )
                        errors += 1
                    else:
                        # Check if it's in the same paragraph as the citation
                        cite_paras = {pid for pid, _ in cite_locations.get(cid, [])}
                        if found_para in cite_paras:
                            print(f"  {GREEN}OK{RESET}: {oid}: original_text found in citation's paragraph ({found_para})")
                        else:
                            print(
                                f"  {GREEN}OK{RESET}: {oid}: original_text found in {found_para} "
                                f"(cross-paragraph; citation is in {', '.join(sorted(cite_paras))})"
                            )

                # Check replacement_citation targets
                if "replacement_citation" in opt:
                    # Verify the citation exists and has a non-supra entry
                    if cid not in primary_cites:
                        print(
                            f"  {RED}ERROR{RESET}: {oid}: replacement_citation but {cid} has no primary (non-supra) citation entry"
                        )
                        errors += 1
                    else:
                        print(f"  {GREEN}OK{RESET}: {oid}: replacement_citation target exists (primary in {primary_cites[cid][0][0]})")

    # ---------------------------------------------------------------
    # 4. Cross-reference checks
    # ---------------------------------------------------------------
    print(f"\n{CYAN}--- Cross-reference checks ---{RESET}")

    # Every citation_id in hallucinations has at least one citation entry in the brief
    for cid in hallucinations:
        if cid not in cite_locations:
            print(f"  {RED}ERROR{RESET}: hallucination {cid} has no citation entry in the brief")
            errors += 1
        else:
            print(f"  {GREEN}OK{RESET}: {cid} exists in brief ({len(cite_locations[cid])} occurrence(s))")

    # Every non-supra citation in the brief has an entry in hallucinations
    for cid in primary_cites:
        if cid not in hallucinations:
            print(f"  {YELLOW}WARN{RESET}: {cid} is in brief but has no hallucination options")
            warnings += 1

    # Option ID naming convention
    print(f"\n{CYAN}--- Option ID naming convention ---{RESET}")
    type_abbrevs = {
        "fabricated_case": "fab",
        "wrong_citation": "wc",
        "mischaracterization": "mc",
        "misquotation": "mq",
    }
    id_pattern = re.compile(r"^cite_\d+_(fab|wc|mc|mq)_\d+$")

    for cid, cite_data in hallucinations.items():
        options = cite_data.get("options", {})
        for htype, opts in options.items():
            expected_abbrev = type_abbrevs.get(htype, "??")
            for opt in opts:
                oid = opt["id"]
                if not id_pattern.match(oid):
                    print(f"  {YELLOW}WARN{RESET}: {oid}: does not match naming convention cite_NN_<type>_N")
                    warnings += 1
                elif f"_{expected_abbrev}_" not in oid:
                    print(f"  {YELLOW}WARN{RESET}: {oid}: type abbrev mismatch (expected '{expected_abbrev}' for {htype})")
                    warnings += 1
                else:
                    # Check citation number matches
                    cite_num = cid.replace("cite_", "")
                    if not oid.startswith(f"cite_{cite_num}_"):
                        print(f"  {YELLOW}WARN{RESET}: {oid}: citation number mismatch (under {cid})")
                        warnings += 1

    print(f"  {GREEN}OK{RESET}: naming convention check complete")

    # ---------------------------------------------------------------
    # Summary
    # ---------------------------------------------------------------
    print(f"\n{CYAN}=== Summary ==={RESET}")
    color = GREEN if errors == 0 else RED
    print(f"  {color}{errors} error(s){RESET}, {YELLOW}{warnings} warning(s){RESET}, {GREEN}{citations_validated} citations validated{RESET}")

    if errors > 0:
        print(f"\n  {RED}FAILED{RESET}: Fix errors above before using this data.\n")
        sys.exit(1)
    else:
        print(f"\n  {GREEN}PASSED{RESET}: All checks passed.\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
