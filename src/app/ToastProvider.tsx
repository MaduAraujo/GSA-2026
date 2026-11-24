import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type ToastTone = 'info' | 'success' | 'error';
export type ToastCloseReason = 'timeout' | 'dismiss' | 'action';

export interface ToastOptions {
  message: string;
  tone?: ToastTone;
  action?: { label: string; onClick: () => void };
  duration?: number;
  onClose?: (reason: ToastCloseReason) => void;
}

interface ToastItem extends ToastOptions {
  id: string;
}

interface ToastApi {
  show: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATION = 5000;
const MAX_VISIBLE = 3;

const ToastContext = createContext<ToastApi | null>(null);

function Toast({ toast, onClose }: { toast: ToastItem; onClose: (id: string, reason: ToastCloseReason) => void }) {
  const [isPaused, setIsPaused] = useState(false);
  const duration = toast.duration ?? DEFAULT_DURATION;

  useEffect(() => {
    if (isPaused) return;
    const timer = setTimeout(() => onClose(toast.id, 'timeout'), duration);
    return () => clearTimeout(timer);
  }, [isPaused, duration, onClose, toast.id]);

  const isError = toast.tone === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="badge-toast-enter pointer-events-auto flex items-center gap-3 rounded-xl bg-gray-800 dark:bg-gray-200 pl-4 pr-2 py-2.5 shadow-2xl text-sm text-white dark:text-gray-900"
    >
      {isError && (
        <CircleAlert aria-hidden="true" className="w-4.5 h-4.5 shrink-0 text-danger-300 dark:text-danger-700" />
      )}
      {toast.tone === 'success' && (
        <CircleCheck aria-hidden="true" className="w-4.5 h-4.5 shrink-0 text-success-300 dark:text-success-800" />
      )}
      <p className="flex-1 min-w-0 py-1 leading-snug">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.onClick();
            onClose(toast.id, 'action');
          }}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-primary-300 dark:text-primary hover:bg-white/10 dark:hover:bg-black/5"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onClose(toast.id, 'dismiss')}
        aria-label="Fechar notificação"
        className="shrink-0 rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 dark:text-gray-900/60 dark:hover:text-gray-900 dark:hover:bg-black/5"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const openRef = useRef(new Map<string, ToastItem>());

  const dismissWith = useCallback((id: string, reason: ToastCloseReason) => {
    const toast = openRef.current.get(id);
    if (!toast) return;
    openRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
    toast.onClose?.(reason);
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      const id = crypto.randomUUID();
      const toast = { ...options, id };
      openRef.current.set(id, toast);
      setToasts((prev) => [...prev, toast]);
      const overflow = [...openRef.current.keys()].slice(0, -MAX_VISIBLE);
      overflow.forEach((oldId) => dismissWith(oldId, 'timeout'));
      return id;
    },
    [dismissWith],
  );

  const api = useMemo<ToastApi>(() => ({ show, dismiss: (id) => dismissWith(id, 'dismiss') }), [show, dismissWith]);

  return (
    <ToastContext value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-[calc(1rem+var(--bottom-nav-offset,0px))] md:bottom-4 left-1/2 -translate-x-1/2 z-100 flex w-[calc(100%-2rem)] max-w-md flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={dismissWith} />
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast(): ToastApi {
  const ctx = use(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
