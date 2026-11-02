from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import create_access_token, get_current_admin, verify_password
from app.models.entities import (
    AdminUser,
    Article,
    AuditLog,
    Category,
    ClusterProfile,
    ClusterResult,
    Event,
    Favorite,
    Location,
    MLModel,
    Product,
    RecommendationLog,
    SessionModel,
    SimulationScenario,
    UserFeature,
    Visitor,
)
from app.schemas.api_schemas import (
    ArticleCreateUpdate,
    ArticleSchema,
    BuildRecommendationRequest,
    CategoryCreateUpdate,
    CategorySchema,
    LoginRequest,
    ProductCreateUpdate,
    ProductSchema,
    SimulationRequest,
    TokenResponse,
    TrainClusteringRequest,
)
from ml.src.clustering.kmeans_pipeline import train_and_evaluate_kmeans
from ml.src.data_generator.synthetic_generator import (
    ensure_simulation_scenarios,
    generate_synthetic_dataset,
)
from ml.src.features.feature_builder import FEATURE_COLUMNS, FEATURE_SYMBOLS
from ml.src.recommendation.content_based import (
    build_and_evaluate_recommender,
    sync_contents_table,
)

router = APIRouter(prefix="/admin", tags=["Admin API"])


def _log_audit(
    db: Session,
    admin_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    details: Optional[dict] = None,
):
    db.add(
        AuditLog(
            admin_id=admin_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
        )
    )
    db.commit()


@router.post("/auth/login", response_model=TokenResponse)
def admin_login(payload: LoginRequest, db: Session = Depends(get_db)):
    admin = (
        db.query(AdminUser)
        .filter(AdminUser.username == payload.username, AdminUser.is_active == True)
        .first()
    )
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Tên đăng nhập hoặc mật khẩu không chính xác.")

    admin.last_login_at = datetime.utcnow()
    db.commit()
    token = create_access_token({"sub": admin.username, "role": admin.role})
    _log_audit(db, admin.admin_id, "admin_login", "admin_users", str(admin.admin_id))

    return TokenResponse(
        access_token=token,
        admin={
            "admin_id": admin.admin_id,
            "username": admin.username,
            "full_name": admin.full_name,
            "email": admin.email,
            "role": admin.role,
        },
    )


@router.get("/auth/me")
def get_admin_profile(current_admin: AdminUser = Depends(get_current_admin)):
    return {
        "admin_id": current_admin.admin_id,
        "username": current_admin.username,
        "full_name": current_admin.full_name,
        "email": current_admin.email,
        "role": current_admin.role,
        "last_login_at": current_admin.last_login_at,
    }


