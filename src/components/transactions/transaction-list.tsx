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

    const delta = 1;
    const left = currentPage - delta;
    const right = currentPage + delta + 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= left && i < right)) {
            range.push(i);
        }
    }

    for (const i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return (
        <div className="flex items-center justify-between pt-4">
             <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Anterior
                </Button>
                {rangeWithDots.map((page, index) => {
                    if (page === '...') {
                        return <span key={index} className="px-2 py-1 text-sm">...</span>;
                    }
                    return (
                        <Button
                            key={index}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page as number)}
                        >
                            {page}
                        </Button>
                    );
                })}
                <Button
                    variant="outline"
                    size="sm"
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
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableCaption>{!loading && transactions.length === 0 ? 'Nenhuma transação encontrada.' : 'Uma lista de suas transações recentes.'}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? renderSkeletons() : paginatedTransactions.map((transaction) => (
              <TableRow key={transaction._id}>
                <TableCell className="font-medium">{transaction.description}</TableCell>
                <TableCell>{format(new Date(transaction.date), 'PPP', { locale: ptBR })}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} 
                        className={cn(transaction.type === 'income' ? 'bg-emerald-500/20 text-emerald-700 border-transparent hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-700 border-transparent hover:bg-red-500/30')}>
                    {transaction.type === 'income' ? 'Renda' : 'Despesa'}
                  </Badge>
                </TableCell>
                <TableCell className={cn('text-right font-mono', transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente esta transação.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction className={cn(buttonVariants({variant: "destructive"}))} onClick={() => onDelete(transaction._id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {renderPagination()}
    </>
  );
}
