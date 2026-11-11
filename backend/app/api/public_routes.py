from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.entities import (
    Article,
    Category,
    Event,
    Favorite,
    Location,
    Product,
    SessionModel,
    Visitor,
)
from app.schemas.api_schemas import (
    ArticleSchema,
    CategorySchema,
    EventCreateRequest,
    FavoriteCreateRequest,
    ProductSchema,
)
from ml.src.features.feature_builder import compute_and_store_user_features
from ml.src.recommendation.content_based import get_recommendations_for_visitor

router = APIRouter(tags=["Public API"])

VALID_EVENTS = {
    "page_view",
    "product_view",
    "article_view",
    "search",
    "scroll",
    "favorite",
    "share",
    "contact_click",
    "recommendation_view",
    "recommendation_click",
}


@router.get("/products")
def list_products(
    category_id: Optional[int] = Query(default=None),
    category_slug: Optional[str] = Query(default=None),
    location_id: Optional[int] = Query(default=None),
    q: Optional[str] = Query(default=None),
    sort: Optional[str] = Query(default="featured"),
    db: Session = Depends(get_db),
):
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.location),
        joinedload(Product.articles),
    )
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if category_slug:
        query = query.join(Category).filter(Category.slug == category_slug)
    if location_id:
        query = query.filter(Product.location_id == location_id)
    if q:
        kw = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Product.product_name.ilike(kw),
                Product.description.ilike(kw),
                Product.keywords.ilike(kw),
                Product.origin.ilike(kw),
            )
        )

    if sort == "popular":
        query = query.order_by(Product.view_count.desc())
    elif sort == "favorites":
        query = query.order_by(Product.favorite_count.desc())
    else:
        query = query.order_by(Product.product_id.asc())

    products = query.all()
    return {
        "total": len(products),
        "items": [ProductSchema.model_validate(p) for p in products],
    }


@router.get("/products/{id_or_slug}")
def get_product_detail(id_or_slug: str, db: Session = Depends(get_db)):
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.location),
        joinedload(Product.articles),
    )
    if id_or_slug.isdigit():
        product = query.filter(Product.product_id == int(id_or_slug)).first()
    else:
        product = query.filter(Product.slug == id_or_slug).first()

    if not product:
        raise HTTPException(status_code=404, detail="Không tìm thấy sản phẩm.")
    return ProductSchema.model_validate(product)


@router.get("/articles")
def list_articles(
    content_type: Optional[str] = Query(default=None),
    product_id: Optional[int] = Query(default=None),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Article)
        .options(joinedload(Article.products))
        .filter(Article.status == "published")
    )
    if content_type:
        query = query.filter(Article.content_type == content_type)
    if product_id:
        query = query.filter(Article.products.any(Product.product_id == product_id))
    if q:
        kw = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Article.title.ilike(kw),
                Article.excerpt.ilike(kw),
                Article.content.ilike(kw),
                Article.keywords.ilike(kw),
            )
        )
    articles = query.order_by(Article.published_at.desc()).limit(limit).all()
    return {
        "total": len(articles),
        "items": [ArticleSchema.model_validate(a) for a in articles],
    }


@router.get("/articles/{id_or_slug}")
def get_article_detail(id_or_slug: str, db: Session = Depends(get_db)):
    query = db.query(Article).options(joinedload(Article.products))
    if id_or_slug.isdigit():
        article = query.filter(Article.article_id == int(id_or_slug)).first()
    else:
        article = query.filter(Article.slug == id_or_slug).first()

    if not article:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết.")
    return ArticleSchema.model_validate(article)


@router.get("/categories")
def list_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.display_order.asc()).all()
    counts = dict(
        db.query(Product.category_id, func.count(Product.product_id))
        .group_by(Product.category_id)
        .all()
    )
    locations = db.query(Location).order_by(Location.location_id.asc()).all()
    out = []
    for c in categories:
        data = CategorySchema.model_validate(c).model_dump()
        data["product_count"] = counts.get(c.category_id, 0)
        out.append(data)
    return {
        "categories": out,
        "locations": [
            {
                "location_id": loc.location_id,
                "name": loc.name,
                "slug": loc.slug,
                "district": loc.district,
                "altitude": loc.altitude,
                "climate": loc.climate,
                "soil_type": loc.soil_type,
                "description": loc.description,
                "latitude": loc.latitude,
                "longitude": loc.longitude,
            }
            for loc in locations
        ],
    }


