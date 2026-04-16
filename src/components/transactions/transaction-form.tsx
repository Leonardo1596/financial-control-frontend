"use client";

import { useState, useEffect, useMemo } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, MousePointer2, Landmark, Tag, Check, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import type { UserAccount, Category } from '@/lib/types';
import { API_BASE_URL } from '@/lib/api';

const formSchema = z.object({
  description: z.string().min(1, { message: 'A descrição é obrigatória' }),
  category: z.string().min(1, { message: 'A categoria é obrigatória' }),
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      description: '', 
      category: '',
      amount: 0, 
      type: 'expense', 
      date: new Date(), 
      accountId: '' 
    },
  });

  useEffect(() => {
    if (!pendingData) return;

    form.reset({
      description: pendingData.description || '',
      category: pendingData.category || '',
      amount: pendingData.amount || 0,
      type: pendingData.type || 'expense',
      date: new Date(),
      accountId: pendingData.accountId || ''
    });
  }, [pendingData, form]);

  useEffect(() => {
    async function fetchData() {
      if (!token) return;
      try {
        const [accRes, catRes] = await Promise.all([
          fetch(`${API_BASE_URL}/list-accounts?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_BASE_URL}/categories`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (accRes.ok) {
          const data = await accRes.json();
          setAccounts(Array.isArray(data) ? data : (data.accounts || []));
        }

        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Falha ao carregar dados do formulário', error);
      }
    }
    if (isOpen) fetchData();
  }, [token, isOpen]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

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

      form.reset({ ...form.getValues(), description: '', category: '', amount: 0 });

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
      <DialogContent className="rounded-[2rem] max-w-[500px] border-none shadow-2xl p-6 sm:p-8">
        <Card className="border-none bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0 pb-6 text-center">
            <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-4">
              <MousePointer2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Nova Transação</CardTitle>
            <CardDescription>Insira uma movimentação rapidamente.</CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Compras de mercado" className="bg-slate-50 rounded-xl border-none h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Categoria</FormLabel>
                    <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "bg-slate-50 rounded-xl border-none h-12 justify-between text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Tag className="h-4 w-4 text-slate-400 shrink-0" />
                              {field.value || "Selecione a categoria"}
                            </div>
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-none shadow-2xl">
                        <div className="flex items-center border-b px-3 bg-slate-50/50">
                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                          <input
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Pesquisar categoria..."
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                          />
                        </div>
                        <ScrollArea className="h-60">
                          <div className="p-1">
                            {filteredCategories.length === 0 ? (
                              <div className="p-4 text-sm text-center text-muted-foreground">Nenhuma categoria encontrada.</div>
                            ) : (
                              filteredCategories.map((cat) => (
                                <button
                                  key={cat._id}
                                  type="button"
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-slate-100 transition-colors",
                                    field.value === cat.name && "bg-primary/10 text-primary font-bold"
                                  )}
                                  onClick={() => {
                                    field.onChange(cat.name);
                                    setIsCategoryPopoverOpen(false);
                                    setCategorySearch('');
                                  }}
                                >
                                  <div className="flex-1 text-left">{cat.name}</div>
                                  {field.value === cat.name && <Check className="h-4 w-4" />}
                                </button>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="accountId" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Conta Bancária</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-50 rounded-xl border-none h-12">
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
                          className="bg-slate-50 rounded-xl border-none h-12 caret-transparent"
                          inputMode="numeric"
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
                          <SelectTrigger className="bg-slate-50 rounded-xl border-none h-12">
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
                          <Button variant={"outline"} className={cn("bg-slate-50 rounded-xl border-none h-12 text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                            {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ptBR }) : <span>Escolha uma data</span>}
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

                <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 mt-4 transition-all hover:scale-[1.01]">
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Adicionar Transação"}
                </Button>

              </form>
            </Form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
