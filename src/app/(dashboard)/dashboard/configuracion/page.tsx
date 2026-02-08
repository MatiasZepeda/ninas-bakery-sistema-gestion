'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { Category } from '@/types/database';

const currencies = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'CLP', label: 'Chilean Peso (CLP)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'ARS', label: 'Argentine Peso (ARS)' },
  { value: 'MXN', label: 'Mexican Peso (MXN)' },
];

export default function ConfiguracionPage() {
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'expense' | 'product'>('expense');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setEmail(user.email || '');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setBusinessName(profile.business_name || '');
      setCurrency(profile.currency || 'USD');
    }

    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (cats) {
      setCategories(cats);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { error } = await supabase
        .from('profiles')
        .update({
          business_name: businessName,
          currency: currency,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Settings saved');
      router.refresh();
    } catch (error) {
      toast.error('Error saving');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Enter a category name');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthorized');

      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name: newCategoryName,
        type: newCategoryType,
        is_system: false,
      });

      if (error) throw error;

      toast.success('Category created');
      setNewCategoryName('');
      loadData();
    } catch (error) {
      toast.error('Error creating category');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.is_system) {
      toast.error('System categories cannot be deleted');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id);

      if (error) throw error;

      toast.success('Category deleted');
      loadData();
    } catch (error) {
      toast.error('Error deleting');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense' || c.type === 'both');
  const productCategories = categories.filter((c) => c.type === 'product' || c.type === 'both');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Configure your business data and categories
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Basic information about your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="My Business"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSaveProfile} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Manage expense and product categories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="New category..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={loading}
            />
            <Select
              value={newCategoryType}
              onValueChange={(v) => setNewCategoryType(v as 'expense' | 'product')}
              disabled={loading}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="product">Product</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAddCategory} disabled={loading}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">Expense Categories</h4>
            <div className="space-y-2">
              {expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 rounded border"
                  style={{ borderLeftColor: cat.color || '#888', borderLeftWidth: 4 }}
                >
                  <span>{cat.name}</span>
                  <div className="flex items-center gap-2">
                    {cat.is_system && (
                      <span className="text-xs text-muted-foreground">(System)</span>
                    )}
                    {!cat.is_system && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(cat)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Product Categories</h4>
            <div className="space-y-2">
              {productCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-2 rounded border"
                  style={{ borderLeftColor: cat.color || '#888', borderLeftWidth: 4 }}
                >
                  <span>{cat.name}</span>
                  <div className="flex items-center gap-2">
                    {cat.is_system && (
                      <span className="text-xs text-muted-foreground">(System)</span>
                    )}
                    {!cat.is_system && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(cat)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
