
async function initSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    try {
        const res = await fetch('/api/config');
        const config = await res.json();
        const isSim = config.mode === 'simulation';
        const modeLabel = isSim ? 'SIMULATION' : 'LIVE';
        const modeColor = isSim ? 'has-text-info' : 'has-text-danger';

        let html = `
    <div class="p-4 mb-2">
        <h1 class="title is-5 has-text-grey-dark mb-0">
            <span class="icon-text">
                <span class="icon"><i class="fas fa-gamepad"></i></span>
                <span>DS1 Control</span>
            </span>
        </h1>
        <p class="is-size-7 has-text-grey pl-5"><span class="${modeColor} has-text-weight-bold">${modeLabel}</span> MODE</p>
    </div>
    <aside class="menu p-4 pt-0">`;

        if (isSim) {
            html += `
        <p class="menu-label">Simulation</p>
        <ul class="menu-list">
            <li><a href="/admin.html#simulation" class="nav-item" data-tab="simulation"><span class="icon"><i class="fas fa-play"></i></span> Run Simulation</a></li>
            <li><a href="/briefs.html" class="nav-item" data-page="briefs.html"><span class="icon"><i class="fas fa-file-contract"></i></span> Opportunity Briefs</a></li>
            <li><a href="/staging.html" class="nav-item" data-page="staging.html"><span class="icon"><i class="fas fa-magnifying-glass"></i></span> Staging Review</a></li>
        </ul>`;
        }

        html += `
        <p class="menu-label">Business</p>
        <ul class="menu-list">
            <li><a href="/admin.html#products" class="nav-item" data-tab="products"><span class="icon"><i class="fas fa-box"></i></span> Products</a></li>
            <li><a href="/admin.html#orders" class="nav-item" data-tab="orders"><span class="icon"><i class="fas fa-cart-shopping"></i></span> Orders</a></li>
            <li><a href="/admin.html#ads" class="nav-item" data-tab="ads"><span class="icon"><i class="fas fa-bullhorn"></i></span> Ads Campaigns</a></li>
            <li><a href="/shop.html" class="nav-item" data-page="shop.html"><span class="icon"><i class="fas fa-store"></i></span> Shop</a></li>
            <li><a href="/social.html" class="nav-item" data-page="social.html"><span class="icon"><i class="fas fa-mobile-screen"></i></span> Social Feed</a></li>
        </ul>

        <p class="menu-label">Executive</p>
        <ul class="menu-list">
            <li><a href="/admin.html#ceo-chat" class="nav-item" data-tab="ceo-chat"><span class="icon has-text-danger"><i class="fas fa-phone"></i></span> Chat with CEO</a></li>
        </ul>

        <p class="menu-label">System</p>
        <ul class="menu-list">
            <li><a href="/activity.html" class="nav-item" data-page="activity.html"><span class="icon"><i class="fas fa-chart-line"></i></span> Activity Log</a></li>
            <li><a href="/errors.html" class="nav-item" data-page="errors.html"><span class="icon has-text-danger"><i class="fas fa-exclamation-triangle"></i></span> Error Log</a></li>
            <li><a href="/infra.html" class="nav-item" data-page="infra.html"><span class="icon"><i class="fas fa-server"></i></span> Infra Manager</a></li>
            <li><a href="/agents.html" class="nav-item" data-page="agents.html"><span class="icon"><i class="fas fa-robot"></i></span> Agent Monitor</a></li>
            <li><a href="/admin.html#settings" class="nav-item" data-tab="settings"><span class="icon"><i class="fas fa-gear"></i></span> Settings</a></li>
            <li><a href="/admin.html#database" class="nav-item" data-tab="database"><span class="icon"><i class="fas fa-database"></i></span> Database Inspector</a></li>
        </ul>
    </aside>

    <div class="p-4 mt-auto">
        <div class="is-size-7 has-text-grey">
            DS1 v1.0
        </div>
    </div>`;

        container.innerHTML = html;
        // Remove old class if present
        container.classList.remove('sidebar');
        
        highlightSidebar();

    } catch (e) {
        console.error("Failed to load sidebar config", e);
        container.innerHTML = `<div class="notification is-danger">Error loading sidebar</div>`;
    }
}

function highlightSidebar() {
    const path = window.location.pathname;
    const hash = window.location.hash.substring(1);
    const page = path.split('/').pop() || 'admin.html';

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('is-active'); // Bulma active class
        
        const dataPage = item.getAttribute('data-page');
        const dataTab = item.getAttribute('data-tab');

        // Logic for Admin Page Tabs
        if ((page === 'admin.html' || page === '') && dataTab) {
            if (dataTab === hash) {
                item.classList.add('is-active');
            } else if (!hash && dataTab === 'simulation') {
                if (document.querySelector('a[data-tab="simulation"]')) {
                    item.classList.add('is-active');
                }
            }
        } 
        // Logic for Other Pages
        else if (dataPage === page) {
            item.classList.add('is-active');
        }
        // Logic for Social Page Tabs (Deep Linking)
        else if (page === 'social.html' && dataPage === 'social.html') {
             item.classList.add('is-active');
        }
    });
}
