// Global application state
const AppState = {
    token: localStorage.getItem('jwt_token') || null,
    user: JSON.parse(localStorage.getItem('user_data')) || null,
};

// Centralized API handler
async function apiCall(endpoint, options = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    if (AppState.token) {
        defaultHeaders['Authorization'] = `Bearer ${AppState.token}`;
    }

    try {
        const response = await fetch(`/api${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401 && endpoint !== '/auth/login') {
                // Token expired or invalid
                logout();
            }
            throw new Error(data.error || data.details || 'An error occurred');
        }
        
        return data;
    } catch (err) {
        showToast(err.message, 'error');
        throw err;
    }
}

// Router
function handleRoute() {
    const hash = window.location.hash || '#dashboard';
    const appEl = document.getElementById('app');

    // Need authentication for non-login routes
    if (!AppState.token && hash !== '#login') {
        window.location.hash = '#login';
        return;
    }

    // Skip rendering if already logged in and going to login
    if (AppState.token && hash === '#login') {
        window.location.hash = '#dashboard';
        return;
    }

    const templateId = hash === '#login' ? 'layout-auth' : 'layout-app';
    const template = document.getElementById(templateId);
    
    // Only re-render layout if it changed (e.g. from auth to app)
    if (!appEl.querySelector(`.${templateId === 'layout-auth' ? 'auth-container' : 'app-container'}`)) {
        appEl.innerHTML = '';
        appEl.appendChild(template.content.cloneNode(true));
        
        if (templateId === 'layout-app') {
            initAppLayout();
        }
    }

    if (templateId === 'layout-app') {
        renderPage(hash.replace('#', ''));
    } else {
        if(typeof initAuth === 'function') initAuth();
    }
}

function initAppLayout() {
    // Fill user details
    if (AppState.user) {
        document.getElementById('current-user-name').textContent = AppState.user.name;
        const roleEl = document.getElementById('current-user-role');
        roleEl.textContent = AppState.user.role;
        roleEl.className = `role-badge role-${AppState.user.role}`;
        
        if (AppState.user.role === 'admin') {
            document.getElementById('nav-users-item').classList.remove('hidden');
        }
    }

    document.getElementById('logout-btn').addEventListener('click', logout);
}

function renderPage(pageId) {
    const contentEl = document.getElementById('page-content');
    const template = document.getElementById(`page-${pageId}`);
    
    if (!template) {
        contentEl.innerHTML = `<h3>404 - Page Not Found</h3>`;
        return;
    }
    
    contentEl.innerHTML = '';
    contentEl.appendChild(template.content.cloneNode(true));
    
    // Update active nav state
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.toggle('active', l.dataset.route === pageId);
    });
    
    document.getElementById('page-title').textContent = pageId.toUpperCase();

    // Call page specific init functions depending on route
    if (pageId === 'dashboard' && typeof initDashboard === 'function') initDashboard();
    if (pageId === 'transactions' && typeof initTransactions === 'function') initTransactions();
    if (pageId === 'users' && typeof initUsers === 'function') initUsers();
}

function logout() {
    AppState.token = null;
    AppState.user = null;
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    window.location.hash = '#login';
}

function showToast(message, type = 'error') {
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}

// Number ticking animation
function animateValue(obj, start, end, duration, formatStr = false) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const val = progress * (end - start) + start;
        obj.innerHTML = formatStr ? formatCurrency(val) : Math.floor(val);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function formatCurrency(num) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(num);
}

function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `<span class="mono">${d.toISOString().split('T')[0]}</span>`;
}

// Initial boot
window.addEventListener('hashchange', handleRoute);
document.addEventListener('DOMContentLoaded', handleRoute);
