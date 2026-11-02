import sys
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Ensure root and backend directories are importable
BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
for p in (str(ROOT_DIR), str(BACKEND_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from app.main import app, bootstrap_platform_data
from app.core.database import SessionLocal
from app.models.entities import UserFeature
from ml.src.features.feature_builder import FEATURE_COLUMNS


@pytest.fixture(scope="module")
def client():
    """Initialize platform data once and provide a FastAPI TestClient."""
    bootstrap_platform_data()
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def admin_token(client: TestClient) -> str:
    """Authenticate default admin and return Bearer JWT token."""
    res = client.post(
        "/api/v1/admin/auth/login",
        json={"username": "admin", "password": "admin123"},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    return data["access_token"]


# ==============================================================================
# 1. PUBLIC CATALOG ENDPOINTS (/products, /articles, /categories, /search)
# ==============================================================================
def test_public_catalog_endpoints(client: TestClient):
    # List 8 verified Sơn La products
    r_prods = client.get("/api/v1/products")
    assert r_prods.status_code == 200
    prods_data = r_prods.json()
    assert prods_data["total"] >= 8
    product_names = {p["product_name"] for p in prods_data["items"]}
    assert "Cà phê Arabica Sơn La" in product_names
    assert "Chè Shan tuyết" in product_names
    assert "Mận hậu" in product_names

    # Product detail by ID and by slug
    r_detail_id = client.get("/api/v1/products/1")
    assert r_detail_id.status_code == 200
    assert r_detail_id.json()["slug"] == "ca-phe-arabica-son-la"

    r_detail_slug = client.get("/api/v1/products/che-shan-tuyet-ta-xua")
    assert r_detail_slug.status_code == 200
    assert r_detail_slug.json()["product_id"] == 2

    # List 14 articles
    r_arts = client.get("/api/v1/articles")
    assert r_arts.status_code == 200
    assert r_arts.json()["total"] >= 14

    # Categories & 5 Sơn La locations
    r_cats = client.get("/api/v1/categories")
    assert r_cats.status_code == 200
    cats_payload = r_cats.json()
    assert len(cats_payload["categories"]) >= 4
    assert len(cats_payload["locations"]) >= 5

    # Unified search
    r_search = client.get("/api/v1/search", params={"q": "Arabica"})
    assert r_search.status_code == 200
    search_data = r_search.json()
    assert search_data["product_count"] >= 1
    assert search_data["article_count"] >= 1


# ==============================================================================
# 2. EVENT-BASED TRACKING, DEDUPLICATION & FAVORITES
# ==============================================================================
def test_event_tracking_and_deduplication(client: TestClient):
    vid = f"test_vis_{uuid.uuid4().hex[:8]}"
    sid = f"test_sess_{uuid.uuid4().hex[:8]}"

    # Valid event recording
    payload = {
        "visitor_id": vid,
        "session_id": sid,
        "event_name": "product_view",
        "content_type": "product",
        "content_id": 1,
        "properties": {"dwell_seconds": 35},
    }
    r1 = client.post("/api/v1/events", json=payload)
    assert r1.status_code == 200
    assert r1.json()["status"] == "recorded"

    # Rapid duplicate within 2 seconds should be deduplicated
    r2 = client.post("/api/v1/events", json=payload)
    assert r2.status_code == 200
    assert r2.json()["status"] == "deduplicated"

    # Invalid event name must be rejected with 400
    bad_payload = {**payload, "event_name": "invalid_event_xyz"}
    r_bad = client.post("/api/v1/events", json=bad_payload)
    assert r_bad.status_code == 400

    # Toggle Favorite (add then remove)
    fav_req = {
        "visitor_id": vid,
        "session_id": sid,
        "content_type": "product",
        "content_id": 2,
    }
    r_fav_add = client.post("/api/v1/favorites", json=fav_req)
    assert r_fav_add.status_code == 200
    assert r_fav_add.json()["status"] == "added"

    r_fav_list = client.get("/api/v1/favorites", params={"visitor_id": vid})
    assert r_fav_list.status_code == 200
    assert len(r_fav_list.json()["favorites"]) == 1


# ==============================================================================
# 3. FEATURE VECTOR X = [S, P, A, T, Q, F, C, R, U] COMPUTATION
# ==============================================================================
def test_user_feature_vector_computation(client: TestClient):
    vid = f"feat_vis_{uuid.uuid4().hex[:8]}"
    s1 = f"sess_1_{uuid.uuid4().hex[:6]}"
    s2 = f"sess_2_{uuid.uuid4().hex[:6]}"

    events = [
        {"visitor_id": vid, "session_id": s1, "event_name": "product_view", "content_type": "product", "content_id": 1},
        {"visitor_id": vid, "session_id": s1, "event_name": "product_view", "content_type": "product", "content_id": 2},
        {"visitor_id": vid, "session_id": s1, "event_name": "article_view", "content_type": "article", "content_id": 1},
        {"visitor_id": vid, "session_id": s1, "event_name": "search", "content_type": "page", "properties": {"query": "chè shan tuyết"}},
        {"visitor_id": vid, "session_id": s2, "event_name": "contact_click", "content_type": "product", "content_id": 1},
    ]
    for ev in events:
        res = client.post("/api/v1/events", json=ev)
        assert res.status_code == 200

    db = SessionLocal()
    try:
        uf = db.query(UserFeature).filter(UserFeature.visitor_id == vid).first()
        assert uf is not None
        assert uf.total_sessions == 2          # S = 2
        assert uf.return_visits == 1           # R = S - 1 = 1
        assert uf.total_product_views == 2     # P = 2
        assert uf.total_article_views == 1     # A = 1
        assert uf.total_searches == 1          # Q = 1
        assert uf.total_contact_clicks == 1    # C = 1
        assert uf.unique_products_viewed == 2  # U = 2
        assert uf.avg_session_duration > 0     # T > 0
        assert len(FEATURE_COLUMNS) == 9
    finally:
        db.close()


# ==============================================================================
# 4. K-MEANS CLUSTERING PIPELINE & EVALUATION METRICS
# ==============================================================================
def test_kmeans_clustering_and_segments(client: TestClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    r_seg = client.get("/api/v1/admin/analytics/segments", headers=headers)
    assert r_seg.status_code == 200
    seg_data = r_seg.json()

    model_info = seg_data["model"]
    metrics = model_info["metrics"]
    assert 2 <= metrics["selected_k"] <= 8
    assert metrics["silhouette_score"] > 0.25
    assert metrics["davies_bouldin_index"] > 0.0
    assert len(metrics["k_sweep"]) == 7  # K = 2..8
    assert len(seg_data["profiles"]) == metrics["selected_k"]


# ==============================================================================
# 5. VIETNAMESE TF-IDF CONTENT-BASED RECOMMENDATION & COLD-START FALLBACK
# ==============================================================================
def test_recommendations_content_based_and_cold_start(client: TestClient):
    # Cold-start popular (brand-new anonymous visitor without context)
    r_cold_pop = client.get("/api/v1/recommendations", params={"limit": 5})
    assert r_cold_pop.status_code == 200
    cold_pop = r_cold_pop.json()
    assert cold_pop["strategy"] == "cold_start_popular"
    assert len(cold_pop["items"]) == 5

    # Cold-start related (new visitor viewing Product #1)
    r_cold_rel = client.get(
        "/api/v1/recommendations",
        params={"current_content_type": "product", "current_content_id": 1, "limit": 5},
    )
    assert r_cold_rel.status_code == 200
    cold_rel = r_cold_rel.json()
    assert cold_rel["strategy"] == "cold_start_related"
    assert len(cold_rel["items"]) == 5

    # Personalized content-based recommendation for `demo_visitor_sonla`
    r_cb = client.get(
        "/api/v1/recommendations",
        params={"visitor_id": "demo_visitor_sonla", "limit": 5},
    )
    assert r_cb.status_code == 200
    cb_data = r_cb.json()
    assert cb_data["strategy"] == "content_based"
    assert len(cb_data["items"]) == 5


# ==============================================================================
# 6. ADMIN AUTHENTICATION & RBAC PROTECTION
# ==============================================================================
def test_admin_rbac_protection(client: TestClient, admin_token: str):
    # Unauthenticated request must fail with 401
    r_unauth = client.get("/api/v1/admin/analytics/overview")
    assert r_unauth.status_code == 401

    # Authenticated request succeeds
    headers = {"Authorization": f"Bearer {admin_token}"}
    r_ov = client.get("/api/v1/admin/analytics/overview", headers=headers)
    assert r_ov.status_code == 200
    assert "kpis" in r_ov.json()

    r_eval = client.get("/api/v1/admin/ml/evaluations", headers=headers)
    assert r_eval.status_code == 200
    eval_data = r_eval.json()
    assert eval_data["active_clustering_model"] is not None
    assert eval_data["active_recommendation_model"] is not None


# ==============================================================================
# 7. END-TO-END INTEGRATION FLOW (SECTION 31 OF PLAN)
# ==============================================================================
def test_end_to_end_visitor_to_dashboard_flow(client: TestClient, admin_token: str):
    """
    Full E2E flow:
    Visitor -> view product -> read article -> favorite -> record events ->
    update feature vector -> get personalized recommendations -> dashboard reflects update.
    """
    e2e_vid = f"e2e_sonla_{uuid.uuid4().hex[:8]}"
    e2e_sid = f"e2e_sess_{uuid.uuid4().hex[:8]}"

    # 1. Visitor views Product #4 (Mận hậu Mộc Châu)
    client.post(
        "/api/v1/events",
        json={
            "visitor_id": e2e_vid,
            "session_id": e2e_sid,
            "event_name": "product_view",
            "content_type": "product",
            "content_id": 4,
        },
    )

    # 2. Visitor reads Article #6 (Mùa mận hậu chín đỏ thung lũng Ná Ka)
    client.post(
        "/api/v1/events",
        json={
            "visitor_id": e2e_vid,
            "session_id": e2e_sid,
            "event_name": "article_view",
            "content_type": "article",
            "content_id": 6,
        },
    )

    # 3. Visitor favorites Product #4 (Mận hậu)
    r_fav = client.post(
        "/api/v1/favorites",
        json={
            "visitor_id": e2e_vid,
            "session_id": e2e_sid,
            "content_type": "product",
            "content_id": 4,
        },
    )
    assert r_fav.status_code == 200

    # 4. Get personalized recommendations for this visitor -> should use `content_based` strategy
    r_rec = client.get(
        "/api/v1/recommendations",
        params={"visitor_id": e2e_vid, "target_type": "product", "limit": 5},
    )
    assert r_rec.status_code == 200
    rec_json = r_rec.json()
    assert rec_json["strategy"] == "content_based"
    # Mận sấy dẻo (product_id=5) shares strong Mộc Châu plum TF-IDF similarity with Product #4
    rec_ids = [item["content_id"] for item in rec_json["items"]]
    assert 5 in rec_ids

    # 5. Verify Admin Behavior Analytics stream reflects the newly recorded events
    headers = {"Authorization": f"Bearer {admin_token}"}
    r_beh = client.get("/api/v1/admin/analytics/behavior", headers=headers)
    assert r_beh.status_code == 200
    recent_vids = {ev["visitor_id"] for ev in r_beh.json()["recent_events"]}
    assert e2e_vid in recent_vids
