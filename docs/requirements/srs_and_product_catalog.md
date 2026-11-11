# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS), DANH MỤC SẢN PHẨM ĐẶC SẢN SƠN LA & KẾ HOẠCH DỮ LIỆU

**Đề tài:** Xây dựng hệ thống truyền thông và phân tích dữ liệu hành vi người dùng cho sản phẩm nông nghiệp truyền thống địa phương (Tỉnh Sơn La)  
**Bàn giao Tuần 1 (Phase 1 Deliverable):** Đặc tả yêu cầu (SRS), Danh mục 8 sản phẩm chuẩn hóa, 14 bài viết chuyên đề và Kế hoạch thu thập/sinh dữ liệu.

---

## 1. Giới thiệu & Phạm vi Hệ thống

### 1.1. Bối cảnh và Mục tiêu
Tỉnh Sơn La là vùng nông nghiệp trọng điểm của khu vực Tây Bắc với nhiều nông sản truyền thống đạt chứng nhận **Chỉ dẫn địa lý quốc gia** và **OCOP 4–5 sao** như *Cà phê Arabica Sơn La, Chè Shan tuyết Tà Xùa, Mận hậu Mộc Châu, Gạo nếp Tan Ngọc Chiến, Tỏi đen một nhánh Yên Châu...* Tuy nhiên, hoạt động truyền thông hiện tại còn phân mảnh, thiếu gắn kết giữa thông tin sản phẩm với câu chuyện văn hóa – vùng trồng – quy trình chế biến và chưa khai thác dữ liệu hành vi người truy cập để cá nhân hóa nội dung.

Hệ thống được xây dựng nhằm giải quyết đồng thời 4 bài toán cốt lõi:
1. **Truyền thông số chuẩn hóa:** Cung cấp cổng thông tin trực quan giới thiệu 8 đặc sản tiêu biểu và 14 bài viết chuyên sâu về vùng nguyên liệu, quy trình sản xuất và văn hóa bản địa Sơn La.
2. **Thu thập dữ liệu hành vi (Event-based Tracking):** Tự động ghi nhận 10 loại sự kiện tương tác ẩn danh của người truy cập theo thời gian thực mà không bắt buộc đăng ký tài khoản.
3. **Phân cụm người dùng bằng K-means:** Biểu diễn mỗi người truy cập bằng vector 9 đặc trưng định lượng $X = [S, P, A, T, Q, F, C, R, U]$ và phân nhóm khách quan bằng thuật toán K-means ($K = 2..8$).
4. **Gợi ý nội dung cá nhân hóa (Content-based Recommendation):** Sử dụng kỹ thuật tiền xử lý văn bản tiếng Việt, biểu diễn **TF-IDF** kết hợp **Cosine Similarity** và trọng số hành vi để đề xuất Top 5 sản phẩm/bài viết phù hợp nhất, kèm cơ chế **Cold-Start Fallback** cho người dùng mới.

### 1.2. Đối tượng sử dụng (Actors)
| Tác nhân | Mô tả | Quyền hạn chính |
| :--- | :--- | :--- |
| **Người truy cập (Visitor)** | Người tiêu dùng, khách du lịch, đối tác thu mua tìm hiểu nông sản Sơn La (ẩn danh qua `visitor_id` & `session_id`). | Xem danh mục, tìm kiếm, lọc theo vùng trồng/danh mục, đọc bài viết, lưu yêu thích, chia sẻ, nhấn liên hệ HTX, nhận gợi ý cá nhân hóa Top 5. |
| **Quản trị viên (Admin)** | Cán bộ quản lý truyền thông, quản trị viên hệ thống, nhà phân tích dữ liệu (đăng nhập qua JWT RBAC). | Quản lý CRUD sản phẩm/bài viết/danh mục, giám sát Dashboard hành vi, xem phân khúc K-means, kích hoạt huấn luyện lại ML, vận hành bộ sinh dữ liệu mô phỏng. |

