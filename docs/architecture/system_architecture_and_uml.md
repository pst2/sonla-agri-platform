# KIẾN TRÚC HỆ THỐNG & SƠ ĐỒ THIẾT KẾ UML (USE CASE, ACTIVITY, SEQUENCE DIAGRAMS)

**Đề tài:** Xây dựng hệ thống truyền thông và phân tích dữ liệu hành vi người dùng cho sản phẩm nông nghiệp truyền thống địa phương (Tỉnh Sơn La)  
**Bàn giao Tuần 2 (Phase 1 Deliverable):** Kiến trúc tổng thể 4 tầng, Sơ đồ Use Case, Sơ đồ Hoạt động (Activity) và Sơ đồ Tuần tự (Sequence).

---

## 1. Kiến trúc Tổng thể Hệ thống (4-Layer Architecture)

Hệ thống được thiết kế theo kiến trúc phân tầng hiện đại, tách biệt rõ ràng giữa giao diện người dùng (Next.js App Router), tầng dịch vụ API (FastAPI), tầng cơ sở dữ liệu quan hệ (PostgreSQL / SQLite) và tầng xử lý Học máy (Scikit-learn K-means & Vietnamese TF-IDF Recommender):

```mermaid
flowchart TB
    subgraph ClientLayer["1. Tầng Giao diện Người dùng (Frontend - Next.js 16 + TailwindCSS + Recharts)"]
        PublicUI["Cổng Truyền thông Nông sản Sơn La\n(Trang chủ, 8 Sản phẩm, 14 Bài viết, Tìm kiếm, Yêu thích)"]
        TrackerSDK["Bộ Thu thập Sự kiện Ẩn danh (Tracker SDK)\n(visitor_id, session_id, Scroll Depth, Dwell Time)"]
        AdminUI["Bảng Điều khiển Quản trị & Phân tích (Admin Dashboard)\n(Tổng quan, Sản phẩm, Hành vi, Phân cụm K-Means, ML Lab, CMS)"]
    end

    subgraph APILayer["2. Tầng Ứng dụng & Giao tiếp API (Backend - FastAPI + SQLAlchemy 2.0)"]
        PublicAPI["Public REST API (/api/v1/*)\n(/products, /articles, /categories, /search, /recommendations)"]
        EventCollector["Event Ingestion & Deduplication Service\n(POST /api/v1/events, POST /api/v1/favorites)"]
        AdminAPI["Admin & Analytics API (/api/v1/admin/*)\n(JWT Auth, /analytics/*, /ml/*, /simulation/*)"]
    end

    subgraph MLLayer["3. Tầng Khoa học Dữ liệu & Học máy (ML Engine - Scikit-learn + Pandas)"]
        FeatureBuilder["Trích xuất Vector 9 Đặc trưng Hành vi\nX = [S, P, A, T, Q, F, C, R, U]"]
        KMeansEngine["Mô hình Phân cụm K-Means (K=2..8)\n(StandardScaler, Silhouette, DBI, ARI, Post-hoc Profiling)"]
        TFIDFEngine["Hệ thống Gợi ý Content-Based Tiếng Việt\n(Word Segmentation, TF-IDF 1-2 gram, Cosine Similarity, Cold-Start)"]
        SimGenerator["Bộ Sinh Dữ liệu Hành vi Mô phỏng\n(5 Kịch bản, 500 Visitors, Seed=42, is_simulated=True)"]
    end

    subgraph DataLayer["4. Tầng Lưu trữ Dữ liệu (Storage - PostgreSQL 15 / SQLite + Joblib Artifacts)"]
        DB[("Cơ sở dữ liệu Quan hệ (15 Bảng)\nContent | Tracking | Interaction | ML | Admin")]
        ArtifactStore[("Kho Lưu trữ Model Artifacts (ml/artifacts/)\nkmeans_v*.joblib | cb_tfidf_v*.joblib")]
    end

    PublicUI --> PublicAPI
    PublicUI --> TrackerSDK
    TrackerSDK --> EventCollector
    AdminUI --> AdminAPI

    PublicAPI --> DB
    PublicAPI --> TFIDFEngine
    EventCollector --> DB
    EventCollector --> FeatureBuilder
    AdminAPI --> DB
    AdminAPI --> KMeansEngine
    AdminAPI --> TFIDFEngine
    AdminAPI --> SimGenerator

    FeatureBuilder --> DB
    SimGenerator --> DB
    KMeansEngine --> DB
    KMeansEngine --> ArtifactStore
    TFIDFEngine --> DB
    TFIDFEngine --> ArtifactStore
```

