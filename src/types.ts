export type UserRole = 'admin' | 'member';

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  details?: string;
}

export interface Funding {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  month: string;
  year: number;
  updatedAt: string;
  updatedBy: string;
}

export interface Log {
  id: string;
  type: string;
  details: string;
  timestamp: string;
  adminId: string;
  adminName: string;
}

export interface FundInfo {
  id: string;
  name: string;
  description: string;
  year: number;
}

export type ExpenseCategory = 'vehicle' | 'program' | 'food' | 'transport' | 'office' | 'utilities' | 'other';

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  byCategory: Record<ExpenseCategory, number>;
  monthlyTrend: Array<{ month: string; year: number; total: number }>;
}
