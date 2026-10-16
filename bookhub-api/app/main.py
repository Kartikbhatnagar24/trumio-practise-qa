import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Literal

from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.responses import HTMLResponse, RedirectResponse

from app import db
from app.models import Book, BookIn, BookPage, LoginIn, LoginOut, Order, OrderIn, User
from app.pricing import COUPONS, compute_totals

SORTS = {
    'title': 'title COLLATE NOCASE ASC',
    '-title': 'title COLLATE NOCASE DESC',
    'price': 'price ASC',
    '-price': 'price DESC',
    'rating': 'rating ASC',
    '-rating': 'rating DESC',
}


@asynccontextmanager
async def lifespan(_: FastAPI):
    db.reset()
    yield


app = FastAPI(
    title='Bookhub API',
    version='0.1.0',
    description='Practice API for QA learners. Data resets on every start and on `POST /reset`.',
    docs_url=None,
    redoc_url=None,
    servers=[{'url': '.'}],
    lifespan=lifespan,
)


@app.get('/', include_in_schema=False)
def root():
    return RedirectResponse('docs')


@app.get('/docs', include_in_schema=False)
def docs() -> HTMLResponse:
    return get_swagger_ui_html(openapi_url='openapi.json', title='Bookhub API docs')


@app.get('/health', tags=['system'])
def health():
    return {'status': 'ok'}


@app.post('/reset', tags=['system'])
def reset():
    db.reset()
    return {'status': 'ok'}


@app.post('/auth/login', response_model=LoginOut, tags=['auth'], responses={401: {'description': 'Wrong email or password'}})
def login(body: LoginIn, conn: sqlite3.Connection = Depends(db.get_db)):
    row = conn.execute('SELECT * FROM users WHERE email = ? AND password = ?', (body.email, body.password)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, 'Wrong email or password')
    return LoginOut(token=f'demo-token-{row["id"]}', user=User(**{k: row[k] for k in ('id', 'email', 'name', 'role')}))


@app.get('/books', response_model=BookPage, tags=['books'])
def list_books(
    q: str | None = Query(None, description='Search in title and author'),
    category: str | None = None,
    in_stock: bool = False,
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    sort: Literal['title', '-title', 'price', '-price', 'rating', '-rating'] = 'title',
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    conn: sqlite3.Connection = Depends(db.get_db),
):
    where, params = [], []
    if q:
        where.append('(title LIKE ? OR author LIKE ?)')
        params += [f'%{q}%', f'%{q}%']
    if category:
        where.append('category = ?')
        params.append(category)
    if in_stock:
        where.append('stock > 0')
    if min_price is not None:
        where.append('price >= ?')
        params.append(min_price)
    if max_price is not None:
        where.append('price <= ?')
        params.append(max_price)
    clause = f'WHERE {" AND ".join(where)}' if where else ''
    total = conn.execute(f'SELECT COUNT(*) FROM books {clause}', params).fetchone()[0]
    rows = conn.execute(f'SELECT * FROM books {clause} ORDER BY {SORTS[sort]}, id LIMIT ? OFFSET ?', [*params, page_size, (page - 1) * page_size]).fetchall()
    return BookPage(items=[Book(**dict(r)) for r in rows], total=total, page=page, page_size=page_size)


@app.get('/books/categories', response_model=list[str], tags=['books'])
def list_categories(conn: sqlite3.Connection = Depends(db.get_db)):
    return [r[0] for r in conn.execute('SELECT DISTINCT category FROM books ORDER BY category')]


def _get_book(conn: sqlite3.Connection, book_id: int) -> Book:
    row = conn.execute('SELECT * FROM books WHERE id = ?', (book_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f'Book {book_id} not found')
    return Book(**dict(row))


@app.get('/books/{book_id}', response_model=Book, tags=['books'], responses={404: {'description': 'Book not found'}})
def get_book(book_id: int, conn: sqlite3.Connection = Depends(db.get_db)):
    return _get_book(conn, book_id)


@app.post('/books', response_model=Book, status_code=status.HTTP_201_CREATED, tags=['books'], responses={409: {'description': 'ISBN already exists'}})
def create_book(body: BookIn, conn: sqlite3.Connection = Depends(db.get_db)):
    values = body.model_dump(mode='json')
    try:
        cur = conn.execute(f'INSERT INTO books ({", ".join(db.BOOK_COLUMNS)}) VALUES ({", ".join(":" + c for c in db.BOOK_COLUMNS)})', values)
    except sqlite3.IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, 'A book with this ISBN already exists')
    return Book(id=cur.lastrowid, **values)


