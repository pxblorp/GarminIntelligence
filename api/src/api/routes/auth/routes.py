import uuid
from fastapi import APIRouter, HTTPException, Response, Depends

from db.models.users import User
from garth import Client
from api.dependencies import get_auth_service, get_garmin_service
from api.services import AuthService
from api.services.garmin_service import GarminService

from .models import UserLoginRequest, UserSignupRequest

router = APIRouter(prefix="/auth")


@router.post("/login")
async def login(
    body: UserLoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
    garmin_service: GarminService = Depends(get_garmin_service)
):
    """
    Login endpoint for existing users.
    Returns access token if credentials are valid.
    """
    # Authenticate user with email/password
    user = await auth_service.login(body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Load or refresh Garmin client tokens
    try:
        client = await garmin_service.load_client(user["user_id"])
        if client:
            # Check if tokens need refreshing
            await garmin_service.refresh_tokens_if_needed(user["user_id"], client)
    except Exception as e:
        # Tokens might be corrupted, but user can still login
        pass
    
    # Create access token for user session
    token = await auth_service.create_access_token(
        user_id=user["user_id"],
        email=user["email"]
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user["user_id"],
        "email": user["email"]
    }


@router.post("/signup")
async def signup(
    body: UserSignupRequest,
    auth_service: AuthService = Depends(get_auth_service),
    garmin_service: GarminService = Depends(get_garmin_service)
):
    """
    Signup endpoint for new users.
    Authenticates with Garmin, creates user account, and stores OAuth tokens.
    """
    # Check if user already exists
    query = "SELECT user_id FROM users WHERE email = ?"
    result = await auth_service.db.execute(query, args=(body.email,))
    if result.rows:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Authenticate with Garmin first
    try:
        oauth1, oauth2 = await garmin_service.authenticate(body.email, body.password)
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid Garmin credentials. Please verify your email and password."
        ) from e
    
    # Create local user account
    try:
        user_id = await auth_service.signup(body.email, body.password)
        if not user_id:
            raise HTTPException(status_code=500, detail="User registration failed")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to create user account"
        ) from e
    
    # Store Garmin OAuth tokens (encrypted)
    try:
        await garmin_service.store_tokens(user_id, oauth1, oauth2)
    except Exception as e:
        # Delete the user if token storage fails
        await auth_service.db.execute("DELETE FROM users WHERE user_id = ?", args=(user_id,))
        raise HTTPException(
            status_code=500,
            detail="Failed to store Garmin tokens"
        ) from e
    
    # Create access token for user session
    token = await auth_service.create_access_token(
        user_id=user_id,
        email=body.email
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user_id,
        "email": body.email,
        "message": "Account created and Garmin connected successfully"
    }


@router.post("/refresh")
async def refresh_tokens(
    user_id: int,
    garmin_service: GarminService = Depends(get_garmin_service)
):
    """
    Refresh Garmin OAuth tokens if expired.
    Called periodically or before making API calls to Garmin.
    """
    try:
        client = await garmin_service.load_client(user_id)
        if not client:
            raise HTTPException(status_code=404, detail="No Garmin account linked")
        
        await garmin_service.refresh_tokens_if_needed(user_id, client)
        
        return {
            "status": "success",
            "message": "Tokens refreshed if expired"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to refresh tokens: {str(e)}"
        ) from e

