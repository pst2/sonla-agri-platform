from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class LocationSchema(BaseModel):
    location_id: int
    name: str
    slug: str
    province: str
    district: str
    altitude: Optional[str] = None
    climate: Optional[str] = None
    soil_type: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True


class CategorySchema(BaseModel):
    category_id: int
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0
    product_count: Optional[int] = 0

    class Config:
        from_attributes = True


class CategoryCreateUpdate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    display_order: int = 0


class ArticleBriefSchema(BaseModel):
    article_id: int
    title: str
    slug: str
    excerpt: str
    content_type: str
    image_url: Optional[str] = None
    reading_time_minutes: int = 5
    published_at: datetime
    view_count: int = 0

    class Config:
        from_attributes = True


class ProductBriefSchema(BaseModel):
    product_id: int
    product_name: str
    slug: str
    category_id: int
    location_id: int
    origin: str
    short_description: Optional[str] = None
    image_url: str
    season: Optional[str] = None
    certification: Optional[str] = None
    verification_status: str
    view_count: int = 0
    favorite_count: int = 0

    class Config:
        from_attributes = True


class ProductSchema(BaseModel):
    product_id: int
    product_name: str
    slug: str
    category_id: int
    location_id: int
    origin: str
    short_description: Optional[str] = None
    description: str
    ingredients: str
    production_process: str
    characteristics: str
    traditional_value: str
    keywords: str
    image_url: str
    season: Optional[str] = None
    certification: Optional[str] = None
    producer: Optional[str] = None
    source_reference: str
    verification_status: str
    view_count: int = 0
    favorite_count: int = 0
    contact_click_count: int = 0
    is_featured: bool = True
    created_at: datetime
    updated_at: datetime
    category: Optional[CategorySchema] = None
    location: Optional[LocationSchema] = None
    articles: List[ArticleBriefSchema] = []

    class Config:
        from_attributes = True


class ProductCreateUpdate(BaseModel):
    product_name: str
    slug: str
    category_id: int
    location_id: int
    origin: str
    short_description: Optional[str] = None
    description: str
    ingredients: str
    production_process: str
    characteristics: str
    traditional_value: str
    keywords: str
    image_url: str
    season: Optional[str] = None
    certification: Optional[str] = None
    producer: Optional[str] = None
    source_reference: str
    verification_status: str = "verified"
    is_featured: bool = True


class ArticleSchema(BaseModel):
    article_id: int
    title: str
    slug: str
    excerpt: str
    content: str
    content_type: str
    image_url: Optional[str] = None
    author: Optional[str] = None
    reading_time_minutes: int = 5
    keywords: Optional[str] = None
    source_reference: Optional[str] = None
    published_at: datetime
    status: str
    view_count: int = 0
    favorite_count: int = 0
    created_at: datetime
    updated_at: datetime
    products: List[ProductBriefSchema] = []

    class Config:
        from_attributes = True


class ArticleCreateUpdate(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    content_type: str = "story"
    image_url: Optional[str] = None
    author: Optional[str] = "Ban Biên Tập Nông Sản Sơn La"
    reading_time_minutes: int = 5
    keywords: Optional[str] = None
    source_reference: Optional[str] = None
    status: str = "published"
    product_ids: List[int] = []


class EventCreateRequest(BaseModel):
    visitor_id: str = Field(..., min_length=3, max_length=64)
    session_id: str = Field(..., min_length=3, max_length=64)
    event_name: str = Field(..., description="One of 10 standard events")
    content_type: Optional[str] = None
    content_id: Optional[int] = None
    properties: Optional[Dict[str, Any]] = None
    device_type: Optional[str] = "desktop"
    referrer_source: Optional[str] = "direct"


class FavoriteCreateRequest(BaseModel):
    visitor_id: str
    session_id: Optional[str] = None
    content_type: str = Field(..., pattern="^(product|article)$")
    content_id: int


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: Dict[str, Any]


class SimulationRequest(BaseModel):
    num_visitors: int = Field(default=500, ge=50, le=5000)
    random_seed: int = Field(default=42)
    clear_existing_simulated: bool = True
    auto_retrain_models: bool = True


class TrainClusteringRequest(BaseModel):
    k_min: int = Field(default=2, ge=2, le=5)
    k_max: int = Field(default=8, ge=3, le=12)
    forced_k: Optional[int] = Field(default=None, ge=2, le=10)
    include_simulated: bool = True
    random_seed: int = 42


class BuildRecommendationRequest(BaseModel):
    weights: Optional[Dict[str, float]] = Field(
        default=None,
        description="Behavioral weights: {'view': 1, 'scroll': 2, 'favorite': 3, 'share': 4, 'contact_click': 5}",
    )
    top_k: int = Field(default=5, ge=1, le=20)
