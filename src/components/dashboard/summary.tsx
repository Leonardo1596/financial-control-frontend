"use client";
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SummaryCard, SummaryCardSkeleton } from './summary-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Wallet, Calendar, Landmark, ChevronRight, ReceiptText, ArrowRight } from 'lucide-react';
import type { Summary, UserAccount, AccountPayable } from '@/lib/types';
import { API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function Summary() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [accountsPayable, setAccountsPayable] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayable, setLoadingPayable] = useState(true);

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [selectedAccountId, setSelectedAccountId] = useState('todas');

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch(`${API_BASE_URL}/list-accounts?month=${month}&year=${year}`, {
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
    
    async function fetchPayables() {
      setLoadingPayable(true);
      try {
        const response = await fetch(`${API_BASE_URL}/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const filtered = (Array.isArray(data) ? data : [])
            .filter(a => a.status === 'pendente')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 5);
          setAccountsPayable(filtered);
        }
      } catch (error) {
        console.error('Falha ao carregar contas a pagar', error);
      } finally {
        setLoadingPayable(false);
      }
    }

    if (token) {
      fetchAccounts();
      fetchPayables();
    }
  }, [token, month, year]);

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
    <div className="space-y-8 sm:space-y-12 max-w-full overflow-hidden">
      {/* Filtros */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-sm border border-slate-100 w-full overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Análise Mensal</h2>
            <p className="text-xs text-slate-500">Seu desempenho financeiro.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 bg-slate-50 border-none rounded-xl font-medium text-sm">
              <div className="flex items-center gap-2 truncate">
                <Landmark className="h-4 w-4 text-slate-400 shrink-0" />
                <SelectValue placeholder="Contas" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todas">Todas as instituições</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc._id} value={acc._id}>{acc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2 w-full">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="flex-1 sm:w-[130px] h-11 bg-slate-50 border-none rounded-xl font-medium text-sm">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="flex-1 sm:w-[100px] h-11 bg-slate-50 border-none rounded-xl font-medium text-sm">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-3">
        {loading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard title="Saldo Geral" value={summary?.balance ?? 0} icon={Wallet} color="text-primary" />
            <SummaryCard title="Total Receitas" value={summary?.income ?? 0} icon={TrendingUp} color="text-emerald-500" />
            <SummaryCard title="Total Despesas" value={summary?.expense ?? 0} icon={TrendingDown} color="text-rose-500" />
          </>
        )}
      </div>

      {/* Widgets Inferiores */}
      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        
        {/* Widget: Contas Bancárias */}
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Landmark className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Suas Contas</h3>
                <p className="text-xs sm:text-sm text-slate-500">Saldo por instituição</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-hidden">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
            ) : accounts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">Nenhuma conta encontrada.</div>
            ) : (
              accounts.map((account) => (
                <div key={account._id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all overflow-hidden">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                      <Landmark className="h-4 w-4 text-slate-400" />
                    </div>
                    <span className="font-bold text-slate-700 text-sm truncate">{account.name}</span>
                  </div>
                  <span className="font-mono font-bold text-blue-600 text-sm ml-2 shrink-0">
                    {formatCurrency(account.balance)}
                  </span>
                </div>
              ))
            )}
          </div>

          <Link href="/accounts" className="mt-6 sm:mt-8">
            <Button variant="outline" className="w-full h-11 sm:h-12 rounded-xl font-bold border-slate-200 hover:bg-slate-50 gap-2 text-sm">
              Gerenciar Instituições <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Widget: Próximos Vencimentos */}
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <ReceiptText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Vencimentos</h3>
                <p className="text-xs sm:text-sm text-slate-500">Contas pendentes</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 flex-1 overflow-hidden">
            {loadingPayable ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
            ) : accountsPayable.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">Tudo em dia!</div>
            ) : (
              accountsPayable.map((account) => {
                const dueDate = parseISO(account.dueDate);
                const adjustedDate = new Date(dueDate.getTime() + dueDate.getTimezoneOffset() * 60000);
                const formattedDate = format(adjustedDate, 'dd/MM/yyyy', { locale: ptBR });

                return (
                  <Dialog key={account._id}>
                    <DialogTrigger asChild>
                      <div className="group flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-amber-100 hover:bg-amber-50/30 transition-all cursor-pointer overflow-hidden">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 bg-white rounded-xl shadow-sm text-amber-600 shrink-0">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-700 text-sm truncate">{account.description}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formattedDate}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {formatCurrency(account.amount)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
                        </div>
                      </div>
                    </DialogTrigger>
                    
                    <DialogContent className="rounded-[1.5rem] sm:rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden max-w-[90vw] sm:max-w-md">
                      <div className="h-1.5 w-full bg-amber-500" />
                      <div className="p-6 sm:p-8">
                        <DialogHeader className="mb-6">
                          <div className="mx-auto bg-slate-50 p-4 rounded-2xl w-fit mb-4">
                            <ReceiptText className="h-7 w-7 text-slate-400" />
                          </div>
                          <DialogTitle className="text-center text-xl sm:text-2xl font-bold">{account.description}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor</span>
                            <span className="font-mono font-bold text-xl text-slate-900">{formatCurrency(account.amount)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1 text-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vencimento</span>
                              <span className="font-bold text-slate-900 text-xs">{formattedDate}</span>
                            </div>
                            <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-1 text-center">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Status</span>
                              <Badge className="bg-amber-100 text-amber-700 border-none capitalize font-bold text-[10px]">Pendente</Badge>
                            </div>
                          </div>
                        </div>

                        <DialogFooter className="mt-6 sm:mt-8">
                          <Link href="/accounts-payable" className="w-full">
                            <Button className="w-full h-11 sm:h-12 rounded-xl font-bold shadow-lg shadow-primary/20 text-sm">
                              Gerenciar Contas
                            </Button>
                          </Link>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })
            )}
          </div>

          <Link href="/accounts-payable" className="mt-6 sm:mt-8">
            <Button variant="outline" className="w-full h-11 sm:h-12 rounded-xl font-bold border-slate-200 hover:bg-slate-50 gap-2 text-sm">
              Ver Todas as Contas <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}