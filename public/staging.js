// Staging Review UI Script
let sessions = [];
let items = [];
let selectedItems = new Set();

async function loadSessions() {
    try {
        const res = await fetch('/api/staging/sessions');
        const data = await res.json();
        sessions = data.sessions;
        
        // Populate session filter
        const filter = document.getElementById('sessionFilter');
        filter.innerHTML = '<option value="">All Sessions</option>' + 
            sessions.map(s => `<option value="${s.id}">${s.category} (${s.id})</option>`).join('');
        
        renderSessions();
    } catch (error) {
        console.error('Load sessions error:', error);
    }
}

async function loadItems() {
    try {
        const sessionId = document.getElementById('sessionFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        let url = '/api/staging/items?';
        if (sessionId) url += `sessionId=${sessionId}&`;
        if (status) url += `status=${status}`;
        
        const res = await fetch(url);
        const data = await res.json();
        items = data.items;
        
        renderItems();
        updatePendingBadge();
    } catch (error) {
        console.error('Load items error:', error);
    }
}

async function updatePendingBadge() {
    try {
        const res = await fetch('/api/staging/pending');
        const data = await res.json();
        
        const badge = document.getElementById('pendingBadge');
        const count = document.getElementById('pendingCount');
        
        if (data.pendingCount > 0) {
            badge.style.display = 'block';
            count.textContent = data.pendingCount;
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Update pending badge error:', error);
    }
}

function renderSessions() {
    if (sessions.length === 0) {
        const container = document.getElementById('sessionsContainer');
        container.innerHTML = `
            <div class="empty-state">
                <h3>No research sessions yet</h3>
                <p>Run a product discovery to see results here</p>
            </div>
        `;
        return;
    }
    
    // Show items table
    renderItems();
}

function renderItems() {
    const container = document.getElementById('sessionsContainer');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No items match your filters</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class="items-table">
            <thead>
                <tr>
                    <th><input type="checkbox" onchange="toggleAll(this)" /></th>
                    <th>Product</th>
                    <th>Confidence</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => renderItemRow(item)).join('')}
            </tbody>
        </table>
    `;
}

function renderItemRow(item) {
    const confidenceClass = item.confidenceScore >= 70 ? 'high' : 
                           item.confidenceScore >= 40 ? 'medium' : 'low';
    
    return `
        <tr data-id="${item.id}">
            <td>
                <input type="checkbox" 
                       ${item.status === 'pending' ? '' : 'disabled'} 
                       onchange="toggleItem(${item.id})" 
                       ${selectedItems.has(item.id) ? 'checked' : ''} />
            </td>
            <td>
                <strong>${escapeHtml(item.name)}</strong>
                <div class="trend-evidence">${escapeHtml(item.trendEvidence || '')}</div>
            </td>
            <td>
                <div class="confidence-bar">
                    <div class="confidence-fill confidence-${confidenceClass}" 
                         style="width: ${item.confidenceScore}%"></div>
                </div>
                <span>${item.confidenceScore}%</span>
            </td>
            <td><span class="source-badge">${escapeHtml(item.source)}</span></td>
            <td><span class="stat-badge stat-${item.status}">${item.status}</span></td>
            <td class="action-buttons">
                ${item.status === 'pending' ? `
                    <button class="btn-sm btn-approve" onclick="approve(${item.id})">✓</button>
                    <button class="btn-sm btn-reject" onclick="reject(${item.id})">✗</button>
                    <button class="btn-sm btn-info" onclick="needInfo(${item.id})">?</button>
                ` : `
                    <span style="color: #8b949e; font-size: 12px;">
                        ${item.reviewedBy ? `by ${escapeHtml(item.reviewedBy)}` : ''}
                    </span>
                `}
            </td>
        </tr>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleItem(id) {
    if (selectedItems.has(id)) {
        selectedItems.delete(id);
    } else {
        selectedItems.add(id);
    }
    updateBulkActions();
}

function toggleAll(checkbox) {
    if (checkbox.checked) {
        items.filter(i => i.status === 'pending').forEach(i => selectedItems.add(i.id));
    } else {
        selectedItems.clear();
    }
    renderItems();
    updateBulkActions();
}

function clearSelection() {
    selectedItems.clear();
    renderItems();
    updateBulkActions();
}

function updateBulkActions() {
    const bulkDiv = document.getElementById('bulkActions');
    const countSpan = document.getElementById('selectedCount');
    
    if (selectedItems.size > 0) {
        bulkDiv.style.display = 'flex';
        countSpan.textContent = selectedItems.size;
    } else {
        bulkDiv.style.display = 'none';
    }
}

async function approve(id) {
    try {
        await fetch(`/api/staging/items/${id}/approve`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewedBy: 'admin' })
        });
        await loadItems();
    } catch (error) {
        console.error('Approve error:', error);
        alert('Failed to approve item');
    }
}

async function reject(id) {
    const notes = prompt('Rejection reason (optional):');
    try {
        await fetch(`/api/staging/items/${id}/reject`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewedBy: 'admin', notes })
        });
        await loadItems();
    } catch (error) {
        console.error('Reject error:', error);
        alert('Failed to reject item');
    }
}

async function needInfo(id) {
    const notes = prompt('What additional info is needed?');
    if (!notes) return;
    try {
        await fetch(`/api/staging/items/${id}/need-info`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reviewedBy: 'admin', notes })
        });
        await loadItems();
    } catch (error) {
        console.error('Need info error:', error);
        alert('Failed to update item');
    }
}

async function bulkApprove() {
    try {
        await fetch('/api/staging/bulk/approve', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemIds: Array.from(selectedItems), reviewedBy: 'admin' })
        });
        selectedItems.clear();
        await loadItems();
    } catch (error) {
        console.error('Bulk approve error:', error);
        alert('Failed to bulk approve');
    }
}

async function bulkReject() {
    try {
        await fetch('/api/staging/bulk/reject', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemIds: Array.from(selectedItems), reviewedBy: 'admin' })
        });
        selectedItems.clear();
        await loadItems();
    } catch (error) {
        console.error('Bulk reject error:', error);
        alert('Failed to bulk reject');
    }
}

function refresh() {
    loadSessions();
    loadItems();
}

// Initial load
loadSessions();
loadItems();

// Auto-refresh every 30 seconds
setInterval(updatePendingBadge, 30000);
