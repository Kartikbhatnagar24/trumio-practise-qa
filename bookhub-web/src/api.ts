import { mockApi } from './mock';
import { ApiError, type Book, type BookInput, type BookQuery, type LoginResult, type Order, type OrderInput, type Page } from './types';

export interface Api {
  login(email: string, password: string): Promise<LoginResult>;
  listBooks(query: BookQuery): Promise<Page<Book>>;
  listCategories(): Promise<string[]>;
  getBook(id: number): Promise<Book>;
  createBook(input: BookInput): Promise<Book>;
  createOrder(input: OrderInput): Promise<Order>;
  getOrder(id: number): Promise<Order>;
}

export const API_MODE = (window.__ENV__?.API_MODE || import.meta.env.VITE_API_MODE || 'mock') === 'api' ? 'api' : 'mock';

function errorMessage(body: unknown) {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map((d: { msg?: string }) => d.msg).join(', ');
  return undefined;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`api/${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, errorMessage(body) ?? `Request failed (${response.status})`);
  return body as T;
}

const post = <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) });

const httpApi: Api = {
  login: (email, password) => post('auth/login', { email, password }),
  listBooks(query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => value !== undefined && value !== '' && value !== false && params.set(key, String(value)));
    return request(`books?${params}`);
  },
  listCategories: () => request('books/categories'),
  getBook: (id) => request(`books/${id}`),
  createBook: (input) => post('books', input),
  createOrder: (input) => post('orders', input),
  getOrder: (id) => request(`orders/${id}`),
};

export const api: Api = API_MODE === 'api' ? httpApi : mockApi;
