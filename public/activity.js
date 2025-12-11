let currentPage = 1;
const itemsPerPage = 20;
let allActivities = [];

async function refreshLogs() {
    const btn = document.querySelector('button[onclick="refreshLogs()"]');
    if(btn) btn.classList.add('is-loading');

    try {
        // 1. Fetch Stats
        const statsRes = await fetch('/api/activity/stats?hours=24');
        const stats = await statsRes.json();
        
        document.getElementById('stat-total').textContent = stats.total || 0;
        document.getElementById('stat-errors').textContent = stats.byStatus?.error || 0;
        document.getElementById('stat-agents').textContent = Object.keys(stats.byAgent || {}).length;
        document.getElementById('stat-recent').textContent = stats.total || 0; // Simplified for now

        // 2. Fetch Logs
        const agent = document.getElementById('filter-agent').value;
        const level = document.getElementById('filter-level').value; // Note: API uses 'status' or 'category', need to map if needed
        
        let url = '/api/activity?limit=100';
        if (agent) url += `&agent=${encodeURIComponent(agent)}`;
        // if (level) url += `&status=${encodeURIComponent(level)}`; // Assuming level maps to status or category

        const res = await fetch(url);
        const data = await res.json();
        
        allActivities = data.activities || [];
        
        // Populate Agent Filter if empty
        const agentSelect = document.getElementById('filter-agent');
        if (agentSelect.options.length === 1) {
            const agents = [...new Set(allActivities.map(a => a.agent))].sort();
            agents.forEach(a => {
                const opt = document.createElement('option');
                opt.value = a;
                opt.textContent = a;
                agentSelect.appendChild(opt);
            });
        }

        applyFilters(); // This will trigger render

    } catch (e) {
        console.error("Error fetching activity logs", e);
        document.getElementById('log-container').innerHTML = `<tr><td colspan="5" class="has-text-danger has-text-centered">Error loading logs: ${e.message}</td></tr>`;
    } finally {
        if(btn) btn.classList.remove('is-loading');
    }
}

function applyFilters() {
    const search = document.getElementById('filter-search').value.toLowerCase();
    const level = document.getElementById('filter-level').value.toLowerCase();
    
    let filtered = allActivities;

    if (search) {
        filtered = filtered.filter(a => 
            (a.message && a.message.toLowerCase().includes(search)) ||
            (a.agent && a.agent.toLowerCase().includes(search)) ||
            (a.action && a.action.toLowerCase().includes(search))
        );
    }

    if (level) {
        // Mapping 'level' filter to 'status' or 'category' if needed. 
        // For now, let's assume 'status' holds success/error/info
        filtered = filtered.filter(a => a.status && a.status.toLowerCase() === level);
    }

    renderTable(filtered);
}

function renderTable(items) {
    const tbody = document.getElementById('log-container');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = items.slice(start, end);

    document.getElementById('page-indicator').textContent = currentPage;

    if (pageItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="has-text-centered has-text-grey">No logs found.</td></tr>`;
        return;
    }

    tbody.innerHTML = pageItems.map(item => {
        let levelClass = 'is-info';
        if (item.status === 'error' || item.status === 'failure') levelClass = 'is-danger';
        else if (item.status === 'warning') levelClass = 'is-warning';
        else if (item.status === 'success') levelClass = 'is-success';

        return `
            <tr>
                <td class="is-size-7" style="white-space:nowrap;">${new Date(item.timestamp).toLocaleString()}</td>
                <td><span class="tag ${levelClass} is-light">${item.status || 'info'}</span></td>
                <td><strong>${item.agent}</strong></td>
                <td>
                    <div class="has-text-weight-medium">${item.action}</div>
                    <div class="is-size-7">${item.message}</div>
                </td>
                <td class="log-details">
                    ${item.details && Object.keys(item.details).length > 0 
                        ? `<pre>${JSON.stringify(item.details, null, 2)}</pre>` 
                        : '<span class="has-text-grey-light">-</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        applyFilters();
    }
}

function nextPage() {
    if ((currentPage * itemsPerPage) < allActivities.length) {
        currentPage++;
        applyFilters();
    }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    refreshLogs();
    // Auto refresh every 10s
    setInterval(refreshLogs, 10000);
});
