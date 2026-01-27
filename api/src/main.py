from fastapi.middleware import Middleware
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

from .services.GarminManager import garmin_manager

from .routes.health import router as health_router
from .routes.sync import router as sync_router
from .routes.activities import router as activities_router
from .routes.vitals import router as vitals_router
from .routes.workouts import router as workouts_router

load_dotenv()

GARMIN_EMAIL = os.getenv('GARMIN_EMAIL')
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD')

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if GARMIN_EMAIL and GARMIN_PASSWORD:
        garmin_manager.add_client(GARMIN_EMAIL, GARMIN_PASSWORD)
    
    print("Starting Garmin Connect Backend...")
    print(f"Login email: {GARMIN_EMAIL}")
    yield
    garmin_manager.close_all()


app = FastAPI(title="Garmin Intelligence API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware, # type: ignore
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

app.include_router(sync_router)
app.include_router(health_router)
app.include_router(vitals_router)
app.include_router(workouts_router)
app.include_router(activities_router)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run("src.main:app", host='0.0.0.0', port=5000, reload=True)
