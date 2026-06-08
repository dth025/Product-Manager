let editingProductId = null;

const statusElement = document.getElementById('status');
const productForm = document.getElementById('product-form');
const searchInput = document.getElementById('searchInput');
const productList = document.getElementById('product-list');
const totalProducts = document.getElementById('total-products');
const totalQuantity = document.getElementById('total-quantity');
const totalRevenue = document.getElementById('total-revenue');

productForm.addEventListener('submit', submitProductForm);
searchInput.addEventListener('input', filterProductsOnPage);

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
    loadProducts();
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
    loadProducts();
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

    loadProducts();
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

loadProducts();
