import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, User, Mail, Phone, MapPin, FileText, ChevronDown } from 'lucide-react';
import { ClientStore } from '../../../lib/admin/store';
import { formatINR, formatDate, exportCSV } from '../../../lib/admin/utils';
import type { Client, PaymentStatus, AdminSession } from '../../../lib/admin/types';

const STATUS_STYLES: Record<PaymentStatus, string> = {
  current:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial:  'bg-amber-50 text-amber-700 border-amber-200',
  pending:  'bg-blue-50 text-blue-700 border-blue-200',
  overdue:  'bg-red-50 text-red-700 border-red-200',
};

const EMPTY: Omit<Client, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '', company: '', email: '', phone: '', address: '',
  contractValue: 0, paymentStatus: 'pending', notes: '',
};

interface Props { session: AdminSession; }

export default function ClientManager({ session }: Props) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');
  const [modal, setModal] = useState<'none' | 'form' | 'detail'>('none');
  const [editing, setEditing] = useState<Client | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const reload = () => setClients(ClientStore.getAll());
  useEffect(() => { reload(); }, []);

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
    const matchFilter = filter === 'all' || c.paymentStatus === filter;
    return matchSearch && matchFilter;
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal('form'); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ name: c.name, company: c.company, email: c.email, phone: c.phone, address: c.address, contractValue: c.contractValue, paymentStatus: c.paymentStatus, notes: c.notes }); setModal('form'); };
  const openDetail = (c: Client) => { setSelected(c); setModal('detail'); };
  const closeModal = () => { setModal('none'); setEditing(null); setSelected(null); };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      ClientStore.update(editing.id, form, session);
    } else {
      ClientStore.create(form, session);
    }
    reload();
    closeModal();
  };

  const handleDelete = (id: string) => {
    ClientStore.delete(id, session);
    reload();
    setDeleteConfirm(null);
    if (modal === 'detail') closeModal();
  };

  const handleExport = () => {
    exportCSV(clients.map(c => ({
      Name: c.name, Company: c.company, Email: c.email, Phone: c.phone,
      'Contract Value': c.contractValue, 'Payment Status': c.paymentStatus,
      Notes: c.notes, Created: formatDate(c.createdAt),
    })), 'clients');
  };

  const totalValue = clients.reduce((s, c) => s + c.contractValue, 0);

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Clients', value: clients.length, color: 'indigo' },
          { label: 'Active Contracts', value: formatINR(totalValue), color: 'emerald' },
          { label: 'Overdue', value: clients.filter(c => c.paymentStatus === 'overdue').length, color: 'red' },
          { label: 'Pending', value: clients.filter(c => c.paymentStatus === 'pending').length, color: 'amber' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
          </div>
          <div className="relative">
            <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="appearance-none pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-indigo-400 cursor-pointer">
              <option value="all">All Status</option>
              <option value="current">Current</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleExport} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">Export CSV</button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Contact</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Contract</th>
                <th className="text-center px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No clients found</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0 font-bold text-indigo-600 text-sm">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{formatDate(c.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 hidden md:table-cell">{c.company}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <p className="text-gray-600 text-xs">{c.email}</p>
                    <p className="text-gray-400 text-xs">{c.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-right font-bold text-gray-800">{formatINR(c.contractValue)}</td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[c.paymentStatus]}`}>
                      {c.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openDetail(c)} className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"><FileText className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {modal === 'form' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="Ravi Shankar" />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Company *</label>
                  <input required value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="Company Pvt Ltd" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="client@company.com" />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none" placeholder="Jubilee Hills, Hyderabad" />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Contract Value (₹)</label>
                  <input type="number" min={0} value={form.contractValue} onChange={e => setForm(f => ({ ...f, contractValue: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Payment Status</label>
                  <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value as PaymentStatus }))} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400">
                    <option value="current">Current</option>
                    <option value="partial">Partial</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none" placeholder="Communication notes, contract details..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm">
                  {editing ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {modal === 'detail' && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Client Profile</h2>
              <button onClick={closeModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl">{selected.name.charAt(0)}</div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-500">{selected.company}</p>
                  <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[selected.paymentStatus]}`}>{selected.paymentStatus}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Email', value: selected.email },
                  { label: 'Phone', value: selected.phone },
                  { label: 'Address', value: selected.address },
                  { label: 'Contract Value', value: formatINR(selected.contractValue) },
                  { label: 'Client Since', value: formatDate(selected.createdAt) },
                  { label: 'Last Updated', value: formatDate(selected.updatedAt) },
                ].map(f => (
                  <div key={f.label} className={f.label === 'Address' || f.label === 'Email' ? 'col-span-2' : ''}>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">{f.label}</p>
                    <p className="text-gray-800 font-medium">{f.value || '—'}</p>
                  </div>
                ))}
              </div>
              {selected.notes && (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{selected.notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => openEdit(selected)} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors">Edit</button>
                <button onClick={() => setDeleteConfirm(selected.id)} className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Client?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone. All associated data references will remain.</p>
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
