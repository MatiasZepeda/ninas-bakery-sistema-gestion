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

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
  const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
  const lastDayLastMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

  // Fetch all data in parallel (was 10 sequential queries)
  const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1).toISOString().split('T')[0];

  const [
    { data: salesHistory },
    { data: expensesHistory },
    { data: saleItems },
    { data: recentSales },
    { data: recentExpenses },
  ] = await Promise.all([
    // All sales from last 6 months (replaces 3 queries: current, last month, history)
    supabase
      .from('sales')
      .select('date, total_amount, profit, created_at, customer_name, channel, payment_method')
      .gte('date', sixMonthsAgo)
      .order('date', { ascending: true }),
    // All expenses from last 6 months with category (replaces 4 queries)
    supabase
      .from('expenses')
      .select('date, amount, created_at, description, category:categories(name, color)')
      .gte('date', sixMonthsAgo)
      .order('date', { ascending: true }),
    // Top products this month
    supabase
      .from('sale_items')
      .select('quantity, subtotal, unit_cost, product:products(id, name), sale:sales!inner(date)')
      .gte('sale.date', firstDayCurrentMonth)
      .lte('sale.date', lastDayCurrentMonth),
    // Recent sales
    supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5),
    // Recent expenses
    supabase
      .from('expenses')
      .select('*, category:categories(name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  // Filter current/last month from the 6-month data (instead of separate queries)
  const currentSales = salesHistory?.filter(s => s.date >= firstDayCurrentMonth && s.date <= lastDayCurrentMonth);
  const lastMonthSales = salesHistory?.filter(s => s.date >= firstDayLastMonth && s.date <= lastDayLastMonth);
  const currentExpenses = expensesHistory?.filter(e => e.date >= firstDayCurrentMonth && e.date <= lastDayCurrentMonth);
  const lastMonthExpenses = expensesHistory?.filter(e => e.date >= firstDayLastMonth && e.date <= lastDayLastMonth);
  const expensesByCategory = currentExpenses;

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
