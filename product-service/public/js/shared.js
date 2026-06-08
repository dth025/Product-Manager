document.addEventListener('DOMContentLoaded', () => {
  const pageName = document.body.dataset.page;
  
  // Auth guard
  if (pageName !== 'login') {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      window.location.href = './login.html';
      return;
    }

    // Add logout button to navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      const logoutBtn = document.createElement('a');
      logoutBtn.href = '#';
      logoutBtn.textContent = 'Đăng xuất';
      logoutBtn.style.marginLeft = 'auto';
      logoutBtn.style.color = 'var(--danger)';
      logoutBtn.style.border = '1px solid rgba(220, 38, 38, 0.2)';
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        window.location.href = './login.html';
      });
      navbar.appendChild(logoutBtn);
    }
  }

  document.querySelectorAll('.navbar a').forEach((link) => {
    if (link.dataset.page === pageName) {
      link.classList.add('active');
    }
  });
});

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('vi-VN') + '₫';
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('vi-VN');
}
