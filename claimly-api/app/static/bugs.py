from enum import Enum


class Bug(str, Enum):
    RECEIPT_AT_THRESHOLD = 'q7m2'
    AGE_OFF_BY_ONE = 't4k9'
    FUTURE_DATE_ALLOWED = 'b8x1'
    MEAL_CAP_WRONG_GRADE = 'n2v6'
    FX_TRUNCATES = 'h5r3'
    SELF_APPROVAL = 'w9c4'
    PARTIAL_OVER_CLAIMED = 'd3p8'
    PAY_SKIPS_FINANCE = 'k6f2'
    DUPLICATE_ALLOWED = 'z1j7'
    OTHER_CLAIM_VISIBLE = 'e8s5'
    TOTAL_IGNORES_FILTERS = 'y2g9'
    SORT_DIRECTION_IGNORED = 'c5u3'
    ERROR_WRONG_FIELD = 'r4a6'
    SEARCH_CASE_SENSITIVE = 'g3n8'
    PROJECT_SEARCH_CASE_SENSITIVE = 'u6p1'
    STATUS_FILTER_FIRST_ONLY = 'x4d9'
    DATE_TO_EXCLUSIVE = 'l5v7'
    PAGE_OVERLAP = 'o2w5'


UI_BUG_CODES = frozenset({'f6l2', 'm3t8', 'v7b4', 'a9q5', 's2h7', 'p8n3', 'j4w6'})


def parse_bugs(raw: str | None) -> frozenset[Bug]:
    codes = [code.strip() for code in (raw or '').split(',') if code.strip()]
    known = {bug.value: bug for bug in Bug}
    unknown = [code for code in codes if code not in known and code not in UI_BUG_CODES]
    if unknown:
        raise ValueError(f'CLAIMLY_BUGS has unknown codes: {", ".join(unknown)}')
    return frozenset(known[code] for code in codes if code in known)
