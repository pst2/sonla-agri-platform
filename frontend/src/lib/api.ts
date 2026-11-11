import {
  ArticleItem,
  CategoryItem,
  FavoritesResponse,
  LocationItem,
  ProductItem,
  RecommendationsResponse,
  AnalyticsOverviewResponse,
  AnalyticsProductsResponse,
  AnalyticsBehaviorResponse,
  AnalyticsSegmentsResponse,
  MLEvaluationsResponse,
  SimulationScenariosResponse,
  AdminUserInfo,
} from "@/types";
import { getVisitorId, getSessionId } from "@/lib/tracker";

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:8000/api/v1`;
  }
  return "http://localhost:8000/api/v1";
}

export const API_BASE_URL = "http://localhost:8000/api/v1";

const ADMIN_TOKEN_KEY = "agri_admin_token";
const ADMIN_USER_KEY = "agri_admin_user";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminSession(token: string, admin: AdminUserInfo) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}

export function getStoredAdminUser(): AdminUserInfo | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUserInfo;
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    let errDetail = `Lá»—i HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      if (errBody.detail) errDetail = errBody.detail;
    } catch {
      // ignore
    }
    throw new Error(errDetail);
  }
  return res.json() as Promise<T>;
}

async function fetchAdminJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  return fetchJson<T>(url, {
    ...init,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
}

// â”€â”€â”€ PUBLIC API â”€â”€â”€

export async function fetchCategoriesAndLocations(): Promise<{
  categories: CategoryItem[];
  locations: LocationItem[];
}> {
  return fetchJson(`${getApiBaseUrl()}/categories`);
}

export async function fetchProducts(params?: {
  category_id?: number;
  category_slug?: string;
  location_id?: number;
  q?: string;
  sort?: "featured" | "popular" | "favorites";
}): Promise<{ total: number; items: ProductItem[] }> {
  const sp = new URLSearchParams();
  if (params?.category_id) sp.set("category_id", String(params.category_id));
  if (params?.category_slug) sp.set("category_slug", params.category_slug);
  if (params?.location_id) sp.set("location_id", String(params.location_id));
  if (params?.q) sp.set("q", params.q);
  if (params?.sort) sp.set("sort", params.sort);
  const qs = sp.toString();
  return fetchJson(`${getApiBaseUrl()}/products${qs ? `?${qs}` : ""}`);
}

export async function fetchProductDetail(
  idOrSlug: string | number
): Promise<ProductItem> {
  return fetchJson(`${getApiBaseUrl()}/products/${idOrSlug}`);
}

export async function fetchArticles(params?: {
  content_type?: string;
  product_id?: number;
  q?: string;
  limit?: number;
}): Promise<{ total: number; items: ArticleItem[] }> {
  const sp = new URLSearchParams();
  if (params?.content_type) sp.set("content_type", params.content_type);
  if (params?.product_id) sp.set("product_id", String(params.product_id));
  if (params?.q) sp.set("q", params.q);
  if (params?.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return fetchJson(`${getApiBaseUrl()}/articles${qs ? `?${qs}` : ""}`);
}

export async function fetchArticleDetail(
  idOrSlug: string | number
): Promise<ArticleItem> {
  return fetchJson(`${getApiBaseUrl()}/articles/${idOrSlug}`);
}

export async function fetchUnifiedSearch(
  q: string,
  category_id?: number
): Promise<{
  query: string;
  product_count: number;
  article_count: number;
  products: ProductItem[];
  articles: ArticleItem[];
}> {
  const sp = new URLSearchParams({ q });
  if (category_id) sp.set("category_id", String(category_id));
  return fetchJson(`${getApiBaseUrl()}/search?${sp.toString()}`);
}

export async function fetchRecommendations(params?: {
  visitor_id?: string;
  current_content_type?: "product" | "article";
  current_content_id?: number;
  target_type?: "product" | "article";
  limit?: number;
}): Promise<RecommendationsResponse> {
  const sp = new URLSearchParams();
  const vid = params?.visitor_id || getVisitorId();
  const sid = getSessionId();
  if (vid) sp.set("visitor_id", vid);
  if (sid) sp.set("session_id", sid);
  if (params?.current_content_type)
    sp.set("current_content_type", params.current_content_type);
  if (params?.current_content_id)
    sp.set("current_content_id", String(params.current_content_id));
  if (params?.target_type) sp.set("target_type", params.target_type);
  if (params?.limit) sp.set("limit", String(params.limit));
  return fetchJson(`${getApiBaseUrl()}/recommendations?${sp.toString()}`);
}

export async function fetchVisitorFavorites(
  visitor_id?: string
): Promise<FavoritesResponse> {
  const vid = visitor_id || getVisitorId();
  return fetchJson(
    `${getApiBaseUrl()}/favorites?visitor_id=${encodeURIComponent(vid)}`
  );
}

export async function toggleFavoriteItem(
  content_type: "product" | "article",
  content_id: number
): Promise<{
  status: "added" | "removed";
  visitor_id: string;
  content_type: string;
  content_id: number;
}> {
  const visitor_id = getVisitorId();
  const session_id = getSessionId();
  return fetchJson(`${getApiBaseUrl()}/favorites`, {
    method: "POST",
    body: JSON.stringify({
      visitor_id,
      session_id,
      content_type,
      content_id,
    }),
  });
}

// â”€â”€â”€ ADMIN API â”€â”€â”€

export async function adminLogin(
  username: string,
  password: string
): Promise<{
  access_token: string;
  token_type: string;
  admin: AdminUserInfo;
}> {
  return fetchJson(`${getApiBaseUrl()}/admin/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchAnalyticsOverview(
  days = 30,
  includeSimulated = true
): Promise<AnalyticsOverviewResponse> {
  return fetchAdminJson(
    `${getApiBaseUrl()}/admin/analytics/overview?days=${days}&include_simulated=${includeSimulated}`
  );
}

export async function fetchAnalyticsProducts(
  days = 30,
  includeSimulated = true
): Promise<AnalyticsProductsResponse> {
  return fetchAdminJson(
    `${getApiBaseUrl()}/admin/analytics/products?days=${days}&include_simulated=${includeSimulated}`
  );
}

export async function fetchAnalyticsBehavior(
  days = 30,
  includeSimulated = true
): Promise<AnalyticsBehaviorResponse> {
  return fetchAdminJson(
    `${getApiBaseUrl()}/admin/analytics/behavior?days=${days}&include_simulated=${includeSimulated}`
  );
}

export async function fetchAnalyticsSegments(): Promise<AnalyticsSegmentsResponse> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/analytics/segments`);
}

export async function triggerKMeansTraining(payload: {
  k_min?: number;
  k_max?: number;
  forced_k?: number | null;
  include_simulated?: boolean;
  random_seed?: number;
}): Promise<Record<string, unknown>> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/ml/clustering/train`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function triggerRecommendationBuild(payload: {
  weights?: Record<string, number>;
  top_k?: number;
}): Promise<Record<string, unknown>> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/ml/recommendation/build`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchMLEvaluations(): Promise<MLEvaluationsResponse> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/ml/evaluations`);
}

export async function fetchSimulationScenarios(): Promise<SimulationScenariosResponse> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/simulation/scenarios`);
}

export async function triggerSimulationGenerate(payload: {
  num_visitors: number;
  random_seed: number;
  clear_existing_simulated: boolean;
  auto_retrain_models: boolean;
}): Promise<Record<string, unknown>> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/simulation/generate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminCreateProduct(
  payload: Record<string, unknown>
): Promise<ProductItem> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/products`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateProduct(
  productId: number,
  payload: Record<string, unknown>
): Promise<ProductItem> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteProduct(
  productId: number
): Promise<{ status: string }> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/products/${productId}`, {
    method: "DELETE",
  });
}

export async function adminCreateArticle(
  payload: Record<string, unknown>
): Promise<ArticleItem> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/articles`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateArticle(
  articleId: number,
  payload: Record<string, unknown>
): Promise<ArticleItem> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/articles/${articleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function adminDeleteArticle(
  articleId: number
): Promise<{ status: string }> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/articles/${articleId}`, {
    method: "DELETE",
  });
}

export async function adminCreateCategory(
  payload: Record<string, unknown>
): Promise<CategoryItem> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/categories`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateCategory(
  categoryId: number,
  payload: Record<string, unknown>
): Promise<CategoryItem> {
  return fetchAdminJson(`${getApiBaseUrl()}/admin/categories/${categoryId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

