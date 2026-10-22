import sqlite3
from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings
from app.core.context import AppContext
from app.models.users import User
from app.services import policy_service
from app.services.money import from_minor, to_inr_paise, to_minor
from app.services.policy_service import PolicyViolation
from app.static import messages
from app.static.enums import Category, ClaimStatus, Currency, Role

EDITABLE = {ClaimStatus.DRAFT.value, ClaimStatus.SENT_BACK.value}
RECEIPT_TYPES = {'application/pdf', 'image/jpeg', 'image/png'}
MAX_RECEIPT_BYTES = 5 * 1024 * 1024


def now() -> str:
    return datetime.now(UTC).isoformat(timespec='seconds')


def field_error(loc: list[str], message: str, error_type: str = 'value_error') -> HTTPException:
    return HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, [{'loc': loc, 'msg': message, 'type': error_type}])


def can_view(user: User, claim: sqlite3.Row, owner_manager_id: str | None) -> bool:
    return claim['employee_id'] == user.id or user.role == Role.FINANCE_ADMIN or (user.role == Role.MANAGER and owner_manager_id == user.id)


def get_visible(conn: sqlite3.Connection, user: User, claim_id: int) -> sqlite3.Row:
    claim = conn.execute('SELECT claims.*, users.manager_id AS owner_manager_id FROM claims JOIN users ON users.id = claims.employee_id WHERE claims.id = ?', (claim_id,)).fetchone()
    if claim is None or not can_view(user, claim, claim['owner_manager_id']):
        raise HTTPException(status.HTTP_404_NOT_FOUND, messages.CLAIM_NOT_FOUND)
    return claim


def get_editable(conn: sqlite3.Connection, user: User, claim_id: int) -> sqlite3.Row:
    claim = get_visible(conn, user, claim_id)
    if claim['employee_id'] != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, messages.FORBIDDEN)
    if claim['status'] not in EDITABLE:
        raise HTTPException(status.HTTP_409_CONFLICT, messages.CLAIM_NOT_EDITABLE)
    return claim


def check_details(conn: sqlite3.Connection, details: dict) -> None:
    if details['category'] == Category.HOTEL and not details.get('nights'):
        raise field_error(['body', 'nights'], messages.NIGHTS_REQUIRED, 'missing')
    if details.get('project_id') and conn.execute('SELECT 1 FROM projects WHERE id = ? AND active = 1', (details['project_id'],)).fetchone() is None:
        raise field_error(['body', 'project_id'], messages.PROJECT_NOT_FOUND)


def amounts(details: dict) -> dict:
    amount: Decimal = details['amount']
    return {'amount_minor': to_minor(amount), 'amount_inr_paise': to_inr_paise(amount, Currency(details['currency']))}


def create_claim(conn: sqlite3.Connection, user: User, details: dict) -> int:
    check_details(conn, details)
    row = {
        'employee_id': user.id,
        'category': details['category'].value,
        'currency': details['currency'].value,
        'merchant': details['merchant'],
        'expense_date': details['expense_date'].isoformat(),
        'description': details.get('description', ''),
        'project_id': details.get('project_id'),
        'nights': details.get('nights'),
        'status': ClaimStatus.DRAFT.value,
        'created_at': now(),
        **amounts(details),
    }
    columns = ', '.join(row)
    cursor = conn.execute(f'INSERT INTO claims ({columns}) VALUES ({", ".join(f":{column}" for column in row)})', row)
    return cursor.lastrowid


def update_claim(conn: sqlite3.Connection, user: User, claim_id: int, changes: dict) -> None:
    claim = get_editable(conn, user, claim_id)
    current = {
        'category': Category(claim['category']),
        'currency': Currency(claim['currency']),
        'amount': from_minor(claim['amount_minor']),
        'merchant': claim['merchant'],
        'expense_date': claim['expense_date'],
        'description': claim['description'],
        'project_id': claim['project_id'],
        'nights': claim['nights'],
    }
    merged = {**current, **{key: value for key, value in changes.items() if value is not None or key in ('project_id', 'nights')}}
    check_details(conn, merged)
    expense_date = merged['expense_date']
    row = {
        'category': merged['category'].value,
        'currency': merged['currency'].value,
        'merchant': merged['merchant'],
        'expense_date': expense_date if isinstance(expense_date, str) else expense_date.isoformat(),
        'description': merged['description'] or '',
        'project_id': merged['project_id'],
        'nights': merged['nights'],
        **amounts(merged),
    }
    assignments = ', '.join(f'{column} = :{column}' for column in row)
    conn.execute(f'UPDATE claims SET {assignments} WHERE id = :id', {**row, 'id': claim_id})


