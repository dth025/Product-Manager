document.addEventListener('DOMContentLoaded', () => {
  const pageName = document.body.dataset.page;
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
