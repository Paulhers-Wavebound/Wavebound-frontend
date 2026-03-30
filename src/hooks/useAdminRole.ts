import { useState, useCallback, useEffect } from 'react';
import { callAdminData } from '@/utils/adminData';

let cachedIsAdmin: boolean | null = null;

export function useAdminRole() {
  const [isAdmin, setIsAdmin] = useState(cachedIsAdmin ?? false);
  const [loading, setLoading] = useState(cachedIsAdmin === null);
  const [error, setError] = useState<string | null>(null);

  const checkAdmin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callAdminData('check_admin');
      const result = data?.is_admin === true;
      setIsAdmin(result);
      cachedIsAdmin = result;
    } catch (e: any) {
      setIsAdmin(false);
      setError(e?.message || 'Admin check failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAdmin(); }, [checkAdmin]);

  return { isAdmin, loading, error, retry: checkAdmin };
}