---

## 2. Sơ đồ Ca sử dụng Tổng quát (Use Case Diagram)

```mermaid
flowchart LR
    Visitor(["👤 Người truy cập\n(Visitor)"])
    Admin(["🛡️ Quản trị viên\n(Admin)"])

    subgraph SystemBoundary["Hệ thống Truyền thông & Phân tích Dữ liệu Nông sản Sơn La"]
        direction TB
        UC1("UC01: Khám phá Danh mục 8 Đặc sản & Lọc theo Vùng/Loại")
        UC2("UC02: Xem Chi tiết Sản phẩm, Quy trình & Chứng nhận OCOP")
        UC3("UC03: Đọc 14 Bài viết Văn hóa & Câu chuyện Vùng trồng")
        UC4("UC04: Tìm kiếm Đa năng (Sản phẩm & Bài viết)")
        UC5("UC05: Lưu Yêu thích, Chia sẻ & Nhấn Liên hệ HTX")
        UC6("UC06: Nhận Gợi ý Cá nhân hóa Top 5 (Content-based / Cold-start)")
        UC7("UC07: Ghi nhận Tự động 10 Sự kiện Hành vi (Event Tracking)")

        UC8("UC08: Đăng nhập Quản trị (JWT Authentication)")
        UC9("UC09: Xem Dashboard Phân tích Lưu lượng, Sản phẩm & Phễu")
        UC10("UC10: Phân tích Phân khúc Người dùng K-Means (4 Cụm)")
        UC11("UC11: Huấn luyện lại Mô hình K-Means & Đánh giá Hold-out Gợi ý")
        UC12("UC12: Sinh Dữ liệu Mô phỏng (5 Kịch bản) & Tách biệt Dữ liệu Thực")
        UC13("UC13: Quản trị Nội dung CRUD (Sản phẩm, Bài viết, Danh mục)")
    end

    Visitor --> UC1
    Visitor --> UC2
    Visitor --> UC3
    Visitor --> UC4
    Visitor --> UC5
    Visitor --> UC6
    UC1 -.->|"<<include>>"| UC7
    UC2 -.->|"<<include>>"| UC7
    UC3 -.->|"<<include>>"| UC7
    UC4 -.->|"<<include>>"| UC7
    UC5 -.->|"<<include>>"| UC7

    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
```

---

## 3. Sơ đồ Hoạt động (Activity Diagrams)

### 3.1. Luồng Thu thập Sự kiện & Cập nhật Vector Đặc trưng Hành vi ($X$)

```mermaid
flowchart TD
    Start(["Người dùng tương tác trên giao diện Web"]) --> CheckID{"Đã có visitor_id &\nsession_id?"}
    CheckID -- "Chưa có" --> GenID["Khởi tạo UUID lưu vào\nlocalStorage & sessionStorage"]
    CheckID -- "Đã có" --> BuildPayload["Đóng gói Event Payload\n(event_name, content_type, content_id, properties)"]
    GenID --> BuildPayload
    BuildPayload --> SendAPI["Gửi POST /api/v1/events"]
    SendAPI --> ValidateEvent{"Sự kiện thuộc 10\nevent chuẩn hóa?"}
    ValidateEvent -- "Không hợp lệ" --> Return400(["Trả về HTTP 400 Bad Request"])
    ValidateEvent -- "Hợp lệ" --> UpsertVisitor["Cập nhật hoặc Tạo mới bản ghi\nVisitor & Session"]
    UpsertVisitor --> CheckDedup{"Trùng sự kiện trong\nvòng 2 giây?"}
    CheckDedup -- "Trùng lặp" --> ReturnDedup(["Trả về status: deduplicated"])
    CheckDedup -- "Sự kiện mới" --> SaveEvent["Lưu vào bảng events &\nTăng bộ đếm view/contact trên Product/Article"]
    SaveEvent --> RecomputeX["Tính toán lại Vector 9 đặc trưng:\nX = [S, P, A, T, Q, F, C, R, U]\nvà cập nhật bảng user_features"]
    RecomputeX --> ReturnSuccess(["Trả về HTTP 200 status: recorded"])
```

