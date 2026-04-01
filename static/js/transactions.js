let txCurrentPage = 1;

async function initTransactions() {
    loadTransactions();

    document.getElementById('btn-filter').addEventListener('click', () => {
        txCurrentPage = 1;
        loadTransactions();
    });

    document.getElementById('btn-prev-page').addEventListener('click', () => {
        if(txCurrentPage > 1) {
            txCurrentPage--;
            loadTransactions();
        }
    });

    document.getElementById('btn-next-page').addEventListener('click', () => {
        txCurrentPage++;
        loadTransactions();
    });

    if(AppState.user.role === 'admin') {
        const newBtn = document.getElementById('btn-new-record');
        newBtn.classList.remove('hidden');
        newBtn.addEventListener('click', () => {
            document.getElementById('tx-modal').classList.remove('hidden');
        });

        document.getElementById('btn-close-modal').addEventListener('click', () => {
            document.getElementById('tx-modal').classList.add('hidden');
        });

        document.getElementById('tx-form').addEventListener('submit', handleNewTransaction);
    }
}

async function loadTransactions() {
    const type = document.getElementById('filter-type').value;
    const startObj = document.getElementById('filter-start').value;
    const endObj = document.getElementById('filter-end').value;

    let url = `/transactions/?page=${txCurrentPage}`;
    if (type) url += `&type=${type}`;
    if (startObj) url += `&start_date=${startObj}`;
    if (endObj) url += `&end_date=${endObj}`;

    try {
        const res = await apiCall(url);
        renderTransactionsTable(res.data.transactions);
        
        document.getElementById('page-info').textContent = `PAGE ${res.data.current_page} OF ${res.data.pages || 1}`;
        document.getElementById('btn-prev-page').disabled = res.data.current_page <= 1;
        document.getElementById('btn-next-page').disabled = res.data.current_page >= res.data.pages;

    } catch (err) {
        console.error("Failed loading transactions", err);
    }
}

function renderTransactionsTable(txns) {
    const tbody = document.getElementById('transactions-table-body');
    tbody.innerHTML = '';
    
    if(txns.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center" style="text-align:center;">No records found.</td></tr>`;
        return;
    }

    const isAdmin = AppState.user.role === 'admin';

    txns.forEach((tx, idx) => {
        const tr = document.createElement('tr');
        tr.className = `row-${tx.type}`;
        tr.style.animationDelay = `${idx * 0.03}s`;
        
        let actionsHtml = `<span class="text-muted">-</span>`;
        if(isAdmin) {
            actionsHtml = `<button class="btn-clear text-danger" onclick="deleteTransaction('${tx.id}')">DELETE</button>`;
        }

        tr.innerHTML = `
            <td>${formatDate(tx.date)}</td>
            <td class="text-${tx.type === 'income' ? 'green' : 'orange'}">${tx.type.toUpperCase()}</td>
            <td>${tx.category}</td>
            <td class="mono">${formatCurrency(tx.amount)}</td>
            <td class="text-muted"><div style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${tx.notes || '-'}</div></td>
            <td>${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleNewTransaction(e) {
    e.preventDefault();
    document.querySelector('#tx-form .btn-primary').disabled = true;

    const payload = {
        type: document.querySelector('input[name="tx-type"]:checked').value,
        amount: parseFloat(document.getElementById('tx-amount').value),
        category: document.getElementById('tx-category').value,
        date: document.getElementById('tx-date').value,
        notes: document.getElementById('tx-notes').value
    };

    try {
        await apiCall('/transactions/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        document.getElementById('tx-modal').classList.add('hidden');
        document.getElementById('tx-form').reset();
        showToast("Record created", "success");
        loadTransactions();
    } catch(err) {
        console.error(err);
    } finally {
        document.querySelector('#tx-form .btn-primary').disabled = false;
    }
}

async function deleteTransaction(id) {
    if(!confirm('Are you sure you want to delete this record?')) return;
    
    try {
        await apiCall(`/transactions/${id}`, { method: 'DELETE' });
        showToast("Record deleted", "success");
        loadTransactions();
    } catch(err) {
        console.error(err);
    }
}
