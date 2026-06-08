let editingProductId = null;
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const searchInput = document.getElementById('searchInput');
const statusElement = document.getElementById('status');

productForm.addEventListener('submit', submitProductForm);
searchInput.addEventListener('input', filterProductsOnPage);

async function loadProducts() {
  productList.innerHTML = '<tr><td colspan="8" class="empty">Đang tải danh sách sản phẩm...</td></tr>';

  try {
    const search = searchInput.value.trim();
    const url = `/api/products${search ? `?search=${encodeURIComponent(search)}` : ''}`;
    const res = await fetch(url);
    const products = await res.json();

    if (!Array.isArray(products) || products.length === 0) {
      productList.innerHTML = '<tr><td colspan="8" class="empty">Không tìm thấy sản phẩm nào.</td></tr>';
      return;
    }

    productList.innerHTML = '';
    products.forEach((p) => {
      if (!p || typeof p !== 'object') return;
      const stockClass = (p.quantity || 0) > 10 ? 'in-stock' : (p.quantity || 0) > 0 ? 'low-stock' : 'out-stock';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="${p.imageUrl || 'https://via.placeholder.com/70'}" alt="${p.name || 'Sản phẩm'}"></td>
        <td style="font-weight:600;">${p.name || '-'}</td>
        <td>${p.sku || '-'}</td>
        <td>${formatDate(p.entryDate)}</td>
        <td>${formatCurrency(p.costPrice)}</td>
        <td>${formatCurrency(p.price)}</td>
        <td><span class="stock-badge ${stockClass}">${p.quantity || 0}</span></td>
        <td class="product-actions">
          <button class="edit small-btn" type="button" onclick="startEditProduct('${p._id}')">Sửa</button>
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

  // Kiểm tra các input tồn tại trước
  const nameInput = document.getElementById('name');
  const skuInput = document.getElementById('sku');
  const entryDateInput = document.getElementById('entryDate');
  const costPriceInput = document.getElementById('costPrice');
  const priceInput = document.getElementById('price');
  const quantityInput = document.getElementById('quantity');
  const imageInput = document.getElementById('image');

  if (!nameInput || !skuInput || !entryDateInput || !costPriceInput || !priceInput || !quantityInput) {
    alert('Lỗi: Một số trường input không tìm thấy trong trang.');
    return;
  }

  // Tạo object data
  const data = {
    name: nameInput.value.trim(),
    sku: skuInput.value.trim(),
    entryDate: entryDateInput.value,
    costPrice: costPriceInput.value,
    price: priceInput.value,
    quantity: quantityInput.value,
  };

  try {
    // Nếu có ảnh, gửi FormData + params; không thì gửi JSON
    const hasImage = imageInput && imageInput.files && imageInput.files[0];
    
    const method = editingProductId ? 'PUT' : 'POST';
    let url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
    
    let res;
    
    if (hasImage) {
      // Gửi FormData với ảnh + text fields qua URL params
      const params = new URLSearchParams(data);
      url += `?${params.toString()}`;
      
      const formData = new FormData();
      formData.append('image', imageInput.files[0]);
      
      console.log('Sending FormData with image and URL params:', { url, hasImage: true });
      
      res = await fetch(url, {
        method,
        body: formData,
      });
    } else {
      // Gửi JSON mà không ảnh
      console.log('Sending JSON data');
      
      res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    const responseData = await res.json();
    
    if (!res.ok) {
      throw new Error(responseData.error || responseData.message || 'Đã có lỗi xảy ra.');
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

async function startEditProduct(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Không thể tải sản phẩm.');
    }
    const product = await res.json();
    if (!product || typeof product !== 'object') {
      throw new Error('Dữ liệu sản phẩm không hợp lệ.');
    }

    editingProductId = id;
    document.getElementById('name').value = product.name || '';
    document.getElementById('sku').value = product.sku || '';
    document.getElementById('entryDate').value = product.entryDate?.split('T')[0] || '';
    document.getElementById('costPrice').value = product.costPrice || '';
    document.getElementById('price').value = product.price || '';
    document.getElementById('quantity').value = product.quantity || 0;
    document.getElementById('image').value = '';
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
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || 'Xóa thất bại.');
    }
    statusElement.textContent = '🗑️ Đã xóa sản phẩm.';
    await loadProducts();
  } catch (err) {
    alert(err.message);
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
}

function filterProductsOnPage() {
  const keyword = searchInput.value.toLowerCase();
  document.querySelectorAll('#product-list tr').forEach((row) => {
    row.style.display = row.textContent.toLowerCase().includes(keyword) ? '' : 'none';
  });
}

loadProducts();
