"use client";

import React, { useEffect, useState } from "react";
import {
  fetchProducts,
  fetchArticles,
  fetchCategoriesAndLocations,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
  adminCreateArticle,
  adminUpdateArticle,
  adminDeleteArticle,
  adminCreateCategory,
  adminUpdateCategory,
} from "@/lib/api";
import { ProductItem, ArticleItem, CategoryItem, LocationItem } from "@/types";

export default function ContentCrudPanel() {
  const [subTab, setSubTab] = useState<"products" | "articles" | "categories">(
    "products"
  );
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null
  );
  const [showProdForm, setShowProdForm] = useState(false);
  const [prodForm, setProdForm] = useState({
    product_name: "",
    slug: "",
    category_id: 1,
    location_id: 1,
    origin: "Tỉnh Sơn La",
    short_description: "",
    description: "",
    ingredients: "",
    production_process: "",
    characteristics: "",
    traditional_value: "",
    keywords: "",
    image_url:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80",
    season: "Quanh năm",
    certification: "OCOP 4 Sao · VietGAP",
    producer: "HTX Nông sản Sơn La",
    source_reference: "Sở Nông nghiệp & PTNT Tỉnh Sơn La",
    verification_status: "verified",
    is_featured: true,
  });

  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(
    null
  );
  const [showArtForm, setShowArtForm] = useState(false);
  const [artForm, setArtForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    content_type: "origin_story",
    image_url:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80",
    author: "Ban Biên Tập Nông Sản Sơn La",
    reading_time_minutes: 5,
    keywords: "",
    source_reference: "Tư liệu Nông sản Sơn La",
    status: "published",
    product_ids: [1],
  });

  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(
    null
  );
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "Sprout",
    display_order: 1,
  });

  const loadAll = async () => {
    try {
      const [pRes, aRes, cRes] = await Promise.all([
        fetchProducts(),
        fetchArticles({ limit: 50 }),
        fetchCategoriesAndLocations(),
      ]);
      setProducts(pRes.items || []);
      setArticles(aRes.items || []);
      setCategories(cRes.categories || []);
      setLocations(cRes.locations || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const notify = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdForm({
      product_name: "",
      slug: "",
      category_id: categories[0]?.category_id || 1,
      location_id: locations[0]?.location_id || 1,
      origin: "Tỉnh Sơn La",
      short_description: "",
      description: "",
      ingredients: "100% nguyên liệu tự nhiên bản địa Sơn La",
      production_process:
        "Bước 1: Thu hái\nBước 2: Sơ chế\nBước 3: Chế biến\nBước 4: Kiểm định\nBước 5: Đóng gói",
      characteristics: "Hương vị tự nhiên đặc trưng vùng núi cao Tây Bắc",
      traditional_value: "Gắn liền với văn hóa canh tác bản địa tỉnh Sơn La",
      keywords: "đặc sản sơn la, ocop",
      image_url:
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80",
      season: "Theo mùa vụ",
      certification: "OCOP Sơn La · VietGAP",
      producer: "HTX Nông sản Sơn La",
      source_reference: "Cổng thông tin Nông sản Sơn La",
      verification_status: "verified",
      is_featured: true,
    });
    setShowProdForm(true);
  };

  const openEditProduct = (p: ProductItem) => {
    setEditingProduct(p);
    setProdForm({
      product_name: p.product_name,
      slug: p.slug,
      category_id: p.category_id,
      location_id: p.location_id,
      origin: p.origin,
      short_description: p.short_description || "",
      description: p.description,
      ingredients: p.ingredients,
      production_process: p.production_process,
      characteristics: p.characteristics,
      traditional_value: p.traditional_value,
      keywords: p.keywords,
      image_url: p.image_url,
      season: p.season || "",
      certification: p.certification || "",
      producer: p.producer || "",
      source_reference: p.source_reference,
      verification_status: p.verification_status,
      is_featured: p.is_featured,
    });
    setShowProdForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await adminUpdateProduct(editingProduct.product_id, prodForm);
        notify(
          `Đã cập nhật sản phẩm "${prodForm.product_name}" và đồng bộ bảng contents TF-IDF.`
        );
      } else {
        await adminCreateProduct(prodForm);
        notify(
          `Đã thêm sản phẩm mới "${prodForm.product_name}" và đồng bộ bảng contents TF-IDF.`
        );
      }
      setShowProdForm(false);
      loadAll();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Lỗi khi lưu sản phẩm");
    }
  };

  const handleDeleteProduct = async (p: ProductItem) => {
    if (!window.confirm(`Xác nhận xóa sản phẩm "${p.product_name}"?`)) return;
    try {
      await adminDeleteProduct(p.product_id);
      notify(`Đã xóa sản phẩm "${p.product_name}".`);
      loadAll();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Không thể xóa sản phẩm");
    }
  };

  const openCreateArticle = () => {
    setEditingArticle(null);
    setArtForm({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      content_type: "origin_story",
      image_url:
        "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=900&q=80",
      author: "Ban Biên Tập Nông Sản Sơn La",
      reading_time_minutes: 5,
      keywords: "nông sản sơn la, văn hóa bản địa",
      source_reference: "Tư liệu Nông sản Sơn La",
      status: "published",
      product_ids: [1],
    });
    setShowArtForm(true);
  };

  const openEditArticle = (a: ArticleItem) => {
    setEditingArticle(a);
    setArtForm({
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      content_type: a.content_type,
      image_url: a.image_url || "",
      author: a.author || "Ban Biên Tập Nông Sản Sơn La",
      reading_time_minutes: a.reading_time_minutes,
      keywords: a.keywords || "",
      source_reference: a.source_reference || "",
      status: a.status,
      product_ids: a.products.map((p) => p.product_id),
    });
    setShowArtForm(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        await adminUpdateArticle(editingArticle.article_id, artForm);
        notify(`Đã cập nhật bài viết "${artForm.title}".`);
      } else {
        await adminCreateArticle(artForm);
        notify(`Đã tạo bài viết mới "${artForm.title}".`);
      }
      setShowArtForm(false);
      loadAll();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Lỗi khi lưu bài viết");
    }
  };

  const handleDeleteArticle = async (a: ArticleItem) => {
    if (!window.confirm(`Xác nhận xóa bài viết "${a.title}"?`)) return;
    try {
      await adminDeleteArticle(a.article_id);
      notify(`Đã xóa bài viết "${a.title}".`);
      loadAll();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Không thể xóa bài viết");
    }
  };

  const openEditCategory = (c: CategoryItem) => {
    setEditingCategory(c);
    setCatForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      icon: c.icon || "Sprout",
      display_order: c.display_order,
    });
    setShowCatForm(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await adminUpdateCategory(editingCategory.category_id, catForm);
        notify(`Đã cập nhật danh mục "${catForm.name}".`);
      } else {
        await adminCreateCategory(catForm);
        notify(`Đã tạo danh mục "${catForm.name}".`);
      }
      setShowCatForm(false);
      loadAll();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : "Lỗi khi lưu danh mục");
    }
  };

  return (
    <div className="space-y-6">
      <div className="app-tray flex flex-wrap items-center justify-between gap-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab("products")}
            className={`px-3.5 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${
              subTab === "products"
                ? "bg-[#1b6c80] text-white"
                : "app-btn-outline text-[#131416]"
            }`}
          >
            Sản phẩm ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setSubTab("articles")}
            className={`px-3.5 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${
              subTab === "articles"
                ? "bg-[#1b6c80] text-white"
                : "app-btn-outline text-[#131416]"
            }`}
          >
            Bài viết ({articles.length})
          </button>

          <button
            type="button"
            onClick={() => setSubTab("categories")}
            className={`px-3.5 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${
              subTab === "categories"
                ? "bg-[#1b6c80] text-white"
                : "app-btn-outline text-[#131416]"
            }`}
          >
            Danh mục ({categories.length})
          </button>
        </div>

        <div>
          {subTab === "products" && (
            <button
              type="button"
              onClick={openCreateProduct}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#1b6c80] text-white text-[13px] font-medium"
            >
              + Thêm sản phẩm
            </button>
          )}
          {subTab === "articles" && (
            <button
              type="button"
              onClick={openCreateArticle}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#1b6c80] text-white text-[13px] font-medium"
            >
              + Thêm bài viết
            </button>
          )}
          {subTab === "categories" && (
            <button
              type="button"
              onClick={() => {
                setEditingCategory(null);
                setCatForm({
                  name: "",
                  slug: "",
                  description: "",
                  icon: "Sprout",
                  display_order: categories.length + 1,
                });
                setShowCatForm(true);
              }}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#1b6c80] text-white text-[13px] font-medium"
            >
              + Thêm danh mục
            </button>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-[8px] bg-[#dcfae5] text-[#04250e] text-[13px] font-medium flex items-center justify-between">
          <span>{statusMsg}</span>
          <button
            type="button"
            onClick={() => setStatusMsg(null)}
            className="text-[12px] underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* PRODUCTS CRUD */}
      {subTab === "products" && (
        <div className="space-y-6">
          {showProdForm && (
            <form
              onSubmit={handleSaveProduct}
              className="app-tray p-5 space-y-4 text-[13px]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#131416]">
                  {editingProduct
                    ? `Chỉnh sửa: ${editingProduct.product_name}`
                    : "Thêm nông sản mới"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowProdForm(false)}
                  className="text-[#5d5f60] hover:text-[#131416]"
                >
                  Đóng
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-medium block mb-1">Tên nông sản *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.product_name}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, product_name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.slug}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, slug: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">
                    Danh mục & Vùng
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={prodForm.category_id}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          category_id: Number(e.target.value),
                        })
                      }
                      className="px-2 py-1.5 rounded-[6px] bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.category_id} value={c.category_id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={prodForm.location_id}
                      onChange={(e) =>
                        setProdForm({
                          ...prodForm,
                          location_id: Number(e.target.value),
                        })
                      }
                      className="px-2 py-1.5 rounded-[6px] bg-white"
                    >
                      {locations.map((l) => (
                        <option key={l.location_id} value={l.location_id}>
                          {l.district}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium block mb-1">Xuất xứ *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.origin}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, origin: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">Chứng nhận</label>
                  <input
                    type="text"
                    value={prodForm.certification}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        certification: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium block mb-1">Mô tả chi tiết *</label>
                <textarea
                  rows={3}
                  required
                  value={prodForm.description}
                  onChange={(e) =>
                    setProdForm({ ...prodForm, description: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium block mb-1">
                    Quy trình sản xuất *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={prodForm.production_process}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        production_process: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">
                    Giá trị văn hóa *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={prodForm.traditional_value}
                    onChange={(e) =>
                      setProdForm({
                        ...prodForm,
                        traditional_value: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-medium block mb-1">
                    Từ khóa TF-IDF *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodForm.keywords}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, keywords: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">URL hình ảnh *</label>
                  <input
                    type="text"
                    required
                    value={prodForm.image_url}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, image_url: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProdForm(false)}
                  className="app-btn-outline px-3.5 py-1.5 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-[#1b6c80] text-white font-medium"
                >
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          )}

          <div className="app-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#f4f6f8] text-[#5d5f60]">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Sản phẩm</th>
                    <th className="py-3 px-4">Danh mục</th>
                    <th className="py-3 px-4">Xuất xứ</th>
                    <th className="py-3 px-4 text-right nums">Lượt xem</th>
                    <th className="py-3 px-4 text-right nums">Yêu thích</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.product_id} className="hover:bg-[#f9fbfc]">
                      <td className="py-3 px-4">
                        <code>#{p.product_id}</code>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#131416]">
                        {p.product_name}
                      </td>
                      <td className="py-3 px-4 text-[#5d5f60]">
                        {p.category?.name || `Danh mục #${p.category_id}`}
                      </td>
                      <td className="py-3 px-4 text-[#5d5f60]">{p.origin}</td>
                      <td className="py-3 px-4 text-right nums">
                        {p.view_count}
                      </td>
                      <td className="py-3 px-4 text-right nums">
                        {p.favorite_count}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="px-2.5 py-1 rounded-[6px] bg-[#f4f6f8] text-[#131416] hover:bg-[#ebedee]"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p)}
                          className="px-2.5 py-1 rounded-[6px] bg-[#ffedea] text-[#831c1e]"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ARTICLES CRUD */}
      {subTab === "articles" && (
        <div className="space-y-6">
          {showArtForm && (
            <form
              onSubmit={handleSaveArticle}
              className="app-tray p-5 space-y-4 text-[13px]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#131416]">
                  {editingArticle
                    ? `Chỉnh sửa bài viết #${editingArticle.article_id}`
                    : "Thêm bài viết mới"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowArtForm(false)}
                  className="text-[#5d5f60]"
                >
                  Đóng
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-medium block mb-1">Tiêu đề *</label>
                  <input
                    type="text"
                    required
                    value={artForm.title}
                    onChange={(e) =>
                      setArtForm({ ...artForm, title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={artForm.slug}
                    onChange={(e) =>
                      setArtForm({ ...artForm, slug: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">Loại bài viết</label>
                  <select
                    value={artForm.content_type}
                    onChange={(e) =>
                      setArtForm({ ...artForm, content_type: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  >
                    <option value="origin_story">origin_story</option>
                    <option value="production_process">
                      production_process
                    </option>
                    <option value="cultural_heritage">cultural_heritage</option>
                    <option value="guide">guide</option>
                    <option value="innovation">innovation</option>
                    <option value="research">research</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium block mb-1">Tóm tắt *</label>
                <input
                  type="text"
                  required
                  value={artForm.excerpt}
                  onChange={(e) =>
                    setArtForm({ ...artForm, excerpt: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                />
              </div>

              <div>
                <label className="font-medium block mb-1">Nội dung *</label>
                <textarea
                  rows={4}
                  required
                  value={artForm.content}
                  onChange={(e) =>
                    setArtForm({ ...artForm, content: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowArtForm(false)}
                  className="app-btn-outline px-3.5 py-1.5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-[#1b6c80] text-white font-medium"
                >
                  Lưu bài viết
                </button>
              </div>
            </form>
          )}

          <div className="app-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[13px]">
                <thead>
                  <tr className="bg-[#f4f6f8] text-[#5d5f60]">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Tiêu đề bài viết</th>
                    <th className="py-3 px-4">Phân loại</th>
                    <th className="py-3 px-4 text-right nums">Phút đọc</th>
                    <th className="py-3 px-4 text-right nums">Lượt đọc</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr key={a.article_id} className="hover:bg-[#f9fbfc]">
                      <td className="py-3 px-4">
                        <code>#{a.article_id}</code>
                      </td>
                      <td className="py-3 px-4 font-medium text-[#131416]">
                        {a.title}
                      </td>
                      <td className="py-3 px-4">
                        <code>{a.content_type}</code>
                      </td>
                      <td className="py-3 px-4 text-right nums">
                        {a.reading_time_minutes}
                      </td>
                      <td className="py-3 px-4 text-right nums">
                        {a.view_count}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditArticle(a)}
                          className="px-2.5 py-1 rounded-[6px] bg-[#f4f6f8] text-[#131416]"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteArticle(a)}
                          className="px-2.5 py-1 rounded-[6px] bg-[#ffedea] text-[#831c1e]"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES CRUD */}
      {subTab === "categories" && (
        <div className="space-y-6">
          {showCatForm && (
            <form
              onSubmit={handleSaveCategory}
              className="app-tray p-5 space-y-4 text-[13px]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-semibold text-[#131416]">
                  {editingCategory
                    ? `Chỉnh sửa danh mục: ${editingCategory.name}`
                    : "Thêm danh mục mới"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCatForm(false)}
                  className="text-[#5d5f60]"
                >
                  Đóng
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="font-medium block mb-1">Tên danh mục *</label>
                  <input
                    type="text"
                    required
                    value={catForm.name}
                    onChange={(e) =>
                      setCatForm({ ...catForm, name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">Slug *</label>
                  <input
                    type="text"
                    required
                    value={catForm.slug}
                    onChange={(e) =>
                      setCatForm({ ...catForm, slug: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
                <div>
                  <label className="font-medium block mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={catForm.display_order}
                    onChange={(e) =>
                      setCatForm({
                        ...catForm,
                        display_order: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium block mb-1">Mô tả</label>
                <input
                  type="text"
                  value={catForm.description}
                  onChange={(e) =>
                    setCatForm({ ...catForm, description: e.target.value })
                  }
                  className="w-full px-3 py-1.5 rounded-[6px] bg-white"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCatForm(false)}
                  className="app-btn-outline px-3.5 py-1.5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-[#1b6c80] text-white font-medium"
                >
                  Lưu danh mục
                </button>
              </div>
            </form>
          )}

          <div className="app-panel overflow-hidden">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="bg-[#f4f6f8] text-[#5d5f60]">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Tên danh mục</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">Mô tả</th>
                  <th className="py-3 px-4 text-right nums">Số sản phẩm</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.category_id} className="hover:bg-[#f9fbfc]">
                    <td className="py-3 px-4">
                      <code>#{c.category_id}</code>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#131416]">
                      {c.name}
                    </td>
                    <td className="py-3 px-4">
                      <code>{c.slug}</code>
                    </td>
                    <td className="py-3 px-4 text-[#5d5f60]">{c.description}</td>
                    <td className="py-3 px-4 text-right nums">
                      {c.product_count ?? 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditCategory(c)}
                        className="px-2.5 py-1 rounded-[6px] bg-[#f4f6f8] text-[#131416]"
                      >
                        Sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
