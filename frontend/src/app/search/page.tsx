"use client";

import React, { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { fetchUnifiedSearch } from "@/lib/api";
import { ProductItem, ArticleItem } from "@/types";
import ProductCard from "@/components/ProductCard";
import ArticleCard from "@/components/ArticleCard";
import { trackEvent } from "@/lib/tracker";

const SUGGESTED_QUERIES = [
  "cà phê arabica",
  "chè shan tuyết",
  "cascara",
  "mận hậu mộc châu",
  "hồng sấy dẻo",
  "nếp tan ngọc chiến",
  "tỏi đen yên châu",
  "ocop 5 sao",
];

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") || "";

  const [query, setQuery] = useState<string>(initialQ);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const executeSearch = useCallback(async (qStr: string, logEvent = false) => {
    setLoading(true);
    try {
      const res = await fetchUnifiedSearch(qStr);
      setProducts(res.products || []);
      setArticles(res.articles || []);
      if (logEvent && qStr.trim()) {
        trackEvent("search", {
          content_type: "page",
          properties: {
            query: qStr.trim(),
            product_hits: res.product_count,
            article_hits: res.article_count,
          },
        });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setQuery(initialQ);
    executeSearch(initialQ, Boolean(initialQ));
  }, [initialQ, executeSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query, true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-surface rounded-2xl p-8 sm:p-10 mb-10">
        <p className="text-[14px] text-accent font-semibold">
          Tìm kiếm hợp nhất sản phẩm & tri thức
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink mt-1 mb-6">
          Tra cứu nông sản
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên đặc sản, vùng nguyên liệu, chứng nhận hoặc từ khóa..."
            className="flex-1 min-w-[240px] px-4 py-3 rounded-lg bg-bg border border-cream-3 text-[16px] text-ink focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-accent text-accentInk text-[16px] font-semibold transition-colors"
          >
            Tìm kiếm
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[14px] text-muted mr-1">Từ khóa phổ biến:</span>
          {SUGGESTED_QUERIES.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => {
                setQuery(sq);
                executeSearch(sq, true);
              }}
              className="px-3 py-1 rounded-lg text-[14px] bg-bg text-ink hover:text-accent transition-colors"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-8 w-64 bg-surface rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-80 bg-surface rounded-2xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          <section>
            <h2 className="font-display text-3xl font-bold text-ink mb-5">
              Sản phẩm nông sản ({products.length})
            </h2>
            {products.length === 0 ? (
              <p className="text-[16px] text-muted bg-surface p-6 rounded-2xl">
                Không tìm thấy sản phẩm nào khớp với từ khóa &ldquo;{query}
                &rdquo;.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((p) => (
                  <ProductCard key={p.product_id} product={p} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-display text-3xl font-bold text-ink mb-5">
              Bài viết chuyên đề ({articles.length})
            </h2>
            {articles.length === 0 ? (
              <p className="text-[16px] text-muted bg-surface p-6 rounded-2xl">
                Không tìm thấy bài viết nào khớp với từ khóa &ldquo;{query}
                &rdquo;.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {articles.map((a) => (
                  <ArticleCard key={a.article_id} article={a} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 text-center text-[16px] text-muted">
          Đang tải trang tìm kiếm...
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
