import pytest
from fastapi import HTTPException

from app.core.database import transaction
from app.services.approval_service import transition
from tests.helpers import ASHA, KAVITA, NEHA, RAHUL, VIKRAM, create_draft, login


def submitted(client, email=ASHA, receipt=True, **overrides):
    headers = login(client, email)
    claim = create_draft(client, headers, **overrides)
    if receipt:
        client.post(f'/claims/{claim["id"]}/receipt', files={'file': ('r.pdf', b'%PDF', 'application/pdf')}, headers=headers)
    response = client.post(f'/claims/{claim["id"]}/submit', headers=headers)
    assert response.status_code == 200, response.text
    return claim['id']


def act(client, email, claim_id, action, **body):
    return client.post(f'/claims/{claim_id}/{action}', json=body or None, headers=login(client, email))


def test_manager_approves_under_limit_then_finance_pays(client):
    claim_id = submitted(client, category='OFFICE_SUPPLIES', amount='4500.00')
    approved = act(client, RAHUL, claim_id, 'approve')
    assert approved.status_code == 200
    assert approved.json()['status'] == 'MANAGER_APPROVED'
    assert approved.json()['approved_amount_inr'] == '4500.00'
    paid = act(client, NEHA, claim_id, 'pay')
    assert paid.json()['status'] == 'PAID'


def test_over_limit_needs_finance_before_pay(client):
    claim_id = submitted(client, category='AIRFARE', amount='18000.00')
    act(client, RAHUL, claim_id, 'approve')
    assert act(client, NEHA, claim_id, 'pay').status_code == 409
    assert act(client, NEHA, claim_id, 'approve').json()['status'] == 'FINANCE_APPROVED'
    assert act(client, NEHA, claim_id, 'pay').json()['status'] == 'PAID'


def test_limit_boundary_needs_no_finance(client):
    claim_id = submitted(client, category='AIRFARE', amount='10000.00')
    act(client, RAHUL, claim_id, 'approve')
    assert act(client, NEHA, claim_id, 'approve').status_code == 409
    assert act(client, NEHA, claim_id, 'pay').status_code == 200


def test_partial_needs_comment(client):
    claim_id = submitted(client, category='OFFICE_SUPPLIES', amount='4500.00')
    assert act(client, RAHUL, claim_id, 'approve', approved_amount='4000.00').status_code == 422
    response = act(client, RAHUL, claim_id, 'approve', approved_amount='4000.00', comment='Only the monitor is covered')
    assert response.json()['approved_amount_inr'] == '4000.00'


def test_finance_keeps_manager_partial_without_comment(client):
    claim_id = submitted(client, category='AIRFARE', amount='18000.00')
    act(client, RAHUL, claim_id, 'approve', approved_amount='16000.00', comment='Seat upgrade not covered')
    response = act(client, NEHA, claim_id, 'approve')
    assert response.status_code == 200, response.text
    assert response.json()['approved_amount_inr'] == '16000.00'


def test_partial_over_claimed_422(client):
    claim_id = submitted(client, category='OFFICE_SUPPLIES', amount='4500.00')
    assert act(client, RAHUL, claim_id, 'approve', approved_amount='4500.01', comment='typo').status_code == 422


def test_self_approval_403(client):
    claim_id = submitted(client, RAHUL, receipt=False, amount='300.00')
    assert act(client, RAHUL, claim_id, 'approve').status_code == 403
    assert act(client, KAVITA, claim_id, 'approve').status_code == 200


def test_other_manager_404(client):
    claim_id = submitted(client, receipt=False, amount='300.00')
    assert act(client, KAVITA, claim_id, 'approve').status_code == 404


def test_employee_cannot_approve_403(client):
    claim_id = submitted(client, receipt=False, amount='300.00')
    assert act(client, ASHA, claim_id, 'approve').status_code == 403


def test_send_back_resubmit_flow(client):
    claim_id = submitted(client, receipt=False, amount='300.00')
    assert act(client, RAHUL, claim_id, 'send-back').status_code == 422
    assert act(client, RAHUL, claim_id, 'send-back', comment='Add the project').json()['status'] == 'SENT_BACK'
    headers = login(client, ASHA)
    assert client.patch(f'/claims/{claim_id}', json={'project_id': 'p-atlas'}, headers=headers).status_code == 200
    assert client.post(f'/claims/{claim_id}/submit', headers=headers).json()['status'] == 'SUBMITTED'


def test_reject_is_final(client):
    claim_id = submitted(client, receipt=False, amount='300.00')
    assert act(client, RAHUL, claim_id, 'reject', comment='Personal expense').json()['status'] == 'REJECTED'
    assert act(client, RAHUL, claim_id, 'approve').status_code == 409
    assert client.post(f'/claims/{claim_id}/submit', headers=login(client, ASHA)).status_code == 409


def test_wrong_state_409(client):
    claim_id = submitted(client, receipt=False, amount='300.00')
    assert act(client, NEHA, claim_id, 'pay').status_code == 409
    assert act(client, NEHA, claim_id, 'approve').status_code == 409


def test_finance_can_send_back(client):
    claim_id = submitted(client, receipt=False, amount='300.00')
    act(client, RAHUL, claim_id, 'approve')
    assert act(client, NEHA, claim_id, 'send-back', comment='Wrong currency').json()['status'] == 'SENT_BACK'


def test_concurrent_approve_second_gets_409(client):
    claim_id = submitted(client, receipt=False, amount='300.00')
    with transaction() as conn:
        transition(conn, claim_id, 'SUBMITTED', 'MANAGER_APPROVED', {'approved_amount_inr_paise': 30000})
    with transaction() as conn, pytest.raises(HTTPException) as error:
        transition(conn, claim_id, 'SUBMITTED', 'MANAGER_APPROVED', {'approved_amount_inr_paise': 30000})
    assert error.value.status_code == 409


def test_events_recorded(client):
    claim_id = submitted(client, receipt=False, amount='300.00')
    act(client, RAHUL, claim_id, 'approve', approved_amount='250.00', comment='Tip not covered')
    events = client.get(f'/claims/{claim_id}', headers=login(client, ASHA)).json()['events']
    assert [(event['action'], event['to_status']) for event in events] == [('submit', 'SUBMITTED'), ('approve', 'MANAGER_APPROVED')]
    assert events[1]['actor']['name'] == 'Rahul Mehta'
    assert events[1]['comment'] == 'Tip not covered'
    assert events[1]['amount_inr'] == '250.00'


def test_rejected_claim_is_not_a_duplicate(client):
    first = submitted(client, receipt=False, amount='300.00')
    act(client, RAHUL, first, 'reject', comment='Wrong project')
    submitted(client, receipt=False, amount='300.00')


def test_vikram_is_not_asha_manager(client):
    claim_id = submitted(client, receipt=False, amount='300.00')
    assert act(client, VIKRAM, claim_id, 'approve').status_code == 404
