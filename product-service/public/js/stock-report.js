const INVENTORY_URL = 'http://localhost:5002/api/inventory';

async function loadStockReportPage() {
  const reportTotalProducts = document.getElementById('report-total-products');
  const reportTotalQuantity = document.getElementById('report-total-quantity');
  const reportTotalValue = document.getElementById('report-total-value');
  const lowStockList = document.getElementById('low-stock-list');
  const outOfStockList = document.getElementById('out-of-stock-list');

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
    const lowStockArr = [];
    const outOfStockArr = [];

    products.forEach(p => {
      const qty = invMap[p._id] || 0;
      p.quantity = qty;
      totalQuantity += qty;
      totalValue += (p.costPrice || 0) * qty;
      if (qty === 0) outOfStockArr.push(p);
      else if (qty <= 10) lowStockArr.push(p);
    });

    reportTotalProducts.textContent = products.length;
    reportTotalQuantity.textContent = totalQuantity;
    reportTotalValue.textContent = formatCurrency(totalValue);

    lowStockList.innerHTML = lowStockArr.length
      ? lowStockArr.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.sku}</td>
              <td>${item.quantity}</td>
            </tr>
          `).join('')
      : '<tr><td colspan="3" class="empty">Không có sản phẩm sắp hết hàng.</td></tr>';

    outOfStockList.innerHTML = outOfStockArr.length > 0
      ? `<tr><td colspan="3">Có ${outOfStockArr.length} sản phẩm đã hết hàng.</td></tr>`
      : '<tr><td colspan="3" class="empty">Không có sản phẩm hết hàng.</td></tr>';
  } catch (err) {
    reportTotalProducts.textContent = 0;
    reportTotalQuantity.textContent = 0;
    reportTotalValue.textContent = '0₫';
    lowStockList.innerHTML = '<tr><td colspan="3" class="empty">Không thể tải báo cáo tồn kho.</td></tr>';
    outOfStockList.innerHTML = '<tr><td colspan="3" class="empty">Không thể tải báo cáo tồn kho.</td></tr>';
    console.error(err);
  }
}

loadStockReportPage();
