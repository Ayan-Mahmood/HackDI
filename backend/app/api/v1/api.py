from fastapi import APIRouter
from .endpoints import auth, users, quran, social

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(quran.router, prefix="/quran", tags=["quran"])
api_router.include_router(social.router, prefix="/social", tags=["social"]) 