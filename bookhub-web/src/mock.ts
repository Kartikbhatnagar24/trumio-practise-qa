import type { Api } from './api';
import { COUPONS, computeTotals } from './pricing';
import seed from './seed.json';
import { ApiError, type Book, type Order, type User } from './types';

let books: Book[] = seed.books.map((book, index) => ({ id: index + 1, ...book }));
const users = seed.users.map((user, index) => ({ id: index + 1, ...user, role: user.role as User['role'] }));
const orders: Order[] = [];

const wait = <T>(value: T) => new Promise<T>((resolve) => setTimeout(() => resolve(value), 250 + Math.random() * 350));
const fail = (status: number, message: string) => wait(null).then(() => Promise.reject(new ApiError(status, message)));

function findBook(id: number) {
  const book = books.find((b) => b.id === id);
  if (!book) throw new ApiError(404, `Book ${id} not found`);
  return book;
}

export const mockApi: Api = {
  login(email, password) {
    const user = users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
    if (!user) return fail(401, 'Wrong email or password');
    const { password: _password, ...safe } = user;
    return wait({ token: `demo-token-${user.id}`, user: safe });
  },

  listBooks(query) {
    const q = query.q?.toLowerCase();
    const sort = query.sort ?? 'title';
    const field = sort.replace('-', '') as 'title' | 'price' | 'rating';
    const direction = sort.startsWith('-') ? -1 : 1;
    const filtered = books
      .filter((b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
      .filter((b) => !query.category || b.category === query.category)
      .filter((b) => !query.in_stock || b.stock > 0)
      .filter((b) => query.min_price === undefined || b.price >= query.min_price)
      .filter((b) => query.max_price === undefined || b.price <= query.max_price)
      .sort((a, b) => {
        const order = field === 'title' ? a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }) : a[field] - b[field];
        return order * direction || a.id - b.id;
      });
    const start = (query.page - 1) * query.page_size;
    return wait({ items: filtered.slice(start, start + query.page_size), total: filtered.length, page: query.page, page_size: query.page_size });
  },

  listCategories() {
    return wait([...new Set(books.map((b) => b.category))].sort());
  },

  getBook(id) {
    try {
      return wait({ ...findBook(id) });
    } catch (error) {
      return wait(null).then(() => Promise.reject(error));
    }
  },

  createBook(input) {
    if (books.some((b) => b.isbn === input.isbn)) return fail(409, 'A book with this ISBN already exists');
    const book = { ...input, id: Math.max(0, ...books.map((b) => b.id)) + 1 };
    books = [...books, book];
    return wait(book);
  },

  createOrder(input) {
    const coupon = input.coupon?.trim().toUpperCase() || null;
    if (coupon && !(coupon in COUPONS)) return fail(422, 'Invalid coupon code');
    try {
      const lines = input.items.map((item) => ({ book: findBook(item.book_id), quantity: item.quantity }));
      const short = lines.find((line) => line.book.stock < line.quantity);
      if (short) return fail(409, `Only ${short.book.stock} left of "${short.book.title}"`);
      lines.forEach((line) => (line.book.stock -= line.quantity));
      const order: Order = {
        ...input,
        coupon,
        ...computeTotals(lines.map((line) => ({ price: line.book.price, quantity: line.quantity })), coupon),
        id: orders.length + 1,
        created_at: new Date().toISOString(),
        items: lines.map((line) => ({ book_id: line.book.id, title: line.book.title, quantity: line.quantity, unit_price: line.book.price })),
      };
      orders.push(order);
      return wait(order);
    } catch (error) {
      return wait(null).then(() => Promise.reject(error));
    }
  },

  getOrder(id) {
    const order = orders.find((o) => o.id === id);
    return order ? wait(order) : fail(404, `Order ${id} not found`);
  },
};
