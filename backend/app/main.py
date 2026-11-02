import sys
from pathlib import Path

# Add root directory so `ml.*` and `database.*` imports resolve seamlessly
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin_routes import router as admin_router
from app.api.public_routes import router as public_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.models.entities import MLModel, Product, Visitor
from database.seeds.sonla_seed_data import seed_initial_catalog_and_admin
from ml.src.clustering.kmeans_pipeline import train_and_evaluate_kmeans
from ml.src.data_generator.synthetic_generator import generate_synthetic_dataset
from ml.src.recommendation.content_based import build_and_evaluate_recommender


def bootstrap_platform_data():
    """Ensure tables, initial Sơn La catalog, synthetic behavioral dataset, and trained ML models exist."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        prod_count = db.query(Product).count()
        if prod_count == 0:
            seed_initial_catalog_and_admin(db)

        vis_count = db.query(Visitor).count()
        if vis_count < 50:
            generate_synthetic_dataset(db, num_visitors=500, random_seed=42, clear_existing_simulated=True)

        km_model = (
            db.query(MLModel)
            .filter(MLModel.model_type == "clustering", MLModel.is_active == True)
            .first()
        )
        if not km_model:
            train_and_evaluate_kmeans(db, random_seed=42)

        cb_model = (
            db.query(MLModel)
            .filter(MLModel.model_type == "recommendation", MLModel.is_active == True)
            .first()
        )
        if not cb_model:
            build_and_evaluate_recommender(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    bootstrap_platform_data()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "API Hệ thống truyền thông và phân tích dữ liệu hành vi người dùng cho sản phẩm nông nghiệp truyền thống tỉnh Sơn La "
        "(K-means User Segmentation & Vietnamese TF-IDF Content-based Recommendation)."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(public_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)


@app.get("/")
def root_health():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR,
    }
