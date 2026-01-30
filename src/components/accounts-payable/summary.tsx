"use client";

import { useMemo } from 'react';
import type { AccountPayable } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hourglass, CheckCircle2, AlertCircle } from 'lucide-react';

interface AccountsPayableSummaryProps {
  accounts: AccountPayable[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

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
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPago)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
          <Hourglass className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.totalPendente)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Atrasado</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalAtrasado)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
