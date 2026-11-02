# ĐẶC TẢ GIAO TIẾP API (RESTFUL API SPECIFICATION)

**Đề tài:** Xây dựng hệ thống truyền thông và phân tích dữ liệu hành vi người dùng cho sản phẩm nông nghiệp truyền thống địa phương (Tỉnh Sơn La)  
**Base URL:** `http://localhost:8000/api/v1`  
**Tài liệu Swagger UI tương tác:** `http://localhost:8000/docs`

---

## 1. Nhóm Public APIs (Cổng thông tin, Gợi ý & Thu thập Sự kiện)

### 1.1. `GET /api/v1/products` — Danh sách sản phẩm nông sản Sơn La
- **Tham số Query (Tùy chọn):**
  - `category_id` (`int`): Lọc theo mã danh mục (`1`: Đồ uống, `2`: Trái cây, `3`: Sản phẩm chế biến, `4`: Nông sản).
  - `category_slug` (`str`): Lọc theo slug danh mục (`do-uong`, `trai-cay`, `san-pham-che-bien`, `nong-san`).
  - `location_id` (`int`): Lọc theo mã vùng trồng Sơn La (`1..5`).
  - `q` (`str`): Từ khóa tìm kiếm theo tên, mô tả, từ khóa, vùng xuất xứ.
  - `sort` (`str`): `featured` (mặc định), `popular` (theo lượt xem), `favorites` (theo lượt yêu thích).
- **Phản hồi mẫu (`200 OK`):**
```json
{
  "total": 8,
  "items": [
    {
      "product_id": 1,
      "product_name": "Cà phê Arabica Sơn La",
      "slug": "ca-phe-arabica-son-la",
      "category_id": 1,
      "location_id": 1,
      "origin": "Huyện Mai Sơn & TP. Sơn La, Tỉnh Sơn La",
      "certification": "Chỉ dẫn địa lý Sơn La · OCOP 5 Sao Quốc gia · VietGAP / Rainforest Alliance",
      "verification_status": "verified",
      "view_count": 782,
      "favorite_count": 215,
      "contact_click_count": 124
    }
  ]
}
```

### 1.2. `GET /api/v1/products/{id_or_slug}` — Chi tiết sản phẩm
- **Mô tả:** Truy xuất thông tin đầy đủ của sản phẩm theo `product_id` (số) hoặc `slug` (chuỗi), bao gồm cả đối tượng `category`, `location` và danh sách `articles` liên quan.

### 1.3. `GET /api/v1/articles` & `GET /api/v1/articles/{id_or_slug}` — Danh sách & Chi tiết bài viết
- **Tham số Query:** `content_type` (`origin_story`, `production_process`, `cultural_heritage`, `guide`, `innovation`, `research`), `product_id` (`int`), `q` (`str`), `limit` (`int`, mặc định `20`).

### 1.4. `GET /api/v1/categories` — Danh mục sản phẩm & Vùng địa lý Sơn La
- **Mô tả:** Trả về danh sách 4 danh mục kèm số lượng sản phẩm (`product_count`) và 5 vùng nguyên liệu (`locations`) kèm tọa độ địa lý, độ cao, thổ nhưỡng, khí hậu.

### 1.5. `GET /api/v1/search` — Tìm kiếm tổng hợp Sản phẩm & Bài viết
- **Tham số Query:** `q` (từ khóa tiếng Việt), `category_id` (tùy chọn).
- **Phản hồi (`200 OK`):** Trả về đồng thời mảng `products` và `articles` khớp từ khóa.

### 1.6. `GET /api/v1/recommendations` — Gợi ý nội dung cá nhân hóa (Top 5)
- **Tham số Query:**
  - `visitor_id` (`str`, tùy chọn): Định danh người truy cập để tính vector hồ sơ sở thích TF-IDF.
  - `session_id` (`str`, tùy chọn): Phiên hiện tại phục vụ ghi log.
  - `current_content_type` (`product` | `article`, tùy chọn): Loại nội dung đang xem.
  - `current_content_id` (`int`, tùy chọn): Mã nội dung đang xem.
  - `target_type` (`product` | `article`, tùy chọn): Chỉ lọc kết quả là sản phẩm hoặc bài viết.
  - `limit` (`int`, mặc định `5`): Số lượng gợi ý trả về.
- **Phản hồi mẫu (`200 OK`):**
```json
{
  "visitor_id": "demo_visitor_sonla",
  "model_version": "cb_tfidf_v20261101_054016",
  "strategy": "content_based",
  "count": 5,
  "items": [
    {
      "rank": 1,
      "content_type": "article",
      "content_id": 1,
      "title": "Hành trình Cà phê Arabica Sơn La chinh phục chứng nhận Chỉ dẫn địa lý quốc gia",
      "slug": "hanh-trinh-ca-phe-arabica-son-la-chi-dan-dia-ly",
      "category_name": "Đồ uống",
      "score": 0.6245,
      "reason": "Bài viết phù hợp với chủ đề bạn đang quan tâm"
    }
  ]
}
```

