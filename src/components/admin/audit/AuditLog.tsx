import React, { useState, useEffect } from 'react';
import { Search, Download, Shield } from 'lucide-react';
import { AuditStore } from '../../../lib/admin/store';
import { formatDateTime, exportCSV } from '../../../lib/admin/utils';
import type { AuditEntry, AuditAction } from '../../../lib/admin/types';

const ACTION_STYLES: Record<AuditAction, string> = {
  create:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  update:  'bg-blue-50 text-blue-700 border-blue-200',
  delete:  'bg-red-50 text-red-700 border-red-200',
  login:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  logout:  'bg-gray-100 text-gray-600 border-gray-200',
  export:  'bg-amber-50 text-amber-700 border-amber-200',
  view:    'bg-purple-50 text-purple-700 border-purple-200',
};

const ENTITY_ICON: Record<string, string> = {
  client: '👤', project: '📁', revenue: '💰', expense: '💸',
  invoice: '📄', auth: '🔐', system: '⚙️',
};

export default function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    setEntries(AuditStore.getAll());
  }, []);

  const entities = ['all', ...new Set(entries.map(e => e.entity))];

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.details.toLowerCase().includes(q) || e.entity.toLowerCase().includes(q) || e.userEmail.toLowerCase().includes(q);
    const matchAction = actionFilter === 'all' || e.action === actionFilter;
    const matchEntity = entityFilter === 'all' || e.entity === entityFilter;
    return matchSearch && matchAction && matchEntity;
  });

  const handleExport = () => {
    exportCSV(filtered.map(e => ({
      Timestamp: formatDateTime(e.timestamp),
      User: e.userEmail,
      Action: e.action,
      Entity: e.entity,
      'Entity ID': e.entityId,
      Details: e.details,
    })), 'audit-log');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Audit Trail</p>
            <p className="text-xs text-gray-400">{entries.length} total records — last 2,000 entries retained</p>
          </div>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search audit entries..." className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
        </div>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value as typeof actionFilter)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none cursor-pointer">
          <option value="all">All Actions</option>
          {(['create', 'update', 'delete', 'login', 'logout', 'export', 'view'] as AuditAction[]).map(a => (
            <option key={a} value={a} className="capitalize">{a}</option>
          ))}
        </select>
        <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none cursor-pointer">
          {entities.map(e => <option key={e} value={e} className="capitalize">{e === 'all' ? 'All Entities' : e}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Timestamp', 'User', 'Action', 'Entity', 'Details'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">No audit entries found</td></tr>
              )}
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-mono text-xs">{formatDateTime(entry.timestamp)}</td>
                  <td className="py-3 px-4">
                    <p className="text-gray-700 font-medium text-xs truncate max-w-[140px]">{entry.userEmail}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border capitalize ${ACTION_STYLES[entry.action]}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 font-medium capitalize">
                      <span>{ENTITY_ICON[entry.entity] || '📋'}</span>
                      {entry.entity}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 max-w-[300px]">
                    <p className="truncate text-xs">{entry.details}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">
          Showing {filtered.length} of {entries.length} entries
        </div>
      </div>
    </div>
  );
}
