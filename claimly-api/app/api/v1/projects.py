from fastapi import APIRouter

from app.core.context import AppContext
from app.core.database import Db
from app.core.security import CurrentUser
from app.models.claims import Project
from app.static.bugs import Bug


def build_router(ctx: AppContext) -> APIRouter:
    router = APIRouter(tags=['projects'])
    case_sensitive = Bug.PROJECT_SEARCH_CASE_SENSITIVE in ctx.bugs

    @router.get('/projects', response_model=list[Project])
    def search_projects(user: CurrentUser, conn: Db, q: str = '') -> list[dict]:
        term = q.strip()
        if case_sensitive:
            match, params = '(instr(name, ?) > 0 OR instr(code, ?) > 0)', (term, term)
        else:
            match, params = '(lower(name) LIKE ? OR lower(code) LIKE ?)', (f'%{term.lower()}%', f'%{term.lower()}%')
        rows = conn.execute(f'SELECT id, code, name FROM projects WHERE active = 1 AND {match} ORDER BY name LIMIT 20', params).fetchall()
        return [dict(row) for row in rows]

    return router
