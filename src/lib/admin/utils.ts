// ─── Formatters ──────────────────────────────────────────────────────────────
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function monthLabel(date: Date): string {
  return date.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

export function growthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function businessHealthScore(params: {
  profitMargin: number;      // 0-100%
  revenueGrowth: number;     // 0-100%
  receivablesRatio: number;  // % of revenue that is pending (lower = better)
  activeProjects: number;
}): number {
  const { profitMargin, revenueGrowth, receivablesRatio, activeProjects } = params;
  const margin = Math.min(profitMargin, 100) * 0.35;
  const growth = Math.min(revenueGrowth, 100) * 0.30;
  const receivables = Math.max(0, 100 - receivablesRatio) * 0.20;
  const activity = Math.min(activeProjects * 15, 100) * 0.15;
  return Math.round(margin + growth + receivables + activity);
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
export function exportCSV(rows: Record<string, unknown>[], filename: string): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const v = String(r[h] ?? '').replace(/"/g, '""');
        return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Last N months ────────────────────────────────────────────────────────────
export function lastNMonths(n: number): Date[] {
  const months: Date[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push(d);
  }
  return months;
}

export function isSameMonth(iso: string, ref: Date): boolean {
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
