import type {
  Client, Project, Revenue, Expense, Invoice, InvoiceItem, AuditEntry, AdminSession,
  DashboardMetrics,
} from './types';
import { generateId, lastNMonths, monthLabel, isSameMonth, growthRate, businessHealthScore } from './utils';

// ─── Storage keys ────────────────────────────────────────────────────────────
const K = {
  clients: 'sv_clients',
  projects: 'sv_projects',
  revenues: 'sv_revenues',
  expenses: 'sv_expenses',
  invoices: 'sv_invoices',
  audit: 'sv_audit',
  seeded: 'sv_seeded_v3',
};

// ─── Generic helpers ─────────────────────────────────────────────────────────
function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') as T[]; }
  catch { return []; }
}
function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ─── Audit ───────────────────────────────────────────────────────────────────
export function writeAudit(
  session: AdminSession | null,
  action: AuditEntry['action'],
  entity: string,
  entityId: string,
  details: string
): void {
  const entries = load<AuditEntry>(K.audit);
  entries.unshift({
    id: generateId(),
    userId: session?.userId ?? 'system',
    userEmail: session?.email ?? 'system',
    action,
    entity,
    entityId,
    details,
    timestamp: new Date().toISOString(),
  });
  save(K.audit, entries.slice(0, 2000));
}

export const AuditStore = {
  getAll: () => load<AuditEntry>(K.audit),
};

// ─── Client Store ─────────────────────────────────────────────────────────────
export const ClientStore = {
  getAll: (): Client[] => load<Client>(K.clients),

  getById: (id: string): Client | undefined =>
    load<Client>(K.clients).find(c => c.id === id),

  create(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>, session: AdminSession | null): Client {
    const list = load<Client>(K.clients);
    const item: Client = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    save(K.clients, [...list, item]);
    writeAudit(session, 'create', 'client', item.id, `Created client: ${item.name}`);
    return item;
  },

  update(id: string, data: Partial<Client>, session: AdminSession | null): Client | null {
    const list = load<Client>(K.clients);
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    save(K.clients, list);
    writeAudit(session, 'update', 'client', id, `Updated client: ${list[idx].name}`);
    return list[idx];
  },

  delete(id: string, session: AdminSession | null): boolean {
    const list = load<Client>(K.clients);
    const item = list.find(c => c.id === id);
    if (!item) return false;
    save(K.clients, list.filter(c => c.id !== id));
    writeAudit(session, 'delete', 'client', id, `Deleted client: ${item.name}`);
    return true;
  },
};

// ─── Project Store ────────────────────────────────────────────────────────────
export const ProjectStore = {
  getAll(): Project[] {
    const clients = load<Client>(K.clients);
    return load<Project>(K.projects).map(p => ({
      ...p,
      clientName: clients.find(c => c.id === p.clientId)?.name ?? 'Unknown',
    }));
  },

  getById: (id: string): Project | undefined =>
    load<Project>(K.projects).find(p => p.id === id),

  create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'clientName'>, session: AdminSession | null): Project {
    const list = load<Project>(K.projects);
    const item: Project = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    save(K.projects, [...list, item]);
    writeAudit(session, 'create', 'project', item.id, `Created project: ${item.name}`);
    return item;
  },

  update(id: string, data: Partial<Project>, session: AdminSession | null): Project | null {
    const list = load<Project>(K.projects);
    const idx = list.findIndex(p => p.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    save(K.projects, list);
    writeAudit(session, 'update', 'project', id, `Updated project: ${list[idx].name}`);
    return list[idx];
  },

  delete(id: string, session: AdminSession | null): boolean {
    const list = load<Project>(K.projects);
    const item = list.find(p => p.id === id);
    if (!item) return false;
    save(K.projects, list.filter(p => p.id !== id));
    writeAudit(session, 'delete', 'project', id, `Deleted project: ${item.name}`);
    return true;
  },
};

