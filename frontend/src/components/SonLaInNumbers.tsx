"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Số liệu tổng hợp từ các nguồn công khai (cổng thông tin tỉnh Sơn La, Báo Sơn La,
 * VOV, Báo Nhân Dân, VnEconomy, Dân Việt, Hà Nội Mới, Tạp chí Kinh tế & Dự báo…).
 * Các khoảng giá trị (ví dụ 3.200–3.500 ha) phản ánh sự khác biệt giữa các báo cáo.
 */
const HEADLINE_FIGURES = [
  { value: "14.109,83", unit: "km²", label: "Diện tích tự nhiên, tỉnh lớn thứ 3 cả nước" },
  { value: "1,3–1,4", unit: "triệu người", label: "Dân số, hơn 12 dân tộc cùng canh tác" },
  { value: "83.000+", unit: "ha", label: "Cây ăn quả và sơn tra (2024), lớn nhất miền Bắc" },
  { value: "190", unit: "triệu USD", label: "Kim ngạch nông sản xuất khẩu 2024 (+6,9%)" },
  { value: "175.800", unit: "tấn", label: "Nông sản tham gia xuất khẩu 2024 (+1,6%)" },
  { value: "200+", unit: "sản phẩm", label: "OCOP đạt từ 3 sao trở lên" },
];

const CROPS = [
  {
    name: "Cà phê Arabica",
    area: "23.312 → 33.628 ha",
    output: "29.838 → 37.724 tấn",
    note: "2024 → 2025 (ước). Xuất khẩu 2025: 112,38 triệu USD, 27.800 tấn nhân.",
  },
  {
    name: "Mận hậu",
    area: "Mộc Châu 3.200–3.500 ha · Toàn tỉnh 12.300+ ha",
    output: "Gần 90.000 tấn/vụ",
    note: "Mộc Châu là thủ phủ mận hậu lớn nhất cả nước.",
  },
  {
    name: "Chè (Shan tuyết, Ô long)",
    area: "Toàn tỉnh 5.500–5.900 ha · Mộc Châu 1.800–1.900 ha",
    output: "60.000+ tấn búp tươi · Mộc Châu 24.300+ tấn",
    note: "Kim ngạch xuất khẩu chè 2024 gần 22 triệu USD.",
  },
  {
    name: "Xoài",
    area: "16.000+ ha",
    output: "Khoảng 97.000 tấn/năm",
    note: "Xoài tròn Yên Châu và xoài Sơn La đã được bảo hộ nhãn hiệu.",
  },
  {
    name: "Nhãn",
    area: "Tập trung Sông Mã, Mai Sơn",
    output: "70.000 tấn trong 8 tháng đầu 2024",
    note: "Một phần chế biến thành long nhãn xuất khẩu.",
  },
];

/** Cơ cấu kim ngạch xuất khẩu nông sản 2024 (triệu USD). "Khác" = 190 − 90 − 36 − 22. */
const EXPORT_MIX = [
  { label: "Cà phê", usd: 90, note: "hơn 90" },
  { label: "Tinh bột sắn", usd: 36, note: "hơn 36" },
  { label: "Chè", usd: 22, note: "gần 22" },
  { label: "Trái cây và khác", usd: 42, note: "ước tính còn lại" },
];

const COFFEE_TREND = [
  { label: "Diện tích", a: "23.312 ha", b: "33.628 ha", pct: 44.3, ratio: 23312 / 33628 },
  { label: "Sản lượng nhân", a: "29.838 tấn", b: "37.724 tấn", pct: 26.4, ratio: 29838 / 37724 },
  { label: "Giá trị xuất khẩu", a: "88,77 triệu USD", b: "112,38 triệu USD", pct: 26.6, ratio: 88.77 / 112.38 },
];

const SOURCES = [
  "sonla.gov.vn",
  "baosonla.vn",
  "vov.vn",
  "nhandan.vn",
  "vneconomy.vn",
  "danviet.vn",
  "hanoimoi.vn",
  "thanhtra.com.vn",
  "vusta.vn",
  "vnanet.vn",
];

