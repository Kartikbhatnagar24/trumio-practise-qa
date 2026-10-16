import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { Book, User } from './types';

const SESSION_KEY = 'bookhub.session';
const CART_KEY = 'bookhub.cart';

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    return JSON.parse(storage.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

type AuthState = {
  user: User | null;
  login(email: string, password: string, remember: boolean): Promise<User>;
  logout(): void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readJson<User>(sessionStorage, SESSION_KEY) ?? readJson<User>(localStorage, SESSION_KEY));

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const result = await api.login(email, password);
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return <AuthContext.Provider value={useMemo(() => ({ user, login, logout }), [user, login, logout])}>{children}</AuthContext.Provider>;
}

export type CartLine = { book: Book; quantity: number };

type CartState = {
  lines: CartLine[];
  count: number;
  coupon: string | null;
  add(book: Book, quantity: number): void;
  setQuantity(bookId: number, quantity: number): void;
  remove(bookId: number): void;
  clear(): void;
  setCoupon(coupon: string | null): void;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readJson<CartLine[]>(localStorage, CART_KEY) ?? []);
  const [coupon, setCoupon] = useState<string | null>(null);

  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(lines)), [lines]);

  const value = useMemo<CartState>(
    () => ({
      lines,
      coupon,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      add: (book, quantity) =>
        setLines((current) => {
          const existing = current.find((line) => line.book.id === book.id);
          const next = Math.min(book.stock, (existing?.quantity ?? 0) + quantity);
          return existing ? current.map((line) => (line.book.id === book.id ? { book, quantity: next } : line)) : [...current, { book, quantity: next }];
        }),
      setQuantity: (bookId, quantity) =>
        setLines((current) => current.map((line) => (line.book.id === bookId ? { ...line, quantity: Math.max(1, Math.min(line.book.stock, quantity)) } : line))),
      remove: (bookId) => setLines((current) => current.filter((line) => line.book.id !== bookId)),
      clear: () => {
        setLines([]);
        setCoupon(null);
      },
      setCoupon,
    }),
    [lines, coupon],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useRequired<T>(context: React.Context<T | null>, name: string) {
  const value = useContext(context);
  if (!value) throw new Error(`${name} must be used inside its provider`);
  return value;
}

export const useAuth = () => useRequired(AuthContext, 'useAuth');
export const useCart = () => useRequired(CartContext, 'useCart');
