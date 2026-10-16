import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, QuantityStepper, useToast } from '../components';
import { COUPONS, FREE_SHIPPING_FROM, computeTotals, formatPrice } from '../pricing';
import { useCart, type CartLine } from '../state';

export function Summary() {
  const cart = useCart();
  const totals = computeTotals(
    cart.lines.map((line) => ({ price: line.book.price, quantity: line.quantity })),
    cart.coupon,
  );
  const missing = FREE_SHIPPING_FROM - (totals.subtotal - totals.discount);
  return (
    <div className="summary" aria-label="Order summary">
      <dl>
        <dt>Subtotal</dt>
        <dd data-testid="subtotal">{formatPrice(totals.subtotal)}</dd>
        {totals.discount > 0 && (
          <>
            <dt>Discount ({cart.coupon})</dt>
            <dd data-testid="discount">−{formatPrice(totals.discount)}</dd>
          </>
        )}
        <dt>Shipping</dt>
        <dd data-testid="shipping">{totals.shipping ? formatPrice(totals.shipping) : 'Free'}</dd>
        <dt className="total">Total</dt>
        <dd className="total" data-testid="total">
          {formatPrice(totals.total)}
        </dd>
      </dl>
      {missing > 0 && <p className="hint">Add {formatPrice(missing)} more for free shipping.</p>}
    </div>
  );
}

export default function Cart() {
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [removing, setRemoving] = useState<CartLine | null>(null);
  const [code, setCode] = useState('');
  const [couponError, setCouponError] = useState('');

  function applyCoupon(event: FormEvent) {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (!(value in COUPONS)) {
      setCouponError('This coupon code is not valid');
      return;
    }
    setCouponError('');
    setCode('');
    cart.setCoupon(value);
    toast(`Coupon ${value} applied`);
  }

  if (cart.lines.length === 0)
    return (
      <section className="empty">
        <h1>Your cart is empty</h1>
        <Link to="/books">Browse books</Link>
      </section>
    );

  return (
    <section>
      <div className="page-header">
        <h1>Cart</h1>
        <button
          type="button"
          className="danger-link"
          onClick={() => {
            if (window.confirm('Remove all items from your cart?')) {
              cart.clear();
              toast('Cart cleared');
            }
          }}
        >
          Clear cart
        </button>
      </div>
      <div className="cart-layout">
        <table className="cart-table">
          <thead>
            <tr>
              <th scope="col">Book</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Total</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {cart.lines.map((line) => (
              <tr key={line.book.id} data-testid="cart-row">
                <td>
                  <Link to={`/books/${line.book.id}`}>{line.book.title}</Link>
                </td>
                <td>{formatPrice(line.book.price)}</td>
                <td>
                  <QuantityStepper value={line.quantity} max={line.book.stock} onChange={(q) => cart.setQuantity(line.book.id, q)} />
                </td>
                <td>{formatPrice(line.book.price * line.quantity)}</td>
                <td>
                  <button type="button" className="danger-link" aria-label={`Remove ${line.book.title}`} onClick={() => setRemoving(line)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <aside>
          {cart.coupon ? (
            <p className="coupon-applied">
              Coupon <strong>{cart.coupon}</strong> applied.{' '}
              <button type="button" className="link" onClick={() => cart.setCoupon(null)}>
                Remove coupon
              </button>
            </p>
          ) : (
            <form className="coupon" onSubmit={applyCoupon} aria-label="Coupon">
              <label htmlFor="coupon-code">Coupon code</label>
              <div className="row">
                <input id="coupon-code" value={code} onChange={(e) => setCode(e.target.value)} aria-invalid={Boolean(couponError)} aria-describedby="coupon-error" />
                <button type="submit" disabled={!code.trim()}>
                  Apply
                </button>
              </div>
              {couponError && (
                <small id="coupon-error" className="error">
                  {couponError}
                </small>
              )}
            </form>
          )}
          <Summary />
          <button type="button" className="primary block" onClick={() => navigate('/checkout')}>
            Proceed to checkout
          </button>
        </aside>
      </div>

      {removing && (
        <Modal title="Remove item" onClose={() => setRemoving(null)}>
          <p>
            Remove <strong>{removing.book.title}</strong> from your cart?
          </p>
          <div className="actions">
            <button type="button" onClick={() => setRemoving(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                cart.remove(removing.book.id);
                toast(`Removed "${removing.book.title}"`);
                setRemoving(null);
              }}
            >
              Remove
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
