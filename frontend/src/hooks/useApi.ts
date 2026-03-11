import { useState, useEffect, useCallback } from "react";
import api from "../api";

interface UseApiOptions {
  params?: Record<string, any>;
  dependencies?: any[];
  autoFetch?: boolean;
}

export function useApi<T>(url: string, options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const paramsKey = JSON.stringify(options.params || {});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(url, { params: options.params });
      // Unwrap standard paginated responses 
      if (res.data && res.data.data !== undefined) {
        setData(res.data.data);
        setMeta(res.data.meta || res.data); // Capture meta if available
      } else {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [url, paramsKey]);

  useEffect(() => {
    if (options.autoFetch !== false) {
      fetchData();
    }
  }, [fetchData, ...(options.dependencies || [])]);

  return { data, meta, loading, error, refetch: fetchData };
}
