PASSWORD = 'Claimly@2026'
ASHA = 'asha.verma@claimly.in'
VIKRAM = 'vikram.nair@claimly.in'
RAHUL = 'rahul.mehta@claimly.in'
KAVITA = 'kavita.rao@claimly.in'
NEHA = 'neha.iyer@claimly.in'


def login(client, email: str) -> dict:
    response = client.post('/auth/login', json={'email': email, 'password': PASSWORD})
    assert response.status_code == 200, response.text
    return {'Authorization': f'Bearer {response.json()["access_token"]}'}
