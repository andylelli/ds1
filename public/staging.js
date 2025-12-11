async function refreshStaging() {
    const container = document.getElementById('staging-container');
    const btn = document.querySelector('button[onclick="refreshStaging()"]');
    if(btn) btn.classList.add('is-loading');

    try {
        // Fetch Sessions
        const res = await fetch('/api/staging/sessions');
        const data = await res.json();
        const sessions = data.sessions || [];

        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="box has-text-centered py-6">
                    <p class="title is-4 has-text-grey">No research sessions found.</p>
                    <p class="subtitle is-6 has-text-grey-light">Run a product research simulation to generate candidates.</p>
                </div>
            `;
            return;
        }

        // Fetch Items for all sessions (or we could do it per session)
        // For simplicity, let's fetch all items and group them by session client-side
        const itemsRes = await fetch('/api/staging/items');
        const itemsData = await itemsRes.json();
        const allItems = itemsData.items || [];

        container.innerHTML = sessions.map(session => {
            const sessionItems = allItems.filter(i => i.sessionId === session.id);
            const pendingCount = sessionItems.filter(i => i.status === 'pending').length;
            const approvedCount = sessionItems.filter(i => i.status === 'approved').length;
            const rejectedCount = sessionItems.filter(i => i.status === 'rejected').length;

            return `
                <div class="card mb-5">
                    <header class="card-header">
                        <p class="card-header-title">
                            Session: ${session.id} (${session.category})
                        </p>
                        <div class="card-header-icon">
                            <div class="tags has-addons">
                                <span class="tag is-warning">${pendingCount} Pending</span>
                                <span class="tag is-success">${approvedCount} Approved</span>
                                <span class="tag is-danger">${rejectedCount} Rejected</span>
                            </div>
                        </div>
                    </header>
                    <div class="card-content">
                        <div class="content">
                            ${renderItemsTable(sessionItems)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (e) {
        console.error("Error loading staging data", e);
        container.innerHTML = `<div class="notification is-danger">Error loading data: ${e.message}</div>`;
    } finally {
        if(btn) btn.classList.remove('is-loading');
    }
}

function renderItemsTable(items) {
    if (items.length === 0) return '<p class="has-text-grey has-text-centered">No items in this session.</p>';

    return `
        <div class="table-container">
            <table class="table is-fullwidth is-striped is-hoverable">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Confidence</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => {
                        let statusClass = 'is-light';
                        if (item.status === 'approved') statusClass = 'is-success';
                        if (item.status === 'rejected') statusClass = 'is-danger';
                        if (item.status === 'pending') statusClass = 'is-warning';

                        let confidenceClass = 'is-success';
                        if (item.confidence < 0.7) confidenceClass = 'is-warning';
                        if (item.confidence < 0.4) confidenceClass = 'is-danger';

                        return `
                            <tr>
                                <td>
                                    <strong>${item.name}</strong>
                                    <p class="is-size-7 has-text-grey">${item.description ? item.description.substring(0, 50) + '...' : ''}</p>
                                </td>
                                <td style="width: 150px;">
                                    <progress class="progress ${confidenceClass} is-small mb-1" value="${item.confidence * 100}" max="100">${item.confidence * 100}%</progress>
                                    <span class="is-size-7">${Math.round(item.confidence * 100)}%</span>
                                </td>
                                <td><span class="tag is-light is-small">${item.source}</span></td>
                                <td><span class="tag ${statusClass}">${item.status}</span></td>
                                <td>
                                    <div class="buttons are-small">
                                        ${item.status === 'pending' ? `
                                            <button class="button is-success is-light" onclick="updateStatus('${item.id}', 'approved')">
                                                <span class="icon"><i class="fas fa-check"></i></span>
                                            </button>
                                            <button class="button is-danger is-light" onclick="updateStatus('${item.id}', 'rejected')">
                                                <span class="icon"><i class="fas fa-times"></i></span>
                                            </button>
                                        ` : ''}
                                        <button class="button is-info is-light" onclick="showDetails('${item.id}')">
                                            <span class="icon"><i class="fas fa-info"></i></span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function updateStatus(itemId, status) {
    try {
        let url, method, body;
        
        if (status === 'approved') {
            // Trigger the Launch Phase
            url = '/api/simulation/approve';
            method = 'POST';
            body = JSON.stringify({ itemId });
        } else if (status === 'rejected') {
            // Just reject in the database
            url = `/api/staging/items/${itemId}/reject`;
            method = 'POST';
            body = JSON.stringify({});
        } else {
             console.error("Unknown status action");
             return;
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: body
        });
        
        if (res.ok) {
            // Give it a moment to update DB
            setTimeout(refreshStaging, 500);
        } else {
            const err = await res.json();
            alert('Failed to update status: ' + (err.error || err.message));
        }
    } catch (e) {
        console.error(e);
        alert('Error updating status');
    }
}

function showDetails(itemId) {
    // Placeholder for details modal
    alert('Details view coming soon for item: ' + itemId);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    refreshStaging();
});
