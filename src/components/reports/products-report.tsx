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
import { Badge } from '@/components/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

interface ProductData {
  id: string;
  name: string;
  totalSold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

interface ProductsReportProps {
  data: ProductData[];
}

const chartConfig = {
  revenue: { label: 'Ingresos', color: 'hsl(var(--chart-1))' },
  profit: { label: 'Ganancia', color: 'hsl(var(--chart-2))' },
} satisfies ChartConfig;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(value);
}

export function ProductsReport({ data }: ProductsReportProps) {
  const top10 = data.slice(0, 10);
  const totalRevenue = data.reduce((sum, p) => sum + p.revenue, 0);
  const totalProfit = data.reduce((sum, p) => sum + p.profit, 0);
  const avgMargin = data.length > 0
    ? data.reduce((sum, p) => sum + p.margin, 0) / data.length
    : 0;

  const exportToPDF = () => {
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then((autoTable) => {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Rendimiento de Productos', 14, 22);
        doc.setFontSize(11);
        doc.text(`Generado: ${new Date().toLocaleDateString('es-CL')}`, 14, 30);

        const tableData = data.map((product) => [
          product.name,
          product.totalSold.toString(),
          formatCurrency(product.revenue),
          formatCurrency(product.profit),
          `${product.margin.toFixed(1)}%`,
        ]);

        (autoTable as { default: typeof autoTable.default }).default(doc, {
          startY: 40,
          head: [['Producto', 'Vendidos', 'Ingresos', 'Ganancia', 'Margen']],
          body: tableData,
          theme: 'striped',
        });

        doc.save('rendimiento-productos.pdf');
      });
    });
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay datos de productos para mostrar
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportToPDF}>
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-600">Ingresos Totales</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">Ganancia Total</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalProfit)}</p>
        </div>
        <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
          <p className="text-sm text-purple-600">Margen Promedio</p>
          <p className="text-2xl font-bold text-purple-700">{avgMargin.toFixed(1)}%</p>
        </div>
      </div>

      {top10.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Top 10 Productos por Ingresos</h4>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart
              data={top10}
              layout="vertical"
              accessibilityLayer
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('es-CL', {
                    notation: 'compact',
                  }).format(value)
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={90}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Vendidos</TableHead>
              <TableHead className="text-right">Ingresos</TableHead>
              <TableHead className="text-right">Costo</TableHead>
              <TableHead className="text-right">Ganancia</TableHead>
              <TableHead className="text-right">Margen</TableHead>
              <TableHead>Rendimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((product, index) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {index < 3 && (
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                    )}
                    {product.name}
                  </div>
                </TableCell>
                <TableCell className="text-right">{product.totalSold}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.revenue)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(product.cost)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  +{formatCurrency(product.profit)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      product.margin >= 30
                        ? 'text-green-600'
                        : product.margin >= 15
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    }
                  >
                    {product.margin.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell>
                  {product.margin >= 30 ? (
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="text-xs">Excelente</span>
                    </div>
                  ) : product.margin >= 15 ? (
                    <div className="flex items-center text-yellow-600">
                      <span className="text-xs">Regular</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      <span className="text-xs">Bajo</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
