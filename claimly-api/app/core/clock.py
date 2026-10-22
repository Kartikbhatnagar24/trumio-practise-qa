from datetime import date
from typing import Annotated

from fastapi import Depends


def get_today() -> date:
    return date.today()


Today = Annotated[date, Depends(get_today)]
