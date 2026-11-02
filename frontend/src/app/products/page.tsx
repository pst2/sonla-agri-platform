"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  fetchProducts,
  fetchCategoriesAndLocations,
  fetchVisitorFavorites,
} from "@/lib/api";
import { ProductItem, CategoryItem, LocationItem } from "@/types";
import ProductCard from "@/components/ProductCard";
import { trackEvent } from "@/lib/tracker";

export default function ProductsCatalogPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );
  const [selectedLocation, setSelectedLocation] = useState<number | undefined>(
    undefined
  );
  const [sortBy, setSortBy] = useState<"featured" | "popular" | "favorites">(
    "featured"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCategoriesAndLocations()
      .then((res) => {
        setCategories(res.categories || []);
        setLocations(res.locations || []);
      })
      .catch(() => {});

    fetchVisitorFavorites()
      .then((favRes) => {
        setFavoriteIds(
          new Set(
            favRes.favorites
              .filter((f) => f.content_type === "product")
              .map((f) => f.content_id)
          )
        );
      })
      .catch(() => {});
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchProducts({
        category_id: selectedCategory,
        location_id: selectedLocation,
        sort: sortBy,
        q: searchQuery.trim() || undefined,
      });
      setProducts(res.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedLocation, sortBy, searchQuery]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackEvent("search", {
        content_type: "page",
        properties: {
          query: searchQuery.trim(),
          scope: "products_catalog",
          category_id: selectedCategory,
        },
      });
    }
    loadProducts();
  };

  const resetFilters = () => {
    setSelectedCategory(undefined);
    setSelectedLocation(undefined);
    setSortBy("featured");
    setSearchQuery("");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-surface rounded-2xl p-8 sm:p-10 mb-8">
        <p className="text-[14px] text-accent font-semibold mb-2">
          Danh mục Chuẩn hóa (Mục 10.2 Kế hoạch)
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-ink">
          Tám đặc sản Sơn La
        </h1>
        <p className="text-[18px] text-ink mt-2 max-w-[58ch] leading-relaxed">
          Khám phá 8 đặc sản tiêu biểu thuộc 4 nhóm ngành hàng chủ lực (Đồ uống,
          Trái cây, Sản phẩm chế biến, Nông sản) gắn với 5 tiểu vùng sinh thái
          núi cao của tỉnh Sơn La.
        </p>
      </div>

      <div className="bg-surface rounded-2xl p-6 mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <form onSubmit={handleSearchSubmit} className="md:col-span-5 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên nông sản, vùng trồng, chứng nhận OCOP..."
              className="flex-1 px-4 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg bg-accent text-accentInk text-[15px] font-semibold transition-colors"
            >
              Tìm
            </button>
          </form>

          <div className="md:col-span-4">
            <select
              value={selectedLocation ?? ""}
              onChange={(e) =>
                setSelectedLocation(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
            >
              <option value="">Tất cả 5 vùng sinh thái Sơn La</option>
              {locations.map((loc) => (
                <option key={loc.location_id} value={loc.location_id}>
                  {loc.district} – {loc.name} ({loc.altitude})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as "featured" | "popular" | "favorites"
                )
              }
              className="w-full px-3.5 py-2.5 rounded-lg bg-bg border border-cream-3 text-[15px] text-ink focus:outline-none focus:border-accent"
            >
              <option value="featured">Sắp xếp: Tiêu biểu mặc định</option>
              <option value="popular">Sắp xếp: Xem nhiều nhất</option>
              <option value="favorites">Sắp xếp: Yêu thích nhiều nhất</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory(undefined)}
              className={`px-3.5 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                selectedCategory === undefined
                  ? "bg-accent text-accentInk"
                  : "bg-bg text-ink hover:text-accent"
              }`}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category_id}
                type="button"
                onClick={() => setSelectedCategory(cat.category_id)}
                className={`px-3.5 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                  selectedCategory === cat.category_id
                    ? "bg-accent text-accentInk"
                    : "bg-bg text-ink hover:text-accent"
                }`}
              >
                {cat.name} ({cat.product_count ?? 0})
              </button>
            ))}
          </div>

          {(selectedCategory || selectedLocation || searchQuery) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[14px] text-accent hover:underline font-medium"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-surface" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center">
          <p className="font-display text-2xl text-ink mb-2">
            Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-3 px-5 py-2.5 rounded-lg bg-accent text-accentInk text-[15px] font-semibold"
          >
            Hiển thị toàn bộ 8 đặc sản
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              isFavorited={favoriteIds.has(product.product_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
