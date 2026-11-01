# Dự Án Website Bất Động Sản (Single Project Showcase & CMS)

Website giới thiệu **MỘT** dự án bất động sản cao cấp ("The Horizon Riverside"), tích hợp hệ quản trị nội dung CMS hoàn chỉnh dành cho ban quản trị, kết nối trực tiếp cơ sở dữ liệu **MongoDB Atlas**, tối ưu SEO công cụ tìm kiếm, thẻ chia sẻ mạng xã hội (OpenGraph), bảo mật nhiều lớp và ưu tiên trải nghiệm thiết bị di động (Mobile-First).

---

## 1. Yêu cầu Môi trường

- **Node.js**: Phiên bản `v18.0.0` trở lên (Khuyến nghị `v20` hoặc `v22 LTS`).
- **NPM**: Phiên bản `9.0.0` trở lên.
- **Cơ sở dữ liệu MongoDB**:
  - **MongoDB Atlas** (Khuyến nghị cho production/staging, cluster M0 miễn phí hoặc M10+).
  - Hoặc **MongoDB Community Server** local (`v6.0+` hoặc `v7.0+`).
- **Hệ điều hành**: Tương thích Windows, macOS, Linux (Ubuntu/Debian, CentOS/RHEL).

---

## 2. Công nghệ sử dụng

- **Runtime & Web Backend**: Node.js (v22+) & Express 5.
- **Database & ODM**: MongoDB Atlas & Mongoose 9 (kết nối an toàn kèm cấu hình timeout và reconnect).
- **Template Engine**: EJS (Server-Side Rendering hỗ trợ SEO, metadata canonical, OpenGraph, JSON-LD Schema.org).
- **Frontend**: HTML5, CSS3 hiện đại (CSS Variables, Flexbox, Grid), Vanilla JavaScript (không dùng React hay frontend framework nặng).
- **Quản lý phiên (Session)**: `express-session` kết hợp `connect-mongo` lưu trữ session trực tiếp vào MongoDB Atlas (`admin_sessions`), cookie HttpOnly, SameSite=Lax, tự động tái tạo session ID (`req.session.regenerate`) sau đăng nhập để chống Session Fixation.
- **Bảo mật & Kiểm duyệt**:
  - `helmet`: Thiết lập bộ tiêu đề bảo mật HTTP (Content-Security-Policy, Cross-Origin-Resource-Policy, X-Frame-Options: SAMEORIGIN, X-Content-Type-Options: nosniff).
  - CSRF Protection: Hệ thống tạo mã xác thực phiên ngẫu nhiên `csrfToken` gắn với session và thẩm tra timing-safe cho mọi tác vụ POST, PUT, DELETE, PATCH bao gồm upload ảnh.
  - Rate Limiting (`express-rate-limit`): Giới hạn tần suất đăng nhập (10 lần / 15 phút) và form yêu cầu tư vấn (5 lần / 15 phút).
  - NoSQL Injection Sanitizer: Tự động lọc bỏ các toán tử `$` và `.` trong body, query và params.
  - XSS Protection & Rich Text Sanitization: `sanitize-html` lọc nội dung bài viết chỉ cho phép thẻ văn bản hợp lệ, chặn mã script độc hại và lược bỏ scheme `data:`.
  - URL Protocol Validator: Kiểm tra nghiêm ngặt URL CTA, Zalo, Messenger chỉ cho phép `http:`, `https:`, `tel:`, `mailto:`, hoặc neo nội bộ `#`, triệt tiêu hoàn toàn `javascript:` hay `vbscript:`.
  - Upload an toàn: Chỉ chấp nhận JPEG, PNG, WebP (tối đa 5MB, chặn hoàn toàn SVG và file thực thi). Tên file do server sinh ngẫu nhiên kèm kiểm tra Magic Bytes (File Signatures) trực tiếp trên file buffer.
- **Tối ưu SEO**:
  - SSR hoàn toàn phía server.
  - `robots.txt` chặn thu thập dữ liệu trang quản trị và healthcheck.
  - `sitemap.xml` tự động tạo động danh sách URL công khai và bài viết đã xuất bản kèm `lastmod`.
  - Canonical link trỏ chuẩn theo domain `APP_URL`.
  - Structured Data Schema.org (JSON-LD) cho dự án bất động sản (`ApartmentComplex`) và bài viết (`Article`), sử dụng 100% dữ liệu thực từ MongoDB.
  - Trang quản trị và xem trước bản nháp có `<meta name="robots" content="noindex, nofollow">`.
