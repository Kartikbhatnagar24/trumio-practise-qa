import sqlite3
from dataclasses import dataclass
from datetime import date

from app.core.variant import Rules
from app.models.users import User
from app.static import messages
from app.static.bugs import Bug
from app.static.enums import Category, ClaimStatus, PolicyCode


@dataclass(frozen=True)
class PolicyViolation:
    code: PolicyCode
    field: str
    message: str


def check_claim(claim: sqlite3.Row, employee: User, rules: Rules, bugs: frozenset[Bug], today: date, names: dict[str, str]) -> list[PolicyViolation]:
    violations = []
    amount_inr = claim['amount_inr_paise']
    expense_date = date.fromisoformat(claim['expense_date'])
    if claim['category'] == Category.HOTEL.value and amount_inr > rules.hotel_nightly_limit * 100 * claim['nights']:
        violations.append(PolicyViolation(PolicyCode.HOTEL_OVER_LIMIT, names['amount'], messages.HOTEL_OVER_LIMIT.format(limit=rules.hotel_nightly_limit)))
    meal_cap = rules.meal_cap_by_grade[employee.grade]
    if claim['category'] == Category.MEALS.value and amount_inr > meal_cap * 100:
        violations.append(PolicyViolation(PolicyCode.MEAL_OVER_CAP, names['amount'], messages.MEAL_OVER_CAP.format(limit=meal_cap, grade=employee.grade.value)))
    if expense_date > today:
        violations.append(PolicyViolation(PolicyCode.FUTURE_DATE, names['expense_date'], messages.FUTURE_DATE))
    elif (today - expense_date).days > rules.max_claim_age_days:
        violations.append(PolicyViolation(PolicyCode.TOO_OLD, names['expense_date'], messages.TOO_OLD.format(days=rules.max_claim_age_days)))
    if amount_inr >= rules.receipt_required_from * 100 and not claim['receipt_filename']:
        violations.append(PolicyViolation(PolicyCode.RECEIPT_REQUIRED, 'receipt', messages.RECEIPT_REQUIRED.format(limit=rules.receipt_required_from)))
    return violations


def find_duplicate(conn: sqlite3.Connection, claim: sqlite3.Row, names: dict[str, str]) -> PolicyViolation | None:
    duplicate = conn.execute(
        'SELECT 1 FROM claims WHERE employee_id = ? AND id != ? AND lower(merchant) = lower(?) AND expense_date = ? AND amount_inr_paise = ? AND status NOT IN (?, ?)',
        (claim['employee_id'], claim['id'], claim['merchant'], claim['expense_date'], claim['amount_inr_paise'], ClaimStatus.DRAFT.value, ClaimStatus.REJECTED.value),
    ).fetchone()
    return PolicyViolation(PolicyCode.DUPLICATE, names['merchant'], messages.DUPLICATE) if duplicate else None
