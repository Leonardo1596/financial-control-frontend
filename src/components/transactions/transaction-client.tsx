"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction } from '@/lib/types';
import TransactionList from './transaction-list';
import TransactionForm from './transaction-form';
import FileUpload from './file-upload';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TransactionClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('https://financial-control-9s01.onrender.com/list-transaction', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar transações');
      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleDelete = async (transactionId: string) => {
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/delete-transaction/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar transação');
      toast({ title: 'Sucesso', description: 'Transação deletada.' });
      fetchTransactions();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const response = await fetch('https://financial-control-9s01.onrender.com/delete-all-transactions', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao deletar todas as transações.' }));
        throw new Error(errorData.message || 'Falha ao deletar todas as transações.');
      }
      toast({ title: 'Sucesso', description: 'Todas as transações foram excluídas com sucesso.' });
      fetchTransactions();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
        <AccordionItem value="item-1">
          <AccordionTrigger className='text-lg font-semibold'>Adicionar Nova Transação</AccordionTrigger>
          <AccordionContent>
            <div className="pt-4 grid gap-6 md:grid-cols-2">
              <TransactionForm onTransactionAdded={fetchTransactions} />
              <FileUpload onUploadSuccess={fetchTransactions} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="p-4 border rounded-lg bg-card flex justify-between items-center">
          <div>
              <h3 className="text-lg font-semibold">Gerenciar Transações</h3>
              <p className="text-sm text-muted-foreground">Exclua todas as suas transações de uma só vez.</p>
          </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={transactions.length === 0 || loading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Todas
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente TODAS as suas transações.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                  disabled={isDeletingAll}
                  className={cn(buttonVariants({variant: "destructive"}))}
                  onClick={handleDeleteAll}
              >
                  {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sim, excluir tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <TransactionList transactions={transactions} onDelete={handleDelete} loading={loading} />
    </div>
  );
}
