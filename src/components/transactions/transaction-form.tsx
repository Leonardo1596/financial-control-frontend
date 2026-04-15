"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, MousePointer2, Landmark } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import type { UserAccount } from '@/lib/types';
import { API_BASE_URL } from '@/lib/api';

const formSchema = z.object({
  description: z.string().min(1, { message: 'A descrição é obrigatória' }),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo' }),
  type: z.enum(['income', 'expense']),
  date: z.date({ required_error: 'A data é obrigatória.' }),
  accountId: z.string().min(1, { message: 'Selecione uma conta' }),
});

function formatCurrencyFromCents(value: number) {
  return (value / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

interface Props {
  onTransactionAdded: () => void;
  isOpen: boolean;
  onClose: () => void;
  pendingData?: any;
}

export default function TransactionForm({ onTransactionAdded, isOpen, onClose, pendingData }: Props) {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: '', amount: 0, type: 'expense', date: new Date(), accountId: '' },
  });

  useEffect(() => {
    if (!pendingData) return;

    console.log("Preenchendo formulário com:", pendingData);
    console.log(pendingData.type);

    form.reset({
      description: pendingData.description || '',
      amount: pendingData.amount || 0,
      type: pendingData.type || 'expense',
      date: new Date(), // ou pendingData.date se tiver
      accountId: pendingData.accountId || ''
    });
  }, [pendingData]);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch(`${API_BASE_URL}/list-accounts?month=${month}&year=${year}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();

          if (Array.isArray(data)) {
            setAccounts(data);
          } else if (Array.isArray(data.accounts)) {
            setAccounts(data.accounts);
          } else {
            setAccounts([]);
          }
        }
      } catch (error) {
        console.error('Falha ao carregar contas', error);
      }
    }
    if (token) fetchAccounts();
  }, [token, month, year]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...values,
        userId: user.id,
        date: format(values.date, 'yyyy-MM-dd'),
      };
      const response = await fetch(`${API_BASE_URL}/create-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Falha ao criar transação');

      toast({ title: 'Sucesso', description: 'Transação adicionada.' });

      form.reset({ ...form.getValues(), description: '', amount: 0 });

      onTransactionAdded();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl max-w-[500px]">

        <Card className="border-none bg-slate-50/50 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-base flex items-center gap-2">
              <MousePointer2 className="h-4 w-4 text-primary" />
              Nova Transação
            </CardTitle>
            <CardDescription>Insira uma transação rapidamente.</CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Compras de mercado" className="bg-white rounded-xl border-slate-100 h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="accountId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Conta Bancária</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white rounded-xl border-slate-100 h-11">
                          <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-slate-400" />
                            <SelectValue placeholder="Selecione a conta" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl">
                        {accounts.length === 0 ? (
                          <div className="p-2 text-sm text-center text-muted-foreground">Nenhuma conta cadastrada</div>
                        ) : (
                          accounts.map(acc => (
                            <SelectItem key={acc._id} value={acc._id}>
                              {acc.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">

                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Valor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R$ 0,00"
                          className="bg-white rounded-xl border-slate-100 h-11"
                          value={formatCurrencyFromCents((field.value || 0) * 100)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            const cents = Number(raw);
                            field.onChange(cents / 100);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white rounded-xl border-slate-100 h-11">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="expense">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                </div>

                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className={cn("bg-white rounded-xl border-slate-100 h-11 text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                            {field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="rounded-2xl" />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/20 mt-2">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Adicionar Transação"}
                </Button>

              </form>
            </Form>
          </CardContent>
        </Card>

      </DialogContent>
    </Dialog>
  );
}