@router.get("/search")
def search_all(
    q: str = Query(default="", description="Từ khóa tìm kiếm sản phẩm & bài viết"),
    category_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
):
    keyword = q.strip()
    prod_q = db.query(Product).options(joinedload(Product.category), joinedload(Product.location))
    art_q = db.query(Article).options(joinedload(Article.products)).filter(Article.status == "published")

    if category_id:
        prod_q = prod_q.filter(Product.category_id == category_id)

    if keyword:
        kw = f"%{keyword}%"
        prod_q = prod_q.filter(
            or_(
                Product.product_name.ilike(kw),
                Product.short_description.ilike(kw),
                Product.description.ilike(kw),
                Product.keywords.ilike(kw),
                Product.origin.ilike(kw),
                Product.characteristics.ilike(kw),
            )
        )
        art_q = art_q.filter(
            or_(
                Article.title.ilike(kw),
                Article.excerpt.ilike(kw),
                Article.content.ilike(kw),
                Article.keywords.ilike(kw),
            )
        )

    matched_products = prod_q.order_by(Product.view_count.desc()).all()
    matched_articles = art_q.order_by(Article.view_count.desc()).all()

    return {
        "query": keyword,
        "product_count": len(matched_products),
        "article_count": len(matched_articles),
        "products": [ProductSchema.model_validate(p) for p in matched_products],
        "articles": [ArticleSchema.model_validate(a) for a in matched_articles],
    }


@router.get("/recommendations")
def get_recommendations(
    visitor_id: Optional[str] = Query(default=None),
    session_id: Optional[str] = Query(default=None),
    current_content_type: Optional[str] = Query(default=None),
    current_content_id: Optional[int] = Query(default=None),
    target_type: Optional[str] = Query(default=None),
    limit: int = Query(default=5, ge=1, le=12),
    db: Session = Depends(get_db),
):
    return get_recommendations_for_visitor(
        db=db,
        visitor_id=visitor_id,
        session_id=session_id,
        current_content_type=current_content_type,
        current_content_id=current_content_id,
        target_type=target_type,
        limit=limit,
        log_exposure=True,
    )


@router.post("/events")
def record_event(payload: EventCreateRequest, db: Session = Depends(get_db)):
    if payload.event_name not in VALID_EVENTS:
        raise HTTPException(
            status_code=400,
            detail=f"Sự kiện '{payload.event_name}' không hợp lệ. Phải thuộc: {sorted(VALID_EVENTS)}",
        )

    now = datetime.utcnow()

    # 1. Ensure Visitor exists
    visitor = db.query(Visitor).filter(Visitor.visitor_id == payload.visitor_id).first()
    if not visitor:
        visitor = Visitor(
            visitor_id=payload.visitor_id,
            first_seen_at=now,
            last_seen_at=now,
            device_type=payload.device_type or "desktop",
            referrer_source=payload.referrer_source or "direct",
            is_simulated=False,
        )
        db.add(visitor)
    else:
        visitor.last_seen_at = now

    # 2. Ensure Session exists
    sess = db.query(SessionModel).filter(SessionModel.session_id == payload.session_id).first()
    if not sess:
        sess = SessionModel(
            session_id=payload.session_id,
            visitor_id=payload.visitor_id,
            started_at=now,
            ended_at=now,
            duration_seconds=15.0,
            page_count=1,
            referrer=payload.referrer_source or "direct",
            device=payload.device_type or "desktop",
            is_simulated=visitor.is_simulated,
        )
        db.add(sess)
    else:
        sess.ended_at = now
        elapsed = (now - sess.started_at).total_seconds()
        sess.duration_seconds = max(sess.duration_seconds + 10.0, min(elapsed, 3600.0))
        if payload.event_name in ("page_view", "product_view", "article_view"):
            sess.page_count += 1

    # 3. Deduplicate accidental rapid duplicate events within 2 seconds
    two_sec_ago = now - timedelta(seconds=2)
    dup = (
        db.query(Event)
        .filter(
            Event.visitor_id == payload.visitor_id,
            Event.session_id == payload.session_id,
            Event.event_name == payload.event_name,
            Event.content_type == payload.content_type,
            Event.content_id == payload.content_id,
            Event.occurred_at >= two_sec_ago,
        )
        .first()
    )
    if dup:
        db.commit()
        return {"status": "deduplicated", "event_id": dup.event_id}

    new_event = Event(
        visitor_id=payload.visitor_id,
        session_id=payload.session_id,
        event_name=payload.event_name,
        content_type=payload.content_type,
        content_id=payload.content_id,
        occurred_at=now,
        properties=payload.properties or {},
        is_simulated=visitor.is_simulated,
    )
    db.add(new_event)

    # Update counters on Product or Article
    if payload.content_type == "product" and payload.content_id:
        prod = db.query(Product).filter(Product.product_id == payload.content_id).first()
        if prod:
            if payload.event_name == "product_view":
                prod.view_count += 1
            elif payload.event_name == "contact_click":
                prod.contact_click_count += 1
    elif payload.content_type == "article" and payload.content_id:
        art = db.query(Article).filter(Article.article_id == payload.content_id).first()
        if art and payload.event_name == "article_view":
            art.view_count += 1

    db.commit()
    db.refresh(new_event)

    # Incrementally refresh this visitor's feature vector X = [S, P, A, T, Q, F, C, R, U]
    compute_and_store_user_features(db, visitor_id=payload.visitor_id)

    return {
        "status": "recorded",
        "event_id": new_event.event_id,
        "visitor_id": new_event.visitor_id,
        "session_id": new_event.session_id,
        "event_name": new_event.event_name,
        "occurred_at": new_event.occurred_at,
    }


