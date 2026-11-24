import { useRef, type ReactNode, type RefObject } from 'react';
import { X, type LucideIcon } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const SIZES = {
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
} as const;

export type ModalSize = keyof typeof SIZES;

interface ModalProps {
  onClose: () => void;
  labelledBy?: string;
  label?: string;
  size?: ModalSize;
  variant?: 'dialog' | 'viewer';
  className?: string;
  panelRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}

export function Modal({
  onClose,
  labelledBy,
  label,
  size = 'lg',
  variant = 'dialog',
  className = '',
  panelRef,
  children,
}: ModalProps) {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = panelRef ?? ownRef;
  useFocusTrap(ref, onClose);

  const isViewer = variant === 'viewer';
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center animate-in fade-in ${
        isViewer ? 'items-center p-3 sm:p-6' : 'items-end sm:items-center sm:p-4'
      }`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-0 backdrop-blur-xs ${isViewer ? 'bg-black/80' : 'bg-black/60'}`}
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        className={`relative bg-white w-full ${SIZES[size]} border border-gray-200 shadow-2xl flex flex-col overflow-hidden ${
          isViewer ? 'max-h-[92vh] rounded-2xl' : 'max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-2xl'
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  title: ReactNode;
  titleId: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  actions?: ReactNode;
  onClose: () => void;
}

export function ModalHeader({
  title,
  titleId,
  subtitle,
  icon: Icon,
  iconClassName = 'bg-primary/10 text-primary',
  actions,
  onClose,
}: ModalHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-gray-100">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconClassName}`}>
            <Icon aria-hidden="true" className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h3 id={titleId} className="text-lg font-bold text-gray-900 truncate">
            {title}
          </h3>
          {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {actions}
        <ModalCloseButton onClose={onClose} />
      </div>
    </header>
  );
}

export function ModalCloseButton({ onClose, label = 'Fechar' }: { onClose: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
    >
      <X className="w-5 h-5" />
    </button>
  );
}

export function ModalFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <footer className={`px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-end gap-3 ${className}`}>
      {children}
    </footer>
  );
}
