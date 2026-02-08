export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'transfer';
export type CategoryType = 'expense' | 'product' | 'both';

export interface User {
  id: string;
  email: string;
  business_name: string | null;
  currency: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  color: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  sku: string | null;
  cost_price: number;
  sale_price: number;
  category_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  date: string;
  category_id: string | null;
  supplier: string | null;
  description: string | null;
  payment_method: PaymentMethod | null;
  receipt_url: string | null;
  is_recurring: boolean;
  tax_amount: number | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface ExpenseItem {
  id: string;
  expense_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Sale {
  id: string;
  user_id: string;
  date: string;
  total_amount: number;
  total_cost: number;
  profit: number;
  channel: string | null;
  payment_method: PaymentMethod | null;
  customer_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  discount: number;
  subtotal: number;
  product?: Product;
}

export interface SaleWithItems extends Sale {
  items: (SaleItem & { product: Product })[];
}

export interface ExpenseWithItems extends Expense {
  items: ExpenseItem[];
}

// Dashboard types
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  profitMargin: number;
  revenueChange: number;
  expensesChange: number;
  profitChange: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface TopProduct {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
  profit: number;
}

export interface ExpenseByCategory {
  category: string;
  amount: number;
  color: string;
}
