import React from 'react';
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
    if (Number.isFinite(min)) v = Math.max(min as number, v);
    if (max !== undefined) v = Math.min(max, v);
    return v;
  };

  return (
    <div className="flex items-center rounded-xl border border-gray-200 bg-[#F8FAFD] focus-within:ring-2 focus-within:ring-[#1A73E8]/30 focus-within:border-[#1A73E8] overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(clamp((Number(value) || 0) - step))}
        className="w-9 h-10 flex items-center justify-center text-gray-500 hover:text-[#1A73E8] hover:bg-white active:scale-95 transition-all shrink-0"
        aria-label="Diminuir"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        onBlur={(e) => onChange(clamp(Number(e.target.value) || 0))}
        className="w-full min-w-0 text-center text-sm font-semibold bg-transparent border-0 focus:outline-none focus:ring-0 py-2.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp((Number(value) || 0) + step))}
        className="w-9 h-10 flex items-center justify-center text-gray-500 hover:text-[#1A73E8] hover:bg-white active:scale-95 transition-all shrink-0"
        aria-label="Aumentar"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
