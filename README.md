# Tài liệu cấu trúc dự án Product Service & Auth Service (Microservices)

## 1. Tổng quan hệ thống

Đây là một hệ thống backend kết hợp giao diện quản lý được xây dựng theo kiến trúc Microservices với Node.js và Express. Hệ thống bao gồm 2 dịch vụ chính, kết nối với MongoDB và Redis.

- **Product Service** (Cổng `5000`): Quản lý sản phẩm, tồn kho và cung cấp giao diện người dùng. Có sử dụng Redis để cache dữ liệu API.
- **Auth Service** (Cổng `5001`): Dịch vụ xác thực độc lập, xử lý Đăng ký, Đăng nhập và sinh JWT Token.
- `MongoDB` dùng để lưu trữ dữ liệu. Dữ liệu của Product và Auth được tách biệt hoàn toàn ở 2 database khác nhau (`products` và `auth`).
- `Redis` dùng để cache kết quả lấy danh sách sản phẩm, tăng hiệu năng.
- `Docker Compose` dùng để chạy đồng thời cả 4 thành phần: MongoDB, Redis, Product Service, Auth Service.

## 2. Mục tiêu chính

- **Product Service**: 
  - Quản lý sản phẩm với các thao tác CRUD.
  - Hỗ trợ nhập kho và bán hàng trực tiếp từ giao diện được chia khu vực rõ ràng.
  - Bộ đệm Cache (Redis) giúp tối ưu hiệu suất API.
- **Auth Service**:
  - Quản lý người dùng và cấp phát Token JWT bảo mật.

## 3. Cấu trúc thư mục

```text
Product-Manager/
├── auth-service/                  # Dịch vụ xác thực
│   ├── models/
│   │   └── User.js                # Schema tài khoản
│   ├── index.js                   # Entrypoint, API Auth
│   ├── package.json
│   └── Dockerfile
├── product-service/               # Dịch vụ sản phẩm
│   ├── controllers/
│   ├── models/
│   ├── public/
│   ├── routes/
│   ├── Dockerfile
│   ├── index.js
│   └── package.json
├── docker-compose.yml             # Cấu hình chạy toàn bộ hệ thống
└── README.md
```

## 4. Cấu hình Docker (`docker-compose.yml`)

Hệ thống được thiết lập chạy bằng lệnh duy nhất qua Docker Compose.
- `mongo`: Chạy ở cổng `27017`.
- `redis`: Chạy ở cổng `6379`.
- `product-service`: Chạy ở cổng `5000`, mount thư mục hiện tại để tự động reload khi code thay đổi, truy cập DB `products`.
- `auth-service`: Chạy ở cổng `5001`, mount thư mục `auth-service`, truy cập DB `auth`.

## 5. API chính

### Product Service (Port `5000`)
- `POST /api/products` - Thêm sản phẩm mới.
- `GET /api/products` - Lấy danh sách sản phẩm.
- `GET /api/products/:id` - Lấy chi tiết sản phẩm.
- `PUT /api/products/:id` - Cập nhật thông tin hoặc số lượng (giao dịch tồn kho).
- `DELETE /api/products/:id` - Xóa sản phẩm.
- `GET /api/stock/report` - Báo cáo tồn kho.
- `GET /api/stock/transactions` - Lịch sử nhập/xuất kho.

### Auth Service (Port `5001`)
- `POST /api/auth/register` - Đăng ký tài khoản (Yêu cầu body `{ username, password }`).
- `POST /api/auth/login` - Đăng nhập (Trả về `token` JWT).

## 6. Sửa lỗi & Nâng cấp nổi bật
- **Visual Separation**: Giao diện UI (`index.html`) đã được tinh chỉnh, tách biệt trực quan "Thông tin chung" và "Thông tin tồn kho" giúp người dùng dễ dàng thao tác mà không làm thay đổi luồng nghiệp vụ API nguyên bản.
- **Sửa lỗi & Mock Redis**: Sửa lỗi cấu hình `legacyMode: true` của thư viện `redis` ở Product Service. Thêm cơ chế **Tự động Fallback (Mock Redis)**: Nếu Redis không chạy, hệ thống vẫn hoạt động mượt mà bằng bộ nhớ tạm thay vì bị crash.
- **Tự động hóa Database**: Thêm kịch bản khởi chạy MongoDB ảo trên RAM (`start-db.js`) giúp các lập trình viên có thể chạy dự án ngay lập tức mà không cần cài đặt MongoDB hay Docker.

---

## 7. Chi tiết Database
Hệ thống sử dụng **2 Database độc lập** (Kiến trúc Microservices):
1. **Database `products`** (Dùng cho Product Service):
   - Bảng `Product`: Quản lý thông tin hàng hóa.
   - Bảng `StockTransaction`: Quản lý lịch sử xuất/nhập kho.
2. **Database `auth`** (Dùng cho Auth Service):
   - Bảng `User`: Quản lý tài khoản đăng nhập (mật khẩu mã hóa).

---

## 8. Cách chạy dự án

### Cách 1: Chạy Tự động hoàn toàn (Không cần cài đặt Database) - KHUYÊN DÙNG NHẤT
Yêu cầu: Máy chỉ cần có Node.js.
1. Mở Terminal tại thư mục gốc, cài đặt thư viện ảo: `npm install mongodb-memory-server dotenv`
2. Mở Terminal 1 (Thư mục gốc) và chạy để bật DB ảo: `node start-db.js`
3. Mở Terminal 2 (`cd product-service`): chạy `npm run dev` (sẽ chạy ở `http://localhost:5000`)
4. Mở Terminal 3 (`cd auth-service`): chạy `npm run dev` (sẽ chạy ở `http://localhost:5001`)

### Cách 2: Sử dụng Docker Compose
Yêu cầu: Máy đã cài đặt Docker Desktop.

```bash
# Khởi chạy tất cả các dịch vụ (Database + 2 NodeJS server) dưới nền
docker compose up -d

# Xem log các service
docker compose logs -f

# Tắt toàn bộ dịch vụ
docker compose down
```

### Cách 3: Chạy trực tiếp qua NPM với DB thật
Yêu cầu: Đã tự khởi động MongoDB ở `localhost:27017` và Redis ở `localhost:6379`. (Nếu không có Redis, hệ thống tự bỏ qua cache).

**Bước 1: Chạy Product Service**
```bash
cd product-service
npm install
npm run dev
```

**Bước 2: Chạy Auth Service**
```bash
cd auth-service
npm install
npm run dev
```
