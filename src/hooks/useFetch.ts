import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string;
}

interface UseFetchResult<T> extends FetchState<T> {
  refetch: () => void;
}

export function useFetch<T>(url: string): UseFetchResult<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: '',
  });
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    api
      .get<T>(url)
      .then((res) => {
        // res IS the data already — no .data needed
        if (!cancelled) {
          setState({ data: res, loading: false, error: '' });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message =
            err && typeof err === 'object' && 'message' in err
              ? (err as { message: string }).message
              : 'Failed to load data';
          setState({ data: null, loading: false, error: message });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, trigger]);

  function refetch() {
    setState((prev) => ({ ...prev, loading: true, error: '' }));
    setTrigger((t) => t + 1);
  }

  return { ...state, refetch };
}
