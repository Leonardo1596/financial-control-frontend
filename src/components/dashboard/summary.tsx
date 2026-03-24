"use client";
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SummaryCard, SummaryCardSkeleton } from './summary-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Wallet, Calendar, Landmark } from 'lucide-react';
import type { Summary, UserAccount } from '@/lib/types';
import { API_BASE_URL } from '@/lib/api';

export default function Summary() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedAccountId, setSelectedAccountId] = useState('todas');

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch(`${API_BASE_URL}/list-accounts`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAccounts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Falha ao carregar contas no resumo', error);
      }
    }
    if (token) fetchAccounts();
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchSummary();
    }
  }, [token, year, month, selectedAccountId]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/summary?month=${month}&year=${year}`;
      if (selectedAccountId !== 'todas') {
        url += `&accountId=${selectedAccountId}`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar resumo');
      const data = await response.json();
      console.log(data);
      setSummary(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase()),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl shadow-sm border-none">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Filtros de Análise</h2>
            <p className="text-sm text-muted-foreground">Selecione o período e a instituição desejada.</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap justify-center w-full lg:w-auto">
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="flex-1 sm:w-[200px] h-11 bg-slate-50 border-none rounded-xl font-medium">
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
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="flex-1 sm:w-[140px] h-11 bg-slate-50 border-none rounded-xl font-medium">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="flex-1 sm:w-[120px] h-11 bg-slate-50 border-none rounded-xl font-medium">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {loading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard title="Renda" value={summary?.income ?? 0} icon={TrendingUp} color="text-emerald-500" />
            <SummaryCard title="Despesa" value={summary?.expense ?? 0} icon={TrendingDown} color="text-rose-500" />
            <SummaryCard title="Saldo Período" value={summary?.balance ?? 0} icon={Wallet} color="text-primary" />
          </>
        )}
      </div>
    </div>
  );
}
