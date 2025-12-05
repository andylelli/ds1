const sidebarHTML = `
    <div class="sidebar-header">
        <span>🎛️ DS1 Control</span>
    </div>

    <div class="nav-section">
        <div class="nav-label">Simulation</div>
        <a href="/admin.html#simulation" class="nav-item" data-tab="simulation">
            <span>▶️</span> <span>Run Simulation</span>
        </a>
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
        <div class="nav-label">System</div>
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
    </div>
`;

function initSidebar() {
    const container = document.getElementById('sidebar-container');
    if (container) {
        container.innerHTML = sidebarHTML;
        // Ensure the container has the sidebar class if not already
        if (!container.classList.contains('sidebar')) {
            container.classList.add('sidebar');
        }
        highlightSidebar();
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
                item.classList.add('active');
            }
        } 
        // Logic for Other Pages
        else if (dataPage === page) {
            item.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', initSidebar);
window.addEventListener('hashchange', highlightSidebar);
