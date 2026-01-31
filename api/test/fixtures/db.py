import pytest

@pytest.fixture(scope="session")
def setup_schema(db_client):
    """Set up database schema based on migrations"""
    cursor = db_client.cursor()
    
    # Create users table
    cursor.execute("""
        CREATE TABLE users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login_at DATETIME,
            oauth_token VARCHAR(255) NOT NULL,
            oauth_token_secret VARCHAR(255) NOT NULL
        )
    """)
    
    # Create tokens table
    cursor.execute("""
        CREATE TABLE tokens (
            session_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL,
            ip_address VARCHAR(45),
            user_agent VARCHAR(255),
            token VARCHAR(255) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    # Create activities table
    cursor.execute("""
        CREATE TABLE activities (
            activity_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date VARCHAR(10) NOT NULL,
            duration REAL NOT NULL,
            rpe INTEGER NOT NULL,
            training_load REAL NOT NULL,
            trpe REAL NOT NULL,
            activity_type VARCHAR(50) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    # Create vitals table
    cursor.execute("""
        CREATE TABLE vitals (
            vital_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date VARCHAR(10) NOT NULL,
            sleep_score REAL,
            sleeping_hr REAL,
            hrv REAL,
            stress REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    # Create workouts table
    cursor.execute("""
        CREATE TABLE workouts (
            workout_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sport VARCHAR(50) NOT NULL,
            name VARCHAR(255) NOT NULL,
            steps TEXT,
            rpe INTEGER,
            notes TEXT,
            estimated_load REAL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    db_client.commit()
    return db_client