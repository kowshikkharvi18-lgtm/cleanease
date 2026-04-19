// Admin Login System
const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:5000/api'
    : '/api';

// If opened as a file, redirect to server
if (location.protocol === 'file:') {
    document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = `
            <div style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#1a1a2e;">
                <div style="background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
                    <div style="font-size:3rem;margin-bottom:16px;">🧺</div>
                    <h2 style="color:#1a1a2e;margin:0 0 8px;">Open via Server</h2>
                    <p style="color:#666;margin:0 0 24px;">You opened this file directly. CleanEase needs to run through the server.</p>
                    <a href="http://127.0.0.1:5000/admin-login.html"
                       style="display:inline-block;background:linear-gradient(135deg,#1a73e8,#00bcd4);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;">
                        → Open Admin Login
                    </a>
                    <p style="color:#999;font-size:0.8rem;margin-top:16px;">Make sure <code>python start.py</code> is running first</p>
                </div>
            </div>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value.trim();

        try {
            const res  = await fetch(`${API}/admin/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                login(data.user);
            } else {
                alert('Invalid credentials. Please check your username and password.');
            }
        } catch (err) {
            alert('Cannot connect to server. Make sure the backend is running:\n\npython run_server.py');
        }
    });
});

function login(user) {
    sessionStorage.setItem('user', JSON.stringify(user));
    window.location.href = 'dashboard.html';
}