### 3.2. Luồng Huấn luyện & Hậu kiểm Phân cụm Người dùng K-Means

```mermaid
flowchart TD
    StartKM(["Bắt đầu Pipeline Phân cụm K-Means"]) --> LoadFeatures["Trích xuất bảng user_features\nVector 9 chiều X = [S, P, A, T, Q, F, C, R, U]"]
    LoadFeatures --> OutlierClip["Xử lý ngoại lai: Cắt ngưỡng tại phân vị 99%\n(99th Percentile Clipping)"]
    OutlierClip --> ScaleData["Chuẩn hóa Z-score bằng StandardScaler\n(trung bình = 0, độ lệch chuẩn = 1)"]
    ScaleData --> SweepLoop["Thực nghiệm lặp K từ 2 đến 8\n(n_init=15, random_state=42)"]
    SweepLoop --> EvalMetrics["Tính 4 chỉ số cho mỗi K:\n1. Inertia (SSE)\n2. Silhouette Score\n3. Davies-Bouldin Index (DBI)\n4. Độ ổn định cụm ARI qua 5 hạt giống"]
    EvalMetrics --> SelectK["Chọn K tối ưu khách quan\n(K >= 3, cụm nhỏ nhất >= 5%, tối đa hóa Silhouette & ARI, tối thiểu hóa DBI)"]
    SelectK --> PostHocProfile["Phân tích tâm cụm (Centroids) hậu kiểm:\nSo sánh tỷ lệ đặc trưng tâm cụm với trung bình quần thể\nđể đặt tên cụm & đề xuất chiến lược truyền thông"]
    PostHocProfile --> SaveArtifacts["Lưu file mô hình .joblib vào ml/artifacts/\nvà cập nhật bảng ml_models, cluster_profiles, cluster_results"]
    SaveArtifacts --> EndKM(["Hoàn tất & Trả kết quả lên Dashboard"])
```

### 3.3. Luồng Gợi ý Nội dung Cá nhân hóa (Content-based & Cold-Start Fallback)

```mermaid
flowchart TD
    StartRec(["Yêu cầu Gợi ý: GET /api/v1/recommendations"]) --> LoadModel["Tải mô hình TF-IDF & Ma trận Cosine Similarity\nđang hoạt động (is_active = True)"]
    LoadModel --> CheckHistory{"Visitor có lịch sử\ntương tác (total_w > 0)?"}
    CheckHistory -- "Có lịch sử" --> BuildUserVec["Tạo Vector Hồ sơ Sở thích Người dùng:\nTrung bình có trọng số các vector TF-IDF nội dung đã tương tác\n(view=1, scroll=2, favorite=3, share=4, contact_click=5)"]
    BuildUserVec --> CalcCosine["Tính Cosine Similarity giữa Hồ sơ Người dùng\nvà toàn bộ 22 nội dung trong bảng contents"]
    CalcCosine --> ContextBoost{"Đang xem trang chi tiết\nsản phẩm/bài viết?"}
    ContextBoost -- "Có" --> BlendScore["Kết hợp 70% Điểm Hồ sơ Cá nhân\n+ 30% Độ tương đồng với Nội dung hiện tại"]
    ContextBoost -- "Không" --> FilterSeen["Ưu tiên lọc bỏ nội dung đã xem\nvà xếp hạng giảm dần theo điểm số"]
    BlendScore --> FilterSeen

    CheckHistory -- "Chưa có (Cold-Start)" --> HasContext{"Có truyền tham số\ncurrent_content_id?"}
    HasContext -- "Có (cold_start_related)" --> UseItemSim["Lấy vector tương đồng Cosine trực tiếp\ncủa nội dung đang xem từ ma trận sim_matrix"]
    HasContext -- "Không (cold_start_popular)" --> UsePopScore["Xếp hạng theo điểm phổ biến\npopularity_score = view*1 + fav*3 + contact*5"]
    UseItemSim --> FilterSeen
    UsePopScore --> FilterSeen

    FilterSeen --> LogRec["Ghi nhận vào bảng recommendation_logs\nvà trả về Top 5 nội dung kèm lý do giải thích"]
    LogRec --> EndRec(["Hiển thị Top 5 Gợi ý trên Giao diện"])
```

---

## 4. Sơ đồ Tuần tự (Sequence Diagrams)

### 4.1. Sơ đồ Tuần tự: Người truy cập Xem Sản phẩm, Yêu thích và Nhận Gợi ý Tức thời

