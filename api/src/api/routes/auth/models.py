from pydantic import BaseModel, EmailStr

class UserSignupRequest(BaseModel):
    email: EmailStr
    password: str

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserMFARequest(BaseModel):
    email: EmailStr
    mfa_code: str
