from api.routes.workouts.models import GetWorkoutByIdParams
from fastapi import APIRouter, HTTPException, Depends
import os

from api.services.workout_service import workout_service
from api.dependencies.auth import get_current_user
from .models import WorkoutCreate, WorkoutsResponse, WorkoutVM

router = APIRouter(prefix="/api", tags=["workouts"])

@router.get('/workouts', response_model=WorkoutsResponse)
async def get_workouts(current_user: dict = Depends(get_current_user)) -> WorkoutsResponse:
    """Get workouts"""
    try:
        user_id = current_user["user_id"]
        workouts = await workout_service.get_workouts(user_id)
        
        # Convert to the expected format
        processed_workouts = []
        for workout in workouts:
            processed_workouts.append({
                'id': str(workout.workout_id),
                'sport': workout.sport,
                'name': workout.name,
                'steps': workout.steps or [],
                'rpe': workout.rpe or 5,
                'notes': workout.notes or "",
                'estimatedLoad': workout.estimated_load or 0.0,
                'createdAt': workout.created_at.isoformat() if workout.created_at else ""
            })
        
        return WorkoutsResponse(workouts=processed_workouts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/workouts', response_model=WorkoutVM)
async def create_workout(
    workout: WorkoutCreate,
    current_user: dict = Depends(get_current_user)
) -> WorkoutVM:
    """Create a workout"""
    try:
        user_id = current_user["user_id"]
        created_workout = await workout_service.create_workout(user_id, workout)
        
        # Convert to the expected format
        return WorkoutVM(
            workout_id=str(created_workout.workout_id),
            sport=created_workout.sport,
            name=created_workout.name,
            steps=[step.dict() for step in workout.steps or []],
            rpe=created_workout.rpe or 5,
            notes=created_workout.notes or "",
            estimatedLoad=created_workout.estimated_load or 0.0,
            createdAt=created_workout.created_at.isoformat() if created_workout.created_at else ""
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/workouts/{workout_id}', response_model=WorkoutVM)
async def get_workout(
    workout_id: int,
    current_user: dict = Depends(get_current_user)
) -> WorkoutVM:
    """Get a specific workout"""
    try:
        user_id = current_user["user_id"]
        workout = await workout_service.get_workout(user_id, workout_id)
        if not workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        return WorkoutVM(
            workout_id=str(workout.workout_id),
            sport=workout.sport,
            name=workout.name,
            steps=[step.dict() for step in workout.steps or []],
            rpe=workout.rpe or 5,
            notes=workout.notes or "",
            estimatedLoad=workout.estimated_load or 0.0,
            createdAt=workout.created_at.isoformat() if workout.created_at else ""
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/workouts/{workout_id}', response_model=WorkoutVM)
def update_workout(workout_id: str, workout: WorkoutCreate) -> WorkoutVM:
    """Update a workout"""
    try:
        raise HTTPException(status_code=404, detail="Workout not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/workouts/{workout_id}')
def delete_workout(workout_id: str, req: GetWorkoutByIdParams = Depends()):
    """Delete a workout"""
    try:
        raise HTTPException(status_code=404, detail="Workout not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))