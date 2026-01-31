from pydantic import BaseModel
from typing import List, Optional

from api.routes.activities.models import ActivityVM
from api.routes.vitals.models import VitalsResponse, VitalsVM

class SyncQueryParams(BaseModel):
    days: int

class SyncResponse(BaseModel):
    vitals: List[VitalsVM]
    activities: List[ActivityVM]