'use client';

import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/gastos': 'Expenses',
  '/dashboard/ventas': 'Sales',
  '/dashboard/productos': 'Products',
  '/dashboard/reportes': 'Reports',
  '/dashboard/configuracion': 'Settings',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = pageTitles[pathname] || 'Dashboard';

  const handleSignOut = () => {
    document.cookie = 'pin_verified=; path=/; max-age=0';
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto">
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
