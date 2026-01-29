from fastapi import APIRouter

from .models import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])

@router.get('/health', response_model=HealthResponse)
def health_check() -> HealthResponse:
    """Health check endpoint"""
    return HealthResponse(status="ok", message="Garmin backend is running")