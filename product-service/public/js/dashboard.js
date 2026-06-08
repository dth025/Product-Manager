async function loadDashboard() {
  const reportTotalProducts = document.getElementById('report-total-products');
  const reportTotalQuantity = document.getElementById('report-total-quantity');
  const reportTotalValue = document.getElementById('report-total-value');
  const lowStockCount = document.getElementById('low-stock-count');
  const outOfStockCount = document.getElementById('out-of-stock-count');
  const latestProductsBody = document.getElementById('latest-products-body');

  try {
    const reportRes = await fetch('/api/stock/report');
    const reportData = await reportRes.json();

    reportTotalProducts.textContent = reportData.totalProducts || 0;
    reportTotalQuantity.textContent = reportData.totalQuantity || 0;
    reportTotalValue.textContent = formatCurrency(reportData.totalValue || 0);
    lowStockCount.textContent = reportData.lowStock?.length || 0;
    outOfStockCount.textContent = reportData.outOfStockCount || 0;

    const productsRes = await fetch('/api/products?limit=5');
    const products = await productsRes.json();

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
            <td>${product.quantity || 0}</td>
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
