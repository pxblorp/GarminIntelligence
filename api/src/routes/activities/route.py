from fastapi import APIRouter, HTTPException, Depends
import os
from ...services.GarminManager import garmin_manager
from .models import ActivityRequest, ActivitiesResponse

router = APIRouter(prefix="/api", tags=["activities"])

GARMIN_EMAIL = os.getenv('GARMIN_EMAIL') or ''
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD') or ''

@router.get('/activities', response_model=ActivitiesResponse)
def get_activities(req: ActivityRequest = Depends()) -> ActivitiesResponse:
    """Get activities for a date range"""
    try:
        client = garmin_manager.get_client(GARMIN_EMAIL)
        if not client:
            raise HTTPException(status_code=401, detail="Garmin client not found. Please authenticate first.")


        activities = client.get_activities_by_date(req.start_date, req.end_date)   
        
        processed_activities = []
        for activity in activities:
            duration_minutes = activity.get('duration', 0) / 60
            training_effect = activity.get('aerobicTrainingEffect', 3)
            rpe = min(10, max(1, int(training_effect * 2)))
            
            processed_activities.append({
                'date': activity.get('startTimeLocal', '').split('T')[0],
                'duration': duration_minutes,
                'rpe': rpe,
                'trainingLoad': activity.get('trainingLoad', 0) or training_effect * 30,
                'tRPE': duration_minutes * rpe,
                'activityType': activity.get('activityType', {}).get('typeKey', 'Unknown')
            })
        
        return ActivitiesResponse(activities=processed_activities)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))