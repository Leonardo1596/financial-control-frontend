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
import { Loader2, Landmark } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório (ex: Nubank)'),
  balance: z.coerce.number().describe('Saldo inicial'),
});

type FormValues = z.infer<typeof formSchema>;

interface AccountsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AccountsForm({ isOpen, onClose, onSuccess }: AccountsFormProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      balance: 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('https://financial-control-9s01.onrender.com/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Falha ao criar conta bancária');

      toast({ title: 'Sucesso!', description: 'Nova conta adicionada com sucesso.' });
      form.reset();
      onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit mb-4">
             <Landmark className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Nova Instituição</DialogTitle>
          <DialogDescription className="text-center">
            Adicione um banco ou corretora para organizar suas transações.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Nome da Instituição</FormLabel>
                <FormControl><Input placeholder="Ex: Nubank, XP Investimentos..." className="bg-slate-50 border-none rounded-xl h-12" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="balance" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">Saldo Inicial</FormLabel>
                <FormControl><Input type="number" step="0.01" placeholder="R$ 0,00" className="bg-slate-50 border-none rounded-xl h-12" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <DialogFooter className="gap-3 sm:gap-0">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl h-12 font-semibold">Cancelar</Button>
                <Button type="submit" disabled={isLoading} className="rounded-xl h-12 font-bold shadow-lg shadow-primary/20">
                    {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Salvar Conta'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
