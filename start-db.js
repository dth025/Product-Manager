const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function startTempDB() {
  console.log('Đang tải cấu hình MongoDB tạm thời (Memory Server)...');
  console.log('Quá trình tải binary có thể mất 1-2 phút lần đầu tiên...');
  
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  console.log('====================================================');
  console.log('✅ TEMP MONGODB ĐÃ KHỞI CHẠY THÀNH CÔNG!');
  console.log(`📍 Kết nối tại: ${uri}`);
  console.log('====================================================\n');

  function updateEnv(serviceName, dbName) {
    const envPath = path.join(__dirname, serviceName, '.env');
    const examplePath = path.join(__dirname, serviceName, '.env.example');
    let content = '';
    
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    } else if (fs.existsSync(examplePath)) {
      content = fs.readFileSync(examplePath, 'utf8');
    }
    
    if (content.includes('MONGO_URI=')) {
      content = content.replace(/MONGO_URI=.*/g, `MONGO_URI=${uri}${dbName}`);
    } else {
      content += `\nMONGO_URI=${uri}${dbName}\n`;
    }
    
    fs.writeFileSync(envPath, content.trim() + '\n');
    console.log(`✅ Đã cập nhật kết nối cho: ${serviceName}/.env`);
  }

  updateEnv('product-service', 'products');
  updateEnv('auth-service', 'auth');
  updateEnv('inventory-service', 'inventory');


  console.log('\n⚠️ QUAN TRỌNG:');
  console.log('1. Vui lòng GIỮ NGUYÊN CỬA SỔ TERMINAL NÀY để Database duy trì hoạt động.');
  console.log('2. Quay lại các cửa sổ chạy npm run dev của product và auth để xem kết quả!');
  console.log('3. Redis lỗi đã được fix, ứng dụng sẽ chạy ngay cả khi không có Redis.');
  
  console.log('\n🚀 Đang khởi động các dịch vụ (Product, Auth, Inventory)...');
  const npx = /^win/.test(process.platform) ? 'npx.cmd' : 'npx';
  spawn(npx, ['-y', 'concurrently', '\"npm run start-product\"', '\"npm run start-auth\"', '\"npm run start-inventory\"'], { stdio: 'inherit', shell: true });

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