export default function SonLaInNumbers() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap.from("[data-num-head] > *", {
        y: 20,
        opacity: 0.2,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.08,
        scrollTrigger: { trigger: "[data-num-head]", start: "top 85%", once: true },
      });
      gsap.from("[data-num-fig]", {
        y: 16,
        opacity: 0.2,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: "[data-num-figs]", start: "top 85%", once: true },
      });
      gsap.from("[data-num-bar]", {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.09,
        scrollTrigger: { trigger: "[data-num-bars]", start: "top 82%", once: true },
      });
      gsap.from("[data-num-row]", {
        y: 14,
        opacity: 0.2,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.07,
        scrollTrigger: { trigger: "[data-num-table]", start: "top 85%", once: true },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="so-lieu"
      aria-labelledby="so-lieu-title"
      className="py-14 lg:py-20 space-y-14"
    >
      {/* Heading + headline figures */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <div data-num-head="" className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
          <h2
            id="so-lieu-title"
            className="font-display text-[32px] lg:text-[56px] font-bold text-ink leading-[1.05]"
          >
            Sơn La bằng những con số
          </h2>
          <p className="text-[18px] text-ink leading-[1.75] max-w-[44ch]">
            Từ cao nguyên đá vôi 1.050 m ở Mộc Châu đến những sườn Arabica
            phía Mai Sơn, nông nghiệp Sơn La được đo bằng hàng chục nghìn
            héc-ta và hàng trăm nghìn tấn quả mỗi năm. Số liệu dưới đây được
            tổng hợp từ báo cáo chính thức và báo chí kinh tế.
          </p>
        </div>

        <dl data-num-figs="" className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-9">
          {HEADLINE_FIGURES.map((f) => (
            <div key={f.label} data-num-fig="" className="space-y-1.5">
              <dt className="sr-only">{f.label}</dt>
              <dd className="flex items-baseline gap-2">
                <span className="font-display nums text-[56px] font-bold text-accent leading-none">
                  {f.value}
                </span>
                <span className="text-[16px] text-ink font-medium">{f.unit}</span>
              </dd>
              <p className="text-[16px] text-ink leading-[1.55] max-w-[34ch]" aria-hidden="true">
                {f.label}
              </p>
            </div>
          ))}
        </dl>
      </div>

      {/* Crop ledger */}
      <div data-num-table="" className="bg-surface rounded-[20px] p-6 sm:p-10 space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="font-display text-[24px] lg:text-[32px] font-bold text-ink">
            Năm cây chủ lực: diện tích và sản lượng
          </h3>
          <span className="text-[14px] text-muted">Số liệu 2024–2025, làm tròn</span>
        </div>
        <div role="table" aria-label="Diện tích và sản lượng năm cây chủ lực">
          <div role="row" className="hidden lg:grid grid-cols-12 gap-6 pb-3 text-[14px] text-accent font-semibold">
            <span role="columnheader" className="col-span-3">Cây trồng</span>
            <span role="columnheader" className="col-span-3">Diện tích</span>
            <span role="columnheader" className="col-span-3">Sản lượng</span>
            <span role="columnheader" className="col-span-3">Ghi chú</span>
          </div>
          <div className="space-y-2">
            {CROPS.map((c) => (
              <div key={c.name} role="row" data-num-row="" className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-1.5 py-5">
                <p role="cell" className="lg:col-span-3 font-display text-[18px] font-semibold text-ink">{c.name}</p>
                <p role="cell" className="lg:col-span-3 text-[16px] text-ink nums leading-[1.6]"><span className="lg:hidden text-accent">Diện tích: </span>{c.area}</p>
                <p role="cell" className="lg:col-span-3 text-[16px] text-ink nums leading-[1.6]"><span className="lg:hidden text-accent">Sản lượng: </span>{c.output}</p>
                <p role="cell" className="lg:col-span-3 text-[16px] text-ink leading-[1.6]">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export mix + coffee trend */}
      <div data-num-bars="" className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        <div className="lg:col-span-6 space-y-6">
          <h3 className="font-display text-[24px] lg:text-[32px] font-bold text-ink">
            Cơ cấu xuất khẩu 2024: 190 triệu USD
          </h3>
          <div className="space-y-5">
            {EXPORT_MIX.map((e) => (
              <div key={e.label} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3 text-[16px]">
                  <span className="text-ink font-medium">{e.label}</span>
                  <span className="nums text-ink">
                    {e.note} triệu USD
                  </span>
                </div>
                <div className="h-3 bg-surface rounded-full overflow-hidden">
                  <div
                    data-num-bar=""
                    className="h-full bg-accent rounded-full will-change-transform"
                    style={{ width: `${(e.usd / 90) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-[14px] text-muted leading-[1.6] max-w-[60ch]">
            Mục “Trái cây và khác” được tính phần còn lại: 190 − 90 − 36 − 22 ≈ 42 triệu USD.
          </p>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <h3 className="font-display text-[24px] lg:text-[32px] font-bold text-ink">
            Cà phê Arabica: tăng tốc từ 2024 sang 2025
          </h3>
          <div className="space-y-6">
            {COFFEE_TREND.map((t) => (
              <div key={t.label} className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[16px] text-ink font-medium">{t.label}</span>
                  <span className="font-display nums text-[24px] font-bold text-accent">
                    +{t.pct.toLocaleString("vi-VN", { minimumFractionDigits: 1 })}%
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-2.5 bg-surface rounded-full overflow-hidden">
                    <div
                      data-num-bar=""
                      className="h-full bg-muted rounded-full will-change-transform"
                      style={{ width: `${t.ratio * 100}%` }}
                    />
                  </div>
                  <div className="h-2.5 bg-surface rounded-full overflow-hidden">
                    <div data-num-bar="" className="h-full w-full bg-accent rounded-full will-change-transform" />
                  </div>
                </div>
                <div className="flex justify-between gap-3 text-[14px] text-ink nums">
                  <span>2024: {t.a}</span>
                  <span>2025: {t.b}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[14px] text-muted leading-[1.7] max-w-[60ch]">
        Nguồn tổng hợp: {SOURCES.join(" · ")}. Sơn La hiện đứng đầu cả nước về
        diện tích và sản lượng cà phê Arabica. Các khoảng giá trị phản ánh sự
        khác biệt giữa báo cáo theo niên vụ, năm dương lịch và thời điểm công bố.
      </p>
    </section>
  );
}


