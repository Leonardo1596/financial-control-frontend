"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Transaction, UserAccount } from '@/lib/types';
import TransactionList from './transaction-list';
import TransactionForm from './transaction-form';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { Input } from '@/components/ui/input';

export default function TransactionClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

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
        fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/list-accounts`, {
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
      setIsSearching(false);
    }
  }, [token, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        setIsSearching(true);
        fetchData(searchTerm);
      } else {
        fetchData();
      }
    }, 500);

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
      .then(async (res) => {
        if (!res.ok) throw new Error("Resposta inválida do servidor");
        return res.json();
      })
      .then(data => {
        setPendingData(data);
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar transação detectada"
        });
      });
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

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por descrição..." 
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto h-11 px-6 rounded-xl font-bold shadow-lg shadow-primary/20"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Nova Transação
        </Button>
      </div>

      <TransactionList
        transactions={transactions}
        accounts={accounts}
        loading={loading}
        onDelete={handleDelete}
      />

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