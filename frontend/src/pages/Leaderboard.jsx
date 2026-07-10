import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLeaderboard } from '../context/LeaderboardContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { ListSkeleton } from '../components/Skeletons';
import { FiAward, FiGlobe, FiRefreshCw, FiZap } from 'react-icons/fi';

export default function Leaderboard() {
  const { user } = useAuth();
  const { globalLeaderboard, regionalLeaderboard, refreshLeaderboards, loading } = useLeaderboard();
  const [tab, setTab] = useState('global');

  const activeLeaderboard = tab === 'global' ? globalLeaderboard : regionalLeaderboard;

  // Split top 3 for the visual podium
  const topThree = activeLeaderboard.slice(0, 3);

  // Position colors for the podium cards
  const podiumStyles = [
    { border: 'border-amber-400/40 bg-amber-400/5', iconColor: 'text-amber-400', rank: '1st', bgGlow: 'from-amber-400/10' },
    { border: 'border-slate-300/40 bg-slate-300/5', iconColor: 'text-slate-300', rank: '2nd', bgGlow: 'from-slate-300/10' },
    { border: 'border-amber-600/40 bg-amber-600/5', iconColor: 'text-amber-600', rank: '3rd', bgGlow: 'from-amber-600/10' }
  ];

  return (
    <div className="min-h-screen bg-bgDark flex flex-col">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-grow">
        <Sidebar />
        <main className="flex-grow p-6 md:p-8 max-w-5xl mx-auto w-full space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Leaderboard Standings</h1>
              <p className="text-textSecondary text-sm">Real-time global and regional rankings across shards</p>
            </div>
            <Button variant="outline" onClick={refreshLeaderboards} loading={loading}>
              <FiRefreshCw /> Refresh
            </Button>
          </div>

          {/* Large Tab Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-white/5 p-1.5 rounded-2xl border border-borderLight max-w-md">
            <button
              onClick={() => setTab('global')}
              className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                tab === 'global' ? 'bg-accentBlue text-white shadow-glow' : 'text-textSecondary hover:text-white'
              }`}
            >
              <FiZap /> Global Ranks
            </button>
            <button
              onClick={() => setTab('regional')}
              className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                tab === 'regional' ? 'bg-accentBlue text-white shadow-glow' : 'text-textSecondary hover:text-white'
              }`}
            >
              <FiGlobe /> {user?.region} Region
            </button>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
              <ListSkeleton rows={8} />
            </div>
          ) : (
            <>
              {/* Podium (Top 3 Players) */}
              {topThree.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {podiumStyles.slice(0, topThree.length).map((style, index) => {
                    const player = topThree[index];
                    const isCurrentUser = player.username === user?.username;
                    return (
                      <GlassCard
                        key={player.username}
                        hoverEffect={true}
                        className={`border ${style.border} relative overflow-hidden flex flex-col items-center text-center p-6 bg-gradient-to-t ${style.bgGlow} to-transparent`}
                      >
                        <div className={`text-3xl font-extrabold mb-2 ${style.iconColor}`}>{style.rank}</div>
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/20 flex items-center justify-center font-bold text-lg uppercase text-white mb-3">
                          {player.username.substring(0, 2)}
                        </div>
                        <div className={`font-bold text-white text-base truncate max-w-full ${isCurrentUser ? 'underline decoration-accentBlue decoration-2' : ''}`}>
                          {player.username}
                        </div>
                        <div className="text-textSecondary text-xs mt-1">{player.score} pts</div>
                      </GlassCard>
                    );
                  })}
                </div>
              )}

              {/* Leaderboard Table List */}
              <GlassCard hoverEffect={false} className="border border-white/[0.08] p-6">
                <div className="space-y-3">
                  {activeLeaderboard.length === 0 ? (
                    <div className="text-center text-xs text-textSecondary py-20">No rankings found on this shard. Complete a challenge to register!</div>
                  ) : (
                    activeLeaderboard.map((row, idx) => {
                      const isCurrentUser = row.username === user?.username;
                      const isPodium = idx < 3;
                      return (
                        <div
                          key={row.username}
                          className={`flex items-center justify-between p-4 rounded-xl border text-sm font-medium transition-all ${
                            isCurrentUser
                              ? 'bg-accentBlue/10 border-accentBlue/40 text-white shadow-glow'
                              : 'bg-white/5 border-borderLight text-textSecondary'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${
                              isPodium
                                ? idx === 0
                                  ? 'bg-amber-400 text-black'
                                  : idx === 1
                                    ? 'bg-slate-300 text-black'
                                    : 'bg-amber-600 text-white'
                                : 'bg-white/5 text-textSecondary border border-borderLight'
                            }`}>
                              {idx + 1}
                            </div>
                            <span className={isCurrentUser ? 'font-bold text-white' : ''}>{row.username}</span>
                          </div>
                          <span className="font-bold text-white">{row.score} <span className="text-[10px] text-textSecondary font-normal">pts</span></span>
                        </div>
                      );
                    })
                  )}
                </div>
              </GlassCard>
            </>
          )}

        </main>
      </div>
    </div>
  );
}
