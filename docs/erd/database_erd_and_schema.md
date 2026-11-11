# THIẾT KẾ CƠ SỞ DỮ LIỆU QUAN HỆ (ERD & LƯỢC ĐỒ CHI TIẾT 15 BẢNG)

**Đề tài:** Xây dựng hệ thống truyền thông và phân tích dữ liệu hành vi người dùng cho sản phẩm nông nghiệp truyền thống địa phương (Tỉnh Sơn La)  
**Tài liệu bàn giao:** Sơ đồ Thực thể – Liên kết (ERD) và Đặc tả từ điển dữ liệu cho 15 bảng chính (cùng 1 bảng trung gian `article_products`).

---

## 1. Phân nhóm Cấu trúc Cơ sở Dữ liệu

Cơ sở dữ liệu của hệ thống (`backend/app/models/entities.py`) được tổ chức thành **5 nhóm thực thể chức năng** nhằm đảm bảo tính toàn vẹn tham chiếu, hiệu năng truy vấn phân tích thời gian thực và khả năng truy xuất phiên bản mô hình học máy:

1. **Nhóm Nội dung Truyền thông (Content Group - 5 bảng + 1 bảng liên kết):** `locations`, `categories`, `products`, `articles`, `article_products` (M2M), `contents` (kho nội dung hợp nhất phục vụ TF-IDF).
2. **Nhóm Thu thập Hành vi (Behavioral Tracking Group - 3 bảng):** `visitors`, `sessions`, `events`.
3. **Nhóm Tương tác & Nhật ký Gợi ý (Interaction Group - 2 bảng):** `favorites`, `recommendation_logs`.
4. **Nhóm Đặc trưng & Mô hình Học máy (Machine Learning Group - 5 bảng):** `user_features`, `ml_models`, `cluster_profiles`, `cluster_results`, `recommendations`.
5. **Nhóm Quản trị, Kịch bản Mô phỏng & Kiểm toán (Admin & Simulation Group - 3 bảng):** `admin_users`, `simulation_scenarios`, `audit_logs`.

> **Lưu ý thiết kế:** Tổng cộng hệ thống gồm **18 bảng vật lý** (15 bảng thực thể cốt lõi + `cluster_profiles` + `simulation_scenarios` + bảng trung gian `article_products`), đáp ứng đầy đủ và mở rộng từ yêu cầu 15 bảng tối thiểu trong đề cương đồ án.

---

## 2. Sơ đồ Thực thể – Liên kết (Mermaid Entity-Relationship Diagram)