---

## 2. Đặc tả Yêu cầu Chức năng (Functional Requirements)

### 2.1. Phân hệ Cổng thông tin Truyền thông Công khai (Public Portal)
- **FR-01 (Khám phá Trang chủ):** Hiển thị thông điệp truyền thông nông sản Sơn La, số liệu vùng nguyên liệu, sản phẩm nổi bật, câu chuyện văn hóa và khối gợi ý cá nhân hóa *"Dành riêng cho bạn"*.
- **FR-02 (Danh mục & Bộ lọc Sản phẩm):** Cho phép lọc sản phẩm theo 4 danh mục (*Đồ uống, Trái cây, Sản phẩm chế biến, Nông sản*), theo 5 vùng địa lý Sơn La, sắp xếp theo mức độ phổ biến hoặc lượt yêu thích.
- **FR-03 (Chi tiết Sản phẩm Chuẩn hóa):** Hiển thị đầy đủ nguồn gốc địa lý, thành phần, quy trình chế biến 5 bước, đặc điểm cảm quan, giá trị văn hóa truyền thống, chứng nhận OCOP/VietGAP/Chỉ dẫn địa lý, bài viết liên quan và 5 sản phẩm gợi ý tương đồng.
- **FR-04 (Chuyên mục Bài viết & Câu chuyện Vùng trồng):** Hiển thị danh sách và chi tiết 14 bài viết gắn kết chặt chẽ với các sản phẩm liên quan (quan hệ nhiều-nhiều `article_products`).
- **FR-05 (Tìm kiếm Đa năng):** Tìm kiếm từ khóa tiếng Việt đồng thời trên cả sản phẩm và bài viết, tự động ghi nhận sự kiện `search`.
- **FR-06 (Tương tác Yêu thích & Liên hệ):** Cho phép lưu/bỏ lưu sản phẩm và bài viết yêu thích (`favorites`), chia sẻ nội dung (`share`) và nhấn kết nối với Hợp tác xã sản xuất (`contact_click`).

### 2.2. Phân hệ Thu thập Sự kiện Hành vi (Event-based Behavioral Tracking)
- **FR-07 (Định danh Ẩn danh):** Tự động khởi tạo và lưu trữ bền vững `visitor_id` (`localStorage`) và `session_id` (`sessionStorage`).
- **FR-08 (Thu thập 10 Sự kiện Chuẩn hóa):** Ghi nhận đầy đủ 10 sự kiện qua endpoint `POST /api/v1/events`:
  1. `page_view` (Xem trang)
  2. `product_view` (Xem chi tiết sản phẩm)
  3. `article_view` (Xem chi tiết bài viết)
  4. `search` (Tìm kiếm từ khóa)
  5. `scroll` (Cuộn đọc nội dung sâu $\ge 50\%$)
  6. `favorite` (Thêm vào danh sách yêu thích)
  7. `share` (Chia sẻ liên kết nội dung)
  8. `contact_click` (Nhấn nút liên hệ nhà sản xuất/HTX)
  9. `recommendation_view` (Hiển thị vùng gợi ý nội dung)
  10. `recommendation_click` (Nhấn vào nội dung được hệ thống gợi ý)
- **FR-09 (Chống trùng lặp & Cập nhật Vector Đặc trưng Tức thời):** Tự động loại bỏ sự kiện trùng lặp trong cửa sổ 2 giây (deduplication) và tính toán lại vector đặc trưng $X = [S, P, A, T, Q, F, C, R, U]$ của `visitor_id` ngay sau mỗi tương tác.

