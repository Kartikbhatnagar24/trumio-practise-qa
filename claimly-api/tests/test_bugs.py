import pytest

from app.static.bugs import Bug, parse_bugs
from tests.helpers import ASHA, NEHA, RAHUL, VIKRAM, create_draft, login


def submit(client, email=ASHA, receipt=False, **overrides):
    headers = login(client, email)
    claim = create_draft(client, headers, **overrides)
    if receipt:
        client.post(f'/claims/{claim["id"]}/receipt', files={'file': ('r.pdf', b'%PDF', 'application/pdf')}, headers=headers)
    return claim['id'], client.post(f'/claims/{claim["id"]}/submit', headers=headers)


def receipt_at_threshold(client):
    return submit(client, category='OFFICE_SUPPLIES', amount='2000.00')[1].status_code


def age_off_by_one(client):
    return submit(client, expense_date='2026-04-15')[1].status_code


def future_date_allowed(client):
    return submit(client, expense_date='2026-06-16')[1].status_code


def meal_cap_wrong_grade(client):
    return submit(client, RAHUL, category='MEALS', amount='1000.00')[1].status_code


def fx_truncates(client):
    return create_draft(client, login(client, ASHA), currency='USD', amount='12.50')['amount_inr']


def self_approval(client):
    claim_id, _ = submit(client, RAHUL, amount='300.00')
    return client.post(f'/claims/{claim_id}/approve', headers=login(client, RAHUL)).status_code


def partial_over_claimed(client):
    claim_id, _ = submit(client, receipt=True, category='OFFICE_SUPPLIES', amount='4500.00')
    return client.post(f'/claims/{claim_id}/approve', json={'approved_amount': '4500.01', 'comment': 'x'}, headers=login(client, RAHUL)).status_code


def pay_skips_finance(client):
    claim_id, _ = submit(client, receipt=True, category='AIRFARE', amount='18000.00')
    client.post(f'/claims/{claim_id}/approve', headers=login(client, RAHUL))
    return client.post(f'/claims/{claim_id}/pay', headers=login(client, NEHA)).status_code


def duplicate_allowed(client):
    submit(client, amount='300.00')
    return submit(client, amount='300.00')[1].status_code


def other_claim_visible(client):
    claim = create_draft(client, login(client, ASHA))
    return client.get(f'/claims/{claim["id"]}', headers=login(client, VIKRAM)).status_code


def total_ignores_filters(client):
    headers = login(client, ASHA)
    create_draft(client, headers, category='MEALS')
    create_draft(client, headers, category='AIRFARE', amount='5000.00')
    return client.get('/claims', params={'category': 'AIRFARE'}, headers=headers).json()['total']


def sort_direction_ignored(client):
    headers = login(client, ASHA)
    create_draft(client, headers, amount='100.00')
    create_draft(client, headers, amount='900.00')
    return [item['amount'] for item in client.get('/claims', params={'sort': '-amount'}, headers=headers).json()['items']]


def error_wrong_field(client):
    response = client.post('/claims', json={'category': 'MEALS', 'amount': '0', 'merchant': 'Cafe', 'expense_date': '2026-06-10'}, headers=login(client, ASHA))
    return response.json()['detail'][0]['loc']


def search_case_sensitive(client):
    headers = login(client, ASHA)
    create_draft(client, headers, merchant='Uber India')
    return client.get('/claims', params={'q': 'uber'}, headers=headers).json()['total']


def project_search_case_sensitive(client):
    return len(client.get('/projects', params={'q': 'atlas'}, headers=login(client, ASHA)).json())


def status_filter_first_only(client):
    headers = login(client, ASHA)
    create_draft(client, headers, amount='100.00')
    submit(client, amount='200.00')
    return client.get('/claims', params={'status': ['SUBMITTED', 'DRAFT']}, headers=headers).json()['total']


def date_to_exclusive(client):
    headers = login(client, ASHA)
    create_draft(client, headers, expense_date='2026-06-05')
    return client.get('/claims', params={'date_to': '2026-06-05'}, headers=headers).json()['total']


def page_overlap(client):
    headers = login(client, ASHA)
    for amount in ('100.00', '200.00', '300.00'):
        create_draft(client, headers, amount=amount)
    first = client.get('/claims', params={'page_size': 2, 'sort': 'amount'}, headers=headers).json()['items']
    second = client.get('/claims', params={'page_size': 2, 'page': 2, 'sort': 'amount'}, headers=headers).json()['items']
    return [item['amount'] for item in first + second]


CASES = [
    (Bug.RECEIPT_AT_THRESHOLD, receipt_at_threshold, 422, 200),
    (Bug.AGE_OFF_BY_ONE, age_off_by_one, 422, 200),
    (Bug.FUTURE_DATE_ALLOWED, future_date_allowed, 422, 200),
    (Bug.MEAL_CAP_WRONG_GRADE, meal_cap_wrong_grade, 200, 422),
    (Bug.FX_TRUNCATES, fx_truncates, '1040.63', '1040.62'),
    (Bug.SELF_APPROVAL, self_approval, 403, 200),
    (Bug.PARTIAL_OVER_CLAIMED, partial_over_claimed, 422, 200),
    (Bug.PAY_SKIPS_FINANCE, pay_skips_finance, 409, 200),
    (Bug.DUPLICATE_ALLOWED, duplicate_allowed, 409, 200),
    (Bug.OTHER_CLAIM_VISIBLE, other_claim_visible, 404, 200),
    (Bug.TOTAL_IGNORES_FILTERS, total_ignores_filters, 1, 2),
    (Bug.SORT_DIRECTION_IGNORED, sort_direction_ignored, ['900.00', '100.00'], ['100.00', '900.00']),
    (Bug.ERROR_WRONG_FIELD, error_wrong_field, ['body', 'amount'], ['body', 'merchant']),
    (Bug.SEARCH_CASE_SENSITIVE, search_case_sensitive, 1, 0),
    (Bug.PROJECT_SEARCH_CASE_SENSITIVE, project_search_case_sensitive, 1, 0),
    (Bug.STATUS_FILTER_FIRST_ONLY, status_filter_first_only, 2, 1),
    (Bug.DATE_TO_EXCLUSIVE, date_to_exclusive, 1, 0),
    (Bug.PAGE_OVERLAP, page_overlap, ['100.00', '200.00', '300.00'], ['100.00', '200.00', '200.00', '300.00']),
]


@pytest.mark.parametrize(('bug', 'probe', 'clean', 'buggy'), CASES, ids=[case[0].name for case in CASES])
def test_bug_changes_behaviour(client_for, bug, probe, clean, buggy):
    assert probe(client_for()) == clean
    assert probe(client_for(bugs={bug})) == buggy


def test_every_bug_has_a_case():
    assert {case[0] for case in CASES} == set(Bug)


def test_codes_are_opaque_and_unique():
    codes = [bug.value for bug in Bug]
    assert len(codes) == len(set(codes)) == 18
    assert all(len(code) == 4 and code.isalnum() for code in codes)


def test_parse_by_code():
    assert parse_bugs('q7m2, e8s5') == {Bug.RECEIPT_AT_THRESHOLD, Bug.OTHER_CLAIM_VISIBLE}
