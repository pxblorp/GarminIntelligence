import os
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import jwt

from db import db_client

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter(prefix="/auth")

class SignupBody(BaseModel):
    email: EmailStr
    password: str

def hash_password(password): return pwd_context.hash(password)
def verify_password(password, hash): return pwd_context.verify(password, hash)

def create_access_token(user_id: str):
    expire = datetime.now(timezone.utc) + timedelta(minutes=int(os.getenv("JWT_EXPIRE_MINUTES", 60)))
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, os.getenv("JWT_SECRET"), algorithm=os.getenv("JWT_ALGORITHM"))

@router.post("/signup")
async def signup(body: SignupBody):
    user_id = str(uuid.uuid4())
    password_hash = hash_password(body.password)
    try:
        await db_client.execute(
            "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
            [user_id, body.email, password_hash]
        )
    except Exception:
        raise HTTPException(400, "Email already exists")
    return {"ok": True}

class LoginBody(BaseModel):
    email: EmailStr
    password: str

@router.post("/login")
async def login(body: LoginBody, response: Response):
    result = await db_client.execute(
        "SELECT id, password_hash FROM users WHERE email = ?",
        [body.email]
    )
    if not result.rows:
        raise HTTPException(401, "Invalid credentials")
    user_id, password_hash = result.rows[0]
    if not verify_password(body.password, password_hash):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token(user_id)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="lax")
    return {"ok": True}
