import json
import sqlite3
from contextlib import contextmanager

from app import settings

SCHEMA = '''
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS books;
DROP TABLE IF EXISTS users;

CREATE TABLE books (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    rating REAL NOT NULL DEFAULT 0,
    published_on TEXT,
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    country TEXT NOT NULL,
    delivery_date TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    coupon TEXT,
    subtotal REAL NOT NULL,
    discount REAL NOT NULL,
    shipping REAL NOT NULL,
    total REAL NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE order_items (
    order_id INTEGER NOT NULL REFERENCES orders(id),
    book_id INTEGER NOT NULL REFERENCES books(id),
    title TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL
);
'''

BOOK_COLUMNS = ('title', 'author', 'isbn', 'category', 'price', 'stock', 'rating', 'published_on', 'description')


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


@contextmanager
def transaction():
    conn = connect()
    try:
        with conn:
            yield conn
    finally:
        conn.close()


def get_db():
    with transaction() as conn:
        yield conn


def reset() -> None:
    seed = json.loads(settings.SEED_PATH.read_text(encoding='utf-8'))
    with transaction() as conn:
        conn.executescript(SCHEMA)
        conn.executemany('INSERT INTO users (email, password, name, role) VALUES (:email, :password, :name, :role)', seed['users'])
        conn.executemany(
            f'INSERT INTO books ({", ".join(BOOK_COLUMNS)}) VALUES ({", ".join(":" + c for c in BOOK_COLUMNS)})',
            [{c: book.get(c) for c in BOOK_COLUMNS} for book in seed['books']],
        )
