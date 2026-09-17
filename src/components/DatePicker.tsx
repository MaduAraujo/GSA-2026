import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (date: string) => void;
  align?: 'left' | 'center';
  placeholder?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const POPUP_WIDTH = 288; // w-72
const POPUP_HEIGHT = 336; // approx rendered height of the calendar popup
const POPUP_MARGIN = 8;

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function parseISODate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplay(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getBoundsRect(el: HTMLElement | null): { top: number; left: number; right: number; bottom: number } {
  let node = el?.parentElement || null;
  while (node && node !== document.body) {
    const overflowY = window.getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'hidden' || overflowY === 'scroll') {
      const rect = node.getBoundingClientRect();
      return { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom };
    }
    node = node.parentElement;
  }
  return { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };
}

export const DatePicker: React.FC<DatePickerProps> = ({ id, value, onChange, align = 'left', placeholder = 'Selecionar data', open, onOpenChange }) => {
  const selectedDate = parseISODate(value);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const resolved = typeof next === 'function' ? (next as (prev: boolean) => boolean)(isOpen) : next;
    if (isControlled) {
      onOpenChange?.(resolved);
    } else {
      setInternalOpen(resolved);
    }
  };
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (selectedDate) setViewDate(selectedDate);

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const bounds = getBoundsRect(buttonRef.current);
      const popupHeight = popupRef.current?.offsetHeight || POPUP_HEIGHT;
      const left = Math.min(
        Math.max(rect.left, bounds.left + POPUP_MARGIN),
        bounds.right - POPUP_WIDTH - POPUP_MARGIN
      );
      const fitsBelow = rect.bottom + 8 + popupHeight <= bounds.bottom - POPUP_MARGIN;
      const top = fitsBelow
        ? rect.bottom + 8
        : Math.max(bounds.top + POPUP_MARGIN, rect.top - popupHeight - 8);
      setPopupPosition({ top, left });
    };
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => setIsOpen(false);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', updatePosition);
    document.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const goToMonth = (offset: number) => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const handleSelectDay = (day: number) => {
    const picked = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(toISODate(picked));
    setIsOpen(false);
  };

  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isSameDay = (day: number) =>
    !!selectedDate &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month &&
    selectedDate.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`w-full flex items-center gap-2.5 pl-3.5 pr-3 py-2.5 rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]/30 focus:border-[#1A73E8] bg-[#F8FAFD] hover:border-gray-300 transition-colors ${
          align === 'center' ? 'justify-center text-center' : 'text-left'
        }`}
      >
        <Calendar className="w-4 h-4 text-[#1A73E8] shrink-0" />
        <span className={selectedDate ? 'text-gray-900' : 'text-gray-400'}>
          {selectedDate ? formatDisplay(selectedDate) : placeholder}
        </span>
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          role="dialog"
          aria-label="Selecionar data"
          style={{ position: 'fixed', top: popupPosition.top, left: popupPosition.left, width: POPUP_WIDTH }}
          className="rounded-2xl bg-white border border-gray-200 shadow-lg p-3 z-20"
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <button
              type="button"
              onClick={() => goToMonth(-1)}
              aria-label="Mês anterior"
              className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900">
              {MONTH_LABELS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => goToMonth(1)}
              aria-label="Próximo mês"
              className="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_LABELS.map((label, idx) => (
              <div key={idx} className="text-center text-[11px] font-semibold text-gray-400 py-1">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) =>
              day === null ? (
                <div key={idx} />
              ) : (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`aspect-square rounded-full text-xs font-medium flex items-center justify-center transition-colors ${
                    isSameDay(day)
                      ? 'bg-[#1A73E8] text-white font-bold'
                      : isToday(day)
                      ? 'text-[#1A73E8] font-bold hover:bg-[#1A73E8]/10'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {day}
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};