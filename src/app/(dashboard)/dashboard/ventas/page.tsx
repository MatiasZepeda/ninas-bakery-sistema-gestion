import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { SalesTable } from '@/components/sales/sales-table';
import { SaleFormDialog } from '@/components/sales/sale-form-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

async function getSales() {
  const supabase = await createClient();

  const { data: sales, error } = await supabase
    .from('sales')
    .select(`
      *,
      items:sale_items(
        *,
        product:products(*)
      )
    `)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching sales:', error);
    return [];
  }

  return sales;
}

async function getProducts() {
  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return products;
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default async function VentasPage() {
  const [sales, products] = await Promise.all([
    getSales(),
    getProducts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales</h2>
          <p className="text-muted-foreground">
            Track and manage your sales
          </p>
        </div>
        <SaleFormDialog products={products}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </SaleFormDialog>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <SalesTable sales={sales} products={products} />
      </Suspense>
    </div>
  );
}
