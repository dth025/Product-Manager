async function loadStockReportPage() {
  const reportTotalProducts = document.getElementById('report-total-products');
  const reportTotalQuantity = document.getElementById('report-total-quantity');
  const reportTotalValue = document.getElementById('report-total-value');
  const lowStockList = document.getElementById('low-stock-list');
  const outOfStockList = document.getElementById('out-of-stock-list');

  try {
    const res = await fetch('/api/stock/report');
    const data = await res.json();

    reportTotalProducts.textContent = data.totalProducts || 0;
    reportTotalQuantity.textContent = data.totalQuantity || 0;
    reportTotalValue.textContent = formatCurrency(data.totalValue || 0);

    lowStockList.innerHTML = data.lowStock?.length
      ? data.lowStock.map((item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.sku}</td>
              <td>${item.quantity}</td>
            </tr>
          `).join('')
      : '<tr><td colspan="3" class="empty">Không có sản phẩm sắp hết hàng.</td></tr>';

    outOfStockList.innerHTML = data.outOfStockCount > 0
      ? `<tr><td colspan="3">Có ${data.outOfStockCount} sản phẩm đã hết hàng.</td></tr>`
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
