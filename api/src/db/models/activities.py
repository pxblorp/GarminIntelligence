from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Activity(BaseModel):
    activity_id: int
    user_id: int
    date: str
    duration: float
    rpe: int
    training_load: float
    trpe: float
    activity_type: str
    created_at: Optional[datetime]
    updated_at: Optional[datetime]