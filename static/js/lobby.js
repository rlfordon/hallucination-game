/* lobby.js — Join game and wait for start */
/* Depends on: common.js (API, escapeHtml) */

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

        if (phase.team_id) {
            currentTeamId = phase.team_id;
        }
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

let currentTeamId = null;

function renderTeams(teams) {
    const container = document.getElementById('teamList');
    container.innerHTML = teams.map(team => {
        const isMine = team.team_id === currentTeamId;
        return `
        <div class="team-card${isMine ? ' team-card--selected' : ''}">
            <h4>${escapeHtml(team.team_name)}</h4>
            <ul class="player-list">
                ${team.players.map(p => `<li>${escapeHtml(p.player_name)}</li>`).join('')}
                ${team.players.length === 0 ? '<li style="color: var(--gray-400)">No players yet</li>' : ''}
            </ul>
            <button class="btn btn-sm${isMine ? ' btn-outline' : ' btn-primary'}" onclick="chooseTeam('${team.team_id}')">
                ${isMine ? 'Joined' : 'Join'}
            </button>
        </div>`;
    }).join('');
}

async function chooseTeam(teamId) {
    try {
        const data = await API.post('/api/choose-team', { team_id: teamId });
        if (data.error) {
            showWaitingError(data.error);
            return;
        }
        currentTeamId = teamId;
        hideWaitingError();
        // Re-fetch status to update the team list immediately
        const status = await API.get('/api/game/status');
        if (status.teams) {
            renderTeams(status.teams);
        }
    } catch (e) {
        showWaitingError('Failed to join team. Please try again.');
    }
}

function showWaitingError(msg) {
    const el = document.getElementById('waitingError');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function hideWaitingError() {
    const el = document.getElementById('waitingError');
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

// On load, ensure lobby only uses student credentials (not professor fallback)
document.addEventListener('DOMContentLoaded', () => {
    const studentToken = localStorage.getItem('session_token');
    const studentGameId = localStorage.getItem('game_id');
    API.token = studentToken || null;
    API.gameId = studentGameId || null;

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
