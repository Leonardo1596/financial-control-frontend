
"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Landmark, ChevronRight, Trash2, Info, Clock, Wallet } from 'lucide-react';
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

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 2 
    }).format(value);

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
      <div className="space-y-8 w-full">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-[2rem]" />
              <Skeleton className="h-20 w-full rounded-[2rem]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 w-full">
        <Landmark className="h-12 w-12 text-slate-200 mb-4" />
        <p className="text-slate-400 font-medium text-center">Nenhuma transação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 max-w-full">
      {Object.entries(groupedTransactions).map(([date, items]) => (
        <div key={date} className="space-y-5 w-full">
          <div className="flex items-center gap-3 px-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{date}</h4>
          </div>
          
          <div className="grid gap-3 w-full">
            {items.map((transaction) => (
              <Dialog key={transaction._id}>
                <DialogTrigger asChild>
                  <div className="group flex items-center justify-between p-5 sm:p-6 bg-white rounded-[2rem] border border-slate-50 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer w-full overflow-hidden">
                    <div className="flex items-center gap-5 min-w-0 flex-1">
                      <div className={cn(
                        "p-4 rounded-2xl shrink-0 transition-all",
                        transaction.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        <Landmark className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 text-base sm:text-lg truncate group-hover:text-primary transition-colors">
                          {transaction.description}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Landmark className="h-3 w-3 text-slate-300" />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider truncate">
                            {getAccountName(transaction.accountId)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-6 shrink-0 ml-4">
                      <div className="text-right">
                        <span className={cn(
                          "font-mono font-bold text-lg sm:text-xl block",
                          transaction.type === 'income' ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-200 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </DialogTrigger>
                
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl max-w-[95vw] sm:max-w-md p-0 overflow-hidden">
                  <div className={cn(
                    "h-2 w-full",
                    transaction.type === 'income' ? "bg-emerald-500" : "bg-rose-500"
                  )} />
                  <div className="p-8 space-y-8">
                    <DialogHeader className="space-y-4">
                      <div className={cn(
                        "mx-auto p-5 rounded-[2rem] w-fit",
                        transaction.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                      )}>
                        <Landmark className="h-8 w-8" />
                      </div>
                      <div className="text-center space-y-2">
                        <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight">
                          {transaction.description}
                        </DialogTitle>
                        <DialogDescription className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                          Detalhes da Movimentação
                        </DialogDescription>
                      </div>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex items-center gap-3">
                          <Wallet className="h-5 w-5 text-slate-400" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valor</span>
                        </div>
                        <span className={cn(
                          "font-mono font-bold text-2xl",
                          transaction.type === 'income' ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Data</span>
                          </div>
                          <p className="font-bold text-slate-900 text-sm">{date}</p>
                        </div>
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Landmark className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Conta</span>
                          </div>
                          <p className="font-bold text-slate-900 text-sm truncate">{getAccountName(transaction.accountId)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-4">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de Transação</span>
                         <Badge className={cn(
                           "border-none px-4 py-1.5 rounded-xl font-bold capitalize text-xs",
                           transaction.type === 'income' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                         )}>
                           {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                         </Badge>
                      </div>
                    </div>

                    <DialogFooter className="pt-4">
                      <Button 
                        variant="destructive" 
                        className="w-full h-14 rounded-[1.5rem] font-bold shadow-xl shadow-rose-500/20"
                        onClick={() => onDelete(transaction._id)}
                      >
                        <Trash2 className="mr-2 h-5 w-5" />
                        Excluir Registro
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>
      ))}
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-50 shadow-sm w-full">
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-[10px] uppercase h-10 px-4"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl font-bold text-[10px] uppercase h-10 px-4"
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
