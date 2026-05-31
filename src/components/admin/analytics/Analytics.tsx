import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Users, BarChart2 } from 'lucide-react';
import { RevenueStore, ExpenseStore, ClientStore } from '../../../lib/admin/store';
import { formatINR, lastNMonths, monthLabel, isSameMonth, growthRate } from '../../../lib/admin/utils';

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
interface LinePoint { label: string; value: number; }
function LineChart({ points, color, height = 120 }: { points: LinePoint[]; color: string; height?: number }) {
  if (!points.length) return null;
  const values = points.map(p => p.value);
  const max = Math.max(...values) || 1;
  const min = 0;
  const W = 480, H = height;
  const padX = 4, padY = 8;
  const usableW = W - padX * 2;
  const usableH = H - padY * 2;
  const pts = values.map((v, i) => ({
    x: padX + (i / Math.max(values.length - 1, 1)) * usableW,
    y: padY + usableH - ((v - min) / (max - min || 1)) * usableH,
  }));
  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
  const gradId = `lg-${color.replace('#', '')}`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} preserveAspectRatio="none" className="w-full" style={{ height: height + 24 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Horizontal grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct} x1={padX} y1={padY + usableH * (1 - pct)} x2={W - padX} y2={padY + usableH * (1 - pct)} stroke="#F3F4F6" strokeWidth="1" />
      ))}
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="white" strokeWidth="1.5" />
      ))}
      {/* X labels */}
      {points.map((p, i) => (
        <text key={i} x={pts[i].x} y={H + 16} textAnchor="middle" fontSize="9" fill="#9CA3AF">{p.label}</text>
      ))}
    </svg>
  );
}

