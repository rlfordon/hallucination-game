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

let gameMode = 'multiplayer';
let scoreboardData = null;

async function init() {
    const data = await API.get('/api/scoreboard');
    if (data.error) {
        document.getElementById('scoresGrid').textContent = 'Error: ' + data.error;
        return;
    }

    scoreboardData = data;
    gameMode = data.mode || 'multiplayer';

    if (gameMode === 'solitaire') {
        document.querySelector('#scoreboardApp > h2').textContent = 'Your Results';
        renderSolitaireScores(data.scores);
        renderTypeStats(data.type_stats);
        renderSolitaireDetails(data.scores);
        autoLoadSolitaireBrief(data.scores);
    } else {
        renderScores(data.scores);
        renderTypeStats(data.type_stats);
        renderDetails(data.scores);
        initAnnotatedBriefSection(data.scores);
    }

    document.getElementById('downloadReportArea').style.display = '';
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

// ── Solitaire Rendering ─────────────────────────────────────────────

function renderSolitaireScores(scores) {
    const grid = document.getElementById('scoresGrid');
    const team = Object.values(scores)[0];
    if (!team) { grid.innerHTML = ''; return; }

    grid.innerHTML = `
        <div class="score-card" style="border-color: var(--accent); border-width: 2px;">
            <h3>Verification Score</h3>
            <div class="score-total">${team.verification_score}</div>
            <div style="font-size: 0.8125rem; color: var(--gray-500);">
                ${team.flags_made} citations flagged
            </div>
        </div>
    `;
}

function renderSolitaireDetails(scores) {
    const container = document.getElementById('detailsSection');
    const team = Object.values(scores)[0];
    if (!team || team.verification_details.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <div class="score-card mb-2">
            <h3>Citation-by-Citation Results</h3>
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
        <div class="text-center mt-2">
            <a href="/" class="btn btn-primary">Play Again</a>
        </div>
    `;

    container.innerHTML = html;
}

async function autoLoadSolitaireBrief(scores) {
    const section = document.getElementById('annotatedBriefSection');
    if (!section) return;

    const teams = Object.entries(scores);
    if (teams.length === 0) return;

    const [teamId, teamData] = teams[0];

    section.style.display = '';
    // Hide the team dropdown for solitaire
    const formGroup = document.querySelector('#annotatedBriefSection .form-group');
    if (formGroup) formGroup.style.display = 'none';

    const data = await ReviewBrief.loadReviewBrief(teamId, API.headers());
    if (data.error) return;

    abBriefData = data.brief;
    abAnnotations = data.annotations;

    const info = document.getElementById('briefTeamInfo');
    info.textContent = 'Annotated brief showing all hallucinations';

    ReviewBrief.setClickCallback(function (citationId) {
        ReviewBrief.renderAnnotationPanel(
            document.getElementById('annotationPanel'),
            citationId, abAnnotations, abBriefData, true
        );
    });

    const container = document.getElementById('annotatedBriefContainer');
    container.classList.remove('hidden');
    ReviewBrief.renderAnnotatedBrief(
        document.getElementById('annotatedBriefText'),
        abBriefData, abAnnotations, true
    );
    document.getElementById('annotationPanel').innerHTML =
        '<div class="empty-state">Select a highlighted citation to see details</div>';
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

// ── Report Download ──────────────────────────────────────────────────

const REPORT_CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a2e; background: #fff; padding: 2rem; max-width: 960px; margin: 0 auto; line-height: 1.5; }
h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
h2 { font-size: 1.25rem; margin: 2rem 0 1rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
h3 { font-size: 1.05rem; margin: 1.25rem 0 0.75rem; }
.meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 0.25rem; }
.card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; }
table { width: 100%; border-collapse: collapse; font-size: 0.875rem; margin-bottom: 1rem; }
th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
th { background: #f9fafb; font-weight: 600; }
.badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
.badge-fab { background: #ede9fe; color: #7c3aed; }
.badge-wc { background: #dbeafe; color: #2563eb; }
.badge-mc { background: #fef3c7; color: #d97706; }
.badge-mq { background: #fce7f3; color: #db2777; }
.correct { color: #16a34a; font-weight: 600; }
.incorrect { color: #dc2626; font-weight: 600; }
.skip { color: #9ca3af; }
.score-big { font-size: 2rem; font-weight: 700; color: #7c3aed; }
.stat-bar { margin-bottom: 0.75rem; }
.stat-bar-label { display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 0.25rem; }
.stat-bar-track { height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden; }
.stat-bar-fill { height: 100%; border-radius: 4px; }
.brief-section { margin-top: 1.5rem; page-break-before: always; }
.paragraph { margin-bottom: 0.75rem; font-size: 0.9rem; }
.paragraph.heading { font-weight: 700; font-size: 1rem; margin-top: 1.25rem; }
.paragraph.block_quote { margin-left: 2rem; padding-left: 0.75rem; border-left: 3px solid #d1d5db; font-style: italic; }
.paragraph.footnote { font-size: 0.8rem; color: #4b5563; border-top: 1px solid #e5e7eb; padding-top: 0.5rem; margin-top: 1rem; }
.paragraph.caption { font-size: 0.8rem; color: #6b7280; font-style: italic; }
.paragraph.signature { font-style: italic; color: #6b7280; margin-top: 1.5rem; }
.cite { padding: 1px 2px; border-radius: 3px; }
.cite-fab { background: #ede9fe; }
.cite-wc { background: #dbeafe; }
.cite-mc { background: #fef3c7; }
.cite-mq { background: #fce7f3; }
.cite-caught { border-bottom: 2px solid #16a34a; }
.cite-missed { border-bottom: 2px solid #dc2626; }
.annotation-card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 0.75rem; margin-bottom: 0.75rem; font-size: 0.8125rem; }
.annotation-card .label-text { color: #4b5563; margin: 0.5rem 0; }
.diff-block { padding: 0.5rem; border-radius: 4px; margin: 0.25rem 0; font-size: 0.8125rem; white-space: pre-wrap; }
.diff-original { background: #f0fdf4; border: 1px solid #bbf7d0; }
.diff-replacement { background: #fef2f2; border: 1px solid #fecaca; }
.verdict-caught { color: #16a34a; font-weight: 600; }
.verdict-missed { color: #dc2626; font-weight: 600; }
@media print {
    body { padding: 0.5rem; }
    .brief-section { page-break-before: always; }
    .card { break-inside: avoid; }
    .annotation-card { break-inside: avoid; }
}
`;

function reportEscape(text) {
    if (!text) return '';
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function downloadReport() {
    const btn = document.getElementById('downloadReportBtn');
    btn.disabled = true;
    btn.textContent = 'Generating…';

    try {
        // Fetch game status for game_code
        const status = await API.get('/api/game/status');
        const gameCode = status.game_code || '';

        // Fetch review briefs for all teams
        const teamEntries = Object.entries(scoreboardData.scores);
        const reviewBriefs = {};
        const results = await Promise.all(
            teamEntries.map(([tid]) => ReviewBrief.loadReviewBrief(tid, API.headers()))
        );
        for (let i = 0; i < teamEntries.length; i++) {
            if (!results[i].error) {
                reviewBriefs[teamEntries[i][0]] = results[i];
            }
        }

        // Extract brief metadata from first successful response
        const firstReview = Object.values(reviewBriefs)[0];
        const briefMeta = firstReview ? {
            title: firstReview.brief.title || '',
            case_name: firstReview.brief.case_name || '',
            court: firstReview.brief.court || '',
        } : {};

        const html = buildReportHtml(scoreboardData, briefMeta, gameCode, reviewBriefs);
        const filename = gameMode === 'solitaire'
            ? 'hallucination-game-results.html'
            : `hallucination-game-${gameCode || 'report'}.html`;
        triggerDownload(html, filename);
    } catch (e) {
        console.error('Report generation failed:', e);
        alert('Failed to generate report. See console for details.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Download Report';
    }
}

function buildReportHtml(data, briefMeta, gameCode, reviewBriefs) {
    const isSolitaire = data.mode === 'solitaire';
    const title = isSolitaire ? 'Solitaire Results' : `Game Report — ${gameCode}`;

    let body = '';
    body += buildMetadataSection(briefMeta, gameCode, data.mode);
    body += buildScoresSection(data.scores, isSolitaire);
    body += buildTypeStatsSection(data.type_stats);
    body += buildDetailsSection(data.scores, isSolitaire);
    body += buildAnnotatedBriefsSection(data.scores, reviewBriefs, isSolitaire);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${reportEscape(title)}</title>
<style>${REPORT_CSS}</style>
</head>
<body>
<h1>Citation Hallucination Game</h1>
<p class="meta">${reportEscape(title)}</p>
${body}
</body>
</html>`;
}

function buildMetadataSection(briefMeta, gameCode, mode) {
    let html = '<div class="card" style="margin-top:1rem;">';
    if (briefMeta.title) html += `<div><strong>Brief:</strong> ${reportEscape(briefMeta.title)}</div>`;
    if (briefMeta.case_name) html += `<div><strong>Case:</strong> ${reportEscape(briefMeta.case_name)}</div>`;
    if (briefMeta.court) html += `<div><strong>Court:</strong> ${reportEscape(briefMeta.court)}</div>`;
    if (mode !== 'solitaire' && gameCode) html += `<div><strong>Game Code:</strong> ${reportEscape(gameCode)}</div>`;
    html += `<div><strong>Mode:</strong> ${mode === 'solitaire' ? 'Solo Practice' : 'Team Game'}</div>`;
    html += `<div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>`;
    html += '</div>';
    return html;
}

function buildScoresSection(scores, isSolitaire) {
    let html = '<h2>Scores</h2>';

    if (isSolitaire) {
        const team = Object.values(scores)[0];
        if (!team) return html;
        html += `<div class="card">
            <div class="score-big">${team.verification_score}</div>
            <div class="meta">${team.flags_made} citations flagged</div>
        </div>`;
        return html;
    }

    const sorted = Object.entries(scores).sort((a, b) => b[1].total_score - a[1].total_score);
    html += '<table><thead><tr><th>Rank</th><th>Team</th><th>Fabrication</th><th>Verification</th><th>Total</th></tr></thead><tbody>';
    sorted.forEach(([tid, team], idx) => {
        html += `<tr>
            <td>${idx + 1}</td>
            <td>${reportEscape(team.team_name)}${idx === 0 ? ' (Winner)' : ''}</td>
            <td>${team.fabrication_score}</td>
            <td>${team.verification_score}</td>
            <td><strong>${team.total_score}</strong></td>
        </tr>`;
    });
    html += '</tbody></table>';
    return html;
}

function buildTypeStatsSection(typeStats) {
    if (!typeStats || Object.keys(typeStats).length === 0) return '';

    let html = '<h2>Detection Rates by Type</h2>';
    for (const [type, stats] of Object.entries(typeStats)) {
        const label = TYPE_LABELS[type] || type;
        const color = TYPE_COLORS[type] || '#6b7280';
        html += `<div class="stat-bar">
            <div class="stat-bar-label"><span>${reportEscape(label)}</span><span>${stats.detection_rate}% caught (${stats.caught}/${stats.total})</span></div>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${stats.detection_rate}%;background:${color};"></div></div>
        </div>`;
    }
    return html;
}

function buildDetailsSection(scores, isSolitaire) {
    let html = '<h2>Detailed Results</h2>';

    for (const [tid, team] of Object.entries(scores)) {
        // Fabrication details (multiplayer only)
        if (!isSolitaire && team.fabrication_details && team.fabrication_details.length > 0) {
            html += `<h3>${reportEscape(team.team_name)} — Fabrication</h3>`;
            html += '<table><thead><tr><th>Citation</th><th>Type</th><th>Result</th><th>Points</th></tr></thead><tbody>';
            for (const d of team.fabrication_details) {
                const badgeClass = TYPE_BADGE[d.hallucination_type] || '';
                const typeLabel = TYPE_LABELS[d.hallucination_type] || d.hallucination_type;
                html += `<tr>
                    <td>${reportEscape(d.citation_id)}</td>
                    <td><span class="badge ${badgeClass}">${reportEscape(typeLabel)}</span></td>
                    <td class="${d.caught ? 'incorrect' : 'correct'}">${d.caught ? 'Caught' : 'Undetected'}</td>
                    <td>${d.points > 0 ? '+' : ''}${d.points}</td>
                </tr>`;
            }
            html += '</tbody></table>';
        }

        // Verification details
        if (team.verification_details && team.verification_details.length > 0) {
            const heading = isSolitaire ? 'Citation-by-Citation Results' : `${reportEscape(team.team_name)} — Verification`;
            html += `<h3>${heading}</h3>`;
            html += '<table><thead><tr><th>Citation</th><th>Actually</th><th>Your Verdict</th><th>Points</th></tr></thead><tbody>';
            for (const d of team.verification_details) {
                let verdictClass = 'skip';
                if (d.verdict === 'fake' && d.is_fake) verdictClass = 'correct';
                else if (d.verdict === 'fake' && !d.is_fake) verdictClass = 'incorrect';
                else if (d.verdict === 'legit' && !d.is_fake) verdictClass = 'correct';
                else if (d.verdict === 'legit' && d.is_fake) verdictClass = 'incorrect';

                html += `<tr>
                    <td>${reportEscape(d.citation_id)}</td>
                    <td>${d.is_fake ? '<span style="color:#dc2626;">Altered</span>' : '<span style="color:#16a34a;">Original</span>'}</td>
                    <td class="${verdictClass}">${d.verdict === 'fake' ? 'Flagged' : d.verdict === 'legit' ? 'Legit' : 'Skipped'}</td>
                    <td>${d.points > 0 ? '+' : ''}${d.points}</td>
                </tr>`;
            }
            html += '</tbody></table>';
        }
    }

    return html;
}

function buildAnnotatedBriefsSection(scores, reviewBriefs, isSolitaire) {
    const teamEntries = Object.entries(scores);
    if (teamEntries.length === 0 || Object.keys(reviewBriefs).length === 0) return '';

    let html = '';

    for (const [tid, team] of teamEntries) {
        const rb = reviewBriefs[tid];
        if (!rb) continue;

        html += '<div class="brief-section">';
        if (isSolitaire) {
            html += '<h2>Annotated Brief</h2>';
        } else {
            html += `<h2>Annotated Brief — Fabricated by ${reportEscape(rb.fab_team_name)}</h2>`;
            if (rb.ver_team_name) {
                html += `<p class="meta">Verified by: ${reportEscape(rb.ver_team_name)}</p>`;
            }
        }

        // Render brief paragraphs
        for (const para of rb.brief.paragraphs) {
            html += renderParagraphToString(para, rb.annotations);
        }

        // Render annotation details
        html += renderAnnotationDetailsToString(rb.annotations, rb.brief);

        html += '</div>';
    }

    return html;
}

function renderParagraphToString(para, annotations) {
    const typeCSS = {
        fabricated_case: 'cite-fab',
        wrong_citation: 'cite-wc',
        mischaracterization: 'cite-mc',
        misquotation: 'cite-mq'
    };

    let inner = '';
    if (para.citations && para.citations.length > 0) {
        const text = para.text;
        const sorted = [...para.citations].sort((a, b) => a.start - b.start);
        let lastEnd = 0;

        for (const cite of sorted) {
            inner += reportEscape(text.slice(lastEnd, cite.start));
            const ann = annotations[cite.citation_id];
            const classes = ['cite'];
            if (ann && ann.hallucination_type) {
                classes.push(typeCSS[ann.hallucination_type] || '');
                if (ann.caught === true) classes.push('cite-caught');
                else if (ann.caught === false) classes.push('cite-missed');
            }
            inner += `<span class="${classes.join(' ')}">${reportEscape(cite.display_text)}</span>`;
            lastEnd = cite.end;
        }
        inner += reportEscape(text.slice(lastEnd));
    } else {
        inner = reportEscape(para.text);
    }

    return `<div class="paragraph ${para.type || ''}">${inner}</div>`;
}

function renderAnnotationDetailsToString(annotations, briefData) {
    const swapped = Object.entries(annotations).filter(([, a]) => a.hallucination_type);
    if (swapped.length === 0) return '';

    let html = '<h3>Hallucination Details</h3>';

    for (const [citationId, ann] of swapped) {
        // Find display text
        let displayText = citationId;
        for (const para of briefData.paragraphs) {
            for (const cite of (para.citations || [])) {
                if (cite.citation_id === citationId) {
                    displayText = cite.display_text;
                    break;
                }
            }
        }

        const badgeClass = TYPE_BADGE[ann.hallucination_type] || '';
        const typeLabel = TYPE_LABELS[ann.hallucination_type] || ann.hallucination_type;

        html += '<div class="annotation-card">';
        html += `<span class="badge ${badgeClass}">${reportEscape(typeLabel)}</span> `;
        html += `<strong>${reportEscape(displayText)}</strong>`;

        if (ann.option_label) {
            html += `<div class="label-text">${reportEscape(ann.option_label)}</div>`;
        }

        if (ann.replacement_citation) {
            html += `<div style="margin-top:0.5rem;"><strong>Original:</strong></div>`;
            html += `<div class="diff-block diff-original">${reportEscape(ann.original_display)}</div>`;
            html += `<div><strong>Replacement:</strong></div>`;
            html += `<div class="diff-block diff-replacement">${reportEscape(ann.replacement_citation)}</div>`;
        } else if (ann.original_text && ann.replacement_text) {
            html += `<div style="margin-top:0.5rem;"><strong>Original text:</strong></div>`;
            html += `<div class="diff-block diff-original">${reportEscape(ann.original_text)}</div>`;
            html += `<div><strong>Replacement text:</strong></div>`;
            html += `<div class="diff-block diff-replacement">${reportEscape(ann.replacement_text)}</div>`;
        }

        if (ann.caught === true) {
            html += `<div class="verdict-caught" style="margin-top:0.5rem;">Caught</div>`;
        } else if (ann.caught === false) {
            html += `<div class="verdict-missed" style="margin-top:0.5rem;">Missed</div>`;
        }

        html += '</div>';
    }

    return html;
}

function triggerDownload(htmlString, filename) {
    const blob = new Blob([htmlString], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
    // Professor stores credentials under different keys than students.
    // Try student keys first, fall back to professor keys.
    API.token = localStorage.getItem('session_token') || localStorage.getItem('prof_session_token');
    API.gameId = localStorage.getItem('game_id') || localStorage.getItem('prof_game_id');
    init();
});
