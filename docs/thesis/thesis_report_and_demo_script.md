# BÁO CÁO ĐỒ ÁN TỐT NGHIỆP (5 CHƯƠNG) & KỊCH BẢN DEMO BẢO VỆ 10 PHÚT

**Tên đề tài:** Xây dựng hệ thống truyền thông và phân tích dữ liệu hành vi người dùng cho sản phẩm nông nghiệp truyền thống địa phương (Nghiên cứu điển hình tại tỉnh Sơn La)  
**Phương pháp Khoa học Dữ liệu trọng tâm:** Phân cụm hành vi người dùng bằng thuật toán **K-Means** kết hợp Hệ thống gợi ý nội dung **Content-based Recommendation** sử dụng **TF-IDF tiếng Việt & Cosine Similarity**.

---

## CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI NGHIÊN CỨU

### 1.1. Đặt vấn đề và Bối cảnh Thực tiễn
Việt Nam nói chung và tỉnh miền núi Tây Bắc **Sơn La** nói riêng sở hữu hệ sinh thái nông sản bản địa vô cùng phong phú, gắn liền với điều kiện thổ nhưỡng, độ cao và văn hóa canh tác lâu đời của đồng bào các dân tộc Thái, Mông, Dao, Mường. Nhiều sản phẩm của Sơn La đã được cấp văn bằng bảo hộ **Chỉ dẫn địa lý quốc gia** và đạt chứng nhận **OCOP từ 4 đến 5 sao** như *Cà phê Arabica Sơn La, Chè Shan tuyết cổ thụ Tà Xùa, Mận hậu Mộc Châu, Gạo nếp Tan Ngọc Chiến, Hồng sấy dẻo Hoshigaki, Tỏi đen một nhánh Yên Châu*.

Tuy nhiên, khảo sát thực tế cho thấy hoạt động quảng bá nông sản truyền thống hiện nay gặp ba hạn chế lớn:
1. **Thiếu chiều sâu văn hóa và tính liên kết nội dung:** Các trang thông tin hoặc sàn thương mại điện tử thường chỉ đăng tải giá bán rời rạc mà thiếu sự kết nối hữu cơ giữa *Sản phẩm – Vùng địa lý – Quy trình chế biến – Câu chuyện văn hóa bản địa*.
2. **Thiếu hệ thống thu thập và phân tích hành vi người truy cập:** Các đơn vị quản lý và Hợp tác xã không nắm bắt được người đọc quan tâm đến nhóm đặc sản nào, đọc sâu đến đâu, tìm kiếm từ khóa gì hay rời bỏ ở bước nào trên phễu chuyển đổi.
3. **Chưa có cơ chế cá nhân hóa trải nghiệm:** Mọi người truy cập đều nhìn thấy giao diện tĩnh giống hệt nhau, làm giảm khả năng khám phá chéo giữa bài viết câu chuyện và sản phẩm thực tế.

Xuất phát từ thực tiễn đó, đề tài ***"Xây dựng hệ thống truyền thông và phân tích dữ liệu hành vi người dùng cho sản phẩm nông nghiệp truyền thống địa phương"*** được thực hiện nhằm xây dựng một nền tảng truyền thông số hoàn chỉnh tích hợp chu trình khép kín của Khoa học dữ liệu: **Thu thập sự kiện (Event-based Tracking) $\rightarrow$ Trích xuất đặc trưng hành vi $\rightarrow$ Phân cụm người dùng K-Means $\rightarrow$ Gợi ý nội dung cá nhân hóa Content-based**.

