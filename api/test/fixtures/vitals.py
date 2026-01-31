from typing import Dict, Any, List

async def load_vitals_fixtures(db_client, user: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Create test vitals for the given user"""
    vitals_data = [
        {
            "user_id": user["user_id"],
            "date": "2024-01-01",
            "sleep_score": 85.0,
            "sleeping_hr": 48.0,
            "hrv": 65.0,
            "stress": 25.0
        },
        {
            "user_id": user["user_id"],
            "date": "2024-01-02",
            "sleep_score": 78.0,
            "sleeping_hr": 52.0,
            "hrv": 58.0,
            "stress": 35.0
        }
    ]
    
    vitals = []
    for vital_data in vitals_data:
        query = """
            INSERT INTO vitals (user_id, date, sleep_score, sleeping_hr, hrv, stress)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        await db_client.execute(query, vital_data)
        
        # Get the inserted vital
        select_query = "SELECT * FROM vitals WHERE user_id = ? AND date = ?"
        result = await db_client.execute(select_query, {
            "user_id": vital_data["user_id"],
            "date": vital_data["date"]
        })
        vitals.append(result.rows[0])
    
    return vitals