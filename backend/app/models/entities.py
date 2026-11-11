from datetime import datetime
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from app.core.database import Base

article_products = Table(
    "article_products",
    Base.metadata,
    Column("article_id", Integer, ForeignKey("articles.article_id", ondelete="CASCADE"), primary_key=True),
    Column("product_id", Integer, ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True),
)


class Location(Base):
    __tablename__ = "locations"

    location_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, index=True, nullable=False)
    province = Column(String(100), nullable=False, default="Sơn La")
    district = Column(String(100), nullable=False)
    altitude = Column(String(100), nullable=True)
    climate = Column(String(255), nullable=True)
    soil_type = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    products = relationship("Product", back_populates="location")


class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(60), nullable=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(200), nullable=False, index=True)
    slug = Column(String(200), unique=True, index=True, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.location_id"), nullable=False, index=True)
    origin = Column(String(255), nullable=False)
    short_description = Column(Text, nullable=True)
    description = Column(Text, nullable=False)
    ingredients = Column(Text, nullable=False)
    production_process = Column(Text, nullable=False)
    characteristics = Column(Text, nullable=False)
    traditional_value = Column(Text, nullable=False)
    keywords = Column(String(500), nullable=False)
    image_url = Column(String(500), nullable=False)
    season = Column(String(100), nullable=True)
    certification = Column(String(255), nullable=True)
    producer = Column(String(255), nullable=True)
    source_reference = Column(String(500), nullable=False)
    verification_status = Column(String(50), default="verified", nullable=False, index=True)
    view_count = Column(Integer, default=0, nullable=False)
    favorite_count = Column(Integer, default=0, nullable=False)
    contact_click_count = Column(Integer, default=0, nullable=False)
    is_featured = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    category = relationship("Category", back_populates="products")
    location = relationship("Location", back_populates="products")
    articles = relationship("Article", secondary=article_products, back_populates="products")


class Article(Base):
    __tablename__ = "articles"

    article_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False, index=True)
    slug = Column(String(300), unique=True, index=True, nullable=False)
    excerpt = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    content_type = Column(String(80), default="story", nullable=False, index=True)
    image_url = Column(String(500), nullable=True)
    author = Column(String(150), default="Ban Biên Tập Nông Sản Sơn La")
    reading_time_minutes = Column(Integer, default=5)
    keywords = Column(String(500), nullable=True)
    source_reference = Column(String(500), nullable=True)
    published_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="published", nullable=False, index=True)
    view_count = Column(Integer, default=0, nullable=False)
    favorite_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    products = relationship("Product", secondary=article_products, back_populates="articles")


class Content(Base):
    """Unified Content Registry mapping products and articles for TF-IDF & Recommendation Engine."""
    __tablename__ = "contents"
    __table_args__ = (
        UniqueConstraint("content_type", "ref_id", name="uq_contents_type_ref"),
        Index("ix_contents_type_ref", "content_type", "ref_id"),
    )

    content_uid = Column(Integer, primary_key=True, index=True)
    content_type = Column(String(30), nullable=False, index=True)  # 'product' | 'article'
    ref_id = Column(Integer, nullable=False, index=True)
    title = Column(String(300), nullable=False)
    slug = Column(String(300), nullable=False)
    category_name = Column(String(120), nullable=True)
    combined_text = Column(Text, nullable=False)
    processed_tokens = Column(Text, nullable=True)
    keywords = Column(String(500), nullable=True)
    popularity_score = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class Visitor(Base):
    __tablename__ = "visitors"

    visitor_id = Column(String(64), primary_key=True, index=True)
    first_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_seen_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_agent = Column(String(300), nullable=True)
    device_type = Column(String(50), default="desktop")
    referrer_source = Column(String(100), default="direct")
    is_simulated = Column(Boolean, default=False, nullable=False, index=True)
    scenario_label = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SessionModel(Base):
    __tablename__ = "sessions"

    session_id = Column(String(64), primary_key=True, index=True)
    visitor_id = Column(String(64), ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    ended_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Float, default=0.0, nullable=False)
    page_count = Column(Integer, default=0, nullable=False)
    referrer = Column(String(150), default="direct")
    device = Column(String(50), default="desktop")
    is_simulated = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        Index("ix_events_visitor_occurred", "visitor_id", "occurred_at"),
        Index("ix_events_content", "content_type", "content_id"),
    )

    event_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    visitor_id = Column(String(64), ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(64), ForeignKey("sessions.session_id", ondelete="CASCADE"), nullable=False, index=True)
    event_name = Column(String(50), nullable=False, index=True)
    content_type = Column(String(30), nullable=True, index=True)  # 'product' | 'article' | 'page'
    content_id = Column(Integer, nullable=True, index=True)
    occurred_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    properties = Column(JSON, nullable=True)
    is_simulated = Column(Boolean, default=False, nullable=False, index=True)


