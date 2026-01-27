from pydantic import BaseModel
from typing import Optional

class VitalResponse(BaseModel):
    date: str
    sleepScore: Optional[float]
    sleepingHR: Optional[float]
    hrv: Optional[float]
    stress: Optional[float]

class VitalsRequest(BaseModel):
    email: str
    date: str

class VitalsResponse(BaseModel):
    vitals: VitalResponse