import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Mic, 
  Brain, 
  CheckSquare, 
  Eye, 
  Monitor, 
  Home, 
  Settings, 
  X,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { NavTab } from '../types';
import { playSciFiSound } from '../utils/audio';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  soundEnabled: boolean;
  tasksCount: number;
  memoryCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  soundEnabled,
  tasksCount,
  memoryCount,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    description: string;
  }> = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Holographic Overview & Core HUD',
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: MessageSquare,
      description: 'Neural Dialogue & Web Grounding',
    },
    {
      id: 'voice',
      label: 'Voice Assistant',
      icon: Mic,
      description: 'Acoustic Comms & Synthesis',
    },
    {
      id: 'memory',
      label: 'Memory Bank',
      icon: Brain,
      badge: memoryCount > 0 ? memoryCount : undefined,
      description: 'User Preferences & Recall',
    },
    {
      id: 'tasks',
      label: 'Tasks & Sched',
      icon: CheckSquare,
      badge: tasksCount > 0 ? tasksCount : undefined,
      description: 'Temporal Manager & Reminders',
    },
    {
      id: 'vision',
      label: 'Optical Vision',
      icon: Eye,
      description: 'Multimodal Image Diagnostics',
    },
    {
      id: 'desktop',
      label: 'Desktop Control',
      icon: Monitor,
      description: 'System Links & Companion Bridge',
    },
    {
      id: 'smarthome',
      label: 'Smart Facility',
      icon: Home,
      description: 'Holographic Home Automation',
    },
    {
      id: 'settings',
      label: 'System Config',
      icon: Settings,
      description: 'Voice Synthesis & Core Protocols',
    },
  ];

  const handleSelect = (tab: NavTab) => {
    if (soundEnabled) playSciFiSound('click');
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-[#030712]/95 border-r border-cyan-500/20 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Branding on Mobile */}
        <div>
          <div className="p-4 flex items-center justify-between border-b border-cyan-500/15 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-orbitron font-bold text-cyan-300 tracking-wider">
                J.A.R.V.I.S. HUD
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Holographic Arc Reactor Mini Badge in Desktop Sidebar */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-3 mx-3 my-2 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-transparent border border-cyan-500/25">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00e5ff] animate-ping" />
            <div className="text-[11px] font-mono text-cyan-300 tracking-wider">
              ONLINE // PROTOCOL MK-85
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group relative overflow-hidden ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-slate-900 border border-cyan-400/60 shadow-[0_0_15px_rgba(0,210,255,0.2)] text-cyan-200'
                      : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/25 hover:border hover:border-cyan-500/20 border border-transparent'
                  }`}
                >
                  {/* Left Active Glow Bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-1 bg-cyan-400 rounded-r shadow-[0_0_8px_#00e5ff]" />
                  )}

                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-cyan-300 drop-shadow-[0_0_6px_#00e5ff]' : 'text-slate-500 group-hover:text-cyan-400'
                      }`}
                    />
                    <div>
                      <div className="font-medium text-sm tracking-wide">
                        {item.label}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400/50 leading-tight hidden xl:block">
                        {item.description}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom System Banner */}
        <div className="p-3 m-3 rounded-xl bg-slate-900/60 border border-cyan-500/20 text-xs font-mono">
          <div className="flex items-center gap-2 mb-1.5 text-cyan-300">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-[11px] tracking-wider uppercase">Free-Tier Active</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Operating via Google Gemini 3.8 Flash free tier & native browser web APIs. Zero paid services required.
          </p>
        </div>
      </aside>
    </>
  );
};
