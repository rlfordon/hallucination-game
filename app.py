"""Flask app for the Citation Hallucination Game."""

from flask import Flask, render_template, request, jsonify, redirect, url_for
from datetime import datetime, timedelta, timezone
import database as db
import game_state as gs

app = Flask(__name__)


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_player():
    """Get current player from session token in header or cookie."""
    token = request.headers.get('X-Session-Token') or request.cookies.get('session_token')
    if not token:
        return None
    return db.get_player_by_token(token)


def require_player():
    """Return player or raise 401."""
    player = get_player()
    if not player:
        return None, jsonify({'error': 'Not authenticated'}), 401
    return player, None, None


def require_professor():
    """Return professor player or raise 403."""
    player = get_player()
    if not player:
        return None, jsonify({'error': 'Not authenticated'}), 401
    if not player['is_professor']:
        return None, jsonify({'error': 'Not authorized'}), 403
    return player, None, None


def timer_iso(minutes):
    """Return ISO timestamp minutes from now."""
    return (datetime.now(timezone.utc) + timedelta(minutes=minutes)).isoformat()


# ── Page Routes ──────────────────────────────────────────────────────────────

@app.route('/')
def index():
    """Student landing page."""
    return render_template('lobby.html')


@app.route('/professor')
def professor():
    """Professor control panel."""
    return render_template('professor.html')


@app.route('/game/<game_id>')
def game_page(game_id):
    """Main game page — routes to correct phase template."""
    game = db.get_game(game_id)
    if not game:
        return redirect('/')
    phase = game['phase']
    if phase == 'lobby':
        return render_template('lobby.html', game_id=game_id, game_code=game['game_code'])
    elif phase == 'fabrication':
        return render_template('fabrication.html', game_id=game_id)
    elif phase == 'verification':
        return render_template('verification.html', game_id=game_id)
    elif phase == 'reveal':
        return render_template('scoreboard.html', game_id=game_id)
    return redirect('/')


# ── Professor API ────────────────────────────────────────────────────────────

@app.route('/api/game/create', methods=['POST'])
def api_create_game():
    """Create a new game session."""
    game_id, game_code = db.create_game()

    # Create professor "player"
    player_id, session_token = db.create_player(game_id, 'Professor', is_professor=True)

    # Auto-set the brief (only one available)
    briefs = gs.list_briefs()
    if briefs:
        db.set_game_brief(game_id, briefs[0]['brief_id'])

    # Create default teams
    for name in ['Team A', 'Team B', 'Team C']:
        db.create_team(game_id, name)

    return jsonify({
        'game_id': game_id,
        'game_code': game_code,
        'session_token': session_token,
        'briefs': briefs
    })


@app.route('/api/game/assign-teams', methods=['POST'])
def api_assign_teams():
    """Assign a player to a team."""
    player, err, code = require_player()
    if err:
        return err, code

    data = request.json
    player_id = data.get('player_id')
    team_id = data.get('team_id')
    if not player_id or not team_id:
        return jsonify({'error': 'Missing player_id or team_id'}), 400

    db.assign_player_team(player_id, team_id)
    return jsonify({'ok': True})


@app.route('/api/game/start', methods=['POST'])
def api_start_game():
    """Start Phase 1 (fabrication)."""
    player, err, code = require_professor()
    if err:
        return err, code

    data = request.json or {}
    minutes = data.get('minutes', 20)
    game = db.get_game(player['game_id'])
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    # Set up team brief assignments: all teams use the same brief since only 1 exists
    # With one brief, all teams fabricate and verify the same brief
    teams = db.get_teams(game['game_id'])
    team_list = list(teams)

    if len(team_list) < 2:
        return jsonify({'error': 'Need at least 2 teams'}), 400

    # Rotation: Team i fabricates, Team (i+1) % n verifies Team i's work
    for i, team in enumerate(team_list):
        next_team = team_list[(i + 1) % len(team_list)]
        db.set_team_briefs(
            team['team_id'],
            fabrication_brief=game['brief_id'],
            verification_brief=game['brief_id'],
            fabrication_team=team_list[(i - 1) % len(team_list)]['team_id']
        )

    db.set_game_phase(game['game_id'], 'fabrication', timer_iso(minutes))
    return jsonify({'ok': True, 'phase': 'fabrication'})


@app.route('/api/game/swap', methods=['POST'])
def api_swap_phase():
    """End Phase 1, start Phase 2 (verification)."""
    player, err, code = require_professor()
    if err:
        return err, code

    data = request.json or {}
    minutes = data.get('minutes', 15)
    game = db.get_game(player['game_id'])
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    db.set_game_phase(game['game_id'], 'verification', timer_iso(minutes))
    return jsonify({'ok': True, 'phase': 'verification'})


@app.route('/api/game/reveal', methods=['POST'])
def api_reveal():
    """End Phase 2, show results."""
    player, err, code = require_professor()
    if err:
        return err, code

    game = db.get_game(player['game_id'])
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    db.set_game_phase(game['game_id'], 'reveal')
    return jsonify({'ok': True, 'phase': 'reveal'})