### 1.7. `POST /api/v1/events` — Ghi nhận sự kiện tương tác hành vi
- **Request Body (`application/json`):**
```json
{
  "visitor_id": "demo_visitor_sonla",
  "session_id": "demo_session_sonla_01",
  "event_name": "product_view",
  "content_type": "product",
  "content_id": 1,
  "properties": {
    "dwell_seconds": 45,
    "scroll_depth": 75
  },
  "device_type": "desktop",
  "referrer_source": "search"
}
```
- **Quy tắc kiểm tra:**
  - `event_name` bắt buộc thuộc tập 10 sự kiện chuẩn hóa. Nếu sai trả về `400 Bad Request`.
  - Tự động chống trùng lặp (deduplicate) trong vòng 2 giây.
  - Tự động cập nhật bảng `user_features` ($X = [S, P, A, T, Q, F, C, R, U]$) ngay sau khi ghi.

### 1.8. `GET /api/v1/favorites` & `POST /api/v1/favorites` — Quản lý danh sách Yêu thích
- **`POST /api/v1/favorites` Request Body:**
```json
{
  "visitor_id": "demo_visitor_sonla",
  "session_id": "demo_session_sonla_01",
  "content_type": "product",
  "content_id": 2
}
```
- **Hành vi:** Bật/tắt (Toggle) trạng thái yêu thích. Khi thêm mới (`status: "added"`), hệ thống đồng thời ghi nhận sự kiện `favorite` (trọng số hành vi $= 3.0$) và cập nhật vector đặc trưng người dùng.

---

## 2. Nhóm Admin & Analytics APIs (Yêu cầu Bearer JWT Token)

> Toàn bộ các endpoint dưới `/api/v1/admin/*` (ngoại trừ `/auth/login`) đều yêu cầu Header:  
> `Authorization: Bearer <access_token>`

### 2.1. `POST /api/v1/admin/auth/login` — Đăng nhập Quản trị viên
- **Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **Response (`200 OK`):** Trả về `access_token`, `token_type: "bearer"` và thông tin quản trị viên.

### 2.2. `GET /api/v1/admin/analytics/overview` — Tổng quan KPIs & Lưu lượng truy cập
- **Tham số Query:** `days` (`int`, mặc định `30`), `include_simulated` (`bool`, mặc định `true`).
- **Response:** Tổng hợp `kpis` (tổng visitors thực/mô phỏng, tổng phiên, tổng sự kiện, tỷ lệ chuyển đổi nhấn liên hệ), chuỗi thời gian `daily_traffic`, `referrer_distribution` và `device_distribution`.

### 2.3. `GET /api/v1/admin/analytics/products` — Phân tích Mức độ Quan tâm Sản phẩm
- **Công thức Điểm quan tâm (Weighted Interest Score):**
  $$\text{Interest Score} = 1 \times \text{Views} + 2 \times \text{Scrolls} + 3 \times \text{Favorites} + 4 \times \text{Shares} + 5 \times \text{Contact Clicks}$$
- **Response:** Bảng xếp hạng 8 sản phẩm kèm tỷ lệ tương tác sâu (`engagement_rate_pct`) và phân rã theo 4 danh mục (`category_breakdown`).

### 2.4. `GET /api/v1/admin/analytics/behavior` — Phân tích Hành vi & Phễu Chuyển đổi
- **Response:** Phân bố 10 sự kiện chuẩn hóa (`event_breakdown`), phễu chuyển đổi 5 giai đoạn (`funnel`), Top 10 từ khóa tìm kiếm (`top_searches`) và luồng 25 sự kiện thời gian thực mới nhất (`recent_events`).

### 2.5. `GET /api/v1/admin/analytics/segments` — Kết quả Phân cụm K-Means & Hồ sơ Cụm
- **Response:** Thông tin mô hình K-means đang hoạt động, bảng đối chiếu 9 đặc trưng $X = [S, P, A, T, Q, F, C, R, U]$, danh sách hồ sơ các cụm (`profiles`) kèm tâm cụm và chiến lược truyền thông, cùng mẫu 350 điểm dữ liệu (`scatter_sample`) phục vụ vẽ biểu đồ phân tán.

### 2.6. `POST /api/v1/admin/ml/clustering/train` — Huấn luyện lại Mô hình K-Means
- **Request Body:**
```json
{
  "k_min": 2,
  "k_max": 8,
  "forced_k": null,
  "include_simulated": true,
  "random_seed": 42
}
```

### 2.7. `POST /api/v1/admin/ml/recommendation/build` — Xây dựng & Đánh giá Hệ thống Gợi ý
- **Request Body:**
```json
{
  "weights": {
    "view": 1.0,
    "scroll": 2.0,
    "favorite": 3.0,
    "share": 4.0,
    "contact_click": 5.0
  },
  "top_k": 5
}
```

### 2.8. `GET /api/v1/admin/ml/evaluations` — Báo cáo Thực nghiệm & Lịch sử Phiên bản Mô hình
- **Response:** Chi tiết các chỉ số đánh giá của mô hình K-means hiện hành (`k_sweep`, `silhouette_score`, `davies_bouldin_index`, `stability_ari`), mô hình Content-based hiện hành (`precision_at_5`, `recall_at_5`, `ndcg_at_5`, `coverage`, `diversity`, `weight_sensitivity_analysis`), thống kê CTR gợi ý và lịch sử huấn luyện (`model_history`).

### 2.9. `GET /api/v1/admin/simulation/scenarios` & `POST /api/v1/admin/simulation/generate`
- **Mô tả:** Xem danh sách 5 kịch bản hành vi mô phỏng và kích hoạt tái tạo bộ dữ liệu mô phỏng (`num_visitors=500`, `random_seed=42`, `auto_retrain_models=true`).
