from pydantic import BaseModel
from typing import List

class ActivityVM(BaseModel):
    date: str
    duration: float
    rpe: int
    trainingLoad: float
    tRPE: float
    activityType: str

class ActivityRequest(BaseModel):
    email: str
    start_date: str
    end_date: str

class ActivityCreate(BaseModel):
    date: str
    duration: float
    rpe: int
    training_load: float
    trpe: float
    activity_type: str


class ActivitiesResponse(BaseModel):
    activities: List[ActivityVM]