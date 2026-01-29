from fastapi import APIRouter, HTTPException, Depends
import os
from services.GarminManager import garmin_manager
from .models import VitalsRequest, VitalsResponse, VitalResponse

router = APIRouter(prefix="/api", tags=["vitals"])


GARMIN_EMAIL = os.getenv('GARMIN_EMAIL') or ''
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD') or ''

@router.get('/vitals', response_model=VitalsResponse)
def get_vitals(req: VitalsRequest = Depends()) -> VitalsResponse:
    """Get vitals for a specific date"""
    try:
        client = garmin_manager.get_client(GARMIN_EMAIL)

        if not client:
            raise HTTPException(status_code=401, detail="Garmin client not found. Please authenticate first.")
        
        stats = client.get_stats(req.date)
        sleep_data = client.get_sleep_data(req.date)
        hrv_data = client.get_hrv_data(req.date)
        
        vitals = VitalResponse(
            date=req.date,
            sleepScore=sleep_data.get('sleepScores', {}).get('overall', {}).get('value', None) if sleep_data else None,
            sleepingHR=sleep_data.get('averageSleepingHeartRate', None) if sleep_data else None,
            hrv=hrv_data.get('lastNightAvg', None) if hrv_data else None,
            stress=stats.get('averageStressLevel', None)
        )
        
        return VitalsResponse(vitals=vitals)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))