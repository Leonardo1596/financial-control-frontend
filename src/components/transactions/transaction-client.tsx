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
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, LayoutGrid, Plus, Filter, Landmark, Search, FileUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog as AD, 
  AlertDialogAction as ADA, 
  AlertDialogCancel as ADC, 
  AlertDialogContent as ADContent, 
  AlertDialogDescription as ADDescription, 
  AlertDialogFooter as ADFooter, 
  AlertDialogHeader as ADHeader, 
  AlertDialogTitle as ADTitle, 
  AlertDialogTrigger as ADTrigger 
} from '@/components/ui/alert-dialog';
import { API_BASE_URL } from '@/lib/api';

export default function TransactionClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedAccountId, setSelectedAccountId] = useState('todas');
  const [searchTerm, setSearchTerm] = useState('');

  // =========================
  // 🔥 ADICIONADO: pending flow
  // =========================
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const endpoint = searchTerm 
        ? `${API_BASE_URL}/filter-transactions-by-name?name=${encodeURIComponent(searchTerm)}`
        : `${API_BASE_URL}/list-transaction`;

      const [transResponse, accountsResponse] = await Promise.all([
        fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/list-accounts?month=${month}&year=${year}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

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
  }, [token, toast, month, year, searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, searchTerm ? 500 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [fetchData]);

  const handleDelete = async (transactionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/delete-transaction/${transactionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
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
      const response = await fetch(`${API_BASE_URL}/delete-all-transactions`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Falha ao deletar transações');
      toast({ title: 'Sucesso', description: 'Histórico limpo com sucesso.' });
      fetchData();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setIsDeletingAll(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(transaction => {
        const parts = transaction.date.split('-');
        const transYear = parts[0];
        const transMonth = parseInt(parts[1], 10).toString();

        const monthMatch = month === 'todas' || transMonth === month;
        const yearMatch = year === 'todas' || transYear === year;
        const accountMatch = selectedAccountId === 'todas' || transaction.accountId === selectedAccountId;

        return monthMatch && yearMatch && accountMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, month, year, selectedAccountId]);

  // =========================
  // 🔥 PENDING LOGIC
  // =========================

  useEffect(() => {
    const id = localStorage.getItem("pendingTransactionId");

    if (!id) return;

    localStorage.removeItem("pendingTransactionId");

    setPendingId(id);
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!pendingId || !token) return;

    fetch(`${API_BASE_URL}/pending-transactions/${pendingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPendingData(data))
      .catch(console.error);
  }, [pendingId, token]);

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase()),
  }));

  return (
    <div className="flex flex-col w-full max-w-full space-y-8 overflow-hidden">

      <div className="space-y-4">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full h-20 bg-white hover:bg-slate-50 text-slate-900 border border-slate-100 shadow-sm rounded-[2.5rem] flex items-center justify-between px-8 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
              <Plus className="h-6 w-6 text-primary group-hover:text-white" />
            </div>
            <span className="font-bold text-xl">Nova Transação</span>
          </div>
          <ChevronDown className="h-6 w-6 text-slate-300" />
        </Button>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-import" className="border-none">
            <AccordionTrigger className="hover:no-underline py-0">
              <div className="flex items-center gap-2 text-slate-400 hover:text-primary text-xs font-bold uppercase tracking-widest px-8">
                <FileUp className="h-4 w-4" />
                Importar CSV
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 px-2">
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <FileUpload onUploadSuccess={() => { fetchData(); }} />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-4 sm:gap-6 w-full">
        <div className='flex items-center gap-3 sm:gap-4 w-full lg:w-auto'>
          <div className="p-2.5 sm:p-3 bg-slate-50 rounded-xl">
            <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400" />
          </div>
          <div className="flex-1 lg:flex-none">
            <h3 className="text-base sm:text-lg font-bold">Histórico</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">Suas movimentações.</p>
          </div>
        </div>

        <div className='flex items-center gap-2 sm:gap-3 flex-wrap justify-start sm:justify-center w-full lg:w-auto'>
          <div className="relative w-full lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Pesquisar por nome..." 
              className="pl-9 h-10 sm:h-11 bg-slate-50 border-none rounded-xl text-xs sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 text-slate-400 mr-2 hidden md:flex">
            <Filter className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Filtros</span>
          </div>

          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-full sm:w-[160px] bg-slate-50 border-none rounded-xl h-10 sm:h-11 font-medium text-xs sm:text-sm">
              <div className="flex items-center gap-2 truncate">
                <Landmark className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Contas" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todas">Todas as contas</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="flex-1 sm:w-[130px] bg-slate-50 border-none rounded-xl h-10 sm:h-11 font-medium text-xs sm:text-sm">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="todas">Todos</SelectItem>
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="flex-1 sm:w-[100px] bg-slate-50 border-none rounded-xl h-10 sm:h-11 font-medium text-xs sm:text-sm">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="todas">Todos</SelectItem>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <AD>
            <ADTrigger asChild>
              <Button variant="ghost" disabled={filteredTransactions.length === 0 || loading} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 h-10 sm:h-11 rounded-xl w-full sm:w-auto text-xs font-bold">
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </ADTrigger>
            <ADContent className="rounded-2xl border-none shadow-2xl max-w-[90vw]">
              <ADHeader>
                <ADTitle className="text-xl">Limpar histórico?</ADTitle>
                <ADDescription>
                  Esta ação excluirá permanentemente TODAS as suas transações filtradas atualmente.
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

      <div className="w-full max-w-full overflow-hidden">
        <TransactionList 
          transactions={filteredTransactions} 
          accounts={accounts}
          onDelete={handleDelete} 
          loading={loading} 
        />
      </div>

      <TransactionForm 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setPendingId(null);
          setPendingData(null);
        }} 
        onTransactionAdded={fetchData}
        pendingData={pendingData}
      />
    </div>
  );
}