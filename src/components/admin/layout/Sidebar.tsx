import React from 'react';
import {
  LayoutDashboard, Users, FolderKanban, DollarSign,
  FileText, BarChart2, ScrollText, Briefcase, FileSignature,
  LogOut, ChevronRight,
} from 'lucide-react';
import type { AdminSession } from '../../../lib/admin/types';

export type AdminView =
  | 'dashboard' | 'clients' | 'projects' | 'financial'
  | 'invoices' | 'analytics' | 'audit' | 'careers' | 'quotations';

interface NavItem {
  id: AdminView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group?: string;
}

const NAV: NavItem[] = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard, group: 'Overview' },
  { id: 'analytics',   label: 'Analytics',    icon: BarChart2,       group: 'Overview' },
  { id: 'clients',     label: 'Clients',      icon: Users,           group: 'Business' },
  { id: 'projects',    label: 'Projects',     icon: FolderKanban,    group: 'Business' },
  { id: 'financial',   label: 'Financial',    icon: DollarSign,      group: 'Finance' },
  { id: 'invoices',    label: 'Invoices',     icon: FileText,        group: 'Finance' },
  { id: 'quotations',  label: 'Quotations',   icon: FileSignature,   group: 'Finance' },
  { id: 'careers',     label: 'Careers',      icon: Briefcase,       group: 'Admin' },
  { id: 'audit',       label: 'Audit Log',    icon: ScrollText,      group: 'Admin' },
];

interface Props {
  active: AdminView;
  session: AdminSession;
  onNavigate: (view: AdminView) => void;
  onLogout: () => void;
}

export default function Sidebar({ active, session, onNavigate, onLogout }: Props) {
  const groups = [...new Set(NAV.map(n => n.group))];

  return (
    <aside className="w-64 shrink-0 bg-[#050505] min-h-screen flex flex-col border-r border-white/5 print:hidden">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-sm">S</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">SynVoke</p>
            <p className="text-indigo-400 text-[10px] font-mono uppercase tracking-widest mt-0.5">Admin Command</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {groups.map(group => (
          <div key={group}>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-600 px-3 mb-1.5">{group}</p>
            <div className="space-y-0.5">
              {NAV.filter(n => n.group === group).map(item => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-white/5 space-y-2">
        <div className="px-3 py-2">
          <p className="text-white text-sm font-semibold truncate">{session.name}</p>
          <p className="text-gray-500 text-xs truncate">{session.email}</p>
          <span className="mt-1.5 inline-block px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-widest">
            {session.role}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
