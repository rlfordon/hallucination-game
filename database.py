"""SQLite database for the Citation Hallucination Game."""

import sqlite3
import uuid
import random
import string
import os
import threading

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'game.db')

_local = threading.local()


def get_db():
    """Get a thread-local database connection."""
    if not hasattr(_local, 'conn') or _local.conn is None:
        _local.conn = sqlite3.connect(DB_PATH)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
        _local.conn.execute("PRAGMA foreign_keys=ON")
    return _local.conn


def close_db():
    """Close the thread-local connection."""
    if hasattr(_local, 'conn') and _local.conn is not None:
        _local.conn.close()
        _local.conn = None


def init_db():
    """Create tables if they don't exist."""
    db = get_db()
    db.executescript("""
        CREATE TABLE IF NOT EXISTS games (
            game_id TEXT PRIMARY KEY,
            game_code TEXT UNIQUE NOT NULL,
            phase TEXT NOT NULL DEFAULT 'lobby',
            timer_end TEXT,
            brief_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS teams (
            team_id TEXT PRIMARY KEY,
            game_id TEXT NOT NULL REFERENCES games(game_id),
            team_name TEXT NOT NULL,
            fabrication_brief TEXT,
            verification_brief TEXT,
            fabrication_team TEXT
        );

        CREATE TABLE IF NOT EXISTS players (
            player_id TEXT PRIMARY KEY,
            game_id TEXT NOT NULL REFERENCES games(game_id),
            team_id TEXT REFERENCES teams(team_id),
            player_name TEXT NOT NULL,
            session_token TEXT UNIQUE NOT NULL,
            is_professor INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS swaps (
            game_id TEXT NOT NULL REFERENCES games(game_id),
            team_id TEXT NOT NULL REFERENCES teams(team_id),
            citation_id TEXT NOT NULL,
            hallucination_type TEXT NOT NULL,
            option_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (game_id, team_id, citation_id)
        );

        CREATE TABLE IF NOT EXISTS flags (
            game_id TEXT NOT NULL REFERENCES games(game_id),
            team_id TEXT NOT NULL REFERENCES teams(team_id),
            citation_id TEXT NOT NULL,
            verdict TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (game_id, team_id, citation_id)
        );
    """)
    db.commit()


def generate_game_code():
    """Generate a 6-char alphanumeric code, avoiding ambiguous chars."""
    chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return ''.join(random.choices(chars, k=6))


def generate_id():
    """Generate a UUID."""
    return str(uuid.uuid4())


def create_game():
    """Create a new game session."""
    db = get_db()
    game_id = generate_id()
    game_code = generate_game_code()
    db.execute(
        "INSERT INTO games (game_id, game_code, phase) VALUES (?, ?, 'lobby')",
        (game_id, game_code)
    )
    db.commit()
    return game_id, game_code


def get_game_by_code(code):
    """Look up a game by its code."""
    db = get_db()
    return db.execute("SELECT * FROM games WHERE game_code = ?", (code.upper(),)).fetchone()


def get_game(game_id):
    """Get game by ID."""
    db = get_db()
    return db.execute("SELECT * FROM games WHERE game_id = ?", (game_id,)).fetchone()


def set_game_phase(game_id, phase, timer_end=None):
    """Update the game phase."""
    db = get_db()
    db.execute(
        "UPDATE games SET phase = ?, timer_end = ? WHERE game_id = ?",
        (phase, timer_end, game_id)
    )
    db.commit()


def set_game_brief(game_id, brief_id):
    """Set the brief for a game."""
    db = get_db()
    db.execute("UPDATE games SET brief_id = ? WHERE game_id = ?", (brief_id, game_id))
    db.commit()


def create_team(game_id, team_name):
    """Create a team in a game."""
    db = get_db()
    team_id = generate_id()
    db.execute(
        "INSERT INTO teams (team_id, game_id, team_name) VALUES (?, ?, ?)",
        (team_id, game_id, team_name)
    )
    db.commit()
    return team_id


def get_teams(game_id):
    """Get all teams for a game."""
    db = get_db()
    return db.execute("SELECT * FROM teams WHERE game_id = ?", (game_id,)).fetchall()


