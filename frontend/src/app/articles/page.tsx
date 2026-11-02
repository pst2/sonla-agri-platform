"use client";

import React, { useEffect, useState, useCallback } from "react";
import { fetchArticles } from "@/lib/api";
import { ArticleItem } from "@/types";
import ArticleCard from "@/components/ArticleCard";
import { trackEvent } from "@/lib/tracker";

const CONTENT_TYPES = [
  { code: "", label: "Tất cả chuyên đề" },
  { code: "origin_story", label: "Câu chuyện nguồn gốc" },
  { code: "production_process", label: "Quy trình chế biến" },
  { code: "cultural_heritage", label: "Văn hóa bản địa" },
  { code: "guide", label: "Cẩm nang thưởng thức" },
  { code: "innovation", label: "Đổi mới sáng tạo" },
  { code: "research", label: "Khoa học dữ liệu" },
];

export default function ArticlesLibraryPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [contentType, setContentType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchArticles({
        content_type: contentType || undefined,
        q: searchQuery.trim() || undefined,
        limit: 50,
      });
      setArticles(res.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [contentType, searchQuery]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackEvent("search", {
        content_type: "page",
        properties: {
          query: searchQuery.trim(),
          scope: "articles_library",
          content_type: contentType,
        },
      });
    }
    loadArticles();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-surface rounded-2xl p-8 sm:p-10 mb-8">
        <p className="text-[14px] text-accent font-semibold mb-2">
          Thư viện Tri thức & Văn hóa Nông nghiệp
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink">
          Câu chuyện vùng trồng
        </h1>
        <p className="text-[18px] text-ink mt-2 max-w-[58ch] leading-relaxed">
          Khám phá chiều sâu lịch sử, kỹ thuật canh tác bền vững, quy trình chế
          biến đặc sản và bản sắc văn hóa ẩm thực của đồng bào các dân tộc Thái,
          Mông tại Sơn La.
        </p>
      </div>

      <div className="bg-surface rounded-2xl p-6 mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài viết về cà phê, chè Shan tuyết, văn hóa Thái..."
            className="flex-1 min-w-[240px] px-4 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-accent text-accentInk text-[15px] font-semibold transition-colors"
          >
            Tìm bài viết
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {CONTENT_TYPES.map((ct) => (
              <button
                key={ct.code}
                type="button"
                onClick={() => setContentType(ct.code)}
                className={`px-3.5 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                  contentType === ct.code
                    ? "bg-accent text-accentInk"
                    : "bg-bg text-ink hover:text-accent"
                }`}
              >
                {ct.label}
              </button>
            ))}
          </div>

          {(contentType || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setContentType("");
                setSearchQuery("");
              }}
              className="text-[14px] text-accent hover:underline font-medium"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-surface" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center">
          <p className="font-display text-2xl text-ink">
            Không tìm thấy bài viết nào phù hợp.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.article_id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
