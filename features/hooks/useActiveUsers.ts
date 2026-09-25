import { useEffect, useState } from 'react';

interface ActiveUsersState {
  activeUsers: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export const useActiveUsers = (pollIntervalMs: number = 60000) => {
  const [state, setState] = useState<ActiveUsersState>({
    activeUsers: 0,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchActiveUsers = async () => {
    try {
      const res = await fetch('/api/analytics/realtime');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setState({
        activeUsers: data.activeUsers ?? 0,
        isLoading: false,
        error: data.error || null,
        lastUpdated: data.lastUpdated || Date.now(),
      });
    } catch (err: any) {
      console.warn('Error al obtener usuarios activos:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err?.message || 'Error de conexión',
      }));
    }
  };

  useEffect(() => {
    // Primera consulta al montar el componente
    fetchActiveUsers();

    // Consulta periódica (por defecto cada 60 segundos)
    const interval = setInterval(() => {
      fetchActiveUsers();
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  return {
    ...state,
    refetch: fetchActiveUsers,
  };
};

export default useActiveUsers;
