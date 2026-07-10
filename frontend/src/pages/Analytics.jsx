import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserAnalytics } from '../api/analytics';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import { StatSkeleton } from '../components/Skeletons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { FiTrendingUp, FiCpu, FiAward, FiPieChart } from 'react-icons/fi';

export default function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;
      try {
        const res = await getUserAnalytics(user.id);
        if (res.success && res.data) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, [user?.id]);

  // Map history to chart logs
  const chartData = analytics?.history?.map((log, idx) => ({
    name: `Quiz ${idx + 1}`,
    score: log.score,
    rank: log.rank
  })) || [];

  const highestScore = analytics?.history?.reduce((max, log) => Math.max(max, log.score), 0) || 0;
  const currentPercentile = analytics?.percentile ? Math.round(analytics.percentile * 100) : 'N/A';

  return (
    <div className="min-h-screen bg-bgDark flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-grow">
        <Sidebar />
        <main className="flex-grow p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
          
          <div className="mb-4">
            <h1 className="text-3xl font-extrabold tracking-tight">Performance Analytics</h1>
            <p className="text-textSecondary text-sm">Visualize your progress and backend processing metrics</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <GlassCard hoverEffect={false} className="p-5 flex flex-col justify-between">
                <div className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FiPieChart className="text-accentBlue" />
                  Percentile Placement
                </div>
                <div className="text-2xl font-bold text-white">
                  {currentPercentile === 'N/A' ? 'N/A' : `${currentPercentile}%`}
                  {currentPercentile !== 'N/A' && <span className="text-[10px] text-emerald-400 font-normal ml-2">Top {100 - currentPercentile}%</span>}
                </div>
              </GlassCard>

              <GlassCard hoverEffect={false} className="p-5 flex flex-col justify-between">
                <div className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FiAward className="text-accentBlue" />
                  Peak High Score
                </div>
                <div className="text-2xl font-bold text-white">{highestScore} <span className="text-xs text-textSecondary font-normal">pts</span></div>
              </GlassCard>

              <GlassCard hoverEffect={false} className="p-5 flex flex-col justify-between">
                <div className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FiTrendingUp className="text-accentBlue" />
                  Kafka Messages
                </div>
                <div className="text-2xl font-bold text-white">{analytics?.totalPlays ?? 0} <span className="text-xs text-textSecondary font-normal">events</span></div>
              </GlassCard>

              <GlassCard hoverEffect={false} className="p-5 flex flex-col justify-between">
                <div className="text-textSecondary text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FiCpu className="text-accentBlue" />
                  Pipeline Shard
                </div>
                <div className="text-2xl font-bold text-white uppercase text-sm mt-1">{user?.region} Shard</div>
              </GlassCard>
            </div>
          )}

          {/* Area Chart visualization */}
          <GlassCard hoverEffect={false} className="p-6 border border-white/[0.08]">
            <h3 className="text-lg font-bold mb-6 text-white flex items-center gap-2">
              <FiTrendingUp className="text-accentBlue" />
              Score Progression History
            </h3>

            {loading ? (
              <div className="h-72 w-full bg-white/5 animate-pulse rounded-xl" />
            ) : chartData.length === 0 ? (
              <div className="text-center text-xs text-textSecondary py-20">No progression data available. Finish a quiz to trigger events!</div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                    <XAxis dataKey="name" stroke="#A1A1A6" fontSize={10} tickLine={false} />
                    <YAxis stroke="#A1A1A6" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#1C1C1E', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                      labelStyle={{ color: '#FAFAFA', fontWeight: 'bold', fontSize: '12px' }}
                      itemStyle={{ color: '#3B82F6', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreGlow)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>

        </main>
      </div>
    </div>
  );
}
