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
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import type { AccountPayable } from '@/lib/types';

const formSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.coerce.number().positive('O valor deve ser positivo'),
  dueDate: z.date({ required_error: "A data de vencimento é obrigatória." }),
  category: z.string().min(1, 'Categoria é obrigatória'),
  type: z.enum(['fixa', 'variavel']),
  recurring: z.boolean().default(false),
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
      recurring: false,
    },
  });

  useEffect(() => {
    if (accountToEdit) {
      const utcDate = parseISO(accountToEdit.dueDate);
      const adjustedDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
      form.reset({
        ...accountToEdit,
        dueDate: adjustedDate,
      });
    } else {
      form.reset({
        description: '',
        amount: 0,
        dueDate: new Date(),
        category: '',
        type: 'variavel',
        recurring: false,
      });
    }
  }, [accountToEdit, form, isOpen]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const url = accountToEdit
        ? `https://financial-control-9s01.onrender.com/update-account/${accountToEdit._id}`
        : 'https://financial-control-9s01.onrender.com/create-account';
      
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{accountToEdit ? 'Editar Conta' : 'Criar Nova Conta'}</DialogTitle>
          <DialogDescription>
            {accountToEdit ? 'Atualize os detalhes da sua conta a pagar.' : 'Preencha os campos para adicionar uma nova conta.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input placeholder="Ex: Conta de luz" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="amount" render={({ field }) => (
                <FormItem><FormLabel>Valor</FormLabel><FormControl><Input type="number" step="0.01" placeholder="R$ 0,00" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Categoria</FormLabel><FormControl><Input placeholder="Ex: Moradia" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Data de Vencimento</FormLabel><Popover modal={true}><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}</Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
            )}/>
            <div className="grid grid-cols-2 gap-4 items-center">
                <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="fixa">Fixa</SelectItem><SelectItem value="variavel">Variável</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="recurring" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-start space-x-3 space-y-0 rounded-md border p-3 mt-8">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Recorrente</FormLabel>
                        </div>
                    </FormItem>
                )}/>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {accountToEdit ? 'Salvar Alterações' : 'Criar Conta'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
