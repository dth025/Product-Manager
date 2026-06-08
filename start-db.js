const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

async function startTempDB() {
  console.log('Đang tải cấu hình MongoDB tạm thời (Memory Server)...');
  console.log('Quá trình tải binary có thể mất 1-2 phút lần đầu tiên...');
  
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  console.log('====================================================');
  console.log('✅ TEMP MONGODB ĐÃ KHỞI CHẠY THÀNH CÔNG!');
  console.log(`📍 Kết nối tại: ${uri}`);
  console.log('====================================================\n');

  // Cập nhật product-service/.env
  const productEnvPath = path.join(__dirname, 'product-service', '.env');
  if (fs.existsSync(productEnvPath)) {
    let content = fs.readFileSync(productEnvPath, 'utf8');
    content = content.replace(/MONGO_URI=.*/g, `MONGO_URI=${uri}products`);
    fs.writeFileSync(productEnvPath, content);
    console.log('✅ Đã cập nhật kết nối cho: product-service/.env');
  }

  // Cập nhật auth-service/.env
  const authEnvPath = path.join(__dirname, 'auth-service', '.env');
  if (fs.existsSync(authEnvPath)) {
    let content = fs.readFileSync(authEnvPath, 'utf8');
    content = content.replace(/MONGO_URI=.*/g, `MONGO_URI=${uri}auth`);
    fs.writeFileSync(authEnvPath, content);
    console.log('✅ Đã cập nhật kết nối cho: auth-service/.env');
  }

  console.log('\n⚠️ QUAN TRỌNG:');
  console.log('1. Vui lòng GIỮ NGUYÊN CỬA SỔ TERMINAL NÀY để Database duy trì hoạt động.');
  console.log('2. Quay lại các cửa sổ chạy npm run dev của product và auth để xem kết quả!');
  console.log('3. Redis lỗi đã được fix, ứng dụng sẽ chạy ngay cả khi không có Redis.');
  
  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('Đang tắt database...');
    await mongod.stop();
    process.exit();
  });
}

startTempDB().catch(err => {
  console.error('Lỗi khi khởi chạy database:', err);
});
