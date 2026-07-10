import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import { FiCheck, FiCpu, FiTrendingUp, FiZap, FiDatabase, FiShuffle } from 'react-icons/fi';

export default function Landing() {
  const features = [
    {
      title: "Real-time Leaderboard",
      desc: "Instantaneous cache updates broadcasted across sharded tables and global zsets in Upstash Redis.",
      icon: FiZap
    },
    {
      title: "Regional DB Sharding",
      desc: "Distributed database schema partitioned across five continents (Asia, Europe, America, Africa, Australia) to guarantee latency resilience.",
      icon: FiDatabase
    },
    {
      title: "Kafka Event-Driven Pipes",
      desc: "Decoupled microservice architecture communicating via asynchronous high-throughput Apache Kafka event topics.",
      icon: FiCpu
    },
    {
      title: "At-Least-Once Delivery",
      desc: "Resilient consumer groups with error propagation, re-connections, and absolute state offset commits.",
      icon: FiShuffle
    }
  ];

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-x-hidden">
      {/* Navbar placeholder */}
      <header className="glass sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between border-b border-borderLight">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accentBlue flex items-center justify-center text-white font-bold shadow-glow">
            <FiCpu className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Codedale</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-textSecondary hover:text-white transition-colors">Login</Link>
          <Link to="/signup" className="px-5 py-2 rounded-full accent-gradient text-sm font-medium text-white shadow-glow hover:brightness-110 transition-all">Get Started</Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-20 w-full">
        <section className="text-center relative mb-32">
          {/* Neon Glow Blur */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-accentBlue/20 rounded-full blur-[120px] pointer-events-none -z-10" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto">
              The Premium Gamified <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accentBlue to-indigo-400">CS Leaderboard Platform</span>
            </h1>
            <p className="text-textSecondary text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Showcase CS prowess, compete in database-sharded challenges, and view real-time rankings powered by Kafka event-driven pipelines.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/signup" className="w-full sm:w-auto px-8 py-3 rounded-full accent-gradient text-white font-semibold text-sm shadow-glow hover:brightness-110 active:scale-95 transition-all text-center">
                Create Account
              </Link>
              <Link to="/login" className="w-full sm:w-auto px-8 py-3 rounded-full bg-white/5 border border-borderLight hover:bg-white/10 text-white font-semibold text-sm active:scale-95 transition-all text-center">
                Sign In
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Feature Cards Grid */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-4">Under the Hood Architecture</h2>
          <p className="text-textSecondary text-center max-w-lg mx-auto mb-16">
            Leveraging state-of-the-art backend designs to process high-throughput events efficiently.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <GlassCard key={idx} className="flex flex-col justify-between h-64 hover:border-accentBlue/20">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-accentBlue/10 border border-accentBlue/20 flex items-center justify-center mb-6 text-accentBlue">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                    <p className="text-textSecondary text-xs leading-relaxed">{feat.desc}</p>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Interactive Architecture SVG Diagram */}
        <section className="mb-32">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-4">Event-Driven Pipe Pipeline</h2>
          <p className="text-textSecondary text-center max-w-lg mx-auto mb-16">
            This diagram demonstrates the live routing paths from score submission to redis caching and notifier consumers.
          </p>

          <GlassCard hoverEffect={false} className="p-8 border border-white/[0.08] relative overflow-hidden bg-surfaceDark/30">
            <div className="absolute inset-0 bg-gradient-to-r from-accentBlue/5 to-purple-500/5 blur-3xl pointer-events-none -z-10" />
            
            {/* SVG Diagram */}
            <svg viewBox="0 0 1000 420" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto text-textPrimary select-none">
              {/* Clients Box */}
              <rect x="20" y="160" width="120" height="80" rx="12" fill="#1C1C1E" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              <text x="80" y="205" fill="#FAFAFA" fontSize="14" fontWeight="bold" textAnchor="middle">React Clients</text>
              
              {/* API Gateway */}
              <rect x="220" y="140" width="120" height="120" rx="12" fill="#1C1C1E" stroke="#3B82F6" strokeWidth="2" />
              <text x="280" y="195" fill="#FAFAFA" fontSize="14" fontWeight="bold" textAnchor="middle">API Gateway</text>
              <text x="280" y="215" fill="#A1A1A6" fontSize="11" textAnchor="middle">Reverse Proxy</text>
              
              {/* Write Service */}
              <rect x="420" y="50" width="120" height="90" rx="12" fill="#161616" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              <text x="480" y="95" fill="#FAFAFA" fontSize="13" fontWeight="bold" textAnchor="middle">Write Service</text>
              <text x="480" y="115" fill="#3B82F6" fontSize="10" textAnchor="middle">PostgreSQL Shards</text>

              {/* Kafka Broker */}
              <rect x="620" y="150" width="120" height="100" rx="12" fill="#3B82F6" fillOpacity="0.1" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 4" />
              <text x="680" y="200" fill="#3B82F6" fontSize="14" fontWeight="bold" textAnchor="middle">Kafka Topic</text>
              <text x="680" y="220" fill="#FAFAFA" fontSize="11" textAnchor="middle">score-updated</text>

              {/* Consumers */}
              <rect x="820" y="30" width="140" height="70" rx="12" fill="#1C1C1E" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              <text x="890" y="65" fill="#FAFAFA" fontSize="12" fontWeight="bold" textAnchor="middle">Read Service (Redis)</text>
              
              <rect x="820" y="160" width="140" height="70" rx="12" fill="#1C1C1E" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              <text x="890" y="195" fill="#FAFAFA" fontSize="12" fontWeight="bold" textAnchor="middle">Analytics Service</text>

              <rect x="820" y="290" width="140" height="70" rx="12" fill="#1C1C1E" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              <text x="890" y="325" fill="#FAFAFA" fontSize="12" fontWeight="bold" textAnchor="middle">Notifier Service</text>

              {/* Arrows / Paths */}
              <path d="M 140 200 L 220 200" stroke="#3B82F6" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
              <path d="M 340 180 L 420 100" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" fill="none" />
              <path d="M 540 100 L 620 180" stroke="#3B82F6" strokeWidth="2" fill="none" />
              
              {/* Subscription Arrows */}
              <path d="M 740 200 L 820 70" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
              <path d="M 740 200 L 820 195" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
              <path d="M 740 200 L 820 320" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />

              {/* Gateway to Read Service (Direct path for GET ranking queries) */}
              <path d="M 280 260 L 280 370 L 800 370 L 880 100" stroke="#10B981" strokeWidth="2" strokeDasharray="3 3" fill="none" />
              <text x="430" y="360" fill="#10B981" fontSize="11">Direct Read Path (Upstash ZSET Queries)</text>
              
              {/* Arrow Marker Definitions */}
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                </marker>
              </defs>
            </svg>
          </GlassCard>
        </section>

        {/* CTA section */}
        <section className="text-center relative py-16 mb-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accentBlue/10 rounded-full blur-[80px] pointer-events-none -z-10" />
          <GlassCard className="max-w-3xl mx-auto border border-accentBlue/20 p-12">
            <h2 className="text-3xl font-extrabold mb-4">Ready to test your CS skill boundaries?</h2>
            <p className="text-textSecondary text-sm max-w-lg mx-auto mb-8">
              Join students worldwide, scale the leaderboard shards, and see how our event pipelines process your results.
            </p>
            <Link to="/signup" className="px-8 py-3 rounded-full accent-gradient text-white font-bold text-sm shadow-glow hover:brightness-110 active:scale-95 transition-all inline-block">
              Register Now
            </Link>
          </GlassCard>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass border-t border-borderLight px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-textSecondary">
          <div>
            <span className="font-bold text-white">Codedale</span> © 2026. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Repository</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
