export type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: string;
  price: number;
  stock: number;
  rating: number;
  published_on: string | null;
  description: string;
};

export type BookInput = Omit<Book, 'id'>;

export type BookSort = 'title' | '-title' | 'price' | '-price' | 'rating' | '-rating';

export type BookQuery = {
  q?: string;
  category?: string;
  in_stock?: boolean;
  min_price?: number;
  max_price?: number;
  sort?: BookSort;
  page: number;
  page_size: number;
};

export type Page<T> = { items: T[]; total: number; page: number; page_size: number };

export type User = { id: number; email: string; name: string; role: 'admin' | 'customer' };

export type LoginResult = { token: string; user: User };

export type PaymentMethod = 'card' | 'cod';

export type OrderInput = {
  customer_name: string;
  email: string;
  address: string;
  country: string;
  delivery_date: string;
  payment_method: PaymentMethod;
  coupon: string | null;
  items: { book_id: number; quantity: number }[];
};

export type Order = Omit<OrderInput, 'items'> & {
  id: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  created_at: string;
  items: { book_id: number; title: string; quantity: number; unit_price: number }[];
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
