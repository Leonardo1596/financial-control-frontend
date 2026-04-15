
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Transaction, UserAccount } from '@/lib/types';
import TransactionList from './transaction-list';
import TransactionForm from './transaction-form';
import FileUpload from './file-upload';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Search, 
  Loader2, 
  LayoutGrid, 
  Filter, 
  ChevronDown, 
  Trash2, 
  FileUp, 
  X,
  Landmark
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

export default function TransactionClient() {
  const { token } = useAuth();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('todas');
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<any>(null);

  const fetchData = useCallback(async (name?: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const url = name 
        ? `${API_BASE_URL}/filter-transactions-by-name?name=${encodeURIComponent(name)}`
        : `${API_BASE_URL}/list-transaction`;

      const [transResponse, accountsResponse] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/list-accounts?month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const transData = await transResponse.json();
      const accountsData = await accountsResponse.json();

      setTransactions(Array.isArray(transData) ? transData : []);
      setAccounts(Array.isArray(accountsData) ? accountsData : []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Erro ao buscar dados' });
    } finally {
      setLoading(false);
    }
  }, [token, toast, month, year]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchData]);

  useEffect(() => {
    function checkPending() {
      const id = localStorage.getItem("pendingTransactionId");
      if (!id) return;
      localStorage.removeItem("pendingTransactionId");
      setPendingId(id);
      setIsModalOpen(true);
    }
    const timeoutId = setTimeout(checkPending, 100);
    document.addEventListener("resume", checkPending);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("resume", checkPending);
    };
  }, []);

  useEffect(() => {
    if (!pendingId || !token) return;
    fetch(`${API_BASE_URL}/pending-transactions/${pendingId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setPendingData(data))
      .catch(() => toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar transação detectada" }));
  }, [pendingId, token, toast]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/delete-transaction/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar transação');
      toast({ title: 'Sucesso', description: 'Transação excluída com sucesso.' });
      fetchData(searchTerm);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedAccountId('todas');
    setMonth((new Date().getMonth() + 1).toString());
    setYear(new Date().getFullYear().toString());
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const accountMatch = selectedAccountId === 'todas' || t.accountId === selectedAccountId;
      return accountMatch;
    });
  }, [transactions, selectedAccountId]);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = [
    { v: '1', l: 'Janeiro' }, { v: '2', l: 'Fevereiro' }, { v: '3', l: 'Março' },
    { v: '4', l: 'Abril' }, { v: '5', l: 'Maio' }, { v: '6', l: 'Junho' },
    { v: '7', l: 'Julho' }, { v: '8', l: 'Agosto' }, { v: '9', l: 'Setembro' },
    { v: '10', l: 'Outubro' }, { v: '11', l: 'Novembro' }, { v: '12', l: 'Dezembro' }
  ];

  return (
    <div className="flex flex-col space-y-8 max-w-full overflow-x-hidden">
      
      {/* Botão Nova Transação */}
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

        <Collapsible open={isImportOpen} onOpenChange={setIsImportOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="text-slate-400 hover:text-primary gap-2 text-xs font-bold uppercase tracking-widest px-8">
              <FileUp className="h-4 w-4" />
              Importar CSV
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-2">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <FileUpload onUploadSuccess={() => { fetchData(); setIsImportOpen(false); }} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Card de Filtros (Histórico) */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 w-full">
        
        {/* Cabeçalho do Filtro */}
        <div className="flex items-center gap-4 px-1">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <LayoutGrid className="h-6 w-6 text-slate-300" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-slate-900 leading-tight">Histórico</h3>
            <p className="text-xs text-slate-400 font-medium">Suas movimentações.</p>
          </div>
        </div>

        {/* Campo de Pesquisa */}
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
          <Input 
            placeholder="Pesquisar por nome..." 
            className="pl-12 h-14 bg-slate-50 border-none rounded-2xl focus:ring-primary/20 text-slate-600 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Seletor de Contas */}
        <div className="w-full">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-full h-14 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 px-4">
              <div className="flex items-center gap-3">
                <Landmark className="h-5 w-5 text-slate-300" />
                <SelectValue placeholder="Todas as contas" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="todas">Todas as contas</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seletores de Mês e Ano */}
        <div className="grid grid-cols-2 gap-4">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 px-4">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {months.map(m => (
                <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 px-4">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {years.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botão Limpar */}
        <div className="flex justify-center pt-2">
          <Button 
            variant="ghost" 
            onClick={clearFilters}
            className="h-10 px-6 rounded-2xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2"
          >
            <Trash2 className="h-5 w-5" />
            Limpar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <TransactionList
          transactions={filteredTransactions}
          accounts={accounts}
          loading={loading}
          onDelete={handleDelete}
        />
      )}

      <TransactionForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingId(null);
          setPendingData(null);
        }}
        onTransactionAdded={() => {
          fetchData(searchTerm);
          setIsModalOpen(false);
          setPendingId(null);
          setPendingData(null);
        }}
        pendingData={pendingData}
      />
    </div>
  );
}
