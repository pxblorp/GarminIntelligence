from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class User(BaseModel):
    user_id: int
    email: str
    created_at: Optional[datetime]
    last_login_at: Optional[datetime]

