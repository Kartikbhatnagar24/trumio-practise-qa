from enum import Enum


class Bug(str, Enum):
    pass


UI_BUG_CODES = frozenset({'f6l2', 'm3t8', 'v7b4', 'a9q5', 's2h7', 'p8n3', 'j4w6'})


def parse_bugs(raw: str | None) -> frozenset[Bug]:
    codes = [code.strip() for code in (raw or '').split(',') if code.strip()]
    known = {bug.value: bug for bug in Bug}
    unknown = [code for code in codes if code not in known and code not in UI_BUG_CODES]
    if unknown:
        raise ValueError(f'CLAIMLY_BUGS has unknown codes: {", ".join(unknown)}')
    return frozenset(known[code] for code in codes if code in known)
