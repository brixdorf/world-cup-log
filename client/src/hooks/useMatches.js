import { useState, useEffect, useCallback } from "react";
import { api } from "../lib/api";

export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [matchData, dashData] = await Promise.all([
        api.getMatches(),
        api.getDashboard(),
      ]);
      setMatches(matchData);
      setDashboard(dashData);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Poll every 60 s so live scores update without a manual refresh
    const id = setInterval(fetchAll, 60_000);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Optimistic update: change local state immediately, revert on server error
  const updatePersonal = useCallback(
    async (matchId, changes) => {
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, ...changes } : m)),
      );
      // Refresh dashboard counts after a tick (the optimistic match data is correct but
      // dashboard aggregates need the server to recalculate)
      try {
        await api.updatePersonal(matchId, changes);
        const dashData = await api.getDashboard();
        setDashboard(dashData);
      } catch (e) {
        // Revert by re-fetching ground truth
        fetchAll();
        throw e;
      }
    },
    [fetchAll],
  );

  return {
    matches,
    dashboard,
    loading,
    error,
    refresh: fetchAll,
    updatePersonal,
  };
}
