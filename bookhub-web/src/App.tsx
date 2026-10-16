import type { ReactNode } from 'react';
import { HashRouter, Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { API_MODE } from './api';
import { ToastProvider } from './components';
import BookDetail from './pages/BookDetail';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import OrderConfirmation from './pages/OrderConfirmation';
import { AuthProvider, CartProvider, useAuth, useCart } from './state';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

function Header() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  return (
    <header className="header">
      <Link to="/books" className="logo">
        📚 Bookhub
      </Link>
      <nav aria-label="Main">
        <NavLink to="/books">Books</NavLink>
        <NavLink to="/cart">
          Cart{' '}
          <span className="count" data-testid="cart-count" aria-label={`${count} items in cart`}>
            {count}
          </span>
        </NavLink>
      </nav>
      <div className="user">
        {user ? (
          <>
            <span data-testid="user-name">Hi, {user.name}</span>
            <button type="button" className="link" onClick={logout}>
              Log out
            </button>
          </>
        ) : (
          <NavLink to="/login">Log in</NavLink>
        )}
      </div>
    </header>
  );
}

const NotFound = () => (
  <section className="empty">
    <h1>Page not found</h1>
    <Link to="/books">Go to books</Link>
  </section>
);

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Navigate to="/books" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/books" element={<Catalog />} />
                <Route path="/books/:id" element={<BookDetail />} />
                <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
                <Route path="/checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                <Route path="/orders/:id" element={<RequireAuth><OrderConfirmation /></RequireAuth>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <footer className="footer" data-testid="api-mode">
              Practice app · data: {API_MODE === 'api' ? 'Bookhub API' : 'built-in demo data'}
            </footer>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}