### 1.2. Mục tiêu và Phạm vi Nghiên cứu
- **Phạm vi nội dung địa phương:** Tập trung chuẩn hóa dữ liệu xác thực của **08 sản phẩm nông nghiệp truyền thống tiêu biểu tỉnh Sơn La** thuộc 4 danh mục (*Đồ uống, Trái cây, Sản phẩm chế biến, Nông sản*) tại 5 tiểu vùng địa lý và **14 bài viết chuyên đề**.
- **Phạm vi kỹ thuật & học máy:**
  - Thiết kế cơ chế thu thập 10 sự kiện hành vi ẩn danh theo thời gian thực.
  - Xây dựng mô hình phân cụm không giám sát **K-means** trên vector 9 đặc trưng hành vi $X = [S, P, A, T, Q, F, C, R, U]$.
  - Xây dựng hệ thống gợi ý **Content-based Filtering** sử dụng xử lý ngôn ngữ tự nhiên tiếng Việt, biểu diễn **TF-IDF** và độ đo **Cosine Similarity**, có tích hợp cơ chế xử lý **Cold-start**.
  - Xây dựng **Admin Analytics Dashboard** trực quan hóa toàn diện dữ liệu hành vi và kết quả mô hình.

---

## CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ PHƯƠNG PHÁP NGHIÊN CỨU

### 2.1. Thu thập Dữ liệu Hành vi Dựa trên Sự kiện (Event-based Behavioral Tracking)
Khác với mô hình phân tích nhật ký máy chủ truyền thống (Page-based Log Analysis) chỉ ghi nhận lượt tải trang, mô hình **Event-based Tracking** biểu diễn mọi tương tác của người dùng dưới dạng một luồng sự kiện có cấu trúc:
$$e_k = (\text{visitor\_id}, \text{session\_id}, \text{event\_name}, \text{content\_type}, \text{content\_id}, t_k, \text{properties})$$
Phương pháp này cho phép đo lường chính xác mức độ cam kết sâu của người truy cập thông qua sự kiện cuộn trang sâu (`scroll` $\ge 50\%$), thời gian dừng (`dwell_seconds`), tìm kiếm (`search`), lưu yêu thích (`favorite`), chia sẻ (`share`) và nhấn liên hệ nhà sản xuất (`contact_click`).

### 2.2. Chuẩn hóa Dữ liệu và Thuật toán Phân cụm K-Means
Do 9 đặc trưng hành vi trong vector $X = [S, P, A, T, Q, F, C, R, U]$ có đơn vị đo và biên độ chênh lệch lớn (ví dụ thời gian phiên $T$ tính bằng hàng trăm giây trong khi số lần tìm kiếm $Q$ nằm trong khoảng $0..7$), hệ thống áp dụng chuẩn hóa **Z-score (`StandardScaler`)**:
$$z_{ij} = \frac{x_{ij} - \mu_j}{\sigma_j}$$
Thuật toán **K-Means** phân hoạch $N$ vector người dùng thành $K$ cụm $C = \{C_1, C_2, \dots, C_K\}$ sao cho tối thiểu hóa tổng bình phương khoảng cách Euclid nội cụm (Inertia / WCSS):
$$J = \sum_{k=1}^{K} \sum_{x_i \in C_k} \| x_i - \mu_k \|_2^2$$
Để lựa chọn số cụm $K$ khách quan, nghiên cứu kết hợp 3 độ đo:
1. **Hệ số Silhouette ($s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$):** Đánh giá độ gắn kết trong cụm $a(i)$ so với khoảng cách tới cụm lân cận gần nhất $b(i)$.
2. **Chỉ số Davies-Bouldin (DBI):** Đo tỷ số giữa độ phân tán nội cụm và khoảng cách giữa các tâm cụm (càng nhỏ càng tốt).
3. **Chỉ số Tương đồng Điều chỉnh Rand (Adjusted Rand Index - ARI):** Đo độ ổn định của kết quả phân cụm qua nhiều hạt giống khởi tạo ngẫu nhiên khác nhau.

