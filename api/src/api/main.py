import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from api.routes.sync import router as sync_router
from api.routes.vitals import router as vitals_router
from api.routes.health import router as health_router
from api.routes.workouts import router as workouts_router
from api.routes.activities import router as activities_router


GARMIN_EMAIL = os.getenv('GARMIN_EMAIL')
GARMIN_PASSWORD = os.getenv('GARMIN_PASSWORD')

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

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
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    should_reload = os.getenv('ENV', 'development') == 'development'
    uvicorn.run("src.main:app", host=host, port=port, reload=should_reload)