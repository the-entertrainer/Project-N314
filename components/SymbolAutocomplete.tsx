'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search } from 'lucide-react';
import type { Nifty500Stock } from '../types/screener';

const SUGGESTION_LIMIT = 8;

function rankSuggestions(query: string, stocks: Nifty500Stock[]): Nifty500Stock[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const scored = stocks
    .map((stock) => {
      const sym = stock.symbol.toLowerCase();
      const symBase = sym.replace('.ns', '');
      const name = stock.companyName.toLowerCase();
      const industry = stock.industry.toLowerCase();

      let score = 0;
      if (sym === q || symBase === q) score = 100;
      else if (sym.startsWith(q) || symBase.startsWith(q)) score = 80;
      else if (sym.includes(q) || symBase.includes(q)) score = 60;
      else if (name.includes(q)) score = 40;
      else if (industry.includes(q)) score = 20;
      else return null;

      return { stock, score };
    })
    .filter((item): item is { stock: Nifty500Stock; score: number } => item !== null)
    .sort((a, b) => b.score - a.score || a.stock.symbol.localeCompare(b.stock.symbol))
    .slice(0, SUGGESTION_LIMIT)
    .map((item) => item.stock);

  return scored;
}

interface SymbolAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SymbolAutocomplete({
  value,
  onChange,
  onSubmit,
  placeholder = 'Enter symbol — RELIANCE.NS, TCS.NS…',
  disabled = false,
}: SymbolAutocompleteProps) {
  const [registry, setRegistry] = useState<Nifty500Stock[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = 'symbol-suggestions-list';

  useEffect(() => {
    let cancelled = false;
    fetch('/api/screener')
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled && json.success) setRegistry(json.data || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => rankSuggestions(value, registry), [value, registry]);

  useEffect(() => {
    setActiveIndex(0);
  }, [value, suggestions.length]);

  const selectSuggestion = useCallback(
    (stock: Nifty500Stock) => {
      onChange(stock.symbol);
      setOpen(false);
      inputRef.current?.focus();
    },
    [onChange]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && suggestions.length > 0) {
      setOpen(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (e.key === 'Enter') {
      if (open && suggestions[activeIndex]) {
        e.preventDefault();
        selectSuggestion(suggestions[activeIndex]);
        return;
      }
      onSubmit?.();
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(e.target.value.trim().length > 0);
        }}
        onFocus={() => {
          if (value.trim() && suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="input-field pl-11"
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open && suggestions.length > 0}
        role="combobox"
      />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          className="absolute z-50 left-0 right-0 top-full mt-1.5 py-1.5 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl shadow-black/40 max-h-64 overflow-y-auto"
          role="listbox"
        >
          {suggestions.map((stock, index) => (
            <li key={stock.symbol} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(stock)}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                  index === activeIndex ? 'bg-emerald-500/15' : 'hover:bg-white/5'
                }`}
              >
                <span className="font-mono text-sm font-semibold text-emerald-400 shrink-0 w-[7.5rem]">
                  {stock.symbol}
                </span>
                <span className="text-sm text-zinc-300 truncate flex-1">{stock.companyName}</span>
                <span className="text-[10px] text-zinc-500 truncate max-w-[5rem] hidden sm:block">
                  {stock.industry}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}