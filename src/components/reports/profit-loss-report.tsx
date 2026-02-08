'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download } from 'lucide-react';

interface MonthData {
  month: string;
  monthShort: string;
  revenue: number;
  costOfGoods: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
}

interface ExpenseBreakdown {
  category: string;
  amount: number;
  color: string;
}

interface ProfitLossReportProps {
  data: MonthData[];
  expenseBreakdown: ExpenseBreakdown[];
}

const chartConfig = {
  revenue: { label: 'Revenue', color: 'hsl(var(--chart-1))' },
  netProfit: { label: 'Net Profit', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

export function ProfitLossReport({ data, expenseBreakdown }: ProfitLossReportProps) {
  const totals = data.reduce(
    (acc, month) => ({
      revenue: acc.revenue + month.revenue,
      costOfGoods: acc.costOfGoods + month.costOfGoods,
      grossProfit: acc.grossProfit + month.grossProfit,
      operatingExpenses: acc.operatingExpenses + month.operatingExpenses,
      netProfit: acc.netProfit + month.netProfit,
    }),
    { revenue: 0, costOfGoods: 0, grossProfit: 0, operatingExpenses: 0, netProfit: 0 }
  );

  const grossMargin = totals.revenue > 0 ? (totals.grossProfit / totals.revenue) * 100 : 0;
  const netMargin = totals.revenue > 0 ? (totals.netProfit / totals.revenue) * 100 : 0;

  const exportToPDF = () => {
    // Dynamic import to avoid SSR issues
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then((autoTable) => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Profit & Loss Statement', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US')}`, 14, 30);

        const tableData = [
          ['Sales Revenue', formatCurrency(totals.revenue)],
          ['(-) Cost of Goods Sold', formatCurrency(totals.costOfGoods)],
          ['= Gross Profit', formatCurrency(totals.grossProfit)],
          ['(-) Operating Expenses', formatCurrency(totals.operatingExpenses)],
          ['= Net Profit', formatCurrency(totals.netProfit)],
          ['', ''],
          ['Gross Margin', `${grossMargin.toFixed(1)}%`],
          ['Net Margin', `${netMargin.toFixed(1)}%`],
        ];

        (autoTable as { default: typeof autoTable.default }).default(doc, {
          startY: 40,
          head: [['Item', 'Amount']],
          body: tableData,
          theme: 'striped',
        });

        doc.save('profit-loss-statement.pdf');
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportToPDF}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <LineChart data={data} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="monthShort" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              new Intl.NumberFormat('en-US', {
                notation: 'compact',
              }).format(value)
            }
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => formatCurrency(Number(value))}
              />
            }
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="netProfit"
            stroke="var(--color-netProfit)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ChartContainer>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">12-Month Total</TableHead>
              <TableHead className="text-right">% of Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Sales Revenue</TableCell>
              <TableCell className="text-right">{formatCurrency(totals.revenue)}</TableCell>
              <TableCell className="text-right">100%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground pl-6">(-) Cost of Goods Sold</TableCell>
              <TableCell className="text-right text-red-600">
                {formatCurrency(totals.costOfGoods)}
              </TableCell>
              <TableCell className="text-right">
                {totals.revenue > 0 ? `${((totals.costOfGoods / totals.revenue) * 100).toFixed(1)}%` : '0%'}
              </TableCell>
            </TableRow>
            <TableRow className="bg-muted/50">
              <TableCell className="font-medium">= Gross Profit</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(totals.grossProfit)}
              </TableCell>
              <TableCell className="text-right font-medium">{grossMargin.toFixed(1)}%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-muted-foreground pl-6">(-) Operating Expenses</TableCell>
              <TableCell className="text-right text-red-600">
                {formatCurrency(totals.operatingExpenses)}
              </TableCell>
              <TableCell className="text-right">
                {totals.revenue > 0
                  ? `${((totals.operatingExpenses / totals.revenue) * 100).toFixed(1)}%`
                  : '0%'}
              </TableCell>
            </TableRow>
            <TableRow className="bg-muted">
              <TableCell className="font-bold">= Net Profit</TableCell>
              <TableCell
                className={`text-right font-bold ${totals.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {formatCurrency(totals.netProfit)}
              </TableCell>
              <TableCell className="text-right font-bold">{netMargin.toFixed(1)}%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {expenseBreakdown.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Expense Breakdown (Current Month)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {expenseBreakdown.map((expense) => (
              <div
                key={expense.category}
                className="p-3 rounded-lg border"
                style={{ borderLeftColor: expense.color, borderLeftWidth: 4 }}
              >
                <p className="text-sm text-muted-foreground">{expense.category}</p>
                <p className="font-medium">{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