@router.get("/favorites")
def list_visitor_favorites(visitor_id: str = Query(...), db: Session = Depends(get_db)):
    favs = (
        db.query(Favorite)
        .filter(Favorite.visitor_id == visitor_id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    product_ids = [f.content_id for f in favs if f.content_type == "product"]
    article_ids = [f.content_id for f in favs if f.content_type == "article"]

    prods = (
        db.query(Product)
        .options(joinedload(Product.category), joinedload(Product.location))
        .filter(Product.product_id.in_(product_ids))
        .all()
        if product_ids
        else []
    )
    arts = (
        db.query(Article)
        .filter(Article.article_id.in_(article_ids))
        .all()
        if article_ids
        else []
    )

    return {
        "visitor_id": visitor_id,
        "favorites": [
            {
                "favorite_id": f.favorite_id,
                "content_type": f.content_type,
                "content_id": f.content_id,
                "created_at": f.created_at,
            }
            for f in favs
        ],
        "products": [ProductSchema.model_validate(p) for p in prods],
        "articles": [ArticleSchema.model_validate(a) for a in arts],
    }


@router.post("/favorites")
def toggle_favorite(payload: FavoriteCreateRequest, db: Session = Depends(get_db)):
    now = datetime.utcnow()
    visitor = db.query(Visitor).filter(Visitor.visitor_id == payload.visitor_id).first()
    if not visitor:
        visitor = Visitor(
            visitor_id=payload.visitor_id,
            first_seen_at=now,
            last_seen_at=now,
            is_simulated=False,
        )
        db.add(visitor)
        db.flush()

    existing = (
        db.query(Favorite)
        .filter(
            Favorite.visitor_id == payload.visitor_id,
            Favorite.content_type == payload.content_type,
            Favorite.content_id == payload.content_id,
        )
        .first()
    )

    if existing:
        db.delete(existing)
        action = "removed"
        if payload.content_type == "product":
            prod = db.query(Product).filter(Product.product_id == payload.content_id).first()
            if prod and prod.favorite_count > 0:
                prod.favorite_count -= 1
        elif payload.content_type == "article":
            art = db.query(Article).filter(Article.article_id == payload.content_id).first()
            if art and art.favorite_count > 0:
                art.favorite_count -= 1
    else:
        fav = Favorite(
            visitor_id=payload.visitor_id,
            content_type=payload.content_type,
            content_id=payload.content_id,
            is_simulated=visitor.is_simulated,
            created_at=now,
        )
        db.add(fav)
        action = "added"
        if payload.content_type == "product":
            prod = db.query(Product).filter(Product.product_id == payload.content_id).first()
            if prod:
                prod.favorite_count += 1
        elif payload.content_type == "article":
            art = db.query(Article).filter(Article.article_id == payload.content_id).first()
            if art:
                art.favorite_count += 1

        # Also log a `favorite` tracking event
        sid = payload.session_id or f"sess_fav_{payload.visitor_id[:12]}"
        sess = db.query(SessionModel).filter(SessionModel.session_id == sid).first()
        if not sess:
            sess = SessionModel(
                session_id=sid,
                visitor_id=payload.visitor_id,
                started_at=now,
                ended_at=now,
                duration_seconds=30.0,
                page_count=1,
                is_simulated=visitor.is_simulated,
            )
            db.add(sess)
        db.add(
            Event(
                visitor_id=payload.visitor_id,
                session_id=sid,
                event_name="favorite",
                content_type=payload.content_type,
                content_id=payload.content_id,
                occurred_at=now,
                properties={"action": "added"},
                is_simulated=visitor.is_simulated,
            )
        )

    db.commit()
    compute_and_store_user_features(db, visitor_id=payload.visitor_id)
    return {
        "status": action,
        "visitor_id": payload.visitor_id,
        "content_type": payload.content_type,
        "content_id": payload.content_id,
    }
