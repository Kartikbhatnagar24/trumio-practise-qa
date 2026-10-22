import hashlib
import hmac
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings
from app.core.database import Db
from app.models.users import User
from app.static import messages
from app.static.enums import Role

ALGORITHM = 'HS256'
TOKEN_TTL = timedelta(hours=12)
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000).hex()


def password_matches(password: str, salt: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_password(password, salt), expected_hash)


def create_access_token(user_id: str, role: Role, expires_in: timedelta = TOKEN_TTL) -> str:
    claims = {'sub': user_id, 'role': role.value, 'exp': datetime.now(UTC) + expires_in}
    return jwt.encode(claims, settings.jwt_secret, algorithm=ALGORITHM)


def unauthorized(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail, headers={'WWW-Authenticate': 'Bearer'})


def current_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)], conn: Db) -> User:
    if credentials is None:
        raise unauthorized(messages.NOT_AUTHENTICATED)
    try:
        user_id = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[ALGORITHM])['sub']
    except JWTError:
        raise unauthorized(messages.SESSION_EXPIRED) from None
    row = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    if row is None:
        raise unauthorized(messages.SESSION_EXPIRED)
    return User.model_validate(dict(row))


CurrentUser = Annotated[User, Depends(current_user)]


def require_roles(*roles: Role):
    def guard(user: CurrentUser) -> User:
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, messages.FORBIDDEN)
        return user

    return guard
