from fastapi import Depends
from db.client import db, DB
from api.services.auth_service import AuthService
from api.services.garmin_service import GarminService

def get_db() -> DB:
    return db

def get_auth_service(db: DB = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_garmin_service(db: DB = Depends(get_db)) -> GarminService:
    return GarminService(db)