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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Loader2, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { API_BASE_URL } from '@/lib/api';
import type { Goal } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'O nome do objetivo é obrigatório'),
  targetAmount: z.coerce.number().positive('O valor alvo deve ser maior que zero'),
  deadline: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function formatCurrencyFromCents(value: number) {
  return (value / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

interface GoalsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goalToEdit: Goal | null;
}

export default function GoalsForm({ isOpen, onClose, onSuccess, goalToEdit }: GoalsFormProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      deadline: undefined,
    },
  });

  useEffect(() => {
    if (goalToEdit) {
      const deadlineDate = goalToEdit.deadline ? parseISO(goalToEdit.deadline) : undefined;
      const adjustedDate = deadlineDate ? new Date(deadlineDate.getTime() + deadlineDate.getTimezoneOffset() * 60000) : undefined;
      
      form.reset({
        name: goalToEdit.name,
        targetAmount: goalToEdit.targetAmount,
        deadline: adjustedDate,
      });
    } else {
      form.reset({
        name: '',
        targetAmount: 0,
        deadline: undefined,
      });
    }
  }, [goalToEdit, form, isOpen]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const url = goalToEdit 
        ? `${API_BASE_URL}/goal/${goalToEdit._id}`
        : `${API_BASE_URL}/create-goal`;
      
      const method = goalToEdit ? 'PUT' : 'POST';

      const body = {
        ...values,
        deadline: values.deadline ? format(values.deadline, 'yyyy-MM-dd') : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Falha ao ${goalToEdit ? 'atualizar' : 'criar'} objetivo`);

      toast({ title: 'Sucesso!', description: `Objetivo ${goalToEdit ? 'atualizado' : 'criado'} com sucesso.` });
      onSuccess();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit mb-4">
            <Target className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {goalToEdit ? 'Editar Objetivo' : 'Novo Objetivo'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {goalToEdit ? 'Atualize os detalhes do seu sonho.' : 'O que você quer conquistar hoje?'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome do Objetivo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Viagem para o Japão, Reserva de Emergência..." className="h-12 bg-slate-50 border-none rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Valor Alvo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        className="h-12 bg-slate-50 border-none rounded-xl caret-transparent"
                        inputMode="decimal"
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
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Prazo (Opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("h-12 bg-slate-50 border-none rounded-xl text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                            {field.value ? format(field.value, 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-xl" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="rounded-2xl" />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-3 sm:gap-0 pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl h-12 font-semibold">
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (goalToEdit ? 'Salvar Alterações' : 'Criar Objetivo')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
