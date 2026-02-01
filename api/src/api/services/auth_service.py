from datetime import datetime
from passlib.context import CryptContext

from db.client import DB
from db.models import User
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    def __init__(self, db: DB):
        self.db = db

    async def signup(self, email: str, password: str) -> int:
        hashed = pwd_context.hash(password)
        query = "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?) RETURNING user_id"
        result = await self.db.execute(query, args=(email, hashed, datetime.now()))
        if result.rows:
             return result.rows[0][0]
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

        if not pwd_context.verify(password, stored_hash):
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
