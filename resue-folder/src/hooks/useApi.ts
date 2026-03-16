"use client";

import { useState, useEffect, useCallback, useRef, type DependencyList } from "react";

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches data when dependencies change. Pass a fetcher and deps; refetch() re-runs the latest fetcher.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  dependencies: DependencyList = []
): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, dependencies);

  return { data, loading, error, refetch: run };
}
