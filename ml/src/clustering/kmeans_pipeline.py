from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.metrics import adjusted_rand_score, davies_bouldin_score, silhouette_score
from sklearn.preprocessing import StandardScaler
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import ClusterProfile, ClusterResult, MLModel
from ml.src.features.feature_builder import FEATURE_COLUMNS, get_feature_dataframe


def _interpret_cluster_centroid(
    cluster_idx: int,
    centroid_raw: Dict[str, float],
    overall_means: Dict[str, float],
    used_names: set,
) -> Dict[str, Any]:
    """
    Post-hoc data-driven interpretation of cluster centroids (Section 12.4:
    'Không đặt trước số cụm dựa trên tên nhóm mong muốn. Số cụm và tên cụm phải được quyết định sau khi phân tích kết quả.')
    """
    ratios = {}
    for col in FEATURE_COLUMNS:
        base = max(overall_means.get(col, 1.0), 0.1)
        ratios[col] = centroid_raw[col] / base

    # Determine dominant characteristics by highest z/ratio over population mean
    sorted_traits = sorted(ratios.items(), key=lambda x: x[1], reverse=True)
    top_trait, top_ratio = sorted_traits[0]

    # Data-driven naming based on empirical centroid ratios
    if centroid_raw["total_contact_clicks"] >= max(overall_means["total_contact_clicks"] * 1.6, 0.8):
        name = "Nhóm quan tâm sâu & có ý định liên hệ cao"
        desc = (
            f"Người truy cập có tần suất quay lại cao ({centroid_raw['return_visits']:.1f} lần), "
            f"xem trung bình {centroid_raw['total_product_views']:.1f} lượt sản phẩm và chủ động nhấn liên hệ "
            f"({centroid_raw['total_contact_clicks']:.1f} lần)."
        )
        strategy = "Ưu tiên hiển thị thông tin chứng nhận OCOP/VietGAP, nguồn gốc HTX và nút kết nối nhanh với nhà sản xuất."
    elif centroid_raw["total_article_views"] >= overall_means["total_article_views"] * 1.35:
        name = "Nhóm độc giả yêu thích văn hóa & câu chuyện bản địa"
        desc = (
            f"Dành nhiều thời gian tương tác ({centroid_raw['avg_session_duration']:.0f}s/phiên) và đọc nhiều bài viết "
            f"({centroid_raw['total_article_views']:.1f} bài) về quy trình canh tác, văn hóa vùng trồng Sơn La."
        )
        strategy = "Đề xuất các bài viết chuyên sâu về lịch sử vùng nguyên liệu, quy trình chế biến thủ công kèm sản phẩm liên quan."
    elif centroid_raw["unique_products_viewed"] >= overall_means["unique_products_viewed"] * 1.25 or centroid_raw["total_searches"] >= overall_means["total_searches"] * 1.3:
        name = "Nhóm khám phá & so sánh đa dạng đặc sản"
        desc = (
            f"Tích cực tìm kiếm ({centroid_raw['total_searches']:.1f} lần) và khám phá {centroid_raw['unique_products_viewed']:.1f} "
            f"sản phẩm khác nhau, lưu yêu thích {centroid_raw['total_favorites']:.1f} mục."
        )
        strategy = "Đề xuất danh sách sản phẩm cùng danh mục, bảng so sánh đặc điểm hương vị và gợi ý bộ quà tặng đặc sản."
    elif centroid_raw["total_sessions"] <= 1.6 and centroid_raw["total_product_views"] <= 2.2:
        name = "Nhóm khách vãng lai xem nhanh (Casual Visitors)"
        desc = (
            f"Số phiên truy cập thấp ({centroid_raw['total_sessions']:.1f} phiên), thời gian tương tác ngắn "
            f"({centroid_raw['avg_session_duration']:.0f}s) và ít tương tác sâu."
        )
        strategy = "Áp dụng chiến lược Cold-start hiển thị Top sản phẩm nổi bật nhất (Cà phê Arabica, Chè Shan tuyết) để thu hút sự chú ý ngay đầu trang."
    else:
        name = "Nhóm quan tâm định kỳ & chọn lọc"
        desc = (
            f"Tương tác cân bằng với {centroid_raw['total_sessions']:.1f} phiên, xem {centroid_raw['total_product_views']:.1f} "
            f"lượt sản phẩm và yêu thích {centroid_raw['total_favorites']:.1f} nội dung."
        )
        strategy = "Kết hợp đề xuất sản phẩm tương đồng nội dung (Content-based) với các bài viết hướng dẫn sử dụng, bảo quản."

    if name in used_names:
        name = f"{name} (Cụm #{cluster_idx + 1})"
    used_names.add(name)

    dominant_list = [
        {"feature": k, "ratio_vs_mean": round(v, 2), "value": round(centroid_raw[k], 2)}
        for k, v in sorted_traits[:3]
    ]

    return {
        "cluster_name": name,
        "cluster_description": desc,
        "dominant_characteristics": dominant_list,
        "recommended_strategy": strategy,
    }