// ─── Revenue Store ────────────────────────────────────────────────────────────
export const RevenueStore = {
  getAll(): Revenue[] {
    const clients = load<Client>(K.clients);
    return load<Revenue>(K.revenues).map(r => ({
      ...r,
      clientName: clients.find(c => c.id === r.clientId)?.name ?? 'Unknown',
    }));
  },

  create(data: Omit<Revenue, 'id' | 'createdAt' | 'clientName'>, session: AdminSession | null): Revenue {
    const list = load<Revenue>(K.revenues);
    const item: Revenue = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    save(K.revenues, [...list, item]);
    writeAudit(session, 'create', 'revenue', item.id, `Revenue ₹${item.amount}: ${item.description}`);
    return item;
  },

  update(id: string, data: Partial<Revenue>, session: AdminSession | null): Revenue | null {
    const list = load<Revenue>(K.revenues);
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    save(K.revenues, list);
    writeAudit(session, 'update', 'revenue', id, `Updated revenue entry`);
    return list[idx];
  },

  delete(id: string, session: AdminSession | null): boolean {
    const list = load<Revenue>(K.revenues);
    const item = list.find(r => r.id === id);
    if (!item) return false;
    save(K.revenues, list.filter(r => r.id !== id));
    writeAudit(session, 'delete', 'revenue', id, `Deleted revenue: ₹${item.amount}`);
    return true;
  },
};

// ─── Expense Store ────────────────────────────────────────────────────────────
export const ExpenseStore = {
  getAll(): Expense[] {
    const projects = load<Project>(K.projects);
    return load<Expense>(K.expenses).map(e => ({
      ...e,
      projectName: projects.find(p => p.id === e.projectId)?.name ?? undefined,
    }));
  },

  create(data: Omit<Expense, 'id' | 'createdAt' | 'projectName'>, session: AdminSession | null): Expense {
    const list = load<Expense>(K.expenses);
    const item: Expense = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    save(K.expenses, [...list, item]);
    writeAudit(session, 'create', 'expense', item.id, `Expense ₹${item.amount}: ${item.description}`);
    return item;
  },

  update(id: string, data: Partial<Expense>, session: AdminSession | null): Expense | null {
    const list = load<Expense>(K.expenses);
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data };
    save(K.expenses, list);
    writeAudit(session, 'update', 'expense', id, `Updated expense entry`);
    return list[idx];
  },

  delete(id: string, session: AdminSession | null): boolean {
    const list = load<Expense>(K.expenses);
    const item = list.find(e => e.id === id);
    if (!item) return false;
    save(K.expenses, list.filter(e => e.id !== id));
    writeAudit(session, 'delete', 'expense', id, `Deleted expense: ₹${item.amount}`);
    return true;
  },
};

