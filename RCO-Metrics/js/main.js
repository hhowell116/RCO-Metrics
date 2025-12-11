class DashboardManager {
    constructor() {
        this.currentDashboard = 'shipping';
        this.isLoading = false;
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadDashboard('shipping');
    }
    
    setupEventListeners() {
        // Tab click events
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const dashboard = e.target.dataset.tab;
                this.switchDashboard(dashboard);
            });
        });
        
        // Login button placeholder
        document.querySelector('.login-btn').addEventListener('click', () => {
            alert('Firebase authentication will be implemented later');
        });
    }
    
    switchDashboard(dashboardName) {
        if (this.isLoading || this.currentDashboard === dashboardName) return;
        
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === dashboardName) {
                tab.classList.add('active');
            }
        });
        
        this.currentDashboard = dashboardName;
        this.loadDashboard(dashboardName);
    }
    
    loadDashboard(dashboardName) {
        this.isLoading = true;
        const contentDiv = document.getElementById('dashboard-content');
        
        // Show loading state
        contentDiv.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <p>Loading ${this.getDashboardName(dashboardName)}...</p>
            </div>
        `;
        
        // Load the dashboard HTML
        fetch(`dashboards/${dashboardName}.html`)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${dashboardName} dashboard`);
                return response.text();
            })
            .then(html => {
                // Create container with specific class for styling
                contentDiv.innerHTML = `<div class="${dashboardName}-container">${html}</div>`;
                
                // Load dashboard-specific CSS
                this.loadDashboardStyles(dashboardName);
                
                // Load dashboard-specific JavaScript
                this.loadDashboardScript(dashboardName);
                
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error loading dashboard:', error);
                contentDiv.innerHTML = `
                    <div style="padding: 48px; text-align: center; color: var(--color-danger);">
                        <h2>Error Loading Dashboard</h2>
                        <p>${error.message}</p>
                        <button onclick="dashboardManager.loadDashboard('${dashboardName}')" 
                                style="margin-top: 16px; padding: 8px 16px; background: var(--tan-dark); 
                                       color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Retry
                        </button>
                    </div>
                `;
                this.isLoading = false;
            });
    }
    
    loadDashboardStyles(dashboardName) {
        // Remove any existing dashboard styles
        const existingStyles = document.getElementById('dashboard-styles');
        if (existingStyles) {
            existingStyles.remove();
        }
        
        // Add new dashboard styles
        const link = document.createElement('link');
        link.id = 'dashboard-styles';
        link.rel = 'stylesheet';
        link.href = `styles/${dashboardName}.css`;
        document.head.appendChild(link);
    }
    
    loadDashboardScript(dashboardName) {
        // Remove any existing dashboard script
        const existingScript = document.getElementById('dashboard-script');
        if (existingScript) {
            existingScript.remove();
        }
        
        // Add new dashboard script
        const script = document.createElement('script');
        script.id = 'dashboard-script';
        script.src = `scripts/${dashboardName}.js`;
        document.head.appendChild(script);
    }
    
    getDashboardName(dashboardName) {
        const names = {
            'shipping': 'Shipping Leaderboard',
            'orders': 'Orders Overview',
            'fulfillment': 'Fulfillment KPI'
        };
        return names[dashboardName] || 'Dashboard';
    }
}

// Initialize when DOM is ready
let dashboardManager;
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
    window.dashboardManager = dashboardManager;
});
