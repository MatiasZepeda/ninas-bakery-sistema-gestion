'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingDown, TrendingUp, Percent } from 'lucide-react';
import { DashboardStats as DashboardStatsType } from '@/types/database';

interface DashboardStatsProps {
  stats: DashboardStatsType;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Monthly Expenses',
      value: formatCurrency(stats.totalExpenses),
      change: stats.expensesChange,
      icon: TrendingDown,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      invertChange: true,
    },
    {
      title: 'Net Profit',
      value: formatCurrency(stats.profit),
      change: stats.profitChange,
      icon: TrendingUp,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Profit Margin',
      value: `${stats.profitMargin.toFixed(1)}%`,
      icon: Percent,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`h-8 w-8 rounded-lg ${card.iconBg} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.change !== undefined && (
              <p className={`text-xs mt-1 ${
                (card.invertChange ? -card.change : card.change) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                {formatPercent(card.change)} vs last month
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
