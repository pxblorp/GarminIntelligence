import asyncio
from typing import Dict, Any, List
from api.services.auth_service import auth_service
from .activities import load_activities_fixtures
from .vitals import load_vitals_fixtures
from .workouts import load_workouts_fixtures


async def load_auth_fixtures(db_client) -> Dict[str, Any]:
    """Create test user and related auth fixtures"""
    user = await _create_test_user(db_client)
    return user

async def _create_test_user(db_client) -> Dict[str, Any]:
    """Create a test user in the database"""
    # Hash password
    password_hash = await auth_service._hash_password("testpassword")
    
    # Insert test user
    query = """
        INSERT INTO users (email, password_hash, oauth_token, oauth_token_secret)
        VALUES (?, ?, ?, ?)
    """
    await db_client.execute(query, {
        "email": "test@example.com",
        "password_hash": password_hash.decode('utf-8'),
        "oauth_token": "test_token",
        "oauth_token_secret": "test_secret"
    })
    
    # Get the user
    select_query = "SELECT user_id, email FROM users WHERE email = ?"
    result = await db_client.execute(select_query, {"email": "test@example.com"})
    return result.rows[0]