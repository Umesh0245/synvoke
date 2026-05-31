import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { ProjectStore, ClientStore } from '../../../lib/admin/store';
import { formatINR, formatDate, exportCSV } from '../../../lib/admin/utils';
import type { Project, ProjectStatus, AdminSession, Client } from '../../../lib/admin/types';

const STATUS_STYLES: Record<ProjectStatus, string> = {
  planning:   'bg-blue-50 text-blue-700 border-blue-200',
  active:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed:  'bg-gray-100 text-gray-600 border-gray-200',
  'on-hold':  'bg-amber-50 text-amber-700 border-amber-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
};

const EMPTY: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'clientName'> = {
  clientId: '', name: '', description: '', budget: 0, actualCost: 0,
  status: 'planning', completionPercentage: 0, startDate: '', endDate: '',
};

interface Props { session: AdminSession; }

export default function ProjectManager({ session }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [modal, setModal] = useState<'none' | 'form' | 'detail'>('none');
  const [editing, setEditing] = useState<Project | null>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const reload = () => { setProjects(ProjectStore.getAll()); setClients(ClientStore.getAll()); };
  useEffect(() => { reload(); }, []);

  const filtered = projects.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.clientName || '').toLowerCase().includes(q);
    const matchFilter = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchFilter;
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal('form'); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ clientId: p.clientId, name: p.name, description: p.description, budget: p.budget, actualCost: p.actualCost, status: p.status, completionPercentage: p.completionPercentage, startDate: p.startDate?.split('T')[0] || '', endDate: p.endDate?.split('T')[0] || '' });
    setModal('form');
  };
  const openDetail = (p: Project) => { setSelected(p); setModal('detail'); };
  const closeModal = () => { setModal('none'); setEditing(null); setSelected(null); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, startDate: form.startDate ? new Date(form.startDate).toISOString() : '', endDate: form.endDate ? new Date(form.endDate).toISOString() : '' };
    if (editing) {
      ProjectStore.update(editing.id, data, session);
    } else {
      ProjectStore.create(data, session);
    }
    reload();
    closeModal();
  };

  const handleDelete = (id: string) => {
    ProjectStore.delete(id, session);
    reload();
    setDeleteConfirm(null);
    if (modal === 'detail') closeModal();
  };

  const handleExport = () => {
    exportCSV(projects.map(p => ({
      Name: p.name, Client: p.clientName, Status: p.status,
      Budget: p.budget, 'Actual Cost': p.actualCost,
      'Profit/Loss': p.budget - p.actualCost,
      Completion: `${p.completionPercentage}%`,
      Start: p.startDate ? formatDate(p.startDate) : '', End: p.endDate ? formatDate(p.endDate) : '',
    })), 'projects');
  };

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalCost = projects.reduce((s, p) => s + p.actualCost, 0);
  const totalProfit = totalBudget - totalCost;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: projects.length },
          { label: 'Active', value: projects.filter(p => p.status === 'active').length },
          { label: 'Total Budget', value: formatINR(totalBudget) },
          { label: 'Net P&L', value: formatINR(totalProfit), positive: totalProfit >= 0 },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              {'positive' in s && (s.positive
                ? <TrendingUp className="w-4 h-4 text-emerald-500" />
                : <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none cursor-pointer">
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleExport} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">Export CSV</button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Project
          </button>
        </div>
      </div>

      {/* Project Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-2 bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm">No projects found</div>
        )}
        {filtered.map(p => {
          const profit = p.budget - p.actualCost;
          const profitPct = p.budget > 0 ? (profit / p.budget) * 100 : 0;
          return (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.clientName}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[p.status]}`}>{p.status}</span>
                  <button onClick={() => openDetail(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              {/* Completion bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Completion</span>
                  <span className="font-bold text-gray-700">{p.completionPercentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${p.completionPercentage}%` }} />
                </div>
              </div>

              {/* Financial summary */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Budget</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{formatINR(p.budget)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-2">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Cost</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{formatINR(p.actualCost)}</p>
                </div>
                <div className={`rounded-xl p-2 ${profit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Profit</p>
                  <p className={`text-sm font-bold mt-0.5 ${profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatINR(profit)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Modal */}
      {modal === 'form' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Project Name *</label>
                  <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="Project name" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Client *</label>
                  <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400">
                    <option value="">Select a client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Budget (₹)</label>
                  <input type="number" min={0} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Actual Cost (₹)</label>
                  <input type="number" min={0} value={form.actualCost} onChange={e => setForm(f => ({ ...f, actualCost: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400">
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Completion %</label>
                  <input type="number" min={0} max={100} value={form.completionPercentage} onChange={e => setForm(f => ({ ...f, completionPercentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm">{editing ? 'Save Changes' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal (same as edit) */}
      {modal === 'detail' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">Project Detail</h2>
              <button onClick={closeModal} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="font-bold text-lg text-gray-900 mb-1">{selected.name}</p>
            <p className="text-sm text-gray-500 mb-4">{selected.clientName}</p>
            <div className="flex gap-2">
              <button onClick={() => openEdit(selected)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold">Edit</button>
              <button onClick={() => setDeleteConfirm(selected.id)} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Project?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
