import { useEffect, useRef, useState } from "react";
import api from "../api";

interface SearchComboboxProps {
  endpoint: string;
  mapItem: (item: any) => { id: string; label: string };
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  accentClass?: string;
  minChars?: number;
  limit?: number;
}

export function SearchCombobox({ 
  endpoint, 
  mapItem, 
  value, 
  onChange, 
  placeholder = "Search...", 
  accentClass = "focus:border-blue-500",
  minChars = 2,
  limit = 10
}: SearchComboboxProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  const [selectedLabel, setSelectedLabel] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Search logic with debounce and character threshold
  useEffect(() => {
    if (!open) return;
    
    const q = query.trim();
    if (q.length < minChars) {
      setItems([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      api.get(endpoint, { params: { search: q, limit } }).then(res => {
        setItems((res.data?.data || res.data).map(mapItem));
      }).catch(console.error).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, open, endpoint, minChars, limit, mapItem]);

  // Fetch initial label if value is provided
  useEffect(() => {
    if (value && !selectedLabel) {
      api.get(`${endpoint}/${value}`).then(res => {
        setSelectedLabel(mapItem(res.data).label);
      }).catch(() => {});
    }
    if (!value) setSelectedLabel("");
  }, [value, endpoint, mapItem, selectedLabel]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); 
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        value={open ? query : selectedLabel}
        onChange={e => { setQuery(e.target.value); setOpen(true); onChange(""); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none ${accentClass}`}
      />
      {open && (
        <ul className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {query.trim().length < minChars ? (
            <li className="px-3 py-2 text-sm text-gray-400">Type at least {minChars} characters to search...</li>
          ) : loading ? (
            <li className="px-3 py-2 text-sm text-gray-400 text-center"><span className="animate-pulse">Searching...</span></li>
          ) : items.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400 text-center">No results found</li>
          ) : items.map(item => (
            <li key={item.id}
              onMouseDown={() => { onChange(item.id); setSelectedLabel(item.label); setQuery(""); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${item.id === value ? "bg-blue-50 font-medium text-blue-700" : "text-gray-800"}`}>
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
