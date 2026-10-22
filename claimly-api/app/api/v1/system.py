from fastapi import APIRouter

from app.core import database

router = APIRouter(tags=['system'])


@router.get('/health')
def health() -> dict:
    return {'status': 'ok'}


@router.post('/reset')
def reset() -> dict:
    database.reset(database.load_seed())
    return {'status': 'ok'}