```mermaid
sequenceDiagram
    actor V as Người truy cập (Visitor)
    participant FE as Frontend (Next.js)
    participant API as Backend API (FastAPI)
    participant FB as Feature Builder (ML)
    participant REC as Content-Based Engine (ML)
    participant DB as Database (PostgreSQL/SQLite)

    V->>FE: 1. Truy cập trang "Cà phê Arabica Sơn La" (id=1)
    FE->>API: GET /api/v1/products/ca-phe-arabica-son-la
    API->>DB: Truy vấn thông tin sản phẩm, vùng trồng & bài viết liên quan
    DB-->>API: Trả về dữ liệu Product #1
    API-->>FE: HTTP 200 (ProductSchema)

    FE->>API: POST /api/v1/events (event_name="product_view", content_id=1)
    API->>DB: Lưu Event + Tăng view_count của Product #1
    API->>FB: compute_and_store_user_features(visitor_id)
    FB->>DB: Cập nhật bảng user_features X = [S, P, A, T, Q, F, C, R, U]
    API-->>FE: HTTP 200 (status="recorded")

    V->>FE: 2. Nhấn nút "Yêu thích" sản phẩm
    FE->>API: POST /api/v1/favorites (content_type="product", content_id=1)
    API->>DB: Thêm bản ghi Favorite + Sự kiện "favorite" (trọng số = 3)
    API->>FB: Cập nhật F (total_favorites) trong bảng user_features
    API-->>FE: HTTP 200 (status="added")

    FE->>API: 3. GET /api/v1/recommendations?visitor_id=...&current_content_id=1
    API->>REC: get_recommendations_for_visitor(visitor_id, current_content_id=1)
    REC->>DB: Đọc lịch sử sự kiện của visitor_id
    REC->>REC: Tính Hồ sơ TF-IDF có trọng số + Cosine Similarity
    REC->>DB: Ghi log vào bảng recommendation_logs
    REC-->>API: Trả về Top 5 nội dung tương đồng (Trà vỏ cà phê, Chè Shan tuyết...)
    API-->>FE: HTTP 200 (strategy="content_based", items=[...])
    FE-->>V: Hiển thị danh sách gợi ý cá nhân hóa kèm nhãn giải thích
```

### 4.2. Sơ đồ Tuần tự: Quản trị viên Sinh Dữ liệu Mô phỏng & Huấn luyện lại Mô hình

```mermaid
sequenceDiagram
    actor A as Quản trị viên (Admin)
    participant UI as Admin Dashboard
    participant API as Admin API (FastAPI)
    participant SIM as Synthetic Generator
    participant KM as K-Means Pipeline
    participant CB as Recommender Pipeline
    participant DB as Database

    A->>UI: 1. Đăng nhập tài khoản Admin
    UI->>API: POST /api/v1/admin/auth/login (username, password)
    API->>DB: Kiểm tra AdminUser & PBKDF2 hash
    API-->>UI: Trả về JWT access_token

    A->>UI: 2. Kích hoạt Sinh dữ liệu & Huấn luyện lại (500 visitors, seed=42)
    UI->>API: POST /api/v1/admin/simulation/generate (Bearer Token)
    API->>SIM: generate_synthetic_dataset(num_visitors=500, seed=42)
    SIM->>DB: Xóa dữ liệu is_simulated=True cũ & Chèn 500 Visitors, ~1500 Sessions, ~19000 Events
    SIM->>DB: Tính toán 501 dòng user_features & xuất file CSV

    API->>KM: train_and_evaluate_kmeans(k_min=2, k_max=8, seed=42)
    KM->>KM: Quét K=2..8, chọn K=4 tối ưu (Silhouette=0.4750, ARI=1.0)
    KM->>DB: Lưu MLModel, 4 ClusterProfile, 501 ClusterResult

    API->>CB: build_and_evaluate_recommender(top_k=5)
    CB->>CB: Huấn luyện TF-IDF (1500 terms) & Đánh giá Hold-out 75/25 (P@5=0.8620)
    CB->>DB: Lưu MLModel & ghi AuditLog
    API-->>UI: HTTP 200 (Simulation & ML Metrics Summary)
    UI-->>A: Cập nhật toàn bộ biểu đồ Phân cụm & Chỉ số Đánh giá trên Dashboard
```
