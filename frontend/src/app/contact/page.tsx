"use client";

import React, { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/tracker";

const COOPERATIVES = [
  {
    id: 1,
    name: "HTX Cà phê Bích Thao Sơn La & Hiệp hội Cà phê Sơn La",
    region: "Xã Hua La, TP. Sơn La & Huyện Mai Sơn",
    specialties: ["Cà phê Arabica Sơn La", "Trà vỏ cà phê Cascara"],
    certification: "Chỉ dẫn địa lý Sơn La · OCOP 5 Sao Quốc gia",
    productSlug: "ca-phe-arabica-son-la",
    productId: 1,
  },
  {
    id: 2,
    name: "HTX Trà Đặc sản Tà Xùa Bắc Yên",
    region: "Bản Bẹ, Xã Tà Xùa, Huyện Bắc Yên (Độ cao 1.800m)",
    specialties: ["Chè Shan tuyết cổ thụ Tà Xùa"],
    certification: "OCOP 4 Sao · Hữu cơ Tự nhiên",
    productSlug: "che-shan-tuyet-ta-xua",
    productId: 2,
  },
  {
    id: 3,
    name: "HTX Nông nghiệp Mận hậu Ná Ka & Nông sản Sạch Mộc Châu",
    region: "Thung lũng Ná Ka, Thị trấn Nông trường Mộc Châu",
    specialties: ["Mận hậu Mộc Châu", "Mận sấy dẻo", "Hồng giòn & Hồng sấy dẻo"],
    certification: "VietGAP · OCOP 4 Sao Tỉnh Sơn La",
    productSlug: "man-hau-moc-chau",
    productId: 4,
  },
  {
    id: 4,
    name: "HTX Nông nghiệp & Du lịch Cộng đồng Ngọc Chiến",
    region: "Xã Ngọc Chiến, Huyện Mường La (Độ cao 1.600m)",
    specialties: ["Gạo nếp Tan Ngọc Chiến"],
    certification: "Nhãn hiệu chứng nhận Nếp Tan Ngọc Chiến · OCOP 4 Sao",
    productSlug: "gao-nep-tan-ngoc-chien",
    productId: 7,
  },
  {
    id: 5,
    name: "HTX Chế biến Dược liệu & Tỏi đen Yên Châu",
    region: "Huyện Yên Châu & Huyện Phù Yên, Tỉnh Sơn La",
    specialties: ["Tỏi đen một nhánh lên men 90 ngày"],
    certification: "OCOP 4 Sao · ISO 22000",
    productSlug: "toi-den-son-la",
    productId: 8,
  },
];

export default function ContactPage() {
  const [selectedCoop, setSelectedCoop] = useState(COOPERATIVES[0]);
  const [fullName, setFullName] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent("contact_click", {
      content_type: "product",
      content_id: selectedCoop.productId,
      properties: {
        cooperative: selectedCoop.name,
        source: "contact_directory_page",
      },
    });
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-surface rounded-2xl p-8 sm:p-10 mb-10">
        <p className="text-[14px] text-accent font-semibold">
          Danh bạ Hợp tác xã & Kết nối Giao thương
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink mt-1">
          Liên hệ Hợp tác xã
        </h1>
        <p className="text-[18px] text-ink mt-2 max-w-[58ch] leading-relaxed">
          Kết nối trực tiếp với các Hợp tác xã tiêu biểu tại 5 vùng sinh thái
          Sơn La để tìm hiểu mùa vụ thu hoạch, chứng nhận chất lượng OCOP hoặc
          hợp tác phân phối đặc sản chính gốc.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-3xl font-bold text-ink mb-2">
            Năm Hợp tác xã chủ lực
          </h2>
          {COOPERATIVES.map((coop) => {
            const isSelected = selectedCoop.id === coop.id;
            return (
              <div
                key={coop.id}
                onClick={() => {
                  setSelectedCoop(coop);
                  setSubmitted(false);
                }}
                className={`cursor-pointer p-6 rounded-2xl transition-colors ${
                  isSelected ? "bg-cream-3" : "bg-surface hover:bg-cream-3"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 text-[14px]">
                  <span className="text-accent font-semibold">
                    Hợp tác xã điển hình
                  </span>
                  <span className="text-muted">{coop.certification}</span>
                </div>

                <p className="font-display text-2xl font-bold text-ink mt-1.5">
                  {coop.name}
                </p>

                <p className="text-[15px] text-muted mt-1">{coop.region}</p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {coop.specialties.map((sp) => (
                      <span
                        key={sp}
                        className="px-3 py-1 rounded-lg bg-bg text-ink text-[14px]"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                  <Link
                    href={`/products/${coop.productSlug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[14px] font-semibold text-accent hover:underline"
                  >
                    Xem đặc sản →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-5 bg-surface rounded-2xl p-6 sm:p-8">
          <p className="text-[14px] font-semibold text-accent mb-1">
            Gửi yêu cầu kết nối (Ghi nhận contact_click)
          </p>
          <h2 className="font-display text-3xl font-bold text-ink mb-4">
            Đơn vị sản xuất
          </h2>

          <div className="p-4 rounded-xl bg-bg text-[14px] mb-5">
            <span className="text-muted block">Đang chọn kết nối:</span>
            <strong className="text-accent text-[16px]">{selectedCoop.name}</strong>
          </div>

          {submitted ? (
            <div className="py-8 space-y-3">
              <h3 className="font-display text-2xl font-bold text-ink">
                Đã ghi nhận yêu cầu
              </h3>
              <p className="text-[16px] text-ink leading-relaxed">
                Sự kiện <code>contact_click</code> đã được lưu vào CSDL và cập
                nhật ngay lập tức điểm quan tâm sản phẩm cũng như đặc trưng{" "}
                <code>C (total_contact_clicks)</code> của bạn.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="px-5 py-2.5 rounded-lg bg-accent text-accentInk text-[15px] font-semibold"
              >
                Gửi yêu cầu khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-ink mb-1">
                  Họ và tên / Tổ chức *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ tên của bạn..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-ink mb-1">
                  Số điện thoại / Email *
                </label>
                <input
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="09xx xxx xxx hoặc email..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-ink mb-1">
                  Nội dung trao đổi
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Nhu cầu tìm hiểu mùa vụ, đặt mua làm quà biếu hoặc hợp tác phân phối..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-accent text-accentInk text-[16px] font-semibold transition-colors"
              >
                Gửi yêu cầu kết nối HTX
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