### 2.3. Biểu diễn Văn bản Tiếng Việt TF-IDF và Gợi ý Content-Based
Mỗi nội dung $d_j$ (sản phẩm hoặc bài viết) sau khi được tách từ tiếng Việt và loại bỏ hư từ được biểu diễn thành vector trọng số **TF-IDF (Term Frequency – Inverse Document Frequency)** với công thức làm trơn dưới tuyến tính (Sublinear TF):
$$\text{tfidf}(t, d, D) = (1 + \ln \text{tf}(t, d)) \times \left(\ln \frac{1 + |D|}{1 + \text{df}(t, D)} + 1\right)$$
Hồ sơ sở thích của người truy cập $\vec{u}$ được tổng hợp bằng trung bình có trọng số các vector nội dung mà người đó đã tương tác:
$$\vec{u} = \frac{\sum_{(d_j, a) \in H(u)} w_a \cdot \vec{v}(d_j)}{\sum_{(d_j, a) \in H(u)} w_a}$$
trong đó bộ trọng số hành vi phản ánh mức độ quan tâm tăng dần: $w_{\text{view}}=1, w_{\text{scroll}}=2, w_{\text{favorite}}=3, w_{\text{share}}=4, w_{\text{contact}}=5$. Điểm phù hợp giữa người dùng $\vec{u}$ và nội dung ứng viên $\vec{v}(d_c)$ được tính bằng **Độ tương đồng Cosine**:
$$\text{sim}(\vec{u}, \vec{v}(d_c)) = \frac{\vec{u} \cdot \vec{v}(d_c)}{\|\vec{u}\|_2 \|\vec{v}(d_c)\|_2}$$

---

## CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

### 3.1. Kiến trúc Hệ thống 4 Tầng
1. **Tầng Giao diện (Frontend):** Xây dựng bằng **Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4 và Recharts**, cung cấp trải nghiệm mượt mà trên cả cổng thông tin công khai và bảng điều khiển quản trị.
2. **Tầng Dịch vụ API (Backend):** Xây dựng bằng **FastAPI** và **SQLAlchemy 2.0**, cung cấp các RESTful API hiệu năng cao kèm tài liệu OpenAPI tự động.
3. **Tầng Cơ sở Dữ liệu Quan hệ:** Thiết kế **18 bảng vật lý** (15 bảng thực thể chính + các bảng liên kết/hồ sơ cụm) tương thích đồng thời với **PostgreSQL 15** và **SQLite (WAL mode)**, quản lý миграции bằng **Alembic**.
4. **Tầng Khoa học Dữ liệu (ML Module):** Đóng gói độc lập tại thư mục `ml/src/`, lưu trữ mô hình đã huấn luyện dưới dạng phiên bản hóa (`ml/artifacts/*.joblib`).

*(Chi tiết sơ đồ Use Case, Activity, Sequence và ERD 15 bảng được trình bày đầy đủ tại `docs/architecture/system_architecture_and_uml.md` và `docs/erd/database_erd_and_schema.md`).*

---

## CHƯƠNG 4: XÂY DỰNG HỆ THỐNG VÀ THỰC NGHIỆM ĐÁNH GIÁ MÔ HÌNH

### 4.1. Kết quả Chuẩn hóa Dữ liệu Nông sản Sơn La và Sinh Dữ liệu Hành vi
Hệ thống đã chuẩn hóa **8 sản phẩm đặc sản Sơn La** có nguồn gốc pháp lý xác thực (*Cà phê Arabica Sơn La, Chè Shan tuyết, Trà từ vỏ cà phê, Mận hậu, Mận sấy, Hồng sấy dẻo, Gạo nếp địa phương, Tỏi đen*) và **14 bài viết chuyên đề**. Bộ sinh dữ liệu mô phỏng (`seed=42`) đã tạo lập **500 người dùng mô phỏng** (`is_simulated=True`) cùng tài khoản thực nghiệm **`demo_visitor_sonla`** (`is_simulated=False`), với tổng cộng **1.545 phiên** và **~19.200 sự kiện**.