def delete_claim(conn: sqlite3.Connection, user: User, claim_id: int) -> None:
    claim = get_editable(conn, user, claim_id)
    if claim['status'] != ClaimStatus.DRAFT.value:
        raise HTTPException(status.HTTP_409_CONFLICT, messages.CLAIM_NOT_EDITABLE)
    conn.execute('DELETE FROM claims WHERE id = ?', (claim_id,))


async def attach_receipt(conn: sqlite3.Connection, user: User, claim_id: int, file: UploadFile) -> None:
    get_editable(conn, user, claim_id)
    if file.content_type not in RECEIPT_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, messages.RECEIPT_WRONG_TYPE)
    content = await file.read(MAX_RECEIPT_BYTES + 1)
    if not content:
        raise field_error(['body', 'file'], messages.RECEIPT_EMPTY)
    if len(content) > MAX_RECEIPT_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, messages.RECEIPT_TOO_LARGE)
    settings.receipts_dir.mkdir(parents=True, exist_ok=True)
    (settings.receipts_dir / str(claim_id)).write_bytes(content)
    conn.execute(
        'UPDATE claims SET receipt_filename = ?, receipt_size = ?, receipt_content_type = ? WHERE id = ?',
        (file.filename or 'receipt', len(content), file.content_type, claim_id),
    )


def record_event(conn: sqlite3.Connection, claim_id: int, actor: User, action: str, from_status: str | None, to_status: str, comment: str | None = None, amount_inr_paise: int | None = None) -> None:
    conn.execute(
        'INSERT INTO events (claim_id, actor_id, action, from_status, to_status, comment, amount_inr_paise, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        (claim_id, actor.id, action, from_status, to_status, comment, amount_inr_paise, now()),
    )


def violation_error(status_code: int, violations: list[PolicyViolation]) -> HTTPException:
    return HTTPException(status_code, [{'code': item.code.value, 'field': item.field, 'message': item.message} for item in violations])


def submit_claim(conn: sqlite3.Connection, ctx: AppContext, user: User, claim_id: int, today: date) -> None:
    claim = get_editable(conn, user, claim_id)
    violations = policy_service.check_claim(claim, user, ctx.variant.rules, ctx.bugs, today, ctx.models.names)
    if violations:
        raise violation_error(status.HTTP_422_UNPROCESSABLE_CONTENT, violations)
    duplicate = policy_service.find_duplicate(conn, claim, ctx.models.names)
    if duplicate:
        raise violation_error(status.HTTP_409_CONFLICT, [duplicate])
    conn.execute('UPDATE claims SET status = ?, submitted_at = ? WHERE id = ?', (ClaimStatus.SUBMITTED.value, now(), claim_id))
    record_event(conn, claim_id, user, 'submit', claim['status'], ClaimStatus.SUBMITTED.value)


def claim_out(conn: sqlite3.Connection, ctx: AppContext, claim_id: int) -> dict:
    claim = conn.execute(
        'SELECT claims.*, users.name AS employee_name, projects.code AS project_code, projects.name AS project_name '
        'FROM claims JOIN users ON users.id = claims.employee_id LEFT JOIN projects ON projects.id = claims.project_id WHERE claims.id = ?',
        (claim_id,),
    ).fetchone()
    events = conn.execute('SELECT events.*, users.name AS actor_name FROM events JOIN users ON users.id = events.actor_id WHERE claim_id = ? ORDER BY events.id', (claim_id,)).fetchall()
    receipt = None
    if claim['receipt_filename']:
        receipt = {'filename': claim['receipt_filename'], 'size': claim['receipt_size'], 'content_type': claim['receipt_content_type']}
    canonical = {
        'id': claim['id'],
        'status': claim['status'],
        'category': claim['category'],
        'currency': claim['currency'],
        'amount': from_minor(claim['amount_minor']),
        'merchant': claim['merchant'],
        'expense_date': claim['expense_date'],
        'description': claim['description'],
        'project': {'id': claim['project_id'], 'code': claim['project_code'], 'name': claim['project_name']} if claim['project_id'] else None,
        'nights': claim['nights'],
        'amount_inr': from_minor(claim['amount_inr_paise']),
        'approved_amount_inr': from_minor(claim['approved_amount_inr_paise']),
        'receipt': receipt,
        'employee': {'id': claim['employee_id'], 'name': claim['employee_name']},
        'created_at': claim['created_at'],
        'submitted_at': claim['submitted_at'],
        'events': [
            {
                'actor': {'id': event['actor_id'], 'name': event['actor_name']},
                'action': event['action'],
                'from_status': event['from_status'],
                'to_status': event['to_status'],
                'comment': event['comment'],
                'amount_inr': from_minor(event['amount_inr_paise']),
                'at': event['at'],
            }
            for event in events
        ],
    }
    return ctx.models.to_variant(canonical)
