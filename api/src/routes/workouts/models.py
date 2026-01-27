from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class WorkoutQuery(BaseModel):
    email: str

class WorkoutCreate(BaseModel):
    email: str
    sport: str = "other"
    name: str = "Untitled Workout"
    steps: List[Dict[str, Any]] = []
    rpe: int = 5
    notes: str = ""

class WorkoutResponse(BaseModel):
    id: str
    sport: str
    name: str
    steps: List[Dict[str, Any]]
    rpe: int
    notes: str
    estimatedLoad: float
    createdAt: str

class WorkoutsResponse(BaseModel):
    success: bool
    workouts: List[WorkoutResponse]

class WorkoutIdQuery(BaseModel):
    email: str

class CalendarQuery(BaseModel):
    email: str
    start_date: str
    end_date: str

class CalendarResponse(BaseModel):
    success: bool
    calendar: Dict[str, List[Dict[str, Any]]]
    weeklyLoad: float

class ExportWeekQuery(BaseModel):
    email: str
    start_date: str

class ExportSingleQuery(BaseModel):
    email: str

class UnscheduleQuery(BaseModel):
    email: str