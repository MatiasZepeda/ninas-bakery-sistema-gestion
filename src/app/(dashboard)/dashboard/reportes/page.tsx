import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfitLossReport } from '@/components/reports/profit-loss-report';
import { CashFlowReport } from '@/components/reports/cash-flow-report';
import { ProductsReport } from '@/components/reports/products-report';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

async function getReportData() {
  const supabase = await createClient();
  const now = new Date();
  const currentMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

  // Last 12 months data
  const monthsData = [];
  for (let i = 11; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd');

    const { data: sales } = await supabase
      .from('sales')
      .select('total_amount, total_cost, profit')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const { data: expenses } = await supabase
      .from('expenses')
      .select('amount, category:categories(name)')
      .gte('date', monthStart)
      .lte('date', monthEnd);

    const revenue = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
    const costOfGoods = sales?.reduce((sum, s) => sum + Number(s.total_cost), 0) || 0;
    const grossProfit = revenue - costOfGoods;
    const operatingExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
    const netProfit = grossProfit - operatingExpenses;

    monthsData.push({
      month: format(monthDate, 'MMM yyyy'),
      monthShort: format(monthDate, 'MMM'),
      revenue,
      costOfGoods,
      grossProfit,
      operatingExpenses,
      netProfit,
      cashIn: revenue,
      cashOut: operatingExpenses + costOfGoods,
      netCashFlow: revenue - operatingExpenses - costOfGoods,
    });
  }

  // Products performance
  const { data: saleItems } = await supabase
    .from('sale_items')
    .select(`
      quantity,
      subtotal,
      unit_cost,
      product:products(id, name, sale_price, cost_price)
    `);

  const productStats: Record<string, {
    name: string;
    totalSold: number;
    revenue: number;
    cost: number;
    profit: number;
  }> = {};

  saleItems?.forEach((item) => {
    const product = item.product as unknown as { id: string; name: string } | null;
    if (product) {
      if (!productStats[product.id]) {
        productStats[product.id] = {
          name: product.name,
          totalSold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
      }
      productStats[product.id].totalSold += Number(item.quantity);
      productStats[product.id].revenue += Number(item.subtotal);
      productStats[product.id].cost += Number(item.unit_cost) * Number(item.quantity);
      productStats[product.id].profit +=
        Number(item.subtotal) - Number(item.unit_cost) * Number(item.quantity);
    }
  });

  const productsPerformance = Object.entries(productStats)
    .map(([id, data]) => ({
      id,
      ...data,
      margin: data.revenue > 0 ? (data.profit / data.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Expense breakdown by category (current month)
  const { data: expensesByCategory } = await supabase
    .from('expenses')
    .select('amount, category:categories(name, color)')
    .gte('date', currentMonthStart)
    .lte('date', currentMonthEnd);

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

  const expenseBreakdown = Object.entries(categoryTotals)
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.amount - a.amount);

  return {
    monthsData,
    productsPerformance,
    expenseBreakdown,
  };
}

export default async function ReportesPage() {
  const data = await getReportData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">
          Financial analysis and business performance
        </p>
      </div>

      <Tabs defaultValue="pnl" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="pnl">
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <CardDescription>
                Summary of revenue, costs and profits for the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitLossReport data={data.monthsData} expenseBreakdown={data.expenseBreakdown} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>
                Incoming and outgoing cash movement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CashFlowReport data={data.monthsData} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Sales and profitability analysis by product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductsReport data={data.productsPerformance} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
