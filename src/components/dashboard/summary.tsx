"use client";
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { SummaryCard, SummaryCardSkeleton } from './summary-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Wallet, Loader2, Calendar } from 'lucide-react';
import type { Summary } from '@/lib/types';

export default function Summary() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  useEffect(() => {
    if (token) {
      fetchSummary();
    }
  }, [token, year, month]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/summary?month=${month}&year=${year}`, {
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

  const handleCloseMonth = async () => {
    setClosing(true);
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/records/close-month`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: parseInt(month), year: parseInt(year) })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Falha ao fechar o mês' }));
        throw new Error(errorData.message || 'Falha ao fechar o mês');
      }
      const data = await response.json();
      setSummary(data);
      toast({ title: 'Sucesso', description: 'Mês fechado com sucesso.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setClosing(false);
    }
  }

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase()),
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl shadow-sm border-none">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Período de Análise</h2>
            <p className="text-sm text-muted-foreground">Gerencie o fechamento mensal e filtros.</p>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <div className="flex gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[140px] h-11 bg-slate-50 border-none rounded-xl font-medium">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px] h-11 bg-slate-50 border-none rounded-xl font-medium">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCloseMonth} disabled={closing} className="h-11 px-6 rounded-xl font-semibold shadow-md shadow-primary/20">
            {closing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Fechar Mês
          </Button>
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
            <SummaryCard title="Saldo Total" value={summary?.balance ?? 0} icon={Wallet} color="text-primary" />
          </>
        )}
      </div>
    </div>
  );
}