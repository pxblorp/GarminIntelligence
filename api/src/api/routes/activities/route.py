from fastapi import APIRouter, HTTPException, Depends
import os

from api.services.activity_service import activity_service
from api.services.auth_service import auth_service
from api.dependencies.auth import get_current_user
from api.services.garmin_service import GarminService
from .models import ActivityRequest, ActivitiesResponse

router = APIRouter(prefix="/api", tags=["activities"])

@router.get('/activities', response_model=ActivitiesResponse)
async def get_activities(
    req: ActivityRequest = Depends(),
    current_user: dict = Depends(get_current_user)
) -> ActivitiesResponse:
    """Get activities for a date range"""
    try:
        user_id = current_user["user_id"]
        
        # First, try to get from DB
        activities = await activity_service.get_activities(user_id, req.start_date, req.end_date)
        
        if not activities:
            # If no activities in DB, sync from Garmin
            user = await auth_service.get_user_by_id(user_id)
            if not user or not user.get("oauth_token") or not user.get("oauth_token_secret"):
                raise HTTPException(status_code=401, detail="Garmin credentials not found. Please re-authenticate.")
            
            garmin_service = GarminService()
            client = garmin_service.resume_session(user["oauth_token"], user["oauth_token_secret"])
            
            synced_activities = await activity_service.sync_activities_from_garmin(user_id, req.start_date, req.end_date, client)
            activities = synced_activities
        
        # Convert to the expected format
        processed_activities = []
        for activity in activities:
            processed_activities.append({
                'date': activity.date,
                'duration': activity.duration,
                'rpe': activity.rpe,
                'trainingLoad': activity.training_load,
                'tRPE': activity.trpe,
                'activityType': activity.activity_type
            })
        
        return ActivitiesResponse(activities=processed_activities)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))