let autoRefreshInterval = null;

async function loadActivities() {
    console.log('[Activity Log] Loading activities...');
    try {
        const agent = document.getElementById('filterAgent').value;
        const category = document.getElementById('filterCategory').value;
        const status = document.getElementById('filterStatus').value;
        const limit = document.getElementById('filterLimit').value || 50;

        const params = new URLSearchParams();
        if (agent) params.append('agent', agent);
        if (category) params.append('category', category);
        if (status) params.append('status', status);
        params.append('limit', limit);

        const url = `/api/activity?${params}`;
        console.log('[Activity Log] Fetching from:', url);
        
        const response = await fetch(url);
        console.log('[Activity Log] Response status:', response.status);
        
        const data = await response.json();
        console.log('[Activity Log] Received data:', data);

        renderActivities(data.activities);
    } catch (error) {
        console.error('[Activity Log] Failed to load activities:', error);
        document.getElementById('activityLog').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">❌</div>
                <div>Failed to load activities: ${error.message}</div>
            </div>
        `;
    }
}

async function loadStats() {
    console.log('[Activity Log] Loading stats...');
    try {
        const response = await fetch('/api/activity/stats?hours=24');
        const stats = await response.json();
        console.log('[Activity Log] Stats:', stats);

        document.getElementById('statTotal').textContent = stats.total || 0;
        document.getElementById('statResearch').textContent = stats.byCategory?.research || 0;
        document.getElementById('statMarketing').textContent = stats.byCategory?.marketing || 0;
        document.getElementById('statOperations').textContent = stats.byCategory?.operations || 0;
    } catch (error) {
        console.error('[Activity Log] Failed to load stats:', error);
    }
}

function renderActivities(activities) {
    console.log('[Activity Log] Rendering activities:', activities?.length || 0);
    const container = document.getElementById('activityLog');

    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div>No activities found</div>
                <div style="font-size: 12px; margin-top: 8px;">Try adjusting your filters or run a simulation</div>
            </div>
        `;
        return;
    }

    const html = activities.map(activity => {
        const timestamp = new Date(activity.timestamp).toLocaleString();
        const categoryClass = `category-${activity.category}`;
        const statusClass = `status-${activity.status}`;

        let detailsHtml = '';
        if (activity.details && Object.keys(activity.details).length > 0) {
            detailsHtml = `
                <div class="log-details">
                    ${JSON.stringify(activity.details, null, 2)}
                </div>
            `;
        }

        return `
            <div class="log-entry">
                <div class="log-timestamp">${timestamp}</div>
                <div class="log-agent">${activity.agent}</div>
                <div class="log-category ${categoryClass}">${activity.category}</div>
                <div>
                    <div class="log-action">${activity.action}</div>
                    <div class="log-message">${activity.message}</div>
                    ${detailsHtml}
                </div>
                <div class="log-status ${statusClass}">${activity.status}</div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function clearFilters() {
    document.getElementById('filterAgent').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterLimit').value = '50';
    loadActivities();
}

function setupAutoRefresh() {
    const checkbox = document.getElementById('autoRefresh');
    
    checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
            autoRefreshInterval = setInterval(() => {
                loadActivities();
                loadStats();
            }, 5000);
        } else {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval);
                autoRefreshInterval = null;
            }
        }
    });

    // Start auto-refresh if checked
    if (checkbox.checked) {
        autoRefreshInterval = setInterval(() => {
            loadActivities();
            loadStats();
        }, 5000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadActivities();
    loadStats();
    setupAutoRefresh();
});
