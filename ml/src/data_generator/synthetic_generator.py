from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.entities import (
    Article,
    Event,
    Favorite,
    Product,
    SessionModel,
    SimulationScenario,
    UserFeature,
    Visitor,
)
from ml.src.features.feature_builder import compute_and_store_user_features

DEFAULT_SCENARIOS = [
    {
        "scenario_code": "casual_browsing",
        "name": "Kịch bản 1: Khách vãng lai xem nhanh (Casual Browsers)",
        "description": "Người truy cập mới vào website qua mạng xã hội hoặc tìm kiếm, chỉ xem 1-2 trang trong thời gian ngắn rồi thoát, ít tương tác sâu.",
        "visitor_ratio": 0.30,
        "behavior_params": {
            "sessions_range": [1, 2],
            "product_views_per_session": [0, 2],
            "article_views_per_session": [0, 1],
            "duration_seconds_range": [25, 95],
            "search_prob": 0.12,
            "favorite_prob": 0.03,
            "share_prob": 0.01,
            "contact_prob": 0.005,
            "scroll_prob": 0.25,
            "preferred_categories": [1, 2, 3, 4],
        },
    },
    {
        "scenario_code": "culture_story_reader",
        "name": "Kịch bản 2: Độc giả yêu văn hóa & câu chuyện vùng trồng (Story & Culture Readers)",
        "description": "Quan tâm sâu sắc đến lịch sử bản làng, văn hóa dân tộc Thái - Mông, quy trình chế biến truyền thống; đọc nhiều bài viết và cuộn trang sâu.",
        "visitor_ratio": 0.22,
        "behavior_params": {
            "sessions_range": [2, 4],
            "product_views_per_session": [1, 3],
            "article_views_per_session": [3, 6],
            "duration_seconds_range": [210, 420],
            "search_prob": 0.35,
            "favorite_prob": 0.30,
            "share_prob": 0.22,
            "contact_prob": 0.04,
            "scroll_prob": 0.85,
            "preferred_categories": [1, 4],
        },
    },
    {
        "scenario_code": "specialty_product_explorer",
        "name": "Kịch bản 3: Người khám phá & so sánh đặc sản (Specialty Explorers)",
        "description": "Tìm kiếm tích cực, xem đa dạng nhiều sản phẩm khác nhau (U cao), lưu yêu thích nhiều mặt hàng để cân nhắc sử dụng hoặc làm quà biếu.",
        "visitor_ratio": 0.24,
        "behavior_params": {
            "sessions_range": [3, 5],
            "product_views_per_session": [3, 6],
            "article_views_per_session": [1, 3],
            "duration_seconds_range": [180, 340],
            "search_prob": 0.78,
            "favorite_prob": 0.55,
            "share_prob": 0.18,
            "contact_prob": 0.12,
            "scroll_prob": 0.70,
            "preferred_categories": [1, 2, 3],
        },
    },
    {
        "scenario_code": "high_intent_buyer_partner",
        "name": "Kịch bản 4: Khách hàng tiềm năng & đối tác thu mua (High-Intent Buyers & B2B)",
        "description": "Quay lại nhiều phiên (R cao), xem kỹ thông tin chứng nhận OCOP/VietGAP, nguồn gốc HTX và nhấn liên hệ đặt hàng/hợp tác (C cao).",
        "visitor_ratio": 0.14,
        "behavior_params": {
            "sessions_range": [4, 7],
            "product_views_per_session": [3, 5],
            "article_views_per_session": [2, 4],
            "duration_seconds_range": [280, 520],
            "search_prob": 0.65,
            "favorite_prob": 0.75,
            "share_prob": 0.30,
            "contact_prob": 0.82,
            "scroll_prob": 0.90,
            "preferred_categories": [1, 3, 4],
        },
    },
    {
        "scenario_code": "health_gift_seeker",
        "name": "Kịch bản 5: Người quan tâm thực phẩm chế biến & sức khỏe (Health & Gift Seekers)",
        "description": "Tập trung vào nhóm thực phẩm chế biến sâu tốt cho sức khỏe (Tỏi đen, Hồng sấy dẻo, Trà vỏ cà phê, Chè Shan tuyết), xem vừa phải và hay chia sẻ.",
        "visitor_ratio": 0.10,
        "behavior_params": {
            "sessions_range": [2, 4],
            "product_views_per_session": [2, 4],
            "article_views_per_session": [2, 4],
            "duration_seconds_range": [150, 290],
            "search_prob": 0.45,
            "favorite_prob": 0.48,
            "share_prob": 0.35,
            "contact_prob": 0.28,
            "scroll_prob": 0.65,
            "preferred_categories": [1, 3],
        },
    },
]

