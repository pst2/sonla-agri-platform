"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  fetchArticleDetail,
  fetchVisitorFavorites,
  toggleFavoriteItem,
} from "@/lib/api";
import { ArticleItem } from "@/types";
import { trackEvent } from "@/lib/tracker";
import { useScrollDepthTracker } from "@/hooks/useTracker";
import RecommendationSection from "@/components/RecommendationSection";

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [article, setArticle] = useState<ArticleItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [favCount, setFavCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useScrollDepthTracker("article", article?.article_id);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetchArticleDetail(slug)
      .then((art) => {
        setArticle(art);
        setFavCount(art.favorite_count || 0);
        trackEvent("article_view", {
          content_type: "article",
          content_id: art.article_id,
          properties: {
            title: art.title,
            slug: art.slug,
            content_type_category: art.content_type,
          },
        });
        return fetchVisitorFavorites().then((favRes) => {
          const found = favRes.favorites.some(
            (f) =>
              f.content_type === "article" && f.content_id === art.article_id
          );
          setIsFavorited(found);
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleToggleFavorite = async () => {
    if (!article) return;
    try {
      const res = await toggleFavoriteItem("article", article.article_id);
      const added = res.status === "added";
      setIsFavorited(added);
      setFavCount((c) => (added ? c + 1 : Math.max(0, c - 1)));
      trackEvent("favorite", {
        content_type: "article",
        content_id: article.article_id,
        properties: { action: res.status },
      });
    } catch {
      // ignore
    }
  };

  const handleShare = () => {
    if (!article) return;
    trackEvent("share", {
      content_type: "article",
      content_id: article.article_id,
      properties: { title: article.title },
    });
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="h-8 w-40 bg-surface rounded" />
        <div className="h-12 w-3/4 bg-surface rounded" />
        <div className="h-96 w-full bg-surface rounded-2xl" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-4xl font-bold text-ink mb-3">
          Không tìm thấy bài viết
        </h1>
        <Link
          href="/articles"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-accent text-accentInk text-[15px] font-semibold"
        >
          Quay lại thư viện bài viết
        </Link>
      </div>
    );
  }

  const paragraphs = article.content
    .split("\n\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/articles"
          className="inline-flex items-center text-[15px] font-medium text-accent hover:underline mb-6"
        >
          ← Quay lại Thư viện Câu chuyện
        </Link>

        <article className="bg-surface rounded-2xl p-6 sm:p-12 space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-[14px] text-muted nums">
            <span className="text-accent font-semibold">
              {article.content_type}
            </span>
            <span>·</span>
            <span>{article.reading_time_minutes} phút đọc</span>
            <span>·</span>
            <span>{article.view_count} lượt đọc</span>
            <span>·</span>
            <span>{article.author || "Ban Biên Tập Nông Sản Sơn La"}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-ink leading-tight">
            {article.title}
          </h1>

          <p className="text-[19px] text-ink italic bg-bg p-5 rounded-xl">
            {article.excerpt}
          </p>

          <div className="relative rounded-xl overflow-hidden my-6 aspect-[16/9] bg-bg">
            <img
              src={
                article.image_url ||
                "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80"
              }
              alt={article.title}
              width={1000}
              height={560}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-5 text-[18px] text-ink leading-[1.75] max-w-[62ch]">
            {paragraphs.map((para, idx) => (
              <p key={idx}>{para}</p>
            ))}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg p-5 rounded-xl">
            <div className="text-[14px] text-muted">
              Nguồn tham khảo:{" "}
              <strong className="text-ink">
                {article.source_reference ||
                  "Tư liệu Nông sản Truyền thống Tỉnh Sơn La"}
              </strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className={`px-4 py-2 rounded-lg text-[14px] font-semibold transition-colors ${
                  isFavorited
                    ? "bg-accent text-accentInk"
                    : "bg-surface text-ink hover:text-accent"
                }`}
              >
                {isFavorited ? "Đã lưu" : "Lưu bài viết"} ({favCount})
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2 rounded-lg bg-surface text-ink text-[14px] font-medium hover:text-accent transition-colors"
              >
                {copied ? "Đã sao chép liên kết" : "Chia sẻ bài viết"}
              </button>
            </div>
          </div>

          {article.products && article.products.length > 0 && (
            <div className="pt-4 space-y-4">
              <h2 className="font-display text-2xl font-bold text-ink">
                Đặc sản liên quan
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {article.products.map((prod) => (
                  <Link
                    key={prod.product_id}
                    href={`/products/${prod.slug}`}
                    className="flex items-center justify-between gap-3 p-4 rounded-xl bg-bg hover:bg-cream-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={prod.image_url}
                        alt={prod.product_name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-display text-xl font-bold text-ink group-hover:text-accent truncate">
                          {prod.product_name}
                        </div>
                        <div className="text-[14px] text-muted truncate">
                          {prod.origin}
                        </div>
                      </div>
                    </div>
                    <span className="text-[14px] text-accent">Xem →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>

      <div className="mt-8">
        <RecommendationSection
          title="Đề xuất tiếp theo"
          subtitle="Đề xuất tự động từ mô hình TF-IDF dựa trên ngữ cảnh bài viết bạn vừa đọc và sở thích cá nhân."
          currentContentType="article"
          currentContentId={article.article_id}
          limit={5}
        />
      </div>
    </div>
  );
}
