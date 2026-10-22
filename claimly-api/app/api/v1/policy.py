from decimal import Decimal

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.context import AppContext
from app.core.security import CurrentUser
from app.core.variant import Rules
from app.services.money import CENT, RATES_TO_INR
from app.static.enums import Currency


class Policy(BaseModel):
    rules: Rules
    currency_rates: dict[Currency, Decimal]


def build_router(ctx: AppContext) -> APIRouter:
    router = APIRouter(tags=['policy'])

    @router.get('/policy', response_model=Policy)
    def get_policy(user: CurrentUser) -> Policy:
        return Policy(rules=ctx.variant.rules, currency_rates={currency: rate.quantize(CENT) for currency, rate in RATES_TO_INR.items()})

    return router
