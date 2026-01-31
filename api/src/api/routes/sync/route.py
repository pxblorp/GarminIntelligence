import os
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from api.services.garmin_service import GarminService
from .models import SyncQueryParams, SyncResponse, ActivityVM

router = APIRouter(prefix="/api", tags=["sync"])


GARMIN_EMAIL = os.getenv('GARMIN_EMAIL') or ''
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD') or ''

@router.get('/sync', response_model=SyncResponse)
def sync_garmin_data(params: SyncQueryParams = Depends()) -> SyncResponse:
    """
    Fetch all data from Garmin and return it
    """
    raise Exception("Not implemented yet")