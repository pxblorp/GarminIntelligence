import asyncio
from db import db_client

async def create_tables():
    # Create users table
    await db_client.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login_at DATETIME,
            oauth_token TEXT,
            oauth_token_secret TEXT
        )
    """)

    # Create tokens table (for sessions)
    await db_client.execute("""
        CREATE TABLE IF NOT EXISTS tokens (
            session_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            ip_address TEXT,
            user_agent TEXT,
            token TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    """)

    # Create activities table
    await db_client.execute("""
        CREATE TABLE IF NOT EXISTS activities (
            activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            duration REAL NOT NULL,
            rpe INTEGER NOT NULL,
            training_load REAL NOT NULL,
            trpe REAL NOT NULL,
            activity_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    """)

    # Create vitals table
    await db_client.execute("""
        CREATE TABLE IF NOT EXISTS vitals (
            vital_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            sleep_score REAL,
            sleeping_hr REAL,
            hrv REAL,
            stress REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    """)

    # Create workouts table
    await db_client.execute("""
        CREATE TABLE IF NOT EXISTS workouts (
            workout_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sport TEXT NOT NULL,
            name TEXT NOT NULL,
            steps TEXT,
            rpe INTEGER,
            notes TEXT,
            estimated_load REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    """)

    print("Tables created successfully")

if __name__ == "__main__":
    asyncio.run(create_tables())