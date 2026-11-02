"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchRecommendations } from "@/lib/api";
import { RecommendationsResponse, RecommendationCandidate } from "@/types";
import { trackEvent, getVisitorId } from "@/lib/tracker";

interface RecommendationSectionProps {
  title?: string;
  subtitle?: string;
  currentContentType?: "product" | "article";
  currentContentId?: number;
  targetType?: "product" | "article";
  limit?: number;
}

const STRATEGY_BADGES: Record<string, { label: string; desc: string }> = {
  content_based: {
    label: "Gợi ý TF-IDF + Cosine",
    desc: "Cá nhân hóa từ hồ sơ vector hành vi có trọng số (Xem:1 · Cuộn:2 · Yêu thích:3 · Chia sẻ:4 · Liên hệ:5)",
  },
  cold_start_related: {
    label: "Tương đồng ngữ cảnh TF-IDF",
    desc: "Đề xuất dựa trên độ tương đồng ngữ nghĩa trực tiếp với nội dung bạn đang xem",
  },
  cold_start_popular: {
    label: "Đặc sản tiêu biểu Sơn La",
    desc: "Khách truy cập mới chưa có lịch sử tương tác – ưu tiên nông sản được quan tâm cao nhất",
  },
};

export default function RecommendationSection({
  title = "Đề xuất cho bạn",
  subtitle = "Hệ thống gợi ý nội dung phân tích ngữ nghĩa tiếng Việt TF-IDF và lịch sử tương tác của bạn.",
  currentContentType,
  currentContentId,
  targetType,
  limit = 5,
}: RecommendationSectionProps) {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchRecommendations({
        visitor_id: getVisitorId(),
        current_content_type: currentContentType,
        current_content_id: currentContentId,
        target_type: targetType,
        limit,
      });
      setData(res);
      trackEvent("recommendation_view", {
        content_type: currentContentType || "page",
        content_id: currentContentId,
        properties: {
          strategy: res.strategy,
          model_version: res.model_version,
          count: res.count,
        },
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentContentType, currentContentId, targetType, limit]);

  useEffect(() => {
    loadRecommendations();

    const handlePersonaChange = () => {
      loadRecommendations();
    };
    window.addEventListener("agri-persona-change", handlePersonaChange);
    return () => {
      window.removeEventListener("agri-persona-change", handlePersonaChange);
    };
  }, [loadRecommendations]);

  const handleItemClick = (item: RecommendationCandidate) => {
    trackEvent("recommendation_click", {
      content_type: item.content_type,
      content_id: item.content_id,
      properties: {
        rank: item.rank,
        score: item.score,
        strategy: data?.strategy,
        title: item.title,
      },
    });
  };

  if (loading && !data) {
    return (
      <section className="py-10">
        <div className="bg-surface rounded-2xl p-8">
          <p className="text-[16px] text-muted">Đang tính toán gợi ý TF-IDF...</p>
        </div>
      </section>
    );
  }

  if (!data || !data.items || data.items.length === 0) return null;

  const badge =
    STRATEGY_BADGES[data.strategy] || STRATEGY_BADGES.content_based;

  return (
    <section className="py-10" data-rise="">
      <div className="bg-surface rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-[32px] font-bold text-ink">
              {title}
            </h2>
            <p className="text-[16px] text-ink mt-2 max-w-[58ch]">{subtitle}</p>
            <p className="text-[16px] text-muted mt-1 max-w-[60ch]">
              {badge.label}: {badge.desc}
            </p>
          </div>

          <button
            type="button"
            onClick={loadRecommendations}
            className="self-start lg:self-end px-4 py-2.5 rounded-lg bg-bg text-ink text-[16px] font-medium hover:text-accent transition-colors"
          >
            Làm mới gợi ý
          </button>
        </div>

        {/* Two-ended list rows per 'list-two-ended-rows' */}
        <div className="space-y-2 mt-6">
          {data.items.map((item) => {
            const href =
              item.content_type === "product"
                ? `/products/${item.slug}`
                : `/articles/${item.slug}`;
            const scorePct = Math.round(item.score * 100);

            return (
              <Link
                key={`${item.content_type}_${item.content_id}`}
                href={href}
                onClick={() => handleItemClick(item)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 px-4 rounded-xl bg-bg hover:bg-cream-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <span className="text-[16px] font-semibold text-ink group-hover:text-accent transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[16px] text-muted ml-2">
                      · {item.origin || item.category_name} · {item.reason}
                    </span>
                  </div>
                </div>

                <div className="text-[16px] text-accent nums shrink-0 sm:text-right">
                  Hạng {item.rank} · Cosine {item.score.toFixed(2)} ({scorePct}%)
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}


