from fastapi import Depends
from db.client import db, DB

from api.utils.crypto import crypto_manager, CryptoManager

from api.services.auth_service import AuthService
from api.services.garmin_service import GarminService

def get_db() -> DB:
    return db

def get_crypto_manager() -> CryptoManager:
    return crypto_manager

def get_auth_service(db: DB = Depends(get_db), crypto_manager: CryptoManager = Depends(get_crypto_manager)) -> AuthService:
    return AuthService(db, crypto_manager=crypto_manager)


def get_garmin_service(db: DB = Depends(get_db), crypto_manager: CryptoManager = Depends(get_crypto_manager)) -> GarminService:
    return GarminService(db, crypto_manager)

