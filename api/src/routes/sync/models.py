from pydantic import BaseModel
from typing import List, Optional

class ActivityResponse(BaseModel):
    date: str
    duration: float
    rpe: int
    trainingLoad: float
    tRPE: float
    activityType: str

class VitalResponse(BaseModel):
    date: str
    sleepScore: Optional[float]
    sleepingHR: Optional[float]
    hrv: Optional[float]
    stress: Optional[float]

class SyncQueryParams(BaseModel):
    email: str
    days: int

class SyncResponse(BaseModel):
    activities: List[ActivityResponse]
    vitals: List[VitalResponse]