### 2.3. Phân hệ Học máy (Machine Learning Engine)
- **FR-10 (Phân cụm Hành vi K-means):** Chuẩn hóa dữ liệu bằng `StandardScaler`, cắt ngưỡng ngoại lai ở phân vị 99%, thực nghiệm $K \in [2..8]$, tính toán **Inertia**, **Silhouette Score**, **Davies-Bouldin Index (DBI)** và **Cluster Stability (Adjusted Rand Index - ARI)** để chọn $K$ tối ưu khách quan và tự động đặt tên cụm hậu kiểm (post-hoc profiling).
- **FR-11 (Gợi ý Nội dung TF-IDF Tiếng Việt):** Đồng bộ hóa bảng `contents`, tách từ tiếng Việt, loại bỏ hư từ (stopwords), trích xuất ma trận `TfidfVectorizer(ngram_range=(1, 2))`, tính ma trận tương đồng Cosine và hồ sơ sở thích người dùng có trọng số hành vi $\{1, 2, 3, 4, 5\}$.
- **FR-12 (Xử lý Cold-Start):** Tự động chuyển đổi sang chiến lược `cold_start_related` (khi đang xem một nội dung cụ thể) hoặc `cold_start_popular` (dựa trên điểm phổ biến `popularity_score`) khi người truy cập chưa có lịch sử hành vi.

### 2.4. Phân hệ Quản trị & Phân tích Dữ liệu (Admin Analytics & ML Lab)
- **FR-13 (Xác thực Quản trị):** Đăng nhập bảo mật bằng JWT (`POST /api/v1/admin/auth/login`), ghi nhận nhật ký kiểm toán (`audit_logs`).
- **FR-14 (Dashboard Phân tích Đa chiều):** Trực quan hóa KPIs tổng quan, xu hướng truy cập theo ngày, xếp hạng điểm quan tâm sản phẩm, phễu chuyển đổi 5 bước (Conversion Funnel), phân bố cụm người dùng K-means và chỉ số đánh giá mô hình.
- **FR-15 (Quản lý Dữ liệu Mô phỏng Tách biệt):** Cho phép sinh dữ liệu mô phỏng có hạt giống cố định (`random_seed=42`) gắn cờ `is_simulated = TRUE`, hỗ trợ bật/tắt lọc dữ liệu mô phỏng trên toàn bộ Dashboard.

---

## 3. Đặc tả Yêu cầu Phi chức năng (Non-Functional Requirements)

1. **Hiệu năng (Performance):** Thời gian phản hồi API danh mục và gợi ý nội dung (`GET /api/v1/recommendations`) $< 150\text{ ms}$; ghi nhận sự kiện bất đồng bộ (`POST /api/v1/events`) $< 80\text{ ms}$.
2. **Tính chính xác & Minh bạch Dữ liệu (Data Integrity):** Mọi sản phẩm nông sản Sơn La trong danh mục đều có nguồn tham chiếu pháp lý rõ ràng (`source_reference` và `verification_status = 'verified'`). Dữ liệu mô phỏng (`is_simulated = true`) tách biệt hoàn toàn với dữ liệu người dùng thực (`is_simulated = false`).
3. **Khả năng Tái lập Thực nghiệm (Reproducibility):** Toàn bộ pipeline sinh dữ liệu, huấn luyện K-means và đánh giá Hold-out đều cố định `random_seed = 42` và lưu trữ phiên bản mô hình (`ml_models` & file `.joblib`).
4. **Bảo mật (Security):** Mật khẩu quản trị băm PBKDF2-SHA256 kèm salt, bảo vệ toàn bộ API `/api/v1/admin/*` bằng Bearer JWT Token.

---

## 4. Danh mục Chuẩn hóa 8 Sản phẩm Nông nghiệp Truyền thống Tỉnh Sơn La

Dưới đây là danh mục 8 sản phẩm đặc sản Sơn La đã được chuẩn hóa đầy đủ thông tin địa lý, quy trình và chứng nhận trong cơ sở dữ liệu (`database/seeds/sonla_seed_data.py`):

