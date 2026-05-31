import React, { useEffect, useState } from 'react';
import { Clock, RefreshCw } from 'lucide-react';
import { getSessionTimeLeft, refreshSession } from '../../../lib/admin/auth';
import { formatDuration } from '../../../lib/admin/utils';
import type { AdminView } from './Sidebar';

const PAGE_TITLES: Record<AdminView, string> = {
  dashboard:  'Founder Dashboard',
  analytics:  'Business Analytics',
  clients:    'Client Management',
  projects:   'Project Tracker',
  financial:  'Financial Module',
  invoices:   'Invoice Manager',
  quotations: 'Quotations',
  careers:    'Talent Acquisition',
  audit:      'Audit Log',
};

interface Props {
  view: AdminView;
}

export default function Header({ view }: Props) {
  const [timeLeft, setTimeLeft] = useState(getSessionTimeLeft());

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getSessionTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  const pct = (timeLeft / (30 * 60 * 1000)) * 100;
  const isWarning = timeLeft < 5 * 60 * 1000;

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-6 print:hidden">
      <div>
        <h1 className="text-lg font-bold text-gray-900 leading-none">{PAGE_TITLES[view]}</h1>
        <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Session timer */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold ${
          isWarning ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          <Clock className="w-3.5 h-3.5" />
          <span>Session: {formatDuration(timeLeft)}</span>
          {/* mini progress bar */}
          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isWarning ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <button
          onClick={refreshSession}
          title="Extend session"
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
