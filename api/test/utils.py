
from .fixtures.auth import load_auth_fixtures
from .fixtures.vitals import load_vitals_fixtures
from .fixtures.workouts import load_workouts_fixtures
from .fixtures.activities import load_activities_fixtures


async def load_all_fixtures(db_client) -> dict:
    """Load all test fixtures and return them as a dictionary"""

    fixtures = {}

    # Load auth fixtures
    user = await load_auth_fixtures(db_client)
    fixtures['user'] = user

    # Load vitals fixtures
    vitals = await load_vitals_fixtures(db_client, user)
    fixtures['vitals'] = vitals

    # Load workouts fixtures
    workouts = await load_workouts_fixtures(db_client, user)
    fixtures['workouts'] = workouts

    # Load activities fixtures
    activities = await load_activities_fixtures(db_client, user)
    fixtures['activities'] = activities

    return fixtures


async def setup_db(db_client):
    """create necessary tables for testing"""
    create_tables_queries = [
        """
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            oauth_token TEXT,
            oauth_token_secret TEXT
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS vitals (
            vital_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            value REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS workouts (
            workout_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            duration INTEGER NOT NULL,
            calories_burned INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS activities (
            activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            distance REAL NOT NULL,
            duration INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
        """
    ]

    for query in create_tables_queries:
        await db_client.execute(query)