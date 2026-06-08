const Product = require('../models/Product');
const StockTransaction = require('../models/StockTransaction');

exports.getStockReport = async (req, res) => {
  try {
    const products = await Product.find({});

    const totalProducts = products.length;
    const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalValue = products.reduce(
      (sum, p) => sum + ((p.price || 0) * (p.quantity || 0)),
      0
    );

    const lowStock = products
      .filter((p) => p.quantity > 0 && p.quantity <= 10)
      .sort((a, b) => a.quantity - b.quantity)
      .map((p) => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        quantity: p.quantity,
      }));

    const outOfStock = products
      .filter((p) => p.quantity === 0)
      .map((p) => ({ id: p._id, name: p.name, sku: p.sku }));

    res.json({
      totalProducts,
      totalQuantity,
      totalValue,
      lowStock,
      outOfStockCount: outOfStock.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStockTransactions = async (req, res) => {
  try {
    const { productId, type, startDate, endDate, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (productId) filter.productId = productId;
    if (type && ['IN', 'OUT'].includes(type)) filter.type = type;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 50, 1);

    const total = await StockTransaction.countDocuments(filter);
    const transactions = await StockTransaction.find(filter)
      .populate('productId', 'name sku')
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    res.json({ total, page: pageNumber, limit: pageSize, transactions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
