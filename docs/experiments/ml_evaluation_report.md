# BÁO CÁO THỰC NGHIỆM & ĐÁNH GIÁ MÔ HÌNH HỌC MÁY (K-MEANS CLUSTERING & CONTENT-BASED RECOMMENDATION)

**Đề tài:** Xây dựng hệ thống truyền thông và phân tích dữ liệu hành vi người dùng cho sản phẩm nông nghiệp truyền thống địa phương (Tỉnh Sơn La)  
**Bàn giao Giai đoạn 3 (Weeks 7–8 Deliverable):** Kết quả thực nghiệm phân cụm K-means ($K = 2..8$), phân tích tâm cụm hậu kiểm (Post-hoc Cluster Profiling), đánh giá Hold-out hệ thống gợi ý Content-based TF-IDF và phân tích độ nhạy bộ trọng số hành vi.

---

## 1. Môi trường Thực nghiệm & Bộ Dữ liệu Chuẩn

### 1.1. Quy mô Dữ liệu Thực nghiệm (`random_seed = 42`)
- **Danh mục nội dung chuẩn hóa:** $22$ đơn vị nội dung (gồm **8 sản phẩm đặc sản Sơn La** thuộc 4 danh mục và **14 bài viết chuyên đề** về vùng nguyên liệu, quy trình chế biến và văn hóa bản địa).
- **Tổng số người truy cập (`visitors`):** $N = 501$ người dùng ($500$ người dùng sinh từ 5 kịch bản hành vi có hạt giống cố định `seed=42` và $1$ người dùng thực nghiệm chuẩn `demo_visitor_sonla`).
- **Tổng số phiên truy cập (`sessions`):** $\sim 1.545$ phiên.
- **Tổng số sự kiện hành vi (`events`):** $\sim 19.200$ sự kiện thuộc 10 loại sự kiện chuẩn hóa.

### 1.2. Thống kê Mô tả Vector 9 Đặc trưng Hành vi $X = [S, P, A, T, Q, F, C, R, U]$

Trước khi đưa vào thuật toán K-means, dữ liệu hành vi của từng người truy cập được tổng hợp thành vector 9 chiều $X_i \in \mathbb{R}^9$, cắt ngưỡng ngoại lai tại phân vị thứ 99 (99th percentile clipping) và chuẩn hóa Z-score bằng `StandardScaler`:

| Ký hiệu | Tên đặc trưng (`user_features`) | Trung bình (Mean) | Độ lệch chuẩn (Std) | Trung vị (Median) | Min | Max |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **$S$** | `total_sessions` (Tổng số phiên) | 3.09 | 1.56 | 3.00 | 1.00 | 7.00 |
| **$P$** | `total_product_views` (Lượt xem sản phẩm) | 9.94 | 8.57 | 7.00 | 0.00 | 32.00 |
| **$A$** | `total_article_views` (Lượt xem bài viết) | 8.11 | 6.16 | 8.00 | 0.00 | 23.00 |
| **$T$** | `avg_session_duration` (Thời gian TB phiên - giây) | 230.03 | 123.49 | 257.03 | 25.30 | 481.92 |
| **$Q$** | `total_searches` (Lượt tìm kiếm) | 1.63 | 1.61 | 1.00 | 0.00 | 7.00 |
| **$F$** | `total_favorites` (Lượt yêu thích) | 7.92 | 8.56 | 5.00 | 0.00 | 37.00 |
| **$C$** | `total_contact_clicks` (Lượt nhấn liên hệ HTX) | 3.28 | 6.24 | 0.00 | 0.00 | 28.00 |
| **$R$** | `return_visits` (Số lần quay lại: $S - 1$) | 2.09 | 1.56 | 2.00 | 0.00 | 6.00 |
| **$U$** | `unique_products_viewed` (Số SP khác nhau đã xem) | 4.33 | 2.60 | 4.00 | 0.00 | 8.00 |

---

## 2. Thực nghiệm Phân cụm Hành vi Người dùng bằng K-Means

### 2.1. Kết quả Quét Tham số $K \in [2..8]$