```mermaid
erDiagram
    LOCATIONS ||--o{ PRODUCTS : "has_origin"
    CATEGORIES ||--o{ PRODUCTS : "classifies"
    PRODUCTS }o--o{ ARTICLES : "article_products"
    PRODUCTS ||--o{ CONTENTS : "synced_to"
    ARTICLES ||--o{ CONTENTS : "synced_to"

    VISITORS ||--o{ SESSIONS : "initiates"
    VISITORS ||--o{ EVENTS : "generates"
    SESSIONS ||--o{ EVENTS : "contains"
    VISITORS ||--o{ FAVORITES : "saves"
    VISITORS ||--|| USER_FEATURES : "aggregated_into"
    VISITORS ||--o{ CLUSTER_RESULTS : "assigned_to"
    VISITORS ||--o{ RECOMMENDATION_LOGS : "receives"

    ML_MODELS ||--o{ CLUSTER_PROFILES : "defines_centroids"
    ML_MODELS ||--o{ CLUSTER_RESULTS : "produces"
    ML_MODELS ||--o{ RECOMMENDATIONS : "computes"

    ADMIN_USERS ||--o{ AUDIT_LOGS : "records_action"

    LOCATIONS {
        int location_id PK
        string name
        string slug UK
        string province
        string district
        string altitude
        string climate
        string soil_type
        float latitude
        float longitude
    }

    CATEGORIES {
        int category_id PK
        string name UK
        string slug UK
        string description
        string icon
        int display_order
    }

    PRODUCTS {
        int product_id PK
        string product_name
        string slug UK
        int category_id FK
        int location_id FK
        string origin
        text description
        text ingredients
        text production_process
        text characteristics
        text traditional_value
        string keywords
        string certification
        string source_reference
        string verification_status
        int view_count
        int favorite_count
        int contact_click_count
    }

    ARTICLES {
        int article_id PK
        string title
        string slug UK
        text excerpt
        text content
        string content_type
        int reading_time_minutes
        string keywords
        string source_reference
        string status
        int view_count
        int favorite_count
    }

    CONTENTS {
        int content_uid PK
        string content_type
        int ref_id
        string title
        string slug
        text combined_text
        text processed_tokens
        float popularity_score
    }

    VISITORS {
        string visitor_id PK
        datetime first_seen_at
        datetime last_seen_at
        string device_type
        string referrer_source
        boolean is_simulated
        string scenario_label
    }

    SESSIONS {
        string session_id PK
        string visitor_id FK
        datetime started_at
        datetime ended_at
        float duration_seconds
        int page_count
        string referrer
        string device
        boolean is_simulated
    }

    EVENTS {
        int event_id PK
        string visitor_id FK
        string session_id FK
        string event_name
        string content_type
        int content_id
        datetime occurred_at
        json properties
        boolean is_simulated
    }

    FAVORITES {
        int favorite_id PK
        string visitor_id FK
        string content_type
        int content_id
        boolean is_simulated
        datetime created_at
    }

    RECOMMENDATION_LOGS {
        int log_id PK
        string visitor_id
        string session_id
        string model_version
        string strategy
        string context_content_type
        int context_content_id
        json recommended_items
        datetime created_at
    }

    USER_FEATURES {
        string visitor_id PK_FK
        int total_sessions "S"
        int total_product_views "P"
        int total_article_views "A"
        float avg_session_duration "T"
        int total_searches "Q"
        int total_favorites "F"
        int total_contact_clicks "C"
        int return_visits "R"
        int unique_products_viewed "U"
        boolean is_simulated
    }

    ML_MODELS {
        int model_id PK
        string model_name
        string model_type
        string version UK
        json parameters
        json metrics
        string artifact_path
        boolean is_active
        datetime trained_at
    }

    CLUSTER_PROFILES {
        int profile_id PK
        int model_id FK
        int cluster_index
        string cluster_name
        text cluster_description
        int size
        float percentage
        json centroid_features
        text recommended_strategy
    }

    CLUSTER_RESULTS {
        int result_id PK
        int model_id FK
        string visitor_id FK
        int cluster_index
        float distance_to_centroid
        datetime assigned_at
    }

    RECOMMENDATIONS {
        int rec_id PK
        int model_id FK
        string visitor_id
        string content_type
        int content_id
        float score
        int rank
        string reason
    }

    ADMIN_USERS {
        int admin_id PK
        string username UK
        string password_hash
        string full_name
        string email UK
        string role
        boolean is_active
    }

    SIMULATION_SCENARIOS {
        int scenario_id PK
        string scenario_code UK
        string name
        float visitor_ratio
        json behavior_params
        datetime last_run_at
    }

    AUDIT_LOGS {
        int audit_id PK
        int admin_id FK
        string action
        string resource_type
        string resource_id
        json details
        datetime created_at
    }
```

---

## 3. Đặc tả Chi tiết Các Bảng Dữ liệu

### 3.1. Nhóm Nội dung Truyền thông (`locations`, `categories`, `products`, `articles`, `contents`)

#### Bảng `locations` (Vùng địa lý nông sản Sơn La)
Lưu trữ 5 tiểu vùng khí hậu – thổ nhưỡng đặc trưng của tỉnh Sơn La (*Mai Sơn – TP. Sơn La, Đỉnh Tà Xùa – Bắc Yên, Cao nguyên Mộc Châu, Thung lũng Ngọc Chiến – Mường La, Yên Châu – Phù Yên*).
- Khóa chính: `location_id` (`INTEGER`)
- Thuộc tính chính: `name`, `slug` (`UNIQUE`), `province` (mặc định `"Sơn La"`), `district`, `altitude`, `climate`, `soil_type`, `latitude`, `longitude`.

#### Bảng `categories` (Danh mục sản phẩm)
Lưu trữ 4 nhóm sản phẩm chuẩn hóa: *Đồ uống (`do-uong`), Trái cây (`trai-cay`), Sản phẩm chế biến (`san-pham-che-bien`), Nông sản (`nong-san`)*.
- Khóa chính: `category_id` (`INTEGER`)
- Thuộc tính chính: `name`, `slug`, `description`, `icon`, `display_order`.

#### Bảng `products` (Sản phẩm nông nghiệp truyền thống Sơn La)
Lưu trữ 8 sản phẩm đặc sản đã xác thực nguồn gốc pháp lý.
- Khóa chính: `product_id` (`INTEGER`)
- Khóa ngoại: `category_id -> categories.category_id`, `location_id -> locations.location_id`.
- Các trường phục vụ truyền thông & TF-IDF: `product_name`, `slug`, `origin`, `short_description`, `description`, `ingredients`, `production_process`, `characteristics`, `traditional_value`, `keywords`, `certification`, `producer`, `source_reference`, `verification_status` (`verified`).
- Các bộ đếm tương tác: `view_count`, `favorite_count`, `contact_click_count`.

