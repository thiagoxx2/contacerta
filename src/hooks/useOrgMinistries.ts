import { useState, useEffect } from 'react';
import { listMinistriesByOrg } from '../services/ministryService';
import { Ministry } from '../types/ministry';

export const useOrgMinistries = (orgId: string | null) => {
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setMinistries([]);
      setError(null);
      return;
    }

    const fetchMinistries = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const data = await listMinistriesByOrg(orgId);
        // Filtrar apenas ministérios ativos
        const activeMinistries = data.filter(ministry => ministry.active);
        setMinistries(activeMinistries);
      } catch (err) {
        console.error('Error fetching ministries:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch ministries');
        setMinistries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMinistries();
  }, [orgId]);

  return { ministries, loading, error };
};