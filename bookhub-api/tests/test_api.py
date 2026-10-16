from datetime import date, timedelta

from fastapi.testclient import TestClient

from app.main import app

ORDER = {
    'customer_name': 'Test User',
    'email': 'test@example.com',
    'address': '12 Test Street, Pune',
    'country': 'India',
    'delivery_date': (date.today() + timedelta(days=3)).isoformat(),
    'payment_method': 'cod',
}


def test_api_flow():
    with TestClient(app) as client:
        assert client.post('/reset').status_code == 200
        assert client.get('/health').json() == {'status': 'ok'}

        page = client.get('/books', params={'category': 'Technology', 'sort': '-price'}).json()
        assert [b['price'] for b in page['items']] == [45.0, 39.99, 34.0]
        assert client.get('/books', params={'in_stock': True}).json()['total'] == 13
        assert client.get('/books/999').status_code == 404

        new = {'title': 'T', 'author': 'A', 'isbn': '1234567890', 'category': 'Fiction', 'price': 5, 'stock': 1}
        assert client.post('/books', json=new).status_code == 201
        assert client.post('/books', json=new).status_code == 409
        assert client.post('/books', json={**new, 'isbn': '1234567891', 'price': -1}).status_code == 422

        assert client.post('/auth/login', json={'email': 'customer@bookhub.test', 'password': 'nope'}).status_code == 401
        assert client.post('/auth/login', json={'email': 'Customer@Bookhub.test', 'password': 'Customer@123'}).json()['user']['role'] == 'customer'

        order = client.post('/orders', json={**ORDER, 'coupon': 'save10', 'items': [{'book_id': 8, 'quantity': 2}]})
        assert order.status_code == 201
        assert {k: order.json()[k] for k in ('subtotal', 'discount', 'shipping', 'total')} == {'subtotal': 79.98, 'discount': 8.0, 'shipping': 0.0, 'total': 71.98}
        assert client.get('/books/8').json()['stock'] == 13
        assert client.get(f'/orders/{order.json()["id"]}').json()['items'][0]['quantity'] == 2

        small = client.post('/orders', json={**ORDER, 'items': [{'book_id': 11, 'quantity': 1}]}).json()
        assert small['shipping'] == 4.99 and small['total'] == 12.49
        assert client.post('/orders', json={**ORDER, 'items': [{'book_id': 2, 'quantity': 3}]}).status_code == 409
        assert client.post('/orders', json={**ORDER, 'coupon': 'BOGUS', 'items': [{'book_id': 1, 'quantity': 1}]}).status_code == 422
        assert client.post('/orders', json={**ORDER, 'delivery_date': '2000-01-01', 'items': [{'book_id': 1, 'quantity': 1}]}).status_code == 422
        assert client.delete('/books/8').status_code == 409

        client.post('/reset')
        assert client.get('/books/8').json()['stock'] == 15
