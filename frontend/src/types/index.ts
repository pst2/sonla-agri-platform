export type EventName =
  | "page_view"
  | "product_view"
  | "article_view"
  | "search"
  | "scroll"
  | "favorite"
  | "share"
  | "contact_click"
  | "recommendation_view"
  | "recommendation_click";

export interface LocationItem {
  location_id: number;
  name: string;
  slug: string;
  province?: string;
  district: string;
  altitude?: string | null;
  climate?: string | null;
  soil_type?: string | null;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CategoryItem {
  category_id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  display_order: number;
  product_count?: number;
}

export interface ArticleBrief {
  article_id: number;
  title: string;
  slug: string;
  excerpt: string;
  content_type: string;
  image_url?: string | null;
  reading_time_minutes: number;
  published_at: string;
  view_count: number;
}

export interface ProductBrief {
  product_id: number;
  product_name: string;
  slug: string;
  category_id: number;
  location_id: number;
  origin: string;
  short_description?: string | null;
  image_url: string;
  season?: string | null;
  certification?: string | null;
  verification_status: string;
  view_count: number;
  favorite_count: number;
}

export interface ProductItem {
  product_id: number;
  product_name: string;
  slug: string;
  category_id: number;
  location_id: number;
  origin: string;
  short_description?: string | null;
  description: string;
  ingredients: string;
  production_process: string;
  characteristics: string;
  traditional_value: string;
  keywords: string;
  image_url: string;
  season?: string | null;
  certification?: string | null;
  producer?: string | null;
  source_reference: string;
  verification_status: string;
  view_count: number;
  favorite_count: number;
  contact_click_count: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: CategoryItem | null;
  location?: LocationItem | null;
  articles: ArticleBrief[];
}

export interface ArticleItem {
  article_id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  content_type: string;
  image_url?: string | null;
  author?: string | null;
  reading_time_minutes: number;
  keywords?: string | null;
  source_reference?: string | null;
  published_at: string;
  status: string;
  view_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
  products: ProductBrief[];
}

export interface RecommendationCandidate {
  rank: number;
  content_type: "product" | "article";
  content_id: number;
  title: string;
  slug: string;
  category_name: string;
  origin: string;
  image_url?: string | null;
  short_description: string;
  certification?: string | null;
  score: number;
  reason: string;
}

export interface RecommendationsResponse {
  visitor_id: string;
  model_version: string;
  strategy: "content_based" | "cold_start_related" | "cold_start_popular";
  count: number;
  items: RecommendationCandidate[];
}

export interface FavoritesResponse {
  visitor_id: string;
  favorites: Array<{
    favorite_id: number;
    content_type: "product" | "article";
    content_id: number;
    created_at: string;
  }>;
  products: ProductItem[];
  articles: ArticleItem[];
}

export interface AdminUserInfo {
  admin_id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
}

export interface AnalyticsOverviewResponse {
  period_days: number;
  include_simulated: boolean;
  kpis: {
    total_visitors: number;
    real_visitors: number;
    simulated_visitors: number;
    total_sessions: number;
    total_events: number;
    product_views: number;
    article_views: number;
    total_favorites: number;
    contact_clicks: number;
    avg_session_duration_seconds: number;
    contact_conversion_rate_pct: number;
    total_products: number;
    total_articles: number;
  };
  daily_traffic: Array<{
    date: string;
    total_events: number;
    product_views: number;
    article_views: number;
    interactions: number;
  }>;
  referrer_distribution: Array<{
    source: string;
    count: number;
  }>;
  device_distribution: Array<{
    device: string;
    count: number;
  }>;
}

export interface ProductAnalyticsItem {
  product_id: number;
  product_name: string;
  slug: string;
  category_name: string;
  location_name: string;
  certification?: string | null;
  views: number;
  unique_visitors: number;
  deep_scrolls: number;
  favorites: number;
  shares: number;
  contact_clicks: number;
  recommendation_clicks: number;
  interest_score: number;
  engagement_rate_pct: number;
}

export interface AnalyticsProductsResponse {
  period_days: number;
  products: ProductAnalyticsItem[];
  category_breakdown: Array<{
    category_name: string;
    views: number;
    favorites: number;
    contacts: number;
    interest_score: number;
  }>;
}

export interface AnalyticsBehaviorResponse {
  period_days: number;
  event_breakdown: Array<{
    event_name: string;
    label: string;
    count: number;
  }>;
  funnel: Array<{
    stage: string;
    count: number;
  }>;
  top_searches: Array<{
    query: string;
    count: number;
  }>;
  recent_events: Array<{
    event_id: number;
    visitor_id: string;
    session_id: string;
    event_name: string;
    content_type?: string | null;
    content_id?: number | null;
    is_simulated: boolean;
    occurred_at: string;
    properties?: Record<string, unknown>;
  }>;
}

export interface ClusterProfileItem {
  cluster_index: number;
  cluster_name: string;
  cluster_description: string;
  size: number;
  percentage: number;
  centroid_features: Record<string, number>;
  dominant_characteristics: Array<{
    feature: string;
    ratio_vs_mean: number;
    value: number;
  }>;
  recommended_strategy: string;
}

export interface AnalyticsSegmentsResponse {
  model: {
    model_id: number;
    version: string;
    trained_at: string;
    parameters: Record<string, unknown>;
    metrics: {
      selected_k: number;
      inertia: number;
      silhouette_score: number;
      davies_bouldin_index: number;
      stability_ari: number;
      k_sweep: Array<{
        k: number;
        inertia: number;
        silhouette_score: number;
        davies_bouldin_index: number;
        stability_ari: number;
        min_cluster_pct: number;
      }>;
      feature_distributions?: Record<string, Record<string, number>>;
    };
  };
  feature_Metadata: Array<{
    column: string;
    label: string;
  }>;
  profiles: ClusterProfileItem[];
  scatter_sample: Array<{
    visitor_id: string;
    cluster_index: number;
    distance: number;
    S: number;
    P: number;
    A: number;
    T: number;
    Q: number;
    F: number;
    C: number;
    R: number;
    U: number;
  }>;
}

export interface MLEvaluationsResponse {
  active_clustering_model: {
    model_id: number;
    version: string;
    trained_at: string;
    parameters: Record<string, unknown>;
    metrics: Record<string, unknown>;
  } | null;
  active_recommendation_model: {
    model_id: number;
    version: string;
    trained_at: string;
    parameters: {
      weights?: Record<string, number>;
      top_k?: number;
      total_contents?: number;
      vocab_size?: number;
    };
    metrics: {
      evaluated_visitors?: number;
      precision_at_5?: number;
      recall_at_5?: number;
      ndcg_at_5?: number;
      coverage?: number;
      diversity?: number;
      evaluation_protocol?: string;
      weight_sensitivity_analysis?: Array<{
        scheme: string;
        weights: Record<string, number>;
        evaluated_visitors: number;
        precision_at_5: number;
        recall_at_5: number;
        ndcg_at_5: number;
        coverage: number;
        diversity: number;
      }>;
    };
  } | null;
  recommendation_Traffic_stats: {
    total_api_logs: number;
    recommendation_views: number;
    recommendation_clicks: number;
    ctr_pct: number;
    strategy_distribution: Array<{
      strategy: string;
      count: number;
    }>;
  };
  model_history: Array<{
    model_id: number;
    model_name: string;
    model_type: string;
    version: string;
    is_active: boolean;
    trained_at: string;
    parameters: Record<string, unknown>;
    metrics: Record<string, unknown>;
  }>;
}

export interface SimulationScenarioItem {
  scenario_id: number;
  scenario_code: string;
  name: string;
  description: string;
  visitor_ratio: number;
  behavior_params: {
    sessions_range: [number, number];
    product_views_per_session: [number, number];
    article_views_per_session: [number, number];
    duration_seconds_range: [number, number];
    search_prob: number;
    favorite_prob: number;
    share_prob: number;
    contact_prob: number;
    scroll_prob: number;
    preferred_categories: number[];
  };
  last_run_at?: string | null;
}

export interface SimulationScenariosResponse {
  summary: {
    simulated_visitors: number;
    real_visitors: number;
    simulated_sessions: number;
    simulated_events: number;
  };
  scenarios: SimulationScenarioItem[];
}
