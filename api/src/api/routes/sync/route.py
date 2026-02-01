import os
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from api.services.garmin_service import GarminService

router = APIRouter(prefix="/api", tags=["sync"])


GARMIN_EMAIL = os.getenv('GARMIN_EMAIL') or ''
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD') or ''


