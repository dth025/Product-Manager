document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const statusEl = document.getElementById('status');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    statusEl.textContent = 'Đang xử lý...';
    statusEl.className = '';

    try {
      const res = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('adminToken', data.token);
      window.location.href = './index.html';
    } catch (err) {
      statusEl.textContent = err.message;
      statusEl.style.color = 'var(--danger)';
    }
  });
});
