"use client";

import { useMemo } from 'react';
import type { AccountPayable } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Hourglass, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountsPayableSummaryProps {
  accounts: AccountPayable[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function SummaryCard({ title, value, icon: Icon, colorClass, shadowClass }: { title: string, value: number, icon: any, colorClass: string, shadowClass: string }) {
  return (
    <Card className={cn("relative overflow-hidden border-none shadow-lg transition-all hover:-translate-y-1", shadowClass)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2.5 rounded-xl bg-slate-100", colorClass)}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
        </div>
        <div className="text-2xl font-bold tracking-tight">
          {formatCurrency(value)}
        </div>
      </CardContent>
      <div className={cn("absolute bottom-0 left-0 h-1 w-full opacity-50", colorClass.replace('text-', 'bg-'))} />
    </Card>
  )
}

export default function AccountsPayableSummary({ accounts }: AccountsPayableSummaryProps) {
  const summary = useMemo(() => {
    return accounts.reduce((acc, account) => {
      if (account.status === 'pendente') {
        acc.totalPendente += account.amount;
      } else if (account.status === 'paga') {
        acc.totalPago += account.amount;
      } else if (account.status === 'atrasada') {
        acc.totalAtrasado += account.amount;
      }
      return acc;
    }, { totalPendente: 0, totalPago: 0, totalAtrasado: 0 });
  }, [accounts]);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <SummaryCard 
        title="Total Pago" 
        value={summary.totalPago} 
        icon={CheckCircle2} 
        colorClass="text-emerald-500" 
        shadowClass="shadow-emerald-500/5"
      />
      <SummaryCard 
        title="Total Pendente" 
        value={summary.totalPendente} 
        icon={Hourglass} 
        colorClass="text-amber-500" 
        shadowClass="shadow-amber-500/5"
      />
      <SummaryCard 
        title="Total Atrasado" 
        value={summary.totalAtrasado} 
        icon={AlertCircle} 
        colorClass="text-rose-500" 
        shadowClass="shadow-rose-500/5"
      />
    </div>
  );
}
