import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getGlobalLeaderboard, getRegionalLeaderboard } from '../api/leaderboard';
import { useAuth } from './AuthContext';

const LeaderboardContext = createContext(null);

export function LeaderboardProvider({ children }) {
  const { user } = useAuth();
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [regionalLeaderboard, setRegionalLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchGlobal = useCallback(async () => {
    try {
      const res = await getGlobalLeaderboard(20);
      if (res.success && res.data) {
        setGlobalLeaderboard(res.data);
      }
    } catch (err) {
      console.error('Error fetching global leaderboard:', err);
    }
  }, []);

  const fetchRegional = useCallback(async (region) => {
    if (!region) return;
    try {
      const res = await getRegionalLeaderboard(region, 20);
      if (res.success && res.data) {
        setRegionalLeaderboard(res.data);
      }
    } catch (err) {
      console.error('Error fetching regional leaderboard:', err);
    }
  }, []);

  const refreshLeaderboards = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchGlobal(),
      user?.region ? fetchRegional(user.region) : Promise.resolve()
    ]);
    setLoading(false);
  }, [fetchGlobal, fetchRegional, user?.region]);

  // Periodic polling every 4 seconds to sync leaderboard ranks
  useEffect(() => {
    refreshLeaderboards();
    const interval = setInterval(() => {
      fetchGlobal();
      if (user?.region) {
        fetchRegional(user.region);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [user?.region, fetchGlobal, fetchRegional, refreshLeaderboards]);

  return (
    <LeaderboardContext.Provider value={{ globalLeaderboard, regionalLeaderboard, loading, refreshLeaderboards }}>
      {children}
    </LeaderboardContext.Provider>
  );
}

export const useLeaderboard = () => useContext(LeaderboardContext);
