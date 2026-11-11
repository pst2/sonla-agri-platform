"""Initial schema for Agri Communication Platform - Son La (15 tables + M2M association)

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-11-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. locations
    op.create_table(
        "locations",
        sa.Column("location_id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("slug", sa.String(length=150), nullable=False, unique=True),
        sa.Column("province", sa.String(length=100), nullable=False, server_default="Sơn La"),
        sa.Column("district", sa.String(length=100), nullable=False),
        sa.Column("altitude", sa.String(length=100), nullable=True),
        sa.Column("climate", sa.String(length=255), nullable=True),
        sa.Column("soil_type", sa.String(length=255), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_locations_slug", "locations", ["slug"], unique=True)

    # 2. categories
    op.create_table(
        "categories",
        sa.Column("category_id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False, unique=True),
        sa.Column("slug", sa.String(length=120), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(length=60), nullable=True),
        sa.Column("display_order", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)

    # 3. products
    op.create_table(
        "products",
        sa.Column("product_id", sa.Integer(), primary_key=True),
        sa.Column("product_name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False, unique=True),
        sa.Column("category_id", sa.Integer(), sa.ForeignKey("categories.category_id"), nullable=False),
        sa.Column("location_id", sa.Integer(), sa.ForeignKey("locations.location_id"), nullable=False),
        sa.Column("origin", sa.String(length=255), nullable=False),
        sa.Column("short_description", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("ingredients", sa.Text(), nullable=False),
        sa.Column("production_process", sa.Text(), nullable=False),
        sa.Column("characteristics", sa.Text(), nullable=False),
        sa.Column("traditional_value", sa.Text(), nullable=False),
        sa.Column("keywords", sa.String(length=500), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("season", sa.String(length=100), nullable=True),
        sa.Column("certification", sa.String(length=255), nullable=True),
        sa.Column("producer", sa.String(length=255), nullable=True),
        sa.Column("source_reference", sa.String(length=500), nullable=False),
        sa.Column("verification_status", sa.String(length=50), nullable=False, server_default="verified"),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("favorite_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("contact_click_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_products_slug", "products", ["slug"], unique=True)
    op.create_index("ix_products_category_id", "products", ["category_id"])
    op.create_index("ix_products_location_id", "products", ["location_id"])

    # 4. articles
    op.create_table(
        "articles",
        sa.Column("article_id", sa.Integer(), primary_key=True),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("slug", sa.String(length=300), nullable=False, unique=True),
        sa.Column("excerpt", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("content_type", sa.String(length=80), nullable=False, server_default="story"),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("author", sa.String(length=150), nullable=True),
        sa.Column("reading_time_minutes", sa.Integer(), server_default="5"),
        sa.Column("keywords", sa.String(length=500), nullable=True),
        sa.Column("source_reference", sa.String(length=500), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="published"),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("favorite_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_articles_slug", "articles", ["slug"], unique=True)

    # Association table: article_products
    op.create_table(
        "article_products",
        sa.Column("article_id", sa.Integer(), sa.ForeignKey("articles.article_id", ondelete="CASCADE"), primary_key=True),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True),
    )

    # 5. contents
    op.create_table(
        "contents",
        sa.Column("content_uid", sa.Integer(), primary_key=True),
        sa.Column("content_type", sa.String(length=30), nullable=False),
        sa.Column("ref_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=300), nullable=False),
        sa.Column("slug", sa.String(length=300), nullable=False),
        sa.Column("category_name", sa.String(length=120), nullable=True),
        sa.Column("combined_text", sa.Text(), nullable=False),
        sa.Column("processed_tokens", sa.Text(), nullable=True),
        sa.Column("keywords", sa.String(length=500), nullable=True),
        sa.Column("popularity_score", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("content_type", "ref_id", name="uq_contents_type_ref"),
    )
    op.create_index("ix_contents_type_ref", "contents", ["content_type", "ref_id"])

    # 6. visitors
    op.create_table(
        "visitors",
        sa.Column("visitor_id", sa.String(length=64), primary_key=True),
        sa.Column("first_seen_at", sa.DateTime(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(), nullable=False),
        sa.Column("user_agent", sa.String(length=300), nullable=True),
        sa.Column("device_type", sa.String(length=50), server_default="desktop"),
        sa.Column("referrer_source", sa.String(length=100), server_default="direct"),
        sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("scenario_label", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    # 7. sessions
    op.create_table(
        "sessions",
        sa.Column("session_id", sa.String(length=64), primary_key=True),
        sa.Column("visitor_id", sa.String(length=64), sa.ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.Column("duration_seconds", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("page_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("referrer", sa.String(length=150), server_default="direct"),
        sa.Column("device", sa.String(length=50), server_default="desktop"),
        sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_sessions_visitor_id", "sessions", ["visitor_id"])

    # 8. events
    op.create_table(
        "events",
        sa.Column("event_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("visitor_id", sa.String(length=64), sa.ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False),
        sa.Column("session_id", sa.String(length=64), sa.ForeignKey("sessions.session_id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_name", sa.String(length=50), nullable=False),
        sa.Column("content_type", sa.String(length=30), nullable=True),
        sa.Column("content_id", sa.Integer(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(), nullable=False),
        sa.Column("properties", sa.JSON(), nullable=True),
        sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.create_index("ix_events_visitor_occurred", "events", ["visitor_id", "occurred_at"])
    op.create_index("ix_events_content", "events", ["content_type", "content_id"])

    # 9. favorites
    op.create_table(
        "favorites",
        sa.Column("favorite_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("visitor_id", sa.String(length=64), sa.ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False),
        sa.Column("content_type", sa.String(length=30), nullable=False),
        sa.Column("content_id", sa.Integer(), nullable=False),
        sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("visitor_id", "content_type", "content_id", name="uq_visitor_favorite"),
    )

    # 10. recommendation_logs
    op.create_table(
        "recommendation_logs",
        sa.Column("log_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("visitor_id", sa.String(length=64), nullable=False),
        sa.Column("session_id", sa.String(length=64), nullable=True),
        sa.Column("model_version", sa.String(length=64), nullable=False),
        sa.Column("strategy", sa.String(length=50), nullable=False),
        sa.Column("context_content_type", sa.String(length=30), nullable=True),
        sa.Column("context_content_id", sa.Integer(), nullable=True),
        sa.Column("recommended_items", sa.JSON(), nullable=False),
        sa.Column("clicked_content_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # 11. user_features
    op.create_table(
        "user_features",
        sa.Column("visitor_id", sa.String(length=64), sa.ForeignKey("visitors.visitor_id", ondelete="CASCADE"), primary_key=True),
        sa.Column("total_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_page_views", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_product_views", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_article_views", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("avg_session_duration", sa.Float(), nullable=False, server_default="0.0"),
        sa.Column("total_searches", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_favorites", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_shares", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_contact_clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("unique_products_viewed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("return_visits", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("deep_scroll_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    # 12. ml_models
    op.create_table(
        "ml_models",
        sa.Column("model_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("model_name", sa.String(length=100), nullable=False),
        sa.Column("model_type", sa.String(length=50), nullable=False),
        sa.Column("version", sa.String(length=64), nullable=False, unique=True),
        sa.Column("parameters", sa.JSON(), nullable=False),
        sa.Column("metrics", sa.JSON(), nullable=False),
        sa.Column("artifact_path", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("trained_at", sa.DateTime(), nullable=False),
    )

    # 13. cluster_profiles
    op.create_table(
        "cluster_profiles",
        sa.Column("profile_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("model_id", sa.Integer(), sa.ForeignKey("ml_models.model_id", ondelete="CASCADE"), nullable=False),
        sa.Column("cluster_index", sa.Integer(), nullable=False),
        sa.Column("cluster_name", sa.String(length=150), nullable=False),
        sa.Column("cluster_description", sa.Text(), nullable=False),
        sa.Column("size", sa.Integer(), nullable=False),
        sa.Column("percentage", sa.Float(), nullable=False),
        sa.Column("centroid_features", sa.JSON(), nullable=False),
        sa.Column("dominant_characteristics", sa.JSON(), nullable=True),
        sa.Column("recommended_strategy", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("model_id", "cluster_index", name="uq_model_cluster_idx"),
    )

    # 14. cluster_results
    op.create_table(
        "cluster_results",
        sa.Column("result_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("model_id", sa.Integer(), sa.ForeignKey("ml_models.model_id", ondelete="CASCADE"), nullable=False),
        sa.Column("visitor_id", sa.String(length=64), sa.ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False),
        sa.Column("cluster_index", sa.Integer(), nullable=False),
        sa.Column("distance_to_centroid", sa.Float(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("model_id", "visitor_id", name="uq_model_visitor_cluster"),
    )

    # 15. recommendations
    op.create_table(
        "recommendations",
        sa.Column("rec_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("model_id", sa.Integer(), sa.ForeignKey("ml_models.model_id", ondelete="CASCADE"), nullable=True),
        sa.Column("visitor_id", sa.String(length=64), nullable=False),
        sa.Column("content_type", sa.String(length=30), nullable=False),
        sa.Column("content_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # 16. admin_users
    op.create_table(
        "admin_users",
        sa.Column("admin_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("username", sa.String(length=80), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False, unique=True),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="admin"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("last_login_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )

    # 17. simulation_scenarios
    op.create_table(
        "simulation_scenarios",
        sa.Column("scenario_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("scenario_code", sa.String(length=80), nullable=False, unique=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("visitor_ratio", sa.Float(), nullable=False),
        sa.Column("behavior_params", sa.JSON(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("last_run_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    # 18. audit_logs
    op.create_table(
        "audit_logs",
        sa.Column("audit_id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("admin_id", sa.Integer(), sa.ForeignKey("admin_users.admin_id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("resource_type", sa.String(length=80), nullable=False),
        sa.Column("resource_id", sa.String(length=80), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    for tbl in [
        "audit_logs",
        "simulation_scenarios",
        "admin_users",
        "recommendations",
        "cluster_results",
        "cluster_profiles",
        "ml_models",
        "user_features",
        "recommendation_logs",
        "favorites",
        "events",
        "sessions",
        "visitors",
        "contents",
        "article_products",
        "articles",
        "products",
        "categories",
        "locations",
    ]:
        op.drop_table(tbl)
