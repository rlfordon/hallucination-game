/* fabrication.js — Phase 1: Citation swapping */

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

let briefData = null;
let hallucinations = null;
let currentSwaps = {};  // citation_id -> { hallucination_type, option_id }
let selectedCitation = null;
let timerEnd = null;
let previewHighlight = null;  // { paraId, originalText } — text region to highlight in brief

async function init() {
    // Load brief
    const data = await API.get('/api/brief');
    if (data.error) {
        document.getElementById('briefText').textContent = 'Error: ' + data.error;
        return;
    }

    briefData = data.brief;
    hallucinations = data.hallucinations;

    // Restore existing swaps
    if (data.swaps) {
        for (const s of data.swaps) {
            currentSwaps[s.citation_id] = {
                hallucination_type: s.hallucination_type,
                option_id: s.option_id
            };
        }
    }

    renderBrief();
    updateSwapCount();
    startPolling();
    startTimer();
}

function renderBrief() {
    const container = document.getElementById('briefText');
    container.innerHTML = '';

    for (const para of briefData.paragraphs) {
        const div = document.createElement('div');
        div.className = `paragraph ${para.type}`;
        div.dataset.paraId = para.id;

        const highlights = getHighlightRegions(para);
        if ((para.citations && para.citations.length > 0) || highlights.length > 0) {
            div.innerHTML = renderParagraphWithCitations(para);
        } else {
            div.textContent = para.text;
        }

        container.appendChild(div);
    }
}

function renderParagraphWithCitations(para) {
    const text = para.text;
    const citations = [...(para.citations || [])].sort((a, b) => a.start - b.start);

    // Collect text regions to highlight (from preview or confirmed swaps with original_text)
    const highlights = getHighlightRegions(para);

    // Build a list of all marked ranges: citations + text highlights
    // Each range: { start, end, type: 'citation'|'highlight', ...data }
    let ranges = [];

    for (const cite of citations) {
        ranges.push({ start: cite.start, end: cite.end, type: 'citation', cite });
    }
    for (const hl of highlights) {
        ranges.push({ start: hl.start, end: hl.end, type: 'highlight' });
    }

    // Sort by start, then citations before highlights at same position
    ranges.sort((a, b) => a.start - b.start || (a.type === 'citation' ? -1 : 1));

    // Remove highlight ranges that overlap with citation ranges (citation wins)
    ranges = removeOverlaps(ranges);

    let html = '';
    let lastEnd = 0;

    for (const r of ranges) {
        // Plain text before this range
        html += escapeHtml(text.slice(lastEnd, r.start));

        if (r.type === 'citation') {
            const cite = r.cite;
            const isSwapped = currentSwaps[cite.citation_id];
            const isSelected = selectedCitation === cite.citation_id;
            const classes = ['citation'];
            if (isSwapped) classes.push('swapped');
            if (isSelected) classes.push('selected');
            html += `<span class="${classes.join(' ')}" data-cite-id="${cite.citation_id}" onclick="selectCitation('${cite.citation_id}')">${escapeHtml(text.slice(r.start, r.end))}</span>`;
        } else {
            html += `<span class="text-highlight">${escapeHtml(text.slice(r.start, r.end))}</span>`;
        }

        lastEnd = r.end;
    }

    // Remaining text
    html += escapeHtml(text.slice(lastEnd));
    return html;
}

function getHighlightRegions(para) {
    const regions = [];

    // 1. Active preview highlight — search by text content, not just paraId
    if (previewHighlight) {
        const idx = para.text.indexOf(previewHighlight.originalText);
        if (idx >= 0) {
            regions.push({ start: idx, end: idx + previewHighlight.originalText.length });
        }
    }

    // 2. Confirmed swaps that have original_text (mischaracterization/misquotation)
    //    The original_text may be in a different paragraph than the citation itself,
    //    so we check all confirmed swaps against every paragraph.
    for (const [citationId, swap] of Object.entries(currentSwaps)) {
        const opt = getOptionData(citationId, swap.hallucination_type, swap.option_id);
        if (opt && opt.original_text) {
            const idx = para.text.indexOf(opt.original_text);
            if (idx >= 0) {
                regions.push({ start: idx, end: idx + opt.original_text.length });
            }
        }
    }

    return regions;
}

