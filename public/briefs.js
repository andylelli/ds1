async function refreshBriefs() {
    const tbody = document.getElementById('briefs-table-body');
    const btn = document.querySelector('button[onclick="refreshBriefs()"]');
    if(btn) btn.classList.add('is-loading');

    try {
        const res = await fetch('/api/briefs');
        const data = await res.json();
        const briefs = data.briefs || [];

        if (briefs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="has-text-centered has-text-grey">No briefs found.</td></tr>`;
            return;
        }

        tbody.innerHTML = briefs.map(brief => {
            const score = Math.round((brief.certainty_score || 0) * 100);
            const phase = brief.market_evidence?.trend_phase || 'Unknown';
            const status = brief.meta?.status || 'draft';
            const date = new Date(brief.meta?.created_at || Date.now()).toLocaleString();

            return `
                <tr>
                    <td><strong>${brief.opportunity_definition?.theme_name || 'Untitled'}</strong></td>
                    <td>
                        <span class="tag ${getScoreColor(score)}">${score}%</span>
                    </td>
                    <td>${phase}</td>
                    <td>
                        <span class="tag ${getStatusColor(status)}">${status}</span>
                    </td>
                    <td>${date}</td>
                    <td>
                        <button class="button is-small is-info" onclick='viewBrief(${JSON.stringify(brief).replace(/'/g, "&apos;")})'>
                            <span class="icon is-small"><i class="fas fa-eye"></i></span>
                            <span>View</span>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Failed to fetch briefs:', error);
        tbody.innerHTML = `<tr><td colspan="6" class="has-text-centered has-text-danger">Failed to load briefs.</td></tr>`;
    } finally {
        if(btn) btn.classList.remove('is-loading');
    }
}

function getScoreColor(score) {
    if (score >= 80) return 'is-success';
    if (score >= 50) return 'is-warning';
    return 'is-danger';
}

function getStatusColor(status) {
    if (status === 'validated' || status === 'approved') return 'is-success';
    if (status === 'killed' || status === 'rejected') return 'is-danger';
    return 'is-light';
}

function viewBrief(brief) {
    const modal = document.getElementById('brief-modal');
    const title = document.getElementById('modal-title');
    const content = document.getElementById('modal-content');

    title.textContent = `Brief: ${brief.opportunity_definition?.theme_name || brief.id}`;
    content.textContent = JSON.stringify(brief, null, 2);
    
    modal.classList.add('is-active');
}

function closeModal() {
    document.getElementById('brief-modal').classList.remove('is-active');
}

// Initial load
document.addEventListener('DOMContentLoaded', refreshBriefs);
