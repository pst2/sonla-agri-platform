#!/usr/bin/env python3
"""
Standalone CLI Pipeline for the Sơn La Agricultural Communication & Analytics Platform.
Executes end-to-end:
1. Database Schema & Initial Sơn La Catalog Seeding (5 Locations, 4 Categories, 8 Products, 14 Articles)
2. Reproducible Behavioral Dataset Simulation (500 Visitors, ~1,500 Sessions, ~15,000 Events across 5 Scenarios)
3. User Behavioral Feature Extraction: X = [S, P, A, T, Q, F, C, R, U]
4. Unsupervised K-Means Clustering (K = 2..8 sweep, Inertia, Silhouette, Davies-Bouldin, ARI Stability, Post-hoc Profiling)
5. Vietnamese TF-IDF Content-Based Recommendation Engine & Chronological Hold-out Evaluation (Precision@5, Recall@5, nDCG@5, Coverage, Diversity, Weight Sensitivity Analysis)
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
for p in (str(ROOT_DIR), str(BACKEND_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from app.core.database import Base, SessionLocal, engine
from database.seeds.sonla_seed_data import seed_initial_catalog_and_admin
from ml.src.clustering.kmeans_pipeline import train_and_evaluate_kmeans
from ml.src.data_generator.synthetic_generator import generate_synthetic_dataset
from ml.src.recommendation.content_based import (
    build_and_evaluate_recommender,
    get_recommendations_for_visitor,
)


def run_full_ml_pipeline(
    num_visitors: int = 500,
    random_seed: int = 42,
    k_min: int = 2,
    k_max: int = 8,
    export_json_path: Path | None = None,
) -> dict:
    print("=" * 80)
    print("KHỞI CHẠY PIPELINE KHOA HỌC DỮ LIỆU & HỌC MÁY - NÔNG SẢN TRUYỀN THỐNG SƠN LA")
    print("=" * 80)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        print("\n[1/4] Khởi tạo danh mục 8 sản phẩm đặc sản & 14 bài viết tỉnh Sơn La...")
        seed_stats = seed_initial_catalog_and_admin(db)
        print(f"      -> Hoàn tất: {seed_stats}")

        print(f"\n[2/4] Sinh dữ liệu hành vi mô phỏng ({num_visitors} visitors, seed={random_seed})...")
        sim_stats = generate_synthetic_dataset(
            db=db,
            num_visitors=num_visitors,
            random_seed=random_seed,
            clear_existing_simulated=True,
        )
        print(f"      -> Hoàn tất: {sim_stats}")

        print(f"\n[3/4] Huấn luyện & đánh giá phân cụm K-Means (K={k_min}..{k_max})...")
        kmeans_res = train_and_evaluate_kmeans(
            db=db,
            k_min=k_min,
            k_max=k_max,
            include_simulated=True,
            random_seed=random_seed,
        )
        print(
            f"      -> K tối ưu được chọn: K = {kmeans_res['selected_k']} | "
            f"Silhouette = {kmeans_res['metrics']['silhouette_score']} | "
            f"DBI = {kmeans_res['metrics']['davies_bouldin_index']} | "
            f"ARI Stability = {kmeans_res['metrics']['stability_ari']}"
        )

        print("\n[4/4] Xây dựng & đánh giá Hold-out Hệ thống gợi ý Content-based (TF-IDF + Cosine)...")
        rec_res = build_and_evaluate_recommender(db=db, top_k=5)
        rec_metrics = rec_res["metrics"]
        print(
            f"      -> Từ vựng TF-IDF: {rec_res['vocab_size']} terms | "
            f"Precision@5 = {rec_metrics['precision_at_5']} | "
            f"Recall@5 = {rec_metrics['recall_at_5']} | "
            f"nDCG@5 = {rec_metrics['ndcg_at_5']} | "
            f"Coverage = {rec_metrics['coverage']} | "
            f"Diversity = {rec_metrics['diversity']}"
        )

        # Verify demo persona recommendations
        demo_recs = get_recommendations_for_visitor(
            db=db,
            visitor_id="demo_visitor_sonla",
            limit=5,
            log_exposure=False,
        )

        summary = {
            "executed_at": datetime.utcnow().isoformat(),
            "catalog_seed": seed_stats,
            "simulation": sim_stats,
            "kmeans_clustering": kmeans_res,
            "content_based_recommendation": rec_res,
            "demo_visitor_sample_recommendations": demo_recs,
        }

        if export_json_path:
            export_json_path.parent.mkdir(parents=True, exist_ok=True)
            export_json_path.write_text(
                json.dumps(summary, ensure_ascii=False, indent=2, default=str),
                encoding="utf-8",
            )
            print(f"\n[+] Đã xuất kết quả JSON chi tiết tại: {export_json_path}")

        print("\n" + "=" * 80)
        print("HOÀN TẤT PIPELINE THÀNH CÔNG!")
        print("=" * 80)
        return summary
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Sơn La Agri ML Pipeline")
    parser.add_argument("--visitors", type=int, default=500, help="Number of simulated visitors")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument(
        "--export-json",
        type=str,
        default=str(ROOT_DIR / "ml" / "artifacts" / "latest_evaluation_summary.json"),
        help="Path to save JSON evaluation summary",
    )
    args = parser.parse_args()
    run_full_ml_pipeline(
        num_visitors=args.visitors,
        random_seed=args.seed,
        export_json_path=Path(args.export_json) if args.export_json else None,
    )
