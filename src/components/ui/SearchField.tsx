import { Search, X } from 'lucide-react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  id?: string;
}

export function SearchField({ value, onChange, label, placeholder, id }: SearchFieldProps) {
  return (
    <div className="relative flex-1">
      <Search aria-hidden="true" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      <input
        id={id}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-10 py-2 rounded-xl text-sm border border-gray-200 bg-gray-50 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
