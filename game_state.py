"""Game state management: brief loading, swap application, scoring."""

import json
import os
import copy
import random

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')

# In-memory caches
_briefs_cache = {}
_hallucinations_cache = {}


def load_brief(brief_id):
    """Load and cache a brief JSON file."""
    if brief_id in _briefs_cache:
        return _briefs_cache[brief_id]
    path = os.path.join(DATA_DIR, 'briefs', f'{brief_id}.json')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    _briefs_cache[brief_id] = data
    return data


def load_hallucinations(brief_id):
    """Load and cache hallucination options for a brief."""
    if brief_id in _hallucinations_cache:
        return _hallucinations_cache[brief_id]
    path = os.path.join(DATA_DIR, 'hallucinations', f'{brief_id}.json')
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    _hallucinations_cache[brief_id] = data
    return data


def list_briefs():
    """Discover available briefs from the data/briefs/ directory."""
    briefs_dir = os.path.join(DATA_DIR, 'briefs')
    briefs = []
    for filename in os.listdir(briefs_dir):
        if filename.endswith('.json') and filename.startswith('brief_'):
            brief_id = filename[:-5]  # strip .json
            brief = load_brief(brief_id)
            briefs.append({
                'brief_id': brief_id,
                'title': brief.get('title', brief_id),
                'case_name': brief.get('case_name', ''),
            })
    return briefs


def generate_random_swaps(brief_id, num_swaps):
    """Generate a balanced set of random swaps across hallucination types.

    Args:
        brief_id: The brief to generate swaps for
        num_swaps: Number of swaps to generate

    Returns:
        List of {citation_id, hallucination_type, option_id} dicts
    """
    hallucinations = load_hallucinations(brief_id)

    # Build pool grouped by hallucination type
    TYPES = ['fabricated_case', 'wrong_citation', 'mischaracterization', 'misquotation']
    pools = {t: [] for t in TYPES}

    for cid, cite_data in hallucinations.items():
        options = cite_data.get('options', {})
        for htype in TYPES:
            type_options = options.get(htype, [])
            for opt in type_options:
                pools[htype].append((cid, htype, opt['id']))

    # Shuffle each pool
    for t in TYPES:
        random.shuffle(pools[t])

    # Round-robin pick from each type
    swaps = []
    used_cids = set()
    type_idx = {t: 0 for t in TYPES}
    type_cycle = 0

    while len(swaps) < num_swaps:
        htype = TYPES[type_cycle % len(TYPES)]
        pool = pools[htype]

        # Find next unused citation in this type's pool
        found = False
        while type_idx[htype] < len(pool):
            cid, ht, oid = pool[type_idx[htype]]
            type_idx[htype] += 1
            if cid not in used_cids:
                swaps.append({
                    'citation_id': cid,
                    'hallucination_type': ht,
                    'option_id': oid
                })
                used_cids.add(cid)
                found = True
                break

        type_cycle += 1

        # If we've cycled through all types without finding anything, break
        if not found and all(type_idx[t] >= len(pools[t]) for t in TYPES):
            break

    return swaps


def get_brief_for_display(brief_id, swaps=None):
    """Get brief data suitable for display, optionally with swaps applied.

    Args:
        brief_id: The brief to load
        swaps: List of swap dicts with citation_id, hallucination_type, option_id

    Returns:
        Brief data with swaps applied if provided
    """
    brief = load_brief(brief_id)
    if not swaps:
        return brief

    hallucinations = load_hallucinations(brief_id)
    modified = copy.deepcopy(brief)

    # Build swap lookup: citation_id -> option details
    swap_lookup = {}
    for swap in swaps:
        cid = swap['citation_id']
        htype = swap['hallucination_type']
        oid = swap['option_id']

        cite_data = hallucinations.get(cid)
        if not cite_data:
            continue
        type_options = cite_data.get('options', {}).get(htype, [])
        option = next((o for o in type_options if o['id'] == oid), None)
        if option:
            swap_lookup[cid] = {
                'option': option,
                'type': htype,
                'original_display': cite_data.get('original_display', '')
            }

    # Apply swaps to paragraphs
    # First pass: citation text replacements (within the citation's own paragraph)
    for para in modified['paragraphs']:
        if not para.get('citations'):
            continue

        # Sort citations right-to-left by start offset to preserve positions
        sorted_cites = sorted(para['citations'], key=lambda c: c['start'], reverse=True)

        any_replaced = False
        for cite in sorted_cites:
            cid = cite['citation_id']
            if cid not in swap_lookup:
                continue

            swap_info = swap_lookup[cid]
            option = swap_info['option']

            if 'replacement_citation' in option:
                # Simple citation text replacement — only on the primary (non-supra) citation
                if cite.get('supra'):
                    continue
                old_text = cite['display_text']
                new_text = option['replacement_citation']
                text = para['text']
                start = cite['start']
                end = cite['end']
                para['text'] = text[:start] + new_text + text[end:]
                # Update citation span
                cite['display_text'] = new_text
                cite['end'] = start + len(new_text)
                any_replaced = True

        # Recalculate offsets for all citations after text length changes
        if any_replaced:
            _recalculate_offsets(para)

    # Second pass: text region replacements (search all paragraphs)
    applied_swaps = set()
    for cid, swap_info in swap_lookup.items():
        option = swap_info['option']
        if 'replacement_text' not in option or 'original_text' not in option:
            continue

        old_text = option['original_text']
        new_text = option['replacement_text']

        for para in modified['paragraphs']:
            idx = para['text'].find(old_text)
            if idx >= 0:
                para['text'] = para['text'][:idx] + new_text + para['text'][idx + len(old_text):]
                _recalculate_offsets(para)
                applied_swaps.add(cid)
                break

    return modified


