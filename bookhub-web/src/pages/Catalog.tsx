import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Field, Modal, Pagination, Spinner, Stars, useToast } from '../components';
import { formatPrice } from '../pricing';
import { useAuth, useCart } from '../state';
import type { Book, BookInput, BookSort, Page } from '../types';

const SORT_OPTIONS: { value: BookSort; label: string }[] = [
  { value: 'title', label: 'Title (A–Z)' },
  { value: '-title', label: 'Title (Z–A)' },
  { value: 'price', label: 'Price (low to high)' },
  { value: '-price', label: 'Price (high to low)' },
  { value: '-rating', label: 'Rating (best first)' },
];

const toNumber = (value: string | null) => (value === null || value === '' ? undefined : Number(value));

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [data, setData] = useState<Page<Book> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [adding, setAdding] = useState(false);

  const query = {
    q: params.get('q') ?? undefined,
    category: params.get('category') ?? undefined,
    in_stock: params.get('in_stock') === 'true',
    min_price: toNumber(params.get('min_price')),
    max_price: toNumber(params.get('max_price')),
    sort: (params.get('sort') as BookSort | null) ?? 'title',
    page: toNumber(params.get('page')) ?? 1,
    page_size: toNumber(params.get('page_size')) ?? 6,
  };
  const priceError = query.min_price !== undefined && query.max_price !== undefined && query.min_price > query.max_price ? 'Min price cannot be more than max price' : '';
  const queryKey = params.toString();

  const update = useCallback(
    (changes: Record<string, string | undefined>, resetPage = true) =>
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );

  useEffect(() => {
    api.listCategories().then(setCategories).catch(() => setCategories([]));
  }, [reloadKey]);

  useEffect(() => {
    const timer = setTimeout(() => search !== (params.get('q') ?? '') && update({ q: search.trim() || undefined }), 400);
    return () => clearTimeout(timer);
  }, [search, params, update]);

  useEffect(() => {
    if (priceError) return;
    let active = true;
    setLoading(true);
    setError('');
    api
      .listBooks(query)
      .then((page) => active && setData(page))
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [queryKey, priceError, reloadKey]);

  const pages = data ? Math.ceil(data.total / data.page_size) : 0;
  const first = data && data.total ? (data.page - 1) * data.page_size + 1 : 0;
  const last = data ? Math.min(data.total, data.page * data.page_size) : 0;

  return (
    <section>
      <div className="page-header">
        <h1>Books</h1>
        {user?.role === 'admin' && (
          <button type="button" className="primary" onClick={() => setAdding(true)}>
            Add book
          </button>
        )}
      </div>

      <form className="filters" role="search" aria-label="Filter books" onSubmit={(e) => e.preventDefault()}>
        <Field label="Search">
          {(props) => <input {...props} type="search" placeholder="Title or author" value={search} onChange={(e) => setSearch(e.target.value)} />}
        </Field>
        <Field label="Category">
          {(props) => (
            <select {...props} value={query.category ?? ''} onChange={(e) => update({ category: e.target.value || undefined })}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Min price">
          {(props) => <input {...props} type="number" min={0} step="0.01" value={params.get('min_price') ?? ''} onChange={(e) => update({ min_price: e.target.value })} />}
        </Field>
        <Field label="Max price" error={priceError || undefined}>
          {(props) => <input {...props} type="number" min={0} step="0.01" value={params.get('max_price') ?? ''} onChange={(e) => update({ max_price: e.target.value })} />}
        </Field>
        <Field label="Sort by">
          {(props) => (
            <select {...props} value={query.sort} onChange={(e) => update({ sort: e.target.value })}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <label className="check">
          <input type="checkbox" checked={query.in_stock} onChange={(e) => update({ in_stock: e.target.checked ? 'true' : undefined })} /> In stock only
        </label>
      </form>

      {error ? (
        <div className="alert alert-error" role="alert">
          Could not load books: {error}{' '}
          <button type="button" onClick={() => setReloadKey((k) => k + 1)}>
            Retry
          </button>
        </div>
      ) : loading || !data ? (
        <Spinner label="Loading books" />
      ) : data.total === 0 ? (
        <div className="empty">
          <p>No books match your filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setParams({}, { replace: true });
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="toolbar">
            <p data-testid="results-summary">
              Showing {first}–{last} of {data.total} books
            </p>
            <label>
              Per page{' '}
              <select value={query.page_size} onChange={(e) => update({ page_size: e.target.value })}>
                {[6, 12, 24].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <ul className="grid" aria-label="Book list">
            {data.items.map((book) => (
              <li key={book.id} className="book-card" data-testid="book-card">
                <span className="tag">{book.category}</span>
                <h3>
                  <Link to={`/books/${book.id}`}>{book.title}</Link>
                </h3>
                <p className="muted">by {book.author}</p>
                <Stars rating={book.rating} />
                <p className="price">{formatPrice(book.price)}</p>
                <StockBadge stock={book.stock} />
                <button
                  type="button"
                  disabled={book.stock === 0}
                  onClick={() => {
                    cart.add(book, 1);
                    toast(`Added "${book.title}" to cart`);
                  }}
                >
                  Add to cart
                </button>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} pages={pages} onChange={(page) => update({ page: String(page) }, false)} />
        </>
      )}

      {adding && (
        <AddBookModal
          categories={categories}
          onClose={() => setAdding(false)}
          onCreated={(book) => {
            setAdding(false);
            toast(`Book "${book.title}" created`);
            setReloadKey((k) => k + 1);
          }}
        />
      )}
    </section>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="badge badge-out">Out of stock</span>;
  if (stock <= 3) return <span className="badge badge-low">Only {stock} left</span>;
  return <span className="badge badge-in">In stock</span>;
}

const EMPTY_BOOK = { title: '', author: '', isbn: '', category: '', price: '', stock: '', published_on: '', description: '' };

function AddBookModal({ categories, onClose, onCreated }: { categories: string[]; onClose(): void; onCreated(book: Book): void }) {
  const [form, setForm] = useState(EMPTY_BOOK);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const set = (key: keyof typeof EMPTY_BOOK) => (event: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const errors: Partial<Record<keyof typeof EMPTY_BOOK, string>> = {
    title: form.title.trim() ? undefined : 'Title is required',
    author: form.author.trim() ? undefined : 'Author is required',
    isbn: /^\d{10}(\d{3})?$/.test(form.isbn) ? undefined : 'ISBN must be 10 or 13 digits',
    category: form.category ? undefined : 'Choose a category',
    price: Number(form.price) > 0 ? undefined : 'Price must be more than 0',
    stock: form.stock !== '' && Number.isInteger(Number(form.stock)) && Number(form.stock) >= 0 ? undefined : 'Stock must be 0 or more',
  };
  const shown = (key: keyof typeof EMPTY_BOOK) => (submitted ? errors[key] : undefined);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setServerError('');
    if (Object.values(errors).some(Boolean)) return;
    const input: BookInput = {
      title: form.title.trim(),
      author: form.author.trim(),
      isbn: form.isbn,
      category: form.category,
      price: Number(form.price),
      stock: Number(form.stock),
      rating: 0,
      published_on: form.published_on || null,
      description: form.description.trim(),
    };
    setSaving(true);
    try {
      onCreated(await api.createBook(input));
    } catch (error) {
      setServerError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add book" onClose={onClose}>
      <form noValidate onSubmit={onSubmit} aria-label="Add book form">
        {serverError && (
          <div className="alert alert-error" role="alert">
            {serverError}
          </div>
        )}
        <Field label="Title" error={shown('title')}>
          {(props) => <input {...props} value={form.title} onChange={set('title')} />}
        </Field>
        <Field label="Author" error={shown('author')}>
          {(props) => <input {...props} value={form.author} onChange={set('author')} />}
        </Field>
        <div className="row">
          <Field label="ISBN" error={shown('isbn')} hint="10 or 13 digits">
            {(props) => <input {...props} inputMode="numeric" value={form.isbn} onChange={set('isbn')} />}
          </Field>
          <Field label="Category" error={shown('category')}>
            {(props) => (
              <select {...props} value={form.category} onChange={set('category')}>
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            )}
          </Field>
        </div>
        <div className="row">
          <Field label="Price" error={shown('price')}>
            {(props) => <input {...props} type="number" min={0} step="0.01" value={form.price} onChange={set('price')} />}
          </Field>
          <Field label="Stock" error={shown('stock')}>
            {(props) => <input {...props} type="number" min={0} step="1" value={form.stock} onChange={set('stock')} />}
          </Field>
          <Field label="Published on">
            {(props) => <input {...props} type="date" value={form.published_on} onChange={set('published_on')} />}
          </Field>
        </div>
        <Field label="Description">
          {(props) => <textarea {...props} rows={3} value={form.description} onChange={set('description')} />}
        </Field>
        <div className="actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save book'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
