import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserAnalytics } from '../api/analytics';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import { ListSkeleton } from '../components/Skeletons';
import { FiGlobe, FiAward, FiClock, FiActivity } from 'react-icons/fi';

export default function Profile() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      try {
        const res = await getUserAnalytics(user.id);
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Error loading profile analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-bgDark flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-grow">
        <Sidebar />
        <main className="flex-grow p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
          
          <div className="mb-4">
            <h1 className="text-3xl font-extrabold tracking-tight">Student Profile</h1>
            <p className="text-textSecondary text-sm">Review your achievements and system sync metrics</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: User Details Card */}
            <GlassCard hoverEffect={false} className="lg:col-span-1 border border-white/[0.08] p-6 space-y-6 flex flex-col justify-between">
              <div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-accentBlue to-indigo-500 flex items-center justify-center text-3xl font-extrabold text-white uppercase border border-white/20 mx-auto mb-6">
                  {user?.username.substring(0, 2)}
                </div>
                <h2 className="text-xl font-bold text-center text-white">{user?.username}</h2>
                <p className="text-textSecondary text-xs text-center lowercase mt-1">{user?.email}</p>
              </div>

              <div className="border-t border-borderLight pt-6 space-y-4 text-sm">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-textSecondary flex items-center gap-1.5"><FiGlobe /> Region</span>
                  <span className="font-semibold text-white capitalize">{user?.region}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-textSecondary flex items-center gap-1.5"><FiAward /> Current Score</span>
                  <span className="font-semibold text-white">{user?.score} pts</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-textSecondary flex items-center gap-1.5"><FiActivity /> Global Rank</span>
                  <span className="font-semibold text-white">#{user?.globalRank}</span>
                </div>
              </div>
            </GlassCard>

            {/* Right: Activity Logs / Shard History */}
            <GlassCard hoverEffect={false} className="lg:col-span-2 border border-white/[0.08] p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <FiClock className="text-accentBlue" />
                Score Synchronization Log
              </h3>

              {loading ? (
                <ListSkeleton rows={4} />
              ) : !analytics || !analytics.history || analytics.history.length === 0 ? (
                <div className="text-center text-xs text-textSecondary py-20">No sync entries found. Try starting a quiz!</div>
              ) : (
                <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {analytics.history.map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-borderLight text-xs">
                      <div>
                        <div className="font-semibold text-white">Score updated to {log.score} pts</div>
                        <div className="text-textSecondary text-[10px] mt-1">
                          Percentile: {log.percentile ? `${Math.round(log.percentile * 100)}%` : 'N/A'} • Rank: #{log.rank}
                        </div>
                      </div>
                      <div className="text-textSecondary text-[10px]">
                        {new Date(log.updatedAt).toLocaleDateString()} {new Date(log.updatedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

        </main>
      </div>
    </div>
  );
}
