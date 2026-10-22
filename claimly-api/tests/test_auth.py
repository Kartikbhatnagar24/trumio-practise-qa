from datetime import timedelta

from fastapi import Depends

from app.core.security import create_access_token, require_roles
from app.static.enums import Role
from tests.helpers import ASHA, NEHA, PASSWORD, login


def test_login_ok(client):
    response = client.post('/auth/login', json={'email': ASHA, 'password': PASSWORD})
    body = response.json()
    assert response.status_code == 200
    assert body['token_type'] == 'bearer'
    assert body['access_token']
    assert body['user']['role'] == 'EMPLOYEE'
    assert 'password_hash' not in body['user']


def test_login_wrong_password_401(client):
    response = client.post('/auth/login', json={'email': ASHA, 'password': 'wrong'})
    assert response.status_code == 401
    assert response.json()['detail'] == 'Email or password is incorrect.'


def test_login_missing_email_422(client):
    response = client.post('/auth/login', json={'password': PASSWORD})
    assert response.status_code == 422
    assert response.json()['detail'][0]['loc'] == ['body', 'email']


def test_me_returns_user(client):
    response = client.get('/me', headers=login(client, ASHA))
    assert response.json()['email'] == ASHA
    assert response.json()['manager_id'] == 'u-rahul'


def test_me_without_token_401(client):
    assert client.get('/me').status_code == 401


def test_me_with_expired_token_401(client):
    token = create_access_token('u-asha', Role.EMPLOYEE, timedelta(seconds=-5))
    assert client.get('/me', headers={'Authorization': f'Bearer {token}'}).status_code == 401


def test_role_guard_403(client):
    @client.app.get('/finance-probe', dependencies=[Depends(require_roles(Role.FINANCE_ADMIN))])
    def probe() -> dict:
        return {'ok': True}

    assert client.get('/finance-probe', headers=login(client, ASHA)).status_code == 403
    assert client.get('/finance-probe', headers=login(client, NEHA)).status_code == 200


def test_openapi_has_bearer_scheme(client):
    schemes = client.get('/openapi.json').json()['components']['securitySchemes']
    assert any(scheme.get('scheme') == 'bearer' for scheme in schemes.values())
