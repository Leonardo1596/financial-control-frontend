"use client";

import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const formSchema = z.object({
  description: z.string().min(1, { message: 'A descrição é obrigatória' }),
  amount: z.coerce.number().positive({ message: 'O valor deve ser positivo' }),
  type: z.enum(['income', 'expense']),
  date: z.date({ required_error: 'A data é obrigatória.' }),
});

export default function TransactionForm({ onTransactionAdded }: { onTransactionAdded: () => void }) {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: '', amount: 0, type: 'expense', date: new Date() },
  });

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
      const response = await fetch('https://financial-control-9s01.onrender.com/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Falha ao criar transação');
      toast({ title: 'Sucesso', description: 'Transação adicionada.' });
      form.reset({ ...form.getValues(), description: '', amount: 0 });
      onTransactionAdded();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Entrada Manual</CardTitle></CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input placeholder="ex: Compras de mercado" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Valor</FormLabel><FormControl><Input type="number" step="0.01" placeholder="R$ 0,00" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="income">Renda</SelectItem><SelectItem value="expense">Despesa</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Data</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
            )}/>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Adicionar Transação
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
