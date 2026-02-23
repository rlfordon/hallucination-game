/* review-brief.js — Shared annotated brief renderer for professor & scoreboard */

const ReviewBrief = (function () {

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

    const TYPE_CSS = {
        fabricated_case: 'type-fab',
        wrong_citation: 'type-wc',
        mischaracterization: 'type-mc',
        misquotation: 'type-mq'
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Fetch annotated brief data from the API.
     * @param {string} fabTeamId - The fabricating team's ID
     * @param {object} apiHeaders - Headers including auth token
     * @returns {Promise<object>} - { brief, annotations, fab_team_name, ver_team_name }
     */
    async function loadReviewBrief(fabTeamId, apiHeaders) {
        const res = await fetch(`/api/game/review-brief?fab_team_id=${encodeURIComponent(fabTeamId)}`, {
            headers: apiHeaders
        });
        return res.json();
    }

    /**
     * Render the annotated brief into a container.
     * @param {HTMLElement} container - The brief text container
     * @param {object} briefData - The brief object with paragraphs
     * @param {object} annotations - Keyed by citation_id
     * @param {function} onCitationClick - Callback when a citation is clicked
     */
    function renderAnnotatedBrief(container, briefData, annotations, onCitationClick) {
        container.innerHTML = '';

        for (const para of briefData.paragraphs) {
            const div = document.createElement('div');
            div.className = `paragraph ${para.type}`;

            if (para.citations && para.citations.length > 0) {
                div.innerHTML = renderParagraphWithCitations(para, annotations, onCitationClick);
            } else {
                div.textContent = para.text;
            }

            container.appendChild(div);
        }
    }

    function renderParagraphWithCitations(para, annotations, onCitationClick) {
        const text = para.text;
        const citations = [...para.citations].sort((a, b) => a.start - b.start);

        let html = '';
        let lastEnd = 0;

        for (const cite of citations) {
            html += escapeHtml(text.slice(lastEnd, cite.start));

            const ann = annotations[cite.citation_id];
            const classes = ['citation'];

            if (ann && ann.hallucination_type) {
                classes.push(TYPE_CSS[ann.hallucination_type] || '');
                if (ann.caught === true) classes.push('was-caught');
                else if (ann.caught === false) classes.push('was-missed');
            }

            const clickAttr = onCitationClick
                ? `onclick="ReviewBrief._onCiteClick('${cite.citation_id}')" style="cursor:pointer;"`
                : '';

            html += `<span class="${classes.join(' ')}" data-cite-id="${cite.citation_id}" ${clickAttr}>${escapeHtml(cite.display_text)}</span>`;
            lastEnd = cite.end;
        }

        html += escapeHtml(text.slice(lastEnd));
        return html;
    }

    // Internal click handler bridge
    let _clickCallback = null;
    function _onCiteClick(citationId) {
        if (_clickCallback) _clickCallback(citationId);
    }

    /**
     * Render the annotation detail panel for a selected citation.
     * @param {HTMLElement} panel - The side panel container
     * @param {string} citationId - Selected citation ID
     * @param {object} annotations - Full annotations dict
     * @param {object} briefData - Brief data (to find display text)
     * @param {boolean} showVerdicts - Whether to show caught/missed status
     */
    function renderAnnotationPanel(panel, citationId, annotations, briefData, showVerdicts) {
        if (!citationId) {
            panel.innerHTML = '<div class="empty-state">Select a highlighted citation to see details</div>';
            return;
        }

        const ann = annotations[citationId];

        // Find display text for this citation
        let displayText = citationId;
        for (const para of briefData.paragraphs) {
            for (const cite of (para.citations || [])) {
                if (cite.citation_id === citationId) {
                    displayText = cite.display_text;
                    break;
                }
            }
        }

        let html = '<h3>Citation Details</h3>';

        if (!ann || !ann.hallucination_type) {
            html += `<div class="citation-context">${escapeHtml(displayText)}</div>`;
            html += `<p style="color: var(--gray-400); font-size: 0.8125rem;">This citation was not altered.</p>`;
            panel.innerHTML = html;
            return;
        }

        // Type badge
        const typeLabel = TYPE_LABELS[ann.hallucination_type] || ann.hallucination_type;
        const badgeClass = TYPE_BADGE[ann.hallucination_type] || '';
        html += `<div style="margin-bottom: 0.75rem;">
            <span class="badge ${badgeClass}">${escapeHtml(typeLabel)}</span>
        </div>`;

        // Option label
        if (ann.option_label) {
            html += `<p style="font-size: 0.8125rem; color: var(--gray-600); margin-bottom: 1rem;">${escapeHtml(ann.option_label)}</p>`;
        }

        // Original vs replacement
        if (ann.replacement_citation) {
            html += `<div style="margin-bottom: 1rem;">
                <label>Original Citation</label>
                <div class="citation-context">${escapeHtml(ann.original_display)}</div>
                <label style="margin-top: 0.5rem;">Replacement</label>
                <div class="citation-context" style="border-color: var(--red); background: var(--red-light);">${escapeHtml(ann.replacement_citation)}</div>
            </div>`;
        } else if (ann.original_text && ann.replacement_text) {
            html += `<div style="margin-bottom: 1rem;">
                <label>Original Text</label>
                <div class="citation-context">${escapeHtml(ann.original_text)}</div>
                <label style="margin-top: 0.5rem;">Replacement</label>
                <div class="citation-context" style="border-color: var(--red); background: var(--red-light);">${escapeHtml(ann.replacement_text)}</div>
            </div>`;
        }

        // Caught/missed (only during reveal)
        if (showVerdicts && ann.caught !== undefined) {
            if (ann.caught) {
                html += `<div style="padding: 0.5rem 0.75rem; background: var(--green-light); border: 1px solid var(--green); border-radius: 6px; font-size: 0.8125rem; font-weight: 500; color: var(--green);">
                    Caught by verifiers
                </div>`;
            } else {
                html += `<div style="padding: 0.5rem 0.75rem; background: var(--red-light); border: 1px solid var(--red); border-radius: 6px; font-size: 0.8125rem; font-weight: 500; color: var(--red);">
                    Missed by verifiers
                </div>`;
            }
        }

        panel.innerHTML = html;
    }

    /**
     * Set the click callback for citations.
     */
    function setClickCallback(cb) {
        _clickCallback = cb;
    }

    return {
        loadReviewBrief,
        renderAnnotatedBrief,
        renderAnnotationPanel,
        setClickCallback,
        escapeHtml,
        TYPE_LABELS,
        TYPE_BADGE,
        _onCiteClick,
    };

})();
