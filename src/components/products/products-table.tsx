'use client';

import { useState, useMemo } from 'react';
import { Product, Category } from '@/types/database';
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
import { MoreHorizontal, Pencil, Trash2, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { ProductFormDialog } from './product-form-dialog';
import { DeleteProductDialog } from './delete-product-dialog';

interface ProductsTableProps {
  products: (Product & { category: Category | null })[];
  categories: Category[];
}

type SortKey = 'name' | 'sku' | 'category' | 'cost_price' | 'sale_price' | 'margin' | 'status';
type SortDir = 'asc' | 'desc';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);
}

function getMargin(product: Product): number {
  return product.sale_price > 0
    ? ((product.sale_price - product.cost_price) / product.sale_price) * 100
    : 0;
}

function SortIcon({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey | null; sortDir: SortDir }) {
  if (sortKey !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
  return sortDir === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3" />
    : <ArrowDown className="ml-1 h-3 w-3" />;
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const [search, setSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedProducts = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku?.toLowerCase().includes(search.toLowerCase())
    );

    if (!sortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'sku':
          cmp = (a.sku || '').localeCompare(b.sku || '');
          break;
        case 'category':
          cmp = (a.category?.name || '').localeCompare(b.category?.name || '');
          break;
        case 'cost_price':
          cmp = a.cost_price - b.cost_price;
          break;
        case 'sale_price':
          cmp = a.sale_price - b.sale_price;
          break;
        case 'margin':
          cmp = getMargin(a) - getMargin(b);
          break;
        case 'status':
          cmp = Number(b.is_active) - Number(a.is_active);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [products, search, sortKey, sortDir]);

  const thClass = "cursor-pointer select-none hover:text-foreground transition-colors";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
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
              <TableHead className={thClass} onClick={() => handleSort('name')}>
                <span className="flex items-center">Product <SortIcon column="name" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={`${thClass} hidden md:table-cell`} onClick={() => handleSort('sku')}>
                <span className="flex items-center">SKU <SortIcon column="sku" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={`${thClass} hidden sm:table-cell`} onClick={() => handleSort('category')}>
                <span className="flex items-center">Category <SortIcon column="category" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={`${thClass} hidden sm:table-cell text-right`} onClick={() => handleSort('cost_price')}>
                <span className="flex items-center justify-end">Cost <SortIcon column="cost_price" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={`${thClass} text-right`} onClick={() => handleSort('sale_price')}>
                <span className="flex items-center justify-end">Sale Price <SortIcon column="sale_price" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={`${thClass} text-right`} onClick={() => handleSort('margin')}>
                <span className="flex items-center justify-end">Margin <SortIcon column="margin" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className={`${thClass} hidden md:table-cell`} onClick={() => handleSort('status')}>
                <span className="flex items-center">Status <SortIcon column="status" sortKey={sortKey} sortDir={sortDir} /></span>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {search ? 'No products found' : 'No products registered'}
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map((product) => {
                const margin = getMargin(product);

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground hidden md:table-cell">
                      {product.sku || '-'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {product.category ? (
                        <Badge
                          variant="outline"
                          style={{ borderColor: product.category.color || undefined }}
                        >
                          {product.category.name}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                      {formatCurrency(product.cost_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.sale_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600'}>
                        {margin.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant={product.is_active ? 'default' : 'secondary'}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingProduct(product)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeletingProduct(product)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editingProduct && (
        <ProductFormDialog
          categories={categories}
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />
      )}

      {deletingProduct && (
        <DeleteProductDialog
          product={deletingProduct}
          open={!!deletingProduct}
          onOpenChange={(open) => !open && setDeletingProduct(null)}
        />
      )}
    </div>
  );
}
