from fastapi import Depends
from db import DatabaseClient

from api.services import AuthService
from api.services import VitalService
from api.services import GarminService
from api.services import WorkoutService
from api.services import ActivityService

def get_db_client() -> DatabaseClient:
    from db import db_client
    return db_client


def get_auth_service(db_client: DatabaseClient = Depends(get_db_client)) -> AuthService:
    return AuthService(db_client)

def get_vitals_service(db_client: DatabaseClient = Depends(get_db_client)) -> VitalService:
    return VitalService(db_client)

def get_garmin_service(db_client: DatabaseClient = Depends(get_db_client)) -> GarminService:
    return GarminService(db_client)

def get_workout_service(db_client: DatabaseClient = Depends(get_db_client)) -> WorkoutService:
    return WorkoutService(db_client)

def get_activity_service(db_client: DatabaseClient = Depends(get_db_client)) -> ActivityService:
    return ActivityService(db_client)


