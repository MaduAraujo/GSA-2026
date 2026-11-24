import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

export interface ActionMenuItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  tone?: 'default' | 'danger';
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  label: string;
  buttonClassName?: string;
}

const MENU_WIDTH = 176;
const GAP = 4;

export function ActionMenu({ items, label, buttonClassName }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = (restoreFocus = false) => {
    setIsOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current || !menuRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight;
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    const fitsBelow = rect.bottom + GAP + menuHeight <= window.innerHeight;
    setStyle(
      fitsBelow
        ? { top: rect.bottom + GAP, left, width: MENU_WIDTH }
        : { bottom: window.innerHeight - rect.top + GAP, left, width: MENU_WIDTH },
    );
    menuRef.current.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) setIsOpen(false);
    };
    const onViewportChange = () => setIsOpen(false);
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [isOpen]);

  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const options = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const index = options.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape' || e.key === 'Tab') {
      e.preventDefault();
      close(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      options[(index + 1) % options.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      options[(index - 1 + options.length) % options.length]?.focus();
    }
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={label}
        title="Mais ações"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        className={
          buttonClassName ??
          'p-1.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all focus-visible:outline-2 focus-visible:outline-primary'
        }
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            tabIndex={-1}
            aria-label={label}
            onKeyDown={handleMenuKeyDown}
            style={style}
            className="fixed z-60 rounded-xl bg-white border border-gray-200 shadow-lg p-1.5"
          >
            {items.map(({ label: itemLabel, icon: Icon, onSelect, tone }) => (
              <button
                key={itemLabel}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  onSelect();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left focus:outline-none ${
                  tone === 'danger'
                    ? 'text-danger-600 hover:bg-danger/10 focus:bg-danger/10'
                    : 'text-gray-700 hover:bg-gray-50 focus:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{itemLabel}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