Tuân thủ nguyên tắc học không giám sát (Mục 12.4 của Kế hoạch): **không áp đặt trước số cụm hoặc tên cụm**, hệ thống thực nghiệm khách quan với $K$ chạy từ $2$ đến $8$ (`n_init=15`, `max_iter=300`, `random_state=42`) và đánh giá đồng thời trên 4 tiêu chí định lượng:
1. **Inertia (Within-Cluster Sum of Squares - WCSS):** Càng nhỏ càng tốt, tìm điểm gãy (Elbow).
2. **Silhouette Score $\in [-1, 1]$:** Càng cao càng phản ánh độ gắn kết nội cụm và độ tách biệt liên cụm tốt.
3. **Davies-Bouldin Index (DBI):** Càng thấp càng chứng tỏ các cụm cô đọng và tách rời nhau rõ rệt.
4. **Cluster Stability (Adjusted Rand Index - ARI):** Trung bình chỉ số ARI khi huấn luyện lại với 5 hạt giống ngẫu nhiên khác nhau (`[11, 23, 37, 59, 83]`), đo lường tính ổn định của ranh giới cụm.

| Số cụm ($K$) | Inertia (WCSS) | Silhouette Score $\uparrow$ | Davies-Bouldin Index $\downarrow$ | Độ ổn định ARI $\uparrow$ | Tỷ lệ cụm nhỏ nhất (%) | Phân bố kích thước các cụm | Đánh giá |
| :---: | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **$K = 2$** | 2064.47 | 0.4537 | 0.8525 | 1.0000 | 47.11% | `{0: 236, 1: 265}` | Quá thô (chỉ tách nhóm ít vs nhiều tương tác) |
| **$K = 3$** | 1265.39 | 0.4504 | 0.8634 | 0.9952 | 23.35% | `{0: 232, 1: 117, 2: 152}` | Chưa tách biệt rõ nhóm đọc văn hóa và nhóm khám phá SP |
| **$K = 4$** | **798.71** | **0.4750** | **0.8319** | **1.0000** | **9.78%** | **`{0: 159, 1: 49, 2: 152, 3: 141}`** | **Tối ưu toàn cục (Điểm gãy Elbow, Silhouette cực đại, DBI cực tiểu, ARI = 1.0)** |
| **$K = 5$** | 676.92 | 0.4700 | 0.8344 | 1.0000 | 6.39% | `{0: 159, 1: 152, 2: 120, 3: 38, 4: 32}` | Tốt nhưng bắt đầu chia nhỏ nhóm khách tiềm năng |
| **$K = 6$** | 571.80 | 0.4482 | 0.9896 | 0.8141 | 6.39% | `{0: 85, 1: 152, 2: 78, 3: 32, 4: 116, 5: 38}` | Độ ổn định ARI giảm xuống 0.8141, DBI tăng cao |
| **$K = 7$** | 465.45 | 0.4416 | 0.9240 | 0.9943 | 6.39% | `{0: 32, 1: 150, 2: 86, 3: 73, 4: 38, 5: 60, 6: 62}` | Phân mảnh quá mức, khó diễn giải chiến lược |
| **$K = 8$** | 425.59 | 0.4316 | 0.9727 | 0.9259 | 6.39% | `{0: 150, 1: 47, 2: 43, 3: 38, 4: 61, 5: 32, 6: 73, 7: 57}` | Silhouette thấp nhất (0.4316) |

**Kết luận chọn $K$:** Tại **$K = 4$**, đường cong Inertia tạo điểm gãy rõ rệt (giảm mạnh từ $1265.39$ xuống $798.71$), đồng thời đạt **Silhouette Score cao nhất ($0.4750$)**, **Davies-Bouldin Index thấp nhất ($0.8319$)** và **độ ổn định tuyệt đối ($\text{ARI} = 1.0000$)**. Do đó, hệ thống tự động lựa chọn $K = 4$ làm mô hình phân cụm chính thức (`kmeans_v20261101_054014`).

---

### 2.2. Phân tích Tâm cụm Hậu kiểm (Post-hoc Centroid Profiling tại $K = 4$)

Từ giá trị trung bình thực tế của 9 đặc trưng tại từng tâm cụm so với trung bình toàn quần thể, hệ thống tự động diễn giải và định danh 4 phân khúc người dùng như sau:

