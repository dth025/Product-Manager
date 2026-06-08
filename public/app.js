let editingProductId = null;

const statusElement = document.getElementById('status');
const productForm = document.getElementById('product-form');
const searchInput = document.getElementById('searchInput');
const productList = document.getElementById('product-list');
const totalProducts = document.getElementById('total-products');
const totalQuantity = document.getElementById('total-quantity');
const totalRevenue = document.getElementById('total-revenue');
const reportTotalProducts = document.getElementById('report-total-products');
const reportTotalQuantity = document.getElementById('report-total-quantity');
const reportTotalValue = document.getElementById('report-total-value');
const lowStockList = document.getElementById('low-stock-list');
const transactionList = document.getElementById('transaction-list');
const transactionSearchInput = document.getElementById('transactionSearchInput');

productForm.addEventListener('submit', submitProductForm);
searchInput.addEventListener('input', filterProductsOnPage);
transactionSearchInput.addEventListener('input', filterTransactionsOnPage);

async function loadProducts() {
  productList.innerHTML = `
    <tr>
      <td colspan="8" class="empty">
        Loading...
      </td>
    </tr>
  `;

  try {
    const res = await fetch('/api/products');
    const data = await res.json();

    if (!data || data.length === 0) {
      productList.innerHTML = `
        <tr>
          <td colspan="8" class="empty">No products found.</td>
        </tr>
      `;
      totalProducts.textContent = 0;
      totalQuantity.textContent = 0;
      totalRevenue.textContent = '0₫';
      return;
    }

    productList.innerHTML = '';

    totalProducts.textContent = data.length;

    const totalQty = data.reduce((sum, p) => sum + (p.quantity || 0), 0);
    totalQuantity.textContent = totalQty;

    const revenue = data.reduce(
      (sum, p) => sum + ((p.price || 0) * (p.quantity || 0)),
      0
    );
    totalRevenue.textContent = revenue.toLocaleString() + '₫';

    data.forEach((p) => {
      let stockBadge = '';

      if (p.quantity > 10) {
        stockBadge = `<span class="stock-badge in-stock">Còn hàng</span>`;
      } else if (p.quantity > 0) {
        stockBadge = `<span class="stock-badge low-stock">Sắp hết hàng</span>`;
      } else {
        stockBadge = `<span class="stock-badge out-stock">Hết hàng</span>`;
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>
          <img src="${p.imageUrl || 'https://via.placeholder.com/70'}" alt="${p.name}">
        </td>
        <td style="font-weight: 600;">${p.name}</td>
        <td>${p.sku || ''}</td>
        <td>${new Date(p.entryDate).toLocaleDateString()}</td>
        <td style="color: #64748b;">${(p.costPrice || 0).toLocaleString()}₫</td>
        <td style="font-weight: 600; color: var(--accent);">${(p.price || 0).toLocaleString()}₫</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <strong>${p.quantity || 0}</strong>
            ${stockBadge}
          </div>
        </td>
        <td class="product-actions">
          <button class="edit small-btn" onclick="startEditProduct('${p._id}')">Sửa</button>
          <button class="secondary small-btn success" onclick="changeStock('${p._id}', 1)">Nhập kho</button>
          <button class="secondary small-btn warning" onclick="changeStock('${p._id}', -1)">Bán hàng</button>
          <button class="delete small-btn" onclick="deleteProduct('${p._id}')">Xóa</button>
        </td>
      `;

      productList.appendChild(row);
    });

    filterProductsOnPage();
  } catch (err) {
    productList.innerHTML = `
      <tr>
        <td colspan="8" class="empty">Failed to load products.</td>
      </tr>
    `;
    console.error(err);
  }
}

async function loadStockReport() {
  try {
    const res = await fetch('/api/stock/report');
    const data = await res.json();

    reportTotalProducts.textContent = data.totalProducts;
    reportTotalQuantity.textContent = data.totalQuantity;
    reportTotalValue.textContent = (data.totalValue || 0).toLocaleString() + '₫';

    if (!data.lowStock || data.lowStock.length === 0) {
      lowStockList.innerHTML = `
        <tr>
          <td colspan="3" class="empty">Không có sản phẩm sắp hết.</td>
        </tr>
      `;
    } else {
      lowStockList.innerHTML = '';
      data.lowStock.forEach((item) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight:600;">${item.name}</td>
          <td>${item.sku}</td>
          <td>${item.quantity}</td>
        `;
        lowStockList.appendChild(row);
      });
    }
  } catch (err) {
    lowStockList.innerHTML = `
      <tr>
        <td colspan="3" class="empty">Không thể tải báo cáo tồn kho.</td>
      </tr>
    `;
    console.error(err);
  }
}

