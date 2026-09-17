import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectDropdownOption {
  value: string;
  label: React.ReactNode;
}

interface SelectDropdownProps {
  value: string;
  options: SelectDropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  buttonClassName?: string;
  align?: 'left' | 'center';
}

const DEFAULT_BUTTON_CLASSNAME =
  'w-full px-3.5 py-2.5 pr-8 rounded-xl text-sm border border-gray-200 bg-gray-50';

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Selecione',
  ariaLabel,
  id,
  buttonClassName = DEFAULT_BUTTON_CLASSNAME,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selected = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`relative cursor-pointer ${align === 'center' ? 'text-center' : 'text-left'} ${buttonClassName}`}
      >
        <span className={`block truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform pointer-events-none ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-10 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-56 overflow-y-auto"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={opt.value === value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className="w-full text-left px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
