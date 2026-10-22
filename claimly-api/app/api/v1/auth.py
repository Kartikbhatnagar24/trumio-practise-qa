from fastapi import APIRouter

from app.core.database import Db
from app.core.security import CurrentUser
from app.models.users import LoginIn, LoginOut, User
from app.services import auth_service

router = APIRouter(tags=['auth'])


@router.post('/auth/login', response_model=LoginOut, responses={401: {'description': 'Wrong email or password'}})
def login(body: LoginIn, conn: Db) -> LoginOut:
    return auth_service.login(conn, body)


@router.get('/me', response_model=User, responses={401: {'description': 'Missing or expired token'}})
def me(user: CurrentUser) -> User:
    return user
