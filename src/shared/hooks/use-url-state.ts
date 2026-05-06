import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const getString = useCallback((key: string, fallback = '') => {
    return searchParams.get(key) ?? fallback;
  }, [searchParams]);

  const getNumber = useCallback((key: string, fallback: number) => {
    const value = Number(searchParams.get(key));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }, [searchParams]);

  const setValue = useCallback((key: string, value: string | number | boolean | undefined | null) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (value === undefined || value === null || value === '') {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setValues = useCallback((values: Record<string, string | number | boolean | undefined | null>) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return { searchParams, getString, getNumber, setValue, setValues };
}
