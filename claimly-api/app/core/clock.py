from datetime import UTC, date, datetime
from typing import Annotated
from zoneinfo import ZoneInfo

from fastapi import Depends

COMPANY_TZ = ZoneInfo('Asia/Kolkata')


def local_today(now: datetime | None = None) -> date:
    return (now or datetime.now(UTC)).astimezone(COMPANY_TZ).date()


def now_iso() -> str:
    return datetime.now(COMPANY_TZ).isoformat(timespec='seconds')


def get_today() -> date:
    return local_today()


Today = Annotated[date, Depends(get_today)]