- **Tối ưu Mobile & Hiệu năng**:
  - Ảnh Hero/LCP có `fetchpriority="high"`, các ảnh bên dưới có `loading="lazy"`.
  - Thiết lập tỉ lệ khung hình `aspect-ratio` trên các khung ảnh nhằm triệt tiêu dịch chuyển bố cục (CLS).
  - Tự động phát hiện bàn phím ảo di động qua `window.visualViewport` để ẩn thanh liên hệ nổi tránh che khuất các trường nhập liệu.
  - Cache tài nguyên tĩnh với ETag và Header `nosniff`.

---

## 3. Cấu trúc thư mục

```
dbs/
├── .env.example                     # File biến môi trường mẫu
├── .env                             # File cấu hình môi trường cục bộ
├── .gitignore                       # Danh sách loại trừ Git
├── package.json                     # Thông tin gói và scripts
├── package-lock.json                # Lockfile phiên bản chính xác
├── README.md                        # Tài liệu hướng dẫn kỹ thuật
├── scripts/
│   ├── check-overflow.js            # Script kiểm tra CSS responsive & overflow
│   ├── create-admin.js              # Script CLI an toàn tạo tài khoản admin
│   ├── seed.js                      # Script nạp dữ liệu mẫu ban đầu (Idempotent)
│   └── ui-visual-check.js           # Chụp ảnh kiểm thử giao diện các viewport
├── tests/
│   ├── test-helper.js               # Helper quản lý phiên test, cookie & CSRF
│   ├── auth.test.js                 # Kiểm thử phân quyền quản trị, login, logout
│   ├── article.test.js              # Kiểm thử xuất bản, bản nháp, slug, CRUD bài viết
│   ├── lead.test.js                 # Kiểm thử form tư vấn, validation, honeypot
│   ├── security.test.js             # Kiểm thử CSRF, XSS, URL độc hại, Security Headers
│   ├── settings_sections.test.js    # Kiểm thử đồng bộ cài đặt dự án & section
│   └── upload.test.js               # Kiểm thử upload ảnh, Magic Bytes, chống xóa ảnh dùng
├── src/
│   ├── config/
│   │   ├── db.js                    # Kết nối MongoDB Atlas kèm timeout an toàn
│   │   └── session.js               # Cấu hình Express Session & MongoStore
│   ├── models/
│   │   ├── AdminUser.js             # Quản trị viên hệ thống (bcryptjs hash)
│   │   ├── SiteSettings.js          # Cài đặt website, thông số dự án, SEO, footer
│   │   ├── SalesContact.js          # Đầu mối tư vấn chính, hotline, Zalo, Messenger
│   │   ├── HomeSection.js           # 8 section trang chủ với typed validation
│   │   ├── Article.js               # Bài viết, slug tiếng Việt, sanitize rich text
│   │   ├── Media.js                 # Thư viện ảnh & kiểm tra vị trí đang sử dụng
│   │   └── Lead.js                  # Khách hàng đăng ký tư vấn & thời điểm đồng ý
│   ├── controllers/
│   │   ├── public/                  # Điều khiển giao diện khách hàng (Home, Article, Lead, Health, SEO)
│   │   └── admin/                   # Điều khiển phân hệ quản trị (Auth, Dashboard, Settings, Contact, Sections, Articles, Media, Leads)
│   ├── middlewares/
│   │   ├── auth.middleware.js       # Xác thực quyền quản trị
│   │   ├── csrf.middleware.js       # Phòng chống Cross-Site Request Forgery
│   │   ├── errorHandler.middleware.js # Xử lý lỗi tập trung, giấu stack trace trên production
│   │   ├── mongoSanitize.middleware.js # Chống NoSQL Query Injection
│   │   ├── rateLimiter.middleware.js  # Giới hạn tần suất request (Login & Lead Form)
│   │   └── upload.middleware.js     # Upload Multer, giới hạn 5MB, kiểm tra Magic Bytes
│   ├── routes/                      # Định tuyến Public & Admin
│   ├── utils/
│   │   └── urlValidator.js          # Thẩm tra giao thức URL an toàn
│   ├── views/                       # Giao diện EJS (Public, Admin, Partials, Errors)
│   └── public/                      # CSS, JS, hình ảnh tĩnh và uploads
└── server.js                        # Điểm khởi chạy Express server (Helmet, CSP, Trust Proxy)
```

---

## 4. Hướng dẫn Cài đặt & Cấu hình

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Cấu hình biến môi trường (.env)
Tạo file `.env` tại thư mục gốc dự án từ mẫu `.env.example`:
```bash
# Trên Windows (PowerShell):
Copy-Item .env.example .env

# Trên Linux / macOS:
cp .env.example .env
```