@app.route('/api/game/reset', methods=['POST'])
def api_reset_game():
    """Reset the game back to lobby phase."""
    player, err, code = require_professor()
    if err:
        return err, code

    game = db.get_game(player['game_id'])
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    db.reset_game(game['game_id'])
    return jsonify({'ok': True, 'phase': 'lobby'})


@app.route('/api/game/status')
def api_game_status():
    """Current game state for professor."""
    player, err, code = require_player()
    if err:
        return err, code

    game = db.get_game(player['game_id'])
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    teams = db.get_teams(game['game_id'])
    players = db.get_players(game['game_id'])

    teams_data = []
    for team in teams:
        team_players = [p for p in players if p['team_id'] == team['team_id']]
        swaps = db.get_swaps(game['game_id'], team['team_id'])
        flags = db.get_flags(game['game_id'], team['team_id'])
        teams_data.append({
            'team_id': team['team_id'],
            'team_name': team['team_name'],
            'players': [{'player_id': p['player_id'], 'player_name': p['player_name']} for p in team_players],
            'swap_count': len(swaps),
            'flag_count': len([f for f in flags if f['verdict'] == 'fake'])
        })

    unassigned = [{'player_id': p['player_id'], 'player_name': p['player_name']}
                  for p in players if not p['team_id'] and not p['is_professor']]

    return jsonify({
        'game_id': game['game_id'],
        'game_code': game['game_code'],
        'phase': game['phase'],
        'timer_end': game['timer_end'],
        'brief_id': game['brief_id'],
        'teams': teams_data,
        'unassigned_players': unassigned
    })


# ── Student API ──────────────────────────────────────────────────────────────

@app.route('/api/join', methods=['POST'])
def api_join():
    """Join a game with code + name."""
    data = request.json
    code = data.get('game_code', '').strip().upper()
    name = data.get('player_name', '').strip()

    if not code or not name:
        return jsonify({'error': 'Game code and name required'}), 400

    game = db.get_game_by_code(code)
    if not game:
        return jsonify({'error': 'Invalid game code'}), 404

    if game['phase'] != 'lobby':
        return jsonify({'error': 'Game already in progress'}), 400

    player_id, session_token = db.create_player(game['game_id'], name)
    return jsonify({
        'player_id': player_id,
        'session_token': session_token,
        'game_id': game['game_id'],
        'game_code': game['game_code']
    })


@app.route('/api/game/phase')
def api_phase():
    """Current phase (for polling)."""
    player = get_player()
    if not player:
        # Allow polling with game_id param even without auth
        game_id = request.args.get('game_id')
        if game_id:
            game = db.get_game(game_id)
            if game:
                return jsonify({'phase': game['phase'], 'timer_end': game['timer_end']})
        return jsonify({'error': 'Not authenticated'}), 401

    game = db.get_game(player['game_id'])
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    result = {'phase': game['phase'], 'timer_end': game['timer_end']}

    # Include team info if player is assigned
    if player['team_id']:
        team = db.get_team(player['team_id'])
        if team:
            result['team_id'] = team['team_id']
            result['team_name'] = team['team_name']

    return jsonify(result)


@app.route('/api/brief')
def api_brief():
    """Get the brief with citations. Content varies by phase."""
    player, err, code = require_player()
    if err:
        return err, code

    game = db.get_game(player['game_id'])
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    team = db.get_team(player['team_id']) if player['team_id'] else None
    if not team:
        return jsonify({'error': 'Not assigned to a team'}), 400

    brief_id = game['brief_id']
    phase = game['phase']

    if phase == 'fabrication':
        # Show original brief (team will make swaps)
        brief = gs.get_brief_for_display(brief_id)
        # Include this team's current swaps
        swaps = db.get_swaps(game['game_id'], team['team_id'])
        swap_list = [{'citation_id': s['citation_id'], 'hallucination_type': s['hallucination_type'],
                      'option_id': s['option_id']} for s in swaps]
        return jsonify({
            'brief': brief,
            'hallucinations': gs.load_hallucinations(brief_id),
            'swaps': swap_list,
            'phase': phase
        })

    elif phase == 'verification':
        # Show the fabricating team's modified brief
        fab_team_id = team['fabrication_team']
        if not fab_team_id:
            return jsonify({'error': 'No fabrication team assigned'}), 400

        fab_swaps = db.get_swaps(game['game_id'], fab_team_id)
        swap_dicts = [{'citation_id': s['citation_id'], 'hallucination_type': s['hallucination_type'],
                       'option_id': s['option_id']} for s in fab_swaps]
        brief = gs.get_brief_for_display(brief_id, swaps=swap_dicts)

        # Include this team's current flags
        flags = db.get_flags(game['game_id'], team['team_id'])
        flag_list = [{'citation_id': f['citation_id'], 'verdict': f['verdict']} for f in flags]

        return jsonify({
            'brief': brief,
            'flags': flag_list,
            'phase': phase
        })

    elif phase == 'reveal':
        brief = gs.get_brief_for_display(brief_id)
        return jsonify({'brief': brief, 'phase': phase})

    else:
        return jsonify({'error': 'Game not in active phase'}), 400


