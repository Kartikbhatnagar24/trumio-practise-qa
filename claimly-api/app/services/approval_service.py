import sqlite3

from fastapi import HTTPException, status

from app.core.context import AppContext
from app.models.approvals import ApproveIn
from app.models.users import User
from app.services.claims_service import field_error, get_visible, record_event
from app.services.money import to_minor
from app.static import messages
from app.static.bugs import Bug
from app.static.enums import ClaimStatus, Role

MANAGER_STEP = ClaimStatus.SUBMITTED.value
FINANCE_STEP = ClaimStatus.MANAGER_APPROVED.value


def conflict(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, detail)


def wrong_state(action: str, claim_status: str) -> HTTPException:
    return conflict(messages.WRONG_STATE.format(action=action, status=claim_status.lower().replace('_', ' ')))


def transition(conn: sqlite3.Connection, claim_id: int, from_status: str, to_status: str, changes: dict | None = None) -> None:
    changes = {'status': to_status, **(changes or {})}
    assignments = ', '.join(f'{column} = :{column}' for column in changes)
    cursor = conn.execute(f'UPDATE claims SET {assignments} WHERE id = :claim_id AND status = :from_status', {**changes, 'claim_id': claim_id, 'from_status': from_status})
    if cursor.rowcount != 1:
        raise conflict(messages.STALE_CLAIM)


def reviewable(conn: sqlite3.Connection, user: User, claim_id: int, action: str, allow_self: bool = False) -> sqlite3.Row:
    claim = get_visible(conn, user, claim_id)
    if user.role not in (Role.MANAGER, Role.FINANCE_ADMIN):
        raise HTTPException(status.HTTP_403_FORBIDDEN, messages.FORBIDDEN)
    if claim['employee_id'] == user.id and not allow_self:
        raise HTTPException(status.HTTP_403_FORBIDDEN, messages.SELF_ACTION)
    expected = MANAGER_STEP if user.role == Role.MANAGER else FINANCE_STEP
    if claim['status'] != expected:
        raise wrong_state(action, claim['status'])
    return claim


def approve(conn: sqlite3.Connection, ctx: AppContext, user: User, claim_id: int, body: ApproveIn) -> None:
    claim = reviewable(conn, user, claim_id, 'approve', allow_self=Bug.SELF_APPROVAL in ctx.bugs)
    limit = ctx.variant.rules.manager_approval_limit
    if user.role == Role.FINANCE_ADMIN and claim['approved_amount_inr_paise'] <= limit * 100:
        raise conflict(messages.FINANCE_NOT_NEEDED.format(limit=limit))
    ceiling = claim['amount_inr_paise'] if user.role == Role.MANAGER else claim['approved_amount_inr_paise']
    approved = ceiling if body.approved_amount is None else to_minor(body.approved_amount)
    if approved > claim['amount_inr_paise'] and Bug.PARTIAL_OVER_CLAIMED not in ctx.bugs:
        raise field_error(['body', 'approved_amount'], messages.APPROVED_OVER_CLAIMED)
    if approved < ceiling and not body.comment:
        raise field_error(['body', 'comment'], messages.PARTIAL_NEEDS_COMMENT, 'missing')
    to_status = ClaimStatus.MANAGER_APPROVED.value if user.role == Role.MANAGER else ClaimStatus.FINANCE_APPROVED.value
    transition(conn, claim_id, claim['status'], to_status, {'approved_amount_inr_paise': approved})
    record_event(conn, claim_id, user, 'approve', claim['status'], to_status, body.comment, approved)


def send_back(conn: sqlite3.Connection, user: User, claim_id: int, comment: str) -> None:
    claim = reviewable(conn, user, claim_id, 'send back')
    transition(conn, claim_id, claim['status'], ClaimStatus.SENT_BACK.value, {'approved_amount_inr_paise': None})
    record_event(conn, claim_id, user, 'send_back', claim['status'], ClaimStatus.SENT_BACK.value, comment)


def reject(conn: sqlite3.Connection, user: User, claim_id: int, comment: str) -> None:
    claim = reviewable(conn, user, claim_id, 'reject')
    transition(conn, claim_id, claim['status'], ClaimStatus.REJECTED.value, {'approved_amount_inr_paise': None})
    record_event(conn, claim_id, user, 'reject', claim['status'], ClaimStatus.REJECTED.value, comment)


def pay(conn: sqlite3.Connection, ctx: AppContext, user: User, claim_id: int) -> None:
    claim = get_visible(conn, user, claim_id)
    if user.role != Role.FINANCE_ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, messages.FORBIDDEN)
    limit = ctx.variant.rules.manager_approval_limit
    over_limit = claim['status'] == ClaimStatus.MANAGER_APPROVED.value and claim['approved_amount_inr_paise'] > limit * 100
    if over_limit and Bug.PAY_SKIPS_FINANCE not in ctx.bugs:
        raise conflict(messages.FINANCE_APPROVAL_NEEDED.format(limit=limit))
    if claim['status'] not in (ClaimStatus.MANAGER_APPROVED.value, ClaimStatus.FINANCE_APPROVED.value):
        raise wrong_state('pay', claim['status'])
    transition(conn, claim_id, claim['status'], ClaimStatus.PAID.value)
    record_event(conn, claim_id, user, 'pay', claim['status'], ClaimStatus.PAID.value, amount_inr_paise=claim['approved_amount_inr_paise'])
