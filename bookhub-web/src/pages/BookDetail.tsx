import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { QuantityStepper, Spinner, Stars, useToast } from '../components';
import { formatPrice } from '../pricing';
import { useCart } from '../state';
import type { Book } from '../types';
import { StockBadge } from './Catalog';

export default function BookDetail() {
  const id = Number(useParams().id);
  const cart = useCart();
  const toast = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'description' | 'details'>('description');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setBook(null);
    setError('');
    api.getBook(id).then(setBook, (e: Error) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <section className="empty">
        <h1>Book not found</h1>
        <p>{error}</p>
        <Link to="/books">Back to books</Link>
      </section>
    );
  if (!book) return <Spinner label="Loading book" />;

  return (
    <section>
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/books">Books</Link> / <Link to={`/books?category=${encodeURIComponent(book.category)}`}>{book.category}</Link> / <span aria-current="page">{book.title}</span>
      </nav>
      <div className="detail">
        <div className="cover" aria-hidden="true">
          {book.title.slice(0, 1)}
        </div>
        <div>
          <h1>{book.title}</h1>
          <p className="muted">by {book.author}</p>
          <Stars rating={book.rating} />
          <p className="price large">{formatPrice(book.price)}</p>
          <StockBadge stock={book.stock} />
          {book.stock > 0 ? (
            <div className="buy">
              <QuantityStepper value={quantity} max={book.stock} onChange={setQuantity} />
              <button
                type="button"
                className="primary"
                onClick={() => {
                  cart.add(book, quantity);
                  toast(`Added ${quantity} × "${book.title}" to cart`);
                }}
              >
                Add to cart
              </button>
            </div>
          ) : (
            <p className="muted">This book is currently unavailable.</p>
          )}

          <div role="tablist" aria-label="Book information" className="tabs">
            {(['description', 'details'] as const).map((name) => (
              <button key={name} type="button" role="tab" id={`tab-${name}`} aria-selected={tab === name} aria-controls={`panel-${name}`} onClick={() => setTab(name)}>
                {name === 'description' ? 'Description' : 'Details'}
              </button>
            ))}
          </div>
          {tab === 'description' ? (
            <div role="tabpanel" id="panel-description" aria-labelledby="tab-description">
              <p>{book.description || 'No description yet.'}</p>
            </div>
          ) : (
            <div role="tabpanel" id="panel-details" aria-labelledby="tab-details">
              <dl className="facts">
                <dt>ISBN</dt>
                <dd>{book.isbn}</dd>
                <dt>Category</dt>
                <dd>{book.category}</dd>
                <dt>Published</dt>
                <dd>{book.published_on ?? 'Unknown'}</dd>
                <dt>In stock</dt>
                <dd>{book.stock}</dd>
              </dl>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