def get_team(team_id):
    """Get a team by ID."""
    db = get_db()
    return db.execute("SELECT * FROM teams WHERE team_id = ?", (team_id,)).fetchone()


def assign_player_team(player_id, team_id):
    """Assign a player to a team."""
    db = get_db()
    db.execute("UPDATE players SET team_id = ? WHERE player_id = ?", (team_id, player_id))
    db.commit()


def set_team_briefs(team_id, fabrication_brief, verification_brief, fabrication_team):
    """Set which brief a team fabricates on and verifies."""
    db = get_db()
    db.execute(
        "UPDATE teams SET fabrication_brief = ?, verification_brief = ?, fabrication_team = ? WHERE team_id = ?",
        (fabrication_brief, verification_brief, fabrication_team, team_id)
    )
    db.commit()


def create_player(game_id, player_name, is_professor=False):
    """Create a player and return (player_id, session_token)."""
    db = get_db()
    player_id = generate_id()
    session_token = generate_id()
    db.execute(
        "INSERT INTO players (player_id, game_id, player_name, session_token, is_professor) VALUES (?, ?, ?, ?, ?)",
        (player_id, game_id, player_name, session_token, 1 if is_professor else 0)
    )
    db.commit()
    return player_id, session_token


def get_player_by_token(token):
    """Look up a player by session token."""
    db = get_db()
    return db.execute("SELECT * FROM players WHERE session_token = ?", (token,)).fetchone()


def get_players(game_id, team_id=None):
    """Get players in a game, optionally filtered by team."""
    db = get_db()
    if team_id:
        return db.execute(
            "SELECT * FROM players WHERE game_id = ? AND team_id = ?",
            (game_id, team_id)
        ).fetchall()
    return db.execute("SELECT * FROM players WHERE game_id = ?", (game_id,)).fetchall()


def upsert_swap(game_id, team_id, citation_id, hallucination_type, option_id):
    """Insert or replace a swap."""
    db = get_db()
    db.execute(
        "INSERT OR REPLACE INTO swaps (game_id, team_id, citation_id, hallucination_type, option_id) VALUES (?, ?, ?, ?, ?)",
        (game_id, team_id, citation_id, hallucination_type, option_id)
    )
    db.commit()


def delete_swap(game_id, team_id, citation_id):
    """Remove a swap."""
    db = get_db()
    db.execute(
        "DELETE FROM swaps WHERE game_id = ? AND team_id = ? AND citation_id = ?",
        (game_id, team_id, citation_id)
    )
    db.commit()


def get_swaps(game_id, team_id):
    """Get all swaps for a team in a game."""
    db = get_db()
    return db.execute(
        "SELECT * FROM swaps WHERE game_id = ? AND team_id = ?",
        (game_id, team_id)
    ).fetchall()


def upsert_flag(game_id, team_id, citation_id, verdict):
    """Insert or replace a flag."""
    db = get_db()
    db.execute(
        "INSERT OR REPLACE INTO flags (game_id, team_id, citation_id, verdict) VALUES (?, ?, ?, ?)",
        (game_id, team_id, citation_id, verdict)
    )
    db.commit()


def get_flags(game_id, team_id):
    """Get all flags for a team in a game."""
    db = get_db()
    return db.execute(
        "SELECT * FROM flags WHERE game_id = ? AND team_id = ?",
        (game_id, team_id)
    ).fetchall()


def reset_game(game_id):
    """Reset a game back to lobby: clear swaps, flags, team assignments, and phase."""
    db = get_db()
    db.execute("DELETE FROM swaps WHERE game_id = ?", (game_id,))
    db.execute("DELETE FROM flags WHERE game_id = ?", (game_id,))
    db.execute(
        "UPDATE teams SET fabrication_brief = NULL, verification_brief = NULL, fabrication_team = NULL WHERE game_id = ?",
        (game_id,)
    )
    db.execute(
        "UPDATE games SET phase = 'lobby', timer_end = NULL WHERE game_id = ?",
        (game_id,)
    )
    db.commit()
