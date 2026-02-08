'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: 'sale' | 'expense';
  created_at: string;
  total_amount?: number;
  amount?: number;
  customer_name?: string;
  supplier?: string;
  category?: { name: string } | null;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transacciones Recientes</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <p className="text-muted-foreground">No hay transacciones recientes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transacciones Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const isSale = transaction.type === 'sale';
            const amount = isSale ? transaction.total_amount : transaction.amount;
            const description = isSale
              ? transaction.customer_name || 'Venta'
              : transaction.supplier || transaction.category?.name || 'Gasto';

            return (
              <div
                key={`${transaction.type}-${transaction.id}`}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      isSale ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {isSale ? (
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${isSale ? 'text-green-600' : 'text-red-600'}`}>
                    {isSale ? '+' : '-'}{formatCurrency(amount || 0)}
                  </p>
                  <Badge variant={isSale ? 'default' : 'secondary'} className="text-xs">
                    {isSale ? 'Venta' : 'Gasto'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
