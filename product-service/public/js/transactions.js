const transactionSearchInput = document.getElementById('transaction-search');
const transactionTypeSelect = document.getElementById('transaction-type');
const transactionList = document.getElementById('transaction-list');
const INVENTORY_URL = 'http://localhost:5002/api/inventory';

transactionSearchInput?.addEventListener('input', filterTransactionsOnPage);
transactionTypeSelect?.addEventListener('change', loadTransactions);

async function loadTransactions() {
  transactionList.innerHTML = '<tr><td colspan="7" class="empty">Đang tải lịch sử giao dịch...</td></tr>';

  try {
    const type = transactionTypeSelect?.value;
    
    const [productsRes, transRes] = await Promise.all([
      fetch('/api/products'),
      fetch(`${INVENTORY_URL}/transactions`)
    ]);

    const products = await productsRes.json();
    let transactions = await transRes.json();

    if (type && type !== 'ALL') {
      transactions = transactions.filter(t => t.type === type);
    }

    const productMap = {};
    if (Array.isArray(products)) {
      products.forEach(p => { productMap[p._id] = p; });
    }

    if (transactions.length === 0) {
      transactionList.innerHTML = '<tr><td colspan="7" class="empty">Chưa có giao dịch nào.</td></tr>';
      return;
    }

    transactionList.innerHTML = transactions.map((item) => {
      const prod = productMap[item.productId] || {};
      return `
      <tr>
        <td>${prod.name || 'Không xác định'}</td>
        <td>${prod.sku || '-'}</td>
        <td>${item.type === 'IN' ? 'Nhập kho' : 'Xuất kho'}</td>
        <td>${item.quantity}</td>
        <td>${item.beforeQuantity}</td>
        <td>${item.afterQuantity}</td>
        <td>${item.note || '-'}</td>
        <td>${formatDate(item.createdAt)}</td>
      </tr>
      `;
    }).join('');

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
