import json

from app.core.variant import load_variant
from tests.helpers import ASHA, FULL_ALTERNATE, RAHUL, VIKRAM, create_draft, login


def with_receipt(client, headers, claim_id):
    response = client.post(f'/claims/{claim_id}/receipt', files={'file': ('r.pdf', b'%PDF', 'application/pdf')}, headers=headers)
    assert response.status_code == 200, response.text


def submit(client, email, receipt=False, **overrides):
    headers = login(client, email)
    claim = create_draft(client, headers, **overrides)
    if receipt:
        with_receipt(client, headers, claim['id'])
    return client.post(f'/claims/{claim["id"]}/submit', headers=headers)


def codes(response):
    return [item['code'] for item in response.json()['detail']]


def test_receipt_at_threshold_required(client):
    response = submit(client, ASHA, category='OFFICE_SUPPLIES', amount='2000.00')
    assert response.status_code == 422
    assert codes(response) == ['RECEIPT_REQUIRED']
    assert response.json()['detail'][0]['field'] == 'receipt'


def test_receipt_just_below_ok(client):
    assert submit(client, ASHA, category='OFFICE_SUPPLIES', amount='1999.99').status_code == 200


def test_receipt_threshold_uses_inr(client):
    response = submit(client, ASHA, category='OFFICE_SUPPLIES', currency='USD', amount='24.03')
    assert codes(response) == ['RECEIPT_REQUIRED']


def test_age_exactly_limit_ok(client):
    assert submit(client, ASHA, expense_date='2026-04-16').status_code == 200


def test_age_one_over_rejected(client):
    response = submit(client, ASHA, expense_date='2026-04-15')
    assert codes(response) == ['TOO_OLD']


def test_today_ok(client):
    assert submit(client, ASHA, expense_date='2026-06-15').status_code == 200


def test_tomorrow_is_future(client):
    assert codes(submit(client, ASHA, expense_date='2026-06-16')) == ['FUTURE_DATE']


def test_hotel_per_night_at_limit_ok(client):
    assert submit(client, ASHA, receipt=True, category='HOTEL', nights=3, amount='15000.00').status_code == 200


def test_hotel_per_night_over_limit(client):
    assert codes(submit(client, ASHA, receipt=True, category='HOTEL', nights=3, amount='15000.01')) == ['HOTEL_OVER_LIMIT']


def test_meal_cap_g3_at_cap_ok(client):
    assert submit(client, RAHUL, category='MEALS', amount='1800.00').status_code == 200


def test_meal_cap_g1_over(client):
    assert codes(submit(client, VIKRAM, category='MEALS', amount='801.00')) == ['MEAL_OVER_CAP']


def test_duplicate_409(client):
    assert submit(client, ASHA).status_code == 200
    response = submit(client, ASHA)
    assert response.status_code == 409
    assert codes(response) == ['DUPLICATE']


def test_violation_field_uses_variant_name(client_for):
    client = client_for(load_variant(json.dumps(FULL_ALTERNATE)))
    headers = login(client, ASHA)
    body = {'category': 'MEALS', 'claim_amount': '100.00', 'vendor': 'Cafe', 'spent_on': '2026-06-20'}
    claim = client.post('/expenses', json=body, headers=headers).json()
    response = client.post(f'/expenses/{claim["id"]}/submit', headers=headers)
    assert response.json()['detail'][0] == {'code': 'FUTURE_DATE', 'field': 'spent_on', 'message': 'Claims cannot be for a future date.'}


def test_policy_endpoint_returns_variant_rules(client_for):
    client = client_for(load_variant(json.dumps(FULL_ALTERNATE)))
    body = client.get('/policy', headers=login(client, ASHA)).json()
    assert body['rules'] == FULL_ALTERNATE['rules']
    assert body['currency_rates'] == {'INR': '1.00', 'USD': '83.25', 'EUR': '90.10', 'GBP': '105.40'}


def test_policy_needs_login(client):
    assert client.get('/policy').status_code == 401
