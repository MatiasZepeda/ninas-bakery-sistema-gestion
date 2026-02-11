-- =============================================
-- SCHEMA: Sistema de Gestión Empresarial
-- Nina's Bakery
-- =============================================
-- This schema works WITHOUT Supabase Auth.
-- Uses a fixed OWNER_ID for all data.
-- RLS is DISABLED on all tables.
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fixed owner ID (must match OWNER_ID in src/lib/constants.ts)
-- 00000000-0000-0000-0000-000000000001

-- =============================================
-- TABLE: profiles
-- =============================================
-- Drop existing FK constraint if profiles already exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Drop the FK to auth.users if it exists
        ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        -- Disable RLS
        ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    ELSE
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY,
            email TEXT NOT NULL,
            business_name TEXT,
            currency TEXT NOT NULL DEFAULT 'USD',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    END IF;
END $$;

-- Ensure RLS is disabled
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: categories
-- =============================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'product', 'both')),
    color TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: products
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: expenses
-- =============================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    supplier TEXT,
    description TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'debit', 'credit', 'transfer')),
    receipt_url TEXT,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    tax_amount DECIMAL(12,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: expense_items
-- =============================================
CREATE TABLE IF NOT EXISTS public.expense_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.expense_items DISABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: sales
-- =============================================
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    profit DECIMAL(12,2) NOT NULL DEFAULT 0,
    channel TEXT,
    payment_method TEXT CHECK (payment_method IN ('cash', 'debit', 'credit', 'transfer')),
    customer_name TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;

-- =============================================
-- TABLE: sale_items
-- =============================================
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.sale_items DISABLE ROW LEVEL SECURITY;

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON public.expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(date);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON public.sale_items(product_id);

-- =============================================
-- FUNCTION: Update updated_at timestamp
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers (drop first to avoid errors on re-run)
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- DEFAULT DATA: Profile + Categories
-- =============================================
-- Insert default profile (skip if exists)
INSERT INTO public.profiles (id, email, business_name, currency)
VALUES ('00000000-0000-0000-0000-000000000001', 'owner@ninasbakery.local', 'Nina''s Bakery', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Insert default categories (only if none exist for this user)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE user_id = '00000000-0000-0000-0000-000000000001') THEN
        -- Default expense categories
        INSERT INTO public.categories (user_id, name, type, color, is_system) VALUES
            ('00000000-0000-0000-0000-000000000001', 'Ingredients', 'expense', '#FF6B6B', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Rent', 'expense', '#4ECDC4', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Salaries', 'expense', '#45B7D1', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Utilities', 'expense', '#96CEB4', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Marketing', 'expense', '#FFEAA7', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Transportation', 'expense', '#DDA0DD', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Other Expenses', 'expense', '#B0B0B0', TRUE);

        -- Default product categories
        INSERT INTO public.categories (user_id, name, type, color, is_system) VALUES
            ('00000000-0000-0000-0000-000000000001', 'Alfajores', 'product', '#FFB6C1', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Cookies', 'product', '#DEB887', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Cakes', 'product', '#F0E68C', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Drinks', 'product', '#87CEEB', TRUE),
            ('00000000-0000-0000-0000-000000000001', 'Other Products', 'product', '#D3D3D3', TRUE);
    END IF;
END $$;
