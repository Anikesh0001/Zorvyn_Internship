async function initUsers() {
    if(AppState.user.role !== 'admin') {
        window.location.hash = '#dashboard';
        return;
    }

    try {
        const res = await apiCall('/users/');
        renderUsersTable(res.data.users);
    } catch (err) {
        console.error("Failed loading users", err);
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    if(users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-muted text-center" style="text-align:center;">No users found.</td></tr>`;
        return;
    }

    users.forEach((u, idx) => {
        const tr = document.createElement('tr');
        tr.style.animationDelay = `${idx * 0.05}s`;
        
        let statusHtml = u.is_active 
            ? `<span class="text-green mono">ACTIVE</span>`
            : `<span class="text-danger mono">INACTIVE</span>`;
            
        let roleHtml = `
            <select class="mono" onchange="updateUserRole('${u.id}', this.value)" style="width:100px; padding:2px;">
                <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>ADMIN</option>
                <option value="analyst" ${u.role === 'analyst' ? 'selected' : ''}>ANALYST</option>
                <option value="viewer" ${u.role === 'viewer' ? 'selected' : ''}>VIEWER</option>
            </select>
        `;
        
        if(u.id === AppState.user.id) {
            roleHtml = `<span class="role-badge role-${u.role}">${u.role}</span>`;
            statusHtml += ` (YOU)`;
        }

        let actionHtml = u.id === AppState.user.id 
            ? `<span class="text-muted">N/A</span>`
            : `<button class="btn-clear text-orange mono" onclick="toggleUserStatus('${u.id}', ${!u.is_active})">${u.is_active ? 'DEACTIVATE' : 'ACTIVATE'}</button>`;

        tr.innerHTML = `
            <td>${u.name}</td>
            <td class="mono">${u.email}</td>
            <td>${roleHtml}</td>
            <td>${statusHtml}</td>
            <td>${formatDate(u.created_at)}</td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function updateUserRole(id, newRole) {
    try {
        await apiCall(`/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ role: newRole })
        });
        showToast("Role updated", "success");
    } catch (err) {
        initUsers(); // reload on error
    }
}

async function toggleUserStatus(id, newStatus) {
    try {
        if(newStatus) {
            // Activate
            await apiCall(`/users/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: true })
            });
            showToast("User activated", "success");
        } else {
            // Deactivate
            if(confirm("Are you sure you want to deactivate this user?")) {
                await apiCall(`/users/${id}`, { method: 'DELETE' });
                showToast("User deactivated", "success");
            }
        }
        initUsers();
    } catch (err) {
        console.error(err);
    }
}
