/* scoreboard.js — Phase 3: Results & scores */
/* Depends on: common.js (API, escapeHtml), review-brief.js (ReviewBrief) */

const TYPE_LABELS = {
    fabricated_case: 'Fabricated Case',
    wrong_citation: 'Wrong Citation',
    mischaracterization: 'Mischaracterization',
    misquotation: 'Misquotation'
};

const TYPE_BADGE = {
    fabricated_case: 'badge-fab',
    wrong_citation: 'badge-wc',
    mischaracterization: 'badge-mc',
    misquotation: 'badge-mq'
};

const TYPE_COLORS = {
    fabricated_case: '#7c3aed',
    wrong_citation: '#2563eb',
    mischaracterization: '#d97706',
    misquotation: '#db2777'
};

async function init() {
    const data = await API.get('/api/scoreboard');
    if (data.error) {
        document.getElementById('scoresGrid').textContent = 'Error: ' + data.error;
        return;
    }

    renderScores(data.scores);
    renderTypeStats(data.type_stats);
    renderDetails(data.scores);
    initAnnotatedBriefSection(data.scores);
}

function renderScores(scores) {
    const grid = document.getElementById('scoresGrid');

    // Sort teams by total score descending
    const sorted = Object.entries(scores).sort((a, b) => b[1].total_score - a[1].total_score);

    grid.innerHTML = sorted.map(([tid, team], idx) => `
        <div class="score-card" ${idx === 0 ? 'style="border-color: var(--accent); border-width: 2px;"' : ''}>
            <h3>${team.team_name} ${idx === 0 ? '(Winner)' : ''}</h3>
            <div class="score-total">${team.total_score}</div>
            <div class="score-breakdown">
                <div>Fabrication: <span>${team.fabrication_score}</span></div>
                <div>Verification: <span>${team.verification_score}</span></div>
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.75rem; color: var(--gray-400);">
                ${team.swaps_made} swaps made | ${team.flags_made} flags raised
            </div>
        </div>
    `).join('');
}

function renderTypeStats(typeStats) {
    const container = document.getElementById('typeStats');
    if (!typeStats || Object.keys(typeStats).length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<h3>Detection Rates by Hallucination Type</h3>';

    for (const [type, stats] of Object.entries(typeStats)) {
        const label = TYPE_LABELS[type] || type;
        const color = TYPE_COLORS[type] || '#6b7280';
        const rate = stats.detection_rate;

        html += `
            <div class="stat-bar">
                <div class="stat-bar-label">
                    <span>${label}</span>
                    <span>${rate}% caught (${stats.caught}/${stats.total})</span>
                </div>
                <div class="stat-bar-track">
                    <div class="stat-bar-fill" style="width: ${rate}%; background: ${color};"></div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderDetails(scores) {
    const container = document.getElementById('detailsSection');

    let html = '';

    for (const [tid, team] of Object.entries(scores)) {
        // Fabrication details
        if (team.fabrication_details.length > 0) {
            html += `
                <div class="score-card mb-2">
                    <h3>${team.team_name} — Fabrication Details</h3>
                    <table class="detail-table">
                        <thead>
                            <tr><th>Citation</th><th>Type</th><th>Result</th><th>Points</th></tr>
                        </thead>
                        <tbody>
                            ${team.fabrication_details.map(d => `
                                <tr>
                                    <td>${d.citation_id}</td>
                                    <td><span class="badge ${TYPE_BADGE[d.hallucination_type] || ''}">${TYPE_LABELS[d.hallucination_type] || d.hallucination_type}</span></td>
                                    <td class="${d.caught ? 'incorrect' : 'correct'}">${d.caught ? 'Caught' : 'Undetected'}</td>
                                    <td>${d.points > 0 ? '+' : ''}${d.points}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }

        // Verification details
        if (team.verification_details.length > 0) {
            html += `
                <div class="score-card mb-2">
                    <h3>${team.team_name} — Verification Details</h3>
                    <table class="detail-table">
                        <thead>
                            <tr><th>Citation</th><th>Actually</th><th>Your Verdict</th><th>Points</th></tr>
                        </thead>
                        <tbody>
                            ${team.verification_details.map(d => {
                                let verdictClass = 'skip';
                                if (d.verdict === 'fake' && d.is_fake) verdictClass = 'correct';
                                else if (d.verdict === 'fake' && !d.is_fake) verdictClass = 'incorrect';
                                else if (d.verdict === 'legit' && !d.is_fake) verdictClass = 'correct';
                                else if (d.verdict === 'legit' && d.is_fake) verdictClass = 'incorrect';

                                return `<tr>
                                    <td>${d.citation_id}</td>
                                    <td>${d.is_fake ? '<span style="color:var(--red);">Altered</span>' : '<span style="color:var(--green);">Original</span>'}</td>
                                    <td class="${verdictClass}">${d.verdict === 'fake' ? 'Flagged' : d.verdict === 'legit' ? 'Legit' : 'Skipped'}</td>
                                    <td>${d.points > 0 ? '+' : ''}${d.points}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
    }

    container.innerHTML = html;
}

// ── Annotated Brief Review ──────────────────────────────────────────

let abBriefData = null;
let abAnnotations = null;

function initAnnotatedBriefSection(scores) {
    const section = document.getElementById('annotatedBriefSection');
    if (!section) return;

    const select = document.getElementById('briefTeamSelect');
    const teams = Object.entries(scores);
    if (teams.length === 0) return;

    select.innerHTML = '<option value="">Choose a team...</option>' +
        teams.map(([tid, t]) => `<option value="${tid}">${t.team_name}</option>`).join('');

    section.style.display = '';
}

async function loadAnnotatedBrief() {
    const teamId = document.getElementById('briefTeamSelect').value;
    const container = document.getElementById('annotatedBriefContainer');
    if (!teamId) {
        container.classList.add('hidden');
        return;
    }

    const data = await ReviewBrief.loadReviewBrief(teamId, API.headers());
    if (data.error) {
        container.classList.remove('hidden');
        document.getElementById('annotatedBriefText').textContent = 'Error: ' + data.error;
        return;
    }

    abBriefData = data.brief;
    abAnnotations = data.annotations;

    // Show team info
    const info = document.getElementById('briefTeamInfo');
    let infoText = `Fabricated by: ${data.fab_team_name}`;
    if (data.ver_team_name) infoText += ` | Verified by: ${data.ver_team_name}`;
    info.textContent = infoText;

    ReviewBrief.setClickCallback(function (citationId) {
        ReviewBrief.renderAnnotationPanel(
            document.getElementById('annotationPanel'),
            citationId, abAnnotations, abBriefData, true
        );
    });

    container.classList.remove('hidden');
    ReviewBrief.renderAnnotatedBrief(
        document.getElementById('annotatedBriefText'),
        abBriefData, abAnnotations,
        true
    );
    document.getElementById('annotationPanel').innerHTML =
        '<div class="empty-state">Select a highlighted citation to see details</div>';
}

document.addEventListener('DOMContentLoaded', init);