def _evaluate_cluster_stability(X_scaled: np.ndarray, k: int, base_labels: np.ndarray, seeds: List[int]) -> float:
    """Compute mean Adjusted Rand Index (ARI) across multiple random seeds to quantify cluster stability."""
    aris = []
    for s in seeds:
        km = KMeans(n_clusters=k, random_state=s, n_init=10, max_iter=300)
        alt_labels = km.fit_predict(X_scaled)
        aris.append(adjusted_rand_score(base_labels, alt_labels))
    return float(np.mean(aris))


def train_and_evaluate_kmeans(
    db: Session,
    k_min: int = 2,
    k_max: int = 8,
    forced_k: Optional[int] = None,
    include_simulated: bool = True,
    random_seed: int = 42,
) -> Dict[str, Any]:
    """
    Full K-means pipeline (Section 12):
    1. Extract visitor feature vectors X = [S, P, A, T, Q, F, C, R, U]
    2. Handle missing values & IQR/percentile outlier capping
    3. Standardize features (StandardScaler)
    4. Sweep K from 2 to 8 and compute Inertia, Silhouette Score, Davies-Bouldin Index, Cluster Stability (ARI)
    5. Select optimal K objectively based on Silhouette + Davies-Bouldin + Stability (unless forced_k specified)
    6. Derive cluster profiles and names post-hoc from centroid statistics
    7. Persist model artifact and save versioned results to PostgreSQL/SQLite
    """
    df = get_feature_dataframe(db, include_simulated=include_simulated)
    if len(df) < max(k_max + 2, 10):
        raise ValueError(f"Số lượng visitor ({len(df)}) quá ít để huấn luyện K-means với K={k_max}.")

    raw_X = df[FEATURE_COLUMNS].copy().fillna(0.0)

    # Outlier clipping at 99th percentile to prevent extreme skew from distorting Euclidean distances
    clipped_X = raw_X.copy()
    clip_bounds = {}
    for col in FEATURE_COLUMNS:
        q99 = float(np.percentile(clipped_X[col], 99))
        if q99 > 0:
            clipped_X[col] = np.clip(clipped_X[col], 0.0, q99)
        clip_bounds[col] = round(q99, 2)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(clipped_X.values)

    k_sweep_results = []
    models_by_k = {}
    labels_by_k = {}

    for k in range(k_min, k_max + 1):
        km = KMeans(n_clusters=k, random_state=random_seed, n_init=15, max_iter=300)
        labels = km.fit_predict(X_scaled)
        inertia = float(km.inertia_)
        sil = float(silhouette_score(X_scaled, labels))
        dbi = float(davies_bouldin_score(X_scaled, labels))
        stability = _evaluate_cluster_stability(X_scaled, k, labels, [11, 23, 37, 59, 83])

        unique, counts = np.unique(labels, return_counts=True)
        size_dist = {int(u): int(c) for u, c in zip(unique, counts)}
        min_cluster_pct = float(np.min(counts) / len(labels) * 100.0)

        k_sweep_results.append(
            {
                "k": k,
                "inertia": round(inertia, 2),
                "silhouette_score": round(sil, 4),
                "davies_bouldin_index": round(dbi, 4),
                "stability_ari": round(stability, 4),
                "cluster_sizes": size_dist,
                "min_cluster_pct": round(min_cluster_pct, 2),
            }
        )
        models_by_k[k] = km
        labels_by_k[k] = labels

    # Objective selection of optimal K (prefer K >= 3 with highest composite of Silhouette, Stability & low DBI)
    if forced_k and k_min <= forced_k <= k_max:
        best_k = forced_k
    else:
        candidate_rows = [r for r in k_sweep_results if r["k"] >= 3 and r["min_cluster_pct"] >= 5.0]
        if not candidate_rows:
            candidate_rows = k_sweep_results
        best_row = max(
            candidate_rows,
            key=lambda r: (r["silhouette_score"] * 0.65) + (r["stability_ari"] * 0.25) - (r["davies_bouldin_index"] * 0.10),
        )
        best_k = int(best_row["k"])

    best_km = models_by_k[best_k]
    best_labels = labels_by_k[best_k]
    best_metrics = next(r for r in k_sweep_results if r["k"] == best_k)

    # Compute distance of each point to its assigned centroid
    all_distances = best_km.transform(X_scaled)
    assigned_distances = [float(all_distances[i, best_labels[i]]) for i in range(len(best_labels))]

    # Save versioned artifact
    version_str = f"kmeans_v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    artifacts_dir = Path(settings.ML_ARTIFACTS_DIR)
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    artifact_file = artifacts_dir / f"{version_str}.joblib"

    joblib.dump(
        {
            "version": version_str,
            "best_k": best_k,
            "feature_columns": FEATURE_COLUMNS,
            "clip_bounds": clip_bounds,
            "scaler": scaler,
            "kmeans": best_km,
            "k_sweep_results": k_sweep_results,
        },
        artifact_file,
    )

    # Deactivate older clustering models
    db.query(MLModel).filter(MLModel.model_type == "clustering").update({"is_active": False})

    feature_distributions = {}
    for col in FEATURE_COLUMNS:
        feature_distributions[col] = {
            "mean": round(float(raw_X[col].mean()), 2),
            "std": round(float(raw_X[col].std()), 2),
            "median": round(float(raw_X[col].median()), 2),
            "min": round(float(raw_X[col].min()), 2),
            "max": round(float(raw_X[col].max()), 2),
        }

    ml_model = MLModel(
        model_name="kmeans_segmentation",
        model_type="clustering",
        version=version_str,
        parameters={
            "k_min": k_min,
            "k_max": k_max,
            "selected_k": best_k,
            "features": FEATURE_COLUMNS,
            "random_seed": random_seed,
            "sample_size": len(df),
            "include_simulated": include_simulated,
        },
        metrics={
            "selected_k": best_k,
            "inertia": best_metrics["inertia"],
            "silhouette_score": best_metrics["silhouette_score"],
            "davies_bouldin_index": best_metrics["davies_bouldin_index"],
            "stability_ari": best_metrics["stability_ari"],
            "k_sweep": k_sweep_results,
            "feature_distributions": feature_distributions,
        },
        artifact_path=str(artifact_file),
        is_active=True,
        trained_at=datetime.utcnow(),
    )
    db.add(ml_model)
    db.flush()

    overall_means = {col: float(raw_X[col].mean()) for col in FEATURE_COLUMNS}
    used_names = set()
    profiles_out = []

    for c_idx in range(best_k):
        mask = best_labels == c_idx
        c_size = int(np.sum(mask))
        c_pct = round(float(c_size / len(df) * 100.0), 2)
        c_raw_means = {
            col: round(float(raw_X.loc[mask, col].mean()), 2) if c_size > 0 else 0.0
            for col in FEATURE_COLUMNS
        }
        interp = _interpret_cluster_centroid(c_idx, c_raw_means, overall_means, used_names)

        cp = ClusterProfile(
            model_id=ml_model.model_id,
            cluster_index=c_idx,
            cluster_name=interp["cluster_name"],
            cluster_description=interp["cluster_description"],
            size=c_size,
            percentage=c_pct,
            centroid_features=c_raw_means,
            dominant_characteristics=interp["dominant_characteristics"],
            recommended_strategy=interp["recommended_strategy"],
        )
        db.add(cp)
        profiles_out.append(
            {
                "cluster_index": c_idx,
                "cluster_name": interp["cluster_name"],
                "cluster_description": interp["cluster_description"],
                "size": c_size,
                "percentage": c_pct,
                "centroid_features": c_raw_means,
                "dominant_characteristics": interp["dominant_characteristics"],
                "recommended_strategy": interp["recommended_strategy"],
            }
        )

    cluster_results_objs = []
    visitor_ids = df["visitor_id"].tolist()
    for i, vid in enumerate(visitor_ids):
        cluster_results_objs.append(
            ClusterResult(
                model_id=ml_model.model_id,
                visitor_id=vid,
                cluster_index=int(best_labels[i]),
                distance_to_centroid=round(assigned_distances[i], 4),
            )
        )
    db.bulk_save_objects(cluster_results_objs)
    db.commit()

    return {
        "model_id": ml_model.model_id,
        "version": version_str,
        "selected_k": best_k,
        "sample_size": len(df),
        "metrics": ml_model.metrics,
        "profiles": profiles_out,
    }
