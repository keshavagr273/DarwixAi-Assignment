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
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

interface NavGroup {
  label: string;
  items: {
    name: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { name: 'Mission Control', path: '/', icon: LayoutDashboard },
      { name: 'Live Copilot', path: '/live', icon: Zap },
      { name: 'Voice Studio', path: '/agent', icon: Bot },
    ],
  },
  {
    label: 'Knowledge & RAG',
    items: [
      { name: 'Knowledge Studio', path: '/kb', icon: Database },
      { name: 'Retrieval Lab', path: '/retrieval', icon: Search },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { name: 'Language Packs', path: '/markets', icon: Globe2 },
      { name: 'ASR Engineering', path: '/asr', icon: Mic },
    ],
  },
  {
    label: 'Observability',
    items: [
      { name: 'Call Library', path: '/calls', icon: PhoneCall },
      { name: 'Evaluation', path: '/evaluation', icon: BarChart3 },
      { name: 'Architecture', path: '/architecture', icon: Layers },
      { name: 'Compliance & Gaps', path: '/gaps', icon: AlertTriangle },
      { name: 'Product Tour', path: '/demo', icon: PlaySquare },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`bg-[#0E1424] border-r border-[#1F293D] flex flex-col transition-all duration-200 select-none z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation items list grouped logically */}
      <div className="flex-1 py-4 px-3 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </div>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-100 relative group outline-none focus:outline-none focus-visible:outline-none border ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 font-semibold border-indigo-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#141C30] border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-colors duration-100 ${
                          isActive
                            ? 'text-indigo-400'
                            : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate flex-1">{item.name}</span>
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-[#141C30] text-slate-200 text-xs rounded-lg border border-[#1F293D] shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                          {item.name}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Clean Status Pill */}
      {!collapsed && (
        <div className="p-3 mx-3 mb-3 bg-[#141C30]/80 border border-[#1F293D] rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Fail-Closed Safety</span>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
            Active
          </span>
        </div>
      )}

      {/* Collapse toggle */}
      <div className="p-3 border-t border-[#1F293D] flex items-center justify-between">
        {!collapsed && (
          <span className="text-[11px] text-slate-400 font-medium pl-1">Collapse Menu</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-[#141C30] rounded-lg transition-colors duration-100 ml-auto outline-none focus:outline-none focus-visible:outline-none border border-transparent"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