@router.get("/analytics/overview")
def analytics_overview(
    days: int = Query(default=30, ge=1, le=365),
    include_simulated: bool = Query(default=True),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)

    vis_q = db.query(Visitor).filter(Visitor.last_seen_at >= cutoff)
    sess_q = db.query(SessionModel).filter(SessionModel.started_at >= cutoff)
    ev_q = db.query(Event).filter(Event.occurred_at >= cutoff)
    fav_q = db.query(Favorite)

    if not include_simulated:
        vis_q = vis_q.filter(Visitor.is_simulated == False)
        sess_q = sess_q.filter(SessionModel.is_simulated == False)
        ev_q = ev_q.filter(Event.is_simulated == False)
        fav_q = fav_q.filter(Favorite.is_simulated == False)

    total_visitors = vis_q.count()
    real_visitors = db.query(Visitor).filter(Visitor.is_simulated == False).count()
    sim_visitors = db.query(Visitor).filter(Visitor.is_simulated == True).count()

    total_sessions = sess_q.count()
    total_events = ev_q.count()
    total_favorites = fav_q.count()

    avg_duration = (
        sess_q.with_entities(func.avg(SessionModel.duration_seconds)).scalar() or 0.0
    )
    contact_clicks = ev_q.filter(Event.event_name == "contact_click").count()
    product_views = ev_q.filter(Event.event_name == "product_view").count()
    article_views = ev_q.filter(Event.event_name == "article_view").count()

    conversion_rate = (
        round(float(contact_clicks / max(1, total_visitors) * 100.0), 2)
        if total_visitors > 0
        else 0.0
    )

    # Daily traffic series
    all_recent_events = ev_q.all()
    daily_map = {}
    for i in range(min(days, 30) - 1, -1, -1):
        d_str = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_map[d_str] = {
            "date": d_str,
            "total_events": 0,
            "product_views": 0,
            "article_views": 0,
            "interactions": 0,
        }

    for ev in all_recent_events:
        d_str = ev.occurred_at.strftime("%Y-%m-%d")
        if d_str in daily_map:
            daily_map[d_str]["total_events"] += 1
            if ev.event_name == "product_view":
                daily_map[d_str]["product_views"] += 1
            elif ev.event_name == "article_view":
                daily_map[d_str]["article_views"] += 1
            elif ev.event_name in ("favorite", "share", "contact_click"):
                daily_map[d_str]["interactions"] += 1

    # Referrer & Device breakdown
    ref_rows = (
        sess_q.with_entities(SessionModel.referrer, func.count(SessionModel.session_id))
        .group_by(SessionModel.referrer)
        .all()
    )
    dev_rows = (
        sess_q.with_entities(SessionModel.device, func.count(SessionModel.session_id))
        .group_by(SessionModel.device)
        .all()
    )

    return {
        "period_days": days,
        "include_simulated": include_simulated,
        "kpis": {
            "total_visitors": total_visitors,
            "real_visitors": real_visitors,
            "simulated_visitors": sim_visitors,
            "total_sessions": total_sessions,
            "total_events": total_events,
            "product_views": product_views,
            "article_views": article_views,
            "total_favorites": total_favorites,
            "contact_clicks": contact_clicks,
            "avg_session_duration_seconds": round(float(avg_duration), 1),
            "contact_conversion_rate_pct": conversion_rate,
            "total_products": db.query(Product).count(),
            "total_articles": db.query(Article).count(),
        },
        "daily_traffic": list(daily_map.values()),
        "referrer_distribution": [
            {"source": r or "direct", "count": c} for r, c in ref_rows
        ],
        "device_distribution": [
            {"device": d or "desktop", "count": c} for d, c in dev_rows
        ],
    }


