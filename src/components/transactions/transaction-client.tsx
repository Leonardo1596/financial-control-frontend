"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction } from '@/lib/types';
import TransactionList from './transaction-list';
import TransactionForm from './transaction-form';
import FileUpload from './file-upload';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Trash2, Calendar, LayoutGrid, Plus } from 'lucide-react';
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
    <div className="space-y-10">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className='px-8 py-6 text-lg font-bold hover:no-underline hover:bg-slate-50 transition-all'>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                Adicionar Nova Transação
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-8 pt-2">
              <div className="grid gap-8 md:grid-cols-2">
                <TransactionForm onTransactionAdded={fetchTransactions} />
                <FileUpload onUploadSuccess={fetchTransactions} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className='flex items-center gap-4'>
              <div className="p-3 bg-slate-100 rounded-xl">
                <LayoutGrid className="h-6 w-6 text-slate-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Histórico</h3>
                <p className="text-sm text-muted-foreground">Analise suas movimentações.</p>
              </div>
          </div>
        <div className='flex items-center gap-3 flex-wrap justify-center'>
            <div className="flex items-center gap-2 mr-2">
               <Calendar className="h-4 w-4 text-slate-400" />
            </div>
            <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[140px] bg-slate-50 border-none rounded-xl h-11 font-medium">
                <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[110px] bg-slate-50 border-none rounded-xl h-11 font-medium">
                <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
            </Select>
            <AD>
            <ADTrigger asChild>
                <Button variant="ghost" disabled={transactions.length === 0 || loading} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-11 rounded-xl">
                  <Trash2 className="mr-2 h-5 w-5" />
                  Limpar Tudo
                </Button>
            </ADTrigger>
            <ADContent className="rounded-2xl border-none shadow-2xl">
                <ADHeader>
                <ADTitle className="text-xl">Você tem certeza absoluta?</ADTitle>
                <ADDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente TODAS as suas transações para o período selecionado.
                </ADDescription>
                </ADHeader>
                <ADFooter className="mt-4 gap-2">
                <ADC className="rounded-xl border-none bg-slate-100 hover:bg-slate-200">Cancelar</ADC>
                <ADA
                    disabled={isDeletingAll}
                    className={cn(buttonVariants({variant: "destructive"}), "rounded-xl shadow-lg shadow-rose-500/20")}
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

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <TransactionList transactions={transactions} onDelete={handleDelete} loading={loading} />
      </div>
    </div>
  );
}
