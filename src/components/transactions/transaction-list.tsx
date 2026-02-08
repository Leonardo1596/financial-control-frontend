"use client";

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  loading: boolean;
}

const TRANSACTIONS_PER_PAGE = 15;

export default function TransactionList({ transactions, onDelete, loading }: TransactionListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * TRANSACTIONS_PER_PAGE,
    currentPage * TRANSACTIONS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    } else if (transactions.length > 0 && paginatedTransactions.length === 0 && currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [transactions, currentPage, totalPages, paginatedTransactions.length]);
    
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-6 w-[70px] rounded-full" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-4 w-[80px] ml-auto" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
      </TableRow>
    ))
  )

  const renderPagination = () => {
    if (loading || totalPages <= 1) {
        return null;
    }

    const range: (number | string)[] = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            range.push(i);
        } else if (range[range.length - 1] !== '...') {
            range.push('...');
        }
    }

    return (
        <div className="flex items-center justify-between p-6 bg-slate-50/50 border-t border-slate-100">
             <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                {range.map((page, index) => {
                    if (page === '...') {
                        return <span key={index} className="px-2 text-slate-300">...</span>;
                    }
                    return (
                        <Button
                            key={index}
                            variant={currentPage === page ? "default" : "ghost"}
                            size="sm"
                            className={cn("h-8 w-8 rounded-lg p-0 font-bold", currentPage === page ? "shadow-md shadow-primary/20" : "")}
                            onClick={() => setCurrentPage(page as number)}
                        >
                            {page}
                        </Button>
                    );
                })}
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

  return (
    <>
      <Table>
        <TableCaption className="pb-6">{!loading && transactions.length === 0 ? 'Sem transações neste período.' : `Exibindo ${paginatedTransactions.length} de ${transactions.length} transações.`}</TableCaption>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="py-4 font-bold text-slate-600">Descrição</TableHead>
            <TableHead className="py-4 font-bold text-slate-600">Data</TableHead>
            <TableHead className="py-4 font-bold text-slate-600">Tipo</TableHead>
            <TableHead className="text-right py-4 font-bold text-slate-600">Valor</TableHead>
            <TableHead className="text-right py-4 font-bold text-slate-600">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? renderSkeletons() : paginatedTransactions.map((transaction) => {
            const utcDate = new Date(transaction.date);
            const adjustedDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
            return (
            <TableRow key={transaction._id} className="group transition-colors">
              <TableCell className="font-semibold text-slate-800 py-4">{transaction.description}</TableCell>
              <TableCell className="text-muted-foreground">{format(adjustedDate, 'PPP', { locale: ptBR })}</TableCell>
              <TableCell>
                <Badge 
                  className={cn(
                    'font-bold rounded-lg px-2.5 py-0.5 shadow-sm border-none', 
                    transaction.type === 'income' 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-rose-100 text-rose-700'
                  )}
                >
                  {transaction.type === 'income' ? 'Renda' : 'Despesa'}
                </Badge>
              </TableCell>
              <TableCell className={cn('text-right font-mono font-bold text-base', transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600')}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-all">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl">Excluir transação?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação removerá permanentemente este registro do seu histórico.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                      <AlertDialogCancel className="rounded-xl border-none bg-slate-100 hover:bg-slate-200">Cancelar</AlertDialogCancel>
                      <AlertDialogAction className={cn(buttonVariants({variant: "destructive"}), "rounded-xl shadow-lg shadow-rose-500/20")} onClick={() => onDelete(transaction._id)}>Confirmar Exclusão</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
      {renderPagination()}
    </>
  );
}
