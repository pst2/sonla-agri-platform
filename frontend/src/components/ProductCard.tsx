"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ProductItem } from "@/types";
import { toggleFavoriteItem } from "@/lib/api";
import { trackEvent } from "@/lib/tracker";
import { getProductFacts } from "@/lib/productFacts";

interface ProductCardProps {
  product: ProductItem;
  isFavorited?: boolean;
  onFavoriteToggled?: (productId: number, status: "added" | "removed") => void;
}

export default function ProductCard({
  product,
  isFavorited = false,
  onFavoriteToggled,
}: ProductCardProps) {
  const [fav, setFav] = useState<boolean>(isFavorited);
  const [favCount, setFavCount] = useState<number>(product.favorite_count || 0);
  const [loadingFav, setLoadingFav] = useState<boolean>(false);

  const facts = getProductFacts(product.slug);

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingFav) return;
    setLoadingFav(true);
    try {
      const res = await toggleFavoriteItem("product", product.product_id);
      const isAdded = res.status === "added";
      setFav(isAdded);
      setFavCount((prev) => (isAdded ? prev + 1 : Math.max(0, prev - 1)));
      trackEvent("favorite", {
        content_type: "product",
        content_id: product.product_id,
        properties: { action: res.status, product_name: product.product_name },
      });
      if (onFavoriteToggled) {
        onFavoriteToggled(product.product_id, res.status);
      }
    } catch {
      // ignore
    } finally {
      setLoadingFav(false);
    }
  };

  const firstCert = product.certification
    ? product.certification.split("·")[0].trim()
    : "Đặc sản Sơn La";

  return (
    <article
      data-rise=""
      className="group bg-surface rounded-xl overflow-hidden flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-[4/3] overflow-hidden bg-bg">
          <img
            src={product.image_url}
            alt={product.product_name}
            width={640}
            height={480}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <button
            type="button"
            onClick={handleToggleFav}
            disabled={loadingFav}
            aria-label="Lưu nông sản yêu thích"
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
              fav
                ? "bg-accent text-accentInk"
                : "bg-bg text-ink hover:bg-accent hover:text-accentInk"
            }`}
          >
            {fav ? "Đã lưu" : "Lưu"} · <span className="nums">{favCount}</span>
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[14px] text-muted mb-2">
            <span>{product.origin}</span>
            <span className="text-accent">{firstCert}</span>
          </div>

          <Link href={`/products/${product.slug}`}>
            <h3 className="font-display text-2xl font-bold text-ink group-hover:text-accent transition-colors">
              {product.product_name}
            </h3>
          </Link>

          <p className="text-[16px] text-ink mt-2.5 line-clamp-2 leading-relaxed">
            {product.short_description || product.description}
          </p>

          {facts && facts.figures.length >= 2 && (
            <div className="mt-4 pt-3 bg-bg rounded-lg px-3.5 py-2.5 text-[14px] text-ink nums flex flex-wrap items-center justify-between gap-2">
              <span>
                <strong className="text-accent">{facts.figures[0].value}</strong>{" "}
                {facts.figures[0].unit}
              </span>
              <span>·</span>
              <span>
                <strong className="text-accent">{facts.figures[1].value}</strong>{" "}
                {facts.figures[1].unit}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-2 flex items-center justify-between text-[14px]">
        <span className="text-muted nums">
          {product.view_count} lượt xem · {product.season || "Quanh năm"}
        </span>
        <Link
          href={`/products/${product.slug}`}
          className="text-accent font-semibold hover:underline"
        >
          Xem hồ sơ & số liệu →
        </Link>
      </div>
    </article>
  );
}
