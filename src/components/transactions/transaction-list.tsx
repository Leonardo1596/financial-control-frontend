"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Landmark, CalendarDays, ChevronRight, Trash2, Info, Clock, Wallet } from 'lucide-react';
import type { Transaction, UserAccount } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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

  if (loading) {
    return (
      <div className="space-y-6 w-full max-w-full overflow-hidden">
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
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 w-full">
        <CalendarDays className="h-12 w-12 text-slate-300 mb-3" />
        <p className="text-slate-500 font-medium text-center">Nenhuma transação encontrada neste período.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 max-w-full overflow-hidden">
      {Object.entries(groupedTransactions).map(([date, items]) => (
        <div key={date} className="space-y-3 w-full">
          <div className="flex items-center gap-2 px-1">
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{date}</h4>
          </div>
          
          <div className="grid gap-2 w-full">
            {items.map((transaction) => (
              <Dialog key={transaction._id}>
                <DialogTrigger asChild>
                  <div className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer w-full overflow-hidden">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={cn(
                        "p-3 rounded-xl shrink-0 transition-colors",
                        transaction.type === 'income' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : "bg-rose-50 text-rose-600 group-hover:bg-rose-100"
                      )}>
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{transaction.description}</span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Landmark className="h-3 w-3" />
                          <span className="truncate">{getAccountName(transaction.accountId)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
                      <div className="text-right">
                        <span className={cn(
                          "font-mono font-bold text-base sm:text-lg block",
                          transaction.type === 'income' ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </DialogTrigger>
                
                <DialogContent className="rounded-3xl border-none shadow-2xl max-w-[95vw] sm:max-w-md">
                  <DialogHeader className="space-y-4">
                    <div className={cn(
                      "mx-auto p-4 rounded-2xl w-fit",
                      transaction.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      <Info className="h-8 w-8" />
                    </div>
                    <div className="text-center space-y-1">
                      <DialogTitle className="text-2xl font-bold">{transaction.description}</DialogTitle>
                      <DialogDescription className="text-base font-medium">
                        Detalhes da Transação
                      </DialogDescription>
                    </div>
                  </DialogHeader>

                  <div className="grid gap-4 py-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <Wallet className="h-5 w-5 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-500">Valor</span>
                      </div>
                      <span className={cn(
                        "font-mono font-bold text-xl",
                        transaction.type === 'income' ? "text-emerald-500" : "text-rose-500"
                      )}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Data</span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm">{date}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Landmark className="h-4 w-4" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Conta</span>
                        </div>
                        <p className="font-bold text-slate-900 text-sm truncate">{getAccountName(transaction.accountId)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-4 py-2">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categoria / Tipo</span>
                       <Badge className={cn(
                         "border-none px-3 py-1 rounded-lg font-bold capitalize",
                         transaction.type === 'income' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                       )}>
                         {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                       </Badge>
                    </div>
                  </div>

                  <DialogFooter className="flex-col sm:flex-row gap-3">
                    <Button 
                      variant="destructive" 
                      className="w-full h-12 rounded-xl font-bold shadow-lg shadow-rose-500/20 order-2 sm:order-1"
                      onClick={() => onDelete(transaction._id)}
                    >
                      <Trash2 className="mr-2 h-5 w-5" />
                      Excluir Transação
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      ))}
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 sm:p-6 bg-white rounded-2xl border border-slate-100 mt-8 shadow-sm w-full">
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {currentPage} / {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg font-bold text-[10px] sm:text-xs uppercase h-8 px-2 sm:px-3"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg font-bold text-[10px] sm:text-xs uppercase h-8 px-2 sm:px-3"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}