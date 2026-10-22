from fastapi import FastAPI

from app.api.v1 import system
from app.core import database
from app.core.config import settings
from app.core.variant import DEFAULT_VARIANT, Variant, load_variant
from app.static.bugs import Bug, parse_bugs


def create_app(variant: Variant | None = None, bugs: frozenset[Bug] = frozenset()) -> FastAPI:
    variant = variant or DEFAULT_VARIANT
    database.reset(database.load_seed())
    app = FastAPI(title='Claimly API', version='1.0.0', description='Expense claims for employees, managers and finance. Data resets on every start and on `POST /reset`.')
    app.include_router(system.router)
    return app


def create_app_from_settings() -> FastAPI:
    return create_app(load_variant(settings.claimly_variant), parse_bugs(settings.claimly_bugs))
