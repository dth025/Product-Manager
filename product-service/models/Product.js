const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: true, unique: true, trim: true },  // SKU duy nhất, bắt buộc, loại bỏ khoảng trắng 2 đầu
  name: { type: String, required: true, trim: true },
  costPrice: { type: Number, required: true },
  price: { type: Number, required: true },
  entryDate: { type: Date, required: true },
  imageUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Tự động cập nhật updatedAt mỗi khi document được save (tạo mới hoặc update)
productSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Tự động cập nhật updatedAt khi dùng findOneAndUpdate hoặc updateOne
productSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Product', productSchema);
