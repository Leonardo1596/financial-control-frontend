"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { UserAccount } from '@/lib/types';
import AccountsList from './list';
import AccountsForm from './form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Wallet, Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export default function AccountsClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('https://financial-control-9s01.onrender.com/list-accounts', {
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
  }, [token, toast]);

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

  return (
    <div className="space-y-10">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Resumo Financeiro</h2>
            <p className="text-sm text-muted-foreground">Total acumulado em todas as contas.</p>
          </div>
        </div>
        <Button onClick={handleOpenModal} className="w-full sm:w-auto h-11 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
          <PlusCircle className="mr-2 h-5 w-5" />
          Nova Instituição
        </Button>
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
