import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Field, useToast } from '../components';
import { formatPrice } from '../pricing';
import { useAuth, useCart } from '../state';
import type { PaymentMethod } from '../types';
import { Summary } from './Cart';

const COUNTRIES = ['India', 'United States', 'United Kingdom', 'Germany', 'Australia'];
const STEPS = ['Shipping', 'Payment', 'Review'];
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const today = () => new Date().toISOString().slice(0, 10);

function expiryError(value: string) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return 'Use MM/YY';
  const now = new Date();
  const year = 2000 + Number(match[2]);
  return year < now.getFullYear() || (year === now.getFullYear() && Number(match[1]) < now.getMonth() + 1) ? 'Card has expired' : undefined;
}

export default function Checkout() {
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState([false, false, false]);
  const [placing, setPlacing] = useState(false);
  const [serverError, setServerError] = useState('');
  const [shipping, setShipping] = useState({ name: user?.name ?? '', email: user?.email ?? '', address: '', country: 'India', date: '' });
  const [payment, setPayment] = useState<{ method: PaymentMethod; cardName: string; cardNumber: string; expiry: string; cvv: string }>({
    method: 'card',
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });
  const [terms, setTerms] = useState(false);

  if (cart.lines.length === 0 && !placing) return <Navigate to="/cart" replace />;

  const shippingErrors = {
    name: shipping.name.trim().length >= 2 ? undefined : 'Enter your full name',
    email: EMAIL_PATTERN.test(shipping.email.trim()) ? undefined : 'Enter a valid email address',
    address: shipping.address.trim().length >= 5 ? undefined : 'Enter your full address',
    date: !shipping.date ? 'Choose a delivery date' : shipping.date < today() ? 'Delivery date cannot be in the past' : undefined,
  };
  const card = payment.method === 'card';
  const paymentErrors = {
    cardName: card && payment.cardName.trim().length < 2 ? 'Enter the name on the card' : undefined,
    cardNumber: card && !/^\d{16}$/.test(payment.cardNumber.replace(/\s/g, '')) ? 'Card number must be 16 digits' : undefined,
    expiry: card ? expiryError(payment.expiry) : undefined,
    cvv: card && !/^\d{3}$/.test(payment.cvv) ? 'CVV must be 3 digits' : undefined,
  };
  const reviewErrors = { terms: terms ? undefined : 'You must accept the terms to place the order' };
  const stepErrors = [shippingErrors, paymentErrors, reviewErrors][step];
  const show = (errors: Record<string, string | undefined>, key: string) => (attempted[step] ? errors[key] : undefined);

  async function next(event: FormEvent) {
    event.preventDefault();
    setAttempted((a) => a.map((v, i) => (i === step ? true : v)));
    if (Object.values(stepErrors).some(Boolean)) return;
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    setPlacing(true);
    setServerError('');
    try {
      const order = await api.createOrder({
        customer_name: shipping.name.trim(),
        email: shipping.email.trim(),
        address: shipping.address.trim(),
        country: shipping.country,
        delivery_date: shipping.date,
        payment_method: payment.method,
        coupon: cart.coupon,
        items: cart.lines.map((line) => ({ book_id: line.book.id, quantity: line.quantity })),
      });
      cart.clear();
      toast(`Order #${order.id} placed`);
      navigate(`/orders/${order.id}`, { replace: true });
    } catch (error) {
      setServerError((error as Error).message);
      setPlacing(false);
    }
  }

  return (
    <section>
      <h1>Checkout</h1>
      <ol className="steps" aria-label="Checkout steps">
        {STEPS.map((name, i) => (
          <li key={name} className={i === step ? 'current' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
            {i + 1}. {name}
          </li>
        ))}
      </ol>
      <div className="cart-layout">
        <form noValidate onSubmit={next} aria-label={`${STEPS[step]} form`} className="card">
          {serverError && (
            <div className="alert alert-error" role="alert">
              {serverError}
            </div>
          )}

          {step === 0 && (
            <fieldset>
              <legend>Shipping details</legend>
              <Field label="Full name" error={show(shippingErrors, 'name')}>
                {(props) => <input {...props} autoComplete="name" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} />}
              </Field>
              <Field label="Email" error={show(shippingErrors, 'email')}>
                {(props) => <input {...props} type="email" value={shipping.email} onChange={(e) => setShipping({ ...shipping, email: e.target.value })} />}
              </Field>
              <Field label="Address" error={show(shippingErrors, 'address')}>
                {(props) => <textarea {...props} rows={3} value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />}
              </Field>
              <div className="row">
                <Field label="Country">
                  {(props) => (
                    <select {...props} value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })}>
                      {COUNTRIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  )}
                </Field>
                <Field label="Delivery date" error={show(shippingErrors, 'date')}>
                  {(props) => <input {...props} type="date" min={today()} value={shipping.date} onChange={(e) => setShipping({ ...shipping, date: e.target.value })} />}
                </Field>
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend>Payment method</legend>
              <label className="check">
                <input type="radio" name="payment" value="card" checked={card} onChange={() => setPayment({ ...payment, method: 'card' })} /> Credit or debit card
              </label>
              <label className="check">
                <input type="radio" name="payment" value="cod" checked={!card} onChange={() => setPayment({ ...payment, method: 'cod' })} /> Cash on delivery
              </label>
              {card && (
                <div className="card-fields">
                  <Field label="Name on card" error={show(paymentErrors, 'cardName')}>
                    {(props) => <input {...props} autoComplete="cc-name" value={payment.cardName} onChange={(e) => setPayment({ ...payment, cardName: e.target.value })} />}
                  </Field>
                  <Field label="Card number" error={show(paymentErrors, 'cardNumber')} hint="Use any 16 digits, e.g. 4242 4242 4242 4242">
                    {(props) => <input {...props} inputMode="numeric" autoComplete="cc-number" value={payment.cardNumber} onChange={(e) => setPayment({ ...payment, cardNumber: e.target.value })} />}
                  </Field>
                  <div className="row">
                    <Field label="Expiry (MM/YY)" error={show(paymentErrors, 'expiry')}>
                      {(props) => <input {...props} autoComplete="cc-exp" placeholder="MM/YY" value={payment.expiry} onChange={(e) => setPayment({ ...payment, expiry: e.target.value })} />}
                    </Field>
                    <Field label="CVV" error={show(paymentErrors, 'cvv')}>
                      {(props) => <input {...props} inputMode="numeric" type="password" autoComplete="cc-csc" value={payment.cvv} onChange={(e) => setPayment({ ...payment, cvv: e.target.value })} />}
                    </Field>
                  </div>
                </div>
              )}
            </fieldset>
          )}

          {step === 2 && (
            <fieldset>
              <legend>Review your order</legend>
              <dl className="facts">
                <dt>Ship to</dt>
                <dd>
                  {shipping.name}, {shipping.address}, {shipping.country}
                </dd>
                <dt>Delivery</dt>
                <dd>{shipping.date}</dd>
                <dt>Payment</dt>
                <dd>{card ? `Card ending ${payment.cardNumber.replace(/\s/g, '').slice(-4)}` : 'Cash on delivery'}</dd>
              </dl>
              <ul className="review-items">
                {cart.lines.map((line) => (
                  <li key={line.book.id}>
                    {line.quantity} × {line.book.title} — {formatPrice(line.book.price * line.quantity)}
                  </li>
                ))}
              </ul>
              <label className="check">
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> I agree to the terms and conditions
              </label>
              {show(reviewErrors, 'terms') && <small className="error">{reviewErrors.terms}</small>}
            </fieldset>
          )}

          <div className="actions">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} disabled={placing}>
                Back
              </button>
            )}
            <button type="submit" className="primary" disabled={placing}>
              {step === 0 ? 'Continue to payment' : step === 1 ? 'Continue to review' : placing ? 'Placing order…' : 'Place order'}
            </button>
          </div>
        </form>
        <aside>
          <Summary />
        </aside>
      </div>
    </section>
  );
}
