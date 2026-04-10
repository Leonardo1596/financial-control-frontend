"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CalendarDays, 
  ChevronRight, 
  Trash2, 
  Info, 
  Clock, 
  ReceiptText, 
  CheckCircle2, 
  AlertCircle, 
  Hourglass,
  Loader2,
  Tag
} from 'lucide-react';
import type { AccountPayable } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
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

interface AccountsPayableListProps {
  accounts: AccountPayable[];
  onPay: (id: string) => Promise<void>;
  onEdit: (account: AccountPayable) => void;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

const statusStyles = {
  paga: 'bg-emerald-100 text-emerald-700 border-none',
  pendente: 'bg-amber-100 text-amber-700 border-none',
  atrasada: 'bg-rose-100 text-rose-700 border-none',
};

const statusIcons = {
  paga: CheckCircle2,
  pendente: Hourglass,
  atrasada: AlertCircle,
};

export default function AccountsPayableList({ accounts, onPay, onEdit, onDelete, loading }: AccountsPayableListProps) {
  const [payingId, setPayingId] = useState<string | null>(null);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handlePayClick = async (id: string) => {
    setPayingId(id);
    await onPay(id);
    setPayingId(null);
  };

  const groupedAccounts = useMemo(() => {
    return accounts.reduce((groups, account) => {
      const utcDate = parseISO(account.dueDate);
      const adjustedDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
      const dateKey = format(adjustedDate, 'dd/MM/yyyy', { locale: ptBR });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(account);
      return groups;
    }, {} as Record<string, AccountPayable[]>);
  }, [accounts]);

  if (loading) {
    return (
      <div className="space-y-8 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-50/50 w-full">
        <ReceiptText className="h-12 w-12 text-slate-200 mb-4" />
        <p className="text-slate-400 font-medium text-center">Nenhuma conta pendente encontrada.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 p-4 sm:p-8">
      {Object.entries(groupedAccounts).map(([date, items]) => (
        <div key={date} className="space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="h-2 w-2 rounded-full bg-primary/40" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{date}</h4>
          </div>
          
          <div className="grid gap-3">
            {items.map((account) => {
              const StatusIcon = statusIcons[account.status];
              return (
                <Dialog key={account._id}>
                  <DialogTrigger asChild>
                    <div className="group flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all cursor-pointer w-full overflow-hidden">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={cn(
                          "p-3 rounded-xl shrink-0 transition-colors",
                          account.status === 'paga' ? "bg-emerald-50 text-emerald-600" : 
                          account.status === 'atrasada' ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                        )}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 truncate group-hover:text-primary transition-colors">{account.description}</span>
                          <div className="mt-1">
                            <Badge className={cn("text-[10px] h-5 px-2 font-bold capitalize", statusStyles[account.status])}>
                              {account.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-6 shrink-0 ml-4">
                        <div className="text-right">
                          <span className="font-mono font-bold text-base sm:text-xl block text-slate-900">
                            {formatCurrency(account.amount)}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </DialogTrigger>
                  
                  <DialogContent className="rounded-3xl border-none shadow-2xl max-w-[95vw] sm:max-w-md p-0 overflow-hidden">
                    <div className={cn(
                      "h-2 w-full",
                      account.status === 'paga' ? "bg-emerald-500" : 
                      account.status === 'atrasada' ? "bg-rose-500" : "bg-amber-500"
                    )} />
                    
                    <div className="p-6 sm:p-8 space-y-6">
                      <DialogHeader className="space-y-4">
                        <div className="mx-auto bg-slate-50 p-4 rounded-2xl w-fit">
                          <ReceiptText className="h-8 w-8 text-slate-400" />
                        </div>
                        <div className="text-center space-y-1">
                          <DialogTitle className="text-2xl font-bold text-slate-900">{account.description}</DialogTitle>
                          <DialogDescription className="text-sm font-medium">
                            Detalhes da Conta a Pagar
                          </DialogDescription>
                        </div>
                      </DialogHeader>

                      <div className="grid gap-4">
                        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Valor Total</span>
                          <span className="font-mono font-bold text-2xl text-slate-900">
                            {formatCurrency(account.amount)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Clock className="h-4 w-4" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Vencimento</span>
                            </div>
                            <p className="font-bold text-slate-900 text-sm">{date}</p>
                          </div>
                          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Tag className="h-4 w-4" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Categoria</span>
                            </div>
                            <p className="font-bold text-slate-900 text-sm truncate">{account.category}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between px-2">
                           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo / Status</span>
                           <div className="flex gap-2">
                             <Badge variant="outline" className="border-slate-200 text-slate-500 font-bold capitalize px-3">
                               {account.type}
                             </Badge>
                             <Badge className={cn("border-none px-3 font-bold capitalize", statusStyles[account.status])}>
                               {account.status}
                             </Badge>
                           </div>
                        </div>
                      </div>

                      <DialogFooter className="flex-col gap-3 pt-4">
                        {account.status !== 'paga' && (
                          <Button 
                            className="w-full h-12 rounded-xl font-bold shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handlePayClick(account._id)}
                            disabled={payingId === account._id}
                          >
                            {payingId === account._id ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                            Marcar como Paga
                          </Button>
                        )}
                        
                        <div className="grid grid-cols-2 gap-3 w-full">
                          <Button 
                            variant="outline" 
                            className="h-12 rounded-xl font-bold border-slate-200"
                            onClick={() => onEdit(account)}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="destructive" 
                            className="h-12 rounded-xl font-bold shadow-lg shadow-rose-500/20"
                            onClick={() => onDelete(account._id)}
                          >
                            <Trash2 className="mr-2 h-5 w-5" />
                            Excluir
                          </Button>
                        </div>
                      </DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
