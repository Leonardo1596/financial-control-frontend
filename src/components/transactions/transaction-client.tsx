
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
  X 
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
      // Usamos a rota de filtro se houver nome, senão a lista padrão
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

  // Filtragem local adicional para conta (caso o backend não filtre tudo)
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
    <div className="flex flex-col space-y-8 max-w-full">
      
      {/* Botão Nova Transação (Estilo Imagem) */}
      <div className="space-y-4">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full h-16 bg-white hover:bg-slate-50 text-slate-900 border border-slate-100 shadow-sm rounded-3xl flex items-center justify-between px-8 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary group-hover:text-white transition-colors">
              <Plus className="h-5 w-5 text-primary group-hover:text-white" />
            </div>
            <span className="font-bold text-lg">Nova Transação</span>
          </div>
          <ChevronDown className="h-5 w-5 text-slate-300" />
        </Button>

        {/* Importação CSV (Oculto por padrão, expansível) */}
        <Collapsible open={isImportOpen} onOpenChange={setIsImportOpen} className="w-full">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="text-slate-400 hover:text-primary gap-2 text-xs font-bold uppercase tracking-widest px-8">
              <FileUp className="h-4 w-4" />
              Importar CSV
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 px-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <FileUpload onUploadSuccess={() => { fetchData(); setIsImportOpen(false); }} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Barra de Histórico e Filtros */}
      <div className="bg-white p-4 sm:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        
        {/* Título Histórico */}
        <div className="flex items-center gap-4 shrink-0 px-2">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <LayoutGrid className="h-5 w-5 text-slate-400" />
          </div>
          <div className="hidden sm:block">
            <h3 className="font-bold text-slate-900 leading-tight">Histórico</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Suas movimentações.</p>
          </div>
        </div>

        {/* Busca e Filtros */}
        <div className="flex-1 flex flex-wrap items-center gap-3 w-full">
          
          {/* Pesquisa */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input 
              placeholder="Pesquisar por nome..." 
              className="pl-10 h-12 bg-slate-50/50 border-none rounded-2xl focus:ring-primary/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar w-full sm:w-auto">
            <div className="flex items-center gap-2 text-slate-400 px-2 shrink-0">
               <Filter className="h-4 w-4" />
               <span className="text-[10px] font-bold uppercase tracking-widest">Filtros</span>
            </div>

            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[160px] h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 text-xs">
                <SelectValue placeholder="Contas" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="todas">Todas as contas</SelectItem>
                {accounts.map(acc => (
                  <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[120px] h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 text-xs">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {months.map(m => (
                  <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[100px] h-12 bg-slate-50 border-none rounded-2xl font-bold text-slate-600 text-xs">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              onClick={clearFilters}
              className="h-12 px-4 rounded-2xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 shrink-0"
            >
              <Trash2 className="h-4 w-4" />
              Limpar
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
