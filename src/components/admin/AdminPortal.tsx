import { useState, useEffect, useCallback } from 'react';
import { getAdminSession, adminLogout, refreshSession, getSessionTimeLeft } from '../../lib/admin/auth';
import { seedIfEmpty, writeAudit } from '../../lib/admin/store';
import type { AdminSession } from '../../lib/admin/types';

import LoginPage from './auth/LoginPage';
import Sidebar, { type AdminView } from './layout/Sidebar';
import Header from './layout/Header';
import Dashboard from './dashboard/Dashboard';
import ClientManager from './clients/ClientManager';
import ProjectManager from './projects/ProjectManager';
import FinancialModule from './financial/FinancialModule';
import InvoiceManager from './InvoiceManager';
import Analytics from './analytics/Analytics';
import AuditLog from './audit/AuditLog';
import JobsManager from './JobsManager';
import QuotationManager from './QuotationManager';

// Add shared utility CSS classes to the document
const GLOBAL_STYLES = `
  .input-field { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.625rem 0.75rem; font-size: 0.875rem; color: #111827; transition: border-color 0.15s; outline: none; }
  .input-field:focus { border-color: #6366F1; box-shadow: 0 0 0 1px #6366F1; }
  .label-sm { display: block; font-size: 0.625rem; font-weight: 700; color: #4B5563; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.375rem; }
`;

export default function AdminPortal() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [ready, setReady] = useState(false);

  // Inject shared utility CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // On mount: seed data, restore session
  useEffect(() => {
    seedIfEmpty();
    const existing = getAdminSession();
    if (existing) setSession(existing);
    setReady(true);
  }, []);

  // Auto-refresh session on user activity
  useEffect(() => {
    const handle = () => refreshSession();
    window.addEventListener('mousemove', handle, { passive: true });
    window.addEventListener('keydown', handle, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handle);
      window.removeEventListener('keydown', handle);
    };
  }, []);

  // Auto-logout when session expires
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(() => {
      if (getSessionTimeLeft() <= 0) {
        handleLogout();
      }
    }, 10000); // check every 10s
    return () => clearInterval(interval);
  }, [session]);

  const handleLogin = useCallback((newSession: AdminSession) => {
    setSession(newSession);
    writeAudit(newSession, 'login', 'auth', newSession.userId, `Login from session ${newSession.token.slice(0, 8)}…`);
  }, []);

  const handleLogout = useCallback(() => {
    if (session) writeAudit(session, 'logout', 'auth', session.userId, 'User logged out');
    adminLogout();
    setSession(null);
    setActiveView('dashboard');
  }, [session]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        active={activeView}
        session={session}
        onNavigate={setActiveView}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header view={activeView} />

        <main className="flex-1 overflow-y-auto p-6">
          {activeView === 'dashboard'  && <Dashboard  session={session} />}
          {activeView === 'clients'    && <ClientManager session={session} />}
          {activeView === 'projects'   && <ProjectManager session={session} />}
          {activeView === 'financial'  && <FinancialModule session={session} />}
          {activeView === 'invoices'   && <InvoiceManager session={session} />}
          {activeView === 'analytics'  && <Analytics />}
          {activeView === 'audit'      && <AuditLog />}
          {activeView === 'careers'    && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6">
              <JobsManager />
            </div>
          )}
          {activeView === 'quotations' && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden p-6">
              <QuotationManager />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
