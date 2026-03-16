"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "nexus-global-filter";

export type ModuleFilter = "all" | "sales" | "purchase" | "inventory";

export type GlobalFilterState = {
  dateFrom: string;
  dateTo: string;
  moduleFilter: ModuleFilter;
  searchQuery: string;
  warehouseId: string;
};

function defaultDateRange(): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date();
  from.setMonth(from.getMonth() - 12);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

function loadStored(): Partial<GlobalFilterState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GlobalFilterState>;
      if (parsed.dateFrom && parsed.dateTo) return parsed;
    }
  } catch {
    // ignore
  }
  return {};
}

const defaults: GlobalFilterState = {
  ...defaultDateRange(),
  moduleFilter: "all",
  searchQuery: "",
  warehouseId: "all",
};

type ContextValue = GlobalFilterState & {
  setDateRange: (dateFrom: string, dateTo: string) => void;
  setModuleFilter: (module: ModuleFilter) => void;
  setSearchQuery: (q: string) => void;
  clearSearch: () => void;
  setWarehouseId: (id: string) => void;
};

const GlobalFilterContext = createContext<ContextValue | null>(null);

export function GlobalFilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GlobalFilterState>(() => ({
    ...defaults,
    ...loadStored(),
  }));

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          dateFrom: state.dateFrom,
          dateTo: state.dateTo,
          moduleFilter: state.moduleFilter,
          warehouseId: state.warehouseId,
        })
      );
    } catch {
      // ignore
    }
  }, [state.dateFrom, state.dateTo, state.moduleFilter, state.warehouseId]);

  const setDateRange = useCallback((dateFrom: string, dateTo: string) => {
    setState((prev) => ({ ...prev, dateFrom, dateTo }));
  }, []);

  const setModuleFilter = useCallback((moduleFilter: ModuleFilter) => {
    setState((prev) => ({ ...prev, moduleFilter }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setState((prev) => ({ ...prev, searchQuery }));
  }, []);

  const clearSearch = useCallback(() => {
    setState((prev) => ({ ...prev, searchQuery: "" }));
  }, []);

  const setWarehouseId = useCallback((warehouseId: string) => {
    setState((prev) => ({ ...prev, warehouseId }));
  }, []);

  return (
    <GlobalFilterContext.Provider
      value={{
        ...state,
        setDateRange,
        setModuleFilter,
        setSearchQuery,
        clearSearch,
        setWarehouseId,
      }}
    >
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilter(): ContextValue {
  const ctx = useContext(GlobalFilterContext);
  if (!ctx) {
    return {
      ...defaults,
      ...defaultDateRange(),
      warehouseId: "all",
      setDateRange: () => {},
      setModuleFilter: () => {},
      setSearchQuery: () => {},
      clearSearch: () => {},
      setWarehouseId: () => {},
    };
  }
  return ctx;
}
