import json
from typing import List, Optional
from db import db_client
from db.models.workouts import Workout, WorkoutStep
from api.routes.workouts.models import WorkoutCreate, WorkoutUpdate

class WorkoutService:
    @staticmethod
    async def get_workouts(user_id: int) -> List[Workout]:
        query = """
            SELECT workout_id, user_id, sport, name, steps, rpe, notes, estimated_load, created_at, updated_at
            FROM workouts
            WHERE user_id = ?
            ORDER BY created_at DESC
        """
        result = await db_client.execute(query, params={"user_id": user_id})
        workouts = []
        for row in result.rows:
            steps = json.loads(row["steps"]) if row["steps"] else None
            workouts.append(Workout(
                workout_id=row["workout_id"],
                user_id=row["user_id"],
                sport=row["sport"],
                name=row["name"],
                steps=steps,
                rpe=row["rpe"],
                notes=row["notes"],
                estimated_load=row["estimated_load"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            ))
        return workouts

    @staticmethod
    async def create_workout(user_id: int, workout_data: WorkoutCreate) -> Workout:
        steps_json = json.dumps(workout_data.steps) if workout_data.steps else None
        query = """
            INSERT INTO workouts (user_id, sport, name, steps, rpe, notes, estimated_load)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        await db_client.execute(query, params={
            "user_id": user_id,
            "sport": workout_data.sport,
            "name": workout_data.name,
            "steps": steps_json,
            "rpe": workout_data.rpe,
            "notes": workout_data.notes,
            "estimated_load": 0.0  # TODO: calculate estimated_load
        })
        
        # Get the inserted workout
        select_query = "SELECT workout_id, user_id, sport, name, steps, rpe, notes, estimated_load, created_at, updated_at FROM workouts WHERE user_id = ? ORDER BY workout_id DESC LIMIT 1"
        result = await db_client.execute(select_query, params={"user_id": user_id})
        if not result.rows:
            raise Exception("Failed to create workout")
        row = result.rows[0]
        steps = json.loads(row["steps"]) if row["steps"] else None
        return Workout(
            workout_id=row["workout_id"],
            user_id=row["user_id"],
            sport=row["sport"],
            name=row["name"],
            steps=steps,
            rpe=row["rpe"],
            notes=row["notes"],
            estimated_load=row["estimated_load"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

    @staticmethod
    async def get_workout(user_id: int, workout_id: int) -> Optional[Workout]:
        query = """
            SELECT workout_id, user_id, sport, name, steps, rpe, notes, estimated_load, created_at, updated_at
            FROM workouts
            WHERE user_id = ? AND workout_id = ?
        """
        result = await db_client.execute(query, params={"user_id": user_id, "workout_id": workout_id})
        if not result.rows:
            return None
        row = result.rows[0]
        steps = json.loads(row["steps"]) if row["steps"] else None
        return Workout(
            workout_id=row["workout_id"],
            user_id=row["user_id"],
            sport=row["sport"],
            name=row["name"],
            steps=steps,
            rpe=row["rpe"],
            notes=row["notes"],
            estimated_load=row["estimated_load"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

workout_service = WorkoutService()