// ─── Invoice Store ────────────────────────────────────────────────────────────
export const InvoiceStore = {
  getAll(): Invoice[] {
    const clients = load<Client>(K.clients);
    return load<Invoice>(K.invoices).map(inv => ({
      ...inv,
      clientName: clients.find(c => c.id === inv.clientId)?.name ?? 'Unknown',
    }));
  },

  getById: (id: string): Invoice | undefined =>
    load<Invoice>(K.invoices).find(inv => inv.id === id),

  create(data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'clientName'>, session: AdminSession | null): Invoice {
    const list = load<Invoice>(K.invoices);
    const item: Invoice = { ...data, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    save(K.invoices, [...list, item]);
    writeAudit(session, 'create', 'invoice', item.id, `Created invoice ${item.invoiceNumber} for ₹${item.total}`);
    return item;
  },

  update(id: string, data: Partial<Invoice>, session: AdminSession | null): Invoice | null {
    const list = load<Invoice>(K.invoices);
    const idx = list.findIndex(inv => inv.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    save(K.invoices, list);
    writeAudit(session, 'update', 'invoice', id, `Updated invoice ${list[idx].invoiceNumber}`);
    return list[idx];
  },

  delete(id: string, session: AdminSession | null): boolean {
    const list = load<Invoice>(K.invoices);
    const item = list.find(inv => inv.id === id);
    if (!item) return false;
    save(K.invoices, list.filter(inv => inv.id !== id));
    writeAudit(session, 'delete', 'invoice', id, `Deleted invoice ${item.invoiceNumber}`);
    return true;
  },

  nextNumber(): string {
    const list = load<Invoice>(K.invoices);
    const year = new Date().getFullYear();
    const count = list.filter(inv => inv.invoiceNumber.includes(`${year}`)).length + 1;
    return `INV-${year}-${String(count).padStart(4, '0')}`;
  },
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function computeDashboard(): DashboardMetrics {
  const revenues = load<Revenue>(K.revenues);
  const expenses = load<Expense>(K.expenses);
  const clients = load<Client>(K.clients);
  const projects = load<Project>(K.projects);
  const invoices = load<Invoice>(K.invoices);

  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const pendingReceivables = invoices
    .filter(inv => inv.status === 'sent' || inv.status === 'overdue')
    .reduce((s, inv) => s + inv.total, 0);

  // Monthly growth (current vs previous month)
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currMonthRev = revenues.filter(r => isSameMonth(r.date, now)).reduce((s, r) => s + r.amount, 0);
  const prevMonthRev = revenues.filter(r => isSameMonth(r.date, prevMonth)).reduce((s, r) => s + r.amount, 0);
  const monthlyGrowth = growthRate(currMonthRev, prevMonthRev);

  // Top clients by revenue
  const clientRevMap: Record<string, { id: string; name: string; revenue: number }> = {};
  revenues.forEach(r => {
    const c = clients.find(cl => cl.id === r.clientId);
    if (!c) return;
    if (!clientRevMap[r.clientId]) clientRevMap[r.clientId] = { id: c.id, name: c.name, revenue: 0 };
    clientRevMap[r.clientId].revenue += r.amount;
  });
  const topClients = Object.values(clientRevMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Top services by revenue category
  const catMap: Record<string, number> = {};
  revenues.forEach(r => { catMap[r.category] = (catMap[r.category] || 0) + r.amount; });
  const topServices = Object.entries(catMap)
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Cash flow (last 6 months)
  const months = lastNMonths(6);
  const cashFlow = months.map(m => ({
    month: monthLabel(m),
    income: revenues.filter(r => isSameMonth(r.date, m)).reduce((s, r) => s + r.amount, 0),
    expenses: expenses.filter(e => isSameMonth(e.date, m)).reduce((s, e) => s + e.amount, 0),
  }));

  // Health score
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const revenueGrowth = Math.max(0, monthlyGrowth);
  const receivablesRatio = totalRevenue > 0 ? (pendingReceivables / totalRevenue) * 100 : 0;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const businessHealthScore_ = businessHealthScore({ profitMargin, revenueGrowth, receivablesRatio, activeProjects });

  // Upcoming invoices (due in next 30 days, not paid)
  const in30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const upcomingInvoices = InvoiceStore.getAll()
    .filter(inv => ['sent', 'overdue'].includes(inv.status) && new Date(inv.dueDate) <= in30)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    pendingReceivables,
    monthlyGrowth,
    businessHealthScore: businessHealthScore_,
    topClients,
    topServices,
    cashFlow,
    upcomingInvoices,
    activeProjects,
    totalClients: clients.length,
  };
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
export function seedIfEmpty(): void {
  if (localStorage.getItem(K.seeded)) return;

  const now = new Date();
  const ago = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
  const monthAgo = (m: number, day = 15) => {
    const d = new Date(now.getFullYear(), now.getMonth() - m, day);
    return d.toISOString();
  };

  // Clients
  const clients: Client[] = [
    { id: 'c1', name: 'Ravi Shankar', company: 'AI Arcade Technologies', email: 'ravi@aiarcade.tech', phone: '+91 98765 43210', address: 'Jubilee Hills, Hyderabad', contractValue: 850000, paymentStatus: 'current', notes: 'Long-term client. Prompt payer.', createdAt: ago(200), updatedAt: ago(10) },
    { id: 'c2', name: 'Dr. Priya Mehta', company: 'EduSecure Solutions', email: 'priya@edusecure.in', phone: '+91 97654 32109', address: 'Banjara Hills, Hyderabad', contractValue: 520000, paymentStatus: 'current', notes: 'EdTech domain. Multiple follow-up rounds needed.', createdAt: ago(180), updatedAt: ago(30) },
    { id: 'c3', name: 'Arjun Kapoor', company: 'Playflux Gaming Pvt Ltd', email: 'arjun@playflux.gg', phone: '+91 96543 21098', address: 'Gachibowli, Hyderabad', contractValue: 1200000, paymentStatus: 'partial', notes: 'E-commerce platform. 40% payment pending.', createdAt: ago(120), updatedAt: ago(5) },
    { id: 'c4', name: 'Lakshmi Devi', company: 'House of Vastra', email: 'lakshmi@houseofvastra.com', phone: '+91 95432 10987', address: 'Begumpet, Hyderabad', contractValue: 780000, paymentStatus: 'overdue', notes: 'Fashion e-commerce. Payment overdue by 15 days.', createdAt: ago(90), updatedAt: ago(2) },
    { id: 'c5', name: 'Vikram Nair', company: 'TechVenture Corp', email: 'vikram@techventure.io', phone: '+91 94321 09876', address: 'HITEC City, Hyderabad', contractValue: 1500000, paymentStatus: 'pending', notes: 'New enterprise client. Contract signed last month.', createdAt: ago(35), updatedAt: ago(1) },
  ];
  save(K.clients, clients);

  // Projects
  const projects: Project[] = [
    { id: 'p1', clientId: 'c1', name: 'AI Arcade Platform', description: 'AI tools marketplace with blog and community features.', budget: 850000, actualCost: 620000, status: 'completed', completionPercentage: 100, startDate: ago(190), endDate: ago(60), createdAt: ago(200), updatedAt: ago(60) },
    { id: 'p2', clientId: 'c2', name: 'Secure Exam Portal', description: 'Proctored exam platform for 10,000+ concurrent students.', budget: 520000, actualCost: 480000, status: 'completed', completionPercentage: 100, startDate: ago(170), endDate: ago(40), createdAt: ago(180), updatedAt: ago(40) },
    { id: 'p3', clientId: 'c3', name: 'Playflux E-Commerce', description: 'High-performance gaming gear store with edge cart.', budget: 1200000, actualCost: 550000, status: 'active', completionPercentage: 70, startDate: ago(100), endDate: ago(-60), createdAt: ago(120), updatedAt: ago(3) },
    { id: 'p4', clientId: 'c4', name: 'House of Vastra', description: 'Luxury Indian fashion boutique with HD product showcase.', budget: 780000, actualCost: 420000, status: 'active', completionPercentage: 60, startDate: ago(80), endDate: ago(-30), createdAt: ago(90), updatedAt: ago(2) },
    { id: 'p5', clientId: 'c5', name: 'TechVenture SaaS Dashboard', description: 'Enterprise analytics platform with real-time reporting.', budget: 1500000, actualCost: 120000, status: 'planning', completionPercentage: 10, startDate: ago(20), endDate: ago(-120), createdAt: ago(35), updatedAt: ago(1) },
  ];
  save(K.projects, projects);

  // Revenues (6 months)
  const revenues: Revenue[] = [
    // Month -5
    { id: generateId(), clientId: 'c1', invoiceId: 'inv1', amount: 425000, description: 'AI Arcade - Phase 1 milestone', category: 'development', date: monthAgo(5), createdAt: monthAgo(5) },
    { id: generateId(), clientId: 'c2', amount: 260000, description: 'Exam Portal - Discovery & Design', category: 'design', date: monthAgo(5, 20), createdAt: monthAgo(5, 20) },
    // Month -4
    { id: generateId(), clientId: 'c1', amount: 425000, description: 'AI Arcade - Phase 2 completion', category: 'development', date: monthAgo(4), createdAt: monthAgo(4) },
    { id: generateId(), clientId: 'c2', amount: 260000, description: 'Exam Portal - Development', category: 'development', date: monthAgo(4, 10), createdAt: monthAgo(4, 10) },
    // Month -3
    { id: generateId(), clientId: 'c3', amount: 480000, description: 'Playflux - Project kickoff & architecture', category: 'development', date: monthAgo(3), createdAt: monthAgo(3) },
    { id: generateId(), clientId: 'c2', amount: 85000, description: 'Exam Portal - DevOps setup', category: 'maintenance', date: monthAgo(3, 20), createdAt: monthAgo(3, 20) },
    // Month -2
    { id: generateId(), clientId: 'c3', amount: 240000, description: 'Playflux - Sprint 2 delivery', category: 'development', date: monthAgo(2), createdAt: monthAgo(2) },
    { id: generateId(), clientId: 'c4', amount: 312000, description: 'House of Vastra - Phase 1', category: 'development', date: monthAgo(2, 8), createdAt: monthAgo(2, 8) },
    { id: generateId(), clientId: 'c1', amount: 45000, description: 'AI Arcade - Post-launch consulting', category: 'consulting', date: monthAgo(2, 18), createdAt: monthAgo(2, 18) },
    // Month -1
    { id: generateId(), clientId: 'c3', amount: 180000, description: 'Playflux - Sprint 3', category: 'development', date: monthAgo(1), createdAt: monthAgo(1) },
    { id: generateId(), clientId: 'c4', amount: 195000, description: 'House of Vastra - Phase 2', category: 'design', date: monthAgo(1, 12), createdAt: monthAgo(1, 12) },
    { id: generateId(), clientId: 'c5', amount: 150000, description: 'TechVenture - Kickoff retainer', category: 'consulting', date: monthAgo(1, 20), createdAt: monthAgo(1, 20) },
    // Current month
    { id: generateId(), clientId: 'c3', amount: 150000, description: 'Playflux - Sprint 4 partial', category: 'development', date: ago(10), createdAt: ago(10) },
    { id: generateId(), clientId: 'c5', amount: 220000, description: 'TechVenture - Architecture blueprint', category: 'development', date: ago(5), createdAt: ago(5) },
  ];
  save(K.revenues, revenues);

  // Expenses (6 months)
  const expenses: Expense[] = [
    { id: generateId(), amount: 42000, description: 'AWS EC2 & S3 infrastructure', category: 'infrastructure', vendor: 'Amazon Web Services', date: monthAgo(5), createdAt: monthAgo(5) },
    { id: generateId(), amount: 15000, description: 'Figma Pro + GitHub Teams', category: 'tools', vendor: 'Figma / GitHub', date: monthAgo(5, 5), createdAt: monthAgo(5, 5) },
    { id: generateId(), projectId: 'p1', amount: 85000, description: 'Contract developer - AI module', category: 'salaries', vendor: 'Freelance Dev', date: monthAgo(5, 10), createdAt: monthAgo(5, 10) },
    { id: generateId(), amount: 42000, description: 'AWS infrastructure', category: 'infrastructure', vendor: 'Amazon Web Services', date: monthAgo(4), createdAt: monthAgo(4) },
    { id: generateId(), projectId: 'p2', amount: 60000, description: 'Senior developer contract', category: 'salaries', vendor: 'Contract Dev', date: monthAgo(4, 8), createdAt: monthAgo(4, 8) },
    { id: generateId(), amount: 28000, description: 'LinkedIn ads for client acquisition', category: 'marketing', vendor: 'LinkedIn', date: monthAgo(4, 15), createdAt: monthAgo(4, 15) },
    { id: generateId(), amount: 42000, description: 'AWS infrastructure', category: 'infrastructure', vendor: 'Amazon Web Services', date: monthAgo(3), createdAt: monthAgo(3) },
    { id: generateId(), projectId: 'p3', amount: 120000, description: 'Frontend + backend dev team', category: 'salaries', vendor: 'Contractor team', date: monthAgo(3, 10), createdAt: monthAgo(3, 10) },
    { id: generateId(), amount: 18000, description: 'Vercel Pro + PlanetScale', category: 'tools', vendor: 'Vercel / PlanetScale', date: monthAgo(3, 20), createdAt: monthAgo(3, 20) },
    { id: generateId(), amount: 48000, description: 'AWS + GCP costs', category: 'infrastructure', vendor: 'AWS / GCP', date: monthAgo(2), createdAt: monthAgo(2) },
    { id: generateId(), projectId: 'p3', amount: 95000, description: 'Sprint 2 dev team', category: 'salaries', vendor: 'Contractor team', date: monthAgo(2, 12), createdAt: monthAgo(2, 12) },
    { id: generateId(), projectId: 'p4', amount: 65000, description: 'UI/UX designer contract', category: 'salaries', vendor: 'Freelance Designer', date: monthAgo(2, 20), createdAt: monthAgo(2, 20) },
    { id: generateId(), amount: 48000, description: 'Cloud infrastructure', category: 'infrastructure', vendor: 'AWS', date: monthAgo(1), createdAt: monthAgo(1) },
    { id: generateId(), projectId: 'p3', amount: 75000, description: 'Sprint 3 dev team', category: 'salaries', vendor: 'Contractor team', date: monthAgo(1, 15), createdAt: monthAgo(1, 15) },
    { id: generateId(), projectId: 'p4', amount: 55000, description: 'Dev team Phase 2', category: 'salaries', vendor: 'Contract devs', date: monthAgo(1, 20), createdAt: monthAgo(1, 20) },
    { id: generateId(), amount: 22000, description: 'Google Ads campaign', category: 'marketing', vendor: 'Google', date: monthAgo(1, 25), createdAt: monthAgo(1, 25) },
    { id: generateId(), amount: 52000, description: 'AWS infrastructure - current month', category: 'infrastructure', vendor: 'AWS', date: ago(12), createdAt: ago(12) },
    { id: generateId(), projectId: 'p5', amount: 45000, description: 'Architecture consultant', category: 'salaries', vendor: 'Senior Architect', date: ago(8), createdAt: ago(8) },
    { id: generateId(), amount: 16000, description: 'Office supplies & misc', category: 'office', vendor: 'Various', date: ago(5), createdAt: ago(5) },
  ];
  save(K.expenses, expenses);

  // Invoices
  const invoiceItems1: InvoiceItem[] = [
    { id: generateId(), title: 'AI Arcade Phase 1 - Backend Engineering', details: 'Kubernetes clusters, Redis, API monolith setup', rate: 250000, quantity: 1, days: 30 },
    { id: generateId(), title: 'AI Arcade Phase 1 - Frontend Development', details: 'React SPA with AI tool integrations', rate: 175000, quantity: 1, days: 25 },
  ];
  const invoiceItems2: InvoiceItem[] = [
    { id: generateId(), title: 'Exam Portal - Full Stack Development', details: 'Student portal, admin panel, WebRTC proctoring', rate: 480000, quantity: 1, days: 45 },
    { id: generateId(), title: 'Exam Portal - DevOps Setup', details: 'CI/CD pipelines, Firebase deployment', rate: 40000, quantity: 1, days: 5 },
  ];
  const invoiceItems3: InvoiceItem[] = [
    { id: generateId(), title: 'Playflux - Sprint 1 to 3 Development', details: 'E-commerce platform, product catalog, cart system', rate: 720000, quantity: 1, days: 60 },
  ];
  const invoiceItems4: InvoiceItem[] = [
    { id: generateId(), title: 'House of Vastra - Web Platform', details: 'Fashion boutique with Stripe payments, Next.js', rate: 507000, quantity: 1, days: 45 },
  ];
  const invoiceItems5: InvoiceItem[] = [
    { id: generateId(), title: 'TechVenture - Architecture & Consulting', details: 'System design, tech stack recommendations, roadmap', rate: 370000, quantity: 1, days: 20 },
  ];

  const invoices: Invoice[] = [
    { id: 'inv1', invoiceNumber: 'INV-2025-0001', clientId: 'c1', projectId: 'p1', items: invoiceItems1, subtotal: 425000, taxRate: 0, taxAmount: 0, total: 425000, status: 'paid', issueDate: monthAgo(5), dueDate: monthAgo(4, 15), paidDate: monthAgo(4, 10), notes: 'Thank you for your business.', createdAt: monthAgo(5), updatedAt: monthAgo(4, 10) },
    { id: 'inv2', invoiceNumber: 'INV-2025-0002', clientId: 'c2', projectId: 'p2', items: invoiceItems2, subtotal: 520000, taxRate: 0, taxAmount: 0, total: 520000, status: 'paid', issueDate: monthAgo(4), dueDate: monthAgo(3, 1), paidDate: monthAgo(3, 5), notes: 'Payment received. Thank you.', createdAt: monthAgo(4), updatedAt: monthAgo(3, 5) },
    { id: 'inv3', invoiceNumber: 'INV-2025-0003', clientId: 'c3', projectId: 'p3', items: invoiceItems3, subtotal: 720000, taxRate: 0, taxAmount: 0, total: 720000, status: 'sent', issueDate: monthAgo(1), dueDate: ago(-15), notes: 'Payment due in 15 days.', createdAt: monthAgo(1), updatedAt: monthAgo(1) },
    { id: 'inv4', invoiceNumber: 'INV-2025-0004', clientId: 'c4', projectId: 'p4', items: invoiceItems4, subtotal: 507000, taxRate: 0, taxAmount: 0, total: 507000, status: 'overdue', issueDate: monthAgo(2), dueDate: monthAgo(1), notes: 'Payment is overdue. Please remit immediately.', createdAt: monthAgo(2), updatedAt: monthAgo(1) },
    { id: 'inv5', invoiceNumber: 'INV-2025-0005', clientId: 'c5', projectId: 'p5', items: invoiceItems5, subtotal: 370000, taxRate: 0, taxAmount: 0, total: 370000, status: 'draft', issueDate: ago(5), dueDate: ago(-25), notes: 'Quotation to be confirmed.', createdAt: ago(5), updatedAt: ago(5) },
  ];
  save(K.invoices, invoices);

  localStorage.setItem(K.seeded, 'true');
}
