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
import { PlusCircle } from 'lucide-react';
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
      .filter(account => statusFilter === 'todas' || account.status === statusFilter)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      });
  }, [accounts, statusFilter, sortOrder]);

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className='h-28' />
            <Skeleton className='h-28' />
            <Skeleton className='h-28' />
        </div>
      ) : (
        <AccountsPayableSummary accounts={displayedAccounts} />
      )}
      
      <div className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="paga">Paga</SelectItem>
              <SelectItem value="atrasada">Atrasada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Vencimento (crescente)</SelectItem>
              <SelectItem value="desc">Vencimento (decrescente)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => handleOpenModal()} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Conta
        </Button>
      </div>

      <AccountsPayableList
        accounts={displayedAccounts}
        onPay={handlePay}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        loading={loading}
      />
      
      <AccountsPayableForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        accountToEdit={editingAccount}
      />
    </div>
  );
}
