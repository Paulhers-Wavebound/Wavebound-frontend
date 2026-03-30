import { useState, useCallback } from 'react';
import { callAdminData } from '@/utils/adminData';

export function useAdminData() {
  const [loading, setLoading] = useState(false);

  const invoke = useCallback(async (action: string, extra: Record<string, any> = {}) => {
    setLoading(true);
    try {
      return await callAdminData(action, extra);
    } finally {
      setLoading(false);
    }
  }, []);

  return { invoke, loading };
}
