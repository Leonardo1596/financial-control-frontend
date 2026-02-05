"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction } from '@/lib/types';
import TransactionList from './transaction-list';
import TransactionForm from './transaction-form';
import FileUpload from './file-upload';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/accordion'; // Fixed import issue found in previous check
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog as AD, AlertDialogAction as ADA, AlertDialogCancel as ADC, AlertDialogContent as ADContent, AlertDialogDescription as ADDescription, AlertDialogFooter as ADFooter, AlertDialogHeader as ADHeader, AlertDialogTitle as ADTitle, AlertDialogTrigger as ADTrigger } from '@/components/ui/alert-dialog';

export default function TransactionClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/list-transaction?month=${month}&year=${year}`, {
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
  }, [token, toast, month, year]);

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

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase()),
  }));

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full">
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

      <div className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">
          <div className='flex-grow'>
              <h3 className="text-lg font-semibold">Gerenciar Transações</h3>
              <p className="text-sm text-muted-foreground">Filtre por data ou exclua todas as suas transações.</p>
          </div>
        <div className='flex items-center gap-2'>
            <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
            </Select>
            <AD>
            <ADTrigger asChild>
                <Button variant="destructive" disabled={transactions.length === 0 || loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Todas
                </Button>
            </ADTrigger>
            <ADContent>
                <ADHeader>
                <ADTitle>Você tem certeza absoluta?</ADTitle>
                <ADDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente TODAS as suas transações.
                </ADDescription>
                </ADHeader>
                <ADFooter>
                <ADC>Cancelar</ADC>
                <ADA
                    disabled={isDeletingAll}
                    className={cn(buttonVariants({variant: "destructive"}))}
                    onClick={handleDeleteAll}
                >
                    {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sim, excluir tudo
                </ADA>
                </ADFooter>
            </ADContent>
            </AD>
        </div>
      </div>

      <TransactionList transactions={transactions} onDelete={handleDelete} loading={loading} />
    </div>
  );
}
