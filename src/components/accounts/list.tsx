"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Landmark, ChevronRight, Edit, Trash2 } from 'lucide-react';
import type { UserAccount } from '@/lib/types';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

interface AccountsListProps {
  accounts: UserAccount[];
  onDelete: (id: string) => Promise<void>;
  onEdit: (account: UserAccount) => void;
  loading: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function AccountsList({ accounts, onDelete, onEdit, loading }: AccountsListProps) {
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
                  <span className="font-mono font-bold text-xl block text-primary">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
              </div>
            </div>
          </AlertDialogTrigger>
          
          <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Opções da Conta</AlertDialogTitle>
              <AlertDialogDescription>
                Selecione o que deseja fazer com a conta <strong>{account.name}</strong>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3 py-4">
               <button 
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                onClick={() => onEdit(account)}
               >
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Edit className="h-5 w-5" />
                 </div>
                 <div className="flex flex-col">
                    <span className="font-bold text-slate-900">Editar Detalhes</span>
                    <span className="text-xs text-slate-500">Alterar nome da instituição</span>
                 </div>
               </button>

               <AlertDialogAction 
                className="flex items-center justify-start gap-3 w-full p-4 h-auto rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors text-left border-none"
                onClick={() => onDelete(account._id)}
               >
                 <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                    <Trash2 className="h-5 w-5" />
                 </div>
                 <div className="flex flex-col">
                    <span className="font-bold text-rose-600">Remover Conta</span>
                    <span className="text-xs text-rose-400">Excluir permanentemente este banco</span>
                 </div>
               </AlertDialogAction>
            </div>
            <AlertDialogFooter className="sm:justify-center">
              <AlertDialogCancel className="rounded-xl border-none bg-slate-100 hover:bg-slate-200 h-12 w-full sm:w-auto">
                Fechar
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
}