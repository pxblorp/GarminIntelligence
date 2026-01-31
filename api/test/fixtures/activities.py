from typing import Dict, Any, List

async def load_activities_fixtures(db_client, user: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Create test activities for the given user"""
    activities_data = [
        {
            "user_id": user["user_id"],
            "date": "2024-01-01",
            "duration": 3600.0,  # 1 hour
            "rpe": 7,
            "training_load": 420.0,
            "trpe": 25.2,
            "activity_type": "running"
        },
        {
            "user_id": user["user_id"],
            "date": "2024-01-02",
            "duration": 2700.0,  # 45 minutes
            "rpe": 6,
            "training_load": 243.0,
            "trpe": 16.2,
            "activity_type": "cycling"
        }
    ]
    
    activities = []
    for activity_data in activities_data:
        query = """
            INSERT INTO activities (user_id, date, duration, rpe, training_load, trpe, activity_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        await db_client.execute(query, activity_data)
        
        # Get the inserted activity
        select_query = "SELECT * FROM activities WHERE user_id = ? AND date = ?"
        result = await db_client.execute(select_query, {
            "user_id": activity_data["user_id"],
            "date": activity_data["date"]
        })
        activities.append(result.rows[0])
    
    return activities