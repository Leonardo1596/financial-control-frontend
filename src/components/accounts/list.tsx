"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, ChevronRight } from 'lucide-react';
import type { UserAccount } from '@/lib/types';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface AccountsListProps {
  accounts: UserAccount[];
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function AccountsList({ accounts, onDelete, loading }: AccountsListProps) {
  if (loading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <Landmark className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">Nenhuma instituição cadastrada.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {accounts.map((account) => (
        <AlertDialog key={account._id}>
          <AlertDialogTrigger asChild>
            <div className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary/10 transition-colors">
                  <Landmark className="h-6 w-6 text-slate-400 group-hover:text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 text-lg">{account.name}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Saldo Atual</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className={cn(
                    "font-mono font-bold text-xl block", 
                    account.balance >= 0 ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {formatCurrency(account.balance)}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </AlertDialogTrigger>
          
          <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">O que deseja fazer?</AlertDialogTitle>
              <AlertDialogDescription>
                Você selecionou a instituição <strong>{account.name}</strong>. Atualmente, a única ação disponível é a remoção.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-6 gap-3 sm:gap-0">
              <AlertDialogCancel className="rounded-xl border-none bg-slate-100 hover:bg-slate-200 h-12">Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className={cn(buttonVariants({ variant: "destructive" }), "rounded-xl h-12 shadow-lg shadow-rose-500/20")}
                onClick={() => onDelete(account._id)}
              >
                Remover Instituição
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
}
