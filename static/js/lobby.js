/* lobby.js — Join game and wait for start */

const API = {
    token: localStorage.getItem('session_token'),
    gameId: localStorage.getItem('game_id'),

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

async function joinGame() {
    const code = document.getElementById('gameCode').value.trim().toUpperCase();
    const name = document.getElementById('playerName').value.trim();

    if (!code || !name) {
        showError('Please enter both a game code and your name.');
        return;
    }

    const data = await API.post('/api/join', { game_code: code, player_name: name });

    if (data.error) {
        showError(data.error);
        return;
    }

    // Store session
    localStorage.setItem('session_token', data.session_token);
    localStorage.setItem('game_id', data.game_id);
    localStorage.setItem('player_name', name);
    API.token = data.session_token;
    API.gameId = data.game_id;

    showWaiting();
    startPolling();
}

function showError(msg) {
    const el = document.getElementById('joinError');
    el.textContent = msg;
    el.classList.remove('hidden');
}

function showWaiting() {
    document.getElementById('joinSection').classList.add('hidden');
    document.getElementById('waitingSection').classList.remove('hidden');
}

let pollInterval;

function startPolling() {
    pollInterval = setInterval(pollPhase, 2500);
    pollPhase();
}

async function pollPhase() {
    if (!API.token) return;

    try {
        const phase = await API.get('/api/game/phase');

        if (phase.team_name) {
            document.getElementById('waitingTeamInfo').innerHTML =
                `<span class="team-badge">${phase.team_name}</span>`;
        }

        if (phase.phase !== 'lobby') {
            clearInterval(pollInterval);
            window.location.href = `/game/${API.gameId}`;
        }

        // Also update team list
        const status = await API.get('/api/game/status');
        if (status.teams) {
            renderTeams(status.teams);
        }
    } catch (e) {
        // Ignore poll errors
    }
}

function renderTeams(teams) {
    const container = document.getElementById('teamList');
    container.innerHTML = teams.map(team => `
        <div class="team-card">
            <h4>${team.team_name}</h4>
            <ul class="player-list">
                ${team.players.map(p => `<li>${p.player_name}</li>`).join('')}
                ${team.players.length === 0 ? '<li style="color: var(--gray-400)">No players yet</li>' : ''}
            </ul>
        </div>
    `).join('');
}

// On load, check if already in a game
document.addEventListener('DOMContentLoaded', () => {
    if (API.token && API.gameId) {
        // Check if still valid
        API.get('/api/game/phase').then(data => {
            if (!data.error) {
                if (data.phase !== 'lobby') {
                    window.location.href = `/game/${API.gameId}`;
                } else {
                    showWaiting();
                    startPolling();
                }
            }
        }).catch(() => {});
    }
});
