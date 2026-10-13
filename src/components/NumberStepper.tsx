import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberStepperProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export const NumberStepper: React.FC<NumberStepperProps> = ({ id, value, onChange, min = 0, max, step = 1 }) => {
  const clamp = (n: number) => {
    let v = n;
    if (Number.isFinite(min)) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };
  const emptyValue = clamp(0);
  const parse = (text: string) => (text === '' || text === '-' ? emptyValue : Number(text));

  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (parse(draft) !== value) setDraft(String(value));
  }

  const current = Number(value) || 0;
  const stepBy = (delta: number) => {
    const next = clamp(current + delta);
    setDraft(String(next));
    onChange(next);
  };

  const allowNegative = !Number.isFinite(min) || min < 0;
  const handleInput = (raw: string) => {
    const pattern = allowNegative ? /^-?\d*$/ : /^\d*$/;
    if (!pattern.test(raw)) return;
    const text = raw.replace(/^(-?)0+(?=\d)/, '$1');
    const parsed = parse(text);
    const next = max !== undefined ? Math.min(max, parsed) : parsed;
    setDraft(next === parsed ? text : String(next));
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const amount = e.shiftKey ? step * 10 : step;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      stepBy(amount);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      stepBy(-amount);
    }
  };

  const handleBlur = () => {
    const committed = clamp(parse(draft));
    setDraft(String(committed));
    if (committed !== value) onChange(committed);
  };

  return (
    <div className="flex items-center rounded-xl border border-gray-200 bg-[#F8FAFD] focus-within:ring-2 focus-within:ring-[#1A73E8]/30 focus-within:border-[#1A73E8] overflow-hidden">
      <button
        type="button"
        onClick={() => stepBy(-step)}
        className="w-9 h-10 flex items-center justify-center text-gray-500 hover:text-[#1A73E8] hover:bg-white active:scale-95 transition-all shrink-0"
        aria-label="Diminuir"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        role="spinbutton"
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={max}
        aria-valuenow={current}
        value={draft}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={(e) => e.target.select()}
        onBlur={handleBlur}
        className="w-full min-w-0 text-center text-sm font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 py-2.5"
      />
      <button
        type="button"
        onClick={() => stepBy(step)}
        className="w-9 h-10 flex items-center justify-center text-gray-500 hover:text-[#1A73E8] hover:bg-white active:scale-95 transition-all shrink-0"
        aria-label="Aumentar"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
