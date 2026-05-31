// ─── Auth ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'founder' | 'admin' | 'viewer';
  createdAt: string;
}

export interface AdminSession {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  expiresAt: number; // Unix ms
}

// ─── Client ──────────────────────────────────────────────────────────────────
export type PaymentStatus = 'current' | 'overdue' | 'pending' | 'partial';

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  contractValue: number;
  paymentStatus: PaymentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Project ─────────────────────────────────────────────────────────────────
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on-hold' | 'cancelled';

export interface Project {
  id: string;
  clientId: string;
  clientName?: string;
  name: string;
  description: string;
  budget: number;
  actualCost: number;
  status: ProjectStatus;
  completionPercentage: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Financial ───────────────────────────────────────────────────────────────
export type RevenueCategory = 'development' | 'design' | 'consulting' | 'maintenance' | 'other';
export type ExpenseCategory = 'infrastructure' | 'tools' | 'salaries' | 'marketing' | 'office' | 'miscellaneous';

export interface Revenue {
  id: string;
  clientId: string;
  clientName?: string;
  projectId?: string;
  invoiceId?: string;
  amount: number;
  description: string;
  category: RevenueCategory;
  date: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  projectId?: string;
  projectName?: string;
  amount: number;
  description: string;
  category: ExpenseCategory;
  vendor: string;
  date: string;
  createdAt: string;
}

// ─── Invoice ─────────────────────────────────────────────────────────────────
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  id: string;
  title: string;
  details: string;
  rate: number;
  quantity: number;
  days: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName?: string;
  projectId?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Audit ───────────────────────────────────────────────────────────────────
export type AuditAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'view';

export interface AuditEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface MonthlySnapshot {
  month: string;
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
  newClients: number;
}

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingReceivables: number;
  monthlyGrowth: number;
  businessHealthScore: number;
  topClients: Array<{ id: string; name: string; revenue: number }>;
  topServices: Array<{ category: string; revenue: number }>;
  cashFlow: Array<{ month: string; income: number; expenses: number }>;
  upcomingInvoices: Invoice[];
  activeProjects: number;
  totalClients: number;
}
