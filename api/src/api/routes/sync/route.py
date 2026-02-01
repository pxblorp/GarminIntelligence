import os
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from api.dependencies import get_garmin_service
from api.services.garmin_service import GarminService

router = APIRouter(prefix="/sync", tags=["sync"])


class SyncRequest(BaseModel):
    user_id: int
    start_date: datetime | None = None
    end_date: datetime | None = None


class SyncResponse(BaseModel):
    status: str
    items_synced: int
    sync_type: str
    timestamp: datetime


@router.post("/activities", response_model=SyncResponse)
async def sync_activities(
    request: SyncRequest,
    garmin_service: GarminService = Depends(get_garmin_service)
):
    """
    Sync activities from Garmin for a specific user.
    
    Rate limiting: Garmin API typically allows ~100 requests per hour.
    This endpoint syncs in batches and stores locally to minimize API calls.
    """
    try:
        items_synced = await garmin_service.sync_activities(
            user_id=request.user_id,
            start_date=request.start_date,
            end_date=request.end_date
        )
        
        return SyncResponse(
            status="success",
            items_synced=items_synced,
            sync_type="activities",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync activities: {str(e)}"
        )


@router.post("/vitals", response_model=SyncResponse)
async def sync_vitals(
    user_id: int,
    date: datetime | None = None,
    garmin_service: GarminService = Depends(get_garmin_service)
):
    """
    Sync health vitals from Garmin for a specific date.
    
    Fetches: sleep data, HRV, stress levels, resting HR
    """
    try:
        items_synced = await garmin_service.sync_vitals(
            user_id=user_id,
            date=date
        )
        
        return SyncResponse(
            status="success",
            items_synced=items_synced,
            sync_type="vitals",
            timestamp=datetime.now()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync vitals: {str(e)}"
        )


@router.post("/all")
async def sync_all(
    user_id: int,
    garmin_service: GarminService = Depends(get_garmin_service)
):
    """
    Sync all data types from Garmin.
    
    This is a convenience endpoint that syncs activities, vitals, and other data.
    Use with caution to avoid rate limiting.
    """
    try:
        results = await garmin_service.sync_all(user_id)
        
        return {
            "status": "completed",
            "results": results,
            "timestamp": datetime.now()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync all data: {str(e)}"
        )


@router.get("/history/{user_id}")
async def get_sync_history(
    user_id: int,
    limit: int = 20,
    garmin_service: GarminService = Depends(get_garmin_service)
):
    """
    Get sync history for a user.
    
    Returns the last N sync operations with their status.
    """
    query = """
        SELECT sync_id, sync_type, status, items_synced, error, last_sync_at
        FROM sync_history
        WHERE user_id = ?
        ORDER BY last_sync_at DESC
        LIMIT ?
    """
    result = await garmin_service.db.execute(query, args=(user_id, limit))
    
    return {
        "user_id": user_id,
        "sync_history": result.rows
    }



