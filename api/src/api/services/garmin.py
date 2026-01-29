import json
from db import db_client

async def save_session(user_id: str, session: dict):
    data = json.dumps(session)
    await db_client.execute(
        "INSERT OR REPLACE INTO garmin_sessions (user_id, session_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        [user_id, data]
    )

async def get_session(user_id: str):
    result = await db_client.execute(
        "SELECT session_json FROM garmin_sessions WHERE user_id = ?",
        [user_id]
    )
    if not result.rows:
        return None
    return json.loads(result.rows[0][0])
