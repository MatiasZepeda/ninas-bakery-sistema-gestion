'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Package,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Gastos',
    url: '/dashboard/gastos',
    icon: Receipt,
  },
  {
    title: 'Ventas',
    url: '/dashboard/ventas',
    icon: ShoppingCart,
  },
  {
    title: 'Productos',
    url: '/dashboard/productos',
    icon: Package,
  },
  {
    title: 'Reportes',
    url: '/dashboard/reportes',
    icon: BarChart3,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.url;
          return (
            <Link
              key={item.title}
              href={item.url}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full',
                isActive
                  ? 'text-rose-600'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
