"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction, UserAccount } from '@/lib/types';
import TransactionList from './transaction-list';
import TransactionForm from './transaction-form';
import FileUpload from './file-upload';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Trash2, LayoutGrid, Plus, Filter, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog as AD, AlertDialogAction as ADA, AlertDialogCancel as ADC, AlertDialogContent as ADContent, AlertDialogDescription as ADDescription, AlertDialogFooter as ADFooter, AlertDialogHeader as ADHeader, AlertDialogTitle as ADTitle, AlertDialogTrigger as ADTrigger } from '@/components/ui/alert-dialog';

export default function TransactionClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedAccountId, setSelectedAccountId] = useState('todas');

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Busca transações
      const transResponse = await fetch(`https://financial-control-9s01.onrender.com/list-transaction`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Busca contas para mapear nomes na tabela e filtros
      const accountsResponse = await fetch('https://financial-control-9s01.onrender.com/list-accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!transResponse.ok || !accountsResponse.ok) throw new Error('Falha ao buscar dados');

      const transData = await transResponse.json();
      const accountsData = await accountsResponse.json();

      setTransactions(Array.isArray(transData) ? transData : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (transactionId: string) => {
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/delete-transaction/${transactionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar transação');
      toast({ title: 'Sucesso', description: 'Transação deletada.' });
      fetchData();
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
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transDate = new Date(transaction.date);
      const adjustedDate = new Date(transDate.getTime() + transDate.getTimezoneOffset() * 60000);
      const transMonth = (adjustedDate.getMonth() + 1).toString();
      const transYear = adjustedDate.getFullYear().toString();

      const monthMatch = month === 'todas' || transMonth === month;
      const yearMatch = year === 'todas' || transYear === year;
      const accountMatch = selectedAccountId === 'todas' || transaction.accountId === selectedAccountId;

      return monthMatch && yearMatch && accountMatch;
    });
  }, [transactions, month, year, selectedAccountId]);

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase()),
  }));

  return (
    <div className="space-y-10">
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1" className="border-none">
            <AccordionTrigger className='px-8 py-6 text-lg font-bold hover:no-underline hover:bg-slate-50 transition-all group'>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                  <Plus className="h-5 w-5" />
                </div>
                Adicionar Nova Transação
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-8 pb-8 pt-2">
              <div className="grid gap-8 md:grid-cols-2">
                <TransactionForm onTransactionAdded={fetchData} />
                <FileUpload onUploadSuccess={fetchData} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className='flex items-center gap-4 w-full lg:w-auto'>
          <div className="p-3 bg-slate-50 rounded-xl">
            <LayoutGrid className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Histórico</h3>
            <p className="text-sm text-muted-foreground">Analise suas movimentações.</p>
          </div>
        </div>
        
        <div className='flex items-center gap-3 flex-wrap justify-center w-full lg:w-auto'>
          <div className="flex items-center gap-2 text-slate-400 mr-2 hidden sm:flex">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
          </div>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-50 border-none rounded-xl h-11 font-medium hover:bg-slate-100 transition-colors">
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Todas as contas" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todas">Todas as contas</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-full sm:w-[150px] bg-slate-50 border-none rounded-xl h-11 font-medium hover:bg-slate-100 transition-colors">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todas">Todos os meses</SelectItem>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-full sm:w-[120px] bg-slate-50 border-none rounded-xl h-11 font-medium hover:bg-slate-100 transition-colors">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todas">Todos os anos</SelectItem>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <AD>
            <ADTrigger asChild>
              <Button variant="ghost" disabled={filteredTransactions.length === 0 || loading} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-11 rounded-xl w-full sm:w-auto">
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
        <TransactionList 
          transactions={filteredTransactions} 
          accounts={accounts}
          onDelete={handleDelete} 
          loading={loading} 
        />
      </div>
    </div>
  );
}