#### Bảng `articles` & `article_products` (Bài viết chuyên đề & Liên kết sản phẩm)
Lưu trữ 14 bài viết chuyên sâu về lịch sử vùng nguyên liệu, quy trình chế biến và văn hóa ẩm thực Tây Bắc.
- Khóa chính: `article_id` (`INTEGER`)
- Liên kết nhiều-nhiều với `products` thông qua bảng `article_products(article_id, product_id)`.

#### Bảng `contents` (Kho nội dung hợp nhất phục vụ TF-IDF)
Đồng bộ hóa toàn bộ 8 sản phẩm và 14 bài viết (tổng cộng **22 đơn vị nội dung**) về cùng một cấu trúc văn bản để xây dựng ma trận TF-IDF.
- Ràng buộc duy nhất: `UNIQUE(content_type, ref_id)`.
- Trường `combined_text`: Văn bản gộp từ tên, mô tả, nguyên liệu, quy trình, giá trị truyền thống và từ khóa.
- Trường `processed_tokens`: Chuỗi token tiếng Việt đã tách từ ghép và lọc hư từ.
- Trường `popularity_score`: Điểm phổ biến phục vụ chiến lược `cold_start_popular`.

---

### 3.2. Nhóm Thu thập Hành vi & Tương tác (`visitors`, `sessions`, `events`, `favorites`, `recommendation_logs`)

#### Bảng `visitors` & `sessions`
- `visitors`: Định danh ẩn danh người dùng qua `visitor_id` (`VARCHAR(64)`), ghi nhận `device_type`, `referrer_source`, cờ `is_simulated` (`BOOLEAN`) và `scenario_label`.
- `sessions`: Lưu trữ phiên làm việc (`session_id`), thời lượng `duration_seconds`, số trang đã xem `page_count`.

#### Bảng `events` (Nhật ký sự kiện hành vi)
- Lưu trữ toàn bộ 10 loại sự kiện chuẩn hóa (`page_view`, `product_view`, `article_view`, `search`, `scroll`, `favorite`, `share`, `contact_click`, `recommendation_view`, `recommendation_click`).
- Đánh chỉ mục kép (Composite Index):
  - `ix_events_visitor_occurred (visitor_id, occurred_at)`
  - `ix_events_content (content_type, content_id)`

---

### 3.3. Nhóm Học máy (`user_features`, `ml_models`, `cluster_profiles`, `cluster_results`, `recommendations`)

#### Bảng `user_features` (Vector 9 đặc trưng hành vi cho K-means)
Mỗi dòng tương ứng với một `visitor_id`, lưu trữ trực tiếp 9 thành phần của vector $X = [S, P, A, T, Q, F, C, R, U]$:

| Ký hiệu | Tên cột trong `user_features` | Kiểu dữ liệu | Ý nghĩa định lượng |
| :---: | :--- | :---: | :--- |
| **$S$** | `total_sessions` | `INTEGER` | Tổng số phiên truy cập của người dùng |
| **$P$** | `total_product_views` | `INTEGER` | Tổng số lượt xem trang chi tiết sản phẩm |
| **$A$** | `total_article_views` | `INTEGER` | Tổng số lượt xem bài viết văn hóa/quy trình |
| **$T$** | `avg_session_duration` | `FLOAT` | Thời lượng tương tác trung bình mỗi phiên (giây) |
| **$Q$** | `total_searches` | `INTEGER` | Tổng số lượt thực hiện tìm kiếm từ khóa |
| **$F$** | `total_favorites` | `INTEGER` | Tổng số lượt lưu yêu thích sản phẩm/bài viết |
| **$C$** | `total_contact_clicks` | `INTEGER` | Tổng số lượt nhấn liên hệ nhà sản xuất/HTX |
| **$R$** | `return_visits` | `INTEGER` | Số lần quay lại nền tảng ($R = \max(0, S - 1)$) |
| **$U$** | `unique_products_viewed` | `INTEGER` | Số lượng sản phẩm đặc sản khác nhau đã khám phá ($\le 8$) |

#### Bảng `ml_models`, `cluster_profiles`, `cluster_results`
- `ml_models`: Quản lý phiên bản mô hình (`version`), siêu tham số (`parameters`), bộ chỉ số thực nghiệm (`metrics`) và đường dẫn file `.joblib` (`artifact_path`).
- `cluster_profiles`: Lưu trữ thông tin tâm cụm hậu kiểm (`centroid_features`), tên cụm tiếng Việt (`cluster_name`), tỷ trọng (`percentage`) và chiến lược truyền thông khuyến nghị (`recommended_strategy`).
- `cluster_results`: Gán từng `visitor_id` vào `cluster_index` kèm khoảng cách Euclid tới tâm cụm (`distance_to_centroid`).
