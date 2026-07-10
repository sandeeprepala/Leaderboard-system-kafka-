import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authApi from '../api/auth';
import { getUserLeaderboardStatus } from '../api/leaderboard';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sync user rank and score from database
  const refreshUserStats = async (userId) => {
    if (!userId) return;
    try {
      const res = await getUserLeaderboardStatus(userId);
      if (res.success && res.data) {
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            score: res.data.score,
            globalRank: res.data.globalRank || 'N/A',
            regionalRank: res.data.regionalRank || 'N/A'
          };
        });
      }
    } catch (err) {
      console.error('Failed to sync user stats:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const decoded = decodeToken(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setUser({
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
            region: decoded.region,
            score: 0,
            globalRank: 'N/A',
            regionalRank: 'N/A'
          });
          // Fetch real score and rank from DB
          await refreshUserStats(decoded.id);
        } else {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        const decoded = decodeToken(res.data.token);
        const loggedUser = {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          region: decoded.region,
          score: 0,
          globalRank: 'N/A',
          regionalRank: 'N/A'
        };
        setUser(loggedUser);
        await refreshUserStats(decoded.id);
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password, region) => {
    setLoading(true);
    try {
      const res = await authApi.register({ username, email, password, region });
      if (res.success) {
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      console.error(err);
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUserStats, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
