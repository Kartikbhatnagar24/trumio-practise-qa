import json

from app.core.variant import load_variant
from tests.helpers import ASHA, FULL_ALTERNATE, NEHA, RAHUL, VIKRAM, create_draft, draft, login

FIVE_MB = 5 * 1024 * 1024


def alternate_client(client_for):
    return client_for(load_variant(json.dumps(FULL_ALTERNATE)))


def test_create_draft_default_names(client):
    claim = create_draft(client, login(client, ASHA), currency='USD', amount='12.50')
    assert claim['status'] == 'DRAFT'
    assert claim['amount'] == '12.50'
    assert claim['amount_inr'] == '1040.63'
    assert claim['merchant'] == 'Truffles Cafe'
    assert claim['expense_date'] == '2026-06-10'
    assert claim['employee']['id'] == 'u-asha'


def test_create_draft_variant_names(client_for):
    client = alternate_client(client_for)
    headers = login(client, ASHA)
    body = {'category': 'MEALS', 'currency': 'INR', 'claim_amount': '450.00', 'vendor': 'Truffles Cafe', 'spent_on': '2026-06-10'}
    response = client.post('/expenses', json=body, headers=headers)
    assert response.status_code == 201, response.text
    assert response.json()['claim_amount'] == '450.00'
    assert response.json()['vendor'] == 'Truffles Cafe'
    assert 'amount' not in response.json()
    default_names = client.post('/expenses', json=draft(), headers=headers)
    assert default_names.status_code == 422
    assert ['body', 'claim_amount'] in [item['loc'] for item in default_names.json()['detail']]
    assert client.post('/claims', json=draft(), headers=headers).status_code == 404


def test_openapi_uses_variant_names(client_for):
    spec = json.dumps(alternate_client(client_for).get('/openapi.json').json())
    assert '/expenses' in spec
    assert 'claim_amount' in spec
    assert '"/claims' not in spec


def test_amount_must_be_positive_422(client):
    response = client.post('/claims', json=draft(amount='0'), headers=login(client, ASHA))
    assert response.status_code == 422


def test_hotel_requires_nights_422(client):
    response = client.post('/claims', json=draft(category='HOTEL'), headers=login(client, ASHA))
    assert response.status_code == 422
    assert response.json()['detail'][0]['loc'] == ['body', 'nights']


def test_other_employee_gets_404(client):
    claim = create_draft(client, login(client, ASHA))
    assert client.get(f'/claims/{claim["id"]}', headers=login(client, VIKRAM)).status_code == 404


def test_manager_and_finance_can_view(client):
    claim = create_draft(client, login(client, ASHA))
    assert client.get(f'/claims/{claim["id"]}', headers=login(client, RAHUL)).status_code == 200
    assert client.get(f'/claims/{claim["id"]}', headers=login(client, NEHA)).status_code == 200


def test_manager_cannot_edit_403(client):
    claim = create_draft(client, login(client, ASHA))
    response = client.patch(f'/claims/{claim["id"]}', json={'description': 'x'}, headers=login(client, RAHUL))
    assert response.status_code == 403


def test_patch_updates_draft(client):
    headers = login(client, ASHA)
    claim = create_draft(client, headers)
    response = client.patch(f'/claims/{claim["id"]}', json={'amount': '500.00'}, headers=headers)
    assert response.json()['amount'] == '500.00'
    assert response.json()['amount_inr'] == '500.00'


def test_patch_submitted_409(client):
    headers = login(client, ASHA)
    claim = create_draft(client, headers, amount='100.00')
    assert client.post(f'/claims/{claim["id"]}/submit', headers=headers).status_code == 200
    assert client.patch(f'/claims/{claim["id"]}', json={'description': 'x'}, headers=headers).status_code == 409


def test_delete_draft_204(client):
    headers = login(client, ASHA)
    claim = create_draft(client, headers)
    assert client.delete(f'/claims/{claim["id"]}', headers=headers).status_code == 204
    assert client.get(f'/claims/{claim["id"]}', headers=headers).status_code == 404


def test_invalid_claim_id_422(client):
    assert client.get('/claims/abc', headers=login(client, ASHA)).status_code == 422


def upload(client, headers, claim_id, content: bytes, content_type: str, name: str = 'receipt.pdf'):
    return client.post(f'/claims/{claim_id}/receipt', files={'file': (name, content, content_type)}, headers=headers)


def test_receipt_zero_bytes_422(client):
    headers = login(client, ASHA)
    claim = create_draft(client, headers)
    assert upload(client, headers, claim['id'], b'', 'application/pdf').status_code == 422


def test_receipt_exactly_5mb_ok(client):
    headers = login(client, ASHA)
    claim = create_draft(client, headers)
    response = upload(client, headers, claim['id'], b'x' * FIVE_MB, 'application/pdf')
    assert response.status_code == 200
    assert response.json()['receipt'] == {'filename': 'receipt.pdf', 'size': FIVE_MB, 'content_type': 'application/pdf'}


def test_receipt_over_5mb_413(client):
    headers = login(client, ASHA)
    claim = create_draft(client, headers)
    assert upload(client, headers, claim['id'], b'x' * (FIVE_MB + 1), 'application/pdf').status_code == 413


def test_receipt_gif_415(client):
    headers = login(client, ASHA)
    claim = create_draft(client, headers)
    assert upload(client, headers, claim['id'], b'GIF89a', 'image/gif', 'receipt.gif').status_code == 415


def test_projects_search(client):
    response = client.get('/projects', params={'q': 'atlas'}, headers=login(client, ASHA))
    assert response.status_code == 200
    assert [project['code'] for project in response.json()] == ['PRJ-ATLAS']


def test_projects_hide_inactive(client):
    codes = [project['code'] for project in client.get('/projects', headers=login(client, ASHA)).json()]
    assert 'PRJ-LEGACY' not in codes
