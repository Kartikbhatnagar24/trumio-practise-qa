import json

import pytest

from app.core.config import ROOT, settings
from tests.helpers import ASHA, NEHA, RAHUL, login

STATUSES = {'DRAFT', 'SUBMITTED', 'SENT_BACK', 'MANAGER_APPROVED', 'FINANCE_APPROVED', 'PAID', 'REJECTED'}


@pytest.fixture
def seed():
    return json.loads((ROOT / 'seed' / 'default.json').read_text(encoding='utf-8'))


@pytest.fixture
def demo(client_for, monkeypatch):
    monkeypatch.setattr(settings, 'seed_path', ROOT / 'seed' / 'default.json')
    return client_for()


def test_seed_counts(seed):
    assert len(seed['users']) == 48
    assert len(seed['projects']) == 14
    assert len(seed['claims']) >= 200
    assert {claim['status'] for claim in seed['claims']} == STATUSES


def test_seed_roles(seed):
    roles = [user['role'] for user in seed['users']]
    assert (roles.count('EMPLOYEE'), roles.count('MANAGER'), roles.count('FINANCE_ADMIN')) == (40, 6, 2)


def test_seed_keeps_test_users(seed):
    minimal = json.loads((ROOT / 'tests' / 'seed_minimal.json').read_text(encoding='utf-8'))
    users = {user['id']: user for user in seed['users']}
    for user in minimal['users']:
        assert users[user['id']] == user


def test_seed_claims_reference_valid_users_projects(seed):
    users = {user['id'] for user in seed['users']}
    projects = {project['id'] for project in seed['projects']}
    claims = {claim['id'] for claim in seed['claims']}
    assert all(claim['employee_id'] in users for claim in seed['claims'])
    assert all(claim['project_id'] in projects for claim in seed['claims'] if claim['project_id'])
    assert all(event['claim_id'] in claims and event['actor_id'] in users for event in seed['events'])


def test_every_submitted_claim_has_history(seed):
    with_events = {event['claim_id'] for event in seed['events']}
    assert all(claim['id'] in with_events for claim in seed['claims'] if claim['status'] != 'DRAFT')


def test_mix_of_currencies_and_receipts(seed):
    claims = seed['claims']
    foreign = sum(claim['currency'] != 'INR' for claim in claims) / len(claims)
    receipts = sum(bool(claim['receipt_filename']) for claim in claims) / len(claims)
    assert 0.08 <= foreign <= 0.25
    assert 0.3 <= receipts <= 0.9


def test_status_matches_last_event(seed):
    last = {}
    for event in seed['events']:
        last[event['claim_id']] = event['to_status']
    assert all(last.get(claim['id'], 'DRAFT') == claim['status'] for claim in seed['claims'])


def test_large_claims_have_receipts(seed):
    large = [claim for claim in seed['claims'] if claim['amount_inr_paise'] >= 200000]
    assert all(claim['receipt_filename'] for claim in large)


def test_seed_logins_work(demo):
    for email in (ASHA, RAHUL, NEHA):
        assert demo.get('/me', headers=login(demo, email)).status_code == 200


def test_reset_moves_seed_dates_to_today(demo, seed):
    from datetime import date, timedelta

    from app.core.database import connect

    newest_seeded = max(date.fromisoformat(claim['expense_date']) for claim in seed['claims'])
    shift = date.today() - date.fromisoformat(seed['anchor_date'])
    conn = connect()
    newest = conn.execute('SELECT MAX(expense_date) FROM claims').fetchone()[0]
    first_event = conn.execute('SELECT at FROM events ORDER BY id LIMIT 1').fetchone()[0]
    conn.close()
    assert date.fromisoformat(newest) == newest_seeded + shift
    assert date.fromisoformat(first_event[:10]) == date.fromisoformat(seed['events'][0]['at'][:10]) + shift
    assert shift >= timedelta(0)


def test_demo_lists_have_data(demo):
    assert demo.get('/claims', headers=login(demo, ASHA)).json()['total'] > 0
    assert demo.get('/approvals', headers=login(demo, RAHUL)).json()['total'] > 0
    assert demo.get('/approvals', headers=login(demo, NEHA)).json()['total'] > 0