// ─── SVG Stacked Bar ─────────────────────────────────────────────────────────
function StackedBar({ data }: { data: { label: string; a: number; b: number }[] }) {
  const max = Math.max(...data.map(d => d.a + d.b), 1);
  const H = 120, barW = 28;
  const spacing = 48;
  const totalW = data.length * spacing;

  return (
    <svg viewBox={`0 0 ${totalW} ${H + 24}`} className="w-full" style={{ height: H + 24 }}>
      {data.map((d, i) => {
        const aH = (d.a / max) * H;
        const bH = (d.b / max) * H;
        const x = i * spacing + (spacing - barW) / 2;
        return (
          <g key={i}>
            <rect x={x} y={H - aH - bH} width={barW} height={aH} fill="#4F46E5" rx={2} />
            <rect x={x} y={H - bH} width={barW} height={bH} fill="#EC4899" rx={2} />
            <text x={x + barW / 2} y={H + 16} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.label}</text>
          </g>
        );
      })}
      <g transform={`translate(${totalW - 120}, 4)`}>
        <rect x={0} y={0} width={8} height={8} fill="#4F46E5" rx={1} />
        <text x={12} y={8} fontSize="9" fill="#6B7280">Revenue</text>
        <rect x={58} y={0} width={8} height={8} fill="#EC4899" rx={1} />
        <text x={70} y={8} fontSize="9" fill="#6B7280">Expenses</text>
      </g>
    </svg>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, current, previous, format = formatINR }: {
  label: string; current: number; previous: number; format?: (n: number) => string;
}) {
  const growth = growthRate(current, previous);
  const positive = growth >= 0;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{format(current)}</p>
      <div className={`flex items-center gap-1 mt-1.5 text-xs font-bold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
        {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% vs prev. month
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export default function Analytics() {
  const months6 = useMemo(() => lastNMonths(6), []);
  const months12 = useMemo(() => lastNMonths(12), []);

  const revenues = useMemo(() => RevenueStore.getAll(), []);
  const expenses = useMemo(() => ExpenseStore.getAll(), []);
  const clients  = useMemo(() => ClientStore.getAll(), []);

  const monthly = useMemo(() => months12.map(m => {
    const rev = revenues.filter(r => isSameMonth(r.date, m)).reduce((s, r) => s + r.amount, 0);
    const exp = expenses.filter(e => isSameMonth(e.date, m)).reduce((s, e) => s + e.amount, 0);
    const newClients = clients.filter(c => isSameMonth(c.createdAt, m)).length;
    return { month: m, label: monthLabel(m), revenue: rev, expenses: exp, profit: rev - exp, newClients };
  }), [revenues, expenses, clients, months12]);

  const curr = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];

  const revPoints6 = months6.map(m => ({
    label: monthLabel(m),
    value: revenues.filter(r => isSameMonth(r.date, m)).reduce((s, r) => s + r.amount, 0),
  }));
  const expPoints6 = months6.map(m => ({
    label: monthLabel(m),
    value: expenses.filter(e => isSameMonth(e.date, m)).reduce((s, e) => s + e.amount, 0),
  }));
  const profitPoints6 = months6.map((m, i) => ({
    label: monthLabel(m),
    value: revPoints6[i].value - expPoints6[i].value,
  }));
  const clientPoints = months6.map(m => ({
    label: monthLabel(m),
    value: clients.filter(c => isSameMonth(c.createdAt, m)).length,
  }));

  const stackData = months6.map((m, i) => ({
    label: monthLabel(m),
    a: revPoints6[i].value,
    b: expPoints6[i].value,
  }));

  // Revenue by category (pie-like bar)
  const catMap: Record<string, number> = {};
  revenues.forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + r.amount; });
  const totalRev = revenues.reduce((s, r) => s + r.amount, 0);
  const catBreakdown = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const CAT_COLORS = ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue (Current Month)" current={curr?.revenue || 0} previous={prev?.revenue || 0} />
        <StatCard label="Expenses (Current Month)" current={curr?.expenses || 0} previous={prev?.expenses || 0} />
        <StatCard label="Net Profit (Current Month)" current={curr?.profit || 0} previous={prev?.profit || 0} />
        <StatCard label="New Clients" current={curr?.newClients || 0} previous={prev?.newClients || 0} format={n => String(n)} />
      </div>

      {/* Revenue & Expense Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="font-bold text-gray-900 text-sm">Revenue Trend</p>
          </div>
          <LineChart points={revPoints6} color="#4F46E5" />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-pink-600" />
            </div>
            <p className="font-bold text-gray-900 text-sm">Expense Trend</p>
          </div>
          <LineChart points={expPoints6} color="#EC4899" />
        </div>
      </div>

      {/* Profit trend + Stacked bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-bold text-gray-900 text-sm">Net Profit Trend</p>
          </div>
          <LineChart points={profitPoints6} color="#10B981" />
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-purple-600" />
            </div>
            <p className="font-bold text-gray-900 text-sm">Revenue vs Expenses</p>
          </div>
          <StackedBar data={stackData} />
        </div>
      </div>

      {/* Revenue by category + Client acquisition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category breakdown */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <p className="font-bold text-gray-900 text-sm mb-4">Revenue by Category</p>
          <div className="space-y-3">
            {catBreakdown.map(([cat, amt], i) => (
              <div key={cat}>
                <div className="flex justify-between text-sm mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: CAT_COLORS[i] || '#9CA3AF' }} />
                    <span className="capitalize text-gray-700 font-medium">{cat}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-800">{formatINR(amt)}</span>
                    <span className="text-gray-400 ml-2 text-xs">{totalRev > 0 ? ((amt / totalRev) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${totalRev > 0 ? (amt / totalRev) * 100 : 0}%`, backgroundColor: CAT_COLORS[i] || '#9CA3AF' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client acquisition */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <p className="font-bold text-gray-900 text-sm">Client Acquisition Trend</p>
          </div>
          <LineChart points={clientPoints} color="#F59E0B" />
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {clientPoints.slice(-3).map((p, i) => (
              <div key={i} className="bg-amber-50 rounded-xl p-2">
                <p className="text-xs text-amber-600 font-medium">{p.label}</p>
                <p className="text-lg font-bold text-amber-800">{p.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">12-Month Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100">
              {['Month', 'Revenue', 'Expenses', 'Net Profit', 'Margin', 'New Clients'].map(h => (
                <th key={h} className="py-3 px-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {[...monthly].reverse().map((row, i) => {
                const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold text-gray-700">{row.label}</td>
                    <td className="py-3 px-4 text-indigo-600 font-medium">{formatINR(row.revenue)}</td>
                    <td className="py-3 px-4 text-pink-600 font-medium">{formatINR(row.expenses)}</td>
                    <td className={`py-3 px-4 font-bold ${row.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatINR(row.profit)}</td>
                    <td className={`py-3 px-4 text-sm ${margin >= 20 ? 'text-emerald-600' : margin >= 0 ? 'text-amber-600' : 'text-red-500'}`}>{margin.toFixed(1)}%</td>
                    <td className="py-3 px-4 text-gray-600">{row.newClients}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
