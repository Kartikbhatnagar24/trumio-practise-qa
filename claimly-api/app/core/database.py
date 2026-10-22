import json
import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager
from datetime import date, datetime, timedelta
from typing import Annotated

from fastapi import Depends

from app.core.clock import local_today
from app.core.config import settings

SCHEMA = """
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS claims;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    grade TEXT NOT NULL,
    department TEXT NOT NULL,
    manager_id TEXT REFERENCES users(id),
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL
);

CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    active INTEGER NOT NULL
);

CREATE TABLE claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL REFERENCES users(id),
    category TEXT NOT NULL,
    currency TEXT NOT NULL,
    amount_minor INTEGER NOT NULL,
    amount_inr_paise INTEGER NOT NULL,
    merchant TEXT NOT NULL,
    expense_date TEXT NOT NULL,
    description TEXT NOT NULL,
    project_id TEXT REFERENCES projects(id),
    nights INTEGER,
    status TEXT NOT NULL,
    approved_amount_inr_paise INTEGER,
    receipt_filename TEXT,
    receipt_size INTEGER,
    receipt_content_type TEXT,
    created_at TEXT NOT NULL,
    submitted_at TEXT
);

CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    claim_id INTEGER NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    comment TEXT,
    amount_inr_paise INTEGER,
    at TEXT NOT NULL
);
"""


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


Db = Annotated[sqlite3.Connection, Depends(get_db, scope='function')]


def load_seed() -> dict:
    return json.loads(settings.seed_path.read_text(encoding='utf-8'))


DATE_COLUMNS = {'claims': ('expense_date', 'created_at', 'submitted_at'), 'events': ('at',)}


def shift(value: str | None, days: timedelta) -> str | None:
    if value is None:
        return None
    if len(value) == 10:
        return (date.fromisoformat(value) + days).isoformat()
    return (datetime.fromisoformat(value) + days).isoformat()


def move_to_today(seed: dict) -> dict:
    days = local_today() - date.fromisoformat(seed['anchor_date'])
    moved = {table: rows for table, rows in seed.items() if table != 'anchor_date'}
    for table, columns in DATE_COLUMNS.items():
        moved[table] = [{**row, **{column: shift(row[column], days) for column in columns}} for row in seed.get(table, [])]
    return moved


def reset(seed: dict) -> None:
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    if 'anchor_date' in seed:
        seed = move_to_today(seed)
    with transaction() as conn:
        conn.executescript(SCHEMA)
        for table, rows in seed.items():
            for row in rows:
                columns = ', '.join(row)
                values = ', '.join(f':{column}' for column in row)
                conn.execute(f'INSERT INTO {table} ({columns}) VALUES ({values})', row)
