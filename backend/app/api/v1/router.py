from fastapi import APIRouter
from app.api.v1 import analytics, auth, chat, crops, health, inventory, predictions, weather

api_router = APIRouter()
api_router.include_router(health.router, tags=["System"])
api_router.include_router(auth.router)
api_router.include_router(crops.router)
api_router.include_router(inventory.router)
api_router.include_router(weather.router)
api_router.include_router(chat.router)
api_router.include_router(predictions.router)
api_router.include_router(analytics.router)