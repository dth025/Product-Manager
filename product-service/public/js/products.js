let editingProductId = null;
let currentProductQuantity = 0;
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const searchInput = document.getElementById('searchInput');
const statusElement = document.getElementById('status');
const INVENTORY_URL = 'http://localhost:5002/api/inventory';

productForm.addEventListener('submit', submitProductForm);
searchInput.addEventListener('input', filterProductsOnPage);

async function loadProducts() {
  productList.innerHTML = '<tr><td colspan="8" class="empty">Đang tải danh sách sản phẩm...</td></tr>';

  try {
    const search = searchInput.value.trim();
    const url = `/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`;
    
    // Fetch products
    const res = await fetch(url);
    const products = await res.json();

    // Fetch inventory
    const invRes = await fetch(INVENTORY_URL);
    const inventory = await invRes.json();
    const invMap = {};
    if (Array.isArray(inventory)) {
      inventory.forEach(i => { invMap[i.productId] = i.quantity; });
    }

    if (!Array.isArray(products) || products.length === 0) {
      productList.innerHTML = '<tr><td colspan="8" class="empty">Không tìm thấy sản phẩm nào.</td></tr>';
      return;
    }

    productList.innerHTML = '';
    products.forEach((p) => {
      if (!p || typeof p !== 'object') return;
      const qty = invMap[p._id] || 0;
      const stockClass = qty > 10 ? 'in-stock' : qty > 0 ? 'low-stock' : 'out-stock';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-weight:600;">${p.name || '-'}</td>
        <td>${p.sku || '-'}</td>
        <td>${formatDate(p.entryDate)}</td>
        <td>${formatCurrency(p.costPrice)}</td>
        <td>${formatCurrency(p.price)}</td>
        <td><span class="stock-badge ${stockClass}">${qty}</span></td>
        <td class="product-actions">
          <button class="edit small-btn" type="button" onclick="startEditProduct('${p._id}', ${qty})">Sửa</button>
          <button class="secondary small-btn success" type="button" onclick="deleteProduct('${p._id}')">Xóa</button>
        </td>
      `;
      productList.appendChild(row);
    });
  } catch (err) {
    productList.innerHTML = '<tr><td colspan="8" class="empty">Không thể tải sản phẩm.</td></tr>';
    console.error(err);
  }
}

async function submitProductForm(event) {
  event.preventDefault();

  const nameInput = document.getElementById('name');
  const skuInput = document.getElementById('sku');
  const entryDateInput = document.getElementById('entryDate');
  const costPriceInput = document.getElementById('costPrice');
  const priceInput = document.getElementById('price');
  const quantityInput = document.getElementById('quantity');

  const data = {
    name: nameInput.value.trim(),
    sku: skuInput.value.trim(),
    entryDate: entryDateInput.value,
    costPrice: Number(costPriceInput.value),
    price: Number(priceInput.value),
  };
  
  const quantity = Number(quantityInput.value);

  try {
    const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
    const method = editingProductId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const responseData = await res.json();
    if (!res.ok) throw new Error(responseData.error || responseData.message || 'Đã có lỗi xảy ra.');

    const productId = editingProductId || responseData._id;

    if (!editingProductId) {
      // Create stock for new product
      await fetch(`${INVENTORY_URL}/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      });
    } else {
      // Update stock if changed
      if (quantity !== currentProductQuantity) {
        const type = quantity > currentProductQuantity ? 'IN' : 'OUT';
        const diff = Math.abs(quantity - currentProductQuantity);
        await fetch(`${INVENTORY_URL}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, type, quantity: diff, note: 'Cập nhật từ trang sản phẩm' })
        });
      }
    }

    statusElement.textContent = editingProductId ? '✅ Cập nhật sản phẩm thành công.' : '✅ Thêm sản phẩm thành công.';
    resetForm();
    await loadProducts();

  } catch (err) {
    statusElement.textContent = '';
    alert(err.message);
    console.error(err);
  }
}

async function startEditProduct(id, qty) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) throw new Error('Không thể tải sản phẩm.');
    const product = await res.json();

    editingProductId = id;
    currentProductQuantity = qty || 0;
    
    document.getElementById('name').value = product.name || '';
    document.getElementById('sku').value = product.sku || '';
    document.getElementById('entryDate').value = product.entryDate?.split('T')[0] || '';
    document.getElementById('costPrice').value = product.costPrice || '';
    document.getElementById('price').value = product.price || '';
    document.getElementById('quantity').value = currentProductQuantity;
    document.getElementById('submit-btn').textContent = 'Cập nhật sản phẩm';
    document.getElementById('cancel-btn').style.display = 'inline-flex';
  } catch (err) {
    alert(err.message);
  }
}

async function deleteProduct(id) {
  if (!confirm('Xác nhận xóa sản phẩm này?')) return;
  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Xóa thất bại.');
    
    await fetch(`${INVENTORY_URL}/${id}`, { method: 'DELETE' });

    statusElement.textContent = '🗑️ Đã xóa sản phẩm.';
    await loadProducts();
  } catch (err) {
    alert(err.message);
  }
}

function cancelEdit() { resetForm(); }

function resetForm() {
  editingProductId = null;
  currentProductQuantity = 0;
  productForm.reset();
  document.getElementById('submit-btn').textContent = 'Thêm sản phẩm';
  document.getElementById('cancel-btn').style.display = 'none';
}

function filterProductsOnPage() {
  const keyword = searchInput.value.toLowerCase();
  document.querySelectorAll('#product-list tr').forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(keyword) ? '' : 'none';
  });
}

loadProducts();
