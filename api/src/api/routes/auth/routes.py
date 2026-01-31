import uuid
import garth

from fastapi import APIRouter, HTTPException, Response

from db import db_client
from db.models.users import User

from garth import Client
from api.services.auth_service import auth_service

from .models import UserLoginRequest, UserSignupRequest

router = APIRouter(prefix="/auth")

@router.post("/login")
async def login(body: UserLoginRequest):
    user = await auth_service.signin(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = await auth_service.create_access_token(user_id=user["user_id"], email=user["email"])
    return {"access_token": token, "token_type": "bearer"}

@router.post("/signup")
async def signup(body: UserSignupRequest):
    # Check if user exists
    result = await db_client.execute("SELECT user_id FROM users WHERE email = ?", params={"email": body.email})
    if result.rows:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        oauth1, oauth2 = await garth.login(body.email, body.password)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid Garmin credentials") from e
    
    user = await auth_service.signup(body.email, body.password)
    if not user:
        raise HTTPException(status_code=500, detail="User registration failed")
    
    update_query = "UPDATE users SET oauth_token = ?, oauth_token_secret = ? WHERE user_id = ?"
    await db_client.execute(update_query, params={"oauth_token": oauth1.token, "oauth_token_secret": oauth1.token_secret, "user_id": user["user_id"]})
    
    return {"user_id": user["user_id"], "email": user["email"]}
