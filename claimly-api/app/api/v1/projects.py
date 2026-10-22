from fastapi import APIRouter

from app.core.database import Db
from app.core.security import CurrentUser
from app.models.claims import Project

router = APIRouter(tags=['projects'])


@router.get('/projects', response_model=list[Project])
def search_projects(user: CurrentUser, conn: Db, q: str = '') -> list[dict]:
    pattern = f'%{q.strip().lower()}%'
    rows = conn.execute('SELECT id, code, name FROM projects WHERE active = 1 AND (lower(name) LIKE ? OR lower(code) LIKE ?) ORDER BY name LIMIT 20', (pattern, pattern)).fetchall()
    return [dict(row) for row in rows]
