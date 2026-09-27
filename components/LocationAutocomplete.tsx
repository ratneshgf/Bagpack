'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { LoaderCircle, MapPin } from 'lucide-react';

type Suggestion = {
  id: string;
  label: string;
  city?: string;
  country?: string;
  type?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  type?: 'ORIGIN' | 'DESTINATION' | 'ANY';
  placeholder?: string;
  className?: string;
};

export default function LocationAutocomplete({
  value,
  onChange,
  type = 'ANY',
  placeholder = 'Type any place worldwide',
  className = '',
}: Props) {
  const listId = useId();
  const requestId = useRef(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      return;
    }

    const currentRequest = ++requestId.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/locations/autocomplete?q=${encodeURIComponent(query)}&type=${type}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as { results?: Suggestion[] };
        if (response.ok && currentRequest === requestId.current) {
          setSuggestions(data.results ?? []);
          setOpen(true);
          setActiveIndex(-1);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') setSuggestions([]);
      } finally {
        if (currentRequest === requestId.current) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value, type]);

  const choose = (suggestion: Suggestion) => {
    onChange(suggestion.label);
    setOpen(false);
    setActiveIndex(-1);
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(event) => {
          const nextValue = event.target.value;
          onChange(nextValue);
          if (nextValue.trim().length < 2) {
            setSuggestions([]);
            setLoading(false);
            setOpen(false);
          } else {
            setOpen(true);
          }
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(event) => {
          if (!open || suggestions.length === 0) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % suggestions.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
          } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            choose(suggestions[activeIndex]);
          } else if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        className={className}
      />
      {loading && (
        <LoaderCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#A89070]" />
      )}
      {open && suggestions.length > 0 && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-[#F5E6D3]/15 bg-[#151515] p-1.5 text-left shadow-2xl"
        >
          {suggestions.map((suggestion, index) => (
            <button
              id={`${listId}-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              type="button"
              key={suggestion.id}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(suggestion)}
              className={`flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                activeIndex === index ? 'bg-red-500/15 text-red-200' : 'text-[#E8D5BD] hover:bg-[#F5E6D3]/[0.06]'
              }`}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
              <span className="line-clamp-2">{suggestion.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
