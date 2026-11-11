from datetime import datetime
from typing import Dict, List
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from app.models.entities import Event, Favorite, SessionModel, UserFeature, Visitor

FEATURE_COLUMNS = [
    "total_sessions",          # S: số phiên
    "total_product_views",     # P: lượt xem sản phẩm
    "total_article_views",     # A: lượt xem bài viết
    "avg_session_duration",    # T: thời gian tương tác trung bình (giây)
    "total_searches",          # Q: lượt tìm kiếm
    "total_favorites",         # F: lượt yêu thích
    "total_contact_clicks",    # C: lượt liên hệ
    "return_visits",           # R: lượt quay lại (sessions - 1)
    "unique_products_viewed",  # U: số sản phẩm khác nhau đã xem
]

FEATURE_SYMBOLS = {
    "total_sessions": "S (Số phiên)",
    "total_product_views": "P (Xem sản phẩm)",
    "total_article_views": "A (Xem bài viết)",
    "avg_session_duration": "T (Thời gian TB giây)",
    "total_searches": "Q (Lượt tìm kiếm)",
    "total_favorites": "F (Lượt yêu thích)",
    "total_contact_clicks": "C (Nhấn liên hệ)",
    "return_visits": "R (Lượt quay lại)",
    "unique_products_viewed": "U (SP khác nhau)",
}


def compute_and_store_user_features(db: Session, visitor_id: str | None = None) -> List[UserFeature]:
    """
    Aggregate behavioral events & sessions per visitor into UserFeature table:
    X = [S, P, A, T, Q, F, C, R, U]
    """
    visitor_query = db.query(Visitor)
    if visitor_id:
        visitor_query = visitor_query.filter(Visitor.visitor_id == visitor_id)
    visitors = visitor_query.all()
    if not visitors:
        return []

    visitor_ids = [v.visitor_id for v in visitors]
    visitor_sim_map = {v.visitor_id: v.is_simulated for v in visitors}

    # Fetch sessions
    sessions_q = db.query(SessionModel)
    if visitor_id:
        sessions_q = sessions_q.filter(SessionModel.visitor_id == visitor_id)
    all_sessions = sessions_q.all()

    sess_by_vis: Dict[str, List[SessionModel]] = {vid: [] for vid in visitor_ids}
    for s in all_sessions:
        if s.visitor_id in sess_by_vis:
            sess_by_vis[s.visitor_id].append(s)

    # Fetch events
    events_q = db.query(Event)
    if visitor_id:
        events_q = events_q.filter(Event.visitor_id == visitor_id)
    all_events = events_q.all()

    events_by_vis: Dict[str, List[Event]] = {vid: [] for vid in visitor_ids}
    for ev in all_events:
        if ev.visitor_id in events_by_vis:
            events_by_vis[ev.visitor_id].append(ev)

    # Fetch existing UserFeature records
    existing_q = db.query(UserFeature)
    if visitor_id:
        existing_q = existing_q.filter(UserFeature.visitor_id == visitor_id)
    existing_map = {uf.visitor_id: uf for uf in existing_q.all()}

    updated_features: List[UserFeature] = []
    now = datetime.utcnow()

    for vid in visitor_ids:
        vis_sessions = sess_by_vis.get(vid, [])
        vis_events = events_by_vis.get(vid, [])

        total_sessions = max(len(vis_sessions), 1 if vis_events else 0)
        return_visits = max(0, total_sessions - 1)

        if vis_sessions:
            durations = [max(float(s.duration_seconds or 0.0), 5.0) for s in vis_sessions]
            avg_duration = float(np.mean(durations))
        else:
            avg_duration = float(len(vis_events) * 25.0)

        page_views = 0
        product_views = 0
        article_views = 0
        searches = 0
        favorites = 0
        shares = 0
        contact_clicks = 0
        deep_scrolls = 0
        unique_products = set()

        for ev in vis_events:
            ename = ev.event_name
            if ename == "page_view":
                page_views += 1
            elif ename == "product_view":
                product_views += 1
                page_views += 1
                if ev.content_id is not None:
                    unique_products.add(ev.content_id)
            elif ename == "article_view":
                article_views += 1
                page_views += 1
            elif ename == "search":
                searches += 1
            elif ename == "favorite":
                favorites += 1
                if ev.content_type == "product" and ev.content_id is not None:
                    unique_products.add(ev.content_id)
            elif ename == "share":
                shares += 1
            elif ename == "contact_click":
                contact_clicks += 1
            elif ename == "scroll":
                props = ev.properties or {}
                depth = props.get("scroll_depth", 75)
                if depth >= 50:
                    deep_scrolls += 1

        uf = existing_map.get(vid)
        if not uf:
            uf = UserFeature(visitor_id=vid)
            db.add(uf)

        uf.total_sessions = total_sessions
        uf.total_page_views = page_views
        uf.total_product_views = product_views
        uf.total_article_views = article_views
        uf.avg_session_duration = round(avg_duration, 2)
        uf.total_searches = searches
        uf.total_favorites = favorites
        uf.total_shares = shares
        uf.total_contact_clicks = contact_clicks
        uf.unique_products_viewed = len(unique_products)
        uf.return_visits = return_visits
        uf.deep_scroll_count = deep_scrolls
        uf.is_simulated = bool(visitor_sim_map.get(vid, False))
        uf.updated_at = now
        updated_features.append(uf)

    db.commit()
    return updated_features


def get_feature_dataframe(db: Session, include_simulated: bool = True) -> pd.DataFrame:
    q = db.query(UserFeature)
    if not include_simulated:
        q = q.filter(UserFeature.is_simulated == False)
    rows = q.all()
    if not rows:
        compute_and_store_user_features(db)
        rows = q.all()

    data = []
    for r in rows:
        data.append(
            {
                "visitor_id": r.visitor_id,
                "total_sessions": r.total_sessions,
                "total_product_views": r.total_product_views,
                "total_article_views": r.total_article_views,
                "avg_session_duration": r.avg_session_duration,
                "total_searches": r.total_searches,
                "total_favorites": r.total_favorites,
                "total_contact_clicks": r.total_contact_clicks,
                "return_visits": r.return_visits,
                "unique_products_viewed": r.unique_products_viewed,
                "total_page_views": r.total_page_views,
                "total_shares": r.total_shares,
                "deep_scroll_count": r.deep_scroll_count,
                "is_simulated": r.is_simulated,
            }
        )
    return pd.DataFrame(data)
