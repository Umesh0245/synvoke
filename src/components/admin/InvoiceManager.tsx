import React, { useState, useEffect } from 'react';
import { Plus, Printer, Download, Search, Edit2, Trash2, X, ChevronDown, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { InvoiceStore, ClientStore } from '../../lib/admin/store';
import { formatINR, formatDate, exportCSV, generateId } from '../../lib/admin/utils';
import type { Invoice, InvoiceItem, InvoiceStatus, AdminSession, Client } from '../../lib/admin/types';

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft:     'bg-gray-100 text-gray-600 border-gray-200',
  sent:      'bg-blue-50 text-blue-700 border-blue-200',
  paid:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue:   'bg-red-50 text-red-600 border-red-200',
  cancelled: 'bg-gray-100 text-gray-400 border-gray-200',
};

const STATUS_ICONS: Record<InvoiceStatus, React.ElementType> = {
  draft: Clock, sent: Clock, paid: CheckCircle, overdue: AlertTriangle, cancelled: X,
};

interface Props { session: AdminSession; }

const EMPTY_ITEM = (): InvoiceItem => ({ id: generateId(), title: '', details: '', rate: 0, quantity: 1, days: 1 });

export default function InvoiceManager({ session }: Props) {
  const [view, setView] = useState<'list' | 'create' | 'print'>('list');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    clientId: '', projectId: '', invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    notes: 'Thank you for choosing SynVoke. Payment due within 14 days of invoice date.',
    taxRate: 0, status: 'draft' as InvoiceStatus,
  });
  const [items, setItems] = useState<InvoiceItem[]>([EMPTY_ITEM()]);

  const reload = () => { setInvoices(InvoiceStore.getAll()); setClients(ClientStore.getAll()); };
  useEffect(() => { reload(); }, []);

  const resetForm = () => {
    setForm({ clientId: '', projectId: '', invoiceNumber: InvoiceStore.nextNumber(), issueDate: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], notes: 'Thank you for choosing SynVoke. Payment due within 14 days of invoice date.', taxRate: 0, status: 'draft' });
    setItems([EMPTY_ITEM()]);
  };

  const subtotal = items.reduce((s, i) => s + i.rate * i.quantity, 0);
  const taxAmount = subtotal * (form.taxRate / 100);
  const total = subtotal + taxAmount;

  const addItem = () => setItems(it => [...it, EMPTY_ITEM()]);
  const updateItem = (id: string, field: keyof InvoiceItem, val: string | number) =>
    setItems(it => it.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeItem = (id: string) => setItems(it => it.filter(i => i.id !== id));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    InvoiceStore.create({
      ...form,
      issueDate: new Date(form.issueDate).toISOString(),
      dueDate: new Date(form.dueDate).toISOString(),
      items, subtotal, taxAmount, total,
    }, session);
    reload();
    resetForm();
    setView('list');
  };

  const handleStatusChange = (id: string, status: InvoiceStatus) => {
    const paidDate = status === 'paid' ? new Date().toISOString() : undefined;
    InvoiceStore.update(id, { status, ...(paidDate ? { paidDate } : {}) }, session);
    reload();
  };

  const handleDelete = (id: string) => {
    InvoiceStore.delete(id, session);
    reload();
    setDeleteConfirm(null);
  };

  const openPrint = (inv: Invoice) => { setSelected(inv); setView('print'); };

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const matchSearch = !q || inv.invoiceNumber.toLowerCase().includes(q) || (inv.clientName || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => ['sent', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0);

  // ── Print view ────────────────────────────────────────────────────────────
  if (view === 'print' && selected) {
    const client = clients.find(c => c.id === selected.clientId);
    return (
      <div>
        <button onClick={() => setView('list')} className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors print:hidden">
          ← Back to Invoices
        </button>
        <div className="bg-white max-w-[850px] mx-auto shadow-2xl print:shadow-none print:m-0">
          <style>{`@media print { @page { size: A4; margin: 0; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .print\\:hidden { display: none !important; } }`}</style>
          <div className="p-14 border-b-2 border-indigo-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-6xl font-light text-indigo-900/20 uppercase mb-1">Invoice</h1>
                <p className="font-mono font-bold tracking-widest text-gray-800">{selected.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-gray-900">SynVoke</p>
                <p className="text-indigo-500 font-mono text-xs uppercase tracking-widest mt-1">Premium Engineering</p>
                <p className="text-gray-400 text-xs mt-4">contact.synvoke@gmail.com</p>
                <p className="text-gray-400 text-xs">+91 9642469249</p>
              </div>
            </div>
          </div>

          <div className="p-14 flex flex-col min-h-[600px]">
            <div className="flex justify-between mb-14">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">Billed To</p>
                <p className="text-lg font-bold text-gray-900">{selected.clientName}</p>
                <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{client?.address}</p>
                <p className="text-indigo-500 text-sm mt-1">{client?.email}</p>
              </div>
              <div className="text-right border-l pl-10 border-gray-100 space-y-4">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Issue Date</p>
                  <p className="font-mono text-sm text-gray-700">{formatDate(selected.issueDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Due Date</p>
                  <p className="font-mono text-sm font-bold text-gray-800">{formatDate(selected.dueDate)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold border capitalize ${STATUS_STYLES[selected.status]}`}>{selected.status}</span>
                </div>
              </div>
            </div>

            {/* Line items */}
            <table className="w-full mb-8">
              <thead><tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Description</th>
                <th className="text-center py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Days</th>
                <th className="text-center py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Qty</th>
                <th className="text-right py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Rate</th>
                <th className="text-right py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Amount</th>
              </tr></thead>
              <tbody>
                {selected.items.map(item => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-4 pr-4">
                      <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                      {item.details && <p className="text-gray-400 text-xs mt-0.5">{item.details}</p>}
                    </td>
                    <td className="py-4 text-center text-gray-500 text-sm">{item.days}</td>
                    <td className="py-4 text-center text-gray-500 text-sm">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-600 text-sm font-mono">{formatINR(item.rate)}</td>
                    <td className="py-4 text-right text-gray-800 font-bold text-sm font-mono">{formatINR(item.rate * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-auto">
              <div className="w-72 bg-gray-50 rounded-2xl p-6">
                <div className="flex justify-between text-sm text-gray-500 mb-2"><span>Subtotal</span><span className="font-mono">{formatINR(selected.subtotal)}</span></div>
                <div className="flex justify-between text-sm text-gray-500 mb-4"><span>Tax ({selected.taxRate}%)</span><span className="font-mono">{formatINR(selected.taxAmount)}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-800">Total Due</span>
                  <span className="text-3xl font-bold text-indigo-600 font-mono">{formatINR(selected.total)}</span>
                </div>
              </div>
            </div>

            {selected.notes && (
              <div className="mt-10 pt-8 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Terms & Notes</p>
                <p className="text-xs text-gray-500 leading-relaxed">{selected.notes}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-3 print:hidden">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm">
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>
    );
  }

  // ── Create view ───────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">← Back</button>
          <h2 className="font-bold text-gray-900">New Invoice</h2>
          <div />
        </div>

        <form onSubmit={handleCreate} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label-sm">Invoice # *</label>
              <input required value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="label-sm">Client *</label>
              <select required value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} className="input-field w-full">
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-sm">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as InvoiceStatus }))} className="input-field w-full">
                {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label-sm">Issue Date *</label>
              <input type="date" required value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="label-sm">Due Date *</label>
              <input type="date" required value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="input-field w-full" />
            </div>
            <div>
              <label className="label-sm">Tax Rate (%)</label>
              <input type="number" min={0} max={100} value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))} className="input-field w-full" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold text-gray-700">Line Items</p>
              <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-bold">
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 relative group">
                  <div className="col-span-12 md:col-span-5">
                    <input value={item.title} onChange={e => updateItem(item.id, 'title', e.target.value)} placeholder="Item title *" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 font-semibold mb-1.5" />
                    <input value={item.details} onChange={e => updateItem(item.id, 'details', e.target.value)} placeholder="Description (optional)" className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 text-gray-500" />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="label-sm">Days</label>
                    <input type="number" min={1} value={item.days} onChange={e => updateItem(item.id, 'days', parseInt(e.target.value) || 1)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 text-center" />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <label className="label-sm">Qty</label>
                    <input type="number" min={1} value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 1)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 text-center" />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="label-sm">Rate (₹)</label>
                    <input type="number" min={0} value={item.rate} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 text-right" />
                  </div>
                  <div className="col-span-12 md:col-span-2 flex items-end justify-between md:justify-end gap-2">
                    <p className="text-sm font-bold text-gray-800">{formatINR(item.rate * item.quantity)}</p>
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals summary */}
            <div className="flex justify-end mt-4">
              <div className="bg-gray-50 rounded-xl p-4 w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-mono">{formatINR(subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Tax ({form.taxRate}%)</span><span className="font-mono">{formatINR(taxAmount)}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-gray-900">
                  <span>Total</span><span className="font-mono text-indigo-600">{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label-sm">Notes / Terms</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field w-full resize-none" />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setView('list')} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm">Create Invoice</button>
          </div>
        </form>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: invoices.length },
          { label: 'Paid', value: invoices.filter(i => i.status === 'paid').length, sub: formatINR(totalPaid) },
          { label: 'Pending', value: invoices.filter(i => ['sent', 'draft'].includes(i.status)).length, sub: formatINR(totalPending) },
          { label: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length, alert: true },
        ].map(s => (
          <div key={s.label} className={`bg-white border rounded-2xl p-4 shadow-sm ${s.alert && invoices.filter(i => i.status === 'overdue').length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
            <p className={`text-xl font-bold ${s.alert && invoices.filter(i => i.status === 'overdue').length > 0 ? 'text-red-700' : 'text-gray-900'}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            {s.sub && <p className="text-xs font-bold text-indigo-600 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none cursor-pointer">
            <option value="all">All Status</option>
            {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => exportCSV(invoices.map(inv => ({ Number: inv.invoiceNumber, Client: inv.clientName, Total: inv.total, Status: inv.status, Due: formatDate(inv.dueDate) })), 'invoices')} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium flex items-center gap-1.5">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => { resetForm(); setView('create'); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Invoice table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {['Invoice #', 'Client', 'Issue Date', 'Due Date', 'Total', 'Status', ''].map(h => (
                <th key={h} className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && <tr><td colSpan={7} className="py-12 text-center text-gray-400">No invoices found</td></tr>}
              {filtered.map(inv => {
                const Icon = STATUS_ICONS[inv.status];
                const isOverdue = inv.status === 'overdue';
                return (
                  <tr key={inv.id} className={`hover:bg-gray-50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-700 text-xs">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-gray-800">{inv.clientName}</p>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{formatDate(inv.issueDate)}</td>
                    <td className={`py-3.5 px-4 whitespace-nowrap font-medium ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>{formatDate(inv.dueDate)}</td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">{formatINR(inv.total)}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={inv.status}
                        onChange={e => handleStatusChange(inv.id, e.target.value as InvoiceStatus)}
                        className={`text-xs font-bold rounded-full px-2 py-1 border cursor-pointer focus:outline-none capitalize ${STATUS_STYLES[inv.status]}`}
                      >
                        {(['draft', 'sent', 'paid', 'overdue', 'cancelled'] as InvoiceStatus[]).map(s => (
                          <option key={s} value={s} className="bg-white text-gray-800 capitalize">{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openPrint(inv)} title="View & Print" className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"><Printer className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteConfirm(inv.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Invoice?</h3>
            <p className="text-sm text-gray-500 mb-5">This invoice will be permanently removed.</p>
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
