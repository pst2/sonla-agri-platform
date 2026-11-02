"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  fetchProductDetail,
  fetchVisitorFavorites,
  toggleFavoriteItem,
} from "@/lib/api";
import { ProductItem } from "@/types";
import { trackEvent } from "@/lib/tracker";
import { useScrollDepthTracker } from "@/hooks/useTracker";
import ProducerInquiryModal from "@/components/ProducerInquiryModal";
import RecommendationSection from "@/components/RecommendationSection";
import ProductFactsPanel from "@/components/ProductFactsPanel";
import { getInitialProductBySlug } from "@/lib/productFacts";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const pageRef = useRef<HTMLDivElement | null>(null);

  const initialProduct = getInitialProductBySlug(slug);
  const [product, setProduct] = useState<ProductItem | null>(initialProduct);
  const [loading, setLoading] = useState<boolean>(!initialProduct);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [favCount, setFavCount] = useState<number>(
    initialProduct?.favorite_count || 0
  );
  const [sharedCopied, setSharedCopied] = useState<boolean>(false);
  const [inquiryOpen, setInquiryOpen] = useState<boolean>(false);

  useScrollDepthTracker("product", product?.product_id);

  useEffect(() => {
    if (!slug) return;
    const fallback = getInitialProductBySlug(slug);
    if (fallback) {
      setProduct(fallback);
      setFavCount(fallback.favorite_count || 0);
      setLoading(false);
    } else {
      setLoading(true);
    }

    fetchProductDetail(slug)
      .then((prod) => {
        setProduct(prod);
        setFavCount(prod.favorite_count || 0);
        trackEvent("product_view", {
          content_type: "product",
          content_id: prod.product_id,
          properties: {
            product_name: prod.product_name,
            slug: prod.slug,
            category_id: prod.category_id,
          },
        });
        return fetchVisitorFavorites().then((favRes) => {
          const found = favRes.favorites.some(
            (f) =>
              f.content_type === "product" && f.content_id === prod.product_id
          );
          setIsFavorited(found);
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product || !pageRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "[data-pd] > *",
        { y: 18, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.78,
          ease: "expo.out",
          stagger: 0.08,
        }
      );

      gsap.fromTo(
        "[data-pd-meta]",
        { y: 16, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.07,
          delay: 0.15,
        }
      );

      gsap.fromTo(
        "[data-pd-img]",
        { scale: 1.12 },
        { scale: 1.04, duration: 1.2, ease: "power2.out" }
      );

      gsap.to("[data-pd-img]", {
        yPercent: -3.5,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-pd-frame]",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });

      gsap.fromTo(
        "[data-pd-fig]",
        { y: 16, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: "[data-pd-facts]",
            start: "top 88%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        "[data-pd-row]",
        { y: 14, opacity: 0.2 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.07,
          scrollTrigger: {
            trigger: "[data-pd-facts]",
            start: "top 80%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        "[data-pd-prov]",
        { y: 12, opacity: 0.25 },
        {
          y: 0,
          opacity: 1,
          duration: 0.68,
          ease: "power2.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: "[data-pd-facts]",
            start: "top 72%",
            once: true,
          },
        }
      );

      gsap.fromTo(
        "[data-pd-step]",
        { x: -16, opacity: 0.2 },
        {
          x: 0,
          opacity: 1,
          duration: 0.65,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: "[data-pd-step]",
            start: "top 88%",
            once: true,
          },
        }
      );

      gsap.utils.toArray<HTMLElement>("[data-pd-section]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 24, opacity: 0.2 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          }
        );
      });
    }, pageRef);

    return () => ctx.revert();
  }, [product?.slug]);

  const handleToggleFavorite = async () => {
    if (!product) return;
    try {
      const res = await toggleFavoriteItem("product", product.product_id);
      const added = res.status === "added";
      setIsFavorited(added);
      setFavCount((c) => (added ? c + 1 : Math.max(0, c - 1)));
      trackEvent("favorite", {
        content_type: "product",
        content_id: product.product_id,
        properties: { action: res.status },
      });
    } catch {
      // ignore
    }
  };

  const handleShare = () => {
    if (!product) return;
    trackEvent("share", {
      content_type: "product",
      content_id: product.product_id,
      properties: {
        method: "copy_link",
        product_name: product.product_name,
      },
    });
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    setSharedCopied(true);
    setTimeout(() => setSharedCopied(false), 3000);
  };

  const handleOpenInquiry = () => {
    if (!product) return;
    trackEvent("contact_click", {
      content_type: "product",
      content_id: product.product_id,
      properties: {
        action: "open_inquiry_modal",
        producer: product.producer,
      },
    });
    setInquiryOpen(true);
  };

  if (loading && !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="h-8 w-48 bg-surface rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 h-[460px] bg-surface rounded-2xl" />
          <div className="lg:col-span-6 space-y-4">
            <div className="h-10 w-3/4 bg-surface rounded" />
            <div className="h-24 w-full bg-surface rounded" />
            <div className="h-40 w-full bg-surface rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-[44px] font-bold text-ink mb-3">
          Không tìm thấy nông sản
        </h1>
        <Link
          href="/products"
          className="inline-flex items-center px-6 py-3 rounded-lg bg-accent text-accentInk text-[16px] font-semibold"
        >
          Quay lại danh mục nông sản
        </Link>
      </div>
    );
  }

  const processSteps = product.production_process
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div ref={pageRef} className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header data-pd="" className="mb-8 space-y-3">
        <h1 className="font-display text-[44px] lg:text-[72px] font-bold text-ink leading-[1.04] max-w-[16ch] will-change-transform">
          {product.product_name}
        </h1>
        <p className="text-[18px] text-accent leading-[1.6] will-change-transform">
          {product.certification || "Chứng nhận Đặc sản Sơn La"}
        </p>
        <p className="text-[16px] text-ink leading-[1.6] will-change-transform">
          Xuất xứ: <strong>{product.origin}</strong>
          {product.season ? ` · ${product.season}` : ""}
        </p>
        <p className="text-[16px] text-muted nums will-change-transform">
          {product.view_count} lượt xem · {favCount} yêu thích
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start bg-surface rounded-2xl p-6 sm:p-10">
        <div className="lg:col-span-6 space-y-5">
          <div
            data-pd-frame=""
            className="relative rounded-xl overflow-hidden aspect-[4/3] lg:aspect-[3/4] bg-bg"
          >
            <img
              data-pd-img=""
              src={product.image_url}
              alt={product.product_name}
              width={720}
              height={960}
              className="w-full h-full object-cover will-change-transform"
            />
          </div>

          {product.location && (
            <div
              data-pd-meta=""
              className="bg-bg rounded-xl p-5 space-y-3 text-[16px] will-change-transform"
            >
              <div className="relative rounded-lg overflow-hidden aspect-[16/7] bg-surface">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  poster={product.image_url}
                  className="w-full h-full object-cover opacity-85"
                >
                  <source
                    src="https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-mountains-in-the-clouds-41566-large.mp4"
                    type="video/mp4"
                  />
                </video>
              </div>
              <div className="flex items-center justify-between text-[16px] text-accent nums">
                <span>Tiểu vùng sinh thái</span>
                <span>Độ cao {product.location.altitude}</span>
              </div>
              <p className="font-display text-[18px] sm:text-[24px] font-bold text-ink">
                {product.location.name}
              </p>
              <p className="text-ink leading-relaxed">
                <strong>Khí hậu:</strong> {product.location.climate}
              </p>
              <p className="text-ink leading-relaxed">
                <strong>Thổ nhưỡng:</strong> {product.location.soil_type}
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-6 space-y-6">
          <p
            data-pd-meta=""
            className="text-[18px] text-ink leading-[1.75] max-w-[60ch] will-change-transform"
          >
            {product.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              data-pd-meta=""
              className="p-4 rounded-xl bg-bg will-change-transform"
            >
              <div className="text-[16px] font-semibold text-accent mb-1">
                Đơn vị sản xuất / Hợp tác xã
              </div>
              <p className="text-[16px] text-ink font-medium leading-relaxed">
                {product.producer || "Hợp tác xã Nông nghiệp Sơn La"}
              </p>
            </div>
            <div
              data-pd-meta=""
              className="p-4 rounded-xl bg-bg will-change-transform"
            >
              <div className="text-[16px] font-semibold text-accent mb-1">
                Căn cứ xác thực & pháp lý
              </div>
              <p className="text-[16px] text-ink leading-relaxed">
                {product.source_reference}
              </p>
            </div>
          </div>

          <div
            data-pd-meta=""
            className="flex flex-wrap items-center gap-3 pt-2 will-change-transform"
          >
            <button
              type="button"
              onClick={handleOpenInquiry}
              className="taste-btn px-6 py-3.5 rounded-lg bg-accent text-accentInk text-[16px] font-semibold transition-colors"
            >
              Liên hệ Hợp tác xã / Đặt mua
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`taste-btn px-5 py-3.5 rounded-lg text-[16px] font-semibold transition-colors ${
                isFavorited
                  ? "bg-cream-3 text-accent"
                  : "bg-bg text-ink hover:text-accent"
              }`}
            >
              {isFavorited ? "Đã lưu yêu thích" : "Lưu yêu thích"} ({favCount})
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="taste-btn px-5 py-3.5 rounded-lg bg-bg text-ink text-[16px] font-medium hover:text-accent transition-colors"
            >
              {sharedCopied ? "Đã sao chép liên kết" : "Chia sẻ đặc sản"}
            </button>
          </div>
        </div>
      </div>

      <ProductFactsPanel slug={product.slug} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
        <div className="lg:col-span-7 space-y-8">
          <div data-pd-section="" className="bg-surface rounded-2xl p-6 sm:p-8 will-change-transform">
            <h2 className="font-display text-[32px] font-bold text-ink mb-5">
              Quy trình canh tác và chế biến 5 bước
            </h2>
            <ol className="space-y-5">
              {processSteps.map((step, idx) => (
                <li
                  key={idx}
                  data-pd-step=""
                  className="grid grid-cols-[3rem_1fr] gap-4 items-baseline will-change-transform"
                >
                  <span className="font-display nums text-[32px] font-bold text-accent leading-none">
                    {idx + 1}
                  </span>
                  <p className="text-[16px] text-ink leading-[1.7]">
                    {step.replace(/^\d+\.\s*/, "")}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <div data-pd-section="" className="bg-surface rounded-2xl p-6 sm:p-8 will-change-transform">
            <h2 className="font-display text-[32px] font-bold text-ink mb-4">
              Giá trị truyền thống
            </h2>
            <p className="text-[18px] text-ink leading-relaxed">
              {product.traditional_value}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <div
            data-pd-section=""
            className="bg-surface rounded-2xl p-6 sm:p-8 space-y-6 will-change-transform"
          >
            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-2">
                Thành phần & Giống
              </h2>
              <p className="text-[16px] text-ink leading-relaxed bg-bg p-4 rounded-xl">
                {product.ingredients}
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-2">
                Đặc điểm cảm quan
              </h2>
              <p className="text-[16px] text-ink leading-relaxed bg-bg p-4 rounded-xl">
                {product.characteristics}
              </p>
            </div>

            <div>
              <p className="text-[16px] font-semibold text-muted mb-2.5">
                Từ khóa đặc trưng (TF-IDF Indexing):
              </p>
              <div className="flex flex-wrap gap-2">
                {product.keywords.split(",").map((kw, i) => (
                  <Link
                    key={i}
                    href={`/search?q=${encodeURIComponent(kw.trim())}`}
                    className="px-3 py-1 rounded-lg text-[16px] bg-bg text-ink hover:text-accent transition-colors"
                  >
                    #{kw.trim()}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {product.articles && product.articles.length > 0 && (
            <div
              data-pd-section=""
              className="bg-surface rounded-2xl p-6 sm:p-8 will-change-transform"
            >
              <h2 className="font-display text-2xl font-bold text-ink mb-4">
                Bài viết liên quan
              </h2>
              <div className="space-y-5">
                {product.articles.map((art) => (
                  <Link
                    key={art.article_id}
                    href={`/articles/${art.slug}`}
                    className="group block space-y-3"
                  >
                    {art.image_url && (
                      <div className="aspect-[16/9] rounded-xl overflow-hidden bg-bg">
                        <img
                          src={art.image_url}
                          alt={art.title}
                          width={600}
                          height={338}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5 min-w-0">
                      <p className="font-display text-[18px] font-bold text-ink group-hover:text-accent transition-colors leading-snug">
                        {art.title}
                      </p>
                      <p className="text-[16px] text-ink leading-[1.6] line-clamp-2">
                        {art.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-10">
        <Link
          href="/products"
          className="text-[16px] font-medium text-accent hover:underline"
        >
          ← Quay lại Danh mục 8 Đặc sản
        </Link>

        <div className="text-[16px] text-muted">
          Trạng thái dữ liệu:{" "}
          <strong className="text-accent">
            {product.verification_status === "verified"
              ? "Đã kiểm chứng nguồn gốc"
              : product.verification_status}
          </strong>
        </div>
      </div>

      <div className="mt-8">
        <RecommendationSection
          title="Đề xuất liên quan"
          subtitle="Kết hợp độ tương đồng nội dung TF-IDF trực tiếp (30%) với hồ sơ hành vi cá nhân của bạn (70%)."
          currentContentType="product"
          currentContentId={product.product_id}
          limit={5}
        />
      </div>

      <ProducerInquiryModal
        product={product}
        isOpen={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
      />
    </div>
  );
}
