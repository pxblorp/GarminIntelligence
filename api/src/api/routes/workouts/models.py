from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class WorkoutVM(BaseModel):
    workout_id: str
    sport: str
    name: str
    steps: List[Dict[str, Any]]
    rpe: int
    notes: str
    estimatedLoad: float
    createdAt: str

class WorkoutCreate(BaseModel):
    sport: str = "other"
    name: str = "Untitled Workout"
    steps: List[Dict[str, Any]] = []
    rpe: int = 5
    notes: str = ""

class WorkoutUpdate(BaseModel):
    sport: Optional[str] = None
    name: Optional[str] = None
    steps: Optional[List[Dict[str, Any]]] = None
    rpe: Optional[int] = None
    notes: Optional[str] = None

class WorkoutsResponse(BaseModel):
    workouts: List[WorkoutVM]

class GetWorkoutByIdParams(BaseModel):
    workout_id: str

class GetWorkoutsInDateRangeQueryParams(BaseModel):
    start_date: str
    end_date: str

class GetWorkoutsInDateRangeResponse(BaseModel):
    success: bool
    weeklyLoad: float
    calendar: Dict[str, List[Dict[str, Any]]]