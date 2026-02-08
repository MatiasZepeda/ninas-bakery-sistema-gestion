-- =============================================
-- SCHEMA: Sistema de Gestión Empresarial
-- Nina's Bakery
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: profiles (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    business_name TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TABLE: categories
-- =============================================
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'product', 'both')),
    color TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own categories" ON public.categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
    FOR DELETE USING (auth.uid() = user_id AND is_system = FALSE);

-- =============================================
-- TABLE: products
-- =============================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sku TEXT,
    cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own products" ON public.products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON public.products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON public.products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON public.products
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- TABLE: expenses
-- =============================================
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own expenses" ON public.expenses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" ON public.expenses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" ON public.expenses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" ON public.expenses
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- TABLE: expense_items
-- =============================================
CREATE TABLE public.expense_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(12,2) NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.expense_items ENABLE ROW LEVEL SECURITY;

-- Policies (based on parent expense ownership)
CREATE POLICY "Users can view expense items" ON public.expense_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.expenses
            WHERE expenses.id = expense_items.expense_id
            AND expenses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert expense items" ON public.expense_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses
            WHERE expenses.id = expense_items.expense_id
            AND expenses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update expense items" ON public.expense_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.expenses
            WHERE expenses.id = expense_items.expense_id
            AND expenses.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete expense items" ON public.expense_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.expenses
            WHERE expenses.id = expense_items.expense_id
            AND expenses.user_id = auth.uid()
        )
    );

-- =============================================
-- TABLE: sales
-- =============================================
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own sales" ON public.sales
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales" ON public.sales
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales" ON public.sales
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales" ON public.sales
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- TABLE: sale_items
-- =============================================
CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Policies (based on parent sale ownership)
CREATE POLICY "Users can view sale items" ON public.sale_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sales
            WHERE sales.id = sale_items.sale_id
            AND sales.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert sale items" ON public.sale_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sales
            WHERE sales.id = sale_items.sale_id
            AND sales.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update sale items" ON public.sale_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.sales
            WHERE sales.id = sale_items.sale_id
            AND sales.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete sale items" ON public.sale_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.sales
            WHERE sales.id = sale_items.sale_id
            AND sales.user_id = auth.uid()
        )
    );

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX idx_expenses_date ON public.expenses(date);
CREATE INDEX idx_expenses_category_id ON public.expenses(category_id);
CREATE INDEX idx_expense_items_expense_id ON public.expense_items(expense_id);
CREATE INDEX idx_sales_user_id ON public.sales(user_id);
CREATE INDEX idx_sales_date ON public.sales(date);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON public.sale_items(product_id);

-- =============================================
-- FUNCTION: Insert default categories for new user
-- =============================================
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
    -- Default expense categories
    INSERT INTO public.categories (user_id, name, type, color, is_system) VALUES
        (NEW.id, 'Ingredients', 'expense', '#FF6B6B', TRUE),
        (NEW.id, 'Rent', 'expense', '#4ECDC4', TRUE),
        (NEW.id, 'Salaries', 'expense', '#45B7D1', TRUE),
        (NEW.id, 'Utilities', 'expense', '#96CEB4', TRUE),
        (NEW.id, 'Marketing', 'expense', '#FFEAA7', TRUE),
        (NEW.id, 'Transportation', 'expense', '#DDA0DD', TRUE),
        (NEW.id, 'Other Expenses', 'expense', '#B0B0B0', TRUE);

    -- Default product categories
    INSERT INTO public.categories (user_id, name, type, color, is_system) VALUES
        (NEW.id, 'Alfajores', 'product', '#FFB6C1', TRUE),
        (NEW.id, 'Cookies', 'product', '#DEB887', TRUE),
        (NEW.id, 'Cakes', 'product', '#F0E68C', TRUE),
        (NEW.id, 'Drinks', 'product', '#87CEEB', TRUE),
        (NEW.id, 'Other Products', 'product', '#D3D3D3', TRUE);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();

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

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
