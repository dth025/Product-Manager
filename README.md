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
- **Sửa lỗi Redis**: Sửa lỗi cấu hình `legacyMode: true` (không tương thích với Promise/await) của thư viện `redis` ở Product Service, giúp hệ thống không bị treo khi truy vấn danh sách và cập nhật sản phẩm.

---

## 7. Cách chạy dự án

### Cách 1: Sử dụng Docker Compose (Khuyên dùng - Nhanh nhất)
Yêu cầu: Máy đã cài đặt Docker Desktop.

```bash
# Khởi chạy tất cả các dịch vụ (Database + 2 NodeJS server) dưới nền
docker compose up -d

# Xem log các service
docker compose logs -f

# Tắt toàn bộ dịch vụ
docker compose down
```

### Cách 2: Chạy trực tiếp qua NPM (Development)
Yêu cầu: Đã tự khởi động MongoDB ở `localhost:27017` và Redis ở `localhost:6379`.

**Bước 1: Chạy Product Service**
Mở Terminal 1 ở thư mục `Product-Manager/product-service`:
```bash
cd product-service
npm install
npm run dev
```
Dịch vụ sẽ chạy ở: `http://localhost:5000`

**Bước 2: Chạy Auth Service**
Mở Terminal 2 ở thư mục `Product-Manager/auth-service`:
```bash
cd auth-service
npm install
npm run dev
```
Dịch vụ sẽ chạy ở: `http://localhost:5001`
