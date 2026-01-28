from fastapi import APIRouter, HTTPException, Depends
import os
from ...services.GarminManager import garmin_manager
from .models import WorkoutQuery, WorkoutCreate, WorkoutResponse, WorkoutsResponse, WorkoutIdQuery

router = APIRouter(prefix="/api", tags=["workouts"])

GARMIN_EMAIL = os.getenv('GARMIN_EMAIL') or ''
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD') or ''

@router.get('/workouts', response_model=WorkoutsResponse)
def get_workouts(req: WorkoutQuery = Depends()) -> WorkoutsResponse:
    """Get workouts"""
    try:
        # For now, return empty list
        return WorkoutsResponse(success=True, workouts=[])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/workouts', response_model=WorkoutResponse)
def create_workout(workout: WorkoutCreate) -> WorkoutResponse:
    """Create a workout"""
    try:
        # For now, just return the input as response
        from datetime import datetime
        return WorkoutResponse(
            id="temp_id",
            sport=workout.sport,
            name=workout.name,
            steps=workout.steps,
            rpe=workout.rpe,
            notes=workout.notes,
            estimatedLoad=0.0,  # TODO: calculate
            createdAt=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/workouts/{workout_id}', response_model=WorkoutResponse)
def get_workout(workout_id: str, req: WorkoutIdQuery = Depends()) -> WorkoutResponse:
    """Get a specific workout"""
    try:
        # For now, raise not found
        raise HTTPException(status_code=404, detail="Workout not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/workouts/{workout_id}', response_model=WorkoutResponse)
def update_workout(workout_id: str, workout: WorkoutCreate) -> WorkoutResponse:
    """Update a workout"""
    try:
        # For now, raise not found
        raise HTTPException(status_code=404, detail="Workout not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/workouts/{workout_id}')
def delete_workout(workout_id: str, req: WorkoutIdQuery = Depends()):
    """Delete a workout"""
    try:
        # For now, raise not found
        raise HTTPException(status_code=404, detail="Workout not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))