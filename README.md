# Tài liệu cấu trúc dự án Product Service

## 1. Tổng quan hệ thống

Đây là một dịch vụ backend quản lý sản phẩm (Product Service) được xây dựng bằng Node.js với Express, kết nối với MongoDB để lưu trữ dữ liệu và Redis để cache.

- `Node.js` + `Express` dùng để tạo API RESTful.
- `MongoDB` dùng để lưu dữ liệu sản phẩm.
- `Redis` dùng để cache kết quả lấy danh sách sản phẩm, tăng hiệu năng.
- `Docker` và `docker-compose` dùng để chạy đồng thời 3 service: MongoDB, Redis, và `product-service`.

## 2. Mục tiêu chính

- Quản lý sản phẩm với các thao tác CRUD: tạo, đọc, cập nhật, xoá.
- Hỗ trợ tìm kiếm và lọc sản phẩm.
- Cung cấp cache cho API lấy tất cả sản phẩm để giảm tải MongoDB.
- Chạy được trong môi trường container hoá.

## 3. Cấu trúc thư mục

```
product-service/
├── controllers/
│   └── productController.js
├── models/
│   └── Product.js
├── public/
│   └── index.html
├── routes/
│   └── productRoutes.js
├── .env
├── docker-compose.yml
├── Dockerfile
├── index.js
├── package.json
└── README.md (nếu có)
```

### 3.1 `index.js`

- Là entrypoint của ứng dụng.
- Khởi tạo Express app và cấu hình middleware:
  - `cors()`
  - `express.json()`
  - `express.urlencoded()`
- Kết nối tới MongoDB và Redis.
- Đăng ký route API: `/api/products`.
- Phục vụ file tĩnh từ thư mục `public/`.
- Lắng nghe cổng `PORT`.

### 3.2 `controllers/productController.js`

- Chứa logic xử lý cho các API sản phẩm.
- Các phương thức chính:
  - `createProduct` – tạo sản phẩm mới, kiểm tra SKU tồn tại và xoá cache.
  - `getAllProducts` – lấy danh sách sản phẩm, sử dụng cache Redis, hỗ trợ tìm kiếm và lọc theo category.
  - `getProductById` – lấy chi tiết sản phẩm theo ID.
  - `updateProduct` – cập nhật sản phẩm, kiểm tra trùng SKU và xoá cache.
  - `deleteProduct` – xoá sản phẩm và xoá cache.
- Quản lý cache bằng hàm `delPattern(redisClient, pattern)` để xoá các key liên quan khi dữ liệu thay đổi.

### 3.3 `models/Product.js`

- Định nghĩa schema `Product` với Mongoose.
- Các field chính:
  - `sku`: unique, bắt buộc.
  - `name`: bắt buộc.
  - `costPrice`, `price`, `quantity`: bắt buộc.
  - `entryDate`: ngày nhập hàng.
  - `imageUrl`: URL ảnh.
  - `createdAt`, `updatedAt`: tự động cập nhật.
- Có middleware `pre('save')` và `pre('findOneAndUpdate')` để cập nhật `updatedAt`.

### 3.4 `routes/productRoutes.js`

- Định nghĩa các route RESTful cho sản phẩm:
  - `POST /api/products` – tạo sản phẩm.
  - `GET /api/products` – danh sách sản phẩm.
  - `GET /api/products/:id` – chi tiết sản phẩm.
  - `PUT /api/products/:id` – cập nhật sản phẩm.
  - `DELETE /api/products/:id` – xoá sản phẩm.
- Route này chuyển yêu cầu đến `productController`.

### 3.5 `public/index.html`

- Thư mục chứa tài nguyên tĩnh nếu muốn triển khai UI đơn giản.
- `index.js` cấu hình `express.static()` để phục vụ nội dung trong `public/`.

## 4. Cấu hình Docker

### 4.1 `docker-compose.yml`

- Khởi tạo 3 service:
  - `mongo`: container MongoDB.
  - `redis`: container Redis.
  - `product-service`: container ứng dụng Node.js.
- Các cổng:
  - `mongo`: `27017:27017`
  - `redis`: `6379:6379`
  - `product-service`: `5000:5000`
- `product-service` có volume mount `.:/app` để tự động cập nhật mã nguồn khi phát triển.

### 4.2 `Dockerfile`

- Dùng image `node:20`.
- Thiết lập `WORKDIR /app`.
- Copy `package*.json` và cài dependencies bằng `npm install`.
- Copy toàn bộ mã nguồn.
- Expose cổng `5000`.
- Khởi chạy `node index.js`.

## 5. Mô tả luồng dữ liệu

1. Client gọi API tới `http://localhost:5000/api/products`.
2. `productRoutes` nhận request và chuyển tiếp tới `productController`.
3. `productController` xử lý:
   - Nếu là GET danh sách, kiểm tra cache Redis trước.
   - Nếu cache tồn tại, trả về ngay.
   - Nếu không, truy vấn MongoDB, lưu kết quả vào Redis và trả về kết quả.
4. Nếu có thay đổi dữ liệu (POST/PUT/DELETE), controller sẽ xoá cache liên quan.
5. MongoDB lưu trữ dữ liệu sản phẩm, Redis lưu cache tạm thời.

## 6. Cách chạy dự án

- Chạy nhanh bằng Docker Compose:
  ```bash
  docker-compose up
  ```
- Chạy ở chế độ nền:
  ```bash
  docker-compose up -d
  ```
- Nếu muốn chạy local không dùng Docker:
  ```bash
  npm install
  npm start
  ```

## 7. API chính

- `POST /api/products`
- `GET /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

## 8. Điểm nổi bật để trình bày

- Kiến trúc tách biệt rõ:
  - `routes/` chịu trách nhiệm điều hướng.
  - `controllers/` xử lý nghiệp vụ.
  - `models/` định nghĩa dữ liệu.
- Sử dụng Docker Compose để triển khai đầy đủ nhiều service.
- Kết hợp MongoDB với Redis để tối ưu hoá hiệu năng.
- Hỗ trợ tìm kiếm và lọc sản phẩm.

## 9. Gợi ý mở rộng

- Thêm xác thực người dùng (JWT hoặc OAuth).
- Thêm phân trang cho API `GET /api/products`.
- Thêm CRUD cho `category` hoặc `brand`.
- Thêm dashboard quản lý sản phẩm ở frontend.
