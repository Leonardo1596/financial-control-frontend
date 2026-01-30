"use client";

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit, Check, Loader2 } from 'lucide-react';
import type { AccountPayable } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AccountsPayableListProps {
  accounts: AccountPayable[];
  onPay: (id: string) => Promise<void>;
  onEdit: (account: AccountPayable) => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

const statusStyles = {
  paga: 'bg-green-100 text-green-800 border-transparent hover:bg-green-200',
  pendente: 'bg-yellow-100 text-yellow-800 border-transparent hover:bg-yellow-200',
  atrasada: 'bg-red-100 text-red-800 border-transparent hover:bg-red-200',
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function AccountsPayableList({ accounts, onPay, onEdit, onDelete, loading }: AccountsPayableListProps) {
    const [payingId, setPayingId] = useState<string | null>(null);

    const handlePayClick = async (id: string) => {
        setPayingId(id);
        await onPay(id);
        setPayingId(null);
    }
  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell><Skeleton className="h-4 w-full max-w-[200px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <Table>
        <TableCaption>{!loading && accounts.length === 0 ? 'Nenhuma conta a pagar encontrada.' : 'Uma lista de suas contas a pagar.'}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? renderSkeletons() : accounts.map((account) => {
            const utcDate = new Date(account.dueDate);
            const adjustedDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
            return (
            <TableRow key={account._id}>
              <TableCell className="font-medium">{account.description}</TableCell>
              <TableCell>{format(adjustedDate, 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
              <TableCell>{formatCurrency(account.amount)}</TableCell>
              <TableCell>
                <Badge className={cn('font-semibold capitalize', statusStyles[account.status])}>
                  {account.status}
                </Badge>
              </TableCell>
              <TableCell>{account.category}</TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {account.status !== 'paga' && (
                        <DropdownMenuItem onSelect={() => handlePayClick(account._id)} disabled={payingId === account._id} className="cursor-pointer">
                          {payingId === account._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                          Marcar como paga
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => onEdit(account)} className="cursor-pointer">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                         <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente esta conta a pagar.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={() => onDelete(account._id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
