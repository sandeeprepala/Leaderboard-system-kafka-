import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiCpu } from 'react-icons/fi';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error('Please fill in all fields');
    }

    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      toast.success('Logged in successfully!');
      navigate('/home');
    } else {
      toast.error(res.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative bg-bgDark">
      {/* Neon background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accentBlue/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-accentBlue flex items-center justify-center text-white font-bold shadow-glow mb-3">
            <FiCpu className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="text-textSecondary text-xs mt-1">Sign in to resume your leaderboard climb</p>
        </div>

        <GlassCard hoverEffect={false} className="border border-white/[0.08] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-borderLight rounded-xl text-sm font-medium text-white focus:outline-none focus:border-accentBlue focus:bg-white/[0.08] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-textSecondary" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-borderLight rounded-xl text-sm font-medium text-white focus:outline-none focus:border-accentBlue focus:bg-white/[0.08] transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-textSecondary">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" className="rounded bg-white/5 border-borderLight text-accentBlue focus:ring-0" />
                Remember Me
              </label>
              <a href="#" className="hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); toast('Forgot password simulation: Check database password hash!'); }}>Forgot Password?</a>
            </div>

            <Button type="submit" loading={loading} className="w-full py-3 text-sm font-semibold mt-4">
              Login to Platform
            </Button>
          </form>
        </GlassCard>

        <p className="text-center text-xs text-textSecondary mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-accentBlue hover:underline">Register here</Link>
        </p>
      </motion.div>
    </div>
  );
}
