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
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { Download } from 'lucide-react';

interface MonthData {
  month: string;
  monthShort: string;
  cashIn: number;
  cashOut: number;
  netCashFlow: number;
}

interface CashFlowReportProps {
  data: MonthData[];
}

const chartConfig = {
  cashIn: { label: 'Entradas', color: 'hsl(var(--chart-1))' },
  cashOut: { label: 'Salidas', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value);
}

export function CashFlowReport({ data }: CashFlowReportProps) {
  const totals = data.reduce(
    (acc, month) => ({
      cashIn: acc.cashIn + month.cashIn,
      cashOut: acc.cashOut + month.cashOut,
      netCashFlow: acc.netCashFlow + month.netCashFlow,
    }),
    { cashIn: 0, cashOut: 0, netCashFlow: 0 }
  );

  // Calculate running balance
  let runningBalance = 0;
  const dataWithBalance = data.map((month) => {
    runningBalance += month.netCashFlow;
    return { ...month, balance: runningBalance };
  });

  const exportToPDF = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then((autoTable) => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Flujo de Caja', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 30);

        const tableData = dataWithBalance.map((month) => [
          month.month,
          formatCurrency(month.cashIn),
          formatCurrency(month.cashOut),
          formatCurrency(month.netCashFlow),
          formatCurrency(month.balance),
        ]);

        tableData.push([
          'TOTAL',
          formatCurrency(totals.cashIn),
          formatCurrency(totals.cashOut),
          formatCurrency(totals.netCashFlow),
          '-',
        ]);

        (autoTable as { default: typeof autoTable.default }).default(doc, {
          startY: 40,
          head: [['Mes', 'Entradas', 'Salidas', 'Flujo Neto', 'Balance']],
          body: tableData,
          theme: 'striped',
        });

        doc.save('flujo-caja.pdf');
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportToPDF}>
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">Total Entradas</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.cashIn)}</p>
        </div>
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">Total Salidas</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totals.cashOut)}</p>
        </div>
        <div className={`p-4 rounded-lg ${totals.netCashFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border`}>
          <p className={`text-sm ${totals.netCashFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            Flujo Neto
          </p>
          <p className={`text-2xl font-bold ${totals.netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(totals.netCashFlow)}
          </p>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[300px] w-full">
        <BarChart data={data} accessibilityLayer>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="monthShort" tickLine={false} axisLine={false} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              new Intl.NumberFormat('es-CL', {
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
          <ReferenceLine y={0} stroke="#666" />
          <Bar dataKey="cashIn" fill="var(--color-cashIn)" radius={4} />
          <Bar dataKey="cashOut" fill="var(--color-cashOut)" radius={4} />
        </BarChart>
      </ChartContainer>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead className="text-right">Entradas</TableHead>
              <TableHead className="text-right">Salidas</TableHead>
              <TableHead className="text-right">Flujo Neto</TableHead>
              <TableHead className="text-right">Balance Acum.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataWithBalance.map((month) => (
              <TableRow key={month.month}>
                <TableCell className="font-medium">{month.month}</TableCell>
                <TableCell className="text-right text-green-600">
                  +{formatCurrency(month.cashIn)}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  -{formatCurrency(month.cashOut)}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${month.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {month.netCashFlow >= 0 ? '+' : ''}{formatCurrency(month.netCashFlow)}
                </TableCell>
                <TableCell
                  className={`text-right ${month.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}
                >
                  {formatCurrency(month.balance)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted font-bold">
              <TableCell>TOTAL</TableCell>
              <TableCell className="text-right text-green-600">
                +{formatCurrency(totals.cashIn)}
              </TableCell>
              <TableCell className="text-right text-red-600">
                -{formatCurrency(totals.cashOut)}
              </TableCell>
              <TableCell
                className={`text-right ${totals.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {totals.netCashFlow >= 0 ? '+' : ''}{formatCurrency(totals.netCashFlow)}
              </TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
