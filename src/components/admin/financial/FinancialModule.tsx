import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, X, Download, TrendingUp, TrendingDown, DollarSign, ChevronDown, Printer } from 'lucide-react';
import { RevenueStore, ExpenseStore, ClientStore, ProjectStore } from '../../../lib/admin/store';
import { formatINR, formatDate, exportCSV, lastNMonths, monthLabel, isSameMonth } from '../../../lib/admin/utils';
import type { Revenue, Expense, RevenueCategory, ExpenseCategory, AdminSession, Client, Project } from '../../../lib/admin/types';

type Tab = 'revenue' | 'expenses' | 'pl' | 'reports';

const REV_CATS: RevenueCategory[] = ['development', 'design', 'consulting', 'maintenance', 'other'];
const EXP_CATS: ExpenseCategory[] = ['infrastructure', 'tools', 'salaries', 'marketing', 'office', 'miscellaneous'];

const CAT_COLOR: Record<string, string> = {
  development: '#4F46E5', design: '#EC4899', consulting: '#10B981',
  maintenance: '#F59E0B', other: '#8B5CF6',
  infrastructure: '#EF4444', tools: '#06B6D4', salaries: '#F97316',
  marketing: '#84CC16', office: '#6366F1', miscellaneous: '#9CA3AF',
};

interface Props { session: AdminSession; }

const EMPTY_REV: Omit<Revenue, 'id' | 'createdAt' | 'clientName'> = {
  clientId: '', amount: 0, description: '', category: 'development', date: new Date().toISOString().split('T')[0],
};
const EMPTY_EXP: Omit<Expense, 'id' | 'createdAt' | 'projectName'> = {
  amount: 0, description: '', category: 'infrastructure', vendor: '', date: new Date().toISOString().split('T')[0],
};

