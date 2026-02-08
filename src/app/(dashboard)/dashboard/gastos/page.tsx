import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { ExpensesTable } from '@/components/expenses/expenses-table';
import { ExpenseFormDialog } from '@/components/expenses/expense-form-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

async function getExpenses() {
  const supabase = await createClient();

  const { data: expenses, error } = await supabase
    .from('expenses')
    .select('*, category:categories(*)')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
    return [];
  }

  return expenses;
}

async function getCategories() {
  const supabase = await createClient();

  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .in('type', ['expense', 'both'])
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return categories;
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

export default async function GastosPage() {
  const [expenses, categories] = await Promise.all([
    getExpenses(),
    getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gastos</h2>
          <p className="text-muted-foreground">
            Registra y gestiona los gastos de tu negocio
          </p>
        </div>
        <ExpenseFormDialog categories={categories}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Gasto
          </Button>
        </ExpenseFormDialog>
      </div>

      <Suspense fallback={<TableSkeleton />}>
        <ExpensesTable expenses={expenses} categories={categories} />
      </Suspense>
    </div>
  );
}
