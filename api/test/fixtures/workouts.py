from typing import Dict, Any, List

async def load_workouts_fixtures(db_client, user: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Create test workouts for the given user"""
    workouts_data = [
        {
            "user_id": user["user_id"],
            "sport": "running",
            "name": "Easy Run",
            "steps": '[{"type": "warmup", "duration": 600}, {"type": "steady", "duration": 2400}, {"type": "cooldown", "duration": 600}]',
            "rpe": 6,
            "notes": "Easy recovery run",
            "estimated_load": 180.0
        },
        {
            "user_id": user["user_id"],
            "sport": "cycling",
            "name": "Interval Training",
            "steps": '[{"type": "warmup", "duration": 900}, {"type": "interval", "duration": 1800}, {"type": "cooldown", "duration": 900}]',
            "rpe": 8,
            "notes": "High intensity intervals",
            "estimated_load": 360.0
        }
    ]
    
    workouts = []
    for workout_data in workouts_data:
        query = """
            INSERT INTO workouts (user_id, sport, name, steps, rpe, notes, estimated_load)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        await db_client.execute(query, workout_data)
        
        # Get the inserted workout
        select_query = "SELECT * FROM workouts WHERE user_id = ? AND name = ?"
        result = await db_client.execute(select_query, {
            "user_id": workout_data["user_id"],
            "name": workout_data["name"]
        })
        workouts.append(result.rows[0])
    
    return workouts