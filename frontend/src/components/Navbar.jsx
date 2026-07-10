import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FiLogOut, FiGlobe, FiCpu, FiSun, FiMoon } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass sticky top-0 z-40 w-full border-b border-borderLight px-6 py-4 flex items-center justify-between">
      <Link to={user ? "/home" : "/"} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-accentBlue flex items-center justify-center text-white font-bold shadow-glow">
          <FiCpu className="w-5 h-5 animate-pulse" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white">UpRank</span>
      </Link>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-white/5 border border-transparent hover:border-borderLight text-textSecondary hover:text-white transition-all"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4 text-indigo-500" />}
        </button>
        {user ? (
          <>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-borderLight text-xs text-textSecondary">
              <FiGlobe className="text-accentBlue" />
              <span className="capitalize">{user.region} Region</span>
            </div>

            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-all">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accentBlue to-indigo-500 flex items-center justify-center text-xs font-bold text-white uppercase border border-white/20">
                {user.username.substring(0, 2)}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-textPrimary">{user.username}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-white/5 border border-transparent hover:border-borderLight text-textSecondary hover:text-red-400 transition-all"
              title="Logout"
            >
              <FiLogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-textSecondary hover:text-white transition-colors">Login</Link>
            <Link to="/signup" className="px-4 py-2 rounded-full accent-gradient text-sm font-medium text-white shadow-glow hover:brightness-110 transition-all">Get Started</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
