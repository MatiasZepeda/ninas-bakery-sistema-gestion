import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { ExpensesPieChart } from '@/components/dashboard/expenses-pie-chart';
import { TopProducts } from '@/components/dashboard/top-products';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { Skeleton } from '@/components/ui/skeleton';

async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
  const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
  const lastDayLastMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

  // Current month sales
  const { data: currentSales } = await supabase
    .from('sales')
    .select('total_amount, profit')
    .gte('date', firstDayCurrentMonth)
    .lte('date', lastDayCurrentMonth);

  // Last month sales
  const { data: lastMonthSales } = await supabase
    .from('sales')
    .select('total_amount, profit')
    .gte('date', firstDayLastMonth)
    .lte('date', lastDayLastMonth);

  // Current month expenses
  const { data: currentExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', firstDayCurrentMonth)
    .lte('date', lastDayCurrentMonth);

  // Last month expenses
  const { data: lastMonthExpenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('date', firstDayLastMonth)
    .lte('date', lastDayLastMonth);

  // Last 6 months data for chart
  const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1).toISOString().split('T')[0];

  const { data: salesHistory } = await supabase
    .from('sales')
    .select('date, total_amount, profit')
    .gte('date', sixMonthsAgo)
    .order('date', { ascending: true });

  const { data: expensesHistory } = await supabase
    .from('expenses')
    .select('date, amount')
    .gte('date', sixMonthsAgo)
    .order('date', { ascending: true });

  // Expenses by category
  const { data: expensesByCategory } = await supabase
    .from('expenses')
    .select('amount, category:categories(name, color)')
    .gte('date', firstDayCurrentMonth)
    .lte('date', lastDayCurrentMonth);

  // Top products this month
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select(`
      quantity,
      subtotal,
      unit_cost,
      product:products(id, name),
      sale:sales!inner(date)
    `)
    .gte('sale.date', firstDayCurrentMonth)
    .lte('sale.date', lastDayCurrentMonth);

  // Recent transactions
  const { data: recentSales } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: recentExpenses } = await supabase
    .from('expenses')
    .select('*, category:categories(name)')
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculate stats
  const totalRevenue = currentSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
  const totalExpensesAmount = currentExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const profit = totalRevenue - totalExpensesAmount;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const lastMonthRevenue = lastMonthSales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
  const lastMonthExpensesAmount = lastMonthExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const lastMonthProfit = lastMonthRevenue - lastMonthExpensesAmount;

  const revenueChange = lastMonthRevenue > 0
    ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;
  const expensesChange = lastMonthExpensesAmount > 0
    ? ((totalExpensesAmount - lastMonthExpensesAmount) / lastMonthExpensesAmount) * 100
    : 0;
  const profitChange = lastMonthProfit !== 0
    ? ((profit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100
    : 0;

  // Process monthly data for chart
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(currentYear, currentMonth - i, 1);
    const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short' });
    const monthStart = new Date(currentYear, currentMonth - i, 1).toISOString().split('T')[0];
    const monthEnd = new Date(currentYear, currentMonth - i + 1, 0).toISOString().split('T')[0];

    const monthRevenue = salesHistory
      ?.filter(s => s.date >= monthStart && s.date <= monthEnd)
      .reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;

    const monthExpenses = expensesHistory
      ?.filter(e => e.date >= monthStart && e.date <= monthEnd)
      .reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    monthlyData.push({
      month: monthStr,
      revenue: monthRevenue,
      expenses: monthExpenses,
      profit: monthRevenue - monthExpenses,
    });
  }

  // Process expenses by category
  const categoryTotals: Record<string, { amount: number; color: string }> = {};
  expensesByCategory?.forEach((e) => {
    const cat = e.category as unknown as { name: string; color: string } | null;
    const catName = cat?.name || 'Uncategorized';
    const catColor = cat?.color || '#888888';
    if (!categoryTotals[catName]) {
      categoryTotals[catName] = { amount: 0, color: catColor };
    }
    categoryTotals[catName].amount += Number(e.amount);
  });

  const expensesByCategoryData = Object.entries(categoryTotals).map(([category, data]) => ({
    category,
    amount: data.amount,
    color: data.color,
  }));

  // Process top products
  const productTotals: Record<string, { name: string; totalSold: number; revenue: number; profit: number }> = {};
  saleItems?.forEach((item) => {
    const product = item.product as unknown as { id: string; name: string } | null;
    if (product) {
      if (!productTotals[product.id]) {
        productTotals[product.id] = { name: product.name, totalSold: 0, revenue: 0, profit: 0 };
      }
      productTotals[product.id].totalSold += Number(item.quantity);
      productTotals[product.id].revenue += Number(item.subtotal);
      productTotals[product.id].profit += Number(item.subtotal) - (Number(item.unit_cost) * Number(item.quantity));
    }
  });

  const topProducts = Object.entries(productTotals)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Merge recent transactions
  const transactions = [
    ...(recentSales?.map(s => ({ ...s, type: 'sale' as const })) || []),
    ...(recentExpenses?.map(e => ({ ...e, type: 'expense' as const })) || []),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
   .slice(0, 5);

  return {
    stats: {
      totalRevenue,
      totalExpenses: totalExpensesAmount,
      profit,
      profitMargin,
      revenueChange,
      expensesChange,
      profitChange,
    },
    monthlyData,
    expensesByCategory: expensesByCategoryData,
    topProducts,
    recentTransactions: transactions,
  };
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32" />
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats stats={data.stats} />
      </Suspense>

      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChart data={data.monthlyData} />
        <ExpensesPieChart data={data.expensesByCategory} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <TopProducts products={data.topProducts} />
        <RecentTransactions transactions={data.recentTransactions} />
      </div>
    </div>
  );
}