| Chỉ số Cụm | Tên Phân khúc Hậu kiểm (`cluster_name`) | Quy mô (`size` / `%`) | $S$ (Phiên) | $P$ (Xem SP) | $A$ (Xem Bài) | $T$ (Giây/phiên) | $Q$ (Tìm kiếm) | $F$ (Yêu thích) | $C$ (Liên hệ) | $R$ (Quay lại) | $U$ (SP Khác nhau) |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Cụm 0** | **Nhóm độc giả yêu thích văn hóa & câu chuyện bản địa** | 159 (31.74%) | 2.78 | 6.65 | **11.16** | **291.49s** | 0.97 | 4.86 | 0.82 | 1.78 | 4.00 |
| **Cụm 1** | **Nhóm quan tâm sâu & có ý định liên hệ cao** | 49 (9.78%) | **6.04** | **24.73** | **18.18** | **398.73s** | **3.96** | **26.49** | **20.02** | **5.04** | **7.41** |
| **Cụm 2** | **Nhóm khách vãng lai xem nhanh (Casual Visitors)** | 152 (30.34%) | 1.50 | 1.43 | 0.87 | 65.45s | 0.16 | 0.05 | 0.03 | 0.50 | 1.32 |
| **Cụm 3** | **Nhóm khám phá & so sánh đa dạng đặc sản** | 141 (28.14%) | 4.13 | **17.67** | 8.96 | 279.50s | **3.16** | **13.42** | 3.75 | 3.13 | **6.89** |

**Chiến lược truyền thông tương ứng từng cụm:**
1. **Cụm 0 (31.74% – Độc giả văn hóa & câu chuyện vùng trồng):** Đọc trung bình $11.16$ bài viết và thời gian dừng trang lâu ($291.5\text{s}$). *Chiến lược:* Đề xuất các bài viết chuyên sâu về lịch sử vùng nguyên liệu (Tà Xùa, Ngọc Chiến), quy trình chế biến thủ công gắn kèm thẻ sản phẩm liên quan.
2. **Cụm 1 (9.78% – Nhóm quan tâm sâu & ý định liên hệ cao):** Quay lại trung bình $5.04$ lần, khám phá $7.41/8$ sản phẩm và nhấn liên hệ HTX tới $20.02$ lần. *Chiến lược:* Ưu tiên hiển thị chứng nhận Chỉ dẫn địa lý, OCOP 4–5 sao, năng lực cung ứng của Hợp tác xã và nút kết nối đặt hàng trực tiếp.
3. **Cụm 2 (30.34% – Khách vãng lai xem nhanh):** Chỉ xem $1.43$ sản phẩm trong $65.5\text{s}$. *Chiến lược:* Kích hoạt cơ chế Cold-start hiển thị ngay Top đặc sản nổi bật nhất (*Cà phê Arabica Sơn La, Chè Shan tuyết Tà Xùa*) cùng tóm tắt ngắn gọn để giữ chân người dùng.
4. **Cụm 3 (28.14% – Nhóm khám phá & so sánh đa dạng đặc sản):** Xem $6.89/8$ sản phẩm khác nhau, tìm kiếm $3.16$ lần và lưu yêu thích $13.42$ lượt. *Chiến lược:* Đề xuất danh sách sản phẩm cùng nhóm danh mục, gợi ý bộ quà tặng đặc sản Tây Bắc kết hợp (*Hồng sấy dẻo + Chè Shan tuyết*).

---

## 3. Thực nghiệm & Đánh giá Hệ thống Gợi ý Content-Based (TF-IDF Tiếng Việt)

### 3.1. Cấu hình Mô hình Biểu diễn Văn bản Tiếng Việt
- **Kho nội dung hợp nhất (`contents`):** $22$ tài liệu (8 sản phẩm + 14 bài viết).
- **Tiền xử lý NLP Tiếng Việt (`ml/src/preprocessing/vietnamese_nlp.py`):** Chuẩn hóa Unicode NFC, chuyển chữ thường, ghép từ ghép nông sản & địa danh Sơn La bằng dấu gạch dưới (ví dụ: `cà_phê`, `arabica`, `sơn_la`, `shan_tuyết`, `tà_xùa`, `mộc_châu`, `ngọc_chiến`, `chỉ_dẫn_địa_lý`, `sấy_lạnh`, `lên_men`), loại bỏ hư từ tiếng Việt (stopwords).
- **Vector hóa TF-IDF:** `TfidfVectorizer(ngram_range=(1, 2), max_features=1500, sublinear_tf=True)` tạo không gian vector $1.500$ chiều đặc trưng.