@app.route('/api/citation/swap', methods=['POST'])
def api_citation_swap():
    """Swap a citation (Phase 1)."""
    player, err, code = require_player()
    if err:
        return err, code

    game = db.get_game(player['game_id'])
    if not game or game['phase'] != 'fabrication':
        return jsonify({'error': 'Not in fabrication phase'}), 400

    data = request.json
    citation_id = data.get('citation_id')
    hallucination_type = data.get('hallucination_type')
    option_id = data.get('option_id')

    if not all([citation_id, hallucination_type, option_id]):
        return jsonify({'error': 'Missing required fields'}), 400

    db.upsert_swap(game['game_id'], player['team_id'], citation_id, hallucination_type, option_id)
    return jsonify({'ok': True})


@app.route('/api/citation/unswap', methods=['POST'])
def api_citation_unswap():
    """Undo a swap (Phase 1)."""
    player, err, code = require_player()
    if err:
        return err, code

    game = db.get_game(player['game_id'])
    if not game or game['phase'] != 'fabrication':
        return jsonify({'error': 'Not in fabrication phase'}), 400

    data = request.json
    citation_id = data.get('citation_id')
    if not citation_id:
        return jsonify({'error': 'Missing citation_id'}), 400

    db.delete_swap(game['game_id'], player['team_id'], citation_id)
    return jsonify({'ok': True})


@app.route('/api/citation/flag', methods=['POST'])
def api_citation_flag():
    """Flag a citation (Phase 2)."""
    player, err, code = require_player()
    if err:
        return err, code

    game = db.get_game(player['game_id'])
    if not game or game['phase'] != 'verification':
        return jsonify({'error': 'Not in verification phase'}), 400

    data = request.json
    citation_id = data.get('citation_id')
    verdict = data.get('verdict')

    if not citation_id or verdict not in ('legit', 'fake'):
        return jsonify({'error': 'Invalid citation_id or verdict'}), 400

    db.upsert_flag(game['game_id'], player['team_id'], citation_id, verdict)
    return jsonify({'ok': True})


@app.route('/api/team/progress')
def api_team_progress():
    """Get team's current swap/flag count."""
    player, err, code = require_player()
    if err:
        return err, code

    game = db.get_game(player['game_id'])
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    if not player['team_id']:
        return jsonify({'error': 'Not on a team'}), 400

    swaps = db.get_swaps(game['game_id'], player['team_id'])
    flags = db.get_flags(game['game_id'], player['team_id'])

    return jsonify({
        'swap_count': len(swaps),
        'flag_count': len([f for f in flags if f['verdict'] == 'fake']),
        'review_count': len(flags),
        'swaps': [{'citation_id': s['citation_id'], 'hallucination_type': s['hallucination_type'],
                    'option_id': s['option_id']} for s in swaps],
        'flags': [{'citation_id': f['citation_id'], 'verdict': f['verdict']} for f in flags]
    })


@app.route('/api/scoreboard')
def api_scoreboard():
    """Final results (Phase 3 only)."""
    player, err, code = require_player()
    if err:
        return err, code

    game = db.get_game(player['game_id'])
    if not game:
        return jsonify({'error': 'Game not found'}), 404

    if game['phase'] != 'reveal':
        return jsonify({'error': 'Game not in reveal phase'}), 400

    teams = db.get_teams(game['game_id'])
    brief_id = game['brief_id']

    swaps_by_team = {}
    flags_by_team = {}
    for team in teams:
        tid = team['team_id']
        swaps_by_team[tid] = [dict(s) for s in db.get_swaps(game['game_id'], tid)]
        flags_by_team[tid] = [dict(f) for f in db.get_flags(game['game_id'], tid)]

    team_dicts = [dict(t) for t in teams]
    scores = gs.compute_scores(game['game_id'], team_dicts, swaps_by_team, flags_by_team, brief_id)

    # Compute aggregate stats
    all_fab_details = []
    for tid, data in scores.items():
        all_fab_details.extend(data['fabrication_details'])

    type_stats = {}
    for d in all_fab_details:
        ht = d['hallucination_type']
        if ht not in type_stats:
            type_stats[ht] = {'total': 0, 'caught': 0}
        type_stats[ht]['total'] += 1
        if d['caught']:
            type_stats[ht]['caught'] += 1

    for ht in type_stats:
        total = type_stats[ht]['total']
        caught = type_stats[ht]['caught']
        type_stats[ht]['detection_rate'] = round(caught / total * 100) if total > 0 else 0

    return jsonify({
        'scores': scores,
        'type_stats': type_stats,
        'brief_id': brief_id
    })


# ── App init ─────────────────────────────────────────────────────────────────

with app.app_context():
    db.init_db()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
