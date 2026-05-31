import React, { useMemo } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, FolderKanban,
  AlertCircle, Clock, ArrowUpRight,
} from 'lucide-react';
import { computeDashboard } from '../../../lib/admin/store';
import { formatINR, formatDate, formatPercent } from '../../../lib/admin/utils';
import type { AdminSession } from '../../../lib/admin/types';

// ─── Mini SVG Charts ──────────────────────────────────────────────────────────
function CashFlowBar({ data }: { data: { month: string; income: number; expenses: number }[] }) {
  const max = Math.max(...data.flatMap(d => [d.income, d.expenses]), 1);
  const W = 480, H = 140, barW = 28, gap = 16;
  const groupW = barW * 2 + gap;
  const totalW = data.length * (groupW + 20);

  return (
    <svg viewBox={`0 0 ${totalW} ${H + 30}`} className="w-full h-44" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F9A8D4" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const x = i * (groupW + 20) + 10;
        const incH = (d.income / max) * H;
        const expH = (d.expenses / max) * H;
        return (
          <g key={i}>
            <rect x={x} y={H - incH} width={barW} height={incH} fill="url(#incGrad)" rx={3} />
            <rect x={x + barW + 4} y={H - expH} width={barW} height={expH} fill="url(#expGrad)" rx={3} />
            <text x={x + barW} y={H + 16} textAnchor="middle" fontSize="9" fill="#9CA3AF">{d.month}</text>
          </g>
        );
      })}
      {/* Legend */}
      <g transform={`translate(${totalW - 130}, 6)`}>
        <rect x={0} y={0} width={10} height={10} fill="#4F46E5" rx={2} />
        <text x={14} y={9} fontSize="9" fill="#6B7280">Revenue</text>
        <rect x={70} y={0} width={10} height={10} fill="#EC4899" rx={2} />
        <text x={84} y={9} fontSize="9" fill="#6B7280">Expenses</text>
      </g>
    </svg>
  );
}

function GaugeArc({ score }: { score: number }) {
  const r = 54, cx = 70, cy = 70;
  const startAngle = -200;
  const endAngle = 20;
  const totalDeg = endAngle - startAngle;
  const scoreDeg = (score / 100) * totalDeg;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arc = (angle: number) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });
  const start = arc(startAngle);
  const trackEnd = arc(endAngle);
  const scoreEnd = arc(startAngle + scoreDeg);
  const largeArc = totalDeg > 180 ? 1 : 0;
  const scoreColor = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <svg viewBox="0 0 140 100" className="w-36 h-24">
      <path d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${trackEnd.x} ${trackEnd.y}`} fill="none" stroke="#E5E7EB" strokeWidth="10" strokeLinecap="round" />
      {score > 0 && (
        <path
          d={`M ${start.x} ${start.y} A ${r} ${r} 0 ${scoreDeg > 180 ? 1 : 0} 1 ${scoreEnd.x} ${scoreEnd.y}`}
          fill="none" stroke={scoreColor} strokeWidth="10" strokeLinecap="round"
        />
      )}
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill="#111827">{score}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="#6B7280" letterSpacing="1">HEALTH SCORE</text>
    </svg>
  );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  subPositive?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
}
function MetricCard({ label, value, sub, subPositive, icon: Icon, iconColor, iconBg }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {sub && (
          <span className={`flex items-center gap-1 text-xs font-bold ${subPositive ? 'text-emerald-600' : 'text-red-500'}`}>
            {subPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {sub}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 font-medium mt-1.5">{label}</p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
interface Props { session: AdminSession; }

export default function Dashboard({ session }: Props) {
  const m = useMemo(() => computeDashboard(), []);

  const profitMargin = m.totalRevenue > 0 ? (m.netProfit / m.totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Top row: health + metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Health score */}
        <div className="col-span-2 lg:col-span-2 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center text-center">
          <GaugeArc score={m.businessHealthScore} />
          <p className="mt-2 text-sm font-bold text-gray-700">Business Health</p>
          <p className="text-xs text-gray-400 mt-1">
            {m.businessHealthScore >= 75 ? '🟢 Excellent' : m.businessHealthScore >= 50 ? '🟡 Good' : '🔴 Needs Attention'}
          </p>
        </div>

        {/* Metric cards */}
        <div className="col-span-2 lg:col-span-4 grid grid-cols-2 gap-4">
          <MetricCard label="Total Revenue" value={formatINR(m.totalRevenue)} icon={DollarSign} iconColor="text-indigo-600" iconBg="bg-indigo-50" sub={formatPercent(m.monthlyGrowth)} subPositive={m.monthlyGrowth >= 0} />
          <MetricCard label="Total Expenses" value={formatINR(m.totalExpenses)} icon={TrendingDown} iconColor="text-pink-600" iconBg="bg-pink-50" />
          <MetricCard label="Net Profit" value={formatINR(m.netProfit)} sub={`${profitMargin.toFixed(1)}% margin`} subPositive={profitMargin > 20} icon={TrendingUp} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          <MetricCard label="Pending Receivables" value={formatINR(m.pendingReceivables)} icon={AlertCircle} iconColor="text-amber-600" iconBg="bg-amber-50" />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Clients', value: m.totalClients, icon: Users, color: 'indigo' },
          { label: 'Active Projects', value: m.activeProjects, icon: FolderKanban, color: 'purple' },
          { label: 'Monthly Growth', value: `${m.monthlyGrowth >= 0 ? '+' : ''}${m.monthlyGrowth.toFixed(1)}%`, icon: TrendingUp, color: m.monthlyGrowth >= 0 ? 'emerald' : 'red' },
          { label: 'Upcoming Due', value: m.upcomingInvoices.length, icon: Clock, color: 'amber' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 flex items-center justify-center shrink-0`}>
                <Icon className={`w-5 h-5 text-${s.color}-600`} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-none">{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cash flow chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4">Cash Flow — Last 6 Months</h3>
        <CashFlowBar data={m.cashFlow} />
      </div>

      {/* Bottom row: Top clients + Top services + Upcoming invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top clients */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Top Clients by Revenue</h3>
          <div className="space-y-3">
            {m.topClients.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                  <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.revenue / m.topClients[0].revenue) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700 shrink-0">{formatINR(c.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top services */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Revenue by Service</h3>
          <div className="space-y-3">
            {m.topServices.map((s, i) => {
              const colors = ['#4F46E5', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];
              return (
                <div key={s.category} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[i] }} />
                  <p className="text-sm text-gray-700 capitalize flex-1">{s.category}</p>
                  <span className="text-sm font-bold text-gray-700">{formatINR(s.revenue)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming invoices */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Upcoming Due Invoices</h3>
          {m.upcomingInvoices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No upcoming payments</p>
          ) : (
            <div className="space-y-3">
              {m.upcomingInvoices.map(inv => {
                const isOverdue = inv.status === 'overdue';
                return (
                  <div key={inv.id} className={`p-3 rounded-xl border ${isOverdue ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{inv.clientName}</p>
                        <p className="text-xs text-gray-500">{inv.invoiceNumber}</p>
                      </div>
                      <span className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-amber-700'}`}>{formatINR(inv.total)}</span>
                    </div>
                    <p className={`text-xs mt-1.5 font-medium ${isOverdue ? 'text-red-500' : 'text-amber-600'}`}>
                      Due: {formatDate(inv.dueDate)} {isOverdue ? '• OVERDUE' : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
