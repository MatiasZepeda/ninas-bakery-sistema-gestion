import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Store, BarChart3, Receipt, Package, TrendingUp } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-amber-50">
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
            <Store className="h-6 w-6 text-rose-600" />
          </div>
          <span className="font-bold text-xl">Nina&apos;s Bakery</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Iniciar Sesión</Button>
          </Link>
          <Link href="/register">
            <Button>Registrarse</Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
            Sistema de Gestión Empresarial
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Administra tu negocio de manera simple e intuitiva. Control de gastos,
            ventas, productos y reportes financieros en un solo lugar.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8">
                Comenzar Gratis
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Dashboard Inteligente</h3>
            <p className="text-muted-foreground">
              Visualiza tus KPIs, tendencias y métricas en tiempo real
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center mb-4">
              <Receipt className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Control de Gastos</h3>
            <p className="text-muted-foreground">
              Registra y categoriza todos los gastos de tu negocio
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Catálogo de Productos</h3>
            <p className="text-muted-foreground">
              Gestiona productos con precios de costo y venta
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Reportes Financieros</h3>
            <p className="text-muted-foreground">
              Estado de resultados, flujo de caja y análisis de rentabilidad
            </p>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p>Sistema de Gestión Empresarial - Nina&apos;s Bakery</p>
      </footer>
    </div>
  );
}
