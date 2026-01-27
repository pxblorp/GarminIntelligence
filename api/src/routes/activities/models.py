from pydantic import BaseModel
from typing import List

class ActivityRequest(BaseModel):
    email: str
    start_date: str
    end_date: str

class ActivityResponse(BaseModel):
    date: str
    duration: float
    rpe: int
    trainingLoad: float
    tRPE: float
    activityType: str

class ActivitiesResponse(BaseModel):
    activities: List[ActivityResponse]