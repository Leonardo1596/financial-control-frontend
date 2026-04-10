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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Landmark } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { Preferences } from '@capacitor/preferences';
import type { UserAccount } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'Nome da conta é obrigatório (ex: Nubank)'),
});

type FormValues = z.infer<typeof formSchema>;

interface AccountsFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountToEdit: UserAccount | null;
}

export default function AccountsForm({ isOpen, onClose, onSuccess, accountToEdit }: AccountsFormProps) {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (accountToEdit) {
      form.reset({
        name: accountToEdit.name,
      });
    } else {
      form.reset({
        name: '',
      });
    }
  }, [accountToEdit, form, isOpen]);

  const normalizeSource = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("nubank")) return "nubank";
    if (lower.includes("rico")) return "rico";
    return lower.replace(/\s+/g, "_");
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const url = accountToEdit 
        ? `${API_BASE_URL}/update-account/${accountToEdit._id}`
        : `${API_BASE_URL}/create-account`;
      
      const method = accountToEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) throw new Error(`Falha ao ${accountToEdit ? 'atualizar' : 'criar'} conta bancária`);
      
      const data = await response.json();
      const accountId = accountToEdit ? accountToEdit._id : data._id;
      const source = normalizeSource(values.name);

      if (accountId && source) {
        const key = `account_${source}`;
        await Preferences.set({
          key: key,
          value: accountId
        });
      }

      toast({
        title: 'Sucesso!',
        description: `Conta ${accountToEdit ? 'atualizada' : 'adicionada'} com sucesso.`
      });

      form.reset();
      onSuccess();

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
      <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-2xl w-fit mb-4">
            <Landmark className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            {accountToEdit ? 'Editar Instituição' : 'Nova Instituição'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {accountToEdit ? 'Atualize o nome do seu banco ou corretora.' : 'Adicione um banco ou corretora para organizar suas transações.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Nome da Instituição
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Nubank, Rico, XP..."
                      className="bg-slate-50 border-none rounded-xl h-12"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-3 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xl h-12 font-semibold"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={isLoading}
                className="rounded-xl h-12 font-bold shadow-lg shadow-primary/20"
              >
                {isLoading
                  ? <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  : accountToEdit ? 'Atualizar Conta' : 'Salvar Conta'}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}