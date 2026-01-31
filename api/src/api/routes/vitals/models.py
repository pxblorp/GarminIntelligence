from pydantic import BaseModel
from typing import Optional

class VitalsVM(BaseModel):
    date: str
    sleep_score: Optional[float] = None
    sleeping_hr: Optional[float] = None
    hrv: Optional[float] = None
    stress: Optional[float] = None

class VitalsCreate(BaseModel):
    date: str
    sleep_score: Optional[float] = None
    sleeping_hr: Optional[float] = None
    hrv: Optional[float] = None
    stress: Optional[float] = None

class VitalsRequest(BaseModel):
    date: str

class VitalsResponse(BaseModel):
    vitals: list[VitalsVM]