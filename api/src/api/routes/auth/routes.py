import uuid
import garth

from fastapi import APIRouter, HTTPException, Response, Depends

from db.models.users import User

from garth import Client
from api.dependencies import get_auth_service
from api.services import AuthService

from .models import UserLoginRequest, UserSignupRequest

router = APIRouter(prefix="/auth")

@router.post("/login")
async def login(body: UserLoginRequest, auth_service: AuthService = Depends(get_auth_service)):
    user = await auth_service.signin(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = await auth_service.create_access_token(user_id=user["user_id"], email=user["email"])
    return {"access_token": token, "token_type": "bearer"}

@router.post("/signup")
async def signup(body: UserSignupRequest, auth_service: AuthService = Depends(get_auth_service)):
    # Check if user exists
    result = await auth_service.db_client.execute("SELECT user_id FROM users WHERE email = ?", params={"email": body.email})
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
    await auth_service.db_client.execute(update_query, params={"oauth_token": oauth1.token, "oauth_token_secret": oauth1.token_secret, "user_id": user["user_id"]})
    
    return {"user_id": user["user_id"], "email": user["email"]}
