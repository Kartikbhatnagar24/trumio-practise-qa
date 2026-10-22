import sqlite3

from fastapi import HTTPException, status

from app.core.security import create_access_token, password_matches
from app.models.users import LoginIn, LoginOut, User
from app.static import messages


def login(conn: sqlite3.Connection, body: LoginIn) -> LoginOut:
    row = conn.execute('SELECT * FROM users WHERE email = ?', (body.email.lower(),)).fetchone()
    if row is None or not password_matches(body.password, row['password_salt'], row['password_hash']):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, messages.WRONG_CREDENTIALS)
    user = User.model_validate(dict(row))
    return LoginOut(access_token=create_access_token(user.id, user.role), user=user)
