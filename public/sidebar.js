
async function initSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    try {
        const res = await fetch('/api/config');
        const config = await res.json();
        const isSim = config.mode === 'simulation';

        let html = `
    <div class="sidebar-header">
        <span>🎛️ DS1 Control</span>
        <span style="font-size: 0.7em; opacity: 0.7; display: block; margin-top: 4px;">${isSim ? 'SIMULATION' : 'LIVE'} MODE</span>
    </div>`;

        if (isSim) {
            html += `
    <div class="nav-section">
        <div class="nav-label">Simulation</div>
        <a href="/admin.html#simulation" class="nav-item" data-tab="simulation">
            <span>▶️</span> <span>Run Simulation</span>
        </a>
        <a href="/staging.html" class="nav-item" data-page="staging.html">
            <span>🔍</span> <span>Staging Review</span>
        </a>
    </div>`;
        }

        html += `
    <div class="nav-section">
        <div class="nav-label">Business</div>
        <a href="/admin.html#products" class="nav-item" data-tab="products">
            <span>📦</span> <span>Products</span>
        </a>
        <a href="/admin.html#orders" class="nav-item" data-tab="orders">
            <span>🛒</span> <span>Orders</span>
        </a>
        <a href="/admin.html#ads" class="nav-item" data-tab="ads">
            <span>📢</span> <span>Ads Campaigns</span>
        </a>
        <a href="/shop.html" class="nav-item" data-page="shop.html">
            <span>🛍️</span> <span>Shop</span>
        </a>
        <a href="/social.html" class="nav-item" data-page="social.html">
            <span>📱</span> <span>Social Feed</span>
        </a>
    </div>

    <div class="nav-section">
        <div class="nav-label">Executive</div>
        <a href="/admin.html#ceo-chat" class="nav-item" data-tab="ceo-chat">
            <span style="color: red;">☎️</span> <span>Chat with CEO</span>
        </a>
    </div>

    <div class="nav-section">
        <div class="nav-label">System</div>
        <a href="/activity.html" class="nav-item" data-page="activity.html">
            <span>📊</span> <span>Activity Log</span>
        </a>
        <a href="/infra.html" class="nav-item" data-page="infra.html">
            <span>🏗️</span> <span>Infra Manager</span>
        </a>
        <a href="/agents.html" class="nav-item" data-page="agents.html">
            <span>🤖</span> <span>Agent Monitor</span>
        </a>
        <a href="/admin.html#settings" class="nav-item" data-tab="settings">
            <span>⚙️</span> <span>Settings</span>
        </a>
        <a href="/admin.html#database" class="nav-item" data-tab="database">
            <span>🗄️</span> <span>Database Inspector</span>
        </a>
    </div>

    <div class="sidebar-footer">
        <div style="font-size: 0.8rem; color: #6b7280;">
            DS1 v1.0
        </div>
    </div>`;

        container.innerHTML = html;
        if (!container.classList.contains('sidebar')) {
            container.classList.add('sidebar');
        }
        highlightSidebar();

    } catch (e) {
        console.error("Failed to load sidebar config", e);
        container.innerHTML = `<div style="padding:1rem; color:red;">Error loading sidebar</div>`;
    }
}

function highlightSidebar() {
    const path = window.location.pathname;
    const hash = window.location.hash.substring(1);
    const page = path.split('/').pop() || 'admin.html';

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        
        const dataPage = item.getAttribute('data-page');
        const dataTab = item.getAttribute('data-tab');

        // Logic for Admin Page Tabs
        if ((page === 'admin.html' || page === '') && dataTab) {
            if (dataTab === hash) {
                item.classList.add('active');
            } else if (!hash && dataTab === 'simulation') {
                // Only default to simulation if it exists (it might not in live mode)
                if (document.querySelector('a[data-tab="simulation"]')) {
                    item.classList.add('active');
                }
            }
        } 
        // Logic for Other Pages
        else if (dataPage === page) {
            item.classList.add('active');
        }
    });
}