def _recalculate_offsets(para):
    """Recalculate citation offsets after text replacement."""
    for cite in para.get('citations', []):
        text = para['text']
        display = cite['display_text']
        idx = text.find(display)
        if idx >= 0:
            cite['start'] = idx
            cite['end'] = idx + len(display)


def compute_scores(game_id, teams, swaps_by_team, flags_by_team, brief_id):
    """Compute scores for all teams.

    Args:
        game_id: The game ID
        teams: List of team dicts
        swaps_by_team: Dict mapping team_id -> list of swap records
        flags_by_team: Dict mapping team_id -> list of flag records
        brief_id: The brief being used

    Returns:
        Dict with per-team scores and citation-level details
    """
    brief = load_brief(brief_id)
    hallucinations = load_hallucinations(brief_id)

    # Get all citation IDs from the brief
    all_citation_ids = set()
    for para in brief['paragraphs']:
        for cite in para.get('citations', []):
            all_citation_ids.add(cite['citation_id'])

    results = {}

    for team in teams:
        tid = team['team_id']
        tname = team['team_name']
        fab_team = team.get('fabrication_team')

        # Get this team's swaps (what they fabricated)
        team_swaps = swaps_by_team.get(tid, [])
        swapped_cids = {s['citation_id'] for s in team_swaps}

        # Get this team's flags (what they flagged during verification)
        team_flags = flags_by_team.get(tid, [])
        flag_lookup = {}
        for f in team_flags:
            flag_lookup[f['citation_id']] = f['verdict']

        # Find the team that verified this team's fabrications
        verifying_flags = {}
        for other_team in teams:
            if other_team.get('fabrication_team') == tid:
                # This other team verified our fabrications
                other_flags = flags_by_team.get(other_team['team_id'], [])
                for f in other_flags:
                    verifying_flags[f['citation_id']] = f['verdict']

        # Fabrication scoring: +2 undetected, +0 caught
        fab_score = 0
        fab_details = []
        for s in team_swaps:
            cid = s['citation_id']
            htype = s['hallucination_type']
            oid = s['option_id']
            verifier_verdict = verifying_flags.get(cid, 'skip')
            caught = verifier_verdict == 'fake'
            points = 0 if caught else 2
            fab_score += points

            # Get option label
            label = ''
            cite_data = hallucinations.get(cid, {})
            for opt in cite_data.get('options', {}).get(htype, []):
                if opt['id'] == oid:
                    label = opt.get('label', '')
                    break

            fab_details.append({
                'citation_id': cid,
                'hallucination_type': htype,
                'option_label': label,
                'caught': caught,
                'points': points
            })

        # Verification scoring: +2 correct flag, -1 wrong flag, 0 skip
        ver_score = 0
        ver_details = []

        # We need to know which citations were swapped by the team we're verifying
        fab_team_swaps = swaps_by_team.get(fab_team, []) if fab_team else []
        fab_team_swapped_cids = {s['citation_id'] for s in fab_team_swaps}

        for cid in sorted(all_citation_ids):
            verdict = flag_lookup.get(cid, 'skip')
            is_fake = cid in fab_team_swapped_cids

            if verdict == 'fake':
                if is_fake:
                    points = 2  # Correctly caught
                else:
                    points = -1  # Wrong flag
            elif verdict == 'legit':
                points = 0  # No points for legit
            else:
                points = 0  # Skip

            ver_score += points
            ver_details.append({
                'citation_id': cid,
                'verdict': verdict,
                'is_fake': is_fake,
                'points': points
            })

        results[tid] = {
            'team_name': tname,
            'fabrication_score': fab_score,
            'verification_score': ver_score,
            'total_score': fab_score + ver_score,
            'fabrication_details': fab_details,
            'verification_details': ver_details,
            'swaps_made': len(team_swaps),
            'flags_made': len([f for f in team_flags if flag_lookup.get(f['citation_id']) == 'fake'])
        }

    return results
