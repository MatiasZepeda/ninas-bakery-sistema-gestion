'use client';

import { useState } from 'react';
import { Sale, SaleItem, Product } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, Trash2, Search, Calendar, Eye } from 'lucide-react';
import { DeleteSaleDialog } from './delete-sale-dialog';
import { format } from 'date-fns';

interface SaleWithItems extends Sale {
  items: (SaleItem & { product: Product | null })[];
}

interface SalesTableProps {
  sales: SaleWithItems[];
  products: Product[];
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash',
  debit: 'Debit',
  credit: 'Credit',
  transfer: 'Transfer',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

export function SalesTable({ sales }: SalesTableProps) {
  const [search, setSearch] = useState('');
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [viewingSale, setViewingSale] = useState<SaleWithItems | null>(null);

  const filteredSales = sales.filter((sale) =>
    sale.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    sale.channel?.toLowerCase().includes(search.toLowerCase())
  );

  const totalFiltered = filteredSales.reduce((sum, s) => sum + Number(s.total_amount), 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + Number(s.profit), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or channel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {search ? 'No sales found' : 'No sales registered'}
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {format(new Date(sale.date), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {sale.customer_name || 'General Customer'}
                  </TableCell>
                  <TableCell>
                    {sale.channel ? (
                      <Badge variant="outline">{sale.channel}</Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {sale.items.length} product{sale.items.length !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    {sale.payment_method
                      ? paymentMethodLabels[sale.payment_method]
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(sale.total_amount)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    +{formatCurrency(sale.profit)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewingSale(sale)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingSale(sale)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredSales.length > 0 && (
        <div className="flex justify-end gap-6">
          <p className="text-sm text-muted-foreground">
            Total: <span className="font-bold">{formatCurrency(totalFiltered)}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Profit: <span className="font-bold text-green-600">+{formatCurrency(totalProfit)}</span>
          </p>
        </div>
      )}

      {deletingSale && (
        <DeleteSaleDialog
          sale={deletingSale}
          open={!!deletingSale}
          onOpenChange={(open) => !open && setDeletingSale(null)}
        />
      )}

      <Dialog open={!!viewingSale} onOpenChange={(open) => !open && setViewingSale(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {viewingSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">
                    {format(new Date(viewingSale.date), 'MMMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <p className="font-medium">{viewingSale.customer_name || 'General Customer'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Channel:</span>
                  <p className="font-medium">{viewingSale.channel || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment Method:</span>
                  <p className="font-medium">
                    {viewingSale.payment_method
                      ? paymentMethodLabels[viewingSale.payment_method]
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewingSale.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product?.name || 'Deleted product'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <div>
                  <span className="text-muted-foreground">Total Cost:</span>
                  <p className="font-medium">{formatCurrency(viewingSale.total_cost)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sale Total:</span>
                  <p className="font-bold text-lg">{formatCurrency(viewingSale.total_amount)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Profit:</span>
                  <p className="font-bold text-lg text-green-600">+{formatCurrency(viewingSale.profit)}</p>
                </div>
              </div>

              {viewingSale.notes && (
                <div className="pt-4 border-t">
                  <span className="text-muted-foreground">Notes:</span>
                  <p className="mt-1">{viewingSale.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
