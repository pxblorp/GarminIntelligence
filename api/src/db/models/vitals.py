from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Vital(BaseModel):
    vital_id: int
    user_id: int
    date: str
    sleep_score: Optional[float]
    sleeping_hr: Optional[float]
    hrv: Optional[float]
    stress: Optional[float]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]