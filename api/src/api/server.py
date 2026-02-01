import os
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from api.routes.auth import router as auth_router
from api.routes.sync import router as sync_router
from api.routes.health import router as health_router


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

app.include_router(auth_router)
app.include_router(sync_router)
app.include_router(health_router)

if __name__ == '__main__':
    import uvicorn
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    should_reload = os.getenv('ENV', 'development') == 'development'
    uvicorn.run("src.main:app", host=host, port=port, reload=should_reload)