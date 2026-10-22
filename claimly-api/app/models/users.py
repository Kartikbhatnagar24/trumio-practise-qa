from pydantic import BaseModel, EmailStr, Field

from app.static.enums import Grade, Role


class User(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: Role
    grade: Grade
    department: str
    manager_id: str | None


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class LoginOut(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: User
