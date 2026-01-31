from fastapi import APIRouter, HTTPException, Depends
import os

from api.services import VitalService, AuthService, GarminService
from api.dependencies import get_vitals_service, get_auth_service, get_garmin_service
from api.dependencies.auth import get_current_user

from .models import VitalsRequest, VitalsResponse, VitalsVM

router = APIRouter(prefix="/api", tags=["vitals"])

@router.get('/vitals', response_model=VitalsResponse)
async def get_vitals(
    req: VitalsRequest = Depends(),
    vital_service: VitalService = Depends(get_vitals_service),
    auth_service: AuthService = Depends(get_auth_service),
    garmin_service: GarminService = Depends(get_garmin_service),
    current_user: dict = Depends(get_current_user)
) -> VitalsResponse:
    """Get vitals for a specific date"""
    try:
        user_id = current_user["user_id"]
        
        # Try to get from DB
        vitals = await vital_service.get_vitals(user_id, req.date)
        
        if not vitals:
            # Sync from Garmin
            user = await auth_service.get_user_by_id(user_id)
            if not user or not user.get("oauth_token") or not user.get("oauth_token_secret"):
                raise HTTPException(status_code=401, detail="Garmin credentials not found. Please re-authenticate.")
            
            client = garmin_service.resume_session(user["oauth_token"], user["oauth_token_secret"])
            
            vitals = await vital_service.sync_vitals_from_garmin(user_id, req.date, client)
        
        if not vitals:
           return VitalsResponse(vitals=[])
            
        else:
            vitals = VitalsVM(
                date=vitals.date,
                sleep_score=vitals.sleep_score,
                sleeping_hr=vitals.sleeping_hr,
                hrv=vitals.hrv,
                stress=vitals.stress
            )
        
        return VitalsResponse(vitals=[vitals])
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))