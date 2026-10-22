from fastapi import FastAPI

from app.api.v1 import approvals, auth, claims, policy, projects, system
from app.core import database
from app.core.config import settings
from app.core.context import build_context
from app.core.variant import DEFAULT_VARIANT, Variant, load_variant
from app.static.bugs import Bug, parse_bugs


def create_app(variant: Variant | None = None, bugs: frozenset[Bug] = frozenset()) -> FastAPI:
    ctx = build_context(variant or DEFAULT_VARIANT, bugs)
    database.reset(database.load_seed())
    app = FastAPI(title='Claimly API', version='1.0.0', description='Expense claims for employees, managers and finance. Data resets on every start and on `POST /reset`.')
    app.include_router(system.router)
    app.include_router(auth.router)
    app.include_router(projects.router)
    app.include_router(claims.build_router(ctx))
    app.include_router(approvals.build_router(ctx))
    app.include_router(approvals.build_queue_router(ctx))
    app.include_router(policy.build_router(ctx))
    return app


def create_app_from_settings() -> FastAPI:
    return create_app(load_variant(settings.claimly_variant), parse_bugs(settings.claimly_bugs))