@app.put('/books/{book_id}', response_model=Book, tags=['books'], responses={404: {'description': 'Book not found'}, 409: {'description': 'ISBN already exists'}})
def update_book(book_id: int, body: BookIn, conn: sqlite3.Connection = Depends(db.get_db)):
    _get_book(conn, book_id)
    values = body.model_dump(mode='json')
    try:
        conn.execute(f'UPDATE books SET {", ".join(f"{c} = :{c}" for c in db.BOOK_COLUMNS)} WHERE id = :id', {**values, 'id': book_id})
    except sqlite3.IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, 'A book with this ISBN already exists')
    return Book(id=book_id, **values)


@app.delete('/books/{book_id}', status_code=status.HTTP_204_NO_CONTENT, tags=['books'], responses={404: {'description': 'Book not found'}, 409: {'description': 'Book has orders'}})
def delete_book(book_id: int, conn: sqlite3.Connection = Depends(db.get_db)):
    _get_book(conn, book_id)
    try:
        conn.execute('DELETE FROM books WHERE id = ?', (book_id,))
    except sqlite3.IntegrityError:
        raise HTTPException(status.HTTP_409_CONFLICT, 'This book is part of an order and cannot be deleted')
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.post(
    '/orders',
    response_model=Order,
    status_code=status.HTTP_201_CREATED,
    tags=['orders'],
    responses={404: {'description': 'Book not found'}, 409: {'description': 'Not enough stock'}, 422: {'description': 'Invalid input or coupon'}},
)
def create_order(body: OrderIn, conn: sqlite3.Connection = Depends(db.get_db)):
    if body.coupon and body.coupon not in COUPONS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, 'Invalid coupon code')
    quantities: dict[int, int] = {}
    for item in body.items:
        quantities[item.book_id] = quantities.get(item.book_id, 0) + item.quantity
    books = {book_id: _get_book(conn, book_id) for book_id in quantities}
    for book_id, quantity in quantities.items():
        if books[book_id].stock < quantity:
            raise HTTPException(status.HTTP_409_CONFLICT, f'Only {books[book_id].stock} left of "{books[book_id].title}"')

    totals = compute_totals([(books[b].price, q) for b, q in quantities.items()], body.coupon)
    created_at = datetime.now(timezone.utc).isoformat(timespec='seconds')
    order = {**body.model_dump(mode='json', exclude={'items'}), **totals, 'created_at': created_at}
    cur = conn.execute(f'INSERT INTO orders ({", ".join(order)}) VALUES ({", ".join(":" + k for k in order)})', order)
    items = [{'book_id': b, 'title': books[b].title, 'quantity': q, 'unit_price': books[b].price} for b, q in quantities.items()]
    conn.executemany(f'INSERT INTO order_items (order_id, book_id, title, quantity, unit_price) VALUES ({cur.lastrowid}, :book_id, :title, :quantity, :unit_price)', items)
    conn.executemany('UPDATE books SET stock = stock - :quantity WHERE id = :book_id', items)
    return Order(id=cur.lastrowid, items=items, **order)


@app.get('/orders/{order_id}', response_model=Order, tags=['orders'], responses={404: {'description': 'Order not found'}})
def get_order(order_id: int, conn: sqlite3.Connection = Depends(db.get_db)):
    row = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f'Order {order_id} not found')
    items = conn.execute('SELECT book_id, title, quantity, unit_price FROM order_items WHERE order_id = ?', (order_id,)).fetchall()
    return Order(**dict(row), items=[dict(i) for i in items])
