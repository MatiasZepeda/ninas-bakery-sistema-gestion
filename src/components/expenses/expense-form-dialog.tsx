'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Expense, ExpenseItem, Category, PaymentMethod } from '@/types/database';
import { OWNER_ID } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { Loader2, CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ReceiptScanner } from './receipt-scanner';

interface ExpenseFormDialogProps {
  categories: Category[];
  expense?: Expense & { expense_items?: ExpenseItem[] };
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface ExpenseItemInput {
  name: string;
  quantity: string;
  unit_price: string;
}

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'debit', label: 'Debit' },
  { value: 'credit', label: 'Credit' },
  { value: 'transfer', label: 'Transfer' },
];

export function ExpenseFormDialog({
  categories,
  expense,
  children,
  open: controlledOpen,
  onOpenChange,
}: ExpenseFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [categoryId, setCategoryId] = useState('');
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [items, setItems] = useState<ExpenseItemInput[]>([]);
  const router = useRouter();
  const supabase = createClient();

  const isEditing = !!expense;
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : open;
  const setIsOpen = isControlled ? onOpenChange! : setOpen;

  const hasItems = items.length > 0;

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setDate(new Date(expense.date));
      setCategoryId(expense.category_id || '');
      setSupplier(expense.supplier || '');
      setDescription(expense.description || '');
      setPaymentMethod(expense.payment_method || '');
      // Load existing expense items
      if (expense.expense_items && expense.expense_items.length > 0) {
        setItems(
          expense.expense_items.map((item) => ({
            name: item.name,
            quantity: String(item.quantity),
            unit_price: String(item.unit_price),
          }))
        );
      } else {
        setItems([]);
      }
    } else {
      resetForm();
    }
  }, [expense]);

  const resetForm = () => {
    setAmount('');
    setDate(new Date());
    setCategoryId('');
    setSupplier('');
    setDescription('');
    setPaymentMethod('');
    setItems([]);
  };

  const handleScanComplete = (result: {
    items: { name: string; quantity: number; unit_price: number; total_price: number }[];
    total: number | null;
    date: string | null;
    supplier: string | null;
  }) => {
    // Set items from scan
    setItems(
      result.items.map((item) => ({
        name: item.name,
        quantity: String(item.quantity),
        unit_price: String(item.unit_price),
      }))
    );

    // Set supplier if found
    if (result.supplier) {
      setSupplier(result.supplier);
    }

    // Set date if found
    if (result.date) {
      // Append T12:00:00 to avoid timezone offset shifting the day
      const parsed = new Date(result.date + 'T12:00:00');
      if (!isNaN(parsed.getTime())) {
        setDate(parsed);
      }
    }

    // Amount will be auto-calculated from items
  };

  const addItem = () => {
    setItems([...items, { name: '', quantity: '1', unit_price: '' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ExpenseItemInput, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Calculate total from items
  const itemsTotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0),
    0
  );

  // Use items total when items exist, otherwise use manual amount
  const effectiveAmount = hasItems ? itemsTotal : parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (effectiveAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setLoading(true);

    try {
      const expenseData = {
        amount: effectiveAmount,
        date: format(date, 'yyyy-MM-dd'),
        category_id: (categoryId && categoryId !== 'none') ? categoryId : null,
        supplier: supplier || null,
        description: description || null,
        payment_method: paymentMethod || null,
        user_id: OWNER_ID,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.id);

        if (error) throw error;

        // Delete old items and insert new ones
        await supabase
          .from('expense_items')
          .delete()
          .eq('expense_id', expense.id);

        if (items.length > 0) {
          const expenseItems = items
            .filter((item) => item.name && parseFloat(item.unit_price) > 0)
            .map((item) => {
              const qty = parseFloat(item.quantity) || 1;
              const price = parseFloat(item.unit_price) || 0;
              return {
                expense_id: expense.id,
                name: item.name,
                quantity: qty,
                unit_price: price,
                total_price: qty * price,
              };
            });

          if (expenseItems.length > 0) {
            const { error: itemsError } = await supabase
              .from('expense_items')
              .insert(expenseItems);

            if (itemsError) throw itemsError;
          }
        }

        toast.success('Expense updated');
      } else {
        const { data: newExpense, error } = await supabase
          .from('expenses')
          .insert(expenseData)
          .select()
          .single();

        if (error) throw error;

        // Insert items if any
        if (items.length > 0) {
          const expenseItems = items
            .filter((item) => item.name && parseFloat(item.unit_price) > 0)
            .map((item) => {
              const qty = parseFloat(item.quantity) || 1;
              const price = parseFloat(item.unit_price) || 0;
              return {
                expense_id: newExpense.id,
                name: item.name,
                quantity: qty,
                unit_price: price,
                total_price: qty * price,
              };
            });

          if (expenseItems.length > 0) {
            const { error: itemsError } = await supabase
              .from('expense_items')
              .insert(expenseItems);

            if (itemsError) throw itemsError;
          }
        }

        toast.success('Expense recorded');
      }

      setIsOpen(false);
      resetForm();
      router.refresh();
    } catch (error) {
      toast.error(isEditing ? 'Error updating' : 'Error recording');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Expense' : 'New Expense'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modify expense details'
              : 'Record a new business expense'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Receipt Scanner - only for new expenses */}
            {!isEditing && (
              <ReceiptScanner
                onScanComplete={handleScanComplete}
                disabled={loading}
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                {hasItems ? (
                  <div className="h-10 px-3 py-2 rounded-md border bg-muted text-sm font-medium">
                    {itemsTotal.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({items.filter(i => i.name && parseFloat(i.unit_price) > 0).length} items)
                    </span>
                  </div>
                ) : (
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    required={!hasItems}
                    disabled={loading}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !date && 'text-muted-foreground'
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'MM/dd/yyyy') : 'Select'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Supplier name"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Items section */}
            {hasItems && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={loading}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Item name"
                        disabled={loading}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeItem(index)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground shrink-0">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      <div className="flex-1 flex items-center gap-1.5">
                        <Label className="text-xs text-muted-foreground shrink-0">Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add items manually button (when no items yet) */}
            {!hasItems && !isEditing && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={addItem}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add items manually
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Expense details..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Save Changes' : 'Record Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
