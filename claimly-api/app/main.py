from fastapi import FastAPI

from app.api.v1 import system
from app.core import database


def create_app(variant=None, bugs: frozenset = frozenset()) -> FastAPI:
    database.reset(database.load_seed())
    app = FastAPI(title='Claimly API', version='1.0.0', description='Expense claims for employees, managers and finance. Data resets on every start and on `POST /reset`.')
    app.include_router(system.router)
    return app


def create_app_from_settings() -> FastAPI:
    return create_app()
