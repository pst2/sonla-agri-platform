"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { fetchVisitorFavorites } from "@/lib/api";
import { ProductItem, ArticleItem } from "@/types";
import ProductCard from "@/components/ProductCard";
import ArticleCard from "@/components/ArticleCard";
import RecommendationSection from "@/components/RecommendationSection";
import { getVisitorId } from "@/lib/tracker";

export default function FavoritesPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [visitorId, setVisitorId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    const vid = getVisitorId();
    setVisitorId(vid);
    try {
      const res = await fetchVisitorFavorites(vid);
      setProducts(res.products || []);
      setArticles(res.articles || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
    const handlePersonaChange = () => loadFavorites();
    window.addEventListener("agri-persona-change", handlePersonaChange);
    return () =>
      window.removeEventListener("agri-persona-change", handlePersonaChange);
  }, [loadFavorites]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-surface rounded-2xl p-8 sm:p-10 mb-10">
        <p className="text-[14px] text-accent font-semibold mb-2">
          Bộ sưu tập cá nhân (<code>{visitorId}</code>)
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink">
          Danh sách đã lưu
        </h1>
        <p className="text-[18px] text-ink mt-2 max-w-[58ch] leading-relaxed">
          Mỗi mục bạn lưu yêu thích được gán trọng số hành vi{" "}
          <code className="px-1.5 py-0.5 rounded bg-bg text-accent">
            w = 3.0
          </code>{" "}
          để cập nhật vector hồ sơ người dùng trong hệ thống gợi ý Content-Based
          TF-IDF và đặc trưng{" "}
          <code className="px-1.5 py-0.5 rounded bg-bg text-accent">
            F (total_favorites)
          </code>{" "}
          của mô hình K-Means.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-surface" />
          ))}
        </div>
      ) : products.length === 0 && articles.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center space-y-4">
          <h2 className="font-display text-3xl font-bold text-ink">
            Chưa có mục đã lưu
          </h2>
          <p className="text-[16px] text-ink max-w-md mx-auto">
            Hãy nhấn lưu trên các sản phẩm đặc sản Sơn La hoặc chuyển sang tài
            khoản mẫu <code className="text-accent">demo_visitor_sonla</code> để
            xem dữ liệu mẫu.
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-accent text-accentInk text-[15px] font-semibold"
            >
              Khám phá 8 đặc sản
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {products.length > 0 && (
            <section>
              <h2 className="font-display text-3xl font-bold text-ink mb-5">
                Sản phẩm đã lưu ({products.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.product_id}
                    product={product}
                    isFavorited={true}
                    onFavoriteToggled={() => loadFavorites()}
                  />
                ))}
              </div>
            </section>
          )}

          {articles.length > 0 && (
            <section>
              <h2 className="font-display text-3xl font-bold text-ink mb-5">
                Bài viết đã lưu ({articles.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard key={article.article_id} article={article} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <div className="mt-10">
        <RecommendationSection
          title="Đề xuất tương đồng"
          subtitle="Dựa trên các đặc sản và bài viết bạn đã đánh dấu yêu thích."
          limit={5}
        />
      </div>
    </div>
  );
}
