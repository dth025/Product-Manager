const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Inventory = require('./models/Inventory');
const StockTransaction = require('./models/StockTransaction');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/inventory';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Inventory Service: MongoDB connected'))
  .catch(err => {
    console.error('Inventory Service: MongoDB error:', err);
    process.exit(1);
  });

app.get('/', (req, res) => {
  res.send('Welcome to Inventory Service API');
});

// Get stock for all products or a specific product
app.get('/api/inventory', async (req, res) => {
  try {
    const { productId } = req.query;
    if (productId) {
      const inv = await Inventory.findOne({ productId });
      return res.json(inv || { productId, quantity: 0 });
    }
    const all = await Inventory.find();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update stock
app.post('/api/inventory/update', async (req, res) => {
  try {
    const { productId, type, quantity, note } = req.body;
    if (!productId || !type || quantity == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let inv = await Inventory.findOne({ productId });
    if (!inv) {
      inv = new Inventory({ productId, quantity: 0 });
    }

    const beforeQuantity = inv.quantity;
    const qtyNum = Number(quantity);
    let afterQuantity = beforeQuantity;

    if (type === 'IN') {
      afterQuantity += qtyNum;
    } else if (type === 'OUT') {
      afterQuantity -= qtyNum;
    }

    inv.quantity = afterQuantity;
    inv.updatedAt = Date.now();
    await inv.save();

    const transaction = await StockTransaction.create({
      productId,
      type,
      quantity: qtyNum,
      beforeQuantity,
      afterQuantity,
      note: note || (type === 'IN' ? 'NHẬP KHO' : 'XUẤT KHO')
    });

    res.json({ inventory: inv, transaction });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize stock (for new products)
app.post('/api/inventory/init', async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const existing = await Inventory.findOne({ productId });
    if (existing) {
      return res.status(400).json({ error: 'Inventory already initialized' });
    }

    const qtyNum = Number(quantity || 0);
    const inv = await Inventory.create({ productId, quantity: qtyNum });

    if (qtyNum > 0) {
      await StockTransaction.create({
        productId,
        type: 'IN',
        quantity: qtyNum,
        beforeQuantity: 0,
        afterQuantity: qtyNum,
        note: 'Initial stock'
      });
    }

    res.status(201).json(inv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete stock (when product is deleted)
app.delete('/api/inventory/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    await Inventory.deleteOne({ productId });
    await StockTransaction.deleteMany({ productId });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get transactions
app.get('/api/inventory/transactions', async (req, res) => {
  try {
    const { productId } = req.query;
    const filter = productId ? { productId } : {};
    const transactions = await StockTransaction.find(filter).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Inventory Service running on port ${PORT}`);
});
