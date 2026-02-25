/* landing.js — Landing page: start solitaire or navigate to other modes */
/* Depends on: common.js (API) */

async function startSolitaire() {
    const numSwaps = parseInt(document.getElementById('soloSwaps').value, 10) || 8;
    const errorEl = document.getElementById('soloError');
    errorEl.classList.add('hidden');

    // Clear stale session data
    localStorage.removeItem('session_token');
    localStorage.removeItem('game_id');
    localStorage.removeItem('game_code');

    const result = await API.post('/api/solitaire/start', {
        num_swaps: numSwaps
    });

    if (result.error) {
        errorEl.textContent = result.error;
        errorEl.classList.remove('hidden');
        return;
    }

    localStorage.setItem('session_token', result.session_token);
    localStorage.setItem('game_id', result.game_id);
    window.location.href = '/game/' + result.game_id;
}
