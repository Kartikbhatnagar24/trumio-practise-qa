import { createContext, useCallback, useContext, useEffect, useId, useState, type ReactNode } from 'react';

type Toast = { id: number; message: string; kind: 'success' | 'error' };

const ToastContext = createContext<(message: string, kind?: Toast['kind']) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (message: string, kind: Toast['kind'] = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, message, kind }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind}`} data-testid="toast">
            <span>{toast.message}</span>
            <button type="button" className="link" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export function Modal({ title, onClose, children }: { title: string; onClose(): void; children: ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="link" aria-label="Close dialog" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Spinner = ({ label = 'Loading' }: { label?: string }) => (
  <div className="spinner" role="status" aria-label={label}>
    <span />
  </div>
);

export const Stars = ({ rating }: { rating: number }) => (
  <span className="stars" aria-label={`Rated ${rating} out of 5`} title={`${rating} / 5`}>
    {'★'.repeat(Math.round(rating))}
    {'☆'.repeat(5 - Math.round(rating))}
  </span>
);

export function QuantityStepper({ value, max, onChange }: { value: number; max: number; onChange(value: number): void }) {
  const clamp = (next: number) => onChange(Math.max(1, Math.min(max, Number.isNaN(next) ? 1 : next)));
  return (
    <div className="stepper">
      <button type="button" aria-label="Decrease quantity" disabled={value <= 1} onClick={() => clamp(value - 1)}>
        −
      </button>
      <input type="number" aria-label="Quantity" min={1} max={max} value={value} onChange={(event) => clamp(event.target.valueAsNumber)} />
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => clamp(value + 1)}>
        +
      </button>
    </div>
  );
}

export function Pagination({ page, pages, onChange }: { page: number; pages: number; onChange(page: number): void }) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" aria-current={n === page ? 'page' : undefined} className={n === page ? 'active' : ''} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && (
        <small id={`${id}-hint`} className="hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-error`} className="error">
          {error}
        </small>
      )}
    </div>
  );
}
