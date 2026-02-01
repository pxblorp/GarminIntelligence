import os
import jwt
from api.utils.crypto import CryptoManager, crypto_manager
from datetime import datetime, timedelta

from db.client import DB
from db.models import User


class AuthService:
    """Service for user authentication and JWT token management."""
    
    def __init__(self, db: DB, crypto_manager : CryptoManager):
        self.db = db
        self.crypto_manager = crypto_manager

    async def signup(self, email: str, password: str) -> int:
        hashed = self.crypto_manager.hash_password(password)
        query = "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?) RETURNING user_id"
        result = await self.db.execute(query, args=(email, hashed, datetime.now()))
        if result.rows:
             return result.rows[0]['user_id']
        return 0

    async def get_user_by_id(self, user_id: int):
        query = "SELECT * FROM users WHERE user_id = ?"
        result = await self.db.execute(query, args=(user_id,))
        if not result.rows:
            return None
        return result.rows[0]

    async def login(self, email: str, password: str):
        query = "SELECT * FROM users WHERE email = ?"
        result = await self.db.execute(query, args=(email,))
        if not result.rows:
            return None
        user = result.rows[0]
        
        stored_hash = user['password_hash']
        
        if not stored_hash:
             return None

        if not self.crypto_manager.verify_password(password, stored_hash):
            return None

        # Update last login time
        now = datetime.now()
        update_query = "UPDATE users SET last_login_at = ? WHERE user_id = ?"
        await self.db.execute(update_query, args=(now, user['user_id']))
        
        return User(
            user_id=user['user_id'],
            email=user['email'],
            created_at=user['created_at'],
            last_login_at=now,
        )

    async def create_access_token(self, user_id: int, email: str) -> str:
        """
        Create a JWT access token for the user.
        
        Args:
            user_id: User ID to encode in token
            email: User email to encode in token
            
        Returns:
            JWT token string
        """
        secret_key = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        algorithm = "HS256"
        expire = datetime.now() + timedelta(hours=24)
        
        payload = {
            "user_id": user_id,
            "email": email,
            "exp": expire
        }
        
        token = jwt.encode(payload, secret_key, algorithm=algorithm)
        return token
