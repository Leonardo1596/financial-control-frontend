"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, ReceiptText } from 'lucide-react';
import type { AccountPayable } from '@/lib/types';
import { API_BASE_URL } from '@/lib/api';

const formSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.coerce.number().positive('O valor deve ser positivo'),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  category: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['fixa', 'variavel']),
  installments: z.coerce.number().int().min(1, 'Mínimo de 1 parcela').default(1),
});

type FormValues = z.infer<typeof formSchema>;

interface AccountsPayableFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountToEdit: AccountPayable | null;
}

export default function AccountsPayableForm({ isOpen, onClose, onSuccess, accountToEdit }: AccountsPayableFormProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
      dueDate: new Date(),
      category: '',
      type: 'variavel',
      installments: 1,
    },
  });

  useEffect(() => {
    if (accountToEdit) {
      const utcDate = parseISO(accountToEdit.dueDate);
      const adjustedDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
      form.reset({
        description: accountToEdit.description,
        amount: accountToEdit.amount,
        dueDate: adjustedDate,
        category: accountToEdit.category,
        type: accountToEdit.type,
        installments: accountToEdit.installments || 1,
      });
    } else {
      form.reset({
        description: '',
        amount: 0,
        dueDate: new Date(),
        category: '',
        type: 'variavel',
        installments: 1,
      });
    }
  }, [accountToEdit, form, isOpen]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const url = accountToEdit
        ? `${API_BASE_URL}/update/${accountToEdit._id}`
        : `${API_BASE_URL}/create`;
      
      const method = accountToEdit ? 'PUT' : 'POST';

      const body = {
        ...values,
        dueDate: format(values.dueDate, 'yyyy-MM-dd'),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Falha ao ${accountToEdit ? 'atualizar' : 'criar'} conta`);
      }

      toast({
        title: 'Sucesso!',
        description: `Conta ${accountToEdit ? 'atualizada' : 'criada'} com sucesso.`,
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl overflow-hidden">
        <DialogHeader className="p-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-2xl w-fit mb-2">
             <ReceiptText className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl font-bold">
            {accountToEdit ? 'Editar Conta' : 'Nova Conta a Pagar'}
          </DialogTitle>
          <DialogDescription className="text-center text-sm">
            {accountToEdit ? 'Atualize as informações do seu débito.' : 'Organize suas saídas financeiras futuras.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-1 py-4">
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Descrição</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Aluguel, Internet, Netflix..." className="h-11 rounded-xl bg-slate-50 border-none focus:ring-primary/20" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}/>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Valor</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="R$ 0,00" className="h-11 rounded-xl bg-slate-50 border-none focus:ring-primary/20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Categoria</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Moradia" className="h-11 rounded-xl bg-slate-50 border-none focus:ring-primary/20" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Vencimento</FormLabel>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("h-11 rounded-xl bg-slate-50 border-none text-left font-normal pl-3", !field.value && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                          {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ptBR }) : <span>Escolha</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-xl" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="rounded-2xl" />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="type" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Tipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none focus:ring-primary/20">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="fixa">Fixa</SelectItem>
                      <SelectItem value="variavel">Variável</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>

            <FormField control={form.control} name="installments" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Número de Parcelas</FormLabel>
                <FormControl>
                  <Input type="number" min="1" className="h-11 rounded-xl bg-slate-50 border-none focus:ring-primary/20" {...field} />
                </FormControl>
                <FormDescription className="text-[10px] leading-tight">Quantas vezes este valor será repetido mensalmente.</FormDescription>
                <FormMessage />
              </FormItem>
            )}/>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl h-12 font-semibold">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (accountToEdit ? 'Atualizar Conta' : 'Salvar Conta')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
