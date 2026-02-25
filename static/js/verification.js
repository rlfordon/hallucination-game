/* verification.js — Phase 2: Flag citations as real or fake */
/* Depends on: common.js (API, escapeHtml, Timer) */

let briefData = null;
let currentFlags = {};  // citation_id -> verdict
let allCitationIds = [];
let selectedCitation = null;

async function init() {
    const data = await API.get('/api/brief');
    if (data.error) {
        document.getElementById('briefText').textContent = 'Error: ' + data.error;
        return;
    }

    briefData = data.brief;

    // Collect unique citation IDs (supra refs share IDs with their primary)
    const seen = new Set();
    for (const para of briefData.paragraphs) {
        for (const cite of (para.citations || [])) {
            if (!seen.has(cite.citation_id)) {
                seen.add(cite.citation_id);
                allCitationIds.push(cite.citation_id);
            }
        }
    }

    // Restore existing flags
    if (data.flags) {
        for (const f of data.flags) {
            currentFlags[f.citation_id] = f.verdict;
        }
    }

    renderBrief();
    updateReviewCount();
    startPolling();
    startTimer();
}

function renderBrief() {
    const container = document.getElementById('briefText');
    container.innerHTML = '';

    for (const para of briefData.paragraphs) {
        const div = document.createElement('div');
        div.className = `paragraph ${para.type}`;

        if (para.citations && para.citations.length > 0) {
            div.innerHTML = renderParagraphWithCitations(para);
        } else {
            div.textContent = para.text;
        }

        container.appendChild(div);
    }
}

function renderParagraphWithCitations(para) {
    const text = para.text;
    const citations = [...para.citations].sort((a, b) => a.start - b.start);

    let html = '';
    let lastEnd = 0;

    for (const cite of citations) {
        html += escapeHtml(text.slice(lastEnd, cite.start));

        const verdict = currentFlags[cite.citation_id];
        const isSelected = selectedCitation === cite.citation_id;
        const classes = ['citation'];
        if (verdict === 'fake') classes.push('flagged-fake');
        else if (verdict === 'legit') classes.push('flagged-legit');
        if (isSelected) classes.push('selected');

        html += `<span class="${classes.join(' ')}" data-cite-id="${cite.citation_id}" onclick="selectCitation('${cite.citation_id}')">${escapeHtml(cite.display_text)}</span>`;
        lastEnd = cite.end;
    }

    html += escapeHtml(text.slice(lastEnd));
    return html;
}

function selectCitation(citationId) {
    selectedCitation = citationId;
    renderBrief();
    renderSidePanel(citationId);
}

function renderSidePanel(citationId) {
    const panel = document.getElementById('sidePanel');

    // Find the primary (non-supra) citation display text
    let displayText = citationId;
    for (const para of briefData.paragraphs) {
        for (const cite of (para.citations || [])) {
            if (cite.citation_id === citationId && !cite.supra) {
                displayText = cite.display_text;
            }
        }
    }

    const verdict = currentFlags[citationId];

    let html = `<h3>Review Citation</h3>`;
    html += `<div class="citation-context"><span class="highlight">${escapeHtml(displayText)}</span></div>`;

    html += `<div class="verdict-group">
        <button class="verdict-btn legit ${verdict === 'legit' ? 'active' : ''}" onclick="flagCitation('${citationId}', 'legit')">
            Looks Legit
        </button>
        <button class="verdict-btn fake ${verdict === 'fake' ? 'active' : ''}" onclick="flagCitation('${citationId}', 'fake')">
            Flag as Fake
        </button>
    </div>`;

    if (verdict) {
        html += `<p style="text-align: center; margin-top: 0.75rem; font-size: 0.8125rem; color: var(--gray-500);">
            Current verdict: <strong>${verdict === 'fake' ? 'Flagged as Fake' : 'Marked Legit'}</strong>
        </p>`;
    }

    // Navigation
    const idx = allCitationIds.indexOf(citationId);
    html += `<div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">`;
    if (idx > 0) {
        html += `<button class="btn btn-ghost btn-sm" onclick="selectCitation('${allCitationIds[idx - 1]}')">&larr; Previous</button>`;
    } else {
        html += `<div></div>`;
    }
    if (idx < allCitationIds.length - 1) {
        html += `<button class="btn btn-ghost btn-sm" onclick="selectCitation('${allCitationIds[idx + 1]}')">Next &rarr;</button>`;
    }
    html += `</div>`;

    panel.innerHTML = html;
}

async function flagCitation(citationId, verdict) {
    const result = await API.post('/api/citation/flag', { citation_id: citationId, verdict: verdict });
    if (result.ok) {
        currentFlags[citationId] = verdict;
        renderBrief();
        renderSidePanel(citationId);
        updateReviewCount();
    }
}

function updateReviewCount() {
    const reviewed = Object.keys(currentFlags).length;
    const flagged = Object.values(currentFlags).filter(v => v === 'fake').length;
    const total = allCitationIds.length;
    document.getElementById('reviewCount').textContent = `Reviewed: ${reviewed}/${total} | Flagged: ${flagged}`;
}

// ── Timer & Polling ─────────────────────────────────────────────────────

function startTimer() {
    Timer.init('#timerDisplay');
}

function startPolling() {
    setInterval(async () => {
        try {
            const data = await API.get('/api/game/phase');
            Timer.setEnd(data.timer_end);

            if (data.team_name) {
                document.getElementById('teamBadge').textContent = data.team_name;
            }

            if (data.phase === 'reveal') {
                window.location.href = `/game/${API.gameId}`;
            }
        } catch (e) {}
    }, 2500);

    API.get('/api/game/phase').then(data => {
        Timer.setEnd(data.timer_end);
        if (data.team_name) {
            document.getElementById('teamBadge').textContent = data.team_name;
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    API.token = localStorage.getItem('session_token');
    API.gameId = localStorage.getItem('game_id');
    init();
});