@router.get("/analytics/products")
def analytics_products(
    days: int = Query(default=30, ge=1, le=365),
    include_simulated: bool = Query(default=True),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    products = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.location))
        .order_by(Product.product_id.asc())
        .all()
    )

    ev_q = db.query(Event).filter(
        Event.occurred_at >= cutoff, Event.content_type == "product"
    )
    if not include_simulated:
        ev_q = ev_q.filter(Event.is_simulated == False)
    events = ev_q.all()

    stats_by_pid = {
        p.product_id: {
            "views": 0,
            "scrolls": 0,
            "favorites": 0,
            "shares": 0,
            "contacts": 0,
            "rec_clicks": 0,
            "unique_visitors": set(),
        }
        for p in products
    }

    for ev in events:
        pid = ev.content_id
        if pid in stats_by_pid:
            st = stats_by_pid[pid]
            st["unique_visitors"].add(ev.visitor_id)
            if ev.event_name == "product_view":
                st["views"] += 1
            elif ev.event_name == "scroll":
                st["scrolls"] += 1
            elif ev.event_name == "favorite":
                st["favorites"] += 1
            elif ev.event_name == "share":
                st["shares"] += 1
            elif ev.event_name == "contact_click":
                st["contacts"] += 1
            elif ev.event_name == "recommendation_click":
                st["rec_clicks"] += 1

    product_items = []
    cat_agg = {}

    for p in products:
        st = stats_by_pid[p.product_id]
        views = st["views"]
        favs = st["favorites"]
        contacts = st["contacts"]
        shares = st["shares"]
        scrolls = st["scrolls"]
        # Weighted Interest Score using Plan Section 13.4 weights (1, 2, 3, 4, 5)
        interest_score = (
            views * 1 + scrolls * 2 + favs * 3 + shares * 4 + contacts * 5
        )
        cat_name = p.category.name if p.category else "Khác"
        cat_agg.setdefault(
            cat_name,
            {"category_name": cat_name, "views": 0, "favorites": 0, "contacts": 0, "interest_score": 0},
        )
        cat_agg[cat_name]["views"] += views
        cat_agg[cat_name]["favorites"] += favs
        cat_agg[cat_name]["contacts"] += contacts
        cat_agg[cat_name]["interest_score"] += interest_score

        product_items.append(
            {
                "product_id": p.product_id,
                "product_name": p.product_name,
                "slug": p.slug,
                "category_name": cat_name,
                "location_name": p.location.district if p.location else p.origin,
                "certification": p.certification,
                "views": views,
                "unique_visitors": len(st["unique_visitors"]),
                "deep_scrolls": scrolls,
                "favorites": favs,
                "shares": shares,
                "contact_clicks": contacts,
                "recommendation_clicks": st["rec_clicks"],
                "interest_score": interest_score,
                "engagement_rate_pct": round(
                    float((favs + shares + contacts) / max(1, views) * 100.0), 2
                ),
            }
        )

    product_items.sort(key=lambda x: x["interest_score"], reverse=True)
    return {
        "period_days": days,
        "products": product_items,
        "category_breakdown": list(cat_agg.values()),
    }


