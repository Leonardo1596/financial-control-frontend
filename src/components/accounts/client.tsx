"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { UserAccount } from '@/lib/types';
import AccountsList from './list';
import AccountsForm from './form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Wallet } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { Preferences } from '@capacitor/preferences';

export default function AccountsClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<UserAccount | null>(null);

  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());

  const fetchAccounts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/list-accounts?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar contas');
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenModal = (account: UserAccount | null = null) => {
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

  const handleDelete = async (id: string) => {
    try {
      const account = accounts.find(acc => acc._id === id);
      if (!account) throw new Error('Conta não encontrada');

      const response = await fetch(`${API_BASE_URL}/delete-account/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Falha ao deletar conta');

      const normalizeSource = (name: string) => {
        return name.toLowerCase().trim().replace(/\s+/g, "_");
      };

      const key = `account_${normalizeSource(account.name)}`;
      await Preferences.remove({ key });
      await Preferences.remove({ key: `_cap_${key}` });

      toast({ title: 'Sucesso', description: 'Instituição removida.' });
      fetchAccounts();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: (error as Error).message });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-full space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Suas Instituições</h2>
            <p className="text-sm text-slate-500">Gerencie onde seu dinheiro está guardado.</p>
          </div>
        </div>

        <Button 
          onClick={() => handleOpenModal()} 
          className="h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Adicionar Banco
        </Button>
      </div>

      <div className="w-full">
        <AccountsList
          accounts={accounts}
          onDelete={handleDelete}
          onEdit={handleOpenModal}
          loading={loading}
        />
      </div>

      <AccountsForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        accountToEdit={editingAccount}
      />
    </div>
  );
}