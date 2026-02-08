"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  trend?: string;
}

export function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <Card className="relative overflow-hidden group border-none shadow-md shadow-slate-200 transition-all hover:shadow-lg hover:-translate-y-1">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl bg-muted group-hover:scale-110 transition-transform duration-300", color?.replace('text-', 'bg-').replace('-500', '-100'))}>
            <Icon className={cn("h-5 w-5", color)} />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-bold tracking-tight">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
          </h3>
          <p className="text-xs text-muted-foreground">Comparado ao mês anterior</p>
        </div>
      </CardContent>
      <div className={cn("absolute bottom-0 left-0 h-1 w-full", color?.replace('text-', 'bg-'))} />
    </Card>
  );
}

export function SummaryCardSkeleton() {
    return (
        <Card className="border-none shadow-md">
            <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-40" />
                </div>
            </CardContent>
        </Card>
    )
}