@router.get("/analytics/behavior")
def analytics_behavior(
    days: int = Query(default=30, ge=1, le=365),
    include_simulated: bool = Query(default=True),
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    cutoff = datetime.utcnow() - timedelta(days=days)
    ev_q = db.query(Event).filter(Event.occurred_at >= cutoff)
    if not include_simulated:
        ev_q = ev_q.filter(Event.is_simulated == False)

    event_counts_raw = (
        ev_q.with_entities(Event.event_name, func.count(Event.event_id))
        .group_by(Event.event_name)
        .all()
    )
    counts_dict = {name: cnt for name, cnt in event_counts_raw}

    taxonomy_order = [
        ("page_view", "Xem trang (page_view)"),
        ("product_view", "Xem sản phẩm (product_view)"),
        ("article_view", "Xem bài viết (article_view)"),
        ("scroll", "Cuộn nội dung sâu (scroll)"),
        ("search", "Tìm kiếm (search)"),
        ("recommendation_view", "Xem khu vực gợi ý (recommendation_view)"),
        ("recommendation_click", "Nhấn nội dung gợi ý (recommendation_click)"),
        ("favorite", "Yêu thích (favorite)"),
        ("share", "Chia sẻ (share)"),
        ("contact_click", "Nhấn liên hệ (contact_click)"),
    ]

    event_breakdown = [
        {
            "event_name": code,
            "label": label,
            "count": counts_dict.get(code, 0),
        }
        for code, label in taxonomy_order
    ]

    # Conversion funnel
    funnel = [
        {"stage": "1. Truy cập trang (page_view)", "count": counts_dict.get("page_view", 0)},
        {
            "stage": "2. Xem nội dung (product/article_view)",
            "count": counts_dict.get("product_view", 0) + counts_dict.get("article_view", 0),
        },
        {"stage": "3. Đọc sâu (scroll >= 50%)", "count": counts_dict.get("scroll", 0)},
        {
            "stage": "4. Tương tác (favorite / share)",
            "count": counts_dict.get("favorite", 0) + counts_dict.get("share", 0),
        },
        {"stage": "5. Nhấn liên hệ (contact_click)", "count": counts_dict.get("contact_click", 0)},
    ]

    # Top search queries
    search_events = ev_q.filter(Event.event_name == "search").limit(500).all()
    query_freq = {}
    for sev in search_events:
        q_str = (sev.properties or {}).get("query", "").strip().lower()
        if q_str:
            query_freq[q_str] = query_freq.get(q_str, 0) + 1
    top_searches = [
        {"query": k, "count": v}
        for k, v in sorted(query_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    ]

    # Recent real-time event stream
    recent_events = ev_q.order_by(Event.occurred_at.desc()).limit(25).all()

    return {
        "period_days": days,
        "event_breakdown": event_breakdown,
        "funnel": funnel,
        "top_searches": top_searches,
        "recent_events": [
            {
                "event_id": e.event_id,
                "visitor_id": e.visitor_id,
                "session_id": e.session_id,
                "event_name": e.event_name,
                "content_type": e.content_type,
                "content_id": e.content_id,
                "is_simulated": e.is_simulated,
                "occurred_at": e.occurred_at,
                "properties": e.properties,
            }
            for e in recent_events
        ],
    }


@router.get("/analytics/segments")
def analytics_segments(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    active_km = (
        db.query(MLModel)
        .filter(MLModel.model_type == "clustering", MLModel.is_active == True)
        .order_by(MLModel.trained_at.desc())
        .first()
    )
    if not active_km:
        train_and_evaluate_kmeans(db)
        active_km = (
            db.query(MLModel)
            .filter(MLModel.model_type == "clustering", MLModel.is_active == True)
            .order_by(MLModel.trained_at.desc())
            .first()
        )

    profiles = (
        db.query(ClusterProfile)
        .filter(ClusterProfile.model_id == active_km.model_id)
        .order_by(ClusterProfile.cluster_index.asc())
        .all()
    )

    # Sample visitors per cluster for scatter visualization (P vs A vs Duration)
    results_rows = (
        db.query(ClusterResult, UserFeature)
        .join(UserFeature, ClusterResult.visitor_id == UserFeature.visitor_id)
        .filter(ClusterResult.model_id == active_km.model_id)
        .limit(350)
        .all()
    )

    scatter_points = [
        {
            "visitor_id": cr.visitor_id,
            "cluster_index": cr.cluster_index,
            "distance": cr.distance_to_centroid,
            "S": uf.total_sessions,
            "P": uf.total_product_views,
            "A": uf.total_article_views,
            "T": uf.avg_session_duration,
            "Q": uf.total_searches,
            "F": uf.total_favorites,
            "C": uf.total_contact_clicks,
            "R": uf.return_visits,
            "U": uf.unique_products_viewed,
        }
        for cr, uf in results_rows
    ]

    return {
        "model": {
            "model_id": active_km.model_id,
            "version": active_km.version,
            "trained_at": active_km.trained_at,
            "parameters": active_km.parameters,
            "metrics": active_km.metrics,
        },
        "feature_Metadata": [
            {"column": col, "label": FEATURE_SYMBOLS[col]} for col in FEATURE_COLUMNS
        ],
        "profiles": [
            {
                "cluster_index": p.cluster_index,
                "cluster_name": p.cluster_name,
                "cluster_description": p.cluster_description,
                "size": p.size,
                "percentage": p.percentage,
                "centroid_features": p.centroid_features,
                "dominant_characteristics": p.dominant_characteristics,
                "recommended_strategy": p.recommended_strategy,
            }
            for p in profiles
        ],
        "scatter_sample": scatter_points,
    }


@router.post("/ml/clustering/train")
def trigger_kmeans_training(
    payload: TrainClusteringRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    result = train_and_evaluate_kmeans(
        db=db,
        k_min=payload.k_min,
        k_max=payload.k_max,
        forced_k=payload.forced_k,
        include_simulated=payload.include_simulated,
        random_seed=payload.random_seed,
    )
    _log_audit(
        db,
        current_admin.admin_id,
        "train_kmeans",
        "ml_models",
        result["version"],
        {"selected_k": result["selected_k"]},
    )
    return result


@router.post("/ml/recommendation/build")
def trigger_recommender_build(
    payload: BuildRecommendationRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    result = build_and_evaluate_recommender(
        db=db,
        weights=payload.weights,
        top_k=payload.top_k,
    )
    _log_audit(
        db,
        current_admin.admin_id,
        "build_recommender",
        "ml_models",
        result["version"],
        {"vocab_size": result["vocab_size"]},
    )
    return result


@router.get("/ml/evaluations")
def get_ml_evaluations(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    models = db.query(MLModel).order_by(MLModel.trained_at.desc()).limit(20).all()
    active_clustering = next(
        (m for m in models if m.model_type == "clustering" and m.is_active), None
    )
    active_rec = next(
        (m for m in models if m.model_type == "recommendation" and m.is_active), None
    )

    rec_logs_count = db.query(RecommendationLog).count()
    strategy_rows = (
        db.query(RecommendationLog.strategy, func.count(RecommendationLog.log_id))
        .group_by(RecommendationLog.strategy)
        .all()
    )
    rec_views = db.query(Event).filter(Event.event_name == "recommendation_view").count()
    rec_clicks = db.query(Event).filter(Event.event_name == "recommendation_click").count()

    return {
        "active_clustering_model": {
            "model_id": active_clustering.model_id,
            "version": active_clustering.version,
            "trained_at": active_clustering.trained_at,
            "parameters": active_clustering.parameters,
            "metrics": active_clustering.metrics,
        }
        if active_clustering
        else None,
        "active_recommendation_model": {
            "model_id": active_rec.model_id,
            "version": active_rec.version,
            "trained_at": active_rec.trained_at,
            "parameters": active_rec.parameters,
            "metrics": active_rec.metrics,
        }
        if active_rec
        else None,
        "recommendation_Traffic_stats": {
            "total_api_logs": rec_logs_count,
            "recommendation_views": rec_views,
            "recommendation_clicks": rec_clicks,
            "ctr_pct": round(float(rec_clicks / max(1, rec_views) * 100.0), 2),
            "strategy_distribution": [
                {"strategy": s, "count": c} for s, c in strategy_rows
            ],
        },
        "model_history": [
            {
                "model_id": m.model_id,
                "model_name": m.model_name,
                "model_type": m.model_type,
                "version": m.version,
                "is_active": m.is_active,
                "trained_at": m.trained_at,
                "parameters": m.parameters,
                "metrics": m.metrics,
            }
            for m in models
        ],
    }


@router.get("/simulation/scenarios")
def list_simulation_scenarios(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    scenarios = ensure_simulation_scenarios(db)
    sim_visitors = db.query(Visitor).filter(Visitor.is_simulated == True).count()
    real_visitors = db.query(Visitor).filter(Visitor.is_simulated == False).count()
    sim_sessions = db.query(SessionModel).filter(SessionModel.is_simulated == True).count()
    sim_events = db.query(Event).filter(Event.is_simulated == True).count()

    return {
        "summary": {
            "simulated_visitors": sim_visitors,
            "real_visitors": real_visitors,
            "simulated_sessions": sim_sessions,
            "simulated_events": sim_events,
        },
        "scenarios": [
            {
                "scenario_id": s.scenario_id,
                "scenario_code": s.scenario_code,
                "name": s.name,
                "description": s.description,
                "visitor_ratio": s.visitor_ratio,
                "behavior_params": s.behavior_params,
                "last_run_at": s.last_run_at,
            }
            for s in scenarios
        ],
    }


@router.post("/simulation/generate")
def run_simulation_generator(
    payload: SimulationRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    sim_res = generate_synthetic_dataset(
        db=db,
        num_visitors=payload.num_visitors,
        random_seed=payload.random_seed,
        clear_existing_simulated=payload.clear_existing_simulated,
    )
    ml_res = {}
    if payload.auto_retrain_models:
        km_res = train_and_evaluate_kmeans(db=db, random_seed=payload.random_seed)
        cb_res = build_and_evaluate_recommender(db=db)
        ml_res = {
            "kmeans_version": km_res["version"],
            "kmeans_selected_k": km_res["selected_k"],
            "recommender_version": cb_res["version"],
        }

    _log_audit(
        db,
        current_admin.admin_id,
        "generate_synthetic_data",
        "simulation_scenarios",
        f"seed_{payload.random_seed}",
        {**sim_res, **ml_res},
    )
    return {
        "status": "completed",
        "simulation": sim_res,
        "ml_retrained": ml_res,
    }


# ─── Admin Content Management CRUD (Products, Articles, Categories) ───

@router.post("/products")
def create_product(
    payload: ProductCreateUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    prod = Product(**payload.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    sync_contents_table(db)
    _log_audit(db, current_admin.admin_id, "create_product", "products", str(prod.product_id))
    return ProductSchema.model_validate(prod)


@router.put("/products/{product_id}")
def update_product(
    product_id: int,
    payload: ProductCreateUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    prod = db.query(Product).filter(Product.product_id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    for k, v in payload.model_dump().items():
        setattr(prod, k, v)
    db.commit()
    db.refresh(prod)
    sync_contents_table(db)
    _log_audit(db, current_admin.admin_id, "update_product", "products", str(prod.product_id))
    return ProductSchema.model_validate(prod)


@router.delete("/products/{product_id}")
def delete_product(
    product_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    prod = db.query(Product).filter(Product.product_id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    db.delete(prod)
    db.commit()
    sync_contents_table(db)
    _log_audit(db, current_admin.admin_id, "delete_product", "products", str(product_id))
    return {"status": "deleted", "product_id": product_id}


@router.post("/articles")
def create_article(
    payload: ArticleCreateUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    data = payload.model_dump()
    p_ids = data.pop("product_ids", [])
    art = Article(**data)
    if p_ids:
        art.products = db.query(Product).filter(Product.product_id.in_(p_ids)).all()
    db.add(art)
    db.commit()
    db.refresh(art)
    sync_contents_table(db)
    _log_audit(db, current_admin.admin_id, "create_article", "articles", str(art.article_id))
    return ArticleSchema.model_validate(art)


@router.put("/articles/{article_id}")
def update_article(
    article_id: int,
    payload: ArticleCreateUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    art = db.query(Article).filter(Article.article_id == article_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
    data = payload.model_dump()
    p_ids = data.pop("product_ids", [])
    for k, v in data.items():
        setattr(art, k, v)
    art.products = db.query(Product).filter(Product.product_id.in_(p_ids)).all() if p_ids else []
    db.commit()
    db.refresh(art)
    sync_contents_table(db)
    _log_audit(db, current_admin.admin_id, "update_article", "articles", str(art.article_id))
    return ArticleSchema.model_validate(art)


@router.delete("/articles/{article_id}")
def delete_article(
    article_id: int,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    art = db.query(Article).filter(Article.article_id == article_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
    db.delete(art)
    db.commit()
    sync_contents_table(db)
    _log_audit(db, current_admin.admin_id, "delete_article", "articles", str(article_id))
    return {"status": "deleted", "article_id": article_id}


@router.post("/categories")
def create_category(
    payload: CategoryCreateUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    cat = Category(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    _log_audit(db, current_admin.admin_id, "create_category", "categories", str(cat.category_id))
    return CategorySchema.model_validate(cat)


@router.put("/categories/{category_id}")
def update_category(
    category_id: int,
    payload: CategoryCreateUpdate,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    cat = db.query(Category).filter(Category.category_id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Không tìm thấy danh mục.")
    for k, v in payload.model_dump().items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    _log_audit(db, current_admin.admin_id, "update_category", "categories", str(cat.category_id))
    return CategorySchema.model_validate(cat)