function getOptionData(citationId, type, optionId) {
    const citeData = hallucinations[citationId];
    if (!citeData) return null;
    const options = citeData.options[type] || [];
    return options.find(o => o.id === optionId) || null;
}

function removeOverlaps(ranges) {
    // Remove highlight ranges that overlap with any citation range
    const citationRanges = ranges.filter(r => r.type === 'citation');
    return ranges.filter(r => {
        if (r.type === 'citation') return true;
        // Keep highlight only if it doesn't overlap any citation
        return !citationRanges.some(c => r.start < c.end && r.end > c.start);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function selectCitation(citationId) {
    selectedCitation = citationId;
    previewHighlight = null;
    renderBrief();
    renderSidePanel(citationId);

    // Scroll citation into view
    const el = document.querySelector(`[data-cite-id="${citationId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderSidePanel(citationId) {
    const panel = document.getElementById('sidePanel');
    const citeData = hallucinations[citationId];

    if (!citeData) {
        panel.innerHTML = '<div class="empty-state">No options available for this citation</div>';
        return;
    }

    const existing = currentSwaps[citationId];

    let html = `<h3>Swap Citation</h3>`;
    html += `<div class="citation-context"><span class="highlight">${escapeHtml(citeData.original_display)}</span></div>`;
    html += `<p style="font-size: 0.8125rem; color: var(--gray-500); margin-bottom: 0.75rem;">${escapeHtml(citeData.case_name)}</p>`;

    // Type selector
    html += `<div class="form-group">
        <label>Hallucination Type</label>
        <select id="typeSelect" onchange="onTypeChange('${citationId}')">
            <option value="">Choose a type...</option>`;

    const typeLabels = {
        fabricated_case: 'Fabricated Case',
        wrong_citation: 'Wrong Citation',
        mischaracterization: 'Mischaracterization',
        misquotation: 'Misquotation'
    };

    for (const [type, options] of Object.entries(citeData.options)) {
        if (options.length > 0) {
            const selected = existing && existing.hallucination_type === type ? ' selected' : '';
            html += `<option value="${type}"${selected}>${typeLabels[type] || type} (${options.length})</option>`;
        }
    }

    html += `</select></div>`;
    html += `<div id="optionsContainer"></div>`;

    // Undo button if swapped
    if (existing) {
        html += `<button class="btn btn-ghost btn-block mt-2" onclick="undoSwap('${citationId}')">Undo Swap</button>`;
    }

    panel.innerHTML = html;

    // If there's an existing swap, show its options
    if (existing) {
        renderOptions(citationId, existing.hallucination_type);
    }
}

function onTypeChange(citationId) {
    const type = document.getElementById('typeSelect').value;
    if (type) {
        renderOptions(citationId, type);
    } else {
        document.getElementById('optionsContainer').innerHTML = '';
    }
}

function renderOptions(citationId, type) {
    const citeData = hallucinations[citationId];
    const options = citeData.options[type] || [];
    const existing = currentSwaps[citationId];

    let html = '<div class="option-group">';
    for (const opt of options) {
        const isSelected = existing && existing.option_id === opt.id;
        const diffClass = opt.difficulty === 'hard' ? 'difficulty-hard' : 'difficulty-medium';

        const preview = opt.replacement_citation || opt.replacement_text || '';

        html += `
            <div class="option-item ${isSelected ? 'selected' : ''}" onclick="selectOption('${citationId}', '${type}', '${opt.id}')">
                <input type="radio" name="opt_${citationId}" ${isSelected ? 'checked' : ''}>
                <div class="option-label">
                    ${escapeHtml(opt.label)}
                    <span class="difficulty ${diffClass}">${opt.difficulty}</span>
                    ${preview ? `<div class="option-preview">${escapeHtml(preview)}</div>` : ''}
                </div>
            </div>`;
    }
    html += '</div>';

    // Confirm button
    html += `<button class="btn btn-primary btn-block" id="confirmBtn" onclick="confirmSwap('${citationId}')">Confirm Swap</button>`;

    document.getElementById('optionsContainer').innerHTML = html;
}

let pendingOption = null;

function selectOption(citationId, type, optionId) {
    pendingOption = { citationId, type, optionId };

    // Update type selector
    const typeSelect = document.getElementById('typeSelect');
    if (typeSelect) typeSelect.value = type;

    // Update visual selection
    document.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    event.currentTarget.querySelector('input[type="radio"]').checked = true;

    // Set preview highlight if this option has original_text
    const opt = getOptionData(citationId, type, optionId);
    if (opt && opt.original_text) {
        previewHighlight = { originalText: opt.original_text };
    } else {
        previewHighlight = null;
    }
    renderBrief();
}

async function confirmSwap(citationId) {
    // Get selected option
    const typeSelect = document.getElementById('typeSelect');
    const type = typeSelect ? typeSelect.value : '';

    if (!type) return;

    const citeData = hallucinations[citationId];
    const options = citeData.options[type] || [];
    const selectedRadio = document.querySelector(`input[name="opt_${citationId}"]:checked`);

    let optionId;
    if (pendingOption && pendingOption.citationId === citationId) {
        optionId = pendingOption.optionId;
    } else if (selectedRadio) {
        const optionItem = selectedRadio.closest('.option-item');
        const idx = [...document.querySelectorAll('.option-item')].indexOf(optionItem);
        optionId = options[idx]?.id;
    }

    if (!optionId) return;

    const result = await API.post('/api/citation/swap', {
        citation_id: citationId,
        hallucination_type: type,
        option_id: optionId
    });

    if (result.ok) {
        currentSwaps[citationId] = { hallucination_type: type, option_id: optionId };
        pendingOption = null;
        previewHighlight = null;
        renderBrief();
        renderSidePanel(citationId);
        updateSwapCount();
    }
}

async function undoSwap(citationId) {
    const result = await API.post('/api/citation/unswap', { citation_id: citationId });
    if (result.ok) {
        delete currentSwaps[citationId];
        pendingOption = null;
        previewHighlight = null;
        renderBrief();
        renderSidePanel(citationId);
        updateSwapCount();
    }
}

function updateSwapCount() {
    const count = Object.keys(currentSwaps).length;
    const total = Object.keys(hallucinations).length;
    const el = document.getElementById('swapCount');
    el.textContent = `${count} of ${total} altered — target: 6-12`;
}

// ── Timer & Polling ─────────────────────────────────────────────────────

function startTimer() {
    setInterval(updateTimer, 1000);
}

function updateTimer() {
    const el = document.getElementById('timerDisplay');
    if (!timerEnd) return;

    const now = new Date();
    const end = new Date(timerEnd);
    const diff = Math.max(0, Math.floor((end - now) / 1000));

    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    el.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    el.classList.toggle('warning', diff < 60);
}

function startPolling() {
    setInterval(async () => {
        try {
            const data = await API.get('/api/game/phase');
            timerEnd = data.timer_end;

            if (data.team_name) {
                document.getElementById('teamBadge').textContent = data.team_name;
            }

            if (data.phase === 'verification') {
                window.location.href = `/game/${API.gameId}`;
            }
        } catch (e) {}
    }, 2500);

    // Initial phase fetch
    API.get('/api/game/phase').then(data => {
        timerEnd = data.timer_end;
        if (data.team_name) {
            document.getElementById('teamBadge').textContent = data.team_name;
        }
    });
}

// Init
document.addEventListener('DOMContentLoaded', init);
