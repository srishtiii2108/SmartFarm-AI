import time
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.chat import limiter
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging

settings = get_settings()
logger = setup_logging(debug=settings.DEBUG)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.db.session import SessionLocal, init_db
    from app.ml.predictor import DiseasePredictor
    from app.rag.ingestion import seed_default_knowledge_base

    logger.info(f"Starting {settings.APP_NAME} [{settings.APP_ENV}]...")
    init_db()
    DiseasePredictor.load_artifacts()

    if SessionLocal is not None:
        db = SessionLocal()
        try:
            seed_default_knowledge_base(db)
        except Exception as exc:
            logger.error(f"Knowledge base auto-seeding warning: {exc}")
        finally:
            db.close()

    yield
    logger.info(f"Shutting down {settings.APP_NAME}...")


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        description="AI-Powered Agriculture Intelligence & Farm Management Platform API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # Rate Limiting State
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS Security Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Request ID & Latency Tracing Middleware
    @app.middleware("http")
    async def request_tracing_middleware(request: Request, call_next):
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id
        start_time = time.perf_counter()

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        logger.info(f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
        return response

    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_application()