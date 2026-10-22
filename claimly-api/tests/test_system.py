def test_health(client):
    assert client.get('/health').json() == {'status': 'ok'}


def test_reset_restores_seed(client):
    assert client.post('/reset').status_code == 200
    assert client.post('/reset').json() == {'status': 'ok'}
