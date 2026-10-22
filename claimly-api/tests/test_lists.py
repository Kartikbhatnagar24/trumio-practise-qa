from tests.helpers import ASHA, KAVITA, NEHA, RAHUL, VIKRAM, create_draft, login


def seed_claims(client):
    asha = login(client, ASHA)
    ids = [
        create_draft(client, asha, category='MEALS', amount='300.00', expense_date='2026-06-01')['id'],
        create_draft(client, asha, category='MEALS', amount='700.00', expense_date='2026-06-05')['id'],
        create_draft(client, asha, category='LOCAL_TRANSPORT', amount='150.00', expense_date='2026-06-08')['id'],
        create_draft(client, asha, category='OFFICE_SUPPLIES', amount='1200.00', expense_date='2026-06-12')['id'],
    ]
    for claim_id in ids[:3]:
        assert client.post(f'/claims/{claim_id}/submit', headers=asha).status_code == 200
    vikram = login(client, VIKRAM)
    other = create_draft(client, vikram, category='MEALS', amount='400.00', expense_date='2026-06-03')['id']
    client.post(f'/claims/{other}/submit', headers=vikram)
    return ids


def test_own_claims_only(client):
    seed_claims(client)
    body = client.get('/claims', headers=login(client, ASHA)).json()
    assert body['total'] == 4
    assert {item['employee']['id'] for item in body['items']} == {'u-asha'}


def test_filter_status_and_dates_total(client):
    seed_claims(client)
    params = {'status': ['SUBMITTED'], 'date_from': '2026-06-02', 'date_to': '2026-06-08'}
    body = client.get('/claims', params=params, headers=login(client, ASHA)).json()
    assert body['total'] == 2
    assert [item['expense_date'] for item in body['items']] == ['2026-06-08', '2026-06-05']


def test_filter_category(client):
    seed_claims(client)
    body = client.get('/claims', params={'category': 'MEALS'}, headers=login(client, ASHA)).json()
    assert body['total'] == 2


def test_multiple_statuses(client):
    seed_claims(client)
    body = client.get('/claims', params={'status': ['SUBMITTED', 'DRAFT']}, headers=login(client, ASHA)).json()
    assert body['total'] == 4


def test_sort_amount_desc(client):
    seed_claims(client)
    body = client.get('/claims', params={'sort': '-amount'}, headers=login(client, ASHA)).json()
    assert [item['amount'] for item in body['items']] == ['1200.00', '700.00', '300.00', '150.00']


def test_sort_amount_asc(client):
    seed_claims(client)
    body = client.get('/claims', params={'sort': 'amount'}, headers=login(client, ASHA)).json()
    assert [item['amount'] for item in body['items']] == ['150.00', '300.00', '700.00', '1200.00']


def test_paging(client):
    seed_claims(client)
    body = client.get('/claims', params={'page': 2, 'page_size': 3}, headers=login(client, ASHA)).json()
    assert body['total'] == 4
    assert body['page'] == 2
    assert len(body['items']) == 1


def test_page_size_bounds_422(client):
    headers = login(client, ASHA)
    assert client.get('/claims', params={'page_size': 0}, headers=headers).status_code == 422
    assert client.get('/claims', params={'page_size': 101}, headers=headers).status_code == 422
    assert client.get('/claims', params={'page': 0}, headers=headers).status_code == 422


def test_bad_sort_422(client):
    assert client.get('/claims', params={'sort': 'name'}, headers=login(client, ASHA)).status_code == 422


def test_manager_queue_only_reports(client):
    seed_claims(client)
    body = client.get('/approvals', headers=login(client, RAHUL)).json()
    assert body['total'] == 4
    assert {item['status'] for item in body['items']} == {'SUBMITTED'}
    assert client.get('/approvals', headers=login(client, KAVITA)).json()['total'] == 0


def test_finance_queue_states(client):
    ids = seed_claims(client)
    client.post(f'/claims/{ids[0]}/approve', headers=login(client, RAHUL))
    body = client.get('/approvals', headers=login(client, NEHA)).json()
    assert [item['id'] for item in body['items']] == [ids[0]]


def test_employee_has_no_queue(client):
    assert client.get('/approvals', headers=login(client, ASHA)).status_code == 403


def test_search_is_case_insensitive(client):
    headers = login(client, ASHA)
    create_draft(client, headers, merchant='Uber India', amount='210.00')
    create_draft(client, headers, merchant='Chaayos', amount='90.00')
    assert [item['merchant'] for item in client.get('/claims', params={'q': 'uber'}, headers=headers).json()['items']] == ['Uber India']
    assert client.get('/claims', params={'q': 'UBER'}, headers=headers).json()['total'] == 1


def test_search_matches_description_and_claim_number(client):
    headers = login(client, ASHA)
    claim = create_draft(client, headers, description='Airport drop for the Harbor kickoff')
    assert client.get('/claims', params={'q': 'harbor'}, headers=headers).json()['total'] == 1
    assert client.get('/claims', params={'q': f'CLM-{claim["id"]}'}, headers=headers).json()['total'] == 1


def test_date_to_includes_its_day(client):
    seed_claims(client)
    body = client.get('/claims', params={'date_to': '2026-06-05'}, headers=login(client, ASHA)).json()
    assert body['total'] == 2


def test_pages_do_not_overlap(client):
    seed_claims(client)
    headers = login(client, ASHA)
    first = [item['id'] for item in client.get('/claims', params={'page_size': 2}, headers=headers).json()['items']]
    second = [item['id'] for item in client.get('/claims', params={'page_size': 2, 'page': 2}, headers=headers).json()['items']]
    assert not set(first) & set(second)
    assert len(first + second) == 4


def test_finance_lists_all_claims(client):
    seed_claims(client)
    assert client.get('/claims', headers=login(client, NEHA)).json()['total'] == 5
