from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.entities import (
    Article,
    Content,
    Event,
    MLModel,
    Product,
    Recommendation,
    RecommendationLog,
)
from ml.src.preprocessing.vietnamese_nlp import tokenize_vietnamese

# Default initial behavioral weights from Section 13.4 of the Plan
DEFAULT_BEHAVIOR_WEIGHTS = {
    "view": 1.0,
    "scroll": 2.0,
    "favorite": 3.0,
    "share": 4.0,
    "contact_click": 5.0,
}

EVENT_TO_WEIGHT_KEY = {
    "product_view": "view",
    "article_view": "view",
    "scroll": "scroll",
    "favorite": "favorite",
    "share": "share",
    "contact_click": "contact_click",
}


def sync_contents_table(db: Session) -> List[Content]:
    """
    Build/update the unified `contents` table from all Products and Articles (Section 13.2):
    Product fields: product_name, description, ingredients, characteristics, production_process, traditional_value, keywords
    Article fields: title, excerpt, content, keywords
    """
    products = db.query(Product).all()
    articles = db.query(Article).all()

    existing_map = {
        (c.content_type, c.ref_id): c for c in db.query(Content).all()
    }
    synced: List[Content] = []

    for p in products:
        cat_name = p.category.name if p.category else "Nông sản"
        raw_text = " ".join(
            filter(
                None,
                [
                    p.product_name,
                    p.product_name,  # Boost title weight
                    cat_name,
                    p.origin,
                    p.short_description or "",
                    p.description,
                    p.ingredients,
                    p.characteristics,
                    p.production_process,
                    p.traditional_value,
                    p.keywords,
                ],
            )
        )
        tokens = tokenize_vietnamese(raw_text)
        pop_score = float(p.view_count * 1.0 + p.favorite_count * 3.0 + p.contact_click_count * 5.0)

        c_obj = existing_map.get(("product", p.product_id))
        if not c_obj:
            c_obj = Content(content_type="product", ref_id=p.product_id)
            db.add(c_obj)
        c_obj.title = p.product_name
        c_obj.slug = p.slug
        c_obj.category_name = cat_name
        c_obj.combined_text = raw_text
        c_obj.processed_tokens = tokens
        c_obj.keywords = p.keywords
        c_obj.popularity_score = pop_score
        c_obj.updated_at = datetime.utcnow()
        synced.append(c_obj)

    for a in articles:
        linked_prod_names = " ".join([p.product_name for p in a.products])
        linked_cat_names = " ".join([p.category.name for p in a.products if p.category])
        raw_text = " ".join(
            filter(
                None,
                [
                    a.title,
                    a.title,
                    linked_prod_names,
                    linked_cat_names,
                    a.excerpt,
                    a.content,
                    a.keywords or "",
                ],
            )
        )
        tokens = tokenize_vietnamese(raw_text)
        pop_score = float(a.view_count * 1.0 + a.favorite_count * 3.0)

        c_obj = existing_map.get(("article", a.article_id))
        if not c_obj:
            c_obj = Content(content_type="article", ref_id=a.article_id)
            db.add(c_obj)
        c_obj.title = a.title
        c_obj.slug = a.slug
        c_obj.category_name = linked_cat_names or a.content_type
        c_obj.combined_text = raw_text
        c_obj.processed_tokens = tokens
        c_obj.keywords = a.keywords
        c_obj.popularity_score = pop_score
        c_obj.updated_at = datetime.utcnow()
        synced.append(c_obj)

    db.commit()
    return db.query(Content).order_by(Content.content_uid.asc()).all()


