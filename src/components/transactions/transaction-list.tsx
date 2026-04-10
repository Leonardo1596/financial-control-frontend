"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Trash2, Landmark, CalendarDays, ChevronRight } from 'lucide-react';
import type { Transaction, UserAccount } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface TransactionListProps {
  transactions: Transaction[];
  accounts?: UserAccount[];
  onDelete: (id: string) => void;
  loading: boolean;
}

const TRANSACTIONS_PER_PAGE = 20;

export default function TransactionList({ transactions, accounts = [], onDelete, loading }: TransactionListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * TRANSACTIONS_PER_PAGE,
    currentPage * TRANSACTIONS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [transactions.length, totalPages, currentPage]);
    
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getAccountName = (accountId?: string) => {
    if (!accountId) return 'N/A';
    const account = accounts.find(a => a._id === accountId);
    return account ? account.name : 'Conta não encontrada';
  };

  const groupedTransactions = useMemo(() => {
    return paginatedTransactions.reduce((groups, transaction) => {
      const utcDate = new Date(transaction.date);
      const adjustedDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
      const dateKey = format(adjustedDate, 'dd/MM/yyyy', { locale: ptBR });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }, [paginatedTransactions]);

  const renderSkeletons = () => (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderPagination = () => {
    if (loading || totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-100 mt-8 shadow-sm">
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Página {currentPage} de {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg font-bold text-xs uppercase"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-lg font-bold text-xs uppercase"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Próxima
          </Button>
        </div>
      </div>
    );
  };

  if (loading) return renderSkeletons();

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
        <CalendarDays className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium">Nenhuma transação encontrada neste período.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {Object.entries(groupedTransactions).map(([date, items]) => (
        <div key={date} className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{date}</h4>
          </div>
          
          <div className="grid gap-2">
            {items.map((transaction) => (
              <AlertDialog key={transaction._id}>
                <AlertDialogTrigger asChild>
                  <div className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn(
                        "p-3 rounded-xl transition-colors",
                        transaction.type === 'income' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : "bg-rose-50 text-rose-600 group-hover:bg-rose-100"
                      )}>
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{transaction.description}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Landmark className="h-3 w-3" />
                          <span>{getAccountName(transaction.accountId)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <span className={cn(
                          "font-mono font-bold text-lg block",
                          transaction.type === 'income' ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </AlertDialogTrigger>
                
                <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl">Excluir transação?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deseja remover permanentemente o registro <strong>{transaction.description}</strong>?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="mt-4 gap-2">
                    <AlertDialogCancel className="rounded-xl border-none bg-slate-100 hover:bg-slate-200 h-12">Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      className={cn(buttonVariants({variant: "destructive"}), "rounded-xl shadow-lg shadow-rose-500/20 h-12")} 
                      onClick={() => onDelete(transaction._id)}
                    >
                      Excluir Transação
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ))}
          </div>
        </div>
      ))}
      
      {renderPagination()}
    </div>
  );
}
