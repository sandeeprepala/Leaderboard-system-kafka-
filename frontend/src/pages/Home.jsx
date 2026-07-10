import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserAnalytics } from '../api/analytics';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { StatSkeleton } from '../components/Skeletons';
import { FiPlay, FiAward, FiTrendingUp, FiGlobe, FiLayers } from 'react-icons/fi';

export default function Home() {
  const { user, refreshUserStats } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        // Sync user score & rank
        await refreshUserStats(user.id);
        
        // Fetch attempts from Analytics
        const analyticsRes = await getUserAnalytics(user.id);
        if (analyticsRes.success && analyticsRes.data) {
          setAttempts(analyticsRes.data.totalPlays || 0);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-bgDark flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-grow">
        <Sidebar />
        <main className="flex-grow p-6 md:p-8 max-w-5xl mx-auto w-full">
          {/* Welcome User */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight">Welcome, {user?.username}!</h1>
            <p className="text-textSecondary text-sm mt-1">Ready to test your computer science knowledge?</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
            ) : (
              <>
                <GlassCard hoverEffect={false} className="p-5 flex flex-col justify-between">
                  <div className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FiAward className="text-accentBlue" />
                    Current Score
                  </div>
                  <div className="text-2xl font-bold text-white">{user?.score ?? 0} <span className="text-xs text-textSecondary font-normal">pts</span></div>
                </GlassCard>

                <GlassCard hoverEffect={false} className="p-5 flex flex-col justify-between">
                  <div className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FiTrendingUp className="text-accentBlue" />
                    Global Rank
                  </div>
                  <div className="text-2xl font-bold text-white">#{user?.globalRank ?? 'N/A'}</div>
                </GlassCard>

                <GlassCard hoverEffect={false} className="p-5 flex flex-col justify-between">
                  <div className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FiGlobe className="text-accentBlue" />
                    Regional Rank
                  </div>
                  <div className="text-2xl font-bold text-white">#{user?.regionalRank ?? 'N/A'}</div>
                </GlassCard>

                <GlassCard hoverEffect={false} className="p-5 flex flex-col justify-between">
                  <div className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FiLayers className="text-accentBlue" />
                    Quiz Attempts
                  </div>
                  <div className="text-2xl font-bold text-white">{attempts}</div>
                </GlassCard>
              </>
            )}
          </div>

          {/* Main Challenge Card */}
          <GlassCard className="glass-glow relative overflow-hidden p-8 md:p-10 border border-accentBlue/25 mb-8">
            {/* Ambient background glow */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-accentBlue/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-xl">
              <span className="px-3 py-1 rounded-full bg-accentBlue/10 border border-accentBlue/20 text-xs font-semibold text-accentBlue mb-6 inline-block">
                Weekly Challenge
              </span>
              <h2 className="text-3xl font-extrabold text-white mb-3">CS Quiz Challenge</h2>
              <p className="text-textSecondary text-sm leading-relaxed mb-6">
                Test your knowledge across core Computer Science domains including Data Structures, Object-Oriented Programming, Operating Systems, Database Management, and Networking.
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8 text-xs">
                <div>
                  <div className="text-textSecondary mb-1">Difficulty</div>
                  <div className="font-bold text-white">Intermediate</div>
                </div>
                <div>
                  <div className="text-textSecondary mb-1">Questions</div>
                  <div className="font-bold text-white">10 Randomized</div>
                </div>
                <div>
                  <div className="text-textSecondary mb-1">Time Limit</div>
                  <div className="font-bold text-white">10 Minutes</div>
                </div>
              </div>

              <Button onClick={() => navigate('/quiz')} className="px-8 py-3 text-sm font-semibold">
                <FiPlay /> Start CS Quiz
              </Button>
            </div>
          </GlassCard>
        </main>
      </div>
    </div>
  );
}