| Mã SP (`id`) | Tên sản phẩm | Slug định danh | Danh mục | Vùng nguyên liệu (Sơn La) | Chứng nhận & Pháp lý |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Cà phê Arabica Sơn La** | `ca-phe-arabica-son-la` | Đồ uống | Huyện Mai Sơn & TP. Sơn La (650m–1.050m) | Chỉ dẫn địa lý "Sơn La" (QĐ 3399/QĐ-SHTT) · OCOP 5 Sao Quốc gia |
| **2** | **Chè Shan tuyết** | `che-shan-tuyet-ta-xua` | Đồ uống | Đỉnh Tà Xùa, Huyện Bắc Yên (1.500m–2.200m) | Chỉ dẫn địa lý Chè Tà Xùa · OCOP 4 Sao · Hữu cơ tự nhiên |
| **3** | **Trà từ vỏ cà phê** | `tra-tu-vo-ca-phe-cascara` | Đồ uống | Huyện Mai Sơn, Tỉnh Sơn La | OCOP 4 Sao Tỉnh Sơn La · ISO 22000:2018 |
| **4** | **Mận hậu** | `man-hau-moc-chau` | Trái cây | Thung lũng Ná Ka & Tân Lập, Mộc Châu (1.050m) | Nhãn hiệu chứng nhận "Mận hậu Mộc Châu" · VietGAP |
| **5** | **Mận sấy** | `man-say-deo-moc-chau` | Sản phẩm chế biến | Thị trấn Nông trường Mộc Châu | OCOP 4 Sao Tỉnh Sơn La · HACCP / ISO 22000 |
| **6** | **Hồng sấy dẻo** | `hong-say-deo-moc-chau` | Sản phẩm chế biến | Huyện Mộc Châu & Vân Hồ | OCOP 4 Sao · Công nghệ Hoshigaki Nhật Bản · VietGAP |
| **7** | **Gạo nếp địa phương** | `gao-nep-tan-ngoc-chien` | Nông sản | Xã Ngọc Chiến, Huyện Mường La (1.600m–1.800m) | Nhãn hiệu tập thể "Nếp Tan Ngọc Chiến" · OCOP 4 Sao |
| **8** | **Tỏi đen** | `toi-den-mot-nhanh-son-la` | Sản phẩm chế biến | Huyện Yên Châu & Phù Yên (400m–750m) | OCOP 4 Sao Tỉnh Sơn La · Lên men tự nhiên 60–90 ngày |

---

## 5. Danh mục 14 Bài viết Truyền thông Văn hóa & Quy trình Sản xuất

| Mã BV (`id`) | Tiêu đề bài viết | Loại nội dung (`content_type`) | Sản phẩm liên kết (`product_ids`) | Thời lượng đọc |
| :---: | :--- | :--- | :---: | :---: |
| **1** | Hành trình Cà phê Arabica Sơn La chinh phục chứng nhận Chỉ dẫn địa lý quốc gia | `origin_story` | `[1, 3]` | 6 phút |
| **2** | Bí mật chế biến ướt và Honey giúp hạt Arabica Mai Sơn giữ trọn hương hoa rừng | `production_process` | `[1]` | 5 phút |
| **3** | Báu vật rừng chè Shan tuyết cổ thụ trăm năm trên đỉnh mây Tà Xùa | `cultural_heritage` | `[2]` | 7 phút |
| **4** | Nghệ thuật sao trà bằng chảo gang và cách thưởng thức Chè Shan tuyết đúng điệu | `guide` | `[2]` | 5 phút |
| **5** | Trà vỏ cà phê Cascara: Bước đột phá kinh tế tuần hoàn từ trái Arabica Sơn La | `innovation` | `[3, 1]` | 5 phút |
| **6** | Mùa mận hậu chín đỏ thung lũng Ná Ka và câu chuyện nông nghiệp VietGAP Mộc Châu | `origin_story` | `[4, 5]` | 6 phút |
| **7** | Lễ hội Hái quả Mộc Châu: Nơi văn hóa bản địa giao hòa cùng du lịch nông nghiệp | `cultural_heritage` | `[4, 5]` | 5 phút |
| **8** | Công nghệ sấy lạnh giúp Mận sấy dẻo Mộc Châu giữ trọn sắc hương bốn mùa | `production_process` | `[5, 4]` | 5 phút |
| **9** | Kỹ nghệ làm Hồng sấy dẻo treo gió Hoshigaki trên cao nguyên sương mờ Mộc Châu | `production_process` | `[6]` | 6 phút |
| **10** | Thưởng thức Hồng sấy dẻo cùng Chè Shan tuyết: Sự kết hợp tinh tế của ẩm thực Tây Bắc | `guide` | `[6, 2]` | 4 phút |
| **11** | Nếp Tan Ngọc Chiến: Hạt ngọc nuôi dưỡng từ dòng suối khoáng nóng Mường La | `origin_story` | `[7]` | 6 phút |
| **12** | Lễ mừng cơm mới của người Thái Sơn La và nghệ thuật làm xôi ngũ sắc từ Nếp Tan | `cultural_heritage` | `[7]` | 5 phút |
| **13** | Từ củ tỏi cô đơn Yên Châu đến Tỏi đen lên men 90 ngày giàu dược tính | `production_process` | `[8]` | 6 phút |
| **14** | Ứng dụng Khoa học Dữ liệu và Machine Learning trong truyền thông nông sản bản địa Sơn La | `research` | `[1, 2, 4, 7, 8]` | 7 phút |

