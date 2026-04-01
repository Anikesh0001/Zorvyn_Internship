async function initDashboard() {
    try {
        if(AppState.user.role === 'admin' || AppState.user.role === 'analyst') {
            const sumRes = await apiCall('/dashboard/summary');
            renderSummary(sumRes.data);
            
            const trendsRes = await apiCall('/dashboard/trends');
            renderTrends(trendsRes.data.trends);

            const catRes = await apiCall('/dashboard/by-category');
            renderCategories(catRes.data.categories);
        } else {
            // Viewer doesn't get dashboard analytics, show messages or 0s
            document.querySelector('.dashboard-grid .stat-cards').style.display = 'none';
            document.querySelector('.dashboard-grid .charts-row').style.display = 'none';
        }

        const recentRes = await apiCall('/dashboard/recent');
        renderRecentTransactions(recentRes.data.transactions);

    } catch (err) {
        console.error("Dashboard Load Error", err);
    }
}

function renderSummary(data) {
    const iEl = document.getElementById('dash-income');
    const eEl = document.getElementById('dash-expenses');
    const bEl = document.getElementById('dash-balance');
    const rEl = document.getElementById('dash-records');

    animateValue(iEl, 0, data.total_income, 1000, true);
    animateValue(eEl, 0, data.total_expenses, 1000, true);
    
    bEl.className = data.net_balance >= 0 ? 'stat-value text-green mono' : 'stat-value text-danger mono';
    animateValue(bEl, 0, data.net_balance, 1000, true);
    
    animateValue(rEl, 0, data.record_count, 1000, false);
}

function renderTrends(trends) {
    const container = document.getElementById('trend-chart');
    container.innerHTML = '';
    
    // Group by month
    const grouped = {};
    let maxVal = 0;
    
    trends.forEach(t => {
        if(!grouped[t.month]) grouped[t.month] = { income: 0, expense: 0 };
        grouped[t.month][t.type] = t.total;
        if(t.total > maxVal) maxVal = t.total;
    });

    for (let month in grouped) {
        const groupEl = document.createElement('div');
        groupEl.className = 'bar-group';
        
        const trackEl = document.createElement('div');
        trackEl.className = 'bar-track';
        
        // Income Bar
        const incPct = maxVal > 0 ? (grouped[month].income / maxVal) * 100 : 0;
        const incBar = document.createElement('div');
        incBar.className = 'bar income';
        incBar.style.height = '0%';
        setTimeout(() => incBar.style.height = `${incPct}%`, 100);
        incBar.title = `Income: ₹${grouped[month].income}`;
        
        // Expense Bar
        const expPct = maxVal > 0 ? (grouped[month].expense / maxVal) * 100 : 0;
        const expBar = document.createElement('div');
        expBar.className = 'bar expense';
        expBar.style.height = '0%';
        setTimeout(() => expBar.style.height = `${expPct}%`, 100);
        expBar.title = `Expense: ₹${grouped[month].expense}`;

        trackEl.appendChild(incBar);
        trackEl.appendChild(expBar);
        
        const labelEl = document.createElement('div');
        labelEl.className = 'bar-label';
        // Convert YYYY-MM to MMM
        const date = new Date(month + "-01");
        labelEl.textContent = date.toLocaleString('default', { month: 'short' }).toUpperCase();
        
        groupEl.appendChild(trackEl);
        groupEl.appendChild(labelEl);
        
        container.appendChild(groupEl);
    }
}

function renderCategories(categories) {
    const container = document.getElementById('category-chart');
    container.innerHTML = '';
    container.style.flexDirection = 'column';
    container.style.justifyContent = 'center';
    
    categories.sort((a,b) => b.total - a.total).slice(0, 6).forEach(cat => {
        const row = document.createElement('div');
        row.className = 'hbar-group';
        
        const label = document.createElement('div');
        label.className = 'hbar-label';
        label.textContent = cat.category;
        
        const track = document.createElement('div');
        track.className = 'hbar-track';
        
        const bar = document.createElement('div');
        bar.className = `hbar ${cat.type}`;
        bar.style.width = '0%';
        
        // Assume overall 500k is 100% just for demo scaling, or find max.
        const maxCat = Math.max(...categories.map(c => c.total));
        const pct = (cat.total / maxCat) * 100;
        setTimeout(() => bar.style.width = `${pct}%`, 100);
        
        track.appendChild(bar);
        row.appendChild(label);
        row.appendChild(track);
        container.appendChild(row);
    });
}

function renderRecentTransactions(txns) {
    const tbody = document.getElementById('recent-table-body');
    tbody.innerHTML = '';
    
    if(txns.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted">No recent activity.</td></tr>`;
        return;
    }

    txns.forEach((tx, idx) => {
        const tr = document.createElement('tr');
        tr.className = `row-${tx.type}`;
        tr.style.animationDelay = `${idx * 0.05}s`;
        
        tr.innerHTML = `
            <td>${formatDate(tx.date)}</td>
            <td class="text-${tx.type === 'income' ? 'green' : 'orange'}">${tx.type.toUpperCase()}</td>
            <td>${tx.category}</td>
            <td class="mono">${formatCurrency(tx.amount)}</td>
            <td class="text-muted">${tx.notes || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}
