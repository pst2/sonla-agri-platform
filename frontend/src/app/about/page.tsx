import React from "react";
import Link from "next/link";

const FEATURE_TABLE = [
  { sym: "S", col: "total_sessions", desc: "Tổng số phiên truy cập của người dùng" },
  { sym: "P", col: "total_product_views", desc: "Tổng số lượt xem trang chi tiết sản phẩm" },
  { sym: "A", col: "total_article_views", desc: "Tổng số lượt đọc bài viết câu chuyện và văn hóa" },
  { sym: "T", col: "avg_session_duration", desc: "Thời lượng tương tác trung bình mỗi phiên (giây)" },
  { sym: "Q", col: "total_searches", desc: "Tổng số lần thực hiện truy vấn tìm kiếm" },
  { sym: "F", col: "total_favorites", desc: "Tổng số sản phẩm và bài viết đã lưu yêu thích" },
  { sym: "C", col: "total_contact_clicks", desc: "Tổng số lần nhấn liên hệ Hợp tác xã / Nhà sản xuất" },
  { sym: "R", col: "return_visits", desc: "Số lần quay lại nền tảng sau phiên đầu tiên (S - 1)" },
  { sym: "U", col: "unique_products_viewed", desc: "Số lượng sản phẩm khác nhau đã khám phá (0..8)" },
];

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <div className="bg-surface rounded-2xl p-8 sm:p-12">
        <p className="text-[14px] text-accent font-semibold mb-2">
          Tổng quan Đồ án Nghiên cứu & Kiến trúc Hệ thống
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink leading-tight">
          Phương pháp nghiên cứu
        </h1>
        <p className="text-[18px] text-ink mt-4 max-w-[60ch] leading-relaxed">
          Dự án giải quyết bài toán phân mảnh thông tin của nông sản bản địa
          bằng cách kết hợp một website truyền thông giàu chiều sâu văn hóa với
          hệ thống thu thập dữ liệu sự kiện (Event-Based Tracking), phân khúc
          hành vi người dùng bằng học máy không giám sát (K-Means Clustering) và
          gợi ý nội dung cá nhân hóa (Content-Based Filtering với TF-IDF tiếng
          Việt).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface rounded-2xl p-7 space-y-3">
          <h2 className="font-display text-2xl font-bold text-ink">
            Thu thập 10 sự kiện
          </h2>
          <p className="text-[16px] text-ink leading-relaxed">
            Ghi nhận ẩn danh theo thời gian thực qua{" "}
            <code className="text-accent">visitor_id</code> và{" "}
            <code className="text-accent">session_id</code> với 10 sự kiện chuẩn:{" "}
            <code>page_view</code>, <code>product_view</code>,{" "}
            <code>article_view</code>, <code>scroll</code> (≥60%),{" "}
            <code>search</code>, <code>favorite</code>, <code>share</code>,{" "}
            <code>contact_click</code>, <code>recommendation_view</code>,{" "}
            <code>recommendation_click</code>.
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-7 space-y-3">
          <h2 className="font-display text-2xl font-bold text-ink">
            Phân cụm K-Means
          </h2>
          <p className="text-[16px] text-ink leading-relaxed">
            Biến đổi chuỗi sự kiện thành vector 9 đặc trưng định lượng, xử lý
            ngoại lai ở phân vị 99%, chuẩn hóa Z-score (StandardScaler), quét{" "}
            <code>K = 2..8</code> và lựa chọn số cụm tối ưu dựa trên Silhouette
            Score, Davies-Bouldin Index và độ ổn định cụm (ARI).
          </p>
        </div>

        <div className="bg-surface rounded-2xl p-7 space-y-3">
          <h2 className="font-display text-2xl font-bold text-ink">
            Gợi ý TF-IDF Tiếng Việt
          </h2>
          <p className="text-[16px] text-ink leading-relaxed">
            Tách từ ghép tiếng Việt, loại bỏ hư từ, xây dựng ma trận TF-IDF
            (unigram + bigram) và hồ sơ người dùng có trọng số hành vi
            (1–2–3–4–5) để tính Cosine Similarity kèm chiến lược Cold-Start.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[14px] text-accent font-semibold">
              Biểu diễn Toán học Người dùng (Mục 11 Kế hoạch)
            </p>
            <h2 className="font-display text-3xl font-extrabold text-ink mt-1">
              Vector 9 đặc trưng X
            </h2>
          </div>
          <code className="px-3.5 py-1.5 rounded-lg bg-bg text-[14px] text-ink">
            StandardScaler + KMeans(k=2..8)
          </code>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[15px]">
            <thead>
              <tr className="text-[14px] text-muted">
                <th className="py-3 px-4">Ký hiệu</th>
                <th className="py-3 px-4">Trường dữ liệu (user_features)</th>
                <th className="py-3 px-4">Ý nghĩa hành vi & truyền thông</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_TABLE.map((item) => (
                <tr key={item.sym}>
                  <td className="py-3 px-4 font-bold text-accent">
                    <code>{item.sym}</code>
                  </td>
                  <td className="py-3 px-4 text-ink">
                    <code>{item.col}</code>
                  </td>
                  <td className="py-3 px-4 text-ink">{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-surface rounded-2xl p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 space-y-4">
          <p className="text-[14px] text-accent font-semibold">
            Tính tái lập thực nghiệm & tách biệt dữ liệu thực / mô phỏng
          </p>
          <h2 className="font-display text-3xl font-extrabold text-ink">
            Kiểm chứng mô hình
          </h2>
          <ul className="space-y-2 text-[16px] text-ink">
            <li>
              Tách biệt hoàn toàn dữ liệu thực tế (<code>is_simulated=false</code>)
              và dữ liệu mô phỏng (<code>is_simulated=true</code>, cố định{" "}
              <code>random_seed=42</code>).
            </li>
            <li>
              Đánh giá hệ thống gợi ý trên tập kiểm thử Hold-out (75% Train /
              25% Test) với các chỉ số <code>Precision@5</code>,{" "}
              <code>Recall@5</code>, <code>nDCG@5</code>, <code>Coverage</code>,{" "}
              <code>Diversity</code>.
            </li>
            <li>
              Phân tích độ nhạy trọng số hành vi (Sensitivity Analysis) giữa 3
              bộ trọng số: Đồng đều (1-1-1-1-1), Giả thuyết chuẩn (1-2-3-4-5) và
              Nhấn mạnh ý định cao (1-2.5-4.5-6-8).
            </li>
          </ul>
        </div>
        <div className="lg:col-span-4 flex flex-col gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-6 py-3.5 rounded-lg bg-accent text-accentInk text-[15px] font-semibold transition-colors"
          >
            Khám phá Bảng điều khiển ML
          </Link>
        </div>
      </div>
    </div>
  );
}
