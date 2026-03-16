"use client";

import { useEffect, useRef, useState } from "react";

export interface SearchComboboxProps {
  /** Returns list of { id, label } for the dropdown */
  fetchItems: (query: string, limit: number) => Promise<{ id: string; label: string }[]>;
  /** Returns display label for a selected id (e.g. when loading from URL) */
  getLabel: (id: string) => Promise<string>;
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  minChars?: number;
  limit?: number;
  accentClass?: string;
  className?: string;
}

export function SearchCombobox({
  fetchItems,
  getLabel,
  value,
  onChange,
  placeholder = "Search…",
  minChars = 2,
  limit = 10,
  accentClass = "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
  className = "",
}: SearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fetchItemsRef = useRef(fetchItems);
  const getLabelRef = useRef(getLabel);
  fetchItemsRef.current = fetchItems;
  getLabelRef.current = getLabel;

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < minChars) {
      setItems([]);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      fetchItemsRef.current(q, limit)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open, minChars, limit]);

  useEffect(() => {
    if (!value) {
      setSelectedLabel("");
      return;
    }
    getLabelRef.current(value)
      .then(setSelectedLabel)
      .catch(() => setSelectedLabel(""));
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayValue = open ? query : selectedLabel;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onChange("");
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ${accentClass}`}
      />
      {open && (
        <ul className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {query.trim().length < minChars ? (
            <li className="px-3 py-2 text-sm text-gray-400">
              Type at least {minChars} characters…
            </li>
          ) : loading ? (
            <li className="px-3 py-2 text-center text-sm text-gray-400">
              <span className="animate-pulse">Searching…</span>
            </li>
          ) : items.length === 0 ? (
            <li className="px-3 py-2 text-center text-sm text-gray-400">
              No results
            </li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                onMouseDown={() => {
                  onChange(item.id);
                  setSelectedLabel(item.label);
                  setQuery("");
                  setOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 ${
                  item.id === value ? "bg-blue-50 font-medium text-blue-700" : "text-gray-800"
                }`}
              >
                {item.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
