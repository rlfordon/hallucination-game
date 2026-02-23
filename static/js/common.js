/* common.js — Shared utilities for all game pages */

const API = {
    token: localStorage.getItem('session_token') || localStorage.getItem('prof_session_token'),
    gameId: localStorage.getItem('game_id') || localStorage.getItem('prof_game_id'),

    headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this.token) h['X-Session-Token'] = this.token;
        return h;
    },

    async post(url, data) {
        const res = await fetch(url, { method: 'POST', headers: this.headers(), body: JSON.stringify(data) });
        return res.json();
    },

    async get(url) {
        const res = await fetch(url, { headers: this.headers() });
        return res.json();
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/* ── Timer ──────────────────────────────────────────────────────────── */

const Timer = {
    _end: null,
    _interval: null,
    _displayEl: null,

    init(displaySelector) {
        this._displayEl = document.querySelector(displaySelector);
        this._interval = setInterval(() => this._tick(), 1000);
    },

    setEnd(isoString) {
        this._end = isoString;
    },

    _tick() {
        const el = this._displayEl;
        if (!el || !this._end) return;

        const now = new Date();
        const end = new Date(this._end);
        const diff = Math.max(0, Math.floor((end - now) / 1000));

        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        el.classList.toggle('warning', diff < 60);
    }
};
