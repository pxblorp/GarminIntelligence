from typing import List, Optional

from db import db_client
from db.models.activities import Activity
from api.routes.activities.models import ActivityCreate

class ActivityService:
    @staticmethod
    async def get_activities(user_id: int, start_date: str, end_date: str) -> List[Activity]:
        query = """
            SELECT activity_id, user_id, date, duration, rpe, training_load, trpe, activity_type, created_at, updated_at
            FROM activities
            WHERE user_id = ? AND date >= ? AND date <= ?
            ORDER BY date
        """
        result = await db_client.execute(query, params={"user_id": user_id, "start_date": start_date, "end_date": end_date})
        activities = []
        for row in result.rows:
            activities.append(Activity(
                activity_id=row["activity_id"],
                user_id=row["user_id"],
                date=row["date"],
                duration=row["duration"],
                rpe=row["rpe"],
                training_load=row["training_load"],
                trpe=row["trpe"],
                activity_type=row["activity_type"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            ))
        return activities

    @staticmethod
    async def create_activity(user_id: int, activity_data: ActivityCreate) -> Activity:
        query = """
            INSERT INTO activities (user_id, date, duration, rpe, training_load, trpe, activity_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        await db_client.execute(query, params={
            "user_id": user_id,
            "date": activity_data.date,
            "duration": activity_data.duration,
            "rpe": activity_data.rpe,
            "training_load": activity_data.training_load,
            "trpe": activity_data.trpe,
            "activity_type": activity_data.activity_type
        })
        
        # Get the inserted activity
        select_query = "SELECT activity_id, user_id, date, duration, rpe, training_load, trpe, activity_type, created_at, updated_at FROM activities WHERE user_id = ? AND date = ? AND activity_type = ? ORDER BY activity_id DESC LIMIT 1"
        result = await db_client.execute(select_query, params={"user_id": user_id, "date": activity_data.date, "activity_type": activity_data.activity_type})
        if not result.rows:
            raise Exception("Failed to create activity")
        row = result.rows[0]
        return Activity(
            activity_id=row["activity_id"],
            user_id=row["user_id"],
            date=row["date"],
            duration=row["duration"],
            rpe=row["rpe"],
            training_load=row["training_load"],
            trpe=row["trpe"],
            activity_type=row["activity_type"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )

    @staticmethod
    async def sync_activities_from_garmin(user_id: int, start_date: str, end_date: str, garmin_client) -> List[Activity]:
        # Fetch from Garmin
        activities_data = garmin_client.get_activities_by_date(start_date, end_date)
        
        synced_activities = []
        for activity in activities_data:
            duration_minutes = activity.get('duration', 0) / 60
            training_effect = activity.get('aerobicTrainingEffect', 3)
            rpe = min(10, max(1, int(training_effect * 2)))
            
            activity_create = ActivityCreate(
                date=activity.get('startTimeLocal', '').split('T')[0],
                duration=duration_minutes,
                rpe=rpe,
                training_load=activity.get('trainingLoad', 0) or training_effect * 30,
                trpe=duration_minutes * rpe,
                activity_type=activity.get('activityType', {}).get('typeKey', 'Unknown')
            )
            
            check_query = "SELECT activity_id FROM activities WHERE user_id = ? AND date = ? AND activity_type = ? AND ABS(duration - ?) < 0.1"
            result = await db_client.execute(check_query, params={"user_id": user_id, "date": activity_create.date, "activity_type": activity_create.activity_type, "duration": activity_create.duration})
            
            if not result.rows:
                synced_activity = await ActivityService.create_activity(user_id, activity_create)
                synced_activities.append(synced_activity)
        
        return synced_activities

activity_service = ActivityService()