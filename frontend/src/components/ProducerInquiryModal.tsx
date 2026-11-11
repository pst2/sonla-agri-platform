"use client";

import React, { useState } from "react";
import { ProductItem } from "@/types";
import { trackEvent } from "@/lib/tracker";

interface ProducerInquiryModalProps {
  product: ProductItem;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProducerInquiryModal({
  product,
  isOpen,
  onClose,
}: ProducerInquiryModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    `Tôi quan tâm đến sản phẩm ${product.product_name} (${product.origin}). Xin tư vấn thông tin mùa vụ và kết nối hợp tác xã.`
  );
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent("contact_click", {
      content_type: "product",
      content_id: product.product_id,
      properties: {
        action: "inquiry_submitted",
        producer: product.producer,
        product_name: product.product_name,
      },
    });
    setSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/85"
    >
      <div className="bg-surface rounded-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-cream-3 text-ink px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[14px] text-accent font-medium">
              Kết nối trực tiếp vùng nguyên liệu
            </p>
            <h3 className="font-display text-2xl font-bold mt-0.5">
              Liên hệ Hợp tác xã
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-bg text-ink text-[14px] hover:text-accent transition-colors"
          >
            Đóng
          </button>
        </div>

        <div className="p-6">
          <div className="bg-bg rounded-xl p-4 mb-5 space-y-2 text-[14px]">
            <div>
              <span className="text-muted">Đơn vị sản xuất: </span>
              <strong className="text-ink">
                {product.producer || "Hợp tác xã Nông sản Đặc sản Sơn La"}
              </strong>
            </div>
            <div>
              <span className="text-muted">Vùng nguyên liệu: </span>
              <span className="text-ink font-medium">{product.origin}</span>
            </div>
            <div>
              <span className="text-muted">Chứng nhận: </span>
              <span className="text-accent font-medium">
                {product.certification || "OCOP Sơn La · VietGAP"}
              </span>
            </div>
          </div>

          {submitted ? (
            <div className="py-6 space-y-3">
              <h4 className="font-display text-2xl font-bold text-ink">
                Đã gửi yêu cầu kết nối
              </h4>
              <p className="text-[16px] text-ink">
                Hệ thống đã ghi nhận sự kiện{" "}
                <code className="px-1.5 py-0.5 bg-bg rounded text-accent">
                  contact_click (trọng số = 5)
                </code>{" "}
                vào hồ sơ gợi ý ML của bạn và chuyển thông tin liên hệ tới{" "}
                <strong>{product.producer}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="mt-4 px-5 py-2.5 rounded-lg bg-accent text-accentInk text-[15px] font-semibold transition-colors"
              >
                Hoàn tất
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[14px] font-medium text-ink mb-1">
                  Họ và tên / Đơn vị thu mua *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A / Công ty Thực phẩm..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-ink mb-1">
                  Số điện thoại hoặc Email liên hệ *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912 xxx xxx hoặc email@domain.vn"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[14px] font-medium text-ink mb-1">
                  Nội dung quan tâm
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="text-[14px] text-muted">
                  Sự kiện: <code>contact_click</code>
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-accent text-accentInk text-[15px] font-semibold transition-colors"
                >
                  Gửi yêu cầu kết nối
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
