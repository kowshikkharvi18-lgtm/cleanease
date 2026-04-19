// Customer Login & Registration System
const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://127.0.0.1:5000/api'
    : '/api';

// If opened as a file, redirect to server
if (location.protocol === 'file:') {
    document.addEventListener('DOMContentLoaded', () => {
        document.body.innerHTML = `
            <div style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#1a73e8,#0d47a1);">
                <div style="background:#fff;border-radius:16px;padding:40px;max-width:480px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,0.2);">
                    <div style="font-size:3rem;margin-bottom:16px;">🧺</div>
                    <h2 style="color:#1a1a2e;margin:0 0 8px;">Open via Server</h2>
                    <p style="color:#666;margin:0 0 24px;">You opened this file directly. CleanEase needs to run through the server.</p>
                    <a href="http://127.0.0.1:5000/index.html"
                       style="display:inline-block;background:linear-gradient(135deg,#1a73e8,#00bcd4);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:1rem;">
                        → Open CleanEase
                    </a>
                    <p style="color:#999;font-size:0.8rem;margin-top:16px;">Make sure <code>python start.py</code> is running first</p>
                </div>
            </div>`;
    });
}

/* Password strength validator */
function checkPasswordStrength(password) {
    if (!/.{8,}/.test(password))      return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(password))      return "Add at least one uppercase letter";
    if (!/[a-z]/.test(password))      return "Add at least one lowercase letter";
    if (!/[0-9]/.test(password))      return "Add at least one number";
    if (!/[!@#$%^&*]/.test(password)) return "Add at least one special character";
    if (!/^\S+$/.test(password))      return "Password must not contain spaces";
    return "Strong password";
}

function switchTab(name) {
    if (typeof showPanel === 'function') showPanel(name);
}

document.addEventListener('DOMContentLoaded', () => {

    // ── Customer Login ──
    document.getElementById('customerLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone    = document.getElementById('customerPhone').value.trim();
        const password = document.getElementById('customerPassword').value.trim();

        if (!phone || !password) {
            alert('Please enter both phone number and password');
            return;
        }

        try {
            const res  = await fetch(`${API}/customer/login`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ phone, password })
            });
            const data = await res.json();

            if (data.success) {
                login(data.user);
            } else {
                alert(data.message || 'Invalid phone number or password.');
            }
        } catch (err) {
            alert('Cannot connect to server. Make sure the backend is running:\n\npython run_server.py');
        }
    });

    // ── Customer Registration ──
    document.getElementById('customerRegisterForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name            = document.getElementById('registerName').value.trim();
        const phone           = document.getElementById('registerPhone').value.trim();
        const address         = document.getElementById('registerAddress').value.trim();
        const password        = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();

        if (!name || !phone || !address || !password || !confirmPassword) {
            alert('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match!');
            return;
        }

        const pwResult = checkPasswordStrength(password);
        if (pwResult !== "Strong password") {
            alert('Weak password: ' + pwResult);
            return;
        }

        try {
            const res  = await fetch(`${API}/customer/register`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ name, phone, address, password })
            });
            const data = await res.json();

            if (data.success) {
                alert('Registration successful! You can now login.');
                showPanel('login');
                document.getElementById('customerRegisterForm').reset();
                document.getElementById('pwFill').style.width = '0';
                document.getElementById('pwHint').textContent = '';
            } else {
                alert(data.message || 'Registration failed. Please try again.');
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
