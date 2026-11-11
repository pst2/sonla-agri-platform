import React from "react";
import { getProductFacts, PROVINCE_CONTEXT } from "@/lib/productFacts";

export default function ProductFactsPanel({ slug }: { slug: string }) {
  const facts = getProductFacts(slug);
  if (!facts) return null;

  return (
    <section
      data-pd-facts=""
      aria-labelledby="product-facts-title"
      className="bg-surface rounded-2xl p-6 sm:p-10 mt-10 space-y-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        <div data-pd-fig="" className="lg:col-span-4 space-y-3 will-change-transform">
          <h2
            id="product-facts-title"
            className="font-display text-[32px] font-bold text-ink leading-[1.1]"
          >
            Số liệu vùng trồng
          </h2>
          <p className="text-[16px] text-ink leading-[1.7] max-w-[40ch]">
            Phạm vi: {facts.scope}.
          </p>
        </div>

        <dl className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-8">
          {facts.figures.map((f) => (
            <div key={f.label} data-pd-fig="" className="space-y-1.5 will-change-transform">
              <dt className="sr-only">{f.label}</dt>
              <dd className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-display nums text-[32px] font-bold text-accent leading-none">
                  {f.value}
                </span>
                <span className="text-[16px] text-ink font-medium">{f.unit}</span>
              </dd>
              <p className="text-[16px] text-ink leading-[1.55]" aria-hidden="true">
                {f.label}
              </p>
            </div>
          ))}
        </dl>
      </div>

      <dl className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-4">
        {facts.rows.map((r) => (
          <div
            key={r.label}
            data-pd-row=""
            className="lg:col-span-6 grid grid-cols-[minmax(0,9rem)_1fr] gap-4 py-2 will-change-transform"
          >
            <dt className="text-[16px] text-accent font-semibold">{r.label}</dt>
            <dd className="text-[16px] text-ink nums leading-[1.6]">{r.value}</dd>
          </div>
        ))}
      </dl>

      <div className="bg-bg rounded-xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-5">
        {PROVINCE_CONTEXT.map((c) => (
          <p
            key={c.label}
            data-pd-prov=""
            className="text-[16px] text-ink leading-[1.5] will-change-transform"
          >
            <span className="font-display nums text-[24px] font-bold text-accent mr-2">
              {c.value}
            </span>
            {c.unit}, {c.label.toLowerCase()}
          </p>
        ))}
      </div>

      <p className="text-[16px] text-muted leading-[1.7] max-w-[60ch]">
        {facts.note ? `${facts.note} ` : ""}
        Nguồn tổng hợp: {facts.sources.join(" · ")}. Các khoảng giá trị phản ánh
        sự khác biệt giữa các báo cáo và thời điểm công bố.
      </p>
    </section>
  );
}