### 4.2. Kết quả Thực nghiệm Phân cụm K-Means
- Thực nghiệm quét $K \in [2..8]$ xác định **$K = 4$** là số cụm tối ưu nhất với **$\text{Inertia} = 798.71$**, **$\text{Silhouette Score} = 0.4750$**, **$\text{Davies-Bouldin Index} = 0.8319$** và **độ ổn định $\text{ARI} = 1.0000$**.
- Phân tích tâm cụm hậu kiểm đã định danh rõ 4 phân khúc hành vi:
  1. *Nhóm độc giả yêu thích văn hóa & câu chuyện bản địa* ($31.74\%$, xem TB $11.16$ bài viết).
  2. *Nhóm khách vãng lai xem nhanh - Casual Visitors* ($30.34\%$, thời lượng TB $65.45\text{s}$).
  3. *Nhóm khám phá & so sánh đa dạng đặc sản* ($28.14\%$, xem $6.89/8$ sản phẩm, lưu yêu thích $13.42$ lần).
  4. *Nhóm quan tâm sâu & có ý định liên hệ cao* ($9.78\%$, quay lại $5.04$ lần, nhấn liên hệ $20.02$ lần).

### 4.3. Kết quả Thực nghiệm Hệ thống Gợi ý Content-Based
- Trên giao thức đánh giá **Chronological 75/25 Train-Holdout Split** ($374$ người dùng đủ điều kiện), hệ thống đạt:
  - **$\text{Precision@5} = 0.8620$**
  - **$\text{Recall@5} = 0.8630$**
  - **$\text{nDCG@5} = 0.8633$**
  - **$\text{Catalog Coverage} = 95.45\%$ ($21/22$ nội dung)**
  - **$\text{Intra-List Diversity} = 0.8937$**

---

## CHƯƠNG 5: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 5.1. Kết quả Đạt được
1. Xây dựng hoàn chỉnh hệ thống truyền thông số chuyên biệt cho nông sản truyền thống tỉnh Sơn La với dữ liệu xác thực, giao diện hiện đại và kiến trúc chuẩn công nghiệp.
2. Triển khai thành công pipeline thu thập 10 sự kiện hành vi thời gian thực, tự động trích xuất vector 9 đặc trưng $X = [S, P, A, T, Q, F, C, R, U]$.
3. Chứng minh hiệu quả thực nghiệm của mô hình phân cụm K-means ($K=4$, $\text{Silhouette}=0.4750$) và hệ thống gợi ý Content-based TF-IDF tiếng Việt ($\text{Precision@5}=0.8620$).

### 5.2. Hạn chế và Hướng Phát triển
- **Hạn chế:** Danh mục hiện tại tập trung sâu vào 8 sản phẩm tiêu biểu của tỉnh Sơn La; mô hình TF-IDF chủ yếu dựa trên khớp từ vựng và cụm từ (1-2 gram).
- **Hướng phát triển:** Mở rộng danh mục sang toàn bộ sản phẩm OCOP vùng Tây Bắc; kết hợp mô hình ngôn ngữ tiền huấn luyện tiếng Việt (*PhoBERT Embeddings*) và lọc cộng tác lai (*Hybrid Filtering*) khi lượng người dùng thực tế đạt quy mô lớn.

---
---

# KỊCH BẢN DEMO BẢO VỆ ĐỒ ÁN TỐT NGHIỆP (10 PHÚT — MỤC 37 KẾ HOẠCH)

> **Chuẩn bị trước giờ bảo vệ:**
> - Backend đang chạy tại `http://localhost:8000` (Swagger UI tại `http://localhost:8000/docs`).
> - Frontend đang chạy tại `http://localhost:3000`.
> - Tài khoản Demo Visitor cố định: `demo_visitor_sonla` (có nút chuyển đổi nhanh trên thanh công cụ hoặc lưu trong `localStorage`).
> - Tài khoản Quản trị viên: `admin` / `admin123`.

