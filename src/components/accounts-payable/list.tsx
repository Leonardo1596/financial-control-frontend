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
  paga: 'bg-emerald-100 text-emerald-800 border-transparent',
  pendente: 'bg-amber-100 text-amber-800 border-transparent',
  atrasada: 'bg-rose-100 text-rose-800 border-transparent',
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
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
      <Table className="w-full min-w-[900px]">
        <TableCaption className="pb-6">
          {!loading && accounts.length === 0 ? 'Nenhuma conta encontrada.' : `Total de ${accounts.length} contas listadas.`}
        </TableCaption>
        <TableHeader className="bg-slate-50/50 border-b border-slate-100">
          <TableRow className="hover:bg-transparent">
            <TableHead className="py-5 px-6 font-bold text-slate-600 whitespace-nowrap">Descrição</TableHead>
            <TableHead className="py-5 px-6 font-bold text-slate-600 whitespace-nowrap">Vencimento</TableHead>
            <TableHead className="py-5 px-6 font-bold text-slate-600 whitespace-nowrap">Valor</TableHead>
            <TableHead className="py-5 px-6 font-bold text-slate-600 whitespace-nowrap">Status</TableHead>
            <TableHead className="py-5 px-6 font-bold text-slate-600 whitespace-nowrap">Categoria</TableHead>
            <TableHead className="text-right py-5 px-6 font-bold text-slate-600 whitespace-nowrap">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? renderSkeletons() : accounts.map((account) => {
            const utcDate = new Date(account.dueDate);
            const adjustedDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
            return (
            <TableRow key={account._id} className="group transition-colors hover:bg-slate-50/50">
              <TableCell className="font-semibold text-slate-800 py-5 px-6 whitespace-nowrap">{account.description}</TableCell>
              <TableCell className="text-muted-foreground px-6 whitespace-nowrap">{format(adjustedDate, 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
              <TableCell className="font-mono font-bold text-slate-700 px-6 whitespace-nowrap">{formatCurrency(account.amount)}</TableCell>
              <TableCell className="px-6 whitespace-nowrap">
                <Badge className={cn('font-bold capitalize rounded-lg px-2.5 py-0.5 shadow-sm border-none', statusStyles[account.status])}>
                  {account.status}
                </Badge>
              </TableCell>
              <TableCell className="px-6 whitespace-nowrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{account.category}</span>
              </TableCell>
              <TableCell className="text-right px-6 whitespace-nowrap">
                <AlertDialog>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="cursor-pointer hover:bg-slate-100 rounded-xl transition-all">
                        <MoreHorizontal className="h-5 w-5 text-slate-300 group-hover:text-slate-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl p-2 shadow-xl border-slate-100 min-w-[160px]">
                      {account.status !== 'paga' && (
                        <DropdownMenuItem onSelect={() => handlePayClick(account._id)} disabled={payingId === account._id} className="cursor-pointer rounded-lg py-2.5 font-medium text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50">
                          {payingId === account._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                          Marcar como paga
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => onEdit(account)} className="cursor-pointer rounded-lg py-2.5 font-medium">
                        <Edit className="mr-2 h-4 w-4 text-slate-400" />
                        Editar Conta
                      </DropdownMenuItem>
                      <AlertDialogTrigger asChild>
                         <DropdownMenuItem className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer rounded-lg py-2.5 font-medium">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl">Confirmar exclusão?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente esta conta do seu controle financeiro.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                      <AlertDialogCancel className="cursor-pointer rounded-xl border-none bg-slate-100 hover:bg-slate-200">Cancelar</AlertDialogCancel>
                      <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }), "cursor-pointer rounded-xl shadow-lg shadow-rose-500/20")} onClick={() => onDelete(account._id)}>Excluir Conta</AlertDialogAction>
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