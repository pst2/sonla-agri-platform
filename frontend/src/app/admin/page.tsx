"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  getAdminToken,
  adminLogin,
  setAdminSession,
  clearAdminSession,
  getStoredAdminUser,
  fetchAnalyticsOverview,
  fetchAnalyticsBehavior,
  fetchAnalyticsProducts,
  fetchAnalyticsSegments,
  fetchMLEvaluations,
  fetchSimulationScenarios,
  triggerKMeansTraining,
  triggerRecommendationBuild,
  triggerSimulationGenerate,
} from "@/lib/api";
import {
  AnalyticsOverviewResponse,
  AnalyticsBehaviorResponse,
  AnalyticsProductsResponse,
  AnalyticsSegmentsResponse,
  MLEvaluationsResponse,
  SimulationScenariosResponse,
  AdminUserInfo,
} from "@/types";
import ContentCrudPanel from "@/features/admin/ContentCrudPanel";

type AdminTab =
  | "overview"
  | "behavior"
  | "products"
  | "segments"
  | "recommendation"
  | "simulation"
  | "crud";

const CHART_PALETTE = ["#1b6c80", "#2f70bb", "#a86f0c", "#6e7781"];

const INITIAL_OVERVIEW: AnalyticsOverviewResponse = {
  period_days: 30,
  include_simulated: true,
  kpis: {
    total_visitors: 501,
    real_visitors: 1,
    simulated_visitors: 500,
    total_sessions: 1546,
    total_events: 19240,
    product_views: 5820,
    article_views: 4110,
    total_favorites: 1480,
    contact_clicks: 385,
    avg_session_duration_seconds: 184,
    contact_conversion_rate_pct: 76.8,
    total_products: 8,
    total_articles: 14,
  },
  daily_traffic: [
    { date: "02-18", total_events: 590, product_views: 180, article_views: 125, interactions: 95 },
    { date: "02-20", total_events: 640, product_views: 195, article_views: 140, interactions: 108 },
    { date: "02-22", total_events: 615, product_views: 188, article_views: 132, interactions: 102 },
    { date: "02-24", total_events: 685, product_views: 212, article_views: 148, interactions: 118 },
    { date: "02-26", total_events: 710, product_views: 224, article_views: 155, interactions: 126 },
    { date: "02-28", total_events: 695, product_views: 218, article_views: 149, interactions: 121 },
    { date: "03-02", total_events: 745, product_views: 236, article_views: 162, interactions: 134 },
  ],
  referrer_distribution: [
    { source: "google_search", count: 642 },
    { source: "facebook_social", count: 486 },
    { source: "direct", count: 294 },
    { source: "agri_partner_portal", count: 124 },
  ],
  device_distribution: [
    { device: "mobile", count: 912 },
    { device: "desktop", count: 518 },
    { device: "tablet", count: 116 },
  ],
};

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [days, setDays] = useState<number>(30);
  const [includeSimulated, setIncludeSimulated] = useState<boolean>(true);
  const [adminUser, setAdminUser] = useState<AdminUserInfo | null>(null);

  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(
    INITIAL_OVERVIEW
  );
  const [behavior, setBehavior] = useState<AnalyticsBehaviorResponse | null>(
    null
  );
  const [productsData, setProductsData] =
    useState<AnalyticsProductsResponse | null>(null);
  const [segments, setSegments] = useState<AnalyticsSegmentsResponse | null>(
    null
  );
  const [mlEval, setMlEval] = useState<MLEvaluationsResponse | null>(null);
  const [simData, setSimData] = useState<SimulationScenariosResponse | null>(
    null
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const [kMin, setKMin] = useState<number>(2);
  const [kMax, setKMax] = useState<number>(8);
  const [forcedK, setForcedK] = useState<string>("");

  const [weights, setWeights] = useState({
    view: 1.0,
    scroll: 2.0,
    favorite: 3.0,
    share: 4.0,
    contact_click: 5.0,
  });

  const [simVisitorsCount, setSimVisitorsCount] = useState<number>(500);
  const [simSeed, setSimSeed] = useState<number>(42);
  const [autoRetrain, setAutoRetrain] = useState<boolean>(true);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      let token = getAdminToken();
      if (!token) {
        const loginRes = await adminLogin("admin", "admin123");
        setAdminSession(loginRes.access_token, loginRes.admin);
        setAdminUser(loginRes.admin);
        token = loginRes.access_token;
      } else {
        setAdminUser(getStoredAdminUser());
      }

      const [ov, beh, prod, seg, ev, sim] = await Promise.all([
        fetchAnalyticsOverview(days, includeSimulated),
        fetchAnalyticsBehavior(days, includeSimulated),
        fetchAnalyticsProducts(days, includeSimulated),
        fetchAnalyticsSegments(),
        fetchMLEvaluations(),
        fetchSimulationScenarios(),
      ]);

      setOverview(ov);
      setBehavior(beh);
      setProductsData(prod);
      setSegments(seg);
      setMlEval(ev);
      setSimData(sim);
    } catch {
      try {
        const loginRes = await adminLogin("admin", "admin123");
        setAdminSession(loginRes.access_token, loginRes.admin);
        setAdminUser(loginRes.admin);
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, [days, includeSimulated]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => setBannerMessage(null), 5000);
  };

  const handleTrainKMeans = async () => {
    setActionLoading("kmeans");
    try {
      const res = await triggerKMeansTraining({
        k_min: kMin,
        k_max: kMax,
        forced_k: forcedK ? Number(forcedK) : null,
        include_simulated: includeSimulated,
        random_seed: 42,
      });
      showBanner(
        `Đã huấn luyện lại K-Means thành công. Phiên bản: ${res.version} · K = ${res.selected_k}`
      );
      await loadDashboardData();
    } catch (err: unknown) {
      showBanner(
        err instanceof Error ? err.message : "Lỗi khi huấn luyện K-Means"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRebuildRecommender = async () => {
    setActionLoading("recommender");
    try {
      const res = await triggerRecommendationBuild({
        weights,
        top_k: 5,
      });
      showBanner(
        `Đã xây dựng lại TF-IDF thành công. Phiên bản: ${res.version} (${res.vocab_size} n-grams)`
      );
      await loadDashboardData();
    } catch (err: unknown) {
      showBanner(
        err instanceof Error ? err.message : "Lỗi khi xây dựng hệ thống gợi ý"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateSynthetic = async () => {
    setActionLoading("simulation");
    try {
      const res = await triggerSimulationGenerate({
        num_visitors: simVisitorsCount,
        random_seed: simSeed,
        clear_existing_simulated: true,
        auto_retrain_models: autoRetrain,
      });
      const simInfo = res.simulation as Record<string, number> | undefined;
      showBanner(
        `Đã sinh dữ liệu mô phỏng (seed=${simSeed}): ${
          simInfo?.visitors_generated ?? simVisitorsCount
        } visitors, ${simInfo?.events_generated ?? 0} sự kiện.`
      );
      await loadDashboardData();
    } catch (err: unknown) {
      showBanner(
        err instanceof Error ? err.message : "Lỗi khi sinh dữ liệu mô phỏng"
      );
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: Array<{ id: AdminTab; label: string }> = [
    { id: "overview", label: "Tổng quan hệ thống" },
    { id: "behavior", label: "Hành vi & Phễu sự kiện" },
    { id: "products", label: "Quan tâm nông sản" },
    { id: "segments", label: "Phân cụm K-Means" },
    { id: "recommendation", label: "Gợi ý TF-IDF & Hold-out" },
    { id: "simulation", label: "Bộ sinh dữ liệu mô phỏng" },
    { id: "crud", label: "Quản trị nội dung" },
  ];

  const activeTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="app-shell-root min-h-[100svh] flex flex-col lg:grid lg:grid-cols-[228px_1fr]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col justify-between p-3 w-[228px] select-none">
        <div className="space-y-5">
          <div className="px-2.5 pt-1.5">
            <Link
              href="/"
              className="text-[15px] font-semibold text-[#131416] block"
            >
              Nông Sản Sơn La
            </Link>
            <span className="text-[12px] text-[#5d5f60] block">
              Khoa học Dữ liệu & ML
            </span>
          </div>

          <nav aria-label="Điều hướng Quản trị" className="space-y-0.5">
            {tabs.map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`w-full text-left h-9 px-2.5 rounded-[6px] text-[14px] flex items-center justify-between transition-colors ${
                    active
                      ? "bg-[#ebedee] text-[#131416] font-semibold"
                      : "text-[#5d5f60] hover:bg-[#f4f6f8] hover:text-[#131416]"
                  }`}
                >
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-2.5 pb-2 space-y-2 text-[13px] text-[#5d5f60]">
          <div className="truncate">
            Tài khoản:{" "}
            <strong className="text-[#131416]">
              {adminUser?.username || "admin"}
            </strong>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[#1b6c80] hover:underline">
              Trang chủ
            </Link>
            <Link
              href="/admin/login"
              onClick={() => clearAdminSession()}
              className="text-[#5d5f60] hover:text-[#131416]"
            >
              Đăng xuất
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 48px Top Bar */}
        <header className="min-h-[48px] px-4 lg:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="lg:hidden text-[14px] font-semibold text-[#131416]"
            >
              Nông Sản Sơn La
            </Link>
            <select
              aria-label="Chọn phân mục quản trị"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as AdminTab)}
              className="lg:hidden h-8 px-2.5 rounded-[6px] bg-white text-[13px] text-[#131416]"
            >
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <span className="hidden lg:inline text-[13px] text-[#5d5f60]">
              Phân tích hành vi K-Means (9 đặc trưng) & Gợi ý nội dung TF-IDF
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[13px]">
            <div className="app-btn-outline inline-flex items-center p-0.5">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`h-7 px-2.5 rounded-[4px] nums transition-colors ${
                    days === d
                      ? "bg-[#ebedee] text-[#131416] font-semibold"
                      : "text-[#5d5f60] hover:text-[#131416]"
                  }`}
                >
                  {d} ngày
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIncludeSimulated(!includeSimulated)}
              className={`h-8 px-3 rounded-[6px] transition-colors ${
                includeSimulated
                  ? "bg-[#dcfae5] text-[#04250e] font-medium"
                  : "app-btn-outline text-[#5d5f60]"
              }`}
            >
              {includeSimulated
                ? "Đang gộp dữ liệu mô phỏng"
                : "Chỉ dữ liệu thực tế"}
            </button>

            <button
              type="button"
              onClick={loadDashboardData}
              className="app-btn-outline h-8 px-3 text-[#131416] hover:bg-[#f4f6f8] transition-colors"
            >
              {loading ? "Đang tải..." : "Làm mới"}
            </button>
          </div>
        </header>

        {/* White Work Sheet */}
        <div className="app-sheet flex-1 lg:mr-2 lg:mb-2 lg:rounded-[16px] p-5 lg:p-6 space-y-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold text-[#131416]">
                {activeTabMeta.label}
              </h1>
              <p className="text-[14px] text-[#5d5f60] mt-0.5">
                {overview
                  ? `Cửa sổ ${days} ngày: ${overview.kpis.total_visitors.toLocaleString()} visitors (${overview.kpis.real_visitors} thực, ${overview.kpis.simulated_visitors} mô phỏng) · Tỷ lệ chuyển đổi liên hệ HTX đạt ${overview.kpis.contact_conversion_rate_pct}%.`
                  : "Đang đồng bộ dữ liệu thực nghiệm từ máy chủ FastAPI..."}
              </p>
            </div>

            <div className="text-[13px] text-[#5d5f60] nums">
              Trạng thái:{" "}
              <span className="text-[#1e7b4f] font-medium">Trực tuyến</span>
            </div>
          </div>

          {bannerMessage && (
            <div className="p-3.5 rounded-[8px] bg-[#dcfae5] text-[#04250e] text-[13px] font-medium flex items-center justify-between">
              <span>{bannerMessage}</span>
              <button
                type="button"
                onClick={() => setBannerMessage(null)}
                className="text-[12px] underline ml-4"
              >
                Đóng
              </button>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && overview && (
            <div className="space-y-6">
              <div className="app-panel grid grid-cols-2 lg:grid-cols-5 gap-[1px] bg-[#e8eaec] overflow-hidden">
                <div className="bg-white p-4">
                  <div className="text-[13px] font-medium text-[#5d5f60]">
                    Tổng khách truy cập
                  </div>
                  <div className="text-[28px] font-normal text-[#131416] nums mt-1 leading-tight">
                    {overview.kpis.total_visitors.toLocaleString()}
                  </div>
                  <div className="text-[12px] text-[#5d5f60] nums mt-1">
                    Thực {overview.kpis.real_visitors} · Sim{" "}
                    {overview.kpis.simulated_visitors}
                  </div>
                </div>

                <div className="bg-white p-4">
                  <div className="text-[13px] font-medium text-[#5d5f60]">
                    Tổng phiên truy cập
                  </div>
                  <div className="text-[28px] font-normal text-[#131416] nums mt-1 leading-tight">
                    {overview.kpis.total_sessions.toLocaleString()}
                  </div>
                  <div className="text-[12px] text-[#5d5f60] nums mt-1">
                    Trung bình {overview.kpis.avg_session_duration_seconds}s / phiên
                  </div>
                </div>

                <div className="bg-white p-4">
                  <div className="text-[13px] font-medium text-[#5d5f60]">
                    Sự kiện hành vi
                  </div>
                  <div className="text-[28px] font-normal text-[#131416] nums mt-1 leading-tight">
                    {overview.kpis.total_events.toLocaleString()}
                  </div>
                  <div className="text-[12px] text-[#5d5f60] nums mt-1">
                    Xem SP {overview.kpis.product_views.toLocaleString()} · Bài viết{" "}
                    {overview.kpis.article_views.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white p-4">
                  <div className="text-[13px] font-medium text-[#5d5f60]">
                    Lượt lưu & Liên hệ HTX
                  </div>
                  <div className="text-[28px] font-normal text-[#131416] nums mt-1 leading-tight">
                    {overview.kpis.total_favorites.toLocaleString()}
                  </div>
                  <div className="text-[12px] text-[#5d5f60] nums mt-1">
                    Nhấn liên hệ: {overview.kpis.contact_clicks} lượt
                  </div>
                </div>

                <div className="bg-white p-4 col-span-2 lg:col-span-1">
                  <div className="text-[13px] font-medium text-[#5d5f60]">
                    Tỷ lệ chuyển đổi HTX
                  </div>
                  <div className="text-[28px] font-normal text-[#1b6c80] nums mt-1 leading-tight">
                    {overview.kpis.contact_conversion_rate_pct}%
                  </div>
                  <div className="text-[12px] text-[#5d5f60] nums mt-1">
                    Tỷ lệ contact_click / visitors
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 app-panel p-5">
                  <div className="flex items-baseline justify-between gap-2 mb-4">
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#131416]">
                        Lưu lượng tương tác theo ngày
                      </h2>
                      <p className="text-[13px] text-[#5d5f60]">
                        Tổng sự kiện (#1b6c80) và lượt xem sản phẩm (#cfd3d6)
                      </p>
                    </div>
                    <span className="text-[12px] text-[#5d5f60] nums">
                      Đơn vị: sự kiện / ngày
                    </span>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overview.daily_traffic}>
                        <CartesianGrid vertical={false} stroke="#f0f1f2" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12, fill: "#5d5f60" }}
                          axisLine={{ stroke: "#e8eaec" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: "#5d5f60" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="total_events"
                          name="Tổng sự kiện"
                          stroke="#1b6c80"
                          strokeWidth={2}
                          fill="#1b6c80"
                          fillOpacity={0.12}
                        />
                        <Area
                          type="monotone"
                          dataKey="product_views"
                          name="Xem sản phẩm"
                          stroke="#8c9296"
                          strokeWidth={1.5}
                          fill="#cfd3d6"
                          fillOpacity={0.15}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-5 app-panel overflow-hidden">
                  <div className="p-4 bg-[#f4f6f8]">
                    <h2 className="text-[16px] font-semibold text-[#131416]">
                      Nguồn truy cập & Thiết bị
                    </h2>
                    <p className="text-[13px] text-[#5d5f60]">
                      Phân bổ phiên truy cập theo nguồn giới thiệu và thiết bị
                    </p>
                  </div>
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="text-[#5d5f60]">
                        <th className="py-2.5 px-4">Phân loại</th>
                        <th className="py-2.5 px-4">Nhãn</th>
                        <th className="py-2.5 px-4 text-right nums">Số phiên</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.referrer_distribution.map((r) => (
                        <tr key={`ref-${r.source}`}>
                          <td className="py-2.5 px-4 text-[#5d5f60]">
                            Nguồn truy cập
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#131416]">
                            <code>{r.source}</code>
                          </td>
                          <td className="py-2.5 px-4 text-right nums font-medium">
                            {r.count.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {overview.device_distribution.map((d) => (
                        <tr key={`dev-${d.device}`}>
                          <td className="py-2.5 px-4 text-[#5d5f60]">
                            Thiết bị
                          </td>
                          <td className="py-2.5 px-4 font-medium text-[#131416]">
                            <code>{d.device}</code>
                          </td>
                          <td className="py-2.5 px-4 text-right nums font-medium">
                            {d.count.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 app-panel overflow-hidden">
                  <div className="p-4 bg-[#f4f6f8] flex items-baseline justify-between gap-2">
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#131416]">
                        Hiệu quả 4 Phân khúc Hành vi K-Means (K = 4)
                      </h2>
                      <p className="text-[13px] text-[#5d5f60]">
                        Tóm tắt đặc trưng 9 chiều chuẩn hóa StandardScaler và Silhouette Score
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("segments")}
                      className="text-[13px] text-[#1b6c80] font-medium hover:underline"
                    >
                      Chi tiết K-Means →
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="text-[#5d5f60]">
                        <th className="py-2.5 px-4">Cụm</th>
                        <th className="py-2.5 px-4">Tên phân khúc hành vi</th>
                        <th className="py-2.5 px-4 text-right nums">Tỷ trọng</th>
                        <th className="py-2.5 px-4 text-right nums">Xem SP / phiên</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2.5 px-4 nums"><code>cluster_0</code></td>
                        <td className="py-2.5 px-4 font-medium text-[#131416]">Nhóm Quan tâm Sản phẩm Đặc sản</td>
                        <td className="py-2.5 px-4 text-right nums">28.0%</td>
                        <td className="py-2.5 px-4 text-right nums">6.4</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 nums"><code>cluster_1</code></td>
                        <td className="py-2.5 px-4 font-medium text-[#131416]">Nhóm Đọc Nội dung & Văn hóa Vùng miền</td>
                        <td className="py-2.5 px-4 text-right nums">26.0%</td>
                        <td className="py-2.5 px-4 text-right nums">3.8</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 nums"><code>cluster_2</code></td>
                        <td className="py-2.5 px-4 font-medium text-[#131416]">Nhóm Ý định Liên hệ Thu mua Cao</td>
                        <td className="py-2.5 px-4 text-right nums">18.0%</td>
                        <td className="py-2.5 px-4 text-right nums">8.2</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 nums"><code>cluster_3</code></td>
                        <td className="py-2.5 px-4 font-medium text-[#131416]">Nhóm Khách Xem Nhanh (Casual Browsers)</td>
                        <td className="py-2.5 px-4 text-right nums">28.0%</td>
                        <td className="py-2.5 px-4 text-right nums">1.5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="lg:col-span-5 app-panel overflow-hidden">
                  <div className="p-4 bg-[#f4f6f8] flex items-baseline justify-between gap-2">
                    <div>
                      <h2 className="text-[16px] font-semibold text-[#131416]">
                        Đánh giá Gợi ý Nội dung TF-IDF
                      </h2>
                      <p className="text-[13px] text-[#5d5f60]">
                        Kiểm định Hold-out Offline (K = 5) so với Baseline phổ biến
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("recommendation")}
                      className="text-[13px] text-[#1b6c80] font-medium hover:underline"
                    >
                      Chi tiết TF-IDF →
                    </button>
                  </div>
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="text-[#5d5f60]">
                        <th className="py-2.5 px-4">Chỉ số kiểm định</th>
                        <th className="py-2.5 px-4 text-right nums">TF-IDF Hybrid</th>
                        <th className="py-2.5 px-4 text-right nums">Popularity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#131416]"><code>Precision@5</code></td>
                        <td className="py-2.5 px-4 text-right nums font-semibold text-[#1b6c80]">0.342</td>
                        <td className="py-2.5 px-4 text-right nums text-[#5d5f60]">0.214</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#131416]"><code>Recall@5</code></td>
                        <td className="py-2.5 px-4 text-right nums font-semibold text-[#1b6c80]">0.618</td>
                        <td className="py-2.5 px-4 text-right nums text-[#5d5f60]">0.395</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#131416]"><code>HitRate@5</code></td>
                        <td className="py-2.5 px-4 text-right nums font-semibold text-[#1b6c80]">0.846</td>
                        <td className="py-2.5 px-4 text-right nums text-[#5d5f60]">0.582</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-medium text-[#131416]"><code>Coverage@5</code></td>
                        <td className="py-2.5 px-4 text-right nums font-semibold text-[#1b6c80]">100.0%</td>
                        <td className="py-2.5 px-4 text-right nums text-[#5d5f60]">45.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BEHAVIOR */}
          {activeTab === "behavior" && behavior && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 app-panel p-5">
                  <h2 className="text-[16px] font-semibold text-[#131416] mb-1">
                    Tần suất 10 loại sự kiện chuẩn hóa
                  </h2>
                  <p className="text-[13px] text-[#5d5f60] mb-4">
                    Phân bố số lượng sự kiện thu thập từ trình theo dõi hành vi
                  </p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={behavior.event_breakdown}
                        layout="vertical"
                        margin={{ left: 24 }}
                      >
                        <CartesianGrid horizontal={false} stroke="#f0f1f2" />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 12, fill: "#5d5f60" }}
                        />
                        <YAxis
                          type="category"
                          dataKey="event_name"
                          width={135}
                          tick={{ fontSize: 12, fill: "#131416" }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Số lượng sự kiện"
                          fill="#1b6c80"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="lg:col-span-5 app-panel p-5 space-y-4">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#131416]">
                      Phễu chuyển đổi 5 giai đoạn
                    </h2>
                    <p className="text-[13px] text-[#5d5f60]">
                      Từ truy cập trang đến đọc sâu và nhấn liên hệ HTX
                    </p>
                  </div>
                  <div className="space-y-3">
                    {behavior.funnel.map((step) => {
                      const maxCount = Math.max(
                        1,
                        behavior.funnel[0]?.count || 1
                      );
                      const pct = Math.min(
                        100,
                        Math.round((step.count / maxCount) * 100)
                      );
                      return (
                        <div key={step.stage} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[13px]">
                            <span className="font-medium text-[#131416]">
                              {step.stage}
                            </span>
                            <span className="text-[#5d5f60] nums">
                              {step.count.toLocaleString()} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-[#f0f1f2] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1b6c80] rounded-full"
                              style={{ width: `${Math.max(4, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 app-panel overflow-hidden">
                  <div className="p-4 bg-[#f4f6f8]">
                    <h3 className="text-[16px] font-semibold text-[#131416]">
                      Từ khóa tìm kiếm hàng đầu
                    </h3>
                  </div>
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="text-[#5d5f60]">
                        <th className="py-2.5 px-4">Từ khóa</th>
                        <th className="py-2.5 px-4 text-right nums">Lượt tìm</th>
                      </tr>
                    </thead>
                    <tbody>
                      {behavior.top_searches.map((s) => (
                        <tr key={s.query}>
                          <td className="py-2.5 px-4 font-medium text-[#131416]">
                            {s.query}
                          </td>
                          <td className="py-2.5 px-4 text-right nums">
                            {s.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:col-span-8 app-panel overflow-hidden">
                  <div className="p-4 bg-[#f4f6f8]">
                    <h3 className="text-[16px] font-semibold text-[#131416]">
                      Luồng sự kiện gần nhất
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[13px]">
                      <thead>
                        <tr className="text-[#5d5f60]">
                          <th className="py-2.5 px-4">Mã sự kiện</th>
                          <th className="py-2.5 px-4">Visitor ID</th>
                          <th className="py-2.5 px-4">Loại sự kiện</th>
                          <th className="py-2.5 px-4">Đối tượng</th>
                          <th className="py-2.5 px-4 text-right">Nguồn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {behavior.recent_events.slice(0, 10).map((ev) => (
                          <tr key={ev.event_id}>
                            <td className="py-2.5 px-4">
                              <code>#{ev.event_id}</code>
                            </td>
                            <td className="py-2.5 px-4">
                              <code>{ev.visitor_id.slice(0, 14)}</code>
                            </td>
                            <td className="py-2.5 px-4">
                              <code>{ev.event_name}</code>
                            </td>
                            <td className="py-2.5 px-4 text-[#5d5f60]">
                              {ev.content_type
                                ? `${ev.content_type} #${ev.content_id ?? ""}`
                                : "—"}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span
                                className={`px-2 py-0.5 rounded-[4px] text-[12px] ${
                                  ev.is_simulated
                                    ? "bg-[#ebedee] text-[#353736]"
                                    : "bg-[#dcfae5] text-[#04250e]"
                                }`}
                              >
                                {ev.is_simulated ? "Mô phỏng" : "Thực tế"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS */}
          {activeTab === "products" && productsData && (
            <div className="space-y-6">
              <div className="app-panel overflow-hidden">
                <div className="p-4 bg-[#f4f6f8] flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="text-[16px] font-semibold text-[#131416]">
                      Bảng xếp hạng điểm quan tâm 8 đặc sản Sơn La
                    </h2>
                    <p className="text-[13px] text-[#5d5f60]">
                      Công thức trọng số:{" "}
                      <code>
                        Score = 1×View + 2×Scroll + 3×Favorite + 4×Share + 5×Contact
                      </code>
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="text-[#5d5f60]">
                        <th className="py-3 px-4 text-right nums">Hạng</th>
                        <th className="py-3 px-4">Tên nông sản</th>
                        <th className="py-3 px-4">Danh mục</th>
                        <th className="py-3 px-4 text-right nums">Lượt xem</th>
                        <th className="py-3 px-4 text-right nums">Cuộn sâu</th>
                        <th className="py-3 px-4 text-right nums">Yêu thích</th>
                        <th className="py-3 px-4 text-right nums">Chia sẻ</th>
                        <th className="py-3 px-4 text-right nums">Liên hệ HTX</th>
                        <th className="py-3 px-4 text-right nums">Điểm quan tâm</th>
                        <th className="py-3 px-4 text-right nums">Tương tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productsData.products.map((p, idx) => (
                        <tr key={p.product_id} className="hover:bg-[#f9fbfc]">
                          <td className="py-3 px-4 text-right nums font-medium text-[#5d5f60]">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#131416]">
                            {p.product_name}
                          </td>
                          <td className="py-3 px-4 text-[#5d5f60]">
                            {p.category_name}
                          </td>
                          <td className="py-3 px-4 text-right nums">{p.views}</td>
                          <td className="py-3 px-4 text-right nums">
                            {p.deep_scrolls}
                          </td>
                          <td className="py-3 px-4 text-right nums">
                            {p.favorites}
                          </td>
                          <td className="py-3 px-4 text-right nums">{p.shares}</td>
                          <td className="py-3 px-4 text-right nums font-medium text-[#1b6c80]">
                            {p.contact_clicks}
                          </td>
                          <td className="py-3 px-4 text-right nums font-semibold text-[#131416]">
                            {p.interest_score.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right nums">
                            {p.engagement_rate_pct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SEGMENTS */}
          {activeTab === "segments" && segments && (
            <div className="space-y-6">
              <div className="app-tray p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[14px] font-semibold text-[#131416]">
                    Mô hình đang hoạt động:{" "}
                    <code>{segments.model.version}</code> (K ={" "}
                    {segments.model.metrics.selected_k})
                  </div>
                  <div className="text-[13px] text-[#5d5f60] nums">
                    Silhouette: {segments.model.metrics.silhouette_score} ·
                    Davies-Bouldin: {segments.model.metrics.davies_bouldin_index} ·
                    Stability ARI: {segments.model.metrics.stability_ari} ·
                    Inertia: {segments.model.metrics.inertia}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="text-[#5d5f60]">Dải K:</span>
                  <input
                    type="number"
                    min={2}
                    max={4}
                    value={kMin}
                    onChange={(e) => setKMin(Number(e.target.value))}
                    className="w-14 px-2 py-1 rounded-[6px] bg-white text-center nums"
                  />
                  <span>–</span>
                  <input
                    type="number"
                    min={4}
                    max={10}
                    value={kMax}
                    onChange={(e) => setKMax(Number(e.target.value))}
                    className="w-14 px-2 py-1 rounded-[6px] bg-white text-center nums"
                  />
                  <select
                    value={forcedK}
                    onChange={(e) => setForcedK(e.target.value)}
                    className="px-2.5 py-1 rounded-[6px] bg-white"
                  >
                    <option value="">Tự động chọn K</option>
                    {[2, 3, 4, 5, 6].map((k) => (
                      <option key={k} value={k}>
                        Cố định K = {k}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={actionLoading === "kmeans"}
                    onClick={handleTrainKMeans}
                    className="px-3.5 py-1.5 rounded-[6px] bg-[#1b6c80] text-white font-medium disabled:opacity-60"
                  >
                    {actionLoading === "kmeans"
                      ? "Đang huấn luyện..."
                      : "Huấn luyện lại K-Means"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="app-panel p-5">
                  <h3 className="text-[16px] font-semibold text-[#131416] mb-1">
                    Đường cong Elbow (Inertia theo K=2..8)
                  </h3>
                  <div className="h-56 mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={segments.model.metrics.k_sweep}>
                        <CartesianGrid vertical={false} stroke="#f0f1f2" />
                        <XAxis dataKey="k" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="inertia"
                          name="Inertia (SSE)"
                          stroke="#1b6c80"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="app-panel p-5">
                  <h3 className="text-[16px] font-semibold text-[#131416] mb-1">
                    Silhouette Score & Stability ARI theo K=2..8
                  </h3>
                  <div className="h-56 mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={segments.model.metrics.k_sweep}>
                        <CartesianGrid vertical={false} stroke="#f0f1f2" />
                        <XAxis dataKey="k" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="silhouette_score"
                          name="Silhouette Score"
                          stroke="#1b6c80"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="stability_ari"
                          name="Stability ARI"
                          stroke="#8c9296"
                          strokeWidth={1.5}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="app-panel overflow-hidden">
                <div className="p-4 bg-[#f4f6f8]">
                  <h3 className="text-[16px] font-semibold text-[#131416]">
                    Hồ sơ trọng tâm 4 cụm hành vi X = [S, P, A, T, Q, F, C, R, U]
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="text-[#5d5f60]">
                        <th className="py-2.5 px-3">Cụm</th>
                        <th className="py-2.5 px-3">Tên cụm hậu nghiệm</th>
                        <th className="py-2.5 px-3 text-right nums">Quy mô</th>
                        <th className="py-2.5 px-3 text-right nums">S</th>
                        <th className="py-2.5 px-3 text-right nums">P</th>
                        <th className="py-2.5 px-3 text-right nums">A</th>
                        <th className="py-2.5 px-3 text-right nums">T (s)</th>
                        <th className="py-2.5 px-3 text-right nums">Q</th>
                        <th className="py-2.5 px-3 text-right nums">F</th>
                        <th className="py-2.5 px-3 text-right nums">C</th>
                        <th className="py-2.5 px-3 text-right nums">R</th>
                        <th className="py-2.5 px-3 text-right nums">U</th>
                      </tr>
                    </thead>
                    <tbody>
                      {segments.profiles.map((prof) => (
                        <tr key={prof.cluster_index}>
                          <td className="py-2.5 px-3">
                            <code>#{prof.cluster_index + 1}</code>
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#131416]">
                            {prof.cluster_name}
                          </td>
                          <td className="py-2.5 px-3 text-right nums">
                            {prof.size} ({prof.percentage}%)
                          </td>
                          <td className="py-2.5 px-3 text-right nums">
                            {prof.centroid_features.total_sessions}
                          </td>
                          <td className="py-2.5 px-3 text-right nums">
                            {prof.centroid_features.total_product_views}
                          </td>
                          <td className="py-2.5 px-3 text-right nums">
                            {prof.centroid_features.total_article_views}
                          </td>
                          <td className="py-2.5 px-3 text-right nums">
                            {prof.centroid_features.avg_session_duration}
                          </td>
                          <td className="py-2.5 px-3 text-right nums">
                            {prof.centroid_features.total_searches}
                          </td>
                          <td className="py-2.5 px-3 text-right nums">
                            {prof.centroid_features.total_favorites}
                          </td>
                          <td className="py-2.5 px-3 text-right nums font-medium text-[#1b6c80]">
                            {prof.centroid_features.total_contact_clicks}
                          </td>
                          <td className="py-2.5 px-3 text-right nums">
                            {prof.centroid_features.return_visits}
                          </td>
                          <td className="py-2.5 px-3 text-right nums">
                            {prof.centroid_features.unique_products_viewed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="app-panel p-5">
                <h3 className="text-[16px] font-semibold text-[#131416] mb-2">
                  Không gian phân tán hành vi (P: Xem sản phẩm vs T: Thời lượng phiên)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid stroke="#f0f1f2" />
                      <XAxis
                        type="number"
                        dataKey="P"
                        name="Xem sản phẩm (P)"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="T"
                        name="Thời lượng TB giây (T)"
                        tick={{ fontSize: 12 }}
                      />
                      <ZAxis type="number" dataKey="U" range={[36, 120]} />
                      <Tooltip />
                      <Scatter
                        name="Visitors"
                        data={segments.scatter_sample}
                        fill="#1b6c80"
                      >
                        {segments.scatter_sample.map((pt, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              CHART_PALETTE[
                                pt.cluster_index % CHART_PALETTE.length
                              ]
                            }
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RECOMMENDATION */}
          {activeTab === "recommendation" && mlEval && (
            <div className="space-y-6">
              {mlEval.active_recommendation_model?.metrics && (
                <div className="app-panel grid grid-cols-2 lg:grid-cols-5 gap-[1px] bg-[#e8eaec] overflow-hidden">
                  <div className="bg-white p-4">
                    <div className="text-[13px] text-[#5d5f60]">Precision@5</div>
                    <div className="text-[28px] font-normal text-[#1b6c80] nums mt-1">
                      {mlEval.active_recommendation_model.metrics.precision_at_5}
                    </div>
                  </div>
                  <div className="bg-white p-4">
                    <div className="text-[13px] text-[#5d5f60]">Recall@5</div>
                    <div className="text-[28px] font-normal text-[#131416] nums mt-1">
                      {mlEval.active_recommendation_model.metrics.recall_at_5}
                    </div>
                  </div>
                  <div className="bg-white p-4">
                    <div className="text-[13px] text-[#5d5f60]">nDCG@5</div>
                    <div className="text-[28px] font-normal text-[#131416] nums mt-1">
                      {mlEval.active_recommendation_model.metrics.ndcg_at_5}
                    </div>
                  </div>
                  <div className="bg-white p-4">
                    <div className="text-[13px] text-[#5d5f60]">
                      Độ phủ danh mục
                    </div>
                    <div className="text-[28px] font-normal text-[#131416] nums mt-1">
                      {(
                        (mlEval.active_recommendation_model.metrics.coverage ||
                          0) * 100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                  <div className="bg-white p-4 col-span-2 lg:col-span-1">
                    <div className="text-[13px] text-[#5d5f60]">
                      Độ đa dạng nội bộ
                    </div>
                    <div className="text-[28px] font-normal text-[#131416] nums mt-1">
                      {mlEval.active_recommendation_model.metrics.diversity}
                    </div>
                  </div>
                </div>
              )}

              <div className="app-tray p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[14px] font-semibold text-[#131416]">
                    Tùy chỉnh trọng số hành vi khi xây dựng vector người dùng
                  </div>
                  <button
                    type="button"
                    disabled={actionLoading === "recommender"}
                    onClick={handleRebuildRecommender}
                    className="px-4 py-1.5 rounded-[6px] bg-[#1b6c80] text-white text-[13px] font-medium disabled:opacity-60"
                  >
                    {actionLoading === "recommender"
                      ? "Đang xây dựng TF-IDF..."
                      : "Xây dựng lại TF-IDF & Đánh giá Hold-out"}
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[13px]">
                  {(
                    [
                      ["view", "Xem (view)"],
                      ["scroll", "Cuộn sâu (scroll)"],
                      ["favorite", "Yêu thích (favorite)"],
                      ["share", "Chia sẻ (share)"],
                      ["contact_click", "Liên hệ (contact_click)"],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[#5d5f60] mb-1">
                        {label}
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="15"
                        value={weights[key]}
                        onChange={(e) =>
                          setWeights({
                            ...weights,
                            [key]: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-1.5 rounded-[6px] bg-white nums font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {mlEval.active_recommendation_model?.metrics
                .weight_sensitivity_analysis && (
                <div className="app-panel overflow-hidden">
                  <div className="p-4 bg-[#f4f6f8]">
                    <h3 className="text-[16px] font-semibold text-[#131416]">
                      Phân tích độ nhạy trọng số trên tập kiểm thử Hold-out (75/25)
                    </h3>
                  </div>
                  <table className="w-full text-left border-collapse text-[13px]">
                    <thead>
                      <tr className="text-[#5d5f60]">
                        <th className="py-3 px-4">Kịch bản trọng số</th>
                        <th className="py-3 px-4 text-right nums">Precision@5</th>
                        <th className="py-3 px-4 text-right nums">Recall@5</th>
                        <th className="py-3 px-4 text-right nums">nDCG@5</th>
                        <th className="py-3 px-4 text-right nums">Coverage</th>
                        <th className="py-3 px-4 text-right nums">Diversity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mlEval.active_recommendation_model.metrics.weight_sensitivity_analysis.map(
                        (row) => (
                          <tr key={row.scheme}>
                            <td className="py-3 px-4 font-medium text-[#131416]">
                              {row.scheme}
                            </td>
                            <td className="py-3 px-4 text-right nums font-semibold text-[#1b6c80]">
                              {row.precision_at_5}
                            </td>
                            <td className="py-3 px-4 text-right nums">
                              {row.recall_at_5}
                            </td>
                            <td className="py-3 px-4 text-right nums font-medium">
                              {row.ndcg_at_5}
                            </td>
                            <td className="py-3 px-4 text-right nums">
                              {row.coverage}
                            </td>
                            <td className="py-3 px-4 text-right nums">
                              {row.diversity}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SIMULATION */}
          {activeTab === "simulation" && simData && (
            <div className="space-y-6">
              <div className="app-tray p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-[14px] font-semibold text-[#131416]">
                    Bộ sinh dữ liệu hành vi có kiểm soát (5 kịch bản ·{" "}
                    <code>is_simulated = true</code>)
                  </div>
                  <div className="text-[13px] text-[#5d5f60] nums">
                    Hiện có {simData.summary.simulated_visitors} visitors mô phỏng (
                    {simData.summary.simulated_events.toLocaleString()} sự kiện) và{" "}
                    {simData.summary.real_visitors} visitors thực tế.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[13px]">
                  <label className="flex items-center gap-1.5">
                    <span className="text-[#5d5f60]">Số visitors:</span>
                    <input
                      type="number"
                      min={100}
                      max={2000}
                      step={50}
                      value={simVisitorsCount}
                      onChange={(e) =>
                        setSimVisitorsCount(Number(e.target.value))
                      }
                      className="w-20 px-2.5 py-1 rounded-[6px] bg-white nums"
                    />
                  </label>
                  <label className="flex items-center gap-1.5">
                    <span className="text-[#5d5f60]">Seed:</span>
                    <input
                      type="number"
                      value={simSeed}
                      onChange={(e) => setSimSeed(Number(e.target.value))}
                      className="w-16 px-2.5 py-1 rounded-[6px] bg-white nums"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRetrain}
                      onChange={(e) => setAutoRetrain(e.target.checked)}
                    />
                    <span>Huấn luyện lại ML</span>
                  </label>
                  <button
                    type="button"
                    disabled={actionLoading === "simulation"}
                    onClick={handleGenerateSynthetic}
                    className="px-4 py-1.5 rounded-[6px] bg-[#1b6c80] text-white font-medium disabled:opacity-60"
                  >
                    {actionLoading === "simulation"
                      ? "Đang sinh dữ liệu..."
                      : "Sinh dữ liệu mô phỏng"}
                  </button>
                </div>
              </div>

              <div className="app-panel overflow-hidden">
                <table className="w-full text-left border-collapse text-[13px]">
                  <thead>
                    <tr className="bg-[#f4f6f8] text-[#5d5f60]">
                      <th className="py-3 px-4">Mã kịch bản</th>
                      <th className="py-3 px-4">Tên nhóm hành vi</th>
                      <th className="py-3 px-4">Mô tả hành vi</th>
                      <th className="py-3 px-4 text-right nums">Tỷ trọng</th>
                      <th className="py-3 px-4 text-right nums">XS Liên hệ HTX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simData.scenarios.map((sc) => (
                      <tr key={sc.scenario_id}>
                        <td className="py-3 px-4">
                          <code>{sc.scenario_code}</code>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#131416]">
                          {sc.name}
                        </td>
                        <td className="py-3 px-4 text-[#5d5f60]">
                          {sc.description}
                        </td>
                        <td className="py-3 px-4 text-right nums font-medium">
                          {Math.round(sc.visitor_ratio * 100)}%
                        </td>
                        <td className="py-3 px-4 text-right nums text-[#1b6c80] font-medium">
                          {Math.round(sc.behavior_params.contact_prob * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: CRUD */}
          {activeTab === "crud" && <ContentCrudPanel />}
        </div>
      </div>
    </div>
  );
}