def _evaluate_recommendation_holdout(
    db: Session,
    item_keys: List[Tuple[str, int]],
    key_to_idx: Dict[Tuple[str, int], int],
    tfidf_matrix: np.ndarray,
    sim_matrix: np.ndarray,
    weights: Dict[str, float],
    k: int = 5,
) -> Dict[str, Any]:
    """
    Hold-out evaluation protocol (Section 30):
    'Phải xác định rõ tập kiểm thử và định nghĩa nội dung phù hợp trước khi tính các chỉ số.
     Không sử dụng chính dữ liệu huấn luyện làm bằng chứng duy nhất cho chất lượng gợi ý.'
    - Split each eligible visitor's chronologically ordered interacted items into:
      80% Train History vs 20% Future Hold-out Test Set (plus ground-truth category/product links).
    - Compute Precision@5, Recall@5, nDCG@5, Catalog Coverage, and Intra-List Diversity (1 - mean pairwise cosine).
    - Also perform Weight Sensitivity Analysis across 3 weight schemes.
    """
    events = db.query(Event).order_by(Event.occurred_at.asc()).all()

    # Build ground-truth semantic relevance sets per item (same category or linked article<->product)
    products = db.query(Product).all()
    articles = db.query(Article).all()
    prod_cat = {p.product_id: p.category_id for p in products}
    art_cats = {}
    for a in articles:
        art_cats[a.article_id] = {p.category_id for p in a.products}

    def are_semantically_relevant(item_a: Tuple[str, int], item_b: Tuple[str, int]) -> bool:
        if item_a == item_b:
            return True
        ta, ida = item_a
        tb, idb = item_b
        cats_a = {prod_cat.get(ida)} if ta == "product" else art_cats.get(ida, set())
        cats_b = {prod_cat.get(idb)} if tb == "product" else art_cats.get(idb, set())
        return bool(cats_a.intersection(cats_b))

    # Group chronological interactions by visitor
    vis_interactions: Dict[str, List[Tuple[Tuple[str, int], str]]] = {}
    for ev in events:
        if ev.content_type in ("product", "article") and ev.content_id is not None:
            key = (ev.content_type, int(ev.content_id))
            w_key = EVENT_TO_WEIGHT_KEY.get(ev.event_name)
            if key in key_to_idx and w_key:
                vis_interactions.setdefault(ev.visitor_id, []).append((key, w_key))

    def run_eval_for_weights(w_map: Dict[str, float]) -> Dict[str, float]:
        precisions = []
        recalls = []
        ndcgs = []
        recommended_catalog_indices = set()
        ild_scores = []

        eligible_visitors = 0
        for vid, seq in vis_interactions.items():
            # Distinct items in order of first appearance
            distinct_items = []
            seen_set = set()
            for item_key, _ in seq:
                if item_key not in seen_set:
                    seen_set.add(item_key)
                    distinct_items.append(item_key)
            if len(distinct_items) < 4:
                continue

            split_point = max(2, int(len(distinct_items) * 0.75))
            train_items_set = set(distinct_items[:split_point])
            holdout_items_set = set(distinct_items[split_point:])
            if not holdout_items_set:
                continue

            eligible_visitors += 1
            # Build user interest profile ONLY from train_items_set
            profile_vec = np.zeros(tfidf_matrix.shape[1], dtype=float)
            total_w = 0.0
            for item_key, w_key in seq:
                if item_key in train_items_set:
                    idx = key_to_idx[item_key]
                    w = float(w_map.get(w_key, 1.0))
                    profile_vec += tfidf_matrix[idx] * w
                    total_w += w

            if total_w > 0:
                profile_vec /= total_w

            scores = cosine_similarity(profile_vec.reshape(1, -1), tfidf_matrix).flatten()
            # Filter out train items already seen
            for t_item in train_items_set:
                scores[key_to_idx[t_item]] = -1.0

            top_indices = np.argsort(scores)[::-1][:k]
            recommended_catalog_indices.update(top_indices.tolist())

            # Relevance definition: item is in visitor's hold-out future interactions OR shares direct product-article/category link with hold-out items
            relevant_universe = set(holdout_items_set)
            for cand_key in item_keys:
                if cand_key not in train_items_set:
                    if any(are_semantically_relevant(cand_key, h_item) for h_item in holdout_items_set):
                        relevant_universe.add(cand_key)

            hits = []
            for rank_idx, c_idx in enumerate(top_indices):
                cand_key = item_keys[c_idx]
                is_rel = 1.0 if cand_key in relevant_universe else 0.0
                hits.append(is_rel)

            p_at_k = float(np.sum(hits) / k)
            denom_recall = min(len(relevant_universe), k)
            r_at_k = float(np.sum(hits) / max(1, denom_recall))

            dcg = sum(rel / np.log2(idx + 2) for idx, rel in enumerate(hits))
            ideal_hits = sorted(hits, reverse=True)
            idcg = sum(1.0 / np.log2(idx + 2) for idx in range(min(len(relevant_universe), k)))
            ndcg_at_k = float(dcg / idcg) if idcg > 0 else 0.0

            precisions.append(p_at_k)
            recalls.append(r_at_k)
            ndcgs.append(ndcg_at_k)

            # Intra-list diversity: 1 - average pairwise cosine similarity among top K
            if len(top_indices) > 1:
                sub_sim = sim_matrix[np.ix_(top_indices, top_indices)]
                upper_tri = sub_sim[np.triu_indices(len(top_indices), k=1)]
                ild_scores.append(float(1.0 - np.mean(upper_tri)))

        coverage = float(len(recommended_catalog_indices) / max(1, len(item_keys)))
        return {
            "evaluated_visitors": eligible_visitors,
            "precision_at_5": round(float(np.mean(precisions)) if precisions else 0.0, 4),
            "recall_at_5": round(float(np.mean(recalls)) if recalls else 0.0, 4),
            "ndcg_at_5": round(float(np.mean(ndcgs)) if ndcgs else 0.0, 4),
            "coverage": round(coverage, 4),
            "diversity": round(float(np.mean(ild_scores)) if ild_scores else 0.0, 4),
        }

    baseline_metrics = run_eval_for_weights(weights)

    # Sensitivity analysis across 3 weighting hypotheses (Section 13.4)
    uniform_weights = {"view": 1.0, "scroll": 1.0, "favorite": 1.0, "share": 1.0, "contact_click": 1.0}
    steep_weights = {"view": 1.0, "scroll": 2.5, "favorite": 4.5, "share": 6.0, "contact_click": 8.0}

    sensitivity_analysis = [
        {"scheme": "Uniform Weights (1-1-1-1-1)", "weights": uniform_weights, **run_eval_for_weights(uniform_weights)},
        {"scheme": "Hypothesis Default (1-2-3-4-5)", "weights": weights, **baseline_metrics},
        {"scheme": "High-Intent Emphasis (1-2.5-4.5-6-8)", "weights": steep_weights, **run_eval_for_weights(steep_weights)},
    ]

    return {
        **baseline_metrics,
        "evaluation_protocol": "Chronological 75/25 Train-Holdout Split per Visitor + Category/Product Semantic Ground Truth",
        "weight_sensitivity_analysis": sensitivity_analysis,
    }


