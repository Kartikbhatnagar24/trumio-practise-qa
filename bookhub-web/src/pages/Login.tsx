import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Field, useToast } from '../components';
import { useAuth } from '../state';

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/books';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const errors = {
    email: !email.trim() ? 'Email is required' : !EMAIL_PATTERN.test(email.trim()) ? 'Enter a valid email address' : undefined,
    password: !password ? 'Password is required' : undefined,
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setServerError('');
    if (errors.email || errors.password) return;
    setSubmitting(true);
    try {
      const user = await login(email, password, remember);
      toast(`Welcome back, ${user.name}`);
      navigate(from, { replace: true });
    } catch (error) {
      setServerError((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card narrow">
      <h1>Sign in</h1>
      <form noValidate onSubmit={onSubmit} aria-label="Sign in form">
        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}
        <Field label="Email" error={submitted ? errors.email : undefined}>
          {(props) => <input {...props} type="email" name="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />}
        </Field>
        <Field label="Password" error={submitted ? errors.password : undefined}>
          {(props) => (
            <input {...props} type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          )}
        </Field>
        <div className="row">
          <label className="check">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} /> Show password
          </label>
          <label className="check">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
          </label>
        </div>
        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <details className="demo-users">
        <summary>Demo accounts</summary>
        <p>
          Customer: <code>customer@bookhub.test</code> / <code>Customer@123</code>
        </p>
        <p>
          Admin: <code>admin@bookhub.test</code> / <code>Admin@123</code>
        </p>
      </details>
    </section>
  );
}
