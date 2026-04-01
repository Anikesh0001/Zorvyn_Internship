function initAuth() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorBanner = document.getElementById('auth-error');
        const submitBtn = form.querySelector('button');
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'AUTHENTICATING...';
        errorBanner.classList.add('hidden');
        
        try {
            const res = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            AppState.token = res.data.token;
            AppState.user = res.data.user;
            
            localStorage.setItem('jwt_token', AppState.token);
            localStorage.setItem('user_data', JSON.stringify(AppState.user));
            
            window.location.hash = '#dashboard';
            
        } catch (err) {
            errorBanner.textContent = err.message || 'Authentication Failed';
            errorBanner.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'AUTHENTICATE';
        }
    });
}