Nội dung cấu hình trong file `.env`:
```env
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000
TRUST_PROXY=1

# Kết nối MongoDB Atlas:
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/batdongsan_project?retryWrites=true&w=majority

# Hoặc kết nối MongoDB Local:
# MONGODB_URI=mongodb://127.0.0.1:27017/batdongsan_project

SESSION_SECRET=super_secret_session_key_dbs_change_me_in_prod
ADMIN_DEFAULT_USER=admin
ADMIN_DEFAULT_PASSWORD=Admin@123456
ADMIN_DEFAULT_EMAIL=admin@grandriverfront.vn
```

---

## 5. Khởi tạo Dữ liệu & Tài khoản Quản trị

### Nạp dữ liệu mẫu ban đầu (Idempotent Seed):
Script nạp dữ liệu thông minh, an toàn cho môi trường sản xuất:
- Nếu cơ sở dữ liệu đã có dữ liệu, script sẽ **tự động giữ nguyên** để bảo vệ dữ liệu người dùng.
- Khi muốn xóa toàn bộ và khôi phục dữ liệu mẫu ban đầu, truyền cờ `--force`.

```bash
# Nạp dữ liệu an toàn (bỏ qua nếu DB đã có dữ liệu):
npm run seed

# Nạp đè cưỡng bức (xóa toàn bộ và nạp lại từ đầu):
npm run seed -- --force
```

### Tạo tài khoản quản trị viên mới qua dòng lệnh (CLI):
Cho phép tạo mới hoặc cập nhật mật khẩu tài khoản admin mà không cần hardcode vào source code:
```bash
# Tạo trực tiếp với tham số dòng lệnh:
node scripts/create-admin.js --email="admin@grandriverfront.vn" --password="YourSecurePassword123!" --name="Ban Quản Trị Dự Án"

# Hoặc chạy tương tác với câu hỏi hiển thị trên terminal:
npm run create-admin
```

---

## 6. Lệnh Khởi chạy Ứng dụng

### Chế độ phát triển (Development):
Tự động reload khi có thay đổi code với Node.js native watch:
```bash
npm run dev
```

### Chế độ sản xuất (Production):
Khởi chạy tiến trình ổn định, bật HTTP header cache 7 ngày, bảo vệ stack trace:
```bash
npm start
```

---

## 7. Chạy Kiểm thử Tự động (Automated Testing)

Toàn bộ hệ thống được bảo vệ bởi bộ kiểm thử tự động toàn diện (39 test cases bao phủ 6 phân hệ cốt lõi):
```bash
npm test
```

Nội dung các bài kiểm thử:
- `tests/auth.test.js`: Kiểm thử phân quyền truy cập, chặn người dùng chưa đăng nhập, đổi session ID chống session fixation, đăng nhập sai/đúng và hủy session khi logout.
- `tests/article.test.js`: Kiểm thử điều kiện hiển thị bài viết công khai, chặn bài nháp và bài hẹn giờ tương lai, xem trước admin (noindex), tạo slug tiếng Việt và chu trình CRUD bài viết.
- `tests/lead.test.js`: Kiểm thử form tư vấn, validation số điện thoại VN 10 số, bắt buộc đồng ý điều khoản, honeypot bẫy spambot, cập nhật trạng thái lead và thông báo khi DB ngắt kết nối.
- `tests/security.test.js`: Kiểm thử phòng chống CSRF (403), chặn scheme URL nguy hiểm (`javascript:`, `vbscript:`, `data:`), sanitize HTML chống XSS và tiêu đề bảo mật Helmet.
- `tests/settings_sections.test.js`: Kiểm thử cập nhật thông tin dự án, hotline, Zalo, Messenger đồng bộ thời gian thực, ẩn/hiện và hoán đổi thứ tự section.
- `tests/upload.test.js`: Kiểm thử upload ảnh hợp lệ, kiểm tra chữ ký nhị phân Magic Bytes chống đổi đuôi file giả mạo, từ chối SVG/file thực thi, và ngăn chặn xóa ảnh đang được sử dụng.

Kiểm tra hiển thị giao diện qua các viewport (360px, 390px, 768px, 1024px, 1440px):
```bash
node scripts/ui-visual-check.js
```

---

## 8. Danh sách URL & Phân hệ Website

