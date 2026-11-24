import { X } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { normalizeSearch } from '../../utils/search';
import { canonicalTool, joinTools, parseTools } from './sessionView';

interface ToolsInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
}

const MAX_SUGGESTIONS = 6;

export function ToolsInput({ id, value, onChange, suggestions }: ToolsInputProps) {
  const tools = parseTools(value);
  const [text, setText] = useState('');

  const chosen = new Set(tools.map(normalizeSearch));
  const query = normalizeSearch(text.trim());
  const options = suggestions
    .filter((s) => !chosen.has(normalizeSearch(s)) && (!query || normalizeSearch(s).includes(query)))
    .slice(0, MAX_SUGGESTIONS);

  const add = (raw: string) => {
    const pieces = parseTools(raw).map((t) => canonicalTool(t, suggestions));
    if (pieces.length > 0) onChange(joinTools(parseTools(joinTools([...tools, ...pieces]))));
    setText('');
  };

  const remove = (tool: string) => onChange(joinTools(tools.filter((t) => t !== tool)));

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && text.trim()) {
      e.preventDefault();
      add(text);
    } else if (e.key === 'Backspace' && !text && tools.length > 0) {
      remove(tools[tools.length - 1]!);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 min-h-10.5 px-2 py-1.5 rounded-xl border border-gray-200 bg-gray-50 focus-within:ring-2 focus-within:ring-success/30 focus-within:border-success">
        {tools.map((tool) => (
          <span
            key={tool}
            className="inline-flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-lg bg-primary/10 text-primary-700 text-xs font-semibold"
          >
            {tool}
            <button
              type="button"
              onClick={() => remove(tool)}
              aria-label={`Remover ${tool}`}
              className="p-0.5 rounded-md hover:bg-primary/15"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={text}
          onChange={(e) => {
            const next = e.target.value;
            if (next.includes(',')) add(next);
            else setText(next);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => text.trim() && add(text)}
          placeholder={tools.length ? 'Adicionar outra…' : 'Ex.: Gemini, NotebookLM'}
          className="flex-1 min-w-32 bg-transparent px-1.5 py-1 text-sm border-0 placeholder:text-gray-400 focus:outline-none"
        />
      </div>
      {options.length > 0 && (
        <div role="group" className="flex flex-wrap gap-1.5" aria-label="Sugestões de ferramentas">
          {options.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(s)}
              className="px-2.5 py-1 rounded-lg border border-dashed border-gray-300 text-xs font-medium text-gray-600 hover:border-primary hover:text-primary"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
