import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiTrendingUp, FiUser, FiHelpCircle, FiAward } from 'react-icons/fi';

export default function Sidebar() {
  const links = [
    { to: '/home', label: 'Dashboard', icon: FiHome },
    { to: '/quiz', label: 'Play Quiz', icon: FiHelpCircle },
    { to: '/leaderboard', label: 'Leaderboard', icon: FiAward },
    { to: '/analytics', label: 'Analytics', icon: FiTrendingUp },
    { to: '/profile', label: 'My Profile', icon: FiUser }
  ];

  return (
    <aside className="w-full md:w-64 glass border-r border-borderLight md:h-[calc(100vh-73px)] p-6 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible shrink-0 sticky top-[73px]">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 shrink-0 ${isActive
                ? 'bg-accentBlue/10 text-accentBlue border border-accentBlue/20 shadow-glow'
                : 'text-textSecondary hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            <span className="md:inline">{link.label}</span>
          </NavLink>
        );
      })}
    </aside>
  );
}