---

## 6. Kế hoạch Thu thập & Sinh Dữ liệu Hành vi (Data Collection & Simulation Plan)

Để phục vụ huấn luyện và kiểm thử nghiêm ngặt các thuật toán học máy ngay từ giai đoạn triển khai, hệ thống kết hợp **thu thập dữ liệu tương tác thực** (`is_simulated = False`) và **bộ dữ liệu mô phỏng có kiểm soát** (`is_simulated = True`, `random_seed = 42`):

| Kịch bản mô phỏng (`scenario_code`) | Tỷ trọng | Số phiên ($S$) | Xem SP/phiên | Xem bài/phiên | Thời lượng phiên (s) | Xác suất Liên hệ ($C$) | Sở thích danh mục chính |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `casual_browsing` (Khách vãng lai xem nhanh) | **30%** (150 vis) | 1 – 2 | 0 – 2 | 0 – 1 | 25 – 95s | 0.5% | Tất cả (1, 2, 3, 4) |
| `culture_story_reader` (Độc giả văn hóa & câu chuyện) | **22%** (110 vis) | 2 – 4 | 1 – 3 | 3 – 6 | 210 – 420s | 4.0% | Đồ uống, Nông sản (1, 4) |
| `specialty_product_explorer` (Người khám phá đặc sản) | **24%** (120 vis) | 3 – 5 | 3 – 6 | 1 – 3 | 180 – 340s | 12.0% | Đồ uống, Trái cây, Chế biến (1, 2, 3) |
| `high_intent_buyer_partner` (Khách tiềm năng & đối tác B2B) | **14%** (70 vis) | 4 – 7 | 3 – 5 | 2 – 4 | 280 – 520s | 82.0% | Đồ uống, Chế biến, Nông sản (1, 3, 4) |
| `health_gift_seeker` (Người tìm quà biếu & sức khỏe) | **10%** (50 vis) | 2 – 4 | 2 – 4 | 2 – 4 | 150 – 290s | 28.0% | Đồ uống, Sản phẩm chế biến (1, 3) |

**Quy mô bộ dữ liệu chuẩn tạo ra (với `seed = 42`):**
- Tổng số người truy cập (`visitors`): **501** (500 simulated + 1 tài khoản thực nghiệm `demo_visitor_sonla`).
- Tổng số phiên truy cập (`sessions`): **~1.545 phiên**.
- Tổng số sự kiện hành vi (`events`): **~19.200 sự kiện** trải đều trên 10 loại sự kiện chuẩn hóa.
