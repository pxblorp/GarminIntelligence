import jwt
import os, asyncio
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from db import db_client

class AuthService:
    def __init__(self):
        self.secret_key = os.getenv("SECRET_KEY")
        if not self.secret_key:
            raise RuntimeError("SECRET_KEY is required")

    async def signin(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        query = "SELECT user_id, email, password_hash FROM users WHERE email = ?"
        result = await db_client.execute(query, params={"email": email})
        if not result.rows:
            return None

        user = result.rows[0]
        is_valid = await self._verify_password(password, user["password_hash"])
        if not is_valid:
            return None

        # Update last login
        update_query = "UPDATE users SET last_login_at = ? WHERE user_id = ?"
        await db_client.execute(update_query, params={"last_login_at": datetime.now(timezone.utc).isoformat(), "user_id": user["user_id"]})

        return {"user_id": user["user_id"], "email": user["email"]}

    async def signup(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        password_hash = await self._hash_password(password)
        query = """
            INSERT INTO users (email, password_hash)
            VALUES (?, ?)
        """
        await db_client.execute(query, params={"email": email, "password_hash": password_hash.decode('utf-8')})
        
        # Get the inserted user
        select_query = "SELECT user_id, email FROM users WHERE email = ?"
        result = await db_client.execute(select_query, params={"email": email})
        if not result.rows:
            return None
        user = result.rows[0]
        return {"user_id": user["user_id"], "email": user["email"]}

    async def _hash_password(self, password: str) -> bytes:
        return await asyncio.to_thread(bcrypt.hashpw, password.encode('utf-8'), bcrypt.gensalt())

    async def _verify_password(self, password: str, hashed: str) -> bool:
        return await asyncio.to_thread(bcrypt.checkpw, password.encode('utf-8'), hashed.encode('utf-8'))

    async def create_access_token(self, user_id: int, email: str, expires_minutes: int = 60) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": str(user_id),
            "email": email,
            "iat": now,
            "exp": now + timedelta(minutes=expires_minutes),
        }
        return jwt.encode(payload, self.secret_key, algorithm="HS256")

    async def get_user_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        query = "SELECT user_id, email, oauth_token, oauth_token_secret FROM users WHERE user_id = ?"
        result = await db_client.execute(query, params={"user_id": user_id})
        if not result.rows:
            return None
        return dict(result.rows[0])

auth_service = AuthService()