"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Transaction, UserAccount } from '@/lib/types';
import TransactionList from './transaction-list';
import TransactionForm from './transaction-form';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export default function TransactionClient() {
  const { token } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!token) return;
    console.log("token: " + token);
    setLoading(true);
    try {
      const [transResponse, accountsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/list-transaction`, {
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
    }
  }, [token, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Efeito para detectar o ID pendente vindo do Android
  useEffect(() => {
    function checkPending() {
      const id = localStorage.getItem("pendingTransactionId");

      if (!id) return;

      console.log("TransactionClient: Processando ID pendente:", id);

      // Limpa imediatamente para evitar loops ou re-aberturas acidentais
      localStorage.removeItem("pendingTransactionId");
      console.log("Id: " + id);
      setPendingId(id);
      setIsModalOpen(true);
    }

    // Pequeno delay para garantir que o componente e o roteador estejam estáveis
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
        console.log(res);
        if (!res.ok) {
          const text = await res.text();
          console.error("Erro bruto da API:", text);
          throw new Error("Resposta inválida do servidor");
        }

        return res.json();
      })
      .then(data => {
        setPendingData(data);
      })
      .catch((err) => {
        console.error("Erro ao carregar transação detectada:", err);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar transação detectada"
        });
      });
  }, [pendingId, token, toast]);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setIsModalOpen(true)}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Nova Transação
        </Button>
      </div>

      <TransactionList
        transactions={transactions}
        accounts={accounts}
        loading={loading}
        onDelete={(id) => {
          // Implementação simples de delete aqui se necessário, 
          // ou passar para o componente pai
          fetchData();
        }}
      />

      <TransactionForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingId(null);
          setPendingData(null);
        }}
        onTransactionAdded={() => {
          fetchData();
          setIsModalOpen(false);
          setPendingId(null);
          setPendingData(null);
        }}
        pendingData={pendingData}
      />
    </div>
  );
}
