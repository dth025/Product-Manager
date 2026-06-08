const transactionSearchInput = document.getElementById('transaction-search');
const transactionTypeSelect = document.getElementById('transaction-type');
const transactionList = document.getElementById('transaction-list');

transactionSearchInput?.addEventListener('input', filterTransactionsOnPage);
transactionTypeSelect?.addEventListener('change', loadTransactions);

async function loadTransactions() {
  transactionList.innerHTML = '<tr><td colspan="7" class="empty">Đang tải lịch sử giao dịch...</td></tr>';

  try {
    const type = transactionTypeSelect?.value;
    const params = new URLSearchParams();
    if (type && type !== 'ALL') params.set('type', type);
    params.set('limit', '100');

    const res = await fetch(`/api/stock/transactions?${params.toString()}`);
    const data = await res.json();
    const transactions = data.transactions || [];

    if (transactions.length === 0) {
      transactionList.innerHTML = '<tr><td colspan="7" class="empty">Chưa có giao dịch nào.</td></tr>';
      return;
    }

    transactionList.innerHTML = transactions.map((item) => `
      <tr>
        <td>${item.productId?.name || 'Không xác định'}</td>
        <td>${item.productId?.sku || '-'}</td>
        <td>${item.type === 'IN' ? 'Nhập kho' : 'Xuất kho'}</td>
        <td>${item.quantity}</td>
        <td>${item.beforeQuantity}</td>
        <td>${item.afterQuantity}</td>
        <td>${item.note || '-'}</td>
        <td>${formatDate(item.createdAt)}</td>
      </tr>
    `).join('');

    filterTransactionsOnPage();
  } catch (err) {
    transactionList.innerHTML = '<tr><td colspan="7" class="empty">Không thể tải lịch sử giao dịch.</td></tr>';
    console.error(err);
  }
}

function filterTransactionsOnPage() {
  const query = transactionSearchInput?.value.toLowerCase() || '';
  document.querySelectorAll('#transaction-list tr').forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
  });
}

loadTransactions();
