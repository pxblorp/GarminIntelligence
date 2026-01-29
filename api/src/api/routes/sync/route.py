import os
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from services.GarminManager import garmin_manager
from .models import SyncQueryParams, SyncResponse, ActivityResponse, VitalResponse

router = APIRouter(prefix="/api", tags=["sync"])


GARMIN_EMAIL = os.getenv('GARMIN_EMAIL') or ''
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD') or ''

class SyncQueryParams(BaseModel):
    email: str
    days: int

@router.get('/sync', response_model=SyncResponse)
def sync_garmin_data(params: SyncQueryParams = Depends()) -> SyncResponse:
    """
    Fetch all data from Garmin and return it
    """
    try:
        
        client = garmin_manager.get_client(GARMIN_EMAIL)

        if not client:
            raise HTTPException(status_code=401, detail="Garmin client not found. Please authenticate first.")

        days = params.days
        if not days or days <= 0:
            raise HTTPException(status_code=400, detail="Days parameter must be a positive integer")

        
        activities_raw = client.get_activities_by_date(
            (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d'),
            datetime.now().strftime('%Y-%m-%d')
        )

        processed_activities = []
        for activity in activities_raw:
            duration_minutes = (activity.get('duration') or 0) / 60
            training_effect = activity.get('aerobicTrainingEffect') or 3
            rpe = min(10, max(1, int(training_effect * 2)))
            
            processed_activities.append(ActivityResponse(
                date=activity.get('startTimeLocal', '').split('T')[0],
                duration=duration_minutes,
                rpe=rpe,
                trainingLoad=activity.get('trainingLoad', 0) or training_effect * 30,
                tRPE=duration_minutes * rpe,
                activityType=activity.get('activityType', {}).get('typeKey', 'Unknown')
            ))

        vitals = []
        for i in range(days):
            date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            stats = client.get_stats(date)
            sleep_data = client.get_sleep_data(date)
            hrv_data = client.get_hrv_data(date)
            
            vitals.append(VitalResponse(
                date=date,
                sleepScore=sleep_data.get('sleepScores', {}).get('overall', {}).get('value', None) if sleep_data else None,
                sleepingHR=sleep_data.get('averageSleepingHeartRate', None) if sleep_data else None,
                hrv=hrv_data.get('lastNightAvg', None) if hrv_data else None,
                stress=stats.get('averageStressLevel', None)
            ))

        return SyncResponse(activities=processed_activities, vitals=vitals)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync Garmin data: {str(e)}")