async function loadStockTransactions() {
  transactionList.innerHTML = `
    <tr>
      <td colspan="7" class="empty">Loading transactions...</td>
    </tr>
  `;

  try {
    const res = await fetch('/api/stock/transactions?limit=30');
    const data = await res.json();

    if (!data.transactions || data.transactions.length === 0) {
      transactionList.innerHTML = `
        <tr>
          <td colspan="7" class="empty">Chưa có giao dịch nào.</td>
        </tr>
      `;
      return;
    }

    transactionList.innerHTML = '';
    data.transactions.forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.productId?.name || 'Không xác định'}</td>
        <td>${item.type === 'IN' ? 'Nhập kho' : 'Bán hàng'}</td>
        <td>${item.quantity}</td>
        <td>${item.beforeQuantity}</td>
        <td>${item.afterQuantity}</td>
        <td>${item.note || '-'}</td>
        <td>${new Date(item.createdAt).toLocaleString()}</td>
      `;
      transactionList.appendChild(row);
    });
  } catch (err) {
    transactionList.innerHTML = `
      <tr>
        <td colspan="7" class="empty">Không thể tải lịch sử giao dịch.</td>
      </tr>
    `;
    console.error(err);
  }
}

function filterTransactionsOnPage() {
  const keyword = transactionSearchInput.value.toLowerCase();
  const rows = document.querySelectorAll('#transaction-list tr');
  rows.forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(keyword) ? '' : 'none';
  });
}

async function submitProductForm(event) {
  event.preventDefault();

  const payload = {
    name: document.getElementById('name').value.trim(),
    sku: document.getElementById('sku').value.trim(),
    entryDate: document.getElementById('entryDate').value,
    costPrice: parseFloat(document.getElementById('costPrice').value),
    price: parseFloat(document.getElementById('price').value),
    quantity: parseInt(document.getElementById('quantity').value, 10),
    imageUrl: document.getElementById('imageUrl').value.trim(),
  };

  try {
    const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
    const method = editingProductId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }

    statusElement.textContent = editingProductId
      ? '✅ Cập nhật sản phẩm thành công.'
      : '✅ Thêm sản phẩm thành công.';

    resetForm();
    await loadProducts();
    await loadStockReport();
    await loadStockTransactions();
  } catch (err) {
    alert('Error: ' + err.message);
    console.error(err);
  }
}

async function deleteProduct(id) {
  if (!confirm('Xác nhận xóa sản phẩm này?')) return;

  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');

    statusElement.textContent = '🗑️ Product deleted successfully.';
    await loadProducts();
    await loadStockReport();
    await loadStockTransactions();
  } catch (err) {
    alert(err.message);
  }
}

async function startEditProduct(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Cannot load product');
    const p = await res.json();

    editingProductId = id;
    document.getElementById('name').value = p.name || '';
    document.getElementById('sku').value = p.sku || '';
    document.getElementById('entryDate').value = p.entryDate?.split('T')[0] || '';
    document.getElementById('costPrice').value = p.costPrice || '';
    document.getElementById('price').value = p.price || '';
    document.getElementById('quantity').value = p.quantity || '';
    document.getElementById('imageUrl').value = p.imageUrl || '';

    document.getElementById('submit-btn').textContent = 'Cập nhật sản phẩm';
    document.getElementById('cancel-btn').style.display = 'inline-block';
  } catch (err) {
    alert('Failed to load product.');
  }
}

function cancelEdit() {
  resetForm();
}

function resetForm() {
  editingProductId = null;
  productForm.reset();
  document.getElementById('submit-btn').textContent = 'Thêm sản phẩm';
  document.getElementById('cancel-btn').style.display = 'none';
  statusElement.textContent = '';
}

async function changeStock(id, direction) {
  const action = direction > 0 ? 'Nhập kho' : 'Bán hàng';
  const defaultValue = Math.abs(direction);
  const input = prompt(`${action} số lượng`, defaultValue);
  if (input === null) return;

  const amount = parseInt(input, 10);
  if (Number.isNaN(amount) || amount <= 0) {
    alert('Số lượng phải là số nguyên dương.');
    return;
  }

  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Không lấy được sản phẩm.');
    const product = await res.json();

    const newQuantity = product.quantity + direction * amount;
    if (newQuantity < 0) {
      alert('Không đủ tồn kho để bán.');
      return;
    }

    const updateRes = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: newQuantity }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(errText || 'Update failed');
    }

    statusElement.textContent = direction > 0
      ? `✅ Đã nhập kho ${amount} sản phẩm.`
      : `✅ Đã bán ${amount} sản phẩm.`;

    await loadProducts();
    await loadStockReport();
    await loadStockTransactions();
  } catch (err) {
    alert(err.message);
    console.error(err);
  }
}

function filterProductsOnPage() {
  const keyword = searchInput.value.toLowerCase();
  const rows = document.querySelectorAll('#product-list tr');
  rows.forEach((row) => {
    row.style.display = row.innerText.toLowerCase().includes(keyword) ? '' : 'none';
  });
}

loadProducts().then(() => {
  loadStockReport();
  loadStockTransactions();
});
