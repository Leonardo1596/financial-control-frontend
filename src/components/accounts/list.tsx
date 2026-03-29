"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Landmark } from 'lucide-react';
import type { UserAccount } from '@/lib/types';
import { cn } from '@/lib/utils';

interface AccountsListProps {
  accounts: UserAccount[];
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function AccountsList({ accounts, onDelete, loading }: AccountsListProps) {
  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, index) => (
      <TableRow key={index}>
        <TableCell className="px-8"><Skeleton className="h-4 w-48" /></TableCell>
        <TableCell className="px-8"><Skeleton className="h-4 w-32" /></TableCell>
        <TableCell className="text-right px-8"><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>
      </TableRow>
    ))
  );

  return (
    <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
      <Table className="w-full min-w-[600px]">
        <TableCaption className="pb-6 pt-4 text-xs font-medium uppercase tracking-widest text-slate-400">
          {!loading && accounts.length === 0 ? 'Nenhuma conta cadastrada.' : `Você possui ${accounts.length} contas ativas.`}
        </TableCaption>
        <TableHeader className="bg-slate-50/50 border-b border-slate-100">
          <TableRow className="hover:bg-transparent">
            <TableHead className="py-5 px-8 font-bold text-slate-600 whitespace-nowrap">Instituição</TableHead>
            <TableHead className="py-5 px-8 font-bold text-slate-600 whitespace-nowrap">Saldo Atual</TableHead>
            <TableHead className="text-right py-5 px-8 font-bold text-slate-600 whitespace-nowrap">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? renderSkeletons() : accounts.map((account) => (
            <TableRow key={account._id} className="group transition-colors hover:bg-slate-50/50">
              <TableCell className="py-5 px-8 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-primary/10 transition-colors">
                    <Landmark className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                  </div>
                  <span className="font-semibold text-slate-800">{account.name}</span>
                </div>
              </TableCell>
              <TableCell className="py-5 px-8 whitespace-nowrap">
                <span className={cn("font-mono font-bold text-base", account.balance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                  {formatCurrency(account.balance)}
                </span>
              </TableCell>
              <TableCell className="text-right py-5 px-8 whitespace-nowrap">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="cursor-pointer hover:bg-rose-50 hover:text-rose-600 text-slate-300 transition-all rounded-xl">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl">Excluir conta bancária?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Isso removerá a instituição "{account.name}" do seu perfil. Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                      <AlertDialogCancel className="rounded-xl border-none bg-slate-100 hover:bg-slate-200">Cancelar</AlertDialogCancel>
                      <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }), "rounded-xl shadow-lg shadow-rose-500/20")} onClick={() => onDelete(account._id)}>Excluir Instituição</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}