| Thời lượng | Phần trình bày | Thao tác trực tiếp trên Hệ thống | Kết quả hiển thị cần nhấn mạnh với Hội đồng |
| :---: | :--- | :--- | :--- |
| **Phút 0:00 – 1:30** | **1. Giới thiệu bài toán & Không gian truyền thông nông sản Sơn La** | Mở Trang chủ `http://localhost:3000`. Cuộn qua Bản đồ 5 vùng nguyên liệu Sơn La, Danh mục 8 sản phẩm đặc sản và Chuyên mục Câu chuyện văn hóa. | Nhấn mạnh dữ liệu chuẩn hóa có chứng nhận Chỉ dẫn địa lý & OCOP thực tế của tỉnh Sơn La (Cà phê Arabica Mai Sơn, Chè Shan tuyết Tà Xùa, Mận hậu Mộc Châu, Nếp Tan Ngọc Chiến...). |
| **Phút 1:30 – 4:00** | **2. Demo Hành trình Người dùng & Thu thập Sự kiện Hành vi (Event Tracking)** | 1. Nhấn vào sản phẩm **"Cà phê Arabica Sơn La"** (`/products/ca-phe-arabica-son-la`).<br>2. Cuộn đọc quy trình chế biến 5 bước ($\ge 50\%$ trang).<br>3. Nhấn nút **"Yêu thích"** và nhấn **"Liên hệ Hợp tác xã"**.<br>4. Nhấn đọc bài viết liên quan **"Hành trình Cà phê Arabica Sơn La chinh phục Chỉ dẫn địa lý"**. | Mở bảng trạng thái Tracking (hoặc tab Network) để chỉ rõ các sự kiện `product_view`, `scroll`, `favorite`, `contact_click`, `article_view` được gửi bất đồng bộ về `POST /api/v1/events` và tự động cập nhật vector 9 chiều $X = [S, P, A, T, Q, F, C, R, U]$. |
| **Phút 4:00 – 6:30** | **3. Demo Hệ thống Gợi ý Content-Based & Xử lý Cold-Start** | 1. Quan sát khối **"Gợi ý cá nhân hóa dành cho bạn"** của `demo_visitor_sonla` (yêu thích nhóm Đồ uống vùng cao).<br>2. Mở chế độ Khách mới (Cold-start) hoặc xóa lịch sử phiên để đối chiếu kết quả gợi ý. | - Với `demo_visitor_sonla` (`strategy = "content_based"`): Hệ thống ưu tiên gợi ý *Trà từ vỏ cà phê Cascara*, *Chè Shan tuyết Tà Xùa* và các bài viết chế biến Honey/sao trà kèm điểm tương đồng Cosine và nhãn lý do.<br>- Với khách mới (`cold_start_related` / `cold_start_popular`): Hệ thống tự động fallback mượt mà không bị trống dữ liệu. |
| **Phút 6:30 – 9:00** | **4. Demo Admin Analytics Dashboard & Phân cụm K-Means** | Đăng nhập `http://localhost:3000/admin/login` (`admin` / `admin123`).<br>1. Mở tab **Tổng quan & Hành vi**: Xem KPIs, Phễu chuyển đổi 5 bước và luồng sự kiện vừa tương tác của `demo_visitor_sonla`.<br>2. Mở tab **Phân khúc K-Means**: Trình bày biểu đồ Elbow/Silhouette ($K=2..8$) và 4 cụm người dùng tại $K=4$.<br>3. Mở tab **Đánh giá Mô hình & ML Lab**: Trình bày bảng kết quả Hold-out ($\text{P@5}=0.8620$, $\text{nDCG@5}=0.8633$) và thử nghiệm bấm nút **"Huấn luyện lại"**. | Chỉ rõ tính khoa học: Số cụm $K=4$ được chọn khách quan từ thực nghiệm ($\text{Silhouette}=0.4750, \text{DBI}=0.8319, \text{ARI}=1.0$), tên cụm đặt hậu kiểm từ tâm cụm, và có công tắc tách biệt hoàn toàn dữ liệu thực (`is_simulated=False`) với dữ liệu mô phỏng (`is_simulated=True`). |
| **Phút 9:00 – 10:00** | **5. Tổng kết Đóng góp & Trả lời Câu hỏi Hội đồng** | Tóm tắt chu trình khép kín từ Truyền thông nông sản địa phương $\rightarrow$ Thu thập hành vi $\rightarrow$ Phân cụm K-means $\rightarrow$ Gợi ý Content-based TF-IDF. | Khẳng định hệ thống sẵn sàng triển khai thực tế cho các Hợp tác xã và Trung tâm xúc tiến thương mại nông sản tỉnh Sơn La. |