export default function FinancialModule({ session }: Props) {
  const [tab, setTab] = useState<Tab>('revenue');
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [revModal, setRevModal] = useState(false);
  const [expModal, setExpModal] = useState(false);
  const [revForm, setRevForm] = useState(EMPTY_REV);
  const [expForm, setExpForm] = useState(EMPTY_EXP);
  const [reportPeriod, setReportPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'rev' | 'exp'; id: string } | null>(null);

  const reload = () => {
    setRevenues(RevenueStore.getAll());
    setExpenses(ExpenseStore.getAll());
    setClients(ClientStore.getAll());
    setProjects(ProjectStore.getAll());
  };
  useEffect(() => { reload(); }, []);

  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Monthly P&L for last 12 months
  const months12 = useMemo(() => lastNMonths(12), []);
  const monthlyPL = useMemo(() => months12.map(m => {
    const rev = revenues.filter(r => isSameMonth(r.date, m)).reduce((s, r) => s + r.amount, 0);
    const exp = expenses.filter(e => isSameMonth(e.date, m)).reduce((s, e) => s + e.amount, 0);
    return { month: monthLabel(m), revenue: rev, expenses: exp, profit: rev - exp };
  }), [revenues, expenses, months12]);

  // Yearly P&L
  const years = [...new Set([...revenues.map(r => new Date(r.date).getFullYear()), ...expenses.map(e => new Date(e.date).getFullYear())])].sort().reverse();
  const yearlyPL = years.map(yr => {
    const rev = revenues.filter(r => new Date(r.date).getFullYear() === yr).reduce((s, r) => s + r.amount, 0);
    const exp = expenses.filter(e => new Date(e.date).getFullYear() === yr).reduce((s, e) => s + e.amount, 0);
    return { year: yr, revenue: rev, expenses: exp, profit: rev - exp };
  });

  const handleSaveRev = (e: React.FormEvent) => {
    e.preventDefault();
    RevenueStore.create({ ...revForm, date: new Date(revForm.date).toISOString() }, session);
    reload(); setRevModal(false); setRevForm(EMPTY_REV);
  };
  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    ExpenseStore.create({ ...expForm, date: new Date(expForm.date).toISOString() }, session);
    reload(); setExpModal(false); setExpForm(EMPTY_EXP);
  };
  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'rev') RevenueStore.delete(deleteConfirm.id, session);
    else ExpenseStore.delete(deleteConfirm.id, session);
    reload(); setDeleteConfirm(null);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'pl', label: 'P&L Statement' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: formatINR(totalRevenue), icon: TrendingUp, color: 'indigo', positive: true },
          { label: 'Total Expenses', value: formatINR(totalExpenses), icon: TrendingDown, color: 'pink', positive: false },
          { label: 'Net Profit', value: formatINR(netProfit), icon: DollarSign, color: netProfit >= 0 ? 'emerald' : 'red', positive: netProfit >= 0 },
          { label: 'Profit Margin', value: `${profitMargin.toFixed(1)}%`, icon: TrendingUp, color: profitMargin > 20 ? 'emerald' : 'amber', positive: profitMargin > 0 },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-xl bg-${s.color}-50 flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 text-${s.color}-600`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${tab === t.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Revenue Tab */}
          {tab === 'revenue' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{revenues.length} entries · {formatINR(totalRevenue)} total</p>
                <div className="flex gap-2">
                  <button onClick={() => exportCSV(revenues.map(r => ({ Date: formatDate(r.date), Client: r.clientName, Description: r.description, Category: r.category, Amount: r.amount })), 'revenue')} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export</button>
                  <button onClick={() => setRevModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"><Plus className="w-3.5 h-3.5" /> Add Revenue</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    {['Date', 'Client', 'Description', 'Category', 'Amount', ''].map(h => (
                      <th key={h} className={`text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {revenues.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No revenue entries</td></tr>}
                    {revenues.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{formatDate(r.date)}</td>
                        <td className="py-3 px-3 text-gray-700 font-medium">{r.clientName}</td>
                        <td className="py-3 px-3 text-gray-600 max-w-[200px] truncate">{r.description}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLOR[r.category] }} />
                            <span className="capitalize">{r.category}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-gray-800">{formatINR(r.amount)}</td>
                        <td className="py-3 px-3">
                          <button onClick={() => setDeleteConfirm({ type: 'rev', id: r.id })} className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {tab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">{expenses.length} entries · {formatINR(totalExpenses)} total</p>
                <div className="flex gap-2">
                  <button onClick={() => exportCSV(expenses.map(e => ({ Date: formatDate(e.date), Vendor: e.vendor, Description: e.description, Category: e.category, Amount: e.amount })), 'expenses')} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export</button>
                  <button onClick={() => setExpModal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold"><Plus className="w-3.5 h-3.5" /> Add Expense</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    {['Date', 'Vendor', 'Description', 'Category', 'Amount', ''].map(h => (
                      <th key={h} className={`text-left py-2.5 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {expenses.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No expense entries</td></tr>}
                    {expenses.map(e => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3 text-gray-500 whitespace-nowrap">{formatDate(e.date)}</td>
                        <td className="py-3 px-3 text-gray-700 font-medium">{e.vendor}</td>
                        <td className="py-3 px-3 text-gray-600 max-w-[200px] truncate">{e.description}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CAT_COLOR[e.category] }} />
                            <span className="capitalize">{e.category}</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-red-600">{formatINR(e.amount)}</td>
                        <td className="py-3 px-3">
                          <button onClick={() => setDeleteConfirm({ type: 'exp', id: e.id })} className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* P&L Tab */}
          {tab === 'pl' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Profit & Loss Statement</h3>
                <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium"><Printer className="w-3.5 h-3.5" /> Print</button>
              </div>
              <div className="space-y-2">
                {/* Revenue section */}
                <div className="bg-indigo-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3">Revenue</p>
                  {REV_CATS.map(cat => {
                    const total = revenues.filter(r => r.category === cat).reduce((s, r) => s + r.amount, 0);
                    if (!total) return null;
                    return (
                      <div key={cat} className="flex justify-between text-sm py-1.5 border-b border-indigo-100 last:border-0">
                        <span className="text-indigo-700 capitalize">{cat}</span>
                        <span className="font-semibold text-indigo-800">{formatINR(total)}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-sm font-bold pt-3 mt-1 border-t border-indigo-200">
                    <span className="text-indigo-900">Total Revenue</span>
                    <span className="text-indigo-900">{formatINR(totalRevenue)}</span>
                  </div>
                </div>

                {/* Expenses section */}
                <div className="bg-pink-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-3">Expenses</p>
                  {EXP_CATS.map(cat => {
                    const total = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
                    if (!total) return null;
                    return (
                      <div key={cat} className="flex justify-between text-sm py-1.5 border-b border-pink-100 last:border-0">
                        <span className="text-pink-700 capitalize">{cat}</span>
                        <span className="font-semibold text-pink-800">{formatINR(total)}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between text-sm font-bold pt-3 mt-1 border-t border-pink-200">
                    <span className="text-pink-900">Total Expenses</span>
                    <span className="text-pink-900">{formatINR(totalExpenses)}</span>
                  </div>
                </div>

                {/* Net Profit */}
                <div className={`rounded-2xl p-4 ${netProfit >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <div className="flex justify-between text-base font-black">
                    <span className={netProfit >= 0 ? 'text-emerald-800' : 'text-red-800'}>Net Profit</span>
                    <span className={netProfit >= 0 ? 'text-emerald-800' : 'text-red-700'}>{formatINR(netProfit)}</span>
                  </div>
                  <p className={`text-xs mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    Margin: {profitMargin.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {tab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {(['monthly', 'yearly'] as const).map(p => (
                    <button key={p} onClick={() => setReportPeriod(p)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${reportPeriod === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
                  ))}
                </div>
                <button
                  onClick={() => exportCSV(
                    reportPeriod === 'monthly'
                      ? monthlyPL.map(r => ({ Period: r.month, Revenue: r.revenue, Expenses: r.expenses, Profit: r.profit }))
                      : yearlyPL.map(r => ({ Period: r.year, Revenue: r.revenue, Expenses: r.expenses, Profit: r.profit })),
                    `${reportPeriod}-report`
                  )}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Period</th>
                      <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expenses</th>
                      <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Net Profit</th>
                      <th className="text-right py-2.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(reportPeriod === 'monthly' ? monthlyPL : yearlyPL).map((row, i) => {
                      const period = 'month' in row ? row.month : String(row.year);
                      const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="py-3 px-4 font-semibold text-gray-700">{period}</td>
                          <td className="py-3 px-4 text-right text-indigo-600 font-medium">{formatINR(row.revenue)}</td>
                          <td className="py-3 px-4 text-right text-pink-600 font-medium">{formatINR(row.expenses)}</td>
                          <td className={`py-3 px-4 text-right font-bold ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(row.profit)}</td>
                          <td className={`py-3 px-4 text-right text-sm ${margin >= 20 ? 'text-emerald-600' : margin >= 0 ? 'text-amber-600' : 'text-red-600'}`}>{margin.toFixed(1)}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Revenue Modal */}
      {revModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Add Revenue Entry</h2>
              <button onClick={() => setRevModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveRev} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label-sm">Client *</label>
                  <select required value={revForm.clientId} onChange={e => setRevForm(f => ({ ...f, clientId: e.target.value }))} className="input-field w-full">
                    <option value="">Select client...</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-sm">Amount (₹) *</label>
                  <input type="number" min={1} required value={revForm.amount} onChange={e => setRevForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="input-field w-full" />
                </div>
                <div>
                  <label className="label-sm">Date *</label>
                  <input type="date" required value={revForm.date} onChange={e => setRevForm(f => ({ ...f, date: e.target.value }))} className="input-field w-full" />
                </div>
                <div className="col-span-2">
                  <label className="label-sm">Description *</label>
                  <input required value={revForm.description} onChange={e => setRevForm(f => ({ ...f, description: e.target.value }))} className="input-field w-full" placeholder="e.g. Phase 2 milestone payment" />
                </div>
                <div className="col-span-2">
                  <label className="label-sm">Category</label>
                  <select value={revForm.category} onChange={e => setRevForm(f => ({ ...f, category: e.target.value as RevenueCategory }))} className="input-field w-full">
                    {REV_CATS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setRevModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold">Add Revenue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {expModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Add Expense Entry</h2>
              <button onClick={() => setExpModal(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveExp} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-sm">Amount (₹) *</label>
                  <input type="number" min={1} required value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} className="input-field w-full" />
                </div>
                <div>
                  <label className="label-sm">Date *</label>
                  <input type="date" required value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} className="input-field w-full" />
                </div>
                <div className="col-span-2">
                  <label className="label-sm">Vendor *</label>
                  <input required value={expForm.vendor} onChange={e => setExpForm(f => ({ ...f, vendor: e.target.value }))} className="input-field w-full" placeholder="e.g. Amazon Web Services" />
                </div>
                <div className="col-span-2">
                  <label className="label-sm">Description *</label>
                  <input required value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} className="input-field w-full" placeholder="e.g. EC2 + S3 monthly charges" />
                </div>
                <div className="col-span-2">
                  <label className="label-sm">Category</label>
                  <select value={expForm.category} onChange={e => setExpForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))} className="input-field w-full">
                    {EXP_CATS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setExpModal(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-sm font-bold">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">Delete Entry?</h3>
            <p className="text-sm text-gray-500 mb-5">This financial record will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