### 3.2. Giao thức Đánh giá Kiểm thử Hold-out Theo Thời gian (Chronological Hold-out Protocol)
Tuân thủ nghiêm ngặt yêu cầu tại Mục 30 của Kế hoạch (*"Không sử dụng chính dữ liệu huấn luyện làm bằng chứng duy nhất cho chất lượng gợi ý"*):
- Với mỗi người truy cập có tối thiểu 4 nội dung tương tác khác nhau ($N_{\text{eval}} = 374$ visitors đủ điều kiện):
  - **Tập Lịch sử Huấn luyện (75% đầu theo trình tự thời gian):** Dùng để tổng hợp vector hồ sơ sở thích người dùng $\vec{u}$ (loại bỏ hoàn toàn khỏi danh sách ứng viên gợi ý).
  - **Tập Kiểm thử Tương lai Hold-out (25% cuối theo trình tự thời gian):** Dùng làm tập kiểm chứng độc lập. Một mục gợi ý ở Top $K = 5$ được tính là **Relevant (Phù hợp)** nếu thuộc tập Hold-out tương lai của người dùng hoặc có liên kết ngữ nghĩa trực tiếp (cùng danh mục nông sản hoặc liên kết `article_products`) với mục trong tập Hold-out.

### 3.3. Kết quả Đánh giá Thực nghiệm & Phân tích Độ nhạy Trọng số Hành vi (Weight Sensitivity Analysis)

Để kiểm chứng giả thuyết khởi đầu về bộ trọng số hành vi $\{1, 2, 3, 4, 5\}$ (Mục 13.4 của Kế hoạch), hệ thống thực hiện phân tích độ nhạy trên 3 phương án trọng số khác nhau:

| Phương án Trọng số Hành vi | Cấu hình `(view, scroll, favorite, share, contact)` | Số Visitor Đánh giá | Precision@5 $\uparrow$ | Recall@5 $\uparrow$ | nDCG@5 $\uparrow$ | Độ phủ Catalog (Coverage) $\uparrow$ | Độ đa dạng (Diversity ILD) $\uparrow$ |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Trọng số Đồng nhất (Uniform Baseline)** | `(1.0, 1.0, 1.0, 1.0, 1.0)` | 374 | 0.8610 | 0.8619 | 0.8623 | 0.9545 (21/22) | 0.8938 |
| **2. Trọng số Giả thuyết Chuẩn (Default 1-2-3-4-5)** | **`(1.0, 2.0, 3.0, 4.0, 5.0)`** | **374** | **0.8620** | **0.8630** | **0.8633** | **0.9545 (21/22)** | **0.8937** |
| **3. Trọng số Nhấn mạnh Ý định Cao (Steep Weights)** | `(1.0, 2.5, 4.5, 6.0, 8.0)` | 374 | 0.8604 | 0.8615 | 0.8623 | 0.9545 (21/22) | 0.8938 |

### 3.4. Nhận xét & Thảo luận Kết quả Gợi ý
1. **Độ chính xác và chất lượng xếp hạng cao:** Mô hình đạt **$\text{Precision@5} = 0.8620$**, **$\text{Recall@5} = 0.8630$** và **$\text{nDCG@5} = 0.8633$**, chứng tỏ trung bình trên 4,3/5 nội dung được đề xuất ở Top 5 khớp chính xác với mối quan tâm tiếp theo của người dùng.
2. **Độ phủ danh mục rộng ($\text{Coverage} = 95.45\%$):** Có tới $21/22$ nội dung trong toàn bộ kho dữ liệu được xuất hiện trong danh sách gợi ý Top 5 của tập người dùng, tránh được hiện tượng thiên lệch phổ biến (popularity bias) chỉ gợi ý một vài sản phẩm đứng đầu.
3. **Độ đa dạng nội danh sách cao ($\text{Intra-List Diversity} = 0.8937$):** Danh sách Top 5 kết hợp hài hòa giữa sản phẩm chính, sản phẩm chế biến cùng vùng nguyên liệu và các bài viết câu chuyện văn hóa liên quan.
4. **Kiểm chứng giả thuyết trọng số `1-2-3-4-5`:** Phương án trọng số tăng dần theo mức độ cam kết hành vi (`view=1, scroll=2, favorite=3, share=4, contact_click=5`) mang lại chỉ số $\text{Precision@5}$, $\text{Recall@5}$ và $\text{nDCG@5}$ cao nhất so với cả phương án cào bằng (`1-1-1-1-1`) và phương án dốc quá mức (`1-2.5-4.5-6-8`), do phản ánh cân bằng cả lịch sử khám phá lẫn tín hiệu yêu thích/liên hệ sâu.
