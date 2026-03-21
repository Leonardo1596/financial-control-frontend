
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { UserAccount } from '@/lib/types';
import AccountsList from './list';
import AccountsForm from './form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Wallet, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AccountsClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/list-accounts?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar contas');
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [token, toast, month, year]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleSuccess = () => {
    fetchAccounts();
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/delete-account/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar conta');
      toast({ title: 'Sucesso', description: 'Conta deletada com sucesso.' });
      fetchAccounts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase()),
  }));

  return (
    <div className="space-y-10">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Resumo por Período</h2>
            <p className="text-sm text-muted-foreground">Saldos correspondentes ao mês selecionado.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-slate-400 mr-2 hidden sm:flex">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="flex-1 sm:w-[150px] bg-slate-50 border-none rounded-xl h-11 font-medium hover:bg-slate-100 transition-colors">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="flex-1 sm:w-[120px] bg-slate-50 border-none rounded-xl h-11 font-medium hover:bg-slate-100 transition-colors">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleOpenModal} className="w-full sm:w-auto h-11 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
            <PlusCircle className="mr-2 h-5 w-5" />
            Nova Instituição
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <AccountsList
          accounts={accounts}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
      
      <AccountsForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