def build_and_evaluate_recommender(
    db: Session,
    weights: Optional[Dict[str, float]] = None,
    top_k: int = 5,
) -> Dict[str, Any]:
    """
    Full Content-based Recommendation Pipeline (Section 13):
    1. Sync contents table & preprocess Vietnamese text (word segmentation + stopwords removal)
    2. Build TF-IDF vector representation (unigrams + bigrams)
    3. Compute Cosine Similarity matrix across all contents
    4. Build weighted user interest profiles & precompute Top-5 recommendations
    5. Run offline Hold-out evaluation (Precision@5, Recall@5, nDCG@5, Coverage, Diversity) + Weight sensitivity check
    6. Save versioned TF-IDF & similarity artifacts
    """
    active_weights = weights or DEFAULT_BEHAVIOR_WEIGHTS.copy()
    contents = sync_contents_table(db)
    if not contents:
        raise ValueError("Bảng contents trống. Cần seed dữ liệu sản phẩm và bài viết trước.")

    corpus = [c.processed_tokens or "" for c in contents]
    item_keys = [(c.content_type, c.ref_id) for c in contents]
    key_to_idx = {k: i for i, k in enumerate(item_keys)}

    vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=1500, sublinear_tf=True)
    tfidf_matrix = vectorizer.fit_transform(corpus).toarray()
    sim_matrix = cosine_similarity(tfidf_matrix)

    # Evaluate hold-out metrics
    eval_metrics = _evaluate_recommendation_holdout(
        db=db,
        item_keys=item_keys,
        key_to_idx=key_to_idx,
        tfidf_matrix=tfidf_matrix,
        sim_matrix=sim_matrix,
        weights=active_weights,
        k=top_k,
    )

    version_str = f"cb_tfidf_v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
    artifacts_dir = Path(settings.ML_ARTIFACTS_DIR)
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    artifact_file = artifacts_dir / f"{version_str}.joblib"

    vocab_terms = vectorizer.get_feature_names_out().tolist()
    joblib.dump(
        {
            "version": version_str,
            "vectorizer": vectorizer,
            "tfidf_matrix": tfidf_matrix,
            "sim_matrix": sim_matrix,
            "item_keys": item_keys,
            "weights": active_weights,
            "vocab_size": len(vocab_terms),
        },
        artifact_file,
    )

    db.query(MLModel).filter(MLModel.model_type == "recommendation").update({"is_active": False})

    ml_model = MLModel(
        model_name="tfidf_content_recommender",
        model_type="recommendation",
        version=version_str,
        parameters={
            "weights": active_weights,
            "top_k": top_k,
            "total_contents": len(contents),
            "vocab_size": len(vocab_terms),
            "ngram_range": [1, 2],
        },
        metrics=eval_metrics,
        artifact_path=str(artifact_file),
        is_active=True,
        trained_at=datetime.utcnow(),
    )
    db.add(ml_model)
    db.commit()
    db.refresh(ml_model)

    return {
        "model_id": ml_model.model_id,
        "version": version_str,
        "total_contents": len(contents),
        "vocab_size": len(vocab_terms),
        "weights": active_weights,
        "metrics": eval_metrics,
    }