### Phân hệ Khách hàng (Public):
- **Trang chủ Landing Page**: [http://localhost:3000/](http://localhost:3000/)
- **Robots.txt**: [http://localhost:3000/robots.txt](http://localhost:3000/robots.txt)
- **Sitemap XML**: [http://localhost:3000/sitemap.xml](http://localhost:3000/sitemap.xml)
- **Operational Health Check JSON**: [http://localhost:3000/healthz](http://localhost:3000/healthz)
- **Trang Chi tiết Kết nối Database & Sức khỏe Hệ thống**: [http://localhost:3000/db-status](http://localhost:3000/db-status)

### Phân hệ Quản trị (Admin CMS - Yêu cầu xác thực):
- **Đăng nhập Quản trị viên**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Bảng điều khiển Tổng quan**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Cài đặt Website & Dự án**: [http://localhost:3000/admin/settings](http://localhost:3000/admin/settings)
- **Tư vấn viên & Kênh Hotline**: [http://localhost:3000/admin/contact](http://localhost:3000/admin/contact)
- **Quản lý Section Trang chủ**: [http://localhost:3000/admin/sections](http://localhost:3000/admin/sections)
- **Quản lý Bài viết**: [http://localhost:3000/admin/articles](http://localhost:3000/admin/articles)
- **Thư viện Hình ảnh & Media**: [http://localhost:3000/admin/media](http://localhost:3000/admin/media)
- **Khách hàng Đăng ký Tư vấn (Leads)**: [http://localhost:3000/admin/leads](http://localhost:3000/admin/leads)
- **Đổi mật khẩu Quản trị**: [http://localhost:3000/admin/change-password](http://localhost:3000/admin/change-password)

---

## 9. Vị trí Lưu trữ Ảnh & Yêu cầu Lưu trữ Bền vững (Deployment)

1. **Vị trí lưu trữ cục bộ**:
   - Tất cả hình ảnh tải lên được lưu tại thư mục: `src/public/uploads/`
   - Đường dẫn URL phục vụ: `/uploads/<filename>` (ví dụ: `/uploads/img-1761989400000-abcd1234.png`)
2. **Yêu cầu khi triển khai Production (Docker / VPS / Cloud PaaS)**:
   - Thư mục `src/public/uploads` **phải được gắn (mount) vào một Persistent Volume** (hoặc Docker named volume).
   - Nếu triển khai trên môi trường container không có ổ cứng bền vững (stateless container như Heroku/Render free dyno), dữ liệu ảnh upload sẽ bị mất khi container khởi động lại hoặc redeploy.
   - Giải pháp mở rộng quy mô lớn: Chuyển cấu hình `multer-storage` sang dịch vụ lưu trữ đám mây tương thích S3 (AWS S3, Google Cloud Storage, Cloudflare R2).

---

## 10. Hướng dẫn Sao lưu (Backup) & Khôi phục (Restore)

### 1. Sao lưu Cơ sở dữ liệu MongoDB:
```bash
# Sao lưu toàn bộ database vào thư mục backup kèm ngày tháng:
mongodump --uri="mongodb+srv://<user>:<pass>@cluster0.mongodb.net/batdongsan_project" --out="./backup/db_$(date +%Y%m%d)"
```

### 2. Khôi phục Cơ sở dữ liệu MongoDB:
```bash
# Khôi phục dữ liệu từ bản sao lưu:
mongorestore --uri="mongodb+srv://<user>:<pass>@cluster0.mongodb.net/batdongsan_project" --drop "./backup/db_20261101/batdongsan_project"
```

### 3. Sao lưu Thư mục Hình ảnh Uploads:
```bash
# Nén toàn bộ thư mục ảnh uploads:
tar -czvf "./backup/uploads_$(date +%Y%m%d).tar.gz" src/public/uploads/
```

### 4. Khôi phục Thư mục Hình ảnh Uploads:
```bash
# Giải nén ảnh vào thư mục dự án:
tar -xzvf "./backup/uploads_20261101.tar.gz" -C ./
```

---

## 11. Các hạn chế & Phạm vi phiên bản đầu

1. **Giới thiệu Duy nhất Một Dự án**: Website được thiết kế chuyên biệt để giới thiệu và tối ưu chuyển đổi cho một dự án bất động sản duy nhất. Không xây dựng danh mục tìm kiếm nhiều dự án độc lập.
2. **Không có Cổng thanh toán hoặc Đặt cọc trực tuyến**: Trang web phục vụ mục tiêu cung cấp thông tin, tạo sự tin cậy và thu hút khách hàng tiềm năng liên hệ chuyên viên tư vấn; không hỗ trợ giao dịch thanh toán hoặc giỏ hàng thương mại điện tử.
3. **Phân quyền Đơn cấp**: Phiên bản đầu chỉ hỗ trợ 1 vai trò quản trị viên toàn quyền (`admin`); chưa phân chia quyền chi tiết theo phòng ban (biên tập viên, sale lead, kỹ thuật viên).
4. **Lưu trữ Tệp Cục bộ**: Hiện lưu tệp trên ổ cứng server nội bộ với xác thực Magic Bytes và header `nosniff`. Chưa tích hợp sẵn plugin upload ảnh tự động lên CDN đám mây bên thứ ba.