SEARCH_QUERIES_POOL = [
    "cà phê arabica sơn la",
    "chè shan tuyết tà xùa cổ thụ",
    "trà vỏ cà phê cascara",
    "mận hậu mộc châu",
    "mận sấy dẻo không đường",
    "hồng sấy dẻo công nghệ nhật",
    "gạo nếp tan ngọc chiến",
    "tỏi đen yên châu lên men",
    "đặc sản sơn la làm quà",
    "chứng nhận ocop 5 sao",
    "văn hóa ẩm thực dân tộc thái",
]


def ensure_simulation_scenarios(db: Session) -> List[SimulationScenario]:
    existing = {s.scenario_code: s for s in db.query(SimulationScenario).all()}
    result = []
    for item in DEFAULT_SCENARIOS:
        sc = existing.get(item["scenario_code"])
        if not sc:
            sc = SimulationScenario(
                scenario_code=item["scenario_code"],
                name=item["name"],
                description=item["description"],
                visitor_ratio=item["visitor_ratio"],
                behavior_params=item["behavior_params"],
                is_active=True,
            )
            db.add(sc)
        else:
            sc.name = item["name"]
            sc.description = item["description"]
            sc.visitor_ratio = item["visitor_ratio"]
            sc.behavior_params = item["behavior_params"]
        result.append(sc)
    db.commit()
    return result


