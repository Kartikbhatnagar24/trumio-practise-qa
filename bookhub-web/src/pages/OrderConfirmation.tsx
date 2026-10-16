import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { Spinner } from '../components';
import { formatPrice } from '../pricing';
import type { Order } from '../types';

export default function OrderConfirmation() {
  const id = Number(useParams().id);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrder(id).then(setOrder, (e: Error) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <section className="empty">
        <h1>Order not found</h1>
        <p>{error}</p>
        <Link to="/books">Back to books</Link>
      </section>
    );
  if (!order) return <Spinner label="Loading order" />;

  return (
    <section className="card">
      <h1>Thank you for your order!</h1>
      <p className="alert alert-success" role="status">
        Order <strong data-testid="order-id">#{order.id}</strong> is confirmed and will arrive on <strong>{order.delivery_date}</strong>.
      </p>
      <table className="cart-table">
        <thead>
          <tr>
            <th scope="col">Book</th>
            <th scope="col">Quantity</th>
            <th scope="col">Price</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.book_id}>
              <td>{item.title}</td>
              <td>{item.quantity}</td>
              <td>{formatPrice(item.unit_price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="facts">
        <dt>Subtotal</dt>
        <dd>{formatPrice(order.subtotal)}</dd>
        <dt>Discount</dt>
        <dd>{order.discount ? `−${formatPrice(order.discount)}` : '—'}</dd>
        <dt>Shipping</dt>
        <dd>{order.shipping ? formatPrice(order.shipping) : 'Free'}</dd>
        <dt>Total paid</dt>
        <dd data-testid="order-total">{formatPrice(order.total)}</dd>
        <dt>Payment</dt>
        <dd>{order.payment_method === 'card' ? 'Card' : 'Cash on delivery'}</dd>
      </dl>
      <Link to="/books" className="button primary">
        Continue shopping
      </Link>
    </section>
  );
}