class Favorite(Base):
    __tablename__ = "favorites"
    __table_args__ = (
        UniqueConstraint("visitor_id", "content_type", "content_id", name="uq_visitor_favorite"),
    )

    favorite_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    visitor_id = Column(String(64), ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False, index=True)
    content_type = Column(String(30), nullable=False, index=True)  # 'product' | 'article'
    content_id = Column(Integer, nullable=False, index=True)
    is_simulated = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    visitor_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), nullable=True)
    model_version = Column(String(64), nullable=False)
    strategy = Column(String(50), nullable=False)  # 'content_based' | 'cold_start_related' | 'cold_start_popular'
    context_content_type = Column(String(30), nullable=True)
    context_content_id = Column(Integer, nullable=True)
    recommended_items = Column(JSON, nullable=False)
    clicked_content_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class UserFeature(Base):
    """
    Aggregated feature vector for K-means clustering:
    X = [S, P, A, T, Q, F, C, R, U]
    S: total_sessions
    P: total_product_views
    A: total_article_views
    T: avg_session_duration
    Q: total_searches
    F: total_favorites
    C: total_contact_clicks
    R: return_visits
    U: unique_products_viewed
    """
    __tablename__ = "user_features"

    visitor_id = Column(String(64), ForeignKey("visitors.visitor_id", ondelete="CASCADE"), primary_key=True, index=True)
    total_sessions = Column(Integer, default=0, nullable=False)          # S
    total_page_views = Column(Integer, default=0, nullable=False)
    total_product_views = Column(Integer, default=0, nullable=False)     # P
    total_article_views = Column(Integer, default=0, nullable=False)     # A
    avg_session_duration = Column(Float, default=0.0, nullable=False)    # T (seconds)
    total_searches = Column(Integer, default=0, nullable=False)          # Q
    total_favorites = Column(Integer, default=0, nullable=False)         # F
    total_shares = Column(Integer, default=0, nullable=False)
    total_contact_clicks = Column(Integer, default=0, nullable=False)    # C
    unique_products_viewed = Column(Integer, default=0, nullable=False)  # U
    return_visits = Column(Integer, default=0, nullable=False)           # R
    deep_scroll_count = Column(Integer, default=0, nullable=False)
    is_simulated = Column(Boolean, default=False, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class MLModel(Base):
    __tablename__ = "ml_models"

    model_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_name = Column(String(100), nullable=False, index=True)  # 'kmeans_segmentation' | 'tfidf_content_recommender'
    model_type = Column(String(50), nullable=False)               # 'clustering' | 'recommendation'
    version = Column(String(64), unique=True, nullable=False, index=True)
    parameters = Column(JSON, nullable=False)
    metrics = Column(JSON, nullable=False)
    artifact_path = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    trained_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ClusterProfile(Base):
    __tablename__ = "cluster_profiles"
    __table_args__ = (
        UniqueConstraint("model_id", "cluster_index", name="uq_model_cluster_idx"),
    )

    profile_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("ml_models.model_id", ondelete="CASCADE"), nullable=False, index=True)
    cluster_index = Column(Integer, nullable=False)
    cluster_name = Column(String(150), nullable=False)
    cluster_description = Column(Text, nullable=False)
    size = Column(Integer, nullable=False)
    percentage = Column(Float, nullable=False)
    centroid_features = Column(JSON, nullable=False)
    dominant_characteristics = Column(JSON, nullable=True)
    recommended_strategy = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class ClusterResult(Base):
    __tablename__ = "cluster_results"
    __table_args__ = (
        UniqueConstraint("model_id", "visitor_id", name="uq_model_visitor_cluster"),
    )

    result_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("ml_models.model_id", ondelete="CASCADE"), nullable=False, index=True)
    visitor_id = Column(String(64), ForeignKey("visitors.visitor_id", ondelete="CASCADE"), nullable=False, index=True)
    cluster_index = Column(Integer, nullable=False, index=True)
    distance_to_centroid = Column(Float, nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Recommendation(Base):
    __tablename__ = "recommendations"

    rec_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey("ml_models.model_id", ondelete="CASCADE"), nullable=True, index=True)
    visitor_id = Column(String(64), nullable=False, index=True)
    content_type = Column(String(30), nullable=False)  # 'product' | 'article'
    content_id = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    rank = Column(Integer, nullable=False)
    reason = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AdminUser(Base):
    __tablename__ = "admin_users"

    admin_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    role = Column(String(50), default="admin", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SimulationScenario(Base):
    __tablename__ = "simulation_scenarios"

    scenario_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    scenario_code = Column(String(80), unique=True, nullable=False, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    visitor_ratio = Column(Float, nullable=False)
    behavior_params = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    admin_id = Column(Integer, ForeignKey("admin_users.admin_id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(80), nullable=False)
    resource_id = Column(String(80), nullable=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