def get_recommendations_for_visitor(
    db: Session,
    visitor_id: Optional[str] = None,
    session_id: Optional[str] = None,
    current_content_type: Optional[str] = None,
    current_content_id: Optional[int] = None,
    target_type: Optional[str] = None,
    limit: int = 5,
    log_exposure: bool = True,
) -> Dict[str, Any]:
    """
    Real-time recommendation serving with Cold-Start fallback (Section 13.3 - 13.5):
    - If visitor has behavioral history: build weighted TF-IDF user profile, compute Cosine Similarity,
      filter already-viewed items (unless catalog is small and target_type requires filling), return Top 5.
    - If Cold-Start (new visitor or no history):
      1) Related content to current_content_type/current_content_id + same category
      2) Popular content across platform
    """
    active_model = (
        db.query(MLModel)
        .filter(MLModel.model_type == "recommendation", MLModel.is_active == True)
        .order_by(MLModel.trained_at.desc())
        .first()
    )
    if not active_model or not active_model.artifact_path or not Path(active_model.artifact_path).exists():
        build_and_evaluate_recommender(db)
        active_model = (
            db.query(MLModel)
            .filter(MLModel.model_type == "recommendation", MLModel.is_active == True)
            .order_by(MLModel.trained_at.desc())
            .first()
        )

    bundle = joblib.load(active_model.artifact_path)
    tfidf_matrix: np.ndarray = bundle["tfidf_matrix"]
    sim_matrix: np.ndarray = bundle["sim_matrix"]
    item_keys: List[Tuple[str, int]] = bundle["item_keys"]
    weights: Dict[str, float] = bundle.get("weights", DEFAULT_BEHAVIOR_WEIGHTS)
    key_to_idx = {k: i for i, k in enumerate(item_keys)}

    contents_map = {(c.content_type, c.ref_id): c for c in db.query(Content).all()}
    products_map = {p.product_id: p for p in db.query(Product).all()}
    articles_map = {a.article_id: a for a in db.query(Article).all()}

    vis_events = []
    if visitor_id:
        vis_events = (
            db.query(Event)
            .filter(Event.visitor_id == visitor_id)
            .order_by(Event.occurred_at.desc())
            .limit(100)
            .all()
        )

    viewed_keys = set()
    profile_vec = np.zeros(tfidf_matrix.shape[1], dtype=float)
    total_w = 0.0

    for ev in vis_events:
        if ev.content_type in ("product", "article") and ev.content_id is not None:
            key = (ev.content_type, int(ev.content_id))
            if key in key_to_idx:
                if ev.event_name in ("product_view", "article_view"):
                    viewed_keys.add(key)
                w_name = EVENT_TO_WEIGHT_KEY.get(ev.event_name)
                if w_name:
                    w_val = float(weights.get(w_name, 1.0))
                    profile_vec += tfidf_matrix[key_to_idx[key]] * w_val
                    total_w += w_val

    strategy = "content_based"
    if total_w > 0:
        profile_vec /= total_w
        raw_scores = cosine_similarity(profile_vec.reshape(1, -1), tfidf_matrix).flatten()
        # Context boost if currently viewing an item
        if current_content_type and current_content_id:
            ctx_key = (current_content_type, int(current_content_id))
            if ctx_key in key_to_idx:
                ctx_idx = key_to_idx[ctx_key]
                raw_scores = 0.70 * raw_scores + 0.30 * sim_matrix[ctx_idx]
    elif current_content_type and current_content_id and (current_content_type, int(current_content_id)) in key_to_idx:
        strategy = "cold_start_related"
        ctx_key = (current_content_type, int(current_content_id))
        ctx_idx = key_to_idx[ctx_key]
        raw_scores = sim_matrix[ctx_idx].copy()
        viewed_keys.add(ctx_key)
    else:
        strategy = "cold_start_popular"
        pop_arr = np.array(
            [contents_map.get(k).popularity_score if contents_map.get(k) else 1.0 for k in item_keys],
            dtype=float,
        )
        max_pop = max(float(np.max(pop_arr)), 1.0)
        raw_scores = pop_arr / max_pop

    # Build candidate ranking (prefer unseen items first, fallback to seen if fewer than `limit` unseen exist)
    unseen_candidates = []
    seen_candidates = []

    current_key = (current_content_type, int(current_content_id)) if (current_content_type and current_content_id) else None

    for idx, (c_type, ref_id) in enumerate(item_keys):
        if target_type and c_type != target_type:
            continue
        if current_key and (c_type, ref_id) == current_key:
            continue
        score = float(raw_scores[idx])
        if (c_type, ref_id) not in viewed_keys:
            unseen_candidates.append((score, c_type, ref_id))
        else:
            seen_candidates.append((score * 0.5, c_type, ref_id))

    unseen_candidates.sort(key=lambda x: x[0], reverse=True)
    seen_candidates.sort(key=lambda x: x[0], reverse=True)
    ranked = (unseen_candidates + seen_candidates)[:limit]

    results = []
    for rank_i, (sc_val, c_type, ref_id) in enumerate(ranked, start=1):
        c_meta = contents_map.get((c_type, ref_id))
        if c_type == "product" and ref_id in products_map:
            p = products_map[ref_id]
            reason = (
                "Tương đồng cao với sở thích nông sản của bạn"
                if strategy == "content_based"
                else (
                    "Cùng nhóm đặc sản & vùng nguyên liệu liên quan"
                    if strategy == "cold_start_related"
                    else "Đặc sản Sơn La nổi bật được yêu thích nhất"
                )
            )
            results.append(
                {
                    "rank": rank_i,
                    "content_type": "product",
                    "content_id": p.product_id,
                    "title": p.product_name,
                    "slug": p.slug,
                    "category_name": p.category.name if p.category else "Đặc sản",
                    "origin": p.origin,
                    "image_url": p.image_url,
                    "short_description": p.short_description or p.description[:140] + "...",
                    "certification": p.certification,
                    "score": round(max(0.05, min(0.99, sc_val)), 4),
                    "reason": reason,
                }
            )
        elif c_type == "article" and ref_id in articles_map:
            a = articles_map[ref_id]
            reason = (
                "Bài viết phù hợp với chủ đề bạn đang quan tâm"
                if strategy == "content_based"
                else (
                    "Câu chuyện vùng trồng liên quan trực tiếp"
                    if strategy == "cold_start_related"
                    else "Bài viết tiêu biểu được đọc nhiều nhất"
                )
            )
            results.append(
                {
                    "rank": rank_i,
                    "content_type": "article",
                    "content_id": a.article_id,
                    "title": a.title,
                    "slug": a.slug,
                    "category_name": c_meta.category_name if c_meta else a.content_type,
                    "origin": "Sơn La",
                    "image_url": a.image_url,
                    "short_description": a.excerpt,
                    "certification": f"{a.reading_time_minutes} phút đọc",
                    "score": round(max(0.05, min(0.99, sc_val)), 4),
                    "reason": reason,
                }
            )

    if log_exposure and visitor_id:
        log_entry = RecommendationLog(
            visitor_id=visitor_id,
            session_id=session_id,
            model_version=active_model.version,
            strategy=strategy,
            context_content_type=current_content_type,
            context_content_id=current_content_id,
            recommended_items=[
                {
                    "rank": r["rank"],
                    "content_type": r["content_type"],
                    "content_id": r["content_id"],
                    "score": r["score"],
                }
                for r in results
            ],
        )
        db.add(log_entry)
        db.commit()

    return {
        "visitor_id": visitor_id or "anonymous_cold_start",
        "model_version": active_model.version,
        "strategy": strategy,
        "count": len(results),
        "items": results,
    }
