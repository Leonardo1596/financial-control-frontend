"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { AccountPayable } from '@/lib/types';
import AccountsPayableSummary from './summary';
import AccountsPayableList from './list';
import AccountsPayableForm from './form';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Filter } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export default function AccountsPayableClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountPayable | null>(null);
  
  const [statusFilter, setStatusFilter] = useState('todas');
  const [sortOrder, setSortOrder] = useState('asc');
  const [year, setYear] = useState('todas');
  const [month, setMonth] = useState('todas');

  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('https://financial-control-9s01.onrender.com/list', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar contas a pagar');
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenModal = (account: AccountPayable | null = null) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleSuccess = () => {
    fetchAccounts();
    handleCloseModal();
  };

  const handlePay = async (id: string) => {
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/pay/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao marcar conta como paga');
      toast({ title: 'Sucesso', description: 'Conta marcada como paga.' });
      fetchAccounts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`https://financial-control-9s01.onrender.com/delete/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao deletar conta');
      toast({ title: 'Sucesso', description: 'Conta deletada.' });
      fetchAccounts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  const displayedAccounts = useMemo(() => {
    return accounts
      .filter(account => {
        const accountDate = new Date(account.dueDate);
        const adjustedDate = new Date(accountDate.getTime() + accountDate.getTimezoneOffset() * 60000);
        const accountMonth = (adjustedDate.getMonth() + 1).toString();
        const accountYear = adjustedDate.getFullYear().toString();
        
        const yearMatch = year === 'todas' || accountYear === year;
        const monthMatch = month === 'todas' || accountMonth === month;
        const statusMatch = statusFilter === 'todas' || account.status === statusFilter;
        
        return yearMatch && monthMatch && statusMatch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [accounts, statusFilter, sortOrder, month, year]);

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase()),
  }));

  return (
    <div className="space-y-10">
      {loading ? (
        <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className='h-32 rounded-2xl' />
            <Skeleton className='h-32 rounded-2xl' />
            <Skeleton className='h-32 rounded-2xl' />
        </div>
      ) : (
        <AccountsPayableSummary accounts={displayedAccounts} />
      )}
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-muted-foreground mr-2 hidden sm:flex">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filtros</span>
          </div>
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-full sm:w-[150px] bg-slate-50 border-none rounded-xl h-11">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os meses</SelectItem>
              {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-full sm:w-[130px] bg-slate-50 border-none rounded-xl h-11">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os anos</SelectItem>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] bg-slate-50 border-none rounded-xl h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="paga">Paga</SelectItem>
              <SelectItem value="atrasada">Atrasada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full lg:w-auto h-11 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20">
          <PlusCircle className="mr-2 h-5 w-5" />
          Nova Conta
        </Button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <AccountsPayableList
          accounts={displayedAccounts}
          onPay={handlePay}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
      
      <AccountsPayableForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        accountToEdit={editingAccount}
      />
    </div>
  );
}
