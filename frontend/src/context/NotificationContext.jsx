import React, { createContext, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const MOCK_MESSAGES = [
  "🔥 gamer_asia just completed a quiz and earned 800 marks!",
  "🚀 user_america climbed to Rank #3 in the America leaderboard!",
  "💻 system_europe updated their profile region to Europe.",
  "🏆 sandeep just scored 1200 marks on a Database Management quiz!",
  "✨ alex_australia achieved a perfect 1000/1000 score!",
  "📈 Global leaderboard has been synchronized with the latest PostgreSQL shards."
];

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const prevScoreRef = useRef(null);

  // 1. Detect if the logged-in user's own score updates
  useEffect(() => {
    if (user && user.score !== undefined) {
      if (prevScoreRef.current !== null && user.score > prevScoreRef.current) {
        const gain = user.score - prevScoreRef.current;
        toast.success(`Score Updated! You earned +${gain} marks! Total score: ${user.score}`, {
          duration: 5000,
          position: 'top-right',
          style: {
            background: '#1C1C1E',
            color: '#FAFAFA',
            border: '1px solid rgba(59, 130, 246, 0.4)',
          },
          icon: '🎉'
        });
      }
      prevScoreRef.current = user.score;
    } else {
      prevScoreRef.current = null;
    }
  }, [user]);

  // 2. Simulate real-time activity notifications in the background to show microservice operations
  useEffect(() => {
    const showMockNotification = () => {
      // Don't show notifications if user is not logged in to keep landing clean
      if (!user) return;

      const randomIdx = Math.floor(Math.random() * MOCK_MESSAGES.length);
      const message = MOCK_MESSAGES[randomIdx];

      toast(message, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#161616',
          color: '#A1A1A6',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.875rem'
        },
        icon: '🔔'
      });
    };

    // Trigger every 25 seconds
    const interval = setInterval(showMockNotification, 25000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
}
