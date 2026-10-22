import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager

from app.core.config import settings

SCHEMA = ''


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


@contextmanager
def transaction() -> Iterator[sqlite3.Connection]:
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_db() -> Iterator[sqlite3.Connection]:
    with transaction() as conn:
        yield conn


def load_seed() -> dict:
    return json.loads(settings.seed_path.read_text(encoding='utf-8'))


def reset(seed: dict) -> None:
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    with transaction() as conn:
        conn.executescript(SCHEMA)
        for table, rows in seed.items():
            for row in rows:
                columns = ', '.join(row)
                values = ', '.join(f':{column}' for column in row)
                conn.execute(f'INSERT INTO {table} ({columns}) VALUES ({values})', row)
