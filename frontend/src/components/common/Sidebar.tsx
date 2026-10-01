import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  Database,
  Search,
  Bot,
  Globe2,
  Mic,
  PhoneCall,
  BarChart3,
  Layers,
  AlertTriangle,
  PlaySquare,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
  hero?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Mission Control', path: '/', icon: LayoutDashboard },
  { name: 'Live Nudge Cockpit', path: '/live', icon: Zap, tag: 'HERO', hero: true },
  { name: 'KB Studio', path: '/kb', icon: Database, tag: 'Q2' },
  { name: 'Retrieval Lab', path: '/retrieval', icon: Search, tag: 'Q2' },
  { name: 'Voice Agent', path: '/agent', icon: Bot, tag: 'Q1' },
  { name: 'Market Packs', path: '/markets', icon: Globe2, tag: 'Q3' },
  { name: 'ASR Bench', path: '/asr', icon: Mic, tag: 'Q3' },
  { name: 'Call Library', path: '/calls', icon: PhoneCall },
  { name: 'Evaluation', path: '/evaluation', icon: BarChart3 },
  { name: 'Architecture', path: '/architecture', icon: Layers },
  { name: 'Gaps & Compliance', path: '/gaps', icon: AlertTriangle },
  { name: 'Demo Mode', path: '/demo', icon: PlaySquare, tag: 'TOUR' },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-[#121821] border-r border-[#243041] flex flex-col transition-all duration-200 select-none z-30 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Navigation items list */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-colors relative group ${
                  isActive
                    ? item.hero
                      ? 'bg-[#122329] text-[#4CC9F0] border border-[#4CC9F0]/40 font-semibold'
                      : 'bg-[#18212D] text-[#3DDC97] border border-[#243041] font-semibold'
                    : 'text-[#8A97A8] hover:text-[#E6EDF5] hover:bg-[#18212D]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? item.hero
                          ? 'text-[#4CC9F0]'
                          : 'text-[#3DDC97]'
                        : 'text-[#8A97A8] group-hover:text-[#E6EDF5]'
                    }`}
                  />
                  {!collapsed && (
                    <span className="truncate flex-1">{item.name}</span>
                  )}
                  {!collapsed && item.tag && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                        item.hero
                          ? 'bg-[#121E2A] text-[#4CC9F0] border border-[#4CC9F0]/40'
                          : 'bg-[#0B0F14] text-[#8A97A8] border border-[#243041]'
                      }`}
                    >
                      {item.tag}
                    </span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#18212D] text-[#E6EDF5] text-xs rounded border border-[#243041] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                      {item.name} {item.tag && `(${item.tag})`}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer / Principle badge */}
      {!collapsed && (
        <div className="p-3 mx-2 mb-2 bg-[#0B0F14] border border-[#243041] rounded text-[11px] font-mono space-y-1">
          <div className="flex items-center gap-1.5 text-[#3DDC97] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            FAIL-CLOSED RULE
          </div>
          <p className="text-[#8A97A8] leading-tight">
            Every claim has a receipt. Every suppressed alert has a reason.
          </p>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-2 border-t border-[#243041] flex justify-end">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-[#8A97A8] hover:text-[#E6EDF5] hover:bg-[#18212D] rounded transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
