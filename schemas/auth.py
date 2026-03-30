from pydantic import BaseModel, EmailStr
from models.user import UserType


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    user_type: UserType


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: UserType


class UserOut(BaseModel):
    id: str
    email: str
    user_type: UserType
    plan: str
    is_active: bool

    model_config = {"from_attributes": True}