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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import type { Goal } from '@/lib/types';

const formSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser maior que zero'),
});

type FormValues = z.infer<typeof formSchema>;

function formatCurrencyFromCents(value: number) {
  return (value / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

interface ContributionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  goal: Goal | null;
}

export default function ContributionForm({ isOpen, onClose, onSuccess, goal }: ContributionFormProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!goal) return;
    setIsLoading(true);
    try {
      // Rota atualizada conforme solicitado pelo usuário
      const response = await fetch(`${API_BASE_URL}/goal/${goal._id}/add-value`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: values.amount }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao adicionar valor ao objetivo');
      }

      toast({ 
        title: 'Boa!', 
        description: 'Valor guardado com sucesso. Você está mais perto do seu sonho!' 
      });
      
      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Erro', 
        description: (error as Error).message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl">
        <DialogHeader>
          <div className="mx-auto bg-emerald-100 p-4 rounded-2xl w-fit mb-4">
            <TrendingUp className="h-8 w-8 text-emerald-600" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            Guardar Dinheiro
          </DialogTitle>
          <DialogDescription className="text-center">
            Adicione um valor ao seu objetivo: <strong className="text-slate-900">{goal?.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500 text-center block">Quanto você quer guardar hoje?</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="R$ 0,00"
                        className="h-16 text-center text-3xl font-black bg-slate-50 border-none rounded-2xl caret-transparent text-emerald-600"
                        inputMode="decimal"
                        value={formatCurrencyFromCents((field.value || 0) * 100)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          const cents = Number(raw);
                          field.onChange(cents / 100);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-center" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-3 sm:gap-0">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl h-12 font-semibold">
                Agora não
              </Button>
              <Button type="submit" disabled={isLoading} className="rounded-xl h-12 font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirmar Depósito'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
