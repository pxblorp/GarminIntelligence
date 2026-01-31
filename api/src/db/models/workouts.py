from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class WorkoutStep(BaseModel):
    type: str
    duration: Optional[int] = None  # in seconds
    distance: Optional[float] = None  # in meters
    target_hr: Optional[int] = None

class Workout(BaseModel):
    workout_id: int
    user_id: int
    sport: str
    name: str
    steps: Optional[List[WorkoutStep]] = None
    rpe: Optional[int] = None
    notes: Optional[str] = None
    estimated_load: Optional[float] = None
    created_at: Optional[datetime]
    updated_at: Optional[datetime]