def generate_synthetic_dataset(
    db: Session,
    num_visitors: int = 500,
    random_seed: int = 42,
    clear_existing_simulated: bool = True,
) -> Dict[str, Any]:
    """
    Generate reproducible synthetic behavioral dataset following Section 10.5 of the Plan:
    - 500 Visitors
    - ~1,500 Sessions
    - ~15,000 Events
    - 8 Products, 14 Articles
    - 5 Behavioral Scenarios
    Strictly marks `is_simulated=True` so real user tracking data is never overwritten or mixed.
    """
    rng = np.random.default_rng(random_seed)
    scenarios = ensure_simulation_scenarios(db)

    if clear_existing_simulated:
        db.query(Event).filter(Event.is_simulated == True).delete(synchronize_session=False)
        db.query(Favorite).filter(Favorite.is_simulated == True).delete(synchronize_session=False)
        db.query(SessionModel).filter(SessionModel.is_simulated == True).delete(synchronize_session=False)
        db.query(UserFeature).filter(UserFeature.is_simulated == True).delete(synchronize_session=False)
        db.query(Visitor).filter(Visitor.is_simulated == True).delete(synchronize_session=False)
        db.commit()

    products = db.query(Product).all()
    articles = db.query(Article).all()
    if not products or not articles:
        raise ValueError("Cần khởi tạo dữ liệu sản phẩm và bài viết trước khi sinh dữ liệu mô phỏng.")

    product_ids = [p.product_id for p in products]
    prod_by_cat: Dict[int, List[int]] = {}
    for p in products:
        prod_by_cat.setdefault(p.category_id, []).append(p.product_id)

    article_ids = [a.article_id for a in articles]
    devices = ["desktop", "mobile", "tablet"]
    device_probs = [0.52, 0.42, 0.06]
    referrers = ["search", "social", "direct", "referral"]
    referrer_probs = [0.42, 0.28, 0.18, 0.12]

    now = datetime.utcnow()
    visitors_to_insert: List[Visitor] = []
    sessions_to_insert: List[SessionModel] = []
    events_to_insert: List[Event] = []
    favorites_seen = set()
    favorites_to_insert: List[Favorite] = []

    # Track view/favorite/contact increments for products & articles
    prod_view_inc = {pid: 0 for pid in product_ids}
    prod_fav_inc = {pid: 0 for pid in product_ids}
    prod_contact_inc = {pid: 0 for pid in product_ids}
    art_view_inc = {aid: 0 for aid in article_ids}
    art_fav_inc = {aid: 0 for aid in article_ids}

    ratios = np.array([s.visitor_ratio for s in scenarios], dtype=float)
    ratios = ratios / ratios.sum()
    scenario_counts = np.round(ratios * num_visitors).astype(int)
    # Adjust rounding diff
    scenario_counts[0] += num_visitors - scenario_counts.sum()

    visitor_counter = 0
    session_counter = 0

    for sc_idx, sc in enumerate(scenarios):
        count = int(scenario_counts[sc_idx])
        params = sc.behavior_params
        s_min, s_max = params["sessions_range"]
        p_min, p_max = params["product_views_per_session"]
        a_min, a_max = params["article_views_per_session"]
        d_min, d_max = params["duration_seconds_range"]
        pref_cats = params.get("preferred_categories", [1, 2, 3, 4])

        preferred_pids = []
        for cid in pref_cats:
            preferred_pids.extend(prod_by_cat.get(cid, []))
        if not preferred_pids:
            preferred_pids = product_ids

        for _ in range(count):
            visitor_counter += 1
            vid = f"sim_vis_{visitor_counter:04d}"
            dev = str(rng.choice(devices, p=device_probs))
            ref = str(rng.choice(referrers, p=referrer_probs))

            n_sessions = int(rng.integers(s_min, s_max + 1))
            first_days_ago = int(rng.integers(5, 30))
            first_seen = now - timedelta(days=first_days_ago, hours=int(rng.integers(0, 23)))
            last_seen = first_seen

            for s_i in range(n_sessions):
                session_counter += 1
                sid = f"sim_sess_{session_counter:05d}"
                sess_start = first_seen + timedelta(
                    days=int(s_i * max(1, first_days_ago / max(1, n_sessions))),
                    hours=int(rng.integers(0, 12)),
                    minutes=int(rng.integers(0, 59)),
                )
                if sess_start > now:
                    sess_start = now - timedelta(hours=int(rng.integers(1, 24)))
                dur = float(rng.uniform(d_min, d_max))
                sess_end = sess_start + timedelta(seconds=dur)
                last_seen = max(last_seen, sess_end)

                cur_time = sess_start
                page_cnt = 1

                # 1. Landing page_view
                events_to_insert.append(
                    Event(
                        visitor_id=vid,
                        session_id=sid,
                        event_name="page_view",
                        content_type="page",
                        content_id=None,
                        occurred_at=cur_time,
                        properties={"path": "/", "referrer": ref},
                        is_simulated=True,
                    )
                )

                # 2. Optional search
                if rng.random() < params["search_prob"]:
                    cur_time += timedelta(seconds=int(rng.integers(5, 20)))
                    q_text = str(rng.choice(SEARCH_QUERIES_POOL))
                    events_to_insert.append(
                        Event(
                            visitor_id=vid,
                            session_id=sid,
                            event_name="search",
                            content_type="page",
                            content_id=None,
                            occurred_at=cur_time,
                            properties={"query": q_text},
                            is_simulated=True,
                        )
                    )

                # 3. Product views
                n_pviews = int(rng.integers(p_min, p_max + 1))
                for _ in range(n_pviews):
                    cur_time += timedelta(seconds=int(rng.integers(10, 45)))
                    page_cnt += 1
                    if rng.random() < 0.75:
                        pid = int(rng.choice(preferred_pids))
                    else:
                        pid = int(rng.choice(product_ids))

                    prod_view_inc[pid] += 1
                    events_to_insert.append(
                        Event(
                            visitor_id=vid,
                            session_id=sid,
                            event_name="product_view",
                            content_type="product",
                            content_id=pid,
                            occurred_at=cur_time,
                            properties={"dwell_seconds": int(rng.integers(15, 120))},
                            is_simulated=True,
                        )
                    )

                    # Scroll on product
                    if rng.random() < params["scroll_prob"]:
                        cur_time += timedelta(seconds=int(rng.integers(5, 20)))
                        events_to_insert.append(
                            Event(
                                visitor_id=vid,
                                session_id=sid,
                                event_name="scroll",
                                content_type="product",
                                content_id=pid,
                                occurred_at=cur_time,
                                properties={"scroll_depth": int(rng.choice([50, 75, 90, 100]))},
                                is_simulated=True,
                            )
                        )

                    # Recommendation view & click
                    if rng.random() < 0.55:
                        cur_time += timedelta(seconds=int(rng.integers(3, 10)))
                        events_to_insert.append(
                            Event(
                                visitor_id=vid,
                                session_id=sid,
                                event_name="recommendation_view",
                                content_type="product",
                                content_id=pid,
                                occurred_at=cur_time,
                                properties={"section": "related_recommendations"},
                                is_simulated=True,
                            )
                        )
                        if rng.random() < 0.28:
                            cur_time += timedelta(seconds=int(rng.integers(2, 8)))
                            events_to_insert.append(
                                Event(
                                    visitor_id=vid,
                                    session_id=sid,
                                    event_name="recommendation_click",
                                    content_type="product",
                                    content_id=int(rng.choice(preferred_pids)),
                                    occurred_at=cur_time,
                                    properties={"source_product_id": pid},
                                    is_simulated=True,
                                )
                            )

                    # Favorite product
                    if rng.random() < params["favorite_prob"]:
                        cur_time += timedelta(seconds=int(rng.integers(2, 10)))
                        events_to_insert.append(
                            Event(
                                visitor_id=vid,
                                session_id=sid,
                                event_name="favorite",
                                content_type="product",
                                content_id=pid,
                                occurred_at=cur_time,
                                properties={"action": "add"},
                                is_simulated=True,
                            )
                        )
                        fav_key = (vid, "product", pid)
                        if fav_key not in favorites_seen:
                            favorites_seen.add(fav_key)
                            prod_fav_inc[pid] += 1
                            favorites_to_insert.append(
                                Favorite(
                                    visitor_id=vid,
                                    content_type="product",
                                    content_id=pid,
                                    is_simulated=True,
                                    created_at=cur_time,
                                )
                            )

                    # Share product
                    if rng.random() < params["share_prob"]:
                        cur_time += timedelta(seconds=int(rng.integers(2, 8)))
                        events_to_insert.append(
                            Event(
                                visitor_id=vid,
                                session_id=sid,
                                event_name="share",
                                content_type="product",
                                content_id=pid,
                                occurred_at=cur_time,
                                properties={"channel": str(rng.choice(["facebook", "zalo", "copy_link"]))},
                                is_simulated=True,
                            )
                        )

                    # Contact click on product
                    if rng.random() < params["contact_prob"]:
                        cur_time += timedelta(seconds=int(rng.integers(3, 12)))
                        prod_contact_inc[pid] += 1
                        events_to_insert.append(
                            Event(
                                visitor_id=vid,
                                session_id=sid,
                                event_name="contact_click",
                                content_type="product",
                                content_id=pid,
                                occurred_at=cur_time,
                                properties={"contact_type": "producer_inquiry"},
                                is_simulated=True,
                            )
                        )

                # 4. Article views
                n_aviews = int(rng.integers(a_min, a_max + 1))
                for _ in range(n_aviews):
                    cur_time += timedelta(seconds=int(rng.integers(15, 60)))
                    page_cnt += 1
                    aid = int(rng.choice(article_ids))
                    art_view_inc[aid] += 1
                    events_to_insert.append(
                        Event(
                            visitor_id=vid,
                            session_id=sid,
                            event_name="article_view",
                            content_type="article",
                            content_id=aid,
                            occurred_at=cur_time,
                            properties={"reading_seconds": int(rng.integers(30, 240))},
                            is_simulated=True,
                        )
                    )
                    if rng.random() < params["scroll_prob"]:
                        cur_time += timedelta(seconds=int(rng.integers(10, 30)))
                        events_to_insert.append(
                            Event(
                                visitor_id=vid,
                                session_id=sid,
                                event_name="scroll",
                                content_type="article",
                                content_id=aid,
                                occurred_at=cur_time,
                                properties={"scroll_depth": int(rng.choice([60, 80, 100]))},
                                is_simulated=True,
                            )
                        )
                    if rng.random() < params["favorite_prob"] * 0.6:
                        fav_key = (vid, "article", aid)
                        if fav_key not in favorites_seen:
                            favorites_seen.add(fav_key)
                            art_fav_inc[aid] += 1
                            favorites_to_insert.append(
                                Favorite(
                                    visitor_id=vid,
                                    content_type="article",
                                    content_id=aid,
                                    is_simulated=True,
                                    created_at=cur_time,
                                )
                            )
                        events_to_insert.append(
                            Event(
                                visitor_id=vid,
                                session_id=sid,
                                event_name="favorite",
                                content_type="article",
                                content_id=aid,
                                occurred_at=cur_time,
                                properties={"action": "add"},
                                is_simulated=True,
                            )
                        )

                sessions_to_insert.append(
                    SessionModel(
                        session_id=sid,
                        visitor_id=vid,
                        started_at=sess_start,
                        ended_at=sess_end,
                        duration_seconds=round(dur, 1),
                        page_count=page_cnt,
                        referrer=ref,
                        device=dev,
                        is_simulated=True,
                        created_at=sess_start,
                    )
                )

            visitors_to_insert.append(
                Visitor(
                    visitor_id=vid,
                    first_seen_at=first_seen,
                    last_seen_at=last_seen,
                    user_agent=f"SimulatedBrowser/1.0 ({dev})",
                    device_type=dev,
                    referrer_source=ref,
                    is_simulated=True,
                    scenario_label=sc.scenario_code,
                    created_at=first_seen,
                    updated_at=last_seen,
                )
            )
        sc.last_run_at = now

    # Also ensure a deterministic demo visitor `demo_visitor_sonla` with fixed interaction history (Section 37)
    demo_vid = "demo_visitor_sonla"
    existing_demo = db.query(Visitor).filter(Visitor.visitor_id == demo_vid).first()
    if not existing_demo:
        demo_time = now - timedelta(hours=3)
        visitors_to_insert.append(
            Visitor(
                visitor_id=demo_vid,
                first_seen_at=demo_time - timedelta(days=3),
                last_seen_at=demo_time,
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) DemoPersona/1.0",
                device_type="desktop",
                referrer_source="search",
                is_simulated=False,
                scenario_label="demo_persona",
                created_at=demo_time - timedelta(days=3),
                updated_at=demo_time,
            )
        )
        demo_sid = "demo_session_sonla_01"
        sessions_to_insert.append(
            SessionModel(
                session_id=demo_sid,
                visitor_id=demo_vid,
                started_at=demo_time - timedelta(minutes=25),
                ended_at=demo_time,
                duration_seconds=340.0,
                page_count=6,
                referrer="search",
                device="desktop",
                is_simulated=False,
                created_at=demo_time - timedelta(minutes=25),
            )
        )
        # Demo visitor loves Coffee & Shan Tuyet Tea (Beverages category)
        for pid, ev_name in [(1, "product_view"), (1, "scroll"), (1, "favorite"), (2, "product_view"), (3, "product_view")]:
            events_to_insert.append(
                Event(
                    visitor_id=demo_vid,
                    session_id=demo_sid,
                    event_name=ev_name,
                    content_type="product",
                    content_id=pid,
                    occurred_at=demo_time - timedelta(minutes=10),
                    properties={"scroll_depth": 90} if ev_name == "scroll" else {"demo": True},
                    is_simulated=False,
                )
            )
        favorites_to_insert.append(
            Favorite(
                visitor_id=demo_vid,
                content_type="product",
                content_id=1,
                is_simulated=False,
                created_at=demo_time - timedelta(minutes=8),
            )
        )

    db.bulk_save_objects(visitors_to_insert)
    db.bulk_save_objects(sessions_to_insert)
    db.bulk_save_objects(events_to_insert)
    db.bulk_save_objects(favorites_to_insert)

    # Update product & article aggregate counters
    for p in products:
        p.view_count = prod_view_inc.get(p.product_id, 0)
        p.favorite_count = prod_fav_inc.get(p.product_id, 0)
        p.contact_click_count = prod_contact_inc.get(p.product_id, 0)
    for a in articles:
        a.view_count = art_view_inc.get(a.article_id, 0)
        a.favorite_count = art_fav_inc.get(a.article_id, 0)

    db.commit()

    # Compute user feature vectors X = [S, P, A, T, Q, F, C, R, U]
    user_features = compute_and_store_user_features(db)

    # Export synthetic CSVs to ml/data/synthetic and ml/data/processed
    syn_dir = Path(settings.ML_DATA_DIR) / "synthetic"
    proc_dir = Path(settings.ML_DATA_DIR) / "processed"
    syn_dir.mkdir(parents=True, exist_ok=True)
    proc_dir.mkdir(parents=True, exist_ok=True)

    uf_df = pd.DataFrame(
        [
            {
                "visitor_id": uf.visitor_id,
                "S_total_sessions": uf.total_sessions,
                "P_total_product_views": uf.total_product_views,
                "A_total_article_views": uf.total_article_views,
                "T_avg_session_duration": uf.avg_session_duration,
                "Q_total_searches": uf.total_searches,
                "F_total_favorites": uf.total_favorites,
                "C_total_contact_clicks": uf.total_contact_clicks,
                "R_return_visits": uf.return_visits,
                "U_unique_products_viewed": uf.unique_products_viewed,
                "is_simulated": uf.is_simulated,
            }
            for uf in user_features
        ]
    )
    uf_df.to_csv(proc_dir / "user_features.csv", index=False, encoding="utf-8")
    uf_df.to_csv(syn_dir / "synthetic_user_features.csv", index=False, encoding="utf-8")

    return {
        "random_seed": random_seed,
        "visitors_generated": len(visitors_to_insert),
        "sessions_generated": len(sessions_to_insert),
        "events_generated": len(events_to_insert),
        "favorites_generated": len(favorites_to_insert),
        "user_features_computed": len(user_features),
        "scenarios_count": len(scenarios),
    }
