const INVENTORY_URL = 'http://localhost:5002/api/inventory';

async function loadDashboard() {
  const reportTotalProducts = document.getElementById('report-total-products');
  const reportTotalQuantity = document.getElementById('report-total-quantity');
  const reportTotalValue = document.getElementById('report-total-value');
  const lowStockCount = document.getElementById('low-stock-count');
  const outOfStockCount = document.getElementById('out-of-stock-count');
  const latestProductsBody = document.getElementById('latest-products-body');

  try {
    const [productsRes, invRes] = await Promise.all([
      fetch('/api/products'),
      fetch(INVENTORY_URL)
    ]);
    const products = await productsRes.json();
    const inventory = await invRes.json();

    const invMap = {};
    if (Array.isArray(inventory)) {
      inventory.forEach(i => { invMap[i.productId] = i.quantity; });
    }

    let totalQuantity = 0;
    let totalValue = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.forEach(p => {
      const qty = invMap[p._id] || 0;
      p.quantity = qty;
      totalQuantity += qty;
      totalValue += (p.costPrice || 0) * qty;
      if (qty === 0) outOfStock++;
      else if (qty <= 10) lowStock++;
    });

    reportTotalProducts.textContent = products.length;
    reportTotalQuantity.textContent = totalQuantity;
    reportTotalValue.textContent = formatCurrency(totalValue);
    lowStockCount.textContent = lowStock;
    outOfStockCount.textContent = outOfStock;

    if (!products || products.length === 0) {
      latestProductsBody.innerHTML = '<tr><td colspan="5" class="empty">Chưa có sản phẩm nào.</td></tr>';
      return;
    }

    const sorted = products.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const topProducts = sorted.slice(0, 5);

    latestProductsBody.innerHTML = topProducts
      .map((product) => {
        const status = product.quantity > 10 ? 'Còn hàng' : product.quantity > 0 ? 'Sắp hết' : 'Hết hàng';
        return `
          <tr>
            <td>${product.name}</td>
            <td>${product.sku || '-'}</td>
            <td>${formatDate(product.entryDate)}</td>
            <td>${product.quantity}</td>
            <td>${status}</td>
          </tr>
        `;
      })
      .join('');
  } catch (error) {
    reportTotalProducts.textContent = 0;
    reportTotalQuantity.textContent = 0;
    reportTotalValue.textContent = '0₫';
    lowStockCount.textContent = 0;
    outOfStockCount.textContent = 0;
    latestProductsBody.innerHTML = '<tr><td colspan="5" class="empty">Không thể tải dữ liệu dashboard.</td></tr>';
    console.error(error);
  }
}

loadDashboard();
