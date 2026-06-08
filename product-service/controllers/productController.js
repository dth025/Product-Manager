const Product = require('../models/Product');

// Hàm xóa nhiều key theo pattern trong Redis
async function delPattern(redisClient, pattern) {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      // Dùng spread operator để truyền đúng tham số
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error('Failed to delete cache keys:', error);
    // Không throw lỗi ra ngoài để tránh ảnh hưởng flow chính
  }
}

// Tạo sản phẩm mới và xoá cache sau khi tạo
exports.createProduct = async (req, res) => {
  try {
    // Kiểm tra SKU đã tồn tại chưa
    const existing = await Product.findOne({ sku: req.body.sku });
    if (existing) {
      return res.status(400).json({ error: 'SKU đã tồn tại, vui lòng chọn mã khác.' });
    }

    const product = await Product.create(req.body);

    const redisClient = req.app.get('redisClient');
    await delPattern(redisClient, 'products:*');

    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Lấy tất cả sản phẩm 
exports.getAllProducts = async (req, res) => {
  try {
    const redisClient = req.app.get('redisClient');
    const { search = '', category = '' } = req.query;

    const cacheKey = `products:all?search=${search}&category=${category}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (category) filter.category = category;

    const products = await Product.find(filter);

    await redisClient.set(cacheKey, JSON.stringify(products), { EX: 60 });

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy chi tiết sản phẩm theo ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cập nhật sản phẩm và xoá cache
exports.updateProduct = async (req, res) => {
  try {
    if (req.body.sku) {
      const existingSku = await Product.findOne({ sku: req.body.sku, _id: { $ne: req.params.id } });
      if (existingSku) {
        return res.status(400).json({ error: 'SKU đã tồn tại, vui lòng chọn mã khác.' });
      }
    }

    const existing = await Product.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    const redisClient = req.app.get('redisClient');
    await delPattern(redisClient, 'products:*');

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Xoá sản phẩm và xoá cache
exports.deleteProduct = async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

    const redisClient = req.app.get('redisClient');
    await delPattern(redisClient, 'products:*');

    res.status(204).end();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
