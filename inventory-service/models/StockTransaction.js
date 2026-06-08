const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  quantity: { type: Number, required: true },
  beforeQuantity: { type: Number, required: true },
  afterQuantity: { type: Number, required: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
